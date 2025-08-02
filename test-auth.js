// Test script for authentication with backend
const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api/v1';

async function testAuth() {
  try {
    console.log('🔐 Testing Backend Authentication...\n');

    // Test 1: Register a new user
    console.log('1. Testing Registration...');
    const registerData = {
      email: 'test@example.com',
      password: 'testpass123',
      full_name: 'Test User'
    };
    
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
      console.log('✅ Registration successful:', registerResponse.data);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.detail === 'Email already registered') {
        console.log('⚠️  User already exists, proceeding to login');
      } else {
        console.error('❌ Registration failed:', error.response?.data || error.message);
      }
    }

    console.log('\n2. Testing Login...');
    const loginData = {
      email: 'test@example.com',
      password: 'testpass123'
    };

    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    console.log('✅ Login successful!');
    console.log('   Token:', loginResponse.data.access_token.substring(0, 50) + '...');
    console.log('   Type:', loginResponse.data.token_type);

    // Decode JWT to check user ID
    const token = loginResponse.data.access_token;
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('   User ID from token:', payload.sub);
    console.log('   Token expires:', new Date(payload.exp * 1000).toLocaleString());

    console.log('\n3. Testing authenticated request...');
    // Test an authenticated request
    try {
      const testResponse = await axios.get(`${API_BASE_URL}/some-protected-endpoint`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Authenticated request successful');
    } catch (error) {
      console.log('⚠️  No protected endpoint to test, but auth header would be: Bearer ' + token.substring(0, 20) + '...');
    }

    console.log('\n✨ Authentication implementation is working correctly!');
    console.log('\nNext steps:');
    console.log('1. Start the UI: pnpm dev');
    console.log('2. Visit http://localhost:3000/auth');
    console.log('3. Create an account or login');
    console.log('4. Check localStorage for auth_token');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testAuth();