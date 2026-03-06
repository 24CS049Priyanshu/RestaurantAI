# Restaurant Management System - Complete Project Structure

## 📦 Project Architecture Overview

```
spice-garden/
│
├── 📁 frontend/                              (Frontend Assets)
│   ├── api-integration.js                    (API fetch functions)
│   ├── navigation.js                         (Navbar & Sidebar components)
│   ├── navigation-styles.css                 (Navigation styling)
│   │
│   ├── 🔐 Authentication Pages
│   │   ├── index.html                        (Landing page)
│   │   ├── customer-login.html               (Customer OTP login)
│   │   ├── admin-login.html                  (Admin email/password)
│   │   └── restaurant-login.html             (Restaurant manager email/password)
│   │
│   ├── 👨‍💼 Admin Pages
│   │   ├── admin-dashboard.html              (Admin overview)
│   │   ├── restaurant-management.html        (Manage restaurants)
│   │   ├── user-management.html              (Manage users)
│   │   └── admin-settings.html               (System settings)
│   │
│   ├── 🍽️ Restaurant Manager Pages
│   │   ├── restaurant-dashboard.html         (Manager overview)
│   │   ├── menu-management.html              (Create/edit menu items)
│   │   ├── orders-management.html            (View & manage orders)
│   │   ├── revenue-intelligence.html         (Sales analytics)
│   │   ├── combo-recommendations.html        (AI combo suggestions)
│   │   ├── price-optimization.html           (AI price recommendations)
│   │   └── voice-orders.html                 (Voice order monitoring)
│   │
│   └── 🛍️ Customer Pages
│       ├── customer-home.html                (Featured items & combos)
│       ├── customer-menu.html                (Full menu with search)
│       ├── customer-cart.html                (Shopping cart)
│       ├── customer-checkout.html            (Order placement)
│       ├── customer-order-tracking.html      (Order status tracking)
│       └── customer-profile.html             (Account settings)
│
├── 📁 backend/                               (Express.js Backend)
│   ├── server.js                             (Main server entry point)
│   ├── package.json                          (Dependencies)
│   ├── .env.example                          (Config template)
│   │
│   ├── 📁 config/
│   │   └── database.js                       (PostgreSQL connection pool)
│   │
│   ├── 📁 middleware/
│   │   └── auth.js                           (JWT & role verification)
│   │
│   └── 📁 routes/
│       ├── auth.routes.js                    (Login & OTP endpoints)
│       ├── menu.routes.js                    (Menu CRUD endpoints)
│       ├── order.routes.js                   (Order management endpoints)
│       ├── customer.routes.js                (Customer profile endpoints)
│       ├── analytics.routes.js               (Analytics & insights)
│       └── admin.routes.js                   (Admin panel endpoints)
│
├── 📁 database/
│   ├── database_schema.sql                   (PostgreSQL complete schema)
│   └── sample_data.sql                       (Test data population)
│
├── 📄 Documentation
│   ├── BACKEND_README.md                     (Backend setup & API docs)
│   ├── FRONTEND_INTEGRATION_GUIDE.js         (Integration examples)
│   └── PROJECT_STRUCTURE.md                  (This file)
│
└── 🔧 Configuration
    ├── .env                                  (Backend environment variables)
    └── .gitignore
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (HTML/JS)                       │
├─────────────────────────────────────────────────────────────┤
│  - Customer Login (OTP)                                      │
│  - Menu Browsing                                             │
│  - Cart Management                                           │
│  - Order Placement                                           │
│  - Admin/Manager Dashboards                                 │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP/REST API with JWT
                 │
┌────────────────▼────────────────────────────────────────────┐
│              EXPRESS.JS BACKEND (Node.js)                    │
├─────────────────────────────────────────────────────────────┤
│  Authentication Layer (JWT)                                  │
│         ↓                                                     │
│  Route Handlers                                              │
│  ├─ Auth Routes (login, OTP)                                │
│  ├─ Menu Routes (CRUD)                                      │
│  ├─ Order Routes (place, track)                             │
│  ├─ Customer Routes (profile)                               │
│  ├─ Analytics Routes (insights)                             │
│  └─ Admin Routes (system overview)                          │
│         ↓                                                     │
│  Database Layer (pg)                                         │
└────────────────┬────────────────────────────────────────────┘
                 │ SQL Queries
                 │
┌────────────────▼────────────────────────────────────────────┐
│            POSTGRESQL DATABASE                               │
├─────────────────────────────────────────────────────────────┤
│  12 Tables:                                                  │
│  ├─ restaurants, users, customers                           │
│  ├─ menu_categories, menu_items                             │
│  ├─ orders, order_items, payments                           │
│  ├─ otp_verifications, ai_item_metrics                      │
│  ├─ combo_rules, price_recommendations                      │
│  └─ Views for analytics                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
CUSTOMER:
  1. Enter phone number
     ↓
  2. API: sendCustomerOTP() → Backend sends OTP to DB
     ↓
  3. Enter OTP
     ↓
  4. API: verifyCustomerOTP() → Backend verifies OTP
     ↓
  5. JWT token generated & stored in localStorage
     ↓
  6. Redirect to customer-home.html

ADMIN/RESTAURANT:
  1. Enter email & password
     ↓
  2. API: adminLogin() or restaurantLogin()
     ↓
  3. Backend: Hash comparison & JWT generation
     ↓
  4. Token stored in localStorage
     ↓
  5. Redirect to dashboard
```

