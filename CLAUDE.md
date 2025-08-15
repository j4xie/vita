# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VitaGlobal is a Phase 0 MVP platform for Chinese international students overseas, focusing on activity management and registration. The project has a critical 5-week development timeline targeting September 2025 launch.

**Current Status:** Third-party services configured (85% complete), ready for code implementation.

## Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL 15 + Redis 7
- **Email:** Gmail SMTP (port 587)
- **Storage:** Cloudflare R2
- **Push Notifications:** Firebase FCM
- **Authentication:** JWT tokens

### Frontend
- **Framework:** React Native + Expo
- **Language:** TypeScript
- **Internationalization:** i18next (zh-CN, en-US)
- **State Management:** TBD based on frontend-requirements.md
- **Animation:** React Native Reanimated 3

## Key Commands

### Environment Setup
```bash
# Start local database services
docker-compose up -d postgres redis

# Start all services including management tools
docker-compose --profile tools up -d

# View service status
docker-compose ps

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Stop services
docker-compose down

# Clean up all data
docker-compose down -v
```

### Database Management
```bash
# Connect to PostgreSQL
psql postgresql://vitaglobal:vitaglobal_password@localhost:5432/vitaglobal_db

# Test Redis connection
redis-cli -h localhost -p 6379 ping

# Access management interfaces (with --profile tools)
# PgAdmin: http://localhost:5050 (admin@vitaglobal.dev / admin123)
# Redis Commander: http://localhost:8081 (admin / admin123)
```

### Configuration Setup
```bash
# Copy environment configurations
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## Project Structure

```
vitaglobal/
├── backend/                 # FastAPI backend
│   ├── .env.example        # Backend environment template
│   ├── API_DOC.md          # API endpoints documentation
│   ├── DB_SCHEMA.md        # Database schema design
│   └── backend-requirements.md  # 5-week development plan
├── frontend/               # React Native mobile app
│   ├── .env.example       # Frontend environment template
│   └── frontend-requirements.md  # UI development plan
├── config/
│   └── secrets.md         # Sensitive keys documentation
├── docs/
│   └── I18N_IMPLEMENTATION.md  # Internationalization guide
├── docker-compose.yml     # Local development services
├── important-date.md      # Project timeline and milestones
├── MRD.md                # Market requirements
├── PRD.md                # Product requirements
└── README.md             # Project overview
```

## Architecture Decisions

### Database Design
- Complete schema in `backend/DB_SCHEMA.md`
- Users, Organizations, Activities, Registrations tables
- Internationalization support via translations table
- Redis for session management and caching

### API Design
- RESTful endpoints documented in `backend/API_DOC.md`
- JWT authentication with 7-day expiry
- Internationalization via Accept-Language header
- Standard error responses with multi-language support

### Third-Party Services Configuration
All services are pre-configured and ready for development:

1. **Gmail SMTP** - Email verification and notifications
2. **Cloudflare R2** - Image storage with S3-compatible API
3. **Firebase FCM** - Push notifications (mobile configs pending)
4. **Google OAuth** - Social login (client configured)

## Frontend UI/UX Specifications

### Design System - Liquid Glass (Apple WWDC 2025 Inspired)

#### Visual Language
- **Primary Design Pattern:** Liquid Glass with blur effects and translucency
- **Color System:** VitaGlobal brand colors with warm gradient palette
  - Primary: #FF6B35 (Vibrant Orange) - Used for CTAs and active states
  - Secondary: #FF4757 (Coral Red) - Used for secondary actions and gradients
  - Accent: #FF8A65 (Light Orange) - Used for highlights and hover states
  - Success: #2ED573 (Fresh Green) - Confirmations and positive states
  - Warning: #FFA726 (Warm Amber) - Alerts and urgency indicators
- **Shadow System:** Multi-level elevation (xs, sm, base, md, lg, xl)
  - Cards: 4dp elevation with colored shadows
  - Floating elements: 12dp elevation with glow effects
  - Modals: 16dp elevation with heavy shadows

#### Component Library

##### Activity Card (EventCard)
- **Layout:** 180px height with gradient overlay
- **Animations:** 
  - Spring animation on press (scale 0.98)
  - Fade-in on scroll visibility
  - Parallax effect on image during scroll
- **Interactive Elements:**
  - Floating heart icon (top-right) with pulse animation
  - Quick register button with primary color background
  - Status badge with dynamic color based on availability
- **Gradient Overlay:** Two-tone gradient from 30% to 80% opacity

##### Floating Action Buttons (FAB)
- **Position:** Bottom-right, 16dp from edges
- **Behavior:**
  - Auto-hide on scroll down, show on scroll up
  - Scale animation (1.0 → 1.1) on press
  - Pulsing shadow effect for primary actions
- **Types:**
  - Primary FAB: Create activity (admin only)
  - Secondary FAB: Filter/Sort options
  - Mini FAB: Quick actions (40dp diameter)

##### Bottom Sheets
- **Implementation:** react-native-bottom-sheet
- **Snap Points:** [25%, 50%, 90%]
- **Content Types:**
  - Quick registration form
  - Activity filters
  - User profile quick view
- **Animations:** Spring physics with 0.8 damping

### Animation Framework

#### Core Animations (React Native Reanimated 3)
```javascript
// Standard animation configs
const springConfig = {
  damping: 15,
  mass: 1,
  stiffness: 150,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2,
};

