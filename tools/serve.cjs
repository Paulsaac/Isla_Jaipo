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
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.mpeg': 'audio/mpeg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.flac': 'audio/flac' };
http.createServer((req, res) => {
    // Registro local de autoría, accesible también desde el PC de escucha en LAN.
    if (req.url === '/__authoring/forest-cues') {
        if (req.method !== 'POST') { res.writeHead(405).end(); return; }
        if (req.headers.origin !== `http://${req.headers.host}` || req.headers['content-type'] !== 'application/json') {
            res.writeHead(403).end(); return;
        }
        let body = '', tooLarge = false;
        req.on('data', chunk => {
            if (tooLarge) return;
            body += chunk;
            if (Buffer.byteLength(body) > 65536) { tooLarge = true; res.writeHead(413).end(); }
        });
        req.on('end', () => {
            if (tooLarge) return;
            let take;
            try {
                take = JSON.parse(body);
                if (take.version !== 1 || take.track !== 'forest' || take.source !== 'sonidos/musica/bosque.mpeg'
                    || typeof take.id !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(take.id)
                    || !Array.isArray(take.marks) || take.marks.length < 1 || take.marks.length > 1000
                    || take.marks[0].seconds !== 0
                    || !take.marks.every((mark, i) => mark.id === i && Number.isFinite(mark.seconds)
                        && mark.seconds >= 0 && mark.seconds <= 3600 && (i === 0 || mark.seconds >= take.marks[i-1].seconds))) {
                    res.writeHead(400).end(); return;
                }
            } catch { res.writeHead(400).end(); return; }
            try {
                const directory = path.join(root, '.coordination', 'forest-cues');
                fs.mkdirSync(directory, { recursive: true });
                const file = path.join(directory, `${take.id}.json`);
                fs.writeFileSync(file + '.tmp', JSON.stringify(take, null, 2) + '\n');
                fs.renameSync(file + '.tmp', file);
                res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end('{"saved":true}');
            } catch (error) {
                console.error('No se pudieron guardar las marcas:', error.message);
                res.writeHead(500).end();
            }
        });
        return;
    }
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
    fs.stat(file, (error, stat) => {
        if (error || !stat.isFile()) { res.writeHead(404).end(); return; }
        const headers = { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
        let start = 0, end = stat.size - 1, status = 200;
        // Los reproductores móviles consultan inicio/final del audio sin descargarlo completo.
        if (req.headers.range) {
            const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
            if (match && (match[1] || match[2])) {
                if (!match[1]) start = Math.max(0, stat.size - Number(match[2]));
                else {
                    start = Number(match[1]);
                    if (match[2]) end = Math.min(end, Number(match[2]));
                }
            }
            if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start)
                || !Number.isSafeInteger(end) || start < 0 || start > end || start >= stat.size
                || (!match[1] && Number(match[2]) === 0)) {
                res.writeHead(416, { ...headers, 'Content-Range': `bytes */${stat.size}`, 'Content-Length': 0 }).end();
                return;
            }
            status = 206;
            headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
        }
        headers['Content-Length'] = stat.size === 0 ? 0 : end - start + 1;
        res.writeHead(status, headers);
        if (req.method === 'HEAD' || stat.size === 0) { res.end(); return; }
        const stream = fs.createReadStream(file, { start, end });
        stream.on('error', () => res.destroy());
        res.on('close', () => stream.destroy());
        stream.pipe(res);
    });
}).listen(port, host, () => console.log(`Isla Jaipo: http://${host}:${port}/`));
