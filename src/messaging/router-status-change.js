import { validateStatusMessageRequest } from './schemas/inbound-status-message.js'
import { processNewClaimCreated } from '../processing/new-claim-created-processor.js'
import { processInCheckStatusMessageForEvidenceEmail } from '../processing/evidence-email-processor.js'
import { STATUS } from 'ffc-ahwr-common-library'

export const routeStatusUpdateMessage = async (message, logger, db) => {
  if (validateStatusMessageRequest(logger, message)) {
    if (message.claimStatus === STATUS.ON_HOLD || message.claimStatus === STATUS.IN_CHECK) {
      await processNewClaimCreated(message, logger, db)
    }

    if (message.claimStatus === STATUS.IN_CHECK) {
      await processInCheckStatusMessageForEvidenceEmail(message, logger, db)
    }
  } else {
    throw new Error('Invalid status message request')
  }
}
