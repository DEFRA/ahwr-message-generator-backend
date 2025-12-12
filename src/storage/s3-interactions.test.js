import { fetchBlob } from './s3-interactions.js'
import { createS3Client } from '../common/s3/s3-client.js'
import { Readable } from 'stream'

jest.mock('../common/s3/s3-client.js')

const bucketName = 'document-bucket'

describe('s3-interactions', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
  beforeEach(() => {
    createS3Client.mockReturnValueOnce(mockS3Client)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const s = new Readable()
  s.push('test-data') // the string you want
  s.push(null)

  const mockGetObjectResponse = { ETag: '"mock-etag"', Body: s }
  const mockS3Client = {
    send: jest.fn(() => Promise.resolve(mockGetObjectResponse))
  }

  describe('fetchBlob', () => {
    it('should fetch a blob from the S3 bucket with specified key and return buffer of data', async () => {
      const key = 'test-key'

      const result = await fetchBlob(mockLogger, key)

      expect(createS3Client).toHaveBeenCalledTimes(1)
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: bucketName,
            Key: key
          }
        })
      )
      expect(result).toEqual(Buffer.from('test-data', 'utf8'))
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Fetched PDF document: ${key}, ETag: ${mockGetObjectResponse.ETag}`
      )
    })
  })
})
