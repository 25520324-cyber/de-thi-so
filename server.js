// Máy chủ Đề Thi Số — Node thuần, không cần npm install (Node 18+).
// Lưu dữ liệu vào DATA_DIR/db.json và ảnh vào DATA_DIR/uploads/.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SECRET = process.env.SECRET || (ADMIN_PASSWORD ? crypto.createHash('sha256').update('dts:' + ADMIN_PASSWORD).digest('hex') : '');
if (!ADMIN_PASSWORD) { console.error('Thiếu biến môi trường ADMIN_PASSWORD (mật khẩu giảng viên).'); process.exit(1); }

const UP_DIR = path.join(DATA_DIR, 'uploads'), DB_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(UP_DIR, { recursive: true });
let db = { exams: {}, results: {} };
try { db = Object.assign(db, JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); } catch (e) {}
let saving = false, dirty = false;
function save() {
  dirty = true; if (saving) return; saving = true;
  (function loop() {
    if (!dirty) { saving = false; return; }
    dirty = false;
    fs.writeFile(DB_FILE + '.tmp', JSON.stringify(db), err => {
      if (err) console.error(err); else fs.renameSync(DB_FILE + '.tmp', DB_FILE);
      loop();
    });
  })();
}

const sign = s => crypto.createHmac('sha256', SECRET).update(s).digest('hex');
function makeToken() { const exp = Date.now() + 12 * 3600e3; return exp + '.' + sign('admin:' + exp); }
function isAdmin(req) {
  const t = (req.headers.authorization || '').replace(/^Bearer /, ''), [exp, sig] = t.split('.');
  if (!exp || !sig || +exp < Date.now()) return false;
  const good = sign('admin:' + exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}
const safeEq = (a, b) => { const x = crypto.createHash('sha256').update(a).digest(), y = crypto.createHash('sha256').update(b).digest(); return crypto.timingSafeEqual(x, y); };

const MIME = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.bmp': 'image/bmp' };
const EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp', 'image/bmp': '.bmp' };

function body(req, limit) {
  return new Promise((ok, no) => {
    const bufs = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > limit) { no(Object.assign(new Error('too large'), { code: 413 })); req.destroy(); } else bufs.push(c); });
    req.on('end', () => ok(Buffer.concat(bufs)));
    req.on('error', no);
  });
}
function send(res, code, obj, headers) {
  const b = typeof obj === 'string' ? obj : JSON.stringify(obj);
  res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, headers));
  res.end(b);
}
const idOk = s => /^[A-Za-z0-9_-]{1,64}$/.test(s || '');
const newId = () => crypto.randomBytes(10).toString('hex');
let failed = {};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x'), p = url.pathname, m = req.method;

    if (p === '/api/login' && m === 'POST') {
      const ip = req.socket.remoteAddress, f = failed[ip] || { n: 0, t: 0 };
      if (f.n >= 8 && Date.now() - f.t < 60000) return send(res, 429, { error: 'Thử lại sau 1 phút' });
      const j = JSON.parse((await body(req, 4096)).toString() || '{}');
      if (typeof j.password === 'string' && safeEq(j.password, ADMIN_PASSWORD)) { failed[ip] = { n: 0, t: 0 }; return send(res, 200, { token: makeToken() }); }
      failed[ip] = { n: f.n + 1, t: Date.now() };
      return send(res, 401, { error: 'Sai mật khẩu' });
    }
    if (p === '/api/me') return send(res, 200, { admin: isAdmin(req) });

    if (p === '/api/upload' && m === 'POST') {
      if (!isAdmin(req)) return send(res, 401, { error: 'Cần quyền giảng viên' });
      const type = (req.headers['content-type'] || '').split(';')[0];
      if (!EXT[type]) return send(res, 415, { error: 'Chỉ nhận ảnh png/jpg/gif/webp/bmp' });
      const buf = await body(req, 15 * 1024 * 1024), name = newId() + EXT[type];
      fs.writeFileSync(path.join(UP_DIR, name), buf);
      return send(res, 200, { url: '/uploads/' + name });
    }
    if (p.startsWith('/uploads/') && m === 'GET') {
      const f = path.join(UP_DIR, path.basename(p));
      if (!fs.existsSync(f)) return send(res, 404, { error: 'not found' });
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' });
      return fs.createReadStream(f).pipe(res);
    }

    // /api/c/:col  và  /api/d/:col/:id
    const seg = p.split('/').filter(Boolean);
    if (seg[0] === 'api' && (seg[1] === 'c' || seg[1] === 'd')) {
      const col = seg[2], id = seg[3], admin = isAdmin(req);
      if (!['exams', 'results'].includes(col)) return send(res, 404, { error: 'not found' });
      const coll = db[col];
      if (seg[1] === 'c') {
        if (m === 'GET') {
          if (col === 'results' && !admin) return send(res, 401, { error: 'Cần quyền giảng viên' });
          return send(res, 200, Object.keys(coll).map(k => ({ id: k, data: coll[k] })));
        }
        if (m === 'POST' && col === 'exams') {
          if (!admin) return send(res, 401, { error: 'Cần quyền giảng viên' });
          const nid = newId(); coll[nid] = JSON.parse((await body(req, 3e6)).toString()); save();
          return send(res, 200, { id: nid });
        }
        return send(res, 405, { error: 'method' });
      }
      if (!idOk(id)) return send(res, 400, { error: 'id' });
      if (m === 'GET') {
        if (col === 'exams' || admin || col === 'results') return send(res, 200, { exists: id in coll, data: coll[id] || null });
      }
      if (col === 'exams') {
        if (!admin) return send(res, 401, { error: 'Cần quyền giảng viên' });
        if (m === 'PATCH') { if (!(id in coll)) return send(res, 404, { error: 'not found' }); Object.assign(coll[id], JSON.parse((await body(req, 3e6)).toString())); save(); return send(res, 200, { ok: 1 }); }
        if (m === 'DELETE') { delete coll[id]; save(); return send(res, 200, { ok: 1 }); }
        if (m === 'PUT') { coll[id] = JSON.parse((await body(req, 3e6)).toString()); save(); return send(res, 200, { ok: 1 }); }
      }
      if (col === 'results') {
        // Sinh viên chỉ ghi vào tài liệu mang mã ngẫu nhiên của chính mình (id >= 16 ký tự), giới hạn kích thước
        if (m === 'PUT') {
          if (id.length < 16) return send(res, 400, { error: 'id quá ngắn' });
          const doc = JSON.parse((await body(req, 600e3)).toString());
          if (!doc || typeof doc.attempts !== 'object') return send(res, 400, { error: 'dữ liệu sai' });
          coll[id] = { uid: id, attempts: doc.attempts }; save();
          return send(res, 200, { ok: 1 });
        }
        if (m === 'DELETE' && admin) { delete coll[id]; save(); return send(res, 200, { ok: 1 }); }
      }
      return send(res, 405, { error: 'method' });
    }

    if (m === 'GET' && (p === '/' || p === '/index.html')) {
      res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      return fs.createReadStream(path.join(__dirname, 'public', 'index.html')).pipe(res);
    }
    if (p === '/healthz') return send(res, 200, { ok: 1 });
    send(res, 404, { error: 'not found' });
  } catch (e) {
    if (e && e.code === 413) return send(res, 413, { error: 'Dữ liệu quá lớn' });
    console.error(e); send(res, 400, { error: 'Yêu cầu không hợp lệ' });
  }
});
server.listen(PORT, () => console.log('Đề Thi Số chạy tại http://localhost:' + PORT));
