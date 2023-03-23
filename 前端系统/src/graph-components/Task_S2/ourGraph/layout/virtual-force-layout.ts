import * as d3 from 'd3';
import BaseLayout from './base-layout';
import { renderVirtualNodes } from '../render';
import { VirtualNode } from '../interface';
import {
  calculateSectorHullPath,
  calculatePolygonHullCentroid,
} from '../utils/common';
import { sectorCfg } from '../utils/static-const-values';
import { forceCircularSector } from '../utils/force';

/**
 * 虚拟定位节点力模型布局（针对level 1-3）
 */
export default class VirtualForceLayout extends BaseLayout {
  public graph: any;

  public simulationLevelOneToThree: any = null; // 第1-3层仿真器

  public simulationLevelFourInstanceList: any[] = []; // 第4层仿真器集合

  public virtualNodes: any; // 虚拟节点数据

  public virtualNodesLevelOneToThree: any; // 第1-3层虚拟节点数据

  public virtualNodesLevelFour: any; // 第4层虚拟节点数据

  public virtualNodesLevelFourMap: any = new Map(); // 虚拟节点下数据对象节点guid -> 虚拟节点 的映射

  public virtualNodesElLevelOneToThree: any; // 虚拟节点svg元素组(level1-3)

  public radialStrengths: any; // 布局径向力强度

  public parentGroupNodes: any = new Map(); // 用于记录L1-L3层级的聚类父节点
  // public sectorRadiusMap: any = new Map(); // 各个扇区的最大半径映射  聚类节点 -> 最大半径

  constructor(props: any = {}) {
    super(props);
    Object.assign(this, props);
    this.init();
  }

  init() {
    this.simulationLevelOneToThree = d3.forceSimulation();
    this.run();
  }

