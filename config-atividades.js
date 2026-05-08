// ===== PAINEL CONFIGURAR ATIVIDADES =====

function salvarConfigManual() {
  salvar();
  const btn = document.getElementById('btn-salvar-config');
  btn.classList.add('saved');
  btn.innerHTML = '✅ Configurações Salvas!';
  setTimeout(() => {
    btn.classList.remove('saved');
    btn.innerHTML = '💾 Salvar Configurações';
  }, 2200);
}

function toggleAcc(id) {
  const body = document.getElementById('acc-body-'+id);
  if(!body) return;
  const isOpen = body.classList.contains('open');
  document.querySelectorAll('.acc-body').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.acc-item').forEach(el => el.classList.remove('acc-open'));
  if(!isOpen) {
    body.classList.add('open');
    const item = body.closest('.acc-item');
    if(item) item.classList.add('acc-open');
  }
}

async function salvarAcc(id, btnId) {
  const idx = typeof id === 'number' ? id : atividades.findIndex(a => a.id === id);
  const aid = idx >= 0 ? atividades[idx].id : null;

  const btnBefore = document.getElementById(btnId);
  if(btnBefore) { btnBefore.textContent = '⏳ Salvando...'; btnBefore.disabled = true; }

  salvar();
  try { if(aid) await upsertAtividadeDB(atividades[idx]); } catch(e) { console.error(e); }

  renderConfig();
  renderSelectGrid();
  setTimeout(() => {
    if(aid) {
      const body = document.getElementById('acc-body-'+aid);
      if(body) {
        body.classList.add('open');
        const item = body.closest('.acc-item');
        if(item) item.classList.add('acc-open');
      }
    }
    const btn = document.getElementById(btnId);
    if(btn) {
      btn.textContent = '✅ Salvo!';
      btn.classList.add('saved');
      setTimeout(() => { if(btn) { btn.textContent = '💾 Salvar'; btn.classList.remove('saved'); } }, 1800);
    }
  }, 50);
}

