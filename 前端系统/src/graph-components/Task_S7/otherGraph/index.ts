import * as d3 from 'd3';
import { merge } from 'lodash';
import Stack from 'ss-stack';

import { GraphInstance, Edge, LayoutMode, Margin, Node } from './interface';
import { isString } from './utils/types';
import { renderEdges, renderNodes } from './render';
import { setNeighbors, moveNode, linkTwoNodes, autoZoom } from './utils/common';
import { getDegree } from './utils/math';
import Layout from './layout';
import {
  edgeInfoConfig,
  nodeInfoConfig,
} from '@/graph-components/common/static-const-value';
import {
  consoleInfos,
  expandRelationShip,
  getGraphBasedSelectedRecommendNodes,
  getRecommendExpandNodes,
  hiddenElement,
  pinElement,
} from './contextMenuBehavior';
import lasso from './utils/lasso';
// import { getRecommendInitExpandNodes } from '@/utils/axios';

export default class Graph {
  // 默认配置项
  private graphInstance: GraphInstance | null = null; // 图谱对象
  private cfg: any;
  private width = 800;
  private height = 600;
  private selector = '#graph-render';
  private legendContainer = '#legend-container';
  private container: any;
  private SvgContainer: any;
  private renderSvg: any;
  private svgPainterID = 'graph-painter';
  private nodesEl: any;
  private edgesEl: any;
  public graphData: any;
  public lastData: any;
  public newNodes: any;
  public newLinks: any;

  // 最原始起源节点（即左侧列表的节点）
  private originalCaseNodeGuid = '';
  private bussinessDomain = '';

  // 初始推荐扩展的节点
  private initRecommendExpandNodes: any;
  private isExpandRecommendStatus = false; //是否处于扩展推荐的节点

  public maxTickCount = 300; // 迭代上限次数
  public preTickCount = 100; // 预计算次数
  public firstAutoZoomTickCount = 250; // 自动居中时的迭代剩余次数
  public reStartTickCount = 150; // 重启后迭代的次数
  public expandAutoZoomTickCount = 180; // 扩展时自动居中的剩余次数

  private data: any = {
    nodes: [],
    edges: [],
  };

  nodes: Node[] = [];
  edges: Edge[] = [];
  private radius = 20;
  private preventOverlapPadding = 10;
  public backgroundPadding: number = this.radius / 2; // 实体外围光圈间隙
  public labelPadding: number = (this.radius * 3.5) / 5; // 实体标签与节点之间的间距大小
  public layout: LayoutMode = 'Force';
  private curEdge: Edge | null = null;
  private center: number[] = [this.width / 2, this.height / 2];
  private margin: Margin = { top: 50, bottom: 50, left: 50, right: 50 };

  public layoutInstance: any = null;
  private keyNode: Node | null = null;
  private rootNode: Node | null = null;
  allNodeByIdMap: any = new Map();
  allLinkByIdMap: any = new Map();
  allCurNodeByIdMap: any = new Map();
  allCurLinkByIdMap: any = new Map();

  private curNodeSelection: any;
  private curLinkSelection: any;

  curRelationshipLink: Edge | null = null;
  private lastRelationshipLink: Edge | null = null;

  isTransitionStatus = false;
  isExpandStatus = false; // 扩展标记

  private lastExpandNode: Node | null = null;
  curExpandRelationshipType = 'RECOMMEND';

  // 放缩对象
  private zoomObj: any;

  private afterUpdateGraphCallback: any; // 更新图谱数据后的回调方法
  private afterOperateNodeCallback: any; // 操作节点后的回调方法
  private afterOperateEdgeCallback: any; // 操作连边后的回调方法

  private targetNodeGuid: any; // 目标节点
  private afterFindTargetNodeCallback: any; // 找到目标节点后的回调方法

  /**********************************  智能交互导航 start   *************************************/
  private recommendNodeList: Node | null = null; // 关系扩展推荐节点
  private afterChangeRecommendNodeListCallback: any; // 获取关系扩展推荐节点列表后的回调方法
  /**********************************  智能交互导航 end   *************************************/
  private callContextMenu: any; // 呼出右键菜单

  //---------------下面是力导布局增量扩展渲染效果用到的变量或方法处理
  allPreNodeByIdMap: any = new Map(); //定义之前存在于图谱上的节点
  allPreLinkByIdMap: any = new Map(); //定义之前存在于图谱上的边
  incrementNodeByIdMap: any = new Map(); //定义增量节点
  incrementLinkByIdMap: any = new Map(); //定义增量边
  //---------------上面是力导布局增量扩展渲染效果用到的变量或方法处理

  needPreTick = false; // 当拓展为第x层时为了优化增量效果需提前tick; x > 1
  isDelayShow = false; // 控制增量的出现动画
  isSpeedUp = false; //是否加速增量布局
  isFollow = false; //是否将当前跳增量布局在上一跳增量的周围
  jumpLinkedNodeMap: Map<any, any> = new Map(); //当前跳节点未key  对应的上一跳节点为value

  /**********************************  智能交互导航 start   *************************************/
  selectedNodesGuidArray: any = null; // 智能交互导航——用户所选择的要扩展的节点列表
  selectedEdgesGuidArray: any = null; // 智能交互导航——用户所选择的要扩展的连边列表
  /**********************************  智能交互导航 end   *************************************/

  /**********************************  子图布局 start   *************************************/
  private openLasso = false; // 是否开启套索
  private lassoObject: any; // 套索函数对象
  private lassoDistance = 250; // 套索判断是否为闭合曲线的距离长
  private subGraphMinWidth = 300; // 子图布局区域最小宽度
  private subGraphMinHeight = 300; // 子图布局区域最小高度
  private subGraphLayout: LayoutMode | undefined | string = undefined; // 当前圈选的子图布局方法
  private subGraphPositionInfos: any = null; // 用于记录框选时的坐标
  private subGraphInstance: any = null; // 当前子图布局的实例化对象
  private subGraphLayoutDuration = 800; // 子图布局切换过渡时间 ms
  private isSubGraphLayoutStatus = false; // 是否进行子图布局标识
  private subGraphRecord: any = []; // 圈选的子图对象数组（每个数组记录了子图图谱数据信息 subGraph{nodes,edges}、点边哈希记录subGraphNodeMap 和 subGraphEdgeMap，子图所用的布局方法layout、以及子图尺寸参数size[]、该子图是否固定 isFixed、子图下虚拟节点 virtualNode ）
  private curSubGraphRecordItem: any = null; // 当前的子图元素

  // 当前圈选的子图图谱数据
  private subGraph: any = {
    nodes: [],
    edges: [],
  };

  /**********************************  子图布局 end   *************************************/

  constructor(props = {}) {
    Object.assign(this, props);
    this.container = d3.select(this.selector);
    this.init();
  }

  init(): void {
    this.setData();
    this.render();
  }

  resize() {
    const { width, height } = this.container.node().getBoundingClientRect();
    this.width = width;
    this.height = height;
    this.render();
  }

  // 设置数据
  setData(data?: any): void {
    this.clearCache();
    this.data = data || this.data;
    if (this.data.nodes?.length) {
      this.setNodesProps(this.data.nodes);
    }
    if (this.data.edges?.length) {
      this.setEdgesProps(this.data.edges);
    }
    this.keyNode =
      typeof this.keyNode === 'object'
        ? this.keyNode
        : this.data.nodes.find((t: any) => t.guid === this.keyNode);
    this.lastExpandNode = this.keyNode;
    this.rootNode = this.keyNode;
    const values = getDegree(this.nodes, this.edges);
    this.nodes.forEach((node, i) => {
      node.degree = values[i];
    });

    // 初始化原始点边后，对当前 keyNode 通过推荐关系类型进行关系节点和边的分类
    this.keyNode.currentExpandStatus[this.curExpandRelationshipType] = true; // 由于一开始展示默认关系（即推荐关系），需要将其对应的“当前扩展状态——推荐关系”标记为true
    this.keyNode.isExpandChildren[this.curExpandRelationshipType] = true; // 同时将“是否已经请求过了该类子节点——推荐关系”标记为true（貌似没用）
  }

