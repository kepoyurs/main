// ================================================================
// BODY JOURNEY — app.js
// ================================================================

const MEASURES = ['bicep','bust','waist','hips','butt','thighs','calves'];
const ICONS = { bicep:'💪', bust:'👙', waist:'🎀', hips:'🌸', butt:'🍑', thighs:'🦵', calves:'🦿' };
const CHART_COLORS = ['#3b82f6','#d63384','#8b5cf6','#f59e0b','#14b8a6','#10b981','#ef4444'];

// ── Storage ──────────────────────────────────────────────────
const DB = {
  get(k, d = null) {
    try { const v = localStorage.getItem('bj_' + k); return v ? JSON.parse(v) : d; } catch { return d; }
  },
  set(k, v) { try { localStorage.setItem('bj_' + k, JSON.stringify(v)); } catch {} }
};

const getWeights   = ()  => DB.get('weights', []);
const setWeights   = (v) => DB.set('weights', v);
const getMeasures  = ()  => DB.get('measures', []);
const setMeasures  = (v) => DB.set('measures', v);
const getBetStats  = ()  => DB.get('betStats', { me: 0, him: 0, ties: 0 });
const setBetStats  = (v) => DB.set('betStats', v);
const getPendingW  = ()  => DB.get('pendingW', null);
const setPendingW  = (v) => DB.set('pendingW', v);
const getPendingM  = ()  => DB.get('pendingM', null);
const setPendingM  = (v) => DB.set('pendingM', v);

// ── Utilities ─────────────────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0]; }

function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

function winner(actual, me, him) {
  if (me == null && him == null) return null;
  if (me == null) return 'him';
  if (him == null) return 'me';
  const em = Math.abs(actual - me), eh = Math.abs(actual - him);
  return em < eh ? 'me' : eh < em ? 'him' : 'tie';
}

function winBadge(w) {
  if (!w) return '–';
  const labels = { me: '👩 You', him: '👨 Husband', tie: '🤝 Tie' };
  return `<span class="badge badge-${w}">${labels[w]}</span>`;
}

// ── Navigation ────────────────────────────────────────────────
function initNav() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById('tab-' + tab).classList.add('active');
      if (tab === 'dashboard')    renderDashboard();
      if (tab === 'weight')       renderWeightSection();
      if (tab === 'measurements') renderMeasureSection();
      if (tab === 'progress')     renderCharts();
      if (tab === 'model')        initModel();
    });
  });
}

