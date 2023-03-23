import { Edge, Node } from '../interface';

const getDegree = (nodes: Node[], edges: Edge[]) => {
  const nodeMap: any = {};
  const nodeIdxMap: any = {};
  nodes.forEach((node: Node, i: number) => {
    nodeMap[node.guid] = node;
    nodeIdxMap[node.guid] = i;
  });

  const degrees: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    degrees[i] = 0;
  }

  edges.forEach((e: Edge) => {
    if (e.sourceNode) {
      degrees[nodeIdxMap[e.sourceNode.guid]] += 1;
    }
    if (e.targetNode) {
      degrees[nodeIdxMap[e.targetNode.guid]] += 1;
    }
  });

  return degrees;
};

export { getDegree };
