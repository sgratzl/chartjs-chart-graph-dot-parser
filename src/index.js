import parseAst from 'dotparser';

function parseGraph(ast, options) {
  const labels = [];
  const nodes = [];
  const nodeSet = new Map();

  const addNode = (node) => {
    if (nodeSet.has(node)) {
      return nodeSet.get(node);
    }
    const index = labels.length;
    nodeSet.set(node, index);
    labels.push(node);
    nodes.push({
      id: node,
    });
    return index;
  };

  const edges = ast.children
    .filter((child) => child.type === 'edge_stmt')
    .map((edge) => {
      const nodeA = addNode(edge.edge_list[0].id);
      const nodeB = addNode(edge.edge_list[1].id);
      const r = {
        source: nodeA,
        target: nodeB,
      };
      const label = edge.attr_list.find((d) => d.id === 'label');
      if (label) {
        r.label = label.eq;
      }
      const weight = edge.attr_list.find((d) => d.id === 'weight');
      if (weight) {
        r.weight = Number.parseFloat(weight.eq);
      }
      return r;
    });

  return {
    labels,
    datasets: [
      {
        label: options.name || 'Graph',
        data: nodes,
        edges,
      },
    ],
  };
}

export function parse(dot, options = {}) {
  const ast = parseAst(dot)[0];
  console.log(ast);
  if (ast && (ast.type === 'graph' || ast.type === 'digraph')) {
    const r = parseGraph(ast, options);
    console.log(r);
    return r;
  }
  return {
    labels: [],
    datasets: [
      {
        label: 'A',
        data: [],
        edges: [],
      },
    ],
  };
}
