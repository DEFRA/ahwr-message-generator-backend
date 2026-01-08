import { validateStatusMessageRequest } from './inbound-status-message.js'

const mockedLogger = {
  error: jest.fn()
}

const validInputMessage = {
  crn: 1050000003,
  sbi: 105000003,
  agreementReference: 'IAHW-ABCD-3FGH',
  claimReference: 'FUDC-N87C-PIN5',
  claimStatus: 'IN_CHECK',
  claimType: 'REVIEW',
  typeOfLivestock: 'beef',
  dateTime: new Date(),
  herdName: 'Commercial herd'
}

describe('validateStatusMessageRequest', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('returns true if the validation is successful', () => {
    expect(validateStatusMessageRequest(mockedLogger, validInputMessage)).toBeTruthy()
    expect(mockedLogger.error).toHaveBeenCalledTimes(0)
  })

  test('returns true if the validation is successful, including optional amount', () => {
    expect(
      validateStatusMessageRequest(mockedLogger, {
        ...validInputMessage,
        claimAmount: 456
      })
    ).toBeTruthy()
    expect(mockedLogger.error).toHaveBeenCalledTimes(0)
  })

  describe('invalid input message produce validation error', () => {
    function expectFalseyResultAndValidationErrorSetInLogBinding(message) {
      expect(validateStatusMessageRequest(mockedLogger, message)).toBeFalsy()
      expect(mockedLogger.error).toHaveBeenCalledTimes(1)
      expect(mockedLogger.error).toHaveBeenCalledWith(
        {
          error: expect.any(Object),
          event: expect.objectContaining({
            type: 'exception',
            category: 'fail-validation',
            kind: 'inbound-status-message-validation',
            reason: expect.any(String)
          })
        },
        'Inbound status message validation error'
      )
    }

    test('returns false when validation fails due to missing required field', () => {
      const invalidMessage = { ...validInputMessage }
      delete invalidMessage.sbi

      expectFalseyResultAndValidationErrorSetInLogBinding(invalidMessage)
    })

    test('returns false when validation fails due to invalid CRN field', () => {
      const invalidMessage = { ...validInputMessage, crn: 100 }

      expectFalseyResultAndValidationErrorSetInLogBinding(invalidMessage)
    })

    test('returns false when validation fails due to invalid SBI field', () => {
      const invalidMessage = { ...validInputMessage, sbi: 100 }

      expectFalseyResultAndValidationErrorSetInLogBinding(invalidMessage)
    })

    test('returns false when validation fails due to invalid claimReference field', () => {
      const invalidMessage = {
        ...validInputMessage,
        claimReference: 'TOO-SHORT'
      }

      expectFalseyResultAndValidationErrorSetInLogBinding(invalidMessage)
    })

    test('returns false when validation fails due to invalid agreementReference field', () => {
      const invalidMessage = {
        ...validInputMessage,
        agreementReference: 'TOO-SHORT'
      }

      expectFalseyResultAndValidationErrorSetInLogBinding(invalidMessage)
    })

    test('returns false when validation fails due to invalid dateTime field', () => {
      const invalidMessage = { ...validInputMessage, dateTime: 'notADate' }

      expectFalseyResultAndValidationErrorSetInLogBinding(invalidMessage)
    })

    test('returns false when validation fails due to invalid herdName field', () => {
      const invalidMessage = { ...validInputMessage, herdName: 1 }

      expectFalseyResultAndValidationErrorSetInLogBinding(invalidMessage)
    })

    test('returns false when validation fails due to missing herdName', () => {
      const invalidMessage = { ...validInputMessage, herdName: undefined }

      expectFalseyResultAndValidationErrorSetInLogBinding(invalidMessage)
    })
  })

  test('CRN is optional, validation returns true when missing', () => {
    const stillValidMessage = { ...validInputMessage }
    delete stillValidMessage.crn
    expect(validateStatusMessageRequest(mockedLogger, stillValidMessage)).toBeTruthy()
    expect(mockedLogger.error).toHaveBeenCalledTimes(0)
  })
})
