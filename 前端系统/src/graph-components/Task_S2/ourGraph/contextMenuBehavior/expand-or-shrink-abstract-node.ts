import { Edge, Node } from '../interface';
import { renderEdges, renderNodes, renderAbstractNodeHull } from '../render';
import { getRandomPosition } from '../utils/common';

/**
 * 超点展开
 * @param abstractNode 原始超点
 * @param contextMenuType 右键菜单类型 （仅供右键菜单函数统一结构，实则没用）
 * @param params 附加属性，包括：graph 图谱对象，level 层次, subGraphID 所属子图编号, callback 回调函数（主要用于事件绑定）
 */
const expandAbstractNode = (
  abstractNode: Node,
  contextMenuType: string = 'nodeContextMenu',
  params: any = {}
): void => {
  // 获取相关量
  const { graph, level, subGraphID, callback } = params;

  graph.rootNode = abstractNode;
  const graphInstance = graph.GraphInstances[level][subGraphID];

  // 获取增量图谱
  const newNodes = abstractNode.properties.containNodes
    .map((t: string) => graph.originalNodesByIdMap.get(t))
    .filter((node: Node) => {
      if (!graph.allCurGraphNodesByIdMap.has(node.guid)) {
        // 新增数据结构属性
        node.neighborEdges = []; // 相关的邻居连边
        node.x = graph.rootNode.x + getRandomPosition();
        node.y = graph.rootNode.y + getRandomPosition();

        // 更新图谱可视节点信息
        graph.allCurGraphNodes.push(node);
        graph.allCurGraphNodesByIdMap.set(node.guid, node);
        return true;
      }
      return false;
    });
  const newEdges = abstractNode.properties.containEdges
    .map((t: string) => graph.originalEdgesByIdMap.get(t))
    .filter((edge: Edge) => {
      if (!graph.allCurGraphEdgesByIdMap.has(edge.guid)) {
        // 新增数据结构属性
        edge.sourceId = edge.source;
        edge.targetId = edge.target;

        // 更新图谱可视连边信息
        graph.allCurGraphEdges.push(edge);
        graph.allCurGraphEdgesByIdMap.set(edge.guid, edge);
        return true;
      }
      return false;
    });

  // 删除该扩展节点以及关联的连边
  graphInstance.subNodes = graphInstance.subNodes.filter(
    (node: Node) => node.guid !== graph.rootNode.guid
  );
  graph.allCurGraphNodes.splice(
    graph.allCurGraphNodes.findIndex(
      (d: Node) => d.guid === graph.rootNode.guid
    ),
    1
  );
  graph.allCurGraphNodesByIdMap.delete(graph.rootNode.guid);
  const abstractEdges = graph.rootNode.neighborEdges.map(
    (edge: Edge) => edge.guid
  );
  graphInstance.subEdges = graphInstance.subEdges.filter((edge: Edge) => {
    if (abstractEdges.indexOf(edge.guid) === -1) {
      return true;
    }
    graph.allCurGraphEdges.splice(
      graph.allCurGraphEdges.findIndex((d: Edge) => d.guid === edge.guid),
      1
    );
    graph.allCurGraphEdgesByIdMap.delete(edge.guid);
    return false;
  });

  // 新增扩展的点边
  graphInstance.subNodes.push(...newNodes);
  graphInstance.subEdges.push(...newEdges);

  // 渲染连边
  graphInstance.subLinksG = graphInstance.subLinksG.data(
    graphInstance.subEdges,
    (d: Edge) => d.guid
  );
  graphInstance.subLinksG.exit().remove(); // 将多余连边删除
  renderEdges(graphInstance, graph.cfg, false, true, 600);

  // 渲染节点
  graphInstance.subNodesG = graphInstance.subNodesG.data(
    graphInstance.subNodes,
    (d: Node) => d.guid
  );
  graphInstance.subNodesG.exit().remove();
  renderNodes(graphInstance, graph.cfg, false, true, 600);

  // 将扩展后的点边进行记录，以便于后续tick中动态更新凸包
  graph.rootNode.properties.forceNodes = newNodes;
  graph.rootNode.properties.forceEdges = newEdges;

  // 绘制超点凸包
  renderAbstractNodeHull(graphInstance, graph.rootNode, 600);

  // 更新 svg 点边元素组
  graphInstance.subNodesG = graphInstance.subContainer
    .select('g.nodesG')
    .selectAll('g.nodeG');
  graphInstance.subLinksG = graphInstance.subContainer
    .select('g.linksG')
    .selectAll('g.linkG');

  // 完成扩展后重启力仿真器调度
  graph.actualLayoutInstances[level][subGraphID].restart(0.3);
  graph.virtualLayoutInstance.restart(0.1);

  callback && callback();
};

