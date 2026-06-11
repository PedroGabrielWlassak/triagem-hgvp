// Réplica fiel da lógica de v3/index.html para teste isolado em Node
const vitalThresholds = {
  pa_sis: { dangerLow: 90,  dangerHigh: 180, warnLow: 100, warnHigh: 140 },
  pa_dia: { dangerLow: 50,  dangerHigh: 110, warnLow: 60,  warnHigh: 90  },
  fc:     { dangerLow: 50,  dangerHigh: 120, warnLow: 60,  warnHigh: 100 },
  fr:     { dangerLow: 10,  dangerHigh: 24,  warnLow: 12,  warnHigh: 20  },
  temp:   { dangerLow: 35,  dangerHigh: 39,  warnLow: 36,  warnHigh: 37.8 },
  sat:    { dangerLow: 90,  warnLow: 94 },
  dor:    { warnHigh: 6,    dangerHigh: 8 },
};

function nivelVital(id, valor) {
  if (valor === '' || valor === undefined || valor === null) return null;
  const v = parseFloat(valor);
  if (isNaN(v)) return null;
  const t = vitalThresholds[id];
  if (!t) return null;
  if ((t.dangerLow !== undefined && v < t.dangerLow) || (t.dangerHigh !== undefined && v > t.dangerHigh)) return 'danger';
  if ((t.warnLow !== undefined && v < t.warnLow) || (t.warnHigh !== undefined && v > t.warnHigh)) return 'warning';
  return 'ok';
}

function calcularSugestao(vitals) {
  const ids = ['pa_sis','pa_dia','fc','fr','temp','sat','dor'];
  const niveis = ids.map(id => nivelVital(id, vitals[id]));
  const algumDanger = niveis.includes('danger');
  const qntWarn = niveis.filter(n => n === 'warning').length;
  const dor = parseFloat(vitals.dor || '0');
  const algumPreenchido = niveis.some(n => n !== null);
  if (!algumPreenchido) return null;
  if (algumDanger) return 'vermelho';
  if (qntWarn >= 2 || dor >= 8) return 'amarelo';
  if (qntWarn === 1 || dor >= 5) return 'verde';
  return 'azul';
}

