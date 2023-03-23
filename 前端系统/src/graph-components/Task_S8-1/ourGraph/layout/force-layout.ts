import * as d3 from 'd3';
import BaseLayout from './base-layout';
import { Edge, Node } from '../interface';
import { forceManyBodyReuse } from '@/graph-components/common/force-model';

/**
 * 力引导布局
 */
export default class ForceLayout extends BaseLayout {
  public graph: any;

  public simulation: any = null;

  public isOpenAutoZoom = false; // 是否开启自动放缩

  public graphInstance: any;

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
    // 当前连通子图图对象
    this.graphInstance = this.graph.GraphInstance;

    // 对力模型进行数据绑定以及tick调度事件
    this.simulation
      .nodes(this.graphInstance.nodes)
      .force('charge', d3.forceManyBody().strength(-25))
      .force(
        'center',
        d3.forceCenter(this.graph.width / 2, this.graph.height / 2)
      )
      .force('x', d3.forceX(this.graph.width / 2).strength(0.013))
      .force('y', d3.forceY(this.graph.height / 2).strength(0.013))
      .force(
        'link',
        d3
          .forceLink(this.graphInstance.edges)
          .id((d: Edge) => d.guid)
          .distance(30)
      )
      .force(
        'collide',
        d3.forceCollide((d: Node) => d.r)
      )
      .on('tick', () => {
        this.tick();
      })
      .on('end', () => {
        this.tickend();
      });
  }

  tick() {
    if (this.isOpenAutoZoom && this.simulation.alpha() < 0.15) {
      this.graph.runAutoZoom();
      this.isOpenAutoZoom = false;
    }
    this.moveNode(this.graphInstance.nodesG, false);
    this.moveLink(this.graphInstance.linksG, false);
  }

  tickend(): void {
    // this.graph.runAutoZoom();
  }

  /**
   * 更新力模型的点边数据并重启
   * @param alpha 重启时的初始 alpha
   * @param params 弹簧力弹簧长度拉伸参数
   */
  restart(alpha = 0.3, params = { linkDistanceStrength: 0 }) {
    this.simulation
      .nodes(this.graphInstance.nodes)
      .force(
        'link',
        d3
          .forceLink(this.graphInstance.edges)
          .id((d: Edge) => d.guid)
          .distance((d) => this.linkDistance(d, params.linkDistanceStrength))
      )
      .alpha(alpha)
      .restart();
  }

  /**
   * 更新节点坐标
   * @param nodesEl svg 节点组元素
   * @param isTransition 是否启用过渡动画
   * @param duration 过渡时间
   */
  moveNode(nodesEl: any, isTransition = false, duration = 800) {
    if (isTransition) {
      nodesEl
        .transition()
        .duration(duration)
        .attr('transform', (d: Node) => `translate(${d.x},${d.y})`);
    } else {
      nodesEl.attr('transform', (d: Node) => `translate(${d.x},${d.y})`);
    }
  }

  /**
   * 更新连边坐标
   * @param edgesEl svg 连边组元素
   * @param isTransition 是否启用过渡动画
   * @param duration 过渡时间
   */
  moveLink(edgesEl: any, isTransition = false, duration = 800) {
    if (isTransition) {
      edgesEl
        .selectAll('path')
        .transition()
        .duration(duration)
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
