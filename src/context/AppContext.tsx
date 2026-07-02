import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  taxRate: number; // percentage
  discount: number; // percentage
}

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Overdue' | 'Draft';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  paymentDetails?: string;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  createdAt: string;
}

export interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  currency: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  logoUrl?: string;
  termsAndConditions?: string;
}

interface AppContextType {
  clients: Client[];
  invoices: Invoice[];
  settings: CompanySettings;
  theme: 'light' | 'dark';
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'subtotal' | 'taxAmount' | 'discountAmount' | 'total'>) => Invoice;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  duplicateInvoice: (id: string) => void;
  updateSettings: (settings: Partial<CompanySettings>) => void;
  toggleTheme: () => void;
  importDatabase: (data: { clients: Client[]; invoices: Invoice[]; settings: CompanySettings }) => boolean;
  exportDatabase: () => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: CompanySettings = {
  name: 'Creonex Technologies Ltd',
  email: 'finance@creonex.com',
  phone: '+1 (555) 234-5678',
  address: '100 Innovation Way, Suite 400, San Francisco, CA 94107',
  taxId: 'US-887462-B',
  bankName: 'Silicon Valley Trust',
  accountNumber: '4099-2811-0988',
  routingNumber: 'SVB129988',
  currency: 'USD',
  invoicePrefix: 'CRX-',
  nextInvoiceNumber: 7,
  logoUrl: '/logo.png',
  termsAndConditions: 'Payment is due within 15 days of invoice date. Thank you for your business!'
};

const mockClients: Client[] = [
  {
    id: 'c1',
    name: 'Wayne Enterprises',
    email: 'finance@wayne.corp',
    phone: '+1 (555) 888-2938',
    address: '1007 Mountain Drive, Gotham City, NJ 07001',
    taxId: 'WY-998811',
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'c2',
    name: 'Stark Industries',
    email: 'accounts@stark.com',
    phone: '+1 (555) 333-8839',
    address: '10880 Malibu Point, Malibu, CA 90265',
    taxId: 'ST-555331',
    createdAt: '2026-02-15T09:30:00.000Z'
  },
  {
    id: 'c3',
    name: 'Globex Corporation',
    email: 'billing@globex.org',
    phone: '+1 (555) 444-9988',
    address: '100 Cypress Creek Rd, Cypress Creek, OR 97401',
    taxId: 'GX-123456',
    createdAt: '2026-03-20T10:15:00.000Z'
  },
  {
    id: 'c4',
    name: 'Acme Corporation',
    email: 'purchasing@acme.com',
    phone: '+1 (555) 123-4567',
    address: '123 Desert Road, Roadrunner Canyon, AZ 85001',
    taxId: 'AC-778899',
    createdAt: '2026-04-05T14:22:00.000Z'
  },
  {
    id: 'c5',
    name: 'Umbrella Corporation',
    email: 'accounts@umbrella.com',
    phone: '+1 (555) 666-3241',
    address: '500 Raccoon City Plaza, Chicago, IL 60601',
    taxId: 'UM-666999',
    createdAt: '2026-05-12T11:05:00.000Z'
  }
];

