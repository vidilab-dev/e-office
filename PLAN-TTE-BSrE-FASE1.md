# Rencana Fase 1-2: Integrasi BSrE (TTE Nyata)

> Status: rencana siap eksekusi. Fase 0 (provider abstraction, PDF pdf-lib, QR asli, hash SHA-256, menu admin + toggle) sudah selesai & teruji.
> Keputusan teknis: **fetch native** (tanpa library BSrE), mode **SignQr visible** di blok tanda tangan.

## Prasyarat data dari kerja sama BSrE (checklist)

- Base URL eSign (`api-bsre.bssn.go.id` atau TLD on-prem) + kredensial **eSign Client** (username/password)
- Akun penandatangan: **NIK** + **passphrase sertifikat** (Direksi) — status dicek via endpoint `Status`
- Aplikasi terdaftar di API Manager BSrE (quota / rate limit)
- Server produksi **HTTPS wajib** (syarat BSrE)

## Langkah 1 — Konfigurasi server (`.env.local`, tidak pernah `NEXT_PUBLIC_`)

```
TTE_PROVIDER=mock|bsre
BSRE_BASE_URL=
BSRE_USERNAME=
BSRE_PASSWORD=
```

## Langkah 2 — Route Handlers (API server pertama di app ini)

- `app/api/tte/status/route.ts` — `GET ?nik=` → status sertifikat (`ISSUE` / `NOT_REGISTERED`) sebagai preflight sebelum bubuh
- `app/api/tte/sign/route.ts` — `POST { pdfBase64, nik, passphrase, visible? }` → server fetch BSrE `SignQr` (params: `tampilan: 'visible'`, `image: false`, `linkQR` = URL verifikasi, `page` + `x/y/w/h` = koordinat blok tanda tangan) → `{ signedPdfBase64, id_dokumen }`
- `app/api/tte/verify/route.ts` — `POST { signedPdfBase64 }` → hasil BSrE `Verify` (document_integrity, TSA, masa berlaku sertifikat, nama signer)
- Kredensial hanya dibaca `process.env` di server; passphrase **tidak disimpan / tidak di-log** — dikirim langsung ke BSrE lalu dibuang

## Langkah 3 — `BsreProvider` + pemilihan provider

- `src/services/tte/bsreProvider.ts` implements `TteProvider` → `sign()` POST ke `/api/tte/sign`, `verify()` ke `/api/tte/verify`; hasil → `TteSignResult { provider: 'bsre', signedPdfBase64, verifyUrl }`
- `getTteProvider()`: ambil mode dari `/api/tte/config` (atau flag publik aman `NEXT_PUBLIC_TTE_PROVIDER`) — mock tetap jalan offline untuk demo

## Langkah 4 — UI penandatanganan (SuratKeluarView + OfficeContext)

1. Klik "Bubuhkan TTE" → **modal passphrase**: prefill NIK dari `currentUser.nip`, input passphrase (password field, tidak di-store), tombol Batal → `tteStatus: 'Gagal'` + pesan BSrE
2. Preflight `Status` → jika `NOT_REGISTERED` tampilkan arahan mendaftar
3. Render PDF (pdf-lib, Fase 0) → kirim ke API → terima PDF signed → simpan `signedPdfBase64`, `id_dokumen`, `tteProvider: 'bsre'`, `verifyUrl`
4. QR payload = `verifyUrl` (link verifikasi BSrE / portal) — QR Fase 0 (kode lokal) tetap dipakai untuk mode mock

## Langkah 5 — Verifikasi & badge

- `verifyDocumentByCode`: dokumen `tteProvider === 'bsre'` → panggil `/api/tte/verify`, tampilkan detail (integrity, TSA, masa berlaku sertifikat, nama signer) di modal verifikasi; mode mock tetap exact-match hash
- Badge: ganti klaim "BSrE VALID" → hanya tampil **setelah verifikasi API berhasil**; sebelumnya "Menunggu Verifikasi"

## Langkah 6 — Kepatuhan

- Blok teks wajib BSrE + **logo BSrE** di area tanda tangan (pengganti teks mock saat provider bsre)
- Audit log sign/verify (id_dokumen BSrE, hasil integrity)

## Langkah 7 — Pengujian

- Sandbox dulu: `Status` → `SignQr` sample → `Verify` → `DownloadDoc`; uji error: passphrase salah, sertifikat expired, rate limit
- Rollout: UAT 1 surat nyata → verifikasi publik → admin set `TTE_PROVIDER=bsre` + toggle aktif

## Di luar scope

- Penyimpanan PDF di server (app tetap localStorage-first)
- Multi-penandatangan
- Webhook BSrE

## Referensi API (dari `@rahadiana/node-esign-bsre` / OpenSID E-Sign-BSrE)

| Fungsi | Input utama | Output |
|---|---|---|
| `SignInvisible` / `SignQr` / `SignImageTTD` | `file` (PDF), `nik`, `passphrase`, `tampilan`, `linkQR`, `page`, `xAxis`, `yAxis` | `{ file: base64, id_dokumen }` |
| `Verify` | `signed_file` | `document_integrity`, `info_tsa`, `info_signer`, `hash_value` |
| `Status` | `nik` | `ISSUE` / `NOT_REGISTERED` |
| `DownloadDoc` | `id_doc` | PDF base64 (sekali unduh) |
