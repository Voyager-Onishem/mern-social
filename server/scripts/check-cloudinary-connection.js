import https from 'https';

// Simple HTTPS request to check connectivity
const options = {
  hostname: 'api.cloudinary.com',
  port: 443,
  path: '/ping',
  method: 'GET'
};

console.log('Attempting to connect to Cloudinary API...');

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    console.log(`Response body: ${chunk}`);
  });
});

req.on('error', (error) => {
  console.error(`Error connecting to Cloudinary: ${error.message}`);
});

req.end();