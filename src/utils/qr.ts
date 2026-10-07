import QRCode from 'qrcode';

/** Payload QR verifikasi → dataURL PNG. Dipakai saat signing & fallback surat lama. */
export const makeQrDataUrl = async (text: string): Promise<string> =>
  QRCode.toDataURL(text, { width: 220, margin: 1 });