const mockInvoices: Invoice[] = [
  {
    id: 'inv1',
    invoiceNumber: 'CRX-000001',
    clientId: 'c1',
    issueDate: '2026-06-01',
    dueDate: '2026-06-15',
    items: [
      { id: 'item1', name: 'Software Development Services', description: 'Development of Creonex Cloud Portal - Phase 1', quantity: 80, price: 125, taxRate: 15, discount: 5 },
      { id: 'item2', name: 'UI/UX Consulting', description: 'Design reviews and high-fidelity wireframes', quantity: 20, price: 150, taxRate: 15, discount: 0 }
    ],
    notes: 'Please include the invoice number in your wire transfer comments.',
    terms: 'Net 15',
    paymentDetails: 'Wire Transfer: Silicon Valley Trust\nAccount: 4099-2811-0988\nRouting: SVB129988',
    status: 'Paid',
    subtotal: 13000,
    taxAmount: 1875,
    discountAmount: 500,
    total: 14375,
    createdAt: '2026-06-01T09:00:00.000Z'
  },
  {
    id: 'inv2',
    invoiceNumber: 'CRX-000002',
    clientId: 'c2',
    issueDate: '2026-06-05',
    dueDate: '2026-06-20',
    items: [
      { id: 'item3', name: 'Premium Cloud Hosting', description: 'AWS Enterprise Dedicated Hosting (Monthly)', quantity: 1, price: 4500, taxRate: 10, discount: 10 },
      { id: 'item4', name: 'DevOps Automation Setup', description: 'CI/CD pipeline configuration and Kubernetes clustering', quantity: 30, price: 140, taxRate: 15, discount: 0 }
    ],
    notes: 'Support is covered under SLA tier 1.',
    terms: 'Net 15',
    paymentDetails: 'Wire Transfer: Silicon Valley Trust\nAccount: 4099-2811-0988\nRouting: SVB129988',
    status: 'Paid',
    subtotal: 8700,
    taxAmount: 1035,
    discountAmount: 450,
    total: 9285,
    createdAt: '2026-06-05T10:00:00.000Z'
  },
  {
    id: 'inv3',
    invoiceNumber: 'CRX-000003',
    clientId: 'c3',
    issueDate: '2026-06-18',
    dueDate: '2026-07-18',
    items: [
      { id: 'item5', name: 'Mobile App Development', description: 'iOS and Android app framework design', quantity: 50, price: 110, taxRate: 12, discount: 0 },
      { id: 'item6', name: 'Project Management', description: 'Agile coordination and sprint reports', quantity: 10, price: 90, taxRate: 12, discount: 0 }
    ],
    notes: 'Monthly billing for June sprints.',
    terms: 'Net 30',
    paymentDetails: 'Wire Transfer: Silicon Valley Trust\nAccount: 4099-2811-0988\nRouting: SVB129988',
    status: 'Unpaid',
    subtotal: 6400,
    taxAmount: 768,
    discountAmount: 0,
    total: 7168,
    createdAt: '2026-06-18T11:00:00.000Z'
  },
  {
    id: 'inv4',
    invoiceNumber: 'CRX-000004',
    clientId: 'c4',
    issueDate: '2026-05-10',
    dueDate: '2026-05-25',
    items: [
      { id: 'item7', name: 'E-commerce Theme Integration', description: 'Custom Shopify/WooCommerce theme build', quantity: 1, price: 2500, taxRate: 18, discount: 15 }
    ],
    notes: 'Please settle this overdue invoice immediately.',
    terms: 'Due on Receipt',
    paymentDetails: 'Wire Transfer: Silicon Valley Trust\nAccount: 4099-2811-0988\nRouting: SVB129988',
    status: 'Overdue',
    subtotal: 2500,
    taxAmount: 382.5,
    discountAmount: 375,
    total: 2507.5,
    createdAt: '2026-05-10T14:00:00.000Z'
  },
  {
    id: 'inv5',
    invoiceNumber: 'CRX-000005',
    clientId: 'c2',
    issueDate: '2026-06-30',
    dueDate: '2026-07-30',
    items: [
      { id: 'item8', name: 'Cybersecurity Audit', description: 'Penetration testing and vulnerability reporting', quantity: 1, price: 12000, taxRate: 15, discount: 0 }
    ],
    notes: 'Draft review copy. Not finalized.',
    terms: 'Net 30',
    paymentDetails: 'Wire Transfer: Silicon Valley Trust\nAccount: 4099-2811-0988\nRouting: SVB129988',
    status: 'Draft',
    subtotal: 12000,
    taxAmount: 1800,
    discountAmount: 0,
    total: 13800,
    createdAt: '2026-06-30T16:00:00.000Z'
  },
  {
    id: 'inv6',
    invoiceNumber: 'CRX-000006',
    clientId: 'c1',
    issueDate: '2026-06-25',
    dueDate: '2026-07-25',
    items: [
      { id: 'item9', name: 'Technical Writing', description: 'API Documentation and user manuals', quantity: 25, price: 80, taxRate: 10, discount: 0 }
    ],
    notes: 'Q2 documentation sweep.',
    terms: 'Net 30',
    status: 'Unpaid',
    subtotal: 2000,
    taxAmount: 200,
    discountAmount: 0,
    total: 2200,
    createdAt: '2026-06-25T15:30:00.000Z'
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load initial data
  useEffect(() => {
    const savedClients = localStorage.getItem('crx_clients');
    const savedInvoices = localStorage.getItem('crx_invoices');
    const savedSettings = localStorage.getItem('crx_settings');
    const savedTheme = localStorage.getItem('crx_theme');

    if (savedClients) setClients(JSON.parse(savedClients));
    else {
      setClients(mockClients);
      localStorage.setItem('crx_clients', JSON.stringify(mockClients));
    }

    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    else {
      setInvoices(mockInvoices);
      localStorage.setItem('crx_invoices', JSON.stringify(mockInvoices));
    }

    if (savedSettings) setSettings(JSON.parse(savedSettings));
    else {
      setSettings(defaultSettings);
      localStorage.setItem('crx_settings', JSON.stringify(defaultSettings));
    }

    if (savedTheme) {
      setTheme(savedTheme as 'light' | 'dark');
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  // Update theme helper
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('crx_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Calculations helper for an invoice
  const calculateInvoiceTotals = (items: InvoiceItem[]) => {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    items.forEach(item => {
      const itemSubtotal = item.price * item.quantity;
      const itemDiscount = itemSubtotal * (item.discount / 100);
      const discountedSubtotal = itemSubtotal - itemDiscount;
      const itemTax = discountedSubtotal * (item.taxRate / 100);

      subtotal += itemSubtotal;
      discountAmount += itemDiscount;
      taxAmount += itemTax;
    });

    const total = subtotal - discountAmount + taxAmount;
    return { subtotal, taxAmount, discountAmount, total };
  };

  // Client CRUD
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    const updated = [...clients, newClient];
    setClients(updated);
    localStorage.setItem('crx_clients', JSON.stringify(updated));
    return newClient;
  };

  const updateClient = (id: string, updatedData: Partial<Client>) => {
    const updated = clients.map(c => (c.id === id ? { ...c, ...updatedData } : c));
    setClients(updated);
    localStorage.setItem('crx_clients', JSON.stringify(updated));
  };

  const deleteClient = (id: string) => {
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    localStorage.setItem('crx_clients', JSON.stringify(updated));
  };

  // Invoice CRUD
  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'subtotal' | 'taxAmount' | 'discountAmount' | 'total'>) => {
    const { subtotal, taxAmount, discountAmount, total } = calculateInvoiceTotals(invoiceData.items);
    
    // Auto-generate invoice number based on settings
    const paddedNum = String(settings.nextInvoiceNumber).padStart(6, '0');
    const invoiceNumber = `${settings.invoicePrefix}${paddedNum}`;

    const newInvoice: Invoice = {
      ...invoiceData,
      id: 'inv_' + Math.random().toString(36).substr(2, 9),
      invoiceNumber,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      createdAt: new Date().toISOString()
    };

    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);
    localStorage.setItem('crx_invoices', JSON.stringify(updatedInvoices));

    // Update settings auto-increment
    const updatedSettings = {
      ...settings,
      nextInvoiceNumber: settings.nextInvoiceNumber + 1
    };
    setSettings(updatedSettings);
    localStorage.setItem('crx_settings', JSON.stringify(updatedSettings));

    return newInvoice;
  };

  const updateInvoice = (id: string, updatedData: Partial<Invoice>) => {
    const updated = invoices.map(inv => {
      if (inv.id === id) {
        const mergedItems = updatedData.items || inv.items;
        const { subtotal, taxAmount, discountAmount, total } = calculateInvoiceTotals(mergedItems);
        return {
          ...inv,
          ...updatedData,
          subtotal,
          taxAmount,
          discountAmount,
          total
        };
      }
      return inv;
    });
    setInvoices(updated);
    localStorage.setItem('crx_invoices', JSON.stringify(updated));
  };

  const deleteInvoice = (id: string) => {
    const updated = invoices.filter(inv => inv.id !== id);
    setInvoices(updated);
    localStorage.setItem('crx_invoices', JSON.stringify(updated));
  };

  const duplicateInvoice = (id: string) => {
    const source = invoices.find(inv => inv.id === id);
    if (!source) return;

    const paddedNum = String(settings.nextInvoiceNumber).padStart(6, '0');
    const invoiceNumber = `${settings.invoicePrefix}${paddedNum}`;

    const newInvoice: Invoice = {
      ...source,
      id: 'inv_' + Math.random().toString(36).substr(2, 9),
      invoiceNumber,
      status: 'Draft',
      createdAt: new Date().toISOString()
    };

    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);
    localStorage.setItem('crx_invoices', JSON.stringify(updatedInvoices));

    const updatedSettings = {
      ...settings,
      nextInvoiceNumber: settings.nextInvoiceNumber + 1
    };
    setSettings(updatedSettings);
    localStorage.setItem('crx_settings', JSON.stringify(updatedSettings));
  };

  // Company Settings
  const updateSettings = (updatedData: Partial<CompanySettings>) => {
    const updated = { ...settings, ...updatedData };
    setSettings(updated);
    localStorage.setItem('crx_settings', JSON.stringify(updated));
  };

  // Import / Export Database
  const importDatabase = (data: { clients: Client[]; invoices: Invoice[]; settings: CompanySettings }) => {
    try {
      if (!Array.isArray(data.clients) || !Array.isArray(data.invoices) || !data.settings) {
        return false;
      }
      setClients(data.clients);
      setInvoices(data.invoices);
      setSettings(data.settings);
      localStorage.setItem('crx_clients', JSON.stringify(data.clients));
      localStorage.setItem('crx_invoices', JSON.stringify(data.invoices));
      localStorage.setItem('crx_settings', JSON.stringify(data.settings));
      return true;
    } catch {
      return false;
    }
  };

  const exportDatabase = () => {
    return JSON.stringify({ clients, invoices, settings }, null, 2);
  };

  return (
    <AppContext.Provider
      value={{
        clients,
        invoices,
        settings,
        theme,
        addClient,
        updateClient,
        deleteClient,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        duplicateInvoice,
        updateSettings,
        toggleTheme,
        importDatabase,
        exportDatabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
