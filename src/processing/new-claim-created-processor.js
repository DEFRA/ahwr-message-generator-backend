import { getLatestContactDetails } from '../api/application-api.js'
import { AddressType, getHerdNameLabel, LIVESTOCK_TO_READABLE_SPECIES } from '../constants.js'
import { config } from '../config.js'
import { sendSFDCommsRequest } from '../messaging/send-sfd-comms-request.js'
import {
  createMessageRequestEntry,
  getByClaimRefAndMessageType
} from '../repositories/message-generation-repository.js'

const MESSAGE_TYPE = 'claimCreated'

export const processNewClaimCreated = async (message, logger, db) => {
  const { newReviewClaimTemplateId, newFollowUpClaimTemplateId } = config.get('notify.templates')
  const noReplyEmailReplyToId = config.get('notify.replyToIdNoReply')
  const carbonCopyEmailAddress = config.get('notify.carbonCopyEmailAddress')

  const {
    agreementReference,
    claimReference,
    sbi,
    crn,
    claimType,
    typeOfLivestock,
    reviewTestResults,
    herdName,
    claimAmount
  } = message

  const messageAlreadyGenerated = await getByClaimRefAndMessageType(
    db,
    claimReference,
    MESSAGE_TYPE
  )

  if (messageAlreadyGenerated) {
    logger.info('Message has already been processed for claim being created')
  } else {
    const contactDetails = await getLatestContactDetails(agreementReference, logger)
    const { name: orgName, orgEmail, email } = contactDetails
    const requestParams = {
      agreementReference,
      claimReference,
      crn,
      sbi,
      claimType,
      typeOfLivestock,
      reviewTestResults,
      logger,
      herdName,
      claimAmount,
      emailReplyToId: noReplyEmailReplyToId,
      notifyTemplateId:
        claimType === 'FOLLOW_UP' ? newFollowUpClaimTemplateId : newReviewClaimTemplateId
    }

    if (carbonCopyEmailAddress) {
      await sendClaimConfirmationEmail({
        ...requestParams,
        emailAddress: carbonCopyEmailAddress,
        addressType: AddressType.CC
      })
    }

    if (orgEmail) {
      await sendClaimConfirmationEmail({
        ...requestParams,
        emailAddress: orgEmail,
        addressType: AddressType.ORG_EMAIL
      })
    }

    if (email && email !== orgEmail) {
      await sendClaimConfirmationEmail({
        ...requestParams,
        emailAddress: email,
        addressType: AddressType.EMAIL
      })
    }

    await createMessageRequestEntry(db, {
      agreementReference,
      claimReference,
      messageType: MESSAGE_TYPE,
      data: {
        crn,
        sbi,
        orgName,
        claimType,
        typeOfLivestock,
        email,
        orgEmail,
        herdName,
        claimAmount
      }
    })
  }
}

const sendClaimConfirmationEmail = async (params) => {
  const {
    crn,
    sbi,
    emailAddress,
    addressType,
    agreementReference,
    claimReference,
    typeOfLivestock,
    claimAmount,
    herdName,
    notifyTemplateId,
    emailReplyToId,
    logger
  } = params

  logger.info(`Sending ${addressType} new claim email`)

  try {
    const customParams = {
      reference: claimReference,
      applicationReference: agreementReference,
      amount: claimAmount,
      species: LIVESTOCK_TO_READABLE_SPECIES[typeOfLivestock],
      crn,
      sbi,
      herdNameLabel: getHerdNameLabel(typeOfLivestock),
      herdName
    }

    await sendSFDCommsRequest({
      crn,
      sbi,
      agreementReference,
      claimReference,
      notifyTemplateId,
      emailReplyToId,
      emailAddress,
      customParams,
      logger
    })

    logger.info({
      event: {
        type: `claim-email-requested`,
        reference: claimReference,
        outcome: 'true',
        kind: addressType,
        category: `${typeOfLivestock} - templateId:${notifyTemplateId}`
      }
    })

    logger.info(`Sent ${addressType} new claim email`)
  } catch (error) {
    logger.error(
      {
        error,
        event: {
          type: 'exception',
          category: 'failed-processing'
        }
      },
      `Error sending ${addressType} new claim email.`
    )
    throw error
  }
}
