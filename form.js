// ===== ORIGEM DO CLIENTE =====
function setOrigem(val) {
  origemCliente = origemCliente === val ? null : val;
  Object.keys(ORIGEM_LABELS).forEach(k => {
    const btn = document.getElementById('orig-' + k);
    if(btn) btn.classList.toggle('active', origemCliente === k);
  });
}

// ===== TEMPERATURA DO CLIENTE =====
let temperaturaCliente = null;

function setTemperatura(val) {
  temperaturaCliente = temperaturaCliente === val ? null : val;
  ['frio','morno','quente'].forEach(t => {
    const btn = document.getElementById('temp-' + t);
    if(btn) btn.classList.toggle('active', temperaturaCliente === t);
  });
}

// ===== GRID DE SELEÇÃO =====
function renderSelectGrid() {
  const grid = document.getElementById('ativ-select-grid');
  if(!atividades.length) {
    grid.innerHTML = '<div class="empty-state"><span>🌊</span>Nenhuma atividade cadastrada ainda.<br>Vá em <b>⚙️ Configurar Atividades</b> para começar.</div>';
    return;
  }
  grid.innerHTML = atividades.map(a => {
    const sel = selecionadas.has(a.id);
    const tipos = a.tipos && a.tipos.length ? a.tipos : [{nome:'Adulto', valor: a.preco||0}];
    let resumo = '';
    if(sel && qtdsAtiv[a.id]) {
      const partes = tipos.filter(t => (qtdsAtiv[a.id][t.nome]||0) > 0)
                          .map(t => `${qtdsAtiv[a.id][t.nome]} ${t.nome}`);
      if(partes.length) resumo = `<div class="ativ-select-sinal" style="color:var(--ocean);margin-top:4px">${partes.join(' · ')}${datasAtiv[a.id] ? ' · 📅 ' + fmtDataDisplay(datasAtiv[a.id]) : ''}</div>`;
    }
    return `
    <div class="ativ-select-card ${sel ? 'selected' : ''}" id="card-${a.id}" onclick="abrirPopup('${a.id}')">
      <div class="check">✓</div>
      <div class="ativ-select-name">${esc(a.nome)}</div>
      ${resumo}
    </div>
  `}).join('');
}

function fmtDataDisplay(d) {
  if(!d) return '';
  const [y,m,dia] = d.split('-');
  return `${dia}/${m}/${y}`;
}

// ===== POPUP PASSAGEIROS =====
function abrirPopup(id) {
  const a = atividades.find(x => x.id === id);
  if(!a) return;
  popupAtivId = id;
  const tipos = a.tipos && a.tipos.length ? a.tipos : [{nome:'Adulto', valor: a.preco||0}];
  const qtds  = qtdsAtiv[id] || {};

  document.getElementById('popup-title').textContent = a.nome;
  document.getElementById('popup-subtitle').textContent = 'Informe a quantidade por tipo de passageiro';
  const dataAtual = datasAtiv[id] || '';
  document.getElementById('popup-data').value = dataAtual;
  const dispEl = document.getElementById('popup-data-display');
  if(dataAtual) {
    dispEl.textContent = fmtDataDisplay(dataAtual);
    dispEl.style.color = 'var(--dark)';
  } else {
    dispEl.textContent = 'Selecionar data';
    dispEl.style.color = '#B0A090';
  }

  document.getElementById('popup-campos').innerHTML = tipos.map((t,j) => `
    <div class="popup-campo-row">
      <div class="popup-campo-info">
        <div class="popup-campo-nome">${esc(t.nome)}</div>
        <div class="popup-campo-preco">R$ ${fmt(t.valor)} por pessoa</div>
      </div>
      <div class="popup-counter">
        <button class="popup-btn" onclick="popupAlterarQty('${esc(t.nome)}',-1)">−</button>
        <input class="popup-qty" type="number" min="0" id="pqty-${j}" value="${qtds[t.nome]||0}"
          inputmode="numeric"
          onchange="popupSetQty('${esc(t.nome)}',this.value)"
          oninput="popupSetQty('${esc(t.nome)}',this.value)">
        <button class="popup-btn" onclick="popupAlterarQty('${esc(t.nome)}',1)">+</button>
      </div>
    </div>
  `).join('');

  const descSalvo = descontosAtiv[id] || { modo: 'pct', valor: 0 };
  document.getElementById('pd-btn-pct').classList.toggle('active', descSalvo.modo === 'pct');
  document.getElementById('pd-btn-real').classList.toggle('active', descSalvo.modo === 'real');
  document.getElementById('popup-desc-valor').value = descSalvo.valor || '';
  document.getElementById('popup-desc-preview').textContent = '';

  var oldEb = document.getElementById('popup-extras-box');
  if(oldEb) oldEb.remove();
  var extrasDisp = a.extras || [];
  if(extrasDisp.length > 0) {
    var eb = document.createElement('div');
    eb.id = 'popup-extras-box';
    eb.style.cssText = 'margin-top:10px;background:#F0F7FF;border:1.5px solid #B5D4F4;border-radius:10px;padding:10px 12px';
    var eLbl = document.createElement('div');
    eLbl.style.cssText = 'font-size:0.62rem;font-weight:900;color:#185FA5;text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px';
    eLbl.textContent = '⭐ Extras e adicionais';
    eb.appendChild(eLbl);
    extrasDisp.forEach(function(ex, j) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px';
      var chk = document.createElement('input');
      chk.type = 'checkbox'; chk.id = 'ex-chk-' + j;
      chk.style.cssText = 'width:16px;height:16px;accent-color:#185FA5';
      chk.checked = !!(qtdsAtiv[id] && qtdsAtiv[id].__extras && qtdsAtiv[id].__extras[ex.nome]);
      var lbl = document.createElement('label');
      lbl.htmlFor = 'ex-chk-' + j;
      lbl.style.cssText = 'font-size:0.75rem;font-weight:700;color:var(--dark);cursor:pointer';
      var multInfo = ex.multiplica ? ' (por unidade)' : '';
      lbl.innerHTML = esc(ex.nome) + multInfo + ' <span style="color:#185FA5;font-weight:900">+R$ ' + fmt(ex.valor||0) + '</span>';
      row.appendChild(chk); row.appendChild(lbl); eb.appendChild(row);
    });
    document.querySelector('.popup-footer').before(eb);
  }
  const btnDescartar = document.getElementById('popup-btn-descartar');
  if(btnDescartar) btnDescartar.style.display = selecionadas.has(id) ? 'block' : 'none';

  document.getElementById('popup-overlay').classList.add('open');
}

