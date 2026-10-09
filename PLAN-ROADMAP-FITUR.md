# Roadmap Pengembangan e-Office PT BIN (Di Luar TTE/BSrE)

> Sumber: pemetaan kode (read-only) — lihat `PLAN-TTE-BSrE-FASE1.md` untuk jalur TTE.
> Arsitektur saat ini: Next.js App Router hanya shell (`app/page.tsx`), seluruh app = SPA client-side React 19 (`src/App.tsx`), satu context raksasa `src/context/OfficeContext.tsx` (±1.836 baris), persistensi **100% `localStorage`** (19 kunci `eoffice_*`), **tanpa `app/api`** dan tanpa fetch jaringan (satu-satunya fetch = font PDF di `src/services/pdf/letterPdf.ts:102`).

## Urutan prioritas

1. Backend + autentikasi
2. RBAC penuh & engine workflow
3. Laporan/SLA dari data riil
4. Upload lampiran + AI + notifikasi realtime
5. PWA / kalender / perluasan PDF / dark mode / a11y

Alasan: fitur apa pun di atas butuh sinkronisasi data & identitas dulu agar jujur.

---

## A. Menutup yang masih palsu / simulasi

### A1. Backend API + database (prasyarat semua)
- Buat `app/api/**` (Route Handlers) + repository layer; ganti 19 `useEffect` sync localStorage (`src/context/OfficeContext.tsx:259-337`).
- Template route sudah tersirat di `PLAN-TTE-BSrE-FASE1.md:22-32`.
- Manfaat: multi-user, penomoran atomik, verifikasi publik.

### A2. Autentikasi & sesi nyata
- `src/components/auth/LoginView.tsx` sudah ada tetapi dead code (tak di-import `src/App.tsx`); cek password hanya `if (!password)` (`LoginView.tsx:30-33`).
- Aktifkan + hash password/SSO (mis. NextAuth), eksekusi `requireMfa` & `sessionTimeoutMinutes` yang sudah tersimpan (`src/types/index.ts:427-428`, form di `AdminManagementView.tsx:1092-1128`).

### A3. Enforce RBAC penuh
- Matrix `RolePermission` ada (`src/types/index.ts:449-459`) tapi hanya `canSignTTE` yang di-enforce (`src/components/letters/SuratKeluarView.tsx:36`).
- Terapkan: `canApprove` di `src/components/approval/ApprovalWorkflowView.tsx:39-61` (saat ini siapa pun boleh approve langkah apa pun), `canIssueNumber` di `OfficeContext.tsx:1018`, `canDispose` di `createDisposition`, `canExportAudit` di `AuditTrailView.tsx:71`, `canViewConfidential` di preview/arsip, `canCreateDoc` di semua form.

### A4. Engine approval dari `WorkflowConfig`
- `createOutgoingDraft` masih hardcode 3 approver (`OfficeContext.tsx:882-907`).
- Hubungkan ke `workflowConfigs` + `slaDays` (`src/types/index.ts:406-420`; editor admin `AdminManagementView.tsx:681-758`) agar konfigurasi admin berpengaruh, termasuk SLA per langkah & eskalasi.

### A5. Penomoran atomik berbasis rule
- Masalah: `seq = letterNumbers.length + 49` (`OfficeContext.tsx:1040`), `numberingRules.currentSequence` tak pernah di-increment, `rule.pattern` diabaikan.
- Jadikan `NumberingRuleConfig.pattern` + `currentSequence` satu-satunya sumber (`src/types/index.ts:386-393`), increment per unit/jenis/tahun, tambah aksi **Void** (filter `PenomoranSuratView.tsx:93` sudah ada tanpa aksi).

### A6. Laporan & dashboard dihitung dari data
- Ganti angka hardcoded: `src/components/reports/LaporanView.tsx:78,92,106,136-179` dan `src/components/dashboard/DashboardView.tsx:93-120`.
- Metrik riil: cycle time, overdue vs `slaDeadline` (`src/types/index.ts:75`), rasio per unit; ekspor PDF laporan memakai pola `generateLetterPdf`.

### A7. Eksekusi integrasi SAP/HRIS/email
- Endpoint & flag sudah tersimpan (`src/types/index.ts:429-444`) tapi badge "KONEKSI AKTIF"/"TERHUBUNG" statis (`AdminManagementView.tsx:1147-1149,1192-1194`) dan tak pernah dipanggil.
- Buat proxy `/api/integrations/*`, ganti `verifyLPJ` palsu (`OfficeContext.tsx:1433,1440,1461`), sinkronisasi master pegawai, kirim email bila `emailNotificationsEnabled` (`src/types/index.ts:446`).

---

## B. Fitur baru bernilai

