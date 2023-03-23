import { Node, Edge } from '../interface';
import { getExpandGraphFromNode } from '@/utils/axios';
import Graph from '..';
import { linkTwoNodes } from '../utils/common';

const expandRelationShip = (
  d: Node | Edge,
  contextMenuType: string,
  params: any,
  graph: Graph
) => {
  if (contextMenuType === 'nodeContextMenu') {
    // console.log("节点关系扩展", params);

    graph.isExpandStatus = true;
    if (graph.layout === 'Force') {
      graph.layoutInstance.simulation.force('center', null);
      graph.layoutInstance.simulation.stop();
    }

    // 暂时固定扩展的节点
    d.fx = d.x;
    d.fy = d.y;

    // 更新扩展操作的节点标识
    graph.nodes.forEach((node) => {
      node.isKey = node.guid === d.guid;
    });

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

    // 如果当前扩展的的节点是数据表节点，则需要进一步判断该节点的一跳关系下的作业节点，是否需要被记忆（即在T-j-T类型且两端T均被记忆的情况下，需要将j记忆）
    if (d.typeName === 'dli.TABLE') {
      d.edges.forEach((link: Edge) => {
        if (
          link.sourceNode.typeName === 'dlf.sub_node' ||
          link.sourceNode.typeName === 'dlf.dli_sql'
        ) {
          for (const edge of link.sourceNode.edges) {
            if (
              edge.sourceNode.guid === link.sourceNode.guid &&
              edge.targetNode.isRemember &&
              edge.targetNode.guid !== d.guid
            ) {
              graph.rememberNode(
                graph.allNodeByIdMap.get(link.sourceNode.guid)
              );
              break;
            }
            if (
              edge.targetNode.guid === link.sourceNode.guid &&
              edge.sourceNode.isRemember &&
              edge.sourceNode.guid !== d.guid
            ) {
              graph.rememberNode(
                graph.allNodeByIdMap.get(link.sourceNode.guid)
              );
              break;
            }
          }
        }
        if (
          link.targetNode.typeName === 'dlf.sub_node' ||
          link.targetNode.typeName === 'dlf.dli_sql'
        ) {
          for (const edge of link.targetNode.edges) {
            if (
              edge.targetNode.guid === link.targetNode.guid &&
              edge.sourceNode.isRemember &&
              edge.sourceNode.guid !== d.guid
            ) {
              graph.rememberNode(
                graph.allNodeByIdMap.get(link.targetNode.guid)
              );
              break;
            }
            if (
              edge.sourceNode.guid === link.targetNode.guid &&
              edge.targetNode.isRemember &&
              edge.targetNode.guid !== d.guid
            ) {
              graph.rememberNode(
                graph.allNodeByIdMap.get(link.targetNode.guid)
              );
              break;
            }
          }
        }
      });
    }

    // 如果当前扩展操作的节点与上一次操作的节点不同，则过滤掉非路径记忆节点
    // 否则可以不用过滤掉非路径记忆节点，直接在操作节点的基础上扩展其他内容
    if (graph.lastExpandNode.guid !== d.guid) {
      graph.filterNoRemember();
    }
    graph.lastExpandNode = d;

    // 之后再是发送数据请求
    // 如果已经扩展过了，则利用缓存读取数据
    if (d.isExpandChildren[params.expandRelationType]) {
      const graphData = {
        nodes: d.expandChildrenNode[params.expandRelationType],
        edges: d.expandChildrenLink[params.expandRelationType],
      };
      expandRelationProcess(d, graphData, graph, params.expandRelationType);
    } else {
      getExpandGraphFromNode(
        {
          guid: d.guid,
          typeName: d.typeName,
        },
        params.expandRelationType
      )
        .then((res) => {
          const graphData = res.data.content;
          expandRelationProcess(d, graphData, graph, params.expandRelationType);
        })
        .catch((err) => console.log(err));
    }
  } else {
    // TODO 待补充
    console.log('连边关系扩展', params);
  }
};

