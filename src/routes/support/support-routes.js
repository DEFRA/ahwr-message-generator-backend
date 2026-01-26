import Joi from 'joi'
import { getMessageGenerationHandler } from './support-controller.js'

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
  }
]
