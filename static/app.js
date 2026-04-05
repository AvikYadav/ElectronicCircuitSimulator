// ── PRESET CIRCUITS ───────────────────────────────────────────
const PRESETS = [
  {
    name: 'LED Driver',
    icon: '💡',
    desc: 'Battery + resistor + LED',
    waveform: 'led',
    data: `$ 1 0.000005 10.20027730826997 50 5 43 5e-11
v 160 272 160 176 0 0 40 5 0 0 0.5
r 160 176 304 176 0 330
d 304 176 304 272 2 default
w 160 272 304 272 0`
  },
  {
    name: 'RC Low-Pass Filter',
    icon: '〰',
    desc: 'Frequency-selective network',
    waveform: 'rc',
    data: `$ 1 0.000005 10.20027730826997 50 5 43 5e-11
v 96 240 96 128 0 1 60 5 0 0 0.5
r 96 128 256 128 0 1000
c 256 128 256 240 0 1e-6 0 0.001
w 96 240 256 240 0`
  },
  {
    name: 'Voltage Divider',
    icon: '⚡',
    desc: 'Two-resistor potential divider',
    waveform: 'divider',
    data: `$ 1 0.000005 10.20027730826997 50 5 43 5e-11
v 192 336 192 160 0 0 40 5 0 0 0.5
r 192 160 352 160 0 10000
r 352 160 352 336 0 10000
w 192 336 352 336 0`
  },
  {
    name: 'Half-Wave Rectifier',
    icon: '∿',
    desc: 'AC to pulsating DC',
    waveform: 'rectifier',
    data: `$ 1 0.000005 10.20027730826997 50 5 43 5e-11
v 96 288 96 160 0 1 60 5 0 0 0.5
d 96 160 256 160 2 default
r 256 160 256 288 0 1000
w 96 288 256 288 0`
  },
  {
    name: 'LC Oscillator',
    icon: '🔄',
    desc: 'Tank circuit — sinusoidal oscillation',
    waveform: 'lc',
    data: `$ 1 0.000005 10.20027730826997 50 5 43 5e-11
c 224 160 224 288 0 1e-6 10 0.001
l 352 160 352 288 0 0.001 0
w 224 160 352 160 0
w 224 288 352 288 0`
  },
  {
    name: 'NPN Switch',
    icon: '🔀',
    desc: 'Transistor as digital switch',
    waveform: 'switch',
    data: `$ 1 0.000005 10.20027730826997 50 5 43 5e-11
v 112 320 112 176 0 0 40 5 0 0 0.5
v 256 320 256 288 0 0 40 0.7 0 0 0.5
r 112 176 320 176 0 1000
r 256 288 256 240 0 10000
t 240 240 320 240 0 1 0.6196602772057922 0.6796602772057923 100
w 320 176 320 224 0
w 112 320 256 320 0
w 320 256 320 320 0`
  }
];

// ── WAVEFORM GENERATORS ───────────────────────────────────────
const N = 200;
function range(n) { return Array.from({length: n}, (_, i) => i); }

