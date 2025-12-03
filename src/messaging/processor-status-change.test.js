import { processMessage } from './processor-status-change.js'

const mockDb = {}
const mockLogger = { info: jest.fn() }
const mockMessage = { body: { claimReference: '' } }

describe('processMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should skip processing and log message when message already been processed', async () => {
    await processMessage(mockMessage, mockLogger, mockDb)

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Message has already been processed for claim being created'
    )
  })
})
