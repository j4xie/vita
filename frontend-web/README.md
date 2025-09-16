# PomeloX Web H5

Web application for PomeloX platform, built with React Native Web + Expo.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server (Port 8090)
npm run web:dev

# Build for production
npm run web:build
```

## 🌐 Deployment

```bash
# Standard deployment (recommended)
npm run web:build
node scripts/upload-latest-builds.js

# Alternative
npm run deploy
```

## 💻 Features

- Browser-based access
- Mobile-responsive design
- QR code scanning via camera
- Multi-language support (中文/English)
- Progressive Web App capabilities

## 🛠️ Tech Stack

- React Native Web
- Expo for Web
- TypeScript
- i18next for internationalization
- 宝塔面板 deployment

## 📁 Environments

- **Production**: https://web.vitaglobal.icu
- **Testing**: http://106.14.165.234:8086

## 📄 Documentation

- [Development Guide](CLAUDE.md)
- [API Reference](docs/API_GUIDE.md)
- [Deployment Guide](CLAUDE.md#web部署规范-critical)

## 🔧 Scripts

- `baota-deploy.js` - Automated deployment
- `upload-latest-builds.js` - Upload built files
- See `scripts/` folder for all deployment tools

## 📝 License

Proprietary - PomeloX © 2025