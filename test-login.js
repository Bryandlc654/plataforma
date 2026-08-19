const axios = require('axios');
const API_URL = 'https://plataforma-api-j6ey.onrender.com/api/v1';

async function test() {
  try {
    // 1. Simulate login (we need an account, I'll use a fake one and expect 401 or 404, but let's see response structure)
    const res = await axios.post(`${API_URL}/auth/login`, { email: 'admin@admin.com', password: 'password' });
    console.log("Login success:");
    console.log(res.data);
  } catch (err) {
    console.log("Login error:");
    console.log(err.response?.data);
  }
}
test();