const timingConfig = {
  duration: 300,
  easing: Easing.bezier(0.4, 0, 0.2, 1), // Material Design standard
};
```

#### Animation Patterns
1. **Entry Animations:**
   - Fade + Slide up (300ms, staggered 50ms)
   - Scale from 0.9 to 1.0 with opacity
   
2. **Interactive Animations:**
   - Button press: Scale to 0.95 with spring
   - Card hover: Elevate + subtle rotation
   - Pull to refresh: Elastic bounce

3. **Navigation Transitions:**
   - Shared element transitions for images
   - Cross-fade for tab switches
   - iOS-style slide for stack navigation

4. **Micro-interactions:**
   - Heart animation: Scale + rotate on like
   - Number counters: Animated text changes
   - Progress indicators: Smooth fill animations

### Floating Elements & Overlays

#### Toast Notifications
- **Position:** Top-center, below safe area
- **Animation:** Slide down + fade in (250ms)
- **Auto-dismiss:** 3 seconds for info, 5 seconds for errors
- **Swipe to dismiss:** Horizontal swipe gesture

#### Modal System
- **Backdrop:** Blur effect (20px) with 0.5 opacity
- **Entry:** Scale from 0.95 with fade
- **Types:**
  - Full-screen: Activity details
  - Dialog: Confirmations
  - Bottom modal: Forms and selections

#### Floating Registration Button
- **Behavior:**
  - Sticky position when scrolling past activity info
  - Pulse animation when spots < 10
  - Disabled state with grayscale filter
- **Position:** Bottom of screen with 16dp padding

### Performance Optimizations

#### Image Handling
- **Library:** react-native-fast-image
- **Caching:** Memory + disk cache (100MB limit)
- **Lazy Loading:** Viewport-based with 200px threshold
- **Formats:** WebP preferred, JPEG fallback
- **Thumbnails:** 150x150 for lists, full resolution on demand

#### List Optimization
```javascript
// FlatList configuration
const listConfig = {
  removeClippedSubviews: true,
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  initialNumToRender: 10,
  windowSize: 10,
  getItemLayout: (data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }),
};
```

#### Memory Management
- **Component unmounting:** Clean up animations and listeners
- **Image cache clearing:** On low memory warnings
- **State persistence:** AsyncStorage for offline support
- **Bundle optimization:** 
  - Code splitting with React.lazy()
  - Tree shaking unused imports
  - Asset optimization (convert to WebP)

### Gesture Interactions

#### Swipe Gestures (react-native-gesture-handler)
- **Horizontal Swipe:** 
  - Left: Show quick actions (favorite, share)
  - Right: Mark as interested
- **Vertical Swipe:**
  - Pull-to-refresh with custom animation
  - Dismiss modals and sheets

#### Long Press Actions
- **Cards:** Show preview in modal
- **Images:** Save to gallery option
- **Text:** Copy to clipboard

#### Pinch & Pan
- **Images:** Zoom and pan in full-screen view
- **Maps:** Standard map interactions

### Accessibility & Internationalization

#### Touch Targets
- **Minimum Size:** 44x44 points (iOS), 48x48dp (Android)
- **Spacing:** 8dp minimum between interactive elements
- **Hit Slop:** Extended touch areas for small buttons

#### Screen Reader Support
- **Labels:** All interactive elements have accessibilityLabel
- **Hints:** Complex interactions have accessibilityHint
- **Roles:** Proper accessibilityRole for semantic meaning
- **Live Regions:** Dynamic content updates announced

#### Language-Aware Layouts
- **Text Expansion:** 30% buffer for English → Chinese
- **Dynamic Heights:** Auto-adjusting card heights
- **Font Scaling:** Support for system font size preferences
- **RTL Support:** Prepared for future Arabic/Hebrew

#### Responsive Design
- **Breakpoints:**
  - Small: < 375px width
  - Medium: 375-414px
  - Large: > 414px
- **Orientation:** Support landscape mode for tablets
- **Safe Areas:** Respect notches and system UI

### Platform-Specific Adaptations

#### iOS Specific
- **Navigation:** iOS-style back swipe gesture
- **Haptics:** Haptic feedback for important actions
- **Scroll:** Bounce effect on scroll boundaries
- **Keyboard:** Keyboard avoiding view for forms

#### Android Specific
- **Navigation:** Material Design bottom navigation
- **Ripple:** Touch ripple effects on buttons
- **Back Handler:** Hardware back button support
- **Status Bar:** Translucent with color theming

## Development Workflow

### Week 1 Milestones (Critical)
- [ ] Backend: User registration API with email verification
- [ ] Frontend: Login/registration UI screens
- [ ] Database: Complete schema implementation with i18n
- [ ] Integration: All third-party services connected

### Week 2-3 Focus
- Activity CRUD operations
- Image upload functionality
- Registration system with concurrency control

### Week 4-5 Completion
- CRM features for administrators
- Performance optimization
- App store preparation

## Important Files

### Configuration Files
- `backend/.env.example` - Backend service configurations
- `frontend/.env.example` - Mobile app configurations
- `config/secrets.md` - All sensitive keys and passwords
- `firebase-service-account.json` - Firebase admin credentials

### Requirements Documents
- `backend/backend-requirements.md` - Detailed backend tasks with timeline
- `frontend/frontend-requirements.md` - Frontend implementation plan
- `important-date.md` - Project status and immediate actions

## Security Keys

JWT and encryption keys are pre-generated and documented in `config/secrets.md`:
- JWT Secret Key: `VG2025_a8f5c8e9d2b3f7e1c4a6b9d8e3f7c2a5b8e1f4c7d0b3a6e9f2c5b8e1a4d7`
- Encryption Key: `ENC2025_f3e8c1b7d4a9f6e2c5b8f1e4c7d0b3a6f9e2c5b8e1f4c7d0b3a6e9f2c5b8e1a4`

## Testing Commands

```bash
# Test email sending (Gmail SMTP)
openssl s_client -connect smtp.gmail.com:587 -starttls smtp

