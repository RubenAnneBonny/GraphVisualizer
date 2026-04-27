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
  edgeFlipBtn.hidden = false;
  edgeMenu.hidden = false;
  const menuW = 160, menuH = 72;
  edgeMenu.style.left = `${Math.min(x, window.innerWidth  - menuW - 8)}px`;
  edgeMenu.style.top  = `${Math.min(y, window.innerHeight - menuH - 8)}px`;
}

function hideEdgeMenu() {
  edgeMenu.hidden = true;
  selectedEdge = null;
}

function isMenuOpen() {
  return !edgeMenu.hidden;
}

function flipEdge(edge) {
  const { id, source, target, weight } = edge.data();
  edge.animate(
    { style: { opacity: 0, width: 0 } },
    { duration: 150, complete: () => {
      edge.remove();
      const newEdge = cy.add({
        group: 'edges',
        data: { id, source: target, target: source, weight },
      });
      newEdge.style({ opacity: 0, width: 0 });
      newEdge.animate({ style: { opacity: 1, width: 2 } }, { duration: 250, easing: 'ease-out-cubic' });
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

  // Background tap: close menu (consuming the click) OR add node
  cy.on('tap', evt => {
    if (getMode() !== 'manual') return;
    if (didDrag) return;
    if (evt.target !== cy) return;

    if (isMenuOpen()) {
      hideEdgeMenu();
      return;
    }

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
      { duration: 280, easing: 'ease-out-cubic' }
    );
  });

  // Node tap: close menu (consuming the click) OR start/complete edge
  cy.on('tap', 'node', evt => {
    if (getMode() !== 'manual') return;
    if (didDrag) return;

    if (isMenuOpen()) {
      hideEdgeMenu();
      return;
    }

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

  // Node right-click: delete with animation
  cy.on('cxttap', 'node', evt => {
    evt.originalEvent.preventDefault();
    hideEdgeMenu();
    const node = evt.target;
    if (pendingSource === node.id()) clearPendingSource();
    node.connectedEdges().animate({ style: { opacity: 0, width: 0 } }, { duration: 200 });
    node.animate(
      { style: { opacity: 0, width: 4, height: 4 } },
      { duration: 220, easing: 'ease-in-cubic', complete: () => node.remove() }
    );
  });

  // Edge right-click: immediate delete if undirected, menu if directed
  cy.on('cxttap', 'edge', evt => {
    evt.originalEvent.preventDefault();
    if (getDirected()) {
      showEdgeMenu(evt.originalEvent.clientX, evt.originalEvent.clientY, evt.target);
    } else {
      const edge = evt.target;
      edge.animate(
        { style: { opacity: 0, width: 0 } },
        { duration: 200, complete: () => edge.remove() }
      );
    }
  });

  // Hover glow
  cy.on('mouseover', 'node', evt => {
    if (!evt.target.hasClass('pending-source')) evt.target.addClass('hovering');
  });
  cy.on('mouseout', 'node', evt => evt.target.removeClass('hovering'));
  cy.on('mouseover', 'edge', evt => evt.target.addClass('hovering'));
  cy.on('mouseout', 'edge', evt => evt.target.removeClass('hovering'));

  // Context menu buttons
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
      { style: { opacity: 0, width: 0 } },
      { duration: 200, complete: () => edge.remove() }
    );
  });

  // Clicking sidebar while menu open should close menu without side effects
  document.addEventListener('click', e => {
    if (!edgeMenu.contains(e.target)) hideEdgeMenu();
  });
}

export function updateStyle() {
  cy.style(buildStylesheet(getDirected(), getWeighted()));
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

  const layout = cy.layout({ name: 'cose', animate: false, randomize: true });

  layout.on('layoutstop', () => {
    const nodeList = cy.nodes().toArray();
    nodeList.forEach((node, i) => {
      node.style({ opacity: 0, width: 4, height: 4 });
      setTimeout(() => {
        node.animate(
          { style: { opacity: 1, width: 36, height: 36 } },
          { duration: 280, easing: 'ease-out-cubic' }
        );
      }, i * 45);
    });

    const edgeList = cy.edges().toArray();
    const nodeDelay = nodeList.length * 45;
    edgeList.forEach((edge, i) => {
      edge.style({ opacity: 0, width: 0 });
      setTimeout(() => {
        edge.animate({ style: { opacity: 1, width: 2 } }, { duration: 250 });
      }, nodeDelay + i * 30);
    });
  });

  layout.run();
}

export function clearGraph() {
  clearPendingSource();
  hideEdgeMenu();
  const all = cy.elements();
  edgeCounter = 0;
  if (all.length === 0) return;
  all.animate({ style: { opacity: 0 } }, { duration: 280 });
  setTimeout(() => cy.elements().remove(), 300);
}
