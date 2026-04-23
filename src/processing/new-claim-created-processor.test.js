import { config } from '../config.js'
import { sendSFDCommsRequest } from '../messaging/send-sfd-comms-request.js'
import {
  createMessageRequestEntry,
  getByClaimRefAndMessageType
} from '../repositories/message-generation-repository.js'
import { getLatestContactDetails } from '../api/application-api.js'
import { processNewClaimCreated } from './new-claim-created-processor.js'

jest.mock('../repositories/message-generation-repository.js')
jest.mock('../api/application-api.js')
jest.mock('../messaging/send-sfd-comms-request.js')

const mockedLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  setBindings: jest.fn(),
  error: jest.fn()
}

const mockDb = {}

describe('process new claim email message', () => {
  beforeEach(() => {
    config.set('notify.carbonCopyEmailAddress', 'cc@example.com')
    config.set('notify.replyToIdNoReply', 'no-reply@example.com')
    config.set('notify.templates.newReviewClaimTemplateId', 'review-complete-template-id')
    config.set('notify.templates.newFollowUpClaimTemplateId', 'followup-complete-template-id')
    config.set('notify.templates.poultryNewReviewClaimTemplateId', 'poultry-review-template-id')
  })

  afterEach(() => {
    jest.resetAllMocks()
    config.carbonCopyEmailAddress = 'cc@example.com'
  })

  const eventBody = {
    crn: '1100014934',
    sbi: '106705779',
    agreementReference: 'IAHW-0AD3-3322',
    claimReference: 'REBC-O9UD-22F6',
    claimStatus: 'IN_CHECK',
    claimType: 'REVIEW',
    typeOfLivestock: 'beef',
    reviewTestResults: 'positive',
    claimAmount: 500,
    herdName: 'Commercial herd'
  }

  test('should send a new claim email when it is the first time the claim has passed through', async () => {
    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      name: 'Willow Farm',
      orgEmail: 'willowfarm@gmail.com',
      farmerName: 'John Jim Doe',
      email: 'john.doe@gmail.com'
    })

    await processNewClaimCreated(eventBody, mockedLogger, mockDb)

    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith(
      mockDb,
      'REBC-O9UD-22F6',
      'claimCreated'
    )
    expect(getLatestContactDetails).toHaveBeenCalledWith('IAHW-0AD3-3322', mockedLogger)
    expect(sendSFDCommsRequest).toHaveBeenCalledTimes(3)
    checkLivestockNewClaimEmailSendAndEventRaised(
      'cc@example.com',
      'review-complete-template-id',
      'CC'
    )
    checkLivestockNewClaimEmailSendAndEventRaised(
      'willowfarm@gmail.com',
      'review-complete-template-id',
      'orgEmail'
    )
    checkLivestockNewClaimEmailSendAndEventRaised(
      'john.doe@gmail.com',
      'review-complete-template-id',
      'email'
    )

    expect(createMessageRequestEntry).toHaveBeenCalledWith(mockDb, {
      agreementReference: 'IAHW-0AD3-3322',
      claimReference: 'REBC-O9UD-22F6',
      messageType: 'claimCreated',
      data: {
        orgName: 'Willow Farm',
        orgEmail: 'willowfarm@gmail.com',
        email: 'john.doe@gmail.com',
        crn: '1100014934',
        sbi: '106705779',
        claimType: 'REVIEW',
        typeOfLivestock: 'beef',
        claimAmount: 500,
        herdName: 'Commercial herd'
      }
    })
  })

  test('should not send a new claim email to orgEmail and CC when not available', async () => {
    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      farmerName: 'John Jim Doe',
      email: 'john.doe@gmail.com'
    })
    config.set('notify.carbonCopyEmailAddress', undefined)

    await processNewClaimCreated(eventBody, mockedLogger, mockDb)

    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith(
      mockDb,
      'REBC-O9UD-22F6',
      'claimCreated'
    )
    expect(getLatestContactDetails).toHaveBeenCalledWith('IAHW-0AD3-3322', mockedLogger)
    expect(sendSFDCommsRequest).toHaveBeenCalledTimes(1)
    checkLivestockNewClaimEmailSendAndEventRaised(
      'john.doe@gmail.com',
      'review-complete-template-id',
      'email'
    )

    expect(createMessageRequestEntry).toHaveBeenCalledWith(mockDb, {
      agreementReference: 'IAHW-0AD3-3322',
      claimReference: 'REBC-O9UD-22F6',
      messageType: 'claimCreated',
      data: {
        email: 'john.doe@gmail.com',
        crn: '1100014934',
        sbi: '106705779',
        claimType: 'REVIEW',
        typeOfLivestock: 'beef',
        claimAmount: 500,
        herdName: 'Commercial herd'
      }
    })
  })

  test('should send new claim emails for follow-up when it is the first time the claim has passed through', async () => {
    const event = {
      ...eventBody,
      claimType: 'FOLLOW_UP',
      typeOfLivestock: 'sheep',
      claimReference: 'FUSH-O9UD-22F6'
    }
    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      name: 'Willow Farm',
      orgEmail: 'willowfarm@gmail.com'
    })

    await processNewClaimCreated(event, mockedLogger, mockDb)

    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith(
      mockDb,
      'FUSH-O9UD-22F6',
      'claimCreated'
    )
    expect(getLatestContactDetails).toHaveBeenCalledWith('IAHW-0AD3-3322', mockedLogger)
    expect(sendSFDCommsRequest).toHaveBeenCalledTimes(2)
    checkLivestockNewClaimEmailSendAndEventRaised(
      'cc@example.com',
      'followup-complete-template-id',
      'CC',
      'Sheep',
      'Flock name',
      'FUSH-O9UD-22F6'
    )
    checkLivestockNewClaimEmailSendAndEventRaised(
      'willowfarm@gmail.com',
      'followup-complete-template-id',
      'orgEmail',
      'Sheep',
      'Flock name',
      'FUSH-O9UD-22F6'
    )

    expect(createMessageRequestEntry).toHaveBeenCalledWith(mockDb, {
      agreementReference: 'IAHW-0AD3-3322',
      claimReference: 'FUSH-O9UD-22F6',
      messageType: 'claimCreated',
      data: {
        orgName: 'Willow Farm',
        orgEmail: 'willowfarm@gmail.com',
        email: undefined,
        crn: '1100014934',
        sbi: '106705779',
        claimType: 'FOLLOW_UP',
        typeOfLivestock: 'sheep',
        claimAmount: 500,
        herdName: 'Commercial herd'
      }
    })
  })

  test('should not send any new claim emails when the claim has previously passed through successfully', async () => {
    getByClaimRefAndMessageType.mockResolvedValueOnce({
      agreementReference: 'IAHW-0AD3-3322',
      claimReference: 'REBC-O9UD-22F6',
      messageType: 'claimCreated',
      data: {
        name: 'Willow Farm',
        orgEmail: 'willowfarm@gmail.com',
        farmerName: 'John Jim Doe',
        email: 'john.doe@gmail.com'
      }
    })

    await processNewClaimCreated(eventBody, mockedLogger, mockDb)

    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith(
      mockDb,
      'REBC-O9UD-22F6',
      'claimCreated'
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

    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      name: 'Willow Farm',
      orgEmail: 'willowfarm@gmail.com'
    })

    await expect(processNewClaimCreated(eventBody, mockedLogger, mockDb)).rejects.toThrow(
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
      `Error sending CC new claim email.`
    )
  })

  test('should send a new claim email for poultry', async () => {
    const poultryEventBody = {
      crn: '1100000000',
      sbi: '100000000',
      agreementReference: 'POUL-CH1C-K3NS',
      claimReference: 'PORE-CH1C-K3NS',
      claimStatus: 'IN_CHECK',
      claimType: 'REVIEW',
      typesOfPoultry: ['laying-hens', 'breeders', 'ducks'],
      claimAmount: 430,
      herdName: 'Chicken Site'
    }
    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      name: 'Poultry Farm',
      orgEmail: 'poultryfarm@example.com',
      farmerName: 'Chic Ken',
      email: 'chic.ken@example.com'
    })

    await processNewClaimCreated(poultryEventBody, mockedLogger, mockDb)

    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith(
      mockDb,
      'PORE-CH1C-K3NS',
      'claimCreated'
    )
    expect(getLatestContactDetails).toHaveBeenCalledWith('POUL-CH1C-K3NS', mockedLogger)
    expect(sendSFDCommsRequest).toHaveBeenCalledTimes(3)
    checkPoultryNewClaimEmailSendAndEventRaised(
      'cc@example.com',
      'poultry-review-template-id',
      'CC'
    )
    checkPoultryNewClaimEmailSendAndEventRaised(
      'poultryfarm@example.com',
      'poultry-review-template-id',
      'orgEmail'
    )
    checkPoultryNewClaimEmailSendAndEventRaised(
      'chic.ken@example.com',
      'poultry-review-template-id',
      'email'
    )
    expect(createMessageRequestEntry).toHaveBeenCalledWith(mockDb, {
      agreementReference: 'POUL-CH1C-K3NS',
      claimReference: 'PORE-CH1C-K3NS',
      messageType: 'claimCreated',
      data: {
        orgName: 'Poultry Farm',
        orgEmail: 'poultryfarm@example.com',
        email: 'chic.ken@example.com',
        crn: '1100000000',
        sbi: '100000000',
        claimType: 'REVIEW',
        typesOfPoultry: ['laying-hens', 'breeders', 'ducks'],
        claimAmount: 430,
        herdName: 'Chicken Site'
      }
    })
  })

  test('should track an exception when email fails to send for poultry', async () => {
    const poultryEventBody = {
      crn: '1100000000',
      sbi: '100000000',
      agreementReference: 'POUL-CH1C-K3NS',
      claimReference: 'PORE-CH1C-K3NS',
      claimStatus: 'IN_CHECK',
      claimType: 'REVIEW',
      typesOfPoultry: ['laying-hens', 'breeders', 'ducks'],
      claimAmount: 430,
      herdName: 'Chicken Site'
    }
    const error = new Error('Email send failed')
    sendSFDCommsRequest.mockImplementationOnce(() => {
      throw error
    })

    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      name: 'Poultry Farm',
      orgEmail: 'poultryfarm@example.com'
    })

    await expect(processNewClaimCreated(poultryEventBody, mockedLogger, mockDb)).rejects.toThrow(
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
      `Error sending CC new claim email.`
    )
  })

  const checkLivestockNewClaimEmailSendAndEventRaised = (
    emailAddress,
    notifyTemplateId,
    addressType,
    species = 'Beef cattle',
    herdNameLabel = 'Herd name',
    claimReference = 'REBC-O9UD-22F6'
  ) => {
    expect(sendSFDCommsRequest).toHaveBeenCalledWith({
      emailAddress,
      emailReplyToId: 'no-reply@example.com',
      agreementReference: 'IAHW-0AD3-3322',
      claimReference,
      crn: '1100014934',
      sbi: '106705779',
      notifyTemplateId,
      customParams: {
        sbi: '106705779',
        crn: '1100014934',
        applicationReference: 'IAHW-0AD3-3322',
        reference: claimReference,
        amount: 500,
        herdName: 'Commercial herd',
        herdNameLabel,
        species
      },
      logger: mockedLogger
    })

    expect(mockedLogger.info).toHaveBeenCalledWith({
      event: {
        type: 'claim-email-requested',
        outcome: 'true',
        reference: claimReference,
        kind: addressType,
        category: expect.stringMatching(`- templateId:${notifyTemplateId}`)
      }
    })
  }

  const checkPoultryNewClaimEmailSendAndEventRaised = (
    emailAddress,
    notifyTemplateId,
    addressType,
    species = 'Laying hens, Breeders, Ducks',
    herdNameLabel = 'Site',
    claimReference = 'PORE-CH1C-K3NS'
  ) => {
    expect(sendSFDCommsRequest).toHaveBeenCalledWith({
      emailAddress,
      emailReplyToId: 'no-reply@example.com',
      agreementReference: 'POUL-CH1C-K3NS',
      claimReference,
      crn: '1100000000',
      sbi: '100000000',
      notifyTemplateId,
      customParams: {
        sbi: '100000000',
        crn: '1100000000',
        applicationReference: 'POUL-CH1C-K3NS',
        reference: claimReference,
        amount: 430,
        herdName: 'Chicken Site',
        herdNameLabel,
        species
      },
      logger: mockedLogger
    })

    expect(mockedLogger.info).toHaveBeenCalledWith({
      event: {
        type: 'claim-email-requested',
        outcome: 'true',
        reference: claimReference,
        kind: addressType,
        category: expect.stringMatching(`- templateId:${notifyTemplateId}`)
      }
    })
  }
})
