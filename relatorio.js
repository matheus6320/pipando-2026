// ===== URGÊNCIA =====
function calcUrgencia(c) {
  var datas = [];
  if(c.datasPasseios) {
    c.datasPasseios.forEach(function(dp) {
      if(dp.data) {
        var parts = dp.data.split('/');
        if(parts.length === 3) datas.push(new Date(parts[2], parts[1]-1, parts[0]));
      }
    });
  }
  if(!datas.length) return { nivel: 'sem-data', label: '⚫ Sem data', dias: 9999 };
  var hoje = new Date(); hoje.setHours(0,0,0,0);
  var maisProxima = datas.reduce(function(a,b){ return a < b ? a : b; });
  var diff = Math.round((maisProxima - hoje) / 86400000);
  if(diff < 0)  return { nivel: 'sem-data', label: '⚫ Encerrado', dias: 9999 };
  if(diff <= 2) return { nivel: 'vermelho',  label: '🔴 Urgente',   dias: diff };
  if(diff <= 7) return { nivel: 'amarelo',   label: '🟡 Atenção',   dias: diff };
  return { nivel: 'verde', label: '🟢 Tranquilo', dias: diff };
}

// ===== ORDENAÇÃO =====
function setOrdem(ordem) {
  _ordemAtual = ordem;
  document.querySelectorAll('.fnovo-ord-btn').forEach(function(b){ b.classList.remove('on'); });
  document.querySelectorAll('.filtro-ord-btn').forEach(function(b){ b.classList.remove('ativo'); });
  var btn = document.getElementById('ord-' + ordem);
  if(btn) { btn.classList.add('on'); btn.classList.add('ativo'); }
}

function renderChipsPasseios() {
  var wrap = document.getElementById('f-passeios-chips');
  if(!wrap) return;
  var nomes = new Set();
  carregarCotacoes().forEach(function(c) { (c.passeios||[]).forEach(function(p){ nomes.add(p); }); });
  wrap.innerHTML = '';
  if(!nomes.size) { wrap.innerHTML = '<span style="font-size:0.62rem;color:var(--mid)">Nenhum passeio cadastrado</span>'; return; }
  nomes.forEach(function(nome) {
    var chip = document.createElement('button');
    chip.className = 'filtro-passeio-chip' + (_passeiosselecionados.has(nome) ? ' ativo' : '');
    chip.textContent = nome;
    chip.onclick = function() {
      if(_passeiosselecionados.has(nome)) _passeiosselecionados.delete(nome);
      else _passeiosselecionados.add(nome);
      chip.classList.toggle('ativo');
    };
    wrap.appendChild(chip);
  });
}

function aplicarFiltros() {
  _paginaAtual = 1;
  mostrarLoading(true);
  setTimeout(function() { renderRelatorio(); mostrarLoading(false); }, 400);
}

function limparFiltros() {
  _filtroRapido = null;
  _paginaAtual = 1;
  _recolherFiltro();
  ['f-texto','f-data-ini','f-data-fim'].forEach(function(id) {
    var el = document.getElementById(id);
    if(el) el.value = '';
  });
  _passeiosselecionados = new Set();
  _filtroStatusSel   = new Set();
  _filtroPasseiosSel = new Set();
  _filtroUrgSel      = new Set();
  _filtroPeriodoTipo = 'cotacao';
  _ordemAtual        = 'recentes';
  setOrdem('recentes');
  setTipoPeriodo('cotacao');
  atualizarBotaoSel('status');
  atualizarBotaoSel('urgencia');
  atualizarBotaoSel('passeios');
  renderRelatorio();
  expandirFiltro();
}

// ===== PULL TO REFRESH =====
(function() {
  var startY = 0, pulling = false, threshold = 80;
  document.addEventListener('touchstart', function(e) {
    if(window.scrollY === 0) { startY = e.touches[0].clientY; pulling = true; }
  }, { passive: true });
  document.addEventListener('touchmove', function(e) {
    if(!pulling) return;
    var dy = e.touches[0].clientY - startY;
    var ind = document.getElementById('ptr-indicator');
    var txt = document.getElementById('ptr-txt');
    if(dy > 10 && window.scrollY === 0) {
      if(ind) ind.classList.add('show');
      if(txt) txt.textContent = dy > threshold ? 'Solte para atualizar' : 'Puxe para atualizar';
    }
  }, { passive: true });
  document.addEventListener('touchend', async function(e) {
    if(!pulling) return;
    var dy = e.changedTouches[0].clientY - startY;
    var ind = document.getElementById('ptr-indicator');
    var txt = document.getElementById('ptr-txt');
    var spinner = document.getElementById('ptr-spinner');
    pulling = false;
    if(dy > threshold && window.scrollY === 0) {
      if(ind) ind.classList.add('loading');
      if(txt) txt.textContent = 'Atualizando...';
      if(spinner) spinner.style.display = 'block';
      try {
        await carregarAtividadesDB();
        await carregarCotacoesDB();
        renderRelatorio(); renderSelectGrid(); renderConfig(); atualizarBadge();
      } catch(err) {}
    }
    if(ind) { ind.classList.remove('show','loading'); }
    if(spinner) spinner.style.display = 'none';
  });
})();

