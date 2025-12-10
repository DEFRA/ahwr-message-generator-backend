import { config } from '../config.js'
import { sendEvidenceEmail } from './evidence/evidence-email.js'
import {
  createMessageRequestEntry,
  getByClaimRefAndMessageType
} from '../repositories/message-generation-repository.js'
import { getLatestContactDetails } from '../api/application-api.js'
import { processInCheckStatusMessageForEvidenceEmail } from './evidence-email-processor.js'

jest.mock('../repositories/message-generation-repository.js')
jest.mock('../api/application-api.js')
jest.mock('./evidence/evidence-email.js')

const mockedLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  setBindings: jest.fn(),
  error: jest.fn()
}

const mockDb = {}

describe('process evidence email message', () => {
  beforeEach(() => {
    config.set('evidenceEmailEnabled', true)
    config.set('notify.evidenceCarbonCopyEmailAddress', 'cc-email@gmail.com')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const checkEvidenceEmailSendCalled = (emailAddress, addressType) => {
    expect(sendEvidenceEmail).toHaveBeenCalledWith({
      addressType,
      emailAddress,
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      crn: '1100014934',
      sbi: '106705779',
      claimType: 'REVIEW',
      typeOfLivestock: 'beef',
      logger: mockedLogger,
      orgName: 'Willow Farm',
      reviewTestResults: 'positive',
      piHuntRecommended: 'yes',
      piHuntAllAnimals: 'no',
      herdName: 'Commercial herd'
    })
  }

  test('should send an evidence email when it is the first time the claim has the status of in check', async () => {
    const event = {
      body: {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        claimStatus: 'IN_CHECK',
        claimType: 'REVIEW',
        typeOfLivestock: 'beef',
        reviewTestResults: 'positive',
        piHuntRecommended: 'yes',
        piHuntAllAnimals: 'no',
        herdName: 'Commercial herd'
      },
      messageId: 1
    }
    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      name: 'Willow Farm',
      orgEmail: 'willowfarm@gmail.com',
      farmerName: 'John Jim Doe',
      email: 'john.doe@gmail.com'
    })

    await processInCheckStatusMessageForEvidenceEmail(event, mockedLogger, mockDb)

    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith(
      mockDb,
      'TEMP-O9UD-22F6',
      'statusChange-IN_CHECK'
    )
    expect(getLatestContactDetails).toHaveBeenCalledWith('AHWR-0AD3-3322', mockedLogger)
    checkEvidenceEmailSendCalled('cc-email@gmail.com', 'CC')
    checkEvidenceEmailSendCalled('willowfarm@gmail.com', 'orgEmail')
    checkEvidenceEmailSendCalled('john.doe@gmail.com', 'email')

    expect(createMessageRequestEntry).toHaveBeenCalledWith(mockDb, {
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      messageType: 'statusChange-IN_CHECK',
      data: {
        orgName: 'Willow Farm',
        orgEmail: 'willowfarm@gmail.com',
        email: 'john.doe@gmail.com',
        crn: '1100014934',
        sbi: '106705779',
        claimType: 'REVIEW',
        typeOfLivestock: 'beef',
        reviewTestResults: 'positive',
        piHuntRecommended: 'yes',
        piHuntAllAnimals: 'no',
        herdName: 'Commercial herd'
      }
    })
  })

  test('should not send an evidence email to orgEmail and CC when not available', async () => {
    const event = {
      body: {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        claimStatus: 'IN_CHECK',
        claimType: 'REVIEW',
        typeOfLivestock: 'sheep'
      },
      messageId: 1
    }

    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      farmerName: 'John Jim Doe',
      email: 'john.doe@gmail.com'
    })
    config.set('notify.evidenceCarbonCopyEmailAddress', undefined)

    await processInCheckStatusMessageForEvidenceEmail(event, mockedLogger, mockDb)

    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith(
      mockDb,
      'TEMP-O9UD-22F6',
      'statusChange-IN_CHECK'
    )
    expect(getLatestContactDetails).toHaveBeenCalledWith('AHWR-0AD3-3322', mockedLogger)
    expect(sendEvidenceEmail).toHaveBeenCalledTimes(1)

    expect(sendEvidenceEmail).toHaveBeenCalledWith({
      addressType: 'email',
      emailAddress: 'john.doe@gmail.com',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      crn: '1100014934',
      sbi: '106705779',
      claimType: 'REVIEW',
      typeOfLivestock: 'sheep',
      logger: mockedLogger
    })
    expect(createMessageRequestEntry).toHaveBeenCalledWith(mockDb, {
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      messageType: 'statusChange-IN_CHECK',
      data: {
        email: 'john.doe@gmail.com',
        crn: '1100014934',
        sbi: '106705779',
        claimType: 'REVIEW',
        typeOfLivestock: 'sheep'
      }
    })
  })

  test('should not send an evidence email to email address if it is the same as orgEmail', async () => {
    const event = {
      body: {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        claimStatus: 'IN_CHECK',
        claimType: 'REVIEW',
        typeOfLivestock: 'sheep'
      },
      messageId: 1
    }

    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      farmerName: 'John Jim Doe',
      email: 'willowfarm@gmail.com',
      name: 'Willow Farm',
      orgEmail: 'willowfarm@gmail.com'
    })
    config.set('notify.evidenceCarbonCopyEmailAddress', undefined)

    await processInCheckStatusMessageForEvidenceEmail(event, mockedLogger, mockDb)

    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith(
      mockDb,
      'TEMP-O9UD-22F6',
      'statusChange-IN_CHECK'
    )
    expect(getLatestContactDetails).toHaveBeenCalledWith('AHWR-0AD3-3322', mockedLogger)
    expect(sendEvidenceEmail).toHaveBeenCalledTimes(1)

    expect(sendEvidenceEmail).toHaveBeenCalledWith({
      addressType: 'orgEmail',
      emailAddress: 'willowfarm@gmail.com',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      crn: '1100014934',
      sbi: '106705779',
      claimType: 'REVIEW',
      typeOfLivestock: 'sheep',
      logger: mockedLogger,
      orgName: 'Willow Farm',
      reviewTestResults: undefined,
      piHuntRecommended: undefined,
      piHuntAllAnimals: undefined,
      herdName: undefined
    })
    expect(createMessageRequestEntry).toHaveBeenCalledWith(mockDb, {
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      messageType: 'statusChange-IN_CHECK',
      data: {
        email: 'willowfarm@gmail.com',
        orgEmail: 'willowfarm@gmail.com',
        crn: '1100014934',
        sbi: '106705779',
        claimType: 'REVIEW',
        typeOfLivestock: 'sheep',
        orgName: 'Willow Farm',
        reviewTestResults: undefined,
        piHuntRecommended: undefined,
        piHuntAllAnimals: undefined,
        herdName: undefined
      }
    })
  })

  test('should not send an evidence email when the claim has previously had a status of in check', async () => {
    const event = {
      body: {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        claimStatus: 'IN_CHECK'
      },
      messageId: 1
    }

    getByClaimRefAndMessageType.mockResolvedValueOnce({
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      messageType: 'statusChange-IN_CHECK',
      data: {
        name: 'Willow Farm',
        orgEmail: 'willowfarm@gmail.com',
        farmerName: 'John Jim Doe',
        email: 'john.doe@gmail.com'
      }
    })

    await processInCheckStatusMessageForEvidenceEmail(event, mockedLogger, mockDb)

    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith(
      mockDb,
      'TEMP-O9UD-22F6',
      'statusChange-IN_CHECK'
    )
    expect(getLatestContactDetails).toHaveBeenCalledTimes(0)
    expect(sendEvidenceEmail).toHaveBeenCalledTimes(0)
    expect(createMessageRequestEntry).toHaveBeenCalledTimes(0)
  })

  test('should not send an evidence email when the evidence email feature flag is not enabled', async () => {
    const event = {
      body: {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        claimStatus: 'IN_CHECK',
        claimType: 'REVIEW',
        typeOfLivestock: 'dairy'
      },
      messageId: 1
    }

    config.set('evidenceEmailEnabled', false)

    await processInCheckStatusMessageForEvidenceEmail(event, mockedLogger, mockDb)

    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
    expect(getByClaimRefAndMessageType).toHaveBeenCalledTimes(0)
    expect(getLatestContactDetails).toHaveBeenCalledTimes(0)
    expect(sendEvidenceEmail).toHaveBeenCalledTimes(0)
    expect(createMessageRequestEntry).toHaveBeenCalledTimes(0)
  })
})