const WAVEFORMS = {
  led: () => {
    // DC: V_LED ≈ 2V, I = (5-2)/330 ≈ 9.1mA
    return {
      v: range(N).map(() => 2.0),
      i: range(N).map(() => 9.1),
      vLabel: 'V across LED', vUnit: 'V',
      iLabel: 'Circuit current', iUnit: 'mA',
      tLabel: 'time (steady state)'
    };
  },
  rc: () => {
    // Step response: V_C = 5(1 - e^-t/τ), R=1kΩ, C=1µF, τ=1ms, show 0-5ms
    const tau = 1;
    return {
      v: range(N).map(i => { const t = i * 5 / N; return 5 * (1 - Math.exp(-t / tau)); }),
      i: range(N).map(i => { const t = i * 5 / N; return 5 * Math.exp(-t / tau); }), // mA = V/kΩ
      vLabel: 'V_capacitor', vUnit: 'V',
      iLabel: 'Charging current', iUnit: 'mA',
      tLabel: '0 – 5 ms'
    };
  },
  divider: () => {
    // V_out = 5 × 10k/(10k+10k) = 2.5 V, I = 5/20k = 0.25 mA
    return {
      v: range(N).map(() => 2.5),
      i: range(N).map(() => 0.25),
      vLabel: 'V_output', vUnit: 'V',
      iLabel: 'Branch current', iUnit: 'mA',
      tLabel: 'time (steady state)'
    };
  },
  rectifier: () => {
    // Half-wave rectified 60 Hz, Vp=5V, show 2 cycles
    return {
      v: range(N).map(i => { const v = 5 * Math.sin(2 * Math.PI * 2 * i / N); return Math.max(0, v); }),
      i: range(N).map(i => { const v = 5 * Math.sin(2 * Math.PI * 2 * i / N); return Math.max(0, v); }), // mA through 1kΩ
      vLabel: 'V_load', vUnit: 'V',
      iLabel: 'Load current', iUnit: 'mA',
      tLabel: '0 – 33 ms (2 cycles @ 60 Hz)'
    };
  },
  lc: () => {
    // L=1mH, C=1µF → f ≈ 5033 Hz, show 4 cycles with damping
    return {
      v: range(N).map(i => {
        const theta = 2 * Math.PI * 4 * i / N;
        return 10 * Math.cos(theta) * Math.exp(-i / N * 2.5);
      }),
      i: range(N).map(i => {
        const theta = 2 * Math.PI * 4 * i / N;
        return -10 * Math.sin(theta) * Math.exp(-i / N * 2.5);
      }),
      vLabel: 'V_capacitor', vUnit: 'V',
      iLabel: 'Tank current', iUnit: 'A',
      tLabel: '4 cycles (damped)'
    };
  },
  switch: () => {
    // Step switch: 0 → 5V at midpoint
    return {
      v: range(N).map(i => i < N * 0.45 ? 0 : (i < N * 0.5 ? (i - N * 0.45) / (N * 0.05) * 5 : 5)),
      i: range(N).map(i => i < N * 0.45 ? 0 : (i < N * 0.5 ? (i - N * 0.45) / (N * 0.05) * 5 : 5)), // mA
      vLabel: 'V_collector', vUnit: 'V',
      iLabel: 'Collector current', iUnit: 'mA',
      tLabel: 'switching transient'
    };
  }
};

// ── CHART INSTANCES ───────────────────────────────────────────
let vChart = null;
let iChart = null;

function mkChart(id, color) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: Array(N).fill(''),
      datasets: [{
        data: Array(N).fill(null),
        borderColor: color,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: true,
        backgroundColor: color.replace(')', ', 0.12)').replace('rgb', 'rgba')
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeInOutQuart' },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          ticks: {
            color: '#3a4e60',
            font: { family: 'DM Mono', size: 9 },
            maxTicksLimit: 5,
            padding: 4
          },
          border: { color: 'rgba(255,255,255,0.06)', dash: [2, 4] }
        }
      }
    }
  });
}

function initCharts() {
  vChart = mkChart('voltageChart', 'rgb(34, 197, 94)');
  iChart = mkChart('currentChart', 'rgb(59, 130, 246)');
  showIdleGraphs();
}

function updateGraphs(waveformKey) {
  if (!vChart || !iChart) return;
  const gen = WAVEFORMS[waveformKey];
  if (!gen) { showIdleGraphs(); return; }
  const w = gen();

  vChart.data.datasets[0].data = w.v;
  iChart.data.datasets[0].data = w.i;
  vChart.update();
  iChart.update();

  document.getElementById('vLabel').innerHTML =
    `<span>${w.vLabel}</span> &nbsp;<span style="color:var(--ink-muted)">${w.vUnit}</span>`;
  document.getElementById('iLabel').innerHTML =
    `<span>${w.iLabel}</span> &nbsp;<span style="color:var(--ink-muted)">${w.iUnit}</span>`;
  document.getElementById('vPeak').textContent =
    Math.max(...w.v.map(Math.abs)).toFixed(2) + ' ' + w.vUnit;
  document.getElementById('iPeak').textContent =
    Math.max(...w.i.map(Math.abs)).toFixed(2) + ' ' + w.iUnit;

  // hide idle overlay
  document.querySelectorAll('.graph-idle-msg').forEach(el => el.style.display = 'none');
}