// ===== FILTRO NOVO =====
function setTipoPeriodo(tipo) {
  _filtroPeriodoTipo = tipo;
  var bc = document.getElementById('fper-cot');
  var bp = document.getElementById('fper-pas');
  if(bc) bc.classList.toggle('on', tipo === 'cotacao');
  if(bp) bp.classList.toggle('on', tipo === 'passeio');
}

function abrirPopFiltro(tipo) {
  if(tipo === 'passeios') renderPopPasseios();
  var el = document.getElementById('fpop-' + tipo);
  if(el) el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharPopFiltro(tipo) {
  var el = document.getElementById('fpop-' + tipo);
  if(el) el.classList.remove('open');
  document.body.style.overflow = '';
  atualizarBotaoSel(tipo);
}

function limparPopFiltro(tipo) {
  if(tipo === 'status') {
    _filtroStatusSel = new Set();
    document.querySelectorAll('#fpop-status-list .fpop-item').forEach(function(it) {
      it.classList.remove('sel');
      it.querySelector('.fpop-check').textContent = '';
    });
  } else if(tipo === 'urgencia') {
    _filtroUrgSel = new Set();
    document.querySelectorAll('#fpop-urgencia-list .fpop-item').forEach(function(it) {
      it.classList.remove('sel');
      it.querySelector('.fpop-check').textContent = '';
    });
  } else {
    _filtroPasseiosSel = new Set();
    document.querySelectorAll('#fpop-passeios-list .fpop-item').forEach(function(it) {
      it.classList.remove('sel');
      it.querySelector('.fpop-check').textContent = '';
    });
  }
  atualizarBotaoSel(tipo);
}

function togglePopItem(el, tipo) {
  var val = el.dataset.val;
  var sel = tipo === 'status' ? _filtroStatusSel : tipo === 'urgencia' ? _filtroUrgSel : _filtroPasseiosSel;
  if(sel.has(val)) {
    sel.delete(val);
    el.classList.remove('sel');
    el.querySelector('.fpop-check').textContent = '';
  } else {
    sel.add(val);
    el.classList.add('sel');
    el.querySelector('.fpop-check').textContent = '✓';
  }
}

function atualizarBotaoSel(tipo) {
  if(tipo === 'status') {
    var tagsEl = document.getElementById('fsel-status-tags');
    if(!tagsEl) return;
    if(_filtroStatusSel.size === 0) {
      tagsEl.innerHTML = '<span class="fnovo-sel-empty">Todos os status</span>';
    } else {
      var mapa = { pendente:{cls:'p',txt:'⏳ Pendente'}, retornado:{cls:'r',txt:'✅ Retornado'}, fechado:{cls:'f',txt:'🤝 Fechado'}, perdido:{cls:'x',txt:'❌ Perdido'} };
      tagsEl.innerHTML = Array.from(_filtroStatusSel).map(function(v){ var m=mapa[v]||{cls:'p',txt:v}; return '<span class="fnovo-tag '+m.cls+'">'+m.txt+'</span>'; }).join('');
    }
  } else if(tipo === 'urgencia') {
    var tagsEl3 = document.getElementById('fsel-urgencia-tags');
    if(!tagsEl3) return;
    if(_filtroUrgSel.size === 0) {
      tagsEl3.innerHTML = '<span class="fnovo-sel-empty">Todas as urgências</span>';
    } else {
      var mapaU = { vermelho:{cls:'urg',txt:'🔴 Urgente'}, amarelo:{cls:'att',txt:'🟡 Atenção'}, verde:{cls:'ok',txt:'🟢 Tranquilo'}, 'sem-data':{cls:'',txt:'⚫ Sem data'} };
      tagsEl3.innerHTML = Array.from(_filtroUrgSel).map(function(v){ var m=mapaU[v]||{cls:'',txt:v}; return '<span class="fnovo-tag '+m.cls+'" style="background:#F5EDE0;color:#7A3000">'+m.txt+'</span>'; }).join('');
    }
  } else {
    var tagsEl2 = document.getElementById('fsel-passeios-tags');
    if(!tagsEl2) return;
    if(_filtroPasseiosSel.size === 0) {
      tagsEl2.innerHTML = '<span class="fnovo-sel-empty">Todos os passeios</span>';
    } else {
      tagsEl2.innerHTML = Array.from(_filtroPasseiosSel).map(function(v){ return '<span class="fnovo-tag b">'+v+'</span>'; }).join('');
    }
  }
}

function renderPopPasseios() {
  var list = document.getElementById('fpop-passeios-list');
  if(!list) return;
  var cots = carregarCotacoes();
  var nomes = new Set();
  cots.forEach(function(c) { (c.passeios||[]).forEach(function(p){ nomes.add(p); }); });
  var contagem = {};
  cots.forEach(function(c) { (c.passeios||[]).forEach(function(p){ contagem[p]=(contagem[p]||0)+1; }); });
  list.innerHTML = '';
  nomes.forEach(function(nome) {
    var div = document.createElement('div');
    div.className = 'fpop-item' + (_filtroPasseiosSel.has(nome) ? ' sel' : '');
    div.dataset.val = nome;
    div.onclick = function() { togglePopItem(this, 'passeios'); };
    div.innerHTML = '<div class="fpop-check">'+(_filtroPasseiosSel.has(nome)?'✓':'')+'</div>'
      + '<div class="fpop-dot" style="background:#FE9D0E"></div>'
      + '<div><div class="fpop-label">'+nome+'</div>'
      + '<div class="fpop-sub">'+(contagem[nome]||0)+' cotação(ões)</div></div>';
    list.appendChild(div);
  });
  if(!nomes.size) list.innerHTML = '<div style="padding:16px;text-align:center;font-size:0.72rem;color:var(--mid)">Nenhum passeio encontrado</div>';
}

function aplicarFiltrosNovo() {
  _filtroRapido = null;
  _paginaAtual = 1;
  _recolherFiltro();
  mostrarLoading(true);
  setTimeout(function() { renderRelatorio(); mostrarLoading(false); }, 300);
}

function atualizarMiniTags() {
  var tagsEl  = document.getElementById('fnovo-mini-tags');
  var tituloEl = document.getElementById('fnovo-mini-titulo');
  if(!tagsEl) return;
  var tags = [];
  var ordMap = { recentes:'🕐 Recentes', urgencia:'🔴 Urgência', valor:'💰 Valor' };
  tags.push({ cls: _ordemAtual === 'urgencia' ? 'urg' : 'ord', txt: ordMap[_ordemAtual]||'🕐 Recentes' });
  if(_filtroStatusSel.size > 0) {
    var stMap = { pendente:'⏳', retornado:'✅', fechado:'🤝', perdido:'❌' };
    tags.push({ cls:'st', txt: Array.from(_filtroStatusSel).map(function(v){return stMap[v]||v;}).join(' ') });
  }
  if(_filtroUrgSel.size > 0) {
    var urgMap = { vermelho:'🔴', amarelo:'🟡', verde:'🟢', 'sem-data':'⚫' };
    tags.push({ cls:'urg', txt: Array.from(_filtroUrgSel).map(function(v){return urgMap[v]||v;}).join(' ') });
  }
  if(_filtroPasseiosSel.size > 0) {
    tags.push({ cls:'pas', txt: Array.from(_filtroPasseiosSel).map(function(n){return n.split(' ')[0];}).join(' · ') });
  }
  var ini = document.getElementById('f-data-ini') ? document.getElementById('f-data-ini').value : '';
  var fim = document.getElementById('f-data-fim') ? document.getElementById('f-data-fim').value : '';
  if(ini || fim) {
    var fmtD = function(d){ if(!d) return ''; var p=d.split('-'); return p[2]+'/'+p[1]; };
    var perIcon = _filtroPeriodoTipo === 'passeio' ? '📅' : '📋';
    tags.push({ cls:'per', txt: perIcon+' '+(ini?fmtD(ini):'')+(ini&&fim?' → ':'')+( fim?fmtD(fim):'') });
  }
  var temFiltros = _filtroStatusSel.size>0||_filtroUrgSel.size>0||_filtroPasseiosSel.size>0||ini||fim;
  if(tituloEl) tituloEl.textContent = temFiltros ? 'Filtros ativos' : 'Sem filtros ativos';
  tagsEl.innerHTML = tags.map(function(t){ return '<span class="fnovo-mini-tag '+t.cls+'">'+t.txt+'</span>'; }).join('');
}

function aplicarFiltroRapido(tipo) {
  _filtroRapido = tipo;
  _paginaAtual  = 1;
  _recolherFiltro();
  switchTab('relatorio');
  renderRelatorio();
}

function toggleFiltros() {
  var expand = document.getElementById('fnovo-expand');
  if(!expand) return;
  var aberto = expand.style.display !== 'none';
  expand.style.display = aberto ? 'none' : 'flex';
  var chevron = document.getElementById('fbar-chevron');
  if(chevron) chevron.textContent = aberto ? '▾' : '▴';
}

function expandirFiltro() {
  var expand = document.getElementById('fnovo-expand');
  if(expand) expand.style.display = 'flex';
  var chevron = document.getElementById('fbar-chevron');
  if(chevron) chevron.textContent = '▴';
}

function _recolherFiltro() {
  var expand = document.getElementById('fnovo-expand');
  if(expand) expand.style.display = 'none';
  var chevron = document.getElementById('fbar-chevron');
  if(chevron) chevron.textContent = '▾';
  _atualizarBadgeFiltros();
}

function _atualizarBadgeFiltros() {
  var ini = document.getElementById('f-data-ini')?.value || '';
  var fim = document.getElementById('f-data-fim')?.value || '';
  var count = _filtroStatusSel.size + _filtroUrgSel.size + _filtroPasseiosSel.size + (ini||fim ? 1 : 0);
  var badge = document.getElementById('fbar-badge');
  if(badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline-flex' : 'none'; }
}

// ===== RENDER RELATÓRIO =====
function msnRetorno(c) {
  const passeios = c.passeios.join(', ');
  return `Olá${c.nome ? `, *${c.nome}*` : ''}! Tudo bem? 😊\n\nVi que você recebeu nossa cotação ${c.numStr} para *${passeios}*.\n\nQueria saber se ficou alguma dúvida ou se posso ajudar a confirmar sua reserva! 🌊\n\n📲 (84) 9 8166-2637\n🌍 www.pipando.com.br`;
}

function renderRelatorio() {
  const todasCots = carregarCotacoes();
  const list = document.getElementById('rel-list');

  renderChipsPasseios();

  const sep = document.getElementById('resultados-sep');

  if(!todasCots.length) {
    if(sep) sep.style.display = 'none';
    list.innerHTML = '<div class="rel-empty"><span>📋</span>Nenhuma cotação registrada ainda.<br>Gere sua primeira cotação na aba <b>🧾 Realizar Cotação</b>.</div>';
    return;
  }

  const fTexto   = (document.getElementById('f-texto')?.value || '').toLowerCase().trim();
  const fStatus  = document.getElementById('f-status')?.value || '';
  const fDataIni = document.getElementById('f-data-ini')?.value || '';
  const fDataFim = document.getElementById('f-data-fim')?.value || '';

  let cots = todasCots.filter(c => {
    // Filtro rápido da home
    if(_filtroRapido) {
      const _hoje = new Date(); _hoje.setHours(0,0,0,0);
      if(_filtroRapido === 'amanha') {
        if(c.status === 'fechado' || c.status === 'perdido') return false;
        const _amanha = new Date(_hoje); _amanha.setDate(_amanha.getDate() + 1);
        return (c.datasPasseios||[]).some(dp => {
          if(!dp.data) return false;
          const p = dp.data.split('/');
          if(p.length !== 3) return false;
          const d = new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]));
          return d.getTime() === _amanha.getTime();
        });
      }
      if(_filtroRapido === 'followup') {
        if(!c.followupData || c.status === 'fechado' || c.status === 'perdido') return false;
        return new Date(c.followupData + 'T00:00:00') <= _hoje;
      }
      if(_filtroRapido === 'semana') {
        if(c.status === 'fechado' || c.status === 'perdido') return false;
        const _semana = new Date(_hoje); _semana.setDate(_semana.getDate() + 7);
        return (c.datasPasseios||[]).some(dp => {
          if(!dp.data) return false;
          const p = dp.data.split('/');
          if(p.length !== 3) return false;
          const d = new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]));
          return d >= _hoje && d <= _semana;
        });
      }
      if(_filtroRapido === 'hoje') {
        const _hojeStr = _hoje.toISOString().slice(0,10);
        return c.data && c.data.slice(0,10) === _hojeStr;
      }
    }
    if(fTexto) {
      const blob = [c.numStr, c.nome, c.wpp, c.wppFmt, ...(c.passeios||[]), c.periodoStr||''].join(' ').toLowerCase();
      if(!blob.includes(fTexto)) return false;
    }
    if(_filtroStatusSel.size > 0 && !_filtroStatusSel.has(c.status)) return false;
    if(_filtroUrgSel.size > 0) {
      var cUrg = calcUrgencia(c);
      if(!_filtroUrgSel.has(cUrg.nivel)) return false;
    }
    if(fDataIni || fDataFim) {
      if(_filtroPeriodoTipo === 'passeio') {
        var datasP = (c.datasPasseios||[]).filter(function(dp){return dp.data;}).map(function(dp){
          var p=dp.data.split('/'); return p.length===3 ? p[2]+'-'+p[1]+'-'+p[0] : '';
        }).filter(Boolean);
        if(datasP.length === 0) return false;
        var minData = datasP.sort()[0];
        if(fDataIni && minData < fDataIni) return false;
        if(fDataFim && minData > fDataFim) return false;
      } else {
        if(fDataIni && c.data.slice(0,10) < fDataIni) return false;
        if(fDataFim && c.data.slice(0,10) > fDataFim) return false;
      }
    }
    if(_filtroPasseiosSel.size > 0) {
      if(!(c.passeios||[]).some(p => _filtroPasseiosSel.has(p))) return false;
    }
    return true;
  });

  cots = cots.map(c => ({ ...c, _urg: calcUrgencia(c) }));

  const urgOrder = { vermelho:0, amarelo:1, verde:2, 'sem-data':3 };
  const statusFechados = ['fechado', 'perdido'];
  if(_ordemAtual === 'urgencia') {
    cots.sort((a, b) => {
      const aF = statusFechados.includes(a.status) ? 1 : 0;
      const bF = statusFechados.includes(b.status) ? 1 : 0;
      if(aF !== bF) return aF - bF;
      return (urgOrder[a._urg.nivel]||3) - (urgOrder[b._urg.nivel]||3) || a._urg.dias - b._urg.dias;
    });
  } else if(_ordemAtual === 'valor') {
    cots.sort((a, b) => b.total - a.total);
  } else {
    cots.sort((a, b) => (b.data||'').localeCompare(a.data||''));
  }

  const totalGeral = todasCots.reduce((s,c)=>s+c.total,0);
  const pendentes  = todasCots.filter(c=>c.status==='pendente').length;
  const fechados   = todasCots.filter(c=>c.status==='fechado').length;
  const resumo = `
    <div class="rel-resumo-bar">
      <div class="rel-resumo-chip"><span>Total</span><strong>${todasCots.length}</strong></div>
      <div class="rel-resumo-chip"><span>⏳ Pendentes</span><strong style="color:#856404">${pendentes}</strong></div>
      <div class="rel-resumo-chip"><span>🤝 Fechados</span><strong style="color:#1A6A3A">${fechados}</strong></div>
      <div class="rel-resumo-chip"><span>💰 Volume</span><strong>R$ ${fmt(totalGeral)}</strong></div>
    </div>
  `;

  const filtrando = fTexto || fStatus || fDataIni || fDataFim;
  const filtroInfo = filtrando ? `
    <div class="rel-filtrado-info">
      🔎 <span>${cots.length} resultado${cots.length !== 1 ? 's' : ''} de ${todasCots.length} cotações</span>
    </div>
  ` : '';

  if(sep) {
    const filtrando = fTexto || fDataIni || fDataFim || _filtroStatusSel.size || _filtroUrgSel.size || _filtroPasseiosSel.size;
    sep.style.display = 'flex';
    sep.innerHTML = filtrando
      ? `<span class="resultados-sep-txt">🔎 ${cots.length} resultado${cots.length !== 1 ? 's' : ''} de ${todasCots.length}</span>`
      : `<span class="resultados-sep-txt">📋 ${todasCots.length} cotação${todasCots.length !== 1 ? 'ões' : ''}</span>`;
  }

  if(!cots.length) {
    list.innerHTML = resumo + `<div class="rel-filtrado-info">🔎 Nenhuma cotação encontrada para os filtros selecionados.</div>`;
    return;
  }

  const _POR_PAGINA = 10;
  const _totalPags  = Math.ceil(cots.length / _POR_PAGINA);
  if(_paginaAtual > _totalPags) _paginaAtual = _totalPags;
  if(_paginaAtual < 1) _paginaAtual = 1;
  const _inicio = (_paginaAtual - 1) * _POR_PAGINA;
  const cotsPag = cots.slice(_inicio, _inicio + _POR_PAGINA);

  const wppIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.127 1.532 5.862L.06 23.386l5.666-1.452A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-5.003-1.37l-.36-.213-3.362.862.894-3.268-.234-.376A9.818 9.818 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z"/></svg>`;

  // Mapa de fechamentos por telefone para badge de frequente
  const _fechadosPorWpp = {};
  todasCots.forEach(function(x) {
    if(x.status === 'fechado' && x.wpp) _fechadosPorWpp[x.wpp] = (_fechadosPorWpp[x.wpp]||0) + 1;
  });

  list.innerHTML = resumo + filtroInfo + cotsPag.map(c => {
    const urg = c._urg || { nivel: 'sem-data', label: '', dias: 9999 };
    const urgCls = urg.nivel;
    const faltamVal = urg.dias < 9999 ? (urg.dias === 0 ? 'hoje' : urg.dias === 1 ? 'amanhã' : urg.dias + ' dias') : '—';
    const faltamCls = urgCls === 'vermelho' ? 'urg' : urgCls === 'amarelo' ? 'att' : urgCls === 'verde' ? 'ok' : '';
    const proximaData = urg.dias < 9999 ? (function() {
      var datas = [];
      (c.datasPasseios||[]).forEach(function(dp){ if(dp.data){ var p=dp.data.split('/'); if(p.length===3) datas.push({str:dp.data,d:new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0]))}); } });
      if(!datas.length) return '—';
      datas.sort(function(a,b){return a.d-b.d;});
      return datas[0].str;
    })() : '—';
    const passeiosHtml = (function() {
      var dps = c.datasPasseios || [];
      var pqs = c.passeiosQtds || [];
      if(!c.passeios||!c.passeios.length) return '';
      return c.passeios.map(function(nome,idx) {
        var dp = dps[idx]||{};
        var pq = pqs[idx]||{};
        var qtds = pq.qtds||{};
        var qtdsStr = Object.keys(qtds).filter(function(k){ return typeof qtds[k]==='number'&&qtds[k]>0&&k!=='__extras'; }).map(function(k){ return qtds[k]+' '+k; }).join(' · ');
        var dataStr = dp.data||'';
        var rel = {texto:'',cls:'neutro'};
        if(dataStr){
          var parts=dataStr.split('/');
          if(parts.length===3){
            var d=new Date(parseInt(parts[2]),parseInt(parts[1])-1,parseInt(parts[0]));
            var hoje=new Date(); hoje.setHours(0,0,0,0);
            var diff=Math.round((d-hoje)/86400000);
            if(diff===0) rel={texto:'hoje',cls:'hoje'};
            else if(diff===1) rel={texto:'amanhã',cls:'amanha'};
            else if(diff<0) rel={texto:'encerrado',cls:'neutro'};
            else { var dias=['domingo','segunda','terça','quarta','quinta','sexta','sábado']; rel=diff<=6?{texto:dias[d.getDay()],cls:'semana'}:{texto:diff+' dias',cls:'neutro'}; }
          }
        }
        return '<div class="rk-p"><div class="rk-p-left"><div class="rk-p-nome">🌊 '+esc(nome)+'</div>'+(qtdsStr?'<div class="rk-p-qtd">'+qtdsStr+'</div>':'')+'</div><div class="rk-p-right">'+(dataStr?'<div class="rk-p-data">'+dataStr+'</div>':'')+(rel.texto?'<div class="rk-p-rel '+rel.cls+'">'+rel.texto+'</div>':'')+'</div></div>';
      }).join('');
    })();
    return `
    <div class="rel-card urg-${urgCls}" id="relcard-${c.id}">
      <div class="rk-header" onclick="toggleRelCard('${c.id}')">
        <div class="rk-bar ${urgCls}"></div>
        <div class="rk-hinfo">
          <div class="rk-nome">
            ${c.nome || '<span style="opacity:0.45">Sem nome</span>'}
            ${c.temperatura ? `<span class="temp-pill temp-pill-${c.temperatura}">${TEMP_LABELS[c.temperatura]||''}</span>` : ''}
            ${(_fechadosPorWpp[c.wpp]||0) >= 2 ? `<span class="freq-badge" title="${_fechadosPorWpp[c.wpp]} reservas fechadas">⭐ Frequente</span>` : ''}
            ${_notasDot(c)}
          </div>
          <div class="rk-wpp">
            📲 ${c.wppFmt}
            ${c.origem ? `<span class="origem-badge">${ORIGEM_LABELS[c.origem]||c.origem}</span>` : ''}
          </div>
        </div>
        <div class="rk-hright">
          <div class="rk-total">${fmtBRL(c.total)}</div>
          <div class="rk-badges">
            ${_fuChip(c)}
            ${urgCls !== 'sem-data' ? '<span class="urg-pill '+urgCls+'">'+urg.label+'</span>' : ''}
            <button class="rel-status-badge ${c.status}" onclick="event.stopPropagation();cycleStatus('${c.id}')" title="Clique para mudar status">${STATUS_LABELS[c.status]||c.status}</button>
          </div>
        </div>
      </div>
      <div class="rk-grid">
        <div class="rk-cell"><div class="rk-cell-lbl">Nº cotação</div><div class="rk-cell-val">${c.numStr}</div></div>
        <div class="rk-cell"><div class="rk-cell-lbl">Data da cotação</div><div class="rk-cell-val">${c.dataStr}</div></div>
        <div class="rk-cell"><div class="rk-cell-lbl">Próximo passeio</div><div class="rk-cell-val ${faltamCls}">${proximaData}</div></div>
        <div class="rk-cell"><div class="rk-cell-lbl">Faltam</div><div class="rk-cell-val ${faltamCls}">${faltamVal}</div></div>
      </div>
      <div class="rk-passeios">${passeiosHtml}</div>
      <div class="rel-body" id="relBody-${c.id}" style="display:none">
        ${(() => {
          const midias = (c.passeiosMidia||[]).filter(p=>p.link);
          if(!midias.length) return '';
          return `<div>
            <div style="font-size:0.75rem;font-weight:800;color:var(--mid);margin-bottom:6px">📸 MÍDIA DOS PASSEIOS</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${midias.map(p=>`<button class="rel-btn midia" onclick="copiarMidia('${c.id}','${esc(p.nome)}','${esc(p.link)}',event.target)">🎥 ${esc(p.nome)}</button>`).join('')}
            </div>
          </div>`;
        })()}
        <div style="font-size:0.75rem;font-weight:700;color:var(--mid)">💬 Mensagem de retorno <span style="font-weight:600;opacity:0.7">(editável)</span></div>
        <textarea class="rel-msn-retorno" id="retorno-${c.id}">${msnRetorno(c)}</textarea>
        ${c.motivoPerda ? `<div class="motivo-perda-chip">❌ Motivo: ${esc(c.motivoPerda)}</div>` : ''}
        <div class="fu-notas-wrap">
          <div class="fu-field">
            <div class="fu-field-label">⏰ Próximo follow-up</div>
            <div class="fu-field-row">
              <input type="date" class="fu-date-input" value="${c.followupData||''}"
                onchange="salvarFollowup('${c.id}',this.value)">
              ${c.followupData ? `<button class="fu-clear-btn" onclick="salvarFollowup('${c.id}','')">× Limpar</button>` : ''}
            </div>
          </div>
          <div class="fu-field">
            <div class="fu-field-label">📝 Notas internas</div>
            <textarea class="notas-textarea" placeholder="Anotações privadas sobre este cliente..."
              oninput="onNotasInput('${c.id}',this.value)">${esc(c.notasInternas||'')}</textarea>
          </div>
        </div>
        <div class="rel-btn-row">
          <button class="rel-btn" style="background:var(--light);color:var(--ocean);border:1.5px solid #FFD89A" onclick="verCotacao('${c.id}')">🧾 Ver</button>
          <button class="rel-btn edit" onclick="editarCotacao('${c.id}')">✏️ Editar</button>
          <button class="rel-btn wpp" onclick="chamarWpp('${c.id}')">${wppIcon} Chamar no WhatsApp</button>
          <button class="rel-btn copy" onclick="copiarCotacaoOriginal('${c.id}')">📋 Mensagem original</button>
          <button class="rel-btn copy-retorno" onclick="copiarRetorno('${c.id}')">📤 Copiar retorno</button>
          <button class="rel-btn del" onclick="excluirCotacao('${c.id}')" title="Excluir">🗑</button>
        </div>
      </div>
    </div>
  `;
  }).join('') + _renderPaginacao(_paginaAtual, _totalPags, cots.length);
}

