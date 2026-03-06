/**
 * ═══════════════════════════════════════════════════════════════
 * FRONTEND-BACKEND INTEGRATION GUIDE
 * Complete Step-by-Step Implementation
 * ═══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// STEP 1: UPDATE LOGIN PAGES
// ═══════════════════════════════════════════════════════════════

/* ── File: customer-login.html ──────────────────────────────── */

const customerLoginPage = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Customer Login - Spice Garden</title>
    <!-- Include API integration -->
    <script src="frontend/api-integration.js"></script>
</head>
<body>
    <div class="login-container">
        <h1>🍜 Customer Login</h1>
        
        <form id="otpForm" onsubmit="handleLoginSubmit(event)">
            <!-- Step 1: Phone Input -->
            <div id="phoneStep">
                <input type="tel" 
                       id="phoneInput" 
                       placeholder="Enter 10-digit phone number"
                       maxlength="10"
                       required>
                <button type="button" onclick="handleSendOTP()" class="btn-primary">
                    Send OTP
                </button>
            </div>

            <!-- Step 2: OTP Verification (Hidden initially) -->
            <div id="otpStep" style="display: none;">
                <input type="text" 
                       id="otpInput" 
                       placeholder="Enter 6-digit OTP"
                       maxlength="6"
                       required>
                <button type="submit" class="btn-primary">
                    Verify & Login
                </button>
                <button type="button" onclick="goBackToPhone()" class="btn-secondary">
                    Change Phone
                </button>
            </div>

            <p id="errorMessage" class="error-message"></p>
        </form>

        <div class="links">
            <a href="index.html">Back to Home</a>
            <a href="restaurant-login.html">Restaurant Login</a>
            <a href="admin-login.html">Admin Login</a>
        </div>
    </div>

    <script>
        // Global phone variable
        let currentPhone = '';

        async function handleSendOTP() {
            const phone = document.getElementById('phoneInput').value;
            const errorMsg = document.getElementById('errorMessage');

            if (phone.length !== 10 || !/^[0-9]{10}$/.test(phone)) {
                errorMsg.textContent = '❌ Please enter a valid 10-digit phone number';
                return;
            }

            errorMsg.textContent = '';
            currentPhone = phone;

            // Call API to send OTP
            const success = await sendCustomerOTP(phone);
            
            if (success) {
                // Show OTP step
                document.getElementById('phoneStep').style.display = 'none';
                document.getElementById('otpStep').style.display = 'block';
                errorMsg.textContent = '✓ OTP sent successfully! Check your phone.';
                errorMsg.style.color = '#22c55e';
            }
        }

        function goBackToPhone() {
            document.getElementById('phoneStep').style.display = 'block';
            document.getElementById('otpStep').style.display = 'none';
            document.getElementById('otpInput').value = '';
            document.getElementById('errorMessage').textContent = '';
        }

        async function handleLoginSubmit(e) {
            e.preventDefault();
            
            const otp = document.getElementById('otpInput').value;
            const errorMsg = document.getElementById('errorMessage');

            if (otp.length !== 6 || !/^[0-9]{6}$/.test(otp)) {
                errorMsg.textContent = '❌ Please enter a valid 6-digit OTP';
                return;
            }

            // Call API to verify OTP
            await verifyCustomerOTP(currentPhone, otp);
        }
    </script>
</body>
</html>
`;

/* ── File: admin-login.html ────────────────────────────────── */

const adminLoginPage = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Admin Login - Spice Garden</title>
    <script src="frontend/api-integration.js"></script>
</head>
<body>
    <div class="login-container">
        <h1>🔐 Admin Login</h1>
        
        <form onsubmit="handleAdminLogin(event)">
            <input type="email" id="adminEmail" placeholder="Email" required>
            <input type="password" id="adminPassword" placeholder="Password" required>
            <button type="submit" class="btn-primary">Login</button>
            <p id="errorMessage" class="error-message"></p>
        </form>

        <div class="links">
            <a href="index.html">Back to Home</a>
            <a href="customer-login.html">Customer Login</a>
        </div>
    </div>

    <script>
        async function handleAdminLogin(e) {
            e.preventDefault();
            
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;
            const errorMsg = document.getElementById('errorMessage');

            // Call API
            await adminLogin(email, password);
        }
    </script>
</body>
</html>
`;

/* ── File: restaurant-login.html ────────────────────────────────── */

const restaurantLoginPage = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Restaurant Login - Spice Garden</title>
    <script src="frontend/api-integration.js"></script>
