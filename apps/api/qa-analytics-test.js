const http = require('http');

async function testAnalytics() {
  const data = JSON.stringify({
    tenantId: 'eb462755-e801-4773-a718-f580e95e6864',
    siteId: '3967a26b-b545-4229-805c-2c23f5a2fc34',
    type: 'pageview',
    path: '/qa-test-visit',
    referrer: 'qa-script'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/analytics/track',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Body: ${body}`);
    });
  });

  req.on('error', error => {
    console.error(`Error: ${error.message}`);
  });

  req.write(data);
  req.end();
}

testAnalytics();
