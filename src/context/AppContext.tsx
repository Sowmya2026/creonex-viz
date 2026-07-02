/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';

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
  accountName?: string;
}

interface AppContextType {
  clients: Client[];
  invoices: Invoice[];
  settings: CompanySettings;
  theme: 'light' | 'dark';
  currentUser: User | null;
  authLoading: boolean;
  isDemoMode: boolean;
  setDemoMode: (isDemo: boolean) => void;
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
  phone: '+91 98765 43210',
  address: '100 Innovation Way, Suite 400, Bangalore, KA 560001',
  taxId: '29AAAAA0000A1Z5',
  bankName: 'State Bank of India',
  accountNumber: '62148855051',
  routingNumber: 'SBIN0020295',
  currency: 'INR',
  invoicePrefix: 'CRX-',
  nextInvoiceNumber: 7,
  logoUrl: '/logo.png',
  termsAndConditions: 'Payment is due within 15 days of invoice date. Thank you for your business!',
  accountName: 'Ms. Beemer Sowmya'
};

const mockClients: Client[] = [
  { id: 'c1', name: 'Wayne Enterprises', email: 'finance@wayne.corp', phone: '+1 (555) 888-2938', address: '1007 Mountain Drive, Gotham City, NJ 07001', taxId: 'WY-998811', createdAt: '2026-01-10T08:00:00.000Z' },
  { id: 'c2', name: 'Stark Industries', email: 'accounts@stark.com', phone: '+1 (555) 333-8839', address: '10880 Malibu Point, Malibu, CA 90265', taxId: 'ST-555331', createdAt: '2026-02-15T09:30:00.000Z' },
  { id: 'c3', name: 'Globex Corporation', email: 'billing@globex.org', phone: '+1 (555) 444-9988', address: '100 Cypress Creek Rd, Cypress Creek, OR 97401', taxId: 'GX-123456', createdAt: '2026-03-20T10:15:00.000Z' },
  { id: 'c4', name: 'Acme Corporation', email: 'purchasing@acme.com', phone: '+1 (555) 123-4567', address: '123 Desert Road, Roadrunner Canyon, AZ 85001', taxId: 'AC-778899', createdAt: '2026-04-05T14:22:00.000Z' },
  { id: 'c5', name: 'Umbrella Corporation', email: 'accounts@umbrella.com', phone: '+1 (555) 666-3241', address: '500 Raccoon City Plaza, Chicago, IL 60601', taxId: 'UM-666999', createdAt: '2026-05-12T11:05:00.000Z' }
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
    paymentDetails: 'Account Name: Ms. Beemer Sowmya\nBank Name: State Bank of India\nAccount Number: 62148855051\nIFSC Code: SBIN0020295',
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
    paymentDetails: 'Account Name: Ms. Beemer Sowmya\nBank Name: State Bank of India\nAccount Number: 62148855051\nIFSC Code: SBIN0020295',
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
    paymentDetails: 'Account Name: Ms. Beemer Sowmya\nBank Name: State Bank of India\nAccount Number: 62148855051\nIFSC Code: SBIN0020295',
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
    paymentDetails: 'Account Name: Ms. Beemer Sowmya\nBank Name: State Bank of India\nAccount Number: 62148855051\nIFSC Code: SBIN0020295',
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
    paymentDetails: 'Account Name: Ms. Beemer Sowmya\nBank Name: State Bank of India\nAccount Number: 62148855051\nIFSC Code: SBIN0020295',
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
  // Global States
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Firebase Auth states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // 1. Listen to Firebase Authentication status changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        setIsDemoMode(false); // Disable demo sandbox on sign-in
      }
    });
    return unsubscribe;
  }, []);

  // Helper toggle for Demo Sandbox
  const setDemoMode = (isDemo: boolean) => {
    setIsDemoMode(isDemo);
    if (isDemo) {
      // Load initial local data for demo sandbox
      const savedClients = localStorage.getItem('crx_clients');
      const savedInvoices = localStorage.getItem('crx_invoices');
      const savedSettings = localStorage.getItem('crx_settings');

      setClients(savedClients ? JSON.parse(savedClients) : mockClients);
      setInvoices(savedInvoices ? JSON.parse(savedInvoices) : mockInvoices);
      setSettings(savedSettings ? JSON.parse(savedSettings) : defaultSettings);
    }
  };

  // 2. Sync Theme Mode (preserved locally)
  useEffect(() => {
    const savedTheme = localStorage.getItem('crx_theme');
    if (savedTheme) {
      setTheme(savedTheme as 'light' | 'dark');
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  // 3. Listen to Firestore Cloud Database in Real Time (If Authenticated User exists)
  useEffect(() => {
    if (!currentUser || isDemoMode) return;

    const uid = currentUser.uid;

    // Listen to settings changes in Firestore
    const settingsDocRef = doc(db, 'users', uid, 'settings', 'config');
    const unsubSettings = onSnapshot(settingsDocRef, (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as CompanySettings);
      } else {
        // If settings doc doesn't exist, create it with defaults
        setDoc(settingsDocRef, defaultSettings);
        setSettings(defaultSettings);
      }
    }, (err) => {
      console.warn("Firestore Settings listener warning:", err);
    });

    // Listen to clients changes in Firestore
    const clientsCollRef = collection(db, 'users', uid, 'clients');
    const unsubClients = onSnapshot(clientsCollRef, (snap) => {
      const clientsList: Client[] = [];
      snap.forEach((doc) => {
        clientsList.push({ id: doc.id, ...doc.data() } as Client);
      });
      setClients(clientsList);
    }, (err) => {
      console.warn("Firestore Clients listener warning:", err);
    });

    // Listen to invoices changes in Firestore
    const invoicesCollRef = collection(db, 'users', uid, 'invoices');
    const unsubInvoices = onSnapshot(invoicesCollRef, (snap) => {
      const invoicesList: Invoice[] = [];
      snap.forEach((doc) => {
        invoicesList.push({ id: doc.id, ...doc.data() } as Invoice);
      });
      setInvoices(invoicesList);
    }, (err) => {
      console.warn("Firestore Invoices listener warning:", err);
    });

    return () => {
      unsubSettings();
      unsubClients();
      unsubInvoices();
    };
  }, [currentUser, isDemoMode]);

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
    const newClientData = {
      ...clientData,
      createdAt: new Date().toISOString()
    };

    if (currentUser && !isDemoMode) {
      // Write to Firestore - UI updates dynamically via onSnapshot listener
      const clientsCollRef = collection(db, 'users', currentUser.uid, 'clients');
      addDoc(clientsCollRef, newClientData);
      return { id: 'temp', ...newClientData } as Client;
    } else {
      // Write to localStorage sandbox mode
      const newClient: Client = {
        ...newClientData,
        id: 'c_' + Math.random().toString(36).substr(2, 9)
      };
      const updated = [...clients, newClient];
      setClients(updated);
      localStorage.setItem('crx_clients', JSON.stringify(updated));
      return newClient;
    }
  };

  const updateClient = (id: string, updatedData: Partial<Client>) => {
    if (currentUser && !isDemoMode) {
      const clientDocRef = doc(db, 'users', currentUser.uid, 'clients', id);
      updateDoc(clientDocRef, updatedData);
    } else {
      const updated = clients.map(c => (c.id === id ? { ...c, ...updatedData } : c));
      setClients(updated);
      localStorage.setItem('crx_clients', JSON.stringify(updated));
    }
  };

  const deleteClient = (id: string) => {
    if (currentUser && !isDemoMode) {
      const clientDocRef = doc(db, 'users', currentUser.uid, 'clients', id);
      deleteDoc(clientDocRef);
    } else {
      const updated = clients.filter(c => c.id !== id);
      setClients(updated);
      localStorage.setItem('crx_clients', JSON.stringify(updated));
    }
  };

  // Invoice CRUD
  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'subtotal' | 'taxAmount' | 'discountAmount' | 'total'>) => {
    const { subtotal, taxAmount, discountAmount, total } = calculateInvoiceTotals(invoiceData.items);
    
    // Auto-generate invoice number based on settings
    const paddedNum = String(settings.nextInvoiceNumber).padStart(6, '0');
    const invoiceNumber = `${settings.invoicePrefix}${paddedNum}`;

    const newInvoiceData = {
      ...invoiceData,
      invoiceNumber,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      createdAt: new Date().toISOString()
    };

    if (currentUser && !isDemoMode) {
      // Write to Firestore - UI updates dynamically via snapshots
      const invoicesCollRef = collection(db, 'users', currentUser.uid, 'invoices');
      addDoc(invoicesCollRef, newInvoiceData);

      // Increment number settings configuration
      const settingsDocRef = doc(db, 'users', currentUser.uid, 'settings', 'config');
      updateDoc(settingsDocRef, {
        nextInvoiceNumber: settings.nextInvoiceNumber + 1
      });

      return { id: 'temp', ...newInvoiceData } as Invoice;
    } else {
      // Write to localStorage sandbox mode
      const newInvoice: Invoice = {
        ...newInvoiceData,
        id: 'inv_' + Math.random().toString(36).substr(2, 9)
      };

      const updatedInvoices = [...invoices, newInvoice];
      setInvoices(updatedInvoices);
      localStorage.setItem('crx_invoices', JSON.stringify(updatedInvoices));

      // Update settings
      const updatedSettings = {
        ...settings,
        nextInvoiceNumber: settings.nextInvoiceNumber + 1
      };
      setSettings(updatedSettings);
      localStorage.setItem('crx_settings', JSON.stringify(updatedSettings));

      return newInvoice;
    }
  };

  const updateInvoice = (id: string, updatedData: Partial<Invoice>) => {
    if (currentUser && !isDemoMode) {
      const invoiceDocRef = doc(db, 'users', currentUser.uid, 'invoices', id);
      
      // Calculate updated total metrics if items were modified
      if (updatedData.items) {
        const { subtotal, taxAmount, discountAmount, total } = calculateInvoiceTotals(updatedData.items);
        updateDoc(invoiceDocRef, {
          ...updatedData,
          subtotal,
          taxAmount,
          discountAmount,
          total
        });
      } else {
        updateDoc(invoiceDocRef, updatedData);
      }
    } else {
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
    }
  };

  const deleteInvoice = (id: string) => {
    if (currentUser && !isDemoMode) {
      const invoiceDocRef = doc(db, 'users', currentUser.uid, 'invoices', id);
      deleteDoc(invoiceDocRef);
    } else {
      const updated = invoices.filter(inv => inv.id !== id);
      setInvoices(updated);
      localStorage.setItem('crx_invoices', JSON.stringify(updated));
    }
  };

  const duplicateInvoice = (id: string) => {
    const source = invoices.find(inv => inv.id === id);
    if (!source) return;

    const paddedNum = String(settings.nextInvoiceNumber).padStart(6, '0');
    const invoiceNumber = `${settings.invoicePrefix}${paddedNum}`;

    const newInvoiceData = {
      ...source,
      invoiceNumber,
      status: 'Draft' as InvoiceStatus,
      createdAt: new Date().toISOString()
    };

    if (currentUser && !isDemoMode) {
      const invoicesCollRef = collection(db, 'users', currentUser.uid, 'invoices');
      addDoc(invoicesCollRef, newInvoiceData);

      const settingsDocRef = doc(db, 'users', currentUser.uid, 'settings', 'config');
      updateDoc(settingsDocRef, {
        nextInvoiceNumber: settings.nextInvoiceNumber + 1
      });
    } else {
      const newInvoice: Invoice = {
        ...newInvoiceData,
        id: 'inv_' + Math.random().toString(36).substr(2, 9)
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
    }
  };

  // Company Settings
  const updateSettings = (updatedData: Partial<CompanySettings>) => {
    if (currentUser && !isDemoMode) {
      const settingsDocRef = doc(db, 'users', currentUser.uid, 'settings', 'config');
      updateDoc(settingsDocRef, updatedData);
    } else {
      const updated = { ...settings, ...updatedData };
      setSettings(updated);
      localStorage.setItem('crx_settings', JSON.stringify(updated));
    }
  };

  // Import / Export Database
  const importDatabase = (data: { clients: Client[]; invoices: Invoice[]; settings: CompanySettings }) => {
    try {
      if (!Array.isArray(data.clients) || !Array.isArray(data.invoices) || !data.settings) {
        return false;
      }
      
      if (currentUser && !isDemoMode) {
        // Upload batch to Firestore
        data.clients.forEach(c => {
          const docRef = doc(db, 'users', currentUser.uid, 'clients', c.id || Math.random().toString(36).substr(2, 9));
          setDoc(docRef, { name: c.name, email: c.email, phone: c.phone || '', address: c.address || '', taxId: c.taxId || '', createdAt: c.createdAt || new Date().toISOString() });
        });

        data.invoices.forEach(inv => {
          const docRef = doc(db, 'users', currentUser.uid, 'invoices', inv.id || Math.random().toString(36).substr(2, 9));
          setDoc(docRef, {
            invoiceNumber: inv.invoiceNumber,
            clientId: inv.clientId,
            issueDate: inv.issueDate,
            dueDate: inv.dueDate,
            items: inv.items,
            notes: inv.notes || '',
            terms: inv.terms || '',
            paymentDetails: inv.paymentDetails || '',
            status: inv.status,
            subtotal: inv.subtotal,
            taxAmount: inv.taxAmount,
            discountAmount: inv.discountAmount,
            total: inv.total,
            createdAt: inv.createdAt || new Date().toISOString()
          });
        });

        const settingsDocRef = doc(db, 'users', currentUser.uid, 'settings', 'config');
        setDoc(settingsDocRef, data.settings);
      } else {
        setClients(data.clients);
        setInvoices(data.invoices);
        setSettings(data.settings);
        localStorage.setItem('crx_clients', JSON.stringify(data.clients));
        localStorage.setItem('crx_invoices', JSON.stringify(data.invoices));
        localStorage.setItem('crx_settings', JSON.stringify(data.settings));
      }
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
        currentUser,
        authLoading,
        isDemoMode,
        setDemoMode,
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
