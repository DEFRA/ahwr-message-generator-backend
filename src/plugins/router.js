import { health } from '../routes/health.js'
import { redactPiiHandlers } from '../routes/redact-pii.js'

const router = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route([health].concat(redactPiiHandlers))
    }
  }
}

export { router }
