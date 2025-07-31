# SuvicharSathi Frontend

A complete frontend implementation for the SuvicharSathi service - Daily Marathi सुविचार delivery via WhatsApp.

## 🚀 Features Implemented

### 🔐 Authentication System
- **OTP-based Registration**: Users register with phone number, name, and optional email
- **OTP-based Login**: Secure login using phone number verification
- **Token Management**: JWT token storage and management
- **Auto-logout**: Session management with token expiration

### 💳 Payment Integration
- **Razorpay Integration**: Secure payment processing
- **Multiple Plans**: Monthly (₹49) and Yearly (₹499) subscriptions
- **Payment Verification**: Backend verification of payment success
- **Order Management**: Complete payment flow with order creation

### 📊 User Dashboard
- **Profile Management**: View and edit user information
- **Subscription Status**: Active subscription tracking with progress bars
- **Message History**: View recent सुविचार received
- **Account Settings**: Update name, email, and account preferences
- **Data Export**: Download user data in JSON format

### 🎨 UI/UX Features
- **Responsive Design**: Mobile-first responsive layout
- **Bootstrap 5**: Modern UI components
- **Custom Styling**: Beautiful gradients and animations
- **Real-time Feedback**: Loading states, alerts, and notifications
- **Dynamic Navigation**: Context-aware navigation based on auth status

## 📁 File Structure

```
suvicharsathi/
├── suvicharsathi.html          # Homepage
├── register.html               # User registration with OTP
├── login.html                  # User login with OTP  
├── dashboard.html              # User dashboard
├── pricing.html                # Subscription plans
├── privacy.html                # Privacy policy
├── refund.html                 # Refund policy
├── test.html                   # Frontend testing page
├── assets/
│   ├── css/
│   │   └── styles.css          # Custom styles
│   ├── js/
│   │   ├── api.js              # API service & utilities
│   │   ├── shared.js           # Shared header/footer
│   │   ├── register.js         # Registration functionality
│   │   ├── login.js            # Login functionality
│   │   ├── dashboard.js        # Dashboard functionality
│   │   └── pricing.js          # Payment & subscription
│   └── images/
│       └── logo.png            # SuvicharSathi logo
```

## 🔧 Configuration

### Backend API Configuration
Update the backend URL in `assets/js/api.js`:
```javascript
this.baseURL = 'https://your-backend-url.com';
```

### Razorpay Configuration
Add your Razorpay key in `assets/js/pricing.js`:
```javascript
key: 'rzp_live_your_razorpay_key', // Replace with your key
```

## 🔌 Backend API Integration

The frontend expects the following API endpoints:

### Authentication
- `POST /auth/register/send-otp` - Send registration OTP
- `POST /auth/register/verify-otp` - Verify registration OTP
- `POST /auth/login/send-otp` - Send login OTP
- `POST /auth/login/verify-otp` - Verify login OTP
- `POST /auth/register/resend-otp` - Resend registration OTP
- `POST /auth/login/resend-otp` - Resend login OTP

### User Management
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `DELETE /user/account` - Delete user account

### Subscriptions
- `GET /subscriptions/current` - Get current subscription
- `POST /subscriptions` - Create new subscription
- `POST /subscriptions/{id}/cancel` - Cancel subscription
- `POST /subscriptions/{id}/renew` - Renew subscription

### Payments
- `POST /payments/create-order` - Create payment order
- `POST /payments/verify` - Verify payment
- `GET /payments/history` - Get payment history

### Messages
- `GET /messages/recent` - Get recent messages
- `GET /messages/history` - Get message history
- `GET /messages/stats` - Get message statistics

## 🧪 Testing the Frontend

1. **Without Backend**: Open `test.html` to simulate user flows
2. **With Backend**: Update API configuration and test all flows
3. **Payment Testing**: Use Razorpay test keys for payment flow

### Test User Flow
1. Visit `test.html`
2. Click "Simulate Login & Open Dashboard"
3. Explore dashboard features
4. Test subscription management

## 📱 User Journey

### New User Registration
1. **Homepage** → Click "Register"
2. **Registration** → Enter details, receive OTP
3. **OTP Verification** → Verify phone number
4. **Success** → Redirected to pricing page
5. **Pricing** → Choose plan and payment
6. **Dashboard** → Manage subscription

### Returning User Login
1. **Homepage** → Click "Login"
2. **Login** → Enter phone number, receive OTP
3. **OTP Verification** → Verify identity
4. **Dashboard** → Access account features

## 🎯 Key Features

### OTP System
- 6-digit numeric OTP
- 60-second resend timer
- Auto-submit on complete entry
- Paste support for OTP codes

### Payment Flow
- Razorpay integration
- Order creation and verification
- Subscription activation
- Payment history tracking

### Dashboard Features
- Subscription progress tracking
- Recent सुविचार display
- Profile editing modals
- Account management options

### Responsive Design
- Mobile-first approach
- Bootstrap 5 grid system
- Custom responsive breakpoints
- Touch-friendly interfaces

## 🔧 Customization

### Styling
- Modify `assets/css/styles.css` for custom styling
- Update CSS variables for color scheme changes
- Add custom animations and transitions

### Functionality
- Extend API service in `assets/js/api.js`
- Add new features to dashboard
- Implement additional payment methods

## 🚦 Getting Started

1. **Setup Backend**: Ensure backend is running and accessible
2. **Configure URLs**: Update API base URL in configuration
3. **Add Payment Keys**: Configure Razorpay keys
4. **Test Flow**: Use test.html to verify functionality
5. **Deploy**: Host the frontend files

## 📞 Support

For technical support or questions:
- Email: contact@suyogjoshi.com
- WhatsApp: +91 8975643292

## 📄 License

© 2025 Suyog Joshi. All rights reserved.
