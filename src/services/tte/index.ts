import { mockTteProvider } from './mockProvider';
import { TteProvider } from './types';

export * from './types';

/**
 * Slot integrasi provider TTE. Fase 0: hanya mock.
 * Fase 1-2: daftarkan BsreProvider di sini dan pilih lewat env TTE_PROVIDER=bsre.
 */
export const getTteProvider = (): TteProvider => {
  const wanted = process.env.NEXT_PUBLIC_TTE_PROVIDER || 'mock';
  if (wanted === 'bsre') {
    // Belum ada kredensial BSrE — jatuh ke mock sampai adapter terpasang.
    return mockTteProvider;
  }
  return mockTteProvider;
};
