import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'

const COLLECTION = 'messagegeneration'

export const redactPII = async (db, agreementReferences, logger) => {
  const {
    REDACTED_EMAIL,
    REDACTED_ORGANISATION_NAME,
    REDACTED_ORG_EMAIL,
    REDACTED_HERD_NAME
  } = REDACT_PII_VALUES

  const { modifiedCount: totalUpdates } = await db
    .collection(COLLECTION)
    .updateMany({ agreementReference: { $in: agreementReferences } }, [
      {
        $set: {
          'data.email': {
            $cond: [
              { $ifNull: ['$data.email', false] },
              REDACTED_EMAIL,
              '$data.email'
            ]
          },
          'data.orgName': {
            $cond: [
              { $ifNull: ['$data.orgName', false] },
              REDACTED_ORGANISATION_NAME,
              '$data.orgName'
            ]
          },
          'data.orgEmail': {
            $cond: [
              { $ifNull: ['$data.orgEmail', false] },
              REDACTED_ORG_EMAIL,
              '$data.orgEmail'
            ]
          },
          'data.herdName': {
            $cond: [
              { $ifNull: ['$data.herdName', false] },
              REDACTED_HERD_NAME,
              '$data.herdName'
            ]
          },
          'data.emailAddress': {
            $cond: [
              { $ifNull: ['$data.emailAddress', false] },
              REDACTED_EMAIL,
              '$data.emailAddress'
            ]
          }
        }
      }
    ])

  if (totalUpdates > 0) {
    logger.info(
      `Total redacted fields across message generation entries: ${totalUpdates} for agreementReferences: ${agreementReferences}`
    )
  } else {
    logger.info(
      `No message generation entries updated for agreementReference: ${agreementReferences}`
    )
  }
}
