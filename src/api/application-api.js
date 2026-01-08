import wreck from '@hapi/wreck'
import { config } from '../config.js'

export async function getLatestContactDetails(applicationReference, logger) {
  logger.info('Retrieving latest contact details')
  const endpoint = `${config.get('applicationApiUri')}/applications/latest-contact-details/${applicationReference}`

  try {
    const { payload } = await wreck.get(endpoint, { json: true })
    logger.info('Retrieved latest contact details')

    return payload
  } catch (error) {
    logger.error(
      {
        error,
        event: {
          type: 'exception',
          category: 'failed-request'
        }
      },
      `error retrieving contact details from ${endpoint}`
    )
    throw error
  }
}
