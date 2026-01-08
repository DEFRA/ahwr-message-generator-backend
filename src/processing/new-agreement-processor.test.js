import { config } from '../config.js'
import { sendSFDCommsRequest } from '../messaging/send-sfd-comms-request.js'
import {
  createMessageRequestEntry,
  getByAgreementRefAndMessageType
} from '../repositories/message-generation-repository.js'
import { getLatestContactDetails } from '../api/application-api.js'
import { processNewAgreementCreated } from './new-agreement-processor.js'
import { fetchBlob } from '../storage/s3-interactions.js'

jest.mock('../repositories/message-generation-repository.js')
jest.mock('../api/application-api.js')
jest.mock('../messaging/send-sfd-comms-request.js')
jest.mock('../storage/s3-interactions.js')

const mockedLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  setBindings: jest.fn(),
  error: jest.fn()
}

const mockDb = {}

describe('process new agreement email message', () => {
  beforeEach(() => {
    config.set('notify.carbonCopyEmailAddress', 'cc@example.com')
    config.set('notify.replyToIdNoReply', 'no-reply@example.com')
    config.set('notify.templates.newUserAgreementTemplateId', 'new-user-template-id')
    config.set('notify.templates.existingUserAgreementTemplateId', 'existing-user-template-id')

    fetchBlob.mockResolvedValueOnce(Buffer.from('PDF-1.4 test pdf content'))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const eventBody = {
    crn: '1100014934',
    sbi: '106705779',
    applicationReference: 'IAHW-0AD3-3322',
    userType: 'newUser',
    documentLocation: '106705779/IAHW-0AD3-3322.pdf'
  }

  const checkNewAgreementEmailSendAndEventRaised = (
    emailAddress,
    notifyTemplateId,
    addressType
  ) => {
    expect(sendSFDCommsRequest).toHaveBeenCalledWith({
      emailAddress,
      emailReplyToId: 'no-reply@example.com',
      agreementReference: 'IAHW-0AD3-3322',
      crn: '1100014934',
      sbi: '106705779',
      notifyTemplateId,
      customParams: {
        reference: 'IAHW-0AD3-3322',
        name: 'Willow Farm',
        link_to_file: {
          confirm_email_before_download: null,
          file: 'UERGLTEuNCB0ZXN0IHBkZiBjb250ZW50',
          is_csv: false,
          retention_period: null
        }
      },
      logger: mockedLogger
    })

    expect(mockedLogger.info).toHaveBeenCalledWith({
      event: {
        type: 'agreement-email-requested',
        outcome: true,
        reference: 'IAHW-0AD3-3322',
        kind: addressType,
        category: expect.stringMatching(`templateId:${notifyTemplateId}`)
      }
    })
  }

  test('should send a new agreement email when it is the first time the document created message has passed through', async () => {
    getByAgreementRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      name: 'Willow Farm',
      orgEmail: 'willowfarm@gmail.com',
      farmerName: 'John Jim Doe',
      email: 'john.doe@gmail.com'
    })

    await processNewAgreementCreated(eventBody, mockedLogger, mockDb)

    expect(getByAgreementRefAndMessageType).toHaveBeenCalledWith(
      mockDb,
      'IAHW-0AD3-3322',
      'agreementCreated'
    )
    expect(getLatestContactDetails).toHaveBeenCalledWith('IAHW-0AD3-3322', mockedLogger)
    expect(sendSFDCommsRequest).toHaveBeenCalledTimes(3)
    checkNewAgreementEmailSendAndEventRaised('cc@example.com', 'new-user-template-id', 'CC')
    checkNewAgreementEmailSendAndEventRaised(
      'willowfarm@gmail.com',
      'new-user-template-id',
      'orgEmail'
    )
    checkNewAgreementEmailSendAndEventRaised('john.doe@gmail.com', 'new-user-template-id', 'email')

    expect(createMessageRequestEntry).toHaveBeenCalledWith(mockDb, {
      agreementReference: 'IAHW-0AD3-3322',
      messageType: 'agreementCreated',
      data: {
        orgName: 'Willow Farm',
        orgEmail: 'willowfarm@gmail.com',
        email: 'john.doe@gmail.com',
        crn: '1100014934',
        sbi: '106705779',
        documentLocation: '106705779/IAHW-0AD3-3322.pdf',
        userType: 'newUser'
      }
    })
  })

  test('should not send a new agreement email to orgEmail and CC when not available', async () => {
    getByAgreementRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      farmerName: 'John Jim Doe',
      email: 'john.doe@gmail.com',
      name: 'Willow Farm'
    })
    config.set('notify.carbonCopyEmailAddress', undefined)

    await processNewAgreementCreated(eventBody, mockedLogger, mockDb)

    expect(getByAgreementRefAndMessageType).toHaveBeenCalledWith(
      mockDb,
      'IAHW-0AD3-3322',
      'agreementCreated'
    )
    expect(getLatestContactDetails).toHaveBeenCalledWith('IAHW-0AD3-3322', mockedLogger)
    expect(sendSFDCommsRequest).toHaveBeenCalledTimes(1)
    checkNewAgreementEmailSendAndEventRaised('john.doe@gmail.com', 'new-user-template-id', 'email')

    expect(createMessageRequestEntry).toHaveBeenCalledWith(mockDb, {
      agreementReference: 'IAHW-0AD3-3322',
      messageType: 'agreementCreated',
      data: {
        email: 'john.doe@gmail.com',
        orgName: 'Willow Farm',
        orgEmail: undefined,
        crn: '1100014934',
        sbi: '106705779',
        documentLocation: '106705779/IAHW-0AD3-3322.pdf',
        userType: 'newUser'
      }
    })
  })

  test('should send new agreement emails for existing user when it is the first time the agreement has passed through', async () => {
    const event = {
      ...eventBody,
      userType: 'existingUser'
    }
    getByAgreementRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      name: 'Willow Farm',
      orgEmail: 'willowfarm@gmail.com'
    })

    await processNewAgreementCreated(event, mockedLogger, mockDb)

    expect(getByAgreementRefAndMessageType).toHaveBeenCalledWith(
      mockDb,
      'IAHW-0AD3-3322',
      'agreementCreated'
    )
    expect(getLatestContactDetails).toHaveBeenCalledWith('IAHW-0AD3-3322', mockedLogger)
    expect(sendSFDCommsRequest).toHaveBeenCalledTimes(2)
    checkNewAgreementEmailSendAndEventRaised('cc@example.com', 'existing-user-template-id', 'CC')
    checkNewAgreementEmailSendAndEventRaised(
      'willowfarm@gmail.com',
      'existing-user-template-id',
      'orgEmail'
    )

    expect(createMessageRequestEntry).toHaveBeenCalledWith(mockDb, {
      agreementReference: 'IAHW-0AD3-3322',
      messageType: 'agreementCreated',
      data: {
        orgName: 'Willow Farm',
        orgEmail: 'willowfarm@gmail.com',
        email: undefined,
        crn: '1100014934',
        sbi: '106705779',
        documentLocation: '106705779/IAHW-0AD3-3322.pdf',
        userType: 'existingUser'
      }
    })
  })

  test('should not send any new agreement emails when the agreement has previously passed through successfully', async () => {
    getByAgreementRefAndMessageType.mockResolvedValueOnce({
      agreementReference: 'IAHW-0AD3-3322',
      messageType: 'agreementCreated',
      data: {
        name: 'Willow Farm',
        orgEmail: 'willowfarm@gmail.com',
        farmerName: 'John Jim Doe',
        email: 'john.doe@gmail.com'
      }
    })

    await processNewAgreementCreated(eventBody, mockedLogger, mockDb)

    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
    expect(getByAgreementRefAndMessageType).toHaveBeenCalledWith(
      mockDb,
      'IAHW-0AD3-3322',
      'agreementCreated'
    )
    expect(getLatestContactDetails).toHaveBeenCalledTimes(0)
    expect(sendSFDCommsRequest).toHaveBeenCalledTimes(0)
    expect(createMessageRequestEntry).toHaveBeenCalledTimes(0)
  })

  test('should track an exception when email fails to send', async () => {
    const error = new Error('Email send failed')
    sendSFDCommsRequest.mockImplementationOnce(() => {
      throw error
    })

    getByAgreementRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      name: 'Willow Farm',
      orgEmail: 'willowfarm@gmail.com'
    })

    await expect(processNewAgreementCreated(eventBody, mockedLogger, mockDb)).rejects.toThrow(
      'Email send failed'
    )

    expect(mockedLogger.error).toHaveBeenCalledWith(
      {
        error,
        event: {
          category: 'failed-processing',
          type: 'exception'
        }
      },
      `Error sending CC new agreement email.`
    )
  })
})
