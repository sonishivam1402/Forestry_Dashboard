require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001; // Use PORT from .env or default to 3001

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

const tenantId = process.env.TENANT_ID; // Use environment variable
const clientId = process.env.CLIENT_ID; // Use environment variable
const clientSecret = process.env.CLIENT_SECRET; // Use environment variable
const dynamicsUrl = process.env.DYNAMICS_URL; // Use environment variable
const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

const getAccessToken = async () => {
  const requestBody = `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials&scope=${encodeURIComponent(dynamicsUrl + '/.default')}`.replace(/\s+/g, '');
  const response = await axios.post(tokenEndpoint, requestBody, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data.access_token;
};

app.get('/api/data', async (req, res) => {
  try {
    const token = await getAccessToken();
    const response = await axios.get(`${dynamicsUrl}/api/data/v9.2/cr36d_storminspections?$orderby=cr36d_datetimeofstorminspection desc`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'OData-Version': '4.0',
      },
    });
    res.json(response.data.value);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching data');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});