function renderConfig() {
  const list = document.getElementById('ativ-list');
  list.innerHTML = '';
  atividades.forEach((a, i) => {
    if(!a.tipos || !a.tipos.length) a.tipos = [{nome:'Adulto', valor:a.preco||0, sinalModo:'fixo', sinalValor:a.sinal||0}];
    a.tipos.forEach(t => { if(!t.sinalModo) t.sinalModo='fixo'; if(t.sinalValor===undefined) t.sinalValor=0; });
    if(!a.taxasNew) a.taxasNew = (a.taxas||[]).map(tx=>({ id:uid(), nome:tx.nome, tipos: a.tipos.map(t=>({nome:t.nome,modo:'fixo',valor:tx.valor||0})) }));

    const badgeTxt = a.tipos.length + ' tipo' + (a.tipos.length>1?'s':'');
    const saveBtnId = 'acc-save-'+a.id;
    const precoSummary = a.tipos.map(t => `${esc(t.nome)}: R$ ${(t.valor||0).toFixed(0)}`).join(' · ');

    const card = document.createElement('div');
    card.className = 'acc-item';
    card.innerHTML = `
      <div class="acc-header" id="acc-hdr-${a.id}">
        <div class="acc-header-left">
          <div>
            <div style="display:flex;align-items:center;gap:6px">
              <span class="acc-nome">${esc(a.nome)}</span>
              ${a.sinalAtivo ? '<span class="acc-badge" style="background:#E1F5EE;color:#0F6E56">sinal</span>' : ''}
            </div>
            <div style="font-size:0.6rem;color:var(--mid);font-weight:700;margin-top:2px">${precoSummary}</div>
          </div>
        </div>
        <button class="acc-edit-btn" data-aid="${a.id}" onclick="toggleAcc(this.dataset.aid)">✏️ Editar</button>
      </div>
      <div class="acc-body" id="acc-body-${a.id}">
        <div class="acc-section">
          <div class="acc-section-title">Nome</div>
          <input class="acc-link-input" value="${esc(a.nome)}" placeholder="Nome da atividade"
            oninput="atividades[${i}].nome=this.value;renderSelectGrid()" style="margin-bottom:0">
        </div>
        <div class="acc-section">
          <div class="acc-section-title">👥 Tipos de passageiro</div>
          <div id="acc-tipos-${a.id}">
            ${renderTiposAcc(a.tipos, i, a.sinalAtivo, a.id)}
          </div>
          <button class="acc-add-tipo" data-aid="${a.id}" onclick="adicionarTipoById(this.dataset.aid)">＋ Adicionar tipo</button>
        </div>
        <div class="acc-section">
          <div class="acc-toggle-row">
            <label class="toggle-wrap">
              <input type="checkbox" ${a.sinalAtivo ? 'checked' : ''}
                onchange="atividades[${i}].sinalAtivo=this.checked;renderConfig()">
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">Cobrar sinal desta atividade</span>
          </div>
        </div>
        <div class="acc-section">
          <div class="acc-section-title">📋 Taxas adicionais</div>
          <div id="acc-taxas-${a.id}">
            ${renderTaxasNew(a.taxasNew||[], a.tipos, i)}
          </div>
          <button class="acc-add-tipo" onclick="adicionarTaxaNew(${i})">＋ Adicionar taxa</button>
        </div>
        <div class="acc-section">
          <div class="acc-section-title">⭐ Extras e adicionais</div>
          <div id="acc-extras-${a.id}"></div>
          <button class="acc-add-tipo" data-aid="${a.id}" onclick="adicionarExtra(this.dataset.aid)">＋ Adicionar extra</button>
        </div>
        <div class="acc-section">
          <div class="acc-section-title">📸 Link de mídia</div>
          <input class="acc-link-input" type="url" value="${esc(a.linkMidia||'')}"
            placeholder="https://youtube.com/..."
            oninput="atividades[${i}].linkMidia=this.value">
        </div>
        <div class="acc-footer">
          <button class="acc-btn-del" data-aid="${a.id}" onclick="removerAtividade(this.dataset.aid)">🗑 Remover</button>
          <button class="acc-btn-save" id="${saveBtnId}" data-aid="${a.id}" onclick="salvarAcc(this.dataset.aid,this.id)">💾 Salvar</button>
        </div>
      </div>
    `;
    list.appendChild(card);
    renderExtrasBox(a.id, i);
  });
}

