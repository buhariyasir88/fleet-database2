import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const API_URL = 'https://fleet-database-backend.onrender.com/api';

function Reports() {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [utilizations, setUtilizations] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [clients, setClients] = useState([]);
  const [vessels, setVessels] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, contractsRes, tendersRes, utilRes, budgetsRes, clientsRes, vesselsRes] = await Promise.all([
        axios.get(`${API_URL}/invoices`),
        axios.get(`${API_URL}/contracts`),
        axios.get(`${API_URL}/tenders`),
        axios.get(`${API_URL}/utilizations`),
        axios.get(`${API_URL}/budgets`),
        axios.get(`${API_URL}/clients`),
        axios.get(`${API_URL}/vessels`),
      ]);
      setInvoices(invoicesRes.data);
      setContracts(contractsRes.data);
      setTenders(tendersRes.data);
      setUtilizations(utilRes.data);
      setBudgets(budgetsRes.data);
      setClients(clientsRes.data);
      setVessels(vesselsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId) => {
    if (!clientId) return 'Unknown';
    if (typeof clientId === 'object' && clientId.name) return clientId.name;
    const client = clients.find(c => c._id === clientId);
    return client?.name || 'Unknown';
  };

  const getVesselName = (vesselData) => {
    if (!vesselData) return 'Unknown';
    if (typeof vesselData === 'object' && vesselData.name) return vesselData.name;
    if (typeof vesselData === 'string') {
      const found = vessels.find(v => v._id === vesselData);
      return found?.name || 'Unknown';
    }
    if (vesselData._id) {
      const found = vessels.find(v => v._id === vesselData._id);
      return found?.name || 'Unknown';
    }
    return 'Unknown';
  };

  const filteredInvoices = invoices.filter(inv => inv.billingYear === selectedYear);
  const filteredBudgets = budgets.filter(b => b.year === selectedYear);
  const filteredUtilizations = utilizations.filter(u => u.year === selectedYear);

  const monthsOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getContractStatus = (contract) => {
    if (!contract.commencementDate || !contract.duration) return 'Pending';
    const start = new Date(contract.commencementDate);
    const end = new Date(start);
    end.setDate(end.getDate() + parseInt(contract.duration));
    const now = new Date();
    if (now > end) return 'Completed';
    if (now >= start && now <= end) return 'Active';
    return 'Pending';
  };

  const contractStatusCounts = { Active: 0, Completed: 0, Pending: 0 };
  contracts.forEach(c => {
    const status = getContractStatus(c);
    if (status === 'Active') contractStatusCounts.Active++;
    else if (status === 'Completed') contractStatusCounts.Completed++;
    else contractStatusCounts.Pending++;
  });

  // ============ INVOICE CHART ============
  const invVesselSet = new Set();
  filteredInvoices.forEach(inv => {
    const name = getVesselName(inv.vessel);
    if (name !== 'Unknown') invVesselSet.add(name);
  });
  if (invVesselSet.size === 0 && filteredInvoices.length > 0) invVesselSet.add('Unknown');
  const invVessels = Array.from(invVesselSet);
  
  const invData = {};
  const invBudgetData = {};
  
  filteredInvoices.forEach(inv => {
    const month = inv.billingMonth;
    const vessel = getVesselName(inv.vessel);
    if (!invData[month]) invData[month] = {};
    if (!invData[month][vessel]) invData[month][vessel] = 0;
    invData[month][vessel] += inv.totalAmount || 0;
  });
  
  filteredBudgets.forEach(b => {
    if (b.month) {
      if (!invBudgetData[b.month]) invBudgetData[b.month] = 0;
      invBudgetData[b.month] += b.budgetedSale || 0;
    }
  });

  const allMonthsSet = new Set();
  Object.keys(invData).forEach(m => allMonthsSet.add(m));
  Object.keys(invBudgetData).forEach(m => allMonthsSet.add(m));
  const finalMonths = Array.from(allMonthsSet).sort((a, b) => monthsOrder.indexOf(a) - monthsOrder.indexOf(b));

  if (finalMonths.length === 0) finalMonths.push('No Data');

  const colors = ['rgba(25,118,210,0.7)', 'rgba(76,175,80,0.7)', 'rgba(255,152,0,0.7)', 'rgba(156,39,176,0.7)'];
  const borderColors = ['rgba(25,118,210,1)', 'rgba(76,175,80,1)', 'rgba(255,152,0,1)', 'rgba(156,39,176,1)'];

  const invDatasets = invVessels.map((vessel, i) => ({
    label: vessel,
    data: finalMonths.map(m => invData[m]?.[vessel] || 0),
    backgroundColor: colors[i % colors.length],
    borderColor: borderColors[i % borderColors.length],
    borderWidth: 1,
    borderRadius: 2,
  }));

  const invBudgetLine = finalMonths.map(m => invBudgetData[m] || 0);

  const invoiceStackedData = {
    labels: finalMonths,
    datasets: [
      ...invDatasets,
      {
        label: 'Total Budget',
        data: invBudgetLine,
        type: 'line',
        borderColor: '#d32f2f',
        backgroundColor: 'rgba(211,47,47,0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#d32f2f',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4,
        order: 0,
      }
    ],
  };

  const invoiceStackedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 11, weight: '600' }, usePointStyle: true, pointStyle: 'circle', padding: 15 },
      },
      title: {
        display: true,
        text: 'Monthly Invoice by Vessel (Stacked)',
        font: { size: 15, weight: '700' },
        padding: { bottom: 15 },
      },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            const label = ctx.dataset.label || '';
            const value = ctx.parsed.y || 0;
            if (label === 'Total Budget') return 'Total Budget: RM ' + value.toLocaleString();
            return label + ': RM ' + value.toLocaleString();
          }
        }
      }
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Amount (RM)', font: { size: 11, weight: '600' } } },
    },
  };

  // Cumulative Sales
  let cumTotal = 0;
  const cumData = finalMonths.map(m => {
    let total = 0;
    invVessels.forEach(v => { total += invData[m]?.[v] || 0; });
    cumTotal += total;
    return cumTotal;
  });
  let cumBudget = 0;
  const cumBudgetData = finalMonths.map(m => {
    cumBudget += invBudgetData[m] || 0;
    return cumBudget;
  });

  const cumulativeLineData = {
    labels: finalMonths,
    datasets: [
      {
        label: 'Cumulative Actual Sale',
        data: cumData,
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25,118,210,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#1976d2',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Cumulative Budget',
        data: cumBudgetData,
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76,175,80,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#4caf50',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderDash: [5, 5],
      },
    ],
  };

  const cumulativeLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 11, weight: '600' }, usePointStyle: true, pointStyle: 'circle' },
      },
      title: {
        display: true,
        text: 'Cumulative Sales vs Budget',
        font: { size: 15, weight: '700' },
        padding: { bottom: 15 },
      },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            return ctx.dataset.label + ': RM ' + (ctx.parsed.y || 0).toLocaleString();
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Amount (RM)', font: { size: 11, weight: '600' } } },
    },
  };

  // Payment Status
  const paymentStatusCounts = {
    Paid: filteredInvoices.filter(i => i.paymentStatus === 'Paid').length,
    Pending: filteredInvoices.filter(i => i.paymentStatus === 'Pending').length,
    Overdue: filteredInvoices.filter(i => i.paymentStatus === 'Overdue').length,
    Submitted: filteredInvoices.filter(i => i.paymentStatus === 'Submitted').length,
  };

  const paymentDoughnutData = {
    labels: ['Paid', 'Pending', 'Overdue', 'Submitted'],
    datasets: [{
      data: [paymentStatusCounts.Paid, paymentStatusCounts.Pending, paymentStatusCounts.Overdue, paymentStatusCounts.Submitted],
      backgroundColor: ['#4caf50', '#ff9800', '#f44336', '#2196f3'],
      borderWidth: 2,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 11, weight: '600' }, usePointStyle: true, pointStyle: 'circle', padding: 12 },
      },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
            return ctx.label + ': ' + ctx.parsed + ' (' + pct + '%)';
          }
        }
      }
    },
  };

  // ============ CONTRACT ============
  const contractDoughnutData = {
    labels: ['Active', 'Completed', 'Pending'],
    datasets: [{
      data: [contractStatusCounts.Active, contractStatusCounts.Completed, contractStatusCounts.Pending],
      backgroundColor: ['#4caf50', '#2196f3', '#ff9800'],
      borderWidth: 2,
    }],
  };

  const contractValueByClient = {};
  contracts.forEach(c => {
    const name = getClientName(c.client);
    if (!contractValueByClient[name]) contractValueByClient[name] = 0;
    contractValueByClient[name] += c.contractValue || 0;
  });
  const sortedClients = Object.keys(contractValueByClient).sort((a, b) => contractValueByClient[b] - contractValueByClient[a]);
  const topClients = sortedClients.slice(0, 8);

  const contractBarData = {
    labels: topClients.length > 0 ? topClients : ['No Data'],
    datasets: [{
      label: 'Contract Value (RM)',
      data: topClients.length > 0 ? topClients.map(c => contractValueByClient[c]) : [0],
      backgroundColor: 'rgba(25,118,210,0.7)',
      borderColor: 'rgba(25,118,210,1)',
      borderWidth: 2,
      borderRadius: 4,
    }],
  };

  const contractBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Top Clients by Contract Value',
        font: { size: 15, weight: '700' },
        padding: { bottom: 15 },
      },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            return 'RM ' + (ctx.parsed.y || 0).toLocaleString();
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Value (RM)', font: { size: 11, weight: '600' } } },
    },
  };

  // ============ TENDER ============
  const tenderStatusCounts = {
    Awarded: tenders.filter(t => t.status === 'Awarded').length,
    'Under Review': tenders.filter(t => t.status === 'Under Review').length,
    Submitted: tenders.filter(t => t.status === 'Submitted').length,
    'Pending Submission': tenders.filter(t => t.status === 'Pending Submission').length,
    Decline: tenders.filter(t => t.status === 'Decline').length,
    Unsuccessful: tenders.filter(t => t.status === 'Unsuccessful').length,
    Aborted: tenders.filter(t => t.status === 'Aborted').length,
  };

  const tenderDoughnutData = {
    labels: ['Awarded', 'Under Review', 'Submitted', 'Pending Submission', 'Decline', 'Unsuccessful', 'Aborted'],
    datasets: [{
      data: [
        tenderStatusCounts.Awarded,
        tenderStatusCounts['Under Review'],
        tenderStatusCounts.Submitted,
        tenderStatusCounts['Pending Submission'],
        tenderStatusCounts.Decline,
        tenderStatusCounts.Unsuccessful,
        tenderStatusCounts.Aborted,
      ],
      backgroundColor: ['#4caf50', '#ff9800', '#2196f3', '#9c27b0', '#f44336', '#795548', '#607d8b'],
      borderWidth: 2,
    }],
  };

  const tenderByClient = {};
  tenders.forEach(t => {
    const name = getClientName(t.client);
    if (!tenderByClient[name]) tenderByClient[name] = 0;
    tenderByClient[name]++;
  });
  const sortedTenderClients = Object.keys(tenderByClient).sort((a, b) => tenderByClient[b] - tenderByClient[a]);
  const topTenderClients = sortedTenderClients.slice(0, 8);

  const tenderBarData = {
    labels: topTenderClients.length > 0 ? topTenderClients : ['No Data'],
    datasets: [{
      label: 'Number of Tenders',
      data: topTenderClients.length > 0 ? topTenderClients.map(c => tenderByClient[c]) : [0],
      backgroundColor: 'rgba(156,39,176,0.7)',
      borderColor: 'rgba(156,39,176,1)',
      borderWidth: 2,
      borderRadius: 4,
    }],
  };

  const tenderBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Top Clients by Tender Submissions',
        font: { size: 15, weight: '700' },
        padding: { bottom: 15 },
      },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            const v = ctx.parsed.y || 0;
            return v + ' tender' + (v > 1 ? 's' : '');
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Number of Tenders', font: { size: 11, weight: '600' } } },
    },
  };

  // ============ GANTT ============
  const ganttData = tenders.filter(t => t.commencementDate && t.duration).map(t => {
    const start = new Date(t.commencementDate);
    const end = new Date(start);
    end.setDate(end.getDate() + parseInt(t.duration));
    return {
      ...t,
      start,
      end,
      clientName: getClientName(t.client),
      vesselNames: t.proposedVessels?.map(v => getVesselName(v.vessel)).join(', ') || 'N/A',
      rates: t.proposedVessels?.map(v => v.proposedRate).join(', ') || 'N/A',
      duration: parseInt(t.duration)
    };
  }).sort((a, b) => a.start - b.start);

  const minGanttDate = ganttData.length > 0 ? ganttData[0].start : new Date();
  const maxGanttDate = ganttData.length > 0 ? ganttData[ganttData.length - 1].end : new Date();
  const ganttTotalDays = Math.max((maxGanttDate - minGanttDate) / (1000 * 60 * 60 * 24), 1);

  const generateGanttLabels = () => {
    if (ganttData.length === 0) return [];
    const labels = [];
    const current = new Date(minGanttDate);
    current.setDate(1);
    while (current <= maxGanttDate) {
      labels.push({ month: current.toLocaleString('default', { month: 'short' }), year: current.getFullYear(), date: new Date(current) });
      current.setMonth(current.getMonth() + 1);
    }
    return labels;
  };
  const ganttMonthLabels = generateGanttLabels();

  const getStatusColor = (status) => {
    const colors = { 'Awarded': '#4caf50', 'Under Review': '#ff9800', 'Submitted': '#2196f3', 'Pending Submission': '#9c27b0', 'Decline': '#f44336', 'Unsuccessful': '#795548', 'Aborted': '#607d8b' };
    return colors[status] || '#9e9e9e';
  };

  // ============ UTILIZATION ============
  const utilVesselSet = new Set();
  filteredUtilizations.forEach(u => {
    const name = getVesselName(u.vessel);
    if (name !== 'Unknown') utilVesselSet.add(name);
  });
  const utilVessels = Array.from(utilVesselSet);

  const utilData = {};
  const utilBudgetData = {};

  filteredUtilizations.forEach(u => {
    const month = u.month;
    const vessel = getVesselName(u.vessel);
    if (!utilData[month]) utilData[month] = {};
    if (!utilData[month][vessel]) utilData[month][vessel] = 0;
    utilData[month][vessel] += u.actualDays || 0;
    if (!utilBudgetData[month]) utilBudgetData[month] = 0;
    utilBudgetData[month] += u.budgetDays || 0;
  });

  const utilMonths = Object.keys(utilData).sort((a, b) => monthsOrder.indexOf(a) - monthsOrder.indexOf(b));

  const utilDatasets = utilVessels.map((vessel, i) => ({
    label: vessel,
    data: utilMonths.map(m => utilData[m]?.[vessel] || 0),
    backgroundColor: colors[i % colors.length],
    borderColor: borderColors[i % borderColors.length],
    borderWidth: 1,
    borderRadius: 2,
  }));

  const utilBudgetLine = utilMonths.map(m => utilBudgetData[m] || 0);

  const utilizationStackedData = {
    labels: utilMonths,
    datasets: [
      ...utilDatasets,
      {
        label: 'Total Budget',
        data: utilBudgetLine,
        type: 'line',
        borderColor: '#d32f2f',
        backgroundColor: 'rgba(211,47,47,0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#d32f2f',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4,
        order: 0,
      }
    ],
  };

  const utilizationStackedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 11, weight: '600' }, usePointStyle: true, pointStyle: 'circle', padding: 10 },
      },
      title: {
        display: true,
        text: 'Monthly Utilization by Vessel (Stacked)',
        font: { size: 15, weight: '700' },
        padding: { bottom: 15 },
      },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            const label = ctx.dataset.label || '';
            const value = ctx.parsed.y || 0;
            if (label === 'Total Budget') return 'Total Budget: ' + value.toFixed(1) + ' days';
            return label + ': ' + value.toFixed(1) + ' days';
          }
        }
      }
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Days', font: { size: 11, weight: '600' } } },
    },
  };

  // ============ STATS ============
  const totalContractValue = contracts.reduce((sum, c) => sum + (c.contractValue || 0), 0);
  const remainingContractValue = contracts.filter(c => getContractStatus(c) === 'Active').reduce((sum, c) => sum + (c.contractValue || 0), 0);
  const remainingPercent = totalContractValue > 0 ? ((remainingContractValue / totalContractValue) * 100).toFixed(1) : 0;

  const totalInvoiceAmount = filteredInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalBudgetAmount = filteredBudgets.reduce((sum, b) => sum + (b.budgetedSale || 0), 0);
  const invoiceVariance = totalInvoiceAmount - totalBudgetAmount;
  const invoiceVariancePercent = totalBudgetAmount > 0 ? ((invoiceVariance / totalBudgetAmount) * 100).toFixed(2) : 0;

  const totalUtilBudget = filteredUtilizations.reduce((sum, u) => sum + (u.budgetDays || 0), 0);
  const totalUtilActual = filteredUtilizations.reduce((sum, u) => sum + (u.actualDays || 0), 0);
  const overallUtilization = totalUtilBudget > 0 ? ((totalUtilActual / totalUtilBudget) * 100) : 0;

  if (loading) return <LinearProgress />;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0a1929' }}>Executive Report</Typography>
          <Typography variant="body2" color="textSecondary">Generated: {new Date().toLocaleString()} | Year: {selectedYear}</Typography>
        </Box>
        <Box>
          <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
            <InputLabel>Year</InputLabel>
            <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} label="Year">
              {[2024, 2025, 2026, 2027, 2028].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ mr: 1, borderRadius: 2, textTransform: 'none' }}>Print</Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ borderRadius: 2, textTransform: 'none' }}>Export</Button>
        </Box>
      </Box>

      {/* Summary Cards - 4 in a row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Total Contracts</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0a1929' }}>{contracts.length}</Typography>
              <Typography variant="caption" color="textSecondary">{contractStatusCounts.Active} Active • {contractStatusCounts.Completed} Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Contract Value</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0a1929' }}>RM {totalContractValue.toLocaleString()}</Typography>
              <Typography variant="caption" color="textSecondary">Remaining: {remainingPercent}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Total Tenders</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0a1929' }}>{tenders.length}</Typography>
              <Typography variant="caption" color="textSecondary">{tenders.filter(t => t.status === 'Awarded').length} Awarded</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Overall Utilization</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: overallUtilization >= 80 ? '#4caf50' : overallUtilization >= 60 ? '#ff9800' : '#f44336' }}>
                {overallUtilization.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="textSecondary">{totalUtilActual.toFixed(1)} / {totalUtilBudget.toFixed(1)} days</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Invoice Summary - 4 cards in a row */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#0a1929', mb: 2 }}>Invoices Summary</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 2, bgcolor: '#f8f9fc', borderRadius: 2 }}>
              <Typography variant="caption" color="textSecondary">Total Invoices</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{filteredInvoices.length}</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 2, bgcolor: '#f8f9fc', borderRadius: 2 }}>
              <Typography variant="caption" color="textSecondary">Total Sale</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>RM {totalInvoiceAmount.toLocaleString()}</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 2, bgcolor: '#f8f9fc', borderRadius: 2 }}>
              <Typography variant="caption" color="textSecondary">Annual Budget</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>RM {totalBudgetAmount.toLocaleString()}</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 2, bgcolor: '#f8f9fc', borderRadius: 2 }}>
              <Typography variant="caption" color="textSecondary">Variance</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: invoiceVariance >= 0 ? '#4caf50' : '#f44336' }}>
                {invoiceVariancePercent}%
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Invoice Charts - 2 charts side by side */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: 380 }}>
            <Bar data={invoiceStackedData} options={invoiceStackedOptions} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: 380 }}>
            <Line data={cumulativeLineData} options={cumulativeLineOptions} />
          </Paper>
        </Grid>
      </Grid>

      {/* Doughnut Charts - 3 in a row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: 320 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'center', mb: 1 }}>Payment Status</Typography>
            <Doughnut data={paymentDoughnutData} options={doughnutOptions} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: 320 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'center', mb: 1 }}>Contract Status</Typography>
            <Doughnut data={contractDoughnutData} options={doughnutOptions} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: 320 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'center', mb: 1 }}>Tender Status</Typography>
            <Doughnut data={tenderDoughnutData} options={doughnutOptions} />
          </Paper>
        </Grid>
      </Grid>

      {/* Contract & Tender Charts - 2 in a row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: 320 }}>
            <Bar data={contractBarData} options={contractBarOptions} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: 320 }}>
            <Bar data={tenderBarData} options={tenderBarOptions} />
          </Paper>
        </Grid>
      </Grid>

      {/* Gantt Chart - Full width */}
      {ganttData.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#0a1929', mb: 2 }}>Tender Timeline (Gantt Chart)</Typography>
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <Box sx={{ width: '100%', position: 'relative' }}>
              <Box sx={{ display: 'flex', borderBottom: '2px solid #e0e0e0', pb: 1, mb: 1 }}>
                <Box sx={{ width: 150, flexShrink: 0, fontWeight: 600, fontSize: '0.7rem', color: '#666' }}>Client / Vessel</Box>
                <Box sx={{ flex: 1, display: 'flex', position: 'relative', height: 20 }}>
                  {ganttMonthLabels.map((label, index) => {
                    const start = Math.max((label.date - minGanttDate) / (1000 * 60 * 60 * 24), 0);
                    const end = Math.min((new Date(label.date.getFullYear(), label.date.getMonth() + 1, 1) - minGanttDate) / (1000 * 60 * 60 * 24), ganttTotalDays);
                    const w = ((end - start) / ganttTotalDays) * 100;
                    const l = (start / ganttTotalDays) * 100;
                    return <Box key={index} sx={{ position: 'absolute', left: `${l}%`, width: `${w}%`, top: 0, textAlign: 'center', fontSize: '0.6rem', fontWeight: 600, color: '#666', borderRight: index < ganttMonthLabels.length - 1 ? '1px solid #eee' : 'none' }}>{label.month} {label.year}</Box>;
                  })}
                </Box>
              </Box>
              {ganttData.map((item, index) => {
                const startOffset = Math.max((item.start - minGanttDate) / (1000 * 60 * 60 * 24), 0);
                const barWidth = Math.max((item.duration / ganttTotalDays) * 100, 3);
                const leftPos = (startOffset / ganttTotalDays) * 100;
                const color = getStatusColor(item.status);
                return (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ width: 150, flexShrink: 0, pr: 1 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 500, fontSize: '0.7rem' }}>{item.clientName}</Typography>
                      <Typography variant="caption" color="textSecondary" noWrap sx={{ fontSize: '0.6rem' }}>{item.vesselNames}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, height: 24, bgcolor: '#f5f5f5', borderRadius: 1, position: 'relative' }}>
                      <Tooltip title={
                        <Box sx={{ p: 1.5, minWidth: 200 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}>{item.clientName || 'N/A'}</Typography>
                          <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block' }}><strong>Vessel:</strong> {item.vesselNames || 'N/A'}</Typography>
                          <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block' }}><strong>Rate:</strong> RM {item.rates || '0'}</Typography>
                          <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block' }}><strong>Period:</strong> {item.start?.toLocaleDateString() || 'N/A'} - {item.end?.toLocaleDateString() || 'N/A'}</Typography>
                          <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block' }}><strong>Duration:</strong> {item.duration || 0} days</Typography>
                          <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block' }}><strong>Status:</strong> {item.status || 'N/A'}</Typography>
                        </Box>
                      } arrow placement="top">
                        <Box sx={{ position: 'absolute', left: `${leftPos}%`, width: `${barWidth}%`, height: '100%', bgcolor: color, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.55rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', minWidth: barWidth > 5 ? 'auto' : '4px', '&:hover': { opacity: 0.8, transform: 'scaleY(1.1)' } }}>
                          {barWidth > 12 ? `${item.duration}d` : ''}
                        </Box>
                      </Tooltip>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Utilization Chart - Full width */}
      {utilMonths.length > 0 && utilVessels.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: 420 }}>
          <Bar data={utilizationStackedData} options={utilizationStackedOptions} />
        </Paper>
      )}

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          DJ Group Chartering Database • Report Generated on {new Date().toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
}

export default Reports;