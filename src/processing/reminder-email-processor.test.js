import { config } from '../config.js'
import {
  databaseMessageType,
  processReminderEmailMessage
} from './reminder-email-processor.js'
import {
  createMessageRequestEntry,
  reminderEmailAlreadySent
} from '../repositories/message-generation-repository.js'
import { sendSFDCommsRequest } from '../messaging/send-sfd-comms-request.js'

jest.mock('../repositories/message-generation-repository.js')
jest.mock('../messaging/send-sfd-comms-request.js')

const mockLogger = {
  setBindings: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}

const mockDb = {}

describe('processReminderEmailMessage', () => {
  beforeEach(() => {
    config.set('notify.replyToIdNoReply', 'no-reply@example.com')
    config.set('reminderEmailEnabled', true)
    config.set(
      'notify.templates.reminderNotClaimedTemplateId',
      'ba2bfa67-6cc8-4536-990d-5333019ed710'
    )
    reminderEmailAlreadySent.mockResolvedValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
    sendSFDCommsRequest.mockReset()
  })

  test('when toggled off, processing skipped and message logged', async () => {
    const event = {
      reminderType: 'notClaimed_threeMonths',
      agreementReference: 'IAHW-BEKR-AWIU',
      crn: '1100407200',
      sbi: '106282723',
      emailAddresses: ['fake-email@example.com']
    }

    config.set('reminderEmailEnabled', false)

    await processReminderEmailMessage(mockDb, event, mockLogger)

    expect(mockLogger.setBindings).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Skipping sending reminder email, feature flag is not enabled'
    )
    expect(reminderEmailAlreadySent).toHaveBeenCalledTimes(0)
    expect(sendSFDCommsRequest).toHaveBeenCalledTimes(0)
    expect(createMessageRequestEntry).toHaveBeenCalledTimes(0)
  })

  test('when reminder message contains invalid reminder parent/sub type, processing skipped and message logged', async () => {
    const event = {
      reminderType: 'notClaimed_invalidSubType',
      agreementReference: 'IAHW-BEKR-AWIU',
      crn: '1100407200',
      sbi: '106282723',
      emailAddresses: ['fake-email@example.com']
    }

    await processReminderEmailMessage(mockDb, event, mockLogger)

    expect(mockLogger.setBindings).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Skipping sending reminder email, unrecognised reminder parent/sub type provided'
    )
    expect(reminderEmailAlreadySent).toHaveBeenCalledTimes(0)
    expect(sendSFDCommsRequest).toHaveBeenCalledTimes(0)
    expect(createMessageRequestEntry).toHaveBeenCalledTimes(0)
  })

  test('when reminder emails already exists, processing skipped and message logged', async () => {
    const message = {
      reminderType: 'notClaimed_threeMonths',
      agreementReference: 'IAHW-BEKR-AWIU',
      crn: '1100407200',
      sbi: '106282723',
      emailAddresses: ['fake-email@example.com']
    }
    reminderEmailAlreadySent.mockResolvedValueOnce(true)

    await processReminderEmailMessage(mockDb, message, mockLogger)

    expect(mockLogger.setBindings).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Skipping sending reminder email, already been processed'
    )
    expect(reminderEmailAlreadySent).toHaveBeenCalledTimes(1)
    expect(reminderEmailAlreadySent).toHaveBeenCalledWith(
      mockDb,
      message.agreementReference,
      databaseMessageType,
      message.reminderType
    )
    expect(sendSFDCommsRequest).toHaveBeenCalledTimes(0)
    expect(createMessageRequestEntry).toHaveBeenCalledTimes(0)
  })

  test('request sent to messaging proxy and stored in database for each email provided', async () => {
    const message = {
      reminderType: 'notClaimed_threeMonths',
      agreementReference: 'IAHW-BEKR-AWIU',
      crn: '1100407200',
      sbi: '106282723',
      emailAddresses: ['fake-email-1@example.com', 'fake-email-2@example.com']
    }

    await processReminderEmailMessage(mockDb, message, mockLogger)

    expect(mockLogger.setBindings).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Processing reminder email message'
    )
    expect(mockLogger.info).toHaveBeenCalledWith('Sent reminder email')
    expect(reminderEmailAlreadySent).toHaveBeenCalledTimes(1)
    expect(reminderEmailAlreadySent).toHaveBeenCalledWith(
      mockDb,
      message.agreementReference,
      databaseMessageType,
      message.reminderType
    )
    expect(sendSFDCommsRequest).toHaveBeenCalledTimes(2)

    expect(createMessageRequestEntry).toHaveBeenCalledTimes(2)
    expect(createMessageRequestEntry).toHaveBeenCalledWith(mockDb, {
      agreementReference: 'IAHW-BEKR-AWIU',
      data: {
        agreementReference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        emailAddress: 'fake-email-1@example.com',
        reminderType: 'notClaimed_threeMonths',
        customParams: {
          agreementReference: 'IAHW-BEKR-AWIU'
        },
        emailReplyToId: 'no-reply@example.com',
        notifyTemplateId: 'ba2bfa67-6cc8-4536-990d-5333019ed710'
      },
      messageType: databaseMessageType
    })
    expect(createMessageRequestEntry).toHaveBeenCalledWith(mockDb, {
      agreementReference: 'IAHW-BEKR-AWIU',
      data: {
        agreementReference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        emailAddress: 'fake-email-2@example.com',
        reminderType: 'notClaimed_threeMonths',
        customParams: {
          agreementReference: 'IAHW-BEKR-AWIU'
        },
        emailReplyToId: 'no-reply@example.com',
        notifyTemplateId: 'ba2bfa67-6cc8-4536-990d-5333019ed710'
      },
      messageType: databaseMessageType
    })

    expect(mockLogger.info).toHaveBeenCalledWith({
      event: {
        type: 'reminder-email-send-proxy',
        outcome: true,
        reference: 'IAHW-BEKR-AWIU',
        kind: 'ba2bfa67-6cc8-4536-990d-5333019ed710',
        category: message.reminderType
      }
    })
  })

  test('exception thrown when comms with messaging proxy fail and nothing is stored in database to allow retry', async () => {
    const message = {
      reminderType: 'notClaimed_threeMonths',
      agreementReference: 'IAHW-BEKR-AWIU',
      crn: '1100407200',
      sbi: '106282723',
      emailAddresses: ['fake-email-1@example.com']
    }

    const error = new Error('Fake failed comms')
    sendSFDCommsRequest.mockRejectedValueOnce(error)

    try {
      await processReminderEmailMessage(mockDb, message, mockLogger)
    } catch (e) {
      expect(mockLogger.setBindings).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Processing reminder email message'
      )

      expect(reminderEmailAlreadySent).toHaveBeenCalledTimes(1)
      expect(sendSFDCommsRequest).toHaveBeenCalledTimes(1)
      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          error,
          event: {
            severity: 'error',
            type: 'exception',
            category: 'failed-processing'
          }
        },
        'Failed to send reminder email'
      )
      expect(createMessageRequestEntry).toHaveBeenCalledTimes(0)
    }
  })
})