function _renderPaginacao(pagAtual, totalPags, totalItens) {
  if(totalPags <= 1) return '';

  const ini = (pagAtual - 1) * 10 + 1;
  const fim = Math.min(pagAtual * 10, totalItens);

  let bots = '';
  for(let i = 1; i <= totalPags; i++) {
    if(i === 1 || i === totalPags || (i >= pagAtual - 1 && i <= pagAtual + 1)) {
      bots += `<button class="pag-btn${i === pagAtual ? ' pag-ativa' : ''}" onclick="irParaPagina(${i})">${i}</button>`;
    } else if(i === pagAtual - 2 || i === pagAtual + 2) {
      bots += `<span class="pag-reticencias">…</span>`;
    }
  }

  return `
    <div class="pag-wrap">
      <div class="pag-info">Exibindo ${ini}–${fim} de ${totalItens} cotações</div>
      <div class="pag-controles">
        <button class="pag-btn pag-nav" onclick="irParaPagina(${pagAtual - 1})" ${pagAtual === 1 ? 'disabled' : ''}>‹</button>
        ${bots}
        <button class="pag-btn pag-nav" onclick="irParaPagina(${pagAtual + 1})" ${pagAtual === totalPags ? 'disabled' : ''}>›</button>
      </div>
    </div>
  `;
}