### B1. Upload lampiran asli + OCR/analisis AI
- Panel upload masih simulasi: `src/components/letters/SuratMasukView.tsx:466-471` ("Tersimulasi siap OCR") dan `src/components/letters/DisposisiView.tsx:361-365`.
- Tambah `<input type=file>`, simpan ke server/IndexedDB, validasi `maxAttachmentMb` (`src/types/index.ts:425`).
- `@google/genai` sudah terpasang tapi 0 pemakaian (`package.json:14`, jejak `.env.example:1`) → ringkasan/klasifikasi surat masuk otomatis (teks OCR default kini hardcoded di `OfficeContext.tsx:665`).

### B2. Notifikasi realtime + email + pantauan SLA
- Sekarang notifikasi hanya muncul saat aksi lokal (`OfficeContext.tsx:680-693,795-808,1407-1420,1492-1509`); belum ada WebSocket/SSE/polling.
- Tambah notifikasi untuk event yang belum ada (approval `actOnApproval`, cuti, LPJ) + pengingat `slaDeadline` yang tak pernah dipantau; aktifkan `emailNotificationsEnabled` (Web Push/SSE + SMTP/proxy).

### B3. Kalender rapat + ekspor `.ics`
- `src/components/meetings/AgendaRapatView.tsx` berbasis daftar; belum ada grid kalender maupun file `.ics`/Google Calendar.

### B4. Perluasan PDF ke SPD/LPJ/Cuti/Notulen
- `generateLetterPdf` sudah lengkap (kop, meta, tabel multi-halaman, gambar, blok TTE + QR) dan duck-typed (`src/services/pdf/letterPdf.ts:19-47`).
- Baru dipakai surat (`OfficeContext.tsx:1130`, `DocumentPreviewModal.tsx:88-107`); perluas ke SPD/LPJ/Cuti/Notulen.

### B5. Halaman verifikasi publik `/verify/[code]`
- `verifyDocumentByCode` (`OfficeContext.tsx:1673-1726`) hanya cek localStorage browser sendiri.
- Dengan backend, jadi halaman publik pemindai QR (prasyarat kepercayaan QR; payload QR fase 0 = kode lokal, fase 1 = URL BSrE — `OfficeContext.tsx:1114`).

### B6. PWA & mode offline
- Belum ada `manifest.json` / service worker / `theme-color` (`public/` hanya berisi font).
- Data sudah localStorage → cocok untuk offline + antrean sinkronisasi saat online.

### B7. Dark mode, i18n, accessibility
- Dark mode: belum ada toggle/`prefers-color-scheme` (`src/index.css`); Tailwind 4 siap pakai variant `dark:`.
- i18n: belum ada library, semua string hardcoded Bahasa Indonesia (`app/layout.tsx:22`).
- a11y: `aria-*` baru ada di `src/components/common/ContentEditor.tsx:535-592`; tabel tanpa `<caption>`/`scope`, modal tanpa focus trap.

### B8. Siklus hidup arsip
- Status surat masuk tak pernah mencapai `Selesai/Diarsipkan` (definisi `src/types/index.ts:27-33`, hanya `'Didisposisikan'` di `OfficeContext.tsx:767`).
- `archiveDocument` (`OfficeContext.tsx:1621`) tak pernah dipanggil UI; hash arsip pakai `Math.random()` (`OfficeContext.tsx:1624`).
- Tambah retensi/`retentionExpiryDate` + job pemusnahan; unduh berkas arsip saat ini hanya `alert()` (`ArsipDigitalView.tsx:181`).

---

## C. Higienisasi kode

- **Dead code**: `src/components/master/MasterDataView.tsx` (tak pernah dirender; `App.tsx:18` import sia-sia, `case 'master-data'` menampilkan `AdminManagementView`), `LoginView.tsx`, `CredentialsModal.tsx`, fungsi `archiveDocument`, import `LogOut` (`Header.tsx:8`).
- **Dependensi tak terpakai**: `express` + `@types/express`, `motion`, `dotenv` (dependencies); `esbuild`, `tsx`, `autoprefixer` (devDependencies). `@google/genai` hanya dipakai jika B1 dijalankan.
- **Bug kecil**: shortcut ⌘K/Ctrl+K hanya menutup modal, tak ada pembuka (`Header.tsx:116,120-122` vs `GlobalSearchModal.tsx:27-31`); audit log IP/device hardcode (`OfficeContext.tsx:362-363`) dan parameter `diff` tak pernah terisi; watermark teks konfigurabel diabaikan (hardcode "RAHASIA", `DocumentPreviewModal.tsx:446-450` vs `types/index.ts:426`); kode disposisi/draft di-generate `Math.random()` (`OfficeContext.tsx:721-722,877-878`).

---

## Checklis prasyarat luar aplikasi

- [ ] Kredensial BSrE (lihat `PLAN-TTE-BSrE-FASE1.md`) — untuk jalur TTE
- [ ] Endpoint SAP & HRIS + akun integrasi (untuk A7)
- [ ] Kunci `GEMINI_API_KEY` di server (untuk B1) — jangan pakai `NEXT_PUBLIC_`
- [ ] Hosting HTTPS + database (untuk A1, B5, B6)
