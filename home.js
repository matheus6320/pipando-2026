function renderHome() {
  const cots = carregarCotacoes();
  const h = new Date().getHours();
  const saud = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const subEl = document.querySelector('.home-greeting-sub');
  if(subEl) subEl.textContent = saud + ',';

  // Card de tarefas
  const tarefasEl = document.getElementById('home-tarefas-card');
  if(tarefasEl) {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const hojeStr = hoje.toISOString().slice(0,10);
    const amanha  = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
    const semana  = new Date(hoje); semana.setDate(semana.getDate() + 7);

    function _temPasseioNaData(c, dataAlvo) {
      return (c.datasPasseios||[]).some(dp => {
        if(!dp.data) return false;
        const p = dp.data.split('/');
        if(p.length !== 3) return false;
        const d = new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]));
        return d.getTime() === dataAlvo.getTime();
      });
    }
    function _temPasseioNaSemana(c) {
      return (c.datasPasseios||[]).some(dp => {
        if(!dp.data) return false;
        const p = dp.data.split('/');
        if(p.length !== 3) return false;
        const d = new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]));
        return d >= hoje && d <= semana;
      });
    }

    const nAmanha  = cots.filter(c => c.status !== 'fechado' && c.status !== 'perdido' && _temPasseioNaData(c, amanha)).length;
    const nFollowup = cots.filter(c => c.followupData && c.status !== 'fechado' && c.status !== 'perdido' && new Date(c.followupData + 'T00:00:00') <= hoje).length;
    const nSemana  = cots.filter(c => c.status !== 'fechado' && c.status !== 'perdido' && _temPasseioNaSemana(c)).length;
    const nHoje    = cots.filter(c => c.data && c.data.slice(0,10) === hojeStr).length;

    function _item(cor, icone, count, label, filtro) {
      const ativo = count > 0;
      const cls   = ativo ? `tarefa-item tarefa-${cor}` : 'tarefa-item tarefa-zero';
      const click = ativo ? `onclick="aplicarFiltroRapido('${filtro}')"` : '';
      return `<div class="${cls}" ${click}>
        <span class="tarefa-icone">${icone}</span>
        <span class="tarefa-count">${count}</span>
        <span class="tarefa-label">${label}</span>
        ${ativo ? '<span class="tarefa-seta">›</span>' : ''}
      </div>`;
    }

    tarefasEl.innerHTML = `
      <div class="tarefas-card">
        <div class="tarefas-titulo">📋 Resumo do dia</div>
        ${_item('vermelho','🔴', nAmanha,  'Passeios amanhã sem confirmação', 'amanha')}
        ${_item('laranja', '⏰', nFollowup,'Follow-ups vencidos',             'followup')}
        ${_item('amarelo', '🟡', nSemana,  'Passeios esta semana pendentes',  'semana')}
        ${_item('neutro',  '📋', nHoje,    'Cotações criadas hoje',           'hoje')}
      </div>`;
  }

  // Esconde banner antigo de follow-up (integrado no card de tarefas)
  const alertEl = document.getElementById('home-fu-alerta');
  if(alertEl) alertEl.style.display = 'none';
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();
  const cotsMes = cots.filter(c => {
    if(!c.data) return false;
    const d = new Date(c.data);
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });
  const infoEl = document.getElementById('home-info-resumo');
  if(infoEl) infoEl.textContent = cotsMes.length > 0
    ? cotsMes.length + ' cotaç' + (cotsMes.length===1?'ão':'ões') + ' este mês · Praia da Pipa, RN'
    : 'Praia da Pipa, RN · Pipando Passeios';

  const wrap = document.getElementById('home-cards-list');
  if(!wrap) return;
  const recentes = cots.slice(0, 5);
  if(!recentes.length) {
    wrap.innerHTML = '<div class="home-empty"><div class="home-empty-icon">🌊</div><div>Nenhuma cotação ainda</div><div style="margin-top:4px;opacity:0.7">Clique em Nova Cotação para começar</div></div>';
    return;
  }
  wrap.innerHTML = recentes.map(c => {
    const passeios = (c.passeios || []).join(' · ') || '—';
    const total = c.total ? 'R$ ' + Number(c.total).toLocaleString('pt-BR',{minimumFractionDigits:2}) : '';
    const status = c.status || 'pendente';
    const statusTxt = {pendente:'⏳ Pendente', retornado:'✅ Retornado', fechado:'🤝 Fechado', perdido:'❌ Perdido'}[status] || status;
    return `
      <div class="home-card" onclick="switchTab('relatorio')">
        <div class="home-card-left">
          <div class="home-card-num">${c.numStr||''} · ${c.dataStr||''}</div>
          <div class="home-card-nome">${esc(c.nome || 'Sem nome')}</div>
          <div class="home-card-passeios">🌊 ${esc(passeios)}</div>
        </div>
        <div class="home-card-right">
          <div class="home-card-val">${total}</div>
          <div class="home-card-status ${status}">${statusTxt}</div>
        </div>
      </div>`;
  }).join('');
}

function abrirFormCotacao() {
  document.getElementById('view-home').style.display = 'none';
  document.getElementById('view-form').style.display = 'block';
}

function voltarHome() {
  document.getElementById('view-form').style.display = 'none';
  document.getElementById('view-home').style.display = 'flex';
  renderHome();
}
