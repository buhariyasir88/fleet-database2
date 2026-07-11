import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ViewAgenda as GroupByIcon,
  ViewList as ViewListIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

const API_URL = 'https://fleet-database-backend.onrender.com/api';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [groupBy, setGroupBy] = useState('none');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterVessel, setFilterVessel] = useState('');
  const [monthlyBudgets, setMonthlyBudgets] = useState([]);
  const [savingBudget, setSavingBudget] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [budgetTableOpen, setBudgetTableOpen] = useState(true);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    billingMonth: '',
    billingYear: new Date().getFullYear(),
    contract: '',
    client: '',
    vessel: '',
    dcr: '',
    duration: '',
    mob: '',
    demob: '',
    submissionDate: '',
    paymentStatus: 'Pending',
    remarks: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const statusOptions = ['Pending', 'Submitted', 'Paid', 'Overdue'];

  const getUniqueMonths = () => {
    const monthsSet = new Set();
    invoices.forEach(inv => {
      if (inv.billingMonth && inv.billingYear) {
        const monthKey = `${inv.billingMonth} ${inv.billingYear}`;
        monthsSet.add(monthKey);
      }
    });
    return Array.from(monthsSet).sort();
  };

  const getUniqueVessels = () => {
    const vesselNames = new Set();
    invoices.forEach(inv => {
      if (inv.vessel?.name) {
        vesselNames.add(inv.vessel.name);
      }
    });
    return Array.from(vesselNames).sort();
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, contractsRes, clientsRes, vesselsRes, budgetsRes] = await Promise.all([
        axios.get(`${API_URL}/invoices`),
        axios.get(`${API_URL}/contracts`),
        axios.get(`${API_URL}/clients`),
        axios.get(`${API_URL}/vessels`),
        axios.get(`${API_URL}/budgets`),
      ]);
      setInvoices(invoicesRes.data);
      setContracts(contractsRes.data);
      setClients(clientsRes.data);
      setVessels(vesselsRes.data);
      setMonthlyBudgets(budgetsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showSnackbar('Error fetching data. Make sure backend is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '', severity: 'success' });
  };

  const handleOpenDialog = (invoice = null) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        invoiceNumber: invoice.invoiceNumber || '',
        billingMonth: invoice.billingMonth || '',
        billingYear: invoice.billingYear || new Date().getFullYear(),
        contract: invoice.contract?._id || '',
        client: invoice.client?._id || '',
        vessel: invoice.vessel?._id || '',
        dcr: invoice.dcr || '',
        duration: invoice.duration || '',
        mob: invoice.mob || '',
        demob: invoice.demob || '',
        submissionDate: invoice.submissionDate?.split('T')[0] || '',
        paymentStatus: invoice.paymentStatus || 'Pending',
        remarks: invoice.remarks || '',
      });
    } else {
      setEditingInvoice(null);
      setFormData({
        invoiceNumber: '',
        billingMonth: '',
        billingYear: new Date().getFullYear(),
        contract: '',
        client: '',
        vessel: '',
        dcr: '',
        duration: '',
        mob: '',
        demob: '',
        submissionDate: '',
        paymentStatus: 'Pending',
        remarks: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingInvoice(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateTotal = () => {
    const dcr = parseFloat(formData.dcr) || 0;
    const duration = parseFloat(formData.duration) || 0;
    const mob = parseFloat(formData.mob) || 0;
    const demob = parseFloat(formData.demob) || 0;
    return (dcr * duration) + mob + demob;
  };

  const calculateExpectedPayment = () => {
    if (!formData.submissionDate) return '';
    const date = new Date(formData.submissionDate);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      if (!formData.client || !formData.vessel || !formData.dcr || !formData.duration || !formData.submissionDate || !formData.billingMonth) {
        showSnackbar('Please fill in all required fields', 'error');
        setSaving(false);
        return;
      }

      const totalAmount = calculateTotal();
      const expectedPaymentDate = calculateExpectedPayment();

      const invoiceData = {
        invoiceNumber: formData.invoiceNumber || `INV-${Date.now()}`,
        billingMonth: formData.billingMonth,
        billingYear: parseInt(formData.billingYear),
        contract: formData.contract || null,
        client: formData.client,
        vessel: formData.vessel,
        dcr: parseFloat(formData.dcr),
        duration: parseFloat(formData.duration),
        mob: parseFloat(formData.mob) || 0,
        demob: parseFloat(formData.demob) || 0,
        totalAmount: totalAmount,
        submissionDate: formData.submissionDate,
        expectedPaymentDate: expectedPaymentDate,
        paymentStatus: formData.paymentStatus,
        remarks: formData.remarks || '',
      };

      if (editingInvoice) {
        await axios.put(`${API_URL}/invoices/${editingInvoice._id}`, invoiceData);
        showSnackbar('Invoice updated successfully! 🎉');
      } else {
        await axios.post(`${API_URL}/invoices`, invoiceData);
        showSnackbar('Invoice created successfully! 🎉');
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving invoice:', error);
      showSnackbar(error.response?.data?.error || 'Error saving invoice. Make sure backend is running.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await axios.delete(`${API_URL}/invoices/${id}`);
        showSnackbar('Invoice deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        showSnackbar('Error deleting invoice', 'error');
      }
    }
  };

  // ========== BUDGET FUNCTIONS ==========
  const getBudgetForMonth = (month, year) => {
    const budget = monthlyBudgets.find(b => b.month === month && b.year === year);
    return budget?.budgetedSale || 0;
  };

  const getActualForMonth = (month, year) => {
    const monthKey = `${month} ${year}`;
    let total = 0;
    invoices.forEach(inv => {
      if (`${inv.billingMonth} ${inv.billingYear}` === monthKey) {
        total += inv.totalAmount || 0;
      }
    });
    return total;
  };

  const handleBudgetChange = (month, year, value) => {
    const existingIndex = monthlyBudgets.findIndex(b => b.month === month && b.year === year);
    const updatedBudgets = [...monthlyBudgets];
    
    if (existingIndex !== -1) {
      updatedBudgets[existingIndex].budgetedSale = parseFloat(value) || 0;
    } else {
      updatedBudgets.push({ month, year, budgetedSale: parseFloat(value) || 0 });
    }
    setMonthlyBudgets(updatedBudgets);
  };

  const saveBudget = async (month, year) => {
    try {
      setSavingBudget(true);
      const budget = monthlyBudgets.find(b => b.month === month && b.year === year);
      
      if (!budget || budget.budgetedSale === 0) {
        showSnackbar('Please enter a budget value first', 'error');
        setSavingBudget(false);
        return;
      }

      if (budget._id) {
        await axios.put(`${API_URL}/budgets/${budget._id}`, budget);
      } else {
        await axios.post(`${API_URL}/budgets`, budget);
      }
      showSnackbar('Budget saved successfully! 🎉');
      fetchData();
    } catch (error) {
      console.error('Error saving budget:', error);
      showSnackbar('Error saving budget. Make sure backend is running.', 'error');
    } finally {
      setSavingBudget(false);
    }
  };

  // Calculate totals
  const totalActual = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalBudgeted = monthlyBudgets.reduce((sum, b) => sum + (b.budgetedSale || 0), 0);
  const totalVariance = totalActual - totalBudgeted;
  const totalVariancePercent = totalBudgeted > 0 ? ((totalVariance / totalBudgeted) * 100).toFixed(2) : 0;

  // Get current month for MTD
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();
  const mtdActual = getActualForMonth(currentMonth, currentYear);
  const mtdBudget = getBudgetForMonth(currentMonth, currentYear);
  const mtdVariance = mtdActual - mtdBudget;
  const mtdVariancePercent = mtdBudget > 0 ? ((mtdVariance / mtdBudget) * 100).toFixed(2) : 0;

  // Generate all 12 months for budget table
  const allMonthsData = months.map(month => {
    const actual = getActualForMonth(month, selectedYear);
    const budget = getBudgetForMonth(month, selectedYear);
    const variance = actual - budget;
    const variancePercent = budget > 0 ? ((variance / budget) * 100).toFixed(2) : 0;
    return { month, actual, budget, variance, variancePercent };
  });

  // Calculate cumulative
  let cumulative = 0;
  const monthlyWithCumulative = allMonthsData.map(item => {
    cumulative += item.actual;
    return { ...item, cumulative };
  });

  const groupedByMonth = invoices.reduce((acc, inv) => {
    const monthKey = `${inv.billingMonth} ${inv.billingYear}`;
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(inv);
    return acc;
  }, {});

  const groupedByVessel = invoices.reduce((acc, inv) => {
    const vesselName = inv.vessel?.name || 'Unknown';
    if (!acc[vesselName]) acc[vesselName] = [];
    acc[vesselName].push(inv);
    return acc;
  }, {});

  const getPaymentStatusColor = (status) => {
    const colors = {
      'Paid': 'success',
      'Pending': 'warning',
      'Overdue': 'error',
      'Submitted': 'info'
    };
    return colors[status] || 'default';
  };

  const filteredInvoices = invoices.filter(inv => {
    const monthKey = `${inv.billingMonth} ${inv.billingYear}`;
    const vesselName = inv.vessel?.name || '';
    
    let matchMonth = true;
    let matchVessel = true;
    
    if (filterMonth) {
      matchMonth = monthKey === filterMonth;
    }
    if (filterVessel) {
      matchVessel = vesselName === filterVessel;
    }
    
    return matchMonth && matchVessel;
  });

  const uniqueMonths = getUniqueMonths();
  const uniqueVessels = getUniqueVessels();

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0a1929', mb: 0.5 }}>
          Invoices
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage your invoices and track collections
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Invoices
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0a1929' }}>
                {invoices.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid #4caf50' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Actual Sale
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                RM {totalActual.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid #ff9800' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Annual Budget
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                RM {totalBudgeted.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: `4px solid ${totalVariance >= 0 ? '#4caf50' : '#f44336'}` }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Variance
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: totalVariance >= 0 ? '#4caf50' : '#f44336' }}>
                RM {totalVariance.toLocaleString()} ({totalVariancePercent}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* MTD Summary */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', bgcolor: '#f8f9fc' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0a1929' }}>
          MTD (Month-to-Date): {currentMonth} {currentYear}
        </Typography>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={4}>
            <Typography variant="caption" color="textSecondary">Actual Sale</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>RM {mtdActual.toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="textSecondary">Budget</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>RM {mtdBudget.toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="textSecondary">Variance</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: mtdVariance >= 0 ? '#4caf50' : '#f44336' }}>
              RM {mtdVariance.toLocaleString()} ({mtdVariancePercent}%)
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Collapsible Monthly Budget vs Actual Comparison */}
      <Paper sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            bgcolor: '#f5f5f5',
            '&:hover': { bgcolor: '#e8e8e8' },
          }}
          onClick={() => setBudgetTableOpen(!budgetTableOpen)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#0a1929' }}>
              Monthly Budget vs Actual Comparison - {selectedYear}
            </Typography>
            <Chip 
              label={`${allMonthsData.filter(m => m.budget > 0 || m.actual > 0).length} months active`} 
              size="small" 
              color="primary" 
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 100 }} onClick={(e) => e.stopPropagation()}>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {[2024, 2025, 2026, 2027, 2028].map(y => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton>
              {budgetTableOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
        
        <Collapse in={budgetTableOpen}>
          <Box sx={{ p: 2 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fc' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Month</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Budgeted Sale</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actual Sale</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Variance ($)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Variance (%)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Cumulative Sale</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyWithCumulative.map((item) => {
                    const isCurrentMonth = item.month === currentMonth && selectedYear === currentYear;
                    return (
                      <TableRow key={item.month} hover sx={isCurrentMonth ? { bgcolor: 'rgba(25, 118, 210, 0.05)' } : {}}>
                        <TableCell>
                          {item.month}
                          {isCurrentMonth && <Chip label="MTD" size="small" color="info" sx={{ ml: 1 }} />}
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={item.budget}
                            onChange={(e) => handleBudgetChange(item.month, selectedYear, e.target.value)}
                            sx={{ width: 120 }}
                            inputProps={{ min: 0, step: 100 }}
                            placeholder="Enter budget"
                          />
                        </TableCell>
                        <TableCell align="right">RM {item.actual.toLocaleString()}</TableCell>
                        <TableCell align="right" style={{ color: item.variance >= 0 ? '#4caf50' : '#f44336' }}>
                          RM {item.variance.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${item.variancePercent}%`}
                            color={item.variancePercent >= 0 ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">RM {item.cumulative.toLocaleString()}</TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => saveBudget(item.month, selectedYear)}
                            disabled={savingBudget}
                            startIcon={<SaveIcon />}
                            sx={{ textTransform: 'none' }}
                          >
                            {savingBudget ? 'Saving...' : 'Save Budget'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Collapse>
      </Paper>

      {/* Filter Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Month</InputLabel>
            <Select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              label="Month"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Months</MenuItem>
              {uniqueMonths.map((month) => (
                <MenuItem key={month} value={month}>{month}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Vessel</InputLabel>
            <Select
              value={filterVessel}
              onChange={(e) => setFilterVessel(e.target.value)}
              label="Vessel"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Vessels</MenuItem>
              {uniqueVessels.map((vessel) => (
                <MenuItem key={vessel} value={vessel}>{vessel}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {(filterMonth || filterVessel) && (
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => { setFilterMonth(''); setFilterVessel(''); }}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Clear Filters
            </Button>
          )}

          <ToggleButtonGroup
            value={groupBy}
            exclusive
            onChange={(e, val) => setGroupBy(val || 'none')}
            size="small"
          >
            <ToggleButton value="none">
              <ViewListIcon /> All
            </ToggleButton>
            <ToggleButton value="month">
              <GroupByIcon /> Month
            </ToggleButton>
            <ToggleButton value="vessel">
              <GroupByIcon /> Vessel
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            borderRadius: 2, 
            textTransform: 'none',
            px: 4,
            py: 1.2,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
            }
          }}
        >
          Add Invoice
        </Button>
      </Box>

      {/* Render based on grouping */}
      {groupBy === 'month' ? (
        <Box>
          {Object.keys(groupedByMonth).sort().map(monthKey => {
            let filteredItems = groupedByMonth[monthKey];
            if (filterVessel) {
              filteredItems = filteredItems.filter(inv => inv.vessel?.name === filterVessel);
            }
            if (filteredItems.length === 0) return null;
            
            return (
              <Box key={monthKey} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#0a1929', mb: 1 }}>
                  {monthKey} - Total: RM {filteredItems.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toLocaleString()}
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8f9fc' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Vessel</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>DCR</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Total Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Submission Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Expected Payment</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredItems.map((inv) => (
                        <TableRow key={inv._id} hover>
                          <TableCell>{inv.invoiceNumber || '-'}</TableCell>
                          <TableCell>{inv.vessel?.name || 'N/A'}</TableCell>
                          <TableCell>{inv.client?.name || 'N/A'}</TableCell>
                          <TableCell>RM {inv.dcr?.toLocaleString() || 0}</TableCell>
                          <TableCell>{inv.duration} days</TableCell>
                          <TableCell>RM {inv.totalAmount?.toLocaleString() || 0}</TableCell>
                          <TableCell>{inv.submissionDate ? new Date(inv.submissionDate).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>{inv.expectedPaymentDate ? new Date(inv.expectedPaymentDate).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>
                            <Chip label={inv.paymentStatus} color={getPaymentStatusColor(inv.paymentStatus)} size="small" />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => handleOpenDialog(inv)} color="primary">
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(inv._id)} color="error">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
        </Box>
      ) : groupBy === 'vessel' ? (
        <Box>
          {Object.keys(groupedByVessel).sort().map(vesselName => {
            let filteredItems = groupedByVessel[vesselName];
            if (filterMonth) {
              filteredItems = filteredItems.filter(inv => {
                const monthKey = `${inv.billingMonth} ${inv.billingYear}`;
                return monthKey === filterMonth;
              });
            }
            if (filteredItems.length === 0) return null;
            
            return (
              <Box key={vesselName} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#0a1929', mb: 1 }}>
                  {vesselName} - Total: RM {filteredItems.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toLocaleString()}
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8f9fc' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Billing Month</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>DCR</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Total Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Submission Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Expected Payment</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredItems.map((inv) => (
                        <TableRow key={inv._id} hover>
                          <TableCell>{inv.invoiceNumber || '-'}</TableCell>
                          <TableCell>{inv.client?.name || 'N/A'}</TableCell>
                          <TableCell>{inv.billingMonth} {inv.billingYear}</TableCell>
                          <TableCell>RM {inv.dcr?.toLocaleString() || 0}</TableCell>
                          <TableCell>{inv.duration} days</TableCell>
                          <TableCell>RM {inv.totalAmount?.toLocaleString() || 0}</TableCell>
                          <TableCell>{inv.submissionDate ? new Date(inv.submissionDate).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>{inv.expectedPaymentDate ? new Date(inv.expectedPaymentDate).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>
                            <Chip label={inv.paymentStatus} color={getPaymentStatusColor(inv.paymentStatus)} size="small" />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => handleOpenDialog(inv)} color="primary">
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(inv._id)} color="error">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fc' }}>
                <TableCell sx={{ fontWeight: 600 }}>INVOICE #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>BILLING MONTH</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>CLIENT</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>VESSEL</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>DCR</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>DURATION</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>TOTAL AMOUNT</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>SUBMISSION DATE</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>EXPECTED PAYMENT</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>REMARKS</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">No invoices found. Click "Add Invoice" to get started.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice._id} hover>
                    <TableCell>{invoice.invoiceNumber || '-'}</TableCell>
                    <TableCell>{invoice.billingMonth} {invoice.billingYear}</TableCell>
                    <TableCell>{invoice.client?.name || 'N/A'}</TableCell>
                    <TableCell>{invoice.vessel?.name || 'N/A'}</TableCell>
                    <TableCell>RM {invoice.dcr?.toLocaleString() || 0}</TableCell>
                    <TableCell>{invoice.duration} days</TableCell>
                    <TableCell>RM {invoice.totalAmount?.toLocaleString() || 0}</TableCell>
                    <TableCell>{invoice.submissionDate ? new Date(invoice.submissionDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{invoice.expectedPaymentDate ? new Date(invoice.expectedPaymentDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      <Chip label={invoice.paymentStatus} color={getPaymentStatusColor(invoice.paymentStatus)} size="small" />
                    </TableCell>
                    <TableCell>{invoice.remarks || '-'}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog(invoice)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(invoice._id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            padding: 0,
            overflow: 'hidden',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 3,
          pb: 1,
          bgcolor: '#f8f9fc',
          borderBottom: '1px solid #e8ecf1',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#0a1929' }}>
            {editingInvoice ? 'Edit Invoice' : 'Add Invoice'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Invoice Number
              </Typography>
              <TextField
                fullWidth
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., INV-2026-001"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Billing Month *
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="billingMonth"
                  value={formData.billingMonth}
                  onChange={handleInputChange}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Select Month</MenuItem>
                  {months.map((month) => (
                    <MenuItem key={month} value={month}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Billing Year *
              </Typography>
              <TextField
                fullWidth
                name="billingYear"
                type="number"
                value={formData.billingYear}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Client *
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="client"
                  value={formData.client}
                  onChange={handleInputChange}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Select Client</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client._id} value={client._id}>{client.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Vessel *
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="vessel"
                  value={formData.vessel}
                  onChange={handleInputChange}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Select Vessel</MenuItem>
                  {vessels.map((vessel) => (
                    <MenuItem key={vessel._id} value={vessel._id}>{vessel.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                DCR (RM) *
              </Typography>
              <TextField
                fullWidth
                name="dcr"
                type="number"
                value={formData.dcr}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 1000"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Duration (days) *
              </Typography>
              <TextField
                fullWidth
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 30.5"
                size="small"
                inputProps={{ step: 0.001 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                MOB Fee (RM)
              </Typography>
              <TextField
                fullWidth
                name="mob"
                type="number"
                value={formData.mob}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 5000"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                DEMOB Fee (RM)
              </Typography>
              <TextField
                fullWidth
                name="demob"
                type="number"
                value={formData.demob}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 5000"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Total Invoice (Auto-calculated)
              </Typography>
              <TextField
                fullWidth
                value={`RM ${calculateTotal().toLocaleString()}`}
                variant="outlined"
                size="small"
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f5f5f5' } }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Submission Date *
              </Typography>
              <TextField
                fullWidth
                name="submissionDate"
                type="date"
                value={formData.submissionDate}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Expected Payment (Auto: +30 days)
              </Typography>
              <TextField
                fullWidth
                value={calculateExpectedPayment() || ''}
                variant="outlined"
                size="small"
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f5f5f5' } }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Payment Status
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                  sx={{ borderRadius: 2 }}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Remarks
              </Typography>
              <TextField
                fullWidth
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="Additional notes..."
                size="small"
                multiline
                rows={2}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          pt: 1,
          gap: 2,
          bgcolor: '#f8f9fc',
          borderTop: '1px solid #e8ecf1',
        }}>
          <Button 
            onClick={handleCloseDialog} 
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={saving}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 4,
              py: 1,
            }}
          >
            {saving ? 'Saving...' : editingInvoice ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Invoices;