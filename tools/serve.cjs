// Servidor de desarrollo local sin dependencias: node tools/serve.cjs
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const lan = process.argv.includes('--lan');
const portArgument = process.argv.find(argument => argument.startsWith('--port='));
const port = portArgument ? Number(portArgument.slice(7)) : 8000;
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Puerto inválido');
const host = lan ? '0.0.0.0' : '127.0.0.1';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.mpeg': 'audio/mpeg', '.flac': 'audio/flac' };
http.createServer((req, res) => {
    let file;
    try {
        const url = new URL(req.url, 'http://127.0.0.1');
        file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
        if (file !== root && !file.startsWith(root + path.sep)) throw new Error('Fuera del proyecto');
        if (file === root) file = path.join(root, 'index.html');
        const relative = path.relative(root, file).replaceAll('\\', '/');
        if (lan && (!/^(?:index\.html$|game\.js$|favicon\.ico$|(?:src|imagenes|sonidos)\/)/.test(relative)
            || relative.split('/').some(part => part.startsWith('.')))) {
            res.writeHead(404).end(); return;
        }
    } catch {
        res.writeHead(400).end();
        return;
    }
    fs.readFile(file, (error, data) => {
        if (error) { res.writeHead(404).end(); return; }
        res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(data);
    });
}).listen(port, host, () => console.log(`Isla Jaipo: http://${host}:${port}/`));