const expandRelationProcess = (
  d: Node | Edge,
  graphData: any,
  graph: Graph,
  expandRelationType: string
) => {
  // 如果当前有非记忆的扩展边，则将其进行收缩复原
  // TODO-目前还没有边扩展，因此这里还未不涉及
  if (graph.curRelationshipLink) {
    shrinkLink(graph.curRelationshipLink, graph);
  }

  // 获取操作的节点数据和增量相关的图数据
  graph.rootNode = d;
  graph.keyNode = d;

  // 更新当前扩展关系标识
  graph.curExpandRelationshipType = expandRelationType;
  if (graph.rootNode.currentExpandStatus[graph.curExpandRelationshipType]) {
    // 如果图谱上显示的当前操作节点已经扩展了该关系，则表现为收缩
    shrinkRelationshipNodes(graph);
  } else {
    graph.rootNode.isRunExpand = true;
    graph.rootNode.fx = graph.rootNode.x;
    graph.rootNode.fy = graph.rootNode.y;
    expandRelationshipNodes(graph, graphData);
  }
  if (graph.layout === 'Force') {
    graph.layoutInstance.isExpandRecommendStatus = true;
    graph.layoutInstance.initAutoZoom = true;
  }

  // 开启过渡效果并进行画布渲染
  graph.isTransitionStatus = true;
  graph.updateSVG();
};

/**
 * 收缩先前扩展的连边图数据，并恢复连边
 * @param {Object} edge [待收缩复原的连边数据]
 */
const shrinkLink = (edge: Edge, graph: Graph) => {
  // 调整了顺序：先恢复后过滤，以防止扩展时出现恢复边的二次添加
  // 恢复原来的边并更新边扩展标识
  if (edge) {
    graph.edges.push(edge);
    graph.allCurLinkByIdMap.set(edge.guid, edge);
    graph.curRelationshipLink = null;
  }

  // 过滤非路径记忆的点边数据
  graph.filterNoRemember();
};

// 收缩相关扩展关系下的点边
const shrinkRelationshipNodes = (graph: Graph) => {
  // 更新当前操作节点的扩展相关状态
  graph.rootNode.currentExpandStatus[graph.curExpandRelationshipType] = false;

  // 遍历相关扩展的节点，将非路径记忆的节点从原始数据当中过滤掉

  graph.rootNode.expandChildrenNode[graph.curExpandRelationshipType].forEach(
    (childNode) => {
      if (
        graph.allCurNodeByIdMap.has(childNode.guid) &&
        !childNode.isRemember &&
        !childNode.isPinRemember &&
        childNode.guid !== graph.rootNode.guid
      ) {
        graph.nodes = graph.nodes.filter((d) => d.guid !== childNode.guid);
        graph.edges = graph.edges.filter(
          (d) =>
            d.sourceNode.guid !== childNode.guid &&
            d.targetNode.guid !== childNode.guid
        );
        // 当需要去除的是作业节点NODE类型时，再对其数据流关系DATA_FLOW的非记忆二跳点边数据进行过滤
        if (
          childNode.group === 'NODE' &&
          graph.curExpandRelationshipType === 'DATA_FLOW'
        ) {
          childNode.expandChildrenNode[graph.curExpandRelationshipType].forEach(
            (nodeItem: Node) => {
              if (
                graph.allCurNodeByIdMap.has(nodeItem.guid) &&
                !nodeItem.isRemember &&
                !nodeItem.isPinRemember &&
                nodeItem.guid !== childNode.guid
              ) {
                graph.nodes = graph.nodes.filter(
                  (d) => d.guid !== nodeItem.guid
                );
                graph.edges = graph.edges.filter(
                  (d) =>
                    d.sourceNode.guid !== childNode.guid &&
                    d.targetNode.guid !== childNode.guid
                );
              }
            }
          );
          childNode.expandChildrenLink[graph.curExpandRelationshipType].forEach(
            (linkItem: Edge) => {
              if (
                graph.allCurLinkByIdMap.has(linkItem.guid) &&
                !linkItem.isRemember()
              ) {
                graph.edges = graph.edges.filter(
                  (d) => d.guid !== linkItem.guid
                );
              }
            }
          );
        }
      }
    }
  );

  // 遍历相关扩展的连边，将非路径记忆的连边从原始数据当中过滤掉
  graph.rootNode.expandChildrenLink[graph.curExpandRelationshipType].forEach(
    (childLink: Edge) => {
      if (
        graph.allCurLinkByIdMap.has(childLink.guid) &&
        !childLink.isRemember()
      ) {
        graph.edges = graph.edges.filter((d) => d.guid !== childLink.guid);
      }
    }
  );
};

