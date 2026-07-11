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
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  DirectionsBoat as VesselIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

const API_URL = 'https://fleet-database-backend.onrender.com/api';

function Vessels() {
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVessel, setEditingVessel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    imoNumber: '',
    indType: '',
    flag: '',
    year: '',
    grt: '',
    speed: '',
    totalSeat: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState('Vessel Spec');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVessels();
  }, []);

  const fetchVessels = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/vessels`);
      setVessels(response.data);
    } catch (error) {
      console.error('Error fetching vessels:', error);
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

  const handleOpenDialog = (vessel = null) => {
    if (vessel) {
      setEditingVessel(vessel);
      setFormData({
        name: vessel.name || '',
        imoNumber: vessel.imoNumber || '',
        indType: vessel.indType || '',
        flag: vessel.flag || '',
        year: vessel.year || '',
        grt: vessel.grt || '',
        speed: vessel.speed || '',
        totalSeat: vessel.totalSeat || '',
      });
    } else {
      setEditingVessel(null);
      setFormData({
        name: '',
        imoNumber: '',
        indType: '',
        flag: '',
        year: '',
        grt: '',
        speed: '',
        totalSeat: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVessel(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      if (!formData.name.trim()) {
        showSnackbar('Vessel name is required', 'error');
        setSaving(false);
        return;
      }

      if (editingVessel) {
        await axios.put(`${API_URL}/vessels/${editingVessel._id}`, formData);
        showSnackbar('Vessel updated successfully! 🎉');
      } else {
        await axios.post(`${API_URL}/vessels`, formData);
        showSnackbar('Vessel created successfully! 🎉');
      }
      handleCloseDialog();
      fetchVessels();
    } catch (error) {
      console.error('Error saving vessel:', error);
      showSnackbar(error.response?.data?.error || 'Error saving vessel. Make sure backend is running.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vessel?')) {
      try {
        await axios.delete(`${API_URL}/vessels/${id}`);
        showSnackbar('Vessel deleted successfully');
        fetchVessels();
      } catch (error) {
        console.error('Error deleting vessel:', error);
        showSnackbar('Error deleting vessel', 'error');
      }
    }
  };

  const handleUploadDialog = (vessel) => {
    setSelectedVessel(vessel);
    setSelectedFile(null);
    setDocType('Vessel Spec');
    setUploadDialog(true);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showSnackbar('Please select a file', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('name', docType);

    try {
      await axios.post(`${API_URL}/vessels/${selectedVessel._id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showSnackbar('Document uploaded successfully');
      setUploadDialog(false);
      fetchVessels();
    } catch (error) {
      console.error('Error uploading document:', error);
      showSnackbar('Error uploading document', 'error');
    }
  };

  const handleDownload = (doc) => {
    window.open(`http://localhost:5005/${doc.filePath}`, '_blank');
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0a1929', mb: 0.5 }}>
          Fleet Directory
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage your vessel fleet and documentation
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Vessels
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0a1929' }}>
                {vessels.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Documents
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0a1929' }}>
                {vessels.reduce((sum, v) => sum + (v.documents?.length || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Fleet Types
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0a1929' }}>
                {new Set(vessels.map(v => v.indType)).size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Active Vessels
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0a1929' }}>
                {vessels.length}
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
          Add New Vessel
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>NAME</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>IMO NUMBER</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>TYPE</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>FLAG</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>YEAR</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>GRT</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>SPEED</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>TOTAL SEAT</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>DOCUMENTS</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vessels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                  <VesselIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                  <Typography color="textSecondary" variant="h6" sx={{ fontWeight: 500 }}>
                    No vessels found
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    Click "Add New Vessel" to get started
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              vessels.map((vessel) => (
                <TableRow key={vessel._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                        <VesselIcon sx={{ fontSize: 16, color: 'white' }} />
                      </Avatar>
                      <Typography sx={{ fontWeight: 500 }}>{vessel.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{vessel.imoNumber || '-'}</TableCell>
                  <TableCell>
                    <Chip label={vessel.indType || 'N/A'} size="small" sx={{ bgcolor: '#e8ecf1', fontWeight: 500 }} />
                  </TableCell>
                  <TableCell>{vessel.flag || '-'}</TableCell>
                  <TableCell>{vessel.year || '-'}</TableCell>
                  <TableCell>{vessel.grt || '-'}</TableCell>
                  <TableCell>{vessel.speed || '-'}</TableCell>
                  <TableCell>{vessel.totalSeat || '-'}</TableCell>
                  <TableCell>
                    {vessel.documents?.map((doc, index) => (
                      <Chip
                        key={index}
                        label={doc.name}
                        size="small"
                        color="primary"
                        variant="outlined"
                        onClick={() => handleDownload(doc)}
                        sx={{ m: 0.3, cursor: 'pointer' }}
                      />
                    ))}
                    <Button size="small" startIcon={<UploadIcon />} onClick={() => handleUploadDialog(vessel)}>
                      Upload
                    </Button>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(vessel)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(vessel._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
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
          <VesselIcon sx={{ color: '#1976d2', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingVessel ? 'Edit Vessel' : 'Add Vessel'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 2 }}>
          <Grid container spacing={2.5}>
            {/* Vessel Name */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Vessel Name *
              </Typography>
              <TextField
                fullWidth
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., MV Jali Sia"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* IMO Number */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                IMO Number
              </Typography>
              <TextField
                fullWidth
                name="imoNumber"
                value={formData.imoNumber}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., IMO 1234567"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* Type */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Type
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="indType"
                  value={formData.indType}
                  onChange={handleInputChange}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Select Type</MenuItem>
                  <MenuItem value="FOB">FOB</MenuItem>
                  <MenuItem value="FCB">FCB</MenuItem>
                  <MenuItem value="PSV">PSV</MenuItem>
                  <MenuItem value="AHTS">AHTS</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Flag and Year */}
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Flag
              </Typography>
              <TextField
                fullWidth
                name="flag"
                value={formData.flag}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., Malaysia"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Year Built
              </Typography>
              <TextField
                fullWidth
                name="year"
                type="number"
                value={formData.year}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 2020"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* GRT */}
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                GRT
              </Typography>
              <TextField
                fullWidth
                name="grt"
                type="number"
                value={formData.grt}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 300"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* Speed */}
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Speed (knots)
              </Typography>
              <TextField
                fullWidth
                name="speed"
                value={formData.speed}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 12.5"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* Total Seats */}
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', display: 'block', mb: 0.5 }}>
                Total Seat / Pax
              </Typography>
              <TextField
                fullWidth
                name="totalSeat"
                type="number"
                value={formData.totalSeat}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 60"
                size="small"
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
            {saving ? 'Saving...' : editingVessel ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              label="Document Type"
            >
              <MenuItem value="Vessel Spec">Vessel Spec</MenuItem>
              <MenuItem value="GA Plan">GA Plan</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <input type="file" onChange={handleFileChange} style={{ width: '100%' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained">Upload</Button>
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

export default Vessels;