  // 渲染
  render(opt: any = {}) {
    if (opt.width) {
      this.width = opt.width;
      this.height = opt.height;
      this.layout = opt.layout;
    } else {
      const { width, height } = this.container.node().getBoundingClientRect();
      this.width = width || this.width;
      this.height = height || this.height;
    }
    this.center = [
      this.margin.left +
        (this.width - this.margin.left - this.margin.right) / 2,
      this.margin.top +
        (this.height - this.margin.top - this.margin.bottom) / 2,
    ];
    if (opt.data) {
      this.data = opt.data;
      this.setData();
    }
    this.container.select('.graph-draw').remove();
    this.SvgContainer = this.container
      .append('svg')
      .attr('id', this.svgPainterID)
      .classed('graph-draw', true)
      .style('stroke', '#333333')
      .attr('width', this.width)
      .attr('height', this.height);

    this.renderSvg = this.SvgContainer.append('g');

    this.cfg = {
      width: this.width,
      height: this.height,
      radius: this.radius,
      margin: this.margin,
      keyId: this.keyNode.guid,
      labelPadding: this.labelPadding,
      backgroundPadding: this.backgroundPadding,
      renderSvg: this.renderSvg,
      // 图例容器
      legendContainer: this.legendContainer,
    };

    try {
      if (this.layoutInstance) {
        this.layoutInstance.destroy();
      }
      this.layoutInstance = Layout({
        type: this.layout,
        graph: this,
      });
    } catch (e) {
      console.log('render layoutInstance出错了', e);
    }

    this.graphInstance = {
      subContainer: this.renderSvg,
      subSimulation: this.layoutInstance.simulation,
      subNodes: this.nodes,
      subEdges: this.edges,
      subNodesG: null,
      subLinksG: null,
    };

    // 绘制边
    this.edgesEl = renderEdges(this.edges, this.cfg, true);
    // 绘制节点
    this.nodesEl = renderNodes(this.nodes, this.cfg, true);

    // this.updateSVG();
    this.afterUpdateSVG();
  }

  update(opt: any) {
    this.setData(opt);
  }

  refresh(opt: any) {
    if (opt && this.layout !== 'Force') {
      if (opt) {
        this.data = {
          nodes: opt.nodes ? opt.nodes : this.nodes,
          edges: opt.edges ? opt.edges : this.edges,
        };
        this.radius = opt.radius ? opt.radius : this.radius;
      }
      this.nodes = [...this.data.nodes];
      this.edges = [...this.data.edges];
    }
    try {
      this.nodesEl
        .data(this.nodes, (d: Node) => d.guid)
        .transition()
        .duration(800)
        .attr('transform', (d: Node) => `translate(${d.x},${d.y})`);
      this.edgesEl
        .data(this.edges, (d: Node) => d.guid)
        .selectAll('path')
        .transition()
        .duration(800)
        .attr('d', (d: Edge) => {
          if (d.sourceNode && d.targetNode) {
            return `M ${d.sourceNode.x} ${d.sourceNode.y} L ${d.targetNode.x} ${d.targetNode.y}`;
          }
        });
    } catch (e) {
      console.log('节点坐标刷新这里出错', e);
    }
  }

  //清除缓存
  clearCache(): void {
    this.nodes = [];
    this.edges = [];
    this.rootNode = null;
    // this.keyNode = null;
    this.lastExpandNode = null;

    this.allNodeByIdMap.clear();
    this.allLinkByIdMap.clear();
    this.allCurNodeByIdMap.clear();
    this.allCurLinkByIdMap.clear();
    this.curNodeSelection = null;
    this.curLinkSelection = null;
    this.curRelationshipLink = null;
    this.lastRelationshipLink = null;

    this.isTransitionStatus = false;
  }

  setNodesProps(nodes: Node[]) {
    const newNodes = nodes.map((node: Node) => {
      // 初始化右键扩展的数据结构
      // const relations = Object.values(nodeInfoConfig[node.entity_type].expandRelations);
      node.r = node.r ? node.r : this.radius;
      const relations = Object.values(
        nodeInfoConfig[node.typeName].expandRelations
      );
      const currentExpandStatus: any = {};
      const isExpandChildren: any = {};
      const isExpandChildNodeMap: any = {};
      const isExpandChildLinkMap: any = {};
      const expandChildrenNode: any = {};
      const expandChildrenLink: any = {};
      for (const rel of relations) {
        currentExpandStatus[rel] = false;
        isExpandChildren[rel] = false;
        isExpandChildNodeMap[rel] = {};
        isExpandChildLinkMap[rel] = {};
        expandChildrenNode[rel] = [];
        expandChildrenLink[rel] = [];
      }
      const defNodeProp = {
        currentExpandStatus,
        isExpandChildren,
        isExpandChildNodeMap,
        isExpandChildLinkMap,
        expandChildrenNode,
        expandChildrenLink,
        isDragged: false,
        isRemember: false,
        isPinStatus: false,
        isPinRemember: false,
        label: node.displayText,
        color: nodeInfoConfig[node.typeName].color,
        textLabel: nodeInfoConfig[node.typeName].label,
        expandRelations: nodeInfoConfig[node.typeName].expandRelations,
        isFixed: false,
      };

      const newNode = merge(node, defNodeProp);
      if (this.rootNode) {
        newNode.x = this.rootNode.x;
        newNode.y = this.rootNode.y;
      }
      // 设置图谱根节点的扩展以及路径记忆属性（针对初始左侧列表数据表数据）
      if (this.keyNode.guid && newNode.guid === this.keyNode.guid) {
        newNode.isKey = true;
        this.keyNode = newNode;
        this.rememberNode(newNode);
      }
      // 添加节点哈希记录
      this.allNodeByIdMap.set(node.guid, newNode);
      // this.allCurNodeByIdMap.set(node.guid, newNode);
      return newNode;
    });

    this.nodes.push(...newNodes);
    this.newNodes = newNodes;
    return newNodes;
  }

  setEdgesProps(edges: Edge[]) {
    const newEdges = [];
    const defEdgeProp: any = {
      sourceId: '',
      targetId: '',
      sourceNode: null,
      targetNode: null,

      isRemember() {
        return (
          (this.sourceNode.isRemember || this.sourceNode.isPinRemember) &&
          (this.targetNode.isRemember || this.targetNode.isPinRemember)
        );
      },
      isRelationshipExpand: false,
      relationshipTypeExpandData: {
        nodes: null,
        edges: null,
      },
    };

    // 当前操作的节点索引
    const initIndex = this.nodes.findIndex((d) => d.guid === this.keyNode.guid);

    for (const edge of edges) {
      edge.label = edge.typeName;
      edge.color = edgeInfoConfig[edge.relationshipTypeName].color;

      const newEdge = merge(edge, defEdgeProp);
      if (isString(edge.source)) {
        newEdge.sourceNode = this.allNodeByIdMap.get(edge.source);
        newEdge.targetNode = this.allNodeByIdMap.get(edge.target);
        newEdge.sourceId = edge.source;
        newEdge.targetId = edge.target;
      } else {
        newEdge.sourceNode = this.allNodeByIdMap.get(edge.source.guid);
        newEdge.targetNode = this.allNodeByIdMap.get(edge.target.guid);
        newEdge.sourceId = edge.source.guid;
        newEdge.targetId = edge.target.guid;
        newEdge.source = edge.source.guid;
        newEdge.target = edge.target.guid;
      }
      try {
        const isCompleteEdges = setNeighbors(newEdge, this.nodes);
        // if (isCompleteEdges) {
        //   newEdges.push(newEdge);
        //   this.allCurLinkByIdMap.set(newEdge.guid, newEdge);
        // } else {
        //   this.edges.filter(e => e.guid !== edge.guid);
        // }

        // 更新连边两端节点的默认扩展关系属性（这个没必要，但第一次时需要）
        if (!this.rootNode) {
          linkTwoNodes(newEdge, this.curExpandRelationshipType);
        }

        // 记录图谱根节点的默认展示关系数据（推荐关系）
        if (
          newEdge.sourceNode.guid !== this.keyNode.guid &&
          !this.nodes[initIndex].isExpandChildNodeMap[
            this.curExpandRelationshipType
          ].hasOwnProperty(newEdge.sourceNode.guid)
        ) {
          this.nodes[initIndex].expandChildrenNode[
            this.curExpandRelationshipType
          ].push(newEdge.sourceNode);
          this.nodes[initIndex].isExpandChildNodeMap[
            this.curExpandRelationshipType
          ][newEdge.sourceNode.guid] = newEdge.sourceNode;
        }
        if (
          newEdge.targetNode.guid !== this.keyNode.guid &&
          !this.nodes[initIndex].isExpandChildNodeMap[
            this.curExpandRelationshipType
          ].hasOwnProperty(newEdge.targetNode.guid)
        ) {
          this.nodes[initIndex].expandChildrenNode[
            this.curExpandRelationshipType
          ].push(newEdge.targetNode);
          this.nodes[initIndex].isExpandChildNodeMap[
            this.curExpandRelationshipType
          ][newEdge.targetNode.guid] = newEdge.targetNode;
        }
        if (
          !this.nodes[initIndex].isExpandChildLinkMap[
            this.curExpandRelationshipType
          ][newEdge.guid]
        ) {
          this.nodes[initIndex].expandChildrenLink[
            this.curExpandRelationshipType
          ].push(newEdge);
          this.nodes[initIndex].isExpandChildLinkMap[
            this.curExpandRelationshipType
          ][newEdge.guid] = newEdge;
        }
      } catch (e) {
        // 由于从推荐关系扩展出来时不存在curExpandRelationshipType，因此发生Error
      }

      this.allLinkByIdMap.set(newEdge.guid, newEdge);
      newEdges.push(newEdge);
    }

    this.edges.push(...newEdges);
    // this.allLinks.push(...newEdges);
    this.newEdges = newEdges;
    return newEdges;
  }

