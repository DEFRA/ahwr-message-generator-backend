import { publishMessage, setupClient } from 'ffc-ahwr-common-library'
import { sendSFDCommsRequest } from './send-sfd-comms-request.js'
import { config } from '../config.js'
import { validateSFDSchema } from './schemas/submit-sfd-schema.js'

jest.mock('ffc-ahwr-common-library')
jest.mock('./schemas/submit-sfd-schema.js')

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  setBindings: jest.fn()
}

describe('publish outbound notification', () => {
  beforeAll(() => {
    config.set('outboundMessage.sfdCommsTopic', 'arn:aws:sns:eu-west-2:1:message-requested')
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendSFDCommsRequest', () => {
    test('sets up client and then publishes valid message request event on first call', async () => {
      validateSFDSchema.mockReturnValueOnce(true)

      const messageBody = {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        notifyTemplateId: 'template-123',
        emailAddress: 'test@example.com',
        emailReplyToId: 'replyToId',
        customParams: {
          agreementReference: 'AHWR-0AD3-3322',
          claimReference: 'TEMP-O9UD-22F6'
        }
      }
      const inputMessageBody = {
        ...messageBody,
        logger: mockLogger
      }
      await sendSFDCommsRequest(inputMessageBody)

      expect(setupClient).toHaveBeenCalledTimes(1)
      expect(publishMessage).toHaveBeenCalledWith(
        { ...messageBody, dateTime: expect.any(String) },
        {
          eventType: config.get('outboundMessage.eventType'),
          messageId: expect.any(String)
        }
      )
    })

    test('skips setting up client and then publishes event on subsequent call', async () => {
      validateSFDSchema.mockReturnValueOnce(true)

      const messageBody = {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        notifyTemplateId: 'template-123',
        emailAddress: 'test@example.com',
        emailReplyToId: 'replyToId',
        customParams: {
          agreementReference: 'AHWR-0AD3-3322',
          claimReference: 'TEMP-O9UD-22F6'
        }
      }
      const inputMessageBody = {
        ...messageBody,
        logger: mockLogger
      }
      await sendSFDCommsRequest(inputMessageBody)

      expect(setupClient).toHaveBeenCalledTimes(0)
      expect(publishMessage).toHaveBeenCalledWith(
        { ...messageBody, dateTime: expect.any(String) },
        {
          eventType: config.get('outboundMessage.eventType'),
          messageId: expect.any(String)
        }
      )
    })

    test('throws an error if outboudn message is not valid', async () => {
      validateSFDSchema.mockReturnValueOnce(false)

      const messageBody = {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6'
      }
      const inputMessageBody = {
        ...messageBody,
        logger: mockLogger
      }

      await expect(sendSFDCommsRequest(inputMessageBody)).rejects.toThrow('SFD validation error')

      expect(publishMessage).not.toHaveBeenCalled()
    })
  })
})
