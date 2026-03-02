# BuyGhanaLands — Mobile App Strategy Report

**Generated:** 2026-03-02  
**Project:** BuyGhanaLands - Ghana Land Transaction Platform  
**Report Version:** 1.0.0

---

## 1. Executive Summary

**BuyGhanaLands** is a comprehensive land transaction platform for Ghana, enabling secure buying, selling, and verification of land properties. The web application is built with **Next.js 16 (App Router) + TypeScript**, using **Prisma ORM** with **NeonDB (PostgreSQL)**, and features a robust API layer with 100+ endpoints.

### Primary Recommendation: **React Native with Expo**

Given the existing React/Next.js frontend, TypeScript codebase, and the team's JavaScript expertise, **React Native with Expo** is the optimal choice for building connected Android and iOS apps. This approach maximizes code reuse, leverages existing skills, and provides the fastest path to market while maintaining near-native performance.

### High-Level Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 0: Preparation | 1-2 weeks | Backend API updates, project setup |
| Phase 1: Foundation | 2-3 weeks | Auth, navigation, design system |
| Phase 2: Core Features | 6-8 weeks | All major features |
| Phase 3: Polish | 2-3 weeks | UX refinement, performance |
| Phase 4: Testing | 1-2 weeks | QA, beta testing |
| Phase 5: Launch | 1-2 weeks | App Store submissions |
| **Total** | **13-20 weeks** | Production apps on both stores |

---

## 2. Web App Analysis Summary

### 2.1 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | Next.js 16.1.2 (App Router) |
| **Language** | TypeScript 5.x |
| **Styling** | TailwindCSS 4.x |
| **UI Components** | Custom + Radix UI + Lucide Icons |
| **State Management** | React Server Components + Client State |
| **Forms** | React Hook Form + Zod validation |
| **Animation** | GSAP + Lenis (smooth scroll) + Framer Motion |
| **Maps** | Mapbox GL JS + Leaflet (fallback) |
| **Charts** | Recharts |

| Layer | Technology |
|-------|------------|
| **Backend** | Next.js API Routes (REST) |
| **Database** | PostgreSQL (NeonDB) with PostGIS |
| **ORM** | Prisma 6.19.2 |
| **Authentication** | NextAuth.js 5 (JWT strategy) |
| **Search** | Meilisearch |
| **File Storage** | Cloudinary |
| **Payments** | Flutterwave |
| **SMS** | mNotify |
| **Email** | Resend / Nodemailer |

### 2.2 Feature Inventory

| Category | Features | Mobile Relevance |
|----------|----------|------------------|
| **Authentication** | Phone + OTP, Email + Password, JWT sessions | ✅ Critical |
| **Listings** | Browse, search, filter, create, edit, publish | ✅ Critical |
| **Search** | Full-text search via Meilisearch, geo-filters | ✅ Critical |
| **Maps** | Property locations, boundaries, geospatial | ✅ Critical (GPS) |
| **Offers** | Make offers, negotiate, accept/reject | ✅ Critical |
| **Transactions** | Escrow, payments, milestones | ✅ Critical |
| **Payments** | Flutterwave integration, mobile money | ✅ Critical |
| **Documents** | Upload, view, verify documents | ✅ Critical (Camera) |
| **Verification** | Land verification workflow | ✅ High |
| **Messaging** | In-app messaging between parties | ✅ High |
| **Notifications** | SMS, email alerts | ✅ High (Push) |
| **Favorites** | Save listings | ✅ High |
| **Saved Searches** | Alert on new matches | ✅ High |
| **Professionals** | Find surveyors, lawyers | ✅ Medium |
| **Permits** | Permit applications | ✅ Medium |
| **Workflows** | Land acquisition workflows | ✅ Medium |
| **Admin Dashboard** | User/listing management | ⚠️ Web-only initially |
| **Analytics** | Charts, statistics | ⚠️ Web-only initially |

### 2.3 API Layer Assessment

- **Type:** REST API via Next.js API Routes
- **Endpoints:** 100+ endpoints across 34 route groups
- **Authentication:** JWT via NextAuth.js (30-day session)
- **Validation:** Zod schemas
- **Documentation:** No OpenAPI/Swagger spec currently
- **CORS:** Not explicitly configured (Next.js default)

