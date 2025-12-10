import { validateSFDSchema } from './submit-sfd-schema'
import { ValidationError } from 'joi'

const mockLogger = {
  warn: jest.fn()
}

describe('validateSFDSchema', () => {
  test('should return true for valid input', () => {
    const sfdMessage = {
      crn: '1100014934',
      sbi: '106705779',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      notifyTemplateId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5a5b5',
      emailReplyToId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5aaaa',
      emailAddress: 'user@example.com',
      customParams: {},
      dateTime: new Date().toISOString()
    }

    const result = validateSFDSchema(sfdMessage, mockLogger)

    expect(result).toBe(true)
  })

  test('should return false for invalid crn (not 10 digits)', () => {
    const invalidEvent = {
      crn: '12345',
      sbi: '106705779',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      notifyTemplateId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5a5b5',
      emailReplyToId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5aaaa',
      emailAddress: 'user@example.com',
      customParams: {},
      dateTime: new Date().toISOString()
    }

    const result = validateSFDSchema(invalidEvent, mockLogger)

    expect(result).toBe(false)
  })

  test('should return false for invalid sbi (not 9 digits)', () => {
    const invalidEvent = {
      crn: '1234567890',
      sbi: '12345',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      notifyTemplateId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5a5b5',
      emailReplyToId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5aaaa',
      emailAddress: 'user@example.com',
      customParams: {},
      dateTime: new Date().toISOString()
    }

    const result = validateSFDSchema(invalidEvent, mockLogger)

    expect(result).toBe(false)
  })

  test('should return false for missing required fields', () => {
    const invalidEvent = {
      crn: '1100014934',
      sbi: '106705779',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      emailReplyToId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5aaaa',
      templateId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5a5b5',
      customParams: {},
      dateTime: new Date().toISOString()
    }

    const result = validateSFDSchema(invalidEvent, mockLogger)

    expect(result).toBe(false)
  })

  test('should return false for invalid email address', () => {
    const invalidEvent = {
      crn: '1100014934',
      sbi: '106705779',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      notifyTemplateId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5a5b5',
      emailReplyToId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5aaaa',
      emailAddress: 'invalid-email',
      customParams: {},
      dateTime: new Date().toISOString()
    }

    const result = validateSFDSchema(invalidEvent, mockLogger)

    expect(result).toBe(false)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      new ValidationError('"emailAddress" must be a valid email', []),
      'Submit SFD message validation error:'
    )
  })

  test('should return false for invalid templateId', () => {
    const invalidEvent = {
      crn: '1100014934',
      sbi: '106705779',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      notifyTemplateId: 'invalid-template-id',
      emailReplyToId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5aaaa',
      emailAddress: 'user@example.com',
      customParams: {},
      dateTime: new Date().toISOString()
    }

    const result = validateSFDSchema(invalidEvent, mockLogger)

    expect(result).toBe(false)
  })

  test('should return false for invalid dateTime', () => {
    const invalidEvent = {
      crn: '1100014934',
      sbi: '106705779',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      notifyTemplateId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5a5b5',
      emailReplyToId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5aaaa',
      emailAddress: 'user@example.com',
      customParams: {},
      dateTime: 'invalid-date'
    }

    const result = validateSFDSchema(invalidEvent, mockLogger)

    expect(result).toBe(false)
  })
})