function popupAlterarQty(nome, delta) {
  const a = atividades.find(x => x.id === popupAtivId);
  if(!a) return;
  const tipos = a.tipos && a.tipos.length ? a.tipos : [{nome:'Adulto', valor: a.preco||0}];
  if(!qtdsAtiv[popupAtivId]) qtdsAtiv[popupAtivId] = {};
  const cur = qtdsAtiv[popupAtivId][nome] || 0;
  const novo = Math.max(0, cur + delta);
  qtdsAtiv[popupAtivId][nome] = novo;
  const j = tipos.findIndex(t => t.nome === nome);
  const el = document.getElementById('pqty-' + j);
  if(el) el.value = novo;
}

function popupSetQty(nome, val) {
  if(!qtdsAtiv[popupAtivId]) qtdsAtiv[popupAtivId] = {};
  qtdsAtiv[popupAtivId][nome] = Math.max(0, parseInt(val) || 0);
}

function confirmarPopup() {
  if(!popupAtivId) return;
  const a = atividades.find(x => x.id === popupAtivId);
  if(a) {
    const tipos = a.tipos && a.tipos.length ? a.tipos : [{nome:'Adulto', valor: a.preco||0}];
    if(!qtdsAtiv[popupAtivId]) qtdsAtiv[popupAtivId] = {};
    tipos.forEach((t, j) => {
      const el = document.getElementById('pqty-' + j);
      if(el) qtdsAtiv[popupAtivId][t.nome] = Math.max(0, parseInt(el.value)||0);
    });
  }
  const qtds = qtdsAtiv[popupAtivId] || {};
  const total = Object.values(qtds).reduce((s,v)=>s+v,0);
  if(total === 0) { alert('Selecione ao menos 1 passageiro.'); return; }
  selecionadas.add(popupAtivId);
  datasAtiv[popupAtivId] = document.getElementById('popup-data').value;
  const descVal = parseFloat(document.getElementById('popup-desc-valor').value) || 0;
  if(!descontosAtiv[popupAtivId]) descontosAtiv[popupAtivId] = { modo: 'pct', valor: 0 };
  descontosAtiv[popupAtivId].valor = descVal;
  var aConf = atividades.find(function(x){return x.id===popupAtivId;});
  if(aConf && aConf.extras && aConf.extras.length > 0) {
    if(!qtdsAtiv[popupAtivId]) qtdsAtiv[popupAtivId]={};
    if(!qtdsAtiv[popupAtivId].__extras) qtdsAtiv[popupAtivId].__extras={};
    aConf.extras.forEach(function(ex,j) {
      var chk = document.getElementById('ex-chk-'+j);
      if(chk) qtdsAtiv[popupAtivId].__extras[ex.nome] = chk.checked;
    });
  }
  fecharPopupOverlay();
  renderSelectGrid();
}

function descartarPasseio() {
  if(!popupAtivId) return;
  selecionadas.delete(popupAtivId);
  delete qtdsAtiv[popupAtivId];
  delete datasAtiv[popupAtivId];
  delete descontosAtiv[popupAtivId];
  fecharPopupOverlay();
  renderSelectGrid();
}

function fecharPopupCancelar() {
  const qtds = qtdsAtiv[popupAtivId] || {};
  const total = Object.values(qtds).reduce((s,v)=>s+v,0);
  if(total === 0) selecionadas.delete(popupAtivId);
  var aConf = atividades.find(function(x){return x.id===popupAtivId;});
  if(aConf && aConf.extras && aConf.extras.length > 0) {
    if(!qtdsAtiv[popupAtivId]) qtdsAtiv[popupAtivId]={};
    if(!qtdsAtiv[popupAtivId].__extras) qtdsAtiv[popupAtivId].__extras={};
    aConf.extras.forEach(function(ex,j) {
      var chk = document.getElementById('ex-chk-'+j);
      if(chk) qtdsAtiv[popupAtivId].__extras[ex.nome] = chk.checked;
    });
  }
  fecharPopupOverlay();
  renderSelectGrid();
}

function fecharPopup(e) {
  if(e.target === document.getElementById('popup-overlay')) fecharPopupCancelar();
}

function fecharPopupOverlay() {
  document.getElementById('popup-overlay').classList.remove('open');
  popupAtivId = null;
}

