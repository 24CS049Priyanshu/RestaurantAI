# Restaurant Management System - Complete Architecture

## 📋 Project Overview

A full-stack restaurant management system built with:
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL

---

## 📁 Backend Folder Structure

```
backend/
├── server.js                 # Main Express server
├── package.json              # Dependencies
├── .env.example              # Environment variables template
├── config/
│   └── database.js           # PostgreSQL connection
├── middleware/
│   └── auth.js               # JWT authentication & role verification
├── routes/
│   ├── auth.routes.js        # Authentication endpoints
│   ├── menu.routes.js        # Menu management endpoints
│   ├── order.routes.js       # Order management endpoints
│   ├── customer.routes.js    # Customer profile endpoints
│   ├── analytics.routes.js   # Analytics endpoints
│   └── admin.routes.js       # Admin panel endpoints
├── controllers/              # (Optional) Business logic
├── models/                   # (Optional) Database models
└── migrations/               # Database migrations
```

---

## 🗄️ Database Schema

### Tables Created:

1. **restaurants** - Restaurant information
2. **users** - Admin & Restaurant Manager accounts
3. **customers** - Customer data
4. **otp_verifications** - OTP login verification
5. **menu_categories** - Food categories
6. **menu_items** - Individual menu items with pricing
7. **orders** - Customer orders
8. **order_items** - Items within an order
9. **payments** - Payment information
10. **ai_item_metrics** - AI-generated item analytics
11. **combo_rules** - Product combo recommendations
12. **price_recommendations** - AI price optimization

### Key Relationships:
```
restaurants ──────┬──→ users
                  ├──→ menu_categories → menu_items
                  └──→ orders

customers ────────→ orders ────────→ order_items
                                          ├──→ menu_items
                                          └──→ payments
```

---

## 🚀 Setup Instructions

### 1. Database Setup

```sql
-- Create database
CREATE DATABASE restaurant_management_system;

-- Connect to database
\c restaurant_management_system

-- Run schema script
\i database_schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Update .env with your database credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_management_system
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_key

# Start server
npm start
# or for development with auto-reload
npm run dev
```

### 3. Frontend Setup

Include these files in your HTML pages:

```html
<!-- In your HTML head or body -->
<script src="frontend/api-integration.js"></script>
<script src="frontend/navigation.js"></script>
<link rel="stylesheet" href="frontend/navigation-styles.css">

<!-- Initialize on page load -->
<script>
  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
  });
</script>
```

---

## 🔐 Authentication Flow

### Customer Login (OTP-based)

```javascript
// Step 1: Request OTP
await sendCustomerOTP('9876543210');

// Step 2: Verify OTP
await verifyCustomerOTP('9876543210', '123456');

// Token stored in localStorage
localStorage.getItem('authToken')
```

### Admin/Restaurant Manager Login

```javascript
// Email & password auth
await adminLogin('admin@system.com', 'password');
await restaurantLogin('manager@restaurant.com', 'password');
```

---

##️ API Endpoints

### Authentication
```
POST   /api/auth/customer/send-otp
POST   /api/auth/customer/verify-otp
POST   /api/auth/admin/login
POST   /api/auth/restaurant/login
```

### Menu Management
```
GET    /api/menu/items              (with filters)
GET    /api/menu/categories
GET    /api/menu/item/:id
POST   /api/menu/item               (protected)
PUT    /api/menu/item/:id           (protected)
DELETE /api/menu/item/:id           (protected)
```

### Orders
```
POST   /api/orders                  (create order)
GET    /api/orders                  (list orders)
GET    /api/orders/:id              (order details)
PUT    /api/orders/:id/status       (update status)
```

### Customer
```
GET    /api/customer/profile
PUT    /api/customer/profile
GET    /api/customer/orders
GET    /api/customer/favorites
```

### Analytics
```
GET    /api/analytics/menu-performance
GET    /api/analytics/revenue
GET    /api/analytics/top-items
GET    /api/analytics/combo-insights
GET    /api/analytics/price-recommendations
```

### Admin
```
GET    /api/admin/dashboard
GET    /api/admin/restaurants
GET    /api/admin/users
GET    /api/admin/orders
GET    /api/admin/system-analytics
```

---

## 📱 Frontend Integration Examples

### 1. Login Page (`customer-login.html`)

```javascript
// HTML
<form onsubmit="handleLoginSubmit(event)">
  <input type="tel" id="phone" placeholder="Phone">
  <button type="button" onclick="requestOTP()">Send OTP</button>
  
  <input type="text" id="otp" placeholder="Enter OTP" style="display:none;" id="otpInput">
  <button type="submit" id="verifyBtn" style="display:none;">Verify & Login</button>
</form>

// JavaScript
async function requestOTP() {
  const phone = document.getElementById('phone').value;
  const success = await sendCustomerOTP(phone);
  if (success) {
    document.getElementById('otpInput').style.display = 'block';
    document.getElementById('verifyBtn').style.display = 'block';
  }
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const phone = document.getElementById('phone').value;
  const otp = document.getElementById('otp').value;
  verifyCustomerOTP(phone, otp);
}
```

### 2. Menu Page (`customer-menu.html`)

