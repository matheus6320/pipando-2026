// ===== CONFIG DA COTAÇÃO GERADA =====

function _defaultCotacaoConfig() {
  return {
    aparencia: {
      saudacao:   'Olá',
      site:       'www.pipando.com.br',
      telefone:   '(84) 9 8166-2637',
      rodapeCard: 'Cadastur · Google 5★ · TripAdvisor 5★ — Praia da Pipa, RN',
      rodapeWpp:  'Somos especialistas em passeios na Praia da Pipa. Vai ser um prazer te atender! 🤙',
    },
    exibicao: {
      dataPorPasseio:      true,
      qtdPorTipo:          true,
      subtotalPorPasseio:  true,
      sinalPorPasseio:     true,
      extrasDetalhados:    true,
    }
  };
}

function carregarCotacaoConfig() {
  try {
    const salvo = JSON.parse(localStorage.getItem('pipando_cotacao_config') || 'null');
    if(!salvo) return _defaultCotacaoConfig();
    const def = _defaultCotacaoConfig();
    return {
      aparencia: { ...def.aparencia, ...salvo.aparencia },
      exibicao:  { ...def.exibicao,  ...salvo.exibicao  },
    };
  } catch { return _defaultCotacaoConfig(); }
}

function _salvarCotacaoConfig(cfg) {
  localStorage.setItem('pipando_cotacao_config', JSON.stringify(cfg));
}

// ===== SUB-NAVEGAÇÃO =====
function switchConfigTab(tab) {
  ['atividades', 'cotacao', 'notificacoes'].forEach(t => {
    const panel = document.getElementById('cfg-panel-' + t);
    const btn   = document.getElementById('cfg-sub-btn-' + t);
    if(panel) panel.style.display = t === tab ? 'block' : 'none';
    if(btn)   btn.classList.toggle('active', t === tab);
  });
  if(tab === 'cotacao')       _renderCotacaoConfigForm();
  if(tab === 'notificacoes')  renderNotifConfig();
}

// ===== RENDER FORMULÁRIO =====
function _renderCotacaoConfigForm() {
  const cfg = carregarCotacaoConfig();
  const _v = (id, val) => { const el = document.getElementById(id); if(el) el.value = val ?? ''; };
  const _c = (id, val) => { const el = document.getElementById(id); if(el) el.checked = !!val; };

  _v('cfg-saudacao',    cfg.aparencia.saudacao);
  _v('cfg-site',        cfg.aparencia.site);
  _v('cfg-telefone',    cfg.aparencia.telefone);
  _v('cfg-rodape-card', cfg.aparencia.rodapeCard);
  _v('cfg-rodape-wpp',  cfg.aparencia.rodapeWpp);

  _c('cfg-data-passeio',     cfg.exibicao.dataPorPasseio);
  _c('cfg-qtd-tipo',         cfg.exibicao.qtdPorTipo);
  _c('cfg-subtotal-passeio', cfg.exibicao.subtotalPorPasseio);
  _c('cfg-sinal-passeio',    cfg.exibicao.sinalPorPasseio);
  _c('cfg-extras-det',       cfg.exibicao.extrasDetalhados);
}

// ===== SALVAR =====
function salvarCotacaoConfigForm() {
  const _v = id => document.getElementById(id)?.value?.trim() || '';
  const _c = id => document.getElementById(id)?.checked ?? true;

  const cfg = {
    aparencia: {
      saudacao:   _v('cfg-saudacao')    || 'Olá',
      site:       _v('cfg-site'),
      telefone:   _v('cfg-telefone'),
      rodapeCard: _v('cfg-rodape-card'),
      rodapeWpp:  _v('cfg-rodape-wpp'),
    },
    exibicao: {
      dataPorPasseio:     _c('cfg-data-passeio'),
      qtdPorTipo:         _c('cfg-qtd-tipo'),
      subtotalPorPasseio: _c('cfg-subtotal-passeio'),
      sinalPorPasseio:    _c('cfg-sinal-passeio'),
      extrasDetalhados:   _c('cfg-extras-det'),
    }
  };
  _salvarCotacaoConfig(cfg);

  const btn = document.getElementById('cfg-cot-salvar-btn');
  if(btn) {
    btn.textContent = '✅ Salvo!';
    btn.classList.add('saved');
    setTimeout(() => { btn.textContent = '💾 Salvar'; btn.classList.remove('saved'); }, 1800);
  }
}
