import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { InvoiceStatus } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/format';
import { 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Copy, 
  Trash2, 
  Eye, 
  MoreVertical, 
  Check, 
  AlertCircle,
  X,
  Plus
} from 'lucide-react';

interface InvoicesViewProps {
  setActiveTab: (tab: string) => void;
  setSelectedInvoiceId: (id: string | null) => void;
  setEditInvoiceMode: (isEdit: boolean) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ 
  setActiveTab, 
  setSelectedInvoiceId, 
  setEditInvoiceMode 
}) => {
  const { invoices, clients, settings, deleteInvoice, duplicateInvoice, updateInvoice } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [clientFilter, setClientFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  
  // Show/hide advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Row actions menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  // Filter logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const client = clients.find(c => c.id === inv.clientId);
      const clientName = client ? client.name.toLowerCase() : '';
      const invoiceNum = inv.invoiceNumber.toLowerCase();
      const term = searchTerm.toLowerCase();

      // Search matches invoice number, client name, or item description
      const matchesSearch = 
        invoiceNum.includes(term) || 
        clientName.includes(term) || 
        inv.items.some(item => 
          item.name.toLowerCase().includes(term) || 
          (item.description && item.description.toLowerCase().includes(term))
        );

      const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
      const matchesClient = clientFilter === 'All' || inv.clientId === clientFilter;

      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && new Date(inv.issueDate) >= new Date(startDate);
      }
      if (endDate) {
        matchesDate = matchesDate && new Date(inv.issueDate) <= new Date(endDate);
      }

      let matchesAmount = true;
      if (minAmount) {
        matchesAmount = matchesAmount && inv.total >= parseFloat(minAmount);
      }
      if (maxAmount) {
        matchesAmount = matchesAmount && inv.total <= parseFloat(maxAmount);
      }

      return matchesSearch && matchesStatus && matchesClient && matchesDate && matchesAmount;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, clients, searchTerm, statusFilter, clientFilter, startDate, endDate, minAmount, maxAmount]);

  // CSV Export helper
  const exportToCSV = () => {
    const headers = ['Invoice Number', 'Client Name', 'Issue Date', 'Due Date', 'Subtotal', 'Tax Amount', 'Discount Amount', 'Total', 'Status'];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      getClientName(inv.clientId),
      inv.issueDate,
      inv.dueDate,
      inv.subtotal,
      inv.taxAmount,
      inv.discountAmount,
      inv.total,
      inv.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `creonex_invoices_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewDetails = (id: string) => {
    setSelectedInvoiceId(id);
    setActiveTab('viewer');
  };

  const handleEditInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setEditInvoiceMode(true);
    setActiveTab('editor');
  };

  const handleDuplicateInvoice = (id: string) => {
    duplicateInvoice(id);
    setActiveMenuId(null);
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice permanently?')) {
      deleteInvoice(id);
      setActiveMenuId(null);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: InvoiceStatus) => {
    updateInvoice(id, { status: newStatus });
    setActiveMenuId(null);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setClientFilter('All');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    if (maxAmount) setMaxAmount('');
  };

  return (
    <div className="content-container">
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="view-title">
            Invoices
          </h1>
          <p className="view-subtitle">Manage, track, and export billing transactions.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={exportToCSV}>
            <Download size={18} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => {
            setSelectedInvoiceId(null);
            setEditInvoiceMode(false);
            setActiveTab('editor');
          }}>
            <Plus size={18} /> Create Invoice
          </button>
        </div>
      </div>

      {/* Search & Filter Panel */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Main search bar */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by invoice #, client name, or item..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="form-input" 
              style={{ width: '100%', paddingLeft: '40px' }}
            />
          </div>

          {/* Quick Filters */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="form-input"
              style={{ minWidth: '130px' }}
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue</option>
              <option value="Draft">Draft</option>
            </select>

            <select 
              value={clientFilter} 
              onChange={(e) => setClientFilter(e.target.value)} 
              className="form-input"
              style={{ minWidth: '150px' }}
            >
              <option value="All">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button 
              className={`btn ${showAdvancedFilters ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{ padding: '10px' }}
            >
              <Filter size={18} />
            </button>

            {(searchTerm || statusFilter !== 'All' || clientFilter !== 'All' || startDate || endDate || minAmount || maxAmount) && (
              <button className="btn btn-secondary" onClick={resetFilters} style={{ padding: '10px' }}>
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div className="filter-grid" style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-input" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-input" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Min Amount ({settings.currency})</label>
              <input type="number" placeholder="Min" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="form-input" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Max Amount ({settings.currency})</label>
              <input type="number" placeholder="Max" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="form-input" />
            </div>
          </div>
        )}
      </div>

      {/* Invoices Table List */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Client Name</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Invoice Total</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No invoices match your search filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {inv.invoiceNumber}
                    </td>
                    <td style={{ fontWeight: 600 }}>{getClientName(inv.clientId)}</td>
                    <td>{formatDate(inv.issueDate)}</td>
                    <td>{formatDate(inv.dueDate)}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(inv.total, settings.currency)}</td>
                    <td>
                      <span className={`badge badge-${inv.status.toLowerCase()}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', position: 'relative' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button className="btn-icon" onClick={() => handleViewDetails(inv.id)} title="View / Print">
                          <Eye size={15} />
                        </button>
                        <button className="btn-icon" onClick={() => handleEditInvoice(inv.id)} title="Edit Invoice">
                          <Edit size={15} />
                        </button>
                        
                        {/* More Action Toggle */}
                        <div style={{ position: 'relative' }}>
                          <button className="btn-icon" onClick={() => setActiveMenuId(activeMenuId === inv.id ? null : inv.id)}>
                            <MoreVertical size={15} />
                          </button>
                          
                          {activeMenuId === inv.id && (
                            <>
                              {/* Menu overlay to close */}
                              <div style={{ position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, zIndex: 998 }} onClick={() => setActiveMenuId(null)}></div>
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                marginTop: '4px',
                                width: '160px',
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                boxShadow: 'var(--shadow-lg)',
                                zIndex: 999,
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '4px',
                                textAlign: 'left'
                              }}>
                                <button className="sidebar-item-btn" style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-main)' }} onClick={() => handleDuplicateInvoice(inv.id)}>
                                  <Copy size={12} style={{ marginRight: '6px' }} /> Duplicate
                                </button>
                                
                                {inv.status !== 'Paid' && (
                                  <button className="sidebar-item-btn" style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--success)' }} onClick={() => handleUpdateStatus(inv.id, 'Paid')}>
                                    <Check size={12} style={{ marginRight: '6px', stroke: 'var(--success)' }} /> Mark Paid
                                  </button>
                                )}

                                {inv.status !== 'Unpaid' && inv.status !== 'Draft' && (
                                  <button className="sidebar-item-btn" style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--warning-text)' }} onClick={() => handleUpdateStatus(inv.id, 'Unpaid')}>
                                    <AlertCircle size={12} style={{ marginRight: '6px', stroke: 'var(--warning)' }} /> Mark Unpaid
                                  </button>
                                )}

                                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }}></div>

                                <button className="sidebar-item-btn" style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--danger-text)' }} onClick={() => handleDeleteInvoice(inv.id)}>
                                  <Trash2 size={12} style={{ marginRight: '6px', stroke: 'var(--danger)' }} /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile-Friendly Cards List */}
        <div className="mobile-invoice-list">
          {filteredInvoices.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              No invoices match your search filters.
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <div key={`mob-${inv.id}`} className="card mobile-invoice-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem', cursor: 'pointer' }} onClick={() => handleViewDetails(inv.id)}>
                    {inv.invoiceNumber}
                  </span>
                  <span className={`badge badge-${inv.status.toLowerCase()}`}>
                    {inv.status}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{getClientName(inv.clientId)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Due: {formatDate(inv.dueDate)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                    {formatCurrency(inv.total, settings.currency)}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleViewDetails(inv.id)}>
                      View
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleEditInvoice(inv.id)}>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
