import * as d3 from 'd3';
import {
  cutArrayBasedOnLength,
  getRandomPosition,
  autoZoom,
} from '@/graph-components/common/util-function';
import { globalCfg } from '@/graph-components/common/static-const-value';
import { Margin, Node, Edge, Community } from './interface';
import { renderNodes, renderEdges, renderInit } from './render';
import Layout from './layout';
import { consoleInfos } from './contextMenuBehavior';

export default class Graph {
  // 图谱基础配置项
  public cfg: any;
  public selector: string = '#graph-render';
  public legendContainer: string = '#legend-container';
  public svgOuterContainer: any; // 外围容器 div
  public renderSvg: any; // 图谱渲染元素 svg
  public svgInnerContainer: any; // svg下层的元素（用于放缩） g
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
  public originalEdgesByIdMap: any = new Map<number, Community>();
  public CommunitiesByIdMap: any = new Map();

  // 当前图谱上可见的所有点边
  public allCurGraphNodes: Node[] = [];
  public allCurGraphEdges: Edge[] = [];
  public allCurGraphNodesByIdMap: any = new Map();
  public allCurGraphEdgesByIdMap: any = new Map();

  // 连通子图的图谱实例化对象, 包含 simulation, nodes, edges, container, nodesG, linksG, hullsG 等
  public GraphInstance: any = {};

  // 交互操作的节点，比如点击、扩展
  public rootNode: Node | null = null;

  // 真实图谱力导布局实例对象
  public layoutInstance: any = {};
  public isPreTick: boolean = true; // 是否开启预tick计算
  public preTickCount: number = 193; // 预tick计算次数
  public batchGroupNum: number = 8; // 主体结构层次化布局次数

  // 右键菜单管理
  private callContextMenu: any; // 唤出右键菜单UI

  constructor(props = {}) {
    Object.assign(this, props);
    this.svgOuterContainer = d3.select(this.selector);
    this.init();
  }

  init(): void {
    // 设置数据
    this.setData();
    // 开始渲染
    this.initRender();
  }

  /**
   * 设置图谱点边数据属性以及半径
   * @param data 图谱点边数据
   */
  setData(data?: any): void {
    // 清除缓存
    this.clearCache();

    // 设置数据
    this.data = data || this.data;

    // 处理点边数据
    this.data.nodes.forEach((node: Node) => {
      // 在全数据集中进行记录
      this.originalNodesByIdMap.set(node.guid, node);

      // 在社区集中进行记录
      if (!this.CommunitiesByIdMap.has(node.properties?.community)) {
        this.CommunitiesByIdMap.set(node.properties?.community, {
          communityID: node.properties?.community,
          Nodes: new Array<Node>(),
        });
      }
      this.CommunitiesByIdMap.get(node.properties?.community).Nodes.push(node);
    });

    this.data.edges.forEach((edge: Edge) => {
      // 补充相关属性
      edge.sourceID =
        typeof edge.source === 'string' ? edge.source : edge.source.guid;
      edge.targetID =
        typeof edge.target === 'string' ? edge.target : edge.target.guid;
      // 在全数据集中进行记录
      this.originalEdgesByIdMap.set(edge.guid, edge);
    });

    // 设置节点半径
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
  initRender(): void {
    // 设置画布尺寸
    const { width, height } = this.svgOuterContainer
      .node()
      .getBoundingClientRect();
    this.width = width || this.width;
    this.height = height || this.height;
    this.center = [
      this.margin.left +
        (this.width - this.margin.left - this.margin.right) / 2,
      this.margin.top +
        (this.height - this.margin.top - this.margin.bottom) / 2,
    ];

    // 更新svg元素
    this.svgOuterContainer.select(this.svgPainterID).remove();
    this.renderSvg = this.svgOuterContainer
      .append('svg')
      .attr('id', this.svgPainterID)
      .attr('viewBox', [0, 0, this.width, this.height])
      .attr('width', this.width)
      .attr('height', this.height);
    // .style('overflow-y', 'scroll');

    // 更新SVG承载容器
    this.svgInnerContainer = this.renderSvg
      .append('g')
      .attr('id', 'inner-container')
      .attr('class', 'inner-container');

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

      // 图例容器
      legendContainer: this.legendContainer,
    };

    // 绘制图谱
    this.renderGraph();

    // 绑定 svg 元素事件
    this.bindSVGEvent();
  }

