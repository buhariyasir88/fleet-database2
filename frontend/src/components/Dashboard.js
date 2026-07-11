import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Avatar,
  Paper,
} from '@mui/material';
import {
  DirectionsBoat as VesselIcon,
  People as ClientIcon,
  Description as ContractIcon,
  Receipt as InvoiceIcon,
  TrendingUp as RevenueIcon,
  Pending as PendingIcon,
  Warning as OverdueIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const API_URL = 'http://https://fleet-database-backend.onrender.com/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalVessels: 0,
    totalClients: 0,
    activeContracts: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    overdueInvoices: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/dashboard`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Main stats cards (4 columns - even layout)
  const mainStats = [
    {
      title: 'Total Vessels',
      value: stats.totalVessels,
      icon: <VesselIcon sx={{ fontSize: 28 }} />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
      subtitle: 'Active fleet',
    },
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: <ClientIcon sx={{ fontSize: 28 }} />,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
      subtitle: 'Active partners',
    },
    {
      title: 'Active Contracts',
      value: stats.activeContracts,
      icon: <ContractIcon sx={{ fontSize: 28 }} />,
      color: '#e65100',
      bgColor: '#fff3e0',
      subtitle: 'In progress',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: <RevenueIcon sx={{ fontSize: 28 }} />,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
      subtitle: 'All time',
    },
  ];

  // Secondary stats cards (3 columns - even layout)
  const secondaryStats = [
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      icon: <InvoiceIcon sx={{ fontSize: 28 }} />,
      color: '#6a1b9a',
      bgColor: '#f3e5f5',
      subtitle: 'Generated',
    },
    {
      title: 'Pending Invoices',
      value: stats.pendingInvoices,
      icon: <PendingIcon sx={{ fontSize: 28 }} />,
      color: '#ed6c02',
      bgColor: '#fff3e0',
      subtitle: 'Awaiting payment',
    },
    {
      title: 'Overdue Invoices',
      value: stats.overdueInvoices,
      icon: <OverdueIcon sx={{ fontSize: 28 }} />,
      color: '#d32f2f',
      bgColor: '#ffebee',
      subtitle: 'Past due',
    },
  ];

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress sx={{ height: 4, borderRadius: 2 }} />
        <Typography align="center" sx={{ mt: 2, color: '#999' }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#0a1929',
            letterSpacing: '-0.02em',
          }}
        >
          Welcome Back 👋
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#64748b',
            mt: 0.5,
          }}
        >
          Here's an overview of your fleet operations
        </Typography>
      </Box>

      {/* Main Stats - 4 Cards in a Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {mainStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid #f0f2f5',
                p: 2.5,
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  borderColor: 'transparent',
                },
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: stat.bgColor,
                  color: stat.color,
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94a3b8',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontSize: '0.6rem',
                    display: 'block',
                  }}
                >
                  {stat.title}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: '#0a1929',
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                    fontSize: '1.6rem',
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94a3b8',
                    fontSize: '0.65rem',
                  }}
                >
                  {stat.subtitle}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Secondary Stats - 3 Cards in a Row */}
      <Grid container spacing={3}>
        {secondaryStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid #f0f2f5',
                p: 2.5,
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  borderColor: 'transparent',
                },
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: stat.bgColor,
                  color: stat.color,
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94a3b8',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontSize: '0.6rem',
                    display: 'block',
                  }}
                >
                  {stat.title}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: '#0a1929',
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                    fontSize: '1.6rem',
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94a3b8',
                    fontSize: '0.65rem',
                  }}
                >
                  {stat.subtitle}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Footer */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
          Last updated: {new Date().toLocaleString()}
        </Typography>
        <IconButton 
          size="small" 
          onClick={fetchDashboardData}
          sx={{ 
            color: '#94a3b8',
            '&:hover': { color: '#1976d2' }
          }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}

export default Dashboard;