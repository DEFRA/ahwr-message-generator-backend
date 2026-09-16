import { Server } from '@hapi/hapi'
import { supportRoutes } from './support-routes.js'
import {
  getMessageGenerationHandler,
  supportQueueMessagesHandler,
  supportIsDeadLetterQueueHandler,
  supportApplyQueueActionsHandler
} from './support-controller.js'
import { ObjectId } from 'mongodb'
import { StatusCodes } from 'http-status-codes'

jest.mock('./support-controller.js')

const messageGenerations = [
  {
    _id: new ObjectId('69736011fb17ee07df3147fc'),
    agreementReference: 'IAHW-ABC1-1061',
    claimReference: 'REPI-ABC1-XYZ1',
    messageType: 'claimCreated',
    data: {
      crn: '1060000000',
      sbi: '987654321',
      orgName: null,
      claimType: 'REVIEW',
      typeOfLivestock: 'pigs',
      email: null,
      orgEmail: null,
      herdName: 'piglets',
      claimAmount: '456'
    }
  }
]
describe('support-routes', () => {
  let server

  beforeAll(async () => {
    server = new Server()
    server.route(supportRoutes)
    await server.initialize()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/support/message-generation', () => {
    it('should validate request and call correct handler when query has agreementReference', async () => {
      getMessageGenerationHandler.mockImplementation(async (_, h) => {
        return h.response(messageGenerations).code(200)
      })

      const res = await server.inject({
        method: 'GET',
        url: '/api/support/message-generation?agreementReference=IAHW-ABC1-1061'
      })

      expect(res.statusCode).toBe(200)
      expect(res.result).toEqual(messageGenerations)
      expect(getMessageGenerationHandler).toHaveBeenCalledTimes(1)
    })

    it('should validate request and call correct handler when query has claimReference', async () => {
      getMessageGenerationHandler.mockImplementation(async (_, h) => {
        return h.response(messageGenerations).code(200)
      })

      const res = await server.inject({
        method: 'GET',
        url: '/api/support/message-generation?claimReference=REPI-ABC1-XYZ1'
      })

      expect(res.statusCode).toBe(200)
      expect(res.result).toEqual(messageGenerations)
      expect(getMessageGenerationHandler).toHaveBeenCalledTimes(1)
    })

    it('should return 400 when query is missing required params', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/support/message-generation'
      })

      expect(res.statusCode).toBe(400)
      expect(res.result).toEqual({
        error: 'Bad Request',
        message: 'Invalid request query input',
        statusCode: 400
      })
      expect(getMessageGenerationHandler).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/support/queue-messages', () => {
    it('should validate request and call correct handler', async () => {
      supportQueueMessagesHandler.mockImplementation(async (_, h) => {
        return h.response().code(StatusCodes.OK)
      })

      const res = await server.inject({
        method: 'GET',
        url: '/api/support/queue-messages?queueUrl=localhost:4566/queue-url&limit=10',
        headers: { 'x-api-key': 'not-set' }
      })

      expect(res.statusCode).toBe(StatusCodes.OK)
      expect(supportQueueMessagesHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('GET /api/support/queue-messages/is-dlq', () => {
    it('should validate request and call correct handler', async () => {
      supportIsDeadLetterQueueHandler.mockImplementation(async (_, h) => {
        return h.response({ isDlq: true }).code(StatusCodes.OK)
      })

      const res = await server.inject({
        method: 'GET',
        url: '/api/support/queue-messages/is-dlq?queueUrl=localhost:4566/queue-url-dlq'
      })

      expect(res.statusCode).toBe(StatusCodes.OK)
      expect(supportIsDeadLetterQueueHandler).toHaveBeenCalledTimes(1)
    })

    it('should return 400 when queueUrl is missing', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/support/queue-messages/is-dlq'
      })

      expect(res.statusCode).toBe(400)
      expect(supportIsDeadLetterQueueHandler).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/support/queue-messages/actions', () => {
    it('should validate request and call correct handler', async () => {
      supportApplyQueueActionsHandler.mockImplementation(async (_, h) => {
        return h.response([]).code(StatusCodes.OK)
      })

      const res = await server.inject({
        method: 'POST',
        url: '/api/support/queue-messages/actions',
        payload: {
          queueUrl: 'localhost:4566/queue-url-dlq',
          actions: [{ id: '1', action: 'delete' }]
        }
      })

      expect(res.statusCode).toBe(StatusCodes.OK)
      expect(supportApplyQueueActionsHandler).toHaveBeenCalledTimes(1)
    })

    it('should return 400 when an action is not valid', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/support/queue-messages/actions',
        payload: {
          queueUrl: 'localhost:4566/queue-url-dlq',
          actions: [{ id: '1', action: 'explode' }]
        }
      })

      expect(res.statusCode).toBe(400)
      expect(supportApplyQueueActionsHandler).not.toHaveBeenCalled()
    })
  })
})
