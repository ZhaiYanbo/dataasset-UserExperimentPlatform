import * as d3 from 'd3';

/**
 * 绘制初始的点边 SVG 承载 container 和超点 hullsG
 * @param graphInstance 图谱数据
 */
const renderInit = (graphInstance: any) => {
  // SVG 点边元素承载容器
  graphInstance.container = d3.select('#inner-container');

  // 超点凸包承载容器
  graphInstance.subHullsG = graphInstance.container
    .append('g')
    .attr('class', 'hullsG');
};

export default renderInit;
