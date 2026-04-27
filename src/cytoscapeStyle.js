export function buildStylesheet(directed, weighted) {
  return [
    {
      selector: 'node',
      style: {
        'background-color': '#4a9eff',
        'border-color': '#2a7edf',
        'border-width': 2,
        'label': 'data(label)',
        'color': '#ffffff',
        'font-size': '13px',
        'font-family': '"JetBrains Mono", "Fira Code", monospace',
        'text-valign': 'center',
        'text-halign': 'center',
        'width': 36,
        'height': 36,
        'overlay-padding': '6px',
      },
    },
    {
      selector: 'node:selected',
      style: {
        'background-color': '#ff9f43',
        'border-color': '#e08020',
        'border-width': 3,
      },
    },
    {
      selector: 'node.pending-source',
      style: {
        'background-color': '#ee5a24',
        'border-color': '#c0392b',
        'border-width': 3,
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#6c757d',
        'curve-style': 'bezier',
        'target-arrow-color': '#6c757d',
        'target-arrow-shape': directed ? 'triangle' : 'none',
        'source-arrow-shape': 'none',
        'arrow-scale': 1.2,
        'label': weighted ? 'data(weight)' : '',
        'font-size': '12px',
        'font-family': '"JetBrains Mono", "Fira Code", monospace',
        'color': '#cdd6f4',
        'text-rotation': 'autorotate',
        'text-margin-y': -10,
        'text-background-color': '#1e1e2e',
        'text-background-opacity': weighted ? 1 : 0,
        'text-background-shape': 'roundrectangle',
        'text-background-padding': '3px',
      },
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#ff9f43',
        'target-arrow-color': '#ff9f43',
        'width': 3,
      },
    },
  ];
}
