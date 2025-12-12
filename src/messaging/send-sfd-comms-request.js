import { v4 as uuidv4 } from 'uuid'
import { validateSFDSchema } from './schemas/submit-sfd-schema.js'
import { publishMessage, setupClient } from 'ffc-ahwr-common-library'
import { getLogger } from '../common/helpers/logging/logger.js'
import { config } from '../config.js'

const sfdRequestMsgType = config.get('outboundMessage.eventType')

let clientConfigured

export const sendSFDCommsRequest = async (params) => {
  configureClient()
  const {
    crn,
    sbi,
    agreementReference,
    claimReference,
    notifyTemplateId,
    emailReplyToId,
    emailAddress,
    customParams,
    logger
  } = params

  const sfdMessage = {
    crn,
    sbi,
    agreementReference,
    claimReference,
    notifyTemplateId,
    emailReplyToId,
    emailAddress,
    customParams,
    dateTime: new Date().toISOString()
  }

  const attributes = {
    eventType: sfdRequestMsgType,
    messageId: uuidv4()
  }

  if (validateSFDSchema(sfdMessage, logger)) {
    await publishMessage(sfdMessage, attributes)
  } else {
    throw new Error('SFD validation error')
  }
}

function configureClient() {
  if (!clientConfigured) {
    setupClient(
      config.get('aws.region'),
      config.get('aws.endpointUrl'),
      getLogger(),
      config.get('outboundMessage.sfdCommsTopic')
    )
    clientConfigured = true
  }
}
