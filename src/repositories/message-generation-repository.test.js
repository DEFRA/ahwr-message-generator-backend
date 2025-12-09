import {
  createMessageRequestEntry,
  getByClaimRefAndMessageType,
  redactPII,
  reminderEmailAlreadySent
} from './message-generation-repository.js'

describe('message-generation repository', () => {
  const mockLogger = { info: jest.fn() }
  const mockDb = {
    collection: jest.fn().mockReturnThis(),
    updateMany: jest.fn(),
    insertOne: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn()
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  describe('createMessageRequestEntry', () => {
    test('it saves data to the DB', () => {
      const testData = {
        id: 'test-id-1',
        someOtherStuff: 'im-the-other-stuff '
      }
      createMessageRequestEntry(mockDb, testData)
      expect(mockDb.insertOne).toHaveBeenCalledTimes(1)
      expect(mockDb.insertOne).toHaveBeenCalledWith({
        id: 'test-id-1',
        someOtherStuff: 'im-the-other-stuff '
      })
    })
  })

  describe('getByClaimRefAndMessageType', () => {
    test('should return a result if the claim reference and message type exist', async () => {
      const mockData = {
        id: 123,
        claimReference: 'TEMP-O9UD-22F6',
        messageType: 'statusUpdate-5',
        createdAt: '2025-03-24T12:34:56Z',
        updatedAt: '2025-03-24T12:34:56Z'
      }
      mockDb.findOne.mockResolvedValueOnce(mockData)

      const result = await getByClaimRefAndMessageType(
        mockDb,
        'TEMP-O9UD-22F6',
        'statusUpdate-5'
      )

      expect(mockDb.findOne).toHaveBeenCalledWith({
        claimReference: 'TEMP-O9UD-22F6',
        messageType: 'statusUpdate-5'
      })
      expect(result).toEqual(mockData)
    })

    test('should return null if no result is found', async () => {
      mockDb.findOne.mockResolvedValueOnce(null)

      const result = await getByClaimRefAndMessageType(
        mockDb,
        'TEMP-O9UD-22F6',
        'statusUpdate-5'
      )

      expect(result).toBeNull()
    })

    test('should call findOne with uppercase claimReference', async () => {
      mockDb.findOne.mockResolvedValueOnce({
        id: 123,
        claimReference: 'temp-O9ud-22f6',
        messageType: 'statusUpdate-5'
      })

      await getByClaimRefAndMessageType(
        mockDb,
        'TEMP-O9UD-22F6',
        'statusUpdate-5'
      )

      expect(mockDb.findOne).toHaveBeenCalledWith({
        claimReference: 'TEMP-O9UD-22F6',
        messageType: 'statusUpdate-5'
      })
    })
  })

  describe('reminderEmailAlreadySent', () => {
    test('return false when no records returned', async () => {
      const agreementReference = 'IAHW-BEKR-AWIU'
      const messageType = 'reminderEmail'
      const reminderType = 'notClaimed_oneMonth'
      mockDb.countDocuments.mockResolvedValueOnce(0)

      const result = await reminderEmailAlreadySent(
        mockDb,
        agreementReference,
        messageType,
        reminderType
      )

      expect(mockDb.countDocuments).toHaveBeenCalledWith({
        agreementReference,
        messageType,
        'data.reminderType': reminderType
      })
      expect(result).toBe(false)
    })

    test('return true when records returned', async () => {
      const agreementReference = 'IAHW-BEKR-AWIU'
      const messageType = 'reminderEmail'
      const reminderType = 'notClaimed_oneMonth'
      mockDb.countDocuments.mockResolvedValueOnce(1)

      const result = await reminderEmailAlreadySent(
        mockDb,
        agreementReference,
        messageType,
        reminderType
      )

      expect(mockDb.countDocuments).toHaveBeenCalledWith({
        agreementReference,
        messageType,
        'data.reminderType': reminderType
      })
      expect(result).toBe(true)
    })
  })

  describe('redactPII', () => {
    test('should call update with correct parameters', async () => {
      const agreementReferences = ['AHWR-123', 'IAHW-456']
      mockDb.updateMany.mockResolvedValueOnce({ modifiedCount: 2 })

      await redactPII(mockDb, agreementReferences, mockLogger)

      expect(mockDb.updateMany).toHaveBeenCalledWith(
        { agreementReference: { $in: ['AHWR-123', 'IAHW-456'] } },
        [
          {
            $set: {
              'data.email': {
                $cond: [
                  { $ifNull: ['$data.email', false] },
                  'redacted.email@example.com',
                  '$data.email'
                ]
              },
              'data.emailAddress': {
                $cond: [
                  { $ifNull: ['$data.emailAddress', false] },
                  'redacted.email@example.com',
                  '$data.emailAddress'
                ]
              },
              'data.herdName': {
                $cond: [
                  { $ifNull: ['$data.herdName', false] },
                  'REDACTED_HERD_NAME',
                  '$data.herdName'
                ]
              },
              'data.orgEmail': {
                $cond: [
                  { $ifNull: ['$data.orgEmail', false] },
                  'redacted.org.email@example.com',
                  '$data.orgEmail'
                ]
              },
              'data.orgName': {
                $cond: [
                  { $ifNull: ['$data.orgName', false] },
                  'REDACTED_ORGANISATION_NAME',
                  '$data.orgName'
                ]
              }
            }
          }
        ]
      )

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Total redacted fields across message generation entries: 2 for agreementReferences: AHWR-123,IAHW-456'
      )
    })

    test('should log when no messages are updated', async () => {
      const agreementReferences = ['AHWR-123', 'IAHW-456']
      mockDb.updateMany.mockResolvedValueOnce({ modifiedCount: 0 })

      await redactPII(mockDb, agreementReferences, mockLogger)

      expect(mockLogger.info).toHaveBeenCalledWith(
        `No message generation entries updated for agreementReference: ${agreementReferences}`
      )
    })
  })
})
