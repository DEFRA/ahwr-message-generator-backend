import joi from 'joi'

const nineDigitId = joi.string().pattern(/^\d{9}$/)
const tenDigitId = joi.string().pattern(/^\d{10}$/)
const email = joi.string().email({ tlds: false })

const CLAIM_REFERENCE_LENGTH = 14

const submitSFDSchema = joi.object({
  crn: tenDigitId,
  sbi: nineDigitId.required(),
  agreementReference: joi.string().required(),
  claimReference: joi.string().max(CLAIM_REFERENCE_LENGTH),
  notifyTemplateId: joi.string().guid({ version: 'uuidv4' }).required(),
  emailReplyToId: joi.string().guid({ version: 'uuidv4' }).optional(),
  emailAddress: email.required(),
  customParams: joi.object().required(),
  dateTime: joi.date().required()
})

export const validateSFDSchema = (event, logger) => {
  const validate = submitSFDSchema.validate(event)

  if (validate.error) {
    logger.warn(validate.error, 'Submit SFD message validation error:')
    return false
  }
  return true
}
