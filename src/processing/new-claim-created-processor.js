import { getScheme, POULTRY_SCHEME } from 'ffc-ahwr-common-library'
import { getLatestContactDetails } from '../api/application-api.js'
import {
  AddressType,
  getHerdNameLabel,
  LIVESTOCK_TO_READABLE_SPECIES,
  POULTRY_TO_READABLE_SPECIES
} from '../constants.js'
import { config } from '../config.js'
import { sendSFDCommsRequest } from '../messaging/send-sfd-comms-request.js'
import {
  createMessageRequestEntry,
  getByClaimRefAndMessageType
} from '../repositories/message-generation-repository.js'

const MESSAGE_TYPE = 'claimCreated'

export const processNewClaimCreated = async (message, logger, db) => {
  const { agreementReference, claimReference } = message

  const messageAlreadyGenerated = await getByClaimRefAndMessageType(
    db,
    claimReference,
    MESSAGE_TYPE
  )
  if (messageAlreadyGenerated) {
    logger.info('Message has already been processed for claim being created')
  } else {
    const contactDetails = await getLatestContactDetails(agreementReference, logger)
    if (getScheme(agreementReference) === POULTRY_SCHEME) {
      await processPoultryNewClaimMessage(message, contactDetails, db, logger)
    } else {
      await processLivestockNewClaimMessage(message, contactDetails, db, logger)
    }
  }
}

const processLivestockNewClaimMessage = async (message, contactDetails, db, logger) => {
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
    await sendLivestockClaimConfirmationEmail({
      ...requestParams,
      emailAddress: carbonCopyEmailAddress,
      addressType: AddressType.CC
    })
  }

  if (orgEmail) {
    await sendLivestockClaimConfirmationEmail({
      ...requestParams,
      emailAddress: orgEmail,
      addressType: AddressType.ORG_EMAIL
    })
  }

  if (email && email !== orgEmail) {
    await sendLivestockClaimConfirmationEmail({
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

const sendLivestockClaimConfirmationEmail = async (params) => {
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

const processPoultryNewClaimMessage = async (message, contactDetails, db, logger) => {
  const { poultryNewReviewClaimTemplateId } = config.get('notify.templates')
  const noReplyEmailReplyToId = config.get('notify.replyToIdNoReply')
  const carbonCopyEmailAddress = config.get('notify.carbonCopyEmailAddress')

  const {
    agreementReference,
    claimReference,
    sbi,
    crn,
    claimType,
    typesOfPoultry,
    herdName,
    claimAmount
  } = message
  const { name: orgName, orgEmail, email } = contactDetails

  const requestParams = {
    agreementReference,
    claimReference,
    crn,
    sbi,
    claimType,
    typesOfPoultry,
    logger,
    herdName,
    claimAmount,
    emailReplyToId: noReplyEmailReplyToId,
    notifyTemplateId: poultryNewReviewClaimTemplateId
  }

  if (carbonCopyEmailAddress) {
    await sendPoultryClaimConfirmationEmail({
      ...requestParams,
      emailAddress: carbonCopyEmailAddress,
      addressType: AddressType.CC
    })
  }

  if (orgEmail) {
    await sendPoultryClaimConfirmationEmail({
      ...requestParams,
      emailAddress: orgEmail,
      addressType: AddressType.ORG_EMAIL
    })
  }

  if (email && email !== orgEmail) {
    await sendPoultryClaimConfirmationEmail({
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
      typesOfPoultry,
      email,
      orgEmail,
      herdName,
      claimAmount
    }
  })
}

const sendPoultryClaimConfirmationEmail = async (params) => {
  const {
    crn,
    sbi,
    emailAddress,
    addressType,
    agreementReference,
    claimReference,
    typesOfPoultry,
    claimAmount,
    herdName,
    notifyTemplateId,
    emailReplyToId,
    logger
  } = params

  logger.info(`Sending ${addressType} poultry new claim email`)

  const species = typesOfPoultry.map((poultry) => POULTRY_TO_READABLE_SPECIES[poultry]).join(', ')

  try {
    const customParams = {
      reference: claimReference,
      applicationReference: agreementReference,
      amount: claimAmount,
      species,
      crn,
      sbi,
      herdNameLabel: 'Site',
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
        category: `poultry - templateId:${notifyTemplateId}`
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
