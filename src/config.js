import convict from 'convict'
import convictFormatWithValidator from 'convict-format-with-validator'

import { convictValidateMongoUri } from './common/helpers/convict/validate-mongo-uri.js'

convict.addFormat(convictValidateMongoUri)
convict.addFormats(convictFormatWithValidator)

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'
const usePrettyPrint = process.env.USE_PRETTY_PRINT === 'true'

const config = convict({
  serviceVersion: {
    doc: 'The service version, this variable is injected into your docker container in CDP environments',
    format: String,
    nullable: true,
    default: null,
    env: 'SERVICE_VERSION'
  },
  host: {
    doc: 'The IP address to bind',
    format: 'ipaddress',
    default: '0.0.0.0',
    env: 'HOST'
  },
  port: {
    doc: 'The port to bind',
    format: 'port',
    default: 3001,
    env: 'PORT'
  },
  serviceName: {
    doc: 'Api Service Name',
    format: String,
    default: 'ahwr-message-generator-backend'
  },
  evidenceEmailEnabled: {
    doc: 'Is evidence email functionality enabled',
    format: Boolean,
    default: false,
    env: 'EVIDENCE_EMAIL_ENABLED'
  },
  reminderEmailEnabled: {
    doc: 'Is reminder email functionality enabled',
    format: Boolean,
    default: false,
    env: 'REMINDER_EMAIL_ENABLED'
  },
  applicationApiUri: {
    doc: 'URI for AHWR Application Backend API',
    format: String,
    default: 'https://ahwr-application-backend.dev.cdp-int.defra.cloud/api',
    env: 'APPLICATION_API_URI'
  },
  apiKeys: {
    backofficeUi: {
      doc: 'API key to allow backoffice API access',
      format: String,
      default: 'bui-not-set',
      sensitive: true,
      env: 'BACKOFFICE_UI_API_KEY'
    },
    applicationBackEnd: {
      doc: 'API key to allow application backend API access',
      format: String,
      default: 'abe-not-set',
      sensitive: true,
      env: 'APPLICATION_BACKEND_API_KEY'
    },
    messageGenerator: {
      doc: 'Service own API key to hit other backend APIs',
      format: String,
      default: 'own-key-not-set',
      sensitive: true,
      env: 'MESSAGE_GENERATOR_API_KEY'
    }
  },
  notify: {
    carbonCopyEmailAddress: {
      doc: 'Email address to be CCed on all emails sent via Notify',
      format: String,
      default: '',
      env: 'CARBON_COPY_EMAIL_ADDRESS'
    },
    evidenceCarbonCopyEmailAddress: {
      doc: 'Email address to be CCed on all emails sent via Notify for evidence emails',
      format: String,
      default: '',
      env: 'EVIDENCE_CARBON_COPY_EMAIL_ADDRESS'
    },
    replyToId: {
      doc: 'Notify email reply to ID',
      format: String,
      default: '',
      env: 'EMAIL_REPLY_TO_ID'
    },
    replyToIdNoReply: {
      doc: 'Notify email reply to ID for no reply emails',
      format: String,
      default: '',
      env: 'NO_REPLY_EMAIL_REPLY_TO_ID'
    },
    templates: {
      evidenceReviewTemplateId: {
        doc: 'Notify email template ID for review evidence emails',
        format: String,
        default: '',
        env: 'EVIDENCE_REVIEW_TEMPLATE_ID'
      },
      evidenceFollowUpTemplateId: {
        doc: 'Notify email template ID for follow up evidence emails',
        format: String,
        default: '',
        env: 'EVIDENCE_FOLLOW_UP_TEMPLATE_ID'
      },
      newReviewClaimTemplateId: {
        doc: 'Notify email template ID for new review claim emails',
        format: String,
        default: '',
        env: 'NEW_REVIEW_CLAIM_TEMPLATE_ID'
      },
      newFollowUpClaimTemplateId: {
        doc: 'Notify email template ID for new follow up claim emails',
        format: String,
        default: '',
        env: 'NEW_FOLLOW_UP_CLAIM_TEMPLATE_ID'
      },
      reminderNotClaimedTemplateId: {
        doc: 'Notify email template ID for not claimed reminders',
        format: String,
        default: '',
        env: 'REMINDER_EMAIL_NOT_CLAIMED_TEMPLATE_ID'
      },
      newUserAgreementTemplateId: {
        doc: 'Notify email template ID for new user agreement emails',
        format: String,
        default: '',
        env: 'NEW_USER_AGREEMENT_TEMPLATE_ID'
      },
      existingUserAgreementTemplateId: {
        doc: 'Notify email template ID for existing user agreement emails',
        format: String,
        default: '',
        env: 'EXISTING_USER_AGREEMENT_TEMPLATE_ID'
      }
    }
  },
  cdpEnvironment: {
    doc: 'The CDP environment the app is running in. With the addition of "local" for local development',
    format: ['local', 'infra-dev', 'management', 'dev', 'test', 'perf-test', 'ext-test', 'prod'],
    default: 'local',
    env: 'ENVIRONMENT'
  },
  inboundMessage: {
    types: {
      documentCreated: {
        doc: 'Messages from ahwr_document_created subscription',
        format: String,
        default: 'uk.gov.ffc.ahwr.document.created',
        env: 'INBOUND_MESSAGE_DOCUMENT_CREATED'
      },
      statusUpdate: {
        doc: 'Messages from ahwr_status_update subscription',
        format: String,
        default: 'uk.gov.ffc.ahwr.claim.status.update',
        env: 'INBOUND_MESSAGE_STATUS_UPDATE'
      },
      reminderRequest: {
        doc: 'Messages from ahwr_reminder_request subscription',
        format: String,
        default: 'uk.gov.ffc.ahwr.reminder.request',
        env: 'INBOUND_MESSAGE_REMINDER_REQUEST'
      }
    },
    sqs: {
      queueUrl: {
        doc: 'URL of the SQS queue to receive message generator requests from',
        format: String,
        default: '#',
        env: 'MESSAGE_GENERATOR_QUEUE_URL'
      }
    }
  },
  outboundMessage: {
    sfdCommsTopic: {
      doc: 'Topic name to send SFD comms proxy requests to',
      format: String,
      default: 'ahwr_message_request',
      env: 'MESSAGE_REQUEST_TOPIC_ARN'
    },
    eventType: {
      doc: 'SFD proxy requests message type',
      format: String,
      default: 'uk.gov.ffc.ahwr.submit.sfd.message.request',
      env: 'SFD_PROXY_MESSAGE_TYPE'
    }
  },
  aws: {
    region: {
      doc: 'AWS region',
      format: String,
      default: 'eu-west-2',
      env: 'AWS_REGION'
    },
    endpointUrl: {
      doc: 'AWS endpoint URL',
      format: String,
      default: null,
      nullable: true,
      env: 'AWS_ENDPOINT_URL'
    }
  },
  s3: {
    bucketName: {
      doc: 'Document S3 bucket name',
      format: String,
      default: 'document-bucket',
      env: 'DOCUMENT_BUCKET_NAME'
    },
    forcePathStyle: {
      doc: 'Force path style on S3 bucket',
      format: Boolean,
      default: true,
      env: 'FORCE_PATH_STYLE'
    }
  },
  log: {
    isEnabled: {
      doc: 'Is logging enabled',
      format: Boolean,
      default: !isTest,
      env: 'LOG_ENABLED'
    },
    level: {
      doc: 'Logging level',
      format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: 'info',
      env: 'LOG_LEVEL'
    },
    format: {
      doc: 'Format to output logs in',
      format: ['ecs', 'pino-pretty'],
      default: usePrettyPrint ? 'pino-pretty' : 'ecs',
      env: 'LOG_FORMAT'
    },
    redact: {
      doc: 'Log paths to redact',
      format: Array,
      default: isProduction
        ? ['req.headers.authorization', 'req.headers.cookie', 'res.headers']
        : ['req', 'res', 'responseTime']
    }
  },
  mongo: {
    mongoUrl: {
      doc: 'URI for mongodb',
      format: String,
      default: 'mongodb://127.0.0.1:27017/',
      env: 'MONGO_URI'
    },
    databaseName: {
      doc: 'database for mongodb',
      format: String,
      default: 'ahwr-message-generator-backend',
      env: 'MONGO_DATABASE'
    },
    mongoOptions: {
      retryWrites: {
        doc: 'Enable Mongo write retries, overrides mongo URI when set.',
        format: Boolean,
        default: null,
        nullable: true,
        env: 'MONGO_RETRY_WRITES'
      },
      readPreference: {
        doc: 'Mongo read preference, overrides mongo URI when set.',
        format: ['primary', 'primaryPreferred', 'secondary', 'secondaryPreferred', 'nearest'],
        default: null,
        nullable: true,
        env: 'MONGO_READ_PREFERENCE'
      }
    }
  },
  httpProxy: {
    doc: 'HTTP Proxy URL',
    format: String,
    nullable: true,
    default: null,
    env: 'HTTP_PROXY'
  },
  isMetricsEnabled: {
    doc: 'Enable metrics reporting',
    format: Boolean,
    default: isProduction,
    env: 'ENABLE_METRICS'
  },
  tracing: {
    header: {
      doc: 'CDP tracing header name',
      format: String,
      default: 'x-cdp-request-id',
      env: 'TRACING_HEADER'
    }
  }
})

config.validate({ allowed: 'strict' })

export { config }
