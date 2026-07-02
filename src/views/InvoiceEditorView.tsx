import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { InvoiceItem, InvoiceStatus } from '../context/AppContext';
import { Plus, Trash, Save, X, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface InvoiceEditorViewProps {
  invoiceId: string | null;
  setActiveTab: (tab: string) => void;
  setSelectedInvoiceId: (id: string | null) => void;
  isEditMode: boolean;
}

export const InvoiceEditorView: React.FC<InvoiceEditorViewProps> = ({
  invoiceId,
  setActiveTab,
  setSelectedInvoiceId,
  isEditMode
}) => {
  const { clients, invoices, settings, addInvoice, updateInvoice, addClient } = useApp();

  // Selected Client
  const [clientId, setClientId] = useState('');
  
  // Invoice Metadata
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(settings.termsAndConditions || '');
  const [paymentDetails, setPaymentDetails] = useState(
    `Account Name: ${settings.accountName || settings.name}\nBank Name: ${settings.bankName}\nAccount Number: ${settings.accountNumber}\nIFSC Code: ${settings.routingNumber}`
  );

  // Line items
  const [items, setItems] = useState<Omit<InvoiceItem, 'id'>[]>([
    { name: '', description: '', quantity: 1, price: 0, taxRate: 0, discount: 0 }
  ]);

  // Inline Client Quick Add Modal
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // Pre-fill fields if in Edit Mode
  useEffect(() => {
    if (isEditMode && invoiceId) {
      const inv = invoices.find(i => i.id === invoiceId);
      if (inv) {
        setClientId(inv.clientId);
        setInvoiceNumber(inv.invoiceNumber);
        setIssueDate(inv.issueDate);
        setDueDate(inv.dueDate);
        setNotes(inv.notes || '');
        setTerms(inv.terms || '');
        setPaymentDetails(inv.paymentDetails || '');
        setItems(inv.items.map(item => ({
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          price: item.price,
          taxRate: item.taxRate,
          discount: item.discount
        })));
      }
    } else {
      // Create Mode - Set Defaults
      setClientId(clients[0]?.id || '');
      
      const paddedNum = String(settings.nextInvoiceNumber).padStart(6, '0');
      setInvoiceNumber(`${settings.invoicePrefix}${paddedNum}`);
      
      const today = new Date().toISOString().slice(0, 10);
      setIssueDate(today);

      // Due date defaults to 15 days from now
      const due = new Date();
      due.setDate(due.getDate() + 15);
      setDueDate(due.toISOString().slice(0, 10));

      setNotes('');
      setTerms(settings.termsAndConditions || '');
      setPaymentDetails(
        `Account Name: ${settings.accountName || settings.name}\nBank Name: ${settings.bankName}\nAccount Number: ${settings.accountNumber}\nIFSC Code: ${settings.routingNumber}`
      );
      setItems([{ name: '', description: '', quantity: 1, price: 0, taxRate: 0, discount: 0 }]);
    }
  }, [isEditMode, invoiceId, invoices, clients, settings]);

  // Handle Item row updates
  const handleItemChange = (index: number, field: keyof Omit<InvoiceItem, 'id'>, value: string | number) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { name: '', description: '', quantity: 1, price: 0, taxRate: 0, discount: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Real-time computations
  const totals = React.useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    items.forEach(item => {
      const itemSubtotal = (item.price || 0) * (item.quantity || 0);
      const itemDiscount = itemSubtotal * ((item.discount || 0) / 100);
      const discountedSubtotal = itemSubtotal - itemDiscount;
      const itemTax = discountedSubtotal * ((item.taxRate || 0) / 100);

      subtotal += itemSubtotal;
      discountAmount += itemDiscount;
      taxAmount += itemTax;
    });

    const total = subtotal - discountAmount + taxAmount;

    return {
      subtotal,
      taxAmount,
      discountAmount,
      total
    };
  }, [items]);

  // Client Quick Add Save
  const handleQuickAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) return;

    const created = addClient({
      name: newClientName,
      email: newClientEmail,
      address: '',
      phone: '',
      taxId: ''
    });

    setClientId(created.id);
    setIsClientModalOpen(false);
    setNewClientName('');
    setNewClientEmail('');
  };

  // Form Submit
  const handleSaveInvoice = (status: InvoiceStatus) => {
    if (!clientId) {
      alert('Please select or create a client first.');
      return;
    }

    if (items.some(item => !item.name)) {
      alert('All items must have a name.');
      return;
    }

    // Attach temporary random IDs to items to fulfill context types
    const formattedItems: InvoiceItem[] = items.map(item => ({
      ...item,
      id: 'item_' + Math.random().toString(36).substr(2, 9)
    }));

    if (isEditMode && invoiceId) {
      updateInvoice(invoiceId, {
        clientId,
        issueDate,
        dueDate,
        items: formattedItems,
        notes,
        terms,
        paymentDetails,
        status
      });
      // Redirect back to invoices
      setSelectedInvoiceId(invoiceId);
      setActiveTab('viewer');
    } else {
      const created = addInvoice({
        clientId,
        issueDate,
        dueDate,
        items: formattedItems,
        notes,
        terms,
        paymentDetails,
        status
      });
      // Redirect to view the new invoice
      setSelectedInvoiceId(created.id);
      setActiveTab('viewer');
    }
  };

  return (
    <div className="content-container">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            {isEditMode ? 'Edit Invoice' : 'Create New Invoice'}
          </h1>
          <p className="text-muted">{isEditMode ? `Modifying invoice ${invoiceNumber}` : 'Draft a professional business bill'}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setActiveTab('invoices')}>
            Cancel
          </button>
          <button className="btn btn-secondary" onClick={() => handleSaveInvoice('Draft')}>
            Save as Draft
          </button>
          <button className="btn btn-primary" onClick={() => handleSaveInvoice('Unpaid')}>
            <Save size={16} /> Save & Finalize
          </button>
        </div>
      </div>

      <div className="layout-split">
        {/* Left - Invoice Details & Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Client & Date section */}
          <div className="card">
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              
              {/* Client Selection */}
              <div className="form-group" style={{ flex: 2, minWidth: '240px', marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label">Client / Customer *</label>
                  <button 
                    type="button" 
                    onClick={() => setIsClientModalOpen(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <PlusCircle size={12} /> Quick Add
                  </button>
                </div>
                <select 
                  value={clientId} 
                  onChange={(e) => setClientId(e.target.value)} 
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="" disabled>Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Invoice Number (informative) */}
              <div className="form-group" style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}>
                <label className="form-label">Invoice Number</label>
                <input 
                  type="text" 
                  value={invoiceNumber} 
                  disabled 
                  className="form-input" 
                  style={{ width: '100%', opacity: 0.7, backgroundColor: 'var(--bg-card-hover)', fontWeight: 700 }}
                />
              </div>

              {/* Dates */}
              <div className="form-group" style={{ flex: 1.2, minWidth: '150px', marginBottom: 0 }}>
                <label className="form-label">Issue Date *</label>
                <input 
                  type="date" 
                  required
                  value={issueDate} 
                  onChange={(e) => setIssueDate(e.target.value)} 
                  className="form-input" 
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ flex: 1.2, minWidth: '150px', marginBottom: 0 }}>
                <label className="form-label">Due Date *</label>
                <input 
                  type="date" 
                  required
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                  className="form-input" 
                  style={{ width: '100%' }}
                />
              </div>

            </div>
          </div>

          {/* Line items Section */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">Itemized Line Details</h3>
              <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={addItemRow}>
                <Plus size={14} /> Add Row
              </button>
            </div>

            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Item Description *</th>
                    <th style={{ width: '15%' }}>Qty</th>
                    <th style={{ width: '15%' }}>Unit Price</th>
                    <th style={{ width: '12%' }}>Tax %</th>
                    <th style={{ width: '12%' }}>Disc %</th>
                    <th style={{ width: '12%' }}>Subtotal</th>
                    <th style={{ width: '4%', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const rowSub = (item.price || 0) * (item.quantity || 0);
                    const rowTotal = rowSub - (rowSub * ((item.discount || 0) / 100)) + (rowSub * (1 - (item.discount || 0)/100) * ((item.taxRate || 0)/100));

                    return (
                      <tr key={`item-${index}`}>
                        <td>
                          <input 
                            type="text" 
                            placeholder="Service/Product name" 
                            value={item.name} 
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)} 
                            className="form-input" 
                            style={{ width: '100%', marginBottom: '4px', fontWeight: 600 }}
                          />
                          <input 
                            type="text" 
                            placeholder="Additional description details (optional)" 
                            value={item.description} 
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                            className="form-input" 
                            style={{ width: '100%', fontSize: '0.8rem' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            min="1" 
                            value={item.quantity} 
                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} 
                            className="form-input" 
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            value={item.price} 
                            onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))} 
                            className="form-input" 
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={item.taxRate} 
                            onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value))} 
                            className="form-input" 
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={item.discount} 
                            onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value))} 
                            className="form-input" 
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td style={{ fontWeight: 600, verticalAlign: 'middle' }}>
                          {formatCurrency(rowTotal, settings.currency)}
                        </td>
                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <button 
                            className="btn-icon" 
                            disabled={items.length === 1}
                            onClick={() => removeItemRow(index)} 
                            style={{ border: 'none', background: 'transparent', opacity: items.length === 1 ? 0.3 : 1, cursor: items.length === 1 ? 'not-allowed' : 'pointer' }}
                            title="Remove Row"
                          >
                            <Trash size={16} style={{ stroke: 'var(--danger)' }} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right - Calculations & Terms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Price Computation Summary */}
          <div className="card">
            <h3 className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              Summary Computations
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Subtotal</span>
                <span>{formatCurrency(totals.subtotal, settings.currency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger-text)' }}>
                <span className="text-muted">Total Discount</span>
                <span>-{formatCurrency(totals.discountAmount, settings.currency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Estimated Tax</span>
                <span>+{formatCurrency(totals.taxAmount, settings.currency)}</span>
              </div>
              
              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem' }}>
                <span>Invoice Total</span>
                <span style={{ color: 'var(--primary)' }}>{formatCurrency(totals.total, settings.currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Bank Details */}
          <div className="card">
            <h3 className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              Terms & Instructions
            </h3>

            <div className="form-group">
              <label className="form-label">Payment Instructions</label>
              <textarea 
                value={paymentDetails} 
                onChange={(e) => setPaymentDetails(e.target.value)} 
                className="form-input" 
                rows={3}
                style={{ resize: 'none', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Default Invoice Terms</label>
              <textarea 
                value={terms} 
                onChange={(e) => setTerms(e.target.value)} 
                className="form-input" 
                rows={2}
                style={{ resize: 'none', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Internal Invoice Notes</label>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                className="form-input" 
                rows={2}
                placeholder="e.g. Sent via support portals"
                style={{ resize: 'none', fontSize: '0.85rem' }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Quick Add Client Modal */}
      {isClientModalOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleQuickAddClient}>
            <div className="modal-header">
              <h3 className="text-xl">Quick Add Client</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsClientModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Client/Company Name *</label>
              <input 
                type="text" 
                required 
                value={newClientName} 
                onChange={(e) => setNewClientName(e.target.value)} 
                className="form-input" 
                placeholder="e.g. Wayne Enterprises"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Billing Email *</label>
              <input 
                type="email" 
                required 
                value={newClientEmail} 
                onChange={(e) => setNewClientEmail(e.target.value)} 
                className="form-input" 
                placeholder="e.g. billing@wayne.corp"
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsClientModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add Client
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
