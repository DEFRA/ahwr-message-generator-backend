import { TYPE_OF_LIVESTOCK } from 'ffc-ahwr-common-library'
import {
  REVIEW_CATTLE,
  FOLLOW_UP_CATTLE_POSITIVE,
  FOLLOW_UP_CATTLE_NEGATIVE_RECOMMENDED_PI_HUNT,
  FOLLOW_UP_CATTLE_NEGATIVE,
  FOLLOW_UP_PIGS,
  FOLLOW_UP_SHEEP,
  REVIEW_PIGS,
  REVIEW_SHEEP
} from './bullet-points.js'
import { getHerdNameLabel, LIVESTOCK_TO_READABLE_SPECIES } from '../../constants.js'
import { sendSFDCommsRequest } from '../../messaging/send-sfd-comms-request.js'
import { config } from '../../config.js'

const { BEEF, DAIRY, PIGS, SHEEP } = TYPE_OF_LIVESTOCK

const REVIEW_BULLET_POINTS_BY_TYPE_OF_LIVESTOCK = {
  [BEEF]: REVIEW_CATTLE,
  [DAIRY]: REVIEW_CATTLE,
  [PIGS]: REVIEW_PIGS,
  [SHEEP]: REVIEW_SHEEP
}

const getFollowUpBulletPoints = (
  typeOfLivestock,
  reviewTestResults,
  piHuntRecommended,
  piHuntAllAnimals
) => {
  if ([BEEF, DAIRY].includes(typeOfLivestock)) {
    if (reviewTestResults === 'positive') {
      return FOLLOW_UP_CATTLE_POSITIVE
    }
    if (piHuntRecommended === 'yes' && piHuntAllAnimals === 'yes') {
      return FOLLOW_UP_CATTLE_NEGATIVE_RECOMMENDED_PI_HUNT
    }
    return FOLLOW_UP_CATTLE_NEGATIVE
  }

  if (typeOfLivestock === PIGS) {
    return FOLLOW_UP_PIGS
  }
  if (typeOfLivestock === SHEEP) {
    return FOLLOW_UP_SHEEP
  }

  return []
}

export const formatBullets = (bullets = []) => bullets.map((bullet) => `* ${bullet}`).join('\n')

export const sendEvidenceEmail = async (params) => {
  const {
    emailAddress,
    agreementReference,
    claimReference,
    sbi,
    crn,
    logger,
    addressType,
    orgName,
    claimType,
    typeOfLivestock,
    reviewTestResults,
    piHuntRecommended,
    piHuntAllAnimals,
    herdName
  } = params
  logger.info(`Sending ${addressType} evidence email`)

  try {
    const {
      templates: { evidenceReviewTemplateId, evidenceFollowUpTemplateId },
      replyToId
    } = config.get('notify')

    let notifyTemplateId
    let bulletPoints

    if (claimType === 'REVIEW') {
      notifyTemplateId = evidenceReviewTemplateId
      bulletPoints = REVIEW_BULLET_POINTS_BY_TYPE_OF_LIVESTOCK[typeOfLivestock] || []
    } else {
      notifyTemplateId = evidenceFollowUpTemplateId
      bulletPoints = getFollowUpBulletPoints(
        typeOfLivestock,
        reviewTestResults,
        piHuntRecommended,
        piHuntAllAnimals
      )
    }

    const customParams = {
      sbi,
      orgName,
      claimReference,
      agreementReference,
      customSpeciesBullets: formatBullets(bulletPoints),
      herdNameLabel: getHerdNameLabel(typeOfLivestock),
      herdName,
      species: LIVESTOCK_TO_READABLE_SPECIES[typeOfLivestock]
    }

    await sendSFDCommsRequest({
      crn,
      sbi,
      agreementReference,
      claimReference,
      notifyTemplateId,
      emailReplyToId: replyToId,
      emailAddress,
      customParams,
      logger
    })

    logger.info({
      event: {
        type: `evidence-email-requested-${claimType.toLowerCase()}`,
        reference: claimReference,
        outcome: true,
        kind: addressType,
        category: `${typeOfLivestock} - templateId:${notifyTemplateId}`
      }
    })

    logger.info(`Sent ${addressType} evidence email`)
  } catch (error) {
    logger.error(
      {
        error,
        event: {
          type: 'exception',
          category: 'failed-processing'
        }
      },
      `Error sending ${addressType} email. Error: ${error.message}`
    )
    throw error
  }
}
