import { createHash } from 'crypto';

const MERCHANT_LOGIN = () => process.env.ROBOKASSA_LOGIN || '';
const PASSWORD1 = () => process.env.ROBOKASSA_PASSWORD1 || '';
const PASSWORD2 = () => process.env.ROBOKASSA_PASSWORD2 || '';
const IS_TEST = () => process.env.ROBOKASSA_TEST === '1';
const SITE_URL = () => process.env.SITE_URL || 'https://21day.club';

function md5(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

export function generatePaymentUrl(amount: number, invId: number, description: string): string {
  const outSum = amount.toFixed(2);
  // MD5 signature: MerchantLogin:OutSum:InvId:Password1
  const signature = md5(`${MERCHANT_LOGIN()}:${outSum}:${invId}:${PASSWORD1()}`);

  const baseUrl = 'https://auth.robokassa.ru/Merchant/Index.aspx';

  const params = new URLSearchParams({
    MerchantLogin: MERCHANT_LOGIN(),
    OutSum: outSum,
    InvId: String(invId),
    Description: description,
    SignatureValue: signature,
    Culture: 'ru',
    Encoding: 'utf-8',
  });

  if (IS_TEST()) {
    params.set('IsTest', '1');
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Verify ResultURL signature: MD5(OutSum:InvId:Password2)
 */
export function verifyResultSignature(outSum: string, invId: string, signatureValue: string): boolean {
  const expected = md5(`${outSum}:${invId}:${PASSWORD2()}`);
  return expected.toLowerCase() === signatureValue.toLowerCase();
}

/**
 * Verify SuccessURL signature: MD5(OutSum:InvId:Password1)
 */
export function verifySuccessSignature(outSum: string, invId: string, signatureValue: string): boolean {
  const expected = md5(`${outSum}:${invId}:${PASSWORD1()}`);
  return expected.toLowerCase() === signatureValue.toLowerCase();
}
