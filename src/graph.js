import { buildStylesheet } from './cytoscapeStyle.js';

let cy;
let edgeCounter = 0;
let pendingSource = null;
let didDrag = false;
let getDirected;
let getWeighted;
let getMode;
let onPendingSourceChange;

const NODE_SIZE = 46;

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

function flipEdge(edge) {
  const { source, target } = edge.data();
  // Flash yellow, then move endpoints
  edge.animate(
    { style: { 'line-color': '#f9e2af', 'target-arrow-color': '#f9e2af', width: 4 } },
    { duration: 120, complete: () => {
      edge.move({ source: target, target: source });
      edge.animate(
        { style: { 'line-color': '#64748b', 'target-arrow-color': '#64748b', width: 2 } },
        { duration: 200 }
      );
    }}
  );
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

  cy = cytoscape({
    container: document.getElementById('cy'),
    style: buildStylesheet(getDirected(), getWeighted()),
    elements: [],
    layout: { name: 'preset' },
    userZoomingEnabled: true,
    userPanningEnabled: true,
    autounselectify: true,
    minZoom: 0.1,
    maxZoom: 5,
  });

  // Middle mouse button pan
  const cyContainer = document.getElementById('cy');
  let midPanning = false, midPanStart = null, midPanOrigin = null;

  cyContainer.addEventListener('pointerdown', e => {
    if (e.button !== 1) return;
    e.preventDefault();
    midPanning   = true;
    midPanStart  = { x: e.clientX, y: e.clientY };
    midPanOrigin = cy.pan();
    cyContainer.setPointerCapture(e.pointerId);
    cyContainer.style.cursor = 'grabbing';
  });

  cyContainer.addEventListener('pointermove', e => {
    if (!midPanning) return;
    cy.pan({
      x: midPanOrigin.x + (e.clientX - midPanStart.x),
      y: midPanOrigin.y + (e.clientY - midPanStart.y),
    });
  });

  cyContainer.addEventListener('pointerup', e => {
    if (!midPanning || e.button !== 1) return;
    midPanning = false;
    cyContainer.style.cursor = '';
  });

  cyContainer.addEventListener('pointercancel', () => {
    if (!midPanning) return;
    midPanning = false;
    cyContainer.style.cursor = '';
  });

  // Sync dot grid with pan/zoom
  const canvasArea = document.querySelector('.canvas-area');
  const BASE_GRID = 28;
  cy.on('viewport', () => {
    const pan  = cy.pan();
    const zoom = cy.zoom();
    const size = BASE_GRID * zoom;
    canvasArea.style.backgroundSize     = `${size}px ${size}px`;
    canvasArea.style.backgroundPosition = `${((pan.x % size) + size) % size}px ${((pan.y % size) + size) % size}px`;
  });

  cy.on('tapstart', () => { didDrag = false; });
  cy.on('drag', 'node', () => { didDrag = true; });

  // Background tap: add node or cancel pending edge
  cy.on('tap', evt => {
    if (getMode() !== 'manual') return;
    if (didDrag) return;
    if (evt.target !== cy) return;

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
      { style: { opacity: 1, width: NODE_SIZE, height: NODE_SIZE } },
      { duration: 280, easing: 'ease-out-cubic' }
    );
  });

  // Node tap: start or complete an edge
  cy.on('tap', 'node', evt => {
    if (getMode() !== 'manual') return;
    if (didDrag) return;

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
      edge.style({ opacity: 0, width: 0 });
      edge.animate({ style: { opacity: 1, width: 2 } }, { duration: 300, easing: 'ease-out-cubic' });
      clearPendingSource();
    }
  });

  // Double-tap edge: flip direction (directed mode only)
  cy.on('dbltap', 'edge', evt => {
    if (getDirected()) flipEdge(evt.target);
  });

  // Right-click node: delete with shrink animation
  cy.on('cxttap', 'node', evt => {
    evt.originalEvent.preventDefault();
    const node = evt.target;
    if (pendingSource === node.id()) clearPendingSource();
    node.connectedEdges().animate({ style: { opacity: 0, width: 0 } }, { duration: 200 });
    node.animate(
      { style: { opacity: 0, width: 4, height: 4 } },
      { duration: 220, easing: 'ease-in-cubic', complete: () => node.remove() }
    );
  });

  // Right-click edge: delete
  cy.on('cxttap', 'edge', evt => {
    evt.originalEvent.preventDefault();
    const edge = evt.target;
    edge.animate(
      { style: { opacity: 0, width: 0 } },
      { duration: 200, complete: () => edge.remove() }
    );
  });

  // Hover glow
  cy.on('mouseover', 'node', evt => {
    if (!evt.target.hasClass('pending-source')) evt.target.addClass('hovering');
  });
  cy.on('mouseout',  'node', evt => evt.target.removeClass('hovering'));
  cy.on('mouseover', 'edge', evt => evt.target.addClass('hovering'));
  cy.on('mouseout',  'edge', evt => evt.target.removeClass('hovering'));
}

export function updateStyle() {
  cy.style(buildStylesheet(getDirected(), getWeighted()));
}

export function loadGraph(nodes, edges) {
  clearPendingSource();
  cy.elements().remove();

  cy.add(nodes.map(n => ({ group: 'nodes', data: { id: n.id, label: n.label } })));
  cy.add(edges.map(e => ({ group: 'edges', data: { id: e.id, source: e.source, target: e.target, weight: e.weight } })));

  edgeCounter = edges.length;

  const layout = cy.layout({ name: 'cose', animate: false, randomize: true });

  layout.on('layoutstop', () => {
    const nodeList = cy.nodes().toArray();
    nodeList.forEach((node, i) => {
      node.style({ opacity: 0, width: 4, height: 4 });
      setTimeout(() => {
        node.animate(
          { style: { opacity: 1, width: NODE_SIZE, height: NODE_SIZE } },
          { duration: 280, easing: 'ease-out-cubic' }
        );
      }, i * 45);
    });
    const edgeList = cy.edges().toArray();
    const delay = nodeList.length * 45;
    edgeList.forEach((edge, i) => {
      edge.style({ opacity: 0, width: 0 });
      setTimeout(() => {
        edge.animate({ style: { opacity: 1, width: 2 } }, { duration: 250 });
      }, delay + i * 30);
    });
  });

  layout.run();
}

export function clearGraph() {
  clearPendingSource();
  const all = cy.elements();
  edgeCounter = 0;
  if (all.length === 0) return;
  all.animate({ style: { opacity: 0 } }, { duration: 280 });
  setTimeout(() => cy.elements().remove(), 300);
}
