import parseAst from 'dotparser';

function parseGraph(ast) {
  const graph = {};
  const labels = [];
  const nodes = [];
  const nodeSet = new Map();
  const edges = [];

  const addNode = (node, attrs = {}) => {
    if (nodeSet.has(node)) {
      return nodeSet.get(node);
    }
    const index = labels.length;
    nodeSet.set(node, index);
    labels.push(attrs.label || node);
    nodes.push(
      Object.assign(
        {
          id: node,
        },
        attrs
      )
    );
    return index;
  };

  const copyAttr = (attr_list, target, name, parser = String) => {
    const attr = attr_list.find((d) => d.id === name);
    if (attr) {
      target[name] = parser(attr.eq);
    }
  };

  ast.children
    .filter((child) => child.type === 'attr_stmt' && child.target === 'graph')
    .forEach((attr) => {
      copyAttr(attr.attr_list, graph, 'label');
    });

  const shapes = {
    diamond: 'rectRot',
    box: 'rect',
    circle: 'circle',
  };
  ast.children
    .filter((child) => child.type === 'node_stmt')
    .forEach((node) => {
      const r = {};
      copyAttr(node.attr_list, r, 'label');
      copyAttr(node.attr_list, r, 'color');
      copyAttr(node.attr_list, r, 'fillcolor');
      copyAttr(node.attr_list, r, 'shape', (v) => shapes[v] || 'circle');
      addNode(node.node_id.id, r);
    });
  ast.children
    .filter((child) => child.type === 'edge_stmt')
    .forEach((edge) => {
      const r = {};
      copyAttr(edge.attr_list, r, 'label');
      copyAttr(edge.attr_list, r, 'color');
      copyAttr(edge.attr_list, r, 'style');
      copyAttr(edge.attr_list, r, 'weight', Number.parseFloat);
      copyAttr(edge.attr_list, r, 'penwidth', Number.parseFloat);

      let source = null;
      edge.edge_list.forEach((edge, i) => {
        const target = addNode(edge.id);
        if (i > 0) {
          edges.push(
            Object.assign({}, r, {
              source,
              target,
            })
          );
        }
        source = target;
      });
    });

  const style = {};
  const createNodeStyle = (attr, target = attr) => {
    if (nodes.some((n) => n[attr] != null)) {
      style[target] = (ctx) => {
        if (ctx.dataIndex >= 0) {
          const item = ctx.dataset.data[ctx.dataIndex];
          return item ? item[attr] : undefined;
        }
      };
    }
  };
  const createEdgeStyle = (attr, target = attr) => {
    if (edges.some((n) => n[attr] != null)) {
      style[target] = (ctx) => {
        if (ctx.dataIndex >= 0) {
          const item = ctx.dataset.edges[ctx.dataIndex];
          return item ? item[attr] : undefined;
        }
      };
    }
  };
  createNodeStyle('fillcolor', 'pointBackgroundColor');
  createNodeStyle('color', 'pointBorderColor');
  createNodeStyle('shape', 'pointStyle');
  createEdgeStyle('color', 'lineBorderColor');
  createEdgeStyle('penwidth', 'lineBorderWidth');

  return {
    labels,
    datasets: [
      Object.assign(
        {
          label: 'Graph',
          data: nodes,
          edges,
        },
        style,
        graph
      ),
    ],
  };
}

export function parse(dot) {
  const ast = parseAst(dot)[0];
  console.log(ast);
  if (ast && (ast.type === 'graph' || ast.type === 'digraph')) {
    const r = parseGraph(ast);
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