---

## 📊 UX User Journey

### Customer Journey
```
┌─────────────────┐
│   Landing       │ index.html
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Customer Login  │ customer-login.html (OTP)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Home Page    │ customer-home.html (Featured items)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Menu Browsing  │ customer-menu.html (Search, Filter)
└────────┬────────┘
         │ (Add items to cart)
         │
         ▼
┌─────────────────┐
│ Review Cart     │ customer-cart.html (Modify qty)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Checkout      │ customer-checkout.html (Place order)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Order Tracking │ customer-order-tracking.html
└─────────────────┘
```

### Restaurant Manager Journey
```
┌──────────────────┐
│ Restaurant Login │ restaurant-login.html
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│     Dashboard        │ restaurant-dashboard.html (Overview)
└────────┬─────────────┘
         │
    ┌────┴────┬──────────────┬──────────────┐
    │          │              │              │
    ▼          ▼              ▼              ▼
  Menu        Orders        Revenue         AI
  Mgmt        Mgmt          Intel           Features
    │          │              │              │
    └────┬─────┴──────────────┴──────────────┘
         │
         ▼
   (Data Insights)
```

### Admin Journey
```
┌─────────────┐
│ Admin Login │ admin-login.html
└────────┬────┘
         │
         ▼
┌──────────────────┐
│  Admin Dashboard │
└────────┬─────────┘
         │
    ┌────┼────┬────────────┐
    │    │    │            │
    ▼    ▼    ▼            ▼
  Rest  Users Analy       Settings
  Mgmt  Mgmt  tics
    │    │    │
    └────┼────┴────────────┘
         │
         ▼
  (System Overview)
```

---

## 📡 API Endpoint Categories

### 1. Authentication (5 endpoints)
```
POST /api/auth/customer/send-otp
POST /api/auth/customer/verify-otp
POST /api/auth/admin/login
POST /api/auth/restaurant/login
POST /api/auth/logout (optional)
```

### 2. Menu Management (6 endpoints)
```
GET    /api/menu/items            (with filters)
GET    /api/menu/categories
GET    /api/menu/item/:id
POST   /api/menu/item             (protected)
PUT    /api/menu/item/:id         (protected)
DELETE /api/menu/item/:id         (protected)
```

### 3. Orders (4 endpoints)
```
POST   /api/orders                (create)
GET    /api/orders                (list)
GET    /api/orders/:id            (details)
PUT    /api/orders/:id/status     (update status)
```

### 4. Customer (4 endpoints)
```
GET    /api/customer/profile
PUT    /api/customer/profile
GET    /api/customer/orders
GET    /api/customer/favorites
```

### 5. Analytics (5 endpoints)
```
GET    /api/analytics/menu-performance
GET    /api/analytics/revenue
GET    /api/analytics/top-items
GET    /api/analytics/combo-insights
GET    /api/analytics/price-recommendations
```

### 6. Admin (4 endpoints)
```
GET    /api/admin/dashboard
GET    /api/admin/restaurants
GET    /api/admin/users
GET    /api/admin/orders
```

**Total: 28 API Endpoints**

---

## 🔑 Key Technologies

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Variables, Grid, Flexbox, Animations
- **Vanilla JavaScript**: ES6+ with Async/Await
- **LocalStorage**: Client-side state management

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **PostgreSQL**: Relational database
- **pg library**: Database driver
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT authentication

