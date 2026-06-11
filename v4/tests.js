// Réplica fiel da lógica de v4/index.html para teste em Node
const vitalThresholds = {
  pa_sis: {
    danger: v => v <= 89 || v >= 221,
    warning: v => (v >= 90 && v <= 99) || (v >= 180 && v <= 220),
  },
  pa_dia: {
    danger: v => v >= 121,
    warning: v => v >= 100 && v <= 120,
  },
  fc: {
    danger: v => v <= 50 || v >= 130,
    warning: v => (v >= 51 && v <= 59) || (v >= 100 && v <= 129),
  },
  fr: {
    danger: v => v <= 8 || v >= 35,
    warning: v => (v >= 9 && v <= 11) || (v >= 21 && v <= 34),
  },
  temp: {
    danger: v => v <= 34.9 || v >= 39.5,
    warning: v => (v >= 35 && v <= 35.9) || (v >= 37.5 && v <= 39.4),
  },
  sat: {
    danger: v => v <= 89,
    warning: v => v >= 90 && v <= 94,
  },
  glicemia: {
    danger: v => v <= 59 || v >= 301,
    warning: v => (v >= 60 && v <= 69) || (v >= 251 && v <= 300),
  },
  dor: {
    danger: v => v >= 9,
    warning: v => v >= 7 && v <= 8,
  },
};

function nivelVital(id, valor) {
  if (valor === '' || valor === undefined || valor === null) return null;
  const v = parseFloat(valor);
  if (isNaN(v)) return null;
  const t = vitalThresholds[id];
  if (!t) return null;
  if (t.danger && t.danger(v)) return 'danger';
  if (t.warning && t.warning(v)) return 'warning';
  return 'ok';
}

function calcularPAM(sis, dia) {
  if (sis == null || dia == null || isNaN(sis) || isNaN(dia) || sis <= 0 || dia <= 0) return null;
  return Math.round(dia + (sis - dia) / 3);
}

function calcularSugestao(vitals) {
  const ids = ['pa_sis','pa_dia','fc','fr','temp','sat','glicemia','dor'];
  const niveis = ids.map(id => nivelVital(id, vitals[id]));
  const algumDanger = niveis.includes('danger');
  const qntWarn = niveis.filter(n => n === 'warning').length;
  const dor = parseFloat(vitals.dor || '0');
  const pam = calcularPAM(parseFloat(vitals.pa_sis), parseFloat(vitals.pa_dia));
  const algumPreenchido = niveis.some(n => n !== null);
  if (!algumPreenchido) return null;
  if (algumDanger) return 'vermelho';
  if (pam !== null && pam < 60) return 'vermelho';
  if (qntWarn >= 2 || dor >= 7) return 'amarelo';
  if (qntWarn === 1 || dor >= 4) return 'verde';
  return 'azul';
}

// Alertas clínicos
const clinicalPatterns = [
  { id: 'sepse',         teste: v => (v.temp > 38 || v.temp < 36) && v.fc >= 100 && v.fr >= 22 },
  { id: 'choque',        teste: v => v.pa_sis <= 89 && v.fc >= 120 },
  { id: 'resp',          teste: v => v.sat <= 89 && v.fr >= 30 },
  { id: 'has',           teste: v => v.pa_sis >= 180 && v.pa_dia >= 120 },
  { id: 'hipoglicemia',  teste: v => v.glicemia < 60 },
  { id: 'hiperglicemia', teste: v => v.glicemia > 300 },
];
function alertasClinicos(v) {
  return clinicalPatterns.filter(p => {
    try { return p.teste(v); } catch { return false; }
  }).map(p => p.id);
}

