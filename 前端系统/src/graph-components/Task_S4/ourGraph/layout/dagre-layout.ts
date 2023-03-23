import dagre from 'dagre';
import { Node } from '../interface';
import BaseLayout from './base-layout';
import { isNumber } from '../utils/types';

export default class DagreLayout extends BaseLayout {
  public graph: any;

  public width = 300;

  public height = 300;

  public center: number[] = [0, 0];

  public rankdir: 'TB' | 'BT' | 'LR' | 'RL' = 'TB'; // 层次方向

  public align: undefined | 'UL' | 'UR' | 'DL' | 'DR' = undefined; // 节点对齐方式

  public nodesepFunc: any = undefined; // 节点水平间距

  public ranksepFunc: any = undefined; // 每一层节点之间的间距

  public nodesep = 20; // 节点水平间距

  public ranksep = 20; // 每一层节点之间的间距

  public sortByCombo = true; // 每层节点是否根据节点数据中的 comboId 进行排序，以放置同层 combo 重叠

  constructor(props: any = {}) {
    super(props);
    Object.assign(this, props);
    this.init();
  }

  init() {
    this.run();
  }

  run() {
    const graph = this.graph;
    let { width, height, margin } = graph;
    if (graph.isSubGraphLayoutStatus) {
      width = graph.subGraphPositionInfos.width;
      height = graph.subGraphPositionInfos.height;
    }

    this.width = width - margin.left - margin.right;
    this.height = height - margin.top - margin.bottom;
    this.center = [this.width / 2, this.height / 2];

    const nodes = !graph.isSubGraphLayoutStatus
      ? graph.nodes
      : graph.subGraph.nodes;
    const edges = !graph.isSubGraphLayoutStatus
      ? graph.edges
      : graph.subGraph.edges;

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

    // 初始化第三方层次布局计算函数对象
    const g = new dagre.graphlib.Graph({
      multigraph: true,
      compound: true,
    });

    const nodeSize = this.graph.radius * 2;
    let horisep: any = this.getFunc(this.nodesepFunc, this.nodesep, 10);
    let vertisep: any = this.getFunc(this.ranksepFunc, this.ranksep, 10);

    if (this.rankdir === 'LR' || this.rankdir === 'RL') {
      horisep = this.getFunc(this.ranksepFunc, this.ranksep, 10);
      vertisep = this.getFunc(this.nodesepFunc, this.nodesep, 10);
    }
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph(this);

    const comboMap: { [key: string]: boolean } = {};
    nodes.forEach((node: Node) => {
      const size = nodeSize;
      const verti = vertisep(node);
      const hori = horisep(node);
      const width = size + 2 * hori;
      const height = size + 2 * verti;
      g.setNode(node.guid, { width, height });
    });

    edges.forEach((edge: any) => {
      // dagrejs Wiki https://github.com/dagrejs/dagre/wiki#configuring-the-layout
      g.setEdge(edge.sourceId, edge.targetId, {
        weight: edge.weight || 1,
      });
    });
    dagre.layout(g);
    let coord;
    g.nodes().forEach((node: any) => {
      coord = g.node(node);
      const i = nodes.findIndex((it: Node) => it.guid === node);
      if (!nodes[i]) return;
      nodes[i].x = coord.x;
      nodes[i].y = coord.y;
    });
    // g.edges().forEach((edge: any) => {
    // coord = g.edge(edge);
    // const i = edges.findIndex(
    // (it: any) => it.sourceId === edge.v && it.targetId === edge.w
    // );
    // });

    if (graph.isSubGraphLayoutStatus) {
      // 自适应调整位置
      nodes.forEach((node: Node) => {
        node.x += graph.subGraphPositionInfos.center[0] - this.center[0];
        node.y += graph.subGraphPositionInfos.center[1] - this.center[1];
      });
      graph.refreshSubGraph({
        nodes: nodes,
        edges,
      });
    } else {
      graph.refresh({
        nodes: nodes,
        edges: edges,
      });
    }
  }

  getFunc(
    func: ((d?: any) => number) | undefined,
    value: number,
    defaultValue: number
  ): any {
    let resultFunc;
    if (func) {
      resultFunc = func;
    } else if (isNumber(value)) {
      resultFunc = () => value;
    } else {
      resultFunc = () => defaultValue;
    }
    return resultFunc;
  }

  destroy() {}
}