function renderExtrasBox(aid, idx) {
  var container = document.getElementById('acc-extras-' + aid);
  if(!container) return;
  container.innerHTML = '';
  var a = atividades[idx];
  if(!a) return;
  if(!a.extras) a.extras = [];
  if(a.extras.length === 0) {
    mkEl('div', {text:'Nenhum extra cadastrado.', style:'font-size:0.65rem;color:#888;font-weight:700;margin-bottom:6px'}, container);
    return;
  }
  a.extras.forEach(function(ex, j) {
    var box = mkEl('div', {cls:'acc-extra-box'}, container);
    mkEl('label', {cls:'acc-extra-label', text:'Nome do extra'}, box);
    var nomeIn = mkEl('input', {cls:'acc-extra-input', type:'text', placeholder:'Ex: 4 horas extras', value:ex.nome||''}, box);
    nomeIn.addEventListener('input', (function(ii,jj){return function(){atividades[ii].extras[jj].nome=this.value;};})(idx,j));

    var g1 = mkEl('div', {cls:'acc-extra-grid2'}, box);
    var d1 = mkEl('div', {}, g1);
    mkEl('label', {cls:'acc-extra-label', style:'margin-top:8px', text:'Valor acréscimo (R$)'}, d1);
    var valIn = mkEl('input', {cls:'acc-extra-input', type:'number', placeholder:'0', value:ex.valor||0}, d1);
    valIn.addEventListener('input', (function(ii,jj){return function(){atividades[ii].extras[jj].valor=parseFloat(this.value)||0;};})(idx,j));

    var d2 = mkEl('div', {}, g1);
    mkEl('label', {cls:'acc-extra-label', style:'margin-top:8px', text:'Multiplica pela qtd?'}, d2);
    var tog1 = mkEl('div', {cls:'acc-extra-tog'}, d2);
    var bSim = mkEl('button', {text:'Sim', cls: ex.multiplica ? 'ativo' : ''}, tog1);
    var bNao = mkEl('button', {text:'Não', cls: !ex.multiplica ? 'ativo' : ''}, tog1);
    bSim.addEventListener('click', (function(ii,jj,bs,bn){return function(){atividades[ii].extras[jj].multiplica=true; bs.className='ativo'; bn.className='';};})(idx,j,bSim,bNao));
    bNao.addEventListener('click', (function(ii,jj,bs,bn){return function(){atividades[ii].extras[jj].multiplica=false; bs.className=''; bn.className='ativo';};})(idx,j,bSim,bNao));

    var g2 = mkEl('div', {cls:'acc-extra-grid2'}, box);
    var d3 = mkEl('div', {}, g2);
    mkEl('label', {cls:'acc-extra-label', style:'margin-top:8px', text:'Sinal sobre extra'}, d3);
    var sinalIn = mkEl('input', {cls:'acc-extra-input', type:'number', placeholder:'0', value:ex.sinal||0}, d3);
    sinalIn.addEventListener('input', (function(ii,jj){return function(){atividades[ii].extras[jj].sinal=parseFloat(this.value)||0;};})(idx,j));

    var d4 = mkEl('div', {}, g2);
    mkEl('label', {cls:'acc-extra-label', style:'margin-top:8px', text:'Modo sinal'}, d4);
    var tog2 = mkEl('div', {cls:'acc-extra-tog'}, d4);
    var bReal = mkEl('button', {text:'R$', cls:(ex.sinalModo||'fixo')==='fixo'?'ativo':''}, tog2);
    var bPct  = mkEl('button', {text:'%', cls:ex.sinalModo==='pct'?'ativo':''}, tog2);
    bReal.addEventListener('click', (function(ii,jj,br,bp){return function(){atividades[ii].extras[jj].sinalModo='fixo'; br.className='ativo'; bp.className='';};})(idx,j,bReal,bPct));
    bPct.addEventListener('click',  (function(ii,jj,br,bp){return function(){atividades[ii].extras[jj].sinalModo='pct'; br.className=''; bp.className='ativo';};})(idx,j,bReal,bPct));

    mkEl('div', {style:'border-top:1px dashed #B5D4F4;margin:10px 0 6px'}, box);
    mkEl('label', {cls:'acc-extra-label', text:'Taxas deste extra (pagas no dia)'}, box);
    var taxasContainer = mkEl('div', {}, box);
    renderTaxasExtra(taxasContainer, idx, j, ex.taxas||[]);
    var addTaxaBtn = mkEl('button', {cls:'acc-add-tipo', text:'+ Adicionar taxa ao extra'}, box);
    addTaxaBtn.style.marginTop = '4px';
    addTaxaBtn.addEventListener('click', (function(ii,jj,tc){return function(){
      if(!atividades[ii].extras[jj].taxas) atividades[ii].extras[jj].taxas=[];
      atividades[ii].extras[jj].taxas.push({nome:'',valor:0,multiplica:true});
      renderTaxasExtra(tc, ii, jj, atividades[ii].extras[jj].taxas);
    };})(idx,j,taxasContainer));

    mkEl('div', {style:'border-top:1px dashed #B5D4F4;margin:8px 0 0'}, box);
    var delBtn = mkEl('button', {cls:'acc-extra-del', text:'Remover extra'}, box);
    delBtn.addEventListener('click', (function(aid2,jj){return function(){removerExtra(aid2,jj);};})(aid,j));
  });
}

