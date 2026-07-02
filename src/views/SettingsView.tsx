import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Save, 
  Download, 
  Upload, 
  Building, 
  CreditCard, 
  Sliders, 
  Database,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, exportDatabase, importDatabase } = useApp();

  // Form states matching Settings
  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState(settings.email);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [taxId, setTaxId] = useState(settings.taxId);
  const [bankName, setBankName] = useState(settings.bankName);
  const [accountNumber, setAccountNumber] = useState(settings.accountNumber);
  const [routingNumber, setRoutingNumber] = useState(settings.routingNumber);
  const [currency, setCurrency] = useState(settings.currency);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(settings.nextInvoiceNumber);
  const [termsAndConditions, setTermsAndConditions] = useState(settings.termsAndConditions || '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [accountName, setAccountName] = useState(settings.accountName || '');

  // Notifications
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; msg: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name,
      email,
      phone,
      address,
      taxId,
      bankName,
      accountNumber,
      routingNumber,
      currency,
      invoicePrefix,
      nextInvoiceNumber: Number(nextInvoiceNumber),
      termsAndConditions,
      logoUrl,
      accountName
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExport = () => {
    const dataStr = exportDatabase();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `creonex_invoice_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const ok = importDatabase(parsed);
        if (ok) {
          setImportStatus({ success: true, msg: 'Database imported successfully! Page will reflect the updates.' });
          
          // Refresh state from updated settings
          if (parsed.settings) {
            setName(parsed.settings.name);
            setEmail(parsed.settings.email);
            setPhone(parsed.settings.phone);
            setAddress(parsed.settings.address);
            setTaxId(parsed.settings.taxId);
            setBankName(parsed.settings.bankName);
            setAccountNumber(parsed.settings.accountNumber);
            setRoutingNumber(parsed.settings.routingNumber);
            setCurrency(parsed.settings.currency);
            setInvoicePrefix(parsed.settings.invoicePrefix);
            setNextInvoiceNumber(parsed.settings.nextInvoiceNumber);
            setTermsAndConditions(parsed.settings.termsAndConditions || '');
            setLogoUrl(parsed.settings.logoUrl || '');
            setAccountName(parsed.settings.accountName || '');
          }
        } else {
          setImportStatus({ success: false, msg: 'Invalid backup file structure. Import aborted.' });
        }
      } catch {
        setImportStatus({ success: false, msg: 'Error parsing JSON file. Make sure it is a valid backup.' });
      }
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setLogoUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="content-container">
      {/* View Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Settings
        </h1>
        <p className="text-muted">Configure company profiles, default billing variables, and backup states.</p>
      </div>

      {saveSuccess && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'var(--success-light)', color: 'var(--success-text)', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
          <CheckCircle size={18} />
          <span>Company profile updated successfully!</span>
        </div>
      )}

      {importStatus && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '12px 16px', 
          backgroundColor: importStatus.success ? 'var(--success-light)' : 'var(--danger-light)', 
          color: importStatus.success ? 'var(--success-text)' : 'var(--danger-text)', 
          borderRadius: 'var(--radius-md)', 
          fontWeight: 600 
        }}>
          {importStatus.success ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{importStatus.msg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="layout-split">
          
          {/* Left Columns - Settings Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Card 1: Company Profile */}
            <div className="card">
              <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building size={18} className="text-muted" /> Company Information
                </h3>
              </div>

              <div className="form-group">
                <label className="form-label">Legal Entity Name *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Billing Email Address *</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Corporate Phone Number</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">GSTIN / Tax ID (RFC/EIN)</label>
                  <input type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)} className="form-input" />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Registered Office Address</label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" rows={2} style={{ resize: 'none' }} />
                </div>
              </div>
            </div>

            {/* Card 2: Financial Details / Bank accounts */}
            <div className="card">
              <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} className="text-muted" /> Bank Account Details
                </h3>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Account Holder Name</label>
                  <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="form-input" placeholder="e.g. Ms. Beemer Sowmya" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="form-input" placeholder="e.g. State Bank of India" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="form-input" placeholder="e.g. 62148855051" />
                </div>
                <div className="form-group">
                  <label className="form-label">IFSC Code / Routing Code</label>
                  <input type="text" value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} className="form-input" placeholder="e.g. SBIN0020295" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Columns - Logo, Preferences and Backups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Card: Logo & Branding */}
            <div className="card">
              <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Branding & Corporate Logo
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center' }}>
                {logoUrl ? (
                  <div style={{ position: 'relative', border: '1px solid var(--border-color)', padding: '8px', borderRadius: 'var(--radius-md)', background: '#ffffff', maxWidth: '200px' }}>
                    <img src={logoUrl} alt="Company Logo" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                    <button 
                      type="button" 
                      onClick={() => setLogoUrl('')} 
                      className="btn-icon" 
                      style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--danger-light)', border: '1px solid var(--danger)', padding: '4px', borderRadius: '50%', cursor: 'pointer' }}
                      title="Clear Logo"
                    >
                      <X size={12} style={{ stroke: 'var(--danger)' }} />
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-hover)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                    No Logo
                  </div>
                )}

                <div style={{ width: '100%' }}>
                  <input 
                    type="file" 
                    id="logo-upload-input" 
                    accept="image/*" 
                    onChange={handleLogoFileChange} 
                    style={{ display: 'none' }} 
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ width: '100%', marginBottom: '12px' }} 
                    onClick={() => document.getElementById('logo-upload-input')?.click()}
                  >
                    <Upload size={16} /> Upload Logo Image
                  </button>

                  <div className="form-group" style={{ textAlign: 'left', marginBottom: 0 }}>
                    <label className="form-label">Or Custom Image URL</label>
                    <input 
                      type="text" 
                      value={logoUrl} 
                      onChange={(e) => setLogoUrl(e.target.value)} 
                      placeholder="https://example.com/logo.png" 
                      className="form-input" 
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Invoicing Preferences */}
            <div className="card">
              <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={18} className="text-muted" /> Invoice Configuration
                </h3>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Number Prefix</label>
                  <input type="text" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} className="form-input" placeholder="e.g. INV-" />
                </div>
                <div className="form-group">
                  <label className="form-label">Next Number</label>
                  <input type="number" value={nextInvoiceNumber} onChange={(e) => setNextInvoiceNumber(Number(e.target.value))} className="form-input" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="form-input">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Default Terms & Conditions</label>
                <textarea 
                  value={termsAndConditions} 
                  onChange={(e) => setTermsAndConditions(e.target.value)} 
                  className="form-input" 
                  rows={3} 
                  placeholder="e.g. Net 15"
                  style={{ resize: 'none' }}
                />
              </div>
            </div>

            {/* Card 4: Backup Operations */}
            <div className="card">
              <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={18} className="text-muted" /> Backup & Data Security
                </h3>
              </div>

              <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '16px' }}>
                All your billing history and settings are stored locally. Export or import backups to preserve your business records.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={handleExport}>
                  <Download size={16} /> Export Backup (JSON)
                </button>
                <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={handleImportClick}>
                  <Upload size={16} /> Import Backup (JSON)
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileImport} 
                  accept="application/json" 
                  style={{ display: 'none' }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Button */}
        <div className="card" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px' }}>
          <button type="submit" className="btn btn-primary">
            <Save size={18} /> Save Settings Profile
          </button>
        </div>
      </form>
    </div>
  );
};
