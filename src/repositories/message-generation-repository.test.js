import { redactPII } from './message-generation-repository.js'

describe('message-generation repository', () => {
  describe('redactPII', () => {
    const mockLogger = { info: jest.fn() }
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      updateMany: jest.fn()
    }

    beforeEach(async () => {
      jest.clearAllMocks()
    })

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
        'Total redacted fields across comms log entries: 2 for agreementReferences: AHWR-123,IAHW-456'
      )
    })

    test('should log when no messages are updated', async () => {
      const agreementReferences = ['AHWR-123', 'IAHW-456']
      mockDb.updateMany.mockResolvedValueOnce({ modifiedCount: 0 })

      await redactPII(mockDb, agreementReferences, mockLogger)

      expect(mockLogger.info).toHaveBeenCalledWith(
        `No comms log entries updated for agreementReference: ${agreementReferences}`
      )
    })
  })
})