# Test database connection
docker exec -it vitaglobal_postgres pg_isready -U vitaglobal -d vitaglobal_db

# Test Redis connection
docker exec -it vitaglobal_redis redis-cli ping
```

## Immediate Next Steps

1. **Create backend project structure:**
   - Initialize FastAPI project in `backend/` directory
   - Set up SQLAlchemy models based on DB_SCHEMA.md
   - Implement authentication endpoints

2. **Create frontend project:**
   - Initialize React Native with Expo in `frontend/` directory
   - Set up TypeScript and ESLint
   - Implement i18n with react-native-localize

3. **Complete Firebase mobile configuration:**
   - Add Android app to Firebase console
   - Add iOS app to Firebase console
   - Download and integrate config files

## Context for Development

This is a time-critical MVP targeting Chinese student organizations during their September recruitment period. The platform must support:
- 500-1000 concurrent users
- Bilingual interface (Chinese primary, English secondary)
- Activity creation and registration management
- Real-time notifications

All third-party services are configured with development credentials. Production deployment will require:
- Domain purchase for production URLs
- SSL certificate configuration
- Production database setup
- App store submissions

## 🚨 Critical Development Rules

### React Native Reanimated Scroll Handler Issue

**⚠️ NEVER use `useAnimatedScrollHandler` with FlatList, SectionList, or ScrollView in this project!**

**Problem:** React Native Reanimated's `useAnimatedScrollHandler` returns an animated object, but React Native's VirtualizedList (which powers FlatList/SectionList) expects `onScroll` to be a function. This causes the error:
```
TypeError: _this.props.onScroll is not a function (it is Object)
```

**❌ WRONG - Never Do This:**
```typescript
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    'worklet';
    // Animation logic here
  },
});

