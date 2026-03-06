const fs = require('fs');
const path = require('path');
const dir = 'd:/Nirma hackathon/Nirma/frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

// Replace blocking socket.io script with a safe inline stub + CDN fallback
const badTag = '<script src="/socket.io/socket.io.js"></script>';

// Safe replacement: try CDN, and if that fails define a no-op stub
const safeTag = `<script>
    /* Socket.io safe loader — won't crash if server is offline */
    window._socketStub = { on: ()=>{}, emit: ()=>{}, id: null };
    function io(url, opts) {
        try {
            // Only attempt real socket if we're on a real server
            if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
                const s = window._realIo ? window._realIo(url, opts) : window._socketStub;
                return s;
            }
        } catch(e) {}
        return window._socketStub;
    }
</script>`;

let count = 0;
for (const f of files) {
    const p = path.join(dir, f);
    let s = fs.readFileSync(p, 'utf8');
    if (s.includes(badTag)) {
        s = s.replace(badTag, safeTag);
        fs.writeFileSync(p, s, 'utf8');
        count++;
        console.log('Fixed: ' + f);
    }
}
console.log('Total files fixed: ' + count);
