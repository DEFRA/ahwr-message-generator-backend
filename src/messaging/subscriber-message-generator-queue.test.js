import {
  configureAndStart,
  stopSubscriber,
  handleInboundMessage
} from './subscriber-message-generator-queue.js'
import { SqsSubscriber } from 'ffc-ahwr-common-library'
import { getLogger } from '../common/helpers/logging/logger.js'
import { config } from '../config.js'
import { processMessage as processStatusChangeMessage } from './processor-status-change.js'
import { processMessage as processDocumentCreatedMessage } from './processor-document-created.js'
import { processMessage as processReminderRequestMessage } from './processor-reminder-request.js'

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
      'inboundMessage.sqs.queueUrl',
      'http://localhost:4576/queue/ahwr_message_generator_queue'
    )
  })

  describe('configureAndStart', () => {
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

  describe('handleInboundMessage', () => {
    const { types } = config.get('inboundMessage')
    const mockLogger = { info: jest.fn() }
    const mockDb = {}
    const mockMessage = {}

    it('should throw error when unsupported messageType', async () => {
      const mockAttributes = { messageType: 'unsupported.type' }

      await expect(
        handleInboundMessage(
          mockMessage,
          mockAttributes,
          types,
          mockLogger,
          mockDb
        )
      ).rejects.toThrow('Unsupported message received')

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(Object),
        'Received incoming message'
      )
      expect(processStatusChangeMessage).toHaveBeenCalledTimes(0)
      expect(processDocumentCreatedMessage).toHaveBeenCalledTimes(0)
      expect(processReminderRequestMessage).toHaveBeenCalledTimes(0)
    })

    it(`should call processStatusChangeMessage messageType is: ${types.statusChange} `, async () => {
      const mockAttributes = { messageType: types.statusChange }

      await handleInboundMessage(
        mockMessage,
        mockAttributes,
        types,
        mockLogger,
        mockDb
      )

      expect(processStatusChangeMessage).toHaveBeenCalledTimes(1)
      expect(processDocumentCreatedMessage).toHaveBeenCalledTimes(0)
      expect(processReminderRequestMessage).toHaveBeenCalledTimes(0)
    })

    it(`should call processDocumentCreatedMessage messageType is: ${types.documentCreated} `, async () => {
      const mockAttributes = { messageType: types.documentCreated }

      await handleInboundMessage(
        mockMessage,
        mockAttributes,
        types,
        mockLogger,
        mockDb
      )

      expect(processDocumentCreatedMessage).toHaveBeenCalledTimes(1)
      expect(processStatusChangeMessage).toHaveBeenCalledTimes(0)
      expect(processReminderRequestMessage).toHaveBeenCalledTimes(0)
    })

    it(`should call processReminderRequestMessage messageType is: ${types.reminderRequest} `, async () => {
      const mockAttributes = { messageType: types.reminderRequest }

      await handleInboundMessage(
        mockMessage,
        mockAttributes,
        types,
        mockLogger,
        mockDb
      )

      expect(processReminderRequestMessage).toHaveBeenCalledTimes(1)
      expect(processStatusChangeMessage).toHaveBeenCalledTimes(0)
      expect(processDocumentCreatedMessage).toHaveBeenCalledTimes(0)
    })
  })
})
