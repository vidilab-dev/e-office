import { bytesToBase64 } from '../../utils/bytes';
import { TteProvider, TteSignInput, TteSignResult, TteVerifyResult } from './types';

export const mockTteProvider: TteProvider = {
  id: 'mock',

  async sign(input: TteSignInput): Promise<TteSignResult> {
    return {
      provider: 'mock',
      signedPdfBase64: bytesToBase64(input.pdfBytes),
    };
  },

  async verify(code: string): Promise<TteVerifyResult> {
    const trimmed = code.trim();
    if (!trimmed) {
      return { valid: false, message: 'Kode verifikasi kosong.' };
    }
    return {
      valid: true,
      message: 'Provider lokal (Mock): verifikasi dilakukan terhadap basis data dokumen internal PT BIN.',
    };
  },
};
