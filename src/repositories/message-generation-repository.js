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
    .updateMany(
      { agreementReference: { $in: agreementReferences } },
      {
        $set: {
          'data.email': REDACTED_EMAIL,
          'data.orgName': REDACTED_ORGANISATION_NAME,
          'data.orgEmail': REDACTED_ORG_EMAIL,
          'data.herdName': REDACTED_HERD_NAME,
          'data.emailAddress': REDACTED_EMAIL,
          updatedAt: new Date()
        }
      }
    )

  if (totalUpdates > 0) {
    logger.info(
      `Total redacted fields across comms log entries: ${totalUpdates} for agreementReferences: ${agreementReferences}`
    )
  } else {
    logger.info(
      `No comms log entries updated for agreementReference: ${agreementReferences}`
    )
  }
}