  updateSVG(setAlpha = 0.3) {
    if (this.layout === 'Force') {
      this.layoutInstance.stop();
    }
    // 使用Promise进行点边的更新(注意顺序,先绘制边再绘制点)
    const updateLinkSvgPromise = new Promise((resolve, reject) =>
      this.updateLinkSvg(() => {
        this.edgesEl
          .selectAll('path')
          .attr(
            'd',
            (d: Edge) =>
              `M ${d.sourceNode.x} ${d.sourceNode.y} L ${d.targetNode.x} ${d.targetNode.y}`
          );
        resolve('连边更新完毕');
      })
    );
    const updateNodeSvgPromise = new Promise((resolve, reject) =>
      this.updateNodeSvg(() => {
        this.nodesEl.attr('transform', (d: Node) => `translate(${d.x},${d.y})`);
        resolve('节点更新完毕');
      })
    );
    Promise.all([updateLinkSvgPromise, updateNodeSvgPromise])
      .then((result) => {
        // 更新图谱数据
        if (this.layout === 'Force') {
          this.layoutInstance.restart(
            {
              nodes: this.nodes,
              edges: this.edges,
            },
            setAlpha
          );
        } else {
          this.layoutInstance.run({
            nodes: this.nodes,
            edges: this.edges,
          });
        }
        this.afterUpdateSVG();
        this.bindEvent();

        if (this.allCurNodeByIdMap.has(this.targetNodeGuid)) {
          d3.select(`#circle-text-${this.targetNodeGuid}`)
            .attr('fill', '#ff0000')
            .text('Target');
          d3.select(`#circle-virtual-background-${this.targetNodeGuid}`)
            .attr('stroke', '#FF0000')
            .style('stroke-opacity', 1);
          this.afterFindTargetNodeCallback();
        }

        // // 读取初始推荐的扩展引导节点
        // const curGraph = {
        //   nodes: [...this.allCurNodeByIdMap.values()].map(
        //     (item: any) => item.guid
        //   ),
        //   edges: [...this.allCurLinkByIdMap.values()].map(
        //     (item: any) => item.guid
        //   ),
        // };
        // getRecommendInitExpandNodes(curGraph, this.bussinessDomain)
        //   .then((res) => {
        //     // 获取前 Math.min(4, curGraph.nodes.length) 个推荐节点
        //     const maxLength =
        //       curGraph.nodes.length > 50
        //         ? 10
        //         : parseInt(curGraph.nodes.length * 0.2);
        //     console.log(res.data.content.recommendNodes);
        //     const initRecommendExpandNodes =
        //       res.data.content.recommendNodes.slice(0, Math.max(4, maxLength));
        //     // 设置徽标
        //     this.setInitRecommendNodesBadge(initRecommendExpandNodes);
        //   })
        //   .catch((err) => console.log(err));
      })
      .catch((error) => {
        console.log(error);
      });
  }

  updateNodeSvg(callback: () => any) {
    let g = this.nodesEl;
    g = g.data(this.nodes, (d: Node) => d.guid);
    let count = 0;

    if (g.exit().data().length) {
      g.exit()
        .attr('opacity', 1)
        .transition()
        .duration(300)
        .attr('opacity', 0)
        .on('end', () => {
          count++;
          if (count === g.exit().data().length) {
            // 移除当前没有数据绑定的元素，新增有数据没元素的节点
            g.exit().remove();
            g.data(this.nodes, (d: Node) => d.guid).remove();
            g = renderNodes(this.nodes, this.cfg);
            this.nodesEl = g;

            // 调用回调，以完成相关的事件绑定
            callback && callback();
          }
        });
    } else {
      g.exit().remove();
      g.data(this.nodes, (d: Node) => d.guid).remove();
      g = renderNodes(this.nodes, this.cfg);
      this.nodesEl = g;
      callback && callback();
    }
  }

  updateLinkSvg(callback: () => any) {
    let g = this.edgesEl;
    g = g.data(this.edges, (d: Edge) => d.guid);
    let count = 0;
    if (g.exit().data().length) {
      g.exit()
        .attr('opacity', 1)
        .transition()
        .duration(300)
        .attr('opacity', 0)
        .on('end', () => {
          count++;
          if (count === g.exit().data().length) {
            g.exit().remove();
            g.data(this.edges, (d: Edge) => d.guid).remove();
            this.edges.forEach((edge) => {
              d3.select(`#resolve-${edge.guid}`).remove();
            });
            g = renderEdges(this.edges, this.cfg);
            this.edgesEl = g.lower();
            callback && callback();
          }
        });
    } else {
      g.data(this.edges, (d: Edge) => d.guid).remove();
      g = renderEdges(this.edges, this.cfg);
      this.edgesEl = g.lower();
      callback && callback();
    }
  }

  afterUpdateSVG() {
    // 更新当前图谱的点边数据属性
    //---------------下面是力导布局增量扩展渲染效果用到的变量或方法处理
    this.allCurNodeByIdMap.forEach((d) => {
      const m = {
        x: d.x,
        y: d.y,
      };
      this.allPreNodeByIdMap.set(d.guid, m);
    });
    this.allPreLinkByIdMap = this.allCurLinkByIdMap;
    //---------------上面是力导布局增量扩展渲染效果用到的变量或方法处理

    // 下面这种方式添加allCurLinkByIdMap会有bug？
    // this.allCurNodeByIdMap.clear();
    // this.nodes.forEach(node => {
    //   // 貌似下面这两行没用
    //   // node.lastCoordinateX = node.x;
    //   // node.lastCoordinateY = node.y;
    //   this.allCurNodeByIdMap.set(node.guid, node);
    // });
    // this.allCurLinkByIdMap.clear();
    // this.edges.forEach(link => {
    //
    //   this.allCurLinkByIdMap.set(link.guid, link);
    // });
    this.allCurNodeByIdMap = new Map(
      this.nodes.map((node) => [node.guid, node])
    );
    this.allCurLinkByIdMap = new Map(
      this.edges.map((edge) => [edge.guid, edge])
    );

    // 扩展之后如果当前的节点启用了钉住，则对扩展出来的节点增加钉住功能
    if (this.rootNode && this.rootNode.isPinStatus) {
      this.rootNode.edges.forEach((link) => {
        if (
          link.sourceId === this.rootNode.guid &&
          this.allCurLinkByIdMap.has(link.guid)
        ) {
          this.pinRememberNode(this.allNodeByIdMap.get(link.targetId), true);
        }
        if (
          link.targetId === this.rootNode.guid &&
          this.allCurLinkByIdMap.has(link.guid)
        ) {
          this.pinRememberNode(this.allNodeByIdMap.get(link.sourceId), true);
        }
      });
    }

    // 根据当前图谱数据更新图中节点的扩展标识
    this.nodes.forEach((d) => {
      for (const relationshipTypeName in d.currentExpandStatus) {
        const existResult = this.isUnExtendable(d, relationshipTypeName);
        d.currentExpandStatus[relationshipTypeName] = existResult;
        this.allNodeByIdMap.get(d.guid).currentExpandStatus[
          relationshipTypeName
        ] = existResult;
        this.allCurNodeByIdMap.get(d.guid).currentExpandStatus[
          relationshipTypeName
        ] = existResult;
      }
    });

    this.bindEvent();
    this.afterUpdateGraphCallback &&
      this.afterUpdateGraphCallback({
        nodesNum: this.allCurNodeByIdMap.size,
        edgesNum: this.allCurLinkByIdMap.size,
        allCurNodeByIdMap: this.allCurNodeByIdMap,
        allCurLinkByIdMap: this.allCurLinkByIdMap,
      });

    // 恢复所有节点样式
    d3.selectAll('.circle-virtual-background').style('stroke-opacity', 0);
    // 高亮当前
    d3.select(`#circle-virtual-background-${this.rootNode.guid}`).style(
      'stroke-opacity',
      0.35
    );
  }

