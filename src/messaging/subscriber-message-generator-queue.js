import { config } from '../config.js'
import { SqsSubscriber } from 'ffc-ahwr-common-library'
import { getLogger } from '../common/helpers/logging/logger.js'
import { processMessage as processStatusChangeMessage } from './processor-status-change.js'
import { processMessage as processDocumentCreatedMessage } from './processor-document-created.js'
import { processMessage as processReminderRequestMessage } from './processor-reminder-request.js'

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
      await handleInboundMessage(message, attributes, types, logger, db)
    }
  })
  await messageRequestSubscriber.start()
}

export async function stopSubscriber() {
  if (messageRequestSubscriber) {
    await messageRequestSubscriber.stop()
  }
}

export async function handleInboundMessage(
  message,
  attributes,
  types,
  logger,
  db
) {
  logger.info(attributes, 'Received incoming message')

  switch (attributes.messageType) {
    case types.documentCreated:
      return processDocumentCreatedMessage(message, logger, db)
    case types.statusChange:
      return processStatusChangeMessage(message, logger, db)
    case types.reminderRequest:
      return processReminderRequestMessage(message, logger, db)
    default:
      throw new Error('Unsupported message received')
  }
}