### 2.4 Real-Time Features

- **Current:** No WebSocket implementation found
- **Messaging:** Polling-based (database queries)
- **Notifications:** SMS/Email only (no push notifications)

### 2.5 File Handling

- **Provider:** Cloudinary
- **Upload Method:** Base64 via JSON body
- **Types:** Images (listings), Documents (verification)

---

## 3. Mobile Framework Recommendation

### 3.1 Framework Ranking (Most to Least Recommended)

| Rank | Framework | Score | Reasoning |
|------|-----------|-------|-----------|
| **1** | **React Native (Expo)** | ⭐⭐⭐⭐⭐ | Same language (TS), React patterns, shared logic potential, Expo simplifies builds |
| **2** | Capacitor (PWA Wrapper) | ⭐⭐⭐⭐ | Fastest path, reuses web code, but WebView performance limits |
| **3** | Flutter | ⭐⭐⭐ | Excellent performance, but requires Dart learning, no code sharing |
| **4** | Kotlin Multiplatform | ⭐⭐ | Good for shared logic, but complex setup, no web code reuse |
| **5** | Native (Kotlin + Swift) | ⭐ | Best performance, but 2x development cost, no code sharing |

### 3.2 Primary Recommendation: React Native with Expo

**Justification:**

1. **Language Alignment:** The web app uses TypeScript throughout. React Native uses the same language, enabling direct code sharing.

2. **Pattern Familiarity:** React patterns (hooks, components, state) transfer directly to React Native.

3. **Shared Code Potential:**
   - Zod validation schemas
   - API client logic
   - TypeScript interfaces/types
   - Utility functions (formatters, validators)
   - Business logic (price calculations, date handling)

4. **Expo Advantages:**
   - Managed workflow simplifies native builds
   - OTA updates without app store review
   - Built-in support for camera, location, notifications
   - EAS Build for CI/CD

5. **Ghana-Specific Considerations:**
   - Mobile money integration (Flutterwave SDK available)
   - Offline support for low-connectivity areas
   - SMS OTP verification (already implemented)

### 3.3 Secondary Recommendation: Capacitor

**Use Case:** If time-to-market is critical (< 4 weeks) and the team wants to test mobile app store presence before investing in a native app.

