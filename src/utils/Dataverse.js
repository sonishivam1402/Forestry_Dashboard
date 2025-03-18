import axios from 'axios';

// Function to fetch data from the Dataverse API via the backend server
export const fetchDataverseData = async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/data');
    console.log('Fetched data:', response.data);
    return response.data; // Assuming the response contains the 'value' array of records
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Function to update storm data in Dataverse via the backend server
export const updateStormData = async (requestId, data) => {
  try {
    console.log(`Updating storm data for ID: ${requestId}`, data);

    const response = await axios.patch(`http://localhost:3001/api/data/${requestId}`, data, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('Update response:', response);
    return response;
  } catch (error) {
    console.error('Error in updateStormData:', error.response?.data || error.message);
    throw new Error(`Failed to update storm data: ${error.message}`);
  }
};

//service request

export const fetchServiceReq = async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/srdata');
    console.log('Fetched data:', response.data);
    return response.data; // Return the fetched data
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};