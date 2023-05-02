const http = require('http');
const https = require('https');
const url = require('url');
const FileCache = require('./Test1');

const cache = new FileCache('./cache');

const targetHost = 'target-server.com';
const targetPort = 443;
const targetProtocol = 'https:';

function handleRequest(req, res) {
  const requestOptions = url.parse(req.url);
  requestOptions.host = targetHost;
  requestOptions.port = targetPort;
  requestOptions.protocol = targetProtocol;
  requestOptions.method = req.method;
  requestOptions.headers = req.headers;

  const cacheKey = `${requestOptions.method}:${requestOptions.href}`;
  const cachedResponse = cache.get(cacheKey);

  if (cachedResponse) {
    console.log('Cache hit for', requestOptions.href);
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(cachedResponse);
    res.end();
    return;
  }

  console.log('Proxying request to', requestOptions.href);

  const targetRequest = (requestOptions.protocol === 'https:' ? https : http).request(requestOptions, (targetResponse) => {
    console.log('Received response from', requestOptions.href);
    let responseData = '';

    targetResponse.on('data', (chunk) => {
      responseData += chunk;
    });

    targetResponse.on('end', () => {
      cache.set(cacheKey, responseData, 60); // Cache for 60 seconds
      res.writeHead(targetResponse.statusCode, targetResponse.headers);
      res.write(responseData);
      res.end();
    });
  });

  targetRequest.on('error', (err) => {
    console.error('Error proxying request:', err);
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.write('An error occurred while proxying the request.');
    res.end();
  });

  req.on('data', (chunk) => {
    targetRequest.write(chunk);
  });

  req.on('end', () => {
    targetRequest.end();
  });
}

const server = http.createServer(handleRequest);

server.listen(8080, () => {
  console.log('Proxy server listening on port 8080');
});