  // 进行交互事件绑定
  bindEvent() {
    // 禁用浏览器原始右键菜单
    document.oncontextmenu = () => false;

    // 绑定套索
    if (!this.lassoObject) {
      this.initLasso();
      this.SvgContainer.call(this.lassoObject);
      this.SvgContainer.select('g.lasso').style('visibility', 'hidden'); // 初始化为隐藏
    }
    if (!this.zoomObj) {
      // 绑定放缩并禁止双击放缩
      this.initZoom();
      this.SvgContainer.call(this.zoomObj).on('dblclick.zoom', null);
    }

    //绑定点击事件
    this.SvgContainer.on('click', (event: any) => {
      if (event.target.localName === 'svg') {
        // console.log("点击到了svg画布");
        d3.select('.v-contextmenu').style('visibility', 'hidden');
      }
    });

    // 绑定节点事件
    if (this.nodesEl) {
      this.bindEventOfNodes();
    }

    // 绑定连边事件
    if (this.edgesEl) {
      this.bindEventOfEdges();
    }
  }

  // 放缩事件
  initZoom() {
    this.zoomObj = d3.zoom();
    this.zoomObj
      .scaleExtent([1 / 10, 8])
      .filter((event: any) => {
        // 是否滚轮事件，当为滚轮时才放缩
        return event instanceof WheelEvent;
      })
      .on('zoom', (event: any) => {
        // if (!this.openLasso) {
        this.zoomProcessEvent(event);
        // }
      });
  }

  zoomProcessEvent(event: any) {
    this.renderSvg.attr(
      'transform',
      d3.zoomTransform(this.SvgContainer.node())
    );
  }

  /**********************************  子图布局 start   *************************************/

  /**
   * 初始化套索钩子对象
   */
  initLasso() {
    this.lassoObject = lasso()
      .closePathSelect(true)
      .closePathDistance(this.lassoDistance)
      .targetArea(this.SvgContainer)
      .on('start', (event: any) => {
        // 尚未开启圈选时不作处理
        if (!this.openLasso) {
          return;
        }
      })
      .on('draw', (event: any) => {
        // 尚未开启圈选时不作处理
        if (!this.openLasso) {
          return;
        }

        // 高亮可能选择的节点
        const possibleItemsSet = new Set(
          this.lassoObject
            .possibleItems()
            .data()
            .map((d: Node) => d.guid)
        );
        d3.selectAll('.circle-virtual-background').style(
          'stroke-opacity',
          (d: any) => (possibleItemsSet.has(d.guid) ? 0.35 : 0)
        );
        // event.stopPropagation();
      })
      .on('end', (event: any) => {
        // 尚未开启圈选时不作处理
        if (!this.openLasso) {
          return;
        }
        this.lassoProcessEvent();
        // event.stopPropagation();
      });

    // 初始绑定
    this.lassoObject.items(this.renderSvg.selectAll('g.node'));
  }

  /**
   * 套索处理函数，用于捕获圈选的节点
   */
  lassoProcessEvent() {
    // 获取圈选点边
    const subGraphNodeSet = new Set();
    const selectedNodeList = this.lassoObject.selectedItems().data();
    selectedNodeList.forEach((d: Node) => {
      subGraphNodeSet.add(d.guid);
    });

    this.subGraph.nodes = this.nodes.filter((d: Node) =>
      subGraphNodeSet.has(d.guid)
    );
    this.subGraph.edges = this.edges.filter((d: Edge) => {
      return subGraphNodeSet.has(d.sourceId) || subGraphNodeSet.has(d.targetId);
    });

    // 更新样式
    if (subGraphNodeSet.size) {
      d3.selectAll('.circle-virtual-background').style(
        'stroke-opacity',
        (d: any) => (subGraphNodeSet.has(d.guid) ? 0.35 : 0)
      );
    }

    // 更新框选子图的坐标信息
    this.subGraphPositionInfos = this.calculateGraphBound(this.subGraph);
  }

  /**
   * 看是否需要将子图布局节点进行恢复（即取消固定）
   */
  deleteVirtualNodes() {
    const virtualNodesGuidList: any[] = [];
    this.nodes.forEach((d: Node) => {
      if (d.isFixed || d.isDragged || d.isPinRemember || d.isRemember) {
        return;
      }
      d.fx = null;
      d.fy = null;
    });
    this.subGraphRecord.forEach((item: any) => {
      virtualNodesGuidList.push(item.virtualNode.guid);
      if (item.isFixed) {
        item.subGraph.nodes.forEach((node: Node) => {
          node.fx = node.x;
          node.fy = node.y;
        });
        // virtualNodesGuidList.push(item.virtualNode.guid);
      }
    });
    // 去除子图下的虚拟节点
    this.nodes = this.nodes.filter(
      (d: Node) => virtualNodesGuidList.indexOf(d.guid) === -1
    );
    // 重新绑定父容器力仿真器节点
    this.layoutInstance.simulation.nodes(this.nodes);
  }

  /**********************************  子图布局 end   *************************************/

  // 拖拽节点事件
  drag() {
    return d3
      .drag()
      .on('start', (event: any, d: Node) => {
        // 解除因扩展而做的临时固定
        this.nodes.forEach((t) => {
          if (!this.isFixedPosition(t)) {
            d.fx = null;
            d.fy = null;
          }
        });

        /**********************************  子图布局 start   *************************************/

        // 拖拽时检查是否需要取消子图的固定
        this.deleteVirtualNodes();
        /**********************************  子图布局 end   *************************************/
        if (this.layout === 'Force') {
          if (!event.active) {
            /****************    拖拽时只影响附近的节点 start    ********************/
            // this.layoutInstance.cleanForce();
            /****************    拖拽时只影响附近的节点 end    ********************/
            this.layoutInstance.simulation.alphaTarget(0.1).restart();
          }
          d.fx = d.x;
          d.fy = d.y;
        } else {
          d.x = event.x;
          d.y = event.y;
          moveNode(d);
        }
      })
      .on('drag', (event: any, d: Node) => {
        if (this.layout === 'Force') {
          d.fx = event.x;
          d.fy = event.y;
        } else {
          d.x = event.x;
          d.y = event.y;
          moveNode(d);
        }
      })
      .on('end', (event: any, d: Node) => {
        d.isDragged = true;
        if (this.layout === 'Force') {
          if (!event.active) {
            /****************    拖拽时只影响附近的节点 start    ********************/
            // this.layoutInstance.reSetForce();
            /****************    拖拽时只影响附近的节点 end    ********************/
            this.layoutInstance.simulation.alphaTarget(0);
            // d.fx = null;
            // d.fy = null;
          }
        } else {
          d.x = event.x;
          d.y = event.y;
          moveNode(d);
        }
      });
  }

