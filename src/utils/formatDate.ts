const BULAN_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function formatTanggalSurat(value?: string | null): string {
  const raw = (value || '').trim();
  if (!raw) return '';

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso) {
    const bulan = BULAN_ID[Number(iso[2]) - 1];
    return bulan ? `${Number(iso[3])} ${bulan} ${iso[1]}` : raw;
  }

  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(raw);
  if (dmy) {
    const bulan = BULAN_ID[Number(dmy[2]) - 1];
    return bulan ? `${Number(dmy[1])} ${bulan} ${dmy[3]}` : raw;
  }

  const indonesia = /^0?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(raw);
  if (indonesia) {
    return `${Number(indonesia[1])} ${indonesia[2]} ${indonesia[3]}`;
  }

  return raw;
}
