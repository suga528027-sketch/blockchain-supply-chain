
import fetch from 'node-fetch';

async function testApi() {
  try {
    const response = await fetch('http://localhost:8080/api/batch');
    const data = await response.json();
    console.log('API Response Structure:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error fetching API:', error.message);
  }
}

testApi();