  // 绑定节点事件
  bindEventOfNodes() {
    this.nodesEl
      .on('mouseenter.hover', (event: any, d: Node) => {
        // 淡化所有
        d3.selectAll(`.node`).attr('opacity', 0.25);
        d3.selectAll(`.edge`).attr('opacity', 0.25);

        // 高亮当前光圈
        d3.select(`#node-${d.guid}`).attr('opacity', d.isHidden ? 0.25 : 1);
        d.edges.forEach((e: Edge) => {
          d3.select(`#edge-${e.guid}`).attr('opacity', 1);
          d3.select(`#node-${e.sourceId}`).attr('opacity', 1);
          d3.select(`#node-${e.targetId}`).attr('opacity', 1);
        });

        d3.select(event.target)
          .style('cursor', 'pointer')
          .select(`#circle-virtual-background-${d.guid}`)
          .style('stroke-opacity', 0.35);

        event.stopPropagation();
      })
      .on('mouseleave.hover', (event: any, d: Node) => {
        // 恢复所有
        d3.selectAll(`.node`).attr('opacity', (d) => (d.isHidden ? 0.25 : 1));
        d3.selectAll(`.edge`).attr('opacity', (d) => (d.isHidden ? 0.25 : 1));

        // 如果当前节点不是点击的节点，则取消高亮光圈
        if (!this.keyNode || d.guid !== this.keyNode.guid) {
          d3.select(`#circle-virtual-background-${d.guid}`).style(
            'stroke-opacity',
            0
          );
        }
        event.stopPropagation();
      })
      .on('click', (event: any, d: Node) => {
        console.log('点击了节点', d);
        d3.select('.v-contextmenu').style('visibility', 'hidden');
        this.keyNode = d;
        this.afterOperateNodeCallback && this.afterOperateNodeCallback();
        d3.selectAll('.circle-virtual-background').style(
          'stroke-opacity',
          (t: Node) => (this.keyNode.guid === t.guid ? 0.35 : 0)
        );
      })
      .on('contextmenu', (event: any, d: Node) => {
        // 解除因扩展而做的临时固定
        this.nodes.forEach((t) => {
          if (!this.isFixedPosition(t)) {
            d.fx = null;
            d.fy = null;
          }
        });

        // 恢复之前因某些操作而固定的节点
        // this.reSetForceFxFy(this.rootNode);

        // 暂时当前固定
        if (this.layout === 'Force') {
          d.fx = d.x;
          d.fy = d.y;
        }

        // 取消圈选视图
        if (this.openLasso) {
          this.openLasso = false;
          this.subGraph = {
            nodes: [],
            edges: [],
          };

          this.SvgContainer.select('g.lasso').style('visibility', 'hidden');
          // 恢复所有节点样式
          d3.selectAll('.circle-virtual-background').style('stroke-opacity', 0);
        }
        // 高亮当前
        d3.select(`#circle-virtual-background-${d.guid}`).style(
          'stroke-opacity',
          0.35
        );
        d3.select('.v-contextmenu').style('visibility', 'visible');
        this.callContextMenu &&
          this.callContextMenu('nodeContextMenu', event, d);
      })
      .call(this.drag());
  }

  // 绑定连边事件
  bindEventOfEdges() {
    this.edgesEl
      .on('mouseenter.hover', (event: any, d: Edge) => {
        // d3.select(`#edge-${d.guid}`)
        //   .style('cursor', 'pointer')
        event.stopPropagation();
      })
      .on('mouseleave.hover', (event: any, d: Edge) => {
        event.stopPropagation();
      })
      .on('click', (event: any, d: Edge) => {
        console.log('点击了连边', d);
        d3.select('.v-contextmenu').style('visibility', 'hidden');
      })
      .on('contextmenu', (event: any, d: Edge) => {
        // console.log("呼出连边右键菜单", d);
        d3.select('.v-contextmenu').style('visibility', 'visible');
        this.callContextMenu &&
          this.callContextMenu('edgeContextMenu', event, d);
      });
  }

  /**
   * 路径记忆统一入口
   * @param {Object} handleNode [路径记忆的目标节点]
   */
  rememberNode(handleNode: Node | string): void {
    if (typeof handleNode === 'string') {
      this.allNodeByIdMap.get(handleNode).isRemember = true;
    } else {
      handleNode.isRemember = true;
    }
  }

  // 过滤非路径记忆的点边
  filterNoRemember(): void {
    this.nodes = this.nodes.filter(
      (node) => node.isRemember || node.isPinRemember
    );
    this.edges = this.edges.filter((edge) => edge.isRemember());

    // 更新图谱可见数据
    this.allCurNodeByIdMap = new Map(
      this.nodes.map((node) => [node.guid, node])
    );
    this.allCurLinkByIdMap = new Map(
      this.edges.map((edge) => [edge.guid, edge])
    );
  }

  updateLayout(layoutType: LayoutMode) {
    this.layoutInstance.destroy();
    this.layout = layoutType;
    const nodes = this.nodes;
    for (const node of nodes) {
      node.fx = null;
      node.fy = null;
    }
    this.layoutInstance = Layout({
      type: layoutType,
      graph: this,
    });
  }

  // 右键菜单操作后的反馈
  contextMenuBehavior(contextMenuInfos: any) {
    // 恢复因某些操作而固定的节点
    if (!this.isFixedPosition(this.rootNode)) {
      this.rootNode.fx = null;
      this.rootNode.fy = null;
    }
    // this.reSetForceFxFy(this.rootNode);

    // 确定操作的元素数据
    let dataItem;
    if (contextMenuInfos.contextMenuType === 'nodeContextMenu') {
      dataItem = this.allNodeByIdMap.get(contextMenuInfos.dataId) as Node;
      // dataItem = this.nodes.find(d => d.guid === contextMenuInfos.dataId) as Node;
    } else {
      dataItem = this.allLinkByIdMap.get(contextMenuInfos.dataId) as Edge;
      // dataItem = this.edges.find(d => d.guid === contextMenuInfos.dataId) as Edge;
    }

    this.keyNode = dataItem;
    this.rootNode = dataItem;
    this.afterOperateNodeCallback && this.afterOperateNodeCallback();
    d3.selectAll('.circle-virtual-background').style(
      'stroke-opacity',
      (t: Node) => (this.keyNode.guid === t.guid ? 0.35 : 0)
    );

    // 进行右键菜单操作
    switch (contextMenuInfos.operateType) {
      case 'consoleInfos':
        consoleInfos(
          dataItem,
          contextMenuInfos.contextMenuType,
          contextMenuInfos.params
        );
        // 同时进行自动居中
        // console.log("autoZoom");
        // this.isExpandRecommendStatus = true;
        this.runAutoZoom();
        break;
      case 'hiddenData':
        dataItem.isHidden = !dataItem.isHidden;
        dataItem.edges.forEach((e) => {
          e.isHidden = dataItem.isHidden;
        });
        hiddenElement(
          dataItem,
          contextMenuInfos.contextMenuType,
          contextMenuInfos.params
        );
        break;
      case 'expandData':
        // 用于暂定取消框选后的力迭代过程
        this.layoutInstance.simulation.stop();

        expandRelationShip(
          dataItem,
          contextMenuInfos.contextMenuType,
          contextMenuInfos.params,
          this
        );
        break;
      /**********************************  智能交互导航 start   *************************************/
      case 'getRecommendExpandNodes':
        // 获取推荐扩展节点列表
        this.rootNode = dataItem;
        getRecommendExpandNodes(
          dataItem,
          contextMenuInfos.contextMenuType,
          contextMenuInfos.params,
          this
        );
        break;
      /**********************************  智能交互导航 end   *************************************/
      case 'pinElement':
        pinElement(
          dataItem,
          contextMenuInfos.contextMenuType,
          contextMenuInfos.params,
          this
        );
        break;
    }
  }

  /**
   * 钉住记忆统一入口
   * @param {Object} handelNode [钉住记忆的目标节点]
   * @param {boolean} pinStatus [设置钉住记忆的状态]
   */
  pinRememberNode(handelNode: Node, pinStatus: boolean) {
    handelNode.isPinRemember = pinStatus;
  }