// ===== GERAR COTAÇÃO =====
function gerarCotacao() {
  const _cfg = carregarCotacaoConfig();
  const _ex  = _cfg.exibicao;
  const _ap  = _cfg.aparencia;

  const sels = atividades.filter(a => selecionadas.has(a.id));
  if(!sels.length) { alert('Selecione ao menos uma atividade.'); return; }

  const wppRaw = document.getElementById('wpp-cliente').value.trim();
  const wppNumeros = wppRaw.replace(/\D/g,'');
  if(!wppRaw || wppRaw.length < 4) {
    document.getElementById('wpp-cliente').classList.add('wpp-error');
    document.getElementById('wpp-erro').style.display = 'block';
    document.getElementById('wpp-cliente').focus();
    return;
  }
  document.getElementById('wpp-erro').style.display = 'none';

  let wppFmt = wppRaw.trim();
  let totalGeral = 0, totalSinal = 0;
  let itensHTML = '';
  let linhasWpp = '';
  const nome = document.getElementById('nome-cliente').value.trim();
  const agora = new Date();
  const dataStr = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const numCot = proximoNumCotacao();
  const numStr = '#' + String(numCot).padStart(4,'0');

  const periodoIni = document.getElementById('periodo-inicio').value;
  const periodoFim = document.getElementById('periodo-fim').value;
  function fmtData(d) {
    if(!d) return '';
    const [y,m,dia] = d.split('-');
    return `${dia}/${m}/${y}`;
  }
  const periodoStr = periodoIni && periodoFim
    ? `${fmtData(periodoIni)} até ${fmtData(periodoFim)}`
    : periodoIni ? `a partir de ${fmtData(periodoIni)}`
    : periodoFim ? `até ${fmtData(periodoFim)}` : '';

  let noitesStr = '';
  if(periodoIni && periodoFim) {
    const diff = (new Date(periodoFim) - new Date(periodoIni)) / 86400000;
    if(diff > 0) noitesStr = `${diff} noite${diff>1?'s':''}`;
  }

  let taxasPorAtiv = [];

  sels.forEach(a => {
    const tipos = a.tipos && a.tipos.length ? a.tipos : [{nome:'Adulto', valor:a.preco||0, sinalModo:'fixo', sinalValor:0}];
    const qtds  = qtdsAtiv[a.id] || {};
    const tiposAtivos = tipos.filter(t => (qtds[t.nome]||0) > 0);
    const subtotalTipos = tipos.reduce((s,t)=>s+(qtds[t.nome]||0)*t.valor, 0);

    const taxasNew = a.taxasNew || (a.taxas||[]).map(tx=>({id:uid(),nome:tx.nome,tipos:tipos.map(t=>({nome:t.nome,modo:'fixo',valor:tx.valor||0}))}));
    let subtaxas = 0;
    const _taxasAtivTemp = [];
    taxasNew.forEach(tx => {
      let txTotal = 0;
      tipos.forEach(t => {
        const qty = qtds[t.nome]||0;
        if(!qty) return;
        const entry = (tx.tipos||[]).find(x=>x.nome===t.nome)||{modo:'fixo',valor:0};
        const val = entry.modo==='pct' ? qty*(t.valor*entry.valor/100) : qty*entry.valor;
        subtaxas += val;
        txTotal += val;
      });
      if(txTotal > 0) _taxasAtivTemp.push({ nome: tx.nome, total: txTotal });
    });
    if(_taxasAtivTemp.length > 0) taxasPorAtiv.push({ nomeAtiv: a.nome, taxas: _taxasAtivTemp });

    const descAtiv = descontosAtiv[a.id] || { modo: 'pct', valor: 0 };
    let descAtivVal = 0;
    if(descAtiv.valor > 0) {
      descAtivVal = descAtiv.modo === 'pct' ? subtotalTipos * descAtiv.valor / 100 : descAtiv.valor;
      descAtivVal = Math.min(descAtivVal, subtotalTipos);
    }
    const subtotalComDesconto = subtotalTipos - descAtivVal;

    let sinalAtiv = 0;
    if(a.sinalAtivo) {
      let sinalBase = 0;
      tipos.forEach(t => {
        const qty = qtds[t.nome]||0;
        if(!qty) return;
        const sv = t.sinalModo==='pct' ? (t.valor*(t.sinalValor||0)/100) : (t.sinalValor||0);
        sinalBase += qty * sv;
      });
      if(descAtivVal > 0 && subtotalTipos > 0) {
        const proporcao = subtotalComDesconto / subtotalTipos;
        sinalAtiv = sinalBase * proporcao;
      } else {
        sinalAtiv = sinalBase;
      }
    }

    const extrasAtiv = (qtdsAtiv[a.id] && qtdsAtiv[a.id].__extras) ? qtdsAtiv[a.id].__extras : {};
    const extrasArr = a.extras || [];
    let subtotalExtras = 0, sinalExtras = 0;
    extrasArr.forEach(ex => {
      if(!extrasAtiv[ex.nome]) return;
      const paxTot = tiposAtivos.reduce((s,t) => s + (qtds[t.nome]||0), 0);
      const mult = ex.multiplica ? paxTot : 1;
      const val = (ex.valor||0) * mult;
      subtotalExtras += val;
      const sv = ex.sinalModo === 'pct' ? val * (ex.sinal||0) / 100 : (ex.sinal||0) * mult;
      sinalExtras += sv;
      (ex.taxas||[]).forEach(tx => {
        if(!tx.nome || !tx.valor) return;
        const txVal = tx.multiplica ? (tx.valor * paxTot) : tx.valor;
        if(txVal <= 0) return;
        let entry = taxasPorAtiv.find(e => e.nomeAtiv === a.nome);
        if(!entry) { entry = { nomeAtiv: a.nome, taxas: [] }; taxasPorAtiv.push(entry); }
        const existing = entry.taxas.find(t => t.nome === tx.nome);
        if(existing) existing.total += txVal;
        else entry.taxas.push({ nome: tx.nome, total: txVal });
      });
    });
    totalGeral += subtotalComDesconto + subtotalExtras;
    totalSinal += sinalAtiv + sinalExtras;

    const dataPasseio = datasAtiv[a.id] ? fmtData(datasAtiv[a.id]) : '';
    const temExtrasSel = extrasArr.some(ex => extrasAtiv[ex.nome]);

    itensHTML += `
      <div class="nota-item">
        <div class="nota-item-name">${esc(a.nome)}
          ${dataPasseio && _ex.dataPorPasseio ? `<span class="nota-item-sub">📅 ${dataPasseio}</span>` : ''}
          ${!temExtrasSel && _ex.qtdPorTipo ? tiposAtivos.map(t=>`<span class="nota-item-sub">${qtds[t.nome]} ${esc(t.nome)} × ${fmtBRL(t.valor)} = ${fmtBRL(qtds[t.nome]*t.valor)}</span>`).join('') : ''}
        </div>
        <div class="nota-item-val">${temExtrasSel ? '' : fmtBRL(subtotalTipos)}</div>
      </div>
    `;
    if(descAtivVal > 0) {
      const descLabel = descAtiv.modo === 'pct' ? `🏷️ Desconto ${descAtiv.valor}%` : `🏷️ Desconto`;
      itensHTML += `
        <div class="nota-taxa-item" style="color:#0F6E56">
          <div class="nota-taxa-name" style="color:#0F6E56">${descLabel}</div>
          <div class="nota-taxa-val" style="color:#0F6E56">− ${fmtBRL(descAtivVal)}</div>
        </div>
      `;
      if(_ex.subtotalPorPasseio) itensHTML += `
        <div class="nota-taxa-item" style="color:#0F6E56;font-weight:900">
          <div class="nota-taxa-name" style="color:#0F6E56;font-weight:900">✓ Subtotal ${esc(a.nome)}</div>
          <div class="nota-taxa-val" style="color:#0F6E56;font-weight:900">${fmtBRL(subtotalComDesconto)}</div>
        </div>
      `;
    }
    if(_ex.extrasDetalhados) {
      extrasArr.forEach(ex => {
        if(!extrasAtiv[ex.nome]) return;
        itensHTML += '<div class="nota-taxa-item" style="color:#185FA5">'
          + '<div class="nota-taxa-name" style="color:#185FA5">&#11088; ' + esc(ex.nome) + '</div>'
          + '<div class="nota-taxa-val"></div></div>';
      });
    }
    if(subtotalExtras > 0) {
      const totalComExtras = subtotalComDesconto + subtotalExtras;
      const sinalTotalEx = sinalAtiv + sinalExtras;
      itensHTML += '<div class="nota-taxa-item" style="font-weight:900;border-top:1px dashed #B5D4F4;padding-top:5px;margin-top:3px">'
        + '<div class="nota-taxa-name" style="font-weight:900">&#128176; Total</div>'
        + '<div class="nota-taxa-val" style="font-weight:900">' + fmtBRL(totalComExtras) + '</div></div>';
      if(sinalTotalEx > 0 && _ex.sinalPorPasseio) {
        itensHTML += '<div class="nota-taxa-item" style="color:#0F6E56">'
          + '<div class="nota-taxa-name" style="color:#0F6E56">&#128179; Sinal para confirmar</div>'
          + '<div class="nota-taxa-val" style="color:#0F6E56">' + fmtBRL(sinalTotalEx) + '</div></div>';
        itensHTML += '<div class="nota-taxa-item" style="color:#0F6E56;opacity:0.8">'
          + '<div class="nota-taxa-name" style="color:#0F6E56">&#128197; Restante (a pagar no dia)</div>'
          + '<div class="nota-taxa-val" style="color:#0F6E56">' + fmtBRL(Math.max(0, totalComExtras - sinalTotalEx)) + '</div></div>';
      }
    }

    linhasWpp += `🌊 *${a.nome}*${dataPasseio && _ex.dataPorPasseio ? ` — 📅 ${dataPasseio}` : ''}\n`;
    if(!temExtrasSel && _ex.qtdPorTipo) {
      tiposAtivos.forEach(t => {
        linhasWpp += `   ${qtds[t.nome]} ${t.nome} × R$ ${fmt(t.valor)} = *R$ ${fmt(qtds[t.nome]*t.valor)}*\n`;
      });
    }
    if(descAtivVal > 0) {
      const descLabelWpp = descAtiv.modo === 'pct' ? `${descAtiv.valor}%` : `R$ ${fmt(descAtivVal)}`;
      linhasWpp += `   🏷️ Desconto ${descLabelWpp} = *− R$ ${fmt(descAtivVal)}*\n`;
      if(_ex.subtotalPorPasseio) linhasWpp += `   ✓ Subtotal: *R$ ${fmt(subtotalComDesconto)}*\n`;
    }
    if(_ex.extrasDetalhados) {
      extrasArr.forEach(ex => {
        if(!extrasAtiv[ex.nome]) return;
        linhasWpp += '   ⭐ ' + ex.nome + '\n';
      });
    }
    if(subtotalExtras > 0) {
      const totalExWpp = subtotalComDesconto + subtotalExtras;
      const sinalExWpp = sinalAtiv + sinalExtras;
      linhasWpp += '   💰 Total: *R$ ' + fmt(totalExWpp) + '*\n';
      if(sinalExWpp > 0 && _ex.sinalPorPasseio) {
        linhasWpp += '   💳 Sinal: *R$ ' + fmt(sinalExWpp) + '*\n';
        linhasWpp += '   📅 Restante (a pagar no dia): *R$ ' + fmt(Math.max(0, totalExWpp - sinalExWpp)) + '*\n';
      }
    }
    if(!subtotalExtras && a.sinalAtivo && sinalAtiv > 0 && _ex.sinalPorPasseio) linhasWpp += `   💳 Sinal: R$ ${fmt(sinalAtiv)}\n`;
    linhasWpp += '\n';
  });

  const dgVal = parseFloat(document.getElementById('desc-geral-valor').value) || 0;
  let descontoGeralVal = 0;
  if(dgVal > 0) {
    descontoGeralVal = descontoGeral.modo === 'pct' ? totalGeral * dgVal / 100 : dgVal;
    descontoGeralVal = Math.min(descontoGeralVal, totalGeral);
    totalGeral -= descontoGeralVal;
  }

  const descontoGeralHTML = descontoGeralVal > 0 ? `
    <div class="nota-taxa-item" style="color:#185FA5;border-top:1px dashed #B5D4F4;padding-top:6px;margin-top:2px">
      <div class="nota-taxa-name" style="color:#185FA5">🏷️ Desconto geral${descontoGeral.modo === 'pct' ? ' ' + dgVal + '%' : ''}</div>
      <div class="nota-taxa-val" style="color:#185FA5">− ${fmtBRL(descontoGeralVal)}</div>
    </div>
  ` : '';

  const restanteDia = totalGeral - totalSinal;
  const sinalHTML = totalSinal > 0 ? `
    <div class="nota-sinal-row">
      <div class="nota-sinal-label">💳 Sinal para confirmar</div>
      <div class="nota-sinal-val">${fmtBRL(totalSinal)}</div>
    </div>
    <div class="nota-sinal-row" style="opacity:0.75;font-size:0.7rem;margin-top:2px">
      <div class="nota-sinal-label">📅 Restante (a pagar no dia)</div>
      <div class="nota-sinal-val" style="font-size:0.75rem">${fmtBRL(Math.max(0, restanteDia))}</div>
    </div>
  ` : '';

  let totalTaxasGeral = 0;
  taxasPorAtiv.forEach(at => at.taxas.forEach(tx => { totalTaxasGeral += tx.total; }));

  const taxasHTML = taxasPorAtiv.length > 0 ? `
    <div style="margin-top:10px;padding:10px 12px;background:#FFF8F0;border-radius:10px;border:1.5px dashed #FFD89A">
      <div style="font-size:0.62rem;font-weight:900;color:#C06A10;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">
        ⚠️ Taxas pagas no dia
      </div>
      ${taxasPorAtiv.map(at => `
        <div style="margin-bottom:6px">
          <div style="font-size:0.68rem;font-weight:900;color:#8B5E3C;margin-bottom:3px">${esc(at.nomeAtiv)}</div>
          ${at.taxas.map(tx => `
            <div class="nota-taxa-item">
              <div class="nota-taxa-name">↳ ${esc(tx.nome)}</div>
              <div class="nota-taxa-val">${fmtBRL(tx.total)}</div>
            </div>
          `).join('')}
        </div>
      `).join('')}
      ${taxasPorAtiv.length > 1 ? `
        <div class="nota-taxa-item" style="border-top:1px dashed #FFD89A;padding-top:5px;margin-top:3px">
          <div class="nota-taxa-name" style="font-weight:900;color:#C06A10">Total taxas</div>
          <div class="nota-taxa-val" style="font-weight:900">${fmtBRL(totalTaxasGeral)}</div>
        </div>
      ` : ''}
    </div>
  ` : '';

  const bars = Array.from({length:28}, (_,i) => {
    const w = [1,2,1,3,1,2,1,1,2,3,1,2,1,1,3,2,1,2,1,3,1,1,2,1,3,2,1,1][i]||1;
    return `<div class="nota-barcode-bar" style="width:${w+1}px"></div>`;
  }).join('');

  document.getElementById('nota-num').textContent = numStr;
  document.getElementById('nota-body').innerHTML = `
    <div class="nota-date">📅 ${dataStr}</div>
    <div class="nota-cliente-row">
      <div>
        ${nome ? `<div class="nota-cliente-name">👤 ${esc(nome)}</div>` : ''}
        <div class="nota-cliente-name" style="font-size:0.78rem;color:#C06A10;margin-top:${nome?'3px':'0'}">📲 ${wppFmt}</div>
        ${periodoStr ? `<div class="nota-cliente-name" style="font-size:0.75rem;color:#1A7A3A;margin-top:3px;font-weight:700">🗓 ${periodoStr}${noitesStr ? ` (${noitesStr})` : ''}</div>` : ''}
      </div>
    </div>
    ${itensHTML}
    ${descontoGeralHTML}
    <div class="nota-total-section">
      <div class="nota-total-row">
        <div class="nota-total-label">💰 Total dos Passeios</div>
        <div class="nota-total-val">${fmtBRL(totalGeral)}</div>
      </div>
      ${sinalHTML}
    </div>
    ${taxasHTML}
    <div class="nota-footer">
      <div class="nota-footer-site">🌍 ${esc(_ap.site)} · 📲 ${esc(_ap.telefone)}</div>
      ${_ap.rodapeCard ? `<div class="nota-footer-cadastur">⭐ ${esc(_ap.rodapeCard)}</div>` : ''}
      <div class="nota-barcode">${bars}</div>
    </div>
  `;

  const nomeCliente = nome ? `${_ap.saudacao}, *${nome}*! ` : `${_ap.saudacao}! `;
  let wpp = `${nomeCliente}Segue a cotação ${numStr} dos passeios:\n\n`;
  if(periodoStr) wpp += `🗓 *Período:* ${periodoStr}${noitesStr ? ` (${noitesStr})` : ''}\n`;
  wpp += `━━━━━━━━━━━━━━━\n\n`;
  wpp += linhasWpp;
  if(descontoGeralVal > 0) {
    const dgLabelWpp = descontoGeral.modo === 'pct' ? `${dgVal}%` : `R$ ${fmt(descontoGeralVal)}`;
    wpp += `🏷️ Desconto geral ${dgLabelWpp} = *− R$ ${fmt(descontoGeralVal)}*\n`;
  }
  wpp += `━━━━━━━━━━━━━━━\n`;
  wpp += `💰 *TOTAL dos passeios: R$ ${fmt(totalGeral)}*\n`;
  if(totalSinal > 0) {
    wpp += `💳 *Sinal para confirmar: R$ ${fmt(totalSinal)}*\n`;
    wpp += `📅 *Restante (a pagar no dia): R$ ${fmt(Math.max(0, totalGeral - totalSinal))}*\n`;
  }
  if(taxasPorAtiv.length > 0) {
    wpp += `\n⚠️ *Taxas pagas no dia:*\n`;
    taxasPorAtiv.forEach(at => {
      wpp += `\n*${at.nomeAtiv}*\n`;
      at.taxas.forEach(tx => { wpp += `   ${tx.nome}: *R$ ${fmt(tx.total)}*\n`; });
    });
    if(taxasPorAtiv.length > 1) wpp += `\nTotal taxas: *R$ ${fmt(totalTaxasGeral)}*\n`;
  }
  wpp += `\n📌 Para cotação e informações:\n`;
  if(_ap.site)     wpp += `🌍 ${_ap.site}\n`;
  if(_ap.telefone) wpp += `📲 ${_ap.telefone}\n`;
  if(_ap.rodapeWpp) wpp += `\n_${_ap.rodapeWpp}_`;

  document.getElementById('wpp-texto').textContent = wpp;

  abrirPopupResultado();

  const notaHtml = document.getElementById('nota-fiscal').outerHTML;

  const dadosCotacao = {
    nome: nome || '',
    wpp: wppNumeros,
    wppFmt,
    passeios: sels.map(a => a.nome),
    passeiosQtds: sels.map(a => ({ nome: a.nome, qtds: qtdsAtiv[a.id]||{} })),
    passeiosMidia: sels.map(a => ({ nome: a.nome, link: a.linkMidia || '' })),
    datasPasseios: sels.map(a => ({ nome: a.nome, data: datasAtiv[a.id] ? fmtData(datasAtiv[a.id]) : '' })),
    periodoStr,
    periodoIni,
    periodoFim,
    noitesStr,
    total: totalGeral,
    sinal: totalSinal,
    textoWpp: wpp,
    notaHtml: notaHtml,
    dataStr,
    temperatura: temperaturaCliente,
    origem: origemCliente,
    descontosPasseios: sels.map(a => { const d = descontosAtiv[a.id]||{modo:'pct',valor:0}; return {nome:a.nome,modo:d.modo,valor:d.valor}; }),
    descontoGeralModo: descontoGeral.modo,
    descontoGeralValor: descontoGeral.valor,
    extrasPasseios: sels.map(a => ({ nome: a.nome, extras: (qtdsAtiv[a.id]&&qtdsAtiv[a.id].__extras) ? {...qtdsAtiv[a.id].__extras} : {} })),
  };

  if(_cotacaoEmEdicao) {
    const cotsAtual = carregarCotacoes();
    const original  = cotsAtual.find(c => c.id === _cotacaoEmEdicao);
    substituirCotacao(_cotacaoEmEdicao, {
      ...dadosCotacao,
      id: original.id,
      num: original.num,
      numStr: original.numStr,
      data: original.data,
      status: original.status,
      editadoEm: agora.toISOString(),
    });
    _cotacaoEmEdicao = null;
  } else {
    registrarCotacao({
      ...dadosCotacao,
      id: uid(),
      num: numCot,
      numStr,
      data: agora.toISOString(),
      status: 'pendente',
    });
  }
}

