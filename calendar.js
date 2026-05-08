// ===== CALENDÁRIO — DATA DO PASSEIO (seleção de um dia) =====

function abrirCalPasseio() {
  const hoje = new Date();
  calAno = hoje.getFullYear();
  calMes = hoje.getMonth();
  const dataAtual = document.getElementById('popup-data').value;
  calIni = dataAtual ? new Date(dataAtual + 'T12:00:00') : null;
  calFim = calIni;
  calPasseioAberto = true;
  renderCalPasseio();
  document.getElementById('cal-passeio-overlay').classList.add('open');
}

function renderCalPasseio() {
  document.getElementById('calp-mes-ano').textContent = MESES[calMes] + ' ' + calAno;
  const grid = document.getElementById('calp-dias');
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const primeiro = new Date(calAno, calMes, 1).getDay();
  const total = new Date(calAno, calMes+1, 0).getDate();
  let html = '';
  for(let i=0;i<primeiro;i++) html += '<div class="cal-dia cal-vazio"></div>';
  for(let d=1;d<=total;d++){
    const data = new Date(calAno, calMes, d);
    const dataStr = `${calAno}-${String(calMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isHoje = data.toDateString()===hoje.toDateString();
    const isSel  = calIni && data.toDateString()===calIni.toDateString();
    let cls = 'cal-dia';
    if(isHoje) cls += ' cal-hoje';
    if(isSel)  cls += ' cal-inicio cal-fim';
    html += `<div class="${cls}" onclick="selecionarDiaPasseio('${dataStr}')">${d}</div>`;
  }
  grid.innerHTML = html;
  const leg = document.getElementById('calp-legenda');
  leg.textContent = calIni ? `📅 ${fmtDataDisplay(calIni.toISOString().slice(0,10))} selecionado` : 'Selecione a data do passeio';
}

function navMesPasseio(d) {
  calMes += d;
  if(calMes > 11) { calMes = 0; calAno++; }
  if(calMes < 0)  { calMes = 11; calAno--; }
  renderCalPasseio();
}

function selecionarDiaPasseio(dataStr) {
  calIni = new Date(dataStr + 'T12:00:00');
  calFim = calIni;
  renderCalPasseio();
}

function confirmarCalPasseio() {
  if(calIni) {
    const dataStr = calIni.toISOString().slice(0,10);
    document.getElementById('popup-data').value = dataStr;
    const disp = document.getElementById('popup-data-display');
    disp.textContent = fmtDataDisplay(dataStr);
    disp.style.color = 'var(--dark)';
  }
  document.getElementById('cal-passeio-overlay').classList.remove('open');
  calPasseioAberto = false;
}

function limparCalPasseio() {
  calIni = null; calFim = null;
  document.getElementById('popup-data').value = '';
  const disp = document.getElementById('popup-data-display');
  disp.textContent = 'Selecionar data';
  disp.style.color = '#B0A090';
  renderCalPasseio();
}

function fecharCalPasseio(e) {
  if(e.target === document.getElementById('cal-passeio-overlay')) {
    document.getElementById('cal-passeio-overlay').classList.remove('open');
    calPasseioAberto = false;
  }
}

// ===== CALENDÁRIO — ESTADIA (seleção de período) =====

function abrirCalendario() {
  const hoje = new Date();
  calAno = hoje.getFullYear();
  calMes = hoje.getMonth();
  const ini = document.getElementById('periodo-inicio').value;
  const fim = document.getElementById('periodo-fim').value;
  calIni = ini ? new Date(ini + 'T12:00:00') : null;
  calFim = fim ? new Date(fim + 'T12:00:00') : null;
  renderCalendario();
  document.getElementById('cal-overlay').classList.add('open');
}

function fecharCalendario(e) {
  if(e.target === document.getElementById('cal-overlay'))
    document.getElementById('cal-overlay').classList.remove('open');
}

function navMes(d) {
  calMes += d;
  if(calMes > 11) { calMes = 0; calAno++; }
  if(calMes < 0)  { calMes = 11; calAno--; }
  renderCalendario();
}

function renderCalendario() {
  document.getElementById('cal-mes-ano').textContent = MESES[calMes] + ' ' + calAno;
  const grid = document.getElementById('cal-dias');
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const primeiro = new Date(calAno, calMes, 1).getDay();
  const total = new Date(calAno, calMes+1, 0).getDate();
  let html = '';
  for(let i=0;i<primeiro;i++) html += '<div class="cal-dia cal-vazio"></div>';
  for(let d=1;d<=total;d++){
    const data = new Date(calAno, calMes, d);
    const dataStr = `${calAno}-${String(calMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const passado = data < hoje;
    const isHoje  = data.toDateString()===hoje.toDateString();
    const isIni   = calIni && data.toDateString()===calIni.toDateString();
    const isFim   = calFim && data.toDateString()===calFim.toDateString();
    const isEntre = calIni && calFim && data > calIni && data < calFim;
    let cls = 'cal-dia';
    if(passado) cls += ' cal-passado';
    if(isHoje)  cls += ' cal-hoje';
    if(isIni)   cls += ' cal-inicio';
    if(isFim)   cls += ' cal-fim';
    if(isEntre) cls += ' cal-entre';
    const onclick = passado ? '' : `onclick="selecionarDia('${dataStr}')"`;
    html += `<div class="${cls}" ${onclick}>${d}</div>`;
  }
  grid.innerHTML = html;
  const leg = document.getElementById('cal-legenda');
  if(!calIni)       leg.textContent = 'Selecione a data de entrada';
  else if(!calFim)  leg.textContent = `Entrada: ${fmtDataDisplay(calIni.toISOString().slice(0,10))} — Selecione a saída`;
  else              leg.textContent = `📅 ${fmtDataDisplay(calIni.toISOString().slice(0,10))} → ${fmtDataDisplay(calFim.toISOString().slice(0,10))}`;
}

function selecionarDia(dataStr) {
  const data = new Date(dataStr + 'T12:00:00');
  if(!calIni || (calIni && calFim)) {
    calIni = data; calFim = null;
  } else {
    if(data <= calIni) { calIni = data; calFim = null; }
    else calFim = data;
  }
  renderCalendario();
}

function limparEstadia() {
  calIni = null; calFim = null;
  document.getElementById('periodo-inicio').value = '';
  document.getElementById('periodo-fim').value = '';
  document.getElementById('estadia-display').textContent = 'Selecionar período';
  document.getElementById('estadia-display').style.color = '#B0A090';
  renderCalendario();
}

function confirmarEstadia() {
  if(calIni && calFim) {
    const ini = calIni.toISOString().slice(0,10);
    const fim = calFim.toISOString().slice(0,10);
    document.getElementById('periodo-inicio').value = ini;
    document.getElementById('periodo-fim').value = fim;
    const diff = Math.round((calFim - calIni) / 86400000);
    const disp = `${fmtDataDisplay(ini)} → ${fmtDataDisplay(fim)} (${diff} noite${diff>1?'s':''})`;
    document.getElementById('estadia-display').textContent = disp;
    document.getElementById('estadia-display').style.color = 'var(--dark)';
  } else if(calIni) {
    document.getElementById('periodo-inicio').value = calIni.toISOString().slice(0,10);
    document.getElementById('periodo-fim').value = '';
    document.getElementById('estadia-display').textContent = `A partir de ${fmtDataDisplay(calIni.toISOString().slice(0,10))}`;
    document.getElementById('estadia-display').style.color = 'var(--dark)';
  }
  document.getElementById('cal-overlay').classList.remove('open');
}
