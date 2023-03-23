import { Node, GraphOpts } from '../interface';
import renderIcons from './render-icons';
import { nodeInfoConfig } from '@/graph-components/common/static-const-value';
import { renderLegend } from '@/graph-components/common/util-function';

const renderNodes = (
  nodes: Node[],
  cfg: GraphOpts,
  isNewCreated: boolean = false
) => {
  // // 检查对应的节点icon声明元素是否已经存在，若无则进行 append
  // const curIconTypeList = new Set(
  //   cfg.renderSvg.selectAll('#icon-defs pattern').data()
  // );
  // const nodesIconTypeList = new Set(nodes.map((d: Node) => d.typeName));
  // const newIconTypeList = [...nodesIconTypeList].filter(
  //   (d) => !curIconTypeList.has(d)
  // );
  // if (newIconTypeList.length !== 0) {
  //   renderIcons(cfg, newIconTypeList);
  // }

  // 绘制图例
  const legendList = Array.from(new Set(nodes.map((d: Node) => d.typeName)));
  renderLegend(cfg.legendContainer, legendList);

  // 绘制承载容器
  let containerEl;
  if (isNewCreated) {
    // 当为新创时则添加 nodesG 元素
    containerEl = cfg.renderSvg.append('g').attr('class', 'nodes-group');
  } else {
    // 否则直接选择（主要用于扩展和收缩时）
    containerEl = cfg.renderSvg.select('g.nodes-group');
  }

  const nodesEL = containerEl
    .selectAll('g')
    .data(nodes, (d: Node) => d.guid)
    .enter()
    .append('g')
    .attr('id', (d: Node) => `node-${d.guid}`)
    .attr('class', 'node')
    .classed('expandNode', (d: Node) => d.isExtend);

  // 节点背景
  nodesEL
    .append('circle')
    .attr('class', 'circle-virtual-background')
    .attr('id', (d: Node) => `circle-virtual-background-${d.guid}`)
    .attr(
      'stroke',
      (d: Node) => `${nodeInfoConfig[d.typeName].backgroundColor}`
    )
    .style('stroke-opacity', (d: Node) => (cfg.keyId === d.guid ? 0.35 : 0))
    .attr('stroke-width', `${cfg.backgroundPadding}px`)
    .attr('r', cfg.radius)
    .style('fill', (d: Node) => nodeInfoConfig[d.typeName].backgroundColor);
  nodesEL
    .append('circle')
    .attr('id', (d: Node) => `circle-background-${d.guid}`)
    .attr(
      'stroke',
      (d: Node) => `${nodeInfoConfig[d.typeName].backgroundColor}`
    )
    .style('stroke-opacity', 0.75)
    .attr('stroke-width', '0.5')
    .attr('r', cfg.radius)
    .style('fill', '#ffffff');
  // 节点实体图标
  nodesEL
    .append('circle')
    .attr('id', (d: Node) => `circle-node-${d.guid}`)
    .attr('stroke', 'none') // 去除默认的外圈stroke
    .attr('r', cfg.radius)
    .style('fill', (d: Node) => nodeInfoConfig[d.typeName].color);
  // .style('fill', (d: Node) => `url(#node-icon-${d.typeName})`);

  nodesEL
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
    .text((d: Node) => nodeInfoConfig[d.typeName].iconLable);

  // 节点文本标记
  nodesEL
    .append('text')
    .attr('id', (d: Node) => `circle-text-${d.guid}`)
    // .style('fill', (d: Node) => nodeInfoConfig[d.typeName].textColor)
    // .style('font-size', `${cfg.radius}px`)
    .attr('stroke-width', 0)
    .style('text-anchor', 'middle')
    .style('dominant-baseline', 'middle')
    .style('cursor', 'default')
    .attr('pointer-events', 'none')
    .attr(
      'transform',
      (d: Node) => `translate(${0},${cfg.radius + cfg.labelPadding})`
    )
    .text((d: Node) => d.typeName);

  // nodesEL.append('circle')
  //   .attr('id', (d: Node) => `node-${d.guid}`)
  //   .attr('r', cfg.radius)
  //   // .attr('stroke', d => d.isKey ? 'orange' : d.color)
  //   // .attr('stroke-width', d => d.isKey ? '2.5px' : '1px')
  //   // .attr('stroke-width', 0.5)
  //   // .style('fill', d => d.color);
  //   .style('fill', '#999999');
  //
  // nodesEL.append('text')
  //   .style('fill', '#333333')
  //   // .style('fill', '#ffffff')
  //   .style('font-size', `${cfg.radius}px`)
  //   .style('text-anchor', 'middle')
  //   .style('cursor', 'default')
  //   .attr('pointer-events', 'none')
  //   .attr('transform', `translate(0,${cfg.radius / 2})`)
  //   .text(d => d.textLabel)

  return nodesEL;
};

export default renderNodes;
