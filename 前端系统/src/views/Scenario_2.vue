<template>
  <div class="page-container">
    <div class="interaction-container">
      <div class="select-dataset-container">
        <span> 数据集 </span>
        <a-select
          class="dataset-select"
          v-model:value="dataset"
          :options="datasetList"
          @change="changeDataset"
        >
        </a-select>
      </div>
      <a-divider></a-divider>
      <p class="statistics-title">图谱点边规模统计</p>
      <p class="statistics-description">
        节点 &nbsp;
        <span
          >共
          <span class="statistics-description-number"
            >{{ nodeTypesData.length }} </span
          >种类型 ，包含<span class="statistics-description-number">
            {{ nodeTypesData.reduce((cur, x) => cur + x.value, 0) }} </span
          >个节点
        </span>
      </p>
      <a-table
        class="statistics-table"
        :columns="nodeColumns"
        :data-source="nodeTypesData"
        :pagination="{ pageSize: 50 }"
        :scroll="{ y: 200 }"
        size="small"
      />
      <p class="statistics-description">
        连边 &nbsp;
        <span
          >共
          <span class="statistics-description-number">
            {{ edgeTypesData.length }} </span
          >种类型 ，包含
          <span class="statistics-description-number">
            {{ edgeTypesData.reduce((cur, x) => cur + x.value, 0) }}
          </span>
          条连边
        </span>
      </p>
      <a-table
        class="statistics-table"
        :columns="edgeColumns"
        :data-source="edgeTypesData"
        :pagination="{ pageSize: 50 }"
        :scroll="{ y: 200 }"
        size="small"
      />
    </div>
    <div class="graph-container">
      <div class="graph-render" id="graph-render">
        <div class="graphInfos-container"></div>

        <div class="control-toolbar">
          <a-button-group class="func-toolbar">
            <a-button
              @click="runFullScreen"
              :title="isFullBrowser ? '退出全屏' : '全屏显示'"
            >
              <FullscreenOutlined v-show="!isFullBrowser" />
              <FullscreenExitOutlined v-show="isFullBrowser" />
            </a-button>
            <a-button
              @click="runMultiRenderMaxSubGraph"
              title="展开骨架"
              :disabled="isRunMultiRenderMaxSubGraph"
            >
              <BranchesOutlined />
            </a-button>
            <a-button @click="runAutoZoom" title="视图自动放缩居中">
              <BorderOuterOutlined />
            </a-button>
            <a-button @click="runButtonZoom('large')" title="视图放大">
              <ZoomInOutlined />
            </a-button>
            <a-button @click="runButtonZoom('small')" title="视图缩小">
              <ZoomOutOutlined />
            </a-button>
          </a-button-group>
        </div>
        <!-- <div class="legend-container" id="legend-container">
          <p class="legend-container-title">图例</p>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, reactive, toRefs, toRaw, defineComponent, onMounted } from 'vue';

// 导入UI库
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  BorderOuterOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  BranchesOutlined,
} from '@ant-design/icons-vue';

import { useRouter } from 'vue-router';

// 导入图对象和数据
import Graph from '@/graph-components/Scenario_2';
import case1 from '@/static/dataset/Scenario_2/数字化运营_cleaned_graph_N-20305_E-20531.json';
import case2 from '@/static/dataset/Scenario_2/云服务运营_cleaned_graph_N-20420_E-21187.json';
import case3 from '@/static/dataset/Scenario_2/DevSecOps_cleaned_graph_N-20905_E-20531.json';
import case4 from '@/static/dataset/Scenario_2/商业变现_cleaned_graph_N-23068_E-22453.json';
import case5 from '@/static/dataset/Scenario_2/云服务360总表衍生表_cleaned_graph_N-12454_E-13042.json';
import case6 from '@/static/dataset/Scenario_2/云服务360运维域指标月表衍生表_cleaned_graph_N-23746_E-23405.json';
import case7 from '@/static/dataset/Scenario_2/第一批未命名数据_cleaned_graph_N-8929_E-10079.json';

