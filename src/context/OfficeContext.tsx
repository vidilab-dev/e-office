import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  InboundLetter,
  OutgoingLetter,
  DispositionChainStep,
  LetterNumberRecord,
  LeaveRequest,
  LeaveBalance,
  TravelRequest,
  Meeting,
  OfficeTask,
  DigitalArchive,
  AuditLog,
  DocumentTemplate,
  NumberingRuleConfig,
  NotificationItem,
  UnitKerja,
  WorkflowConfig,
  SystemSettings,
  RolePermission,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_INBOUND_LETTERS,
  INITIAL_OUTGOING_LETTERS,
  INITIAL_DISPOSITIONS,
  INITIAL_LETTER_NUMBERS,
  INITIAL_LEAVE_BALANCES,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_TRAVEL_REQUESTS,
  INITIAL_MEETINGS,
  INITIAL_TASKS,
  INITIAL_ARCHIVES,
  INITIAL_TEMPLATES,
  INITIAL_NUMBERING_RULES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_UNITS,
  INITIAL_WORKFLOW_CONFIGS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_ROLE_PERMISSIONS,
} from '../data/initialData';
import { getTteProvider } from '../services/tte';
import { generateLetterPdf, letterPdfFileName } from '../services/pdf/letterPdf';
import { makeQrDataUrl } from '../utils/qr';

const MONTH_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const safeStorage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null;

interface OfficeContextType {
  currentUser: User;
  users: User[];
  units: UnitKerja[];
  workflowConfigs: WorkflowConfig[];
  systemSettings: SystemSettings;
  rolePermissions: RolePermission[];
  inboundLetters: InboundLetter[];
  outgoingLetters: OutgoingLetter[];
  dispositions: DispositionChainStep[];
  letterNumbers: LetterNumberRecord[];
  leaveRequests: LeaveRequest[];
  leaveBalances: Record<string, LeaveBalance>;
  travelRequests: TravelRequest[];
  meetings: Meeting[];
  tasks: OfficeTask[];
  archives: DigitalArchive[];
  templates: DocumentTemplate[];
  numberingRules: NumberingRuleConfig[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  activeModule: string;
  setActiveModule: (module: string) => void;
  selectedDocumentForPreview: any | null;
  setSelectedDocumentForPreview: (doc: any | null) => void;
  qrVerificationModalData: any | null;
  setQrVerificationModalData: (data: any | null) => void;
  
  // Methods
  switchUser: (userId: string) => void;
  addUser: (user: Partial<User>) => User;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addUnit: (unit: Partial<UnitKerja>) => UnitKerja;
  updateUnit: (id: string, unit: Partial<UnitKerja>) => void;
  deleteUnit: (id: string) => void;
  addWorkflowConfig: (config: Partial<WorkflowConfig>) => WorkflowConfig;
  updateWorkflowConfig: (id: string, config: Partial<WorkflowConfig>) => void;
  deleteWorkflowConfig: (id: string) => void;
  addNumberingRule: (rule: NumberingRuleConfig) => void;
  updateNumberingRule: (unitCode: string, typeCode: string, rule: Partial<NumberingRuleConfig>) => void;
  deleteNumberingRule: (unitCode: string, typeCode: string) => void;
  addTemplate: (tpl: Partial<DocumentTemplate>) => DocumentTemplate;
  updateTemplate: (id: string, tpl: Partial<DocumentTemplate>) => void;
  deleteTemplate: (id: string) => void;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  updateRolePermission: (role: UserRole, permission: Partial<RolePermission>) => void;
  exportAllDataAsJSON: () => string;
  importDataFromJSON: (jsonString: string) => boolean;
  registerInboundLetter: (letterData: Partial<InboundLetter>) => InboundLetter;
  createDisposition: (params: {
    documentId: string;
    documentType?: 'inbound' | 'outbound';
    toUserId: string;
    instruction: string;
    notes: string;
    deadline: string;
    parentDispositionId?: string;
  }) => DispositionChainStep;
  reportDispositionFollowUp: (dispositionId: string, notes: string, attachmentName?: string) => void;
  createOutgoingDraft: (draftData: Partial<OutgoingLetter>) => OutgoingLetter;
  actOnApproval: (
    letterId: string,
    action: 'Approved' | 'Rejected' | 'Revision',
    comments?: string,
    delegateToUserId?: string
  ) => void;
  issueLetterNumber: (letterId: string) => string;
  applyTteSignature: (letterId: string) => Promise<void>;
  submitLeaveRequest: (data: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate' | 'balanceBefore' | 'balanceAfter'>) => LeaveRequest;
  actOnLeaveRequest: (requestId: string, action: 'approve_atasan' | 'verify_hr' | 'reject', notes?: string) => void;
  submitTravelRequest: (data: Partial<TravelRequest>) => TravelRequest;
  actOnTravelRequest: (travelId: string, action: 'approve_atasan' | 'approve_direksi' | 'issue_spd') => void;
  submitLPJ: (travelId: string, data: { realizedCost: number; differenceAmount: number; notes: string; items: any[] }) => void;
  verifyLPJ: (travelId: string, financeNotes: string) => void;
  createMeeting: (data: Partial<Meeting>) => Meeting;
  updateMeetingMinutes: (
    meetingId: string,
    minutes: string,
    decisions: string[],
    actionItems: { description: string; picId: string; picName: string; deadline: string }[]
  ) => void;
  updateTaskStatus: (taskId: string, status: OfficeTask['status'], progress: number, completionNotes?: string) => void;
  archiveDocument: (archiveData: Partial<DigitalArchive>) => DigitalArchive;
  addAuditLog: (
    action: AuditLog['action'],
    objectType: AuditLog['objectType'],
    objectId: string,
    objectReference: string,
    details: string,
    diff?: { before?: string; after?: string }
  ) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  verifyDocumentByCode: (code: string) => { valid: boolean; doc?: any; message: string };
  resetAllToInitial: () => void;
}

const OfficeContext = createContext<OfficeContextType | undefined>(undefined);

export const OfficeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = safeStorage?.getItem('eoffice_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return safeStorage?.getItem('eoffice_current_user') || 'usr-1'; // Default: Direktur Utama
  });

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const [units, setUnits] = useState<UnitKerja[]>(() => {
    const saved = safeStorage?.getItem('eoffice_units');
    return saved ? JSON.parse(saved) : INITIAL_UNITS;
  });

