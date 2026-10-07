import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHypPaymentPageParams, decodePaymentReceipt, encodePaymentReceipt, verifyHypReturn } from './hyp'

const fetchMock = vi.fn()
const validReturn = new URLSearchParams('Order=HT-1&Amount=99.00&CCode=0&Sign=valid-signature&Id=transaction-1&ACode=approval-1')

describe('HYP payment verification', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    process.env.HYP_MASOF = 'masof-1'
    process.env.HYP_KEY = 'key-1'
    process.env.HYP_PASSP = 'pass-1'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.HYP_MASOF
    delete process.env.HYP_KEY
    delete process.env.HYP_PASSP
  })

  it('does not accept a forged success redirect', async () => {
    fetchMock.mockResolvedValue(new Response('CCode=902'))

    await expect(verifyHypReturn(
      new URLSearchParams('Order=HT-1&Amount=99&CCode=0&Sign=forged'),
      { orderId: 'HT-1', amount: 99 },
    )).rejects.toMatchObject({ code: 'INVALID_PAYMENT', gatewayCode: '902' })
  })

  it('rejects a signed transaction when its amount differs from the staged amount', async () => {
    fetchMock.mockResolvedValue(new Response('CCode=0'))

    await expect(verifyHypReturn(validReturn, { orderId: 'HT-1', amount: 199 })).rejects.toMatchObject({ code: 'AMOUNT_MISMATCH' })
  })

  it('only returns payment audit fields after a valid HYP verification', async () => {
    fetchMock.mockResolvedValue(new Response('CCode=0'))

    await expect(verifyHypReturn(validReturn, { orderId: 'HT-1', amount: 99 })).resolves.toEqual({
      orderId: 'HT-1',
      amount: 99,
      transactionId: 'transaction-1',
      approvalCode: 'approval-1',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('action=APISign&What=VERIFY&Masof=masof-1&KEY=key-1&PassP=pass-1&Order=HT-1&Amount=99.00'),
      expect.objectContaining({ cache: 'no-store' }),
    )
  })

  it('forwards the original callback query without re-encoding its values', async () => {
    fetchMock.mockResolvedValue(new Response('CCode=0'))
    const rawReturnQuery = 'Id=transaction-1&CCode=0&Amount=99.00&ACode=approval-1&Order=HT-1&Fild1=Jenny%20Parkington&Fild2=jenny%40example.co.il&Fild3=&Sign=valid-signature'

    await verifyHypReturn(new URLSearchParams(rawReturnQuery), { orderId: 'HT-1', amount: 99 }, rawReturnQuery)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`&${rawReturnQuery}`),
      expect.objectContaining({ cache: 'no-store' }),
    )
  })

  it('does not let a query string masquerade as a verified payment receipt', () => {
    expect(decodePaymentReceipt(encodePaymentReceipt({ orderId: 'HT-1', amount: 99 }))).toEqual({ orderId: 'HT-1', amount: 99 })
    expect(decodePaymentReceipt('{"Order":"HT-1","Amount":"99"}')).toBeNull()
  })

  it('marks a verified business receipt so it cannot clear the retail cart', () => {
    expect(decodePaymentReceipt(encodePaymentReceipt({ orderId: 'HTB-1790000000000-a1b2c3d4', amount: 118, channel: 'business' }))).toEqual({
      orderId: 'HTB-1790000000000-a1b2c3d4', amount: 118, channel: 'business',
    })
  })

  it('creates a minimal UTF-8 payment-page request without unsupported callback fields', () => {
    const params = createHypPaymentPageParams(
      { masof: '0010345518', key: 'key-1', passP: 'pass-1' },
      { orderId: 'HT-1', amount: 99, successUrl: 'https://shop.test/api/hyp-return', errorUrl: 'https://shop.test/api/hyp-return' },
    )

    expect(params.get('MoreData')).toBeNull()
    expect(params.get('Tash')).toBe('1')
    expect(params.get('UTF8')).toBe('True')
    expect(params.get('UTF8out')).toBe('True')
    expect(params.get('SuccessUrl')).toBe('https://shop.test/api/hyp-return')
    expect(params.get('ErrorUrl')).toBe('https://shop.test/api/hyp-return')
  })
})