// ===== POPUP RESULTADO =====
function abrirPopupResultado() {
  const dest = document.getElementById('popup-resultado-content');
  const notaEl = document.getElementById('nota-fiscal');
  const wppEl  = document.getElementById('wpp-texto');
  const notaHtmlClone = notaEl ? notaEl.outerHTML
    .replace('id="nota-fiscal"','id="popup-nota-fiscal"')
    .replace('id="nota-num"','id="popup-nota-num"')
    .replace('id="nota-body"','id="popup-nota-body"') : '';
  const wppTexto = wppEl ? wppEl.textContent : '';

  dest.innerHTML = `
    <div class="section-title" style="margin-bottom:0">🧾 Nota de Cotação</div>
    ${notaHtmlClone}
    <div class="btn-img-row">
      <button class="btn-salvar-img" id="popup-btn-salvar" onclick="salvarImagemPopup()">
        <span>📥</span> Salvar Imagem
      </button>
    </div>
    <div class="wpp-section">
      <div class="wpp-label">📲 Texto para WhatsApp</div>
      <div class="wpp-box" id="popup-wpp-texto" contenteditable="true">${wppTexto.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
      <button class="btn-copiar" id="popup-btn-copiar" onclick="copiarTextoPopup()">
        <span>📋</span> Copiar para WhatsApp
      </button>
    </div>
  `;

  document.getElementById('popup-resultado-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.querySelector('#popup-resultado-overlay .popup-resultado-close').onclick = fecharPopupResultado;
}

function verCotacao(id) {
  const cots = carregarCotacoes();
  const c = cots.find(x => x.id === id);
  if(!c) return;
  const dest = document.getElementById('popup-resultado-content');

  if(c.notaHtml) {
    let notaClone = c.notaHtml
      .replace('id="nota-fiscal"','id="popup-nota-fiscal"')
      .replace('id="nota-num"','id="popup-nota-num"')
      .replace('id="nota-body"','id="popup-nota-body"');
    dest.innerHTML = `
      <div class="section-title" style="margin-bottom:0">🧾 Nota de Cotação</div>
      ${notaClone}
      <div class="btn-img-row">
        <button class="btn-salvar-img" id="popup-btn-salvar" onclick="salvarImagemPopup()">
          <span>📥</span> Salvar Imagem
        </button>
      </div>
      <div class="wpp-section">
        <div class="wpp-label">📲 Texto para WhatsApp</div>
        <div class="wpp-box" id="popup-wpp-texto" contenteditable="true">${c.textoWpp ? c.textoWpp.replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''}</div>
        <button class="btn-copiar" id="popup-btn-copiar" onclick="copiarTextoPopup()">
          <span>📋</span> Copiar para WhatsApp
        </button>
      </div>`;
  } else {
    dest.innerHTML = `
      <div class="wpp-section">
        <div class="wpp-label">📲 Texto da cotação ${c.numStr}</div>
        <div class="wpp-box" id="popup-wpp-texto" contenteditable="true">${c.textoWpp ? c.textoWpp.replace(/</g,'&lt;').replace(/>/g,'&gt;') : 'Texto não disponível'}</div>
        <button class="btn-copiar" id="popup-btn-copiar" onclick="copiarTextoPopup()">
          <span>📋</span> Copiar para WhatsApp
        </button>
      </div>`;
  }

  const overlay = document.getElementById('popup-resultado-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  overlay.querySelector('.popup-resultado-close').onclick = function() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  };
}

async function salvarImagemPopup() {
  const btn = document.getElementById('popup-btn-salvar');
  if(!btn) return;
  btn.classList.add('saving');
  btn.innerHTML = '<span>⏳</span> Gerando...';
  try {
    const el = document.getElementById('popup-nota-fiscal');
    const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: null, logging: false });
    const link = document.createElement('a');
    const nomeArq = document.getElementById('nome-cliente') ? (document.getElementById('nome-cliente').value.trim() || 'cotacao') : 'cotacao';
    link.download = 'pipando-' + nomeArq.replace(/\s+/g,'-').toLowerCase() + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    btn.innerHTML = '<span>✅</span> Salvo!';
    setTimeout(function(){ btn.classList.remove('saving'); btn.innerHTML='<span>📥</span> Salvar Imagem'; }, 2000);
  } catch(e) {
    btn.classList.remove('saving');
    btn.innerHTML = '<span>📥</span> Salvar Imagem';
    alert('Erro ao gerar imagem.');
  }
}