// ── Dashboard ─────────────────────────────────────────────────
function renderDashboard() {
  const weights = getWeights();
  const stats   = getBetStats();
  const latest  = weights.at(-1);
  const first   = weights[0];
  const delta   = latest && first ? latest.actual - first.actual : 0;

  // Stats cards
  document.getElementById('dashboardStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${latest ? latest.actual.toFixed(1) : '–'}</div>
      <div class="stat-label">Current Weight</div>
      <div class="stat-sub">kg</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:${delta < 0 ? 'var(--success)' : delta > 0 ? 'var(--error)' : 'var(--text-muted)'}">
        ${delta !== 0 ? (delta < 0 ? '↓' : '↑') + Math.abs(delta).toFixed(1) : '–'}
      </div>
      <div class="stat-label">Weight Change</div>
      <div class="stat-sub">kg since start</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${weights.length}</div>
      <div class="stat-label">Weigh-ins</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${getMeasures().length}</div>
      <div class="stat-label">Measure Sessions</div>
    </div>`;

  // Leaderboard
  const meW = stats.me, himW = stats.him;
  document.getElementById('betLeaderboard').innerHTML = `
    <h3>Bet Leaderboard</h3>
    <div class="leaderboard">
      <div class="lb-item ${meW > himW ? 'lb-winner' : ''}">
        <div class="lb-name">👩 You ${meW > himW ? '🏆' : ''}</div>
        <div class="lb-wins">${meW}</div>
        <div class="lb-label">wins</div>
      </div>
      <div class="lb-item ${himW > meW ? 'lb-winner' : ''}">
        <div class="lb-name">👨 Husband ${himW > meW ? '🏆' : ''}</div>
        <div class="lb-wins">${himW}</div>
        <div class="lb-label">wins</div>
      </div>
    </div>
    ${stats.ties ? `<p class="lb-ties">${stats.ties} tie${stats.ties > 1 ? 's' : ''}</p>` : ''}`;

  // Activity
  const acts = [];
  getWeights().slice(-5).reverse().forEach(w => {
    acts.push({ icon:'⚖️', text:`Weighed in: ${w.actual.toFixed(1)} kg${w.bets ? ' · Winner: ' + (w.bets.winner === 'me' ? '👩 You' : w.bets.winner === 'him' ? '👨 Him' : '🤝 Tie') : ''}`, date: fmtDate(w.date) });
  });
  getMeasures().slice(-3).reverse().forEach(m => {
    acts.push({ icon:'📏', text:`Measurements logged · Waist: ${m.actual.waist?.toFixed(1) ?? '–'} cm`, date: fmtDate(m.date) });
  });

  const actEl = document.getElementById('recentActivity');
  if (!acts.length) {
    actEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><p>No activity yet — start by logging your weight!</p></div>';
  } else {
    actEl.innerHTML = `<div class="activity-list">${acts.slice(0,6).map(a =>
      `<div class="activity-item"><span class="activity-icon">${a.icon}</span><span class="activity-text">${a.text}</span><span class="activity-date">${a.date}</span></div>`
    ).join('')}</div>`;
  }

  // Header chips
  document.getElementById('headerWeight').textContent = latest ? `${latest.actual.toFixed(1)} kg` : '– kg';
  document.getElementById('headerBetScore').textContent = `You: ${meW} | Him: ${himW}`;
}

// ── Weight Section ────────────────────────────────────────────
function renderWeightSection() {
  const di = document.getElementById('weightDate');
  if (!di.value) di.value = today();
  restoreWeightBetUI();
  renderWeightHistory();
}

function restoreWeightBetUI() {
  const p = getPendingW();
  if (!p)                            return showWStep(1);
  if (p.me != null && p.him != null) return showWStep('confirmed');
  if (p.me != null)                  return showWStep(2);
  showWStep(1);
}

function showWStep(s) {
  document.getElementById('weightBetStep1').classList.toggle('hidden', s !== 1);
  document.getElementById('weightBetStep2').classList.toggle('hidden', s !== 2);
  document.getElementById('weightBetConfirmed').classList.toggle('hidden', s !== 'confirmed');
}

function lockWeightBet(player) {
  const id  = player === 'me' ? 'weightBetMe' : 'weightBetHim';
  const val = parseFloat(document.getElementById(id).value);
  if (isNaN(val) || val < 20 || val > 300) { alert('Enter a valid weight (20–300 kg)'); return; }
  const p = getPendingW() || {};
  p[player] = val;
  setPendingW(p);
  player === 'me' ? showWStep(2) : showWStep('confirmed');
}

function clearWeightBet() {
  if (!confirm('Clear tonight\'s bets?')) return;
  setPendingW(null);
  document.getElementById('weightBetMe').value = '';
  document.getElementById('weightBetHim').value = '';
  showWStep(1);
}

function logWeight() {
  const date   = document.getElementById('weightDate').value;
  const actual = parseFloat(document.getElementById('weightActual').value);
  if (!date) { alert('Pick a date'); return; }
  if (isNaN(actual) || actual < 20 || actual > 300) { alert('Enter a valid weight'); return; }

  const weights = getWeights();
  const pending = getPendingW();
  const entry   = { date, actual };

  if (pending && pending.me != null && pending.him != null) {
    const w = winner(actual, pending.me, pending.him);
    entry.bets = { me: pending.me, him: pending.him, winner: w };
    const stats = getBetStats();
    if (w === 'me') stats.me++; else if (w === 'him') stats.him++; else stats.ties++;
    setBetStats(stats);
    setPendingW(null);

    const errMe  = Math.abs(actual - pending.me).toFixed(2);
    const errHim = Math.abs(actual - pending.him).toFixed(2);
    const label  = w === 'me' ? '👩 You win!' : w === 'him' ? '👨 Husband wins!' : '🤝 Tie!';
    showResult('weightResult', w, `${label} · Actual: ${actual} kg · Your guess: ${pending.me} (off ${errMe}) · His guess: ${pending.him} (off ${errHim})`);
    showWStep(1);
  }

  const idx = weights.findIndex(e => e.date === date);
  if (idx >= 0) weights[idx] = entry; else weights.push(entry);
  weights.sort((a,b) => a.date.localeCompare(b.date));
  setWeights(weights);

  document.getElementById('weightActual').value = '';
  renderWeightHistory();
  renderDashboard();
}

function renderWeightHistory() {
  const weights = getWeights();
  const el = document.getElementById('weightHistory');
  if (!weights.length) { el.innerHTML = emptyState('⚖️', 'No weights logged yet'); return; }

  const rows = [...weights].reverse().map(w => `<tr>
    <td>${fmtDate(w.date)}</td>
    <td><strong>${w.actual.toFixed(1)} kg</strong></td>
    <td>${w.bets ? w.bets.me.toFixed(1) : '–'}</td>
    <td>${w.bets ? w.bets.him.toFixed(1) : '–'}</td>
    <td>${winBadge(w.bets?.winner)}</td>
    <td><button class="btn btn-danger" onclick="delWeight('${w.date}')">✕</button></td>
  </tr>`).join('');

  el.innerHTML = `<table><thead><tr><th>Date</th><th>Actual</th><th>Your Bet</th><th>His Bet</th><th>Winner</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
}

function delWeight(date) {
  if (!confirm('Delete this entry?')) return;
  setWeights(getWeights().filter(w => w.date !== date));
  renderWeightHistory();
  renderDashboard();
}

// ── Measurements Section ──────────────────────────────────────
function renderMeasureSection() {
  const di = document.getElementById('measureDate');
  if (!di.value) di.value = today();
  buildMGrid('measureInputGrid');
  buildMGrid('betGridMe');
  buildMGrid('betGridHim');
  restoreMeasureBetUI();
  renderMeasureHistory();
}

function buildMGrid(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = MEASURES.map(m => `
    <div class="measure-input-box">
      <label>${ICONS[m]} ${m}</label>
      <div class="measure-row">
        <input type="number" id="${id}_${m}" step="0.1" min="5" max="250" placeholder="0.0">
        <span class="measure-unit">cm</span>
      </div>
    </div>`).join('');
}

function getGridVals(id) {
  const vals = {};
  MEASURES.forEach(m => {
    const v = parseFloat(document.getElementById(`${id}_${m}`)?.value);
    if (!isNaN(v)) vals[m] = v;
  });
  return vals;
}

function restoreMeasureBetUI() {
  const p = getPendingM();
  if (!p)               return showMStep(1);
  if (p.me && p.him)    return showMStep('confirmed');
  if (p.me)             return showMStep(2);
  showMStep(1);
}

function showMStep(s) {
  document.getElementById('measureBetStep1').classList.toggle('hidden', s !== 1);
  document.getElementById('measureBetStep2').classList.toggle('hidden', s !== 2);
  document.getElementById('measureBetConfirmed').classList.toggle('hidden', s !== 'confirmed');
}

function lockMeasureBet(player) {
  const id   = player === 'me' ? 'betGridMe' : 'betGridHim';
  const vals = getGridVals(id);
  if (Object.keys(vals).length < MEASURES.length) { alert('Please fill in all measurements'); return; }
  const p = getPendingM() || {};
  p[player] = vals;
  setPendingM(p);
  player === 'me' ? showMStep(2) : showMStep('confirmed');
}

function clearMeasureBet() {
  if (!confirm('Clear measurement bets?')) return;
  setPendingM(null);
  showMStep(1);
}

function logMeasurements() {
  const date   = document.getElementById('measureDate').value;
  const actual = getGridVals('measureInputGrid');
  if (!date) { alert('Pick a date'); return; }
  if (Object.keys(actual).length < MEASURES.length) { alert('Fill in all measurements'); return; }

  const records = getMeasures();
  const pending = getPendingM();
  const entry   = { date, actual };

  if (pending && pending.me && pending.him) {
    let meW = 0, himW = 0;
    const winners = {};
    MEASURES.forEach(m => {
      const w = winner(actual[m], pending.me[m], pending.him[m]);
      winners[m] = w;
      if (w === 'me') meW++; else if (w === 'him') himW++;
    });
    const ow = meW > himW ? 'me' : himW > meW ? 'him' : 'tie';
    entry.bets = { me: pending.me, him: pending.him, winners, overall: ow };

    const stats = getBetStats();
    if (ow === 'me') stats.me++; else if (ow === 'him') stats.him++; else stats.ties++;
    setBetStats(stats);
    setPendingM(null);

    const label = ow === 'me' ? '👩 You win!' : ow === 'him' ? '👨 Husband wins!' : '🤝 Tie!';
    showResult('measureResult', ow, `${label} · You won ${meW} measurements, husband won ${himW}`);
    showMStep(1);
  }

  const idx = records.findIndex(r => r.date === date);
  if (idx >= 0) records[idx] = entry; else records.push(entry);
  records.sort((a,b) => a.date.localeCompare(b.date));
  setMeasures(records);

  MEASURES.forEach(m => { const el = document.getElementById(`measureInputGrid_${m}`); if (el) el.value = ''; });
  renderMeasureHistory();
  renderDashboard();
}

function renderMeasureHistory() {
  const records = getMeasures();
  const el = document.getElementById('measureHistory');
  if (!records.length) { el.innerHTML = emptyState('📏', 'No measurements logged yet'); return; }

  const heads = ['Date', ...MEASURES.map(m => m.charAt(0).toUpperCase() + m.slice(1)), 'Winner', ''];
  const rows  = [...records].reverse().map(r => {
    const cells = MEASURES.map(m => `<td>${r.actual[m]?.toFixed(1) ?? '–'}</td>`).join('');
    return `<tr><td>${fmtDate(r.date)}</td>${cells}<td>${winBadge(r.bets?.overall)}</td><td><button class="btn btn-danger" onclick="delMeasure('${r.date}')">✕</button></td></tr>`;
  }).join('');

  el.innerHTML = `<table><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

function delMeasure(date) {
  if (!confirm('Delete this entry?')) return;
  setMeasures(getMeasures().filter(r => r.date !== date));
  renderMeasureHistory();
  renderDashboard();
}

// ── Charts ────────────────────────────────────────────────────
let wChart = null, mChart = null;

function renderCharts() {
  const weights  = getWeights();
  const measures = getMeasures();

  // Weight chart
  const wCtx = document.getElementById('weightChart').getContext('2d');
  if (wChart) { wChart.destroy(); wChart = null; }

  if (weights.length >= 2) {
    const grad = wCtx.createLinearGradient(0, 0, 0, 270);
    grad.addColorStop(0, 'rgba(214,51,132,0.35)');
    grad.addColorStop(1, 'rgba(214,51,132,0)');
    wChart = new Chart(wCtx, {
      type: 'line',
      data: {
        labels: weights.map(w => fmtDate(w.date)),
        datasets: [{ label:'Weight (kg)', data: weights.map(w => w.actual), borderColor:'#d63384', backgroundColor: grad, borderWidth:2.5, pointRadius:4, tension:0.4, fill:true }]
      },
      options: chartOpts(v => `${v} kg`)
    });
  } else {
    drawPlaceholder(wCtx, 'Log at least 2 weights to see the chart');
  }

  // Measurements chart
  const mCtx = document.getElementById('measureChart').getContext('2d');
  if (mChart) { mChart.destroy(); mChart = null; }

  if (measures.length >= 2) {
    mChart = new Chart(mCtx, {
      type: 'line',
      data: {
        labels: measures.map(m => fmtDate(m.date)),
        datasets: MEASURES.map((key, i) => ({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          data: measures.map(m => m.actual[key] ?? null),
          borderColor: CHART_COLORS[i],
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3
        }))
      },
      options: {
        ...chartOpts(v => `${v} cm`),
        plugins: {
          ...chartOpts(v => `${v} cm`).plugins,
          legend: { position:'bottom', labels:{ font:{ family:'Nunito', size:11 }, boxWidth:12, padding:10 } }
        }
      }
    });
  } else {
    drawPlaceholder(mCtx, 'Log at least 2 measurement sessions to see the chart');
  }

  // Progress summary
  const sumEl = document.getElementById('progressSummary');
  if (measures.length < 2) {
    sumEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;text-align:center;padding:1rem">Log at least 2 sessions to see progress</p>';
    return;
  }
  const first = measures[0], last = measures.at(-1);
  sumEl.innerHTML = `<div class="progress-grid">${MEASURES.map(m => {
    const s = first.actual[m], e = last.actual[m];
    if (!s || !e) return '';
    const d = e - s;
    const cls = d < 0 ? 'down' : d > 0 ? 'up' : 'flat';
    return `<div class="prog-item"><div class="prog-label">${ICONS[m]} ${m}</div><div class="prog-val ${cls}">${d < 0 ? '' : '+'}${d.toFixed(1)} cm</div></div>`;
  }).join('')}</div>`;
}

function chartOpts(tickFmt) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => tickFmt(ctx.parsed.y?.toFixed(1)) } } },
    scales: {
      y: { ticks: { callback: tickFmt, font:{ family:'Nunito', size:11 } }, grid:{ color:'rgba(214,51,132,0.07)' } },
      x: { ticks: { font:{ family:'Nunito', size:10 }, maxRotation:45 }, grid:{ display:false } }
    }
  };
}

function drawPlaceholder(ctx, msg) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#f9a8d4';
  ctx.font = '500 14px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(msg, ctx.canvas.width / 2, 80);
}

// ── 3D Model ──────────────────────────────────────────────────
const BASELINE = { bicep:32, bust:95, waist:80, hips:100, butt:102, thighs:58, calves:37 };

let scene3d, cam3d, renderer3d, bodyGroup, ghostGroup;
let modelReady = false;
let autoRotate = true;

function buildBody(mIn) {
  const m   = Object.assign({}, BASELINE, mIn || {});
  const τ   = 2 * Math.PI;
  const cr  = c => c / τ * 0.01;
  const bR  = cr(m.bust),  wR = cr(m.waist), hR = cr(m.hips);
  const tR  = cr(m.thighs), cR = cr(m.calves), aR = cr(m.bicep), uR = cr(m.butt);

  const group   = new THREE.Group();
  const bodyMat = new THREE.MeshPhongMaterial({ color:0xf4a7c3, shininess:30 });
  const skinMat = new THREE.MeshPhongMaterial({ color:0xfadbc8, shininess:20 });
  const hairMat = new THREE.MeshPhongMaterial({ color:0x3d2314, shininess:50 });

  function add(geo, mat, x, y, z, sx, sy, sz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x||0, y||0, z||0);
    if (sx) mesh.scale.set(sx, sy||sx, sz||sx);
    group.add(mesh);
    return mesh;
  }

  // Head
  add(new THREE.SphereGeometry(0.095, 20, 18), skinMat, 0, 0.71);
  // Hair cap
  const hair = add(new THREE.SphereGeometry(0.097, 16, 10), hairMat, 0, 0.73);
  hair.scale.set(1, 0.82, 1);
  // Neck
  add(new THREE.CylinderGeometry(0.033, 0.038, 0.07, 10), skinMat, 0, 0.585);
  // Shoulders
  add(new THREE.CylinderGeometry(bR*1.07, bR*1.05, 0.05, 16), bodyMat, 0, 0.525);
  // Chest → waist taper
  add(new THREE.CylinderGeometry(wR + (bR-wR)*0.45, bR, 0.20, 16), bodyMat, 0, 0.375);
  // Waist band
  add(new THREE.CylinderGeometry(wR, wR + (bR-wR)*0.25, 0.06, 16), bodyMat, 0, 0.245);
  // Waist → hips
  add(new THREE.CylinderGeometry(hR, wR + (hR-wR)*0.3, 0.12, 16), bodyMat, 0, 0.135);
  // Hips
  add(new THREE.CylinderGeometry(hR*0.91, hR, 0.07, 16), bodyMat, 0, 0.035);
  // Butt
  const butt = add(new THREE.SphereGeometry(uR*0.70, 14, 10), bodyMat, 0, 0.06, -(hR*0.52));
  butt.scale.set(1.35, 0.88, 0.68);
  // Breasts
  for (const s of [-1,1]) {
    const b = add(new THREE.SphereGeometry(bR*0.38, 12, 9), bodyMat, s*bR*0.36, 0.43, bR*0.72);
    b.scale.set(0.9, 0.76, 0.68);
  }

  // Legs
  const legX = tR * 1.3 + 0.006;
  for (const s of [-1,1]) {
    const x = s * legX;
    add(new THREE.CylinderGeometry(tR*0.87, tR,     0.23, 11), bodyMat, x, -0.165);
    add(new THREE.CylinderGeometry(cR*1.10, tR*0.87,0.11, 11), bodyMat, x, -0.345);
    add(new THREE.SphereGeometry(cR*1.05, 9, 8),               bodyMat, x, -0.435, 0.01);
    add(new THREE.CylinderGeometry(cR*0.80, cR,     0.21, 11), bodyMat, x, -0.565);
    add(new THREE.CylinderGeometry(cR*0.48, cR*0.76,0.08, 9),  skinMat, x, -0.71);
    const foot = add(new THREE.BoxGeometry(0.055, 0.04, 0.13), skinMat, x, -0.77, 0.038);
  }

  // Arms
  const ax = s => s * (bR + aR + 0.018);
  for (const s of [-1,1]) {
    const x = ax(s);
    add(new THREE.SphereGeometry(aR*1.15, 11, 9),               bodyMat, x, 0.505);
    add(new THREE.CylinderGeometry(aR*0.84, aR,     0.20, 10),  bodyMat, x, 0.345);
    add(new THREE.SphereGeometry(aR*0.76, 9, 7),                skinMat, x, 0.22);
    add(new THREE.CylinderGeometry(aR*0.61, aR*0.76,0.20, 10),  skinMat, x, 0.07);
    const hand = add(new THREE.SphereGeometry(aR*0.70, 9, 7),   skinMat, x, -0.048);
    hand.scale.set(1, 1.15, 0.72);
  }

  return group;
}

function initModel() {
  if (modelReady) { updateModel(); return; }

  const canvas = document.getElementById('modelCanvas');
  const W = canvas.clientWidth || 400;
  const H = 520;

  scene3d = new THREE.Scene();
  scene3d.background = new THREE.Color(0xfdf0f7);

  cam3d = new THREE.PerspectiveCamera(42, W / H, 0.01, 100);
  cam3d.position.set(0, 0.10, 2.5);

  scene3d.add(new THREE.AmbientLight(0xfff5f8, 0.65));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(1.5, 3, 4); scene3d.add(sun);
  const fill = new THREE.DirectionalLight(0xf8d7ea, 0.4);
  fill.position.set(-2, 0, -2); scene3d.add(fill);

  renderer3d = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer3d.setSize(W, H);
  renderer3d.setPixelRatio(Math.min(devicePixelRatio, 2));

  // Floor circle
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 32),
    new THREE.MeshLambertMaterial({ color: 0xf8bbd0, transparent:true, opacity:0.4 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.84;
  scene3d.add(floor);

  const measures = getMeasures();
  bodyGroup = buildBody(measures.at(-1)?.actual || null);
  scene3d.add(bodyGroup);

  // Mouse / touch rotation
  let dragging = false, lastX = 0;
  canvas.addEventListener('mousedown', e => { dragging = true; lastX = e.clientX; autoRotate = false; });
  canvas.addEventListener('mousemove', e => { if (!dragging) return; bodyGroup.rotation.y += (e.clientX - lastX) * 0.007; if (ghostGroup) ghostGroup.rotation.y = bodyGroup.rotation.y; lastX = e.clientX; });
  canvas.addEventListener('mouseup',   () => dragging = false);
  canvas.addEventListener('mouseleave',() => dragging = false);
  canvas.addEventListener('touchstart', e => { lastX = e.touches[0].clientX; autoRotate = false; }, { passive: true });
  canvas.addEventListener('touchmove',  e => {
    const dx = e.touches[0].clientX - lastX;
    bodyGroup.rotation.y += dx * 0.007;
    if (ghostGroup) ghostGroup.rotation.y = bodyGroup.rotation.y;
    lastX = e.touches[0].clientX;
    e.preventDefault();
  }, { passive: false });

  // Scroll zoom
  canvas.addEventListener('wheel', e => {
    cam3d.position.z = Math.max(1.2, Math.min(4.5, cam3d.position.z + e.deltaY * 0.003));
    e.preventDefault();
  }, { passive: false });

  // Resize
  window.addEventListener('resize', () => {
    const nW = canvas.clientWidth;
    cam3d.aspect = nW / H;
    cam3d.updateProjectionMatrix();
    renderer3d.setSize(nW, H);
  });

  (function loop() {
    requestAnimationFrame(loop);
    if (autoRotate) {
      bodyGroup.rotation.y += 0.004;
      if (ghostGroup) ghostGroup.rotation.y = bodyGroup.rotation.y;
    }
    renderer3d.render(scene3d, cam3d);
  })();

  modelReady = true;
  populateModelSelects();
  updateModelSidebar();
}

function updateModel() {
  if (!modelReady) return;

  const dateVal  = document.getElementById('modelDate').value;
  const measures = getMeasures();
  const mData    = dateVal === 'latest' ? measures.at(-1)?.actual : measures.find(r => r.date === dateVal)?.actual;

  scene3d.remove(bodyGroup);
  bodyGroup = buildBody(mData || null);
  scene3d.add(bodyGroup);

  // Ghost / compare
  if (ghostGroup) { scene3d.remove(ghostGroup); ghostGroup = null; }
  const compareMode = document.getElementById('compareMode').checked;
  const compareVal  = document.getElementById('compareDate').value;
  if (compareMode && compareVal) {
    const cm = measures.find(r => r.date === compareVal)?.actual;
    if (cm) {
      ghostGroup = buildBody(cm);
      ghostGroup.children.forEach(c => {
        c.material = new THREE.MeshPhongMaterial({ color:0x9c27b0, transparent:true, opacity:0.22 });
      });
      ghostGroup.rotation.y = bodyGroup.rotation.y;
      scene3d.add(ghostGroup);
    }
  }

  updateModelSidebar();
}

function toggleCompare() {
  document.getElementById('compareDate').disabled = !document.getElementById('compareMode').checked;
  if (modelReady) updateModel();
}

function populateModelSelects() {
  const measures = getMeasures();
  const opts     = measures.map(r => `<option value="${r.date}">${fmtDate(r.date)}</option>`).join('');
  document.getElementById('modelDate').innerHTML    = `<option value="latest">Latest</option>${opts}`;
  document.getElementById('compareDate').innerHTML  = `<option value="">Select date…</option>${opts}`;
}

function updateModelSidebar() {
  populateModelSelects();
  const measures = getMeasures();
  const current  = measures.at(-1)?.actual || null;
  const prev     = measures.length > 1 ? measures[measures.length - 2].actual : null;
  const el       = document.getElementById('modelMeasurementsList');

  if (!current) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:1rem">No measurements logged yet</p>';
    return;
  }

  el.innerHTML = MEASURES.map(m => {
    const val    = current[m];
    const pval   = prev?.[m];
    const delta  = val != null && pval != null ? val - pval : null;
    const dHtml  = delta != null ? `<span class="m-delta ${delta < 0 ? 'down' : 'up'}">${delta < 0 ? '↓' : '↑'}${Math.abs(delta).toFixed(1)}</span>` : '';
    return `<div class="m-row">
      <span class="m-name">${ICONS[m]} ${m}</span>
      <div class="m-right"><span class="m-val">${val != null ? val.toFixed(1) + ' cm' : '–'}</span>${dHtml}</div>
    </div>`;
  }).join('');
}

// ── Shared helpers ────────────────────────────────────────────
function showResult(elId, type, msg) {
  const el = document.getElementById(elId);
  el.className = `result-display show result-${type === 'me' ? 'win' : type === 'him' ? 'loss' : 'tie'}`;
  el.textContent = msg;
}

function emptyState(icon, msg) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><p>${msg}</p></div>`;
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  document.getElementById('weightDate').value  = today();
  document.getElementById('measureDate').value = today();
  renderDashboard();
  renderWeightSection();
  renderMeasureSection();
});
