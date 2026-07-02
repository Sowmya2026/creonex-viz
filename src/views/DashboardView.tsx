import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/format';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Users, 
  ArrowRight, 
  Plus, 
  Clock,
  Download,
  Calendar,
  Percent,
  CheckCircle
} from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  setSelectedInvoiceId: (id: string | null) => void;
  setEditInvoiceMode: (isEdit: boolean) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  setActiveTab, 
  setSelectedInvoiceId, 
  setEditInvoiceMode 
}) => {
  const { invoices, clients, settings } = useApp();

  // Filters State (Defaulting to July and 2026 for showcase, matching mock invoices)
  const [selectedMonth, setSelectedMonth] = useState<string>('6'); // 'All' or '0'-'11'
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const monthsList = [
    { label: 'January', val: '0' },
    { label: 'February', val: '1' },
    { label: 'March', val: '2' },
    { label: 'April', val: '3' },
    { label: 'May', val: '4' },
    { label: 'June', val: '5' },
    { label: 'July', val: '6' },
    { label: 'August', val: '7' },
    { label: 'September', val: '8' },
    { label: 'October', val: '9' },
    { label: 'November', val: '10' },
    { label: 'December', val: '11' }
  ];

  // 1. Calculations for KPIs & Detailed Breakdown
  const metrics = useMemo(() => {
    let totalRevenue = 0;       // Collected (Paid)
    let outstandingBalance = 0; // Unpaid
    let overdueBalance = 0;     // Overdue
    let draftBalance = 0;       // Drafts

    let grossInvoiced = 0;
    let totalDiscounts = 0;
    let totalTaxes = 0;

    invoices.forEach(inv => {
      const invDate = new Date(inv.issueDate);
      const year = invDate.getFullYear();
      const month = invDate.getMonth().toString();

      // Filter by Year
      if (year !== selectedYear) return;

      // Filter by Month
      if (selectedMonth !== 'All' && month !== selectedMonth) return;

      // Real-time additions of itemized values for detailed health card
      inv.items.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        const itemDiscount = itemSubtotal * (item.discount / 100);
        const discountedSubtotal = itemSubtotal - itemDiscount;
        const itemTax = discountedSubtotal * (item.taxRate / 100);

        grossInvoiced += itemSubtotal;
        totalDiscounts += itemDiscount;
        totalTaxes += itemTax;
      });

      if (inv.status === 'Paid') {
        totalRevenue += inv.total;
      }
      if (inv.status === 'Unpaid') {
        outstandingBalance += inv.total;
      }
      if (inv.status === 'Overdue') {
        overdueBalance += inv.total;
      }
      if (inv.status === 'Draft') {
        draftBalance += inv.total;
      }
    });

    const netInvoiced = grossInvoiced - totalDiscounts + totalTaxes;

    return {
      totalRevenue,
      outstandingBalance,
      overdueBalance,
      draftBalance,
      grossInvoiced,
      totalDiscounts,
      totalTaxes,
      netInvoiced
    };
  }, [invoices, selectedMonth, selectedYear]);

  // 2. Recent Invoices (limit 5) - unaffected by filter for general context
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [invoices]);

  // 3. Leaderboard of top clients
  const topClients = useMemo(() => {
    const clientSpentMap: Record<string, { total: number; count: number }> = {};
    
    invoices.forEach(inv => {
      if (inv.status === 'Paid' || inv.status === 'Unpaid' || inv.status === 'Overdue') {
        if (!clientSpentMap[inv.clientId]) {
          clientSpentMap[inv.clientId] = { total: 0, count: 0 };
        }
        clientSpentMap[inv.clientId].total += inv.total;
        clientSpentMap[inv.clientId].count += 1;
      }
    });

    return Object.entries(clientSpentMap)
      .map(([id, stats]) => {
        const client = clients.find(c => c.id === id);
        return {
          id,
          name: client ? client.name : 'Unknown Client',
          totalSpent: stats.total,
          invoiceCount: stats.count
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 4);
  }, [invoices, clients]);

  // 4. Custom SVG Chart calculations (Dynamic: 12-Month or 5-Week zoom)
  const chartData = useMemo(() => {
    if (selectedMonth === 'All') {
      // 12 Months of the selected year
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthData = months.map((m) => ({
        label: m,
        invoiced: 0,
        revenue: 0
      }));

      invoices.forEach(inv => {
        if (inv.status === 'Draft') return;
        const date = new Date(inv.issueDate);
        if (date.getFullYear() === selectedYear) {
          const mIdx = date.getMonth();
          monthData[mIdx].invoiced += inv.total;
          if (inv.status === 'Paid') {
            monthData[mIdx].revenue += inv.total;
          }
        }
      });
      return monthData;
    } else {
      // 5 Weeks of the selected month
      const weekData = [
        { label: 'Wk 1 (1-7)', invoiced: 0, revenue: 0 },
        { label: 'Wk 2 (8-14)', invoiced: 0, revenue: 0 },
        { label: 'Wk 3 (15-21)', invoiced: 0, revenue: 0 },
        { label: 'Wk 4 (22-28)', invoiced: 0, revenue: 0 },
        { label: 'Wk 5 (29+)', invoiced: 0, revenue: 0 }
      ];

      invoices.forEach(inv => {
        if (inv.status === 'Draft') return;
        const date = new Date(inv.issueDate);
        if (date.getFullYear() === selectedYear && date.getMonth().toString() === selectedMonth) {
          const day = date.getDate();
          let wIdx = 4; // default to week 5
          if (day <= 7) wIdx = 0;
          else if (day <= 14) wIdx = 1;
          else if (day <= 21) wIdx = 2;
          else if (day <= 28) wIdx = 3;

          weekData[wIdx].invoiced += inv.total;
          if (inv.status === 'Paid') {
            weekData[wIdx].revenue += inv.total;
          }
        }
      });
      return weekData;
    }
  }, [invoices, selectedMonth, selectedYear]);

  // SVG Chart layout constants
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 30;
  const chartInnerWidth = chartWidth - padding * 2;
  const chartInnerHeight = chartHeight - padding * 2;

  // Max value in chart data to scale SVG height
  const maxVal = useMemo(() => {
    const vals = chartData.map(d => Math.max(d.revenue, d.invoiced));
    const max = Math.max(...vals, 1000); // minimum scale ceiling
    return Math.ceil(max / 1000) * 1000; // round up to multiple of 1000
  }, [chartData]);

  // Generate SVG path for area/lines
  const points = useMemo(() => {
    if (chartData.length === 0) return null;

    const pointsRevenue: string[] = [];
    const pointsInvoiced: string[] = [];
    
    chartData.forEach((d, i) => {
      const x = padding + (i / (chartData.length - 1)) * chartInnerWidth;
      const yRev = padding + chartInnerHeight - (d.revenue / maxVal) * chartInnerHeight;
      const yInv = padding + chartInnerHeight - (d.invoiced / maxVal) * chartInnerHeight;
      
      pointsRevenue.push(`${x},${yRev}`);
      pointsInvoiced.push(`${x},${yInv}`);
    });

    const lineRevenuePath = `M ${pointsRevenue.join(' L ')}`;
    const lineInvoicedPath = `M ${pointsInvoiced.join(' L ')}`;
    
    const firstX = padding;
    const lastX = padding + chartInnerWidth;
    const bottomY = padding + chartInnerHeight;
    
    const areaRevenuePath = `${lineRevenuePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
    const areaInvoicedPath = `${lineInvoicedPath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;

    return {
      lineRevenuePath,
      lineInvoicedPath,
      areaRevenuePath,
      areaInvoicedPath,
      coordRevenue: chartData.map((d, i) => ({
        x: padding + (i / (chartData.length - 1)) * chartInnerWidth,
        y: padding + chartInnerHeight - (d.revenue / maxVal) * chartInnerHeight,
        val: d.revenue,
        label: d.label
      })),
      coordInvoiced: chartData.map((d, i) => ({
        x: padding + (i / (chartData.length - 1)) * chartInnerWidth,
        y: padding + chartInnerHeight - (d.invoiced / maxVal) * chartInnerHeight,
        val: d.invoiced,
        label: d.label
      }))
    };
  }, [chartData, maxVal, chartInnerWidth, chartInnerHeight]);

  // Export CSV Monthly Statement
  const exportMonthlyStatement = () => {
    const monthLabel = selectedMonth === 'All' ? 'FullYear' : monthsList.find(m => m.val === selectedMonth)?.label || '';
    const reportName = `creonex_statement_${selectedYear}_${monthLabel}`;
    
    const headers = ['Date', 'Invoice #', 'Client', 'Gross Subtotal', 'Discount', 'Sales Tax', 'Total Invoice', 'Status'];
    
    const rows = invoices.filter(inv => {
      const date = new Date(inv.issueDate);
      const matchesYear = date.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === 'All' || date.getMonth().toString() === selectedMonth;
      return matchesYear && matchesMonth;
    }).map(inv => {
      const client = clients.find(c => c.id === inv.clientId);
      return [
        inv.issueDate,
        inv.invoiceNumber,
        client ? client.name : 'Unknown Client',
        inv.subtotal,
        inv.discountAmount,
        inv.taxAmount,
        inv.total,
        inv.status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const handleInvoiceClick = (id: string) => {
    setSelectedInvoiceId(id);
    setActiveTab('viewer');
  };

  const handleCreateInvoiceClick = () => {
    setSelectedInvoiceId(null);
    setEditInvoiceMode(false);
    setActiveTab('editor');
  };

  return (
    <div className="content-container">
      {/* Welcome Banner & Monthly Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="view-title">
            Monthly Income Checkup
          </h1>
          <p className="view-subtitle">Analyze detailed monthly revenue balances, taxes, and income trends.</p>
        </div>

        {/* Filters bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', padding: '4px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <Calendar size={15} className="text-muted" />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="form-input"
              style={{ border: 'none', padding: '6px', fontSize: '0.85rem', fontWeight: 600, background: 'transparent' }}
            >
              <option value="All">All Months</option>
              {monthsList.map(m => (
                <option key={m.val} value={m.val}>{m.label}</option>
              ))}
            </select>

            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="form-input"
              style={{ border: 'none', padding: '6px', fontSize: '0.85rem', fontWeight: 600, background: 'transparent' }}
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <button className="btn btn-secondary" onClick={exportMonthlyStatement} title="Download Monthly Statement Details">
            <Download size={16} /> Export Statement
          </button>
          
          <button className="btn btn-primary" onClick={handleCreateInvoiceClick}>
            <Plus size={16} /> New Invoice
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Reacting to Month/Year filters) */}
      <div className="grid-cols-4">
        {/* Card 1: Total Revenue (Collected Cash) */}
        <div className="card">
          <div className="card-header">
            <span className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700 }}>Revenue Collected</span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
              <CheckCircle size={16} />
            </div>
          </div>
          <h3 className="text-2xl" style={{ marginBottom: '4px', fontWeight: 800 }}>
            {formatCurrency(metrics.totalRevenue, settings.currency)}
          </h3>
          <p className="text-muted" style={{ fontSize: '0.75rem' }}>
            Paid invoice cash flows
          </p>
        </div>

        {/* Card 2: Net Invoiced */}
        <div className="card">
          <div className="card-header">
            <span className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700 }}>Total Invoiced</span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <h3 className="text-2xl" style={{ marginBottom: '4px', fontWeight: 800 }}>
            {formatCurrency(metrics.netInvoiced, settings.currency)}
          </h3>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            Gross billings including tax
          </span>
        </div>

        {/* Card 3: Outstanding Balance */}
        <div className="card">
          <div className="card-header">
            <span className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700 }}>Awaiting Payment</span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>
              <Clock size={16} />
            </div>
          </div>
          <h3 className="text-2xl" style={{ marginBottom: '4px', fontWeight: 800 }}>
            {formatCurrency(metrics.outstandingBalance, settings.currency)}
          </h3>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            Unpaid invoice value
          </span>
        </div>

        {/* Card 4: Overdue Balance */}
        <div className="card">
          <div className="card-header">
            <span className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700 }}>Overdue Balance</span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <h3 className="text-2xl" style={{ marginBottom: '4px', fontWeight: 800, color: 'var(--danger)' }}>
            {formatCurrency(metrics.overdueBalance, settings.currency)}
          </h3>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            Past payment deadlines
          </span>
        </div>
      </div>

      {/* Main Section Grid (Chart + Monthly Statements Breakdown) */}
      <div className="layout-split">
        {/* Dynamic SVG Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                {selectedMonth === 'All' ? 'Annual Trend' : `${monthsList.find(m => m.val === selectedMonth)?.label} Weekly Performance`}
              </h3>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                {selectedMonth === 'All' 
                  ? `Invoiced vs Collected for year ${selectedYear}` 
                  : `Weekly invoice details for ${monthsList.find(m => m.val === selectedMonth)?.label} ${selectedYear}`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--primary)' }}></div>
                <span>Invoiced</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--success)' }}></div>
                <span>Collected</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {points ? (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="var(--border-color)" strokeWidth={0.5} strokeDasharray="3 3" />
                <line x1={padding} y1={padding + chartInnerHeight / 2} x2={chartWidth - padding} y2={padding + chartInnerHeight / 2} stroke="var(--border-color)" strokeWidth={0.5} strokeDasharray="3 3" />
                <line x1={padding} y1={padding + chartInnerHeight} x2={chartWidth - padding} y2={padding + chartInnerHeight} stroke="var(--border-color)" strokeWidth={1} />

                {/* Chart Areas */}
                <path d={points.areaInvoicedPath} fill="url(#colorInvoiced)" />
                <path d={points.areaRevenuePath} fill="url(#colorRevenue)" />

                {/* Chart Lines */}
                <path d={points.lineInvoicedPath} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" />
                <path d={points.lineRevenuePath} fill="none" stroke="var(--success)" strokeWidth={2} strokeLinecap="round" />

                {/* Y Axis Labels */}
                <text x={padding - 5} y={padding + 4} fill="var(--text-muted)" fontSize={8} textAnchor="end">{formatCurrency(maxVal, settings.currency)}</text>
                <text x={padding - 5} y={padding + chartInnerHeight / 2 + 4} fill="var(--text-muted)" fontSize={8} textAnchor="end">{formatCurrency(maxVal / 2, settings.currency)}</text>
                <text x={padding - 5} y={padding + chartInnerHeight + 4} fill="var(--text-muted)" fontSize={8} textAnchor="end">$0</text>

                {/* X Axis Labels */}
                {chartData.map((d, i) => {
                  const x = padding + (i / (chartData.length - 1)) * chartInnerWidth;
                  return (
                    <text key={d.label} x={x} y={padding + chartInnerHeight + 16} fill="var(--text-muted)" fontSize={8} textAnchor="middle">
                      {d.label}
                    </text>
                  );
                })}

                {/* Dots on Coordinates */}
                {points.coordInvoiced.map((pt, i) => (
                  <g key={`inv-dot-${i}`}>
                    <circle cx={pt.x} cy={pt.y} r={3} fill="var(--bg-card)" stroke="var(--primary)" strokeWidth={1.5} />
                    <title>{pt.label} Invoiced: {formatCurrency(pt.val, settings.currency)}</title>
                  </g>
                ))}
                {points.coordRevenue.map((pt, i) => (
                  <g key={`rev-dot-${i}`}>
                    <circle cx={pt.x} cy={pt.y} r={3} fill="var(--bg-card)" stroke="var(--success)" strokeWidth={1.5} />
                    <title>{pt.label} Collected: {formatCurrency(pt.val, settings.currency)}</title>
                  </g>
                ))}
              </svg>
            ) : (
              <p className="text-muted">No trend data available for selected filters.</p>
            )}
          </div>
        </div>

        {/* Detailed Statement Breakdown Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px' }}>
            <div>
              <h3 className="card-title">Statement Summary</h3>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Income health metrics break down</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', flex: 1, justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Gross Invoiced:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(metrics.grossInvoiced, settings.currency)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger-text)' }}>
              <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Percent size={12} /> Total Discounts Applied:</span>
              <span style={{ fontWeight: 600 }}>-{formatCurrency(metrics.totalDiscounts, settings.currency)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={12} /> Sales Taxes Calculated:</span>
              <span style={{ fontWeight: 600 }}>+{formatCurrency(metrics.totalTaxes, settings.currency)}</span>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 600 }}>Net Value Invoiced:</span>
              <span style={{ fontWeight: 750, color: 'var(--primary)' }}>{formatCurrency(metrics.netInvoiced, settings.currency)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-text)', backgroundColor: 'var(--success-light)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', marginTop: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>Actual Cash Collected:</span>
              <span style={{ fontWeight: 800 }}>{formatCurrency(metrics.totalRevenue, settings.currency)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning-text)', backgroundColor: 'var(--warning-light)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>Uncollected Balances:</span>
              <span style={{ fontWeight: 800 }}>{formatCurrency(metrics.outstandingBalance + metrics.overdueBalance, settings.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row: Recent Invoices & Top Spenders */}
      <div className="layout-split">
        
        {/* Recent Invoices Table */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="card-title">Recent Invoices</h3>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Latest invoice updates and transaction statuses</p>
            </div>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => setActiveTab('invoices')}>
              View All <ArrowRight size={14} style={{ marginLeft: '4px' }} />
            </button>
          </div>

          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Client</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No invoices generated yet. Click "New Invoice" to start!
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700, cursor: 'pointer', color: 'var(--primary)' }} onClick={() => handleInvoiceClick(inv.id)}>
                        {inv.invoiceNumber}
                      </td>
                      <td style={{ fontWeight: 500 }}>{getClientName(inv.clientId)}</td>
                      <td>{formatDate(inv.issueDate)}</td>
                      <td>{formatDate(inv.dueDate)}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(inv.total, settings.currency)}</td>
                      <td>
                        <span className={`badge badge-${inv.status.toLowerCase()}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleInvoiceClick(inv.id)}>
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Clients CRM List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Top Clients</h3>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Ranked by overall business value</p>
            </div>
            <button className="btn-icon" onClick={() => setActiveTab('clients')}>
              <Users size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
            {topClients.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', padding: '24px 0' }}>No invoice logs recorded yet.</p>
            ) : (
              topClients.map((c, index) => {
                // Calculate percentage against max spender
                const maxSpender = topClients[0]?.totalSpent || 1;
                const percentage = (c.totalSpent / maxSpender) * 100;

                return (
                  <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}>
                          {index + 1}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formatCurrency(c.totalSpent, settings.currency)}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.invoiceCount} invoices</div>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--bg-card-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: index === 0 ? 'var(--primary)' : 'var(--text-muted)', borderRadius: '3px', transition: 'width 0.5s ease-out' }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