async function copiarTextoPopup() {
  const el = document.getElementById('popup-wpp-texto');
  if(!el) return;
  const texto = el.textContent;
  try {
    await navigator.clipboard.writeText(texto);
    const btn = document.getElementById('popup-btn-copiar');
    if(btn) {
      btn.classList.add('copied');
      btn.innerHTML = '<span>✅</span> Copiado!';
      setTimeout(function(){ btn.classList.remove('copied'); btn.innerHTML='<span>📋</span> Copiar para WhatsApp'; }, 2200);
    }
  } catch(e) {
    alert('Selecione o texto acima e copie manualmente.');
  }
}

function fecharPopupResultado() {
  document.getElementById('popup-resultado-overlay').classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(limparFormulario, 50);
}

function limparFormulario() {
  document.getElementById('nome-cliente').value = '';
  if(typeof iti !== 'undefined') iti.setNumber('');
  else document.getElementById('wpp-cliente').value = '';
  document.getElementById('wpp-cliente').value = '';
  document.getElementById('wpp-cliente').classList.remove('wpp-error');
  document.getElementById('wpp-erro').style.display = 'none';
  document.getElementById('periodo-inicio').value = '';
  document.getElementById('periodo-fim').value = '';
  const dispEl = document.getElementById('estadia-display');
  if(dispEl) { dispEl.textContent = 'Selecionar período'; dispEl.style.color = '#B0A090'; }
  origemCliente = null;
  Object.keys(ORIGEM_LABELS).forEach(k => {
    const btn = document.getElementById('orig-' + k);
    if(btn) btn.classList.remove('active');
  });
  temperaturaCliente = null;
  ['frio','morno','quente'].forEach(t => {
    const btn = document.getElementById('temp-' + t);
    if(btn) btn.classList.remove('active');
  });
  selecionadas   = new Set();
  qtdsAtiv       = {};
  datasAtiv      = {};
  descontosAtiv  = {};
  descontoGeral  = { modo: 'pct', valor: 0 };
  const dgEl = document.getElementById('desc-geral-valor');
  if(dgEl) dgEl.value = '';
  const dgPrev = document.getElementById('desc-geral-preview');
  if(dgPrev) dgPrev.style.display = 'none';
  _cotacaoEmEdicao = null;
  const histPanel = document.getElementById('historico-cliente-panel');
  if(histPanel) histPanel.style.display = 'none';
  const banner = document.getElementById('edit-banner');
  if(banner) banner.style.display = 'none';
  const titulo = document.getElementById('form-titulo');
  if(titulo) titulo.textContent = 'Nova Cotação';
  const btnGerar = document.querySelector('.btn-gerar');
  if(btnGerar) btnGerar.textContent = '✨ Gerar Cotação';
  renderSelectGrid();
  voltarHome();
}