</head>
<body>
    <div class="login-container">
        <h1>🍽️ Restaurant Manager Login</h1>
        
        <form onsubmit="handleRestaurantLogin(event)">
            <input type="email" id="restEmail" placeholder="Email" required>
            <input type="password" id="restPassword" placeholder="Password" required>
            <button type="submit" class="btn-primary">Login</button>
            <p id="errorMessage" class="error-message"></p>
        </form>

        <div class="links">
            <a href="index.html">Back to Home</a>
            <a href="customer-login.html">Customer Login</a>
            <a href="admin-login.html">Admin Login</a>
        </div>
    </div>

    <script>
        async function handleRestaurantLogin(e) {
            e.preventDefault();
            
            const email = document.getElementById('restEmail').value;
            const password = document.getElementById('restPassword').value;
            
            // Call API
            await restaurantLogin(email, password);
        }
    </script>
</body>
</html>
`;

// ═══════════════════════════════════════════════════════════════
// STEP 2: UPDATE DASHBOARD PAGES (WITH NAVIGATION)
// ═══════════════════════════════════════════════════════════════

/* ── File: restaurant-dashboard.html ────────────────────────────────── */

const restaurantDashboardPage = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Restaurant Dashboard - Spice Garden</title>
    <!-- Navigation styles -->
    <link rel="stylesheet" href="frontend/navigation-styles.css">
    <script src="frontend/api-integration.js"></script>
    <script src="frontend/navigation.js"></script>
</head>
<body>
    <!-- Navigation will be injected here by JavaScript -->
    
    <main class="dashboard-content">
        <div class="content-wrapper">
            <h1>📊 Restaurant Dashboard</h1>
            
            <!-- Dashboard Cards -->
            <div class="dashboard-grid">
                <div class="card">
                    <h3>Today's Orders</h3>
                    <p class="stat-number" id="todayOrders">-</p>
                </div>
                <div class="card">
                    <h3>Today's Revenue</h3>
                    <p class="stat-number" id="todayRevenue">₹-</p>
                </div>
                <div class="card">
                    <h3>Popular Items</h3>
                    <p class="stat-number" id="popularItems">-</p>
                </div>
                <div class="card">
                    <h3>Pending Orders</h3>
                    <p class="stat-number" id="pendingOrders">-</p>
                </div>
            </div>

            <!-- Charts will go here -->
            <div id="chartsContainer"></div>
        </div>
    </main>

    <script>
        // Protect page - only restaurant managers can access
        document.addEventListener('DOMContentLoaded', async () => {
            protectPage('restaurant_manager');
            
            // Initialize navigation
            initNavigation();
            
            // Load dashboard data
            await loadDashboardData();
        });

        async function loadDashboardData() {
            try {
                // Fetch analytics
                await fetchMenuPerformance();
                await fetchTopItems();
                await fetchRevenueAnalytics('1'); // 1 day
            } catch (error) {
                console.error('Error loading dashboard:', error);
            }
        }
    </script>
</body>
</html>
`;

/* ── File: admin-dashboard.html ────────────────────────────────── */

const adminDashboardPage = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Admin Dashboard - Spice Garden</title>
    <link rel="stylesheet" href="frontend/navigation-styles.css">
    <script src="frontend/api-integration.js"></script>
    <script src="frontend/navigation.js"></script>
