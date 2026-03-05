import { StatusCodes } from 'http-status-codes'
import Boom from '@hapi/boom'
import {
  getByAgreementRef,
  getByClaimRef
} from '../../repositories/message-generation-repository.js'
import { SQSClient, ReceiveMessageCommand } from '@aws-sdk/client-sqs'
import { config } from '../../config.js'

export const getMessageGenerationHandler = async (request, h) => {
  try {
    const {
      db,
      logger,
      query: { agreementReference, claimReference }
    } = request
    logger.info(
      `Get message generation request, agreementReference: ${agreementReference}, claimReference: ${claimReference}`
    )

    const messageGenerations = claimReference
      ? await getByClaimRef(db, claimReference)
      : await getByAgreementRef(db, agreementReference)

    return h.response({ data: messageGenerations }).code(StatusCodes.OK)
  } catch (error) {
    request.logger.error({ error }, 'Failed to retrieve message generations')

    if (Boom.isBoom(error)) {
      throw error
    }

    throw Boom.internal(error)
  }
}
export const supportQueueMessagesHandler = async (request, h) => {
  try {
    const { queueUrl, limit } = request.query

    const client = new SQSClient({
      region: config.get('aws.region'),
      endpoint: config.get('aws.endpointUrl')
    })

    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: limit,
      VisibilityTimeout: 2,
      WaitTimeSeconds: 0,
      AttributeNames: ['All'],
      MessageAttributeNames: ['All']
    })
    const res = await client.send(command)

    request.logger.info(`Retrieved ${res.Messages?.length || 0} messages`)

    const result = (res.Messages || []).map((msg) => ({
      id: msg.MessageId,
      body: msg.Body,
      attributes: msg.Attributes,
      messageAttributes: msg.MessageAttributes
    }))

    return h.response(result).code(StatusCodes.OK)
  } catch (err) {
    request.logger.error({ err }, 'Failed to get queue messages')

    if (Boom.isBoom(err)) {
      throw err
    }

    throw Boom.internal(err)
  }
}
