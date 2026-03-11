import Joi from 'joi'
import { getMessageGenerationHandler, supportQueueMessagesHandler } from './support-controller.js'

export const supportRoutes = [
  {
    method: 'GET',
    path: '/api/support/message-generation',
    options: {
      description: 'Get message generation',
      validate: {
        query: Joi.object({
          agreementReference: Joi.string().optional(),
          claimReference: Joi.string().optional()
        }).xor('agreementReference', 'claimReference')
      },
      handler: getMessageGenerationHandler
    }
  },
  {
    method: 'GET',
    path: '/api/support/queue-messages',
    options: {
      description: 'Get queue messages by url',
      validate: {
        query: Joi.object({
          queueUrl: Joi.string().required(),
          limit: Joi.number().integer().required()
        })
      },
      handler: supportQueueMessagesHandler
    }
  }
]
