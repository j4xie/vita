# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

PomeloX is a **production-ready** mobile platform for Chinese international students overseas, focusing on activity management and registration. The platform is currently **live and operational** as of September 2025.

**Current Status:** Production application with active user base serving 500+ students across multiple universities.

## 🔥 **Core Development Rules (MUST FOLLOW)**

### **🚫 Code Isolation Rules (ZERO TOLERANCE)**
- ❌ **NEVER mix files between `frontend/` and `frontend-web/`** - Complete isolation required
- ❌ **NEVER share components** - Each platform has independent implementations  
- ❌ **NEVER cross-import** - No `../frontend/` imports in web, no `../frontend-web/` in app
- ✅ **Platform-specific files only** - Use `.native.tsx` and `.web.tsx` suffixes when needed

### **🚫 API Usage Rules (ZERO TOLERANCE)**
- ❌ **NEVER use Mock APIs** - Only real backend at `https://www.vitaglobal.icu`
- ❌ **NEVER hardcode fake data** - Show real 0 states instead of fake numbers
- ❌ **NEVER create missing APIs** - Report missing endpoints immediately
- ✅ **Real data only** - All user stats, activity data must come from actual APIs

### **🌍 Internationalization Rules (MANDATORY)**
- ❌ **NEVER hardcode Chinese text** - All user-visible text must use `t()` function
- ❌ **NEVER single-language development** - Add both `zh-CN` and `en-US` translations
- ✅ **Semantic key names** - Use `auth.login.welcome` not `text1`
- ✅ **Dual sync** - Every translation key exists in both language files

## 🏗️ **Tech Stack**

### Backend
- **Framework:** FastAPI (Python)  
- **Database:** PostgreSQL 15 + Redis 7
- **API Base:** `https://www.vitaglobal.icu` ✅ **Production Only**
- **Auth:** JWT Bearer Token (`Authorization: Bearer {token}`)

### Frontend  
- **Framework:** React Native + Expo
- **Language:** TypeScript
- **i18n:** i18next (zh-CN, en-US)
- **State:** React Context + AsyncStorage
- **Animation:** React Native Reanimated 3

## 📋 **Key Commands**

### Environment Setup
```bash
# Database services
docker-compose up -d postgres redis

# Frontend development (App)
cd frontend && npm run ios

# Web development (Fixed Port 8090)
cd frontend-web && lsof -ti:8090 | xargs kill -9 2>/dev/null; npx expo start --web --port 8090
```

### Version Updates
**Quick Reference:** When user says "请查看CLAUDE规范关于新版本发布的规范，帮我更新应用"
```bash
cd frontend
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

## 📂 **Project Structure**
```
pomeloX/
├── backend/                 # FastAPI backend
├── frontend/               # React Native app (ISOLATED)
├── frontend-web/           # Web application (ISOLATED)  
├── docs/                   # Detailed documentation
│   ├── API_GUIDE.md        # Complete API reference
│   ├── UI_DESIGN_SYSTEM.md # UI/UX specifications
│   ├── PERFORMANCE_GUIDE.md # Performance optimization
│   └── VERSION_RELEASE.md  # Release management
└── CLAUDE.md              # This core guide
```

## ⚡ **Performance Requirements (MANDATORY)**

### React Optimization (MUST USE)
- **React.memo** - All list components to prevent re-renders
- **useMemo** - Cache expensive calculations  
- **useCallback** - Stabilize function references
- **FastImage** - All network images (no regular Image component)
- **FlatList optimization** - `removeClippedSubviews={true}`, proper `getItemLayout`

### Performance Targets
- **List scrolling**: ≥55fps
- **Image loading**: <2 seconds
- **Page transitions**: <300ms
- **Memory**: Zero leak warnings

## 🌟 **Quick References**

### Critical APIs (Production)
- **Login**: `POST /app/login` - `{username, password}`
- **User Info**: `GET /app/user/info` - Headers: `Authorization: Bearer {token}`
- **Activities**: `GET /app/activity/list` - Params: `{userId, pageNum?, pageSize?}`
- **Volunteer Sign**: `POST /app/hour/signRecord` - `{userId, type: 1|2, startTime?, endTime?}`

### Permission Levels
- `manage`: 总管理员 (Full access)
- `part_manage`: 分管理员 (Partial management)
- `staff`: 内部员工 (Volunteer features only)
- `common`: 普通用户 (Basic features)

### Development Workflow
1. **Plan with TodoWrite** - Always track complex tasks
2. **Use real APIs only** - Never mock data unless explicitly requested
3. **Follow isolation rules** - Keep frontend/ and frontend-web/ separate
4. **Add i18n from start** - No hardcoded Chinese text
5. **Optimize performance** - Use memo/callback/FastImage
6. **Test both platforms** - Verify app and web work independently
7. **Fixed Web Port** - Always use port 8090 for web development, kill existing processes

## 📚 **Detailed Documentation**

For comprehensive information, see the specialized guides:

- **[API Guide](docs/API_GUIDE.md)** - Complete API reference with all endpoints
- **[UI Design System](docs/UI_DESIGN_SYSTEM.md)** - Liquid Glass design specifications  
- **[Performance Guide](docs/PERFORMANCE_GUIDE.md)** - React optimization and performance rules
- **[Version Release](docs/VERSION_RELEASE.md)** - TestFlight and App Store release process

## 🚨 **Critical Reminders**

### **React Native Reanimated Warning**
**⚠️ NEVER use `useAnimatedScrollHandler` with FlatList/SectionList** - Causes "onScroll is not a function" error. Use `useCallback` instead.

### **Production Context**
This is a **live application** serving real users. Always:
- Prioritize stability over new features
- Test thoroughly before commits
- Use real data and APIs
- Follow established patterns
- Report issues immediately

---

**Development Principle:** *Keep it simple, keep it real, keep it working.*

For detailed implementation guidance, always refer to the specialized documentation in the `docs/` folder.