import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { InvoiceStatus } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/format';
import { 
  Printer, 
  Share2, 
  Edit, 
  ChevronLeft, 
  Check, 
  AlertTriangle,
  CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import '../styles/print.css';

interface InvoiceViewerProps {
  invoiceId: string | null;
  setActiveTab: (tab: string) => void;
  setSelectedInvoiceId: (id: string | null) => void;
  setEditInvoiceMode: (isEdit: boolean) => void;
}

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({
  invoiceId,
  setActiveTab,
  setSelectedInvoiceId,
  setEditInvoiceMode
}) => {
  const { invoices, clients, settings, updateInvoice } = useApp();
  const [shareSuccess, setShareSuccess] = useState(false);

  const invoice = useMemo(() => {
    return invoices.find(inv => inv.id === invoiceId) || null;
  }, [invoices, invoiceId]);

  const client = useMemo(() => {
    if (!invoice) return null;
    return clients.find(c => c.id === invoice.clientId) || null;
  }, [clients, invoice]);

  if (!invoice) {
    return (
      <div className="content-container">
        <p className="text-muted">Invoice not found or deleted.</p>
        <button className="btn btn-secondary" onClick={() => setActiveTab('invoices')}>
          Back to list
        </button>
      </div>
    );
  }

  // Trigger print dialogue with page title set to the invoice number (controls default PDF filename)
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = invoice.invoiceNumber;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  };

  // Quick share / copy info
  const handleShare = () => {
    const shareText = `Creonex Invoice Details:\nInvoice Number: ${invoice.invoiceNumber}\nClient: ${client?.name}\nTotal: ${formatCurrency(invoice.total, settings.currency)}\nDue Date: ${formatDate(invoice.dueDate)}`;
    navigator.clipboard.writeText(shareText).then(() => {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    });
  };

  // Toggle status and blast confetti if paid
  const handleStatusChange = (newStatus: InvoiceStatus) => {
    updateInvoice(invoice.id, { status: newStatus });
    if (newStatus === 'Paid') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleEdit = () => {
    setSelectedInvoiceId(invoice.id);
    setEditInvoiceMode(true);
    setActiveTab('editor');
  };

  return (
    <div className="content-container">
      {/* Action Navigation Header */}
      <div className="viewer-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button className="btn btn-secondary" onClick={() => setActiveTab('invoices')}>
          <ChevronLeft size={16} /> Back to Invoices
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Status quick toggle */}
          <div style={{ display: 'flex', gap: '6px', marginRight: '16px', borderRight: '1px solid var(--border-color)', paddingRight: '16px' }}>
            {invoice.status !== 'Paid' && (
              <button className="btn btn-success" style={{ padding: '8px 12px', fontSize: '0.8rem' }} onClick={() => handleStatusChange('Paid')}>
                <Check size={14} /> Mark Paid
              </button>
            )}
            {invoice.status !== 'Unpaid' && invoice.status !== 'Draft' && (
              <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--warning-text)' }} onClick={() => handleStatusChange('Unpaid')}>
                <AlertTriangle size={14} style={{ stroke: 'var(--warning)' }} /> Mark Unpaid
              </button>
            )}
          </div>

          <button className="btn btn-secondary" onClick={handleShare}>
            <Share2 size={16} /> {shareSuccess ? 'Copied Details!' : 'Share Info'}
          </button>
          <button className="btn btn-secondary" onClick={handleEdit}>
            <Edit size={16} /> Edit Invoice
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print & PDF
          </button>
        </div>
      </div>

      {/* Scrollable container for mobile */}
      <div className="invoice-scroll-wrapper" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '16px' }}>
        {/* Invoice Document Canvas (A4 Styling) */}
        <div className="card invoice-print-container" style={{ 
          minWidth: '800px',
          maxWidth: '850px', 
          margin: '0 auto', 
        padding: '50px', 
        backgroundColor: '#ffffff', 
        color: '#0f172a',
        border: '1px solid #e2e8f0',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        
        {/* Invoice Header details */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt="Logo" 
                style={{ 
                  height: '45px', 
                  objectFit: 'contain',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  display: 'block'
                }} 
              />
            ) : (
              <div style={{ 
                width: '42px', 
                height: '42px', 
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                fontWeight: 800, 
                fontSize: '1.4rem',
                marginBottom: '12px'
              }}>
                C
              </div>
            )}
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.6rem', color: '#1e293b' }}>
              {settings.name}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
              <div>{settings.email}</div>
              <div>{settings.phone}</div>
              <div style={{ whiteSpace: 'pre-line', maxWidth: '280px' }}>{settings.address}</div>
              {settings.taxId && <div>Tax Registration: {settings.taxId}</div>}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '2.5rem', color: '#4f46e5', letterSpacing: '-0.03em', lineHeight: '1' }}>
              INVOICE
            </h1>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '8px', color: '#0f172a' }}>
              {invoice.invoiceNumber}
            </div>
            
            <div style={{ display: 'inline-block', marginTop: '12px' }}>
              <span className={`badge badge-${invoice.status.toLowerCase()}`} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Separator line */}
        <div style={{ height: '1px', backgroundColor: '#e2e8f0', marginBottom: '32px' }}></div>

        {/* Sender & Recipient addresses */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px', fontSize: '0.9rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Billed To
            </span>
            {client ? (
              <div>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', marginBottom: '4px' }}>{client.name}</div>
                <div style={{ color: '#475569', lineHeight: '1.5' }}>
                  <div>{client.email}</div>
                  {client.phone && <div>{client.phone}</div>}
                  {client.address && <div style={{ whiteSpace: 'pre-line', marginTop: '4px' }}>{client.address}</div>}
                  {client.taxId && <div style={{ marginTop: '4px' }}>Tax ID: {client.taxId}</div>}
                </div>
              </div>
            ) : (
              <div style={{ color: '#ef4444' }}>Unknown Client (Deleted)</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '40px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
                Date Issued
              </span>
              <span style={{ fontWeight: 600, color: '#334155' }}>{formatDate(invoice.issueDate)}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
                Payment Due
              </span>
              <span style={{ fontWeight: 600, color: '#334155' }}>{formatDate(invoice.dueDate)}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Line Item</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', width: '10%' }}>Qty</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', width: '18%' }}>Price</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', width: '12%' }}>Tax</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', width: '12%' }}>Discount</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', width: '18%' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => {
              const rowSub = item.price * item.quantity;
              const rowDiscount = rowSub * (item.discount / 100);
              const rowTax = (rowSub - rowDiscount) * (item.taxRate / 100);
              const rowTotal = rowSub - rowDiscount + rowTax;

              return (
                <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 8px' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.name}</div>
                    {item.description && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>{item.description}</div>}
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center', color: '#475569' }}>{item.quantity}</td>
                  <td style={{ padding: '14px 8px', textAlign: 'right', color: '#475569' }}>{formatCurrency(item.price, settings.currency)}</td>
                  <td style={{ padding: '14px 8px', textAlign: 'right', color: '#475569' }}>{item.taxRate}%</td>
                  <td style={{ padding: '14px 8px', textAlign: 'right', color: '#475569' }}>{item.discount}%</td>
                  <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                    {formatCurrency(rowTotal, settings.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary calculations */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', fontSize: '0.9rem' }}>
          {/* Notes and instructions */}
          <div>
            {invoice.paymentDetails && (
              <div style={{ marginBottom: '24px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                  <CreditCard size={12} /> Payment Bank Account
                </span>
                <div style={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'pre-line', lineHeight: '1.5', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  {invoice.paymentDetails}
                </div>
              </div>
            )}
            {invoice.terms && (
              <div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Terms & Conditions
                </span>
                <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
                  {invoice.terms}
                </div>
              </div>
            )}
          </div>

          {/* Pricing calculations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Subtotal:</span>
              <span style={{ fontWeight: 600, color: '#334155' }}>{formatCurrency(invoice.subtotal, settings.currency)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
                <span>Discount applied:</span>
                <span>-{formatCurrency(invoice.discountAmount, settings.currency)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Sales Tax:</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>+{formatCurrency(invoice.taxAmount, settings.currency)}</span>
              </div>
            )}
            
            <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '8px 0' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem', color: '#4f46e5' }}>
              <span>Total Due:</span>
              <span>{formatCurrency(invoice.total, settings.currency)}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes (Visible on Print) */}
        {invoice.notes && (
          <div style={{ marginTop: '50px', borderTop: '1px dashed #e2e8f0', paddingTop: '20px', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>Invoice Memo: </span>
            {invoice.notes}
          </div>
        )}
      </div>
    </div>
  </div>
);
};
