# 🍽️ Restaurant AI Management System

A full-stack, intelligent restaurant management platform with AI-powered features for pricing optimization, combo recommendations, and voice order processing. Built for restaurants of all sizes to streamline operations and enhance customer experience.

---

## ✨ Key Features

### 👨‍💼 **Admin Dashboard**
- Multi-restaurant management
- User account administration
- System-wide analytics and reporting
- Revenue intelligence across all restaurants

### 🏪 **Restaurant Manager Portal**
- **Menu Management**: Create, edit, and organize menu items
- **Order Management**: Real-time order tracking and fulfillment
- **AI-Powered Insights**:
  - Combo Recommendations (smart product bundling)
  - Price Optimization (dynamic pricing suggestions)
  - Revenue Intelligence (sales analytics & trends)
  - Voice Order Processing (speech-to-text ordering)
- Customer feedback monitoring

### 🛍️ **Customer Interface**
- OTP-based login (no passwords needed)
- Browse featured items and combo offers
- Full menu with search and filtering
- Shopping cart with real-time pricing
- Secure checkout process
- Order tracking in real-time
- Order history and reorder functionality

### 🔐 **Security Features**
- JWT-based authentication
- Role-based access control (Admin, Restaurant Manager, Customer)
- OTP verification for customer login
- Bcrypt password hashing
- CORS protection

---

## 🛠️ Technology Stack

### **Frontend**
- HTML5, CSS3, JavaScript (Vanilla)
- RESTful API integration
- Responsive design for mobile and desktop

### **Backend**
- Node.js & Express.js
- PostgreSQL database
- JWT authentication
- Socket.io for real-time features

### **DevOps**
- Environment-based configuration (.env)
- Nodemon for development
- Jest for testing

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)

---

## 🚀 Installation & Setup

### 1. **Clone the Repository**
```bash
git clone https://github.com/24CS049Priyanshu/RestaurantAI.git
cd RestaurantAI
```

### 2. **Database Setup**

Create a PostgreSQL database:
```bash
psql -U postgres
```

Inside PostgreSQL shell:
```sql
CREATE DATABASE restaurant_management_system;
\c restaurant_management_system

-- Run the schema file
\i database_schema.sql
```

Or from command line:
```bash
psql -U postgres -d restaurant_management_system -f database_schema.sql
```

### 3. **Backend Setup**

```bash
cd backend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Edit .env with your configuration
```

### 4. **Configure Environment Variables**

Edit `backend/.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_management_system
DB_USER=postgres
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Optional: Mail service, third-party APIs
MAIL_SERVICE=your_service
API_KEY=your_api_key
```

### 5. **Start the Backend Server**

```bash
# Development mode (with hot reload)
npm run dev

# OR Production mode
npm start
```

The server will run on `http://localhost:5000`

### 6. **Access the Frontend**

Open `frontend/index.html` in your browser or serve it with a local server:

```bash
# Using Python (if installed)
python -m http.server 8000

# OR using Node.js http-server
npx http-server frontend
```

Then navigate to `http://localhost:8000` (or your chosen port)

---

## 📁 Project Structure

```
├── frontend/                          # Frontend Assets
│   ├── index.html                     # Landing page
│   ├── api-integration.js             # API communication layer
│   ├── navigation.js                  # UI components
│   │
│   ├── 🔐 Authentication Pages
│   │   ├── admin-login.html
│   │   ├── customer-login.html
│   │   └── restaurant-login.html
│   │
│   ├── 👨‍💼 Admin Pages
│   │   ├── admin-dashboard.html
│   │   ├── admin-restaurants.html
│   │   └── admin-users.html
│   │
│   ├── 🏪 Restaurant Manager Pages
│   │   ├── restaurant-dashboard.html
│   │   ├── restaurant-menu.html
│   │   ├── restaurant-orders.html
│   │   ├── combo-recommendations.html
│   │   ├── price-optimization.html
│   │   ├── revenue-intelligence.html
│   │   └── voice-orders.html
│   │
│   └── 🛍️ Customer Pages
│       ├── customer-home.html
│       ├── customer-menu.html
│       ├── customer-cart.html
│       ├── customer-checkout.html
│       └── customer-order-tracking.html
│
├── backend/                           # Express.js Backend
│   ├── server.js                      # Main server entry point
│   ├── package.json                   # Dependencies
│   ├── .env.example                   # Config template
│   │
│   ├── config/
│   │   └── database.js                # PostgreSQL connection
│   │
│   ├── middleware/
│   │   └── auth.js                    # JWT authentication
│   │
│   └── routes/
│       ├── auth.routes.js             # Login & OTP
│       ├── menu.routes.js             # Menu CRUD
│       ├── order.routes.js            # Order processing
│       ├── customer.routes.js         # Customer profiles
│       ├── analytics.routes.js        # Analytics & insights
│       └── admin.routes.js            # Admin operations
│
├── database_schema.sql                # PostgreSQL schema
├── restaurant_ai_schema.sql           # AI metrics schema
├── BACKEND_README.md                  # Backend documentation
├── FRONTEND_INTEGRATION_GUIDE.js      # Integration examples
└── PROJECT_STRUCTURE.md               # Detailed architecture
```