```javascript
// Load menu on page load
document.addEventListener('DOMContentLoaded', async () => {
  await fetchMenuCategories(1); // Restaurant ID = 1
  await fetchMenuItems(1);
});

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
  fetchMenuItems(1, null, e.target.value);
});

// Category filter
document.querySelectorAll('.category-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const categoryId = e.target.dataset.categoryId;
    fetchMenuItems(1, categoryId);
  });
});
```

### 3. Checkout Page (`customer-checkout.html`)

```javascript
async function handleCheckout(e) {
  e.preventDefault();

  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const orderData = {
    restaurantId: 1,
    items: cart.map(item => ({
      menuItemId: item.id,
      quantity: item.quantity
    })),
    deliveryAddress: document.getElementById('address').value,
    deliveryType: document.querySelector('input[name="delivery"]:checked').value,
    paymentMethod: document.getElementById('paymentMethod').value
  };

  await createOrder(orderData);
}
```

### 4. Restaurant Dashboard (`restaurant-dashboard.html`)

```javascript
// Protect page for restaurant managers only
protectPage('restaurant_manager');

// Load analytics
document.addEventListener('DOMContentLoaded', async () => {
  await fetchMenuPerformance();
  await fetchTopItems();
  await fetchRevenueAnalytics('30');
});
```

---

## 🛡️ JWT Token Structure

```javascript
{
  id: 123,
  email: "user@example.com",
  role: "admin|restaurant_manager|customer",
  restaurantId: 5,
  iat: 1699000000,
  exp: 1699086400
}
```

### Token Usage:
```javascript
// Automatically added by fetch wrapper
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
};
```

---

## 🧭 Navigation Structure

### Admin User
```
Dashboard
├─ Restaurants
├─ Users
├─ Analytics
└─ Settings
```

### Restaurant Manager
```
Dashboard
├─ Menu Management
├─ Orders
├─ Revenue Intelligence
├─ AI Features
│  ├─ Combo Recommendations
│  ├─ Price Optimization
│  └─ Voice Orders
```

### Customer
```
Home
├─ Menu
├─ Orders
└─ Account
```

---

## 🔄 User Journey Examples

### Customer Ordering Flow

```
1. customer-login.html
   ↓ (OTP verification)
2. customer-home.html
   ↓ (Browse featured items)
3. customer-menu.html
   ↓ (Select items, add to cart)
4. customer-cart.html
   ↓ (Review & modify cart)
5. customer-checkout.html
   ↓ (Enter delivery info, place order)
6. customer-order-tracking.html
   ↓ (Monitor order status)
```

### Restaurant Manager Flow

```
1. restaurant-login.html
   ↓ (Email/password)
2. restaurant-dashboard.html
   ↓ (View analytics & orders)
3. menu-management.html
   ↓ (Create/edit items)
4. orders-management.html
   ↓ (Update order status)
5. revenue-intelligence.html
   ↓ (View sales data)
6. combo-recommendations.html
   ↓ (Apply AI suggestions)
```

---

## 📊 Sample API Responses

### Create Order
```javascript
POST /api/orders
{
  success: true,
  data: {
    id: 42,
    customer_id: 5,
    restaurant_id: 1,
    order_status: "pending",
    total_price: 860,
    created_at: "2024-01-15T10:30:00Z"
  }
}
```

### Fetch Menu Items
```javascript
GET /api/menu/items?restaurantId=1&search=butter
{
  success: true,
  data: [
    {
      id: 1,
      item_name: "Butter Chicken",
      price: 280,
      icon: "🍗",
      rating: 4.8,
      reviews_count: 245
    }
  ]
}
```

### Menu Performance Analytics
```javascript
GET /api/analytics/menu-performance
{
  success: true,
  data: [
    {
      id: 1,
      item_name: "Butter Chicken",
      total_orders: 450,
      margin_percentage: 67.86,
      popularity_score: 0.95,
      classification: "bestseller"
    }
  ]
}
```

---

## ✅ Environment Variables

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_management_system
DB_USER=postgres
DB_PASSWORD=password

PORT=3000
NODE_ENV=development

JWT_SECRET=your_secret_key_here
JWT_EXPIRE=24h

OTP_EXPIRE_MINUTES=5
OTP_MAX_ATTEMPTS=3

FRONTEND_URL=http://localhost:8000
```

---

## 🐛 Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Verify credentials in `.env`
- Check database exists: `CREATE DATABASE restaurant_management_system;`

### CORS Issues
- Update `FRONTEND_URL` in `.env`
- Ensure backend CORS configuration matches frontend URL

### JWT Token Issues
- Clear localStorage and re-login
- Check token expiration: `JWT_EXPIRE=24h`
- Verify secret key matches

### Menu Items Not Loading
- Check restaurant exists in database
- Verify menu items are marked as `is_active = true`
- Check `availability = true`

---

## 📚 Further Development

### Add-ons to Implement:
1. **Email Notifications** - Order status updates via email
2. **Payment Gateway** - Stripe/Razorpay integration
3. **Real-time Updates** - WebSocket for live order tracking
4. **Image Upload** - S3/Cloudinary for menu item images
5. **Reviews & Ratings** - Customer feedback system
6. **Loyalty Program** - Points & rewards system
7. **Admin Reports** - PDF generation for analytics
8. **Mobile App** - React Native/Flutter adaptation

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check console logs for errors
4. Verify all environment variables

---

**Last Updated**: January 2024
**Version**: 1.0.0
