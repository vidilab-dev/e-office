import React, { useState } from 'react';
import { OfficeProvider, useOffice } from './context/OfficeContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { SuratMasukView } from './components/letters/SuratMasukView';
import { SuratKeluarView } from './components/letters/SuratKeluarView';
import { DisposisiView } from './components/letters/DisposisiView';
import { ApprovalWorkflowView } from './components/approval/ApprovalWorkflowView';
import { PenomoranSuratView } from './components/letters/PenomoranSuratView';
import { ArsipDigitalView } from './components/archive/ArsipDigitalView';
import { TemplateDokumenView } from './components/templates/TemplateDokumenView';
import { CutiIzinView } from './components/leaves/CutiIzinView';
import { PerjalananDinasView } from './components/travel/PerjalananDinasView';
import { AgendaRapatView } from './components/meetings/AgendaRapatView';
import { TaskManagementView } from './components/tasks/TaskManagementView';
import { LaporanView } from './components/reports/LaporanView';
import { MasterDataView } from './components/master/MasterDataView';
import { AdminManagementView } from './components/admin/AdminManagementView';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { DocumentPreviewModal } from './components/common/DocumentPreviewModal';
import { QRVerifyModal } from './components/common/QRVerifyModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { Menu } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { activeModule } = useOffice();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardView />;
      case 'surat-masuk':
        return <SuratMasukView />;
      case 'surat-keluar':
        return <SuratKeluarView />;
      case 'disposisi':
        return <DisposisiView />;
      case 'approval':
        return <ApprovalWorkflowView />;
      case 'penomoran':
        return <PenomoranSuratView />;
      case 'arsip':
        return <ArsipDigitalView />;
      case 'template':
        return <TemplateDokumenView />;
      case 'cuti':
        return <CutiIzinView />;
      case 'perjalanan-dinas':
        return <PerjalananDinasView />;
      case 'agenda-rapat':
        return <AgendaRapatView />;
      case 'tasks':
        return <TaskManagementView />;
      case 'laporan':
        return <LaporanView />;
      case 'admin':
      case 'master-data':
        return <AdminManagementView />;
      case 'audit-trail':
        return <AuditTrailView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-900 selection:text-white">
      {/* Top Header */}
      <Header onOpenSearch={() => setIsSearchOpen(true)} />

      {/* Mobile Menu Bar trigger */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 p-1.5 rounded hover:bg-slate-100"
        >
          <Menu className="w-4 h-4 text-slate-600" />
          <span>Buka Menu Navigasi</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Backdrop for mobile drawer */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden"
          />
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {renderActiveModule()}
        </main>
      </div>

      {/* Global Modals */}
      <DocumentPreviewModal />
      <QRVerifyModal />
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <OfficeProvider>
      <MainAppContent />
    </OfficeProvider>
  );
}
