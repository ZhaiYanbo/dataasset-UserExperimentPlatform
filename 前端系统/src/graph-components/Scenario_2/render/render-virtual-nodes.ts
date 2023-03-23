import { GraphOpts, VirtualNode } from '../interface';
import {
  virtualColor,
  sectorCfg,
} from '@/graph-components/common/static-const-value';

/**
 * 绘制虚拟定位节点
 * @param virtualContainer 虚拟节点绘制承载容器
 * @param virtualNodes 虚拟节点数组
 * @param cfg 图谱属性
 * @param sectorInstance 扇形区块实例对象
 */

const renderVirtualNodes = (
  virtualContainer: any,
  virtualNodes: VirtualNode[],
  cfg: GraphOpts,
  showClusterHull: boolean,
  sectorInstance: any = null
) => {
  // 绘制虚拟节点 nodeG
  let virtualNodesEL;
  if (sectorInstance) {
    sectorInstance.rootEL = virtualContainer
      .append('g')
      .attr('class', 'nodesG-virtual')
      .attr('transform', `translate(${cfg.width / 2}, ${cfg.height / 2})`);

    // 凸包相关数据
    const hullData = {
      nodes: virtualNodes,
      clusterData: sectorInstance.clusterData,
    };

    // 凸包path
    if (showClusterHull) {
      sectorInstance.hullEL = sectorInstance.rootEL
        .append('path')
        .attr('class', 'nodesG-virtual-hull')
        .attr('opacity', 0)
        .datum(hullData)
        .attr('fill', (d: any) =>
          d.clusterData
            ? sectorCfg.sectorHullFill[
                d.clusterData.properties[sectorCfg.sectorLevelLabel]
              ]
            : sectorCfg.sectorHullFill.others
        )
        .attr('stroke-linejoin', () => 'round');
      // 凸包文本
      sectorInstance.textEL = sectorInstance.rootEL
        .append('text')
        .datum(hullData)
        .attr('class', 'nodesG-virtual-hull-text')
        .attr('pointer-events', 'none')
        .style('fill', '#666666')
        .style('font-size', `20px`)
        .style('text-anchor', 'middle')
        .style('cursor', 'default')
        .style('opacity', 0)
        .attr('pointer-events', 'none')
        .text((d: any) =>
          d.clusterData
            ? `${d.clusterData.properties[sectorCfg.sectorLevelLabel]}层聚类--${
                d.clusterData.displayText
              }`
            : '其他聚类'
        );
    } else {
      sectorInstance.hullEL = sectorInstance.rootEL
        .append('path')
        .attr('class', 'nodesG-virtual-hull')
        .attr('opacity', 0)
        .attr('stroke-linejoin', () => 'round');
      sectorInstance.textEL = sectorInstance.rootEL
        .append('text')
        .attr('class', 'nodesG-virtual-hull-text')
        .attr('pointer-events', 'none')
        .style('fill', '#666666')
        .style('font-size', `20px`)
        .style('text-anchor', 'middle')
        .style('cursor', 'default')
        .style('opacity', 0)
        .attr('pointer-events', 'none');
    }

    // 虚拟节点g
    virtualNodesEL = sectorInstance.rootEL
      .selectAll('g')
      .data(virtualNodes)
      .enter()
      .append('g')
      .attr('class', 'nodeG')
      .attr('id', (d: VirtualNode) => `nodeG-${d.id}`);
  } else {
    virtualNodesEL = virtualContainer
      .append('g')
      .attr('class', 'nodesG-virtual')
      .attr('transform', `translate(${cfg.width / 2}, ${cfg.height / 2})`)
      .selectAll('g')
      .data(virtualNodes)
      .enter()
      .append('g')
      .attr('class', 'nodeG')
      .attr('id', (d: VirtualNode) => `nodeG-${d.id}`);
  }

  // 绘制 circle
  virtualNodesEL
    .append('circle')
    .attr('class', 'node-virtual')
    .attr('id', (d: VirtualNode) => `node-${d.id}`)
    .attr('r', (d: VirtualNode) => d.r)
    .attr('fill', (d: VirtualNode) => virtualColor[d.level]);

  return virtualNodesEL;
};

export default renderVirtualNodes;
