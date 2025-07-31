# SuvicharSathi API Integration Analysis

## 🔍 Swagger API vs Current Implementation Analysis

Based on the complete Swagger documentation, here are the discrepancies and fixes needed:

---

## ✅ CORRECT IMPLEMENTATIONS

### 1. `/auth/register/send-otp` - ✅ FIXED
**Swagger Schema:** `OTPRegistrationRequest`
```json
{
  "phone_number": "string",
  "name": "string", 
  "email": "string|null",
  "preferred_language": "string" (default: "marathi")
}
```
**Current Implementation:** ✅ CORRECT (after fix)

### 2. `/auth/register/verify-otp` - ✅ FIXED  
**Swagger Schema:** `OTPVerificationRequest`
```json
{
  "phone_number": "string",
  "otp_code": "string"
}
```
**Current Implementation:** ✅ CORRECT (after fix)

### 3. `/auth/login/send-otp` - ✅ CORRECT
**Swagger Schema:** `OTPLoginRequest`
```json
{
  "phone_number": "string"
}
```
**Current Implementation:** ✅ CORRECT

---

## ❌ INCORRECT IMPLEMENTATIONS - NEED FIXES

### 4. `/auth/login/verify-otp` - ❌ WRONG FIELD NAME
**Swagger Schema:** `OTPVerificationRequest` 
```json
{
  "phone_number": "string",
  "otp_code": "string"  // ← Should be otp_code
}
```
**Current Implementation:** ❌ WRONG
```javascript
body: JSON.stringify({
  phone_number: phoneNumber,
  otp: otp  // ← Should be otp_code
})
```

### 5. `/auth/resend-otp` - ❌ WRONG ENDPOINT
**Swagger Available:** `/auth/resend-otp` (single endpoint)
**Current Implementation:** ❌ WRONG
```javascript
// Using non-existent endpoints:
const endpoint = type === 'register' ? '/auth/register/resend-otp' : '/auth/login/resend-otp';
```
**Should be:** `/auth/resend-otp` (one endpoint for both)

---

## 🚫 MISSING ENDPOINTS IN CURRENT IMPLEMENTATION

### 6. `/auth/test-otp` - GET
**Description:** Test OTP service functionality
**Usage:** Can be used to get latest generated OTP for testing

### 7. `/auth/register` - POST (Alternative registration)
**Schema:** `UserRegisterRequest`

### 8. `/auth/login` - POST (Alternative login)
**Schema:** `UserLoginRequest`

### 9. `/auth/refresh` - POST
**Description:** Refresh access token

### 10. `/auth/logout` - POST
**Description:** Logout user

### 11. `/auth/me` - GET
**Description:** Get current user profile

---

## 🛠️ PAYMENT & SUBSCRIPTION APIs (Not Implemented)

### Missing Payment Endpoints:
- `/payments/initiate` - POST
- `/payments/verify` - POST
- `/payments/callback` - POST

### Missing Subscription Endpoints:
- `/subscriptions/plans` - GET
- `/subscriptions/create` - POST
- `/subscriptions/cancel/{subscription_id}` - POST
- `/subscriptions/current` - GET

---

## 🎯 PRIORITY FIXES NEEDED

### IMMEDIATE (Critical):
1. **Fix `/auth/login/verify-otp`** - Change `otp` to `otp_code`
2. **Fix `/auth/resend-otp`** - Use single endpoint instead of separate ones

### HIGH PRIORITY:
3. **Add `/auth/test-otp`** - For development/testing OTP
4. **Add `/auth/me`** - For user profile
5. **Add payment endpoints** - For subscription flow

### MEDIUM PRIORITY:
6. **Add `/auth/refresh`** - For token management
7. **Add `/auth/logout`** - For proper logout
8. **Add subscription management** - For user dashboard

---

## 📋 RECOMMENDED FIXES

### Fix 1: Login OTP Verification
```javascript
async verifyLoginOTP(phoneNumber, otp) {
  const result = await this.makeRequest('/auth/login/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      phone_number: phoneNumber,
      otp_code: otp  // ← FIXED: Changed from 'otp' to 'otp_code'
    })
  });
  // ... rest unchanged
}
```

### Fix 2: Resend OTP
```javascript
async resendOTP(phoneNumber) {
  return this.makeRequest('/auth/resend-otp', {  // ← FIXED: Single endpoint
    method: 'POST',
    body: JSON.stringify({
      phone_number: phoneNumber
    })
  });
}
```

### Fix 3: Add Test OTP (for development)
```javascript
async getTestOTP() {
  return this.makeRequest('/auth/test-otp', {
    method: 'GET'
  });
}
```

### Fix 4: Add User Profile
```javascript
async getCurrentUser() {
  return this.makeRequest('/auth/me', {
    method: 'GET'
  });
}
```

---

## 🎯 IMPLEMENTATION STATUS

| Endpoint | Status | Priority | Notes |
|----------|--------|----------|-------|
| `/auth/register/send-otp` | ✅ FIXED | DONE | Field name corrected |
| `/auth/register/verify-otp` | ✅ FIXED | DONE | Field name corrected |
| `/auth/login/send-otp` | ✅ CORRECT | DONE | Working correctly |
| `/auth/login/verify-otp` | ❌ NEEDS FIX | HIGH | Wrong field name |
| `/auth/resend-otp` | ❌ NEEDS FIX | HIGH | Wrong endpoint |
| `/auth/test-otp` | ❌ MISSING | MEDIUM | For development |
| `/auth/me` | ❌ MISSING | HIGH | For user profile |
| Payment APIs | ❌ MISSING | HIGH | For subscriptions |
