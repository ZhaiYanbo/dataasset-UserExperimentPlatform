import { Node } from '../interface';
import BaseLayout from './base-layout';

export default class RandomLayout extends BaseLayout {
  public graph: any;

  public width = 300;

  public height = 300;

  public center: number[] = [0, 0];

  public nodePadding = 5; // 节点间隙

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
    const layoutNodes = !graph.isSubGraphLayoutStatus
      ? graph.nodes
      : graph.subGraph.nodes;
    const edges = !graph.isSubGraphLayoutStatus
      ? graph.edges
      : graph.subGraph.edges;
    /** ********************************  子图布局 end   ************************************ */

    const positionRecord: any[] = []; // 用于记录节点坐标，防止重叠
    const nodeSize = this.graph.radius;
    let xItem: number;
    let yItem: number;
    let flag = false;
    if (layoutNodes.length) {
      layoutNodes.forEach((node: Node) => {
        while (true) {
          flag = false;
          xItem = (Math.random() - 0.5) * this.width + this.center[0];
          yItem = (Math.random() - 0.5) * this.height + this.center[1];
          for (const item of positionRecord) {
            if (
              Math.hypot(xItem - item[0], yItem - item[1]) <
              nodeSize * 2 + this.nodePadding
            ) {
              flag = true;
              break;
            }
          }
          if (!flag) {
            node.x = xItem;
            node.y = yItem;
            positionRecord.push([xItem, yItem]);
            break;
          }
        }
      });
    }

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

  destroy() {}
}
