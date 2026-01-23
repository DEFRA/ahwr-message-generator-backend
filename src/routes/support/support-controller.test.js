import { getMessageGenerationHandler } from './support-controller.js'
import {
  getByClaimRef,
  getByAgreementRef
} from '../../repositories/message-generation-repository.js'
import { ObjectId } from 'mongodb'
import Boom from '@hapi/boom'

jest.mock('../../repositories/message-generation-repository.js')

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
