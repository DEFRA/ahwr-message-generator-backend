import { isValidReminderType } from 'ffc-ahwr-common-library'
import { config } from '../config.js'
import {
  createMessageRequestEntry,
  reminderEmailAlreadySent
} from '../repositories/message-generation-repository.js'
import { sendSFDCommsRequest } from '../messaging/send-sfd-comms-request.js'

export const databaseMessageType = 'reminderEmail'

export const processReminderEmailMessage = async (message, logger, db) => {
  const reminderEmailsEnabled = config.get('reminderEmailEnabled')
  const { reminderType, agreementReference, emailAddresses } = message

  logger.setBindings({
    reminderType,
    agreementReference,
    numEmailAddresses: emailAddresses.length
  })

  if (!reminderEmailsEnabled) {
    logger.info('Skipping sending reminder email, feature flag is not enabled')
    return
  }

  if (!isValidReminderType(reminderType)) {
    logger.info('Skipping sending reminder email, unrecognised reminder parent/sub type provided')
    return
  }

  if (await reminderEmailAlreadySent(db, agreementReference, databaseMessageType, reminderType)) {
    logger.info('Skipping sending reminder email, already been processed')
    return
  }

  logger.info('Processing reminder email message')
  const messagesForSFD = createSfdMessages(message)
  for (const sfdMessage of messagesForSFD) {
    await sendMessageToSfdProxy(sfdMessage, logger)
    await storeMessageInDatabase(db, sfdMessage)
  }
}

const createSfdMessages = ({ emailAddresses, reminderType, agreementReference, crn, sbi }) => {
  const emailReplyToId = config.get('notify.replyToIdNoReply')
  // Add template by reminderType when required
  const notifyTemplateId = config.get('notify.templates.reminderNotClaimedTemplateId')
  const customParams = { agreementReference }

  return emailAddresses.map((emailAddress) => {
    return {
      emailAddress,
      reminderType,
      agreementReference,
      crn,
      sbi,
      notifyTemplateId,
      emailReplyToId,
      customParams
    }
  })
}

const sendMessageToSfdProxy = async (
  {
    agreementReference,
    crn,
    sbi,
    emailAddress,
    notifyTemplateId,
    emailReplyToId,
    customParams,
    reminderType
  },
  logger
) => {
  try {
    await sendSFDCommsRequest({
      agreementReference,
      crn,
      sbi,
      emailAddress,
      notifyTemplateId,
      emailReplyToId,
      customParams,
      logger
    })

    logger.info({
      event: {
        type: `reminder-email-send-proxy`,
        reference: agreementReference,
        outcome: true,
        kind: notifyTemplateId,
        category: reminderType
      }
    })
    logger.info('Sent reminder email')
  } catch (error) {
    logger.error(
      {
        error,
        event: {
          type: 'exception',
          severity: `error`,
          category: 'failed-processing'
        }
      },
      'Failed to send reminder email'
    )
    throw error
  }
}

const storeMessageInDatabase = async (db, message) => {
  const { agreementReference } = message
  await createMessageRequestEntry(db, {
    agreementReference,
    messageType: databaseMessageType,
    data: { ...message }
  })
}
