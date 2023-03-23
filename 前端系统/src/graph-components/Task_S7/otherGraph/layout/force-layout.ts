import * as d3 from 'd3';
import { Edge, Node } from '../interface';
import BaseLayout from './base-layout';

export default class Force extends BaseLayout {
  public graph: any;

  public width = 300;

  public height = 300;

  public simulation: any = null;

  public tickCount = 300;

  public linkIterations = 30;

  public isOpenCenterForce = true;

  public isFirstCenter = true;

  public isFirstTickend = true;

  public initAutoZoom = false;

  public preTick = 0;

  public subSimulationStatus = false;

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
    const self = this;
    document.onkeydown = function (event: any) {
      // 空格停止迭代
      if (event.keyCode === 32) {
        self.simulation.stop();
      } else if (event.keyCode === 67) {
        // C 视图居中
        self.graph.runAutoZoom();
      }
    };

    const { graph } = this;
    this.tickCount = this.graph.maxTickCount;
    const { width, height, margin, radius } = graph;

    /** ********************************  子图布局 start   ************************************ */
    const nodes = !graph.isSubGraphLayoutStatus
      ? graph.nodes
      : graph.subGraph.nodes;
    const edges = !graph.isSubGraphLayoutStatus
      ? graph.edges
      : graph.subGraph.edges;

    /** ********************************  子图布局 end   ************************************ */

