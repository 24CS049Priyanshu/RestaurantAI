/**
 * ═══════════════════════════════════════════════════════════════
 * FRONTEND API INTEGRATION EXAMPLES
 * Usage in frontend JavaScript files
 * ═══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// API BASE URL
// ═══════════════════════════════════════════════════════════════

const API_BASE_URL = 'http://localhost:3000/api';

// Store token in localStorage
const getToken = () => localStorage.getItem('authToken');

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION EXAMPLES
// ═══════════════════════════════════════════════════════════════

// ── CUSTOMER LOGIN ──────────────────────────────────────────

/**
 * Send OTP to customer phone
 * For: customer-login.html
 */
async function sendCustomerOTP(phone) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/customer/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('OTP sent successfully');
            console.log('Development OTP:', data.otp); // Remove in production
            return true;
        } else {
            console.error('Error:', data.error);
            return false;
        }
    } catch (error) {
        console.error('Failed to send OTP:', error);
        return false;
    }
}

/**
 * Verify OTP and login customer
 * For: customer-login.html
 */
async function verifyCustomerOTP(phone, otp) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/customer/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp })
        });

        const data = await response.json();
        
        if (data.success) {
            // Store token and customer info
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('customer', JSON.stringify(data.customer));
            localStorage.setItem('userRole', 'customer');
            
            // Redirect to home
            window.location.href = 'customer-home.html';
        } else {
            console.error('Login failed:', data.error);
            alert(data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
    }
}

// ── ADMIN LOGIN ────────────────────────────────────────────

/**
 * Admin login with email and password
 * For: admin-login.html
 */
async function adminLogin(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('userRole', 'admin');
            window.location.href = 'admin-dashboard.html';
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
    }
}

// ── RESTAURANT MANAGER LOGIN ─────────────────────────────

/**
 * Restaurant manager login with email and password
 * For: restaurant-login.html
 */
async function restaurantLogin(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/restaurant/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('userRole', 'restaurant_manager');
            window.location.href = 'restaurant-dashboard.html';
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// MENU EXAMPLES
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch all menu items
 * For: customer-menu.html
 */
async function fetchMenuItems(restaurantId = 1, categoryId = null, search = null) {
    try {
        let url = `${API_BASE_URL}/menu/items?restaurantId=${restaurantId}`;
        
        if (categoryId) url += `&categoryId=${categoryId}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            // Render menu items to page
            renderMenuItems(data.data);
        }
    } catch (error) {
        console.error('Failed to fetch menu:', error);
    }
}

/**
 * Fetch menu categories
 * For: customer-menu.html
 */
async function fetchMenuCategories(restaurantId = 1) {
    try {
        const response = await fetch(`${API_BASE_URL}/menu/categories?restaurantId=${restaurantId}`);
        const data = await response.json();

        if (data.success) {
            renderCategories(data.data);
        }
    } catch (error) {
        console.error('Failed to fetch categories:', error);
    }
}

/**
 * Get single menu item details
 * For: item detail page
 */
async function fetchMenuItemDetails(itemId) {
    try {
        const response = await fetch(`${API_BASE_URL}/menu/item/${itemId}`);
        const data = await response.json();

        if (data.success) {
            renderItemDetails(data.data);
        }
    } catch (error) {
        console.error('Failed to fetch item details:', error);
    }
}

/**
 * Create new menu item (Restaurant Manager)
 * For: menu-management.html
 */
async function createMenuItem(itemData) {
    try {
        const response = await fetch(`${API_BASE_URL}/menu/item`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(itemData)
        });

        const data = await response.json();
        
        if (data.success) {
            alert('Menu item created successfully');
            // Reload menu list
            fetchMenuItems();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error creating menu item:', error);
    }
}

/**
 * Update menu item (Restaurant Manager)
 * For: menu-management.html
 */
async function updateMenuItem(itemId, itemData) {
    try {
        const response = await fetch(`${API_BASE_URL}/menu/item/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(itemData)
        });

        const data = await response.json();
        
        if (data.success) {
            alert('Menu item updated successfully');
            fetchMenuItems();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error updating menu item:', error);
    }
}

/**
 * Delete menu item (Restaurant Manager)
 * For: menu-management.html
 */
async function deleteMenuItem(itemId) {
    if (!confirm('Are you sure?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/menu/item/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();
        
        if (data.success) {
            alert('Menu item deleted successfully');
            fetchMenuItems();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting menu item:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// ORDER EXAMPLES
// ═══════════════════════════════════════════════════════════════

/**
 * Create new order
 * For: customer-checkout.html
 */
async function createOrder(orderData) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();
        
        if (data.success) {
            const order = data.data;
            localStorage.setItem('lastOrder', JSON.stringify(order));
            alert(`Order placed! Order ID: ${order.id}`);
            window.location.href = 'customer-order-tracking.html';
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error creating order:', error);
    }
}

/**
 * Fetch all customer orders
 * For: customer-home.html (order history)
 */
async function fetchMyOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        const data = await response.json();
        
        if (data.success) {
            renderOrdersList(data.data);
        }
    } catch (error) {
        console.error('Failed to fetch orders:', error);
    }
}

/**
 * Get single order details
 * For: customer-order-tracking.html
 */
async function fetchOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        const data = await response.json();
        
        if (data.success) {
            renderOrderDetails(data.data);
        }
    } catch (error) {
        console.error('Failed to fetch order details:', error);
    }
}

