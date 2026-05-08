// ===== DASHBOARD =====

const _dashCharts = {};

function _destroyChart(key) {
  if(_dashCharts[key]) { _dashCharts[key].destroy(); delete _dashCharts[key]; }
}

function renderDashboard() {
  const cots = carregarCotacoes();
  _renderKPIs(cots);
  _renderChartPasseios(cots);
  _renderChartStatus(cots);
  _renderChartMeses(cots);
  _renderChartTemperatura(cots);
  _renderChartOrigem(cots);
  _renderChartMotivos(cots);
}

// ===== KPIs =====
function _renderKPIs(cots) {
  const fechadas  = cots.filter(c => c.status === 'fechado');
  const receita   = fechadas.reduce((s, c) => s + (c.total || 0), 0);
  const taxa      = cots.length > 0 ? Math.round(fechadas.length / cots.length * 100) : 0;
  const ticket    = cots.length > 0 ? cots.reduce((s, c) => s + (c.total || 0), 0) / cots.length : 0;

  document.getElementById('kpi-total').textContent   = cots.length;
  document.getElementById('kpi-receita').textContent = fmtBRL(receita);
  document.getElementById('kpi-taxa').textContent    = taxa + '%';
  document.getElementById('kpi-ticket').textContent  = fmtBRL(ticket);
}

// ===== PASSEIOS MAIS COTADOS =====
function _renderChartPasseios(cots) {
  _destroyChart('passeios');
  const counts = {};
  cots.forEach(c => (c.passeios || []).forEach(p => { counts[p] = (counts[p] || 0) + 1; }));
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const emptyEl = document.getElementById('chart-passeios-empty');
  const canvas  = document.getElementById('chart-passeios');
  if (!sorted.length) {
    emptyEl.style.display = 'block'; canvas.style.display = 'none'; return;
  }
  emptyEl.style.display = 'none'; canvas.style.display = 'block';

  const colors = ['#FE9D0E','#FF493C','#2DC653','#4CA8E8','#9B59B6','#F39C12','#1ABC9C','#E74C3C'];
  _dashCharts['passeios'] = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: sorted.map(e => e[0]),
      datasets: [{
        data: sorted.map(e => e[1]),
        backgroundColor: sorted.map((_, i) => colors[i % colors.length] + '33'),
        borderColor:     sorted.map((_, i) => colors[i % colors.length]),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: {
        label: ctx => ' ' + ctx.parsed.x + ' cotação(ões)'
      }}},
      scales: {
        x: { grid: { color: '#F5EDE8' }, ticks: { stepSize: 1, font: { family: 'Montserrat', size: 11, weight: '600' } } },
        y: { grid: { display: false }, ticks: { font: { family: 'Montserrat', size: 11, weight: '700' } } }
      }
    }
  });
}

// ===== STATUS DAS COTAÇÕES =====
function _renderChartStatus(cots) {
  _destroyChart('status');
  const counts = { pendente: 0, retornado: 0, fechado: 0, perdido: 0 };
  cots.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

  const emptyEl = document.getElementById('chart-status-empty');
  const canvas  = document.getElementById('chart-status');
  if (!cots.length) {
    emptyEl.style.display = 'block'; canvas.style.display = 'none'; return;
  }
  emptyEl.style.display = 'none'; canvas.style.display = 'block';

  _dashCharts['status'] = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['⏳ Pendente', '✅ Retornado', '🤝 Fechado', '❌ Perdido'],
      datasets: [{
        data: [counts.pendente, counts.retornado, counts.fechado, counts.perdido],
        backgroundColor: ['#FFF8E0','#E8F5E9','#E3F2FD','#FFEBEE'],
        borderColor:     ['#F5C842','#2DC653','#4CA8E8','#FF5A5A'],
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Montserrat', size: 11, weight: '700' }, padding: 14, boxWidth: 14 }
        },
        tooltip: { callbacks: {
          label: ctx => ' ' + ctx.label + ': ' + ctx.parsed + ' cotação(ões)'
        }}
      }
    }
  });
}

// ===== COTAÇÕES POR MÊS =====
function _renderChartMeses(cots) {
  _destroyChart('meses');
  const counts = {};
  const receitas = {};
  cots.forEach(c => {
    if (!c.data) return;
    const d   = new Date(c.data);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    counts[key]  = (counts[key]  || 0) + 1;
    receitas[key] = (receitas[key] || 0) + (c.total || 0);
  });

  const emptyEl = document.getElementById('chart-meses-empty');
  const canvas  = document.getElementById('chart-meses');
  const keys = Object.keys(counts).sort();
  if (!keys.length) {
    emptyEl.style.display = 'block'; canvas.style.display = 'none'; return;
  }
  emptyEl.style.display = 'none'; canvas.style.display = 'block';

  const labels = keys.map(k => {
    const [y, m] = k.split('-');
    return MESES[parseInt(m) - 1].substring(0, 3) + '/' + y.substring(2);
  });

  _dashCharts['meses'] = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Cotações',
          data: keys.map(k => counts[k]),
          borderColor: '#FE9D0E',
          backgroundColor: 'rgba(254,157,14,0.10)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#FE9D0E',
          pointRadius: 5,
          pointHoverRadius: 7,
          yAxisID: 'y',
        },
        {
          label: 'Receita (R$)',
          data: keys.map(k => receitas[k]),
          borderColor: '#FF493C',
          backgroundColor: 'rgba(255,73,60,0.07)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#FF493C',
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y2',
          borderDash: [5, 3],
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Montserrat', size: 11, weight: '700' }, padding: 14, boxWidth: 14 }
        },
        tooltip: { callbacks: {
          label: ctx => ctx.datasetIndex === 1
            ? ' Receita: ' + fmtBRL(ctx.parsed.y)
            : ' Cotações: ' + ctx.parsed.y
        }}
      },
      scales: {
        x:  { grid: { display: false }, ticks: { font: { family: 'Montserrat', size: 11 } } },
        y:  { position: 'left',  grid: { color: '#F5EDE8' }, ticks: { stepSize: 1, font: { family: 'Montserrat', size: 10 } } },
        y2: { position: 'right', grid: { display: false },   ticks: { font: { family: 'Montserrat', size: 10 }, callback: v => 'R$' + Math.round(v/1000) + 'k' } }
      }
    }
  });
}