// ============================================================
// Casos de teste
// ============================================================
const casos = [
  // ---- Normais ----
  { nome: 'Adulto saudável', v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'azul' },

  // ---- Limites inclusivos PA sis ----
  { nome: 'PA sis = 89 (inclusivo danger)',  v: { pa_sis:89, pa_dia:70, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'vermelho' },
  { nome: 'PA sis = 90 (inclusivo warn)',    v: { pa_sis:90, pa_dia:70, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'PA sis = 99 (inclusivo warn)',    v: { pa_sis:99, pa_dia:70, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'PA sis = 100 (limite ok)',        v: { pa_sis:100, pa_dia:70, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'azul' },
  { nome: 'PA sis = 180 (inclusivo warn)',   v: { pa_sis:180, pa_dia:90, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'PA sis = 220 (inclusivo warn)',   v: { pa_sis:220, pa_dia:90, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'PA sis = 221 (inclusivo danger)', v: { pa_sis:221, pa_dia:90, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'vermelho' },

  // ---- PA dia (nova faixa warn 100-120) ----
  { nome: 'PA dia = 100 (warn novo)',  v: { pa_sis:140, pa_dia:100, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'PA dia = 120 (warn limite)', v: { pa_sis:140, pa_dia:120, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'PA dia = 121 (danger)',     v: { pa_sis:140, pa_dia:121, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'vermelho' },

  // ---- MAP ----
  { nome: 'PAM 50 (sis 70/dia 40)', v: { pa_sis:70, pa_dia:40, fc:90, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'vermelho' /* sis<=89 já é danger */ },
  { nome: 'PAM 65 (sis 90/dia 50)', v: { pa_sis:90, pa_dia:50, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'verde' /* PAM=63, sis=90 warn */ },

  // ---- FC limites inclusivos ----
  { nome: 'FC = 50 (inclusivo danger)',  v: { pa_sis:120, pa_dia:80, fc:50, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'vermelho' },
  { nome: 'FC = 51 (warning bradicardia leve)', v: { pa_sis:120, pa_dia:80, fc:51, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'FC = 59 (warning lim sup)',   v: { pa_sis:120, pa_dia:80, fc:59, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'FC = 60 (ok)',                v: { pa_sis:120, pa_dia:80, fc:60, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'azul' },
  { nome: 'FC = 100 (inclusivo warn)',   v: { pa_sis:120, pa_dia:80, fc:100, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'FC = 129 (limite warn)',      v: { pa_sis:120, pa_dia:80, fc:129, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'FC = 130 (inclusivo danger)', v: { pa_sis:120, pa_dia:80, fc:130, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'vermelho' },

  // ---- FR com bradipneia leve ----
  { nome: 'FR = 8 (inclusivo danger)',   v: { pa_sis:120, pa_dia:80, fc:72, fr:8, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'vermelho' },
  { nome: 'FR = 9 (warn novo)',          v: { pa_sis:120, pa_dia:80, fc:72, fr:9, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'FR = 11 (warn novo)',         v: { pa_sis:120, pa_dia:80, fc:72, fr:11, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'FR = 12 (ok)',                v: { pa_sis:120, pa_dia:80, fc:72, fr:12, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'azul' },
  { nome: 'FR = 35 (inclusivo danger)',  v: { pa_sis:120, pa_dia:80, fc:72, fr:35, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'vermelho' },

  // ---- Temperatura com sub-febril ----
  { nome: 'Temp 37.5 (sub-febril)',  v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:37.5, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'Temp 35.0 (hipo leve)',   v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:35.0, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'Temp 35.9 (hipo leve)',   v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:35.9, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'Temp 36.0 (ok)',          v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.0, sat:98, glicemia:95, dor:0 }, esperado: 'azul' },
  { nome: 'Temp 39.4 (limite warn)', v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:39.4, sat:98, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'Temp 39.5 (danger)',      v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:39.5, sat:98, glicemia:95, dor:0 }, esperado: 'vermelho' },
  { nome: 'Temp 34.9 (danger)',      v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:34.9, sat:98, glicemia:95, dor:0 }, esperado: 'vermelho' },

  // ---- Saturação ----
  { nome: 'SatO2 = 95 (ok)',          v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:95, glicemia:95, dor:0 }, esperado: 'azul' },
  { nome: 'SatO2 = 94 (warn limite)', v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:94, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'SatO2 = 90 (warn limite)', v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:90, glicemia:95, dor:0 }, esperado: 'verde' },
  { nome: 'SatO2 = 89 (danger)',      v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:89, glicemia:95, dor:0 }, esperado: 'vermelho' },

  // ---- GLICEMIA (novo) ----
  { nome: 'Glic = 95 (ok)',           v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:0 }, esperado: 'azul' },
  { nome: 'Glic = 70 (limite ok)',    v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:70, dor:0 }, esperado: 'azul' },
  { nome: 'Glic = 69 (warn)',         v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:69, dor:0 }, esperado: 'verde' },
  { nome: 'Glic = 60 (warn limite)',  v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:60, dor:0 }, esperado: 'verde' },
  { nome: 'Glic = 59 (danger)',       v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:59, dor:0 }, esperado: 'vermelho' },
  { nome: 'Glic = 250 (ok)',          v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:250, dor:0 }, esperado: 'azul' },
  { nome: 'Glic = 251 (warn)',        v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:251, dor:0 }, esperado: 'verde' },
  { nome: 'Glic = 300 (warn limite)', v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:300, dor:0 }, esperado: 'verde' },
  { nome: 'Glic = 301 (danger)',      v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:301, dor:0 }, esperado: 'vermelho' },
  { nome: 'Glic = 600 (danger)',      v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:600, dor:0 }, esperado: 'vermelho' },

  // ---- DOR ajustada ----
  { nome: 'Dor = 3',  v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:3 }, esperado: 'azul' },
  { nome: 'Dor = 4 (verde via threshold)',  v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:4 }, esperado: 'verde' },
  { nome: 'Dor = 6 (verde)',  v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:6 }, esperado: 'verde' },
  { nome: 'Dor = 7 (warn → amarelo)',  v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:7 }, esperado: 'amarelo' },
  { nome: 'Dor = 8 (warn → amarelo)',  v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:8 }, esperado: 'amarelo' },
  { nome: 'Dor = 9 (danger)',  v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:9 }, esperado: 'vermelho' },
  { nome: 'Dor = 10 (danger)', v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, glicemia:95, dor:10 }, esperado: 'vermelho' },

  // ---- Cenários clínicos ----
  { nome: 'Sepse: T 38.5, FC 110, FR 24, sis 95',
    v: { pa_sis:95, pa_dia:60, fc:110, fr:24, temp:38.5, sat:95, glicemia:95, dor:5 },
    esperado: 'amarelo', clinical: ['sepse'] },
  { nome: 'Sepse grave: T 39.6, FC 130, FR 28, sis 80',
    v: { pa_sis:80, pa_dia:50, fc:130, fr:28, temp:39.6, sat:90, glicemia:95, dor:5 },
    esperado: 'vermelho', clinical: ['sepse','choque','has'] /* not has */ },
  { nome: 'Choque: PA 75/40, FC 130',
    v: { pa_sis:75, pa_dia:40, fc:130, fr:22, temp:36.0, sat:92, glicemia:95, dor:3 },
    esperado: 'vermelho', clinical: ['choque'] },
  { nome: 'Insuf respiratória: SatO2 85, FR 32',
    v: { pa_sis:130, pa_dia:80, fc:110, fr:32, temp:36.5, sat:85, glicemia:95, dor:3 },
    esperado: 'vermelho', clinical: ['resp'] },
  { nome: 'Emergência hipertensiva: 200/125',
    v: { pa_sis:200, pa_dia:125, fc:88, fr:18, temp:36.5, sat:97, glicemia:95, dor:5 },
    esperado: 'vermelho', clinical: ['has'] },
  { nome: 'Hipoglicemia grave: glic 45',
    v: { pa_sis:130, pa_dia:80, fc:90, fr:16, temp:36.5, sat:98, glicemia:45, dor:0 },
    esperado: 'vermelho', clinical: ['hipoglicemia'] },
  { nome: 'Hiperglicemia / cetoacidose: glic 450, FR 26',
    v: { pa_sis:120, pa_dia:80, fc:110, fr:26, temp:36.5, sat:96, glicemia:450, dor:4 },
    esperado: 'vermelho', clinical: ['hiperglicemia'] },

  // ---- Casos vazios / parciais ----
  { nome: 'Tudo vazio', v: {}, esperado: null },
  { nome: 'Apenas dor 8', v: { dor:8 }, esperado: 'amarelo' },
];

// Executa
let pass = 0, fail = 0;
const falhas = [];
for (const c of casos) {
  const obtido = calcularSugestao(c.v);
  const ok = obtido === c.esperado;
  if (ok) pass++; else { fail++; falhas.push({ ...c, obtido }); }
  console.log(`${ok ? '✓' : '✗'} ${c.nome.padEnd(56)} esperado=${String(c.esperado).padEnd(10)} obtido=${obtido}`);
}
console.log(`\n${pass} passou · ${fail} falhou de ${casos.length} casos de sugestão`);

if (falhas.length) {
  console.log('\n--- FALHAS ---');
  falhas.forEach(f => {
    console.log(`\n${f.nome}`);
    console.log('  vitals:  ', JSON.stringify(f.v));
    console.log('  esperado:', f.esperado);
    console.log('  obtido:  ', f.obtido);
    const niveis = {};
    ['pa_sis','pa_dia','fc','fr','temp','sat','glicemia','dor'].forEach(id => {
      if (f.v[id] !== undefined) niveis[id] = nivelVital(id, f.v[id]);
    });
    console.log('  níveis: ', JSON.stringify(niveis));
    console.log('  PAM:    ', calcularPAM(parseFloat(f.v.pa_sis), parseFloat(f.v.pa_dia)));
  });
}

// ============================================================
// Testes dos alertas clínicos
// ============================================================
console.log('\n========== ALERTAS CLÍNICOS ==========');
const alertCasos = [
  { nome: 'Sepse: T 38.5, FC 110, FR 24',           v: { temp:38.5, fc:110, fr:24, pa_sis:120, pa_dia:80, sat:95, glicemia:95 }, esp: ['sepse'] },
  { nome: 'Hipotermia sepse: T 35.5, FC 110, FR 24',v: { temp:35.5, fc:110, fr:24, pa_sis:120, pa_dia:80, sat:95, glicemia:95 }, esp: ['sepse'] },
  { nome: 'Choque: 80/50 FC 125',                   v: { temp:36, fc:125, fr:22, pa_sis:80, pa_dia:50, sat:95, glicemia:95 },    esp: ['choque'] },
  { nome: 'Insuf resp: SatO2 85 FR 32',             v: { temp:36, fc:100, fr:32, pa_sis:120, pa_dia:80, sat:85, glicemia:95 },   esp: ['resp'] },
  { nome: 'HAS: 200/120',                           v: { temp:36, fc:90, fr:16, pa_sis:200, pa_dia:120, sat:97, glicemia:95 },   esp: ['has'] },
  { nome: 'Hipoglicemia: glic 45',                  v: { temp:36, fc:90, fr:16, pa_sis:120, pa_dia:80, sat:97, glicemia:45 },    esp: ['hipoglicemia'] },
  { nome: 'Hiperglicemia: glic 400',                v: { temp:36, fc:90, fr:16, pa_sis:120, pa_dia:80, sat:97, glicemia:400 },   esp: ['hiperglicemia'] },
  { nome: 'Sepse + choque',                         v: { temp:39, fc:130, fr:26, pa_sis:80, pa_dia:50, sat:92, glicemia:95 },    esp: ['sepse','choque'] },
  { nome: 'Sem alertas (saudável)',                 v: { temp:36.5, fc:72, fr:16, pa_sis:120, pa_dia:80, sat:98, glicemia:95 },  esp: [] },
];

let aPass=0, aFail=0;
alertCasos.forEach(c => {
  const obtido = alertasClinicos(c.v);
  const ok = JSON.stringify(obtido.sort()) === JSON.stringify(c.esp.sort());
  if (ok) aPass++; else aFail++;
  console.log(`${ok?'✓':'✗'} ${c.nome.padEnd(40)} esperado=[${c.esp.join(',')}]  obtido=[${obtido.join(',')}]`);
});
console.log(`\n${aPass} passou · ${aFail} falhou de ${alertCasos.length} casos de alertas clínicos`);
