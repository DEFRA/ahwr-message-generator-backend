import {
  configureAndStart,
  stopSubscriber,
  handleInboundMessage
} from './subscriber-message-generator-queue.js'
import { SqsSubscriber } from 'ffc-ahwr-common-library'
import { getLogger } from '../common/helpers/logging/logger.js'
import { config } from '../config.js'
import { routeStatusUpdateMessage } from './router-status-change.js'
import { processReminderEmailMessage } from '../processing/reminder-email-processor.js'
import { processNewAgreementCreated } from '../processing/new-agreement-processor.js'

jest.mock('ffc-ahwr-common-library')
jest.mock('../common/helpers/logging/logger.js')
jest.mock('../processing/new-agreement-processor.js')
jest.mock('./router-status-change.js')
jest.mock('../processing/reminder-email-processor.js')

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

    it('should throw error when unsupported eventType', async () => {
      const mockAttributes = { eventType: 'unsupported.type' }

      await expect(
        handleInboundMessage(mockMessage, mockAttributes, types, mockLogger, mockDb)
      ).rejects.toThrow('Unsupported event received')

      expect(mockLogger.info).toHaveBeenCalledWith(expect.any(Object), 'Received incoming message')
      expect(routeStatusUpdateMessage).toHaveBeenCalledTimes(0)
      expect(processNewAgreementCreated).toHaveBeenCalledTimes(0)
      expect(processReminderEmailMessage).toHaveBeenCalledTimes(0)
    })

    it(`should call routeStatusUpdateMessage eventType is: ${types.statusUpdate} `, async () => {
      const mockAttributes = { eventType: types.statusUpdate }

      await handleInboundMessage(mockMessage, mockAttributes, types, mockLogger, mockDb)

      expect(routeStatusUpdateMessage).toHaveBeenCalledTimes(1)
      expect(processNewAgreementCreated).toHaveBeenCalledTimes(0)
      expect(processReminderEmailMessage).toHaveBeenCalledTimes(0)
    })

    it(`should call processNewAgreementCreated eventType is: ${types.documentCreated} `, async () => {
      const mockAttributes = { eventType: types.documentCreated }

      await handleInboundMessage(mockMessage, mockAttributes, types, mockLogger, mockDb)

      expect(processNewAgreementCreated).toHaveBeenCalledTimes(1)
      expect(routeStatusUpdateMessage).toHaveBeenCalledTimes(0)
      expect(processReminderEmailMessage).toHaveBeenCalledTimes(0)
    })

    it(`should call processReminderEmailMessage eventType is: ${types.reminderRequest} `, async () => {
      const mockAttributes = { eventType: types.reminderRequest }

      await handleInboundMessage(mockMessage, mockAttributes, types, mockLogger, mockDb)

      expect(processReminderEmailMessage).toHaveBeenCalledTimes(1)
      expect(routeStatusUpdateMessage).toHaveBeenCalledTimes(0)
      expect(processNewAgreementCreated).toHaveBeenCalledTimes(0)
    })
  })
})
