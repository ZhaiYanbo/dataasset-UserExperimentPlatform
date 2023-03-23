import * as d3 from 'd3';
import { Node, GraphOpts } from '../interface';
import {
  abstractNodeInfoConfig,
  nodeInfoConfig,
} from '@/graph-components/common/static-const-value';
import { renderLegend } from '@/graph-components/common/util-function';
import renderIcon from './render-icon';

/**
 * 绘制节点
 * @param graphInstance 图谱数据
 * @param cfg 图谱属性
 * @param isNewCreated 新增nodesG元素状态标识
 * @param isTransition 是否开启透明度渐变绘制效果
 * @param duration 渐变过渡时间
 */
const renderNodes = (
  graphInstance: any,
  cfg: GraphOpts,
  isNewCreated = true,
  isTransition = false,
  duration = 600
) => {
  // 检查对应的节点icon声明元素是否已经存在，若无则进行 append（根据半径来渲染不同的图标大小）
  const curIconTypeList = new Set(
    cfg.renderSvg.selectAll('#icon-defs pattern').data()
  );
  const nodesIconTypeList = new Set(
    graphInstance.subNodes.map((d: Node) => {
      return {
        iconId: `${d.r}-${d.typeName}`,
        r: d.r,
        typeName: d.typeName,
      };
    })
  );
  const newIconTypeList = [...nodesIconTypeList].filter((d: any) => {
    if (!curIconTypeList.has(d.iconId)) {
      curIconTypeList.add(d.iconId);
      return true;
    } else {
      return false;
    }
  });
  if (newIconTypeList.length !== 0) {
    renderIcon(cfg, newIconTypeList);
  }

  // 绘制图例
  const legendList = Array.from(
    new Set(graphInstance.subNodes.map((d: Node) => d.typeName))
  );
  renderLegend(cfg.legendContainer, legendList);

  // 绘制承载容器
  let containerEl;
  if (isNewCreated) {
    // 当为新创时则添加 nodesG 元素
    containerEl = graphInstance.subContainer
      .append('g')
      .attr('class', 'nodesG');
  } else {
    // 否则直接选择（主要用于扩展和收缩时）
    containerEl = graphInstance.subContainer.select('g.nodesG');
  }

  graphInstance.subNodesG = containerEl
    .selectAll('g')
    .data(graphInstance.subNodes, (d: Node) => d.guid)
    .enter()
    .append('g')
    .attr('id', (d: Node) => `nodeG-${d.guid}`)
    // .attr('class', (d: Node) => getNodeGClassName(d));
    .attr('class', 'nodeG');

  // 超点的根节点 nodesG
  let abstractClusterElements: any, abstractLogicElements: any;

  // 绘制节点
  const normalElements = graphInstance.subNodesG;

  // 节点背景
  normalElements
    .append('circle')
    .attr('class', 'circle-virtual-background')
    .attr('id', (d: Node) => `circle-virtual-background-${d.guid}`)
    .attr('stroke', (d: Node) =>
      d.typeName.indexOf('abstract') === -1
        ? nodeInfoConfig[d.typeName].backgroundColor
        : abstractNodeInfoConfig[d.typeName].backgroundColor
    )
    .style('stroke-opacity', 0)
    .attr('stroke-width', `${cfg.backgroundPadding}px`)
    .attr('r', (d: Node) =>
      d.typeName.indexOf('abstract') === -1 ? cfg.radius : d.r
    )
    .style('fill', (d: Node) =>
      d.typeName.indexOf('abstract') === -1
        ? nodeInfoConfig[d.typeName].backgroundColor
        : 'none'
    )
    .attr('opacity', isTransition ? 0 : 1);
  normalElements
    .append('circle')
    .attr('class', 'circle-background')
    .attr('id', (d: Node) => `circle-background-${d.guid}`)
    .attr('stroke', (d: Node) =>
      d.typeName.indexOf('abstract') === -1
        ? nodeInfoConfig[d.typeName].backgroundColor
        : 'none'
    )
    .style('stroke-opacity', 1)
    .attr('stroke-width', '0.5px')
    .attr('r', (d: Node) =>
      d.typeName.indexOf('abstract') === -1 ? cfg.radius : d.r
    )
    .style('fill', '#ffffff')
    .attr('opacity', isTransition ? 0 : 1);

  // 节点实体图标
  normalElements
    .append('circle')
    .attr('class', 'circle-node')
    .attr('stroke', 'none') // 去除默认的外圈stroke
    .attr('id', (d: Node) => `circle-node-${d.guid}`)
    .attr('r', (d: Node) =>
      d.typeName.indexOf('abstract') === -1 ? cfg.radius : d.r
    )
    .style('fill', (d: Node) =>
      d.typeName.indexOf('abstract') === -1
        ? nodeInfoConfig[d.typeName].color
        : `url(#node-icon-${d.r}-${d.typeName})`
    )
    // .style('fill', (d: Node) => `url(#node-icon-${d.r}-${d.typeName})`)
    .attr('opacity', isTransition ? 0 : 1);
  normalElements
    .append('text')
    .attr('class', 'circle-node-iconLabel')
    .attr('id', (d: Node) => `circle-node-iconLabel-${d.guid}`)
    .attr('stroke', 'none')
    .style('fill', '#ffffff')
    .style('font-size', `${cfg.radius}px`)
    .style('text-anchor', 'middle')
    .style('cursor', 'default')
    .attr('pointer-events', 'none')
    .attr('transform', (d: Node) => `translate(${0},${cfg.radius / 3})`)
    .text((d: Node) =>
      d.typeName.indexOf('abstract') === -1
        ? nodeInfoConfig[d.typeName].iconLable
        : ''
    )
    .attr('opacity', isTransition ? 0 : 1);

  // 节点文本标记
  normalElements
    .append('text')
    .attr('id', (d: Node) => `circle-text-${d.guid}`)
    .style('fill', '#000000')
    .style('font-size', (d) => `${cfg.radius}px`)
    .style('text-anchor', 'middle')
    .style('dominant-baseline', 'middle')
    .style('cursor', 'default')
    .attr('pointer-events', 'none')
    .attr('transform', (d: Node) => `translate(${0},${d.r + cfg.labelPadding})`)
    .text((d: Node) =>
      d.typeName.indexOf('abstract') === -1
        ? nodeInfoConfig[d.typeName].textLabel
        : abstractNodeInfoConfig[d.typeName].textLabel
    )
    .attr('opacity', isTransition ? 0 : 1);

  if (isTransition) {
    // 普通节点
    normalElements
      .selectAll('circle')
      .transition()
      .duration(duration)
      .attr('opacity', 1);
    normalElements
      .selectAll('text')
      .transition()
      .duration(duration)
      .attr('opacity', 1);

    // 绘制逻辑物理关系结构超点
    if (abstractClusterElements) {
      abstractClusterElements
        .selectAll('circle')
        .transition()
        .duration(duration)
        .attr('opacity', 1);
      abstractClusterElements
        .selectAll('polygon')
        .transition()
        .duration(duration)
        .attr('opacity', 1);
      abstractClusterElements
        .selectAll('path')
        .transition()
        .duration(duration)
        .attr('opacity', 1);
    }

    // 绘制逻辑物理关系结构超点
    if (abstractLogicElements) {
      abstractLogicElements
        .selectAll('circle')
        .transition()
        .duration(duration)
        .attr('opacity', 1);
      abstractLogicElements
        .selectAll('polygon')
        .transition()
        .duration(duration)
        .attr('opacity', 1);
      abstractLogicElements
        .selectAll('path')
        .transition()
        .duration(duration)
        .attr('opacity', 1);
    }
  }
};

export default renderNodes;