// ============================================================
// Casos de teste
// ============================================================
const casos = [
  // ---- Valores normais (saudáveis) ----
  { nome: 'Tudo normal (adulto saudável)', v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:0 }, esperado: 'azul' },
  { nome: 'Tudo normal com dor leve (3)',   v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:3 }, esperado: 'azul' },

  // ---- Limiares exatos ----
  { nome: 'PA sis no limite warn (100)', v: { pa_sis:100, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:0 }, esperado: 'azul' },
  { nome: 'PA sis = 99 (warning low)',   v: { pa_sis:99,  pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:0 }, esperado: 'verde' },
  { nome: 'PA sis = 90 (limite danger)', v: { pa_sis:90,  pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:0 }, esperado: 'verde' },
  { nome: 'PA sis = 89 (danger low)',    v: { pa_sis:89,  pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:0 }, esperado: 'vermelho' },
  { nome: 'PA sis = 140 (limite warn alto)', v: { pa_sis:140, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:0 }, esperado: 'azul' },
  { nome: 'PA sis = 141 (warning high)',  v: { pa_sis:141, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:0 }, esperado: 'verde' },
  { nome: 'PA sis = 180 (limite danger)', v: { pa_sis:180, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:0 }, esperado: 'verde' },
  { nome: 'PA sis = 181 (danger high)',   v: { pa_sis:181, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:0 }, esperado: 'vermelho' },

  // ---- Crise hipertensiva ----
  { nome: 'PA 200/130 (crise hipertensiva)', v: { pa_sis:200, pa_dia:130, fc:90, fr:18, temp:36.5, sat:97, dor:7 }, esperado: 'vermelho' },

  // ---- Hipotensão / choque ----
  { nome: 'PA 80/50 + FC 130 (choque)', v: { pa_sis:80, pa_dia:50, fc:130, fr:22, temp:36.0, sat:92, dor:4 }, esperado: 'vermelho' },

  // ---- Saturação ----
  { nome: 'SatO2 95 (warning)',  v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:95, dor:0 }, esperado: 'azul' },
  { nome: 'SatO2 93 (warning)',  v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:93, dor:0 }, esperado: 'verde' },
  { nome: 'SatO2 89 (danger)',   v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:89, dor:0 }, esperado: 'vermelho' },
  { nome: 'SatO2 90 (limite ok)',v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:90, dor:0 }, esperado: 'verde' },

  // ---- Temperatura ----
  { nome: 'Febre 38.5 (warning)',   v: { pa_sis:120, pa_dia:80, fc:90, fr:18, temp:38.5, sat:97, dor:0 }, esperado: 'verde' },
  { nome: 'Febre alta 39.5 (danger)',v: { pa_sis:120, pa_dia:80, fc:90, fr:18, temp:39.5, sat:97, dor:0 }, esperado: 'vermelho' },
  { nome: 'Hipotermia 34',           v: { pa_sis:120, pa_dia:80, fc:60, fr:14, temp:34,   sat:97, dor:0 }, esperado: 'vermelho' },

  // ---- Dor ----
  { nome: 'Dor 5 isolada',  v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:5 }, esperado: 'verde' },
  { nome: 'Dor 6 isolada',  v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:6 }, esperado: 'verde' },
  { nome: 'Dor 7 isolada',  v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:7 }, esperado: 'verde' },
  { nome: 'Dor 8 isolada',  v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:8 }, esperado: 'amarelo' },
  { nome: 'Dor 9 isolada',  v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:9 }, esperado: 'vermelho' },
  { nome: 'Dor 10 isolada', v: { pa_sis:120, pa_dia:80, fc:72, fr:16, temp:36.5, sat:98, dor:10 }, esperado: 'vermelho' },

  // ---- Múltiplos warnings ----
  { nome: '2 warnings (HAS 145/95)', v: { pa_sis:145, pa_dia:95, fc:72, fr:16, temp:36.5, sat:98, dor:0 }, esperado: 'amarelo' },
  { nome: '1 warning isolado',       v: { pa_sis:120, pa_dia:80, fc:105, fr:16, temp:36.5, sat:98, dor:0 }, esperado: 'verde' },

  // ---- FC ----
  { nome: 'FC 110 (warning taquicardia)', v: { pa_sis:120, pa_dia:80, fc:110, fr:16, temp:36.5, sat:98, dor:0 }, esperado: 'verde' },
  { nome: 'FC 130 (danger taquicardia)',  v: { pa_sis:120, pa_dia:80, fc:130, fr:16, temp:36.5, sat:98, dor:0 }, esperado: 'vermelho' },
  { nome: 'FC 45 (danger bradicardia)',   v: { pa_sis:120, pa_dia:80, fc:45,  fr:16, temp:36.5, sat:98, dor:0 }, esperado: 'vermelho' },

  // ---- FR ----
  { nome: 'FR 26 (danger taquipneia)',    v: { pa_sis:120, pa_dia:80, fc:72, fr:26, temp:36.5, sat:98, dor:0 }, esperado: 'vermelho' },
  { nome: 'FR 22 (warning)',              v: { pa_sis:120, pa_dia:80, fc:72, fr:22, temp:36.5, sat:98, dor:0 }, esperado: 'verde' },
  { nome: 'FR 8 (danger bradipneia)',     v: { pa_sis:120, pa_dia:80, fc:72, fr:8,  temp:36.5, sat:98, dor:0 }, esperado: 'vermelho' },

  // ---- Vazio / parcial ----
  { nome: 'Nenhum sinal preenchido', v: {}, esperado: null },
  { nome: 'Só dor 4', v: { dor: 4 }, esperado: 'azul' },

  // ---- Cenário clínico complexo ----
  { nome: 'IAM típico: PA 100/65, FC 110, FR 22, SatO2 93, dor 8',
    v: { pa_sis:100, pa_dia:65, fc:110, fr:22, temp:36.5, sat:93, dor:8 },
    esperado: 'amarelo' /* PA sis 100=ok, PA dia 65=ok, FC 110=warn, FR 22=warn, sat 93=warn, dor 8=warn (e >=8) → 4 warns → amarelo */ },
  { nome: 'Sepse: T 39.2, FC 115, FR 23, SatO2 92, PA 95/55',
    v: { pa_sis:95, pa_dia:55, fc:115, fr:23, temp:39.2, sat:92, dor:5 },
    esperado: 'vermelho' /* temp 39.2 → danger */ },
  { nome: 'AVC simulado: PA 190/100, FC 90, dor 0',
    v: { pa_sis:190, pa_dia:100, fc:90, fr:16, temp:36.5, sat:97, dor:0 },
    esperado: 'vermelho' /* PA sis 190 → danger */ },
];

