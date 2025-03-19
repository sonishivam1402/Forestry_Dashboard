import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Grid,Button, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchWO, updateWO } from '../utils/Dataverse'; 
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const columnsBase = [
  { field: 'cr36d_workorderid', headerName: 'Work Order ID', width: 180 },
  { field: 'cr36d_workordertype', headerName: 'Work Type', width: 180 },
  { field: 'cr36d_workorderstatus', headerName: 'Status', width: 130 },
  { field: 'cr36d_boroughcode', headerName: 'Borough', width: 130 },
  { 
    field: 'cr36d_createddate', 
    headerName: 'Created Date', 
    width: 180,
    valueFormatter: (params) => new Date(params.value).toLocaleDateString()
  },
  { field: 'cr36d_climbername', headerName: 'Climber Name', width: 180 },
];

const WorkOrders = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [categoryStats, setCategoryStats] = useState([]);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const data = await fetchWO();
      const processedData = data.map(order => ({
        ...order,
        id: order.cr36d_objectid // Use existing cr36d_objectid as the unique ID
      }));
      setWorkOrders(processedData);

      // Calculate category statistics
      const categoryCount = data.reduce((acc, order) => {
        acc[order.cr36d_workordertype] = (acc[order.cr36d_workordertype] || 0) + 1;
        return acc;
      }, {});

      const categoryData = Object.entries(categoryCount).map(([name, count]) => ({
        name,
        count
      }));

      setCategoryStats(categoryData);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Error fetching data: ${err.message}`);
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    setSelectedRequest(row);
    setEditModalOpen(true);
  };

  const handleDelete = (id) => {
    // Implement delete functionality here
    console.log(`Deleting Work Order ID: ${id}`);
    // You can call a delete function from Dataverse here if needed
  };

  const handleSaveEdit = async () => {
    setUpdateLoading(true);
    try {
      if (!selectedRequest.cr36d_workorderrecordid) {
        throw new Error('Work Order Record ID not found');
      }

      console.log(`Updating Work Order ID: ${selectedRequest.cr36d_workorderrecordid}`);
      console.log('Data being sent for update:', selectedRequest);

      // Create an object with only the fields that are in the edit modal
      const dataToUpdate = {
        cr36d_workorderid: selectedRequest.cr36d_workorderid,
        cr36d_workordertype: selectedRequest.cr36d_workordertype,
        cr36d_workorderstatus: selectedRequest.cr36d_workorderstatus,
        cr36d_workorderpriority: selectedRequest.cr36d_workorderpriority,
        cr36d_workordercategory: selectedRequest.cr36d_workordercategory,
        cr36d_boroughcode: selectedRequest.cr36d_boroughcode,
        cr36d_streetname: selectedRequest.cr36d_streetname,
        cr36d_crossstreet1: selectedRequest.cr36d_crossstreet1,
        cr36d_locationlatitude: selectedRequest.cr36d_locationlatitude,
        cr36d_locationlongitude: selectedRequest.cr36d_locationlongitude,
        cr36d_workorderentity: selectedRequest.cr36d_workorderentity,
        cr36d_globalid: selectedRequest.cr36d_globalid,
        cr36d_createddate: selectedRequest.cr36d_createddate,
        cr36d_climbername: selectedRequest.cr36d_climbername,
      };

      await updateWO(selectedRequest.cr36d_workorderrecordid, dataToUpdate);

      setWorkOrders(workOrders.map(req => (req.cr36d_objectid === selectedRequest.cr36d_objectid ? { ...req, ...dataToUpdate } : req)));
      setEditModalOpen(false);

      setSnackbar({
        open: true,
        message: 'Work Order updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating Work Order:', error);
      setSnackbar({
        open: true,
        message: `Error updating Work Order: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  const filteredWorkOrders = workOrders.filter(order => {
    const searchString = searchTerm.toLowerCase();
    return (
      order.cr36d_workordertype?.toLowerCase().includes(searchString) ||
      order.cr36d_workorderstatus?.toString().toLowerCase().includes(searchString) ||
      order.cr36d_boroughcode?.toLowerCase().includes(searchString) ||
      order.cr36d_climbername?.toLowerCase().includes(searchString)
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
          <Button size="small" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon color="error" />
          </Button>
        </>
      )
    }
  ];

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Work Orders
      </Typography>

      {/* Category Dashboard */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Work Orders by Category
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryStats}>
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
              <Bar dataKey="count" fill="#2196f3" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Work Orders Grid */}
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth
              label="Search Work Orders"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by type, status, or location..."
            />
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredWorkOrders}
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
        <DialogTitle>Edit Work Order</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <>
              <TextField
                fullWidth
                label="Work Order ID"
                value={selectedRequest.cr36d_workorderid || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_workorderid: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Work Type"
                value={selectedRequest.cr36d_workordertype || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_workordertype: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Status"
                value={selectedRequest.cr36d_workorderstatus || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_workorderstatus: e.target.value })}
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
                label="Street Name"
                value={selectedRequest.cr36d_streetname || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_streetname: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Cross Street 1"
                value={selectedRequest.cr36d_crossstreet1 || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_crossstreet1: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Location Latitude"
                type="number"
                value={selectedRequest.cr36d_locationlatitude || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_locationlatitude: parseFloat(e.target.value) })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Location Longitude"
                type="number"
                value={selectedRequest.cr36d_locationlongitude || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_locationlongitude: parseFloat(e.target.value) })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Climber Name"
                value={selectedRequest.cr36d_climbername || ''}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, cr36d_climbername: e.target.value })}
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

export default WorkOrders; 