    this.simulation
      .nodes(nodes)
      .on('tick', () => {
        this.tick();
      })
      .on('end', () => {
        this.tickend();

        // 结束子图布局
        if (
          this.graph.isSubGraphLayoutStatus &&
          !this.graph.curSubGraphRecordItem.isFixed
        ) {
          this.graph.curSubGraphRecordItem.subGraph.nodes.forEach(
            (node: Node) => {
              node.fx = null;
              node.fy = null;
            }
          );
          this.graph.subGraphLayout = null;
          this.graph.isSubGraphLayoutStatus = false;
        }
      })
      // .alphaDecay(0.02) // alpha 迭代衰减值，默认为0.0228
      .velocityDecay(0.3) // 节点速度变化率，较低的衰减系数可以使得迭代次数更多，但可能会引起数值不稳定从而导致震荡
      .force(
        'link',
        d3
          .forceLink(edges)
          .id((d) => d.guid)
          .distance((d) => this.linkDistance(d))
          .strength((d) => this.linkStrength(d))
        // .iterations(this.linkIterations)
      ) // 设置弹力
      .force(
        'center',
        this.isOpenCenterForce
          ? d3
              .forceCenter()
              .x(width / 2)
              .y(height / 2)
          : null
      ) // 设置中心力，将图渲染至画布中心
      .force(
        'charge',
        d3.forceManyBody().strength((d) => this.chargeStrength(d))
      )
      .force(
        'collide',
        d3.forceCollide((d: Node) => this.collideRadius(d))
      ); // 设置碰撞力，以防止节点之间的重叠
  }

  async tick() {
    // TODO 在这里修改计算迭代+渲染的
    // console.log(this.tickCount, this.simulation.alpha());
    // console.log(111);

    this.tickCount -= 1;
    // console.log(
    //   `迭代次数为：${300 - this.tickCount - this.preTick}`,
    //   `aplha=${this.simulation.alpha()}`
    // );
    // 初始化时居中
    if (
      this.isFirstTickend &&
      this.tickCount < this.graph.firstAutoZoomTickCount
    ) {
      // console.log("force-tick-init-autozoom");
      this.graph.runAutoZoom();
      this.isFirstTickend = false;
    }

    // 扩展时居中
    if (
      this.initAutoZoom &&
      this.tickCount < this.graph.expandAutoZoomTickCount
    ) {
      // this.simulation.stop();
      this.graph.runAutoZoom();
      this.initAutoZoom = false;
    } else {
      // console.log(this.tickCount, this.graphconsole.expandAutoZoomTickCount);
    }

    if (this.tickCount <= this.graph.reStartTickCount) {
      // 达到迭代阈值，默认为300，停止
      this.simulation.stop();

      // 迭代完毕则取消固定
      if (!this.graph.isFixedPosition(this.graph.rootNode)) {
        this.graph.rootNode.fx = null;
        this.graph.rootNode.fy = null;
      }

      // 如果操作为扩展，则进行居中
      if (this.isExpandRecommendStatus) {
        this.graph.runAutoZoom();
        this.isExpandRecommendStatus = false;
      }

      this.tickCount = this.graph.maxTickCount;
    }
    // 过渡动画关闭，则表示节点坐标已计算完毕，可进行节点过渡变换
    if (!this.graph.isTransitionStatus) {
      this.moveNode(this.graph.nodesEl, false); // 对节点进行过渡变换
      this.moveLink(this.graph.edgesEl, false); // 对连边进行过渡变换

      // // if (!this.isExpandRecommendStatus) {
      // // }
      // // console.log(this.graph.graphData, this.isExpandRecommendStatus);
      const openSim = false;
      if (openSim && this.isExpandRecommendStatus && this.subSimulationStatus) {
        this.simulation.stop();
        // console.log("全局 stop");
        const sim = d3.forceSimulation();
        sim
          .nodes(this.graph.newNodes.concat(this.graph.rootNode))
          .force('charge', d3.forceManyBody().strength(-35))
          .force(
            'link',
            d3
              .forceLink(this.graph.newLinks)
              .id((d) => d.guid)
              .distance((d) => this.linkDistance(d))
              .strength((d) => this.linkStrength(d))
            // .iterations(this.linkIterations)
          ) // 设置弹力
          .force(
            'collide',
            d3.forceCollide((d: Node) => this.collideRadius(d))
          )
          .alpha(1.0)
          // .alphaDecay(0.999) // alpha 迭代衰减值，默认为0.0228
          // .velocityDecay(0.55)
          .on('tick', () => {
            // this.moveNode(this.graph.nodesEl, false); // 对节点进行过渡变换
            // this.moveLink(this.graph.edgesEl, false); // 对连边进行过渡变换
            // console.log("局部迭代");
          })
          .on('end', () => {
            // console.log("局部 end");
            // this.simulation.restart();
            // console.log("全局 restart");
            // this.isExpandRecommendStatus = false;
            // console.log("sub_sim end");
            // this.simulation.restart();
          });
        // .restart();

        // console.log("局部150次迭代");
        // sim.tick(10);

        this.graph.expnadStartTimer = new Date();
        this.graph.newNodes.forEach((d) => {
          d.fx = null;
          d.fy = null;
        });
        sim.tick(this.graph.preTickCount);
        console.log(
          '子图布局迭代时间(不含渲染)',
          new Date() - this.graph.expnadStartTimer,
          'ms'
        );

        // sim.tick(50);
        // await this.moveNode(this.graph.nodesEl, false); // 对节点进行过渡变换
        // await this.moveLink(this.graph.edgesEl, false); // 对连边进行过渡变换
        sim.stop();
        // sim = null;
        // 友好过渡效果
        this.simulation.restart();
        // console.log("全局 restart");

        // 直接计算过渡
        // console.log("全局迭代");
        // this.simulation.alphaDecay(0.0228);
        // .alpha(1);
        this.graph.expnadStartTimer = new Date();
        // this.graph.nodes.forEach((d) => {
        //   if (d.oldStatus) {
        //     d.oldStatus = false;
        //     d.fx = null;
        //     d.fy = null;
        //   }
        // });
        // const mainSim = d3
        //   .forceSimulation()
        //   .nodes(this.graph.nodes)
        //   // .force("charge", manyBodyReuse().strength(-35))
        //   .force(
        //     "collide",
        //     d3.forceCollide((d: Node) => this.collideRadius(d))
        //   );
        // mainSim.tick(this.graph.preTickCount);
        this.simulation.tick(this.graph.preTickCount);
        // sim.tick(50);
        // sim.stop();
        // this.simulation.tick(10);
        const expnadEndTimer = new Date();
        console.log(
          '全局迭代50次时间(不含渲染)',
          expnadEndTimer - this.graph.expnadStartTimer,
          'ms'
        );

        // this.simulation.stop();
        // this.isExpandRecommendStatus = false;

        // // 过渡变化
        // const openDuration = false;
        // this.moveNode(
        //   this.graph.nodesEl,
        //   openDuration,
        //   this.graph.subGraphLayoutDuration
        // ); // 对节点进行过渡变换
        // this.moveLink(
        //   this.graph.edgesEl,
        //   openDuration,
        //   this.graph.subGraphLayoutDuration
        // ); // 对连边进行过渡变换
        // if (openDuration) {
        //   setTimeout(() => {
        //     this.graph.runAutoZoom();
        //   }, this.graph.subGraphLayoutDuration);
        // } else {
        //   this.graph.runAutoZoom();
        // }

        // console.log(
        //   "快启动",
        //   this.graph.newNodes[0].x,
        //   this.graph.newNodes[0].y
        // );
        // sim
        //   .alphaDecay(0.0228) // alpha 迭代衰减值，默认为0.0228
        //   .velocityDecay(0.4)
        //   .alpha(1.0)
        //   .restart();

        //   console.log(
        //     "慢迭代",
        //     this.graph.newNodes[0].x,
        //     this.graph.newNodes[0].y
        //   );

        this.subSimulationStatus = false;

        // .restart(); // 节点速度变化率，较低的衰减系数可以使得迭代次数更多，但可能会引起数值不稳定从而导致震荡
      }
    } else {
      // 否则手动调用tick进行节点计算，采用10次
      // ---------------下面是力导布局增量扩展渲染效果用到的变量或方法处理
      // 这里采用暂时提高alphaDecay到0.9的方式，来降低tick的次数【主要用于降低tick导致的停滞时间】
      this.simulation.alphaDecay(0.99999);
      // 预计算，更好地得到迭代位置
      // console.log("aplha=", this.simulation.alpha());

      // this.graph.isTransitionStatus = false;
      // this.renderNewNodes();
      // 降低后续迭代的速度水平
      // this.preTick = this.140;
      // let count = Math.min(this.graph.allCurNodeByIdMap.size / 10, 5);
      // count = count < 2 ? 2 : count;

      // this.simulation.tick(this.graph.preTickCount); // default = 0.0228
      // console.log(this.graph.nodesEl.data()[0].x);

      // 仅计算时间时
      // this.simulation.tick(1); // default = 0.0228
      // this.moveLink(this.graph.edgesEl, false); // 对连边进行过渡变换
      // this.moveNode(this.graph.nodesEl, false); // 对节点进行过渡变换

      // 友好过渡动画效果时
      this.simulation.tick(80); // default = 0.0228

      // this.simulation.tick(this.graph.preTickCount); // default = 0.0228

      // this.moveNode(this.graph.nodesEl, false); // 对节点进行过渡变换
      // this.moveLink(this.graph.edgesEl, false); // 对连边进行过渡变换
      // console.log(this.graph.nodesEl.data()[0].x);
      // this.tickend();
      this.simulation.alphaDecay(0.001);
      // this.simulation.tick(preTick); // default = 0.0228
      // this.simulation.velocityDecay(0);
      // ---------------上面是力导布局增量扩展渲染效果用到的变量或方法处理
      // this.simulation.tick(10);
      // this.resetCenterForce();
      // this.moveNode(this.graph.nodesEl, true, 1200); // 对节点进行过渡变换
      // this.moveLink(this.graph.edgesEl, true, 1200); // 对连边进行过渡变换
    }
  }

  tickend() {
    // console.log("tickend");
    // return;
    // d3.select(this.graph.renderSvg.node().parentNode)
    //   .transition()
    //   .duration(2000)
    //   .call(
    //     this.graph.zoomObj.transform,
    //     d3.zoomIdentity.translate(transX, transY).scale(1.0)
    //   );

    // if (this.isFirstCenter) {
    // this.resetCenterForce();
    //   this.isFirstCenter = false;
    // }
    // 处于过渡动画状态中，表示进行节点过渡变换
    if (this.graph.isTransitionStatus) {
      this.graph.expnadStartTimer = new Date();
      // ---------------下面是力导布局增量扩展渲染效果用到的变量或方法处理
      // 得到增量信息
      this.graph.allCurLinkByIdMap.forEach((d) => {
        if (!this.graph.allPreLinkByIdMap.get(d.guid)) {
          this.graph.incrementLinkByIdMap.set(d.guid, d);
        }
      });
      // 对节点进行扩展增量
      // 把非增量节点的位置复位为原始位置

      this.graph.allCurNodeByIdMap.forEach((d) => {
        const oldNode = this.graph.allPreNodeByIdMap.get(d.guid);
        if (oldNode) {
          d.x = oldNode.x;
          d.y = oldNode.y;
        } else {
          this.graph.incrementNodeByIdMap.set(d.guid, d);
        }
      });

      // 将增量节点的transition位置赋为根节点位置的附近
      this.graph.incrementNodeByIdMap.forEach((d) => {
        // 防止吃力过大而移动
        const x = this.graph.rootNode.x + this.getRandomPosition();
        const y = this.graph.rootNode.y + this.getRandomPosition();
        d.x = x;
        d.y = y;
        // d.fx = x;
        // d.fy = y;
      });

      // this.graph.newNodes.forEach(d => {
      //   d.x = this.graph.rootNode.x + this.getRandomPosition();
      //   d.y = this.graph.rootNode.y + this.getRandomPosition();
      //   this.moveNode(this.graph.nodesEl, false); // 对节点进行过渡变换
      // this.moveLink(this.graph.edgesEl, false); // 对连边进行过渡变换
      // })

      // const expnadEndTimer = new Date();
      // console.log(
      //   '设置新增节点初始坐标时间',
      //   expnadEndTimer - this.graph.expnadStartTimer
      // );
      // if (this.graph.isFollow) {
      //   this.graph.incrementNodeByIdMap.forEach((d) => {
      //     if (this.graph.jumpLinkedNodeMap.get(d.guid)) {
      //       d.x =
      //         this.graph.jumpLinkedNodeMap.get(d.guid).x +
      //         this.getRandomPosition();
      //       d.y =
      //         this.graph.jumpLinkedNodeMap.get(d.guid).y +
      //         this.getRandomPosition();
      //     } else {

      //     d.x = this.graph.rootNode.x + this.getRandomPosition();
      //     d.y = this.graph.rootNode.y + this.getRandomPosition();
      //     }
      //   });

      //   this.graph.isFollow = false;
      // }

      // 把非增量节点的位置复位为原始位置
      // this.graph.allCurNodeByIdMap.forEach((d) => {
      //   const oldNode = this.graph.allPreNodeByIdMap.get(d.guid);
      //   if (oldNode) {
      //     d.x = oldNode.x;
      //     d.y = oldNode.y;
      //     this.graph.incrementNodeByIdMap.set(d.guid, d);
      //   }
      // });
      // ---------------上面是力导布局增量扩展渲染效果用到的变量或方法处理

      // this.moveNode(this.graph.nodesEl, false); // 对节点进行过渡变换
      // this.moveLink(this.graph.edg esEl, false); // 对连边进行过渡变换

      // ---------------下面是力导布局增量扩展渲染效果用到的变量或方法处理
      const timer = setTimeout(() => {
        clearTimeout(timer); // 确保定时器全局唯一
        this.simulation
          /** ********************************  子图布局 start   ************************************ */
          // 恢复一些力模型，以支持扩展交互
          .force(
            'link',
            d3
              .forceLink(this.graph.edges)
              .id((d) => d.guid)
              .distance((d) => this.linkDistance(d))
              .strength((d) => this.linkStrength(d))
              .iterations(this.linkIterations)
          ) // 设置弹力
          // .force(
          //   "center",
          //   this.isOpenCenterForce
          //     ? d3
          //         .forceCenter()
          //         .x(this.graph.width / 2)
          //         .y(this.graph.height / 2)
          //     : null
          // ) // 设置中心力，将图渲染至画布中心
          .force(
            'charge',
            d3.forceManyBody().strength((d) => this.chargeStrength(d))
          )
          /** ********************************  子图布局 end   ************************************ */

          .alphaTarget(0)
          .alphaMin(0.0008)
          .alphaDecay(0.00001) // alpha 迭代衰减值，默认为0.0228
          .alpha(0.01);
        // .velocityDecay(0.7); //摩擦力
        // this.simulation.tick(10);
        // if (this.graph.isExpandStatus) {
        // console.log("1");
        // this.simulation.force("charge", null);
        // }
        this.simulation.restart();
        // this.simulation.stop();

        // this.graph.newNodes.forEach((d) => {
        //   d.fx = null;
        //   d.fy = null;
        // });
        // this.simulation.tick(300);

        // this.moveNode(this.graph.nodesEl, true, 1000); // 对节点进行过渡变换
        // this.moveLink(this.graph.edgesEl, true, 1000); // 对连边进行过渡变换
      }, 105);

      // 清除增量和原有节点、边的map储存
      this.graph.incrementLinkByIdMap.clear();
      this.graph.incrementNodeByIdMap.clear();
      this.graph.allPreLinkByIdMap.clear();
      this.graph.allPreNodeByIdMap.clear();
      // ---------------上面是力导布局增量扩展渲染效果用到的变量或方法处理

      this.graph.isTransitionStatus = false; // 过渡完成后关闭过渡标识
    }
  }

  renderNewNodes() {
    if (this.graph.isTransitionStatus) {
      // ---------------下面是力导布局增量扩展渲染效果用到的变量或方法处理
      // 得到增量信息
      this.graph.allCurLinkByIdMap.forEach((d) => {
        if (!this.graph.allPreLinkByIdMap.get(d.guid)) {
          this.graph.incrementLinkByIdMap.set(d.guid, d);
        }
      });
      // 对节点进行扩展增量
      // 把非增量节点的位置复位为原始位置
      this.graph.allCurNodeByIdMap.forEach((d) => {
        const oldNode = this.graph.allPreNodeByIdMap.get(d.guid);
        if (oldNode) {
          d.x = oldNode.x;
          d.y = oldNode.y;
        } else {
          this.graph.incrementNodeByIdMap.set(d.guid, d);
        }
      });

      // 将增量节点的transition位置赋为根节点位置的附近
      this.graph.incrementNodeByIdMap.forEach((d) => {
        d.x = this.graph.rootNode.x + this.getRandomPosition();
        d.y = this.graph.rootNode.y + this.getRandomPosition();
      });

      this.moveNode(this.graph.nodesEl, false); // 对节点进行过渡变换
      this.moveLink(this.graph.edgesEl, false); // 对连边进行过渡变换

      // if (this.graph.isFollow) {
      //   this.graph.incrementNodeByIdMap.forEach((d) => {
      //     if (this.graph.jumpLinkedNodeMap.get(d.guid)) {
      //       d.x =
      //         this.graph.jumpLinkedNodeMap.get(d.guid).x +
      //         this.getRandomPosition();
      //       d.y =
      //         this.graph.jumpLinkedNodeMap.get(d.guid).y +
      //         this.getRandomPosition();
      //     } else {

      //     d.x = this.graph.rootNode.x + this.getRandomPosition();
      //     d.y = this.graph.rootNode.y + this.getRandomPosition();
      //     }
      //   });

      //   this.graph.isFollow = false;
      // }

      // 把非增量节点的位置复位为原始位置
      // this.graph.allCurNodeByIdMap.forEach((d) => {
      //   const oldNode = this.graph.allPreNodeByIdMap.get(d.guid);
      //   if (oldNode) {
      //     d.x = oldNode.x;
      //     d.y = oldNode.y;
      //     this.graph.incrementNodeByIdMap.set(d.guid, d);
      //   }
      // });
      // ---------------上面是力导布局增量扩展渲染效果用到的变量或方法处理

      // this.moveNode(this.graph.nodesEl, false); // 对节点进行过渡变换
      // this.moveLink(this.graph.edg esEl, false); // 对连边进行过渡变换

      // ---------------下面是力导布局增量扩展渲染效果用到的变量或方法处理
      const timer = setTimeout(() => {
        clearTimeout(timer); // 确保定时器全局唯一
        this.simulation
          // .nodes(this.graph.nodes)
          /** ********************************  子图布局 start   ************************************ */
          // 恢复一些力模型，以支持扩展交互
          .force(
            'link',
            d3
              .forceLink(this.graph.edges)
              .id((d) => d.guid)
              .distance((d) => this.linkDistance(d))
              .strength((d) => this.linkStrength(d))
              .iterations(this.linkIterations)
          ) // 设置弹力
          // .force(
          //   "center",
          //   this.isOpenCenterForce
          //     ? d3
          //         .forceCenter()
          //         .x(this.graph.width / 2)
          //         .y(this.graph.height / 2)
          //     : null
          // ) // 设置中心力，将图渲染至画布中心
          .force(
            'charge',
            d3.forceManyBody().strength((d) => this.chargeStrength(d))
          )
          /** ********************************  子图布局 end   ************************************ */

          .alphaTarget(0)
          .alphaMin(0.0008)
          .alphaDecay(0.00001) // alpha 迭代衰减值，默认为0.0228
          .alpha(0.01);
        // .velocityDecay(0.7); //摩擦力

        // this.simulation.restart();
        // this.simulation.tick(300);

        // this.moveNode(this.graph.nodesEl, true, 1000); // 对节点进行过渡变换
        // this.moveLink(this.graph.edgesEl, true, 1000); // 对连边进行过渡变换
        // }, 105);
      }, 10);

      // 清除增量和原有节点、边的map储存
      this.graph.incrementLinkByIdMap.clear();
      this.graph.incrementNodeByIdMap.clear();
      this.graph.allPreLinkByIdMap.clear();
      this.graph.allPreNodeByIdMap.clear();
      // ---------------上面是力导布局增量扩展渲染效果用到的变量或方法处理

      this.graph.isTransitionStatus = false; // 过渡完成后关闭过渡标识
    }
  }

  restart(data: any, alpha = 0.3) {
    this.tickCount = 300;

    this.simulation
      .nodes(data.nodes)
      .force(
        'link',
        d3
          .forceLink(data.edges)
          .id((d: any) => d.guid)
          .distance((d: any) => this.linkDistance(d))
          .strength((d) => this.linkStrength(d))
        // .iterations(this.linkIterations)
      ) // 设置弹力
      .force(
        'charge',
        d3.forceManyBody().strength((d) => this.chargeStrength(d))
      ) // 设置电磁力
      .alpha(alpha)
      .restart();
    // if (!this.subSimulationStatus) {
    // this.tickend();
    // }
  }

  /** **************    拖拽时只影响附近的节点 start    ******************* */

  /**
   * 去除除了碰撞力的其他所有力模型
   */
  cleanForce() {
    this.simulation
      .force('link', null)
      .force('center', null)
      .force('charge', null)
      .force(
        'collide',
        d3.forceCollide((d: Node) => this.collideRadius(d)).strength(1)
        // .iterations(1)
      ); // 设置碰撞力，以防止节点之间的重叠
  }

  resetCenterForce(transX, transY) {
    if (!transX) {
      this.simulation.force(
        'center',
        this.isOpenCenterForce
          ? d3
              .forceCenter()
              .x(this.graph.width / 2)
              .y(this.graph.height / 2)
          : null
      );
    } else {
      this.simulation.force(
        'center',
        this.isOpenCenterForce ? d3.forceCenter().x(transX).y(transY) : null
      );
    }
  }

  /**
   * 重新设置force
   */
  reSetForce() {
    this.simulation
      .force(
        'link',
        d3
          .forceLink(this.graph.edges)
          .id((d) => d.guid)
          .distance((d) => this.linkDistance(d))
          .strength((d) => this.linkStrength(d))
        // .iterations(this.linkIterations)
      ) // 设置弹力
      .force(
        'center',
        this.isOpenCenterForce
          ? d3
              .forceCenter()
              .x(this.graph.width / 2)
              .y(this.graph.height / 2)
          : null
      ) // 设置中心力，将图渲染至画布中心
      .force(
        'charge',
        d3.forceManyBody().strength((d) => this.chargeStrength(d))
      )
      .force(
        'collide',
        d3.forceCollide((d: Node) => this.collideRadius(d)).strength(1)
      ); // 设置碰撞力，以防止节点之间的重叠
  }

  /** **************    拖拽时只影响附近的节点 end    ******************* */

  /** ********************************  子图布局 start   ************************************ */

  /**
   * 用于子图布局后的刷新
   * @param data 图谱数据
   */
  subGraphLayoutRestart(data: any) {
    let sim = d3
      .forceSimulation()
      .nodes(data.nodes)
      .force(
        'collide',
        d3.forceCollide((d: Node) => this.collideRadius(d))
      )
      .alpha(1);
    // 迭代计算
    sim.tick(10);

    // this.simulation
    //   .nodes(data.nodes)
    //   // .alpha(1)
    //   // 类似增量布局，减缓衰减
    //   // .alphaTarget(0)
    //   // .alphaMin(0.0008)
    //   .alphaDecay(0.00001)
    //   .alpha(0.001);
    // // .velocityDecay(0.7);
    // // console.log(this.simulation.alphaDecay());
    // // 采用计算过渡方式变换
    // // console.log("迭代前", this.simulation.alpha());
    // // this.graph.runSubGraphLayoutStartTime = new Date();
    // this.simulation.tick(
    //   // Math.floor(this.simulation.alpha() / this.simulation.alphaDecay())
    //   150
    // );
    // // console.log("迭代后", this.simulation.alpha());

    const runSubGraphLayoutEndTime = new Date();
    // console.log(
    //   '切换子图布局时间',
    //   runSubGraphLayoutEndTime -
    //     this.graph.runSubGraphLayoutStartTime -
    //     this.graph.subGraphLayoutDuration +
    //     'ms'
    // );

    // this.graph.subGraphLayoutDuration = 1;
    this.moveNode(this.graph.nodesEl, true, this.graph.subGraphLayoutDuration); // 对节点进行过渡变换
    this.moveLink(this.graph.edgesEl, true, this.graph.subGraphLayoutDuration); // 对连边进行过渡变换

    // 销毁
    sim.stop();
    sim = null;
    // 采用迭代变换
    // this.simulation.restart();
    // setTimeout(() => {
    //   this.simulation
    //     .alphaTarget(0)
    //     .alphaMin(0.0008)
    //     .alphaDecay(0.0001)
    //     .alpha(0.01)
    //     .velocityDecay(0.7)
    //     .restart();
    // }, this.graph.subGraphLayoutDuration);
  }

  /** ********************************  子图布局 end   ************************************ */

  stop() {
    this.simulation.stop();
  }

  destroy() {
    this.simulation.stop();
    this.simulation = null;
  }

  collideRadius(d: any) {
    return d.r * 1.15;
  }

  /**
   * 根据连边端点的在图谱上的度大小设置连边长度
   * @returns {*}
   * @param d
   */
  linkDistance(d: Edge) {
    // return 30;
    // 模仿g6弹簧长度的算法
    const count1 = this.graph.getVisualNeighbors(d.sourceNode);
    const count2 = this.graph.getVisualNeighbors(d.targetNode);
    const minDegree = Math.min(count1, count2);
    const nodeSize = this.graph.radius;
    let distance;
    if (minDegree <= 1) {
      distance = nodeSize * 2;
    } else {
      distance = minDegree * nodeSize * 2;
    }
    distance = Math.min(distance, 300);
    distance = Math.max(distance, 120);
    // console.log(distance);
    // if (d.expandTimeOfEdge) {
    //   if (d.expandTimeOfEdge !== 1) {
    //     strength = strength * d.expandTimeOfEdge;
    //   }
    // }
    return distance;
  }

  /**
   * 弹簧弹力大小
   * @returns {number}
   * @param d
   */
  linkStrength(d: Edge) {
    return 1;
    const count1 = this.graph.getVisualNeighbors(d.sourceNode);
    const count2 = this.graph.getVisualNeighbors(d.targetNode);
    let strength;
    if (count1 <= 1 || count2 <= 1) {
      strength = 1;
    } else {
      strength = (1.05 / Math.min(count1, count2)) * 1.35;
    }

    if (strength > 1) {
      strength = 1;
    }

    // if (d.expandTimeOfEdge) {
    //   strength = strength * d.expandTimeOfEdge;
    // }

    return strength;
  }

  /**
   * 根据节点在图谱上的度大小设置电荷力
   * @param d
   */
  chargeStrength(d: Node) {
    // return -2000;
    const count = this.graph.getVisualNeighbors(d);
    let strength;
    if (count <= 1) {
      // 度为1的节点具有较强的斥力，从而使得较小度的节点相互排开
      strength = -10000;
    } else if (count >= 4) {
      // 高度节点具有较强的引力，从而吸引周围较小度的节点，促成圆形排布
      strength = -5000;
    } else {
      // 其他中度节点
      strength = -3000;
    }

    // if (d.expandTimeOfNode) {
    //   if (d.expandTimeOfNode !== 1) {
    //     strength = strength * d.expandTimeOfNode;
    //   }
    // }

    return strength;
  }

  /**
   * （可作为统一的图谱方法）
   * 节点移动（带过渡效果）
   * @param nodesEl
   * @param isTransition 是否启用过渡动画
   * @param duration 过渡时间
   */
  moveNode(nodesEl: any, isTransition: boolean, duration = 120) {
    if (isTransition) {
      nodesEl
        .transition()
        // ---------------下面是力导布局增量扩展渲染效果用到的变量或方法处理
        .duration(duration)
        // ---------------上面是力导布局增量扩展渲染效果用到的变量或方法处理
        .attr('transform', (d: Node) => `translate(${d.x},${d.y})`);
    } else {
      nodesEl.attr('transform', (d: Node) => `translate(${d.x},${d.y})`);
    }
  }

  /**
   * （可作为统一的图谱方法）
   * 连边移动（带过渡效果）
   * @param edgesEl
   * @param isTransition 是否启用过渡动画
   * @param duration 过渡时间
   */
  moveLink(edgesEl: any, isTransition: boolean, duration = 120) {
    if (isTransition) {
      edgesEl
        .selectAll('path')
        .transition()
        // ---------------下面是力导布局增量扩展渲染效果用到的变量或方法处理
        .duration(duration)
        // ---------------上面是力导布局增量扩展渲染效果用到的变量或方法处理
        .attr(
          'd',
          (d: Edge) =>
            `M ${d.sourceNode.x} ${d.sourceNode.y} L ${d.targetNode.x} ${d.targetNode.y}`
        );
    } else {
      edgesEl
        .selectAll('path')
        .attr(
          'd',
          (d: Edge) =>
            `M ${d.sourceNode.x} ${d.sourceNode.y} L ${d.targetNode.x} ${d.targetNode.y}`
        );
    }
  }

  // ------------ ---下面是增量扩展渲染效果用到的变量或方法处理
  getRandomPosition() {
    // 用于获取增量节点的初始transition位置
    // return 0;
    return Math.round((Math.random() - 0.5) * 40); // 【-0.5，0.5】*40=【-20，20】
  }
}
