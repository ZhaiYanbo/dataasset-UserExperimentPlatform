import * as d3 from 'd3';
import { Margin, Node, VirtualNode, Edge } from './interface';
import { renderNodes, renderEdges, renderInit } from './render';
import Layout from './layout';
import {
  consoleInfos,
  expandAbstractNode,
  shrinkAbstractNode,
} from './contextMenuBehavior';
import {
  cutArrayBasedOnLength,
  getRandomPosition,
  autoZoom,
} from './utils/common';

import { globalCfg } from '@/graph-components/common/static-const-value';

export default class Graph {
  // 图谱基础配置项
  public cfg: any;
  public selector: string = '#graph-render-container';
  public container: any; // 外围容器
  public renderSvg: any; // 图谱svg元素
  public svgPainterID: string = 'graph-painter'; // 图谱svg元素ID

  public width: number = document.documentElement.clientWidth; // 画布尺寸-宽
  public height: number = document.documentElement.clientHeight; // 画布尺寸-高
  public center: number[] = [this.width / 2, this.height / 2]; // 画布中心
  public margin: Margin = { top: 30, bottom: 30, left: 30, right: 30 }; // 画布边距
  public zoomObj: any = null; // 放缩对象
  public autoZoomFlag: boolean = true; // 初始时自动放缩标志，当布局达到一定的稳定时启用自动放缩
  public radius: number = 5; // 实体节点半径大小
  public backgroundPadding: number = 3; // 实体外围光圈间隙
  public labelPadding: number = 3; // 实体标签与节点之间的间距大小
  public virtualRadius: number = 5; // 虚拟节点初始半径大小
  public collidePadding: number = 3 * this.virtualRadius; // 虚拟节点力导碰撞间隙 padding
  public virtualPadding: number = 2 * this.virtualRadius; // 虚拟节点半径边间隙，单位 px
  public showClusterHull: boolean = false; // 是否展示聚类的凸包

  // 相关超点图元编码的绘制参数变量
  // 超点大小映射范围
  public abstractClusterRadiusScaleRange = [
    this.radius * 1.25,
    this.radius * 3,
  ];
  public abstractLogicRadiusScaleRange = [this.radius * 1.25, this.radius * 3];
  // 超点外圈弧线度映射比例尺对象以及对应的弧度范围
  public abstractClusterArcScale = d3.scaleBand();
  public abstractClusterArcScaleRange = [
    (Math.PI / 180) * 15,
    (Math.PI / 180) * 345,
  ];
  public abstractLogicArcScale = d3.scaleBand();
  public abstractLogicArcScaleRange = [
    (Math.PI / 180) * 15,
    (Math.PI / 180) * 345,
  ];

  // 图谱原始点边数据
  public data: any = {
    nodes: [],
    edges: [],
  };
  // 原始数据下的点边哈希
  public originalNodesByIdMap: any = new Map();
  public originalEdgesByIdMap: any = new Map();

  // 当前图谱上可见的所有点边
  public allCurGraphNodes: Node[] = [];
  public allCurGraphEdges: Edge[] = [];
  public allCurGraphNodesByIdMap: any = new Map();
  public allCurGraphEdgesByIdMap: any = new Map();

  // 单层级连通子图的图谱实例化对象, 包含 sub_simulation, sub_nodes, sub_edges, sub_container, sub_nodesG, sub_linksG, sub_hullsG 等
  public GraphInstances: any = {
    level1: {},
    level2: {},
    level3: {},
    level4: {},
  };
  // 各层图谱点边数据，按 level 和 subGraphID 组织数据
  public Graphs: any = { level1: {}, level2: {}, level3: {}, level4: {} };

  // 交互操作的节点，比如点击、扩展
  public rootNode: Node | null = null;

  // 图谱渲染相关的承载元素
  public virtualNodes: VirtualNode[] = []; // 虚拟节点数据列表
  public virtualContainer: any; // 虚拟节点承载容器
  public virtualNodesDict: any; // 各层次连通子图虚拟定位节点

  // 布局实例对象
  public virtualLayoutInstance: any = null; // 虚拟节点力导布局实例对象
  // 虚拟节点布局径向力强度
  public radialStrengths: any = {
    level1: 0,
    level2: 0.2,
    level3: 0.05,
    // level4: 0.5,
  };
  public isPreTick: boolean = true; // 是否开启预tick计算
  public preTickCount: number = 150; // 预tick计算次数
  public virtualSectorInstances = []; // 游离结构扇区实例对象
  public actualLayoutInstances: any = {
    level1: {},
    level2: {},
    level3: {},
    level4: {},
  }; // 真实图谱力导布局实例对象

  // 主体结构层次化布局次数
  public batchGroupNum: number = 1;
  // 第四层各扇形间距的角度
  public batchSectorAngle: number = 0;
  // 第四层扇区的半径为内半径的倍数
  public sectorRadius: number = 1.75;