**Trade-offs:**
- WebView performance (acceptable for this app's complexity)
- Less native feel
- Larger bundle size
- May face App Store scrutiny if too "web-like"

---

## 4. Architecture Blueprint

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Screens   │  │   State     │  │   Services  │              │
│  │  (React     │  │  (Zustand/  │  │  (API,      │              │
│  │   Native)   │  │   TanStack) │  │   Storage)  │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│  ┌──────┴────────────────┴────────────────┴──────┐              │
│  │              Shared Logic Layer               │              │
│  │  (Types, Validators, Formatters, API Client)  │              │
│  └───────────────────────┬───────────────────────┘              │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      EXISTING BACKEND                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │  Next.js    │  │   Prisma    │  │  External   │               │
│  │  API Routes │  │   + NeonDB  │  │  Services   │               │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘               │
│         │                │                │                       │
│         ▼                ▼                ▼                       │
│  ┌─────────────────────────────────────────────────┐             │
│  │  PostgreSQL │ Meilisearch │ Cloudinary │ FCM    │             │
│  └─────────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │     │   Backend   │     │   Database  │
│    App      │     │   API       │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  1. Login Request │                   │
       │  (phone + OTP)    │                   │
       │──────────────────>│                   │
       │                   │  2. Verify OTP    │
       │                   │──────────────────>│
       │                   │<──────────────────│
       │  3. JWT Tokens    │                   │
       │  (access+refresh) │                   │
       │<──────────────────│                   │
       │                   │                   │
       │  4. Store in      │                   │
       │  Secure Storage   │                   │
       │  (Keychain/       │                   │
       │   Keystore)       │                   │
       │                   │                   │
       │  5. API Requests  │                   │
       │  (Bearer token)   │                   │
       │──────────────────>│                   │
       │                   │                   │
       │  6. Token Expired │                   │
       │  (401 response)   │                   │
       │<──────────────────│                   │
       │                   │                   │
       │  7. Refresh Token │                   │
       │──────────────────>│                   │
       │  8. New Tokens    │                   │
       │<──────────────────│                   │
```

### 4.3 Data Flow

| Data Type | Strategy | Storage |
|-----------|----------|---------|
| Auth tokens | Secure storage | expo-secure-store |
| User profile | Cache + API | MMKV + API |
| Listings | Cache + API | MMKV + API |
| Favorites | Local + Sync | SQLite + API |
| Search results | API only | Memory |
| Messages | Cache + API | SQLite + API |
| Documents | Download on demand | File system |

### 4.4 Navigation Structure

```
├── Auth Stack (unauthenticated)
│   ├── Welcome
│   ├── Login (Phone + OTP)
│   ├── Register
│   └── Forgot Password
│
├── Main Tab Navigator (authenticated)
│   ├── Home Tab
│   │   ├── Home Screen
│   │   ├── Listing Details
│   │   └── Make Offer
│   │
│   ├── Search Tab
│   │   ├── Search Screen
│   │   ├── Filters Modal
│   │   └── Map View
│   │
│   ├── Favorites Tab
│   │   └── Favorites List
│   │
│   ├── Messages Tab
│   │   ├── Conversations List
│   │   └── Chat Screen
│   │
│   └── Profile Tab
│       ├── Profile Screen
│       ├── My Listings
│       ├── My Offers
│       ├── My Transactions
│       ├── Settings
│       └── KYC Verification
│
└── Modal Stack
    ├── Create Listing
    ├── Document Upload
    ├── Payment Flow
    └── Notifications
```

### 4.5 Push Notification Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     NOTIFICATION FLOW                            │
└─────────────────────────────────────────────────────────────────┘

1. Device Registration:
   Mobile App → POST /api/devices/register → Store FCM/APNs token

2. Notification Trigger:
   Backend Event (new offer, message, etc.)
       ↓
   Notification Service
       ↓
   ┌─────────────────┬─────────────────┐
   │   FCM (Android) │   APNs (iOS)    │
   └────────┬────────┴────────┬────────┘
            ↓                 ↓
   ┌─────────────────────────────────────┐
   │         Mobile Device               │
   │  ┌─────────────────────────────┐   │
   │  │  Notification Handler       │   │
   │  │  → Parse deep link          │   │
   │  │  → Navigate to screen       │   │
   │  └─────────────────────────────┘   │
   └─────────────────────────────────────┘
```

---

## 5. API Readiness Audit

### 5.1 Existing Endpoints Assessment

| Endpoint Group | Count | Mobile Ready | Issues |
|----------------|-------|--------------|--------|
| `/api/auth/*` | 9 | ⚠️ Partial | No refresh token endpoint |
| `/api/listings/*` | 8 | ✅ Ready | Pagination exists |
| `/api/search/*` | 1 | ✅ Ready | Meilisearch integrated |
| `/api/offers/*` | 3 | ✅ Ready | - |
| `/api/transactions/*` | 5 | ✅ Ready | - |
| `/api/payments/*` | 5 | ✅ Ready | Flutterwave mobile SDK compatible |
| `/api/messages/*` | 3 | ✅ Ready | - |
| `/api/favorites/*` | 2 | ✅ Ready | - |
| `/api/documents/*` | 4 | ⚠️ Partial | Base64 upload, needs multipart |
| `/api/upload/*` | 3 | ⚠️ Partial | Base64 upload, needs multipart |
| `/api/profile/*` | 6 | ✅ Ready | - |
| `/api/verification/*` | 3 | ✅ Ready | - |
| `/api/devices/*` | 1 | ✅ Ready | Device token registration exists |

### 5.2 Critical Gaps

| Gap | Priority | Description | Recommendation |
|-----|----------|-------------|----------------|
| Refresh Token Endpoint | **CRITICAL** | No `/api/auth/refresh` endpoint | Add `POST /api/auth/refresh` |
| Token Revocation | **CRITICAL** | No logout token invalidation | Add `POST /api/auth/revoke` |
| Apple Sign-In | **CRITICAL** | Required for iOS if social login exists | Add Apple OAuth provider |
| Push Notification Registration | **HIGH** | Device token endpoint exists but incomplete | Enhance `/api/devices` |
| Multipart File Upload | **HIGH** | Current base64 approach inefficient for mobile | Add multipart support |
| API Versioning | **MEDIUM** | No versioning in place | Add `/api/v1/` prefix |
| OpenAPI Spec | **MEDIUM** | No API documentation | Generate Swagger spec |
| Health Check | **LOW** | No health endpoint | Add `GET /api/health` |

### 5.3 New Endpoints Needed

```typescript
// Authentication
POST /api/auth/refresh          // Refresh access token
POST /api/auth/revoke           // Revoke refresh token on logout
POST /api/auth/apple            // Apple Sign-In verification

// Device Management
POST /api/devices/register      // Register FCM/APNs token (enhance existing)
DELETE /api/devices/:token      // Unregister on logout
GET /api/devices                // List user's devices

// Push Notifications
GET /api/notifications          // Get notification history
PUT /api/notifications/:id/read // Mark as read
PUT /api/notifications/preferences // Update notification settings

// Health & Connectivity
GET /api/health                 // Health check for connectivity detection

// Deep Link Resolution
GET /api/resolve?url=...        // Resolve deep link to resource
```

---

## 6. Authentication Strategy

### 6.1 Current Web Authentication

- **Provider:** NextAuth.js v5
- **Strategy:** JWT (30-day session)
- **Methods:** Phone + OTP, Email + Password
- **Storage:** HTTP-only cookies (web)

### 6.2 Mobile Authentication Design

#### Token Strategy

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access Token | 15 minutes | Memory | API requests |
| Refresh Token | 30 days | Secure Storage | Token renewal |

#### Secure Storage

```typescript
// iOS: Keychain via expo-secure-store
// Android: Keystore via expo-secure-store

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'bgl_access_token',
  REFRESH_TOKEN: 'bgl_refresh_token',
};

export const tokenStorage = {
  setTokens: async (access: string, refresh: string) => {
    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, access);
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refresh);
  },
  
  getAccessToken: () => SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN),
  getRefreshToken: () => SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN),
  
  clearTokens: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
  },
};
```

#### Login Flows

1. **Phone + OTP (Primary)**
   - User enters Ghana phone number
   - Backend sends OTP via mNotify
   - User enters 6-digit OTP
   - Backend returns JWT tokens

2. **Email + Password**
   - Standard email/password flow
   - Returns JWT tokens

3. **Biometric Login (After Initial Login)**
   - Store refresh token in secure storage
   - On app launch, prompt for Face ID / Fingerprint
   - Use refresh token to get new access token

4. **Apple Sign-In (Required for iOS)**
   - **CRITICAL:** Must implement if any social login exists
   - Use `expo-apple-authentication`
   - Verify identity token on backend

#### Token Refresh Flow

```typescript
// API Client Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        const { accessToken, refreshToken: newRefresh } = await refreshTokens(refreshToken);
        
        await tokenStorage.setTokens(accessToken, newRefresh);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        await tokenStorage.clearTokens();
        navigationRef.navigate('Login');
        throw refreshError;
      }
    }
    
    throw error;
  }
);
```

### 6.3 Backend Changes Required

```typescript
// POST /api/auth/refresh
// Request: { refreshToken: string }
// Response: { accessToken: string, refreshToken: string }

// POST /api/auth/revoke
// Request: { refreshToken: string }
// Response: { success: true }

// Database: Add refresh_tokens table
model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([token])
}
```

---

## 7. Push Notification Architecture

### 7.1 Notification Types

| Web Notification | Mobile Push Equivalent | Priority |
|------------------|------------------------|----------|
| New offer received | Push + In-app | High |
| Offer accepted/rejected | Push + In-app | High |
| New message | Push + In-app | High |
| Payment received | Push + In-app | High |
| Listing approved | Push + In-app | Medium |
| Verification update | Push + In-app | Medium |
| Saved search match | Push + In-app | Medium |
| Transaction milestone | Push + In-app | Medium |
| Listing expiring | Push | Low |
| Marketing/Promotions | Push (opt-in) | Low |

### 7.2 Implementation

**Service:** Firebase Cloud Messaging (FCM) for both Android and iOS

**Expo Package:** `expo-notifications`

### 7.3 Notification Payload Schema

```typescript
interface PushNotificationPayload {
  title: string;
  body: string;
  data: {
    type: NotificationType;
    resourceId: string;
    deepLink: string;
    action?: string;
  };
  badge?: number;
  sound?: string;
  image?: string;
}

type NotificationType =
  | 'NEW_OFFER'
  | 'OFFER_ACCEPTED'
  | 'OFFER_REJECTED'
  | 'NEW_MESSAGE'
  | 'PAYMENT_RECEIVED'
  | 'LISTING_APPROVED'
  | 'VERIFICATION_UPDATE'
  | 'SAVED_SEARCH_MATCH'
  | 'TRANSACTION_UPDATE';

// Example payload
{
  title: "New Offer Received",
  body: "You received an offer of GHS 150,000 for your listing in Accra",
  data: {
    type: "NEW_OFFER",
    resourceId: "offer_abc123",
    deepLink: "buyghanalands://offers/offer_abc123"
  },
  badge: 1,
  sound: "default"
}
```

### 7.4 Backend Integration

```typescript
// Add to Prisma schema
model DeviceToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique
  platform  String   // 'ios' | 'android'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
}

// Notification dispatch service
import * as admin from 'firebase-admin';

export async function sendPushNotification(
  userId: string,
  notification: PushNotificationPayload
) {
  const tokens = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true },
  });
  
  if (tokens.length === 0) return;
  
  await admin.messaging().sendEachForMulticast({
    tokens: tokens.map(t => t.token),
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: notification.data,
    apns: {
      payload: {
        aps: {
          badge: notification.badge,
          sound: notification.sound || 'default',
        },
      },
    },
  });
}
```

---

## 8. Native Device Features Plan

### 8.1 Required Features

| Feature | Use Case | Package | Permissions |
|---------|----------|---------|-------------|
| **Camera** | Document photos, listing images | `expo-image-picker` | `NSCameraUsageDescription`, `CAMERA` |
| **Photo Library** | Select existing photos | `expo-image-picker` | `NSPhotoLibraryUsageDescription`, `READ_EXTERNAL_STORAGE` |
| **Push Notifications** | Alerts, messages | `expo-notifications` | Push notification entitlement |
| **Geolocation** | Property location, map centering | `expo-location` | `NSLocationWhenInUseUsageDescription`, `ACCESS_FINE_LOCATION` |
| **Biometrics** | Quick login | `expo-local-authentication` | `NSFaceIDUsageDescription` |
| **Secure Storage** | Token storage | `expo-secure-store` | None |
| **Deep Linking** | Open from notifications, emails | `expo-linking` | URL schemes |
| **Share** | Share listings | `expo-sharing` | None |
| **Haptics** | Feedback on actions | `expo-haptics` | None |
| **Clipboard** | Copy listing links | `expo-clipboard` | None |

### 8.2 iOS Info.plist Strings

```xml
<key>NSCameraUsageDescription</key>
<string>BuyGhanaLands needs camera access to take photos of land documents and property images.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>BuyGhanaLands needs photo library access to select images for your listings.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>BuyGhanaLands uses your location to show nearby land listings and help you mark property locations on the map.</string>

<key>NSFaceIDUsageDescription</key>
<string>BuyGhanaLands uses Face ID for quick and secure login to your account.</string>
```

### 8.3 Android Permissions

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

---

## 9. Backend Changes Required

### 9.1 Authentication

| Change | Method | Endpoint | Priority |
|--------|--------|----------|----------|
| Add refresh token endpoint | POST | `/api/auth/refresh` | CRITICAL |
| Add token revocation | POST | `/api/auth/revoke` | CRITICAL |
| Add Apple Sign-In | POST | `/api/auth/apple` | CRITICAL |
| Add refresh_tokens table | - | Database migration | CRITICAL |
| Reduce access token lifetime | - | Config change | HIGH |

### 9.2 Push Notifications

| Change | Method | Endpoint | Priority |
|--------|--------|----------|----------|
| Enhance device registration | POST | `/api/devices/register` | HIGH |
| Add device unregistration | DELETE | `/api/devices/:token` | HIGH |
| Add Firebase Admin SDK | - | Backend dependency | HIGH |
| Add notification dispatch service | - | Backend service | HIGH |
| Update all notification triggers | - | Backend code | HIGH |

### 9.3 API Enhancements

| Change | Method | Endpoint | Priority |
|--------|--------|----------|----------|
| Add health check | GET | `/api/health` | MEDIUM |
| Add API versioning | - | Route prefix `/api/v1/` | MEDIUM |
| Add multipart file upload | POST | `/api/upload/multipart` | MEDIUM |
| Generate OpenAPI spec | - | Documentation | MEDIUM |

### 9.4 Database Migrations

```prisma
// Add to schema.prisma

model RefreshToken {
  id        String    @id @default(cuid())
  token     String    @unique
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
}

model PushNotification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String
  title     String
  body      String
  data      Json?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  @@index([userId, read])
  @@index([createdAt])
}

// Update DeviceToken model
model DeviceToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  platform  String   // 'ios' | 'android'
  appVersion String?
  lastUsed  DateTime @default(now())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
}
```

---

## 10. Shared Code Strategy

### 10.1 Monorepo Structure

```
buyghanalands/
├── apps/
│   ├── web/                    # Existing Next.js app
│   │   ├── src/
│   │   └── package.json
│   │
│   └── mobile/                 # New React Native app
│       ├── src/
│       ├── app.json
│       └── package.json
│
├── packages/
│   ├── types/                  # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── user.ts
│   │   │   ├── listing.ts
│   │   │   ├── offer.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── validators/             # Shared Zod schemas
│   │   ├── src/
│   │   │   ├── auth.ts
│   │   │   ├── listing.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── utils/                  # Shared utility functions
│   │   ├── src/
│   │   │   ├── formatters.ts   # Price, date, phone formatters
│   │   │   ├── validators.ts   # Ghana phone validation
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── api-client/             # Shared API client
│       ├── src/
│       │   ├── client.ts
│       │   ├── endpoints.ts
│       │   └── index.ts
│       └── package.json
│
├── package.json                # Workspace root
├── turbo.json                  # Turborepo config
└── pnpm-workspace.yaml
```

### 10.2 Shareable Code from Web App

| Category | Files/Functions | Effort to Extract |
|----------|-----------------|-------------------|
| **Types** | All Prisma-generated types | Low |
| **Validators** | Zod schemas in `src/lib/validations.ts` | Low |
| **Formatters** | Price formatting, date formatting | Low |
| **Phone Utils** | Ghana phone number validation/formatting | Low |
| **Constants** | Regions, districts, land types | Low |
| **API Types** | Request/response interfaces | Medium |

### 10.3 Design Tokens

```typescript
// packages/ui-tokens/src/colors.ts
export const colors = {
  primary: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  // ... matches Tailwind config
};

// packages/ui-tokens/src/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

---

## 11. App Store Requirements

### 11.1 Apple App Store

**Account:** Apple Developer Program ($99/year)

**Required Assets:**
- App icon: 1024x1024px PNG (no alpha, no rounded corners)
- Screenshots: 6.7", 6.5", 5.5" iPhone sizes
- Privacy Policy URL
- Support URL

**Critical Requirements:**
- ✅ Sign in with Apple (MANDATORY if any social login exists)
- ✅ All permission usage descriptions in Info.plist
- ✅ Demo account credentials for App Review
- ✅ Export compliance questionnaire

**Common Rejection Risks:**
- Missing Sign in with Apple
- Broken demo account
- Missing privacy policy
- Vague permission descriptions

### 11.2 Google Play Store

**Account:** Google Play Developer ($25 one-time)

**Required Assets:**
- App icon: 512x512px PNG
- Feature graphic: 1024x500px
- Screenshots: Phone (min 2)

**Critical Requirements:**
- ✅ Privacy Policy URL
- ✅ Data Safety section completed
- ✅ Content rating questionnaire
- ✅ Target API level (Android 13+)

**Common Rejection Risks:**
- Incomplete Data Safety section
- Requesting unused permissions
- Privacy policy not accessible

---

## 12. Recommended Tech Stack

### React Native with Expo

| Category | Technology | Notes |
|----------|------------|-------|
| **Framework** | React Native + Expo SDK 52 | Managed workflow |
| **Language** | TypeScript | Strict mode |
| **Navigation** | React Navigation v7 | Stack + Tab + Drawer |
| **State (Client)** | Zustand | Lightweight, simple |
| **State (Server)** | TanStack Query v5 | Caching, sync, offline |
| **API Client** | Axios | Interceptors for auth |
| **Forms** | React Hook Form + Zod | Same as web |
| **Secure Storage** | expo-secure-store | Tokens |
| **General Storage** | MMKV | Fast key-value |
| **Local Database** | Expo SQLite + Drizzle | Offline support |
| **Styling** | NativeWind (Tailwind) | Same classes as web |
| **UI Components** | Custom + Gluestack UI | |
| **Maps** | react-native-maps | Google Maps |
| **Push Notifications** | expo-notifications + FCM | |
| **Analytics** | Firebase Analytics | |
| **Crash Reporting** | Sentry | |
| **Testing** | Jest + RNTL + Detox | |
| **CI/CD** | EAS Build + GitHub Actions | |
| **OTA Updates** | EAS Update | |

---

## 13. Implementation Roadmap

### Phase 0: Preparation (1-2 weeks)

- [ ] Register Apple Developer Account
- [ ] Register Google Play Developer Account
- [ ] Set up Firebase project (FCM, Analytics)
- [ ] Implement backend auth changes (refresh tokens, revocation)
- [ ] Add Apple Sign-In to backend
- [ ] Add push notification infrastructure to backend
- [ ] Set up monorepo structure
- [ ] Extract shared types and validators
- [ ] Initialize Expo project
- [ ] Configure EAS Build
- [ ] Set up Sentry for mobile
- [ ] Design app icon and splash screen

### Phase 1: Foundation (2-3 weeks)

- [ ] Project structure (navigation, theming, state)
- [ ] Design system (colors, typography, spacing)
- [ ] API client with token refresh
- [ ] Secure token storage
- [ ] Login screen (phone + OTP)
- [ ] Login screen (email + password)
- [ ] Apple Sign-In
- [ ] Biometric authentication
- [ ] Registration flow
- [ ] Forgot password flow
- [ ] Auth state persistence
- [ ] Logout flow
- [ ] Deep linking setup

### Phase 2: Core Features (6-8 weeks)

**Week 1-2: Listings**
- [ ] Home screen with featured listings
- [ ] Listing card component
- [ ] Listing details screen
- [ ] Image gallery
- [ ] Map view for listing location
- [ ] Share listing

**Week 3: Search & Discovery**
- [ ] Search screen
- [ ] Filters (region, price, type, etc.)
- [ ] Search results list
- [ ] Map view with markers
- [ ] Saved searches

**Week 4: Favorites & Offers**
- [ ] Favorites list
- [ ] Add/remove favorites
- [ ] Make offer modal
- [ ] My offers list
- [ ] Offer details

**Week 5: Transactions & Payments**
- [ ] Transaction list
- [ ] Transaction details
- [ ] Payment initiation (Flutterwave)
- [ ] Payment status tracking

**Week 6: Messaging**
- [ ] Conversations list
- [ ] Chat screen
- [ ] Send/receive messages
- [ ] Message notifications

**Week 7: Profile & Documents**
- [ ] Profile screen
- [ ] Edit profile
- [ ] My listings
- [ ] Create/edit listing
- [ ] Document upload (camera + gallery)
- [ ] KYC verification flow

**Week 8: Notifications**
- [ ] Push notification permission
- [ ] Device token registration
- [ ] Notification handling
- [ ] Notification center screen
- [ ] Deep link from notifications

### Phase 3: Polish (2-3 weeks)

- [ ] Skeleton loaders
- [ ] Empty states
- [ ] Error states with retry
- [ ] Haptic feedback
- [ ] Screen transitions
- [ ] Splash screen animation
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Dark mode (optional)
- [ ] Onboarding flow
- [ ] App rating prompt
- [ ] Offline banner

### Phase 4: Testing (1-2 weeks)

- [ ] Unit tests for utilities
- [ ] Component tests
- [ ] Integration tests for auth
- [ ] E2E tests (Detox)
- [ ] Manual testing on iOS devices
- [ ] Manual testing on Android devices
- [ ] Accessibility testing
- [ ] Performance testing
- [ ] Network condition testing
- [ ] Push notification testing
- [ ] Deep link testing
- [ ] Beta testing (TestFlight + Play Internal)

### Phase 5: Launch (1-2 weeks)

- [ ] Production signing certificates
- [ ] Production release build
- [ ] App Store Connect metadata
- [ ] Google Play Console metadata
- [ ] Submit to Apple App Review
- [ ] Submit to Google Play Review
- [ ] Staged rollout (Android)
- [ ] Monitor crash reports
- [ ] Monitor analytics
- [ ] Plan first update

---

## 14. Cost & Effort Estimate

### 14.1 Project Sizing

**Classification:** MEDIUM APP

- **Screens:** ~25-30
- **Features:** Auth, listings, search, offers, transactions, payments, messaging, documents, notifications
- **Complexity:** Moderate (payments, offline, push notifications)

### 14.2 Effort Estimate

| Scenario | Duration |
|----------|----------|
| Solo Developer | 16-20 weeks |
| 2-Person Team | 10-14 weeks |
| 3-Person Team | 8-10 weeks |

### 14.3 Recurring Costs

| Service | Cost |
|---------|------|
| Apple Developer Program | $99/year |
| Google Play Developer | $25 one-time |
| Firebase (Spark Plan) | Free |
| Expo EAS Build | Free tier (30 builds/month) |
| Sentry | Free tier (5K errors/month) |
| **Total Year 1** | ~$125 |

### 14.4 Complexity Factors

| Factor | Impact | Notes |
|--------|--------|-------|
| Payment Integration | +1 week | Flutterwave mobile SDK |
| Offline Support | +2 weeks | SQLite, sync logic |
| Push Notifications | +1 week | FCM setup, backend changes |
| Apple Sign-In | +0.5 weeks | Required for App Store |
| Maps Integration | +1 week | Property locations |

---

## 15. Immediate Next Steps

### This Week (10 Actions)

1. **Register Apple Developer Account** — Start the enrollment process ($99/year, takes 24-48 hours to approve)

2. **Register Google Play Developer Account** — One-time $25 fee, instant access

3. **Set up Firebase Project** — Create project, enable Cloud Messaging, download config files

4. **Implement Refresh Token Endpoint** — Add `POST /api/auth/refresh` to backend

5. **Implement Token Revocation** — Add `POST /api/auth/revoke` to backend

6. **Add RefreshToken Table** — Run Prisma migration for refresh token storage

7. **Initialize Expo Project** — `npx create-expo-app@latest apps/mobile --template blank-typescript`

8. **Configure EAS Build** — `eas build:configure` for iOS and Android

9. **Set up Monorepo** — Add `pnpm-workspace.yaml` and extract shared types

10. **Design App Icon** — Create 1024x1024 app icon based on web branding

---

## Appendix A: API Endpoint Reference

### Authentication Endpoints (New)

```
POST /api/auth/refresh
  Request:  { refreshToken: string }
  Response: { accessToken: string, refreshToken: string, expiresIn: number }

POST /api/auth/revoke
  Request:  { refreshToken: string }
  Response: { success: true }

POST /api/auth/apple
  Request:  { identityToken: string, authorizationCode: string, user?: { email: string, fullName: string } }
  Response: { accessToken: string, refreshToken: string, user: User }
```

### Device Management Endpoints

```
POST /api/devices/register
  Request:  { token: string, platform: 'ios' | 'android', appVersion?: string }
  Response: { id: string }

DELETE /api/devices/:token
  Response: { success: true }

GET /api/devices
  Response: { devices: DeviceToken[] }
```

### Notification Endpoints

```
GET /api/notifications
  Query:    { page?: number, limit?: number, unreadOnly?: boolean }
  Response: { notifications: Notification[], total: number, unreadCount: number }

PUT /api/notifications/:id/read
  Response: { success: true }

PUT /api/notifications/read-all
  Response: { success: true, count: number }

GET /api/notifications/preferences
  Response: { preferences: NotificationPreferences }

PUT /api/notifications/preferences
  Request:  { newOffers: boolean, messages: boolean, transactions: boolean, ... }
  Response: { preferences: NotificationPreferences }
```

---

## Appendix B: Deep Link Schema

```
buyghanalands://                     # App root
buyghanalands://listings             # Listings list
buyghanalands://listings/:id         # Listing details
buyghanalands://offers/:id           # Offer details
buyghanalands://transactions/:id     # Transaction details
buyghanalands://messages/:conversationId  # Chat screen
buyghanalands://profile              # Profile screen
buyghanalands://notifications        # Notification center
```

---

*Report generated for BuyGhanaLands mobile app development initiative.*
