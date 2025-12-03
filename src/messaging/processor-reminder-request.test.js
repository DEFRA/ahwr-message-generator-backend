import { processMessage } from './processor-reminder-request.js'

const mockDb = {}
const mockLogger = { info: jest.fn() }
const mockMessage = { body: {} }

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
