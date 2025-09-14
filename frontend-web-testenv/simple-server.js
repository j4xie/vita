const express = require('express');
const path = require('path');
const app = express();

// 设置CORS和安全头，尝试允许摄像头访问
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // 尝试设置权限策略允许摄像头
  res.header('Permissions-Policy', 'camera=*, microphone=*');
  res.header('Feature-Policy', 'camera *; microphone *');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 服务静态文件
app.use(express.static('./web-build'));

// 所有路由都返回index.html（SPA支持）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './web-build', 'index.html'));
});

const port = 3001;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Mobile access: http://100.110.227.118:${port}`);
});