// 扩展相关扩展关系下的节点
const expandRelationshipNodes = (
  graph: Graph,
  graphData: { nodes: any; edges: any }
) => {
  graph.rootNode.currentExpandStatus[graph.curExpandRelationshipType] = true; // 更新当前操作节点的扩展相关状态
  // 曾经扩展过该类关系，则从缓存中直接读取数据并扩展
  if (graph.rootNode.isExpandChildren[graph.curExpandRelationshipType]) {
    // 遍历获取相关扩展的点边数据
    graph.rootNode.expandChildrenNode[graph.curExpandRelationshipType].forEach(
      (childNode: Node) => {
        if (!graph.allCurNodeByIdMap.has(childNode.guid)) {
          // 设置新加入到图谱中被扩展的子节点初始坐标为父节点的位置
          childNode.x = graph.rootNode.x;
          childNode.y = graph.rootNode.y;
          graph.nodes.push(childNode);
        }
      }
    );

    graph.rootNode.expandChildrenLink[graph.curExpandRelationshipType].forEach(
      (childLink: Edge) => {
        if (!graph.allCurLinkByIdMap.has(childLink.guid)) {
          graph.edges.push(childLink);
        }
      }
    );
  } else {
    // 否则为第一次扩展，需对数据进行处理
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

    // 生成指定数据结构类型的点边数据
    const newChildrenNodes = graph.setNodesProps(newNodes);
    const newChildrenLinks = graph.setEdgesProps(newLinks);

    // 绑定连边两端节点的关联关系
    newChildrenLinks.forEach((d) => {
      linkTwoNodes(d, graph.curExpandRelationshipType);
    });

    // 更新图谱数据
    // nodes.push(...newChildrenNodes);
    // links.push(...newChildrenLinks);

    // 更新当前操作节点的扩展数据和扩展标识
    graphData.edges.forEach((t) => {
      const link = graph.edges.find((d) => d.guid === t.guid);
      if (
        !graph.rootNode.isExpandChildNodeMap[graph.curExpandRelationshipType][
          link.sourceNode.guid
        ]
      ) {
        graph.rootNode.expandChildrenNode[graph.curExpandRelationshipType].push(
          link.sourceNode
        );
        graph.rootNode.isExpandChildNodeMap[graph.curExpandRelationshipType][
          link.sourceNode.guid
        ] = link.sourceNode;
      }
      if (
        !graph.rootNode.isExpandChildNodeMap[graph.curExpandRelationshipType][
          link.targetNode.guid
        ]
      ) {
        graph.rootNode.expandChildrenNode[graph.curExpandRelationshipType].push(
          link.targetNode
        );
        graph.rootNode.isExpandChildNodeMap[graph.curExpandRelationshipType][
          link.targetNode.guid
        ] = link.targetNode;
      }
      if (
        !graph.rootNode.isExpandChildLinkMap[graph.curExpandRelationshipType][
          link.guid
        ]
      ) {
        graph.rootNode.expandChildrenLink[graph.curExpandRelationshipType].push(
          link
        );
        graph.rootNode.isExpandChildLinkMap[graph.curExpandRelationshipType][
          link.guid
        ] = link;
      }
    });
    graph.rootNode.isExpandChildren[graph.curExpandRelationshipType] = true;
  }
};

export { expandRelationShip };
