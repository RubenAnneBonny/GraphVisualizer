import { buildStylesheet } from './cytoscapeStyle.js';

let cy;
let nodeCounter = 0;
let edgeCounter = 0;
let pendingSource = null;
let didDrag = false;
let getDirected;
let getWeighted;
let getMode;
let onPendingSourceChange;

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
    minZoom: 0.1,
    maxZoom: 5,
  });

  cy.on('tapstart', () => { didDrag = false; });
  cy.on('drag', 'node', () => { didDrag = true; });

  cy.on('tap', evt => {
    if (getMode() !== 'manual') return;
    if (didDrag) return;
    if (evt.target !== cy) return;

    if (pendingSource !== null) {
      clearPendingSource();
      return;
    }

    nodeCounter++;
    const id = String(nodeCounter);
    cy.add({
      group: 'nodes',
      data: { id, label: id },
      position: { x: evt.position.x, y: evt.position.y },
    });
  });

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

      cy.add({
        group: 'edges',
        data: { id: edgeId, source: pendingSource, target: nodeId, weight },
      });
      clearPendingSource();
    }
  });

  cy.on('cxttap', 'node', evt => {
    if (pendingSource === evt.target.id()) clearPendingSource();
    evt.target.remove();
  });

  cy.on('cxttap', 'edge', evt => {
    evt.target.remove();
  });
}

function clearPendingSource() {
  if (pendingSource !== null) {
    cy.getElementById(pendingSource).removeClass('pending-source');
  }
  pendingSource = null;
  onPendingSourceChange(null);
}

export function updateStyle() {
  cy.style(buildStylesheet(getDirected(), getWeighted()));
}

export function loadGraph(nodes, edges) {
  clearPendingSource();
  cy.elements().remove();

  cy.add(nodes.map(n => ({
    group: 'nodes',
    data: { id: n.id, label: n.label },
  })));

  cy.add(edges.map(e => ({
    group: 'edges',
    data: { id: e.id, source: e.source, target: e.target, weight: e.weight },
  })));

  nodeCounter = nodes.length;
  edgeCounter = edges.length;

  cy.layout({ name: 'cose', animate: false, randomize: true }).run();
}

export function clearGraph() {
  clearPendingSource();
  cy.elements().remove();
  nodeCounter = 0;
  edgeCounter = 0;
}
