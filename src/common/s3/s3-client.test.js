import { S3Client } from '@aws-sdk/client-s3'

import { createS3Client } from './s3-client.js'

jest.mock('@aws-sdk/client-s3')

const region = 'eu-west-2'
const endpoint = 'http://localhost:4566'
const forcePathStyle = true
const credentials = { accessKeyId: 'test', secretAccessKey: 'test' }

describe('createS3Client', () => {
  let s3Client

  beforeEach(() => {
    s3Client = { config: { region } }

    jest.mocked(S3Client).mockImplementation(function (config) {
      return s3Client
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should create client with expected configuration', () => {
    const result = createS3Client({ region, endpoint, forcePathStyle })

    expect(S3Client).toHaveBeenCalledWith({
      region,
      endpoint,
      forcePathStyle
    })

    expect(result).toBe(s3Client)
  })

  it('should create client with specific credentials', () => {
    const result = createS3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials
    })

    expect(S3Client).toHaveBeenCalledWith({
      region,
      endpoint,
      forcePathStyle,
      credentials
    })

    expect(result).toBe(s3Client)
  })
})