function showIdleGraphs() {
  if (vChart) { vChart.data.datasets[0].data = Array(N).fill(null); vChart.update(); }
  if (iChart) { iChart.data.datasets[0].data = Array(N).fill(null); iChart.update(); }
  document.getElementById('vLabel').textContent = '—';
  document.getElementById('iLabel').textContent = '—';
  document.getElementById('vPeak').textContent = '—';
  document.getElementById('iPeak').textContent = '—';
  document.querySelectorAll('.graph-idle-msg').forEach(el => el.style.display = 'flex');
}

// ── STATE ─────────────────────────────────────────────────────
let currentCircuitId = null;
let currentCircuitName = 'Untitled Circuit';
let sidebarOpen = true;
let activePresetIdx = -1;

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderPresets();
  loadRecentCircuits();
  initCharts();
  checkURLParams();
});

function checkURLParams() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (id) loadCircuitById(parseInt(id));
}

// ── SIDEBAR ───────────────────────────────────────────────────
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  document.getElementById('sidebar').classList.toggle('collapsed', !sidebarOpen);
}

function renderPresets() {
  const list = document.getElementById('presetList');
  list.innerHTML = PRESETS.map((p, i) => `
    <div class="preset-item" id="preset-${i}" onclick="loadPreset(${i})">
      <div class="preset-icon">${p.icon}</div>
      <div class="preset-info">
        <div class="preset-name">${p.name}</div>
        <div class="preset-desc">${p.desc}</div>
      </div>
    </div>
  `).join('');
}

