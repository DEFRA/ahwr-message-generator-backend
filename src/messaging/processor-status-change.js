export const processMessage = async (message, logger, _db) => {
  logger.info(
    `STATUS_CHANGE - Received message to process: ${JSON.stringify(message)}`
  )
}
