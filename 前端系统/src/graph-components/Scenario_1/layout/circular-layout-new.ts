import { Node } from '../interface';
import BaseLayout from './base-layout';
import { getDegree } from '../utils/math';

export default class NewCircularLayout extends BaseLayout {
  public graph: any;

  public width = 300;

  public height = 300;

  public center: number[] = [0, 0];

  public isAdaptive = true;

  public startAngle = 0;

  public endAngle: number = 2 * Math.PI;

  public divisions = 1; // 节点在环上分成段数（几个段将均匀分布）

  public angleRatio = 1; // how many 2*pi from first to last nodes

  public clockwise = true;

  public sortBy = 'degree';

  public minNodeSpacing = 1;

  public maxNodeSpacing = 100;

  constructor(props: any = {}) {
    super(props);
    Object.assign(this, props);
    this.init();
  }

  init() {
    this.run();
  }

  run() {
    const { graph } = this;
    let { width, height, margin } = graph;

    /**********************************  子图布局 start   *************************************/
    if (graph.isSubGraphLayoutStatus) {
      width = graph.subGraphPositionInfos.width;
      height = graph.subGraphPositionInfos.height;
    }
    /**********************************  子图布局 end   *************************************/

    this.width = width - margin.left - margin.right;
    this.height = width - margin.top - margin.bottom;
    this.center = [this.width / 2, this.height / 2];

    /**********************************  子图布局 start   *************************************/
    const nodes = !graph.isSubGraphLayoutStatus
      ? graph.nodes
      : graph.subGraph.nodes;
    const edges = !graph.isSubGraphLayoutStatus
      ? graph.edges
      : graph.subGraph.edges;
    /**********************************  子图布局 end   *************************************/

    const n = nodes.length;
    if (n === 0) {
      return;
    }

    if (n === 1) {
      nodes[0].x = this.center[0];
      nodes[0].y = this.center[1];
      graph.refresh({
        nodes: nodes,
        edges: edges,
      });
      return;
    }

    const radius = this.height > this.width ? this.width / 2 : this.height / 2;
    const { divisions } = this;
    const { startAngle } = this;
    const { endAngle } = this;
    const angleStep = (endAngle - startAngle) / n;

    // layout
    const nodeMap: any = {};
    nodes.forEach((node: Node, i: number) => {
      nodeMap[node.guid] = i;
    });

    const { angleRatio } = this;
    const astep = angleStep * angleRatio;

    const layoutNodes: Node[] = [];
    nodes.forEach((node: Node, index: number) => {
      layoutNodes.push(node);
      nodeMap[node.guid] = index;
    });
    // 计算节点的度大小，以方便后续排序
    const values = getDegree(layoutNodes, edges);
    layoutNodes.forEach((node: Node, i: number) => {
      node.degree = values[i];
    });

    layoutNodes.sort(
      (n1, n2) => (n2 as any)[this.sortBy] - (n1 as any)[this.sortBy]
    );

    const { clockwise } = this;
    const divN = Math.ceil(n / divisions); // node number in each division
    for (let i = 0; i < n; ++i) {
      let r = radius;
      if (!r) {
        r = 10 + (i * 100) / (n - 1);
      }
      let angle =
        startAngle +
        (i % divN) * astep +
        ((2 * Math.PI) / divisions) * Math.floor(i / divN);
      if (!clockwise) {
        angle =
          endAngle -
          (i % divN) * astep -
          ((2 * Math.PI) / divisions) * Math.floor(i / divN);
      }
      layoutNodes[i].x = this.center[0] + Math.cos(angle) * r;
      layoutNodes[i].y = this.center[1] + Math.sin(angle) * r;
    }

    /**********************************  子图布局 start   *************************************/
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
        edges: edges,
        // radius: radius, // 自适应模式下节点大小可能发生改变
      });
    }
    /**********************************  子图布局 end   *************************************/
  }

  /**
   * 根据节点度数大小排序
   * @return {array} orderedNodes 排序后的结果
   */
  public degreeOrdering(): Node[] {
    const self = this;
    const { nodes } = self;
    const orderedNodes: INode[] = [];
    const { degrees } = self;
    nodes.forEach((node, i) => {
      node.degree = degrees[i];
      orderedNodes.push(node);
    });
    orderedNodes.sort(compareDegree);
    return orderedNodes;
  }

  destroy() {}
}
