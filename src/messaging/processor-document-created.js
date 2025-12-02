// import { config } from '../config.js'
// import {
//   getByClaimRefAndMessageType,
//   createMessageRequestEntry
// } from '../repositories/message-generate-repository.js'
// import { getLatestContactDetails } from '../api/application-api.js'
// import {
//   AddressType,
//   getHerdNameLabel,
//   LIVESTOCK_TO_READABLE_SPECIES
// } from '../constants.js'
// import { sendSFDEmail } from '../lib/sfd-client.js'
// import appInsights from 'applicationinsights'

// const MESSAGE_TYPE = 'claimCreated'

export const processMessage = async (message, logger, _db) => {
  logger.info(
    `DOCUMENT_CREATED - Received message to process: ${JSON.stringify(message)}`
  )
  // const {
  //   carbonCopyEmailAddress,
  //   reviewCompleteTemplateId,
  //   followupCompleteTemplateId,
  //   noReplyEmailReplyToId
  // } = config
  // const {
  //   agreementReference,
  //   claimReference,
  //   sbi,
  //   crn,
  //   claimType,
  //   typeOfLivestock,
  //   reviewTestResults,
  //   herdName,
  //   claimAmount
  // } = message.body
  // const messageGenerate = await getByClaimRefAndMessageType(
  //   claimReference,
  //   MESSAGE_TYPE
  // )
  // if (!messageGenerate) {
  //   const contactDetails = await getLatestContactDetails(
  //     agreementReference,
  //     logger
  //   )
  //   const { name: orgName, orgEmail, email } = contactDetails
  //   const requestParams = {
  //     agreementReference,
  //     claimReference,
  //     crn,
  //     sbi,
  //     claimType,
  //     typeOfLivestock,
  //     reviewTestResults,
  //     logger,
  //     herdName,
  //     claimAmount,
  //     emailReplyToId: noReplyEmailReplyToId,
  //     notifyTemplateId:
  //       claimType === 'E'
  //         ? followupCompleteTemplateId
  //         : reviewCompleteTemplateId
  //   }
  //   if (carbonCopyEmailAddress) {
  //     await sendClaimConfirmationEmail({
  //       ...requestParams,
  //       emailAddress: carbonCopyEmailAddress,
  //       addressType: AddressType.CC
  //     })
  //   }
  //   if (orgEmail) {
  //     await sendClaimConfirmationEmail({
  //       ...requestParams,
  //       emailAddress: orgEmail,
  //       addressType: AddressType.ORG_EMAIL
  //     })
  //   }
  //   if (email && email !== orgEmail) {
  //     await sendClaimConfirmationEmail({
  //       ...requestParams,
  //       emailAddress: email,
  //       addressType: AddressType.EMAIL
  //     })
  //   }
  //   await createMessageRequestEntry({
  //     agreementReference,
  //     claimReference,
  //     messageType: MESSAGE_TYPE,
  //     data: {
  //       crn,
  //       sbi,
  //       orgName,
  //       claimType,
  //       typeOfLivestock,
  //       email,
  //       orgEmail,
  //       herdName,
  //       claimAmount
  //     }
  //   })
  // } else {
  //   logger.info('Message has already been processed for claim being created')
  // }
}

// const sendClaimConfirmationEmail = async (params) => {
//   const {
//     crn,
//     sbi,
//     emailAddress,
//     addressType,
//     agreementReference,
//     claimReference,
//     typeOfLivestock,
//     claimAmount,
//     herdName,
//     notifyTemplateId,
//     emailReplyToId,
//     logger
//   } = params

//   logger.info(`Sending ${addressType} new claim email`)

//   try {
//     const customParams = {
//       reference: claimReference,
//       applicationReference: agreementReference,
//       amount: claimAmount,
//       species: LIVESTOCK_TO_READABLE_SPECIES[typeOfLivestock],
//       crn,
//       sbi,
//       herdNameLabel: getHerdNameLabel(typeOfLivestock),
//       herdName
//     }

//     await sendSFDEmail({
//       crn,
//       sbi,
//       agreementReference,
//       claimReference,
//       notifyTemplateId,
//       emailReplyToId,
//       emailAddress,
//       customParams,
//       logger
//     })

//     appInsights.defaultClient?.trackEvent({
//       name: 'claim-email-requested',
//       properties: {
//         status: true,
//         claimReference,
//         addressType,
//         templateId: notifyTemplateId
//       }
//     })

//     logger.info(`Sent ${addressType} new claim email`)
//   } catch (e) {
//     logger.error(e, `Error sending ${addressType} email.`)
//     appInsights.defaultClient.trackException({ exception: e })
//     throw e
//   }
// }
