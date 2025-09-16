# PomeloX Official Website

Static website for PomeloX platform - company information, product features, and documentation.

## 🚀 Quick Start

```bash
# Start local server
python3 -m http.server 8000

# Or use Node.js
npx serve .

# Preview
open http://localhost:8000
```

## 🌐 Deployment

Automatically deployed via Vercel on Git push:

```bash
git add .
git commit -m "Update website"
git push origin main
```

## 📄 Pages

- **Landing Page** - Product introduction
- **Privacy Policy** - `/privacy.html`
- **Terms of Service** - `/terms.html`
- **Support** - `/support.html`
- **404 Page** - Custom error page

## 🌍 Languages

- Chinese (default) - Root directory
- English - `/en/` directory

## 🎨 Tech Stack

- Static HTML
- Tailwind CSS
- Vanilla JavaScript
- Vercel hosting

## 📁 Structure

```
website/
├── index.html          # Chinese landing
├── en/                 # English pages
├── mobile/             # Mobile-optimized
├── assets/             # CSS, JS, images
└── vercel.json        # Deployment config
```

## 📄 Documentation

- [Maintenance Guide](CLAUDE.md)
- [Content Management](CLAUDE.md#content-management)
- [SEO Guidelines](CLAUDE.md#seo-optimization)

## 🔗 Live Site

- Production: [Deployed via Vercel]

## 📝 License

Proprietary - PomeloX © 2025