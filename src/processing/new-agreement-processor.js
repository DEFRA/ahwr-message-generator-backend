import { getLatestContactDetails } from '../api/application-api.js'
import { AddressType } from '../constants.js'
import { config } from '../config.js'
import { sendSFDCommsRequest } from '../messaging/send-sfd-comms-request.js'
import {
  createMessageRequestEntry,
  getByAgreementRefAndMessageType
} from '../repositories/message-generation-repository.js'
import { fetchBlob } from '../storage/s3-interactions.js'

const MESSAGE_TYPE = 'agreementCreated'

export const processNewAgreementCreated = async (message, logger, db) => {
  const { crn, sbi, userType, documentLocation, applicationReference } = message

  const carbonCopyEmailAddress = config.get('notify.carbonCopyEmailAddress')

  //check if already sent
  const messageAlreadyGenerated = await getByAgreementRefAndMessageType(
    db,
    applicationReference,
    MESSAGE_TYPE
  )

  if (messageAlreadyGenerated) {
    logger.info('Message has already been processed for agreement being created')
  } else {
    const contactDetails = await getLatestContactDetails(applicationReference, logger)
    const { name: orgName, orgEmail, email } = contactDetails
    //go get blob from S3
    const blob = await fetchBlob(logger, documentLocation)

    const requestParams = {
      ...generateDefaultRequestParams(applicationReference, orgName, userType, blob),
      logger,
      sbi,
      crn
    }

    if (carbonCopyEmailAddress) {
      await sendEmailRequest({
        ...requestParams,
        emailAddress: carbonCopyEmailAddress,
        addressType: AddressType.CC
      })
    }

    if (orgEmail) {
      await sendEmailRequest({
        ...requestParams,
        emailAddress: orgEmail,
        addressType: AddressType.ORG_EMAIL
      })
    }

    if (email && email !== orgEmail) {
      await sendEmailRequest({
        ...requestParams,
        emailAddress: email,
        addressType: AddressType.EMAIL
      })
    }

    await createMessageRequestEntry(db, {
      agreementReference: applicationReference,
      messageType: MESSAGE_TYPE,
      data: {
        crn,
        sbi,
        orgName,
        userType,
        documentLocation,
        email,
        orgEmail
      }
    })
  }
}

const sendEmailRequest = async (requestParams) => {
  const {
    logger,
    emailAddress,
    emailReplyToId,
    personalisation,
    reference,
    crn,
    sbi,
    templateId,
    addressType
  } = requestParams

  let success = false
  try {
    await sendSFDCommsRequest({
      logger,
      notifyTemplateId: templateId,
      emailReplyToId,
      emailAddress,
      customParams: personalisation,
      agreementReference: reference,
      crn,
      sbi
    })

    logger.info(`Request ${addressType} new agreement email for ${reference}'`)

    logger.info({
      event: {
        type: `agreement-email-requested`,
        reference,
        outcome: 'true',
        kind: addressType,
        category: `templateId:${templateId}`
      }
    })
    success = true
  } catch (error) {
    logger.error(
      {
        error,
        event: {
          type: 'exception',
          category: 'failed-processing'
        }
      },
      `Error sending ${addressType} new agreement email.`
    )
    throw error
  }
  return success
}

const generateDefaultRequestParams = (reference, name, userType, blob) => {
  const { existingUserAgreementTemplateId, newUserAgreementTemplateId } =
    config.get('notify.templates')
  const noReplyEmailReplyToId = config.get('notify.replyToIdNoReply')
  const personalisation = {
    name,
    reference,
    link_to_file: prepareUpload(blob)
  }

  const templateIdToUse =
    userType === 'newUser' ? newUserAgreementTemplateId : existingUserAgreementTemplateId

  return {
    personalisation,
    reference,
    templateId: templateIdToUse,
    emailReplyToId: noReplyEmailReplyToId
  }
}

function prepareUpload(blob) {
  // Temporarily introducing this function to return the file ready to use with notify.
  // Previously the notify client itself provided this. Inside the notify client it does
  // a safety check to ensure file is less than 2Mb. We don't need that as we know our
  // file size is fixed much smaller than this

  return {
    file: blob.toString('base64'),
    is_csv: false,
    confirm_email_before_download: null,
    retention_period: null
  }
}
