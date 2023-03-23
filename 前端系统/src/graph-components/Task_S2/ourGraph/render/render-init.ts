import * as d3 from 'd3';

/**
 * 绘制初始的点边 SVG 承载 container 和超点 hullsG
 * @param graphInstance 图谱数据
 * @param level 层级
 * @param subGraphID 连通子图ID
 */
const renderInit = (graphInstance: any, level: string, subGraphID: string) => {
  // SVG 点边元素承载容器
  graphInstance.subContainer = d3
    .select(`#nodeG-${level}-sub${subGraphID}`)
    .append('g')
    .attr('class', 'container-sub');

  // 超点凸包承载容器
  graphInstance.subHullsG = graphInstance.subContainer
    .append('g')
    .attr('class', 'hullsG');
};

export default renderInit;
