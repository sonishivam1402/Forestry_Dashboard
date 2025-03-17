import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Grid, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend 
} from 'recharts';
import { fetchDataverseData } from '../utils/Dataverse'; 

const columns = [
  { field: 'cr36d_servicerequestid', headerName: 'Request ID', width: 150 },
  { 
    field: 'cr36d_parkname', 
    headerName: 'Park Location', 
    width: 210,
  },
  { field: 'cr36d_numberoffallentrees', headerName: 'Fallen Trees', width: 100 },
  { field: 'cr36d_havepowerlinesfallenintotheparkorontoside', headerName: 'Electric Damage', width: 120 },
  { field: 'cr36d_wasthisinspectionrequestedby', headerName: 'Inspection Requested By', width: 240 },
  { 
    field: 'createdon', 
    headerName: 'Date Submitted', 
    width: 180,
    valueFormatter: (params) => new Date(params.value).toLocaleDateString()
  },
];

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StormInspection = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [boroughStats, setBoroughStats] = useState([]);
  const [requestTypeStats, setRequestTypeStats] = useState([]);

  useEffect(() => {
    const fetchStormResponses = async () => {
      try {
        console.log('Fetching data from Dataverse API...');
        const dataverseData = await fetchDataverseData();
        
        if (dataverseData) {
          const processedData = dataverseData.map((item, index) => ({
            ...item,
            id: item.cr36d_servicerequestid || `dataverse-${index}` // Ensure unique ID
          }));
          setRequests(processedData);
        }
      } catch (error) {
        console.error('Error fetching Dataverse data:', error);
        setError('Failed to fetch Dataverse data.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchStormResponses();
    fetchServiceRequests();
  }, []);
  
  

  const fetchServiceRequests = async () => {
    try {

      // Calculate borough statistics
      const boroughCount = requests.reduce((acc, request) => {
        const borough = request.cr36d_priority || 'Unknown';
        acc[borough] = (acc[borough] || 0) + 1;
        return acc;
      }, {});

      const boroughData = Object.entries(boroughCount).map(([name, value]) => ({
        name,
        value
      }));

      // Calculate request type statistics
      const typeCount = requests.reduce((acc, request) => {
        const type = request.cr36d_status || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const typeData = Object.entries(typeCount)
        .map(([name, count]) => ({
          name,
          count
        }))
        .sort((a, b) => b.count - a.count) // Sort by count in descending order
        .slice(0, 10); // Take top 10 request types

      setBoroughStats(boroughData);
      setRequestTypeStats(typeData);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Error fetching data: ${err.message}`);
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredRequests = requests.filter(request => {
    const searchString = searchTerm.toLowerCase();
    return (
      request.cr36d_servicerequestid?.toLowerCase().includes(searchString) ||
      request.cr36d_parkname?.toLowerCase().includes(searchString) ||
      request.cr36d_wasthisinspectionrequestedby?.toLowerCase().includes(searchString) 
    );
  });

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Storm Inspection Requests</Typography>

      {/* Analytics Dashboard */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Borough Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              By Priority
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={boroughStats}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {boroughStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Request Types Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              By Status
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={requestTypeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Existing Search and Grid */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <TextField 
              fullWidth
              label="Search Requests"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by ID, type, or location..."
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="contained" color="primary">
              New Request
            </Button>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredRequests}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
            autoHeight
            checkboxSelection
            disableSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                whiteSpace: 'normal',
                lineHeight: 'normal',
                paddingY: 1,
              },
            }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default StormInspection; 