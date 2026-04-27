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
const hintText = document.getElementById('hint-text');
const parseBtn = document.getElementById('parse-btn');
const cpInput = document.getElementById('cp-input');
const parseError = document.getElementById('parse-error');
const clearBtn = document.getElementById('clear-btn');

initGraph({
  getDirected: () => directed,
  getWeighted: () => weighted,
  getMode: () => mode,
  onPendingSourceChange: (sourceId) => {
    if (sourceId !== null) {
      hintText.textContent = 'Click target node to add edge — or click same node to cancel';
    } else {
      hintText.textContent = 'Click canvas to add node — click node to start edge';
    }
  },
});

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
