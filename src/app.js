import { parseCp } from './cpParser.js';
import { initGraph, updateStyle, loadGraph, clearGraph } from './graph.js';

let directed = false;
let weighted = false;
let mode = 'manual';

const directedToggle = document.getElementById('directed-toggle');
const weightedToggle = document.getElementById('weighted-toggle');
const manualBtn      = document.getElementById('mode-manual');
const inputBtn       = document.getElementById('mode-input');
const manualSection  = document.getElementById('manual-section');
const inputSection   = document.getElementById('input-section');
const hintContent    = document.getElementById('hint-content');
const drawStatus     = document.getElementById('draw-status');
const parseBtn       = document.getElementById('parse-btn');
const cpInput        = document.getElementById('cp-input');
const parseError     = document.getElementById('parse-error');
const clearBtn       = document.getElementById('clear-btn');

function a(cls, key, desc) {
  return `<div class="action-item">
    <kbd class="action-key ${cls}">${key}</kbd>
    <span class="action-desc">${desc}</span>
  </div>`;
}

function renderActions() {
  hintContent.innerHTML =
    a('c1', 'Click canvas',    'add a node') +
    a('c2', 'Click node',      'start drawing edge') +
    a('c3', 'Click 2nd node',  'complete the edge') +
    a('c4', 'Right-click node', 'delete it') +
    a('c5', 'Right-click edge', directed ? 'flip or delete' : 'delete it');
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

parseBtn.addEventListener('click', () => {
  parseError.textContent = '';
  try {
    const { nodes, edges } = parseCp(cpInput.value, weighted);
    loadGraph(nodes, edges);
  } catch (err) {
    parseError.textContent = err.message;
  }
});

clearBtn.addEventListener('click', () => {
  clearGraph();
});
