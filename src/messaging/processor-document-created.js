export const processMessage = async (message, logger, _db) => {
  if (await messageAlreadyBeenProcessed(message.body.claimReference)) {
    logger.info('Message has already been processed for claim being created')
  }
}

const messageAlreadyBeenProcessed = async (_claimReference) => {
  return true //await getByClaimRefAndMessageType(claimReference, MESSAGE_TYPE)
}
