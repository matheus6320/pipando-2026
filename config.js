// ===== SUPABASE =====
const SUPABASE_URL = 'https://teppkevfjvbvfoidlsxt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlcHBrZXZmanZidmZvaWRsc3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjI1MTMsImV4cCI6MjA5MTkzODUxM30.XVI3ApnQcyK4epHaCMtKo-UuY-77O5Dw9EkFL9HB4Ow';

// ===== USUÁRIO =====
const USUARIO_NOME = 'Matheus';

// ===== UTILITÁRIOS =====
function uid() { return Math.random().toString(36).slice(2,8); }

// ===== DADOS PADRÃO =====
const dadosPadrao = [
  {
    id: uid(), nome: "Passeio de Buggy",
    tipos: [
      {nome:'Adulto', valor:120, sinalModo:'fixo', sinalValor:50},
      {nome:'Criança até 10 anos', valor:60, sinalModo:'pct', sinalValor:40}
    ],
    sinalAtivo: true,
    taxasNew: [{id:uid(), nome:'Taxa Ambiental', tipos:[{nome:'Adulto',modo:'fixo',valor:15},{nome:'Criança até 10 anos',modo:'fixo',valor:8}]}],
    linkMidia: ''
  },
  {
    id: uid(), nome: "Passeio de Jeep 4x4",
    tipos: [
      {nome:'Adulto', valor:100, sinalModo:'fixo', sinalValor:40},
      {nome:'Criança até 10 anos', valor:50, sinalModo:'pct', sinalValor:40}
    ],
    sinalAtivo: true,
    taxasNew: [{id:uid(), nome:'Taxa Ambiental', tipos:[{nome:'Adulto',modo:'fixo',valor:15},{nome:'Criança até 10 anos',modo:'fixo',valor:8}]}],
    linkMidia: ''
  },
  {
    id: uid(), nome: "Passeio de Barco — Lagoa Guaraíras",
    tipos: [
      {nome:'Adulto', valor:90, sinalModo:'pct', sinalValor:40},
      {nome:'Criança até 10 anos', valor:45, sinalModo:'pct', sinalValor:40}
    ],
    sinalAtivo: true,
    taxasNew: [],
    linkMidia: ''
  }
];

// ===== CONSTANTES =====
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const STATUS_LABELS = {
  pendente:  '⏳ Pendente',
  retornado: '✅ Retornado',
  fechado:   '🤝 Fechado',
  perdido:   '❌ Perdido'
};

const TEMP_LABELS = {
  frio:   '❄️ Frio',
  morno:  '🌤️ Morno',
  quente: '🔥 Quente'
};

const ORIGEM_LABELS = {
  instagram:  '📸 Instagram',
  google:     '🔍 Google',
  indicacao:  '🤝 Indicação',
  whatsapp:   '💬 WhatsApp',
  site:       '🌐 Site',
  outro:      '📍 Outro',
};
