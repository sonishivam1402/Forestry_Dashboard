import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Grid, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Alert, FormControlLabel, Checkbox } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend 
} from 'recharts';
import { fetchDataverseData, updateStormData } from '../utils/Dataverse'; 
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const columnsBase = [
  { field: 'cr36d_inspectionid', headerName: 'Request ID', width: 150 },
  { 
    field: 'cr36d_parklocation', 
    headerName: 'Park Location', 
    width: 210,
  },
  { field: 'cr36d_inspectionstatus', headerName: 'Status', width: 120 },
  { field: 'cr36d_typeofstormevent', headerName: 'Type of Storm', width: 180 },
  { 
    field: 'cr36d_havepowerlinesfallen', 
    headerName: 'Electric Damage', 
    width: 120,
    valueFormatter: (params) => params.value ? 'Yes' : 'No'
  },
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Process data and generate statistics
  const processData = (data) => {
    // Calculate borough statistics
    const boroughCount = data.reduce((acc, request) => {
      const borough = request.cr36d_typeofstormevent || 'Unknown';
      acc[borough] = (acc[borough] || 0) + 1; 
      return acc;
    }, {});

    const boroughData = Object.entries(boroughCount).map(([name, value]) => ({
      name,
      value
    }));

    // Calculate request type statistics
    const typeCount = data.reduce((acc, request) => {
      const type = request.cr36d_inspectionstatus || 'Unknown';
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
    const fetchStormResponses = async () => {
      try {
        console.log('Fetching data from Dataverse API...');
        const dataverseData = await fetchDataverseData();
        
        if (dataverseData) {
          const processedData = dataverseData.map((item) => ({
            ...item,
            id: item.cr36d_storminspection2id // Use existing cr36d_storminspection2id as the unique ID
          }));
          
          setRequests(processedData);
          
          // Process data for charts AFTER we have the data
          processData(processedData);
        }
      } catch (error) {
        console.error('Error fetching Dataverse data:', error);
        setError('Failed to fetch Dataverse data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStormResponses();
  }, []);
  
  // This effect will run whenever the requests state changes
  useEffect(() => {
    if (requests.length > 0) {
      processData(requests);
    }
  }, [requests]);

  const handleEdit = (row) => {
    setSelectedRequest(row);
    setEditModalOpen(true);
  };

  const handleDelete = (id) => {
    setRequests(requests.filter(request => request.id !== id));
  };

  const handleSaveEdit = async () => {
    setUpdateLoading(true);
    try {
      if (!selectedRequest.cr36d_storminspection2id) {
        throw new Error('Service Request ID not found');
      }
  
      console.log(`Updating record with service request ID: ${selectedRequest.cr36d_storminspection2id}`);
      console.log('Data being sent for update:', selectedRequest);
  
      // Create an object with only the fields that are in the edit modal
      const dataToUpdate = {
        cr36d_parklocation: selectedRequest.cr36d_parklocation,
        cr36d_numberoffallentrees: selectedRequest.cr36d_numberoffallentrees,
        cr36d_inspectionrequestedby: selectedRequest.cr36d_inspectionrequestedby,
        // Exclude fields that should not be edited
        cr36d_treeremovalrequired: selectedRequest.cr36d_treeremovalrequired,
        cr36d_supervisorsreview: selectedRequest.cr36d_supervisorsreview,
        cr36d_ispathblocked: selectedRequest.cr36d_ispathblocked,
        cr36d_coordinationwith: selectedRequest.cr36d_coordinationwith,
        cr36d_hassignofdisease: selectedRequest.cr36d_hassignofdisease,
        cr36d_areobstructingroads: selectedRequest.cr36d_areobstructingroads,
        cr36d_immediateremovallocation: selectedRequest.cr36d_immediateremovallocation,
        cr36d_largefallenbranches: selectedRequest.cr36d_largefallenbranches,
        cr36d_havepowerlinesfallen: selectedRequest.cr36d_havepowerlinesfallen,
        cr36d_isimmediateremovalrequired: selectedRequest.cr36d_isimmediateremovalrequired,
        cr36d_inspectorsignature: selectedRequest.cr36d_inspectorsignature,
        cr36d_typeofstormevent: selectedRequest.cr36d_typeofstormevent,
        cr36d_hasmajorcracks: selectedRequest.cr36d_hasmajorcracks,
        cr36d_isstructuredamage: selectedRequest.cr36d_isstructuredamage,
        cr36d_safetymeasures: selectedRequest.cr36d_safetymeasures,
        cr36d_electricdamagelocation: selectedRequest.cr36d_electricdamagelocation,
        cr36d_createdon: selectedRequest.cr36d_createdon,
        cr36d_iselectricdamage: selectedRequest.cr36d_iselectricdamage,
        cr36d_previousimage: selectedRequest.cr36d_previousimage,
        modifiedon: selectedRequest.modifiedon,
      };
  
      await updateStormData(selectedRequest.cr36d_storminspection2id, dataToUpdate);
  
      setRequests(requests.map(req => (req.id === selectedRequest.id ? { ...req, ...dataToUpdate } : req)));
      setEditModalOpen(false);
  
      setSnackbar({
        open: true,
        message: 'Request updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating storm data:', error);
      setSnackbar({
        open: true,
        message: `Error updating request: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  const filteredRequests = requests.filter(request => {
    const searchString = searchTerm.toLowerCase();
    return (
      request.cr36d_inspectionid?.toLowerCase().includes(searchString) ||
      request.cr36d_parklocation?.toLowerCase().includes(searchString) ||
      request.cr36d_inspectionrequestedby?.toLowerCase().includes(searchString) 
    );
  });

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

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
          <Button size="small" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon color="error" />
          </Button>
        </>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Storm Inspection Requests</Typography>

      {/* Analytics Dashboard */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Borough Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              By Type of Storm
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

      {/* Edit Dialog */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <DialogTitle>Edit Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <>
              <TextField
                fullWidth
                label="Park Location"
                value={selectedRequest.cr36d_parklocation || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_parklocation: e.target.value })}
                sx={{ mb: 2, mt: 2 }}
              />
              <TextField
                fullWidth
                label="Fallen Trees"
                type="number"
                value={selectedRequest.cr36d_numberoffallentrees || ''}
                onChange={(e) => setSelectedRequest({ 
                  ...selectedRequest, 
                  cr36d_numberoffallentrees: parseInt(e.target.value, 10) || 0 
                })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Requested By"
                value={selectedRequest.cr36d_inspectionrequestedby || ''}
                onChange={(e) => setSelectedRequest({ 
                  ...selectedRequest, 
                  cr36d_inspectionrequestedby: e.target.value 
                })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Additional Notes"
                value={selectedRequest.cr36d_additionalnotes || ''}
                InputProps={{
                  readOnly: true, // Make this field read-only
                }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Created By"
                value={selectedRequest.cr36d_createdby || ''}
                InputProps={{
                  readOnly: true, // Make this field read-only
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Inspector Names"
                value={selectedRequest.cr36d_inspectornames || ''}
                InputProps={{
                  readOnly: true, // Make this field read-only
                }}
                sx={{ mb: 2 }}
              />

              
              <TextField
                fullWidth
                label="Inspection Date"
                type="datetime-local"
                value={selectedRequest.cr36d_inspectiondate ? new Date(selectedRequest.cr36d_inspectiondate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setSelectedRequest({ 
                  ...selectedRequest, 
                  cr36d_inspectiondate: new Date(e.target.value).toISOString() 
                })}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedRequest.cr36d_treeremovalrequired || false}
                    onChange={(e) => setSelectedRequest({ 
                      ...selectedRequest, 
                      cr36d_treeremovalrequired: e.target.checked 
                    })}
                  />
                }
                label="Tree Removal Required"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Supervisors Review"
                value={selectedRequest.cr36d_supervisorsreview || ''}
                onChange={(e) => setSelectedRequest({ 
                  ...selectedRequest, 
                  cr36d_supervisorsreview: e.target.value 
                })}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedRequest.cr36d_ispathblocked || false}
                    onChange={(e) => setSelectedRequest({ 
                      ...selectedRequest, 
                      cr36d_ispathblocked: e.target.checked 
                    })}
                  />
                }
                label="Is Path Blocked"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Coordination With"
                value={selectedRequest.cr36d_coordinationwith || ''}
                onChange={(e) => setSelectedRequest({ 
                  ...selectedRequest, 
                  cr36d_coordinationwith: e.target.value 
                })}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedRequest.cr36d_hassignofdisease || false}
                    onChange={(e) => setSelectedRequest({ 
                      ...selectedRequest, 
                      cr36d_hassignofdisease: e.target.checked 
                    })}
                  />
                }
                label="Has Sign of Disease"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Storm Inspection ID"
                value={selectedRequest.cr36d_storminspection2id || ''}
                onChange={(e) => setSelectedRequest({ 
                  ...selectedRequest, 
                  cr36d_storminspection2id: e.target.value 
                })}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedRequest.cr36d_areobstructingroads || false}
                    onChange={(e) => setSelectedRequest({ 
                      ...selectedRequest, 
                      cr36d_areobstructingroads: e.target.checked 
                    })}
                  />
                }
                label="Are Obstructing Roads"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Immediate Removal Location"
                value={selectedRequest.cr36d_immediateremovallocation || ''}
                onChange={(e) => setSelectedRequest({ 
                  ...selectedRequest, 
                  cr36d_immediateremovallocation: e.target.value 
                })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Large Fallen Branches"
                type="number"
                value={selectedRequest.cr36d_largefallenbranches || ''}
                onChange={(e) => setSelectedRequest({ 
                  ...selectedRequest, 
                  cr36d_largefallenbranches: parseInt(e.target.value, 10) || 0 
                })}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedRequest.cr36d_havepowerlinesfallen || false}
                    onChange={(e) => setSelectedRequest({ 
                      ...selectedRequest, 
                      cr36d_havepowerlinesfallen: e.target.checked 
                    })}
                  />
                }
                label="Have Power Lines Fallen"
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedRequest.cr36d_isimmediateremovalrequired || false}
                    onChange={(e) => setSelectedRequest({ 
                      ...selectedRequest, 
                      cr36d_isimmediateremovalrequired: e.target.checked 
                    })}
                  />
                }
                label="Is Immediate Removal Required"
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Type of Storm Event"
                value={selectedRequest.cr36d_typeofstormevent || ''}
                onChange={(e) => setSelectedRequest({ 
                  ...selectedRequest, 
                  cr36d_typeofstormevent: e.target.value 
                })}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedRequest.cr36d_hasmajorcracks || false}
                    onChange={(e) => setSelectedRequest({ 
                      ...selectedRequest, 
                      cr36d_hasmajorcracks: e.target.checked 
                    })}
                  />
                }
                label="Has Major Cracks"
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedRequest.cr36d_isstructuredamage || false}
                    onChange={(e) => setSelectedRequest({ 
                      ...selectedRequest, 
                      cr36d_isstructuredamage: e.target.checked 
                    })}
                  />
                }
                label="Is Structure Damage"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Safety Measures"
                value={selectedRequest.cr36d_safetymeasures || ''}
                onChange={(e) => setSelectedRequest({ 
                  ...selectedRequest, 
                  cr36d_safetymeasures: e.target.value 
                })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Electric Damage Location"
                value={selectedRequest.cr36d_electricdamagelocation || ''}
                onChange={(e) => setSelectedRequest({ 
                  ...selectedRequest, 
                  cr36d_electricdamagelocation: e.target.value 
                })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Created On"
                value={selectedRequest.cr36d_createdon || ''}
                onChange={(e) => setSelectedRequest({ 
                  ...selectedRequest, 
                  cr36d_createdon: e.target.value 
                })}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedRequest.cr36d_iselectricdamage || false}
                    onChange={(e) => setSelectedRequest({ 
                      ...selectedRequest, 
                      cr36d_iselectricdamage: e.target.checked 
                    })}
                  />
                }
                label="Is Electric Damage"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Previous Image"
                value={selectedRequest.cr36d_previousimage || ''}
                onChange={(e) => setSelectedRequest({ 
                  ...selectedRequest, 
                  cr36d_previousimage: e.target.value 
                })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Modified On"
                value={selectedRequest.modifiedon || ''}
                onChange={(e) => setSelectedRequest({ 
                  ...selectedRequest, 
                  modifiedon: e.target.value 
                })}
                sx={{ mb: 2 }}
              />
              <Typography variant="body1" sx={{ mb: 1 }}>Signature:</Typography>
              <img src={selectedRequest.cr36d_signatureurl} alt="sign" style={{ width: '50%', height: 'auto', marginBottom: '16px' }} />
              <Typography variant="body1" sx={{ mb: 1 }}>Before Image:</Typography>
              <img src={selectedRequest.cr36d_previousimage} alt="After" style={{ width: '50%', height: 'auto', marginBottom: '16px' }} />
              <Typography variant="body1" sx={{ mb: 1 }}>After Image:</Typography>
              <img src={selectedRequest.cr36d_afterimage} alt="After" style={{ width: '50%', height: 'auto', marginBottom: '16px' }} />
              <Typography variant="body1" sx={{ mb: 1 }}>AI Response:</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>{selectedRequest.cr36d_airesponse || 'N/A'}</Typography>
              
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

export default StormInspection;