// ── CIRCUIT LOADING ───────────────────────────────────────────
function loadPreset(index) {
  const preset = PRESETS[index];
  // Update active state
  document.querySelectorAll('.preset-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`preset-${index}`)?.classList.add('active');
  activePresetIdx = index;

  loadCircuitText(preset.data, preset.name);
  updateGraphs(preset.waveform);
  toast(`Loaded: ${preset.name}`, 'success');
}

// ── SCOPE LINES ───────────────────────────────────────────────
// These define the 3 scope panels shown in the default circuit.
// Appended to every circuit load so scopes persist across circuits.
const SCOPE_LINES = `o 0 64 0 4099 10 0.05 0 2 0 3
o 1 64 0 4099 10 0.05 1 2 0 3
o 2 64 0 4099 10 0.05 2 2 0 3`;

function injectScopes(circuitText) {
  // Remove any existing scope lines from the circuit to avoid duplicates
  const stripped = circuitText
    .split('\n')
    .filter(line => !line.trimStart().startsWith('o '))
    .join('\n')
    .trimEnd();
  return stripped + '\n' + SCOPE_LINES;
}

function loadCircuitText(text, name = 'Untitled Circuit') {
  try {
    const withScopes = injectScopes(text);
    const compressed = LZString.compressToEncodedURIComponent(withScopes);
    document.getElementById('circuitFrame').src =
      `https://www.falstad.com/circuit/circuitjs.html?ctz=${compressed}`;
    setCircuitName(name);
  } catch (e) {
    toast('Failed to load circuit', 'error');
  }
}

async function loadCircuitById(id) {
  try {
    const res = await fetch(`/api/load/${id}`);
    if (!res.ok) throw new Error();
    const circuit = await res.json();
    // Clear active preset, show idle graphs (custom circuit)
    document.querySelectorAll('.preset-item').forEach(el => el.classList.remove('active'));
    activePresetIdx = -1;
    loadCircuitText(circuit.data, circuit.name);
    showIdleGraphs();
    currentCircuitId = circuit.id;
    toast(`Loaded: ${circuit.name}`, 'success');
    window.history.replaceState({}, '', '/');
  } catch (e) {
    toast('Failed to load circuit', 'error');
  }
}

function setCircuitName(name) {
  currentCircuitName = name;
  document.getElementById('circuitName').textContent = name;
}

function newCircuit() {
  document.getElementById('circuitFrame').src = 'https://www.falstad.com/circuit/circuitjs.html';
  setCircuitName('Untitled Circuit');
  currentCircuitId = null;
  activePresetIdx = -1;
  document.querySelectorAll('.preset-item').forEach(el => el.classList.remove('active'));
  showIdleGraphs();
  toast('New circuit started', 'success');
}

// ── RECENT CIRCUITS ───────────────────────────────────────────
async function loadRecentCircuits() {
  try {
    const circuits = await fetch('/api/circuits').then(r => r.json());
    renderRecentCircuits(circuits);
  } catch (_) {}
}

function renderRecentCircuits(circuits) {
  const el = document.getElementById('recentList');
  if (!circuits.length) {
    el.innerHTML = '<div class="recent-empty">No saved circuits yet</div>';
    return;
  }
  el.innerHTML = circuits.slice(0, 6).map(c => `
    <div class="recent-item" onclick="loadCircuitById(${c.id})">
      <div class="recent-dot"></div>
      <div class="recent-name">${escHtml(c.name)}</div>
    </div>
  `).join('');
}

// ── SAVE MODAL ────────────────────────────────────────────────
function openSaveModal() {
  document.getElementById('saveName').value =
    currentCircuitName === 'Untitled Circuit' ? '' : currentCircuitName;
  document.getElementById('saveDesc').value = '';
  document.getElementById('saveData').value = '';
  openModal('saveModal');
}

async function saveCircuit() {
  const name = document.getElementById('saveName').value.trim() || 'Untitled Circuit';
  const desc = document.getElementById('saveDesc').value.trim();
  const data = document.getElementById('saveData').value.trim();
  if (!data) { toast('Paste your circuit text first', 'error'); return; }

  const btn = document.getElementById('saveBtnPrimary');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: desc, data })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    currentCircuitId = result.id;
    setCircuitName(name);
    closeModal('saveModal');
    toast(`"${name}" saved`, 'success');
    loadRecentCircuits();
  } catch (e) {
    toast(e.message || 'Save failed', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Save Circuit';
  }
}

// ── LOAD MODAL ────────────────────────────────────────────────
function openLoadModal() {
  loadSavedCircuitsList();
  openModal('loadModal');
}

async function loadSavedCircuitsList() {
  const el = document.getElementById('loadList');
  el.innerHTML = '<div class="recent-empty">Loading…</div>';
  try {
    const circuits = await fetch('/api/circuits').then(r => r.json());
    if (!circuits.length) {
      el.innerHTML = '<div class="recent-empty">No saved circuits yet.</div>'; return;
    }
    el.innerHTML = circuits.map(c => `
      <div class="load-item" onclick="selectAndLoad(${c.id})">
        <div>
          <div style="font-size:13px;font-weight:500">${escHtml(c.name)}</div>
          <div style="font-size:11px;color:var(--ink-2);margin-top:2px">
            ${escHtml(c.description || '—')}
            <span style="color:var(--ink-muted);font-family:var(--mono);margin-left:8px">${formatDate(c.updated_at)}</span>
          </div>
        </div>
        <span style="color:var(--ink-muted)">›</span>
      </div>
    `).join('');
  } catch (_) {
    el.innerHTML = '<div class="recent-empty">Failed to load</div>';
  }
}

async function selectAndLoad(id) {
  closeModal('loadModal');
  await loadCircuitById(id);
}

// ── MODAL HELPERS ─────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) e.target.classList.remove('open');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape')
    document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
});

// ── TOAST ─────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 200); }, 3000);
}

// ── UTILS ─────────────────────────────────────────────────────
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function formatDate(s) {
  if (!s) return '';
  return new Date(s + 'Z').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}