export type UserRole = 
  | 'Super Admin'
  | 'Admin Sekretariat'
  | 'Direksi'
  | 'Atasan'
  | 'User'
  | 'HR'
  | 'Finance'
  | 'Auditor / SPI';

export interface User {
  id: string;
  nip: string;
  name: string;
  role: UserRole;
  title: string;
  unit: string;
  department: string;
  email: string;
  phone: string;
  avatar?: string;
  supervisorId?: string;
}

export type LetterUrgency = 'Biasa' | 'Penting' | 'Segera' | 'Rahasia';

export type LetterStatus = 
  | 'Registrasi' 
  | 'Menunggu Disposisi' 
  | 'Didisposisikan' 
  | 'Tindak Lanjut' 
  | 'Selesai' 
  | 'Diarsipkan';

export type OutgoingLetterStatus = 
  | 'Draft' 
  | 'Review' 
  | 'Menunggu Approval' 
  | 'Disetujui' 
  | 'Nomor Diterbitkan' 
  | 'TTE Diterbitkan' 
  | 'Terkirim' 
  | 'Diarsipkan' 
  | 'Ditolak';

export type OutgoingLetterType = 
  | 'Surat Dinas' 
  | 'Surat Keputusan' 
  | 'Surat Edaran' 
  | 'Nota Dinas' 
  | 'Memo Internal' 
  | 'Surat Tugas' 
  | 'Undangan' 
  | 'Surat Permohonan' 
  | 'Surat Penawaran' 
  | 'Surat Balasan';

export interface InboundLetter {
  id: string;
  agendaNumber: string;
  referenceNumber: string; // Nomor surat asli dari pengirim
  receivedDate: string; // YYYY-MM-DD
  letterDate: string;
  sender: string;
  organization: string;
  subject: string;
  urgency: LetterUrgency;
  category: string;
  targetUnit: string;
  targetPerson?: string;
  attachmentsCount: number;
  fileName: string;
  fileSize: string;
  status: LetterStatus;
  slaDeadline: string; // Batas tindak lanjut
  isConfidential: boolean;
  ocrSummary?: string;
  dispositionIds: string[];
}

export interface DispositionChainStep {
  id: string;
  dispositionId: string;
  documentId: string;
  documentType: 'inbound' | 'outbound';
  fromUserId: string;
  fromUserName: string;
  fromUserTitle: string;
  toUserId: string;
  toUserName: string;
  toUserTitle: string;
  instruction: string;
  notes: string;
  createdAt: string;
  deadline: string;
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Diteruskan';
  followUpReport?: {
    reportedAt: string;
    notes: string;
    attachmentName?: string;
    completedBy: string;
  };
  children?: DispositionChainStep[];
}

export interface ApprovalStep {
  stepNumber: number;
  approverId: string;
  approverName: string;
  approverTitle: string;
  approverRole: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Revision' | 'Delegated';
  actedAt?: string;
  comments?: string;
  signatureHash?: string;
  isDelegated?: boolean;
  delegatedTo?: string;
}

export interface OutgoingLetter {
  id: string;
  type: OutgoingLetterType;
  letterNumber?: string;
  draftNumber: string;
  date: string;
  recipient: string;
  recipientOrg: string;
  isInternal: boolean;
  subject: string;
  urgency: LetterUrgency;
  unit: string;
  creatorId: string;
  creatorName: string;
  approvers: ApprovalStep[];
  currentStep: number;
  status: OutgoingLetterStatus;
  content: string;
  lampiranText?: string;
  tembusanText?: string;
  tteStatus: 'Belum TTE' | 'Menunggu TTD' | 'Sudah TTE' | 'Gagal' | 'Dibatalkan';
  tteDate?: string;
  tteSigner?: string;
  qrVerifyCode?: string;
  hash?: string;
  tteProvider?: 'mock' | 'bsre';
  signedPdfBase64?: string;
  qrDataUrl?: string;
  verifyUrl?: string;
  sendMethod?: 'Email' | 'Kurir Fisik' | 'Internal Workflow' | 'Eksternal Portal';
  sentAt?: string;
}