// ===== HISTÓRICO DO CLIENTE =====
let _historicoTimer = null;

function verificarClienteHistorico(valor) {
  clearTimeout(_historicoTimer);
  const panel = document.getElementById('historico-cliente-panel');
  const nums = valor.replace(/\D/g, '');
  if(nums.length < 8) { if(panel) panel.style.display = 'none'; return; }
  _historicoTimer = setTimeout(function() { _mostrarHistoricoCliente(nums); }, 400);
}

function _mostrarHistoricoCliente(nums) {
  const panel = document.getElementById('historico-cliente-panel');
  if(!panel) return;
  const cots = carregarCotacoes();
  const historico = cots.filter(c => {
    if(!c.wpp) return false;
    const cNum = c.wpp.replace(/\D/g, '');
    return cNum.slice(-8) === nums.slice(-8);
  }).filter(c => !_cotacaoEmEdicao || c.id !== _cotacaoEmEdicao);

  if(!historico.length) { panel.style.display = 'none'; return; }

  const fechadas = historico.filter(c => c.status === 'fechado').length;
  const icone = fechadas > 0 ? '⭐' : '👤';

  panel.style.display = 'block';
  panel.innerHTML = `
    <div class="hist-panel">
      <div class="hist-header">
        ${icone} Cliente já cotou <strong>${historico.length}</strong> vez${historico.length > 1 ? 'es' : ''}
        ${fechadas > 0 ? `· <span class="hist-fechados">${fechadas} fechado${fechadas > 1 ? 's' : ''}</span>` : ''}
      </div>
      <div class="hist-list">
        ${historico.slice(0, 3).map(c => `
          <div class="hist-item">
            <div class="hist-item-left">
              <div class="hist-item-num">${esc(c.numStr)} · ${(c.dataStr||'').split(' ')[0]}</div>
              <div class="hist-item-passeios">${esc((c.passeios||[]).join(' · ') || '—')}</div>
            </div>
            <div class="hist-item-right">
              <div class="hist-item-val">${fmtBRL(c.total||0)}</div>
              <span class="hist-status ${c.status||'pendente'}">${STATUS_LABELS[c.status]||c.status}</span>
            </div>
          </div>
        `).join('')}
        ${historico.length > 3 ? `<div class="hist-mais">+ ${historico.length - 3} cotação(ões) anterior(es)</div>` : ''}
      </div>
    </div>
  `;
}

