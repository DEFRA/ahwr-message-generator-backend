export const processMessage = async (message, logger, _db) => {
  logger.info(
    `REMINDER_REQUEST - Received message to process: ${JSON.stringify(message)}`
  )
}
