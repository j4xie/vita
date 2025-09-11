const https = require('https');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// 设置CORS和摄像头权限
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // 允许摄像头和麦克风访问
  res.header('Permissions-Policy', 'camera=*, microphone=*');
  res.header('Feature-Policy', 'camera *; microphone *');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 检查是否有SSL证书
const certPath = path.join(__dirname, 'cert.pem');
const keyPath = path.join(__dirname, 'key.pem');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.log('❌ SSL证书不存在，请先运行: openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=CN/ST=Local/L=Local/O=Dev/OU=Dev/CN=localhost"');
  process.exit(1);
}

// 代理到Expo开发服务器
app.use('*', (req, res) => {
  const targetUrl = `http://localhost:8090${req.originalUrl}`;
  console.log('🔀 代理请求:', req.method, targetUrl);
  
  const options = {
    method: req.method,
    headers: { ...req.headers, host: 'localhost:8090' }
  };
  
  const proxyReq = require('http').request(targetUrl, options, (proxyRes) => {
    // 复制响应头
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    
    res.status(proxyRes.statusCode);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('代理错误:', err);
    res.status(500).send('代理服务器错误');
  });
  
  if (req.body) {
    proxyReq.write(req.body);
  }
  proxyReq.end();
});

// HTTPS选项
const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

const port = 8443;
https.createServer(httpsOptions, app).listen(port, () => {
  console.log(`🔒 HTTPS服务器运行在: https://localhost:${port}`);
  console.log(`📱 手机访问: https://100.110.227.118:${port}`);
  console.log('⚠️  浏览器会提示"不安全"，点击"继续访问"即可');
});