export interface LetterNumberRecord {
  id: string;
  formattedNumber: string;
  sequence: number;
  year: number;
  monthRoman: string;
  unitCode: string;
  typeCode: string;
  documentId: string;
  documentSubject: string;
  issuedAt: string;
  issuedBy: string;
  status: 'Aktif' | 'Dibatalkan / Void';
  hash: string;
}

export type LeaveType = 'Cuti Tahunan' | 'Cuti Besar' | 'Cuti Sakit' | 'Cuti Bersama' | 'Izin Alasan Penting';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeTitle: string;
  unit: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  substituteEmployeeId: string;
  substituteEmployeeName: string;
  status: 'Diajukan' | 'Disetujui Atasan' | 'Diverifikasi HR' | 'Ditolak';
  balanceBefore: number;
  balanceAfter: number;
  appliedDate: string;
  approvalNotes?: string;
}

export interface LeaveBalance {
  employeeId: string;
  annualTotal: number;
  annualUsed: number;
  annualRemaining: number;
  grandTotal: number;
  grandUsed: number;
  grandRemaining: number;
  sickUsed: number;
  specialUsed: number;
}

export type TravelStatus = 
  | 'Diajukan' 
  | 'Disetujui Atasan' 
  | 'Disetujui Direksi' 
  | 'SPD Diterbitkan' 
  | 'Sedang Berlangsung' 
  | 'Menunggu LPJ' 
  | 'LPJ Diajukan' 
  | 'LPJ Terverifikasi' 
  | 'Selesai / Posted SAP';

export interface TravelExpenseItem {
  id: string;
  category: 'Transport' | 'Penginapan' | 'Uang Harian' | 'Representasi' | 'Lainnya';
  description: string;
  amount: number;
  receiptName?: string;
}

export interface TravelRequest {
  id: string;
  requestNumber: string;
  employeeId: string;
  employeeName: string;
  employeeNip: string;
  employeeTitle: string;
  unit: string;
  destinationCity: string;
  purpose: string;
  departureDate: string;
  returnDate: string;
  durationDays: number;
  transportType: 'Pesawat Udara' | 'Kereta Api' | 'Mobil Dinas' | 'Travel / Darat';
  estimatedCost: number;
  costCenter: string;
  wbsProjectCode: string;
  status: TravelStatus;
  suratTugasNumber?: string;
  spdNumber?: string;
  approvedDate?: string;
  sapPostingId?: string;
  lpj?: {
    submittedAt: string;
    realizedCost: number;
    differenceAmount: number; // positive = refund to company, negative = additional claim
    notes: string;
    items: TravelExpenseItem[];
    financeNotes?: string;
    financeVerifiedAt?: string;
    financeOfficer?: string;
  };
}

export interface MeetingActionItem {
  id: string;
  description: string;
  picId: string;
  picName: string;
  deadline: string;
  status: 'Belum Mulai' | 'Proses' | 'Selesai';
  taskId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  roomOrLink: string;
  isOnline: boolean;
  chairPerson: string;
  notary: string;
  unit: string;
  agendaItems: string[];
  attendees: string[]; // employee names
  attendeeIds?: string[]; // user ids peserta yang diundang (untuk notifikasi)
  status: 'Terjadwal' | 'Berlangsung' | 'Selesai' | 'Dibatalkan';
  minutesNotes?: string;
  decisions?: string[];
  actionItems?: MeetingActionItem[];
}

export interface OfficeTask {
  id: string;
  sourceType: 'Disposisi' | 'Action Item Rapat' | 'Tindak Lanjut Surat' | 'LPJ Perjalanan Dinas';
  sourceId: string;
  sourceReference: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  assigneeUnit: string;
  createdDate: string;
  dueDate: string;
  priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Urgent';
  status: 'Belum Dimulai' | 'Sedang Dikerjakan' | 'Menunggu Review' | 'Selesai';
  progressPercentage: number;
  completionNotes?: string;
  completedAt?: string;
}

