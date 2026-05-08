function toggleDescontoPopup(modo) {
  document.getElementById('pd-btn-pct').classList.toggle('active', modo === 'pct');
  document.getElementById('pd-btn-real').classList.toggle('active', modo === 'real');
  if(!descontosAtiv[popupAtivId]) descontosAtiv[popupAtivId] = { modo: 'pct', valor: 0 };
  descontosAtiv[popupAtivId].modo = modo;
  atualizarPreviewDescontoPopup();
}

function atualizarPreviewDescontoPopup() {
  const valInput = parseFloat(document.getElementById('popup-desc-valor').value) || 0;
  if(!descontosAtiv[popupAtivId]) descontosAtiv[popupAtivId] = { modo: 'pct', valor: 0 };
  descontosAtiv[popupAtivId].valor = valInput;

  const a = atividades.find(x => x.id === popupAtivId);
  if(!a) return;
  const tipos = a.tipos && a.tipos.length ? a.tipos : [{nome:'Adulto', valor: a.preco||0}];
  const qtds = qtdsAtiv[popupAtivId] || {};
  const subtotal = tipos.reduce((s,t) => s + (qtds[t.nome]||0) * t.valor, 0);

  const prev = document.getElementById('popup-desc-preview');
  if(valInput <= 0 || subtotal <= 0) { prev.textContent = ''; return; }

  const modo = descontosAtiv[popupAtivId].modo;
  let descVal = modo === 'pct' ? subtotal * valInput / 100 : valInput;
  descVal = Math.min(descVal, subtotal);
  prev.textContent = '− R$ ' + fmt(descVal) + ' sobre R$ ' + fmt(subtotal);
}

function toggleDescontoGeral(modo) {
  document.getElementById('dg-btn-pct').classList.toggle('active', modo === 'pct');
  document.getElementById('dg-btn-real').classList.toggle('active', modo === 'real');
  descontoGeral.modo = modo;
  atualizarPreviewDescontoGeral();
}

function atualizarPreviewDescontoGeral() {
  const val = parseFloat(document.getElementById('desc-geral-valor').value) || 0;
  descontoGeral.valor = val;
  const prev = document.getElementById('desc-geral-preview');
  const prevVal = document.getElementById('desc-geral-preview-val');
  if(val <= 0) { prev.style.display = 'none'; return; }
  prev.style.display = 'flex';
  const sels = atividades.filter(a => selecionadas.has(a.id));
  let total = 0;
  sels.forEach(a => {
    const tipos = a.tipos && a.tipos.length ? a.tipos : [{nome:'Adulto', valor: a.preco||0}];
    const qtds = qtdsAtiv[a.id] || {};
    total += tipos.reduce((s,t) => s + (qtds[t.nome]||0) * t.valor, 0);
  });
  const descVal = descontoGeral.modo === 'pct' ? total * val / 100 : val;
  prevVal.textContent = '− R$ ' + fmt(Math.min(descVal, total));
}
