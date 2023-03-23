import { Node, Edge } from '../interface';
import Graph from '..';
import {
  getGraphBasedSelectedNodes,
  getRecommendNeighbors,
} from '@/utils/axios';

/**
 * 根据交互的节点和当前图谱数据获取推荐扩展的节点列表
 * @param d
 * @param contextMenuType
 * @param params
 * @param graph
 */
const getRecommendExpandNodes = (
  d: Node | Edge,
  contextMenuType: string,
  params: any,
  graph: Graph
) => {
  if (contextMenuType === 'nodeContextMenu') {
    const initNodeGuid = d.guid;
    const bussinessDomain = d.bussinessDomain as string;
    const curGraph = {
      nodes: [...graph.allCurNodeByIdMap.values()].map(
        (item: any) => item.guid
      ),
      edges: [...graph.allCurLinkByIdMap.values()].map(
        (item: any) => item.guid
      ),
    };
    getRecommendNeighbors(initNodeGuid, curGraph, bussinessDomain)
      .then((res) => {
        graph.recommendNodeList = res.data.content.recommendNodes;
        graph.afterChangeRecommendNodeListCallback &&
          graph.afterChangeRecommendNodeListCallback(graph.recommendNodeList);
      })
      .catch((err) => console.log(err));
  } else {
    console.log('从连边出发...', params);
  }
};

/**
 * 根据用户所选择的节点列表，获取相关增量的点边图谱，并进行渲染
 * @param d
 * @param graph
 */
const getGraphBasedSelectedRecommendNodes = (d: Node | Edge, graph: Graph) => {
  getGraphBasedSelectedNodes(
    d.guid,
    graph.selectedNodesGuidArray,
    graph.selectedEdgesGuidArray
  )
    .then((res) => {
      if (graph.layout === 'Force') {
        graph.layoutInstance.isExpandRecommendStatus = false;
        graph.layoutInstance.initAutoZoom = true;
        graph.layoutInstance.subSimulationStatus = true;
      }

      const graphData = res.data.content;

      // 更新扩展操作的节点标识
      graph.nodes.forEach((node) => {
        node.isKey = node.guid === d.guid;
      });

      if (graph.layout === 'Force') {
        graph.layoutInstance.simulation.force('center', null);
      }

      //----- 下面是扩展事件的前序操作（主要是过滤非路径记忆节点）
      // 获取操作的节点到原始节点的最短路径，用于路径记忆并防止断链
      const shortestPath = graph.findShortestPath(d.guid);
      if (shortestPath) {
        shortestPath.nodes.forEach((t: string) => {
          graph.rememberNode(t);
        });
      }

      // 扩展即记忆
      graph.rememberNode(d);

      // 暂时固定扩展的节点
      graph.rootNode.fx = graph.rootNode.x;
      graph.rootNode.fy = graph.rootNode.y;

      // 获取操作的节点数据和增量相关的图数据
      graph.rootNode = d;
      graph.keyNode = d;

      // 过滤获取图谱上不存在的新节点
      const newNodes = graphData.nodes.filter((node) => {
        if (graph.allNodeByIdMap.has(node.guid)) {
          // 如果节点已经被保存在全局属性allNodeByIdMap中，则过滤
          // 但如果此时该节点不显示在图谱中（即被隐藏），应当可视化出来
          if (!graph.allCurNodeByIdMap.has(node.guid)) {
            // 设置节点的坐标为选择的扩展节点位置 (如果要设置从父节点发散的话，这里会有延时效果)
            graph.allNodeByIdMap.get(node.guid).x = graph.rootNode.x;
            graph.allNodeByIdMap.get(node.guid).y = graph.rootNode.y;
            // 将该节点添加进图谱数据
            graph.nodes.push(graph.allNodeByIdMap.get(node.guid));
          }
          return false;
        } else {
          return true;
        }
      });
      // 过滤获取图谱上不存在的新连边（同上）
      const newLinks = graphData.edges.filter((edge: Edge) => {
        if (graph.allLinkByIdMap.has(edge.guid)) {
          // 如果连边已经被保存在全局属性allNodeByIdMap中，则过滤
          // 但如果此时该节点不显示在图谱中（即被隐藏），应当可视化出来
          if (!graph.allCurLinkByIdMap.has(edge.guid)) {
            graph.edges.push(graph.allLinkByIdMap.get(edge.guid));
          }
          return false;
        } else {
          return true;
        }
      });

      // 如果当前扩展操作的节点与上一次操作的节点不同，则过滤掉非路径记忆节点
      // 否则可以不用过滤掉非路径记忆节点，直接在操作节点的基础上扩展其他内容
      if (graph.lastExpandNode.guid !== d.guid) {
        // graph.filterNoRemember();
      }
      graph.lastExpandNode = d;

      // 生成指定数据结构类型的点边数据
      const newChildrenNodes = graph.setNodesProps(newNodes);
      const newChildrenLinks = graph.setEdgesProps(newLinks);

      // 开启过渡效果并进行画布渲染
      graph.isTransitionStatus = true;
      graph.updateSVG();
    })
    .catch((err) => console.log(err));
};

export { getRecommendExpandNodes, getGraphBasedSelectedRecommendNodes };
