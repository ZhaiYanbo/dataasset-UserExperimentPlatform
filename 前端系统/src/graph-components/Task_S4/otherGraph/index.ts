import G6 from '@antv/g6';
import { nodeInfoConfig } from '@/graph-components/common/static-const-value';
import { getExpandGraphFromNode } from '@/utils/axios';
import { renderLegend } from '@/graph-components/common/util-function';

export default class Graph {
  // 默认配置项
  private graphInstance: GraphInstance | null = null; // 图谱对象
  private cfg: any;
  private width = 800;
  private height = 600;
  private selector = '#graph-render';
  private legendContainer = '#legend-container';
  private container: 'graph-render';

  private data: any = {
    nodes: [],
    edges: [],
  };
  private allCurNodesMap = new Map();
  private allCurEdgesMap = new Map();

  private radius = 20;

  constructor(props = {}) {
    Object.assign(this, props);
    this.init();
  }

  init(): void {
    this.initGraph();
    this.setData();
    this.render();
  }

  initGraph(): void {
    const contextMenu = new G6.Menu({
      getContent(evt: any) {
        // const itemType = evt.item.getType();
        // 获取数据节点
        const node = evt.item._cfg.model;
        let contextInfo = '<h3>关系扩展</h3>';
        // 获取可扩展关系列表
        const expandList = [];
        Object.keys(nodeInfoConfig[node.typeName].expandRelations).forEach(
          (key) => {
            if (
              key !== '获取推荐拓展关系列表' &&
              key !== '其他关系' &&
              key !== '推荐关系'
            ) {
              expandList.push({
                name: key,
                value: nodeInfoConfig[node.typeName].expandRelations[key],
              });
            }
          }
        );
        expandList.forEach((d) => {
          contextInfo += `<p data-value='${d.value}'>${d.name}</p>`;
        });
        return contextInfo;
      },
      handleMenuClick: (target: HTMLElement, item: any) => {
        // 扩展关系
        const node = item._cfg.model;
        const relationshipTypeName = target.getAttribute('data-value');

        // 发送请求
        getExpandGraphFromNode(node, relationshipTypeName)
          .then((res) => {
            // 设置数据
            const expandData = res.data.content;
            this.handleData(expandData);
            expandData.nodes.forEach((d) => {
              if (!this.allCurNodesMap.has(d.guid)) {
                this.data.nodes.push(d);
                this.allCurNodesMap.set(d.guid, d);
              }
            });
            expandData.edges.forEach((d) => {
              if (!this.allCurEdgesMap.has(d.guid)) {
                this.data.edges.push(d);
                this.allCurEdgesMap.set(d.guid, d);
              }
            });

            // 更新渲染
            this.graphInstance.changeData(this.data);

            // 更新图例
            this.updateLegend();
          })
          .catch((err) => console.log(err));
      },
      offsetX: 16 + 10,
      offsetY: 0,
      itemTypes: ['node'],
    });

    this.graphInstance = new G6.Graph({
      container: this.container,
      width: this.width,
      height: this.height,
      // fitView: true,
      // fitCenter: true,
      // animate: true,
      // renderer: 'svg',
      plugins: [contextMenu],
      layout: {
        type: 'force',
        preventOverlap: true,
        center: [this.width / 2, this.height / 2], // 可选
        linkDistance: 100,
        // nodeSize: this.radius, // 可选
        alpha: 1, // 可选
        onTick: () => {
          // 可选
          // console.log('ticking');
        },
        onLayoutEnd: () => {
          // 可选
          // console.log('force layout done');
        },
      },
      // 交互
      modes: {
        // 支持的 behavior
        default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
        edit: ['click-select'],
      },

      // 样式
      defaultNode: {
        type: 'circle',
        size: this.radius,
      },
      defaultEdge: {
        style: {
          lineWidth: 1.5, // 线宽
          stroke: '#778899', // 线的颜色
          endArrow: {
            path: G6.Arrow.vee(this.radius / 4, this.radius / 4),
          },
        },
      },
    });
  }

  /**
   * 绑定数据
   * @param data
   */
  setData(data?: any): void {
    this.data = data || this.data;
    this.handleData(this.data);

    this.data.nodes.forEach((d) => {
      this.allCurNodesMap.set(d.guid, d);
    });
    this.data.edges.forEach((d) => {
      this.allCurEdgesMap.set(d.guid, d);
    });

    this.graphInstance.data(this.data);
  }

  /**
   * 渲染
   */
  render(): void {
    this.graphInstance.render();
    this.updateLegend();
  }

  /**
   * 处理节点数据，从而符合G6的渲染规则
   * @param nodes
   */
  handleData(data: any): void {
    data.nodes.forEach((d: any) => {
      d.id = d.guid;
      d.label = nodeInfoConfig[d.typeName].iconLable;
      d.style = {
        stroke: nodeInfoConfig[d.typeName].backgroundColor,
        lineWidth: 2,
        fill: nodeInfoConfig[d.typeName].color,
      };
    });
    data.edges.forEach((d: any) => {
      d.id = d.guid;
    });
  }

  /**
   * 绘制图例
   */
  updateLegend(): void {
    const legendList = Array.from(
      new Set(this.data.nodes.map((d: Node) => d.typeName))
    );

    renderLegend(this.legendContainer, legendList);
  }
}