export interface DigitalArchive {
  id: string;
  documentNumber: string;
  documentType: string;
  title: string;
  category: string;
  unit: string;
  ownerName: string;
  dateCreated: string;
  retentionPeriodYears: number;
  retentionExpiryDate: string;
  confidentiality: 'Biasa' | 'Terbatas' | 'Rahasia' | 'Sangat Rahasia';
  status: 'Aktif' | 'Inaktif' | 'Dimusnahkan';
  fileSize: string;
  fileName: string;
  version: string;
  downloadCount: number;
  approvedBy: string;
  hash: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userIp: string;
  device: string;
  action: 
    | 'LOGIN' 
    | 'CREATE_DOCUMENT' 
    | 'UPDATE_DOCUMENT' 
    | 'DISPOSITION' 
    | 'APPROVE' 
    | 'REJECT' 
    | 'REVISION' 
    | 'ISSUE_NUMBER' 
    | 'SIGN_TTE' 
    | 'GENERATE_SPD' 
    | 'SUBMIT_LPJ' 
    | 'VERIFY_LPJ' 
    | 'ARCHIVE' 
    | 'DOWNLOAD' 
    | 'ACCESS_CONFIDENTIAL';
  objectType: 'Surat Masuk' | 'Surat Keluar' | 'Disposisi' | 'Cuti' | 'Perjalanan Dinas' | 'Rapat' | 'Arsip' | 'Master';
  objectId: string;
  objectReference: string;
  details: string;
  diff?: {
    before?: string;
    after?: string;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'disposition' | 'approval' | 'deadline' | 'travel' | 'leave' | 'meeting' | 'system';
  targetModule: string;
  targetId?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  code: string;
  type: OutgoingLetterType;
  description: string;
  defaultSubject: string;
  defaultContent: string;
  defaultLampiran: string;
  defaultTembusan: string;
  version: string;
  isActive: boolean;
}

export interface NumberingRuleConfig {
  unitCode: string;
  typeCode: string;
  pattern: string; // e.g. "{SEQ}/{UNIT}/{TYPE}/{ROMAN_MONTH}/{YEAR}"
  currentSequence: number;
  year: number;
  resetYearly: boolean;
}

export interface UnitKerja {
  id: string;
  code: string;
  name: string;
  headName: string;
  headUserId: string;
  email: string;
  phone: string;
  memberCount: number;
}

export interface WorkflowStepConfig {
  stepNumber: number;
  roleRequired: UserRole;
  title: string;
  slaDays: number;
}

export interface WorkflowConfig {
  id: string;
  documentType: OutgoingLetterType | 'Surat Masuk' | 'Perjalanan Dinas' | 'Cuti';
  name: string;
  description: string;
  steps: WorkflowStepConfig[];
  isActive: boolean;
}

export interface SystemSettings {
  companyName: string;
  portalUrl: string;
  maxAttachmentMb: number;
  confidentialWatermarkText: string;
  requireMfa: boolean;
  sessionTimeoutMinutes: number;
  sapIntegration: {
    enabled: boolean;
    endpoint: string;
    lastSync?: string;
    environment: 'Sandbox' | 'Production';
  };
  hrisIntegration: {
    enabled: boolean;
    endpoint: string;
    lastSync?: string;
    syncIntervalHours: number;
  };
  bsreTteProvider: {
    enabled: boolean;
    caName: string;
    status: 'Tersertifikasi' | 'Uji Coba';
  };
  emailNotificationsEnabled: boolean;
}

export interface RolePermission {
  role: UserRole;
  description: string;
  canCreateDoc: boolean;
  canApprove: boolean;
  canDispose: boolean;
  canIssueNumber: boolean;
  canSignTTE: boolean;
  canViewConfidential: boolean;
  canManageUsers: boolean;
  canExportAudit: boolean;
}
