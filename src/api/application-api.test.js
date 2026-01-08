import wreck from '@hapi/wreck'
import { getLatestContactDetails } from './application-api.js'
import { config } from '../config.js'

jest.mock('@hapi/wreck')

const mockLogger = {
  info: jest.fn(),
  error: jest.fn()
}

describe('getLatestContactDetails', () => {
  beforeAll(() => {
    config.set('applicationApiUri', 'application-service')
  })
  const applicationReference = 'AHWR-1234-APP1'
  const endpoint = `application-service/applications/latest-contact-details/${applicationReference}`

  test('should retrieve latest contact details successfully', async () => {
    wreck.get.mockResolvedValueOnce({
      payload: { name: 'John Doe', email: 'john.doe@example.com' }
    })

    const result = await getLatestContactDetails(applicationReference, mockLogger)

    expect(wreck.get).toHaveBeenCalledWith(endpoint, { json: true })
    expect(result).toEqual({ name: 'John Doe', email: 'john.doe@example.com' })
  })

  test('should log and track an exception when request fails', async () => {
    const error = new Error('Request failed')
    wreck.get.mockRejectedValueOnce(error)

    await expect(getLatestContactDetails(applicationReference, mockLogger)).rejects.toThrow(error)

    expect(mockLogger.error).toHaveBeenCalledWith(
      {
        error,
        event: {
          category: 'failed-request',
          type: 'exception'
        }
      },
      `error retrieving contact details from application-service/applications/latest-contact-details/AHWR-1234-APP1`
    )
  })
})