function irParaPagina(n) {
  _paginaAtual = n;
  renderRelatorio();
  document.getElementById('rel-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== FOLLOW-UP & NOTAS =====
var _notasTimer = null;

function salvarFollowup(id, data) {
  const cots = carregarCotacoes();
  const c = cots.find(x => x.id === id);
  if(!c) return;
  c.followupData = data || null;
  salvarCotacoes(cots);
  atualizarCotacaoDB(id, c).catch(console.error);
  renderRelatorio();
}

function onNotasInput(id, texto) {
  clearTimeout(_notasTimer);
  _notasTimer = setTimeout(function() { _salvarNotas(id, texto); }, 900);
}

function _salvarNotas(id, texto) {
  const cots = carregarCotacoes();
  const c = cots.find(x => x.id === id);
  if(!c) return;
  c.notasInternas = texto.trim();
  salvarCotacoes(cots);
  atualizarCotacaoDB(id, c).catch(console.error);
}

function _fuChip(c) {
  if(!c.followupData) return '';
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const d    = new Date(c.followupData + 'T00:00:00');
  const diff = Math.round((d - hoje) / 86400000);
  const ddmm = c.followupData.split('-').slice(1).reverse().join('/');
  if(diff < 0)  return `<span class="fu-chip fu-vencido">⏰ ${ddmm}</span>`;
  if(diff === 0) return `<span class="fu-chip fu-hoje">⏰ hoje</span>`;
  return `<span class="fu-chip fu-futuro">⏰ ${ddmm}</span>`;
}

function _notasDot(c) {
  return c.notasInternas ? '<span class="notas-dot" title="Tem notas">●</span>' : '';
}

function toggleRelCard(id) {
  const body = document.getElementById('relBody-' + id);
  body.style.display = body.style.display === 'none' ? 'flex' : 'none';
}

function cycleStatus(id) {
  const overlay = document.getElementById('status-sel-overlay');
  const cots    = carregarCotacoes();
  const c       = cots.find(x => x.id === id);
  if(!c) return;
  overlay.dataset.cotId = id;
  document.querySelectorAll('.status-sel-opt').forEach(btn => {
    btn.classList.toggle('current', btn.dataset.status === c.status);
  });
  overlay.classList.add('open');
}

function _fecharStatusSel() {
  document.getElementById('status-sel-overlay').classList.remove('open');
}

function _selecionarStatus(status) {
  const id = document.getElementById('status-sel-overlay').dataset.cotId;
  _fecharStatusSel();
  if(status === 'perdido') {
    _abrirModalMotivo(id);
    return;
  }
  const cots = carregarCotacoes();
  const c    = cots.find(x => x.id === id);
  if(!c) return;
  c.status = status;
  c.motivoPerda = null;
  salvarCotacoes(cots);
  atualizarCotacaoDB(id, c).catch(console.error);
  renderRelatorio();
}

function _abrirModalMotivo(id) {
  const overlay = document.getElementById('motivo-perdido-overlay');
  overlay.dataset.cotId = id;
  document.getElementById('motivo-outro-input').value = '';
  document.getElementById('motivo-outro-wrap').style.display = 'none';
  document.querySelectorAll('.motivo-opt').forEach(b => b.classList.remove('sel'));
  overlay.classList.add('open');
}

function _cancelarMotivo() {
  document.getElementById('motivo-perdido-overlay').classList.remove('open');
}

function _toggleOutro() {
  const wrap = document.getElementById('motivo-outro-wrap');
  const btn  = document.getElementById('motivo-btn-outro');
  const aberto = wrap.style.display !== 'none';
  wrap.style.display = aberto ? 'none' : 'block';
  btn.classList.toggle('sel', !aberto);
  if(!aberto) document.getElementById('motivo-outro-input').focus();
}

function _salvarPerdidoOutro() {
  const id     = document.getElementById('motivo-perdido-overlay').dataset.cotId;
  const motivo = document.getElementById('motivo-outro-input').value.trim() || '✏️ Outro';
  _salvarPerdido(id, motivo);
}

function _salvarPerdido(id, motivo) {
  const cots = carregarCotacoes();
  const c = cots.find(x => x.id === id);
  if(!c) return;
  c.status = 'perdido';
  c.motivoPerda = motivo || null;
  salvarCotacoes(cots);
  atualizarCotacaoDB(id, c).catch(console.error);
  document.getElementById('motivo-perdido-overlay').classList.remove('open');
  renderRelatorio();
}

function chamarWpp(id) {
  const cots = carregarCotacoes();
  const c = cots.find(x=>x.id===id);
  if(!c) return;
  const num = c.wpp.replace(/\D/g, '');
  const retorno = document.getElementById('retorno-' + id)?.value || msnRetorno(c);
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(retorno)}`, '_blank');
}

async function copiarCotacaoOriginal(id) {
  const cots = carregarCotacoes();
  const c = cots.find(x=>x.id===id);
  if(!c) return;
  try {
    await navigator.clipboard.writeText(c.textoWpp);
    flashBtn(event.target, '✅ Copiado!');
  } catch { alert('Copie manualmente:\n\n' + c.textoWpp); }
}

async function copiarRetorno(id) {
  const txt = document.getElementById('retorno-' + id)?.value;
  if(!txt) return;
  try {
    await navigator.clipboard.writeText(txt);
    flashBtn(event.target, '✅ Copiado!');
  } catch { alert('Copie manualmente:\n\n' + txt); }
}

async function copiarMidia(cotId, nomePasseio, link, btn) {
  const cots = carregarCotacoes();
  const c = cots.find(x=>x.id===cotId);
  const txt = `Olá${c?.nome ? `, *${c.nome}*` : ''}! 😊🌊\n\nDá uma olhada nas fotos e vídeos do *${nomePasseio}* — tenho certeza que vai amar! 🎥✨\n\n👉 ${link}\n\nQualquer dúvida é só chamar, vai ser um prazer te receber na Pipa! 🤙\n\n📲 (84) 9 8166-2637\n🌍 www.pipando.com.br`;
  try {
    await navigator.clipboard.writeText(txt);
    flashBtn(btn, '✅ Copiado!');
  } catch { alert('Copie manualmente:\n\n' + txt); }
}

function excluirCotacao(id) {
  if(!confirm('Excluir esta cotação?')) return;
  const cots = carregarCotacoes().filter(c=>c.id!==id);
  salvarCotacoes(cots);
  atualizarBadge();
  renderRelatorio();
}

function limparCotacoes() {
  if(!confirm('Limpar TODAS as cotações? Esta ação não pode ser desfeita.')) return;
  localStorage.removeItem('pipando_cotacoes');
  limparCotacoesDB().catch(console.error);
  atualizarBadge();
  renderRelatorio();
}

function limparCotacoesVencidas() {
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const todasCots = carregarCotacoes();

  const vencidas = todasCots.filter(c => {
    if(!c.datasPasseios || !c.datasPasseios.length) return false;
    const temDataValida = c.datasPasseios.some(dp => {
      if(!dp.data) return false;
      const p = dp.data.split('/');
      if(p.length !== 3) return false;
      const d = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
      return !isNaN(d.getTime());
    });
    if(!temDataValida) return false;
    return c.datasPasseios.every(dp => {
      if(!dp.data) return true;
      const p = dp.data.split('/');
      if(p.length !== 3) return true;
      const d = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
      return isNaN(d.getTime()) || d < hoje;
    });
  });

  if(!vencidas.length) {
    alert('Nenhuma cotação vencida encontrada.\n\nSão consideradas vencidas as cotações onde todos os passeios têm data anterior a hoje.');
    return;
  }

  if(!confirm(`Você tem certeza que deseja apagar ${vencidas.length} cotação(ões) vencida(s)?\n\nSão cotações onde todos os passeios já passaram da data de hoje.\n\nEsta ação não pode ser desfeita.`)) return;

  const ids = new Set(vencidas.map(c => c.id));
  const restantes = todasCots.filter(c => !ids.has(c.id));
  salvarCotacoes(restantes);
  vencidas.forEach(c => excluirCotacaoDB(c.id).catch(console.error));
  atualizarBadge();
  renderRelatorio();
  alert(`${vencidas.length} cotação(ões) vencida(s) removida(s) com sucesso.`);
}