export default defineComponent({
  name: 'Scenario_2',
  components: {
    FullscreenOutlined,
    FullscreenExitOutlined,
    BorderOuterOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    BranchesOutlined,
  },
  setup(props, context) {
    // 路由对象, 用于跳转
    const router = useRouter();

    // 定义响应式数据属性
    const reactiveData = reactive({
      // 任务相关
      taskID: 'Scenario_2', // 任务ID
      taskName: '场景二迁移测试', // 任务标题
      taskInfos: '任务描述文字', // 任务说明文字
      isStart: false, // 是否开始任务
      isFinish: false, // 是否结束任务
      useTarget: 'ours', // 评星对象标识, others或ours
      showFinishModel: false, // 是否展示完成对话框
      secondsToGo: 5, // 自动跳转时间
      nextUrl: 'Scenario_1', // 下一个路由

      // 数据集
      datasetList: [
        {
          value: 'case1',
          label: '数字化运营_N-19358_E-23265',
        },
        {
          value: 'case2',
          label: '云服务运营_N-19511_E-23163',
        },
        {
          value: 'case3',
          label: 'DevSecOps_N-19991_E-22483',
        },
        {
          value: 'case4',
          label: '商业变现_N-22118_E-25341',
        },
        {
          value: 'case5',
          label: '云服务360总表衍生表_N-11990_E-13452',
        },
        {
          value: 'case6',
          label: '云服务360运维域指标月表衍生表_N-22692_E-24152',
        },
        {
          value: 'case7',
          label: '第一批未命名数据_N-8645_E-10402',
        },
      ],
      dataset: 'case1',

      // 图谱数据
      // graphData: { nodes: [], edges: [] },
      // 节点类型与规模
      nodeTypesData: [],
      nodeColumns: [
        {
          title: '类型',
          dataIndex: 'typeName',
          sorter: (a, b) => a.typeName.localeCompare(b.typeName),
        },
        {
          title: '规模（个）',
          dataIndex: 'value',
          defaultSortOrder: 'descend',
          sorter: (a, b) => a.value - b.value,
        },
      ],
      edgeTypesData: [],
      edgeColumns: [
        {
          title: '类型',
          dataIndex: 'relationshipTypeName',
          sorter: (a, b) =>
            a.relationshipTypeName.localeCompare(b.relationshipTypeName),
        },
        {
          title: '规模（条）',
          dataIndex: 'value',
          defaultSortOrder: 'descend',
          sorter: (a, b) => a.value - b.value,
        },
      ],

      // 功能项
      isFullBrowser: false, // 是否全屏
      curScale: 1.0, // 当前放缩倍数
      scaleDatal: 0.1, // 放缩增量
      isRunMultiRenderMaxSubGraph: false, // 控制是否已经展开骨架
    });

    // 定义普通数据
    const rawData = {
      // 图谱相关
      graph: {}, // 图谱类对象
      graphData: {}, // 图谱数据
      selector: '#graph-render', // 渲染的元素选择器名称
      // legendContainer: '#legend-container', // 图例渲染容器
      container: null, // 渲染容器
      width: 0, // 画布宽
      height: 0, // 画布高
      radius: 0, // 节点半径
      layout: 'Force', // 布局算法
      keyNode: '', // 交互的关键节点
      originalCaseNodeGuid: '', // 初始的中心节点
      bussinessDomain: '', // 数据所属业务领域
    };

    /**
     * 根据数据集字符串获取对应的数据
     */
    const switchData = (datasetName: string) => {
      let data: any;
      switch (datasetName) {
        case 'case1':
          data = case1;
          break;
        case 'case2':
          data = case2;
          break;
        case 'case3':
          data = case3;
          break;
        case 'case4':
          data = case4;
          break;
        case 'case5':
          data = case5;
          break;
        case 'case6':
          data = case6;
          break;
        case 'case7':
          data = case7;
          break;
        default:
          data = case1;
      }
      return data;
    };

    /**
     * 路由跳转
     * @param url 跳转的路由地址
     */
    const goToNextPage = (url: string | null = null) => {
      router.push({
        path: url || reactiveData.nextUrl,
      });
    };

    /**
     * 初始化图谱相关数据
     */
    const initGraphInfos = () => {
      rawData.graph = {}; // 图谱类对象
      rawData.graphData = case1; // 图谱数据
      rawData.selector = '#graph-render'; // 渲染的元素选择器名称
      // rawData.legendContainer = '#legend-container' // 图例渲染容器
      rawData.container = document.querySelector(rawData.selector) as any; // 渲染容器
      rawData.width = (
        document.querySelector('.graph-container') as any
      ).clientWidth; // 画布宽
      rawData.height = (
        document.querySelector('.graph-container') as any
      ).clientHeight; // 画布高
      rawData.radius = 5; // 节点半径
    };

    /**
     * 实例化图谱类对象
     */
    const createGraph = () => {
      // 停止之前的
      if (rawData.graph.virtualSectorInstances) {
        rawData.graph.virtualSectorInstances.forEach((d) => {
          d.simulation.stop();
        });
      }

      rawData.graph = {};
      // 实例化新对象
      rawData.graph = new Graph({
        selector: rawData.selector,
        container: rawData.container,
        // legendContainer: rawData.legendContainer,
        width: rawData.width,
        height: rawData.height,
        radius: rawData.radius,
        data: rawData.graphData,
      });
    };

    /**
     * 切换数据集
     */
    const changeDataset = () => {
      // 更新状态
      // reactiveData.curQuestionIndex += 1
      // reactiveData.userAns = ''
      // reactiveData.timestampStart = new Date()

      // 清除先前绘制的元素
      if (document.querySelector('#graph-render #graph-painter')) {
        document.querySelector('#graph-render #graph-painter')?.remove();
      }

      // 进行图谱绘制
      // reactiveData.graphData = reactiveData.dataset;
      rawData.graphData = switchData(toRaw(reactiveData.dataset));

      // 统计点边
      const nodeTypeNameMap = new Map();
      rawData.graphData.nodes.forEach((d: any) => {
        if (!d.properties.isAbstract) {
          if (nodeTypeNameMap.has(d.typeName)) {
            nodeTypeNameMap.set(
              d.typeName,
              nodeTypeNameMap.get(d.typeName) + 1
            );
          } else {
            nodeTypeNameMap.set(d.typeName, 1);
          }
        }
      });
      const edgeTypeNameMap = new Map();
      rawData.graphData.edges.forEach((d: any) => {
        if (!d.properties.isAbstract) {
          if (edgeTypeNameMap.has(d.relationshipTypeName)) {
            edgeTypeNameMap.set(
              d.relationshipTypeName,
              edgeTypeNameMap.get(d.relationshipTypeName) + 1
            );
          } else {
            edgeTypeNameMap.set(d.relationshipTypeName, 1);
          }
        }
      });
      reactiveData.nodeTypesData.length = 0;
      for (let key of nodeTypeNameMap.keys()) {
        reactiveData.nodeTypesData.push({
          value: nodeTypeNameMap.get(key),
          name: key,
          typeName: key,
          key,
        });
      }
      reactiveData.edgeTypesData.length = 0;
      for (let key of edgeTypeNameMap.keys()) {
        reactiveData.edgeTypesData.push({
          value: edgeTypeNameMap.get(key),
          name: key,
          relationshipTypeName: key,
          key,
        });
      }

      // 实例化图谱类对象并渲染
      createGraph();
    };

    /**
     * 全屏以及退出全屏
     */
    const runFullScreen = () => {
      if (!reactiveData.isFullBrowser) {
        const element = document.documentElement as any;
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozExitFullScreen) {
          document.mozExitFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }

      reactiveData.isFullBrowser = !reactiveData.isFullBrowser;
    };

    // 进行网络骨架展开
    const runMultiRenderMaxSubGraph = () => {
      reactiveData.isRunMultiRenderMaxSubGraph = true;
      rawData.graph.runMultiRenderMaxSubGraph();
    };

    /**
     * 视图自动放缩居中
     */
    const runAutoZoom = () => {
      rawData.graph.runAutoZoom();
    };

    /**
     * 视图按钮放缩
     */
    const runButtonZoom = (zoomFlag: string) => {
      switch (zoomFlag) {
        case 'large':
          reactiveData.curScale += reactiveData.scaleDatal;
          break;
        case 'small':
          reactiveData.curScale -= reactiveData.scaleDatal;
          break;
        case 'init':
        default:
          reactiveData.curScale = 1.0;
      }
      reactiveData.curScale =
        reactiveData.curScale <= 0 ? 1e-3 : reactiveData.curScale;
      rawData.graph.runAutoZoom(600, {
        status: true,
        scale: reactiveData.curScale,
      });
    };

    // /**
    //  * 实例化图谱类对象并渲染
    //  */
    // const realizeGraph = () => {
    //   const caseDataset = reactiveData.questionList[
    //     reactiveData.curQuestionIndex - 1
    //   ].caseDataset as any

    //   // reactiveData.graphData = caseDataset
    //   rawData.graphData = toRaw(reactiveData.graphData)
    //   // 实例化图谱类对象并渲染
    //   createGraph()
    // }

    // /**
    //  * 开始任务
    //  */
    // const startTask = () => {
    //   reactiveData.isStart = true
    //   reactiveData.curQuestionIndex = 1
    //   reactiveData.userAns = ''
    //   reactiveData.timestampStart = new Date()

    //   realizeGraph()
    // }

    // /**
    //  * 提交答案
    //  */
    // const submitAns = () => {
    //   // 向后台发送提交请求

    //   // 判断是否结束
    //   if (reactiveData.curQuestionIndex === reactiveData.questionList.length) {
    //     reactiveData.isFinish = true
    //     return
    //   }

    //   // 更新状态
    //   reactiveData.curQuestionIndex += 1
    //   reactiveData.userAns = ''
    //   reactiveData.timestampStart = new Date()

    //   // 清除先前绘制的元素
    //   if (document.querySelector('#graph-render #graph-painter')) {
    //     document.querySelector('#graph-render #graph-painter')?.remove()
    //   }

    //   // 进行图谱绘制
    //   realizeGraph()
    // }

    // /**
    //  * 提交评星
    //  */
    // const submitRate = () => {
    //   reactiveData.isFinishRate = true
    //   reactiveData.showFinishModel = true

    //   const interval = setInterval(() => {
    //     reactiveData.secondsToGo -= 1
    //   }, 1000)

    //   setTimeout(() => {
    //     clearInterval(interval)
    //     goToNextPage()
    //   }, reactiveData.secondsToGo * 1000)
    // }

    onMounted(() => {
      // 清除先前绘制的元素
      if (document.querySelector('#graph-render #graph-painter')) {
        document.querySelector('#graph-render #graph-painter')?.remove();
      }
      // 初始化图谱相关数据
      initGraphInfos();
      // 绘制初始图谱
      changeDataset();
    });

    // 将数据和方法返回
    return {
      // 数据
      ...toRefs(reactiveData),

      // 方法
      // startTask,
      // submitAns,
      // submitRate,
      goToNextPage,
      changeDataset,

      // 交互菜单栏
      runFullScreen,
      runAutoZoom,
      runButtonZoom,
      runMultiRenderMaxSubGraph,
    };
  },
});
</script>

