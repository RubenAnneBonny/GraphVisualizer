import { buildStylesheet } from './cytoscapeStyle.js';

let cy;
let edgeCounter = 0;
let pendingSource = null;
let didDrag = false;
let selectedEdge = null;
let getDirected;
let getWeighted;
let getMode;
let onPendingSourceChange;
let edgeMenu, edgeFlipBtn, edgeDeleteBtn;

function nextNodeId() {
  const used = new Set(
    cy.nodes()
      .map(n => n.id())
      .filter(id => /^\d+$/.test(id))
      .map(id => parseInt(id, 10))
  );
  let i = 1;
  while (used.has(i)) i++;
  return String(i);
}

function showEdgeMenu(x, y, edge) {
  selectedEdge = edge;
  edgeFlipBtn.hidden = !getDirected();
  edgeMenu.hidden = false;
  const menuW = 160;
  const menuH = getDirected() ? 72 : 38;
  edgeMenu.style.left = `${Math.min(x, window.innerWidth  - menuW - 8)}px`;
  edgeMenu.style.top  = `${Math.min(y, window.innerHeight - menuH - 8)}px`;
}

function hideEdgeMenu() {
  edgeMenu.hidden = true;
  selectedEdge = null;
}

function flipEdge(edge) {
  const { id, source, target, weight } = edge.data();
  edge.animate({ style: { opacity: 0 } }, {
    duration: 150,
    complete: () => {
      edge.remove();
      const newEdge = cy.add({
        group: 'edges',
        data: { id, source: target, target: source, weight },
      });
      newEdge.style({ opacity: 0 });
      newEdge.animate({ style: { opacity: 1 } }, { duration: 200 });
    },
  });
}

function clearPendingSource() {
  if (pendingSource !== null) {
    cy.getElementById(pendingSource).removeClass('pending-source');
  }
  pendingSource = null;
  onPendingSourceChange(null);
}

export function initGraph(options) {
  getDirected = options.getDirected;
  getWeighted = options.getWeighted;
  getMode = options.getMode;
  onPendingSourceChange = options.onPendingSourceChange;

  edgeMenu      = document.getElementById('edge-menu');
  edgeFlipBtn   = document.getElementById('edge-flip-btn');
  edgeDeleteBtn = document.getElementById('edge-delete-btn');

  cy = cytoscape({
    container: document.getElementById('cy'),
    style: buildStylesheet(getDirected(), getWeighted()),
    elements: [],
    layout: { name: 'preset' },
    userZoomingEnabled: true,
    userPanningEnabled: true,
    minZoom: 0.1,
    maxZoom: 5,
  });

  cy.on('tapstart', () => { didDrag = false; });
  cy.on('drag', 'node', () => { didDrag = true; });

  cy.on('tap', evt => {
    if (getMode() !== 'manual') return;
    if (didDrag) return;
    if (evt.target !== cy) return;
    hideEdgeMenu();

    if (pendingSource !== null) {
      clearPendingSource();
      return;
    }

    const id = nextNodeId();
    const node = cy.add({
      group: 'nodes',
      data: { id, label: id },
      position: { x: evt.position.x, y: evt.position.y },
    });
    node.style({ opacity: 0, width: 4, height: 4 });
    node.animate(
      { style: { opacity: 1, width: 36, height: 36 } },
      { duration: 250, easing: 'ease-out-cubic' }
    );
  });

  cy.on('tap', 'node', evt => {
    if (getMode() !== 'manual') return;
    if (didDrag) return;
    hideEdgeMenu();

    const node = evt.target;
    const nodeId = node.id();

    if (pendingSource === null) {
      pendingSource = nodeId;
      node.addClass('pending-source');
      onPendingSourceChange(nodeId);
    } else if (pendingSource === nodeId) {
      clearPendingSource();
    } else {
      edgeCounter++;
      const edgeId = `e${edgeCounter}`;
      let weight = 1;

      if (getWeighted()) {
        const raw = window.prompt('Edge weight:', '1');
        if (raw !== null) {
          const parsed = parseFloat(raw);
          weight = isNaN(parsed) ? 1 : parsed;
        }
      }

      const edge = cy.add({
        group: 'edges',
        data: { id: edgeId, source: pendingSource, target: nodeId, weight },
      });
      edge.style({ opacity: 0 });
      edge.animate({ style: { opacity: 1 } }, { duration: 200 });
      clearPendingSource();
    }
  });

  cy.on('cxttap', 'node', evt => {
    evt.originalEvent.preventDefault();
    hideEdgeMenu();
    const node = evt.target;
    if (pendingSource === node.id()) clearPendingSource();
    node.connectedEdges().animate({ style: { opacity: 0 } }, { duration: 200 });
    node.animate(
      { style: { opacity: 0, width: 4, height: 4 } },
      { duration: 200, easing: 'ease-in-cubic', complete: () => node.remove() }
    );
  });

  cy.on('cxttap', 'edge', evt => {
    evt.originalEvent.preventDefault();
    showEdgeMenu(evt.originalEvent.clientX, evt.originalEvent.clientY, evt.target);
  });

  document.addEventListener('click', hideEdgeMenu);

  edgeFlipBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (selectedEdge) flipEdge(selectedEdge);
    hideEdgeMenu();
  });

  edgeDeleteBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (!selectedEdge) return;
    const edge = selectedEdge;
    hideEdgeMenu();
    edge.animate(
      { style: { opacity: 0 } },
      { duration: 200, complete: () => edge.remove() }
    );
  });
}

export function updateStyle() {
  cy.style(buildStylesheet(getDirected(), getWeighted()));
  if (!edgeMenu.hidden) {
    edgeFlipBtn.hidden = !getDirected();
  }
}

export function loadGraph(nodes, edges) {
  clearPendingSource();
  hideEdgeMenu();
  cy.elements().remove();

  cy.add(nodes.map(n => ({
    group: 'nodes',
    data: { id: n.id, label: n.label },
  })));

  cy.add(edges.map(e => ({
    group: 'edges',
    data: { id: e.id, source: e.source, target: e.target, weight: e.weight },
  })));

  edgeCounter = edges.length;

  cy.layout({ name: 'cose', animate: false, randomize: true }).run();
}

export function clearGraph() {
  clearPendingSource();
  hideEdgeMenu();
  cy.elements().remove();
  edgeCounter = 0;
}
