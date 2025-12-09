import { getLatestContactDetails } from '../api/application-api.js'
import { AddressType } from '../constants.js'
import { config } from '../config.js'
import {
  createMessageRequestEntry,
  getByClaimRefAndMessageType
} from '../repositories/message-generation-repository.js'
import { sendEvidenceEmail } from './evidence/evidence-email.js'

export const processInCheckStatusMessageForEvidenceEmail = async (
  message,
  logger,
  db
) => {
  if (!config.get('evidenceEmailEnabled')) {
    logger.info(
      'Skipping sending evidence email as feature flag is not enabled'
    )
    return
  }
  const {
    claimStatus,
    agreementReference,
    claimReference,
    sbi,
    crn,
    claimType,
    typeOfLivestock,
    reviewTestResults,
    piHuntRecommended,
    piHuntAllAnimals,
    herdName
  } = message.body
  const ccAddress = config.get('notify.evidenceCarbonCopyEmailAddress')
  const messageType = `statusChange-${claimStatus}`
  const messageGenerate = await getByClaimRefAndMessageType(
    db,
    claimReference,
    messageType
  )

  if (!messageGenerate) {
    const contactDetails = await getLatestContactDetails(
      agreementReference,
      logger
    )
    const { name: orgName, orgEmail, email } = contactDetails
    const requestParams = {
      agreementReference,
      claimReference,
      crn,
      sbi,
      orgName,
      claimType,
      typeOfLivestock,
      reviewTestResults,
      piHuntRecommended,
      piHuntAllAnimals,
      logger,
      herdName
    }

    if (ccAddress) {
      await sendEvidenceEmail({
        ...requestParams,
        emailAddress: ccAddress,
        addressType: AddressType.CC
      })
    }

    if (orgEmail) {
      await sendEvidenceEmail({
        ...requestParams,
        emailAddress: orgEmail,
        addressType: AddressType.ORG_EMAIL
      })
    }

    if (email && email !== orgEmail) {
      await sendEvidenceEmail({
        ...requestParams,
        emailAddress: email,
        addressType: AddressType.EMAIL
      })
    }

    await createMessageRequestEntry(db, {
      agreementReference,
      claimReference,
      messageType,
      data: {
        crn,
        sbi,
        orgName,
        claimType,
        typeOfLivestock,
        email,
        orgEmail,
        reviewTestResults,
        piHuntRecommended,
        piHuntAllAnimals,
        herdName
      }
    })
  } else {
    logger.info(
      `Message has already been processed with status: ${claimStatus}`
    )
  }
}