---

## 🔌 API Endpoints Overview

### **Authentication**
```
POST   /api/auth/login          # Admin/Manager login
POST   /api/auth/customer-otp   # Customer OTP request
POST   /api/auth/verify-otp     # OTP verification
POST   /api/auth/logout         # Logout
```

### **Menu Management**
```
GET    /api/menu/items          # Get all menu items
POST   /api/menu/items          # Create menu item
PUT    /api/menu/items/:id      # Update menu item
DELETE /api/menu/items/:id      # Delete menu item
GET    /api/menu/categories     # Get categories
```

### **Orders**
```
POST   /api/orders              # Place order
GET    /api/orders              # Get user orders
GET    /api/orders/:id          # Order details
PUT    /api/orders/:id/status   # Update order status
GET    /api/orders/track/:id    # Track order
```

### **Analytics & AI**
```
GET    /api/analytics/revenue   # Revenue dashboard
GET    /api/analytics/items     # Item analytics
GET    /api/ai/combos           # Combo recommendations
GET    /api/ai/pricing          # Price optimization
```

For detailed API documentation, see [BACKEND_README.md](./BACKEND_README.md)

---

## 📊 Database Schema Highlights

### Key Tables:
- **restaurants** - Restaurant information and settings
- **users** - Admin and Manager accounts
- **customers** - Customer profiles
- **menu_items** - Products with pricing
- **orders** - Customer orders with status
- **order_items** - Individual items in orders
- **ai_item_metrics** - Analytics for AI features
- **combo_rules** - Combo recommendations
- **price_recommendations** - AI price suggestions

See [database_schema.sql](./database_schema.sql) for complete schema definition.

---

## 🧪 Testing

Run tests with:
```bash
cd backend
npm test
```

---

## 🔄 Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit:
   ```bash
   git add .
   git commit -m "Add your feature description"
   ```

3. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request** on GitHub

---

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` \| `production` |
| `DB_HOST` | Database hostname | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `restaurant_management_system` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `your_password` |
| `JWT_SECRET` | JWT signing key | `your_secret_key` |

---

## 🚨 Troubleshooting

### Backend won't start
- Ensure PostgreSQL is running
- Check `.env` file configuration
- Verify database credentials
- Check if port 5000 is already in use

### API returns 401 Unauthorized
- Verify JWT token in request headers
- Check if token has expired
- Ensure correct role for the endpoint

### Database connection errors
- Confirm PostgreSQL service is running
- Verify database exists: `\l` in psql
- Check credentials in `.env`

### Frontend won't load
- Ensure backend is running on correct port
- Check browser console for CORS errors
- Verify API endpoints in `api-integration.js`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 📧 Support & Contact

- **Issues**: Create an issue on GitHub
- **Email**: your-email@example.com
- **Documentation**: See [BACKEND_README.md](./BACKEND_README.md) and [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Google Maps integration
- [ ] Advanced AI personalization
- [ ] Payment gateway integration
- [ ] Delivery partner integration
- [ ] SMS notifications
- [ ] Push notifications
- [ ] Performance optimization

---

## 🏆 Acknowledgments

- Built with ❤️ for RestaurantAI
- Inspired by modern restaurant management solutions
- Python based AI recommendations engine

---

**Made with ❤️ | Star ⭐ if you find this helpful!**