  const [workflowConfigs, setWorkflowConfigs] = useState<WorkflowConfig[]>(() => {
    const saved = safeStorage?.getItem('eoffice_workflows');
    return saved ? JSON.parse(saved) : INITIAL_WORKFLOW_CONFIGS;
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = safeStorage?.getItem('eoffice_system_settings');
    return saved ? JSON.parse(saved) : INITIAL_SYSTEM_SETTINGS;
  });

  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() => {
    const saved = safeStorage?.getItem('eoffice_role_permissions');
    return saved ? JSON.parse(saved) : INITIAL_ROLE_PERMISSIONS;
  });

  const [inboundLetters, setInboundLetters] = useState<InboundLetter[]>(() => {
    const saved = safeStorage?.getItem('eoffice_inbound_letters');
    return saved ? JSON.parse(saved) : INITIAL_INBOUND_LETTERS;
  });

  const [outgoingLetters, setOutgoingLetters] = useState<OutgoingLetter[]>(() => {
    const saved = safeStorage?.getItem('eoffice_outgoing_letters');
    return saved ? JSON.parse(saved) : INITIAL_OUTGOING_LETTERS;
  });

  const [dispositions, setDispositions] = useState<DispositionChainStep[]>(() => {
    const saved = safeStorage?.getItem('eoffice_dispositions');
    return saved ? JSON.parse(saved) : INITIAL_DISPOSITIONS;
  });

  const [letterNumbers, setLetterNumbers] = useState<LetterNumberRecord[]>(() => {
    const saved = safeStorage?.getItem('eoffice_letter_numbers');
    return saved ? JSON.parse(saved) : INITIAL_LETTER_NUMBERS;
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = safeStorage?.getItem('eoffice_leave_requests');
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
  });

  const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance>>(() => {
    const saved = safeStorage?.getItem('eoffice_leave_balances');
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_BALANCES;
  });

  const [travelRequests, setTravelRequests] = useState<TravelRequest[]>(() => {
    const saved = safeStorage?.getItem('eoffice_travel_requests');
    return saved ? JSON.parse(saved) : INITIAL_TRAVEL_REQUESTS;
  });

  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = safeStorage?.getItem('eoffice_meetings');
    return saved ? JSON.parse(saved) : INITIAL_MEETINGS;
  });

  const [tasks, setTasks] = useState<OfficeTask[]>(() => {
    const saved = safeStorage?.getItem('eoffice_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [archives, setArchives] = useState<DigitalArchive[]>(() => {
    const saved = safeStorage?.getItem('eoffice_archives');
    return saved ? JSON.parse(saved) : INITIAL_ARCHIVES;
  });

  const [templates, setTemplates] = useState<DocumentTemplate[]>(() => {
    const saved = safeStorage?.getItem('eoffice_templates');
    return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
  });

  const [numberingRules, setNumberingRules] = useState<NumberingRuleConfig[]>(() => {
    const saved = safeStorage?.getItem('eoffice_numbering_rules');
    return saved ? JSON.parse(saved) : INITIAL_NUMBERING_RULES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = safeStorage?.getItem('eoffice_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = safeStorage?.getItem('eoffice_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [selectedDocumentForPreview, setSelectedDocumentForPreview] = useState<any | null>(null);
  const [qrVerificationModalData, setQrVerificationModalData] = useState<any | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('eoffice_current_user', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('eoffice_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('eoffice_units', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('eoffice_workflows', JSON.stringify(workflowConfigs));
  }, [workflowConfigs]);

  useEffect(() => {
    localStorage.setItem('eoffice_system_settings', JSON.stringify(systemSettings));
  }, [systemSettings]);

  useEffect(() => {
    localStorage.setItem('eoffice_role_permissions', JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  useEffect(() => {
    localStorage.setItem('eoffice_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('eoffice_numbering_rules', JSON.stringify(numberingRules));
  }, [numberingRules]);

  useEffect(() => {
    localStorage.setItem('eoffice_inbound_letters', JSON.stringify(inboundLetters));
  }, [inboundLetters]);

  useEffect(() => {
    localStorage.setItem('eoffice_outgoing_letters', JSON.stringify(outgoingLetters));
  }, [outgoingLetters]);

  useEffect(() => {
    localStorage.setItem('eoffice_dispositions', JSON.stringify(dispositions));
  }, [dispositions]);

  useEffect(() => {
    localStorage.setItem('eoffice_letter_numbers', JSON.stringify(letterNumbers));
  }, [letterNumbers]);

  useEffect(() => {
    localStorage.setItem('eoffice_leave_requests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('eoffice_leave_balances', JSON.stringify(leaveBalances));
  }, [leaveBalances]);

  useEffect(() => {
    localStorage.setItem('eoffice_travel_requests', JSON.stringify(travelRequests));
  }, [travelRequests]);

  useEffect(() => {
    localStorage.setItem('eoffice_meetings', JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem('eoffice_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('eoffice_archives', JSON.stringify(archives));
  }, [archives]);

  useEffect(() => {
    localStorage.setItem('eoffice_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('eoffice_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Methods
  const addAuditLog = (
    action: AuditLog['action'],
    objectType: AuditLog['objectType'],
    objectId: string,
    objectReference: string,
    details: string,
    diff?: { before?: string; after?: string }
  ) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
      2,
      '0'
    )}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: formatted,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      userIp: '192.168.10.88 (Secure Corporate VPN)',
      device: 'Corporate Portal / Chrome Web Client',
      action,
      objectType,
      objectId,
      objectReference,
      details,
      diff,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUserId(userId);
      addAuditLog('LOGIN', 'Master', user.id, user.nip, `User login aktif dialihkan ke ${user.name} (${user.role})`);
    }
  };

  const addUser = (userData: Partial<User>): User => {
    const newId = `usr-${Date.now()}`;
    const newUser: User = {
      id: newId,
      nip: userData.nip || `BIN-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
      name: userData.name || 'Pegawai Baru',
      role: userData.role || 'User',
      title: userData.title || 'Staf Operasional',
      unit: userData.unit || 'DTI',
      department: userData.department || 'Divisi Teknologi Informasi',
      email: userData.email || 'pegawai@bin.co.id',
      phone: userData.phone || '0812-0000-0000',
      supervisorId: userData.supervisorId || 'usr-3',
    };

    setUsers((prev) => [...prev, newUser]);
    addAuditLog('CREATE_DOCUMENT', 'Master', newUser.id, newUser.nip, `Pegawai baru ${newUser.name} ditambahkan (${newUser.role})`);
    return newUser;
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...userData };
          addAuditLog('UPDATE_DOCUMENT', 'Master', id, u.nip, `Data pegawai ${u.name} diperbarui oleh admin`);
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (target) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      addAuditLog('UPDATE_DOCUMENT', 'Master', id, target.nip, `Pegawai ${target.name} dinonaktifkan / dihapus dari sistem`);
    }
  };

  const addUnit = (unitData: Partial<UnitKerja>): UnitKerja => {
    const newUnit: UnitKerja = {
      id: `unit-${Date.now()}`,
      code: unitData.code || 'UNIT',
      name: unitData.name || 'Unit Kerja Baru',
      headName: unitData.headName || 'Pimpinan Unit',
      headUserId: unitData.headUserId || 'usr-3',
      email: unitData.email || 'unit@bin.co.id',
      phone: unitData.phone || '021-5299-8800',
      memberCount: unitData.memberCount || 5,
    };
    setUnits((prev) => [...prev, newUnit]);
    addAuditLog('CREATE_DOCUMENT', 'Master', newUnit.id, newUnit.code, `Unit kerja baru ditambahkan: ${newUnit.name} (${newUnit.code})`);
    return newUnit;
  };

  const updateUnit = (id: string, unitData: Partial<UnitKerja>) => {
    setUnits((prev) =>
      prev.map((unit) => {
        if (unit.id === id) {
          const updated = { ...unit, ...unitData };
          addAuditLog('UPDATE_DOCUMENT', 'Master', id, unit.code, `Struktur unit kerja ${unit.name} diperbarui`);
          return updated;
        }
        return unit;
      })
    );
  };

  const deleteUnit = (id: string) => {
    const target = units.find((u) => u.id === id);
    if (target) {
      setUnits((prev) => prev.filter((u) => u.id !== id));
      addAuditLog('UPDATE_DOCUMENT', 'Master', id, target.code, `Unit kerja ${target.name} dihapus dari master data`);
    }
  };

  const addWorkflowConfig = (configData: Partial<WorkflowConfig>): WorkflowConfig => {
    const newConfig: WorkflowConfig = {
      id: `wf-${Date.now()}`,
      documentType: configData.documentType || 'Surat Dinas',
      name: configData.name || 'Alur Baru',
      description: configData.description || 'Deskripsi alur alur persetujuan',
      isActive: configData.isActive ?? true,
      steps: configData.steps || [
        { stepNumber: 1, roleRequired: 'Atasan', title: 'Review Atasan', slaDays: 1 },
        { stepNumber: 2, roleRequired: 'Direksi', title: 'Persetujuan Direksi', slaDays: 1 },
      ],
    };
    setWorkflowConfigs((prev) => [...prev, newConfig]);
    addAuditLog('CREATE_DOCUMENT', 'Master', newConfig.id, newConfig.name, `Definisi workflow baru ditambahkan: ${newConfig.name}`);
    return newConfig;
  };

  const updateWorkflowConfig = (id: string, configData: Partial<WorkflowConfig>) => {
    setWorkflowConfigs((prev) =>
      prev.map((cfg) => {
        if (cfg.id === id) {
          const updated = { ...cfg, ...configData };
          addAuditLog('UPDATE_DOCUMENT', 'Master', id, cfg.name, `Definisi workflow approval ${cfg.name} diperbarui`);
          return updated;
        }
        return cfg;
      })
    );
  };

  const deleteWorkflowConfig = (id: string) => {
    const target = workflowConfigs.find((c) => c.id === id);
    if (target) {
      setWorkflowConfigs((prev) => prev.filter((c) => c.id !== id));
      addAuditLog('UPDATE_DOCUMENT', 'Master', id, target.name, `Workflow config ${target.name} dihapus`);
    }
  };

  const addNumberingRule = (rule: NumberingRuleConfig) => {
    setNumberingRules((prev) => [...prev, rule]);
    addAuditLog('CREATE_DOCUMENT', 'Master', `${rule.unitCode}-${rule.typeCode}`, rule.pattern, `Aturan penomoran baru ditambahkan untuk ${rule.unitCode}`);
  };

  const updateNumberingRule = (unitCode: string, typeCode: string, ruleData: Partial<NumberingRuleConfig>) => {
    setNumberingRules((prev) =>
      prev.map((r) => {
        if (r.unitCode === unitCode && r.typeCode === typeCode) {
          const updated = { ...r, ...ruleData };
          addAuditLog('UPDATE_DOCUMENT', 'Master', `${unitCode}-${typeCode}`, updated.pattern, `Aturan penomoran diperbarui: sequence ${updated.currentSequence}`);
          return updated;
        }
        return r;
      })
    );
  };

  const deleteNumberingRule = (unitCode: string, typeCode: string) => {
    setNumberingRules((prev) => prev.filter((r) => !(r.unitCode === unitCode && r.typeCode === typeCode)));
    addAuditLog('UPDATE_DOCUMENT', 'Master', `${unitCode}-${typeCode}`, 'DELETE', `Aturan penomoran ${unitCode} / ${typeCode} dihapus`);
  };

  const addTemplate = (tplData: Partial<DocumentTemplate>): DocumentTemplate => {
    const newTpl: DocumentTemplate = {
      id: `tpl-${Date.now()}`,
      name: tplData.name || 'Template Baru',
      code: tplData.code || `TPL-${Date.now().toString().slice(-4)}`,
      type: tplData.type || 'Surat Dinas',
      description: tplData.description || 'Deskripsi template standar',
      defaultSubject: tplData.defaultSubject || 'Perihal Dokumen',
      defaultContent: tplData.defaultContent || 'Isi draft naskah resmi...',
      defaultLampiran: tplData.defaultLampiran || '-',
      defaultTembusan: tplData.defaultTembusan || 'Arsip',
      version: tplData.version || 'v1.0',
      isActive: tplData.isActive ?? true,
    };
    setTemplates((prev) => [...prev, newTpl]);
    addAuditLog('CREATE_DOCUMENT', 'Master', newTpl.id, newTpl.code, `Template dokumen korporat baru dibuat: ${newTpl.name}`);
    return newTpl;
  };

  const updateTemplate = (id: string, tplData: Partial<DocumentTemplate>) => {
    setTemplates((prev) =>
      prev.map((tpl) => {
        if (tpl.id === id) {
          const updated = { ...tpl, ...tplData };
          addAuditLog('UPDATE_DOCUMENT', 'Master', id, tpl.code, `Template ${tpl.name} diperbarui oleh admin`);
          return updated;
        }
        return tpl;
      })
    );
  };

  const deleteTemplate = (id: string) => {
    const target = templates.find((t) => t.id === id);
    if (target) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      addAuditLog('UPDATE_DOCUMENT', 'Master', id, target.code, `Template dokumen ${target.name} dihapus`);
    }
  };

  const updateSystemSettings = (settingsData: Partial<SystemSettings>) => {
    setSystemSettings((prev) => {
      const updated = { ...prev, ...settingsData };
      addAuditLog('UPDATE_DOCUMENT', 'Master', 'SYS-CONFIG', 'System Settings', 'Konfigurasi parameter sistem & integrasi diperbarui');
      return updated;
    });
  };

  const updateRolePermission = (role: UserRole, permissionData: Partial<RolePermission>) => {
    setRolePermissions((prev) =>
      prev.map((perm) => {
        if (perm.role === role) {
          const updated = { ...perm, ...permissionData };
          addAuditLog('UPDATE_DOCUMENT', 'Master', role, 'RBAC Matrix', `Matriks izin peran ${role} diperbarui`);
          return updated;
        }
        return perm;
      })
    );
  };

  const exportAllDataAsJSON = (): string => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      company: 'PT BADAN INDUSTRI NUSANTARA (PERSERO)',
      users,
      units,
      workflowConfigs,
      systemSettings,
      rolePermissions,
      numberingRules,
      templates,
      inboundLetters,
      outgoingLetters,
      dispositions,
      letterNumbers,
      leaveRequests,
      leaveBalances,
      travelRequests,
      meetings,
      tasks,
      archives,
      auditLogs,
    };
    addAuditLog('DOWNLOAD', 'Master', 'BACKUP-JSON', 'Full Database Backup', `Cadangan data lengkap diekspor oleh ${currentUser.name}`);
    return JSON.stringify(payload, null, 2);
  };

  const importDataFromJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.users && Array.isArray(parsed.users)) setUsers(parsed.users);
      if (parsed.units && Array.isArray(parsed.units)) setUnits(parsed.units);
      if (parsed.workflowConfigs && Array.isArray(parsed.workflowConfigs)) setWorkflowConfigs(parsed.workflowConfigs);
      if (parsed.systemSettings) setSystemSettings(parsed.systemSettings);
      if (parsed.rolePermissions && Array.isArray(parsed.rolePermissions)) setRolePermissions(parsed.rolePermissions);
      if (parsed.numberingRules && Array.isArray(parsed.numberingRules)) setNumberingRules(parsed.numberingRules);
      if (parsed.templates && Array.isArray(parsed.templates)) setTemplates(parsed.templates);
      if (parsed.inboundLetters && Array.isArray(parsed.inboundLetters)) setInboundLetters(parsed.inboundLetters);
      if (parsed.outgoingLetters && Array.isArray(parsed.outgoingLetters)) setOutgoingLetters(parsed.outgoingLetters);
      if (parsed.dispositions && Array.isArray(parsed.dispositions)) setDispositions(parsed.dispositions);
      if (parsed.letterNumbers && Array.isArray(parsed.letterNumbers)) setLetterNumbers(parsed.letterNumbers);
      if (parsed.leaveRequests && Array.isArray(parsed.leaveRequests)) setLeaveRequests(parsed.leaveRequests);
      if (parsed.leaveBalances) setLeaveBalances(parsed.leaveBalances);
      if (parsed.travelRequests && Array.isArray(parsed.travelRequests)) setTravelRequests(parsed.travelRequests);
      if (parsed.meetings && Array.isArray(parsed.meetings)) setMeetings(parsed.meetings);
      if (parsed.tasks && Array.isArray(parsed.tasks)) setTasks(parsed.tasks);
      if (parsed.archives && Array.isArray(parsed.archives)) setArchives(parsed.archives);
      addAuditLog('UPDATE_DOCUMENT', 'Master', 'RESTORE-JSON', 'Database Restored', `Basis data berhasil dipulihkan dari cadangan JSON`);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  const registerInboundLetter = (data: Partial<InboundLetter>): InboundLetter => {
    const count = inboundLetters.length + 89;
    const now = new Date();
    const roman = MONTH_ROMAN[now.getMonth()];
    const agendaNumber = `AGD/${now.getFullYear()}/${roman}/${String(count).padStart(4, '0')}`;
    const id = `sm-${Date.now()}`;

    const newLetter: InboundLetter = {
      id,
      agendaNumber,
      referenceNumber: data.referenceNumber || 'SURAT-EKSTERNAL/001',
      receivedDate: data.receivedDate || now.toISOString().split('T')[0],
      letterDate: data.letterDate || now.toISOString().split('T')[0],
      sender: data.sender || 'Instansi Terkait',
      organization: data.organization || 'Mitra Korporat',
      subject: data.subject || 'Surat Masuk Resmi',
      urgency: data.urgency || 'Biasa',
      category: data.category || 'Surat Dinas',
      targetUnit: data.targetUnit || 'Direksi',
      targetPerson: data.targetPerson || 'Direktur Utama',
      attachmentsCount: data.attachmentsCount || 1,
      fileName: data.fileName || 'Lampiran_Dokumen_Masuk.pdf',
      fileSize: data.fileSize || '1.5 MB',
      status: 'Menunggu Disposisi',
      slaDeadline: data.slaDeadline || new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
      isConfidential: Boolean(data.isConfidential),
      ocrSummary: data.ocrSummary || 'Hasil pemindaian OCR dokumen surat masuk PT BIN terverifikasi digital.',
      dispositionIds: [],
    };

    setInboundLetters((prev) => [newLetter, ...prev]);

    addAuditLog(
      'CREATE_DOCUMENT',
      'Surat Masuk',
      newLetter.id,
      newLetter.agendaNumber,
      `Registrasi surat masuk baru No. Agenda ${newLetter.agendaNumber} dari ${newLetter.sender}: ${newLetter.subject}`
    );

    // Notify Direksi or Sekper
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        userId: 'usr-1',
        title: 'Surat Masuk Baru Registrasi',
        message: `Surat masuk ${newLetter.agendaNumber} dari ${newLetter.sender} membutuhkan disposisi.`,
        time: 'Baru saja',
        read: false,
        type: 'disposition',
        targetModule: 'surat-masuk',
        targetId: newLetter.id,
      },
      ...prev,
    ]);

    return newLetter;
  };

  const createDisposition = ({
    documentId,
    documentType = 'inbound',
    toUserId,
    instruction,
    notes,
    deadline,
    parentDispositionId,
  }: {
    documentId: string;
    documentType?: 'inbound' | 'outbound';
    toUserId: string;
    instruction: string;
    notes: string;
    deadline: string;
    parentDispositionId?: string;
  }): DispositionChainStep => {
    const toUser = users.find((u) => u.id === toUserId) || users[3];
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const seq = Math.floor(1000 + Math.random() * 9000);
    const dispositionCode = `DSP-${now.getFullYear()}-${seq}`;
    const newStepId = `dsp-${Date.now()}`;

    const newStep: DispositionChainStep = {
      id: newStepId,
      dispositionId: dispositionCode,
      documentId,
      documentType,
      fromUserId: currentUser.id,
      fromUserName: currentUser.name,
      fromUserTitle: currentUser.title,
      toUserId: toUser.id,
      toUserName: toUser.name,
      toUserTitle: toUser.title,
      instruction,
      notes,
      createdAt: dateStr,
      deadline,
      status: 'Diproses',
    };

    if (parentDispositionId) {
      // Append child disposition
      setDispositions((prev) =>
        prev.map((item) => {
          if (item.id === parentDispositionId) {
            return {
              ...item,
              status: 'Diteruskan',
              children: [...(item.children || []), newStep],
            };
          }
          return item;
        })
      );
    } else {
      setDispositions((prev) => [newStep, ...prev]);
    }

    // Update inbound letter status & link
    setInboundLetters((prev) =>
      prev.map((letter) => {
        if (letter.id === documentId) {
          return {
            ...letter,
            status: 'Didisposisikan',
            dispositionIds: [...letter.dispositionIds, newStep.id],
          };
        }
        return letter;
      })
    );

    // Auto generate Task for receiver
    const newTask: OfficeTask = {
      id: `tsk-${Date.now()}`,
      sourceType: 'Disposisi',
      sourceId: newStep.id,
      sourceReference: dispositionCode,
      title: `${instruction}: ${notes.slice(0, 60)}...`,
      description: `Disposisi dari ${currentUser.name} (${currentUser.title}): ${notes}. Instruksi: ${instruction}`,
      assigneeId: toUser.id,
      assigneeName: toUser.name,
      assigneeUnit: toUser.unit,
      createdDate: now.toISOString().split('T')[0],
      dueDate: deadline,
      priority: 'Tinggi',
      status: 'Sedang Dikerjakan',
      progressPercentage: 10,
    };
    setTasks((prev) => [newTask, ...prev]);

    // Send notification to recipient
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        userId: toUser.id,
        title: 'Disposisi Baru Diterima',
        message: `${currentUser.title} mendisposisikan surat: "${instruction}". Deadline: ${deadline}`,
        time: 'Baru saja',
        read: false,
        type: 'disposition',
        targetModule: 'disposisi',
        targetId: newStep.id,
      },
      ...prev,
    ]);

    addAuditLog(
      'DISPOSITION',
      'Disposisi',
      newStep.id,
      dispositionCode,
      `Disposisi diberikan oleh ${currentUser.name} kepada ${toUser.name}. Instruksi: ${instruction}`
    );

    return newStep;
  };

  const reportDispositionFollowUp = (dispositionId: string, notes: string, attachmentName?: string) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updateStep = (step: DispositionChainStep): DispositionChainStep => {
      if (step.id === dispositionId) {
        return {
          ...step,
          status: 'Selesai',
          followUpReport: {
            reportedAt: formatted,
            notes,
            attachmentName: attachmentName || 'Bukti_Tindak_Lanjut.pdf',
            completedBy: currentUser.name,
          },
        };
      }
      if (step.children) {
        return {
          ...step,
          children: step.children.map(updateStep),
        };
      }
      return step;
    };

    setDispositions((prev) => prev.map(updateStep));

    // Update corresponding task if any
    setTasks((prev) =>
      prev.map((tsk) => {
        if (tsk.sourceId === dispositionId) {
          return {
            ...tsk,
            status: 'Selesai',
            progressPercentage: 100,
            completionNotes: notes,
            completedAt: formatted,
          };
        }
        return tsk;
      })
    );

    addAuditLog(
      'UPDATE_DOCUMENT',
      'Disposisi',
      dispositionId,
      dispositionId,
      `Laporan tindak lanjut disposisi diserahkan oleh ${currentUser.name}: ${notes}`
    );
  };

  const createOutgoingDraft = (data: Partial<OutgoingLetter>): OutgoingLetter => {
    const draftSeq = Math.floor(10 + Math.random() * 90);
    const draftNumber = `DFT/${new Date().getFullYear()}/10/${draftSeq}`;
    const id = `sk-${Date.now()}`;

    // Standard approval chain
    const approvers: OutgoingLetter['approvers'] = [
      {
        stepNumber: 1,
        approverId: currentUser.supervisorId || 'usr-3',
        approverName: currentUser.supervisorId ? users.find((u) => u.id === currentUser.supervisorId)?.name || 'Atasan' : 'Arif Wicaksono, S.T.',
        approverTitle: 'Atasan Langsung',
        approverRole: 'Atasan',
        status: 'Pending',
      },
      {
        stepNumber: 2,
        approverId: 'usr-2',
        approverName: 'Dra. Ratna Indrayani, M.Si.',
        approverTitle: 'Sekretaris Perusahaan',
        approverRole: 'Admin Sekretariat',
        status: 'Pending',
      },
      {
        stepNumber: 3,
        approverId: 'usr-1',
        approverName: 'Ir. H. Hendrawan Suprayogi, M.M.',
        approverTitle: 'Direktur Utama',
        approverRole: 'Direksi',
        status: 'Pending',
      },
    ];

    const newLetter: OutgoingLetter = {
      id,
      type: data.type || 'Surat Dinas',
      draftNumber,
      date: data.date || new Date().toISOString().split('T')[0],
      recipient: data.recipient || 'Kepada Yth. Pimpinan Terkait',
      recipientOrg: data.recipientOrg || 'Mitra Kerja PT BIN',
      isInternal: Boolean(data.isInternal),
      subject: data.subject || 'Perihal Surat Keluar',
      urgency: data.urgency || 'Biasa',
      unit: data.unit || currentUser.unit,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      approvers,
      currentStep: 1,
      status: 'Menunggu Approval',
      content: data.content || 'Isi draft surat keluar resmi PT BIN...',
      lampiranText: data.lampiranText || '-',
      tembusanText: data.tembusanText || '1. Direktur Utama\n2. Arsip',
      tteStatus: 'Belum TTE',
    };

    setOutgoingLetters((prev) => [newLetter, ...prev]);

    addAuditLog(
      'CREATE_DOCUMENT',
      'Surat Keluar',
      newLetter.id,
      newLetter.draftNumber,
      `Draft surat keluar baru ${newLetter.type} "${newLetter.subject}" diajukan oleh ${currentUser.name}`
    );

    return newLetter;
  };

  const actOnApproval = (
    letterId: string,
    action: 'Approved' | 'Rejected' | 'Revision',
    comments?: string,
    delegateToUserId?: string
  ) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setOutgoingLetters((prev) =>
      prev.map((letter) => {
        if (letter.id !== letterId) return letter;

        const updatedApprovers = letter.approvers.map((step) => {
          if (step.stepNumber === letter.currentStep) {
            if (delegateToUserId) {
              const delegatedUser = users.find((u) => u.id === delegateToUserId);
              return {
                ...step,
                status: 'Delegated' as const,
                actedAt: timeStr,
                comments: `Didelegasikan ke ${delegatedUser?.name}: ${comments || 'Plt'}`,
                isDelegated: true,
                delegatedTo: delegatedUser?.name,
              };
            }

            return {
              ...step,
              status: action,
              actedAt: timeStr,
              comments: comments || (action === 'Approved' ? 'Disetujui' : 'Catatan evaluasi'),
            };
          }
          return step;
        });

        let nextStep = letter.currentStep;
        let newStatus = letter.status;

        if (action === 'Approved') {
          if (letter.currentStep < letter.approvers.length) {
            nextStep = letter.currentStep + 1;
            newStatus = 'Menunggu Approval';
          } else {
            // All approved! Auto issue letter number or ready for TTE
            newStatus = 'Disetujui';
          }
        } else if (action === 'Rejected') {
          newStatus = 'Ditolak';
        } else if (action === 'Revision') {
          newStatus = 'Review';
        }

        return {
          ...letter,
          approvers: updatedApprovers,
          currentStep: nextStep,
          status: newStatus,
        };
      })
    );

    addAuditLog(
      action === 'Approved' ? 'APPROVE' : action === 'Rejected' ? 'REJECT' : 'REVISION',
      'Surat Keluar',
      letterId,
      letterId,
      `Approval aksi "${action}" dilakukan oleh ${currentUser.name} (${currentUser.title}). Catatan: ${comments || '-'}`
    );
  };

  const issueLetterNumber = (letterId: string): string => {
    const letter = outgoingLetters.find((l) => l.id === letterId);
    if (!letter) return '';

    const now = new Date();
    const year = now.getFullYear();
    const monthRoman = MONTH_ROMAN[now.getMonth()];
    const typeCodeMap: Record<string, string> = {
      'Surat Dinas': 'SK',
      'Surat Keputusan': 'SK-DIR',
      'Surat Edaran': 'SE',
      'Nota Dinas': 'ND',
      'Memo Internal': 'MEMO',
      'Surat Tugas': 'ST',
      Undangan: 'UND',
      'Surat Permohonan': 'SP',
      'Surat Penawaran': 'SPN',
      'Surat Balasan': 'SB',
    };

    const typeCode = typeCodeMap[letter.type] || 'SK';
    const unitCode = `BIN-${letter.unit || 'DIR'}`;
    const seq = letterNumbers.length + 49;
    const formattedNumber = `${String(seq).padStart(3, '0')}/${unitCode}/${typeCode}/${monthRoman}/${year}`;
    const hash = `bin-${Date.now().toString(16)}-${Math.random().toString(36).substring(2, 9)}`;

    const newRecord: LetterNumberRecord = {
      id: `num-${Date.now()}`,
      formattedNumber,
      sequence: seq,
      year,
      monthRoman,
      unitCode,
      typeCode,
      documentId: letter.id,
      documentSubject: letter.subject,
      issuedAt: `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`,
      issuedBy: currentUser.name,
      status: 'Aktif',
      hash,
    };

    setLetterNumbers((prev) => [newRecord, ...prev]);

    setOutgoingLetters((prev) =>
      prev.map((l) => {
        if (l.id === letterId) {
          return {
            ...l,
            letterNumber: formattedNumber,
            status: 'Nomor Diterbitkan',
            tteStatus: 'Menunggu TTD',
          };
        }
        return l;
      })
    );

    addAuditLog(
      'ISSUE_NUMBER',
      'Surat Keluar',
      letter.id,
      formattedNumber,
      `Penerbitan nomor surat resmi atomik: ${formattedNumber} untuk ${letter.subject}`
    );

    return formattedNumber;
  };

  const applyTteSignature = async (letterId: string): Promise<void> => {
    // Guard 1: fitur TTE harus aktif (toggle admin "Integrasi TTE")
    if (!systemSettings.bsreTteProvider.enabled) return;
    // Guard 2: enforce izin RBAC canSignTTE
    const perms = rolePermissions.find((rp) => rp.role === currentUser.role);
    if (!perms?.canSignTTE) return;

    const source = outgoingLetters.find((l) => l.id === letterId);
    if (!source || source.tteStatus === 'Sudah TTE') return;

    const now = new Date();
    const formattedTime = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')} WIB`;
    const qrCode = `BIN-TTE-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Hash SHA-256 asli (Web Crypto) dari isi surat + kode verifikasi
    const encoder = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${source.content}|${qrCode}`));
    const hash = `sha256-${Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;

    // QR asli: payload = kode verifikasi (Fase 0; Fase 1 pakai URL verifikasi BSrE)
    const qrDataUrl = await makeQrDataUrl(qrCode);

    const signedLetter: OutgoingLetter = {
      ...source,
      status: 'TTE Diterbitkan',
      tteStatus: 'Sudah TTE',
      tteDate: formattedTime,
      tteSigner: `${currentUser.name} (${currentUser.title})`,
      qrVerifyCode: qrCode,
      hash,
      qrDataUrl,
      tteProvider: 'mock',
    };

    // Render PDF final (berisi blok TTE + QR) lalu serahkan ke provider
    const pdfBytes = await generateLetterPdf(signedLetter);
    const provider = getTteProvider();
    const signed = await provider.sign({
      pdfBytes,
      fileName: letterPdfFileName(signedLetter),
      signerName: currentUser.name,
      signerNip: currentUser.nip,
      verifyCode: qrCode,
    });

    const finalLetter: OutgoingLetter = {
      ...signedLetter,
      tteProvider: signed.provider,
      signedPdfBase64: signed.signedPdfBase64,
      verifyUrl: signed.verifyUrl,
    };

    setOutgoingLetters((prev) => prev.map((l) => (l.id === letterId ? finalLetter : l)));

    // Auto archive
    const newArchive: DigitalArchive = {
      id: `arc-${Date.now()}`,
      documentNumber: finalLetter.letterNumber || finalLetter.draftNumber,
      documentType: finalLetter.type,
      title: finalLetter.subject,
      category: 'Persuratan Resmi Terbit',
      unit: finalLetter.unit,
      ownerName: finalLetter.creatorName,
      dateCreated: now.toISOString().split('T')[0],
      retentionPeriodYears: 10,
      retentionExpiryDate: `${now.getFullYear() + 10}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')}`,
      confidentiality: finalLetter.urgency === 'Rahasia' ? 'Rahasia' : 'Biasa',
      status: 'Aktif',
      fileSize: `${Math.max(1, Math.round(pdfBytes.length / 1024))} KB`,
      fileName: `${(finalLetter.letterNumber || 'Dokumen').replace(/\//g, '_')}_Signed.pdf`,
      version: '1.0',
      downloadCount: 1,
      approvedBy: currentUser.name,
      hash,
    };
    setArchives((prev) => [newArchive, ...prev]);

    addAuditLog(
      'SIGN_TTE',
      'Surat Keluar',
      letterId,
      finalLetter.letterNumber || letterId,
      `Tanda Tangan Elektronik (TTE) berhasil dibubuhkan oleh ${currentUser.name} (provider: ${
        signed.provider
      }). Kode Verifikasi: ${qrCode}`
    );
  };

  const submitLeaveRequest = (data: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate' | 'balanceBefore' | 'balanceAfter'>): LeaveRequest => {
    const userBalance = leaveBalances[currentUser.id] || {
      employeeId: currentUser.id,
      annualTotal: 12,
      annualUsed: 0,
      annualRemaining: 12,
      grandTotal: 30,
      grandUsed: 0,
      grandRemaining: 30,
      sickUsed: 0,
      specialUsed: 0,
    };

    const before = userBalance.annualRemaining;
    const after = Math.max(0, before - data.daysCount);

    const newRequest: LeaveRequest = {
      ...data,
      id: `cuti-${Date.now()}`,
      status: 'Diajukan',
      balanceBefore: before,
      balanceAfter: after,
      appliedDate: new Date().toISOString().split('T')[0],
    };

    setLeaveRequests((prev) => [newRequest, ...prev]);

    addAuditLog(
      'CREATE_DOCUMENT',
      'Cuti',
      newRequest.id,
      newRequest.type,
      `Pengajuan cuti ${newRequest.type} (${newRequest.daysCount} hari) diajukan oleh ${currentUser.name}`
    );

    return newRequest;
  };

  const actOnLeaveRequest = (requestId: string, action: 'approve_atasan' | 'verify_hr' | 'reject', notes?: string) => {
    setLeaveRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;

        let status = req.status;
        if (action === 'approve_atasan') status = 'Disetujui Atasan';
        if (action === 'verify_hr') {
          status = 'Diverifikasi HR';
          // Deduct from balance
          setLeaveBalances((bPrev) => {
            const current = bPrev[req.employeeId] || {
              employeeId: req.employeeId,
              annualTotal: 12,
              annualUsed: 0,
              annualRemaining: 12,
              grandTotal: 30,
              grandUsed: 0,
              grandRemaining: 30,
              sickUsed: 0,
              specialUsed: 0,
            };
            return {
              ...bPrev,
              [req.employeeId]: {
                ...current,
                annualUsed: current.annualUsed + req.daysCount,
                annualRemaining: Math.max(0, current.annualRemaining - req.daysCount),
              },
            };
          });
        }
        if (action === 'reject') status = 'Ditolak';

        return {
          ...req,
          status,
          approvalNotes: notes || (action === 'verify_hr' ? 'HR telah memvalidasi saldo cuti.' : 'Disetujui atasan.'),
        };
      })
    );

    addAuditLog(
      action === 'reject' ? 'REJECT' : 'APPROVE',
      'Cuti',
      requestId,
      requestId,
      `Tindakan approval cuti "${action}" diproses oleh ${currentUser.name}. Catatan: ${notes || '-'}`
    );
  };

  const submitTravelRequest = (data: Partial<TravelRequest>): TravelRequest => {
    const seq = travelRequests.length + 26;
    const now = new Date();
    const monthRoman = MONTH_ROMAN[now.getMonth()];
    const requestNumber = `TRV/${now.getFullYear()}/${monthRoman}/${String(seq).padStart(4, '0')}`;
    const id = `trv-${Date.now()}`;

    const newTravel: TravelRequest = {
      id,
      requestNumber,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      employeeNip: currentUser.nip,
      employeeTitle: currentUser.title,
      unit: currentUser.unit,
      destinationCity: data.destinationCity || 'Surabaya, Jawa Timur',
      purpose: data.purpose || 'Koordinasi Kedinasan & Peninjauan Lapangan',
      departureDate: data.departureDate || now.toISOString().split('T')[0],
      returnDate: data.returnDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      durationDays: data.durationDays || 3,
      transportType: data.transportType || 'Pesawat Udara',
      estimatedCost: data.estimatedCost || 5000000,
      costCenter: data.costCenter || 'CC-DTI-104',
      wbsProjectCode: data.wbsProjectCode || 'WBS-OPR-2026',
      costComponents: (data.costComponents || []).filter((c) => c.name.trim()),
      status: 'Diajukan',
    };

    setTravelRequests((prev) => [newTravel, ...prev]);

    addAuditLog(
      'CREATE_DOCUMENT',
      'Perjalanan Dinas',
      newTravel.id,
      newTravel.requestNumber,
      `Pengajuan perjalanan dinas ke ${newTravel.destinationCity} dibuat oleh ${currentUser.name}`
    );

    return newTravel;
  };

  const actOnTravelRequest = (travelId: string, action: 'approve_atasan' | 'approve_direksi' | 'issue_spd') => {
    const now = new Date();
    const year = now.getFullYear();
    const roman = MONTH_ROMAN[now.getMonth()];

    setTravelRequests((prev) =>
      prev.map((item) => {
        if (item.id !== travelId) return item;

        let status = item.status;
        let stNumber = item.suratTugasNumber;
        let spdNumber = item.spdNumber;
        let approvedDate = item.approvedDate;

        if (action === 'approve_atasan') {
          status = 'Disetujui Atasan';
        } else if (action === 'approve_direksi') {
          status = 'Disetujui Direksi';
        } else if (action === 'issue_spd') {
          status = 'SPD Diterbitkan';
          const seq = Math.floor(40 + Math.random() * 50);
          stNumber = `ST-${seq}/BIN-DIR/${roman}/${year}`;
          spdNumber = `SPD-${seq}/BIN-DKEU/${roman}/${year}`;
          approvedDate = now.toISOString().split('T')[0];

          // Auto add task for LPJ
          setTasks((tPrev) => [
            {
              id: `tsk-${Date.now()}`,
              sourceType: 'LPJ Perjalanan Dinas',
              sourceId: item.id,
              sourceReference: `${item.requestNumber} (${item.destinationCity})`,
              title: `Submit LPJ & Bukti Pengeluaran Dinas ${item.destinationCity}`,
              description: `Penyusunan laporan pertanggungjawaban dinas dan lampiran kuitansi/tiket untuk ${item.employeeName}.`,
              assigneeId: item.employeeId,
              assigneeName: item.employeeName,
              assigneeUnit: item.unit,
              createdDate: now.toISOString().split('T')[0],
              dueDate: item.returnDate,
              priority: 'Sedang',
              status: 'Belum Dimulai',
              progressPercentage: 0,
            },
            ...tPrev,
          ]);
        }

        return {
          ...item,
          status,
          suratTugasNumber: stNumber,
          spdNumber,
          approvedDate,
        };
      })
    );

    addAuditLog(
      action === 'issue_spd' ? 'GENERATE_SPD' : 'APPROVE',
      'Perjalanan Dinas',
      travelId,
      travelId,
      `Approval/Penerbitan SPD "${action}" diproses oleh ${currentUser.name}`
    );
  };

  const submitLPJ = (
    travelId: string,
    data: { realizedCost: number; differenceAmount: number; notes: string; items: any[] }
  ) => {
    const now = new Date();
    const formatted = now.toISOString().split('T')[0];

    setTravelRequests((prev) =>
      prev.map((item) => {
        if (item.id === travelId) {
          return {
            ...item,
            status: 'LPJ Diajukan',
            lpj: {
              submittedAt: formatted,
              realizedCost: data.realizedCost,
              differenceAmount: data.differenceAmount,
              notes: data.notes,
              items: data.items,
            },
          };
        }
        return item;
      })
    );

    // Notify Finance
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        userId: 'usr-6', // Kadiv Keuangan
        title: 'LPJ Perjalanan Dinas Siap Diverifikasi',
        message: `LPJ ${travelId} telah diajukan. Mohon verifikasi kuitansi dan posting SAP.`,
        time: 'Baru saja',
        read: false,
        type: 'travel',
        targetModule: 'perjalanan-dinas',
        targetId: travelId,
      },
      ...prev,
    ]);

    addAuditLog(
      'SUBMIT_LPJ',
      'Perjalanan Dinas',
      travelId,
      travelId,
      `LPJ dinas diajukan oleh ${currentUser.name} dengan realisasi Rp ${data.realizedCost.toLocaleString('id-ID')}`
    );
  };

  const verifyLPJ = (travelId: string, financeNotes: string) => {
    const now = new Date();
    const sapDocId = `SAP-DOC-${Math.floor(50000000 + Math.random() * 9999999)}-${now.getFullYear()}`;

    setTravelRequests((prev) =>
      prev.map((item) => {
        if (item.id === travelId && item.lpj) {
          return {
            ...item,
            status: 'Selesai / Posted SAP',
            sapPostingId: sapDocId,
            lpj: {
              ...item.lpj,
              financeNotes,
              financeVerifiedAt: `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(
                now.getMinutes()
              ).padStart(2, '0')}`,
              financeOfficer: `${currentUser.name} (${currentUser.title})`,
            },
          };
        }
        return item;
      })
    );

    addAuditLog(
      'VERIFY_LPJ',
      'Perjalanan Dinas',
      travelId,
      sapDocId,
      `Verifikasi LPJ disetujui & diposting ke SAP FICO (${sapDocId}) oleh ${currentUser.name}`
    );
  };

  const createMeeting = (data: Partial<Meeting>): Meeting => {
    const id = `mtg-${Date.now()}`;
    const inviteeIds = data.attendeeIds?.length
      ? data.attendeeIds
      : (data.attendees || [])
          .map((name) => users.find((u) => u.name === name)?.id)
          .filter((uid): uid is string => Boolean(uid));
    const newMeeting: Meeting = {
      id,
      title: data.title || 'Rapat Koordinasi Unit Kerja',
      date: data.date || new Date().toISOString().split('T')[0],
      timeStart: data.timeStart || '09:00',
      timeEnd: data.timeEnd || '11:00',
      roomOrLink: data.roomOrLink || 'Ruang Rapat Utama Lt. 3',
      isOnline: Boolean(data.isOnline),
      chairPerson: data.chairPerson || currentUser.name,
      notary: data.notary || 'Staf Notulis',
      unit: data.unit || currentUser.unit,
      agendaItems: data.agendaItems || ['Pembahasan agenda umum'],
      attendees: data.attendees || [currentUser.name],
      attendeeIds: inviteeIds,
      status: 'Terjadwal',
      actionItems: [],
    };

    setMeetings((prev) => [newMeeting, ...prev]);

    // Notifikasi undangan rapat untuk setiap peserta yang diundang
    const invitees = inviteeIds
      .map((uid) => users.find((u) => u.id === uid))
      .filter((u): u is NonNullable<typeof u> => Boolean(u));
    if (invitees.length > 0) {
      const meetingNotifs: NotificationItem[] = invitees.map((u, idx) => ({
        id: `notif-${Date.now()}-${idx}`,
        userId: u.id,
        title: 'Undangan Rapat Baru',
        message: `Anda diundang ke rapat "${newMeeting.title}" pada ${newMeeting.date}, pukul ${newMeeting.timeStart}-${newMeeting.timeEnd} WIB di ${newMeeting.roomOrLink}.`,
        time: 'Baru saja',
        read: false,
        type: 'meeting',
        targetModule: 'agenda-rapat',
        targetId: newMeeting.id,
      }));
      setNotifications((prev) => [...meetingNotifs, ...prev]);
    }

    addAuditLog(
      'CREATE_DOCUMENT',
      'Rapat',
      newMeeting.id,
      newMeeting.title,
      `Jadwal rapat baru "${newMeeting.title}" dibuat oleh ${currentUser.name}`
    );

    return newMeeting;
  };

  const updateMeetingMinutes = (
    meetingId: string,
    minutes: string,
    decisions: string[],
    actionItems: { description: string; picId: string; picName: string; deadline: string }[]
  ) => {
    const formattedActionItems = actionItems.map((act) => {
      const taskId = `tsk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Auto create task in Task Management
      const newTask: OfficeTask = {
        id: taskId,
        sourceType: 'Action Item Rapat',
        sourceId: meetingId,
        sourceReference: `Action Item: ${act.description.slice(0, 30)}...`,
        title: act.description,
        description: `Tindak lanjut notulen rapat resmi PT BIN. PIC: ${act.picName}.`,
        assigneeId: act.picId,
        assigneeName: act.picName,
        assigneeUnit: 'PT BIN',
        createdDate: new Date().toISOString().split('T')[0],
        dueDate: act.deadline,
        priority: 'Sedang',
        status: 'Sedang Dikerjakan',
        progressPercentage: 0,
      };

      setTasks((tPrev) => [newTask, ...tPrev]);

      return {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        description: act.description,
        picId: act.picId,
        picName: act.picName,
        deadline: act.deadline,
        status: 'Proses' as const,
        taskId,
      };
    });

    setMeetings((prev) =>
      prev.map((mtg) => {
        if (mtg.id === meetingId) {
          return {
            ...mtg,
            status: 'Selesai',
            minutesNotes: minutes,
            decisions,
            actionItems: formattedActionItems,
          };
        }
        return mtg;
      })
    );

    addAuditLog(
      'UPDATE_DOCUMENT',
      'Rapat',
      meetingId,
      meetingId,
      `Notulen dan keputusan rapat dicatat oleh ${currentUser.name}. ${actionItems.length} Action Items dikonversi menjadi Task.`
    );
  };

  const updateTaskStatus = (
    taskId: string,
    status: OfficeTask['status'],
    progress: number,
    completionNotes?: string
  ) => {
    const now = new Date();
    const formatted = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status,
            progressPercentage: progress,
            completionNotes: completionNotes || t.completionNotes,
            completedAt: status === 'Selesai' ? formatted : t.completedAt,
          };
        }
        return t;
      })
    );

    addAuditLog(
      'UPDATE_DOCUMENT',
      'Disposisi',
      taskId,
      taskId,
      `Task status diupdate ke "${status}" (Progress ${progress}%) oleh ${currentUser.name}`
    );
  };

  const archiveDocument = (archiveData: Partial<DigitalArchive>): DigitalArchive => {
    const now = new Date();
    const id = `arc-${Date.now()}`;
    const hash = `sha256-${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;

    const newArchive: DigitalArchive = {
      id,
      documentNumber: archiveData.documentNumber || `DOC-${Date.now()}`,
      documentType: archiveData.documentType || 'Surat Dinas',
      title: archiveData.title || 'Dokumen Terarsip',
      category: archiveData.category || 'Arsip Statis',
      unit: archiveData.unit || currentUser.unit,
      ownerName: archiveData.ownerName || currentUser.name,
      dateCreated: archiveData.dateCreated || now.toISOString().split('T')[0],
      retentionPeriodYears: archiveData.retentionPeriodYears || 10,
      retentionExpiryDate:
        archiveData.retentionExpiryDate ||
        `${now.getFullYear() + (archiveData.retentionPeriodYears || 10)}-${String(now.getMonth() + 1).padStart(
          2,
          '0'
        )}-${String(now.getDate()).padStart(2, '0')}`,
      confidentiality: archiveData.confidentiality || 'Biasa',
      status: 'Aktif',
      fileSize: archiveData.fileSize || '1.8 MB',
      fileName: archiveData.fileName || 'Berkas_Arsip_Resmi.pdf',
      version: '1.0',
      downloadCount: 0,
      approvedBy: archiveData.approvedBy || currentUser.name,
      hash,
    };

    setArchives((prev) => [newArchive, ...prev]);

    addAuditLog(
      'ARCHIVE',
      'Arsip',
      newArchive.id,
      newArchive.documentNumber,
      `Dokumen ${newArchive.documentNumber} (${newArchive.title}) berhasil disimpan ke Arsip Digital dengan retensi ${newArchive.retentionPeriodYears} tahun`
    );

    return newArchive;
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const verifyDocumentByCode = (code: string) => {
    const trimmed = code.trim().toLowerCase();

    // Check in Outgoing Letters
    const foundOut = outgoingLetters.find(
      (l) =>
        (l.qrVerifyCode && l.qrVerifyCode.toLowerCase() === trimmed) ||
        (l.letterNumber && l.letterNumber.toLowerCase() === trimmed) ||
        (l.hash && l.hash.toLowerCase() === trimmed)
    );

    if (foundOut) {
      return {
        valid: true,
        doc: {
          number: foundOut.letterNumber || foundOut.draftNumber,
          type: foundOut.type,
          subject: foundOut.subject,
          date: foundOut.date,
          issuer: foundOut.tteSigner || 'PT BIN',
          status: 'Tanda Tangan Elektronik Asli & Tersertifikasi (BSrE Valid)',
          qrCode: foundOut.qrVerifyCode,
          hash: foundOut.hash,
        },
        message: 'Dokumen Sah dan Terverifikasi dalam Basis Data Resmi PT BIN.',
      };
    }

    // Check in Number records
    const foundNum = letterNumbers.find(
      (n) => n.formattedNumber.toLowerCase() === trimmed || n.hash.toLowerCase() === trimmed
    );

    if (foundNum) {
      return {
        valid: true,
        doc: {
          number: foundNum.formattedNumber,
          type: foundNum.typeCode,
          subject: foundNum.documentSubject,
          date: foundNum.issuedAt,
          issuer: foundNum.issuedBy,
          status: foundNum.status === 'Aktif' ? 'Nomor Sah Terdaftar' : 'Nomor Dibatalkan / Void',
          hash: foundNum.hash,
        },
        message: 'Nomor Surat Terdaftar Resmi di Buku Register Penomoran PT BIN.',
      };
    }

    return {
      valid: false,
      message: 'Kode Verifikasi / Hash tidak ditemukan dalam sistem resmi PT BIN. Waspadai dokumen palsu.',
    };
  };

  const resetAllToInitial = () => {
    localStorage.clear();
    setInboundLetters(INITIAL_INBOUND_LETTERS);
    setOutgoingLetters(INITIAL_OUTGOING_LETTERS);
    setDispositions(INITIAL_DISPOSITIONS);
    setLetterNumbers(INITIAL_LETTER_NUMBERS);
    setLeaveRequests(INITIAL_LEAVE_REQUESTS);
    setLeaveBalances(INITIAL_LEAVE_BALANCES);
    setTravelRequests(INITIAL_TRAVEL_REQUESTS);
    setMeetings(INITIAL_MEETINGS);
    setTasks(INITIAL_TASKS);
    setArchives(INITIAL_ARCHIVES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setUsers(INITIAL_USERS);
    setUnits(INITIAL_UNITS);
    setWorkflowConfigs(INITIAL_WORKFLOW_CONFIGS);
    setSystemSettings(INITIAL_SYSTEM_SETTINGS);
    setRolePermissions(INITIAL_ROLE_PERMISSIONS);
    setTemplates(INITIAL_TEMPLATES);
    setNumberingRules(INITIAL_NUMBERING_RULES);
    setCurrentUserId('usr-1');
  };

  return (
    <OfficeContext.Provider
      value={{
        currentUser,
        users,
        units,
        workflowConfigs,
        systemSettings,
        rolePermissions,
        inboundLetters,
        outgoingLetters,
        dispositions,
        letterNumbers,
        leaveRequests,
        leaveBalances,
        travelRequests,
        meetings,
        tasks,
        archives,
        templates,
        numberingRules,
        auditLogs,
        notifications,
        activeModule,
        setActiveModule,
        selectedDocumentForPreview,
        setSelectedDocumentForPreview,
        qrVerificationModalData,
        setQrVerificationModalData,
        switchUser,
        addUser,
        updateUser,
        deleteUser,
        addUnit,
        updateUnit,
        deleteUnit,
        addWorkflowConfig,
        updateWorkflowConfig,
        deleteWorkflowConfig,
        addNumberingRule,
        updateNumberingRule,
        deleteNumberingRule,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        updateSystemSettings,
        updateRolePermission,
        exportAllDataAsJSON,
        importDataFromJSON,
        registerInboundLetter,
        createDisposition,
        reportDispositionFollowUp,
        createOutgoingDraft,
        actOnApproval,
        issueLetterNumber,
        applyTteSignature,
        submitLeaveRequest,
        actOnLeaveRequest,
        submitTravelRequest,
        actOnTravelRequest,
        submitLPJ,
        verifyLPJ,
        createMeeting,
        updateMeetingMinutes,
        updateTaskStatus,
        archiveDocument,
        addAuditLog,
        markNotificationRead,
        markAllNotificationsRead,
        verifyDocumentByCode,
        resetAllToInitial,
      }}
    >
      {children}
    </OfficeContext.Provider>
  );
};

export const useOffice = () => {
  const context = useContext(OfficeContext);
  if (!context) {
    throw new Error('useOffice must be used within an OfficeProvider');
  }
  return context;
};
