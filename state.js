// ===== ESTADO GLOBAL DE ATIVIDADES =====
let atividades = [];

// ===== ESTADO DO FORMULÁRIO DE COTAÇÃO =====
let selecionadas    = new Set();
let datasAtiv       = {};   // id -> data ISO (string)
let qtdsAtiv        = {};   // id -> { nomeType: qty, __extras: {...} }
let descontosAtiv   = {};   // id -> { modo: 'pct'|'real', valor: number }
let descontoGeral   = { modo: 'pct', valor: 0 };

// ===== ESTADO DO POPUP =====
let popupAtivId = null;

// ===== ORIGEM DO CLIENTE =====
let origemCliente = null;

// ===== EDIÇÃO DE COTAÇÃO =====
let _cotacaoEmEdicao = null;

// ===== FILTRO RÁPIDO =====
let _filtroRapido = null; // 'amanha' | 'followup' | 'semana' | 'hoje' | null

// ===== ESTADO DOS FILTROS DO RELATÓRIO =====
let _paginaAtual       = 1;
let _ordemAtual        = 'recentes';
let _passeiosselecionados = new Set();
var _filtroStatusSel   = new Set();
var _filtroPasseiosSel = new Set();
var _filtroUrgSel      = new Set();
var _filtroPeriodoTipo = 'cotacao'; // 'cotacao' | 'passeio'

// ===== ESTADO DOS CALENDÁRIOS =====
let calPasseioAberto = false;
let calAno, calMes, calIni = null, calFim = null;