// ===== EDITAR COTAÇÃO =====
function editarCotacao(id) {
  const cots = carregarCotacoes();
  const c = cots.find(x => x.id === id);
  if(!c) return;

  _cotacaoEmEdicao = id;

  // Reseta estado sem navegar
  temperaturaCliente = null;
  ['frio','morno','quente'].forEach(t => { const b = document.getElementById('temp-'+t); if(b) b.classList.remove('active'); });
  selecionadas  = new Set();
  qtdsAtiv      = {};
  datasAtiv     = {};
  descontosAtiv = {};
  descontoGeral = { modo: 'pct', valor: 0 };

  // Dados do cliente
  document.getElementById('nome-cliente').value = c.nome || '';
  document.getElementById('wpp-cliente').value  = c.wppFmt || c.wpp || '';
  document.getElementById('wpp-cliente').classList.remove('wpp-error');
  document.getElementById('wpp-erro').style.display = 'none';

  // Período de estadia
  const pIniEl   = document.getElementById('periodo-inicio');
  const pFimEl   = document.getElementById('periodo-fim');
  const estadiaEl = document.getElementById('estadia-display');
  if(c.periodoIni) {
    pIniEl.value = c.periodoIni;
    pFimEl.value = c.periodoFim || '';
    if(estadiaEl) { estadiaEl.textContent = c.periodoStr || c.periodoIni; estadiaEl.style.color = 'var(--dark)'; }
  } else {
    pIniEl.value = ''; pFimEl.value = '';
    if(estadiaEl) { estadiaEl.textContent = 'Selecionar período'; estadiaEl.style.color = '#B0A090'; }
  }

  // Origem
  origemCliente = null;
  Object.keys(ORIGEM_LABELS).forEach(k => { const b = document.getElementById('orig-'+k); if(b) b.classList.remove('active'); });
  if(c.origem) setOrigem(c.origem);

  // Temperatura
  if(c.temperatura) setTemperatura(c.temperatura);

  // Atividades selecionadas
  (c.passeios || []).forEach(nome => {
    const a = atividades.find(x => x.nome === nome);
    if(a) selecionadas.add(a.id);
  });

  // Quantidades
  (c.passeiosQtds || []).forEach(pq => {
    const a = atividades.find(x => x.nome === pq.nome);
    if(!a) return;
    qtdsAtiv[a.id] = { ...pq.qtds };
  });

  // Datas dos passeios (DD/MM/YYYY → YYYY-MM-DD)
  (c.datasPasseios || []).forEach(dp => {
    if(!dp.data) return;
    const a = atividades.find(x => x.nome === dp.nome);
    if(!a) return;
    const pts = dp.data.split('/');
    if(pts.length === 3) datasAtiv[a.id] = `${pts[2]}-${pts[1]}-${pts[0]}`;
  });

  // Descontos por passeio
  (c.descontosPasseios || []).forEach(dp => {
    const a = atividades.find(x => x.nome === dp.nome);
    if(!a || !dp.valor) return;
    descontosAtiv[a.id] = { modo: dp.modo || 'pct', valor: dp.valor };
  });

  // Desconto geral
  const dgEl   = document.getElementById('desc-geral-valor');
  const dgPrev = document.getElementById('desc-geral-preview');
  if(c.descontoGeralValor) {
    descontoGeral = { modo: c.descontoGeralModo || 'pct', valor: c.descontoGeralValor };
    if(dgEl) dgEl.value = c.descontoGeralValor;
    toggleDescontoGeral(c.descontoGeralModo || 'pct');
    atualizarPreviewDescontoGeral();
  } else {
    if(dgEl) dgEl.value = '';
    if(dgPrev) dgPrev.style.display = 'none';
  }

  // Extras selecionados
  (c.extrasPasseios || []).forEach(ep => {
    const a = atividades.find(x => x.nome === ep.nome);
    if(!a || !ep.extras) return;
    if(!qtdsAtiv[a.id]) qtdsAtiv[a.id] = {};
    qtdsAtiv[a.id].__extras = { ...ep.extras };
  });

  // Abre o formulário
  switchTab('cotacao');
  abrirFormCotacao();
  renderSelectGrid();

  // Atualiza UI para modo edição
  const titulo = document.getElementById('form-titulo');
  if(titulo) titulo.textContent = 'Editando Cotação ' + (c.numStr || '');
  const banner = document.getElementById('edit-banner');
  if(banner) banner.style.display = 'flex';
  const btnGerar = document.querySelector('.btn-gerar');
  if(btnGerar) btnGerar.textContent = '✏️ Atualizar Cotação';
}