</head>
<body>
    <main class="dashboard-content">
        <div class="content-wrapper">
            <h1>👨‍💼 Admin Dashboard</h1>
            
            <div class="dashboard-grid">
                <div class="card">
                    <h3>Total Restaurants</h3>
                    <p class="stat-number" id="totalRestaurants">-</p>
                </div>
                <div class="card">
                    <h3>Total Orders</h3>
                    <p class="stat-number" id="totalOrders">-</p>
                </div>
                <div class="card">
                    <h3>Total Customers</h3>
                    <p class="stat-number" id="totalCustomers">-</p>
                </div>
                <div class="card">
                    <h3>Platform Revenue</h3>
                    <p class="stat-number" id="platformRevenue">₹-</p>
                </div>
            </div>
        </div>
    </main>

    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            protectPage('admin');
            initNavigation();
            
            // Fetch admin dashboard
            const response = await fetch('/api/admin/dashboard', {
                headers: { 'Authorization': \`Bearer \${getToken()}\` }
            });
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('totalRestaurants').textContent = data.data.restaurants;
                document.getElementById('totalOrders').textContent = data.data.orders;
                document.getElementById('totalCustomers').textContent = data.data.customers;
                document.getElementById('platformRevenue').textContent = '₹' + data.data.revenue;
            }
        });
    </script>
</body>
</html>
`;

// ═══════════════════════════════════════════════════════════════
// STEP 3: UPDATE CUSTOMER PAGES
// ═══════════════════════════════════════════════════════════════

/* ── File: customer-menu.html (Integration Example) ──────────────────────────────── */

const customerMenuPageUpdated = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Menu - Spice Garden</title>
    <script src="frontend/api-integration.js"></script>
    <script src="frontend/navigation.js"></script> <!-- For customer navbar/sidebar -->
</head>
<body>
    <header class="navbar">
        <div class="navbar-container">
            <a href="customer-home.html" class="logo">🍜 Spice Garden</a>
            <button class="menu-toggle" id="toggleMenu">☰</button>
            <div class="header-actions">
                <span class="cart-count" id="cartCount">0</span>
                <a href="customer-cart.html" class="cart-btn">🛒</a>
            </div>
        </div>
    </header>

    <main class="menu-container">
        <h1>📖 Menu</h1>
        
        <!-- Search -->
        <input type="text" id="searchInput" placeholder="Search menu items..." class="search-input">
        
        <!-- Categories -->
        <div class="categories" id="categoriesContainer"></div>
        
        <!-- Menu Items Grid -->
        <div class="menu-grid" id="menuContainer"></div>
    </main>

    <script>
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', async () => {
            // Check if logged in
            if (!isLoggedIn()) {
                window.location.href = 'customer-login.html';
                return;
            }

            // Load menu data
            await fetchMenuCategories(1); // Restaurant ID = 1
            await fetchMenuItems(1);
            updateCartCount();
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            fetchMenuItems(1, null, e.target.value);
        });

        // Update cart count display
        function updateCartCount() {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            document.getElementById('cartCount').textContent = cart.length;
        }

        // Render menu items
        function renderMenuItems(items) {
            const container = document.getElementById('menuContainer');
            container.innerHTML = items.map(item => \`
                <div class="menu-card">
                    <div class="item-icon">\${item.icon}</div>
                    <h3>\${item.item_name}</h3>
                    <p class="category">\${item.category_name}</p>
                    <p class="description">\${item.description}</p>
                    <div class="item-footer">
                        <span class="price">₹\${item.price}</span>
                        <button onclick="addItemToCart(\${item.id}, '\${item.item_name}', \${item.price})">
                            Add to Cart
                        </button>
                    </div>
                </div>
            \`).join('');
        }

        // Add to cart
        function addItemToCart(itemId, itemName, price) {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            
            const existingItem = cart.find(i => i.id === itemId);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ id: itemId, name: itemName, price: price, quantity: 1 });
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            alert('✓ Added to cart');
        }

        // Render categories
        function renderCategories(categories) {
            const container = document.getElementById('categoriesContainer');
            container.innerHTML = categories.map(cat => \`
                <button class="category-btn" onclick="filterByCategory(\${cat.id})">
                    \${cat.category_name}
                </button>
            \`).join('');
        }

        function filterByCategory(categoryId) {
            fetchMenuItems(1, categoryId);
        }
    </script>
</body>
</html>
`;

/* ── File: customer-checkout.html (With API Integration) ──────────────────────────────── */

const checkoutPageUpdated = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Checkout - Spice Garden</title>
    <script src="frontend/api-integration.js"></script>
</head>
<body>
    <div class="checkout-container">
        <h1>Checkout</h1>
        
        <form id="checkoutForm" onsubmit="handleCheckout(event)">
            <!-- Customer Details -->
            <fieldset>
                <legend>Delivery Information</legend>
                <input type="text" id="fullName" placeholder="Full Name" required>
                <input type="tel" id="phone" placeholder="Phone Number" maxlength="10" required>
                <textarea id="address" placeholder="Delivery Address" rows="3" required></textarea>
                
                <label>
                    <input type="radio" name="deliveryType" value="home" checked>
                    Home Delivery
                </label>
                <label>
                    <input type="radio" name="deliveryType" value="pickup">
                    Pickup
                </label>
            </fieldset>

            <!-- Order Summary -->
            <fieldset>
                <legend>Order Summary</legend>
                <div id="orderSummary"></div>
            </fieldset>

            <!-- Payment Method -->
            <fieldset>
                <legend>Payment Method</legend>
                <select id="paymentMethod" required>
                    <option value="">Select payment method</option>
                    <option value="cash">Cash on Delivery</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="upi">UPI</option>
                </select>
            </fieldset>

            <button type="submit" class="btn-primary btn-large">Place Order</button>
        </form>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Check login
            if (!isLoggedIn()) {
                window.location.href = 'customer-login.html';
                return;
            }

            // Load order summary
            loadOrderSummary();
            
            // Load customer info if available
            const customer = JSON.parse(localStorage.getItem('customer'));
            if (customer && customer.name) {
                document.getElementById('fullName').value = customer.name;
                document.getElementById('phone').value = customer.phone;
            }
        });

        function loadOrderSummary() {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            let subtotal = 0;
            let itemsHtml = '';

            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                itemsHtml += \`
                    <div class="summary-item">
                        <span>\${item.name} x \${item.quantity}</span>
                        <span>₹\${itemTotal}</span>
                    </div>
                \`;
            });

            const tax = Math.round(subtotal * 0.05);
            const deliveryFee = 40;
            const total = subtotal + tax + deliveryFee;

            document.getElementById('orderSummary').innerHTML = \`
                \${itemsHtml}
                <hr>
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>₹\${subtotal}</span>
                </div>
                <div class="summary-row">
                    <span>Tax (5%):</span>
                    <span>₹\${tax}</span>
                </div>
                <div class="summary-row">
                    <span>Delivery Fee:</span>
                    <span>₹\${deliveryFee}</span>
                </div>
                <div class="summary-row total">
                    <span>Total:</span>
                    <span>₹\${total}</span>
                </div>
            \`;
        }

        async function handleCheckout(e) {
            e.preventDefault();

            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            if (cart.length === 0) {
                alert('Cart is empty');
                return;
            }

            const orderData = {
                restaurantId: 1, // Default restaurant
                items: cart.map(item => ({
                    menuItemId: item.id,
                    quantity: item.quantity
                })),
                deliveryAddress: document.getElementById('address').value,
                deliveryType: document.querySelector('input[name="deliveryType"]:checked').value,
                paymentMethod: document.getElementById('paymentMethod').value,
                specialInstructions: ''
            };

            // Call API to create order
            await createOrder(orderData);
        }
    </script>
</body>
</html>
`;

// ═══════════════════════════════════════════════════════════════
// STEP 4: NAVIGATION CSS
// ═══════════════════════════════════════════════════════════════

const navigationCSS = \`
/* Add this to your stylesheet or import in HTML */

:root {
    --bg: #0a0a0f;
    --bg-card: rgba(255, 255, 255, 0.04);
    --border: rgba(255, 255, 255, 0.07);
    --text: #f1f5f9;
    --muted: #94a3b8;
    --accent: #a855f7;
    --green: #22c55e;
}

/* Main navbar */
.main-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: rgba(10, 10, 15, 0.95);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    z-index: 1000;
    padding: 0 1.75rem;
    gap: 1rem;
}

.navbar-brand {
    font-weight: 700;
    color: var(--text);
    font-size: 1.1rem;
}

.navbar-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: var(--text);
}

.logo-icon {
    font-size: 1.5rem;
}

.navbar-menu {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 1rem;
}

/* Main sidebar */
.main-sidebar {
    position: fixed;
    left: 0;
    top: 60px;
    width: 240px;
    height: calc(100vh - 60px);
    background: rgba(20, 20, 28, 0.95);
    border-right: 1px solid var(--border);
    overflow-y: auto;
    z-index: 999;
}

.sidebar-menu {
    list-style: none;
    padding: 1rem 0;
}

.sidebar-item {
    position: relative;
}

.sidebar-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    color: var(--muted);
    text-decoration: none;
    transition: all 0.2s;
}

.sidebar-link:hover,
.sidebar-item.active > .sidebar-link {
    color: var(--text);
    background: rgba(168, 85, 247, 0.1);
}

.sidebar-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
}

/* Adjust body for navbar + sidebar */
body.has-navbar {
    padding-top: 60px;
}

body.has-sidebar {
    padding-left: 240px;
}

@media (max-width: 900px) {
    body.has-sidebar {
        padding-left: 0;
    }

    .main-sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s;
    }

    .main-sidebar.active {
        transform: translateX(0);
    }
}
\`;

// ═══════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════

const integrationSummary = \`
INTEGRATION CHECKLIST:

✓ 1. Add JavaScript imports to pages:
     - <script src="frontend/api-integration.js"></script>
     - <script src="frontend/navigation.js"></script>

✓ 2. Protect pages with authentication:
     - protectPage('role') at page load

✓ 3. Initialize navigation on dashboard pages:
     - initNavigation() after DOMContentLoaded

✓ 4. Replace localStorage cart with API calls:
     - createOrder() instead of inline confirmation
     - fetchMenuItems() instead of hardcoded data

✓ 5. Update navigation links to use window.location.href

✓ 6. Add error handling and loading states

✓ 7. Test complete user flow:
     - Login → Dashboard → Menu → Cart → Checkout → Tracking

✓ 8. Configure API_BASE_URL for your backend

✓ 9. Ensure JWT tokens stored in localStorage

✓ 10. Test with actual backend running on port 3000
\`;

module.exports = {
    customerLoginPage,
    adminLoginPage,
    restaurantLoginPage,
    restaurantDashboardPage,
    adminDashboardPage,
    customerMenuPageUpdated,
    checkoutPageUpdated,
    navigationCSS,
    integrationSummary
};
