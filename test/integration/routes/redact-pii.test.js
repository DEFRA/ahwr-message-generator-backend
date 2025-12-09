import HttpStatus from 'http-status-codes'
import { startServer } from '../../../src/common/helpers/start-server.js'
import { redactPII } from '../../../src/repositories/message-generation-repository.js'

jest.mock('../../../src/repositories/message-generation-repository.js')
jest.mock('../../../src/messaging/subscriber-message-generator-queue.js')

const mockAgreementsToRedact = [{ reference: 'FAKE-REF-1' }, { reference: 'FAKE-REF-2' }]

describe('redact-pii', () => {
  let server

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await startServer()
  })

  afterEach(async () => {
    if (server) {
      await server.stop()
    }
  })

  describe('POST /api/redact/pii', () => {
    test('should return OK status when called with agreementsToRedact in payload', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/redact/pii',
        payload: { agreementsToRedact: mockAgreementsToRedact }
      })

      expect(redactPII).toHaveBeenCalledTimes(1)
      expect(redactPII).toHaveBeenCalledWith(
        expect.anything(),
        ['FAKE-REF-1', 'FAKE-REF-2'],
        expect.any(Object)
      )
      expect(res.statusCode).toBe(HttpStatus.OK)
    })
  })
})
