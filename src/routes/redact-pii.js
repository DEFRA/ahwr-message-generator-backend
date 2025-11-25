import { StatusCodes } from 'http-status-codes'
import { redactPII } from '../repositories/message-generation-repository.js'

export const redactPiiHandlers = [
  {
    method: 'POST',
    path: '/api/redact/pii',
    handler: async (request, h) => {
      const { payload, db, logger } = request

      logger.info('Request for redact PII received')

      await redactPII(
        db,
        payload.agreementsToRedact.map((x) => x.reference),
        logger
      )

      return h.response().code(StatusCodes.OK)
    }
  }
]
