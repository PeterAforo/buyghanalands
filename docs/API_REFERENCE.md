# Buy Ghana Lands - API Reference

## Base URL
```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

---

## Authentication

All protected endpoints require a valid session. Authentication is handled via NextAuth.js.

### Headers
```
Cookie: next-auth.session-token=<token>
```

---

## Auth Endpoints

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "0241234567",
  "password": "securepassword",
  "accountType": "BUYER",
  "selectedPlan": "FREE",
  "professionalType": "SURVEYOR"  // Only for PROFESSIONAL
}
```

**Response:** `201 Created`
```json
{
  "message": "Registration successful. Please verify your email.",
  "userId": "clx..."
}
```

### Verify Email
```http
POST /api/auth/verify-email
```

**Request Body:**
```json
{
  "token": "verification-token-from-email"
}
```

### Resend Verification
```http
POST /api/auth/resend-verification
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

---

## Listings

### Get All Listings
```http
GET /api/listings
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `region` | string | Filter by region |
| `district` | string | Filter by district |
| `landType` | string | Filter by land type |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `minSize` | number | Minimum size (acres) |
| `maxSize` | number | Maximum size (acres) |
| `status` | string | Listing status |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response:** `200 OK`
```json
{
  "listings": [...],
  "total": 100,
  "page": 1,
  "totalPages": 10
}
```

### Get Single Listing
```http
GET /api/listings/[id]
```

**Response:** `200 OK`
```json
{
  "id": "clx...",
  "title": "5 Acres in Accra",
  "description": "...",
  "priceGhs": "500000",
  "sizeAcres": "5",
  "region": "Greater Accra",
  "district": "Tema",
  "status": "PUBLISHED",
  "seller": {...},
  "media": [...],
  "documents": [...]
}
```

### Create Listing
```http
POST /api/listings
```
**Auth Required:** Yes (SELLER role)

**Request Body:**
```json
{
  "title": "5 Acres in Accra",
  "description": "Beautiful land...",
  "priceGhs": 500000,
  "sizeAcres": 5,
  "region": "Greater Accra",
  "district": "Tema",
  "town": "Community 25",
  "landType": "RESIDENTIAL",
  "tenureType": "FREEHOLD"
}
```

### Update Listing
```http
PUT /api/listings/[id]
```
**Auth Required:** Yes (Owner only)

### Delete Listing
```http
DELETE /api/listings/[id]
```
**Auth Required:** Yes (Owner only)

---

## Transactions

### Get User Transactions
```http
GET /api/transactions
```
**Auth Required:** Yes

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `role` | string | `buyer` or `seller` |
| `status` | string | Transaction status |

### Get Transaction Details
```http
GET /api/transactions/[id]
```
**Auth Required:** Yes (Buyer or Seller)

### Create Transaction
```http
POST /api/transactions
```
**Auth Required:** Yes

**Request Body:**
```json
{
  "listingId": "clx...",
  "offerId": "clx...",
  "agreedPriceGhs": 500000
}
```

### Fund Transaction
```http
POST /api/transactions/[id]/fund
```
**Auth Required:** Yes (Buyer only)

### Confirm Transaction
```http
POST /api/transactions/[id]/confirm
```
**Auth Required:** Yes (Buyer only)

---

## Offers

### Create Offer
```http
POST /api/offers
```
**Auth Required:** Yes

**Request Body:**
```json
{
  "listingId": "clx...",
  "offerPriceGhs": 450000,
  "message": "I'm interested in this property..."
}
```

### Respond to Offer
```http
PUT /api/offers/[id]
```
**Auth Required:** Yes (Seller only)

**Request Body:**
```json
{
  "action": "accept" | "reject" | "counter",
  "counterPrice": 480000  // Only for counter
}
```

---

## Messages

### Get Conversations
```http
GET /api/messages
```
**Auth Required:** Yes

### Get Conversation Messages
```http
GET /api/messages/[conversationId]
```
**Auth Required:** Yes

### Send Message
```http
POST /api/messages
```
**Auth Required:** Yes

**Request Body:**
```json
{
  "receiverId": "clx...",
  "content": "Hello...",
  "listingId": "clx..."  // Optional
}
```

---

## Admin Endpoints

All admin endpoints require ADMIN, SUPPORT, or MODERATOR role.

### Users

#### Get All Users
```http
GET /api/admin/users
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `filter` | string | `all`, `active`, `suspended`, `sellers`, `agents`, `professionals` |
| `search` | string | Search by name, phone, email |

#### Create User
```http
POST /api/admin/users
```

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "0241234567",
  "password": "securepassword",
  "roles": ["BUYER", "SELLER"],
  "accountStatus": "ACTIVE"
}
```

#### Bulk User Actions
```http
PUT /api/admin/users
```

**Request Body:**
```json
{
  "action": "suspend" | "activate" | "deactivate" | "delete",
  "userIds": ["clx...", "clx..."]
}
```

#### Get User Details
```http
GET /api/admin/users/[id]
```

#### Update User
```http
PATCH /api/admin/users/[id]
```

**Request Body:**
```json
{
  "fullName": "Updated Name",
  "roles": ["BUYER", "SELLER"],
  "accountStatus": "ACTIVE",
  "kycTier": "TIER_2_GHANA_CARD"
}
```

#### User Status Action
```http
PUT /api/admin/users/[id]
```

**Request Body:**
```json
{
  "action": "suspend" | "activate" | "deactivate"
}
```

#### Delete User
```http
DELETE /api/admin/users/[id]
```

---

### Listings (Admin)

#### Get All Listings
```http
GET /api/admin/listings
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `filter` | string | `all`, `pending`, `published`, `suspended`, `rejected` |
| `search` | string | Search by title, region, seller |

#### Bulk Listing Actions
```http
PUT /api/admin/listings
```

**Request Body:**
```json
{
  "action": "approve" | "reject" | "suspend",
  "listingIds": ["clx...", "clx..."]
}
```

#### Moderate Listing
```http
PUT /api/admin/listings/[id]
```

**Request Body:**
```json
{
  "action": "approve" | "reject" | "suspend" | "reinstate"
}
```

#### Update Listing
```http
PATCH /api/admin/listings/[id]
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "status": "PUBLISHED",
  "verificationLevel": "VERIFIED",
  "isFeatured": true
}
```

#### Delete Listing
```http
DELETE /api/admin/listings/[id]
```

---

### Transactions (Admin)

#### Get All Transactions
```http
GET /api/admin/transactions
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `filter` | string | `all`, `pending`, `funded`, `released`, `disputed` |
| `search` | string | Search by ID, listing, buyer, seller |

#### Bulk Transaction Actions
```http
PUT /api/admin/transactions
```

**Request Body:**
```json
{
  "action": "release" | "refund" | "close",
  "transactionIds": ["clx...", "clx..."]
}
```

#### Transaction Action
```http
PUT /api/admin/transactions/[id]
```

**Request Body:**
```json
{
  "action": "release" | "refund" | "close" | "dispute" | "ready"
}
```

#### Update Transaction
```http
PATCH /api/admin/transactions/[id]
```

**Request Body:**
```json
{
  "status": "RELEASED",
  "notes": "Admin notes..."
}
```

---

## Webhooks

### Paystack Webhook
```http
POST /api/webhooks/paystack
```
Handles payment confirmations from Paystack.

### Flutterwave Webhook
```http
POST /api/webhooks/flutterwave
```
Handles payment confirmations from Flutterwave.

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not logged in |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 500 | Server Error - Something went wrong |

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding for production:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

---

## Pagination

Endpoints that return lists support pagination:

**Request:**
```
GET /api/listings?page=2&limit=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