function renderTaxasExtra(container, idx, j, taxas) {
  container.innerHTML = '';
  taxas.forEach(function(tx, k) {
    var row = mkEl('div', {style:'display:flex;gap:6px;align-items:center;margin-bottom:6px;background:white;border:1px solid #B5D4F4;border-radius:8px;padding:6px 8px'}, container);
    var nIn = mkEl('input', {cls:'acc-extra-input', type:'text', placeholder:'Nome da taxa', value:tx.nome||'', style:'flex:2;padding:5px 8px'}, row);
    nIn.addEventListener('input', (function(ii,jj,kk){return function(){atividades[ii].extras[jj].taxas[kk].nome=this.value;};})(idx,j,k));
    var vIn = mkEl('input', {cls:'acc-extra-input', type:'number', placeholder:'R$', value:tx.valor||0, style:'flex:1;padding:5px 8px'}, row);
    vIn.addEventListener('input', (function(ii,jj,kk){return function(){atividades[ii].extras[jj].taxas[kk].valor=parseFloat(this.value)||0;};})(idx,j,k));
    var tog = mkEl('div', {cls:'acc-extra-tog', style:'flex-shrink:0'}, row);
    var bS = mkEl('button', {text:'xqtd', cls:tx.multiplica?'ativo':''}, tog);
    var bN = mkEl('button', {text:'fixo', cls:!tx.multiplica?'ativo':''}, tog);
    bS.addEventListener('click', (function(ii,jj,kk,bs2,bn2){return function(){atividades[ii].extras[jj].taxas[kk].multiplica=true; bs2.className='ativo'; bn2.className='';};})(idx,j,k,bS,bN));
    bN.addEventListener('click', (function(ii,jj,kk,bs2,bn2){return function(){atividades[ii].extras[jj].taxas[kk].multiplica=false; bs2.className=''; bn2.className='ativo';};})(idx,j,k,bS,bN));
    var del = mkEl('button', {text:'x', style:'background:none;border:none;color:#C05030;font-weight:900;cursor:pointer;flex-shrink:0;font-size:0.9rem'}, row);
    del.addEventListener('click', (function(ii,jj,kk,cont){return function(){
      atividades[ii].extras[jj].taxas.splice(kk,1);
      renderTaxasExtra(cont, ii, jj, atividades[ii].extras[jj].taxas);
    };})(idx,j,k,container));
  });
}

function adicionarExtra(aid) {
  var a = atividades.find(function(x){return x.id===aid;});
  if(!a) return;
  if(!a.extras) a.extras=[];
  a.extras.push({nome:'',valor:0,multiplica:false,sinal:0,sinalModo:'fixo',taxas:[]});
  renderExtrasBox(aid, atividades.indexOf(a));
}

function removerExtra(aid, j) {
  var a = atividades.find(function(x){return x.id===aid;});
  if(!a||!a.extras) return;
  a.extras.splice(j,1);
  renderExtrasBox(aid, atividades.indexOf(a));
}

function renderTiposAcc(tipos, i, sinalAtivo, aid) {
  return tipos.map((t, j) => `
    <div class="acc-tipo-row">
      <input class="acc-tipo-input" value="${esc(t.nome)}" placeholder="Ex: Adulto"
        oninput="atividades[${i}].tipos[${j}].nome=this.value;renderSelectGrid()">
      <div class="acc-valor-wrap">
        <span class="acc-moeda">R$</span>
        <input class="acc-valor-input" type="number" min="0" step="1" value="${t.valor||0}"
          oninput="atividades[${i}].tipos[${j}].valor=parseFloat(this.value)||0;renderSelectGrid()">
      </div>
      ${sinalAtivo ? `
      <div class="acc-sinal-wrap">
        <button class="tipo-modo-btn ${t.sinalModo==='fixo'?'active':''}"
          onclick="setTipoModo(${i},${j},'sinalModo','fixo')">R$</button>
        <button class="tipo-modo-btn ${t.sinalModo==='pct'?'active':''}"
          onclick="setTipoModo(${i},${j},'sinalModo','pct')">%</button>
        <input class="acc-valor-input" type="number" min="0" step="1" value="${t.sinalValor||0}"
          oninput="atividades[${i}].tipos[${j}].sinalValor=parseFloat(this.value)||0"
          placeholder="${t.sinalModo==='pct'?'%':'R$'}" style="width:55px">
        <span style="font-size:0.65rem;color:var(--mid);font-weight:700">${calcSinalTipo(t)}</span>
      </div>` : ''}
      <button class="acc-del-tipo" data-aid="${aid}" data-j="${j}" onclick="removerTipoById(this.dataset.aid,parseInt(this.dataset.j))">✕</button>
    </div>
  `).join('');
}

