const fs = require('fs');
const path = require('path');

// The new navigate function with all correct routes
const newFunc = `        function navigate(page) {
            const isLocalAdmin = window.location.pathname.includes('admin-');
            const isAdminPath = window.location.pathname.includes('/admin/') || isLocalAdmin;

            const routes = {
                'dashboard': isAdminPath ? 'admin-dashboard.html' : 'restaurant-dashboard.html',
                'restaurants': 'admin-restaurants.html',
                'orders': isAdminPath ? 'admin-dashboard.html' : 'restaurant-orders.html',
                'revenue': 'revenue-intelligence.html',
                'insights': 'price-optimization.html',
                'voice': 'voice-orders.html',
                'combos': 'combo-recommendations.html',
                'users': 'admin-users.html',
                'settings': isAdminPath ? 'admin-settings.html' : 'restaurant-settings.html',
                'menu': 'restaurant-menu.html',
                'customers': 'restaurant-dashboard.html',
                'reports': isAdminPath ? 'admin-settings.html' : 'restaurant-reports.html',
                'profile': isAdminPath ? 'admin-settings.html' : 'restaurant-settings.html',
                'support': isAdminPath ? 'admin-support.html' : 'restaurant-support.html'
            };

            const target = routes[page];
            if (target && target !== '#') {
                window.location.href = target;
            } else {
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                try {
                    if (typeof event !== 'undefined' && event && event.currentTarget) {
                        event.currentTarget.classList.add('active');
                    }
                } catch(e) {}
                console.log('Navigating to ' + page + '... (Fallback)');
            }
        }`;

const dir = 'd:/Nirma hackathon/Nirma/frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
let count = 0;

for (const file of files) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Match any whitespace before 'function navigate(page)'
    const searchStr = 'function navigate(page)';
    let idx = content.indexOf(searchStr);

    if (idx === -1) {
        continue;
    }

    // Walk back to start of line
    let lineStart = idx;
    while (lineStart > 0 && content[lineStart - 1] !== '\n') {
        lineStart--;
    }

    // Find the opening brace count
    let braceCount = 0;
    let inBlock = false;
    let endIdx = idx;

    for (let i = idx; i < content.length; i++) {
        if (content[i] === '{') {
            braceCount++;
            inBlock = true;
        } else if (content[i] === '}') {
            braceCount--;
        }
        if (inBlock && braceCount === 0) {
            endIdx = i + 1;
            break;
        }
    }

    if (inBlock && braceCount === 0) {
        content = content.substring(0, lineStart) + newFunc + content.substring(endIdx);
        fs.writeFileSync(fullPath, content, 'utf8');
        count++;
        console.log('Updated: ' + file);
    } else {
        console.log('SKIPPED (no matching brace): ' + file);
    }
}
console.log('\nTotal files updated: ' + count);
