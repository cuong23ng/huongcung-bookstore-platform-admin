# Story 7.1 Testing Guide

## Unit Tests Created

### AdminAuthService Tests
- ✅ Singleton pattern verification
- ✅ `isAuthenticated()` method tests
- ✅ `login()` method tests (success, error, city storage)
- ✅ `logout()` method tests
- ✅ `getAuthData()` method tests

### ApiClient Tests
- ✅ Instance creation and configuration
- ✅ Request interceptor (JWT token injection)
- ✅ Response interceptor (401, 403, network error handling)

## Manual Testing Checklist

### 1. Authentication Flow Testing

#### Test Login
- [ ] Navigate to `/admin/login`
- [ ] Enter valid staff credentials (email + password)
- [ ] Click "Đăng nhập" button
- [ ] **Expected:** Success toast appears, redirects to `/admin/dashboard`
- [ ] **Expected:** User info displayed in dashboard header

#### Test Login Validation
- [ ] Try to login with empty email → Should show validation error
- [ ] Try to login with invalid email format → Should show validation error
- [ ] Try to login with wrong credentials → Should show error toast

#### Test Authentication Persistence
- [ ] Login successfully
- [ ] Refresh the page (F5)
- [ ] **Expected:** Still logged in, dashboard loads with user info

#### Test Logout
- [ ] While logged in, click "Đăng xuất" button
- [ ] **Expected:** Redirects to `/admin/login`
- [ ] **Expected:** Cannot access `/admin/dashboard` without logging in again

### 2. Route Protection Testing

#### Test Protected Routes
- [ ] Without logging in, try to access `/admin/dashboard`
- [ ] **Expected:** Redirects to `/admin/login`

- [ ] Without logging in, try to access `/admin/staff`
- [ ] **Expected:** Redirects to `/admin/login`

#### Test Login Redirect
- [ ] While already logged in, try to access `/admin/login`
- [ ] **Expected:** Redirects to `/admin/dashboard`

### 3. API Client Testing

#### Test Token Injection
- [ ] Login successfully
- [ ] Open browser DevTools → Network tab
- [ ] Make any API call (e.g., navigate to a page that makes API calls)
- [ ] **Expected:** Request headers include `Authorization: Bearer {token}`

#### Test 401 Handling
- [ ] Login successfully
- [ ] Manually clear `admin_token` from localStorage (DevTools → Application → Local Storage)
- [ ] Try to access a protected page
- [ ] **Expected:** Redirects to `/admin/login`

#### Test Error Handling
- [ ] Try to login with invalid credentials
- [ ] **Expected:** Error toast with clear message
- [ ] **Expected:** No crash, app remains functional

### 4. User Info Display Testing

#### Test Dashboard User Info
- [ ] Login as Admin
- [ ] **Expected:** Dashboard shows "Quản trị viên - {Name}"

- [ ] Login as Store Manager
- [ ] **Expected:** Dashboard shows "Quản lý cửa hàng - {Name} - {City}"

- [ ] Login as Support Agent
- [ ] **Expected:** Dashboard shows "Nhân viên hỗ trợ - {Name}"

### 5. Compatibility Testing

#### Test Customer Frontend
- [ ] Navigate to `frontend/hc-bookstore-fe`
- [ ] Run customer frontend app
- [ ] **Expected:** Customer login still works
- [ ] **Expected:** No conflicts with admin auth (different localStorage keys)

### 6. Browser Console Testing

- [ ] Open browser DevTools → Console
- [ ] Navigate through admin app
- [ ] **Expected:** No console errors or warnings
- [ ] **Expected:** No React errors

## Test Results

**Date:** _______________
**Tester:** _______________

### Unit Tests
- [ ] All AdminAuthService tests pass
- [ ] All ApiClient tests pass

### Manual Tests
- [ ] Login flow works correctly
- [ ] Authentication persists across page refresh
- [ ] Logout clears auth state
- [ ] Route protection works
- [ ] Token injection works
- [ ] Error handling works
- [ ] User info displays correctly
- [ ] Customer frontend unaffected
- [ ] No console errors

## Issues Found

_List any issues discovered during testing:_

1. 
2. 
3. 

## Notes

_Additional notes about testing:_



