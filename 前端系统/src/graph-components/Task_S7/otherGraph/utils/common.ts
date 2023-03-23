import * as d3 from 'd3';
import { Node, Edge } from '../interface';

const setNeighbors = (edge: Edge, nodes: Node[]) => {
  const a = nodes.find((k: Node) => k.guid === edge.sourceId);
  const b = nodes.find((k: Node) => k.guid === edge.targetId);
  if (!a || !b) {
    return false;
  }
  !a.neighbors && (a.neighbors = []);
  !b.neighbors && (b.neighbors = []);
  a.neighbors.push(b);
  b.neighbors.push(a);
  !a.edges && (a.edges = []);
  !b.edges && (b.edges = []);
  a.edges.push(edge);
  b.edges.push(edge);
  return true;
};

const clearNeiAndEdges = (nodes: Node[]) => {
  for (const n of nodes) {
    n.edges = [];
    n.neighbors = [];
  }
};

const getAnotherNode = (e: Edge, n: Node) => {
  if (e.sourceId === n.guid) {
    return e.targetNode;
  }
  if (e.targetId === n.guid) {
    return e.sourceNode;
  }
  return null;
};

const isRememberEdge = (edge: Edge) =>
  (edge.sourceNode?.isRemember || edge.sourceNode?.isPinStatus) &&
  (edge.targetNode?.isRemember || edge.targetNode?.isPinStatus);

// 静态布局下节点变化
const moveNode = (node: Node) => {
  d3.select(`#node-${node.guid}`).attr(
    'transform',
    `translate(${node.x},${node.y})`
  );
  node.edges.forEach((d: Edge) => {
    d3.select(`#edge-${d.guid}`)
      .select('path')
      .attr(
        'd',
        (d: Edge) =>
          `M ${d.sourceNode.x} ${d.sourceNode.y} L ${d.targetNode.x} ${d.targetNode.y}`
      );
  });
};

/**
 * 绑定连边两端节点的关联关系
 * @param {Object} nodeA [连边起始节点]
 * @param {Object} nodeB [连边目标节点]
 * @param {Object} link [连边]
 * @param {string} curExpandRelationshipType [绑定的关系类型]
 */
const linkTwoNodes = (link: Edge, curExpandRelationshipType: string) => {
  const nodeA = link.sourceNode as Node;
  const nodeB = link.targetNode as Node;
  if (
    nodeA.isExpandChildNodeMap[curExpandRelationshipType] &&
    !nodeA.isExpandChildNodeMap[curExpandRelationshipType][nodeB.guid]
  ) {
    nodeA.expandChildrenNode[curExpandRelationshipType].push(nodeB);
    nodeA.isExpandChildNodeMap[curExpandRelationshipType][nodeB.guid] = nodeB;
    nodeA.expandChildrenLink[curExpandRelationshipType].push(link);
    nodeA.isExpandChildLinkMap[curExpandRelationshipType][link.guid] = link;
  }
  if (
    nodeB.isExpandChildNodeMap[curExpandRelationshipType] &&
    !nodeB.isExpandChildNodeMap[curExpandRelationshipType][nodeA.guid]
  ) {
    nodeB.expandChildrenNode[curExpandRelationshipType].push(nodeA);
    nodeB.isExpandChildNodeMap[curExpandRelationshipType][nodeA.guid] = nodeA;
    nodeB.expandChildrenLink[curExpandRelationshipType].push(link);
    nodeB.isExpandChildLinkMap[curExpandRelationshipType][link.guid] = link;
  }
};

/**
 * 对视图自动放缩聚焦
 * @param renderSVG 图谱SVG元素
 * @param zoomObject 放缩对象
 * @param sizeParams 图谱大小尺寸
 * @param duration 过渡时间
 * @return 放缩结果对象
 */
const autoZoom = (
  renderSVG: any,
  zoomObject: any,
  sizeParams: any,
  duration = 1000
) => {
  // 获取 svg 图谱元素的空间范围
  const svgBox = renderSVG.node().getBBox();

  // 计算放缩系数
  const scale = Math.min(
    (sizeParams.svgHeight - 2 * sizeParams.margin.top) / svgBox.height,
    (sizeParams.svgWidth - 2 * sizeParams.margin.left) / svgBox.width,
    1.0
  );

  // 计算居中的位置偏量
  const xScale =
    sizeParams.svgWidth / 2 - (svgBox.x + svgBox.width / 2) * scale;
  const yScale =
    sizeParams.svgHeight / 2 - (svgBox.y + svgBox.height / 2) * scale;

  // 对绑定了放缩事件的元素进行放缩操作（即 renderSVG 的父元素）
  const t = d3.zoomIdentity.translate(xScale, yScale).scale(scale);
  d3.select(renderSVG.node().parentNode)
    .transition()
    .duration(duration)
    .call(zoomObject.transform, t);

  const translateResult = {
    xScale,
    yScale,
    scale,
  };
  return translateResult;
};

export {
  setNeighbors,
  clearNeiAndEdges,
  getAnotherNode,
  isRememberEdge,
  moveNode,
  linkTwoNodes,
  autoZoom,
};
