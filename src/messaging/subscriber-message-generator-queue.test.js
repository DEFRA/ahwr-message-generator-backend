import {
  configureAndStart,
  stopSubscriber
} from './subscriber-message-generator-queue.js'
import { SqsSubscriber } from 'ffc-ahwr-common-library'
import { getLogger } from '../common/helpers/logging/logger.js'
import { config } from '../config.js'

jest.mock('ffc-ahwr-common-library')
jest.mock('../common/helpers/logging/logger.js')
jest.mock('./processor-document-created.js')
jest.mock('./processor-status-change.js')
jest.mock('./processor-reminder-request.js')

describe('subscriber-message-generator-queue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    config.set('aws.region', 'eu-west-2')
    config.set('aws.endpointUrl', 'http://localhost:4576')
    config.set(
      'sqs.messageGeneratorQueueUrl',
      'http://localhost:4576/queue/ahwr_message_generator_queue'
    )
  })

  describe.skip('configureAndStart', () => {
    it('should configure and start the SQS subscriber', async () => {
      const mockLogger = jest.fn()
      getLogger.mockReturnValueOnce(mockLogger)
      const mockDb = {}

      await configureAndStart(mockDb)

      expect(SqsSubscriber).toHaveBeenCalledTimes(1)
      expect(SqsSubscriber).toHaveBeenCalledWith({
        awsEndpointUrl: 'http://localhost:4576',
        logger: mockLogger,
        region: 'eu-west-2',
        queueUrl: 'http://localhost:4576/queue/ahwr_message_generator_queue',
        onMessage: expect.any(Function)
      })
      expect(SqsSubscriber.mock.instances[0].start).toHaveBeenCalledTimes(1)
    })
  })

  describe('stopSubscriber', () => {
    it('should stop the SQS subscriber', async () => {
      const mockLogger = jest.fn()
      getLogger.mockReturnValueOnce(mockLogger)
      const mockDb = {}
      await configureAndStart(mockDb)

      await stopSubscriber()

      const subscriberInstance = SqsSubscriber.mock.instances[0]
      expect(subscriberInstance.stop).toHaveBeenCalledTimes(1)
    })

    it('should do nothing if the SQS subscriber is not present', async () => {
      const mockLogger = jest.fn()
      getLogger.mockReturnValueOnce(mockLogger)

      await stopSubscriber()

      const subscriberInstance = SqsSubscriber.mock.instances[0]
      expect(subscriberInstance).toBeUndefined()
    })
  })
})
