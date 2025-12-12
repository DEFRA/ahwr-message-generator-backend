import { config } from '../config.js'
import { createS3Client } from '../common/s3/s3-client.js'
import { GetObjectCommand } from '@aws-sdk/client-s3'

let s3client

const bucketName = config.get('s3.bucketName')

const initialiseClient = () => {
  if (!s3client) {
    s3client = createS3Client({
      region: config.get('aws.region'),
      endpoint: config.get('aws.endpointUrl'),
      forcePathStyle: config.get('s3.forcePathStyle')
    })
  }
  return s3client
}

export const fetchBlob = async (logger, filename) => {
  const client = initialiseClient()
  const params = {
    Bucket: bucketName,
    Key: filename
  }

  const result = await client.send(new GetObjectCommand(params))
  logger.info(`Fetched PDF document: ${filename}, ETag: ${result.ETag}`)

  return streamToBuffer(result.Body)
}

const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
