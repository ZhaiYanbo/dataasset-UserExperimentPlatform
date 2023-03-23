import { Node, Edge } from '../interface';
import Graph from '..';

const pinElement = (
  d: Node | Edge,
  contextMenuType: string,
  params: any,
  graph: Graph
) => {
  if (contextMenuType === 'nodeContextMenu') {
    // 当前操作节点已经钉住了，则解锁，即此过程为相反的
    d.isPinStatus = !d.isPinStatus;
    graph.pinRememberNode(d, d.isPinStatus);
    // 取消相连节点的钉住记忆标识
    d.edges.forEach((link: Edge) => {
      if (
        link.sourceNode.guid === d.guid &&
        graph.allCurLinkByIdMap.has(link.guid)
      ) {
        graph.pinRememberNode(
          graph.allNodeByIdMap.get(link.targetNode.guid),
          d.isPinStatus
        );
      }
      if (
        link.targetNode.guid === d.guid &&
        graph.allCurLinkByIdMap.has(link.guid)
      ) {
        graph.pinRememberNode(
          graph.allNodeByIdMap.get(link.sourceNode.guid),
          d.isPinStatus
        );
      }
      // 特殊处理——取消二跳数据流关系的钉住记忆标识
      if (
        link.sourceNode.typeName === 'dlf.sub_node' ||
        link.sourceNode.typeName === 'dlf.dli_sql'
      ) {
        for (const edge of link.sourceNode.edges) {
          if (edge.sourceNode.guid === link.sourceNode.guid) {
            graph.pinRememberNode(
              graph.allNodeByIdMap.get(edge.targetNode.guid),
              d.isPinStatus
            );
          }
          if (edge.targetNode.guid === link.sourceNode.guid) {
            graph.pinRememberNode(
              graph.allNodeByIdMap.get(edge.sourceNode.guid),
              d.isPinStatus
            );
          }
        }
      }
      if (
        link.targetNode.typeName === 'dlf.sub_node' ||
        link.targetNode.typeName === 'dlf.dli_sql'
      ) {
        for (const edge of link.targetNode.edges) {
          if (edge.sourceNode.guid === link.targetNode.guid) {
            graph.pinRememberNode(
              graph.allNodeByIdMap.get(edge.targetNode.guid),
              d.isPinStatus
            );
          }
          if (edge.targetNode.guid === link.targetNode.guid) {
            graph.pinRememberNode(
              graph.allNodeByIdMap.get(edge.sourceNode.guid),
              d.isPinStatus
            );
          }
        }
      }
    });
  } else {
    return;
  }
};

export { pinElement };
