const https = require('https');
const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

// 检查SSL证书
const certPath = path.join(__dirname, 'cert.pem');
const keyPath = path.join(__dirname, 'key.pem');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.log('❌ SSL证书不存在，请先运行:');
  console.log('openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=CN/ST=Local/L=Local/O=Dev/OU=Dev/CN=localhost"');
  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

const server = https.createServer(httpsOptions, (req, res) => {
  // 设置CORS和摄像头权限
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Permissions-Policy', 'camera=*, microphone=*');
  res.setHeader('Feature-Policy', 'camera *; microphone *');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 代理到Expo服务器
  const targetUrl = `http://localhost:8090${req.url}`;
  console.log('🔀 代理请求:', req.method, targetUrl);

  const options = {
    method: req.method,
    headers: { ...req.headers, host: 'localhost:8090' },
    hostname: 'localhost',
    port: 8090,
    path: req.url
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // 复制响应头
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    
    res.writeHead(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('❌ 代理错误:', err.message);
    res.writeHead(500);
    res.end('代理服务器错误');
  });

  req.pipe(proxyReq);
});

const port = 8443;
server.listen(port, () => {
  console.log(`🔒 HTTPS代理服务器运行在: https://localhost:${port}`);
  console.log(`📱 手机访问: https://100.110.227.118:${port}`);
  console.log('⚠️  浏览器会提示"不安全"，点击"高级" -> "继续访问"即可');
  console.log('✅ 这样就能使用摄像头了！');
});