  run() {
    this.virtualNodes = this.graph.virtualNodes;
    this.virtualNodesLevelOneToThree = this.virtualNodes.filter(
      (d: any) => d.level.indexOf('level4') === -1
    );
    this.virtualNodesLevelFour = this.virtualNodes.filter((d: any) => {
      if (d.level.indexOf('level4') !== -1) {
        // 进行关系映射
        this.virtualNodesLevelFourMap.set(d.data.guid, d);
        return true;
      }
      return false;
    });

    // 虚拟节点svg元素组
    this.virtualNodesElLevelOneToThree = renderVirtualNodes(
      this.graph.virtualContainer,
      this.virtualNodesLevelOneToThree,
      this.graph.cfg,
      this.graph.showClusterHull
    );

    // 虚拟节点径向力强度
    this.radialStrengths = this.graph.radialStrengths;

    // 对力模型进行数据绑定以及tick调度事件
    this.simulationLevelOneToThree
      .nodes(this.virtualNodesLevelOneToThree)
      .on('tick', () => {
        this.tickLevelOneToThree();
      })
      .on('end', () => {
        this.tickend();
      });

    // 执行前置 tick 计算，加速迭代稳定
    if (this.graph.isPreTick) {
      this.simulationLevelOneToThree.tick(this.graph.preTickCount);
    }

    // 获取扇形区块节点分组数据
    const sectorNodesList = this.sectorGroupBasedCategory();
    this.graph.showClusterHull = sectorNodesList.length > 10;

    // 利用比例尺计算扇区的角度大小
    const nodeSum = d3.sum(sectorNodesList.map((t: any) => t.nodes.length));
    const angleList: any = [];
    let sumAngle = 0;
    sectorNodesList
      .map((item: any) => (item.nodes.length / nodeSum) * 360)
      .forEach((angle: any) => {
        angleList.push([sumAngle, sumAngle + angle]);
        sumAngle += angle;
      });

    // 遍历分组，构造独立仿真器
    sectorNodesList.forEach((item: any, index: number) => {
      // 各扇区图对象
      const sectorInstance = {
        clusterData: item.clusterData, // 扇区所属聚类原始数据对象
        simulation: null, // 力仿真器
        nodes: item.nodes, // 节点数组
        maxRadius: null, // 当前数据中最大节点半径
        sectorIndex: index, // 扇形区块ID
        anglesRange: [], // 扇形角度范围
        initRadius: null, // 零半径（即最初时的半径大小，该属性仅作为tick中的辅助计算）
        nodesG: null, // 节点渲染元素SVG对象
        hullEL: null, // 扇形凸包元素
        textEL: null, // 扇形文本元素
        rootEL: null, // SVG根元素
      };

      sectorInstance.simulation = d3.forceSimulation();
      sectorInstance.maxRadius = d3.max(
        sectorInstance.nodes.map((d: VirtualNode) => d.r)
      );

      // 计算当前扇区的起始角度
      // sectorInstance.anglesRange = [
      //   this.graph.batchSectorAngle * (index + 0.5) + index * radiusItem,
      //   this.graph.batchSectorAngle * (index + 0.5) + (index + 1) * radiusItem,
      // ];
      sectorInstance.anglesRange = angleList[index];
      sectorInstance.initRadius =
        d3.max(
          this.graph.virtualNodesDict.level2
            .map((d: VirtualNode) => Math.hypot(d.x, d.y))
            .concat(
              this.graph.virtualNodesDict.level3.map((d: VirtualNode) =>
                Math.hypot(d.x, d.y)
              )
            )
        ) +
        10 * this.graph.collidePadding;
      sectorInstance.nodesG = renderVirtualNodes(
        this.graph.virtualContainer,
        sectorInstance.nodes,
        this.graph.cfg,
        this.graph.showClusterHull,
        sectorInstance
      );

      sectorInstance.simulation
        .nodes(sectorInstance.nodes)
        // 设置扇形作用力，角度从水平方向的右边顺时针开始计算
        .force(
          'forceCircularSector',
          forceCircularSector([
            sectorInstance.initRadius,
            sectorInstance.initRadius * this.graph.sectorRadius,
          ])
            .angles(sectorInstance.anglesRange)
            .strength(0.3)
        )
        .on('tick', () => {
          if (
            this.graph.autoZoomFlag &&
            sectorInstance.simulation.alpha() < 0.015
          ) {
            this.graph.autoZoomFlag = false;
            this.graph.runAutoZoom();
          }

          // 实时计算半径
          const curRadius = d3.max(
            this.graph.virtualNodesDict.level2
              .map((d: VirtualNode) => Math.hypot(d.x, d.y) + d.r)
              .concat(
                this.graph.virtualNodesDict.level3.map(
                  (d: VirtualNode) => Math.hypot(d.x, d.y) + d.r
                )
              )
          );
          const p = curRadius / sectorInstance.initRadius;

          // if (sectorInstance.clusterData) {
          //   this.sectorRadiusMap.set(sectorInstance.clusterData.guid, curRadius)
          // }

          // 更新虚拟节点坐标
          sectorInstance.nodesG.attr('transform', (d: VirtualNode) => {
            // // 将聚类节点置于凸包中心
            if (
              sectorInstance.clusterData &&
              d.data.guid === sectorInstance.clusterData.guid &&
              this.graph.showClusterHull
            ) {
              const centroidPosition = calculatePolygonHullCentroid(
                sectorInstance.nodes,
                p
              );
              return `translate(${centroidPosition[0]},${centroidPosition[1]})`;
            }
            //
            // else if (this.parentGroupNodes.get(d.data.guid) && this.parentGroupNodes.get(d.data.guid).length > 0) {
            //   const childrenNodes = this.parentGroupNodes.get(d.data.guid);
            //   const childrenVirtualNodes = childrenNodes.map((t: any) => this.virtualNodesLevelFourMap.get(t));
            //   const centroidPosition = calculatePolygonHullCentroid(childrenVirtualNodes, p);
            //   const initRadius = Math.hypot(centroidPosition[0], centroidPosition[1]);
            //   const maxRadius = d3.max(childrenNodes.map((t: any) => this.sectorRadiusMap.get(t)));
            //   return `translate(${centroidPosition[0] * maxRadius / initRadius},${centroidPosition[1] * maxRadius / initRadius})`;
            // }

            return `translate(${d.x * p}, ${d.y * p})`;
          });

          if (this.graph.showClusterHull) {
            // 更新凸包计算路径和文本位置
            sectorInstance.hullEL.attr('d', (d: any) =>
              calculateSectorHullPath(d.nodes, sectorInstance.maxRadius, p)
            );
            sectorInstance.textEL.attr('transform', (d: any) => {
              const centroidPosition = calculatePolygonHullCentroid(d.nodes, p);
              return `translate(${centroidPosition[0]},${centroidPosition[1]})`;
            });
          }
        })
        .on('end', () => {
          this.tickend();
        });
      // 执行前置 tick 计算，加速迭代稳定
      if (this.graph.isPreTick) {
        sectorInstance.simulation.tick(this.graph.preTickCount);
      }
      this.graph.virtualSectorInstances.push(sectorInstance);
    });
  }

