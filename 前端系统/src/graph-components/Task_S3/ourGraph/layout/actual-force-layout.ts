import * as d3 from 'd3';
import BaseLayout from './base-layout';
import { Edge, Node, VirtualNode } from '../interface';
import { calculateHullPath } from '../utils/common';

/**
 * 实体节点力模型布局
 */
export default class ActualForceLayout extends BaseLayout {
  public graph: any;

  public simulation: any = null;

  public level = '';

  public subGraphID = '';

  public isOpenAutoZoom = false; // 是否开启自动放缩

  public graphInstance: any;

  public virtualNodeItem: any;

  constructor(props: any = {}) {
    super(props);
    Object.assign(this, props);
    this.init();
  }

  init() {
    this.simulation = d3.forceSimulation();
    this.run();
  }

  run() {
    // 当前子图的图对象
    this.graphInstance = this.graph.GraphInstances[this.level][this.subGraphID];
    // 当前子图的虚拟定位节点
    this.virtualNodeItem =
      this.graph.virtualNodesDict[this.level][this.subGraphID];

    // 对力模型进行数据绑定以及tick调度事件
    this.simulation
      .nodes(this.graphInstance.subNodes)
      .force('charge', d3.forceManyBody().strength(-35))
      .force(
        'link',
        d3
          .forceLink(this.graphInstance.subEdges)
          .id((d: Edge) => d.guid)
          .distance((d: Edge) => this.linkDistance(d))
      )
      .force('center', d3.forceCenter(0, 0))
      .force('collide', d3.forceCollide((d: Node) => d.r * 1.5).strength(3))
      .force(
        'radial',
        d3.forceRadial(this.virtualNodeItem.r).x(0).y(0).strength(0.05)
      )
      .on('tick', () => {
        this.tick();
      })
      .on('end', () => {
        this.tickend();
      });
  }

  tick() {
    // 更新虚拟节点半径
    this.virtualNodeItem.r =
      this.graph.virtualPadding +
      d3.max(
        this.graphInstance.subNodes.map(
          (d: Node) => d.r / 2 + Math.hypot(d.x, d.y)
        )
      );
    d3.select(`#node-${this.level}-sub${this.subGraphID}`).attr(
      'r',
      (d: VirtualNode) => d.r
    );

    // 更新凸包
    this.graphInstance.subContainer
      .selectAll('g.hullsG path')
      .attr('d', (d: Node) =>
        calculateHullPath(d.properties.forceNodes, this.graph.cfg.radius)
      );

    this.moveNode(this.graphInstance.subNodesG);
    this.moveLink(this.graphInstance.subLinksG);
  }

  tickend() {}

  /**
   * 更新力模型的点边数据并重启
   * @param alpha 重启时的初始 alpha
   * @param params 弹簧力弹簧长度拉伸参数
   */
  restart(alpha = 0.3, params: any = { linkDistanceStrength: 0 }) {
    this.simulation
      .nodes(this.graphInstance.subNodes)
      .force(
        'link',
        d3
          .forceLink(this.graphInstance.subEdges)
          .id((d) => d.guid)
          .distance((d) => this.linkDistance(d, params.linkDistanceStrength))
      )
      .alpha(alpha)
      .restart();
  }

  /**
   * 更新节点坐标
   * @param nodesEl svg 节点组元素
   * @param isTransition 是否启用过渡动画
   */
  moveNode(nodesEl: any, isTransition = false) {
    if (isTransition) {
      nodesEl
        .transition()
        .duration(500)
        .attr('transform', (d: Node) => `translate(${d.x},${d.y})`);
    } else {
      nodesEl.attr('transform', (d: Node) => `translate(${d.x},${d.y})`);
    }
  }

  /**
   * 更新连边坐标
   * @param edgesEl svg 连边组元素
   * @param isTransition 是否启用过渡动画
   */
  moveLink(edgesEl: any, isTransition = false) {
    if (isTransition) {
      edgesEl
        .selectAll('path')
        .transition()
        .duration(500)
        .attr(
          'd',
          (d: Edge) =>
            `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`
        );
    } else {
      edgesEl
        .selectAll('path')
        .attr(
          'd',
          (d: Edge) =>
            `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`
        );
    }
  }

  /**
   * 弹簧力连线长动态响应（主要用于再分层布局时）
   * @param d 连边数据
   * @param strength 增益值，主要用于主体结构分层布局时的动态拉长
   * @returns {number}
   */
  linkDistance(d: any, strength = 0): number {
    if (d.distanceValue) {
      return d.distanceValue;
    }
    let distance;
    if (
      d.sourceTypeName.indexOf('abstract-') !== -1 &&
      d.targetTypeName.indexOf('abstract-') !== -1
    ) {
      // 逻辑物理关系超点连边
      distance = 30;
    } else if (
      d.sourceTypeName.indexOf('abstract-') !== -1 ||
      d.targetTypeName.indexOf('abstract-') !== -1
    ) {
      // 簇结构超点连边
      distance = 30 + strength;
    } else {
      distance = 30;
    }
    d.distanceValue = distance;
    return distance;
  }

  destroy() {
    this.simulation.stop();
    this.simulation = null;
  }
}
