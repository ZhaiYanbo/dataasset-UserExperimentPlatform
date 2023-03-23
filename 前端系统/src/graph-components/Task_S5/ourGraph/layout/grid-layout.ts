import { Node } from '../interface';
import BaseLayout from './base-layout';
import { getDegree } from '../utils/math';

export default class GridLayout extends BaseLayout {
  public graph: any;

  public width = 300;

  public height = 300;

  public center: number[] = [0, 0];

  public begin: number[] = [0, 0];

  public sortBy = 'degree';

  public rows = 0;

  public cols = 0;

  public row = 0;

  public col = 0;

  public cellWidth = 0;

  public cellHeight = 0;

  public cells = 0;

  public cellUsed: {
    [key: string]: boolean;
  } = {};

  constructor(props: any = {}) {
    super(props);
    Object.assign(this, props);
    this.init();
  }

  init() {
    this.run();
  }

  run(): void {
    const graph = this.graph;
    let { width, height, margin } = graph;

    /**********************************  子图布局 start   *************************************/
    if (graph.isSubGraphLayoutStatus) {
      width = graph.subGraphPositionInfos.width;
      height = graph.subGraphPositionInfos.height;
    }
    /**********************************  子图布局 end   *************************************/

    this.width = width - margin.left - margin.right;
    this.height = height - margin.top - margin.bottom;
    this.center = [this.width / 2, this.height / 2];
    this.begin = [0, 0];

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

    const layoutNodes: Node[] = [];
    const nodeIdxMap: any = {};
    nodes.forEach((node: Node, index: number) => {
      layoutNodes.push(node);
      nodeIdxMap[node.guid] = index;
    });

    // 按度大小排序（这里计算全图的）
    const values = getDegree(layoutNodes, graph.edges);
    layoutNodes.forEach((node: Node, i: number) => {
      node.degree = values[i];
    });
    layoutNodes.sort(
      (n1, n2) => (n2 as any)[this.sortBy] - (n1 as any)[this.sortBy]
    );

    this.cells = n;
    // 自适应计算网格数
    const splits = Math.sqrt((this.cells * this.height) / this.width);
    this.rows = Math.round(splits);
    this.cols = Math.round((this.width / this.height) * splits);

    if (this.cols * this.rows > this.cells) {
      // 当自适应计算的网格过多，删减适当的网格
      const sm = this.small() as number;
      const lg = this.large() as number;
      if ((sm - 1) * lg >= this.cells) {
        this.small(sm - 1);
      } else if ((lg - 1) * sm >= this.cells) {
        this.large(lg - 1);
      }
    } else {
      // 当自适应计算的网格过少，增加适当的网格
      while (this.cols * this.rows < this.cells) {
        const sm = this.small() as number;
        const lg = this.large() as number;
        if ((lg + 1) * sm >= this.cells) {
          this.large(lg + 1);
        } else {
          this.small(sm + 1);
        }
      }
    }

    this.cellWidth = this.width / this.cols;
    this.cellHeight = this.height / this.rows;

    // 阻止节点遮挡
    layoutNodes.forEach((node) => {
      if (!node.x || !node.y) {
        // for bb
        node.x = 0;
        node.y = 0;
      }

      const nodew = graph.radius;
      const nodeh = graph.radius;

      const p = graph.preventOverlapPadding;
      const w = nodew + p;
      const h = nodeh + p;
      this.cellWidth = Math.max(this.cellWidth, w);
      this.cellHeight = Math.max(this.cellHeight, h);
    });

    this.cellUsed = {};
    this.row = 0;
    this.col = 0;

    for (let i = 0; i < layoutNodes.length; i++) {
      const node = layoutNodes[i];
      this.getPos(node);
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
      });
    }
    /**********************************  子图布局 end   *************************************/
  }

  small(val?: number): number | undefined {
    let res: number | undefined;
    const rows = this.rows || 5;
    const cols = this.cols || 5;
    if (val == null) {
      res = Math.min(rows, cols);
    } else {
      const min = Math.min(rows, cols);
      if (min === this.rows) {
        this.rows = val;
      } else {
        this.cols = val;
      }
    }
    return res;
  }

  large(val?: number): number | undefined {
    let res: number | undefined;
    const rows = this.rows || 5;
    const cols = this.cols || 5;
    if (val == null) {
      res = Math.max(rows, cols);
    } else {
      const max = Math.max(rows, cols);
      if (max === this.rows) {
        this.rows = val;
      } else {
        this.cols = val;
      }
    }
    return res;
  }

  /**
   * 检查该网格是否被使用
   * @param row
   * @param col
   * @returns
   */
  private used(row: number | undefined, col: number | undefined) {
    return this.cellUsed[`c-${row}-${col}`] || false;
  }

  /**
   * 设置该网格为使用状态
   * @param row
   * @param col
   */
  private use(row: number | undefined, col: number | undefined) {
    this.cellUsed[`c-${row}-${col}`] = true;
  }

  /**
   * 移动滑动网格窗口
   */
  private moveToNextCell() {
    const cols = this.cols || 5;
    this.col++;
    if (this.col >= cols) {
      this.col = 0;
      this.row++;
    }
  }

  /**
   * 获取节点具体坐标
   * @param node 节点
   */
  private getPos(node: Node) {
    const begin = this.begin;
    const cellWidth = this.cellWidth;
    const cellHeight = this.cellHeight;

    // 寻找未利用的网格
    while (this.used(this.row, this.col)) {
      this.moveToNextCell();
    }
    const x = this.col * cellWidth + cellWidth / 2 + begin[0];
    const y = this.row * cellHeight + cellHeight / 2 + begin[1];
    this.use(this.row, this.col);

    this.moveToNextCell();
    node.x = x;
    node.y = y;
  }

  destroy(): void {}
}
