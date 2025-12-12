import { config } from '../config.js'
import { SqsSubscriber } from 'ffc-ahwr-common-library'
import { getLogger } from '../common/helpers/logging/logger.js'
import { routeStatusUpdateMessage } from './router-status-change.js'
import { processReminderEmailMessage } from '../processing/reminder-email-processor.js'
import { processNewAgreementCreated } from '../processing/new-agreement-processor.js'

let messageRequestSubscriber

export async function configureAndStart(db) {
  const { region, endpointUrl } = config.get('aws')
  const { sqs, types } = config.get('inboundMessage')
  const logger = getLogger()

  messageRequestSubscriber = new SqsSubscriber({
    queueUrl: sqs.queueUrl,
    logger,
    region,
    awsEndpointUrl: endpointUrl,
    async onMessage(message, attributes) {
      await handleInboundMessage(message, attributes, types, logger.child({}), db)
    }
  })
  await messageRequestSubscriber.start()
}

export async function stopSubscriber() {
  if (messageRequestSubscriber) {
    await messageRequestSubscriber.stop()
  }
}

export async function handleInboundMessage(message, attributes, types, logger, db) {
  logger.info(attributes, 'Received incoming message')

  switch (attributes.eventType) {
    case types.documentCreated:
      return processNewAgreementCreated(message, logger, db)
    case types.statusUpdate:
      return routeStatusUpdateMessage(message, logger, db)
    case types.reminderRequest:
      return processReminderEmailMessage(message, logger, db)
    default:
      throw new Error(`Unsupported event received ${attributes.eventType}`)
  }
}