<SectionList onScroll={scrollHandler} />
```

**✅ CORRECT - Always Do This:**
```typescript
const handleScroll = useCallback((event: any) => {
  const scrollY = event.nativeEvent.contentOffset.y;
  // Update shared values for animations
  animatedValue.value = scrollY;
  // Animation logic using withTiming, etc.
}, [animatedValue]);

<SectionList onScroll={handleScroll} />
```

**Key Points:**
1. Use `useCallback` instead of `useAnimatedScrollHandler`
2. Access scroll position via `event.nativeEvent.contentOffset.y`
3. Update Reanimated shared values manually in the callback
4. Keep `withTiming`, `useSharedValue`, and `useAnimatedStyle` for animations
5. Always add explicit `onScroll={() => {}}` to ScrollView components to prevent propagation issues

**Files that have been affected by this issue:**
- `src/screens/activities/ActivityListScreen.tsx` (Fixed multiple times)
- `src/screens/profile/ProfileHomeScreen.tsx` (Added preventive handler)
- `src/screens/profile/ProfileScreen.tsx` (Added preventive handler)
- `src/screens/wellbeing/VolunteerListScreen.tsx` (Added preventive handler)

**Why this keeps happening:**
- Linters or auto-formatters may "correct" the code back to useAnimatedScrollHandler
- Copy-pasting code from Reanimated documentation
- Not understanding the VirtualizedList vs Reanimated compatibility issue

**Prevention:**
- Always test navigation between tabs after scroll-related changes
- Check console for onScroll errors before committing
- Prefer standard React Native scroll handling over Reanimated for list components

**Enhanced Safety Measures (Added 2025-08-13):**
All scroll handlers should include safety checks and error handling:
```typescript
const handleScroll = useCallback((event: any) => {
  try {
    // Always validate event object first
    if (!event || !event.nativeEvent || typeof event.nativeEvent.contentOffset?.y !== 'number') {
      return;
    }
    
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    // Safe Reanimated value updates with existence checks
    if (scrollY && typeof scrollY.value !== 'undefined') {
      scrollY.value = currentScrollY;
    }
    
    // Safe animation calls
    if (headerTranslateY && typeof headerTranslateY.value !== 'undefined') {
      headerTranslateY.value = withTiming(targetValue, animationConfig);
    }
  } catch (error) {
    console.warn('Scroll handler error:', error);
    // Silent failure to prevent breaking scroll functionality
  }
}, [dependencies]);
```

**Recent Enhanced Files:**
- `ActivityListScreen.tsx`: Enhanced with safety checks and error handling
- `usePerformanceDegradation.ts`: Added validation and error boundaries