function calcSinalTipo(t) {
  if(!t.sinalValor) return 'R$ 0,00';
  const v = t.sinalModo === 'pct' ? (t.valor * t.sinalValor / 100) : t.sinalValor;
  return fmtBRL(v);
}

function setTipoModo(i, j, campo, valor) {
  atividades[i].tipos[j][campo] = valor;
  renderConfig();
}

function renderTaxasNew(taxas, tipos, i) {
  return taxas.map((tx, j) => `
    <div class="taxa-bloco">
      <div class="taxa-bloco-header">
        <input class="taxa-bloco-nome-input" type="text" placeholder="Nome da taxa" value="${esc(tx.nome)}"
          oninput="atividades[${i}].taxasNew[${j}].nome=this.value">
        <button class="btn-remove-taxa-bloco" onclick="removerTaxaNew(${i},${j})">✕</button>
      </div>
      ${tipos.map((t, k) => {
        const txTipo = (tx.tipos||[]).find(x=>x.nome===t.nome) || {nome:t.nome,modo:'fixo',valor:0};
        return `
        <div class="tipo-campo-row">
          <span class="tipo-campo-label" style="min-width:90px">${esc(t.nome)}</span>
          <div class="tipo-modo-toggle">
            <button class="tipo-modo-btn ${txTipo.modo==='fixo'?'active':''}"
              onclick="setTaxaTipoModo(${i},${j},'${esc(t.nome)}','fixo')">R$</button>
            <button class="tipo-modo-btn ${txTipo.modo==='pct'?'active':''}"
              onclick="setTaxaTipoModo(${i},${j},'${esc(t.nome)}','pct')">%</button>
          </div>
          <input class="tipo-campo-input" type="number" min="0" step="0.5" value="${txTipo.valor||0}"
            oninput="setTaxaTipoValor(${i},${j},'${esc(t.nome)}',this.value)">
          <span style="font-size:0.75rem;color:var(--mid);font-weight:700">
            = ${txTipo.modo==='pct' ? fmtBRL(t.valor*(txTipo.valor||0)/100) : fmtBRL(txTipo.valor||0)}
          </span>
        </div>`;
      }).join('')}
    </div>
  `).join('');
}

function setTaxaTipoModo(i, j, nomeT, modo) {
  const tx = atividades[i].taxasNew[j];
  let entry = tx.tipos.find(x=>x.nome===nomeT);
  if(!entry) { entry = {nome:nomeT,modo:'fixo',valor:0}; tx.tipos.push(entry); }
  entry.modo = modo;
  renderConfig();
}

function setTaxaTipoValor(i, j, nomeT, val) {
  const tx = atividades[i].taxasNew[j];
  let entry = tx.tipos.find(x=>x.nome===nomeT);
  if(!entry) { entry = {nome:nomeT,modo:'fixo',valor:0}; tx.tipos.push(entry); }
  entry.valor = parseFloat(val)||0;
}

function adicionarTaxaNew(i) {
  if(!atividades[i].taxasNew) atividades[i].taxasNew = [];
  const tipos = atividades[i].tipos||[];
  atividades[i].taxasNew.push({
    id: uid(), nome: 'Nova Taxa',
    tipos: tipos.map(t=>({nome:t.nome, modo:'fixo', valor:0}))
  });
  const aid = atividades[i].id;
  renderConfig();
  setTimeout(() => {
    const body = document.getElementById('acc-body-'+aid);
    if(body) { body.classList.add('open'); const item = body.closest('.acc-item'); if(item) item.classList.add('acc-open'); }
  }, 50);
}

