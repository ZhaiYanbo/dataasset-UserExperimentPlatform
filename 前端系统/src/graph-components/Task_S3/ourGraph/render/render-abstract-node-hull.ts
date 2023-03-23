import { Node } from '../interface';
import { globalCfg } from '@/graph-components/common/static-const-value';

/**
 * 绘制超点展开后的凸包元素
 * @param graphInstance 图谱数据
 * @param rootNode 原先超点数据
 * @param duration 凸包淡入过渡时间
 */

const renderAbstractNodeHull = (
  graphInstance: any,
  rootNode: Node,
  duration = 600
) => {
  // 绘制超点凸包
  const hullEl = graphInstance.subContainer
    .select('g.hullsG')
    .append('path')
    .attr('class', 'hullG')
    .attr('id', `hullG-${rootNode.guid}`)
    .datum(rootNode)
    .attr('fill', globalCfg.abstractHullFill);
  hullEl.attr('opacity', 0).transition().duration(duration).attr('opacity', 1);
};

export default renderAbstractNodeHull;
