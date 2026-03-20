import { getMessageGenerationHandler, supportQueueMessagesHandler } from './support-controller.js'
import {
  getByClaimRef,
  getByAgreementRef
} from '../../repositories/message-generation-repository.js'
import { ObjectId } from 'mongodb'
import Boom from '@hapi/boom'
import { sqsClient } from 'ffc-ahwr-common-library'
import { QueueDoesNotExist } from '@aws-sdk/client-sqs'

jest.mock('../../repositories/message-generation-repository.js')
jest.mock('ffc-ahwr-common-library')
jest.mock('../../config.js', () => {
  const actual = jest.requireActual('../../config.js')

  return {
    config: {
      get: (key) => {
        if (key === 'aws.region') {
          return 'eu-west-2'
        }
        if (key === 'aws.endpointUrl') {
          return 'http://localhost:4566'
        }
        return actual.config.get(key)
      }
    }
  }
})

describe('getMessageGenerationHandler', () => {
  const mockH = {
    response: jest.fn().mockReturnThis(),
    code: jest.fn().mockReturnThis()
  }
  const mockDb = jest.fn()
  const mockLogger = {
    error: jest.fn(),
    info: jest.fn()
  }
  const request = {
    db: mockDb,
    logger: mockLogger,
    query: {}
  }
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should retrieve message generation for claimReference', async () => {
    getByClaimRef.mockResolvedValueOnce(messageGenerations)

    const result = await getMessageGenerationHandler(
      { ...request, query: { claimReference: 'REBC-J9AR-KILQ' } },
      mockH
    )

    expect(getByClaimRef).toHaveBeenCalledWith(mockDb, 'REBC-J9AR-KILQ')
    expect(mockH.response).toHaveBeenCalledWith({ data: messageGenerations })
    expect(mockH.code).toHaveBeenCalledWith(200)
    expect(result).toBe(mockH)
  })

  test('should retrieve message generation for agreementReference', async () => {
    getByAgreementRef.mockResolvedValueOnce(messageGenerations)

    const result = await getMessageGenerationHandler(
      { ...request, query: { agreementReference: 'IAHW-ABC1-1061' } },
      mockH
    )

    expect(getByAgreementRef).toHaveBeenCalledWith(mockDb, 'IAHW-ABC1-1061')
    expect(mockH.response).toHaveBeenCalledWith({ data: messageGenerations })
    expect(mockH.code).toHaveBeenCalledWith(200)
    expect(result).toBe(mockH)
  })

  test('should return 500 error when retrieving by claim reference', async () => {
    getByClaimRef.mockRejectedValueOnce(
      new Error('Failed to retrieve message generation by claim reference')
    )

    expect(
      getMessageGenerationHandler(
        { ...request, query: { claimReference: 'REBC-J9AR-KILQ' } },
        mockH
      )
    ).rejects.toThrow('Failed to retrieve message generation by claim reference')
  })

  test('should return 500 error when retrieving by agreement reference', async () => {
    getByAgreementRef.mockRejectedValueOnce(
      new Error('Failed to retrieve message generation by agreement reference')
    )

    expect(
      getMessageGenerationHandler(
        { ...request, query: { agreementReference: 'IAHW-ABC1-1061' } },
        mockH
      )
    ).rejects.toThrow('Failed to retrieve message generation by agreement reference')
  })

  test('should rethrow boom error when getByClaimRef throws', async () => {
    getByClaimRef.mockRejectedValueOnce(
      Boom.badRequest('Failed to retrieve message generation by claim reference')
    )

    expect(
      getMessageGenerationHandler(
        { ...request, query: { claimReference: 'REBC-J9AR-KILQ' } },
        mockH
      )
    ).rejects.toThrow('Failed to retrieve message generation by claim reference')
  })

  test('should rethrow boom error when getByAgreementRef throws', async () => {
    getByAgreementRef.mockRejectedValueOnce(
      Boom.badRequest('Failed to retrieve message generation by agreement reference')
    )

    expect(
      getMessageGenerationHandler(
        { ...request, query: { agreementReference: 'IAHW-ABC1-1061' } },
        mockH
      )
    ).rejects.toThrow('Failed to retrieve message generation by agreement reference')
  })

  test('should return empty array when message generation does not exist for claim reference', async () => {
    getByClaimRef.mockResolvedValueOnce([])

    const result = await getMessageGenerationHandler(
      { ...request, query: { claimReference: 'REBC-J9AR-KILQ' } },
      mockH
    )

    expect(getByClaimRef).toHaveBeenCalledWith(mockDb, 'REBC-J9AR-KILQ')
    expect(mockH.response).toHaveBeenCalledWith({ data: [] })
    expect(mockH.code).toHaveBeenCalledWith(200)
    expect(result).toBe(mockH)
  })

  test('should return empty array when message generation does not exist for agreement reference', async () => {
    getByAgreementRef.mockResolvedValueOnce([])

    const result = await getMessageGenerationHandler(
      { ...request, query: { agreementReference: 'IAHW-ABC1-1061' } },
      mockH
    )

    expect(getByAgreementRef).toHaveBeenCalledWith(mockDb, 'IAHW-ABC1-1061')
    expect(mockH.response).toHaveBeenCalledWith({ data: [] })
    expect(mockH.code).toHaveBeenCalledWith(200)
    expect(result).toBe(mockH)
  })
})

