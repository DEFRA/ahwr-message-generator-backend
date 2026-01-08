import { formatBullets, sendEvidenceEmail } from './evidence-email.js'
import { TYPE_OF_LIVESTOCK } from 'ffc-ahwr-common-library'
import {
  REVIEW_CATTLE,
  FOLLOW_UP_CATTLE_POSITIVE,
  FOLLOW_UP_CATTLE_NEGATIVE_RECOMMENDED_PI_HUNT,
  FOLLOW_UP_CATTLE_NEGATIVE,
  FOLLOW_UP_PIGS,
  FOLLOW_UP_SHEEP,
  REVIEW_PIGS,
  REVIEW_SHEEP
} from './bullet-points.js'
import { config } from '../../config.js'
import { sendSFDCommsRequest } from '../../messaging/send-sfd-comms-request.js'

const { BEEF, DAIRY, PIGS, SHEEP } = TYPE_OF_LIVESTOCK

jest.mock('../../messaging/send-sfd-comms-request.js')

const mockLogger = {
  info: jest.fn(),
  error: jest.fn()
}

const baseParams = {
  emailAddress: 'test@example.com',
  agreementReference: 'AHWR-0AD3-3322',
  claimReference: 'TEMP-O9UD-22F6',
  crn: '1100014934',
  sbi: '106705779',
  addressType: 'email',
  orgName: 'Willow Farm',
  herdName: 'Commercial herd',
  logger: mockLogger
}

