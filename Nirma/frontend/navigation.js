/**
 * ═══════════════════════════════════════════════════════════════
 * SHARED NAVIGATION COMPONENTS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * NAVIGATION CONFIGURATION
 * Define sidebar menus for different user roles
 */
const navigationConfig = {
    admin: [
        {
            label: 'Dashboard',
            icon: '📊',
            href: 'admin-dashboard.html'
        },
        {
            label: 'Restaurants',
            icon: '🍽️',
            href: 'restaurant-management.html'
        },
        {
            label: 'Users',
            icon: '👥',
            href: 'user-management.html'
        },
        {
            label: 'Analytics',
            icon: '📈',
            href: '#',
            submenu: [
                { label: 'System Overview', href: 'admin-analytics.html' },
                { label: 'Revenue Report', href: 'admin-revenue.html' },
                { label: 'Orders Report', href: 'admin-orders.html' }
            ]
        },
        {
            label: 'Settings',
            icon: '⚙️',
            href: 'admin-settings.html'
        }
    ],
    restaurant_manager: [
        {
            label: 'Dashboard',
            icon: '📊',
            href: 'restaurant-dashboard.html'
        },
        {
            label: 'Menu Management',
            icon: '📋',
            href: 'menu-management.html'
        },
        {
            label: 'Orders',
            icon: '🛒',
            href: 'orders-management.html'
        },
        {
            label: 'Revenue Intelligence',
            icon: '💰',
            href: 'revenue-intelligence.html'
        },
        {
            label: 'AI Features',
            icon: '🤖',
            submenu: [
                { label: 'Combo Recommendations', href: 'combo-recommendations.html' },
                { label: 'Price Optimization', href: 'price-optimization.html' },
                { label: 'Voice Orders', href: 'voice-orders.html' }
            ]
        }
    ],
    customer: [
        {
            label: 'Home',
            icon: '🏠',
            href: 'customer-home.html'
        },
        {
            label: 'Menu',
            icon: '📖',
            href: 'customer-menu.html'
        },
        {
            label: 'Orders',
            icon: '📦',
            href: 'customer-orders.html'
        },
        {
            label: 'Account',
            icon: '👤',
            href: 'customer-profile.html'
        }
    ]
};

// ═══════════════════════════════════════════════════════════════
// NAVBAR COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Create top navigation bar with user menu
 */
