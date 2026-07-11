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
  People as ClientIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

const API_URL = 'https://fleet-database-backend.onrender.com/api';

function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/clients`);
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      showSnackbar('Cannot connect to backend. Please make sure server is running on port 5000', 'error');
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

  const handleOpenDialog = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name || '',
        contactPerson: client.contactPerson || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingClient(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      if (!formData.name.trim()) {
        showSnackbar('Company name is required', 'error');
        setSaving(false);
        return;
      }

      if (editingClient) {
        await axios.put(`${API_URL}/clients/${editingClient._id}`, formData);
        showSnackbar('Client updated successfully! 🎉');
      } else {
        await axios.post(`${API_URL}/clients`, formData);
        showSnackbar('Client created successfully! 🎉');
      }
      handleCloseDialog();
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      showSnackbar(error.response?.data?.error || 'Error saving client. Make sure backend is running.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await axios.delete(`${API_URL}/clients/${id}`);
        showSnackbar('Client deleted successfully');
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        showSnackbar('Error deleting client', 'error');
      }
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      {/* Page Header with Stats */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0a1929', mb: 0.5 }}>
          Clients
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage your client database
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Clients
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0a1929' }}>
                {clients.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Active Clients
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0a1929' }}>
                {clients.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Contacts
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0a1929' }}>
                {clients.filter(c => c.contactPerson).length}
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
          Add New Client
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>COMPANY NAME</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>CONTACT PERSON</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>EMAIL</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>PHONE</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ADDRESS</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <ClientIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                  <Typography color="textSecondary" variant="h6" sx={{ fontWeight: 500 }}>
                    No clients found
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    Click "Add New Client" to get started
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#2e7d32' }}>
                        <ClientIcon sx={{ fontSize: 16, color: 'white' }} />
                      </Avatar>
                      <Typography sx={{ fontWeight: 500 }}>{client.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{client.contactPerson || '-'}</TableCell>
                  <TableCell>{client.email || '-'}</TableCell>
                  <TableCell>{client.phone || '-'}</TableCell>
                  <TableCell>{client.address || '-'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(client)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(client._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Standardized Dialog - Same as Vessels */}
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
        {/* Header */}
        <DialogTitle sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 3,
          pb: 1,
        }}>
          <ClientIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingClient ? 'Edit Client' : 'Add Client'}
          </Typography>
        </DialogTitle>

        {/* Form with Box Style */}
        <DialogContent sx={{ p: 3, pt: 2 }}>
          <Grid container spacing={2.5}>
            {/* Company Name */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Company Name *
              </Typography>
              <TextField
                fullWidth
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., Jali Marine Sdn Bhd"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                required
              />
            </Grid>

            {/* Contact Person */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Contact Person
              </Typography>
              <TextField
                fullWidth
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., John Doe"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Email
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., john@jali.com"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* Phone */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Phone
              </Typography>
              <TextField
                fullWidth
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., +60 12 345 6789"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Address
              </Typography>
              <TextField
                fullWidth
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., Kuala Lumpur, Malaysia"
                size="small"
                multiline
                rows={2}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        {/* Actions */}
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
            {saving ? 'Saving...' : editingClient ? 'Update' : 'Create'}
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

export default Clients;