  /**
   * 第1-3层的tick
   */
  tickLevelOneToThree() {
    // 实时计算径向力半径
    const radials = {
      level1: 0,
      level2:
        this.graph.virtualNodesDict.level1[0].r + 2 * this.graph.collidePadding,
      level3:
        this.graph.virtualNodesDict.level1[0].r + 5 * this.graph.collidePadding,
    };

    // 绑定模型
    this.simulationLevelOneToThree
      .force(
        'radial',
        d3
          .forceRadial((d: VirtualNode) => radials[d.level], 0, 0)
          .strength((d: VirtualNode) => this.radialStrengths[d.level])
      )
      .force(
        'collide',
        d3
          .forceCollide((d: VirtualNode) => d.r + this.graph.collidePadding)
          .strength(0.3)
      );

    // 更新虚拟节点坐标
    this.virtualNodesElLevelOneToThree.attr(
      'transform',
      (d: VirtualNode) => `translate(${d.x}, ${d.y})`
    );
  }

  /**
   * tickend
   */
  tickend() {}

  /**
   * 根据目录层级对游离结构进行聚类，返回各聚类分组数据
   */
  sectorGroupBasedCategory() {
    // 记录已被划分到扇区的节点guid
    const curSectorNodes = new Set();

    // 根据层级关系构造嵌套的目录数据结构
    const sectorRecord: any = {}; // 分区记录（tree结构）
    this.virtualNodesLevelFour.forEach((d: any) => {
      const node = d.data; // 当前游离结构节点的主数据对象（比如簇中心）
      if (
        node.typeName === sectorCfg.sectorRootTypeName &&
        !node.properties[sectorCfg.sectorParentLabel]
      ) {
        sectorRecord[node.guid] = {
          domainNodes: node.properties.domainNodes,
          childrenSector: {},
        };
      }
    });
    const seen = new Set();
    for (const rootGuid of Object.keys(sectorRecord)) {
      // 遍历当前节点下的所有子层分区节点
      for (const i of this.graph.originalNodesByIdMap.get(rootGuid).properties[
        sectorCfg.sectorChildrenLabel
      ]) {
        if (seen.has(i)) {
          continue;
        }
        seen.add(i);
        sectorRecord[rootGuid].childrenSector[i] = {
          domainNodes:
            this.graph.originalNodesByIdMap.get(i).properties.domainNodes,
          childrenSector: {},
        };
        // 再次遍历新节点下的所有子层分区节点
        for (const j of this.graph.originalNodesByIdMap.get(i).properties[
          sectorCfg.sectorChildrenLabel
        ]) {
          if (seen.has(j)) {
            continue;
          }
          seen.add(j);
          sectorRecord[rootGuid].childrenSector[i].childrenSector[j] = {
            domainNodes:
              this.graph.originalNodesByIdMap.get(i).properties.domainNodes,
            childrenSector: {},
          };
        }
      }
    }

    // 遍历获取各分组数据(理论上为3层)
    const sectorResult: any = [];
    let domainNodes: any = null;
    for (const i of Object.keys(sectorRecord)) {
      const groupData: any = {
        nodes: [],
        clusterData: this.graph.originalNodesByIdMap.get(i),
      };
      this.parentGroupNodes.set(i, Object.keys(sectorRecord[i].childrenSector)); // 标识当前节点i为 父层聚类节点
      domainNodes = sectorRecord[i].domainNodes; // 获取相关的实体节点（比如数据表等）

      if (domainNodes.length > 0) {
        // 遍历，进行划分标识以及分组数据
        domainNodes.forEach((d: any) => {
          if (this.virtualNodesLevelFourMap.get(d)) {
            curSectorNodes.add(d);
            groupData.nodes.push(this.virtualNodesLevelFourMap.get(d));
          }
        });

        // 将聚类中心节点加入到分组数据（比如L1层目录）
        curSectorNodes.add(i);
        groupData.nodes.push(this.virtualNodesLevelFourMap.get(i));

        // 添加分组数据
        sectorResult.push(groupData);
      }
      for (const j of Object.keys(sectorRecord[i].childrenSector)) {
        const groupData: any = {
          nodes: [],
          clusterData: this.graph.originalNodesByIdMap.get(j),
        };
        this.parentGroupNodes.set(
          j,
          Object.keys(sectorRecord[i].childrenSector[j].childrenSector)
        ); // 标识当前节点i为 父层聚类节点
        domainNodes = sectorRecord[i].childrenSector[j].domainNodes; // 获取相关的实体节点（比如数据表等）

        if (domainNodes.length > 0) {
          // 遍历，进行划分标识以及分组数据
          domainNodes.forEach((d: any) => {
            if (this.virtualNodesLevelFourMap.get(d)) {
              curSectorNodes.add(d);
              groupData.nodes.push(this.virtualNodesLevelFourMap.get(d));
            }
          });
          // 将聚类中心节点加入到分组数据（比如L2层目录）
          curSectorNodes.add(j);
          groupData.nodes.push(this.virtualNodesLevelFourMap.get(j));

          // 添加分组数据
          sectorResult.push(groupData);
        }
        for (const w of Object.keys(
          sectorRecord[i].childrenSector[j].childrenSector
        )) {
          const groupData: any = {
            nodes: [],
            clusterData: this.graph.originalNodesByIdMap.get(w),
          };
          this.parentGroupNodes.set(
            w,
            Object.keys(
              sectorRecord[i].childrenSector[j].childrenSector[w].childrenSector
            )
          ); // 标识当前节点i为 父层聚类节点
          domainNodes =
            sectorRecord[i].childrenSector[j].childrenSector[w].domainNodes; // 获取相关的实体节点（比如数据表等）

          if (domainNodes.length > 0) {
            // 遍历，进行划分标识以及分组数据
            domainNodes.forEach((d: any) => {
              if (this.virtualNodesLevelFourMap.get(d)) {
                curSectorNodes.add(d);
                groupData.nodes.push(this.virtualNodesLevelFourMap.get(d));
              }
            });
            // 将聚类中心节点加入到分组数据（比如L3层目录）
            curSectorNodes.add(w);
            groupData.nodes.push(this.virtualNodesLevelFourMap.get(w));

            // 添加分组数据
            sectorResult.push(groupData);
          }
        }
      }
    }

    // 补充其他的未分组游离结构
    sectorRecord.others = {
      domainNodes: [],
      childrenSector: {},
    };
    const otherGroupData: any = {
      nodes: [],
      clusterData: null,
    };
    this.virtualNodesLevelFour.forEach((d: any) => {
      // 将未被划分到相应分组的节点抽出来到 other 分组
      if (!curSectorNodes.has(d.data.guid)) {
        curSectorNodes.add(d.data.guid);
        otherGroupData.nodes.push(
          this.virtualNodesLevelFourMap.get(d.data.guid)
        );
        sectorRecord.others.domainNodes.push(d.data.guid);
      }
    });
    sectorResult.push(otherGroupData);
    return sectorResult;
  }

  /**
   * 更新力模型并重启
   */
  restart(alpha = 0.3) {
    this.simulationLevelOneToThree
      .nodes(this.virtualNodesLevelOneToThree)
      .alpha(alpha)
      .restart();

    this.graph.virtualSectorInstances.forEach((instance: any) => {
      instance.simulation.nodes(instance.nodes).alpha(alpha).restart();
    });
  }

  /**
   * 销毁
   */
  destroy() {
    this.simulationLevelOneToThree.stop();
    this.simulationLevelOneToThree = null;

    this.simulationLevelFourInstanceList.forEach((instance: any) => {
      instance.simulation.stop();
      instance.simulation = null;
    });
    this.simulationLevelFourInstanceList = [];
  }
}
