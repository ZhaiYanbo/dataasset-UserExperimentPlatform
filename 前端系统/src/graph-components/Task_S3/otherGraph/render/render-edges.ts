import { edgeInfoConfig } from '@/graph-components/common/static-const-value';
import { Edge, GraphOpts } from '../interface';
import renderArrow from './render-arrow';

/**
 * 绘制连边
 * @param graphInstance 图谱数据
 * @param cfg 图谱属性
 * @param isNewCreated 新增linksG元素状态标识
 * @param isTransition 是否开启透明度渐变绘制效果
 * @param duration 渐变过渡时间
 */
const renderEdges = (
  graphInstance: any,
  cfg: GraphOpts,
  isNewCreated = true,
  isTransition = false,
  duration = 600
) => {
  // 检查对应的连边箭头声明元素是否已经存在，若无则进行 append
  const curArrowTypeList = new Set(
    cfg.renderSvg.selectAll('#arrow-defs marker').data()
  );
  const edgesArrowTypeList = new Set(
    graphInstance.edges.map((d: Edge) => d.relationshipTypeName)
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
    containerEl = graphInstance.container.append('g').attr('class', 'linksG');
  } else {
    // 否则直接选择（主要用于扩展和收缩时）
    containerEl = graphInstance.container.select('g.linksG');
  }

  // 创建子 linkG 元素
  graphInstance.linksG = containerEl
    .selectAll('g')
    .data(graphInstance.edges, (d: Edge) => d.guid)
    .enter()
    .append('g')
    .attr('id', (d: Edge) => `linkG-${d.guid}`)
    .attr('class', 'linkG');

  const paths = graphInstance.linksG
    .append('path')
    .attr('class', 'edge-path')
    .attr('id', (d) => `edge-path-${d.guid}`)
    .attr('stroke', (d) => edgeInfoConfig[d.relationshipTypeName].color)
    .style('stroke-width', 0.75)
    .attr('marker-end', (d: Edge) =>
      d.properties.isAbstract
        ? 'none'
        : `url(#edge-arrow-${d.relationshipTypeName})`
    ) // 连接超点的连边不设置箭头
    .attr('opacity', isTransition ? 0 : 1);
  if (isTransition) {
    paths.transition().duration(duration).attr('opacity', 1);
  }
};

export default renderEdges;
