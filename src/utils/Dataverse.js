import axios from 'axios';

// Function to fetch data from the Dataverse API via the backend server
export const fetchDataverseData = async () => {
  const response = await axios.get('http://localhost:3001/api/data');
  console.log(response.data);
  return response.data; // Assuming the response contains the 'value' array of records
};

// Function to update storm data in Dataverse via the backend server
export const updateStormData = async (treeId, data) => {
  const response = await axios.patch(`http://localhost:3001/api/data/${treeId}`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status !== 204) {
    throw new Error('Failed to update storm data');
  }

  return response;
};