function cancelarEdicao() {
  _cotacaoEmEdicao = null;
  limparFormulario();
}

// ===== SALVAR IMAGEM (botão inline) =====
async function capturarNota() {
  return await html2canvas(document.getElementById('nota-fiscal'), {
    scale: 3, useCORS: true, backgroundColor: null, logging: false
  });
}

async function salvarImagem() {
  const btn = document.getElementById('btn-salvar');
  btn.classList.add('saving');
  btn.innerHTML = '<span>⏳</span> Gerando...';
  try {
    const canvas = await capturarNota();
    const link = document.createElement('a');
    const nomeArq = document.getElementById('nome-cliente').value.trim() || document.getElementById('wpp-cliente').value.replace(/\D/g,'') || 'cotacao';
    link.download = `pipando-${nomeArq.replace(/\s+/g,'-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    btn.innerHTML = '<span>✅</span> Salvo!';
    setTimeout(()=>{ btn.classList.remove('saving'); btn.innerHTML='<span>📥</span> Salvar Imagem'; }, 2000);
  } catch(e) {
    btn.classList.remove('saving');
    btn.innerHTML = '<span>📥</span> Salvar Imagem';
    alert('Erro ao gerar imagem. Tente novamente.');
  }
}

async function copiarTexto() {
  const texto = document.getElementById('wpp-texto').textContent;
  try {
    await navigator.clipboard.writeText(texto);
    const btn = document.getElementById('btn-copiar');
    btn.classList.add('copied');
    btn.innerHTML = '<span>✅</span> Copiado!';
    setTimeout(()=>{ btn.classList.remove('copied'); btn.innerHTML='<span>📋</span> Copiar para WhatsApp'; }, 2200);
  } catch(e) {
    alert('Selecione o texto acima e copie manualmente.');
  }
}
