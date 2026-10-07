export type TteProviderId = 'mock' | 'bsre';

export interface TteSignInput {
  pdfBytes: Uint8Array;
  fileName: string;
  signerName: string;
  signerNip?: string;
  /** Kode verifikasi yang sudah dibuat sebelum PDF dirender (QR sudah ada di dalam PDF). */
  verifyCode: string;
}

export interface TteSignResult {
  provider: TteProviderId;
  /** PDF final hasil penandatanganan (mock: PDF yang sama, byte identik). */
  signedPdfBase64: string;
  /** URL verifikasi publik; kosong untuk mock (payload QR = kode verifikasi). */
  verifyUrl?: string;
}

export interface TteVerifyResult {
  valid: boolean;
  message: string;
}

export interface TteProvider {
  readonly id: TteProviderId;
  sign(input: TteSignInput): Promise<TteSignResult>;
  verify(code: string): Promise<TteVerifyResult>;
}
