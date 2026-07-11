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
  Avatar,
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
  Speed as UtilizationIcon,
  Save as SaveIcon,
  ViewAgenda as GroupByIcon,
  ViewList as ViewListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = 'http://https://fleet-database-backend.onrender.com/api';

function Utilization() {
  const [utilizations, setUtilizations] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUtilization, setEditingUtilization] = useState(null);
  const [groupBy, setGroupBy] = useState('none');
  const [filterVessel, setFilterVessel] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [budgetTableOpen, setBudgetTableOpen] = useState(true);
  const [formData, setFormData] = useState({
    vessel: '',
    month: '',
    year: new Date().getFullYear(),
    budgetDays: '',
    actualDays: '',
    remarks: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    fetchData();
  }, [filterYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [utilRes, vesselsRes] = await Promise.all([
        axios.get(`${API_URL}/utilizations`),
        axios.get(`${API_URL}/vessels`),
      ]);
      setUtilizations(utilRes.data);
      setVessels(vesselsRes.data);
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

  const handleOpenDialog = (util = null) => {
    if (util) {
      setEditingUtilization(util);
      setFormData({
        vessel: util.vessel?._id || '',
        month: util.month || '',
        year: util.year || new Date().getFullYear(),
        budgetDays: util.budgetDays || '',
        actualDays: util.actualDays || '',
        remarks: util.remarks || '',
      });
    } else {
      setEditingUtilization(null);
      setFormData({
        vessel: '',
        month: '',
        year: new Date().getFullYear(),
        budgetDays: '',
        actualDays: '',
        remarks: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUtilization(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      if (!formData.vessel || !formData.month || !formData.year || !formData.budgetDays || !formData.actualDays) {
        showSnackbar('Please fill in all required fields', 'error');
        setSaving(false);
        return;
      }

      const utilizationData = {
        vessel: formData.vessel,
        month: formData.month,
        year: parseInt(formData.year),
        budgetDays: parseFloat(formData.budgetDays),
        actualDays: parseFloat(formData.actualDays),
        remarks: formData.remarks || '',
      };

      if (editingUtilization) {
        await axios.put(`${API_URL}/utilizations/${editingUtilization._id}`, utilizationData);
        showSnackbar('Utilization record updated successfully! 🎉');
      } else {
        await axios.post(`${API_URL}/utilizations`, utilizationData);
        showSnackbar('Utilization record created successfully! 🎉');
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving utilization:', error);
      showSnackbar(error.response?.data?.error || 'Error saving utilization. Make sure backend is running.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await axios.delete(`${API_URL}/utilizations/${id}`);
        showSnackbar('Record deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting record:', error);
        showSnackbar('Error deleting record', 'error');
      }
    }
  };

  // Calculate utilization percentage
  const calculateUtilization = (budget, actual) => {
    if (budget === 0) return 0;
    return ((actual / budget) * 100);
  };

  // Get unique vessels for filter
  const getUniqueVessels = () => {
    const vesselNames = new Set();
    utilizations.forEach(u => {
      if (u.vessel?.name) {
        vesselNames.add(u.vessel.name);
      }
    });
    return Array.from(vesselNames).sort();
  };

  // Get unique months for filter
  const getUniqueMonths = () => {
    const monthSet = new Set();
    utilizations.forEach(u => {
      if (u.month && u.year) {
        monthSet.add(`${u.month} ${u.year}`);
      }
    });
    return Array.from(monthSet).sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      if (yearA !== yearB) return yearA - yearB;
      return months.indexOf(monthA) - months.indexOf(monthB);
    });
  };

  // Filter utilizations
  const filteredUtilizations = utilizations.filter(u => {
    let matchVessel = true;
    let matchMonth = true;
    let matchYear = true;
    
    if (filterVessel) {
      matchVessel = u.vessel?.name === filterVessel;
    }
    if (filterMonth) {
      matchMonth = `${u.month} ${u.year}` === filterMonth;
    }
    if (filterYear) {
      matchYear = u.year === filterYear;
    }
    
    return matchVessel && matchMonth && matchYear;
  });

  // Group by vessel for summary
  const groupedByVessel = filteredUtilizations.reduce((acc, u) => {
    const vesselName = u.vessel?.name || 'Unknown';
    if (!acc[vesselName]) {
      acc[vesselName] = { budget: 0, actual: 0 };
    }
    acc[vesselName].budget += u.budgetDays || 0;
    acc[vesselName].actual += u.actualDays || 0;
    return acc;
  }, {});

  // Group by month for trend
  const groupedByMonth = filteredUtilizations.reduce((acc, u) => {
    const monthKey = `${u.month} ${u.year}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { budget: 0, actual: 0, month: u.month, year: u.year };
    }
    acc[monthKey].budget += u.budgetDays || 0;
    acc[monthKey].actual += u.actualDays || 0;
    return acc;
  }, {});

  // Sort month keys by month order
  const sortedMonthKeys = Object.keys(groupedByMonth).sort((a, b) => {
    const [monthA, yearA] = a.split(' ');
    const [monthB, yearB] = b.split(' ');
    if (yearA !== yearB) return yearA - yearB;
    return months.indexOf(monthA) - months.indexOf(monthB);
  });

  // Calculate totals
  const totalBudget = filteredUtilizations.reduce((sum, u) => sum + (u.budgetDays || 0), 0);
  const totalActual = filteredUtilizations.reduce((sum, u) => sum + (u.actualDays || 0), 0);
  const overallUtilization = totalBudget > 0 ? ((totalActual / totalBudget) * 100) : 0;
  const totalVariance = totalActual - totalBudget;
  const totalVariancePercent = totalBudget > 0 ? ((totalVariance / totalBudget) * 100) : 0;

  // Get current month for MTD
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();
  const mtdActual = filteredUtilizations
    .filter(u => u.month === currentMonth && u.year === currentYear)
    .reduce((sum, u) => sum + u.actualDays, 0);
  const mtdBudget = filteredUtilizations
    .filter(u => u.month === currentMonth && u.year === currentYear)
    .reduce((sum, u) => sum + u.budgetDays, 0);
  const mtdVariance = mtdActual - mtdBudget;
  const mtdVariancePercent = mtdBudget > 0 ? ((mtdVariance / mtdBudget) * 100) : 0;

  // Generate all 12 months for budget table
  const allMonthsData = months.map(month => {
    const monthKey = `${month} ${filterYear}`;
    const data = groupedByMonth[monthKey] || { budget: 0, actual: 0 };
    const budget = data.budget || 0;
    const actual = data.actual || 0;
    const variance = actual - budget;
    const variancePercent = budget > 0 ? ((variance / budget) * 100) : 0;
    return { month, budget, actual, variance, variancePercent };
  });

  // Calculate cumulative
  let cumulative = 0;
  const monthlyWithCumulative = allMonthsData.map(item => {
    cumulative += item.actual;
    return { ...item, cumulative };
  });

  // Chart data - Monthly Utilization Trend
  const monthlyChartData = {
    labels: sortedMonthKeys,
    datasets: [
      {
        label: 'Budget Days',
        data: sortedMonthKeys.map(k => groupedByMonth[k].budget),
        backgroundColor: 'rgba(25, 118, 210, 0.6)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'Actual Days',
        data: sortedMonthKeys.map(k => groupedByMonth[k].actual),
        backgroundColor: 'rgba(76, 175, 80, 0.6)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 12, weight: '600' }, usePointStyle: true, pointStyle: 'circle', padding: 20 },
      },
      title: {
        display: true,
        text: 'Monthly Utilization Trend',
        font: { size: 16, weight: '700' },
        padding: { bottom: 20 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        title: { display: true, text: 'Days', font: { size: 12, weight: '600' } },
      },
      x: { grid: { display: false } },
    },
  };

  // Chart data - Vessel Utilization Summary
  const vesselChartData = {
    labels: Object.keys(groupedByVessel),
    datasets: [
      {
        label: 'Budget Days',
        data: Object.values(groupedByVessel).map(d => d.budget),
        backgroundColor: 'rgba(25, 118, 210, 0.6)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'Actual Days',
        data: Object.values(groupedByVessel).map(d => d.actual),
        backgroundColor: 'rgba(76, 175, 80, 0.6)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const vesselChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 12, weight: '600' }, usePointStyle: true, pointStyle: 'circle', padding: 20 },
      },
      title: {
        display: true,
        text: 'Vessel Utilization Summary',
        font: { size: 16, weight: '700' },
        padding: { bottom: 20 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        title: { display: true, text: 'Days', font: { size: 12, weight: '600' } },
      },
      x: { grid: { display: false } },
    },
  };

  const uniqueVessels = getUniqueVessels();
  const uniqueMonths = getUniqueMonths();

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0a1929', mb: 0.5 }}>
          Vessel Utilization
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Monitor vessel utilization performance against budget
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Vessels
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0a1929' }}>
                {Object.keys(groupedByVessel).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid #2196f3' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Budget Days
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196f3' }}>
                {totalBudget.toFixed(1)}d
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid #4caf50' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Actual Days
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                {totalActual.toFixed(1)}d
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: `4px solid ${overallUtilization >= 80 ? '#4caf50' : overallUtilization >= 60 ? '#ff9800' : '#f44336'}` }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Overall Utilization
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: overallUtilization >= 80 ? '#4caf50' : overallUtilization >= 60 ? '#ff9800' : '#f44336' }}>
                {overallUtilization.toFixed(1)}%
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
            <Typography variant="caption" color="textSecondary">Actual Days</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{mtdActual.toFixed(1)}d</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="textSecondary">Budget</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{mtdBudget.toFixed(1)}d</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="textSecondary">Variance</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: mtdVariance >= 0 ? '#4caf50' : '#f44336' }}>
              {mtdVariance >= 0 ? '+' : ''}{mtdVariance.toFixed(1)}d ({mtdVariancePercent.toFixed(1)}%)
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
              Monthly Budget vs Actual Comparison - {filterYear}
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
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
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
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Budget Days</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actual Days</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Variance (d)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Variance (%)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Cumulative Days</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyWithCumulative.map((item) => {
                    const isCurrentMonth = item.month === currentMonth && filterYear === currentYear;
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
                            onChange={(e) => {
                              // Find the utilization record for this month and update budget
                              const existing = utilizations.find(u => u.month === item.month && u.year === filterYear);
                              if (existing) {
                                const updated = { ...existing, budgetDays: parseFloat(e.target.value) || 0 };
                                // Update locally
                                const updatedUtilizations = utilizations.map(u => 
                                  u._id === existing._id ? updated : u
                                );
                                setUtilizations(updatedUtilizations);
                              } else {
                                // Create a new record
                                const newRecord = {
                                  vessel: vessels[0]?._id || '',
                                  month: item.month,
                                  year: filterYear,
                                  budgetDays: parseFloat(e.target.value) || 0,
                                  actualDays: 0,
                                  remarks: ''
                                };
                                setUtilizations([...utilizations, newRecord]);
                              }
                            }}
                            sx={{ width: 100 }}
                            inputProps={{ min: 0, step: 0.5 }}
                            placeholder="Enter budget"
                          />
                        </TableCell>
                        <TableCell align="right">{item.actual.toFixed(1)}d</TableCell>
                        <TableCell align="right" style={{ color: item.variance >= 0 ? '#4caf50' : '#f44336' }}>
                          {item.variance >= 0 ? '+' : ''}{item.variance.toFixed(1)}d
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${item.variancePercent.toFixed(1)}%`}
                            color={item.variancePercent >= 0 ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{item.cumulative.toFixed(1)}d</TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={async () => {
                              try {
                                const existing = utilizations.find(u => u.month === item.month && u.year === filterYear);
                                if (existing) {
                                  await axios.put(`${API_URL}/utilizations/${existing._id}`, existing);
                                  showSnackbar('Budget saved successfully! 🎉');
                                } else {
                                  // Find the vessel for this record
                                  const vesselId = vessels[0]?._id || '';
                                  const newData = {
                                    vessel: vesselId,
                                    month: item.month,
                                    year: filterYear,
                                    budgetDays: item.budget || 0,
                                    actualDays: 0,
                                    remarks: ''
                                  };
                                  await axios.post(`${API_URL}/utilizations`, newData);
                                  showSnackbar('Budget created successfully! 🎉');
                                }
                                fetchData();
                              } catch (error) {
                                console.error('Error saving budget:', error);
                                showSnackbar('Error saving budget', 'error');
                              }
                            }}
                            disabled={item.budget === 0}
                            startIcon={<SaveIcon />}
                            sx={{ textTransform: 'none' }}
                          >
                            Save Budget
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

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.keys(groupedByMonth).length > 0 && (
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', height: 380 }}>
              <Bar data={monthlyChartData} options={monthlyChartOptions} />
            </Paper>
          </Grid>
        )}
        {Object.keys(groupedByVessel).length > 0 && (
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', height: 380 }}>
              <Bar data={vesselChartData} options={vesselChartOptions} />
            </Paper>
          </Grid>
        )}
      </Grid>

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
          Add Utilization Record
        </Button>
      </Box>

      {/* Render based on grouping */}
      {groupBy === 'vessel' ? (
        <Box>
          {Object.keys(groupedByVessel).sort().map(vesselName => {
            const vesselData = groupedByVessel[vesselName];
            const utilization = calculateUtilization(vesselData.budget, vesselData.actual);
            const variance = vesselData.actual - vesselData.budget;
            const variancePercent = vesselData.budget > 0 ? ((variance / vesselData.budget) * 100) : 0;
            
            return (
              <Box key={vesselName} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#0a1929', mb: 1 }}>
                  {vesselName}
                  <Chip 
                    label={`${utilization.toFixed(1)}%`}
                    color={utilization >= 80 ? 'success' : utilization >= 60 ? 'warning' : 'error'}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8f9fc' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Month</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Year</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Budget Days</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Actual Days</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Utilization</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Variance (Days)</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Variance (%)</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUtilizations
                        .filter(u => u.vessel?.name === vesselName)
                        .sort((a, b) => {
                          const monthOrder = months.indexOf(a.month) - months.indexOf(b.month);
                          if (monthOrder !== 0) return monthOrder;
                          return a.year - b.year;
                        })
                        .map((u) => {
                          const util = calculateUtilization(u.budgetDays, u.actualDays);
                          const variance = u.actualDays - u.budgetDays;
                          const variancePercent = u.budgetDays > 0 ? ((variance / u.budgetDays) * 100) : 0;
                          return (
                            <TableRow key={u._id} hover>
                              <TableCell>{u.month}</TableCell>
                              <TableCell>{u.year}</TableCell>
                              <TableCell align="right">{u.budgetDays.toFixed(1)}d</TableCell>
                              <TableCell align="right">{u.actualDays.toFixed(1)}d</TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={`${util.toFixed(1)}%`}
                                  color={util >= 80 ? 'success' : util >= 60 ? 'warning' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right" style={{ color: variance >= 0 ? '#4caf50' : '#f44336' }}>
                                {variance >= 0 ? '+' : ''}{variance.toFixed(1)}d
                              </TableCell>
                              <TableCell align="right" style={{ color: variancePercent >= 0 ? '#4caf50' : '#f44336' }}>
                                {variancePercent >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%
                              </TableCell>
                              <TableCell>{u.remarks || '-'}</TableCell>
                              <TableCell>
                                <IconButton size="small" onClick={() => handleOpenDialog(u)} color="primary">
                                  <EditIcon />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleDelete(u._id)} color="error">
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
        </Box>
      ) : (
        // Default Table View
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fc' }}>
                <TableCell sx={{ fontWeight: 600 }}>VESSEL</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>MONTH</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>YEAR</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>BUDGET DAYS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>ACTUAL DAYS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>UTILIZATION</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>VARIANCE (DAYS)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>VARIANCE (%)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>REMARKS</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUtilizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <UtilizationIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                    <Typography color="textSecondary" variant="h6" sx={{ fontWeight: 500 }}>
                      No utilization records found
                    </Typography>
                    <Typography color="textSecondary" variant="body2">
                      Click "Add Utilization Record" to get started
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUtilizations
                  .sort((a, b) => {
                    const monthOrder = months.indexOf(a.month) - months.indexOf(b.month);
                    if (monthOrder !== 0) return monthOrder;
                    return a.year - b.year;
                  })
                  .map((u) => {
                    const util = calculateUtilization(u.budgetDays, u.actualDays);
                    const variance = u.actualDays - u.budgetDays;
                    const variancePercent = u.budgetDays > 0 ? ((variance / u.budgetDays) * 100) : 0;
                    return (
                      <TableRow key={u._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: '#1976d2' }}>
                              <UtilizationIcon sx={{ fontSize: 14, color: 'white' }} />
                            </Avatar>
                            {u.vessel?.name || 'N/A'}
                          </Box>
                        </TableCell>
                        <TableCell>{u.month}</TableCell>
                        <TableCell>{u.year}</TableCell>
                        <TableCell align="right">{u.budgetDays.toFixed(1)}d</TableCell>
                        <TableCell align="right">{u.actualDays.toFixed(1)}d</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${util.toFixed(1)}%`}
                            color={util >= 80 ? 'success' : util >= 60 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right" style={{ color: variance >= 0 ? '#4caf50' : '#f44336' }}>
                          {variance >= 0 ? '+' : ''}{variance.toFixed(1)}d
                        </TableCell>
                        <TableCell align="right" style={{ color: variancePercent >= 0 ? '#4caf50' : '#f44336' }}>
                          {variancePercent >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%
                        </TableCell>
                        <TableCell>{u.remarks || '-'}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleOpenDialog(u)} color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(u._id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Standardized Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
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
          <UtilizationIcon sx={{ color: '#1976d2', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#0a1929' }}>
            {editingUtilization ? 'Edit Utilization Record' : 'Add Utilization Record'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
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
                Month *
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="month"
                  value={formData.month}
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
                Year *
              </Typography>
              <TextField
                fullWidth
                name="year"
                type="number"
                value={formData.year}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Remarks
              </Typography>
              <TextField
                fullWidth
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="Why vessel not available?"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Budget Days *
              </Typography>
              <TextField
                fullWidth
                name="budgetDays"
                type="number"
                value={formData.budgetDays}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 30"
                size="small"
                inputProps={{ step: 0.5 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Actual Days *
              </Typography>
              <TextField
                fullWidth
                name="actualDays"
                type="number"
                value={formData.actualDays}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 25"
                size="small"
                inputProps={{ step: 0.5 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="textSecondary">Utilization</Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600,
                      color: calculateUtilization(
                        parseFloat(formData.budgetDays) || 0,
                        parseFloat(formData.actualDays) || 0
                      ) >= 80 ? '#4caf50' : 
                      calculateUtilization(
                        parseFloat(formData.budgetDays) || 0,
                        parseFloat(formData.actualDays) || 0
                      ) >= 60 ? '#ff9800' : '#f44336'
                    }}>
                      {calculateUtilization(
                        parseFloat(formData.budgetDays) || 0,
                        parseFloat(formData.actualDays) || 0
                      ).toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="textSecondary">Variance (Days)</Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600,
                      color: (parseFloat(formData.actualDays) || 0) - (parseFloat(formData.budgetDays) || 0) >= 0 ? '#4caf50' : '#f44336'
                    }}>
                      {((parseFloat(formData.actualDays) || 0) - (parseFloat(formData.budgetDays) || 0)) >= 0 ? '+' : ''}
                      {((parseFloat(formData.actualDays) || 0) - (parseFloat(formData.budgetDays) || 0)).toFixed(1)}d
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="textSecondary">Variance (%)</Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600,
                      color: (parseFloat(formData.actualDays) || 0) - (parseFloat(formData.budgetDays) || 0) >= 0 ? '#4caf50' : '#f44336'
                    }}>
                      {(((parseFloat(formData.actualDays) || 0) - (parseFloat(formData.budgetDays) || 0)) / (parseFloat(formData.budgetDays) || 1) * 100) >= 0 ? '+' : ''}
                      {(((parseFloat(formData.actualDays) || 0) - (parseFloat(formData.budgetDays) || 0)) / (parseFloat(formData.budgetDays) || 1) * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
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
            {saving ? 'Saving...' : editingUtilization ? 'Update' : 'Create'}
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

export default Utilization;