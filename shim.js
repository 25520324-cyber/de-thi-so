/* Adapter: cung cấp window.claude.use('user'|'db'|'assets') bằng API của server này. */
(function(){
  var TK = 'dts_admin_token', UK = 'dts_uid';
  var token = null, uid = null;
  try{ token = localStorage.getItem(TK); uid = localStorage.getItem(UK); }catch(e){}
  if(!uid){
    uid = 'u' + Array.from(crypto.getRandomValues(new Uint8Array(12))).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
    try{ localStorage.setItem(UK, uid); }catch(e){}
  }
  var admin = false;
  function hdr(extra){ var h = Object.assign({}, extra); if(token) h.Authorization = 'Bearer ' + token; return h; }
  async function api(method, url, body, type){
    var r = await fetch(url, {method: method, headers: hdr(type ? {'Content-Type': type} : (body !== undefined ? {'Content-Type':'application/json'} : {})), body: body === undefined ? undefined : (type ? body : JSON.stringify(body))});
    var j = await r.json().catch(function(){ return {}; });
    if(!r.ok){ var e = new Error(j.error || ('Lỗi ' + r.status)); e.code = r.status; throw e; }
    return j;
  }
  function snapDoc(x){ return {id: x.id, data: function(){ return x.data; }}; }

  function col(name, order){
    var c = {
      orderBy: function(f, dir){ return col(name, {f: f, dir: dir || 'asc'}); },
      add: async function(data){ var r = await api('POST', '/api/c/' + name, data); return {id: r.id}; },
      onSnapshot: function(ok, bad){
        var stop = false, last = '';
        async function tick(){
          try{
            var list = await api('GET', '/api/c/' + name);
            if(order) list.sort(function(a,b){ var x = a.data[order.f], y = b.data[order.f]; return (x > y ? 1 : x < y ? -1 : 0) * (order.dir === 'desc' ? -1 : 1); });
            var s = JSON.stringify(list);
            if(s !== last){ last = s; ok({docs: list.map(snapDoc)}); }
          }catch(e){ if(bad) bad(e); }
        }
        tick();
        var h = setInterval(function(){ if(!stop && !document.hidden) tick(); }, 4000);
        return function(){ stop = true; clearInterval(h); };
      }
    };
    return c;
  }
  var dbApi = {
    collection: function(name){ return col(name); },
    doc: function(p){
      var a = p.split('/'), name = a[0], id = a[1], u = '/api/d/' + name + '/' + id;
      return {
        get: async function(){ var r = await api('GET', u); return {exists: !!r.exists, data: function(){ return r.data; }}; },
        set: function(d){ return api('PUT', u, d); },
        update: function(d){ return api('PATCH', u, d); },
        delete: function(){ return api('DELETE', u); }
      };
    }
  };
  var userApi = { canEdit: async function(){ await window.__dtsReady; return admin; }, id: async function(){ return uid; }, isOwner: function(){ return admin; } };
  var assetsApi = { upload: async function(blob){ return api('POST', '/api/upload', blob, blob.type || 'image/png'); } };

  window.claude = { use: async function(n){
    if(n === 'user') return userApi;
    if(n === 'db') return dbApi;
    if(n === 'assets') return admin ? assetsApi : null;
    return null;
  }};

  // Nút đăng nhập / đăng xuất giảng viên
  var btn = document.getElementById('btnLogin');
  window.__dtsReady = (async function(){
    if(token){ try{ admin = (await api('GET', '/api/me')).admin; if(!admin){ token = null; localStorage.removeItem(TK); } }catch(e){ admin = false; } }
    btn.textContent = admin ? 'Đăng xuất' : 'Giảng viên đăng nhập';
  })();
  btn.addEventListener('click', async function(){
    if(admin){ try{ localStorage.removeItem(TK); }catch(e){} location.reload(); return; }
    var pw = prompt('Nhập mật khẩu giảng viên:'); if(!pw) return;
    try{
      var r = await api('POST', '/api/login', {password: pw});
      try{ localStorage.setItem(TK, r.token); }catch(e){}
      location.reload();
    }catch(e){ alert(e.message || 'Đăng nhập thất bại'); }
  });
})();
