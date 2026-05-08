// ===== NOTIFICAÇÕES DO NAVEGADOR =====

function _defaultNotifConfig() {
  return {
    followupVencido:  true,
    passeiosAmanha:   true,
    passeiosSemana:   false,
    clientesQuentes:  false,
  };
}

function carregarNotifConfig() {
  try {
    const salvo = JSON.parse(localStorage.getItem('pipando_notif_config') || 'null');
    if(!salvo) return _defaultNotifConfig();
    return { ..._defaultNotifConfig(), ...salvo };
  } catch { return _defaultNotifConfig(); }
}

function _salvarNotifConfig(cfg) {
  localStorage.setItem('pipando_notif_config', JSON.stringify(cfg));
}

// ===== PERMISSÃO =====
function pedirPermissaoNotificacoes() {
  if(!('Notification' in window)) return;
  if(Notification.permission === 'default') {
    Notification.requestPermission().then(() => renderNotifConfig());
  }
}

function statusPermissao() {
  if(!('Notification' in window)) return 'sem-suporte';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

// ===== ENVIO =====
function _enviarNotificacao(titulo, corpo, filtro) {
  if(statusPermissao() !== 'granted') return;
  const n = new Notification(titulo, {
    body: corpo,
    icon: 'https://teppkevfjvbvfoidlsxt.supabase.co/storage/v1/object/public/assets/logo.png',
    tag: filtro,
    requireInteraction: false,
  });
  n.onclick = function() {
    window.focus();
    if(filtro) aplicarFiltroRapido(filtro);
    n.close();
  };
}

// ===== VERIFICAÇÃO =====
function verificarNotificacoes() {
  if(statusPermissao() !== 'granted') return;
  const cfg  = carregarNotifConfig();
  const cots = carregarCotacoes();
  const hoje = new Date(); hoje.setHours(0,0,0,0);

  // Follow-ups vencidos
  if(cfg.followupVencido) {
    const n = cots.filter(c =>
      c.followupData &&
      c.status !== 'fechado' && c.status !== 'perdido' &&
      new Date(c.followupData + 'T00:00:00') <= hoje
    ).length;
    if(n > 0) _enviarNotificacao(
      `⏰ ${n} follow-up${n > 1 ? 's' : ''} pendente${n > 1 ? 's' : ''} hoje`,
      'Toque para ver as cotações — Pipando Passeios',
      'followup'
    );
  }

  // Passeios amanhã sem confirmação
  if(cfg.passeiosAmanha) {
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
    const n = cots.filter(c => {
      if(c.status === 'fechado' || c.status === 'perdido') return false;
      return (c.datasPasseios||[]).some(dp => {
        if(!dp.data) return false;
        const p = dp.data.split('/');
        if(p.length !== 3) return false;
        const d = new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]));
        return d.getTime() === amanha.getTime();
      });
    }).length;
    if(n > 0) _enviarNotificacao(
      `🔴 ${n} passeio${n > 1 ? 's' : ''} amanhã sem confirmação`,
      'Clientes ainda sem reserva confirmada — Pipando Passeios',
      'amanha'
    );
  }

  // Passeios esta semana pendentes
  if(cfg.passeiosSemana) {
    const semana = new Date(hoje); semana.setDate(semana.getDate() + 7);
    const n = cots.filter(c => {
      if(c.status === 'fechado' || c.status === 'perdido') return false;
      return (c.datasPasseios||[]).some(dp => {
        if(!dp.data) return false;
        const p = dp.data.split('/');
        if(p.length !== 3) return false;
        const d = new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]));
        return d >= hoje && d <= semana;
      });
    }).length;
    if(n > 0) _enviarNotificacao(
      `🟡 ${n} passeio${n > 1 ? 's' : ''} esta semana pendente${n > 1 ? 's' : ''}`,
      'Cotações ainda sem confirmação para esta semana',
      'semana'
    );
  }

  // Clientes quentes sem resposta
  if(cfg.clientesQuentes) {
    const n = cots.filter(c =>
      c.temperatura === 'quente' && c.status === 'pendente'
    ).length;
    if(n > 0) _enviarNotificacao(
      `🔥 ${n} cliente${n > 1 ? 's' : ''} quente${n > 1 ? 's' : ''} sem resposta`,
      'Atenção: oportunidades quentes aguardando — Pipando Passeios',
      'hoje'
    );
  }
}

// ===== RENDER DO PAINEL =====
function renderNotifConfig() {
  const cfg    = carregarNotifConfig();
  const status = statusPermissao();

  const permEl = document.getElementById('notif-permissao-status');
  const btnEl  = document.getElementById('notif-pedir-btn');
  const painel = document.getElementById('notif-toggles');

  if(!permEl) return;

  if(!('Notification' in window)) {
    permEl.innerHTML = '<span class="notif-badge notif-sem-suporte">⚠️ Navegador não suporta notificações</span>';
    if(btnEl)  btnEl.style.display  = 'none';
    if(painel) painel.style.display = 'none';
    return;
  }

  if(status === 'granted') {
    permEl.innerHTML = '<span class="notif-badge notif-ok">✅ Notificações ativadas</span>';
    if(btnEl)  btnEl.style.display  = 'none';
    if(painel) painel.style.display = 'flex';
  } else if(status === 'denied') {
    permEl.innerHTML = '<span class="notif-badge notif-bloq">🚫 Notificações bloqueadas — libere nas configurações do navegador</span>';
    if(btnEl)  btnEl.style.display  = 'none';
    if(painel) painel.style.display = 'none';
  } else {
    permEl.innerHTML = '<span class="notif-badge notif-pendente">🔔 Permissão não concedida ainda</span>';
    if(btnEl)  btnEl.style.display  = 'block';
    if(painel) painel.style.display = 'none';
  }

  // Preenche toggles
  const _c = (id, val) => { const el = document.getElementById(id); if(el) el.checked = !!val; };
  _c('notif-followup',  cfg.followupVencido);
  _c('notif-amanha',    cfg.passeiosAmanha);
  _c('notif-semana',    cfg.passeiosSemana);
  _c('notif-quentes',   cfg.clientesQuentes);
}

function salvarNotifConfigForm() {
  const _c = id => document.getElementById(id)?.checked ?? false;
  const cfg = {
    followupVencido: _c('notif-followup'),
    passeiosAmanha:  _c('notif-amanha'),
    passeiosSemana:  _c('notif-semana'),
    clientesQuentes: _c('notif-quentes'),
  };
  _salvarNotifConfig(cfg);
  const btn = document.getElementById('notif-salvar-btn');
  if(btn) {
    btn.textContent = '✅ Salvo!';
    btn.classList.add('saved');
    setTimeout(() => { btn.textContent = '💾 Salvar'; btn.classList.remove('saved'); }, 1800);
  }
}
