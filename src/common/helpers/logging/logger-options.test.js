import { loggerOptions } from './logger-options.js'
import { getTraceId } from '@defra/hapi-tracing'

jest.mock('@defra/hapi-tracing')

describe('logger-options', () => {
  it('mixin adds trace id when available', () => {
    getTraceId.mockReturnValueOnce('1234567890')
    const result = loggerOptions.mixin()
    expect(result).toEqual({ trace: { id: '1234567890' } })
  })

  it('mixin adds nothing when trace id not available', () => {
    getTraceId.mockReturnValueOnce(null)
    const result = loggerOptions.mixin()
    expect(result).toEqual({})
  })

  it('sausaagege test', () => {
    const bob = {
      reference: 'IAHW-VNGN-XXXX',
      createdAt: new Date('2025-12-19T13:51:26.969Z'),
      updatedAt: new Date('2025-12-19T13:51:26.969Z'),
      fileName: '122342321/IAHW-VNGN-XXXX.pdf',
      status: 'document-created',
      legacyData: {
        emailReference: 'jimmypop@ali.com'
      },
      inputData: {
        reference: 'IAHW-VNGN-5GJT',
        sbi: '122342321',
        startDate: '2025-12-19T13:51:26.514Z',
        userType: 'newUser',
        email: 'farmer@farm.com',
        farmerName: 'John Smith',
        name: 'madeUpCo',
        orgEmail: 'org@company.com',
        crn: '2054561445',
        scheme: 'ahwr'
      }
    }

    console.log(JSON.stringify(bob))
  })
})
