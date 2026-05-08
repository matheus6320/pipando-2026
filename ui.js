// ===== FORMATAÇÃO =====
function fmt(n) {
  return Number(n).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function fmtBRL(n) { return 'R$ ' + fmt(n); }

// ===== SEGURANÇA HTML =====
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
}

// ===== CRIAÇÃO DE ELEMENTOS =====
function mkEl(tag, props, parent) {
  var el = document.createElement(tag);
  Object.keys(props||{}).forEach(function(k){
    if(k === 'text')  el.textContent = props[k];
    else if(k === 'html')  el.innerHTML  = props[k];
    else if(k === 'style') el.style.cssText = props[k];
    else if(k === 'cls')   el.className  = props[k];
    else el[k] = props[k];
  });
  if(parent) parent.appendChild(el);
  return el;
}

// ===== TABS =====
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');
  const tabs = ['cotacao','dashboard','config','relatorio'];
  const idx = tabs.indexOf(tab);
  if(idx >= 0) document.querySelectorAll('.tab-btn')[idx].classList.add('active');
  if(tab === 'cotacao') {
    renderSelectGrid();
    document.getElementById('view-home').style.display = 'flex';
    document.getElementById('view-form').style.display = 'none';
    renderHome();
  }
  if(tab === 'relatorio') { renderChipsPasseios(); renderRelatorio(); }
  if(tab === 'dashboard') { renderDashboard(); }
  if(tab === 'config') { switchConfigTab('atividades'); }
}

// ===== BADGE =====
function atualizarBadge() {
  const cots = carregarCotacoes();
  const badge = document.getElementById('badge-count');
  if(cots.length > 0) {
    badge.style.display = 'inline';
    badge.textContent = cots.length;
  } else {
    badge.style.display = 'none';
  }
}

// ===== LOADING =====
function mostrarLoading(show) {
  var el = document.getElementById('loading-overlay');
  if(el) el.classList.toggle('show', show);
}

// ===== FLASH BUTTON =====
function flashBtn(btn, txt) {
  const orig = btn.innerHTML;
  btn.innerHTML = txt;
  setTimeout(() => btn.innerHTML = orig, 2000);
}
