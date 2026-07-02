import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Client } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/format';
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Trash2, 
  X,
  CreditCard
} from 'lucide-react';

interface ClientsViewProps {
  setActiveTab: (tab: string) => void;
  setSelectedInvoiceId: (id: string | null) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ 
  setActiveTab, 
  setSelectedInvoiceId 
}) => {
  const { clients, invoices, settings, addClient, updateClient, deleteClient } = useApp();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Selected client for showing details
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Client modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');

  // Computations for each client (LTV, Outstanding, Invoice list)
  const clientStats = useMemo(() => {
    const stats: Record<string, { ltv: number; outstanding: number; count: number }> = {};
    
    // Seed all clients
    clients.forEach(c => {
      stats[c.id] = { ltv: 0, outstanding: 0, count: 0 };
    });

    invoices.forEach(inv => {
      if (!stats[inv.clientId]) {
        stats[inv.clientId] = { ltv: 0, outstanding: 0, count: 0 };
      }
      
      stats[inv.clientId].count += 1;
      
      if (inv.status === 'Paid') {
        stats[inv.clientId].ltv += inv.total;
      } else if (inv.status === 'Unpaid' || inv.status === 'Overdue') {
        stats[inv.clientId].outstanding += inv.total;
      }
    });

    return stats;
  }, [clients, invoices]);

  // Filter clients by search
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const term = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        (c.phone && c.phone.toLowerCase().includes(term))
      );
    });
  }, [clients, searchTerm]);

  // Selected Client Details
  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  const selectedClientInvoices = useMemo(() => {
    if (!selectedClientId) return [];
    return invoices
      .filter(inv => inv.clientId === selectedClientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, selectedClientId]);

  // Modal handlers
  const openAddModal = () => {
    setModalMode('add');
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setTaxId('');
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setModalMode('edit');
    setEditingClientId(client.id);
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone || '');
    setAddress(client.address || '');
    setTaxId(client.taxId || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    if (modalMode === 'add') {
      addClient({ name, email, phone, address, taxId });
    } else if (modalMode === 'edit' && editingClientId) {
      updateClient(editingClientId, { name, email, phone, address, taxId });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    // Check if client has invoices
    const count = clientStats[id]?.count || 0;
    if (count > 0) {
      alert(`Cannot delete ${name} because they have ${count} invoice(s) registered. Delete or modify the invoices first.`);
      return;
    }

    if (confirm(`Are you sure you want to delete ${name} from your client database?`)) {
      deleteClient(id);
      if (selectedClientId === id) setSelectedClientId(null);
    }
  };

  const handleInvoiceClick = (id: string) => {
    setSelectedInvoiceId(id);
    setActiveTab('viewer');
  };

  return (
    <div className="content-container">
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Client CRM
          </h1>
          <p className="text-muted">Maintain business relationships, records, and client value indicators.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Add Client
        </button>
      </div>

      {/* Main Panel Layout */}
      <div className={selectedClientId ? "clients-layout" : "grid-cols-1"}>
        {/* Left Side: Client Database */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Search Box */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search clients by name, email, or phone..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="form-input" 
                style={{ width: '100%', paddingLeft: '40px' }}
              />
            </div>
          </div>

          {/* Client List */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>Email / Contact</th>
                    <th>Invoices</th>
                    <th>Lifetime Value</th>
                    <th>Outstanding</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No clients found in database.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => {
                      const stats = clientStats[client.id] || { ltv: 0, outstanding: 0, count: 0 };
                      const isSelected = client.id === selectedClientId;

                      return (
                        <tr 
                          key={client.id} 
                          style={{ backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'transparent', cursor: 'pointer' }}
                          onClick={() => setSelectedClientId(client.id)}
                        >
                          <td>
                            <div style={{ fontWeight: 600 }}>{client.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tax ID: {client.taxId || 'N/A'}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                              <Mail size={12} className="text-muted" />
                              <span>{client.email}</span>
                            </div>
                            {client.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <Phone size={12} />
                                <span>{client.phone}</span>
                              </div>
                            )}
                          </td>
                          <td style={{ fontWeight: 600 }}>{stats.count}</td>
                          <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                            {formatCurrency(stats.ltv, settings.currency)}
                          </td>
                          <td style={{ fontWeight: 700, color: stats.outstanding > 0 ? 'var(--warning-text)' : 'var(--text-muted)' }}>
                            {formatCurrency(stats.outstanding, settings.currency)}
                          </td>
                          <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button className="btn-icon" onClick={() => openEditModal(client)} title="Edit Client">
                                <Edit size={14} />
                              </button>
                              <button className="btn-icon" onClick={() => handleDelete(client.id, client.name)} title="Delete Client">
                                <Trash2 size={14} style={{ stroke: 'var(--danger)' }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Client Panel Details (Only open when client selected) */}
        {selectedClient && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', borderLeft: '3px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 className="text-xl">{selectedClient.name}</h3>
                <span className="form-label">Client Details Panel</span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedClientId(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Core Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', backgroundColor: 'var(--bg-card-hover)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Mail size={16} className="text-muted" style={{ marginTop: '2px' }} />
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Billing Email</span>
                  <span>{selectedClient.email}</span>
                </div>
              </div>
              {selectedClient.phone && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Phone size={16} className="text-muted" style={{ marginTop: '2px' }} />
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Phone Number</span>
                    <span>{selectedClient.phone}</span>
                  </div>
                </div>
              )}
              {selectedClient.address && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <MapPin size={16} className="text-muted" style={{ marginTop: '2px' }} />
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Physical Address</span>
                    <span style={{ whiteSpace: 'pre-line' }}>{selectedClient.address}</span>
                  </div>
                </div>
              )}
              {selectedClient.taxId && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <CreditCard size={16} className="text-muted" style={{ marginTop: '2px' }} />
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tax Registration ID</span>
                    <span>{selectedClient.taxId}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Invoices Logs */}
            <div>
              <h4 className="form-label" style={{ marginBottom: '12px' }}>Billing History ({selectedClientInvoices.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                {selectedClientInvoices.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>No invoices registered for this client.</p>
                ) : (
                  selectedClientInvoices.map(inv => (
                    <div 
                      key={inv.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '12px', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-md)', 
                        cursor: 'pointer' 
                      }}
                      onClick={() => handleInvoiceClick(inv.id)}
                      className="sidebar-item-btn"
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{inv.invoiceNumber}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Issued: {formatDate(inv.issueDate)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{formatCurrency(inv.total, settings.currency)}</div>
                        <span className={`badge badge-${inv.status.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSave}>
            <div className="modal-header">
              <h3 className="text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
                {modalMode === 'add' ? 'Add New Client' : 'Edit Client Profile'}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Client Name *</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="form-input" 
                placeholder="e.g. Wayne Enterprises"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Billing Email *</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="form-input" 
                  placeholder="e.g. accounts@acme.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="form-input" 
                  placeholder="e.g. +1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tax ID (VAT / GST / RFC)</label>
              <input 
                type="text" 
                value={taxId} 
                onChange={(e) => setTaxId(e.target.value)} 
                className="form-input" 
                placeholder="e.g. US-1234567-X"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Physical Address</label>
              <textarea 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                className="form-input" 
                rows={3} 
                placeholder="e.g. 100 Broadway St, New York, NY 10005"
                style={{ resize: 'none' }}
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {modalMode === 'add' ? 'Add Client' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
