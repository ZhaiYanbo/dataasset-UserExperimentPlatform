/* eslint-disable operator-linebreak */
import * as d3 from 'd3';
import { Node, VirtualNode } from '@/Scenario_2/graph/interface';
import { nodeInfoConfig, abstractNodeInfoConfig } from './static-const-value';

/**
 * 把一个数组分割成若干指定长度的子数组
 * @param originalArray 原始数组
 * @param subArrayLength 给定子数组中元素的个数
 * @returns {[]} 分割后的数组
 */
const cutArrayBasedOnLength = (originalArray: any, subArrayLength: number) => {
  let index = 0;
  const newArray = [];
  while (index < originalArray.length) {
    newArray.push(originalArray.slice(index, (index += subArrayLength)));
  }
  return newArray;
};

/**
 * 用于获取随机偏量
 * @returns {number} 随机值
 */
const getRandomPosition = (): number => Math.round((Math.random() - 0.5) * 40);

/**
 * 计算任意形状节点凸包路径属性 d
 * @param nodeList 节点数组（需含坐标）
 * @param radius 节点半径值
 * @returns {*}
 */
const calculateHullPath = (nodeList: Node[], radius: number) => {
  const line = d3.line();
  let pointArr: any[] = [];
  const pad = radius * 2;
  nodeList.forEach((d: Node) => {
    pointArr = pointArr.concat([
      [d.x - pad, d.y - pad],
      [d.x - pad, d.y + pad],
      [d.x + pad, d.y - pad],
      [d.x + pad, d.y + pad],
    ]);
  });
  return line(d3.polygonHull(pointArr));
};

/**
 * 计算任意形状节点凸包路径属性 d （和上面的类似，但增加了一些配置项以适应游离结构的坐标计算）
 * @param nodeList 节点数组（需含坐标）
 * @param radius 节点半径值，用于控制凸包内间隙
 * @param p 节点坐标放缩倍数
 * @returns {*}
 */
const calculateSectorHullPath = (
  nodeList: VirtualNode[],
  radius: number,
  p: number
) => {
  const line = d3.line();
  const pointArr: any[] = [];
  const pad = radius * 4;
  let xItem;
  let yItem;
  nodeList.forEach((d: VirtualNode) => {
    xItem = d.x * p;
    yItem = d.y * p;
    pointArr.push([xItem - pad, yItem - pad]);
    pointArr.push([xItem - pad, yItem + pad]);
    pointArr.push([xItem + pad, yItem - pad]);
    pointArr.push([xItem + pad, yItem + pad]);
  });
  return line(d3.polygonHull(pointArr));
};

/**
 * 计算任意形状节点凸包的几何中心
 * @param nodeList 节点数组（需含坐标）
 * @param p 节点坐标放缩倍数
 */
const calculatePolygonHullCentroid = (nodeList: VirtualNode[], p: number) => {
  if (nodeList.length === 1) {
    return [nodeList[0].x, nodeList[0].y];
  }
  const pointArr: any[] = [];
  const pad = 0;
  let xItem;
  let yItem;
  nodeList.forEach((d: VirtualNode) => {
    xItem = d.x * p;
    yItem = d.y * p;
    pointArr.push([xItem - pad, yItem - pad]);
    pointArr.push([xItem - pad, yItem + pad]);
    pointArr.push([xItem + pad, yItem - pad]);
    pointArr.push([xItem + pad, yItem + pad]);
  });
  const polygonHull = d3.polygonHull(pointArr);
  return d3.polygonCentroid(polygonHull);
};

/**
 * 对视图自动放缩聚焦
 * @param renderSVG 图谱SVG元素
 * @param zoomObject 放缩对象
 * @param sizeParams 图谱大小尺寸
 * @param duration 过渡时间
 * @param setTargetScale 是否设置指定放缩尺寸
 */
const autoZoom = (
  renderSVG: any,
  zoomObject: any,
  sizeParams: any,
  duration = 1000,
  setTargetScale = { status: false, scale: 0 }
) => {
  // 获取 svg 图谱元素的空间范围
  const svgBox = renderSVG.node().getBBox();

  // 计算放缩系数
  const scale = setTargetScale.status
    ? setTargetScale.scale
    : Math.min(
        (sizeParams.svgHeight - 2 * sizeParams.margin.top) / svgBox.height,
        (sizeParams.svgWidth - 2 * sizeParams.margin.left) / svgBox.width
      );

  // 计算居中的位置偏量
  const xScale =
    sizeParams.svgWidth / 2 - (svgBox.x + svgBox.width / 2) * scale;
  const yScale =
    sizeParams.svgHeight / 2 - (svgBox.y + svgBox.height / 2) * scale;

  // 对绑定了放缩事件的元素进行放缩操作（即 renderSVG 的父元素）
  const t = d3.zoomIdentity.translate(xScale, yScale).scale(scale);
  d3.select(renderSVG.node().parentNode)
    .transition()
    .duration(duration)
    .call(zoomObject.transform, t);

  return t;
};