  /**
   *  判断节点对应扩展关系下的子节点是否全部在图中，用于动态渲染右键扩展菜单项
   * @param {Object} node [待判断的节点数据]
   * @param {string} relationshipTypeName [扩展关系]
   * @returns {boolean} 但会结果为true表示已经全部扩展了，菜单项表示“已扩展”，否则表示“可扩展”
   */
  isUnExtendable(node: Node, relationshipTypeName: string) {
    // 判断结果标识符
    let result = false;

    // 如果当前节点未被记忆说明还没有扩展过的，因此 node 的扩展节点肯定不在图中，可以扩展
    if (!node.isRemember || !node.isExpandChildren[relationshipTypeName]) {
      result = true;
    } else {
      // 如果被记忆了则说明已经扩展过一次，那么就判断是否有东西
      // 从相关节点出发看图谱上是否有可扩展的东西
      const balanceNodes = node.expandChildrenNode[relationshipTypeName].filter(
        (d) => d.guid !== node.guid
      ); // 先过滤掉本身
      balanceNodes.forEach((childNode) => {
        // 如果发现当前图谱上有不存在的节点，则表示还可以扩展
        if (!this.allCurNodeByIdMap.has(childNode.guid)) {
          result = true;
        }
      });
      // 从相关连边出发看图谱上是否有可扩展的东西
      const balanceLinks = node.expandChildrenLink[relationshipTypeName];
      balanceLinks.forEach((childLink) => {
        // 如果发现当前图谱上有不存在的连边，则表示还可以扩展
        if (!this.allCurLinkByIdMap.has(childLink.guid)) {
          result = true;
        }
      });
    }
    return !result;
  }

  /**
   * 获取图谱上当前节点的可见的邻居节点数组
   * @param handleNode
   * @returns {*}
   */
  getVisualNeighbors(handleNode: Node) {
    return handleNode.edges.filter(
      (d) =>
        this.allCurLinkByIdMap.has(d.guid) &&
        this.allCurNodeByIdMap.has(d.sourceNode.guid) &&
        this.allCurNodeByIdMap.has(d.targetNode.guid)
    ).length;
  }

  // 恢复因某些操作而固定的节点
  reSetForceFxFy(guid: string) {
    const node = this.allCurNodeByIdMap.get(guid);
    if (
      node &&
      (this.layout !== 'Force' || !(node?.isDragged || node?.isFixed))
    ) {
      node.fx = null;
      node.fy = null;
    }

    // 同时进行自动居中
    this.runAutoZoom();
  }

  /**********************************  智能交互导航 start   *************************************/
  /**
   * 根据用户所选择的推荐节点获取相应的图谱数据
   * @param selectedRecommendInfos  用户选择的要扩展的推荐节点和相关连边guid数组
   */
  getGraphDataBasedSelectedRecommendNodes(selectedRecommendInfos: any) {
    this.selectedNodesGuidArray = [...selectedRecommendInfos.relatedNodes];
    this.selectedEdgesGuidArray = [...selectedRecommendInfos.relatedEdges];
    getGraphBasedSelectedRecommendNodes(this.rootNode, this);
  }

  /**********************************  智能交互导航 end   *************************************/

  /**********************************  子图布局 start   *************************************/

  /**
   * 调用圈选，获取圈选的节点列表
   * @param status 圈选标志，true表示圈选，false表示取消
   */
  callBrushHandle(status = false): void {
    this.openLasso = status;

    // true 唤出圈选
    if (this.openLasso) {
      // console.log('打开圈选');

      // 更新套索绑定的数据集
      this.lassoObject.items(this.renderSvg.selectAll('g.node'));

      // 显示套索
      this.SvgContainer.select('g.lasso').style('visibility', 'visible');
    } else {
      // console.log('取消圈选');

      // 看是否需要将先前的子图布局节点进行恢复（取消固定）
      this.deleteVirtualNodes();

      // 恢复父层力引导
      // 法0
      this.layoutInstance.simulation.alpha(0.005).restart();

      // // 法一 直接重启力仿真器
      // this.layoutInstance.subGraphLayoutRestart({
      //   nodes: this.nodes,
      //   edges: this.edges,
      // });

      // // 法二
      // this.layoutInstance.simulation.stop();
      // this.layoutInstance.simulation.alpha(0.3).tick(300);
      // this.layoutInstance.moveNode(
      //   this.nodesEl,
      //   true,
      //   this.subGraphLayoutDuration
      // );
      // this.layoutInstance.moveLink(
      //   this.edgesEl,
      //   true,
      //   this.subGraphLayoutDuration
      // );

      // 恢复子图数据
      this.subGraph = {
        nodes: [],
        edges: [],
      };

      // 恢复套索样式
      this.SvgContainer.select('g.lasso').style('visibility', 'hidden');

      // 恢复节点样式
      d3.selectAll('.circle-virtual-background').style('stroke-opacity', 0);

      return;
    }
  }

  /**
   * 对子图执行布局
   * @param subGraphLayout
   */
  runSubGraphLayout(subGraphLayout: [string, LayoutMode]): void {
    if (!this.openLasso) {
      // console.log('尚未框选');
      return;
    }
    // console.log('执行布局');

    // 开启子图布局标志
    this.isSubGraphLayoutStatus = true;

    // 看是否需要将先前的布局节点进行恢复（取消固定）
    this.deleteVirtualNodes();

    // 停止先前的力引导布局仿真器
    if (this.layout === 'Force') {
      this.layoutInstance.stop();
    }

    // 实例化布局模型并执行布局
    this.subGraphLayout = subGraphLayout;

    if (this.subGraphLayout === 'Force') {
      this.runAutoZoom();
      // 当子图布局为力引导布局时，
      // 如子图节点之前存在了子图布局的固定坐标，则取消原先的固定坐标，并重启父容器的力引导布局
      this.nodes.forEach((d: Node) => {
        // 将非固定的取消固定
        if (!(d.isDragged || d.isFixed || d.isPinRemember || d.isRemember)) {
          d.fx = null;
          d.fy = null;
        }
      });

      // 去除子图下的虚拟节点
      const virtualNodesGuidList: any[] = [];
      this.subGraphRecord.forEach((item: any) => {
        if (!item.isFixed) {
          virtualNodesGuidList.push(item.virtualNode.guid);
        }
      });
      this.nodes = this.nodes.filter(
        (d: Node) => virtualNodesGuidList.indexOf(d.guid) === -1
      );

      // 设置中心力为原始的中心力
      // this.layoutInstance.simulation.force(
      //   "center",
      //   d3
      //     .forceCenter()
      //     .x(this.width / 2)
      //     .y(this.height / 2)
      // );

      // 重启父容器的力仿真器
      this.layoutInstance.simulation.nodes(this.nodes);
      // 手动调用tick，损耗由于之前添加中心力而触发的位置偏移
      this.layoutInstance.simulation.tick(
        Math.floor(
          this.layoutInstance.simulation.alpha() /
            this.layoutInstance.simulation.alphaDecay()
        )
      );

      // // 法0 执行过渡变化
      // this.layoutInstance.moveNode(
      //   this.nodesEl,
      //   true,
      //   this.subGraphLayoutDuration
      // ); // 对节点进行过渡变换
      // this.layoutInstance.moveLink(
      //   this.edgesEl,
      //   true,
      //   this.subGraphLayoutDuration
      // ); // 对连边进行过渡变换

      // // 法一 类似增量布局，减缓衰减，动态变化
      this.nodes.forEach((d: Node) => {
        // 将非固定的取消固定
        if (!(d.isDragged || d.isFixed || d.isPinRemember || d.isRemember)) {
          d.fx = null;
          d.fy = null;
        }
      });
      this.layoutInstance.simulation
        .alphaTarget(0)
        // .alphaMin(0.0008)
        .alphaDecay(0.0001)
        .alpha(0.01)
        // .velocityDecay(0.7)
        .restart();

      return;
    }

    // 子图布局为其他布局时，定义子图布局记录对象
    const subGraphRecordItem = {
      subGraph: {
        nodes: [...this.subGraph.nodes],
        edges: [...this.subGraph.edges],
      },
      subGraphNodeMap: new Map(),
      subGraphEdgeMap: new Map(),
      layout: subGraphLayout,
      size: this.subGraphPositionInfos,
      isFixed: false,
      virtualNode: null,
    };
    this.curSubGraphRecordItem = subGraphRecordItem;
    this.subGraphRecord.push(subGraphRecordItem);

    // 实例化模型并进行布局计算
    this.subGraphInstance = Layout({
      type: subGraphRecordItem.layout,
      graph: this,
    });

    // 如果先前布局为力引导布局，则添加虚拟子图节点
    if (this.layout === 'Force') {
      // 获取布局之后的中心及半径，用于构造虚拟节点的坐标和半径
      const subGraphLayoutinfos: any = this.getCircumcircle(
        subGraphRecordItem.subGraph.nodes
      );
      // console.log(subGraphLayoutinfos);
      // 虚拟节点数据定义
      const virtualNode: any = {
        // 基本属性
        guid: this.generateUUID(),
        // 坐标参数
        fx: subGraphLayoutinfos.centerX,
        fy: subGraphLayoutinfos.centerY,
        r: (subGraphLayoutinfos.radius / 2) * 2.1,
        edges: [], // 邻居连边
      };
      subGraphRecordItem.virtualNode = virtualNode;

      this.nodes.push(virtualNode);
    }

    // 如果初始布局为力引导布局，则在该次子图布局后再执行一次力引导布局restart
    setTimeout(() => {
      if (this.layout === 'Force') {
        // console.log('次后执行力引导布局');
        // 取消中心力，目的是使得子图布局后，其他节点不受到中心力的影响
        // 即子图布局仅影响子图周围的节点
        // this.layoutInstance.simulation.force("center", null);
        // 刷新布局
        this.layoutInstance.subGraphLayoutRestart({
          nodes: this.nodes,
          edges: this.edges,
        });
      }
    }, this.subGraphLayoutDuration);
  }