// Executa
let pass = 0, fail = 0;
const falhas = [];
for (const c of casos) {
  const obtido = calcularSugestao(c.v);
  const ok = obtido === c.esperado;
  if (ok) pass++; else { fail++; falhas.push({ ...c, obtido }); }
  console.log(`${ok ? '✓' : '✗'} ${c.nome.padEnd(50)} esperado=${String(c.esperado).padEnd(10)} obtido=${obtido}`);
}

console.log(`\n${pass} passou · ${fail} falhou de ${casos.length} casos`);

if (falhas.length) {
  console.log('\n--- FALHAS ---');
  falhas.forEach(f => {
    console.log(`\n${f.nome}`);
    console.log('  vitals:  ', JSON.stringify(f.v));
    console.log('  esperado:', f.esperado);
    console.log('  obtido:  ', f.obtido);
    const niveis = {};
    ['pa_sis','pa_dia','fc','fr','temp','sat','dor'].forEach(id => {
      if (f.v[id] !== undefined) niveis[id] = nivelVital(id, f.v[id]);
    });
    console.log('  níveis: ', JSON.stringify(niveis));
  });
}

// Também testa alertas por card (PA combinada, etc)
console.log('\n========== TESTES DE ALERTAS DOS CARDS ==========');
function nivelCard(ids, vitals) {
  let nivel = 'ok';
  ids.forEach(id => {
    const n = nivelVital(id, vitals[id]);
    if (n === 'danger') nivel = 'danger';
    else if (n === 'warning' && nivel !== 'danger') nivel = 'warning';
  });
  return nivel;
}
const alertCasos = [
  { nome: 'PA 130/85 — ambos ok',           pa_sis:130, pa_dia:85,  esperado:'ok'      },
  { nome: 'PA 145/85 — sis warn, dia ok',   pa_sis:145, pa_dia:85,  esperado:'warning' },
  { nome: 'PA 130/95 — sis ok, dia warn',   pa_sis:130, pa_dia:95,  esperado:'warning' },
  { nome: 'PA 185/85 — sis danger',         pa_sis:185, pa_dia:85,  esperado:'danger'  },
  { nome: 'PA 130/115 — dia danger',        pa_sis:130, pa_dia:115, esperado:'danger'  },
  { nome: 'PA 80/45 — ambos danger',        pa_sis:80,  pa_dia:45,  esperado:'danger'  },
  { nome: 'PA 145/95 — ambos warn',         pa_sis:145, pa_dia:95,  esperado:'warning' },
];
let aPass=0, aFail=0;
alertCasos.forEach(c => {
  const obtido = nivelCard(['pa_sis','pa_dia'], { pa_sis: c.pa_sis, pa_dia: c.pa_dia });
  const ok = obtido === c.esperado;
  if (ok) aPass++; else aFail++;
  console.log(`${ok?'✓':'✗'} ${c.nome.padEnd(40)} esperado=${c.esperado.padEnd(8)} obtido=${obtido}`);
});
console.log(`\n${aPass} passou · ${aFail} falhou de ${alertCasos.length} casos de alerta`);