// ===== TEMPERATURA DOS CLIENTES =====
function _renderChartTemperatura(cots) {
  _destroyChart('temperatura');
  const counts = { quente: 0, morno: 0, frio: 0, sem: 0 };
  cots.forEach(c => {
    if      (c.temperatura === 'quente') counts.quente++;
    else if (c.temperatura === 'morno')  counts.morno++;
    else if (c.temperatura === 'frio')   counts.frio++;
    else                                 counts.sem++;
  });

  const emptyEl = document.getElementById('chart-temperatura-empty');
  const canvas  = document.getElementById('chart-temperatura');
  const hasData = counts.quente + counts.morno + counts.frio > 0;
  if (!hasData) {
    emptyEl.style.display = 'block'; canvas.style.display = 'none'; return;
  }
  emptyEl.style.display = 'none'; canvas.style.display = 'block';

  const labels = ['🔥 Quente', '🌤️ Morno', '❄️ Frio'];
  const data   = [counts.quente, counts.morno, counts.frio];
  if (counts.sem > 0) { labels.push('Sem classificação'); data.push(counts.sem); }

  _dashCharts['temperatura'] = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#FFEAEA','#FFF8E0','#E8F4FF','#F5F5F5'],
        borderColor:     ['#FF5A5A','#F5C842','#4CA8E8','#DDD'],
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Montserrat', size: 11, weight: '700' }, padding: 14, boxWidth: 14 }
        },
        tooltip: { callbacks: {
          label: ctx => ' ' + ctx.label + ': ' + ctx.parsed + ' cliente(s)'
        }}
      }
    }
  });
}

// ===== ORIGEM DOS CLIENTES =====
function _renderChartOrigem(cots) {
  _destroyChart('origem');
  const ordem  = ['instagram','google','indicacao','whatsapp','site','outro'];
  const labels = ordem.map(k => ORIGEM_LABELS[k]);
  const totais  = ordem.map(k => cots.filter(c => c.origem === k).length);
  const fechados = ordem.map(k => cots.filter(c => c.origem === k && c.status === 'fechado').length);

  const emptyEl = document.getElementById('chart-origem-empty');
  const canvas  = document.getElementById('chart-origem');
  if(totais.every(v => v === 0)) {
    if(emptyEl) emptyEl.style.display = 'block';
    if(canvas)  canvas.style.display  = 'none';
    return;
  }
  if(emptyEl) emptyEl.style.display = 'none';
  if(canvas)  canvas.style.display  = 'block';

  _dashCharts['origem'] = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Cotações',
          data: totais,
          backgroundColor: 'rgba(254,157,14,0.20)',
          borderColor: '#FE9D0E',
          borderWidth: 2, borderRadius: 6, borderSkipped: false,
        },
        {
          label: 'Fechados',
          data: fechados,
          backgroundColor: 'rgba(45,198,83,0.25)',
          borderColor: '#2DC653',
          borderWidth: 2, borderRadius: 6, borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Montserrat', size: 11, weight: '700' }, padding: 14, boxWidth: 14 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Montserrat', size: 10 } } },
        y: { grid: { color: '#F5EDE8' }, ticks: { stepSize: 1, font: { family: 'Montserrat', size: 10 } } }
      }
    }
  });
}

// ===== MOTIVOS DE PERDA =====
function _renderChartMotivos(cots) {
  _destroyChart('motivos');
  const counts = {};
  cots.forEach(c => {
    if(c.status !== 'perdido' || !c.motivoPerda) return;
    counts[c.motivoPerda] = (counts[c.motivoPerda] || 0) + 1;
  });

  const emptyEl = document.getElementById('chart-motivos-empty');
  const canvas  = document.getElementById('chart-motivos');
  if(!Object.keys(counts).length) {
    if(emptyEl) emptyEl.style.display = 'block';
    if(canvas)  canvas.style.display  = 'none';
    return;
  }
  if(emptyEl) emptyEl.style.display = 'none';
  if(canvas)  canvas.style.display  = 'block';

  const sorted  = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const colors  = ['#FFEAEA','#FFF8E0','#E8F4FF','#E8F5E9','#F3E5F5'];
  const borders = ['#FF5A5A','#F5C842','#4CA8E8','#2DC653','#9B59B6'];

  _dashCharts['motivos'] = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: sorted.map(e => e[0]),
      datasets: [{
        data: sorted.map(e => e[1]),
        backgroundColor: sorted.map((_, i) => colors[i % colors.length]),
        borderColor:     sorted.map((_, i) => borders[i % borders.length]),
        borderWidth: 2, borderRadius: 8, borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ' ' + ctx.parsed.x + ' cotação(ões)' } }
      },
      scales: {
        x: { grid: { color: '#F5EDE8' }, ticks: { stepSize: 1, font: { family: 'Montserrat', size: 11 } } },
        y: { grid: { display: false }, ticks: { font: { family: 'Montserrat', size: 11, weight: '700' } } }
      }
    }
  });
}