/**
 * 在指定容器里绘制图例
 * @param containerElementID 绘制容器id (带#)
 * @param legendList 图例数组
 */
const renderLegend = (
  containerElementID: string,
  legendList: any[],
  legendRenderParams = {
    size: 8,
    heightPadding: 2,
  },
  useDefaultColor = true
) => {
  const containerEL = d3.select(containerElementID);
  // 初始化容器
  containerEL.select('svg#legend-svg').remove();
  const legendSvg = containerEL
    .append('svg')
    .attr('id', 'legend-svg')
    .attr(
      'height',
      (legendRenderParams.size * 2 + legendRenderParams.heightPadding) *
        legendList.length -
        legendRenderParams.heightPadding
    );

  // // 进行图标声明
  // const iconDefs = legendSvg.append('defs').attr('id', 'legend-icon-defs');
  // legendList.forEach((iconItem: any) => {
  //   const hrefPath =
  //     iconItem.typeName.indexOf('abstract') === -1
  //       ? nodeInfoConfig[iconItem.typeName].icon
  //       : abstractNodeInfoConfig[iconItem.typeName].icon;
  //   const params =
  //     iconItem.typeName.indexOf('abstract') === -1
  //       ? {
  //           size: cfg.radius,
  //           position: cfg.radius / 2,
  //         }
  //       : { size: iconItem.r * 2, position: 0 };
  //   const iconPattern = iconDefs
  //     .append('pattern')
  //     .datum(iconItem)
  //     .attr('id', `node-icon-${iconItem}`)
  //     .attr('width', 1)
  //     .attr('height', 1);
  //   iconPattern
  //     .append('image')
  //     .attr('href', `./static/graph-icon/${hrefPath}.svg`) // 图标 svg
  //     .attr('preserveAspectRatio', 'none') // 填充整个circle
  //     .attr('width', params.size)
  //     .attr('height', params.size)
  //     .attr('x', params.position)
  //     .attr('y', params.position);
  // });

  // 对图标按权重进行排序
  legendList.sort((a: string, b: string) => {
    const w1 =
      a.indexOf('abstract') === -1
        ? nodeInfoConfig[a].iconWeight
        : abstractNodeInfoConfig[a].iconWeight;
    const w2 =
      b.indexOf('abstract') === -1
        ? nodeInfoConfig[b].iconWeight
        : abstractNodeInfoConfig[b].iconWeight;
    return w1 - w2;
  });

  // 绘制图标
  legendSvg
    .selectAll('circle')
    .data(legendList)
    .enter()
    .append('circle')
    .attr('class', 'legend-circle')
    .attr('id', (d) => `legend-circle-${d}`)
    .attr('cx', (d) => legendRenderParams.size * 2)
    .attr(
      'cy',
      (d, index) =>
        legendRenderParams.size +
        (legendRenderParams.size * 2 + legendRenderParams.heightPadding) * index
    )
    .attr('r', legendRenderParams.size)
    .attr('fill', function (d) {
      const cx = parseInt(d3.select(this).attr('cx'));
      const cy = parseInt(d3.select(this).attr('cy'));
      // 设置图标中心内容
      legendSvg
        .append('text')
        .style('font-size', '12px')
        .style('fill', '#ffffff')
        .attr('x', cx)
        .attr('y', cy)
        .attr('transform', `translate(0,${legendRenderParams.size / 2})`)
        .attr('pointer-events', 'none')
        .style('text-anchor', 'middle')
        .style('cursor', 'default')
        .text(nodeInfoConfig[d].iconLable);
      // 设置文本内容
      legendSvg
        .append('text')
        .attr('x', cx)
        .attr('y', cy)
        .attr(
          'transform',
          `translate(${legendRenderParams.size * 2},${
            legendRenderParams.size / 2
          })`
        )
        .attr('pointer-events', 'none')
        .style('cursor', 'default')
        .style('fill', '#000000')
        // .style('font-size', `${legendRenderParams.size * 2}px`)
        .text(nodeInfoConfig[d].chineseName);
      return useDefaultColor ? nodeInfoConfig[d].color : '#999999';
      // return useDefaultColor
      //   ? nodeInfoConfig[d].color
      //   : `url(#legend-icon-${d.r}-${d.typeName})`;
    });
};

export {
  cutArrayBasedOnLength,
  getRandomPosition,
  calculateHullPath,
  calculateSectorHullPath,
  calculatePolygonHullCentroid,
  autoZoom,
  renderLegend,
};