  constructor(props = {}) {
    Object.assign(this, props);
    this.container = d3.select(this.selector);
    this.init();
  }

  init(): void {
    this.setData();
    this.initRender();
  }

  /**
   * 设置图谱点边数据属性以及半径
   * @param data 图谱点边数据
   */
  setData(data?: any): void {
    this.clearCache();
    this.data = data || this.data;

    // 处理点边数据
    this.data.nodes.forEach((node: Node) => {
      // 根据数据分层以及连通子图标识进行分类
      if (
        !(
          node.properties.subGraphID in
          this.Graphs[`level${node.properties.level}`]
        )
      ) {
        this.Graphs[`level${node.properties.level}`][
          node.properties.subGraphID
        ] = {
          nodes: [],
          edges: [],
        };
      }
      this.Graphs[`level${node.properties.level}`][
        node.properties.subGraphID
      ].nodes.push(node);

      // 在全数据集中进行记录
      this.originalNodesByIdMap.set(node.guid, node);
    });
    this.data.edges.forEach((edge: Edge) => {
      // 补充相关属性
      edge.sourceID =
        typeof edge.source === 'string' ? edge.source : edge.source.guid;
      edge.targetID =
        typeof edge.target === 'string' ? edge.target : edge.target.guid;

      // 根据数据分层以及连通子图标识进行分类
      this.Graphs[`level${edge.properties.level}`][
        edge.properties.subGraphID
      ].edges.push(edge);

      // 在全数据集中进行记录
      this.originalEdgesByIdMap.set(edge.guid, edge);
    });

    this.setNodesRadius();
  }

  /**
   * 设置节点半径属性，对于超点而言，根据超点所含子节点规模，借助比例尺方式设置半径
   */
  setNodesRadius(): void {
    // 进行各个超点所含子节点规模统计
    const abstractClusterNodesArray: number[] = []; // 游离簇结构超点
    const abstractLogicNodesArray: number[] = []; // 业务属性-字段关联结构超点
    this.data.nodes.forEach((node: Node) => {
      if (node.properties.isAbstract) {
        if (node.typeName === globalCfg.abstractLogicEntityfieldTypeName) {
          abstractLogicNodesArray.push(node.properties.containNodes.length);
        } else {
          abstractClusterNodesArray.push(node.properties.containNodes.length);
        }
      }
    });

    // 对超点所含节点规模数组进行从小到大排序操作，并进行半径大小映射
    abstractClusterNodesArray.sort((a, b) => a - b);
    const abstractClusterRadiusScale = d3
      .scaleBand()
      .domain(abstractClusterNodesArray)
      .range(this.abstractClusterRadiusScaleRange);
    abstractLogicNodesArray.sort((a, b) => a - b);
    const abstractLogicRadiusScale = d3
      .scaleBand()
      .domain(abstractLogicNodesArray)
      .range(this.abstractLogicRadiusScaleRange);
    this.originalNodesByIdMap.forEach((node: Node) => {
      if (node.properties.isAbstract) {
        // 设置超点半径
        if (node.typeName === globalCfg.abstractLogicEntityfieldTypeName) {
          node.r = abstractLogicRadiusScale(
            node.properties.containNodes.length
          );
        } else {
          node.r = abstractClusterRadiusScale(
            node.properties.containNodes.length
          );
        }
      } else {
        // 设置普通节点半径
        node.r = this.radius;
      }
    });

    // 超点外圈弧线度映射
    this.abstractClusterArcScale
      .domain(abstractClusterNodesArray)
      .range(this.abstractClusterArcScaleRange);
    this.abstractLogicArcScale
      .domain(abstractLogicNodesArray)
      .range(this.abstractLogicArcScaleRange);
  }

