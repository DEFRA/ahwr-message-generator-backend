import { routeStatusUpdateMessage } from './router-status-change.js'
import { validateStatusMessageRequest } from './schemas/inbound-status-message.js'
import { processNewClaimCreated } from '../processing/new-claim-created-processor.js'
import { processInCheckStatusMessageForEvidenceEmail } from '../processing/evidence-email-processor.js'

jest.mock('./schemas/inbound-status-message.js')
jest.mock('../processing/new-claim-created-processor.js')
jest.mock('../processing/evidence-email-processor.js')

const mockDb = {}
const mockLogger = { info: jest.fn(), error: jest.fn() }
const mockMessage = { claimReference: 'REPI-1223-45FA', claimStatus: 'ON_HOLD' }

describe('process status update message', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should pass valid message on to process new claim processor when status is ON_HOLD', async () => {
    validateStatusMessageRequest.mockReturnValueOnce(true)

    await routeStatusUpdateMessage(mockMessage, mockLogger, mockDb)

    expect(processNewClaimCreated).toHaveBeenCalledWith(mockMessage, mockLogger, mockDb)
    expect(processInCheckStatusMessageForEvidenceEmail).not.toHaveBeenCalled()
  })

  it('should pass valid message on to process new claim processor and evidence processor when status is IN_CHECK', async () => {
    validateStatusMessageRequest.mockReturnValueOnce(true)

    const mockICMessage = { ...mockMessage, claimStatus: 'IN_CHECK' }

    await routeStatusUpdateMessage(mockICMessage, mockLogger, mockDb)

    expect(processNewClaimCreated).toHaveBeenCalledWith(mockICMessage, mockLogger, mockDb)
    expect(processInCheckStatusMessageForEvidenceEmail).toHaveBeenCalledWith(
      mockICMessage,
      mockLogger,
      mockDb
    )
  })

  it('should not pass valid message to any processor when status is something else', async () => {
    validateStatusMessageRequest.mockReturnValueOnce(true)

    const mockRPMessage = { ...mockMessage, claimStatus: 'READ_TO_PAY' }

    await routeStatusUpdateMessage(mockRPMessage, mockLogger, mockDb)

    expect(processNewClaimCreated).not.toHaveBeenCalled()
    expect(processInCheckStatusMessageForEvidenceEmail).not.toHaveBeenCalled()
  })

  it('should throw an error if validation fails', async () => {
    validateStatusMessageRequest.mockReturnValueOnce(false)
    await expect(routeStatusUpdateMessage(mockMessage, mockLogger, mockDb)).rejects.toThrow(
      'Invalid status message request'
    )

    expect(processNewClaimCreated).not.toHaveBeenCalled()
    expect(processInCheckStatusMessageForEvidenceEmail).not.toHaveBeenCalled()
  })
})
