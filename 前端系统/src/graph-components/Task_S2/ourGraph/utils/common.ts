import * as d3 from 'd3';
import { Node, VirtualNode } from '../interface';

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
const getRandomPosition = (): number => {
  return Math.round((Math.random() - 0.5) * 40);
};

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
  let xItem, yItem;
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
  let xItem, yItem;
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
 */
const autoZoom = (
  renderSVG: any,
  zoomObject: any,
  sizeParams: any,
  duration: number = 1000
) => {
  // 获取 svg 图谱元素的空间范围
  const svgBox = renderSVG.node().getBBox();

  // 计算放缩系数
  const scale = Math.min(
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
};

export {
  cutArrayBasedOnLength,
  getRandomPosition,
  calculateHullPath,
  calculateSectorHullPath,
  calculatePolygonHullCentroid,
  autoZoom,
};