describe('sendEvidenceEmail', () => {
  beforeAll(() => {
    config.set('notify.templates.evidenceReviewTemplateId', '550e8400-e29b-41d4-a716-446655440000')
    config.set(
      'notify.templates.evidenceFollowUpTemplateId',
      '111e8400-e29b-41d4-a716-446655440000'
    )
    config.set('notify.replyToId', 'email-reply-to-id')
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Review Emails', () => {
    test.each([
      {
        livestock: BEEF,
        expectedBullets: formatBullets(REVIEW_CATTLE),
        speciesLabel: 'Beef cattle'
      },
      {
        livestock: DAIRY,
        expectedBullets: formatBullets(REVIEW_CATTLE),
        speciesLabel: 'Dairy cattle'
      },
      {
        livestock: PIGS,
        expectedBullets: formatBullets(REVIEW_PIGS),
        speciesLabel: 'Pigs'
      },
      {
        livestock: SHEEP,
        expectedBullets: formatBullets(REVIEW_SHEEP),
        speciesLabel: 'Sheep'
      },
      { livestock: 'Goats', expectedBullets: '' } // unknown livestock
    ])(
      'should send correct review email for $livestock',
      async ({ livestock, expectedBullets, speciesLabel }) => {
        const params = {
          ...baseParams,
          claimType: 'REVIEW',
          typeOfLivestock: livestock
        }

        await sendEvidenceEmail(params)

        expect(sendSFDCommsRequest).toHaveBeenCalledTimes(1)
        expect(sendSFDCommsRequest).toHaveBeenCalledWith({
          crn: params.crn,
          sbi: params.sbi,
          emailAddress: params.emailAddress,
          emailReplyToId: 'email-reply-to-id',
          agreementReference: params.agreementReference,
          claimReference: params.claimReference,
          notifyTemplateId: '550e8400-e29b-41d4-a716-446655440000',
          customParams: {
            sbi: params.sbi,
            orgName: params.orgName,
            claimReference: params.claimReference,
            agreementReference: params.agreementReference,
            customSpeciesBullets: expectedBullets,
            herdName: params.herdName,
            herdNameLabel: livestock === SHEEP ? 'Flock name' : 'Herd name',
            species: speciesLabel
          },
          logger: mockLogger
        })

        expect(mockLogger.info).toHaveBeenCalledWith({
          event: {
            type: 'evidence-email-requested-review',
            category: `${livestock} - templateId:550e8400-e29b-41d4-a716-446655440000`,
            kind: params.addressType,
            outcome: true,
            reference: params.claimReference
          }
        })

        expect(mockLogger.info).toHaveBeenCalledWith(`Sending ${params.addressType} evidence email`)
        expect(mockLogger.info).toHaveBeenCalledWith(`Sent ${params.addressType} evidence email`)
        expect(mockLogger.error).not.toHaveBeenCalled()
      }
    )
  })

  describe('Follow-up Emails', () => {
    test('should send correct follow-up email for CATTLE (Positive)', async () => {
      const params = {
        ...baseParams,
        claimType: 'FOLLOW_UP',
        typeOfLivestock: BEEF,
        reviewTestResults: 'positive',
        piHuntRecommended: 'no'
      }

      await sendEvidenceEmail(params)

      expect(sendSFDCommsRequest).toHaveBeenCalledTimes(1)
      expect(sendSFDCommsRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          notifyTemplateId: '111e8400-e29b-41d4-a716-446655440000',
          customParams: expect.objectContaining({
            customSpeciesBullets: formatBullets(FOLLOW_UP_CATTLE_POSITIVE),
            herdName: 'Commercial herd',
            herdNameLabel: 'Herd name',
            species: 'Beef cattle'
          })
        })
      )

      expect(mockLogger.info).toHaveBeenCalledWith({
        event: {
          type: 'evidence-email-requested-follow_up',
          category: 'beef - templateId:111e8400-e29b-41d4-a716-446655440000',
          kind: params.addressType,
          outcome: true,
          reference: params.claimReference
        }
      })

      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    test('should send correct follow-up email for CATTLE (Negative, No PI Hunt Recommended)', async () => {
      const params = {
        ...baseParams,
        claimType: 'FOLLOW_UP',
        typeOfLivestock: DAIRY,
        reviewTestResults: 'negative',
        piHuntRecommended: 'no'
      }

      await sendEvidenceEmail(params)

      expect(sendSFDCommsRequest).toHaveBeenCalledTimes(1)
      expect(sendSFDCommsRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          notifyTemplateId: '111e8400-e29b-41d4-a716-446655440000',
          customParams: expect.objectContaining({
            customSpeciesBullets: formatBullets(FOLLOW_UP_CATTLE_NEGATIVE),
            species: 'Dairy cattle'
          })
        })
      )
      expect(mockLogger.info).toHaveBeenCalledWith({
        event: {
          type: 'evidence-email-requested-follow_up',
          category: 'dairy - templateId:111e8400-e29b-41d4-a716-446655440000',
          kind: params.addressType,
          outcome: true,
          reference: params.claimReference
        }
      })
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    test('should send correct follow-up email for CATTLE (Negative, PI Hunt Recommended)', async () => {
      const params = {
        ...baseParams,
        claimType: 'FOLLOW_UP',
        typeOfLivestock: BEEF,
        reviewTestResults: 'negative',
        piHuntRecommended: 'yes',
        piHuntAllAnimals: 'yes'
      }

      await sendEvidenceEmail(params)

      expect(sendSFDCommsRequest).toHaveBeenCalledTimes(1)
      expect(sendSFDCommsRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          notifyTemplateId: '111e8400-e29b-41d4-a716-446655440000',
          customParams: expect.objectContaining({
            customSpeciesBullets: formatBullets(FOLLOW_UP_CATTLE_NEGATIVE_RECOMMENDED_PI_HUNT)
          })
        })
      )
      expect(mockLogger.info).toHaveBeenCalledWith({
        event: {
          type: 'evidence-email-requested-follow_up',
          category: 'beef - templateId:111e8400-e29b-41d4-a716-446655440000',
          kind: params.addressType,
          outcome: true,
          reference: params.claimReference
        }
      })
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    test('should send correct follow-up email for PIGS', async () => {
      const params = {
        ...baseParams,
        claimType: 'FOLLOW_UP',
        typeOfLivestock: PIGS
      }

      await sendEvidenceEmail(params)

      expect(sendSFDCommsRequest).toHaveBeenCalledTimes(1)
      expect(sendSFDCommsRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          notifyTemplateId: '111e8400-e29b-41d4-a716-446655440000',
          customParams: expect.objectContaining({
            customSpeciesBullets: formatBullets(FOLLOW_UP_PIGS),
            species: 'Pigs'
          })
        })
      )
      expect(mockLogger.info).toHaveBeenCalledWith({
        event: {
          type: 'evidence-email-requested-follow_up',
          category: 'pigs - templateId:111e8400-e29b-41d4-a716-446655440000',
          kind: params.addressType,
          outcome: true,
          reference: params.claimReference
        }
      })
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    test('should send correct follow-up email for SHEEP', async () => {
      const params = {
        ...baseParams,
        claimType: 'FOLLOW_UP',
        typeOfLivestock: SHEEP
      }

      await sendEvidenceEmail(params)

      expect(sendSFDCommsRequest).toHaveBeenCalledTimes(1)
      expect(sendSFDCommsRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          notifyTemplateId: '111e8400-e29b-41d4-a716-446655440000',
          customParams: expect.objectContaining({
            customSpeciesBullets: formatBullets(FOLLOW_UP_SHEEP),
            herdName: 'Commercial herd',
            herdNameLabel: 'Flock name',
            species: 'Sheep'
          })
        })
      )
      expect(mockLogger.info).toHaveBeenCalledWith({
        event: {
          type: 'evidence-email-requested-follow_up',
          category: 'sheep - templateId:111e8400-e29b-41d4-a716-446655440000',
          kind: params.addressType,
          outcome: true,
          reference: params.claimReference
        }
      })
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    test('should send follow-up email with empty bullets for unknown livestock', async () => {
      const params = {
        ...baseParams,
        claimType: 'FOLLOW_UP',
        typeOfLivestock: 'Goat' // Unknown type
      }

      await sendEvidenceEmail(params)

      expect(sendSFDCommsRequest).toHaveBeenCalledTimes(1)
      expect(sendSFDCommsRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          notifyTemplateId: '111e8400-e29b-41d4-a716-446655440000',
          customParams: expect.objectContaining({
            customSpeciesBullets: ''
          })
        })
      )
      expect(mockLogger.info).toHaveBeenCalledWith({
        event: {
          type: 'evidence-email-requested-follow_up',
          category: 'Goat - templateId:111e8400-e29b-41d4-a716-446655440000',
          kind: params.addressType,
          outcome: true,
          reference: params.claimReference
        }
      })
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  test('should track an exception when email fails to send', async () => {
    const error = new Error('Email send failed')
    sendSFDCommsRequest.mockImplementationOnce(() => {
      throw error
    })
    const params = {
      emailAddress: 'test@example.com',
      agreementReference: 'AGR123',
      claimReference: 'CLM456',
      sbi: 'SBI789',
      logger: mockLogger
    }

    await expect(sendEvidenceEmail(params)).rejects.toThrow('Email send failed')

    expect(mockLogger.error).toHaveBeenCalledWith(
      {
        error,
        event: {
          type: 'exception',
          category: 'failed-processing'
        }
      },
      `Error sending ${params.addressType} email. Error: ${error.message}`
    )
  })
})