  /**
   * 画布的初始渲染，主要用于设置svg容器
   */
  initRender(opt: any = {}): void {
    // 设置画布尺寸
    if (opt.width) {
      this.width = opt.width;
      this.height = opt.height;
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

    // 设置数据
    if (opt.data) {
      this.data = opt.data;
      this.setData();
    }

    // 更新svg元素
    this.container.select(this.svgPainterID).remove();
    this.renderSvg = this.container
      .append('svg')
      .attr('id', this.svgPainterID)
      .attr('viewBox', [0, 0, this.width, this.height])
      .attr('width', this.width)
      .attr('height', this.height);
    // .style("overflow-x", "scroll")
    // .style("overflow-y", "scroll");

    const self = this;
    document.onkeydown = function (event: any) {
      // 空格停止迭代
      if (event.keyCode === 32) {
        // self.simulation.stop();
      } else if (event.keyCode === 67) {
        // C 视图居中
        self.runAutoZoom();
      }
    };

    // 更新虚拟节点承载容器
    this.virtualContainer = this.renderSvg
      .append('g')
      .attr('class', 'virtual-container');

    // 更新图谱基础配置项
    this.cfg = {
      width: this.width,
      height: this.height,
      center: this.center,
      radius: this.radius,
      labelPadding: this.labelPadding,
      backgroundPadding: this.backgroundPadding,
      margin: this.margin,
      renderSvg: this.renderSvg,

      // 超点外圈弧线样式
      abstractClusterArcScale: this.abstractClusterArcScale,
      abstractLogicArcScale: this.abstractLogicArcScale,
    };

    // 绘制图谱
    this.renderGraph();

    // 绑定 svg 元素事件
    this.bindSVGEvent();
  }

  /**
   * 绘制图谱的入口，包括虚拟定位节点和真实数据图谱
   */
  renderGraph() {
    // 对各层虚拟节点进行布局渲染
    this.runVirtualLayout();

    // 对各层实体节点进行布局渲染
    this.runActualLayout();
  }

  /**
   * 各层虚拟节点布局渲染入口
   */
  runVirtualLayout(): any {
    // 构造各层次连通图虚拟定位节点哈希
    this.virtualNodesDict = {
      level1: [
        {
          id: 'level1-sub0',
          level: 'level1',
          subGraphID: 0,
          r: this.radius,
          fx: 0,
          fy: 0,
        },
      ],
      level2: Object.keys(this.Graphs.level2).map((subGraphID: string) => {
        return {
          id: `level2-sub${subGraphID}`,
          level: 'level2',
          subGraphID: subGraphID,
          r: this.virtualRadius,
        };
      }),
      level3: Object.keys(this.Graphs.level3).map((subGraphID: string) => {
        return {
          id: `level3-sub${subGraphID}`,
          level: 'level3',
          subGraphID: subGraphID,
          r: this.virtualRadius,
        };
      }),
      level4: Object.keys(this.Graphs.level4).map((subGraphID: string) => {
        return {
          id: `level4-sub${subGraphID}`,
          level: 'level4',
          subGraphID: subGraphID,
          // 游离点半径为 radius，游离簇半径为 virtualRadius
          r:
            this.Graphs.level4[subGraphID].nodes.length === 1
              ? this.radius
              : this.virtualRadius,
          data: this.Graphs.level4[subGraphID].nodes.filter(
            (t: any) => !t.properties.isSimplified
          )[0],
        };
      }),
    };

    // 虚拟定位节点数据列表
    this.virtualNodes = [
      ...this.virtualNodesDict.level1,
      ...this.virtualNodesDict.level2,
      ...this.virtualNodesDict.level3,
      ...this.virtualNodesDict.level4,
    ];

    // 执行布局
    this.virtualLayoutInstance = Layout({
      type: 'VirtualForceLayout',
      graph: this,
    });

    // 绑定虚拟节点事件
    this.bindVirtualNodesEvent();
  }

  /**
   * 各层实体节点布局渲染入口
   */
  runActualLayout(): any {
    const levels = ['level1', 'level2', 'level3', 'level4'];
    levels.forEach((level: string) => {
      Object.keys(this.Graphs[level]).forEach((subGraphID: string) => {
        // 根据主体结构和非主体结构分别进行布局
        if (level === 'level1') {
          this.renderMainSubGraph(level, subGraphID);
          // 对主体结构进行从骨架开始的分层布局（后期要与菜单按钮进行结合）
          this.runMultiRenderMaxSubGraph();
        } else {
          this.renderOtherSubGraph(level, subGraphID);
        }
      });
    });
  }

  /**
   * 对主体结构进行基于骨架的分层布局方法
   * @param level 层级
   * @param subGraphID 连通子图 ID
   */
  renderMainSubGraph(level: string, subGraphID: string): void {
    // 图对象
    this.GraphInstances[level][subGraphID] = {
      subSimulation: null, // 当前连通子图力模型
      subNodes: [], // 当前连通子图节点数据
      subEdges: [], // 当前连通子图连边数据

      subContainer: null, // 当前连通子图绘制承载容器
      subLinksG: null, // 连边SVG元素group
      subNodesG: null, // 节点SVG元素group
      subHullsG: null, // 凸包SVG元素group

      // 下面是最大连通子图特有的属性
      incrementGroup: new Map(), // 增量结构分组，骨架节点为第0层
      allNodesByIdMap: new Map(), // 该主体结构完整图谱的节点哈希
      allEdgesByIdMap: new Map(), // 该主体结构完整图谱的连边哈希
    };
    // 定义一个对象作为引用，以简化后续代码书写
    const graphInstance = this.GraphInstances[level][subGraphID];

    // 获取化简后的图谱数据和骨架数据，并进行分层增量图谱数据预处理
    const incrementGroup = graphInstance.incrementGroup;
    this.Graphs[level][subGraphID].nodes.forEach((d: Node) => {
      if (!d.properties.isSimplified) {
        d.neighborEdges = []; // 相关的邻居连边

        // 判断是否为骨架数据，如是，则将其进行记录
        // eslint-disable-next-line no-constant-condition
        if (d.properties.isBackbone) {
          graphInstance.subNodes.push(d);
          incrementGroup[d.guid] = { nodes: [], edges: [] };
          // 更新图谱可视节点信息
          this.allCurGraphNodes.push(d);
          this.allCurGraphNodesByIdMap.set(d.guid, d);
        }

        graphInstance.allNodesByIdMap.set(d.guid, d);
      }
    });
    this.Graphs[level][subGraphID].edges.forEach((d: Edge) => {
      if (!d.properties.isSimplified) {
        d.sourceId = typeof d.source === 'string' ? d.source : d.source.guid;
        d.targetId = typeof d.target === 'string' ? d.target : d.target.guid;

        // 判断是否为骨架数据，如是，则将其进行记录
        // eslint-disable-next-line no-constant-condition
        if (d.properties.isBackbone) {
          graphInstance.subEdges.push(d);
          // 更新图谱可视连边信息
          this.allCurGraphEdges.push(d);
          this.allCurGraphEdgesByIdMap.set(d.guid, d);
        }

        graphInstance.allEdgesByIdMap.set(d.guid, d);
        // if (!graphInstance.allNodesByIdMap.has(d.source)) {
        //   console.log(d)
        // } else {
        graphInstance.allNodesByIdMap.get(d.sourceId).neighborEdges.push(d);
        graphInstance.allNodesByIdMap.get(d.targetId).neighborEdges.push(d);
        // }
      }
    });

    // 基于骨架数据进行分层增量数据分组
    for (const key in incrementGroup) {
      // 扩展的起始节点
      const rootNode = graphInstance.allNodesByIdMap.get(key);

      // 增量Set记录
      const incrementalNodesSet = new Set();
      const incrementalEdgesSet = new Set();

      // 探索扩展相关节点，即根据连边对图谱上尚未出现的待增量节点进行分组
      rootNode.neighborEdges.forEach((edge: Edge) => {
        let incrementalNode = null;
        if (
          this.allCurGraphNodesByIdMap.has(edge.sourceId) &&
          !this.allCurGraphNodesByIdMap.has(edge.targetId) &&
          (!incrementalNodesSet.has(edge.targetId) ||
            !incrementalEdgesSet.has(edge.targetId))
        ) {
          incrementalNode = graphInstance.allNodesByIdMap.get(edge.targetId);
        }
        if (
          this.allCurGraphNodesByIdMap.has(edge.targetId) &&
          !this.allCurGraphNodesByIdMap.has(edge.sourceId) &&
          (!incrementalNodesSet.has(edge.sourceId) ||
            !incrementalEdgesSet.has(edge.sourceId))
        ) {
          incrementalNode = graphInstance.allNodesByIdMap.get(edge.sourceId);
        }
        if (incrementalNode) {
          incrementalNodesSet.add(incrementalNode.guid);
          incrementalEdgesSet.add(edge.guid);
          incrementGroup[key].nodes.push(incrementalNode);
          incrementGroup[key].edges.push(edge);

          // 获取 rootNode 下的其他跳节点
          const stack = [incrementalNode];
          while (stack.length !== 0) {
            const tempNode = stack.pop();
            tempNode.neighborEdges.forEach((edgeItem: Edge) => {
              // 判断另一端节点是否为非网络骨架的尚未增量节点
              if (
                edgeItem.sourceId === tempNode.guid &&
                !this.allCurGraphNodesByIdMap.has(edgeItem.targetId) &&
                !incrementalNodesSet.has(edgeItem.targetId) &&
                !incrementalEdgesSet.has(edgeItem.guid)
              ) {
                const nodeItem = graphInstance.allNodesByIdMap.get(
                  edgeItem.targetId
                );
                incrementGroup[key].nodes.push(nodeItem);
                incrementGroup[key].edges.push(edgeItem);
                incrementalNodesSet.add(nodeItem.guid);
                incrementalEdgesSet.add(edgeItem.guid);
                // 入栈，以便后续遍历操作
                stack.push(nodeItem);
              }
              if (
                edgeItem.targetId === tempNode.guid &&
                !this.allCurGraphNodesByIdMap.has(edgeItem.sourceId) &&
                !incrementalNodesSet.has(edgeItem.sourceId) &&
                !incrementalEdgesSet.has(edgeItem.guid)
              ) {
                const nodeItem = graphInstance.allNodesByIdMap.get(
                  edgeItem.sourceId
                );
                incrementGroup[key].nodes.push(nodeItem);
                incrementGroup[key].edges.push(edgeItem);
                incrementalNodesSet.add(nodeItem.guid);
                incrementalEdgesSet.add(edgeItem.guid);
                // 入栈，以便后续遍历操作
                stack.push(nodeItem);
              }
            });
          }
        }
      });
    }

    // 对骨架数据进行力引导布局
    this.actualLayoutInstances[level][subGraphID] = Layout({
      type: 'ActualForceLayout',
      graph: this,
      level: level,
      subGraphID: subGraphID,
      isOpenAutoZoom: true,
    });
    graphInstance.subSimulation =
      this.actualLayoutInstances[level][subGraphID].simulation;

    // 提前执行 tick 计算，以获取一个初始位置
    graphInstance.subSimulation.tick(this.preTickCount);

    // 绘制 svg 点边元素承载容器以及超点凸包承载容器
    renderInit(graphInstance, level, subGraphID);

    // 绘制点边
    renderEdges(graphInstance, this.cfg, true);
    renderNodes(graphInstance, this.cfg, true);

    // 进行点边事件绑定
    this.bindBaseEvent(level, subGraphID);
  }

  /**
   * 非主体结构基础布局方法
   * @param level 层级
   * @param subGraphID 连通子图 ID
   */
  renderOtherSubGraph(level: string, subGraphID: string) {
    // 图对象
    this.GraphInstances[level][subGraphID] = {
      subSimulation: null, // 当前连通子图力模型
      subNodes: [], // 当前连通子图节点数据
      subEdges: [], // 当前连通子图连边数据

      subContainer: null, // 当前连通子图绘制承载容器
      subLinksG: null, // 连边SVG元素group
      subNodesG: null, // 节点SVG元素group
      subHullsG: null, // 凸包SVG元素group
    };
    // 定义一个对象作为引用，以简化后续代码书写
    const graphInstance = this.GraphInstances[level][subGraphID];

    // 点边数据
    graphInstance.subNodes = this.Graphs[level][subGraphID].nodes.filter(
      (d: Node) => {
        if (!d.properties.isSimplified) {
          d.neighborEdges = []; // 相关的邻居连边

          // 更新图谱可视节点信息
          this.allCurGraphNodes.push(d);
          this.allCurGraphNodesByIdMap.set(d.guid, d);
          return true;
        }
        return false;
      }
    );
    graphInstance.subEdges = this.Graphs[level][subGraphID].edges.filter(
      (d: Node) => {
        if (!d.properties.isSimplified) {
          d.sourceId = typeof d.source === 'string' ? d.source : d.source.guid;
          d.targetId = typeof d.target === 'string' ? d.target : d.target.guid;

          // 更新图谱可视连边信息
          this.allCurGraphEdges.push(d);
          this.allCurGraphEdgesByIdMap.set(d.guid, d);

          this.allCurGraphNodesByIdMap.get(d.sourceId).neighborEdges.push(d);
          this.allCurGraphNodesByIdMap.get(d.targetId).neighborEdges.push(d);
          return true;
        }
        return false;
      }
    );
    // 力模型
    this.actualLayoutInstances[level][subGraphID] = Layout({
      type: 'ActualForceLayout',
      graph: this,
      level: level,
      subGraphID: subGraphID,
    });
    graphInstance.subSimulation =
      this.actualLayoutInstances[level][subGraphID].simulation;

    // 提前执行 tick 计算，以获取一个初始位置
    graphInstance.subSimulation.tick(this.preTickCount);

    // 绘制 svg 点边元素承载容器以及超点凸包承载容器
    renderInit(graphInstance, level, subGraphID);

    // 绘制点边
    renderEdges(graphInstance, this.cfg, true);
    renderNodes(graphInstance, this.cfg, true);

    //绑定点边事件
    this.bindBaseEvent(level, subGraphID);
  }

  /**
   * 进行图谱SVG渲染元素事件绑定
   */
  bindSVGEvent(): void {
    // 禁用浏览器原始右键菜单
    document.oncontextmenu = () => false;

    if (!this.zoomObj) {
      this.zoomObj = d3
        .zoom()
        .scaleExtent([1 / 1000, 100])
        .on('zoom', (event: any) => {
          this.virtualContainer.attr('transform', event.transform);
        });
    }

    // 对渲染的 SVG 元素进行事件绑定
    this.renderSvg
      // 绑定放缩
      .call(this.zoomObj)
      // 阻止默认的双击放缩事件
      .on('dblclick.zoom', null)
      .on('contextmenu', (event: any) => {
        event.stopPropagation();
        event.preventDefault();
      })
      // 绑定点击事件
      .on('click', (event: any) => {
        if (event.target.localName === 'svg') {
          // console.log("点击到了svg画布");
        }
        event.stopPropagation();
      });
  }

  /**
   * 点边事件绑定
   * @param level 层级
   * @param subGraphID 连通子图ID
   */
  bindBaseEvent(level: string, subGraphID: string) {
    const self = this;
    // 当前图谱实例对象
    const graphInstance = this.GraphInstances[level][subGraphID];

    // 虚拟定位节点力模型
    const virtualSimulationLevelOneToThree =
      this.virtualLayoutInstance.simulationLevelOneToThree;
    // const virtualSimulationLevelFour = this.virtualLayoutInstance.simulationLevelFour;

    // 绑定节点事件
    if (graphInstance.subNodesG) {
      graphInstance.subNodesG
        // hover 进入
        .on('mouseenter.hover', function (event: any, d: Node) {
          // // 将所有点边淡
          // self.renderSvg.selectAll('.nodeG').style('opacity', 0.3);
          // self.renderSvg.selectAll('.edge-path').style('opacity', 0.3);
          // // 将相邻节点高亮
          // d.neighborEdges.forEach((edge: Edge) => {
          //   self.renderSvg
          //     .select(`#nodeG-${edge.sourceID}`)
          //     .style('opacity', 1);
          //   self.renderSvg
          //     .select(`#nodeG-${edge.targetID}`)
          //     .style('opacity', 1);
          //   self.renderSvg
          //     .select(`#edge-path-${edge.targetID}`)
          //     .style('opacity', 1);
          // });

          // // 将所有节点的光圈样式恢复原样
          self.renderSvg
            .selectAll('.circle-virtual-background')
            .style('stroke-opacity', 0);
          // 将所有连边进行淡化
          self.renderSvg.selectAll('.edge-path').attr('opacity', 0.3);
          // 将相邻节点高亮光圈
          d.neighborEdges.forEach((edge: Edge) => {
            self.renderSvg
              .select(`#circle-virtual-background-${edge.sourceID}`)
              .style('stroke-opacity', 0.35);
            self.renderSvg
              .select(`#circle-virtual-background-${edge.targetID}`)
              .style('stroke-opacity', 0.35);
            self.renderSvg.select(`#edge-path-${edge.guid}`).attr('opacity', 1);
          });

          // 设置当前节点样式
          d3.select(this).style('cursor', 'pointer');
          // .select(`#circle-virtual-background-${d.guid}`)
          // .style("stroke-opacity", 0.35);

          event.stopPropagation();
        })
        // hover 出来
        .on('mouseleave.hover', (event: any, d: Node) => {
          // // 将所有点恢复
          // self.renderSvg.selectAll('.nodeG').style('opacity', 1);
          // self.renderSvg.selectAll('.edge-path').style('opacity', 1);

          // 将所有节点的光圈恢复原样
          self.renderSvg
            .selectAll('.circle-virtual-background')
            .style('stroke-opacity', 0);
          // 将所有连边样式恢复原样
          self.renderSvg.selectAll('.edge-path').attr('opacity', 1);

          // // 如果当前节点不是点击的节点，则取消高亮光圈
          // if (!this.rootNode || d.guid !== this.rootNode.guid) {
          //   d3.select(`#circle-virtual-background-${d.guid}`).style(
          //     "stroke-opacity",
          //     0
          //   );
          // }
          event.stopPropagation();
        })
        // 点击
        .on('click', (event: any, d: Node) => {
          // 设置高亮光圈，同时取消其他节点的光圈
          this.rootNode = d;
          d3.selectAll('.circle-virtual-background').style(
            'stroke-opacity',
            (t: Node) => (this.rootNode.guid === t.guid ? 0.35 : 0)
          );
          consoleInfos(d, 'nodeContextMenu');
          event.stopPropagation();
        })
        // 拖拽
        .call(
          d3
            .drag()
            .on(
              'start',
              this.dragstarted([
                graphInstance.subSimulation,
                virtualSimulationLevelOneToThree,
              ])
            )
            .on(
              'drag',
              this.dragged([
                graphInstance.subSimulation,
                virtualSimulationLevelOneToThree,
              ])
            )
            .on(
              'end',
              this.dragended([
                graphInstance.subSimulation,
                virtualSimulationLevelOneToThree,
              ])
            )
        )
        // 右键菜单
        .on('contextmenu', (event: any, d: Node) => {
          // 超点扩展
          if (d.properties.isAbstract && d.properties.level !== 4) {
            // if (d.properties.isAbstract) {
            expandAbstractNode(d, 'nodeContextMenu', {
              graph: this,
              level: level,
              subGraphID: subGraphID,
              // 回调函数：事件绑定
              callback: () => {
                this.bindBaseEvent(level, subGraphID);
              },
            });
          }
          event.stopPropagation();
          event.preventDefault();
        });
    }

    // 绑定连边事件
    if (graphInstance.subLinksG) {
      graphInstance.subLinksG
        // hover 进入
        .on('mouseenter.hover', function (event: any, d: Edge) {
          d3.select(this).style('cursor', 'pointer');
          event.stopPropagation();
        })
        // hover 出来
        .on('mouseleave.hover', (event: any, d: Edge) => {
          event.stopPropagation();
        })
        // 点击
        .on('click', (event: any, d: Edge) => {
          consoleInfos(d, 'edgeContextMenu');
          event.stopPropagation();
        })
        // 右键菜单
        .on('contextmenu', (event: any, d: Edge) => {});
    }

    // 绑定超点凸包事件
    if (graphInstance.subContainer) {
      graphInstance.subContainer
        .select('g.hullsG')
        .selectAll('path')
        .on('contextmenu', (event: any, d: Node) => {
          // 右键执行超点收缩
          shrinkAbstractNode(d, 'nodeContextMenu', {
            graph: this,
            level: level,
            subGraphID: subGraphID,
            // 回调函数：事件绑定
            callback: () => {
              this.bindBaseEvent(level, subGraphID);
            },
          });
          event.stopPropagation();
          event.preventDefault();
        });
    }
  }

  /**
   * 绑定虚拟节点事件
   */
  bindVirtualNodesEvent() {
    // 绑定游离结构凸包事件
    if (this.virtualSectorInstances) {
      this.virtualSectorInstances.forEach((d: any) => {
        d.rootEL
          // hover 进入
          .on('mouseenter.hover', (event: any) => {
            if (!this.showClusterHull) {
              return;
            }
            d.hullEL.attr('opacity', 1);
            d.textEL.style('opacity', 1);

            // 高亮聚类中心节点
            d3.select(
              `#circle-virtual-background-${
                d.clusterData ? d.clusterData.guid : ''
              }`
            )
              .style('stroke-width', this.backgroundPadding * 2)
              .style('stroke-opacity', 1);

            event.stopPropagation();
          })
          // hover 出来
          .on('mouseleave.hover', (event: any) => {
            if (!this.showClusterHull) {
              return;
            }
            d.hullEL.attr('opacity', 0);
            d.textEL.style('opacity', 0);

            // 取消聚类中心节点高亮
            d3.select(
              `#circle-virtual-background-${
                d.clusterData ? d.clusterData.guid : ''
              }`
            )
              .style('stroke-width', this.backgroundPadding)
              .style('stroke-opacity', 0);

            event.stopPropagation();
          });
      });
    }
  }

  /**
   * 节点拖拽事件开始
   * @param simulations
   */
  dragstarted(simulations: any) {
    return (event: any) => {
      if (!event.active) {
        simulations.forEach((simulation: any) => {
          simulation.alphaTarget(0.1).restart();
        });
      }
      if (event.subject.properties.level !== 4) {
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
    };
  }

  /**
   * 节点拖拽事件进行时
   * @param simulations
   */
  dragged(simulations: any) {
    return (event: any) => {
      if (event.subject.properties.level !== 4) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
    };
  }

  /**
   * 节点拖拽事件结束
   * @param simulations
   */
  dragended(simulations: any) {
    return (event: any) => {
      if (!event.active) {
        simulations.forEach((simulation: any) => {
          simulation.alphaTarget(0);
        });
      }
      if (event.subject.properties.level !== 4) {
        // event.subject.fx = null;
        // event.subject.fy = null;
      }
    };
  }

  /**
   * 对主体结构从骨架结构进行分层布局
   * (因为只针对主体结构，这两参数应该没啥用)
   * @param level 层级
   * @param subGraphID 连通子图序号
   */
  runMultiRenderMaxSubGraph(
    level: string = 'level1',
    subGraphID: string = '0'
  ) {
    const graphInstance = this.GraphInstances[level][subGraphID];
    // 延迟一段时间后启用增量布局
    // const startMultiLayout = setTimeout(() => {
    const startMultiLayout = setInterval(() => {
      // 当骨架布局尚未稳定时不进行增量布局
      if (graphInstance.subSimulation.alpha() >= 0.75) {
        return;
      }

      clearInterval(startMultiLayout);
      // 将层次化节点 key 按照节点规模进行从大到小排序，从而使得规模大的先增量以突显视觉效果
      const incrementGroupKeys = Object.keys(graphInstance.incrementGroup);
      incrementGroupKeys.sort(
        (a, b) =>
          graphInstance.incrementGroup[b].nodes.length -
          graphInstance.incrementGroup[a].nodes.length
      );
      //获取层次化布局每一批的节点组
      const multiLayoutArray = cutArrayBasedOnLength(
        incrementGroupKeys,
        parseInt(String(incrementGroupKeys.length / this.batchGroupNum))
      );
      let curBatchCount = 0; // 层次化布局当前轮次计数
      const timer = setInterval(() => {
        // 当上一次增量尚未相对稳定时不进行下一次增量
        if (graphInstance.subSimulation.alpha() >= 0.65) {
          return;
        }
        if (curBatchCount <= multiLayoutArray.length - 1) {
          // 获取增量图谱
          multiLayoutArray[curBatchCount].forEach((d: string) => {
            const rootNode = graphInstance.allNodesByIdMap.get(d);
            const newNodes = graphInstance.incrementGroup[d].nodes.filter(
              (node: Node) => {
                if (!this.allCurGraphNodesByIdMap.has(node.guid)) {
                  // 设置增量节点的初始位置
                  node.x = rootNode.x + getRandomPosition();
                  node.y = rootNode.y + getRandomPosition();

                  // 更新图谱可视节点信息
                  this.allCurGraphNodes.push(node);
                  this.allCurGraphNodesByIdMap.set(node.guid, node);

                  return true;
                } else {
                  return false;
                }
              }
            );
            const newEdges = graphInstance.incrementGroup[d].edges.filter(
              (edge: Edge) => {
                if (!this.allCurGraphEdgesByIdMap.has(edge.guid)) {
                  // 更新图谱可视连边信息
                  this.allCurGraphEdges.push(edge);
                  this.allCurGraphEdgesByIdMap.set(edge.guid, edge);

                  return true;
                } else {
                  return false;
                }
              }
            );
            graphInstance.subNodes.push(...newNodes);
            graphInstance.subEdges.push(...newEdges);
          });

          // 绘制连边
          graphInstance.subLinksG = graphInstance.subLinksG.data(
            graphInstance.subEdges,
            (d: Edge) => d.guid
          );
          graphInstance.subLinksG.data(graphInstance.subEdges).exit().remove(); // 将多余连边删除
          renderEdges(graphInstance, this.cfg, false);

          // 绘制节点
          graphInstance.subNodesG = graphInstance.subNodesG.data(
            graphInstance.subNodes,
            (d: Node) => d.guid
          );
          graphInstance.subNodesG.data(graphInstance.subNodes).exit().remove(); // 将多余节点删除
          renderNodes(graphInstance, this.cfg, false);

          // 更新 svg 点边元素组
          graphInstance.subNodesG = graphInstance.subContainer
            .select('g.nodesG')
            .selectAll('g.nodeG');
          graphInstance.subLinksG = graphInstance.subContainer
            .select('g.linksG')
            .selectAll('g.linkG');

          // 重启力仿真器
          this.actualLayoutInstances[level][subGraphID].restart(1, {
            linkDistanceStrength: curBatchCount * (this.batchGroupNum + 2),
          });

          // 关闭
          this.virtualLayoutInstance.restart(0.2);

          // 进行点边事件绑定
          this.bindBaseEvent(level, subGraphID);
          curBatchCount += 1;
          // 结束时清除调度器
          clearInterval(timer);
        }
      }, 800 / (this.batchGroupNum - 1)); // 设置在 3.5s 内完成所有增量过渡
      // }, 100);
    }, 50);
    // }, 100);
  }

  // 右键菜单点击触发后的任务响应
  contextMenuBehavior(contextMenuInfos: any) {
    // 确定操作的元素数据
    let dataItem: Node | Edge;
    if (contextMenuInfos.contextMenuType === 'nodeContextMenu') {
      dataItem = this.originalNodesByIdMap.get(contextMenuInfos.dataId) as Node;
    } else {
      dataItem = this.originalNodesByIdMap.get(contextMenuInfos.dataId) as Edge;
    }
    // 进行右键菜单操作
    switch (contextMenuInfos.operateType) {
      case 'consoleInfos':
        consoleInfos(
          dataItem,
          contextMenuInfos.contextMenuType,
          contextMenuInfos.params
        );
        break;
      case 'expandAbstractNode':
        expandAbstractNode(
          dataItem as Node,
          contextMenuInfos.contextMenuType,
          contextMenuInfos.params
        );
        break;
    }
  }

  /**
   * 进行视图自动居中
   */
  runAutoZoom(): void {
    autoZoom(this.virtualContainer, this.zoomObj, {
      svgWidth: this.width,
      svgHeight: this.height,
      margin: this.margin,
      duration: 1000,
    });
  }

  /**
   * 清理数据，删除缓存，还原为初始态
   */
  clearCache(): void {
    // 图谱基础配置项
    this.cfg = null;

    // 当前图谱上可见的所有点边
    this.allCurGraphNodes = [];
    this.allCurGraphEdges = [];
    this.allCurGraphNodesByIdMap.clear();
    this.allCurGraphEdgesByIdMap.clear();

    // 原始数据下的点边哈希
    this.originalNodesByIdMap.clear();
    this.originalEdgesByIdMap.clear();

    // 单层级连通子图的图谱实例化对象
    this.GraphInstances = { level1: {}, level2: {}, level3: {}, level4: {} };

    // 各层图谱点边数据
    this.Graphs = { level1: {}, level2: {}, level3: {}, level4: {} };

    // 交互操作的节点
    this.rootNode = null;

    // 图谱渲染相关的承载元素
    this.virtualContainer = null;
    this.virtualNodesDict = null;
    this.virtualLayoutInstance = null;
  }
}
