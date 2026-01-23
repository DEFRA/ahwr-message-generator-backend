import { StatusCodes } from 'http-status-codes'
import Boom from '@hapi/boom'
import {
  getByAgreementRef,
  getByClaimRef
} from '../../repositories/message-generation-repository.js'

export const getMessageGenerationHandler = async (request, h) => {
  try {
    const {
      db,
      logger,
      query: { agreementReference, claimReference }
    } = request
    logger.info(
      `Get message generation request, agreementReference: ${agreementReference}, claimReference: ${claimReference}`
    )

    const messageGenerations = claimReference
      ? await getByClaimRef(db, claimReference)
      : await getByAgreementRef(db, agreementReference)

    return h.response({ data: messageGenerations }).code(StatusCodes.OK)
  } catch (error) {
    request.logger.error({ error }, 'Failed to retrieve message generations')

    if (Boom.isBoom(error)) {
      throw error
    }

    throw Boom.internal(error)
  }
}
