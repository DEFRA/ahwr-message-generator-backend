import { config } from '../config.js'
import { SqsSubscriber } from 'ffc-ahwr-common-library'
import { getLogger } from '../common/helpers/logging/logger.js'
import { routeStatusUpdateMessage } from './router-status-change.js'
import { processReminderEmailMessage } from '../processing/reminder-email-processor.js'
import { processNewAgreementCreated } from '../processing/new-agreement-processor.js'
import { metricsCounter } from '../common/helpers/metrics.js'

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
      await metricsCounter('event-received-document-created')
      return processNewAgreementCreated(message, logger, db)
    case types.statusUpdate:
      await metricsCounter('event-received-claim-status-update')
      return routeStatusUpdateMessage(message, logger, db)
    case types.reminderRequest:
      await metricsCounter('event-received-reminder-request')
      return processReminderEmailMessage(message, logger, db)
    default:
      await metricsCounter('event-received-unknown-event-type')
      throw new Error(`Unsupported event received ${attributes.eventType}`)
  }
}