  /**
   * 子图布局渲染方法，进行坐标刷新
   * @param resultGraph 布局结果数据
   */
  refreshSubGraph(resultGraph: any = {}): void {
    // 更新相关数据的坐标参数
    resultGraph.nodes.forEach((d: Node) => {
      this.curSubGraphRecordItem.subGraphNodeMap.set(d.guid, d);
    });
    resultGraph.edges.forEach((d: Edge) => {
      this.curSubGraphRecordItem.subGraphEdgeMap.set(d.guid, d);
    });
    let item: any = null;
    this.nodes.forEach((d: Node) => {
      item = this.curSubGraphRecordItem.subGraphNodeMap.get(d.guid);
      if (item) {
        d.x = item.x;
        d.y = item.y;
        d.fx = item.x; // 用于固定，防止父容器的力引导进行修改
        d.fy = item.y; // 用于固定，
      }
    });

    // 注意data可能未与nodes、edges同步(因此需要注释掉)
    // this.nodes = [...this.data.nodes];
    // this.edges = [...this.data.edges];

    // 进行布局过渡
    this.nodesEl
      .transition()
      .duration(this.subGraphLayoutDuration)
      .attr('transform', (d: Node) => `translate(${d.x},${d.y})`);
    this.edgesEl
      .selectAll('path')
      .transition()
      .duration(this.subGraphLayoutDuration)
      .attr(
        'd',
        (d: Edge) =>
          `M ${d.sourceNode.x} ${d.sourceNode.y} L ${d.targetNode.x} ${d.targetNode.y}`
      );
  }

  /**
   * 固定子图布局
   * 对上一次操作的子图图谱进行坐标固定
   */
  callFixSubGraph(): void {
    if (!this.openLasso) {
      // console.log('尚未圈选');
      return;
    }
    if (!this.subGraphLayout) {
      // console.log('尚未选择布局');
      return;
    }
    // 设置固定
    this.curSubGraphRecordItem.isFixed = true;
    this.curSubGraphRecordItem.subGraph.nodes.forEach((d: Node) => {
      d.isFixed = true;
      d.fx = d.x;
      d.fy = d.y;
    });
  }

  /**
   * 根据图谱数据上节点坐标，计算所其布局视图尺寸以及中心
   * @param graphData 图谱数据
   */
  calculateGraphBound(graphData: any): any {
    const result: any = {};
    // // 法一 直接计算
    // let xMax = -Infinity;
    // let xMin = +Infinity;
    // let yMax = -Infinity;
    // let yMin = +Infinity;
    // const pointArr: any[] = [];
    // graphData.nodes.forEach((node: any) => {
    //   pointArr.push([node.x, node.y]);
    //   xMax = node.x > xMax ? node.x : xMax;
    //   xMin = node.x < xMin ? node.x : xMin;
    //   yMax = node.y > yMax ? node.y : yMax;
    //   yMin = node.y < yMin ? node.y : yMin;
    // });
    // result.width = Math.max(xMax - xMin, this.subGraphMinWidth);
    // result.height = Math.max(yMax - yMin, this.subGraphMinHeight);

    // // 法二 计算外接圆
    const { centerX, centerY, radius } = this.getCircumcircle(graphData.nodes);
    result.width = Math.max(2 * radius, this.subGraphMinWidth);
    result.height = Math.max(2 * radius, this.subGraphMinHeight);
    result.radius = radius;
    result.center = [centerX, centerY];
    return result;
  }

  /**
   * 根据任意一组节点确定这组节点所组成的外接圆的圆心与半径
   * @param points 节点数组
   */
  getCircumcircle(points: any) {
    if (points.length === 0) {
      return {
        centerX: this.width / 2,
        centerY: this.height / 2,
        radius: Math.min(this.width, this.height) / 2,
      };
    } else if (points.length === 1) {
      return {
        centerX: points[0].x,
        centerY: points[0].y,
        radius: Math.min(this.width, this.height) / 2,
      };
    } else if (points.length === 2) {
      return {
        centerX: (points[0].x + points[1].x) / 2,
        centerY: (points[0].y + points[1].y) / 2,
        radius: Math.hypot(
          points[0].x - points[1].x,
          points[0].y - points[1].y
        ),
      };
    }

    // 计算几何重心
    const pointArr: any[] = [];
    points.forEach((node: Node) => {
      pointArr.push([node.x, node.y]);
    });
    const polygonHull = d3.polygonCentroid(d3.polygonHull(pointArr));
    const centerX = polygonHull[0];
    const centerY = polygonHull[1];

    // 计算半径
    const radius = d3.max(
      points.map((d: Node) => Math.hypot(d.x - centerX, d.y - centerY))
    );

    return {
      centerX,
      centerY,
      radius,
    };
  }

