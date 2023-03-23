import { Node } from '../interface';
import BaseLayout from './base-layout';
import { getDegree } from '../utils/math';

export default class Concentric extends BaseLayout {
  public graph: any;

  public width = 300;

  public height = 300;

  public center: number[] = [0, 0];

  public minNodeSpacing = 30;

  public startAngle: number = (3 / 2) * Math.PI; // where nodes start in radians

  public sortBy = 'degree';

  public clockwise = true; // whether the layout should go clockwise (true)

  public maxValueNode: any = null; // 最大度的节点

  public maxLevelDiff = 0; // the letiation of concentric values in each level

  constructor(props: any = {}) {
    super(props);
    Object.assign(this, props);
    this.init();
  }

  init() {
    this.run();
  }

  run(): void {
    const { graph } = this;
    let { width, height, margin } = graph;

    /** ********************************  子图布局 start   ************************************ */
    if (graph.isSubGraphLayoutStatus) {
      width = graph.subGraphPositionInfos.width;
      height = graph.subGraphPositionInfos.height;
    }
    /** ********************************  子图布局 end   ************************************ */

    this.width = width - margin.left - margin.right;
    this.height = height - margin.top - margin.bottom;
    this.center = [this.width / 2, this.height / 2];

    /** ********************************  子图布局 start   ************************************ */
    const nodes = !graph.isSubGraphLayoutStatus
      ? graph.nodes
      : graph.subGraph.nodes;
    const edges = !graph.isSubGraphLayoutStatus
      ? graph.edges
      : graph.subGraph.edges;
    /** ********************************  子图布局 end   ************************************ */

    const n = nodes.length;
    if (n === 0) {
      return;
    }
    if (n === 1) {
      nodes[0].x = this.center[0];
      nodes[0].y = this.center[1];
      graph.refresh({
        nodes,
        edges,
      });
      return;
    }

    const layoutNodes: Node[] = [];
    const maxNodeSize = this.graph.radius * 2;

    nodes.forEach((node: Node, index: number) => {
      layoutNodes.push(node);
    });
    const nodeMap: any = {};
    const indexMap: any = {};
    layoutNodes.forEach((node: Node, index: number) => {
      nodeMap[node.guid] = node;
      indexMap[node.guid] = index;
    });

    // 按度大小排序（这里计算全图的）
    const values = getDegree(layoutNodes, graph.edges);
    layoutNodes.forEach((node: Node, i: number) => {
      node.degree = values[i];
    });
    layoutNodes.sort(
      (n1, n2) => (n2 as any)[this.sortBy] - (n1 as any)[this.sortBy]
    );

    // 获取最大度的节点
    this.maxValueNode = layoutNodes[0];
    this.maxLevelDiff = this.maxValueNode[this.sortBy] / 4;

    // put the values into levels
    const levels: any[] = [[]];
    let currentLevel = levels[0];
    layoutNodes.forEach((node: Node) => {
      if (currentLevel.length > 0) {
        const diff = Math.abs(
          currentLevel[0][this.sortBy] - (node as any)[this.sortBy]
        );
        if (this.maxLevelDiff && diff >= this.maxLevelDiff) {
          currentLevel = [];
          levels.push(currentLevel);
        }
      }
      currentLevel.push(node);
    });

    // create positions for levels
    const minDist = maxNodeSize + this.minNodeSpacing; // min dist between nodes

    // find the metrics for each level
    let r = 0;
    levels.forEach((level: any) => {
      const sweep = 2 * Math.PI - (2 * Math.PI) / level.length;
      const dTheta = (level.dTheta = sweep / Math.max(1, level.length - 1));

      // calculate the radius
      if (level.length > 1) {
        // but only if more than one node (can't overlap)
        const dcos = Math.cos(dTheta) - Math.cos(0);
        const dsin = Math.sin(dTheta) - Math.sin(0);
        const rMin = Math.sqrt(
          (minDist * minDist) / (dcos * dcos + dsin * dsin)
        ); // s.t. no nodes overlapping

        r = Math.max(rMin, r);
      }
      level.r = r;
      r += minDist;
    });

    // calculate the node positions
    levels.forEach((level: any) => {
      const { dTheta } = level;
      const rr = level.r;
      level.forEach((node: Node, j: number) => {
        const theta = this.startAngle + (this.clockwise ? 1 : -1) * dTheta * j;
        node.x = this.center[0] + rr * Math.cos(theta);
        node.y = this.center[1] + rr * Math.sin(theta);
      });
    });

    // 根据是否为子图布局，分别调用不同的渲染方法
    /** ********************************  子图布局 start   ************************************ */
    if (graph.isSubGraphLayoutStatus) {
      // 自适应调整位置
      layoutNodes.forEach((node: Node) => {
        node.x += graph.subGraphPositionInfos.center[0] - this.center[0];
        node.y += graph.subGraphPositionInfos.center[1] - this.center[1];
      });
      graph.refreshSubGraph({
        nodes: layoutNodes,
        edges,
      });
    } else {
      graph.refresh({
        nodes: layoutNodes,
        edges,
      });
    }
    /** ********************************  子图布局 end   ************************************ */
  }

  destroy(): void {}
}
