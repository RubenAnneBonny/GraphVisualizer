import { parseCp } from './cpParser.js';
import { initGraph, updateStyle, loadGraph, clearGraph } from './graph.js';

let directed = false;
let weighted = false;
let mode = 'manual';

const directedToggle = document.getElementById('directed-toggle');
const weightedToggle = document.getElementById('weighted-toggle');
const manualBtn = document.getElementById('mode-manual');
const inputBtn = document.getElementById('mode-input');
const manualSection = document.getElementById('manual-section');
const inputSection = document.getElementById('input-section');
const hintContent = document.getElementById('hint-content');
const parseBtn = document.getElementById('parse-btn');
const cpInput = document.getElementById('cp-input');
const parseError = document.getElementById('parse-error');
const clearBtn = document.getElementById('clear-btn');

function hint(color, text) {
  return `<div class="hint-item"><span class="hint-dot ${color}"></span>${text}</div>`;
}

function setHint(pendingSourceId) {
  if (pendingSourceId !== null) {
    hintContent.innerHTML =
      hint('orange', 'Click target node → complete edge') +
      hint('muted',  'Click source again or canvas → cancel');
  } else {
    hintContent.innerHTML =
      hint('blue',   'Click canvas → add node') +
      hint('orange', 'Click node → start edge') +
      hint('red',    'Right-click node → delete') +
      hint('red',    'Right-click edge → flip / delete');
  }
}

initGraph({
  getDirected: () => directed,
  getWeighted: () => weighted,
  getMode: () => mode,
  onPendingSourceChange: setHint,
});

setHint(null);

directedToggle.addEventListener('change', () => {
  directed = directedToggle.checked;
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
