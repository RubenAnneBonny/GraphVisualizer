export function buildStylesheet(directed, weighted) {
  return [
    {
      selector: 'core',
      style: {
        'background-opacity': 0,
      },
    },
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
        'shadow-blur': 10,
        'shadow-color': '#4a9eff',
        'shadow-opacity': 0.35,
        'shadow-offset-x': 0,
        'shadow-offset-y': 0,
      },
    },
    {
      selector: 'node.hovering',
      style: {
        'background-color': '#72b9ff',
        'border-color': '#4a9eff',
        'border-width': 3,
        'shadow-blur': 22,
        'shadow-opacity': 0.7,
      },
    },
    {
      selector: 'node:selected',
      style: {
        'background-color': '#ff9f43',
        'border-color': '#e08020',
        'border-width': 3,
        'shadow-blur': 18,
        'shadow-color': '#ff9f43',
        'shadow-opacity': 0.6,
      },
    },
    {
      selector: 'node.pending-source',
      style: {
        'background-color': '#ee5a24',
        'border-color': '#c0392b',
        'border-width': 3,
        'shadow-blur': 22,
        'shadow-color': '#ee5a24',
        'shadow-opacity': 0.8,
        'shadow-offset-x': 0,
        'shadow-offset-y': 0,
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#5a6070',
        'curve-style': 'bezier',
        'target-arrow-color': '#5a6070',
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
      selector: 'edge.hovering',
      style: {
        'line-color': '#89b4fa',
        'target-arrow-color': '#89b4fa',
        'width': 3,
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
