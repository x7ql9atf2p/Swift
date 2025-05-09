const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = 8080;
const SECRET_PASSWORD = 'examplepassword';

http.createServer((clientReq, clientRes) => {
  try {
    const reqUrl = new URL('http://localhost' + clientReq.url);
    const target = reqUrl.pathname.slice(1);
    if (reqUrl.searchParams.get('password') !== SECRET_PASSWORD) {
      clientRes.writeHead(403, { 'Content-Type': 'text/plain' });
      clientRes.end('Forbidden: Invalid password');
      return;
    }

    const targetUrl = new URL(target);
    const isHttps = targetUrl.protocol === 'https:';
    const proxyModule = isHttps ? https : http;

    const headers = { ...clientReq.headers };
    delete headers['user-agent'];
    delete headers['User-Agent'];
    delete headers['host'];

    const proxyOptions = {
      method: clientReq.method,
      headers,
    };

    const proxyReq = proxyModule.request(targetUrl, proxyOptions, proxyRes => {
      clientRes.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      });
      proxyRes.pipe(clientRes, { end: true });
    });

    proxyReq.on('error', err => {
      clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
      clientRes.end('Bad Gateway: ' + err.message);
    });

    if (clientReq.method === 'OPTIONS') {
      clientRes.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      });
      clientRes.end();
      return;
    }

    clientReq.pipe(proxyReq, { end: true });

  } catch (err) {
    clientRes.writeHead(400, { 'Content-Type': 'text/plain' });
    clientRes.end('Bad Request: ' + err.message);
  }
}).listen(PORT, () => {
  console.log(`Proxy running on: http://localhost:${PORT}`);
});
