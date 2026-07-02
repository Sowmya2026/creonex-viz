import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DashboardView } from './views/DashboardView';
import { InvoicesView } from './views/InvoicesView';
import { InvoiceEditorView } from './views/InvoiceEditorView';
import { InvoiceViewer } from './views/InvoiceViewer';
import { ClientsView } from './views/ClientsView';
import { SettingsView } from './views/SettingsView';
import { AuthView } from './views/AuthView';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings as SettingsIcon,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Sparkles
} from 'lucide-react';
import './styles/global.css';

function MainAppContent() {
  const { 
    theme, 
    toggleTheme, 
    settings, 
    currentUser, 
    authLoading, 
    isDemoMode, 
    setDemoMode 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Navigation / Editor states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [editInvoiceMode, setEditInvoiceMode] = useState<boolean>(false);

  // Mobile sidebar state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth logout / leave demo actions
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('dashboard');
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleLeaveDemo = () => {
    setDemoMode(false);
    setActiveTab('dashboard');
  };

  // Active view renderer
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            setActiveTab={setActiveTab} 
            setSelectedInvoiceId={setSelectedInvoiceId}
            setEditInvoiceMode={setEditInvoiceMode}
          />
        );
      case 'invoices':
        return (
          <InvoicesView 
            setActiveTab={setActiveTab} 
            setSelectedInvoiceId={setSelectedInvoiceId}
            setEditInvoiceMode={setEditInvoiceMode}
          />
        );
      case 'editor':
        return (
          <InvoiceEditorView 
            invoiceId={selectedInvoiceId}
            setActiveTab={setActiveTab}
            setSelectedInvoiceId={setSelectedInvoiceId}
            isEditMode={editInvoiceMode}
          />
        );
      case 'viewer':
        return (
          <InvoiceViewer 
            invoiceId={selectedInvoiceId}
            setActiveTab={setActiveTab}
            setSelectedInvoiceId={setSelectedInvoiceId}
            setEditInvoiceMode={setEditInvoiceMode}
          />
        );
      case 'clients':
        return (
          <ClientsView 
            setActiveTab={setActiveTab}
            setSelectedInvoiceId={setSelectedInvoiceId}
          />
        );
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView 
            setActiveTab={setActiveTab} 
            setSelectedInvoiceId={setSelectedInvoiceId}
            setEditInvoiceMode={setEditInvoiceMode}
          />
        );
    }
  };

  const getTopbarTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'invoices': return 'Manage Invoices';
      case 'editor': return editInvoiceMode ? 'Modify Invoice Record' : 'Draft New Invoice';
      case 'viewer': return 'Invoice View & PDF Printout';
      case 'clients': return 'Client Relationships';
      case 'settings': return 'System Settings';
      default: return 'Creonex Invoicing';
    }
  };

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // 1. Loading State (Shimmer Loader)
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', gap: '16px' }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid var(--border-color)', 
          borderTopColor: 'var(--primary)', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }}></div>
        <p className="text-muted" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Securing Creonex Session...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 2. Unauthenticated State (Auth Gate View)
  if (!currentUser && !isDemoMode) {
    return <AuthView onBypassDemo={() => setDemoMode(true)} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">C</div>
            <span>Creonex</span>
          </div>
          {mobileMenuOpen && (
            <button className="theme-toggle-btn" onClick={() => setMobileMenuOpen(false)} style={{ background: 'none' }}>
              <X size={20} />
            </button>
          )}
        </div>

        <ul className="sidebar-menu">
          <li>
            <button 
              className={`sidebar-item-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('dashboard')}
            >
              <LayoutDashboard size={20} /> Dashboard
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-item-btn ${activeTab === 'invoices' || activeTab === 'editor' || activeTab === 'viewer' ? 'active' : ''}`}
              onClick={() => handleNavClick('invoices')}
            >
              <FileText size={20} /> Invoices
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-item-btn ${activeTab === 'clients' ? 'active' : ''}`}
              onClick={() => handleNavClick('clients')}
            >
              <Users size={20} /> Clients
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-item-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleNavClick('settings')}
            >
              <SettingsIcon size={20} /> Settings
            </button>
          </li>
        </ul>

        {/* Sidebar Footer with Sign Out options */}
        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch', padding: '16px 20px' }}>
          
          {/* User Info tag */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '140px' }}>
              {isDemoMode ? (
                <>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={12} /> Sandbox Mode
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Local Offline Data</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '0.8rem', fontWeight: 750, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser?.email?.split('@')[0]}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={currentUser?.email || ''}>
                    {currentUser?.email}
                  </div>
                </>
              )}
            </div>
            
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Switch Theme Mode" style={{ flexShrink: 0 }}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>

          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }}></div>

          {/* Action logs logouts */}
          {isDemoMode ? (
            <button 
              className="sidebar-item-btn" 
              onClick={handleLeaveDemo}
              style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--warning-text)', background: 'rgba(245, 158, 11, 0.1)', justifyContent: 'center' }}
            >
              Leave Sandbox
            </button>
          ) : (
            <button 
              className="sidebar-item-btn" 
              onClick={handleLogout}
              style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--danger-text)', background: 'rgba(239, 68, 68, 0.08)', justifyContent: 'center' }}
            >
              <LogOut size={14} style={{ marginRight: '6px' }} /> Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main Panel wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              style={{ background: 'var(--border-color)', color: 'var(--text-main)', padding: '6px' }}
              className="theme-toggle-btn btn-icon mobile-menu-toggle"
            >
              <Menu size={20} />
            </button>
            <h2 className="topbar-title">{getTopbarTitle()}</h2>
          </div>

          <div className="topbar-actions">
            <div className="company-badge">
              <div className="company-badge-dot"></div>
              <span>{settings.name}</span>
            </div>
          </div>
        </header>

        {/* Dynamic page content */}
        <main style={{ flex: 1 }}>
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