/**
 * 超点展开后操作凸包执行收缩
 * @param abstractNode 原始超点
 * @param contextMenuType 右键菜单类型 （仅供右键菜单函数统一结构，实则没用）
 * @param params 附加属性，包括：graph 图谱对象，level 层次, subGraphID 所属子图编号, callback 回调函数（主要用于事件绑定）
 */
const shrinkAbstractNode = (
  abstractNode: Node,
  contextMenuType: string = 'nodeContextMenu',
  params: any = {}
): void => {
  // 获取相关量
  const { graph, level, subGraphID, callback } = params;

  const graphInstance = graph.GraphInstances[level][subGraphID];
  // 获取增量图谱
  const newNodes: any = [abstractNode];
  const newEdges: any = abstractNode.neighborEdges;

  // 删除原先的节点以及关联的连边
  graphInstance.subNodes = graphInstance.subNodes.filter((node: Node) => {
    if (abstractNode.properties.containNodes.indexOf(node.guid) === -1) {
      return true;
    }
    graph.allCurGraphNodes.splice(
      graph.allCurGraphNodes.findIndex((d: Node) => d.guid === node.guid),
      1
    );
    graph.allCurGraphNodesByIdMap.delete(node.guid);
    return false;
  });
  graphInstance.subEdges = graphInstance.subEdges.filter((edge: Edge) => {
    if (abstractNode.properties.containEdges.indexOf(edge.guid) === -1) {
      return true;
    }
    graph.allCurGraphEdges.splice(
      graph.allCurGraphEdges.findIndex((d: Edge) => d.guid === edge.guid),
      1
    );
    graph.allCurGraphEdgesByIdMap.delete(edge.guid);
    return false;
  });

  // 新增扩展的点边
  graphInstance.subNodes.push(...newNodes);
  graphInstance.subEdges.push(...newEdges);

  // 渲染连边
  graphInstance.subLinksG = graphInstance.subLinksG.data(
    graphInstance.subEdges,
    (d: Edge) => d.guid
  );
  graphInstance.subLinksG.exit().remove(); // 将多余连边删除
  renderEdges(graphInstance, graph.cfg, false, true, 300);

  // 渲染节点
  graphInstance.subNodesG = graphInstance.subNodesG.data(
    graphInstance.subNodes,
    (d: Node) => d.guid
  );
  graphInstance.subNodesG.exit().remove();
  renderNodes(graphInstance, graph.cfg, false, true, 300);

  // 释放超点所含子点边数据
  abstractNode.properties.forceNodes = [];
  abstractNode.properties.forceEdges = [];

  // 清除凸包元素
  graphInstance.subContainer
    .select(`g.hullsG path#hullG-${abstractNode.guid}`)
    .remove();

  // 更新 svg 点边元素组
  graphInstance.subNodesG = graphInstance.subContainer
    .select('g.nodesG')
    .selectAll('g.nodeG');
  graphInstance.subLinksG = graphInstance.subContainer
    .select('g.linksG')
    .selectAll('g.linkG');

  // 重启力仿真器调度
  graph.actualLayoutInstances[level][subGraphID].restart(0.3);
  graph.virtualLayoutInstance.restart(0.1);

  callback && callback();
};

export { expandAbstractNode, shrinkAbstractNode };
