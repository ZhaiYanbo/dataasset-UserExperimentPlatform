import { Edge, GraphOpts } from '../interface';
import renderArrow from './render-arrow';
import { edgeInfoConfig } from '@/graph-components/common/static-const-value';

const renderEdges = (
  edges: Edge[],
  cfg: GraphOpts,
  isNewCreated: boolean = false
) => {
  // 检查对应的连边箭头声明元素是否已经存在，若无则进行 append
  const curArrowTypeList = new Set(
    cfg.renderSvg.selectAll('#arrow-defs marker').data()
  );
  const edgesArrowTypeList = new Set(
    edges.map((d: Edge) => d.relationshipTypeName)
  );
  const newArrowTypeList = [...edgesArrowTypeList].filter(
    (d) => !curArrowTypeList.has(d)
  );
  if (newArrowTypeList.length !== 0) {
    renderArrow(cfg, newArrowTypeList);
  }

  // 连边绘制承载容器
  let containerEl;
  if (isNewCreated) {
    // 当为新创时则添加 linksG 元素
    containerEl = cfg.renderSvg.append('g').attr('class', 'edges-group');
  } else {
    // 否则直接选择（主要用于扩展和收缩时）
    containerEl = cfg.renderSvg.select('g.edges-group');
  }

  const edgesEL = containerEl
    .selectAll('g')
    .data(edges, (d: Edge) => d.guid)
    .enter()
    .append('g')
    .attr('id', (d: Edge) => `edge-${d.guid}`)
    .attr('class', 'edge')
    .classed('expandEdge', (d: Edge) => d.isExtend);

  edgesEL
    .append('path')
    .attr('stroke', (d: Edge) => edgeInfoConfig[d.relationshipTypeName].color)
    .style('stroke-width', 1.5)
    .attr(
      'marker-end',
      (d: Edge) => `url(#edge-arrow-${d.relationshipTypeName})`
    );
  return edgesEL;
};

export default renderEdges;