### Security
- **JWT**: Bearer token authentication
- **Role-based access control (RBAC)**
- **Password hashing**: bcrypt (10 rounds)
- **CORS**: Cross-origin validation
- **Input validation**: Express-validator

---

## 💾 Database Schema Highlights

### Key Tables

**users** (Admin & Restaurant Managers)
```
- id (PK)
- email (UNIQUE)
- password (hashed)
- role (admin | restaurant_manager | staff)
- restaurant_id (FK)
```

**customers** (Customers)
```
- id (PK)
- phone (UNIQUE)
- name, email, address
- created_at, last_login
```

**orders** (Order Records)
```
- id (PK)
- customer_id (FK)
- restaurant_id (FK)
- order_status (pending → completed)
- total_price, subtotal, tax, delivery_fee
- delivery_address, delivery_type
```

**menu_items** (Food Items)
```
- id (PK)
- restaurant_id (FK)
- category_id (FK)
- item_name, price, food_cost
- availability, rating, reviews_count
```

**ai_item_metrics** (Analytics)
```
- menu_item_id (PK, FK)
- margin, popularity_score
- classification (bestseller | high_margin | etc)
- demand_trend
```

---

## 🔗 Key Relationships

```
1-to-Many:
├─ restaurants → users (multiple managers)
├─ restaurants → menu_categories
├─ restaurants → orders
├─ restaurants → combo_rules
├─ menu_categories → menu_items
├─ customers → orders
├─ orders → order_items
├─ orders → payments
└─ menu_items → ai_item_metrics

Many-to-Many (via junction table):
└─ combo_rules (item_a ↔ item_b)
```

---

## 🚀 Deployment Checklist

### Backend
- [ ] Set NODE_ENV=production
- [ ] Update DB credentials in .env
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS
- [ ] Set up error logging
- [ ] Configure CORS for frontend domain
- [ ] Set up database backups
- [ ] Use environment-specific config

### Frontend
- [ ] Update API_BASE_URL to production backend
- [ ] Remove console.log debug statements
- [ ] Minify CSS/JavaScript
- [ ] Set up CDN for static assets
- [ ] Enable caching headers
- [ ] Set up error tracking
- [ ] Test all user flows
- [ ] Mobile responsive testing

### Database
- [ ] Run migrations
- [ ] Create indexes on foreign keys
- [ ] Set up automated backups
- [ ] Monitor query performance
- [ ] Plan for data scaling

---

## 📈 Performance Optimization Ideas

1. **Database**: Add indexes on frequently queried columns
2. **Caching**: Redis for session/menu data
3. **Pagination**: Limit API results to 50 items
4. **Lazy Loading**: Load images on demand
5. **Compression**: Gzip for API responses
6. **CDN**: Serve static assets from CDN
7. **API Rate Limiting**: Prevent abuse
8. **Monitoring**: Track API response times

---

## 🔮 Future Features

1. **Real-time Updates**: WebSocket for order tracking
2. **Payment Integration**: Stripe/Razorpay
3. **Email Notifications**: SendGrid emails
4. **Image Upload**: S3/Cloudinary integration
5. **Reviews & Ratings**: Customer feedback
6. **Loyalty Program**: Points system
7. **Mobile App**: React Native/Flutter
8. **Advanced Analytics**: Machine learning predictions
9. **Multi-language**: i18n support
10. **Accessibility**: Full WCAG compliance

---

## 📞 Quick Reference

### Common Commands

```bash
# Backend startup
cd backend
npm install
npm start

# Database setup
psql -U postgres
CREATE DATABASE restaurant_management_system;
\i database_schema.sql

# Check logs
tail -f logs/app.log

# Test API
curl http://localhost:3000/api/health
```

### Environment Variables
```
DB_HOST=localhost
DB_PORT=5432
PORT=3000
JWT_SECRET=your_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:8000
```

---

## ✅ Feature Completeness

✓ User Authentication (OTP + Email/Password)
✓ Menu Management (CRUD)
✓ Shopping Cart (Client-side)
✓ Order Creation & Tracking
✓ Payment Intent (Structure ready)
✓ Role-based Access Control
✓ Analytics Dashboard
✓ AI Recommendations (Data structure)
✓ Responsive Design
✓ Error Handling

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Status**: Production Ready