function createNavbar() {
    const navbar = document.createElement('header');
    navbar.className = 'main-navbar';
    navbar.innerHTML = `
        <div class="navbar-container">
            <div class="navbar-brand">
                <a href="index.html" class="navbar-logo">
                    <span class="logo-icon">🍜</span>
                    <span class="logo-text">Spice Garden</span>
                </a>
            </div>

            <div class="navbar-menu">
                <div class="navbar-item active">
                    <a href="#" id="toggleSidebar" class="sidebar-toggle">
                        <span class="toggle-icon">☰</span>
                    </a>
                </div>

                <div class="navbar-spacer"></div>

                <div class="navbar-item">
                    <a href="#" id="notificationBell" class="notification-bell">
                        <span class="bell-icon">🔔</span>
                        <span class="notification-badge" style="display: none;">3</span>
                    </a>
                </div>

                <div class="navbar-item dropdown">
                    <button class="user-menu-btn" id="userMenuBtn">
                        <span class="user-avatar">👤</span>
                        <span class="user-name" id="userName">User</span>
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="dropdown-menu" id="userDropdown">
                        <a href="#" data-action="profile" class="dropdown-item">
                            <span>👤 Profile</span>
                        </a>
                        <a href="#" data-action="settings" class="dropdown-item">
                            <span>⚙️ Settings</span>
                        </a>
                        <hr class="dropdown-divider">
                        <a href="#" data-action="logout" class="dropdown-item">
                            <span>🚪 Logout</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

    return navbar;
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Create sidebar navigation
 */
function createSidebar(userRole) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'main-sidebar';
    sidebar.id = 'mainSidebar';

    const menuItems = navigationConfig[userRole] || [];
    let menuHTML = '<nav class="sidebar-nav"><ul class="sidebar-menu">';

    menuItems.forEach((item, index) => {
        const isActive = isCurrentPage(item.href) ? 'active' : '';
        const hasSubmenu = item.submenu && item.submenu.length > 0;

        if (hasSubmenu) {
            menuHTML += `
                <li class="sidebar-item ${isActive}">
                    <a href="#" class="sidebar-link submenu-toggle" data-submenu="submenu-${index}">
                        <span class="sidebar-icon">${item.icon}</span>
                        <span class="sidebar-label">${item.label}</span>
                        <span class="submenu-arrow">›</span>
                    </a>
                    <ul class="sidebar-submenu" id="submenu-${index}">
            `;

            item.submenu.forEach(subitem => {
                const subActive = isCurrentPage(subitem.href) ? 'active' : '';
                menuHTML += `
                    <li class="sidebar-submenu-item ${subActive}">
                        <a href="${subitem.href}" class="sidebar-submenu-link">
                            ${subitem.label}
                        </a>
                    </li>
                `;
            });

            menuHTML += `
                    </ul>
                </li>
            `;
        } else {
            menuHTML += `
                <li class="sidebar-item ${isActive}">
                    <a href="${item.href}" class="sidebar-link">
                        <span class="sidebar-icon">${item.icon}</span>
                        <span class="sidebar-label">${item.label}</span>
                    </a>
                </li>
            `;
        }
    });

    menuHTML += '</ul></nav>';
    sidebar.innerHTML = menuHTML;

    return sidebar;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if given URL is the current page
 */
function isCurrentPage(href) {
    if (href === '#') return false;
    const currentPage = window.location.pathname.split('/').pop();
    return href === currentPage;
}

/**
 * Initialize navigation component
 */
function initNavigation() {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Get user info
    const userInfo = localStorage.getItem(userRole === 'customer' ? 'customer' : 'user');
    const userData = userInfo ? JSON.parse(userInfo) : { name: 'User' };

    // Create navigation elements
    const navbar = createNavbar();
    const sidebar = createSidebar(userRole);

    // Insert into document (assuming there's a container)
    const navContainer = document.body;
    navContainer.insertBefore(navbar, navContainer.firstChild);
    navContainer.insertBefore(sidebar, navContainer.children[1]);

    // Set user name
    document.getElementById('userName').textContent = userData.name || 'User';

    // Setup event listeners
    setupNavigation();

    // Add main content wrapper class
    document.body.classList.add('has-navbar', 'has-sidebar');
}

/**
 * Setup navigation event listeners
 */
function setupNavigation() {
    // Sidebar toggle
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('mainSidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sidebar.classList.toggle('collapsed');
        });
    }

    // Submenu toggles
    document.querySelectorAll('.submenu-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const submenuId = toggle.getAttribute('data-submenu');
            const submenu = document.getElementById(submenuId);
            const parent = toggle.closest('.sidebar-item');

            if (submenu) {
                submenu.classList.toggle('active');
                parent.classList.toggle('expanded');
            }
        });
    });

    // User menu dropdown
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            userDropdown.classList.toggle('active');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                userDropdown.classList.remove('active');
            }
        });
    }

    // User dropdown actions
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const action = item.getAttribute('data-action');

            if (action === 'logout') {
                handleLogout();
            } else if (action === 'profile') {
                handleProfileClick();
            } else if (action === 'settings') {
                handleSettingsClick();
            }
        });
    });
}

/**
 * Handle logout
 */
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('user');
        localStorage.removeItem('customer');
        window.location.href = 'index.html';
    }
}

/**
 * Handle profile click
 */
function handleProfileClick() {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'customer') {
        window.location.href = 'customer-profile.html';
    } else {
        window.location.href = 'user-profile.html';
    }
}

/**
 * Handle settings click
 */
function handleSettingsClick() {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') {
        window.location.href = 'admin-settings.html';
    } else if (userRole === 'restaurant_manager') {
        window.location.href = 'restaurant-settings.html';
    }
}

// ═══════════════════════════════════════════════════════════════
// CSS STYLES (Include in your stylesheet)
// ═══════════════════════════════════════════════════════════════

const navigationStyles = `
/* NAVBAR */
.main-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: rgba(10, 10, 15, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    display: flex;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(10px);
}

.navbar-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 1.75rem;
    gap: 1rem;
}

