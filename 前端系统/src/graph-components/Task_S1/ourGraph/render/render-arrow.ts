import { GraphOpts } from '../interface';
import { edgeInfoConfig } from '@/graph-components/common/static-const-value';

/**
 * 绘制箭头声明 svg 元素
 * @param cfg 图谱属性
 * @param arrowTypeList 待补充的箭头属性数据列表
 */
const renderArrow = (cfg: GraphOpts, arrowTypeList: string[]) => {
  // 设置连边箭头元素
  let arrowDefs: any; // 箭头声明元素
  if (document.querySelector('svg#graph-painter defs#arrow-defs')) {
    // 存在则直接获取
    arrowDefs = cfg.renderSvg.select('defs#arrow-defs');
  } else {
    // 否则新建
    arrowDefs = cfg.renderSvg.append('defs').attr('id', 'arrow-defs');
  }

  // 遍历待绘制的 arrow 元素列表
  arrowTypeList.forEach((arrowType: string) => {
    const arrowMarker = arrowDefs
      .append('marker')
      .datum(arrowType)
      .attr('id', `edge-arrow-${arrowType}`)
      .attr('markerUnits', 'strokeWidth')
      .attr('viewBox', `-0 -${cfg.radius} ${cfg.radius * 2} ${cfg.radius * 2}`)
      .attr('refX', cfg.radius * 4.2) // 标记点的x坐标。如果圆更大，这个也需要更大
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', cfg.radius * 1.2)
      .attr('markerHeight', cfg.radius * 1.2)
      .attr('xoverflow', 'visible');
    arrowMarker
      .append('path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5 a 4,4,0 1,0 -8,-10')
      .attr('fill', edgeInfoConfig[arrowType].color)
      .style('stroke', 'none');
  });
};

export default renderArrow;
