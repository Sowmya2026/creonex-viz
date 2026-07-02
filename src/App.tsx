import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DashboardView } from './views/DashboardView';
import { InvoicesView } from './views/InvoicesView';
import { InvoiceEditorView } from './views/InvoiceEditorView';
import { InvoiceViewer } from './views/InvoiceViewer';
import { ClientsView } from './views/ClientsView';
import { SettingsView } from './views/SettingsView';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings as SettingsIcon,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import './styles/global.css';

function MainAppContent() {
  const { theme, toggleTheme, settings } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Navigation / Editor states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [editInvoiceMode, setEditInvoiceMode] = useState<boolean>(false);

  // Mobile sidebar state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>Creonex Invoice</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>v1.0.0 (Local OS)</div>
          </div>
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Switch theme mode">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Panel wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              style={{ display: 'none', background: 'var(--border-color)', color: 'var(--text-main)', padding: '6px' }}
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
