# CLAUDE.md - PomeloX Official Website

This file provides guidance to Claude Code (claude.ai/code) when working with the PomeloX official website.

## 🎯 Project Overview

PomeloX Website is the official landing page and information portal for the PomeloX platform. It provides company information, product features, support documentation, and legal pages in multiple languages.

**Current Status:** Live static website deployed via Vercel.

## 🔥 **Core Development Rules**

### **🌍 Multi-Language Support**
- ✅ **Dual language** - Chinese and English versions
- ✅ **Separate HTML files** - `/index.html` (Chinese), `/en/index.html` (English)
- ✅ **Consistent content** - Keep all language versions synchronized

### **📄 Page Structure**
- **Landing Page** - Product introduction and features
- **Privacy Policy** - `/privacy.html`
- **Terms of Service** - `/terms.html`
- **Support** - `/support.html`
- **404 Page** - `/404.html`

## 🏗️ **Tech Stack**

- **Type:** Static HTML website
- **Styling:** Tailwind CSS + Custom CSS
- **JavaScript:** Vanilla JS for interactions
- **Deployment:** Vercel
- **CDN:** Vercel Edge Network

## 📋 **Key Commands**

### Development
```bash
# Start local server
python3 -m http.server 8000
# or
npx serve .

# Preview changes
open http://localhost:8000
```

### Deployment
```bash
# Auto-deploy via Git push (Vercel connected)
git add .
git commit -m "Update website"
git push origin main

# Manual deploy (if needed)
vercel deploy --prod
```

## 🌐 **File Structure**

```
website/
├── index.html           # Chinese landing page
├── privacy.html         # Privacy policy (Chinese)
├── terms.html           # Terms of service (Chinese)
├── support.html         # Support page (Chinese)
├── 404.html            # 404 error page
├── en/                 # English versions
│   ├── index.html      # English landing page
│   ├── privacy.html    # Privacy policy (English)
│   ├── terms.html      # Terms (English)
│   └── support.html    # Support (English)
├── mobile/             # Mobile-optimized pages
│   └── index.html      # Mobile landing
├── assets/             # Static resources
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript files
│   └── images/        # Images and icons
├── shared/             # Shared resources
├── _headers           # HTTP headers config
├── _redirects         # URL redirects
└── vercel.json        # Vercel configuration
```

## 🎨 **Design Guidelines**

### Color Scheme
- **Primary:** #FF6B6B (Pomelo red)
- **Secondary:** #4ECDC4 (Teal accent)
- **Background:** #FFFFFF (White)
- **Text:** #2D3436 (Dark gray)

### Typography
- **Headings:** Inter or system fonts
- **Body:** System fonts for better readability
- **Chinese:** PingFang SC, Microsoft YaHei

### Responsive Design
- **Mobile-first** approach
- **Breakpoints:**
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

## 🚀 **Deployment Configuration**

### Vercel Settings (vercel.json)
```json
{
  "routes": [
    {
      "src": "/",
      "dest": "/index.html"
    },
    {
      "src": "/en",
      "dest": "/en/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
```

### Cache Configuration
- **HTML files**: No cache (always fresh)
- **CSS/JS**: Cache for 1 year (versioned files)
- **Images**: Cache for 30 days

## 📝 **Content Management**

### Adding New Pages
1. Create HTML file in root (Chinese version)
2. Create English version in `/en/` directory
3. Update navigation links in all pages
4. Add to sitemap if needed
5. Test responsive design

### Updating Content
1. Edit HTML files directly
2. Keep language versions synchronized
3. Test all links and interactions
4. Verify mobile compatibility
5. Deploy via Git push

### SEO Optimization
- **Meta tags** - Title, description, keywords
- **Open Graph** - Social media previews
- **Structured data** - JSON-LD for search engines
- **Sitemap** - Keep updated for all pages
- **Alt text** - For all images

## 🔧 **Common Tasks**

### Update Landing Page Hero
```html
<!-- Edit in index.html and en/index.html -->
<section class="hero">
  <h1>Your New Title</h1>
  <p>Your new description</p>
</section>
```

### Add New Feature Section
```html
<section class="features">
  <div class="feature-card">
    <img src="/assets/images/feature.png" alt="Feature">
    <h3>Feature Name</h3>
    <p>Feature description</p>
  </div>
</section>
```

### Update Footer Links
```html
<footer>
  <nav>
    <a href="/privacy.html">隐私政策</a>
    <a href="/terms.html">服务条款</a>
    <a href="/support.html">支持</a>
  </nav>
</footer>
```

## 🚨 **Important Notes**

### Performance
- **Optimize images** - Use WebP format when possible
- **Minify CSS/JS** - For production builds
- **Lazy load** - Images below the fold
- **Preload** - Critical resources

### Accessibility
- **ARIA labels** - For interactive elements
- **Keyboard navigation** - Ensure all interactive elements are accessible
- **Color contrast** - WCAG AA compliance
- **Alt text** - Descriptive text for images

### Legal Compliance
- **Privacy Policy** - Keep updated with features
- **Terms of Service** - Review quarterly
- **Cookie Notice** - If analytics added
- **GDPR** - For European users

## 📊 **Analytics & Monitoring**

### Vercel Analytics
- Page views
- Unique visitors
- Performance metrics
- Geographic distribution

### Error Monitoring
- 404 tracking
- JavaScript errors
- Failed resource loads

## 🔄 **Maintenance Schedule**

- **Weekly**: Check for broken links
- **Monthly**: Update content as needed
- **Quarterly**: Review legal pages
- **Yearly**: Design refresh evaluation

---

**Development Principle:** *Simple, fast, informative.*