const fs = require('fs');
const path = require('path');
const dir = 'd:/Nirma hackathon/Nirma/frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

// All alert() patterns that should be replaced with proper navigation
const reps = [
    ["onclick=\"alert('Loading full order list\u2026')\"", "onclick=\"navigate('orders')\""],
    ["onclick=\"alert('Exporting report\u2026')\"", "onclick=\"exportReport()\""],
    ["onclick=\"alert('3 new alerts')\"", "onclick=\"toggleNotifPanel()\""],
    ["onclick=\"alert('View all orders')\"", "onclick=\"navigate('orders')\""],
    ["onclick=\"alert('View all')\"", "onclick=\"navigate('orders')\""],
    ["onclick=\"alert('Loading restaurants\u2026')\"", "onclick=\"navigate('restaurants')\""],
    ["onclick=\"alert('View all restaurants')\"", "onclick=\"navigate('restaurants')\""],
    ["onclick=\"alert('Loading users\u2026')\"", "onclick=\"navigate('users')\""],
    ["navigate('customers')\"", "navigate('customers')\""]
];

let count = 0;
for (const f of files) {
    const p = path.join(dir, f);
    let s = fs.readFileSync(p, 'utf8');
    const orig = s;
    for (const [o, n] of reps) {
        while (s.includes(o)) {
            s = s.replace(o, n);
        }
    }
    if (s !== orig) {
        fs.writeFileSync(p, s, 'utf8');
        console.log('Fixed: ' + f);
        count++;
    }
}
console.log('Total files fixed: ' + count);
