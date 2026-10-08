// Servidor de desarrollo local sin dependencias: node tools/serve.cjs
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon' };
http.createServer((req, res) => {
    let file;
    try {
        const url = new URL(req.url, 'http://127.0.0.1');
        file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
        if (file !== root && !file.startsWith(root + path.sep)) throw new Error('Fuera del proyecto');
        if (file === root) file = path.join(root, 'index.html');
    } catch {
        res.writeHead(400).end();
        return;
    }
    fs.readFile(file, (error, data) => {
        if (error) { res.writeHead(404).end(); return; }
        res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(data);
    });
}).listen(8000, '127.0.0.1', () => console.log('Isla Jaipo: http://127.0.0.1:8000/'));