async function removerTaxaNew(i, j) {
  if(!confirm('Remover esta taxa? A alteração será salva automaticamente.')) return;
  const aid = atividades[i].id;
  atividades[i].taxasNew.splice(j, 1);
  salvar();
  try { await upsertAtividadeDB(atividades[i]); } catch(e) { console.error(e); }
  renderConfig();
  setTimeout(() => {
    const body = document.getElementById('acc-body-'+aid);
    if(body) { body.classList.add('open'); const item = body.closest('.acc-item'); if(item) item.classList.add('acc-open'); }
  }, 50);
}

function adicionarTaxa(i) {
  atividades[i].taxas = atividades[i].taxas || [];
  atividades[i].taxas.push({nome:'Taxa', valor: 0});
  salvar(); renderConfig();
}

function removerTaxa(i, j) {
  atividades[i].taxas.splice(j,1); salvar(); renderConfig();
}

function adicionarTipo(i) {
  atividades[i].tipos.push({nome:'Novo Tipo', valor:0, sinalModo:'fixo', sinalValor:0});
  salvar();
  renderConfig();
  const aid = atividades[i].id;
  setTimeout(() => {
    const body = document.getElementById('acc-body-'+aid);
    if(body) { body.classList.add('open'); const item = body.closest('.acc-item'); if(item) item.classList.add('acc-open'); }
  }, 50);
}

function removerTipo(i, j) {
  if(atividades[i].tipos.length <= 1) { alert('É necessário ao menos 1 tipo de passageiro.'); return; }
  atividades[i].tipos.splice(j, 1);
  salvar();
  renderConfig();
  const aid = atividades[i].id;
  setTimeout(() => {
    const body = document.getElementById('acc-body-'+aid);
    if(body) { body.classList.add('open'); const item = body.closest('.acc-item'); if(item) item.classList.add('acc-open'); }
  }, 50);
}

function adicionarAtividade() {
  const nova = { id: uid(), nome: 'Nova Atividade', tipos: [{nome:'Adulto', valor:0, sinalModo:'fixo', sinalValor:0}], sinalAtivo: false, taxasNew: [], extras: [], linkMidia: '' };
  atividades.push(nova);
  salvar();
  upsertAtividadeDB(nova).catch(console.error);
  renderConfig();
}

function adicionarTipoById(aid) {
  const i = atividades.findIndex(a => a.id === aid);
  if(i < 0) return;
  atividades[i].tipos.push({nome:'Novo Tipo', valor:0, sinalModo:'fixo', sinalValor:0});
  salvar();
  renderConfig();
  setTimeout(() => {
    const body = document.getElementById('acc-body-'+aid);
    if(body) { body.classList.add('open'); const item = body.closest('.acc-item'); if(item) item.classList.add('acc-open'); }
  }, 50);
}

function removerTipoById(aid, j) {
  const i = atividades.findIndex(a => a.id === aid);
  if(i < 0) return;
  if(atividades[i].tipos.length <= 1) { alert('É necessário ao menos 1 tipo de passageiro.'); return; }
  atividades[i].tipos.splice(j, 1);
  salvar();
  renderConfig();
  setTimeout(() => {
    const body = document.getElementById('acc-body-'+aid);
    if(body) { body.classList.add('open'); const item = body.closest('.acc-item'); if(item) item.classList.add('acc-open'); }
  }, 50);
}

function removerAtividade(id) {
  if(!confirm('Remover esta atividade?')) return;
  const idx = typeof id === 'number' ? id : atividades.findIndex(a => a.id === id);
  if(idx < 0) return;
  const aid = atividades[idx].id;
  atividades.splice(idx, 1);
  salvar();
  excluirAtividadeDB(aid).catch(console.error);
  renderConfig();
  renderSelectGrid();
}
