import { Server } from '@hapi/hapi'
import { supportRoutes } from './support-routes.js'
import { getMessageGenerationHandler } from './support-controller.js'
import { ObjectId } from 'mongodb'

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