  /**
   * 绘制图谱
   */
  renderGraph(): void {
    // 图对象
    this.GraphInstance = {
      simulation: null, // 当前连通子图力模型
      nodes: [], // 当前连通子图节点数据
      edges: [], // 当前连通子图连边数据
      container: null, // 当前图绘制的承载容器
      linksG: null, // 连边SVG元素group
      nodesG: null, // 节点SVG元素group
      hullsG: null, // 凸包SVG元素group

      // 下面是最大连通子图特有的属性
      incrementGroup: new Map(), // 增量结构分组，骨架节点为第0层
      allNodesByIdMap: new Map(), // 该结构完整图谱的节点哈希
      allEdgesByIdMap: new Map(), // 该结构完整图谱的连边哈希
    };
    // 定义一个对象作为引用，以简化后续代码书写
    const graphInstance = this.GraphInstance;

    // 获取化简后的图谱数据和骨架数据，并进行分层增量图谱数据预处理
    const incrementGroup = graphInstance.incrementGroup;
    this.data.nodes.forEach((d: Node) => {
      // if (!d.properties.isSimplified) {
      //   d.neighborEdges = []; // 相关的邻居连边
      //   // 判断是否为骨架数据，如是，则将其进行记录
      //   if (d.properties.isBackbone) {
      //     graphInstance.subNodes.push(d);
      //     incrementGroup[d.guid] = { nodes: [], edges: [] };
      //     // 更新图谱可视节点信息
      //     this.allCurGraphNodes.push(d);
      //     this.allCurGraphNodesByIdMap.set(d.guid, d);
      //   }
      //   graphInstance.allNodesByIdMap.set(d.guid, d);
      // }
      d.neighborEdges = []; // 相关的邻居连边
      graphInstance.nodes.push(d);
      incrementGroup[d.guid] = { nodes: [], edges: [] };
      // 更新图谱可视节点信息
      this.allCurGraphNodes.push(d);
      this.allCurGraphNodesByIdMap.set(d.guid, d);
      graphInstance.allNodesByIdMap.set(d.guid, d);
    });
    this.data.edges.forEach((d: Edge) => {
      // if (!d.properties.isSimplified) {
      //   d.sourceID = typeof d.source === "string" ? d.source : d.source.guid;
      //   d.targetID = typeof d.target === "string" ? d.target : d.target.guid;

      //   // 判断是否为骨架数据，如是，则将其进行记录
      //   if (d.properties.isBackbone) {
      //     graphInstance.subEdges.push(d);
      //     // 更新图谱可视连边信息
      //     this.allCurGraphEdges.push(d);
      //     this.allCurGraphEdgesByIdMap.set(d.guid, d);
      //   }

      //   graphInstance.allEdgesByIdMap.set(d.guid, d);
      //   // if (!graphInstance.allNodesByIdMap.has(d.source)) {
      //   //   console.log(d)
      //   // } else {
      //   graphInstance.allNodesByIdMap.get(d.sourceID).neighborEdges.push(d);
      //   graphInstance.allNodesByIdMap.get(d.targetID).neighborEdges.push(d);
      //   // }
      // }

      d.sourceID = typeof d.source === 'string' ? d.source : d.source.guid;
      d.targetID = typeof d.target === 'string' ? d.target : d.target.guid;
      graphInstance.edges.push(d);
      // 更新图谱可视连边信息
      this.allCurGraphEdges.push(d);
      this.allCurGraphEdgesByIdMap.set(d.guid, d);
      graphInstance.allEdgesByIdMap.set(d.guid, d);
      graphInstance.allNodesByIdMap.get(d.sourceID).neighborEdges.push(d);
      graphInstance.allNodesByIdMap.get(d.targetID).neighborEdges.push(d);
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
          this.allCurGraphNodesByIdMap.has(edge.sourceID) &&
          !this.allCurGraphNodesByIdMap.has(edge.targetID) &&
          (!incrementalNodesSet.has(edge.targetID) ||
            !incrementalEdgesSet.has(edge.targetID))
        ) {
          incrementalNode = graphInstance.allNodesByIdMap.get(edge.targetID);
        }
        if (
          this.allCurGraphNodesByIdMap.has(edge.targetID) &&
          !this.allCurGraphNodesByIdMap.has(edge.sourceID) &&
          (!incrementalNodesSet.has(edge.sourceID) ||
            !incrementalEdgesSet.has(edge.sourceID))
        ) {
          incrementalNode = graphInstance.allNodesByIdMap.get(edge.sourceID);
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
                edgeItem.sourceID === tempNode.guid &&
                !this.allCurGraphNodesByIdMap.has(edgeItem.targetID) &&
                !incrementalNodesSet.has(edgeItem.targetID) &&
                !incrementalEdgesSet.has(edgeItem.guid)
              ) {
                const nodeItem = graphInstance.allNodesByIdMap.get(
                  edgeItem.targetID
                );
                incrementGroup[key].nodes.push(nodeItem);
                incrementGroup[key].edges.push(edgeItem);
                incrementalNodesSet.add(nodeItem.guid);
                incrementalEdgesSet.add(edgeItem.guid);
                // 入栈，以便后续遍历操作
                stack.push(nodeItem);
              }
              if (
                edgeItem.targetID === tempNode.guid &&
                !this.allCurGraphNodesByIdMap.has(edgeItem.sourceID) &&
                !incrementalNodesSet.has(edgeItem.sourceID) &&
                !incrementalEdgesSet.has(edgeItem.guid)
              ) {
                const nodeItem = graphInstance.allNodesByIdMap.get(
                  edgeItem.sourceID
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
    this.layoutInstance = Layout({
      type: 'ForceLayout',
      graph: this,
      isOpenAutoZoom: true,
    });
    graphInstance.simulation = this.layoutInstance.simulation;

    // 预计算，从而直接渲染一个较好的初始位置
    // graphInstance.simulation.tick(300);

    // 绘制 svg 点边元素承载容器以及超点凸包承载容器
    renderInit(graphInstance);
    // 绘制点边
    renderEdges(graphInstance, this.cfg, true);
    renderNodes(graphInstance, this.cfg, true);

    // 进行点边事件绑定
    this.bindBaseEvent();
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
        .scaleExtent([1 / 100, 100])
        .on('zoom', (event: any) => {
          this.svgInnerContainer.attr('transform', event.transform);
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
      });
  }

  /**
   * 点边事件绑定
   */
  bindBaseEvent() {
    const self = this;
    // 当前图谱实例对象
    const graphInstance = this.GraphInstance;

    // 绑定节点事件
    if (graphInstance.nodesG) {
      graphInstance.nodesG
        // hover 进入
        .on('mouseenter.hover', function (event: any, d: Node) {
          // 将所有节点的光圈样式恢复原样
          self.renderSvg
            .selectAll('.circle-virtual-background')
            .style('stroke-opacity', 0);
          // 将所有连边和节点进行淡化
          self.renderSvg.selectAll('.edge-path').attr('opacity', 0.3);
          self.renderSvg.selectAll('.circle-node').attr('opacity', 0.3);
          self.renderSvg.selectAll('.circle-text').attr('opacity', 0.3);
          // 将相邻节点高亮光圈
          d.neighborEdges.forEach((edge: Edge) => {
            self.renderSvg
              .select(`#circle-virtual-background-${edge.sourceID}`)
              .style('stroke-opacity', 0.35);
            self.renderSvg
              .select(`#circle-virtual-background-${edge.targetID}`)
              .style('stroke-opacity', 0.35);
            self.renderSvg.select(`#edge-path-${edge.guid}`).attr('opacity', 1);
            self.renderSvg
              .select(`#circle-node-${edge.sourceID}`)
              .attr('opacity', 1);
            self.renderSvg
              .select(`#circle-node-${edge.targetID}`)
              .attr('opacity', 1);
            self.renderSvg
              .selectAll(`#circle-text-${edge.sourceID}`)
              .attr('opacity', 1);
            self.renderSvg
              .selectAll(`#circle-text-${edge.targetID}`)
              .attr('opacity', 1);
          });

          // 设置当前节点样式
          d3.select(this).style('cursor', 'pointer');
          // .select(`#circle-virtual-background-${d.guid}`)
          // .style("stroke-opacity", 0.35);

          event.stopPropagation();
        })
        // hover 出来
        .on('mouseleave.hover', (event: any, d: Node) => {
          // 将所有节点的光圈恢复原样
          self.renderSvg
            .selectAll('.circle-virtual-background')
            .style('stroke-opacity', 0);
          // 将所有连边和节点样式恢复原样
          self.renderSvg.selectAll('.edge-path').attr('opacity', 1);
          self.renderSvg.selectAll('.circle-node').attr('opacity', 1);
          self.renderSvg.selectAll('.circle-text').attr('opacity', 1);

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
            .on('start', this.dragstarted([graphInstance.simulation]))
            .on('drag', this.dragged([graphInstance.simulation]))
            .on('end', this.dragended([graphInstance.simulation]))
        );
      // // 右键菜单
      // .on("contextmenu", (event: any, d: Node) => {
      //   // this.callContextMenu && this.callContextMenu('nodeContextMenu', event, d);

      //   // 超点扩展
      //   if (d.properties.isAbstract && d.properties.level !== 4) {
      //     // if (d.properties.isAbstract) {
      //     expandAbstractNode(d, "nodeContextMenu", {
      //       graph: this,
      //       level: level,
      //       subGraphID: subGraphID,
      //       // 回调函数：事件绑定
      //       callback: () => {
      //         this.bindBaseEvent();
      //       },
      //     });
      //   }
      //   event.stopPropagation();
      //   event.preventDefault();
      // });
    }

    // 绑定连边事件
    if (graphInstance.linksG) {
      graphInstance.linksG
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
        });
      // // 右键菜单
      // .on("contextmenu", (event: any, d: Edge) => {
      //   // this.callContextMenu && this.callContextMenu('edgeContextMenu', event, d);
      // });
    }

    // // 绑定超点凸包事件
    // if (graphInstance.container) {
    //   graphInstance.container
    //     .select("g.hullsG")
    //     .selectAll("path")
    //     .on("contextmenu", (event: any, d: Node) => {
    //       // this.callContextMenu && this.callContextMenu('nodeContextMenu', event, d);
    //       // 右键执行超点收缩
    //       shrinkAbstractNode(d, "nodeContextMenu", {
    //         graph: this,
    //         level: level,
    //         subGraphID: subGraphID,
    //         // 回调函数：事件绑定
    //         callback: () => {
    //           this.bindBaseEvent();
    //         },
    //       });
    //       event.stopPropagation();
    //       event.preventDefault();
    //     });
    // }
  }

  /**
   * 节点拖拽事件开始
   * @param simulations
   */
  dragstarted(simulations: any) {
    return (event: any) => {
      if (!event.active) {
        simulations.forEach((simulation: any) => {
          simulation.alphaTarget(0.3).restart();
        });
      }
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    };
  }

  /**
   * 节点拖拽事件进行时
   * @param simulations
   */
  dragged(simulations: any) {
    return (event: any) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
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
      event.subject.fx = null;
      event.subject.fy = null;
    };
  }

  /**
   * 对主体结构从骨架结构进行分层布局
   */
  runMultiRenderMaxSubGraph() {
    const graphInstance = this.GraphInstance;
    // 延迟一段时间后启用增量布局
    // const startMultiLayout = setTimeout(() => {
    const startMultiLayout = setInterval(() => {
      // 当骨架布局尚未稳定时不进行增量布局
      if (graphInstance.simulation.alpha() >= 0.45) {
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
        if (graphInstance.simulation.alpha() >= 0.65) {
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
            graphInstance.nodes.push(...newNodes);
            graphInstance.edges.push(...newEdges);
          });

          // 绘制连边
          graphInstance.linksG = graphInstance.linksG.data(
            graphInstance.edges,
            (d: Edge) => d.guid
          );
          graphInstance.linksG.data(graphInstance.edges).exit().remove(); // 将多余连边删除
          renderEdges(graphInstance, this.cfg, false);

          // 绘制节点
          graphInstance.nodesG = graphInstance.nodesG.data(
            graphInstance.nodes,
            (d: Node) => d.guid
          );
          graphInstance.nodesG.data(graphInstance.nodes).exit().remove(); // 将多余节点删除
          renderNodes(graphInstance, this.cfg, false);

          // 更新 svg 点边元素组
          graphInstance.nodesG = graphInstance.container
            .select('g.nodesG')
            .selectAll('g.nodeG');
          graphInstance.linksG = graphInstance.container
            .select('g.linksG')
            .selectAll('g.linkG');

          // 重启力仿真器
          this.layoutInstance.restart(1, {
            linkDistanceStrength: curBatchCount * (this.batchGroupNum + 2),
          });

          // 进行点边事件绑定
          this.bindBaseEvent();
          curBatchCount += 1;
        } else {
          // 结束时清除调度器
          clearInterval(timer);
        }
      }, 3500 / (this.batchGroupNum - 1)); // 设置在 3.5s 内完成所有增量过渡
      // }, 100);
    }, 200);
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
   * @param duration 动画过渡时间
   * @param setTargetScale 是否开启指定的放缩倍数
   */
  runAutoZoom(
    duration = 1000,
    setTargetScale = { status: false, scale: 0 }
  ): any {
    const zoomIdentity = autoZoom(
      this.svgInnerContainer,
      this.zoomObj,
      {
        svgWidth: this.width,
        svgHeight: this.height,
        margin: this.margin,
      },
      duration,
      setTargetScale
    );
    return zoomIdentity;
  }

  /**
   * 清理数据，删除缓存，还原为初始态
   */
  clearCache(): void {
    // 图谱基础配置项
    this.cfg = null;

    // 原始数据下的点边哈希
    this.originalNodesByIdMap.clear();
    this.originalEdgesByIdMap.clear();

    // 连通子图的图谱实例化对象
    this.GraphInstance = {};

    // 交互操作的节点
    this.rootNode = null;
  }
}
