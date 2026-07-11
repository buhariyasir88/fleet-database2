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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as ContractIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

const API_URL = 'http://https://fleet-database-backend.onrender.com/api';

function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [formData, setFormData] = useState({
    contractTitle: '',
    client: '',
    vessel: '',
    commencementDate: '',
    duration: '',
    dcr: '',
    mob: '',
    demob: '',
    remarks: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contractsRes, clientsRes, vesselsRes] = await Promise.all([
        axios.get(`${API_URL}/contracts`),
        axios.get(`${API_URL}/clients`),
        axios.get(`${API_URL}/vessels`),
      ]);
      setContracts(contractsRes.data);
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

  const handleOpenDialog = (contract = null) => {
    if (contract) {
      setEditingContract(contract);
      setFormData({
        contractTitle: contract.contractTitle || '',
        client: contract.client?._id || contract.client || '',
        vessel: contract.vessel?._id || contract.vessel || '',
        commencementDate: contract.commencementDate?.split('T')[0] || '',
        duration: contract.duration || '',
        dcr: contract.dcr || '',
        mob: contract.mob || '',
        demob: contract.demob || '',
        remarks: contract.remarks || '',
      });
    } else {
      setEditingContract(null);
      setFormData({
        contractTitle: '',
        client: '',
        vessel: '',
        commencementDate: '',
        duration: '',
        dcr: '',
        mob: '',
        demob: '',
        remarks: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingContract(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateContractValue = (dcr, duration, mob = 0, demob = 0) => {
    const dcrNum = parseFloat(dcr) || 0;
    const durationNum = parseFloat(duration) || 0;
    const mobNum = parseFloat(mob) || 0;
    const demobNum = parseFloat(demob) || 0;
    return (dcrNum * durationNum) + mobNum + demobNum;
  };

  const calculateBalanceValue = (dcr, commencementDate, duration, mob = 0, demob = 0) => {
    if (!commencementDate || !duration) return 0;
    const start = new Date(commencementDate);
    const now = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + parseInt(duration));
    
    if (now > end) return 0;
    const remainingDays = Math.max(Math.ceil((end - now) / (1000 * 60 * 60 * 24)), 0);
    const dcrNum = parseFloat(dcr) || 0;
    const mobNum = parseFloat(mob) || 0;
    const demobNum = parseFloat(demob) || 0;
    return (dcrNum * remainingDays) + mobNum + demobNum;
  };

  const calculateProgress = (commencementDate, duration) => {
    if (!commencementDate || !duration) return 0;
    const start = new Date(commencementDate);
    const now = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + parseInt(duration));
    
    if (now > end) return 100;
    const total = parseInt(duration);
    const passed = Math.max(Math.floor((now - start) / (1000 * 60 * 60 * 24)), 0);
    return Math.min(Math.round((passed / total) * 100), 100);
  };

  const isCompleted = (commencementDate, duration) => {
    if (!commencementDate || !duration) return false;
    const start = new Date(commencementDate);
    const end = new Date(start);
    end.setDate(end.getDate() + parseInt(duration));
    return new Date() > end;
  };

  const getCompletionDate = (commencementDate, duration) => {
    if (!commencementDate || !duration) return null;
    const start = new Date(commencementDate);
    const end = new Date(start);
    end.setDate(end.getDate() + parseInt(duration));
    return end;
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
      
      if (!formData.client || !formData.vessel || !formData.commencementDate || !formData.duration || !formData.dcr) {
        showSnackbar('Please fill in all required fields', 'error');
        setSaving(false);
        return;
      }

      const contractData = {
        contractTitle: formData.contractTitle || '',
        client: formData.client,
        vessel: formData.vessel,
        commencementDate: formData.commencementDate,
        duration: parseFloat(formData.duration),
        dcr: parseFloat(formData.dcr),
        mob: parseFloat(formData.mob) || 0,
        demob: parseFloat(formData.demob) || 0,
        remarks: formData.remarks || '',
        contractValue: calculateContractValue(
          formData.dcr,
          formData.duration,
          formData.mob,
          formData.demob
        ),
        status: 'Active',
      };

      if (editingContract) {
        await axios.put(`${API_URL}/contracts/${editingContract._id}`, contractData);
        showSnackbar('Contract updated successfully! 🎉');
      } else {
        await axios.post(`${API_URL}/contracts`, contractData);
        showSnackbar('Contract created successfully! 🎉');
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving contract:', error);
      showSnackbar(error.response?.data?.error || 'Error saving contract. Make sure backend is running.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contract?')) {
      try {
        await axios.delete(`${API_URL}/contracts/${id}`);
        showSnackbar('Contract deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting contract:', error);
        showSnackbar('Error deleting contract', 'error');
      }
    }
  };

  // Calculate stats
  const totalValue = contracts.reduce((sum, c) => sum + (c.contractValue || 0), 0);
  
  let totalRemainingValue = 0;
  contracts.forEach(c => {
    if (!isCompleted(c.commencementDate, c.duration)) {
      totalRemainingValue += calculateBalanceValue(
        c.dcr,
        c.commencementDate,
        c.duration,
        c.mob,
        c.demob
      );
    }
  });
  
  const remainingPercent = totalValue > 0 ? ((totalRemainingValue / totalValue) * 100).toFixed(1) : 0;

  const activeContracts = contracts.filter(c => {
    const completed = isCompleted(c.commencementDate, c.duration);
    return !completed;
  });

  const completedContracts = contracts.filter(c => {
    const completed = isCompleted(c.commencementDate, c.duration);
    return completed;
  });

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0a1929', mb: 0.5 }}>
          Contracts
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage your vessel contracts and track progress
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Contracts
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0a1929' }}>
                {contracts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid #4caf50' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Active Contracts
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                {activeContracts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid #ff9800' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Contract Value
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0a1929' }}>
                RM {totalValue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid #2196f3' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Remaining Value
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196f3' }}>
                RM {totalRemainingValue.toLocaleString()} ({remainingPercent}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
          Add New Contract
        </Button>
      </Box>

      {/* Active Contracts Table */}
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#0a1929', mb: 2 }}>
        Active Contracts
        <Chip label={activeContracts.length} size="small" color="success" sx={{ ml: 1 }} />
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>CONTRACT TITLE</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>CLIENT</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>VESSEL</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>PERIOD</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>DURATION</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>DCR (RM)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>CONTRACT VALUE</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>BALANCE VALUE</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>PROGRESS</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <ContractIcon sx={{ fontSize: 36, color: '#ccc', mb: 1 }} />
                  <Typography color="textSecondary">No active contracts</Typography>
                </TableCell>
              </TableRow>
            ) : (
              activeContracts.map((contract) => {
                const progress = calculateProgress(contract.commencementDate, contract.duration);
                const clientName = getClientName(contract.client);
                const vesselName = getVesselName(contract.vessel);
                const endDate = getCompletionDate(contract.commencementDate, contract.duration);
                const balanceValue = calculateBalanceValue(
                  contract.dcr,
                  contract.commencementDate,
                  contract.duration,
                  contract.mob,
                  contract.demob
                );
                return (
                  <TableRow key={contract._id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{contract.contractTitle || '-'}</TableCell>
                    <TableCell>{clientName}</TableCell>
                    <TableCell>{vesselName}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(contract.commencementDate).toLocaleDateString()} to{' '}
                        <span style={{ opacity: 0.6 }}>
                          {endDate ? endDate.toLocaleDateString() : 'N/A'}
                        </span>
                      </Typography>
                    </TableCell>
                    <TableCell>{contract.duration} days</TableCell>
                    <TableCell>RM {parseFloat(contract.dcr).toLocaleString()}</TableCell>
                    <TableCell>RM {contract.contractValue?.toLocaleString() || 0}</TableCell>
                    <TableCell>RM {balanceValue.toLocaleString()}</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={progress} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              bgcolor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: progress >= 80 ? '#4caf50' : progress >= 50 ? '#ff9800' : '#f44336',
                                borderRadius: 4,
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 40 }}>
                          {progress}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog(contract)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(contract._id)} color="error">
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

      {/* Completed Contracts Table */}
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#0a1929', mb: 2 }}>
        Completed Contracts
        <Chip label={completedContracts.length} size="small" color="info" sx={{ ml: 1 }} />
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>CONTRACT TITLE</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>CLIENT</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>VESSEL</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>PERIOD</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>DURATION</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>DCR (RM)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>CONTRACT VALUE</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>STATUS</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {completedContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CheckCircleIcon sx={{ fontSize: 36, color: '#ccc', mb: 1 }} />
                  <Typography color="textSecondary">No completed contracts</Typography>
                </TableCell>
              </TableRow>
            ) : (
              completedContracts.map((contract) => {
                const clientName = getClientName(contract.client);
                const vesselName = getVesselName(contract.vessel);
                const endDate = getCompletionDate(contract.commencementDate, contract.duration);
                return (
                  <TableRow key={contract._id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{contract.contractTitle || '-'}</TableCell>
                    <TableCell>{clientName}</TableCell>
                    <TableCell>{vesselName}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(contract.commencementDate).toLocaleDateString()} to{' '}
                        <span style={{ opacity: 0.6 }}>
                          {endDate ? endDate.toLocaleDateString() : 'N/A'}
                        </span>
                      </Typography>
                    </TableCell>
                    <TableCell>{contract.duration} days</TableCell>
                    <TableCell>RM {parseFloat(contract.dcr).toLocaleString()}</TableCell>
                    <TableCell>RM {contract.contractValue?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <Chip label="Completed" color="info" size="small" icon={<CheckCircleIcon />} />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog(contract)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(contract._id)} color="error">
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
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 3,
          pb: 1,
        }}>
          <ContractIcon sx={{ color: '#1976d2', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingContract ? 'Edit Contract' : 'Add Contract'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 2 }}>
          <Grid container spacing={2.5}>
            {/* Contract Title */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Contract Title
              </Typography>
              <TextField
                fullWidth
                name="contractTitle"
                value={formData.contractTitle}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., PCSB Charter Agreement"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

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

            {/* Vessel */}
            <Grid item xs={12}>
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

            {/* Commencement Date */}
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

            {/* Duration */}
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

            {/* DCR */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                DCR (Daily Charter Rate) RM *
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

            {/* MOB Rate */}
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                MOB Rate (RM)
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

            {/* DEMOB Rate */}
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                DEMOB Rate (RM)
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
            {saving ? 'Saving...' : editingContract ? 'Update' : 'Create'}
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

export default Contracts;