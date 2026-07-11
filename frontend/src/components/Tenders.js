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
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  RequestQuote as TenderIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

const API_URL = 'https://fleet-database-backend.onrender.com/api';

function Tenders() {
  const [tenders, setTenders] = useState([]);
  const [clients, setClients] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTender, setEditingTender] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [showGantt, setShowGantt] = useState(true);
  const [showTable, setShowTable] = useState(true);
  const [formData, setFormData] = useState({
    client: '',
    projectDetails: '',
    proposedVessels: [{ vessel: '', proposedRate: '' }],
    commencementDate: '',
    duration: '',
    location: '',
    status: 'Pending Submission',
    chances: '',
    remarks: '',
    submittedDate: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  const statusOptions = [
    'Pending Submission',
    'Submitted',
    'Under Review',
    'Awarded',
    'Decline',
    'Unsuccessful',
    'Aborted'
  ];

  const statusColors = {
    'Awarded': 'success',
    'Under Review': 'warning',
    'Submitted': 'info',
    'Pending Submission': 'secondary',
    'Decline': 'error',
    'Unsuccessful': 'error',
    'Aborted': 'error'
  };

  const statusIconMap = {
    'Awarded': <CheckCircleIcon sx={{ fontSize: 14 }} />,
    'Pending Submission': <PendingIcon sx={{ fontSize: 14 }} />,
    'Decline': <CancelIcon sx={{ fontSize: 14 }} />,
    'Unsuccessful': <CancelIcon sx={{ fontSize: 14 }} />,
    'Aborted': <CancelIcon sx={{ fontSize: 14 }} />,
  };

  const chancesOptions = ['High', 'Medium', 'Low', 'Very Low'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tendersRes, clientsRes, vesselsRes] = await Promise.all([
        axios.get(`${API_URL}/tenders`),
        axios.get(`${API_URL}/clients`),
        axios.get(`${API_URL}/vessels`),
      ]);
      console.log('Tenders data:', tendersRes.data);
      console.log('Vessels data:', vesselsRes.data);
      setTenders(tendersRes.data);
      setClients(clientsRes.data);
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

  const handleOpenDialog = (tender = null) => {
    if (tender) {
      setEditingTender(tender);
      setFormData({
        client: tender.client?._id || tender.client || '',
        projectDetails: tender.projectDetails || '',
        proposedVessels: tender.proposedVessels || [{ vessel: '', proposedRate: '' }],
        commencementDate: tender.commencementDate?.split('T')[0] || '',
        duration: tender.duration || '',
        location: tender.location || '',
        status: tender.status || 'Pending Submission',
        chances: tender.chances || '',
        remarks: tender.remarks || '',
        submittedDate: tender.submittedDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
    } else {
      setEditingTender(null);
      setFormData({
        client: '',
        projectDetails: '',
        proposedVessels: [{ vessel: '', proposedRate: '' }],
        commencementDate: '',
        duration: '',
        location: '',
        status: 'Pending Submission',
        chances: '',
        remarks: '',
        submittedDate: new Date().toISOString().split('T')[0],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTender(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVesselChange = (index, field, value) => {
    const updatedVessels = [...formData.proposedVessels];
    updatedVessels[index][field] = value;
    setFormData({ ...formData, proposedVessels: updatedVessels });
  };

  const addVesselRow = () => {
    setFormData({
      ...formData,
      proposedVessels: [...formData.proposedVessels, { vessel: '', proposedRate: '' }]
    });
  };

  const removeVesselRow = (index) => {
    if (formData.proposedVessels.length > 1) {
      const updatedVessels = formData.proposedVessels.filter((_, i) => i !== index);
      setFormData({ ...formData, proposedVessels: updatedVessels });
    }
  };

  const toggleRow = (id) => {
    setExpandedRows({ ...expandedRows, [id]: !expandedRows[id] });
  };

  const toggleGantt = () => {
    setShowGantt(!showGantt);
  };

  const toggleTable = () => {
    setShowTable(!showTable);
  };

  const calculateCompletionDate = (startDate, duration) => {
    if (!startDate || !duration) return null;
    const date = new Date(startDate);
    date.setDate(date.getDate() + parseInt(duration));
    return date.toISOString().split('T')[0];
  };

  const getStatusColor = (status) => {
    return statusColors[status] || 'default';
  };

  const getClientName = (client) => {
    if (!client) return 'N/A';
    if (client.name) return client.name;
    if (typeof client === 'string') {
      const found = clients.find(c => c._id === client);
      return found?.name || 'N/A';
    }
    return 'N/A';
  };

  const getVesselName = (vessel) => {
    if (!vessel) return 'N/A';
    if (vessel.name) return vessel.name;
    if (typeof vessel === 'string') {
      const found = vessels.find(v => v._id === vessel);
      return found?.name || 'N/A';
    }
    return 'N/A';
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      if (!formData.client || !formData.commencementDate || !formData.duration) {
        showSnackbar('Please fill in all required fields', 'error');
        setSaving(false);
        return;
      }

      const validVessels = formData.proposedVessels.filter(v => v.vessel && v.proposedRate);
      if (validVessels.length === 0) {
        showSnackbar('Please add at least one vessel with rate', 'error');
        setSaving(false);
        return;
      }

      const completionDate = calculateCompletionDate(formData.commencementDate, formData.duration);

      const tenderData = {
        client: formData.client,
        projectDetails: formData.projectDetails || '',
        proposedVessels: validVessels,
        commencementDate: formData.commencementDate,
        duration: parseFloat(formData.duration),
        completionDate: completionDate,
        location: formData.location || '',
        status: formData.status,
        chances: formData.chances || '',
        remarks: formData.remarks || '',
        submittedDate: formData.submittedDate || new Date().toISOString().split('T')[0],
      };

      if (editingTender) {
        await axios.put(`${API_URL}/tenders/${editingTender._id}`, tenderData);
        showSnackbar('Tender updated successfully! 🎉');
      } else {
        await axios.post(`${API_URL}/tenders`, tenderData);
        showSnackbar('Tender created successfully! 🎉');
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving tender:', error);
      showSnackbar(error.response?.data?.error || 'Error saving tender. Make sure backend is running.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tender?')) {
      try {
        await axios.delete(`${API_URL}/tenders/${id}`);
        showSnackbar('Tender deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting tender:', error);
        showSnackbar('Error deleting tender', 'error');
      }
    }
  };

  // Calculate stats
  const totalTenders = tenders.length;
  const awardedCount = tenders.filter(t => t.status === 'Awarded').length;
  const underReviewCount = tenders.filter(t => t.status === 'Under Review').length;
  const submittedCount = tenders.filter(t => t.status === 'Submitted').length;
  const pendingCount = tenders.filter(t => t.status === 'Pending Submission').length;
  const declinedCount = tenders.filter(t => t.status === 'Decline').length;
  const unsuccessfulCount = tenders.filter(t => t.status === 'Unsuccessful').length;
  const abortedCount = tenders.filter(t => t.status === 'Aborted').length;

  // Group tenders by year
  const getYear = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).getFullYear();
  };

  const groupedTenders = tenders.reduce((acc, tender) => {
    const year = getYear(tender.submittedDate || tender.commencementDate);
    if (!acc[year]) acc[year] = [];
    acc[year].push(tender);
    return acc;
  }, {});

  const sortedYears = Object.keys(groupedTenders).sort((a, b) => b - a);

  // Gantt Chart Data
  const ganttData = tenders
    .filter(t => t.commencementDate && t.duration)
    .map(t => {
      const start = new Date(t.commencementDate);
      const end = new Date(start);
      end.setDate(end.getDate() + parseInt(t.duration));
      return {
        ...t,
        start: start,
        end: end,
        clientName: getClientName(t.client),
        vesselNames: t.proposedVessels?.map(v => getVesselName(v.vessel)).join(', ') || 'N/A',
        rates: t.proposedVessels?.map(v => v.proposedRate).join(', ') || 'N/A',
      };
    })
    .sort((a, b) => a.start - b.start);

  const minDate = ganttData.length > 0 ? ganttData[0].start : new Date();
  const maxDate = ganttData.length > 0 ? ganttData[ganttData.length - 1].end : new Date();
  const totalDays = Math.max((maxDate - minDate) / (1000 * 60 * 60 * 24), 1);

  // Get today's position for the line
  const today = new Date();
  const todayOffset = Math.max((today - minDate) / (1000 * 60 * 60 * 24), 0);
  const todayPosition = Math.min((todayOffset / totalDays) * 100, 100);

  // Generate month labels for Gantt chart
  const generateGanttLabels = () => {
    if (ganttData.length === 0) return [];
    const labels = [];
    const current = new Date(minDate);
    current.setDate(1);
    while (current <= maxDate) {
      const month = current.toLocaleString('default', { month: 'short' });
      const year = current.getFullYear();
      labels.push({ month, year, date: new Date(current) });
      current.setMonth(current.getMonth() + 1);
    }
    return labels;
  };

  const ganttMonthLabels = generateGanttLabels();

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0a1929', mb: 0.5 }}>
          Tenders Submitted
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage your tender submissions and track progress
        </Typography>
      </Box>

      {/* Stats Cards - Added Missing Status */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0a1929' }}>
                {totalTenders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid #4caf50' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Awarded
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#4caf50' }}>
                {awardedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid #ff9800' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Under Review
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#ff9800' }}>
                {underReviewCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid #2196f3' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Submitted
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#2196f3' }}>
                {submittedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid #9c27b0' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pending
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#9c27b0' }}>
                {pendingCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid #f44336' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Unsuccessful
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#f44336' }}>
                {unsuccessfulCount + declinedCount + abortedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
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
          Add Tender
        </Button>
      </Box>

      {/* Collapsible Gantt Chart - Fits Page Width */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', mb: 3, overflow: 'hidden' }}>
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': { bgcolor: '#f5f5f5' },
          }}
          onClick={toggleGantt}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#0a1929' }}>
            Tender Timeline (Gantt Chart)
          </Typography>
          <IconButton>
            {showGantt ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Collapse in={showGantt}>
          <Box sx={{ p: 3, pt: 0 }}>
            {ganttData.length === 0 ? (
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                No tenders with dates to display
              </Typography>
            ) : (
              <Box sx={{ width: '100%', overflow: 'hidden' }}>
                <Box sx={{ width: '100%', position: 'relative' }}>
                  {/* Today line */}
                  {today >= minDate && today <= maxDate && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: `${todayPosition}%`,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        bgcolor: '#f44336',
                        zIndex: 5,
                        '&::after': {
                          content: '"Today"',
                          position: 'absolute',
                          top: -18,
                          left: -12,
                          fontSize: '0.6rem',
                          color: '#f44336',
                          fontWeight: 'bold',
                        }
                      }}
                    />
                  )}
                  
                  {/* Month/Year Headers */}
                  <Box sx={{ display: 'flex', borderBottom: '2px solid #e0e0e0', mb: 1 }}>
                    <Box sx={{ width: 150, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, display: 'flex', position: 'relative', height: 20 }}>
                      {ganttMonthLabels.map((label, index) => {
                        const monthStart = Math.max((label.date - minDate) / (1000 * 60 * 60 * 24), 0);
                        const monthEnd = Math.min((new Date(label.date.getFullYear(), label.date.getMonth() + 1, 1) - minDate) / (1000 * 60 * 60 * 24), totalDays);
                        const width = ((monthEnd - monthStart) / totalDays) * 100;
                        const left = (monthStart / totalDays) * 100;
                        
                        return (
                          <Box
                            key={index}
                            sx={{
                              position: 'absolute',
                              left: `${left}%`,
                              width: `${width}%`,
                              top: 0,
                              textAlign: 'center',
                              fontSize: '0.6rem',
                              fontWeight: 600,
                              color: '#666',
                              borderRight: index < ganttMonthLabels.length - 1 ? '1px solid #eee' : 'none',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {label.month} {label.year}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                  
                  {/* Gantt bars with fixed tooltip */}
                  {ganttData.map((item, index) => {
                    const startOffset = Math.max((item.start - minDate) / (1000 * 60 * 60 * 24), 0);
                    const barWidth = Math.max((item.duration / totalDays) * 100, 3);
                    const leftPos = (startOffset / totalDays) * 100;
                    const color = statusColors[item.status] === 'success' ? '#4caf50' :
                                  statusColors[item.status] === 'warning' ? '#ff9800' :
                                  statusColors[item.status] === 'info' ? '#2196f3' :
                                  statusColors[item.status] === 'secondary' ? '#9c27b0' : '#f44336';
                    
                    return (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ width: 150, flexShrink: 0, pr: 2 }}>
                          <Typography variant="body2" noWrap sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                            {item.clientName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" noWrap sx={{ fontSize: '0.65rem' }}>
                            {item.vesselNames}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1, height: 28, bgcolor: '#f5f5f5', borderRadius: 1, position: 'relative' }}>
                          <Tooltip
                            title={
                              <Box sx={{ p: 1.5, minWidth: 200 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}>
                                  {item.clientName || 'N/A'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block' }}>
                                  <strong>Vessel:</strong> {item.vesselNames || 'N/A'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block' }}>
                                  <strong>Rate:</strong> RM {item.rates || '0'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block' }}>
                                  <strong>Period:</strong> {item.start?.toLocaleDateString() || 'N/A'} - {item.end?.toLocaleDateString() || 'N/A'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block' }}>
                                  <strong>Duration:</strong> {item.duration || 0} days
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block' }}>
                                  <strong>Status:</strong> {item.status || 'N/A'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block' }}>
                                  <strong>Chances:</strong> {item.chances || 'N/A'}
                                </Typography>
                              </Box>
                            }
                            arrow
                            placement="top"
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                left: `${leftPos}%`,
                                width: `${barWidth}%`,
                                height: '100%',
                                bgcolor: color,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.55rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                minWidth: barWidth > 5 ? 'auto' : '4px',
                                '&:hover': {
                                  opacity: 0.8,
                                  transform: 'scaleY(1.1)',
                                }
                              }}
                            >
                              {barWidth > 12 ? `${item.duration}d` : ''}
                            </Box>
                          </Tooltip>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* Collapsible Table */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': { bgcolor: '#f5f5f5' },
          }}
          onClick={toggleTable}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#0a1929' }}>
            Tenders List
          </Typography>
          <IconButton>
            {showTable ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Collapse in={showTable}>
          <Box sx={{ p: 2, pt: 0 }}>
            {sortedYears.length === 0 ? (
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                No tenders found. Click "Add Tender" to get started.
              </Typography>
            ) : (
              sortedYears.map((year) => (
                <Box key={year} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0a1929', mb: 1 }}>
                    {year} ({groupedTenders[year].length} tenders)
                  </Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #e8ecf1' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8f9fc' }}>
                          <TableCell sx={{ fontWeight: 600 }}>CLIENT/JOB</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>PROJECT DETAILS</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>PROPOSED VESSEL</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>PROPOSED RATE</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>PERIOD</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>DURATION</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>STATUS</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>CHANCES</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>REMARKS</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>SUBMITTED DATE</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>ACTIONS</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupedTenders[year].map((tender) => {
                          const clientName = getClientName(tender.client);
                          const vesselNames = tender.proposedVessels?.map(v => getVesselName(v.vessel)).join(', ') || 'N/A';
                          const rates = tender.proposedVessels?.map(v => `RM ${v.proposedRate}`).join(', ') || 'N/A';
                          const completionDate = calculateCompletionDate(tender.commencementDate, tender.duration);
                          
                          return (
                            <React.Fragment key={tender._id}>
                              <TableRow hover>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ width: 24, height: 24, bgcolor: '#1976d2' }}>
                                      <TenderIcon sx={{ fontSize: 12, color: 'white' }} />
                                    </Avatar>
                                    {clientName}
                                  </Box>
                                </TableCell>
                                <TableCell>{tender.projectDetails || '-'}</TableCell>
                                <TableCell>
                                  {tender.proposedVessels?.map((v, i) => (
                                    <Chip key={i} label={getVesselName(v.vessel)} size="small" sx={{ m: 0.2 }} />
                                  ))}
                                </TableCell>
                                <TableCell>
                                  {tender.proposedVessels?.map((v, i) => (
                                    <Chip key={i} label={`RM ${v.proposedRate}`} size="small" variant="outlined" sx={{ m: 0.2 }} />
                                  ))}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {tender.commencementDate ? new Date(tender.commencementDate).toLocaleDateString() : 'N/A'} to{' '}
                                    <span style={{ opacity: 0.6 }}>
                                      {completionDate ? new Date(completionDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                  </Typography>
                                </TableCell>
                                <TableCell>{tender.duration || '-'} days</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={tender.status} 
                                    color={getStatusColor(tender.status)} 
                                    size="small"
                                    icon={statusIconMap[tender.status] || null}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={tender.chances || 'N/A'} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{
                                      borderColor: tender.chances === 'High' ? '#4caf50' :
                                                 tender.chances === 'Medium' ? '#ff9800' :
                                                 tender.chances === 'Low' ? '#f44336' : '#9e9e9e',
                                      color: tender.chances === 'High' ? '#4caf50' :
                                             tender.chances === 'Medium' ? '#ff9800' :
                                             tender.chances === 'Low' ? '#f44336' : '#9e9e9e',
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{tender.remarks || '-'}</TableCell>
                                <TableCell>{tender.submittedDate ? new Date(tender.submittedDate).toLocaleDateString() : 'N/A'}</TableCell>
                                <TableCell>
                                  <IconButton size="small" onClick={() => handleOpenDialog(tender)} color="primary">
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => handleDelete(tender._id)} color="error">
                                    <DeleteIcon />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => toggleRow(tender._id)}>
                                    {expandedRows[tender._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell colSpan={11} style={{ paddingBottom: 0, paddingTop: 0 }}>
                                  <Collapse in={expandedRows[tender._id]} timeout="auto" unmountOnExit>
                                    <Box sx={{ p: 2, bgcolor: '#f8f9fc', borderRadius: 2, m: 1 }}>
                                      <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                          <Typography variant="subtitle2" color="textSecondary">Project Details:</Typography>
                                          <Typography variant="body2">{tender.projectDetails || 'N/A'}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                          <Typography variant="subtitle2" color="textSecondary">Location:</Typography>
                                          <Typography variant="body2">{tender.location || 'N/A'}</Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                          <Typography variant="subtitle2" color="textSecondary">Proposed Vessels & Rates:</Typography>
                                          {tender.proposedVessels?.map((v, i) => (
                                            <Typography key={i} variant="body2">
                                              {getVesselName(v.vessel)}: RM {v.proposedRate}
                                            </Typography>
                                          ))}
                                        </Grid>
                                        <Grid item xs={6}>
                                          <Typography variant="subtitle2" color="textSecondary">Commencement Date:</Typography>
                                          <Typography variant="body2">{tender.commencementDate ? new Date(tender.commencementDate).toLocaleDateString() : 'N/A'}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                          <Typography variant="subtitle2" color="textSecondary">Completion Date:</Typography>
                                          <Typography variant="body2">{completionDate ? new Date(completionDate).toLocaleDateString() : 'N/A'}</Typography>
                                        </Grid>
                                      </Grid>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* Standardized Dialog */}
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
          <TenderIcon sx={{ color: '#1976d2', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#0a1929' }}>
            {editingTender ? 'Edit Tender' : 'Add Tender'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 2 }}>
          <Grid container spacing={2.5}>
            {/* Client */}
            <Grid item xs={12}>
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

            {/* Project Details */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Project Details (Vessel Speed & Seat Capacity)
              </Typography>
              <TextField
                fullWidth
                name="projectDetails"
                value={formData.projectDetails}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., FCB 25KNT/80PAX"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* Location */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Location
              </Typography>
              <TextField
                fullWidth
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., Offshore Malaysia"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* Proposed Vessels */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 1 }}>
                Proposed Vessels *
              </Typography>
              {formData.proposedVessels.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 1 }}>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Vessel</InputLabel>
                      <Select
                        value={item.vessel}
                        onChange={(e) => handleVesselChange(index, 'vessel', e.target.value)}
                        label="Vessel"
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">Select Vessel</MenuItem>
                        {vessels.map((vessel) => (
                          <MenuItem key={vessel._id} value={vessel._id}>{vessel.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Rate (RM)"
                      type="number"
                      value={item.proposedRate}
                      onChange={(e) => handleVesselChange(index, 'proposedRate', e.target.value)}
                      variant="outlined"
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => removeVesselRow(index)}
                      disabled={formData.proposedVessels.length === 1}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      Remove
                    </Button>
                  </Grid>
                </Grid>
              ))}
              <Button 
                variant="outlined" 
                onClick={addVesselRow} 
                sx={{ mt: 1, borderRadius: 2, textTransform: 'none' }}
                startIcon={<AddIcon />}
              >
                Add Vessel
              </Button>
            </Grid>

            {/* Commencement Date and Duration */}
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Commencement Date *
              </Typography>
              <TextField
                fullWidth
                name="commencementDate"
                type="date"
                value={formData.commencementDate}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputLabelProps={{ shrink: true }}
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
                placeholder="e.g., 30"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* Submitted Date */}
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Submitted Date
              </Typography>
              <TextField
                fullWidth
                name="submittedDate"
                type="date"
                value={formData.submittedDate}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Completion Date - Auto-calculated */}
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Completion Date (Auto-calculated)
              </Typography>
              <TextField
                fullWidth
                value={calculateCompletionDate(formData.commencementDate, formData.duration) || ''}
                variant="outlined"
                size="small"
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f5f5f5' } }}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Status
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  sx={{ borderRadius: 2 }}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Chances */}
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Chances
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="chances"
                  value={formData.chances}
                  onChange={handleInputChange}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Select Chances</MenuItem>
                  {chancesOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Remarks */}
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
            {saving ? 'Saving...' : editingTender ? 'Update' : 'Create'}
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

export default Tenders;