  /**
   * 生成新的uuid
   * @returns 生成的uuid
   */
  generateUUID() {
    const s: any[] = [];
    const hexDigits = '0123456789abcdef';
    for (let i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = '4';
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = '-';
    return s.join('');
  }

  /**********************************  子图布局 end   *************************************/

  /**
   * 整体布局切换，基于子图布局框架修改
   * @param graphLayout
   */
  runGraphLayout(graphLayout: [string, LayoutMode]): void {
    this.subGraph.nodes = [...this.nodes];
    this.subGraph.edges = [...this.edges];
    this.subGraphPositionInfos = this.calculateGraphBound(this.subGraph);

    // 开启子图布局标志
    this.isSubGraphLayoutStatus = true;

    // 看是否需要将先前的布局节点进行恢复（取消固定）
    this.deleteVirtualNodes();

    // 停止先前的力引导布局仿真器
    if (this.layout === 'Force') {
      this.layoutInstance.stop();
    }

    // 实例化布局模型并执行布局
    this.subGraphLayout = graphLayout;
    if (this.subGraphLayout === 'Force') {
      // 当子图布局为力引导布局时，取消固定坐标，并重启父容器的力引导布局
      this.nodes.forEach((d: Node) => {
        // 将非固定的取消固定
        if (!(d.isDragged || d.isFixed || d.isPinRemember || d.isRemember)) {
          d.fx = null;
          d.fy = null;
        }
      });

      // 去除子图下的虚拟节点
      const virtualNodesGuidList: any[] = [];
      this.subGraphRecord.forEach((item: any) => {
        if (!item.isFixed) {
          virtualNodesGuidList.push(item.virtualNode.guid);
        }
      });
      this.nodes = this.nodes.filter(
        (d: Node) => virtualNodesGuidList.indexOf(d.guid) === -1
      );

      //  设置中心力为原始的中心力
      this.layoutInstance.simulation.force(
        'center',
        d3
          .forceCenter()
          .x(this.width / 2)
          .y(this.height / 2)
      );

      // 重启父容器的力仿真器
      this.layoutInstance.simulation.nodes(this.nodes);
      // 调用tick，损耗由于之前添加中心力而触发的位置偏移
      this.layoutInstance.simulation.tick(
        Math.floor(
          this.layoutInstance.simulation.alpha() /
            this.layoutInstance.simulation.alphaDecay()
        )
      );

      // this.layoutInstance.moveNode(
      //   this.nodesEl,
      //   true,
      //   this.subGraphLayoutDuration
      // ); // 对节点进行过渡变换
      // this.layoutInstance.moveLink(
      //   this.edgesEl,
      //   true,
      //   this.subGraphLayoutDuration
      // ); // 对连边进行过渡变换

      // 类似增量布局，减缓衰减
      this.nodes.forEach((d: Node) => {
        // 将非固定的取消固定
        if (!(d.isDragged || d.isFixed || d.isPinRemember || d.isRemember)) {
          d.fx = null;
          d.fy = null;
        }
      });
      this.layoutInstance.simulation
        .alphaTarget(0)
        .alphaMin(0.0008)
        .alphaDecay(0.0001)
        .alpha(0.01)
        .velocityDecay(0.7)
        .restart();

      return;
    }

    // 子图布局为其他布局时，定义子图布局记录对象
    const subGraphRecordItem = {
      subGraph: {
        nodes: [...this.subGraph.nodes],
        edges: [...this.subGraph.edges],
      },
      subGraphNodeMap: new Map(),
      subGraphEdgeMap: new Map(),
      layout: graphLayout,
      size: this.subGraphPositionInfos,
      isFixed: false,
      virtualNode: null,
    };

    this.curSubGraphRecordItem = subGraphRecordItem;
    this.subGraphRecord.push(subGraphRecordItem);

    // 实例化模型并进行布局计算
    this.subGraphInstance = Layout({
      type: subGraphRecordItem.layout,
      graph: this,
    });

    // 如果先前布局为力引导布局，则添加虚拟子图节点
    if (this.layout === 'Force') {
      // 获取布局之后的中心及半径
      const subGraphLayoutinfos: any = this.getCircumcircle(
        subGraphRecordItem.subGraph.nodes
      );

      // 虚拟节点数据字段
      const virtualNode: any = {
        // 基本属性
        guid: this.generateUUID(),
        // 坐标参数
        fx: subGraphLayoutinfos.centerX,
        fy: subGraphLayoutinfos.centerY,
        r: (subGraphLayoutinfos.radius / 2) * 1.5,
        edges: [], // 邻居连边
      };
      subGraphRecordItem.virtualNode = virtualNode;
    }

    // 如果初始布局为力引导布局，则次后再执行一次初始力引导布局
    setTimeout(() => {
      if (this.layout === 'Force') {
        // 取消中心力
        this.layoutInstance.simulation.force('center', null);
        // 刷新布局
        this.layoutInstance.subGraphLayoutRestart({
          nodes: this.nodes,
          edges: this.edges,
        });
      }
    }, this.subGraphLayoutDuration);
  }

  /**
   * 获取两节点之间的最短路径
   * @param sourceNodeGuid 操作的一个节点guid
   * @param targetNodeGuid 操作的另个节点guid
   * @returns
   */
  findShortestPath(
    sourceNodeGuid: string,
    targetNodeGuid: string = this.originalCaseNodeGuid
  ): any {
    if (sourceNodeGuid === targetNodeGuid) {
      return { edges: [], nodes: [sourceNodeGuid] };
    }
    const paths: any[] = [];
    const visited = new Map<string, boolean>();
    const mainStack = new Stack<any>();
    const neighborStack = new Stack<any[]>();

    const source = this.allCurNodeByIdMap.get(sourceNodeGuid);
    const target = this.allCurNodeByIdMap.get(targetNodeGuid);

    const neighborEdgesByIdMap = new Map();
    this.nodes.forEach((node: any) => {
      // 更新edges
      node.edges = node.edges.filter((edge: any) =>
        this.allCurLinkByIdMap.has(edge.guid)
      );

      // 构造节点临边记录，注意这里的source需要设置为node.guid
      const value = node.edges.map((edge: any) => {
        return {
          edge: edge,
          source: node.guid,
          target: edge.targetId === node.guid ? edge.sourceId : edge.targetId,
        };
      });
      neighborEdgesByIdMap.set(node.guid, value);
    });

    mainStack.push({
      source: null,
      edge: null,
      target: source.guid,
    });
    visited.set(source.guid, true);
    neighborStack.push(
      neighborEdgesByIdMap
        .get(source.guid)
        .filter((edge: Edge) => !visited.get(edge.target))
    );

    while (!mainStack.isEmpty()) {
      const neighbors = neighborStack.pop();
      if (neighbors && neighbors.length) {
        const next = neighbors.shift();
        neighborStack.push(neighbors);
        mainStack.push(next);
        visited.set(next.target, true);
        neighborStack.push(
          neighborEdgesByIdMap
            .get(next.target)
            .filter((edge: Edge) => !visited.get(edge.target))
        );
      } else {
        visited.set(mainStack.pop().target, false);
        continue;
      }
      if (mainStack.peek.target === target.guid) {
        const edges: Edge[] = [];
        const nodes: Node[] = [];

        mainStack.toArray().forEach((edge) => {
          if (edge.edge != null) {
            edges.push(edge.edge);
          }
          nodes.push(this.allCurNodeByIdMap.get(edge.target));
        });
        paths.push({ edges: edges, nodes: nodes });
        neighborStack.pop();
        visited.set(mainStack.pop().target, false);
      }
    }

    // 从小到大排序
    paths.sort((path1, path2) => path1.edges.length - path2.edges.length);
    return paths[0];
  }

  /**
   * 设置初始的推荐节点列表徽标
   * @param initRecommendExpandNodes
   */
  setInitRecommendNodesBadge(initRecommendExpandNodes: any) {
    if (initRecommendExpandNodes.length) {
      this.initRecommendExpandNodes = initRecommendExpandNodes;
    }

    // 添加徽标元素
    this.initRecommendExpandNodes.forEach((d: any) => {
      if (this.allCurNodeByIdMap.has(d.guid)) {
        const element = this.SvgContainer.select(`g#node-${d.guid}`)
          .append('g')
          .attr('id', `badge-${d.guid}`);
        element
          .append('circle')
          .attr('id', `circle-badge-${d.guid}`)
          .attr('class', 'badge circle-badge')
          .attr('r', this.radius / 3)
          .attr('stroke-width', 0)
          .style('fill', '#ff0000')
          .attr(
            'transform',
            `translate(${this.radius * 0.8},${-this.radius * 0.8})`
          );
        element
          .append('text')
          .attr('id', `text-badge-${d.guid}`)
          .attr('class', 'badge text-badge')
          .attr('stroke-width', 0)
          .style('fill', '#ffffff')
          .style('font-size', `${this.radius / 2}px`)
          .style('text-anchor', 'middle')
          .style('dominant-baseline', 'middle')
          .style('cursor', 'default')
          .attr('pointer-events', 'none')
          .attr(
            'transform',
            `translate(${this.radius * 0.8},${-this.radius * 0.75})`
          )
          .text('!');
      }
    });
  }

  /**
   * 进行视图自动居中
   */
  runAutoZoom(): void {
    // 防止因套索而引起的放缩失效
    // this.SvgContainer.call(this.zoomObj);

    autoZoom(this.renderSvg, this.zoomObj, {
      svgWidth: this.width,
      svgHeight: this.height,
      margin: this.margin,
      duration: 1000,
    });
  }

  /**
   * 判断节点是否因为交互事件固定了坐标
   * @param node
   */
  isFixedPosition(node: Node): boolean {
    if (node.isDragged || node.isFixed) {
      return true;
    }
    return false;
  }

  destroy() {
    this.renderSvg.width = 0;
    this.renderSvg.height = 0;
    this.container.innerHTML = '';
  }
}