/**
 * Update order status (Restaurant Manager)
 * For: orders-management.html
 */
async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();
        
        if (data.success) {
            alert('Order status updated');
            // Reload orders
            fetchRestaurantOrders();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error updating order:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// CUSTOMER PROFILE EXAMPLES
// ═══════════════════════════════════════════════════════════════

/**
 * Get customer profile
 * For: customer profile page
 */
async function fetchCustomerProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/customer/profile`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        const data = await response.json();
        
        if (data.success) {
            renderCustomerProfile(data.data);
        }
    } catch (error) {
        console.error('Failed to fetch profile:', error);
    }
}

/**
 * Update customer profile
 * For: customer profile page
 */
async function updateCustomerProfile(profileData) {
    try {
        const response = await fetch(`${API_BASE_URL}/customer/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();
        
        if (data.success) {
            alert('Profile updated successfully');
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
    }
}

/**
 * Get customer favorite items
 * For: customer-home.html (recommendations)
 */
async function fetchCustomerFavorites() {
    try {
        const response = await fetch(`${API_BASE_URL}/customer/favorites`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        const data = await response.json();
        
        if (data.success) {
            renderFavoriteItems(data.data);
        }
    } catch (error) {
        console.error('Failed to fetch favorites:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// ANALYTICS EXAMPLES
// ═══════════════════════════════════════════════════════════════

/**
 * Get menu performance analytics
 * For: restaurant-dashboard.html
 */
async function fetchMenuPerformance() {
    try {
        const response = await fetch(`${API_BASE_URL}/analytics/menu-performance`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        const data = await response.json();
        
        if (data.success) {
            renderMenuPerformanceChart(data.data);
        }
    } catch (error) {
        console.error('Failed to fetch menu performance:', error);
    }
}

/**
 * Get revenue analytics
 * For: revenue-intelligence.html
 */
async function fetchRevenueAnalytics(period = '30') {
    try {
        const response = await fetch(`${API_BASE_URL}/analytics/revenue?period=${period}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        const data = await response.json();
        
        if (data.success) {
            renderRevenueChart(data.dailyData);
            renderRevenueSummary(data.summary);
        }
    } catch (error) {
        console.error('Failed to fetch revenue:', error);
    }
}

/**
 * Get top selling items
 * For: restaurant-dashboard.html
 */
async function fetchTopItems() {
    try {
        const response = await fetch(`${API_BASE_URL}/analytics/top-items?limit=10`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        const data = await response.json();
        
        if (data.success) {
            renderTopItemsTable(data.data);
        }
    } catch (error) {
        console.error('Failed to fetch top items:', error);
    }
}

/**
 * Get combo insights
 * For: combo-recommendations.html
 */
async function fetchComboInsights() {
    try {
        const response = await fetch(`${API_BASE_URL}/analytics/combo-insights`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        const data = await response.json();
        
        if (data.success) {
            renderComboRecommendations(data.data);
        }
    } catch (error) {
        console.error('Failed to fetch combo insights:', error);
    }
}

/**
 * Get price recommendations
 * For: price-optimization.html
 */
async function fetchPriceRecommendations() {
    try {
        const response = await fetch(`${API_BASE_URL}/analytics/price-recommendations`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        const data = await response.json();
        
        if (data.success) {
            renderPriceRecommendations(data.data);
        }
    } catch (error) {
        console.error('Failed to fetch price recommendations:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return localStorage.getItem('authToken') !== null;
}

/**
 * Get current user role
 */
function getUserRole() {
    return localStorage.getItem('userRole');
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    localStorage.removeItem('customer');
    window.location.href = 'index.html';
}

/**
 * Protect page - redirect if not logged in
 */
function protectPage(requiredRole = null) {
    if (!isLoggedIn()) {
        alert('Please login first');
        window.location.href = 'customer-login.html';
        return;
    }

    if (requiredRole && getUserRole() !== requiredRole) {
        alert('You do not have access to this page');
        window.location.href = 'index.html';
    }
}

module.exports = {
    sendCustomerOTP,
    verifyCustomerOTP,
    adminLogin,
    restaurantLogin,
    fetchMenuItems,
    fetchMenuCategories,
    createOrder,
    fetchMyOrders,
    fetchOrderDetails,
    updateOrderStatus,
    fetchCustomerProfile,
    updateCustomerProfile,
    fetchMenuPerformance,
    fetchRevenueAnalytics,
    fetchTopItems,
    isLoggedIn,
    getUserRole,
    logout,
    protectPage
};