<style scoped>
.page-container {
  position: relative;
  background-color: #ffffff;
  height: 100%;
  border-radius: 8px;
  box-shadow: 1px 1px 5px #cccccc;
}
.interaction-container {
  position: relative;
  float: left;
  width: 21%;
  height: 100%;
  border-right: 1px dotted #cccccc;
  text-align: center;
  box-sizing: border-box;
  padding: 20px 0px;
}

.select-dataset-container {
  margin-top: 10px;
}

.dataset-select {
  width: 80%;
  text-align: left;
}

.statistics-title {
  text-align: center;
  font-size: 22px;
  margin: 10px 0;
  color: #333333;
}

.statistics-description {
  font-size: 18px;
}
.statistics-description-number {
  color: #666666;
  font-weight: bold;
}

.statistics-table {
  width: 90%;
  margin: 0 auto;
}

.graph-container {
  /* background: linear-gradient(45deg, #ffffff 50%, #fcfcfc 0); */
  /* background-size: 10px 10px; */
  background: #ffffff;
  position: relative;
  float: right;
  width: 78.9%;
  height: 100%;
  overflow: hidden;
}

.graphInfos-container {
  position: absolute;
  top: 20px;
  left: 30px;
  font-size: 20px;
}
.control-toolbar {
  position: absolute;
  top: 20px;
  right: 30px;
}

.legend-container {
  position: absolute;
  width: 180px;
  padding: 10px;
  bottom: 20px;
  right: 30px;
  border: 1px solid #cccccc;
  border-radius: 5px;
  background-color: #ffffff;
}
.legend-container-title {
  font-size: 16px;
  text-align: center;
  margin: 0 0 5px 0;
}
</style>