.navbar-brand {
    flex-shrink: 0;
}

.navbar-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: #f1f5f9;
    font-weight: 700;
    font-size: 1.1rem;
}

.logo-icon {
    font-size: 1.75rem;
}

.navbar-menu {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-left: auto;
}

.navbar-spacer {
    flex: 1;
}

.sidebar-toggle {
    background: none;
    border: none;
    color: #f1f5f9;
    font-size: 1.5rem;
    cursor: pointer;
    display: none;
}

@media (max-width: 900px) {
    .sidebar-toggle {
        display: block;
    }
}

.dropdown {
    position: relative;
}

.user-menu-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.07);
    color: #f1f5f9;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    transition: all 0.2s;
}

.user-menu-btn:hover {
    background: rgba(255, 255, 255, 0.1);
}

.user-avatar {
    font-size: 1.2rem;
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: rgba(10, 10, 15, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    min-width: 200px;
    margin-top: 0.5rem;
    display: none;
    flex-direction: column;
    z-index: 1001;
    overflow: hidden;
}

.dropdown-menu.active {
    display: flex;
}

.dropdown-item {
    padding: 0.75rem 1rem;
    color: #f1f5f9;
    text-decoration: none;
    transition: background 0.2s;
    cursor: pointer;
    display: block;
}

.dropdown-item:hover {
    background: rgba(168, 85, 247, 0.1);
}

.dropdown-divider {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
    margin: 0.5rem 0;
}

/* SIDEBAR */
.main-sidebar {
    position: fixed;
    left: 0;
    top: 60px;
    width: 240px;
    height: calc(100vh - 60px);
    background: rgba(20, 20, 28, 0.95);
    border-right: 1px solid rgba(255, 255, 255, 0.07);
    overflow-y: auto;
    z-index: 999;
    transition: all 0.3s;
}

.main-sidebar.collapsed {
    width: 0;
    border-right: none;
}

.sidebar-nav {
    padding: 1rem 0;
}

.sidebar-menu {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.sidebar-item {
    position: relative;
}

.sidebar-link, .sidebar-submenu-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    color: #94a3b8;
    text-decoration: none;
    transition: all 0.2s;
    font-size: 0.9rem;
    border-left: 3px solid transparent;
}

.sidebar-link:hover, .sidebar-submenu-link:hover {
    color: #f1f5f9;
    background: rgba(168, 85, 247, 0.1);
}

.sidebar-item.active > .sidebar-link {
    color: #a855f7;
    background: rgba(168, 85, 247, 0.1);
    border-left-color: #a855f7;
}

.sidebar-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
}

.sidebar-label {
    flex: 1;
}

.submenu-arrow {
    font-size: 0.8rem;
    transition: transform 0.2s;
}

.sidebar-item.expanded > .sidebar-link .submenu-arrow {
    transform: rotate(90deg);
}

.sidebar-submenu {
    display: none;
    flex-direction: column;
    list-style: none;
    padding: 0.5rem 0;
    background: rgba(0, 0, 0, 0.2);
}

.sidebar-submenu.active {
    display: flex;
}

.sidebar-submenu-item {
    position: relative;
}

.sidebar-submenu-link {
    padding: 0.5rem 1rem 0.5rem 2.5rem;
    font-size: 0.85rem;
}

.sidebar-submenu-item.active > .sidebar-submenu-link {
    color: #22c55e;
    border-left-color: #22c55e;
}

/* ADJUST BODY LAYOUT */
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
        box-shadow: -4px 0 12px rgba(0, 0, 0, 0.3);
    }
}
`;

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initNavigation,
        createNavbar,
        createSidebar,
        navigationConfig
    };
}