describe('supportQueueMessagesHandler', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn()
  }
  const mockRequest = {
    logger: mockLogger,
    query: { queueUrl: 'http://localhost:45666/queueName', limit: 10 }
  }
  const mockH = {
    response: jest.fn().mockReturnThis(),
    code: jest.fn().mockReturnThis()
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should retrieve messages and render them', async () => {
    sqsClient.peekMessages.mockResolvedValue([
      {
        id: '1',
        body: { sbi: '123456789', claimRef: 'FUBC-JTTU-SDQ7' },
        attributes: { attr: 'value' },
        messageAttributes: {
          eventType: { DataType: 'String', StringValue: 'uk.gov.ffc.ahwr.set.paid.status' }
        }
      }
    ])

    await supportQueueMessagesHandler(mockRequest, mockH)

    expect(sqsClient.setupClient).toHaveBeenCalledWith(
      'eu-west-2',
      'http://localhost:4566',
      mockLogger
    )
    expect(sqsClient.peekMessages).toHaveBeenCalledWith('http://localhost:45666/queueName', 10)
    expect(mockH.response).toHaveBeenCalledWith([
      {
        id: '1',
        body: { sbi: '123456789', claimRef: 'FUBC-JTTU-SDQ7' },
        attributes: { attr: 'value' },
        messageAttributes: {
          eventType: { DataType: 'String', StringValue: 'uk.gov.ffc.ahwr.set.paid.status' }
        }
      }
    ])
  })

  it('should return empty array when no messages', async () => {
    sqsClient.peekMessages.mockResolvedValue([])

    await supportQueueMessagesHandler(mockRequest, mockH)

    expect(mockH.response).toHaveBeenCalledWith([])
  })

  it('rethrows Boom errors', async () => {
    const boomError = Boom.badRequest('Invalid queue')
    sqsClient.peekMessages.mockRejectedValue(boomError)

    await expect(supportQueueMessagesHandler(mockRequest, mockH)).rejects.toThrow(boomError)

    expect(mockLogger.error).toHaveBeenCalledWith(
      { error: boomError },
      'Failed to get queue messages'
    )
  })

  it('wraps unknown errors in Boom.internal', async () => {
    const error = new Error('Unexpected')
    sqsClient.peekMessages.mockRejectedValue(error)

    await expect(supportQueueMessagesHandler(mockRequest, mockH)).rejects.toThrow(
      Boom.internal(error)
    )

    expect(mockLogger.error).toHaveBeenCalledWith({ error }, 'Failed to get queue messages')
  })

  it('returns 404 when queue does not exist', async () => {
    const error = new QueueDoesNotExist({
      message: 'The specified queue does not exist.',
      $metadata: {}
    })
    sqsClient.peekMessages.mockRejectedValue(error)

    await expect(supportQueueMessagesHandler(mockRequest, mockH)).rejects.toThrow(
      Boom.notFound('Queue not found: http://localhost:45666/queueName')
    )
  })
})
