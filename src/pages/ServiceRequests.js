import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Grid, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend 
} from 'recharts';
import {fetchServiceReq, updateSR} from '../utils/Dataverse'; 
import EditIcon from '@mui/icons-material/Edit';

const columnsBase = [
  { field: 'cr36d_servicerequestid', headerName: 'Request ID', width: 150 },
  { field: 'cr36d_servicerequesttype', headerName: 'Request Type', width: 200 },
  { field: 'cr36d_complainttype', headerName: 'Complaint Type', width: 200 },
  { field: 'cr36d_servicerequeststatus', headerName: 'Status', width: 150 },
  { 
    field: 'cr36d_createddate', 
    headerName: 'Date Submitted', 
    width: 110,
    valueFormatter: (params) => new Date(params.value).toLocaleDateString()
  },
  { field: 'cr36d_boroughcode', headerName: 'Borough', width: 110 }
];

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ServiceRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [boroughStats, setBoroughStats] = useState([]);
  const [requestTypeStats, setRequestTypeStats] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const processData = (data) => {
    // Calculate borough statistics
    const boroughCount = data.reduce((acc, request) => {
      const borough = request.cr36d_servicerequeststatus || 'Unknown';
      acc[borough] = (acc[borough] || 0) + 1; 
      return acc;
    }, {});

    const boroughData = Object.entries(boroughCount).map(([name, value]) => ({
      name,
      value
    }));

    // Calculate request type statistics
    const typeCount = data.reduce((acc, request) => {
      const type = request.cr36d_boroughcode || 'Unknown';
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
  };


  useEffect(() => {
    const fetchSR = async () => {
      try {
        console.log('Fetching SR data from Dataverse API...');
        const dataverseData = await fetchServiceReq();
        console.log('SR Data', dataverseData);
        if (dataverseData) {
          const processedData = dataverseData.map((item) => ({
            ...item,
            id: item.cr36d_objectid 
          }));
          
          setRequests(processedData);
          
          // Process data for charts AFTER we have the data
          processData(processedData);
        }
      } catch (error) {
        console.error('Error SR fetching Dataverse data:', error);
        setError('Failed to fetch SR Dataverse data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSR();
  }, []);

  // This effect will run whenever the requests state changes
  useEffect(() => {
    if (requests.length > 0) {
      processData(requests);
    }
  }, [requests]);

  

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredRequests = requests.filter(request => {
    const searchString = searchTerm.toLowerCase();
    return (
      request.cr36d_servicerequestid?.toLowerCase().includes(searchString) ||
      request.cr36d_boroughcode?.toLowerCase().includes(searchString) ||
      request.cr36d_complainttype?.toLowerCase().includes(searchString)
    );
  });

  const columns = [
    ...columnsBase,
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <>
          <Button size="small" onClick={() => handleEdit(params.row)}>
            <EditIcon color="primary" />
          </Button>
        </>
      )
    }
  ];

  const handleEdit = (row) => {
    setSelectedRequest(row);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    setUpdateLoading(true);
    try {
      if (!selectedRequest.cr36d_objectid) {
        throw new Error('Service Request ID not found');
      }

      console.log(`Updating SR data for ID: ${selectedRequest.cr36d_servicerequestsrecordid}`, selectedRequest);

      // Prepare data to update
      const dataToUpdate = {
        cr36d_locationdetails: selectedRequest.cr36d_locationdetails,
        cr36d_servicerequestresolution: selectedRequest.cr36d_servicerequestresolution,
        cr36d_servicerequesttype: selectedRequest.cr36d_servicerequesttype,
        cr36d_notestocustomer: selectedRequest.cr36d_notestocustomer,
        cr36d_crossstreet1: selectedRequest.cr36d_crossstreet1,
        cr36d_servicerequestsource: selectedRequest.cr36d_servicerequestsource,
        cr36d_boroughcode: selectedRequest.cr36d_boroughcode,
        cr36d_descriptor1: selectedRequest.cr36d_descriptor1,
        cr36d_streetname: selectedRequest.cr36d_streetname,
        cr36d_geometry: selectedRequest.cr36d_geometry,
        cr36d_complainttype: selectedRequest.cr36d_complainttype,
        cr36d_crossstreet2: selectedRequest.cr36d_crossstreet2,
        cr36d_complaintnumber: selectedRequest.cr36d_complaintnumber,
        cr36d_complaintdetails: selectedRequest.cr36d_complaintdetails,
        createdon: selectedRequest.createdon,
        cr36d_buildingnumber: selectedRequest.cr36d_buildingnumber,
      };

      await updateSR(selectedRequest.cr36d_servicerequestsrecordid, dataToUpdate);

      setRequests(requests.map(req => (req.cr36d_objectid === selectedRequest.cr36d_objectid ? { ...req, ...dataToUpdate } : req)));
      setEditModalOpen(false);

      setSnackbar({
        open: true,
        message: 'Service Request updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating SR data:', error);
      setSnackbar({
        open: true,
        message: `Error updating request: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Service Requests</Typography>

      {/* Analytics Dashboard */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Borough Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              By Status
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
              By Borough
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

      {/* Edit Dialog */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <DialogTitle>Edit Service Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <>
            <TextField
                fullWidth
                label="Service Request Id"
                value={selectedRequest.cr36d_servicerequestid || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_servicerequestid: e.target.value })}
                sx={{ mb: 2, mt:2 }}
                disabled="true"
              />
              <TextField
                fullWidth
                label="Service Request Status"
                value={selectedRequest.cr36d_servicerequeststatus || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_servicerequeststatus: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Service Request Type"
                value={selectedRequest.cr36d_servicerequesttype || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_servicerequesttype: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Service Request Source"
                value={selectedRequest.cr36d_servicerequestsource || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_servicerequestsource: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Complaint Details"
                value={selectedRequest.cr36d_complaintdetails || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_complaintdetails: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Borough Code"
                value={selectedRequest.cr36d_boroughcode || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_boroughcode: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Created On"
                value={new Date(selectedRequest.cr36d_createddate).toLocaleDateString() || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_createddate: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Street Name"
                value={selectedRequest.cr36d_streetname || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_streetname: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Geometry"
                value={selectedRequest.cr36d_geometry || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_geometry: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Complaint Type"
                value={selectedRequest.cr36d_complainttype || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_complainttype: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Location Details"
                value={selectedRequest.cr36d_locationdetails || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_locationdetails: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Service Request Resolution"
                value={selectedRequest.cr36d_servicerequestresolution || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_servicerequestresolution: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Notes to Customer"
                value={selectedRequest.cr36d_notestocustomer || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_notestocustomer: e.target.value })}
                sx={{ mb: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveEdit} 
            color="primary"
            disabled={updateLoading}
          >
            {updateLoading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ServiceRequests; 