import { startServer } from '../../../src/common/helpers/start-server.js'

//  TODO something in this test is causing.. Jest did not exit one second after the test run has completed.
describe('health endpoint test', () => {
  let server

  beforeEach(async () => {
    server = await startServer()
  })

  test('GET /health route returns 200', async () => {
    const options = {
      method: 'GET',
      url: '/health'
    }
    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
  })

  afterEach(async () => {
    if (server) {
      await server.stop()
    }
    jest.clearAllMocks()
  })
})
