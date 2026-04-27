import { parseCp } from './cpParser.js';
import { initGraph, updateStyle, loadGraph, clearGraph } from './graph.js';

let directed    = false;
let weighted    = false;
let zeroIndexed = false;
let mode = 'manual';

const directedToggle = document.getElementById('directed-toggle');
const weightedToggle = document.getElementById('weighted-toggle');
const manualBtn      = document.getElementById('mode-manual');
const inputBtn       = document.getElementById('mode-input');
const manualSection  = document.getElementById('manual-section');
const inputSection   = document.getElementById('input-section');
const hintContent    = document.getElementById('hint-content');
const drawStatus     = document.getElementById('draw-status');
const zeroIndexedToggle = document.getElementById('zero-indexed-toggle');
const parseBtn          = document.getElementById('parse-btn');
const cpInput        = document.getElementById('cp-input');
const parseError     = document.getElementById('parse-error');
const clearBtn       = document.getElementById('clear-btn');

function a(color, key, desc) {
  return `<div style="display:flex;align-items:center;gap:9px;margin-bottom:8px">
    <kbd style="color:${color};background:${color}25;border:1px solid ${color}55;font:600 11px/1.2 inherit;padding:3px 8px;border-radius:5px;white-space:nowrap;font-style:normal;letter-spacing:0.01em">${key}</kbd>
    <span style="font-size:12px;color:#6c7086">${desc}</span>
  </div>`;
}

function renderActions() {
  hintContent.innerHTML =
    a('#89b4fa', 'Click canvas',      'add a node') +
    a('#89dceb', 'Click node',        'start edge') +
    a('#a6e3a1', 'Click 2nd node',    'complete edge') +
    a('#f9e2af', 'Right-click node',  'delete') +
    (directed ? a('#fab387', 'Double-click edge', 'flip direction') : '') +
    a('#f38ba8', 'Right-click edge',  'delete');
}

initGraph({
  getDirected: () => directed,
  getWeighted: () => weighted,
  getMode:     () => mode,
  onPendingSourceChange: (sourceId) => {
    if (sourceId !== null) {
      drawStatus.textContent = `Drawing edge from node ${sourceId}…`;
      drawStatus.hidden = false;
    } else {
      drawStatus.hidden = true;
    }
  },
});

renderActions();

directedToggle.addEventListener('change', () => {
  directed = directedToggle.checked;
  renderActions();
  updateStyle();
});

weightedToggle.addEventListener('change', () => {
  weighted = weightedToggle.checked;
  updateStyle();
});

manualBtn.addEventListener('click', () => {
  mode = 'manual';
  manualBtn.classList.add('active');
  inputBtn.classList.remove('active');
  manualSection.hidden = false;
  inputSection.hidden = true;
});

inputBtn.addEventListener('click', () => {
  mode = 'input';
  inputBtn.classList.add('active');
  manualBtn.classList.remove('active');
  inputSection.hidden = false;
  manualSection.hidden = true;
});

zeroIndexedToggle.addEventListener('change', () => {
  zeroIndexed = zeroIndexedToggle.checked;
});

parseBtn.addEventListener('click', () => {
  parseError.textContent = '';
  try {
    const { nodes, edges } = parseCp(cpInput.value, weighted, zeroIndexed);
    loadGraph(nodes, edges);
  } catch (err) {
    parseError.textContent = err.message;
  }
});

clearBtn.addEventListener('click', () => {
  clearGraph();
});
