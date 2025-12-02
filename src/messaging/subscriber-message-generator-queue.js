import { config } from '../config.js'
import { SqsSubscriber } from 'ffc-ahwr-common-library'
import { getLogger } from '../common/helpers/logging/logger.js'
import { processMessage as processDocumentCreatedMessage } from './processor-document-created.js'
import { processMessage as processStatusChangeMessage } from './processor-status-change.js'
import { processMessage as processReminderRequestMessage } from './processor-reminder-request.js'

const { region, endpointUrl } = config.get('aws')
const { sqs, types } = config.get('inboundMessage')

let messageRequestSubscriber

export async function configureAndStart(db) {
  messageRequestSubscriber = new SqsSubscriber({
    queueUrl: sqs.queueUrl,
    logger: getLogger(),
    region,
    awsEndpointUrl: endpointUrl,
    async onMessage(message, attributes) {
      getLogger().info(attributes, 'Received incoming message')
      switch (attributes.messageType) {
        case types.documentCreated:
          await processDocumentCreatedMessage(message, getLogger(), db)
          break
        case types.statusChange:
          await processStatusChangeMessage(message, getLogger(), db)
          break
        case types.reminderRequest:
          await processReminderRequestMessage(message, getLogger(), db)
          break
        default:
          throw new Error('Unsupported message received')
      }
    }
  })
  await messageRequestSubscriber.start()
}

export async function stopSubscriber() {
  if (messageRequestSubscriber) {
    await messageRequestSubscriber.stop()
  }
}
