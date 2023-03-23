<template>
  <div class="page-container">
    <div class="interaction-container">
      <span class="page-name">
        {{ taskName }}
      </span>
      <div class="hr"></div>
      <div class="introduction" v-show="!isStart">
        <p class="introduction-info">
          {{ taskInfosPre }}
        </p>
        <p class="introduction-info">
          {{ taskInfos }}
        </p>
        <a-button class="_trans-block-center" @click="startTask">开始</a-button>
      </div>
      <div class="question-container" v-show="isStart">
        <p class="question-info">
          第 {{ curQuestionIndex }} 题 / 共 {{ questionList.length }} 题<br />
          <a-progress
            style="margin-bottom: 8px"
            :percent="
              isFinish
                ? 100
                : parseInt(
                    ((curQuestionIndex - 1) / questionList.length) * 100 + ''
                  )
            "
          />
        </p>
        <div class="answer-list" v-show="!isFinish">
          <p class="question-info">
            Q: {{ questionList[curQuestionIndex - 1].description }}
          </p>
          <p class="question-info">
            目标节点类型:
            {{
              questionList[curQuestionIndex - 1].caseDataset.targetNodeTypeName
            }}
          </p>
          <a-button
            class="_trans-block-center submit-button"
            :disabled="!canClickNext"
            @click="submitAns"
            >下一题
          </a-button>
        </div>
      </div>
      <div class="rate-container" v-show="isFinish">
        <p class="rate-info">{{ rateAns.description }}</p>
        <div class="rate-list">
          <div
            class="rate-item"
            v-for="item in rateAns.indicatorList"
            :key="item.label"
          >
            <span class="rate-label">{{ item.label }}</span>
            <a-rate v-model:value="item.value" />
          </div>
          <a-button
            class="_trans-block-center submit-button"
            :disabled="
              !rateAns.indicatorList
                .map((d) => d.value)
                .every((d) => Boolean(d)) || isFinishRate
            "
            @click="submitRate"
            >提交
          </a-button>
        </div>
      </div>
      <a-modal
        v-model:visible="showFinishModel"
        :closable="false"
        :maskClosable="false"
        title="完成提示"
      >
        <p>
          恭喜您已完成"智能化图交互分析导航"实验A, {{ secondsToGo }}s
          后将跳转至"智能化图交互分析导航"实验B
        </p>
        <template #footer>
          <a-button key="submit" type="primary" @click="goToNextPage()"
            >立即跳转</a-button
          >
        </template>
      </a-modal>
    </div>
    <div class="graph-container">
      <div class="task-intro-img-container" v-show="!isStart">
        <img
          class="task-intro-img"
          :src="taskIntroImgPath"
          alt="task-intro-img"
        />
      </div>

      <div class="graph-render" id="graph-render" v-show="isStart">
        <ContextMenu
          :taskID="taskID"
          ref="contextMenu"
          @triggerContextMenu="triggerContextMenu"
          @postSelectedNodeList="postSelectedNodeList"
          @resetForceFxFy="resetForceFxFy"
          @runAutoZoom="runAutoZoom"
        ></ContextMenu>

        <div class="graphInfos-container">
          {{ questionList[curQuestionIndex - 1].caseName }}
        </div>

        <div class="control-toolbar">
          <a-button-group class="func-toolbar">
            <a-button
              @click="runFullScreen"
              :title="isFullBrowser ? '退出全屏' : '全屏显示'"
            >
              <FullscreenOutlined v-show="!isFullBrowser" />
              <FullscreenExitOutlined v-show="isFullBrowser" />
            </a-button>
            <!-- <a-button @click="runSwitchLayout('subgraph')" title="局部布局切换">
              <SlidersOutlined />
            </a-button>
            <a-button @click="runSwitchLayout('graph')" title="全局布局切换">
              <ApartmentOutlined />
            </a-button> -->
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

          <div class="layout-ctx graph-layout-ctx" v-show="openGraphSwitch">
            <div class="title-div">全局布局切换</div>
            <a-divider></a-divider>
            <div>
              <a-button
                v-for="item in subGraphLayoutList"
                :key="item.value"
                @click="runGraphLayout(item.value)"
              >
                {{ item.label }}
              </a-button>
            </div>
          </div>
          <div
            class="layout-ctx subgraph-layout-ctx"
            v-show="openSubgraphSwitch"
          >
            <div class="title-div">局部布局切换</div>
            <div class="select-subgraph-div">
              <span class="select-subgraph" @click="callBrushHandle(true)"
                >圈选子图</span
              >
              <span class="select-subgraph" @click="callFixSubGraph"
                >固定子图</span
              >
              <span class="select-subgraph" @click="callBrushHandle(false)"
                >取消圈选</span
              >
            </div>
            <a-divider></a-divider>
            <div>
              <a-button
                v-for="item in subGraphLayoutList"
                :key="item.value"
                @click="runSubGraphLayout(item.value)"
              >
                {{ item.label }}
              </a-button>
            </div>
          </div>
        </div>

        <div class="legend-container" id="legend-container">
          <p class="legend-container-title">图例</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ref,
  reactive,
  toRefs,
  toRaw,
  defineComponent,
  computed,
  onMounted,
} from 'vue'

// 导入UI库
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  BorderOuterOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  SlidersOutlined,
  ApartmentOutlined,
} from '@ant-design/icons-vue'

import { useRouter } from 'vue-router'

// 导入右键菜单组件
import { message } from 'ant-design-vue'
import ContextMenu from '@/components/ContextMenu.vue'

// 导入图对象和数据
import Graph from '@/graph-components/Task_S7/otherGraph'
import {
  getExpandGraphFromNode,
  setBussinessDatasetCache,
  postAns,
} from '@/utils/axios'

export default defineComponent({
  name: 'Task_S7-ours',
  components: {
    FullscreenOutlined,
    FullscreenExitOutlined,
    BorderOuterOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    SlidersOutlined,
    ApartmentOutlined,

    ContextMenu,
  },
  setup(props, context) {
    // 路由对象, 用于跳转
    const router = useRouter()

    // 右键菜单子组件
    const contextMenu: any = ref(null)

    // 定义响应式数据属性
    const reactiveData = reactive({
      // 任务相关
      taskID: 'task_S7-others', // 任务ID
      taskName: '智能化图交互分析导航实验A', // 任务标题
      taskInfosPre: '本实验共3个小任务，任务内容为：', // 任务说明前缀文本
      taskInfos:
        '每一个小任务将呈现一个原始图谱，并给出目标节点类型，同时指导员将给出目标图谱示意图。请在指导员的引导下对图谱节点进行右键关系扩展操作，直至找到目标节点为止', // 任务说明文字
      taskIntroImgPath: '../static/task-intro-img/Task_S7-others.png', // 任务介绍图片
      isStart: false, // 是否开始任务
      isFinish: false, // 是否结束任务
      useTarget: 'others', // 评星对象标识, others或ours
      showFinishModel: false, // 是否展示完成对话框
      secondsToGo: 5, // 自动跳转时间
      nextUrl: 'task_S7-ours', // 下一个路由

      // 问卷相关
      questionList: [
        {
          description:
            '请根据指导员的实验引导，对图谱节点进行右键关系扩展操作，直至找到目标节点为止',
          caseName: 'Case 1',
          caseDataset: {
            guid: 'a6c952a5-a8b7-4d6a-b19d-2e5b0a9c9946',
            typeName: 'dli.Table',
            bussinessDomain: '第一批数据',
            targetNodeGuid: 'b28f5e4a-93a9-4d6b-a834-808ffeb1451d',
            targetNodeTypeName: 'dli.Table',
            isMulti: false,
            multiNodeList: [],
          },
        },
        {
          description:
            '请根据指导员的实验引导，对图谱节点进行右键关系扩展操作，直至找到目标节点为止',
          caseName: 'Case 2',
          caseDataset: {
            guid: 'bbdb4f2b-4885-4781-9e37-9895a45c24e7',
            typeName: 'dli.Table',
            bussinessDomain: '云服务360总表',
            targetNodeGuid: 'ffb1cb64-bf72-4e1e-a37e-6287e531a384',
            targetNodeTypeName: 'dli.Table',
            isMulti: false,
            multiNodeList: [],
          },
        },
        {
          description:
            '请根据指导员的实验引导，对图谱节点进行右键关系扩展操作，直至找到目标节点为止',
          caseName: 'Case 3',
          caseDataset: {
            guid: '345baa5b-af05-491c-951b-c1ecd814d600',
            typeName: 'dli.Table',
            bussinessDomain: '云服务360总表',
            targetNodeGuid: 'f9017516-0851-4bad-9a02-c4e78d031f79',
            targetNodeTypeName: 'dli.Table',
            isMulti: false,
            multiNodeList: [],
          },
        },
      ],
      curQuestionIndex: 1, // 当前题目编号
      userAns: '', // 用户答案
      isFindTargetNode: false, // 是否找到目标节点
      timestampStart: new Date(), // 用户答题开始时间
      calOverTime: null, // 计时器ID
      timeTick: 0, // 超时计数器
      overTimeSecond: 180, // 超时时间180秒

      // 评星相关
      isFinishRate: false,
      rateAns: {
        description: '请对本实验围绕如下指标进行评星',
        indicatorList: [
          { value: 0, label: '易读性', db: 'readability' },
          { value: 0, label: '易学性', db: 'learnability' },
          { value: 0, label: '美观性', db: 'beauty' },
          { value: 0, label: '满意度', db: 'satisfaction' },
        ],
      },

      // 图谱数据
      graphData: { nodes: [], edges: [] },
      layout: 'Force',

      // 功能项
      isFullBrowser: false, // 是否全屏
      curScale: 1.0, // 当前放缩倍数
      scaleDatal: 0.1, // 放缩增量
      openGraphSwitch: false, // 用于控制是否打开整体图布局菜单
      openSubgraphSwitch: false, // 用于控制是否打开子图布局菜单
      // 子图布局选项
      subGraphLayoutList: [
        { value: 'Random', label: '随机布局' },
        { value: 'Grid', label: '网格布局' },
        { value: 'Circular', label: '圆形布局' },
        { value: 'Concentric', label: '同心圆布局' },
        { value: 'Force', label: '力引导布局' },
      ],
    })

    // 定义普通数据
    const rawData = {
      // 图谱相关
      graph: {}, // 图谱类对象
      graphData: {}, // 图谱数据
      selector: '#graph-render', // 渲染的元素选择器名称
      legendContainer: '#legend-container', // 图例渲染容器
      container: null, // 渲染容器
      width: 0, // 画布宽
      height: 0, // 画布高
      radius: 0, // 节点半径
      layout: 'Force', // 布局算法
      keyNode: '', // 交互的关键节点
      originalCaseNodeGuid: '', // 初始的中心节点
      bussinessDomain: '', // 数据所属业务领域
    }

    /**
     * 路由跳转
     * @param url 跳转的路由地址
     */
    const goToNextPage = (url: string | null = null) => {
      router.push({
        path: url || reactiveData.nextUrl,
      })
    }

    /**
     * Graph 找到目标节点后的回调方法
     */
    const afterFindTargetNodeCallback = () => {
      reactiveData.isFindTargetNode = true
      message.success('您已成功找到目标节点')
    }

    /**
     * Graph 中操作节点后回调方法
     */
    const afterOperateNodeCallback = () => {
      // console.log('afterOperateNodeCallback')
      // this.$store.dispatch('changeKeyNode', this.graph.keyNode)
    }

    /**
     * Graph 更新图谱数据后回调方法
     * @graphData 图谱数据
     */
    const afterUpdateGraphCallback = (graphData: any) => {
      const graphInfos = {
        nodesNum: graphData.nodesNum,
        edgesNum: graphData.edgesNum,
        allCurNodeByIdMap: graphData.allCurNodeByIdMap,
        allCurLinkByIdMap: graphData.allCurLinkByIdMap,
      }
      // 更新右键菜单图谱记录数据
      contextMenu.value.updateGraphInfos(graphInfos)
    }

    /**
     * Graph 中呼出右键菜单
     */
    const callContextMenu = (
      contextMenuType: string,
      event: any,
      contextData: any
    ) => {
      // 展示右键菜单
      contextMenu.value.showContextMenu(contextMenuType, event, contextData)
    }

    /**
     * 点击右键菜单后回调函数
     */
    const triggerContextMenu = (contextMenuInfos: any) => {
      rawData.graph.contextMenuBehavior(contextMenuInfos)
    }

    /**
     * Graph 中获取关系扩展推荐节点列表后回调方法，更新子组件的推荐列表
     */
    const afterChangeRecommendNodeListCallback = (recommendNodeList: any[]) => {
      contextMenu.value.changeRecommendNodeList(recommendNodeList)
    }

    /**
     * Graph 中获取基于所选推荐扩展节点列表的图谱数据
     */
    const postSelectedNodeList = (selectedRecommendInfos: any) => {
      rawData.graph.getGraphDataBasedSelectedRecommendNodes(
        selectedRecommendInfos
      )
    }

    /**
     * Graph 中暂时性固定节点位置
     */
    const resetForceFxFy = (resetForceFxFyNodeGuid: string) => {
      rawData.graph.reSetForceFxFy(resetForceFxFyNodeGuid)
    }

    /**
     * 圈选及取消圈选
     */
    const callBrushHandle = (status = false) => {
      rawData.graph.callBrushHandle(status)
    }

    /**
     * 调用固定圈选的子图
     */
    const callFixSubGraph = () => {
      rawData.graph.callFixSubGraph()
    }

    /**
     * 触发子图布局
     */
    const runSubGraphLayout = (layout) => {
      rawData.graph.runSubGraphLayout(layout)
    }

    /**
     * 初始化图谱相关数据
     */
    const initGraphInfos = () => {
      rawData.graph = {} // 图谱类对象
      // rawData.graphData = case1 // 图谱数据
      rawData.selector = '#graph-render' // 渲染的元素选择器名称
      rawData.legendContainer = '#legend-container' // 图例渲染容器
      rawData.container = document.querySelector(rawData.selector) as any // 渲染容器
      rawData.width = (
        document.querySelector('.graph-container') as any
      ).clientWidth // 画布宽
      rawData.height = (
        document.querySelector('.graph-container') as any
      ).clientHeight // 画布高
      rawData.radius = 20 // 节点半径
    }

    /**
     * 实例化图谱类对象
     */
    const createGraph = () => {
      // 停止之前的
      if (rawData.graph.GraphInstance) {
        rawData.graph.GraphInstance.simulation.stop()
        rawData.graph = {}
      }

      // 实例化新对象
      rawData.graph = new Graph({
        selector: rawData.selector,
        container: rawData.container,
        legendContainer: rawData.legendContainer,
        width: rawData.width,
        height: rawData.height,
        radius: rawData.radius,
        data: rawData.graphData,
        layout: rawData.layout,
        keyNode: rawData.keyNode,
        originalCaseNodeGuid: rawData.originalCaseNodeGuid,
        bussinessDomain: rawData.bussinessDomain,
        targetNodeGuid: rawData.targetNodeGuid,
        afterOperateNodeCallback,
        afterUpdateGraphCallback,
        callContextMenu,
        afterChangeRecommendNodeListCallback,
        afterFindTargetNodeCallback,
      })

      // 开启计时
      reactiveData.calOverTime = setInterval(() => {
        if (reactiveData.timeTick++ >= reactiveData.overTimeSecond) {
          clearInterval(reactiveData.calOverTime)
          message.info(
            `您回答问题用时已超出${reactiveData.overTimeSecond}，可进入下一题`
          )
        }
      }, 1000)
    }

    /**
     * 全屏以及退出全屏
     */
    const runFullScreen = () => {
      if (!reactiveData.isFullBrowser) {
        const element = document.documentElement as any
        if (element.requestFullscreen) {
          element.requestFullscreen()
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen()
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen()
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if (document.mozExitFullScreen) {
          document.mozExitFullScreen()
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen()
        }
      }

      reactiveData.isFullBrowser = !reactiveData.isFullBrowser
    }

    /**
     * 切换布局开关，看展示哪个布局
     */
    const runSwitchLayout = (typeFlag = 'graph') => {
      // 切换图整体布局
      if (typeFlag === 'graph') {
        reactiveData.openGraphSwitch = !reactiveData.openGraphSwitch
        if (reactiveData.openGraphSwitch) {
          reactiveData.openSubgraphSwitch = false
        }
      }
      // 切换子图布局
      if (typeFlag === 'subgraph') {
        reactiveData.openSubgraphSwitch = !reactiveData.openSubgraphSwitch
        if (reactiveData.openSubgraphSwitch) {
          reactiveData.openGraphSwitch = false
        }
      }
    }

    /**
     * 图整体布局
     */
    const runGraphLayout = (layout = 'Random') => {
      // 取消高亮
      rawData.graph.runGraphLayout(layout)
    }

    /**
     * 视图自动放缩居中
     */
    const runAutoZoom = () => {
      rawData.graph.runAutoZoom()
    }

    /**
     * 视图按钮放缩
     */
    const runButtonZoom = (zoomFlag: string) => {
      switch (zoomFlag) {
        case 'large':
          reactiveData.curScale += reactiveData.scaleDatal
          break
        case 'small':
          reactiveData.curScale -= reactiveData.scaleDatal
          break
        case 'init':
        default:
          reactiveData.curScale = 1.0
      }
      reactiveData.curScale =
        reactiveData.curScale <= 0 ? 1e-3 : reactiveData.curScale
      rawData.graph.runAutoZoom(600, {
        status: true,
        scale: reactiveData.curScale,
      })
    }

    /**
     * 实例化图谱类对象并渲染
     */
    const realizeGraph = () => {
      const caseDataset = reactiveData.questionList[
        reactiveData.curQuestionIndex - 1
      ].caseDataset as any
      // 读取初始数据
      getExpandGraphFromNode(
        {
          guid: caseDataset.guid,
          typeName: caseDataset.typeName,
        },
        'RECOMMEND'
      )
        .then((res: any) => {
          reactiveData.graphData = res.data.content
          rawData.layout = toRaw(reactiveData.layout)
          rawData.graphData = toRaw(reactiveData.graphData)
          rawData.keyNode = toRaw(caseDataset.guid)
          rawData.originalCaseNodeGuid = toRaw(caseDataset.guid)
          // 初始的中心节点
          rawData.bussinessDomain = toRaw(caseDataset.bussinessDomain) // 数据所属业务领域
          rawData.targetNodeGuid = toRaw(caseDataset.targetNodeGuid)

          if (!caseDataset.isMulti) {
            // 实例化图谱类对象并渲染
            createGraph()

            // 告知后台缓存数据集
            setBussinessDatasetCache(rawData.bussinessDomain)
              .then((res: any) => {
                // console.log('成功缓存数据集', res)
              })
              .catch((err: any) => {
                console.log('缓存数据集error', err)
              })

            // // 读取初始推荐的扩展引导节点
            // const curGraph = {
            //   nodes: [...rawData.graph.allCurNodeByIdMap.values()].map(
            //     (item: any) => item.guid
            //   ),
            //   edges: [...rawData.graph.allCurLinkByIdMap.values()].map(
            //     (item: any) => item.guid
            //   ),
            // }

            // getRecommendInitExpandNodes(curGraph, rawData.bussinessDomain)
            //   .then((res: any) => {
            //     // 获取前 Math.min(4, curGraph.nodes.length) 个推荐节点
            //     const maxLength =
            //       curGraph.nodes.length > 50
            //         ? 10
            //         : parseInt(curGraph.nodes.length * 0.2, 10)
            //     const initRecommendExpandNodes =
            //       res.data.content.recommendNodes.slice(
            //         0,
            //         Math.max(4, maxLength)
            //       )
            //     // 设置徽标
            //     rawData.graph.setInitRecommendNodesBadge(
            //       initRecommendExpandNodes
            //     )
            //   })
            //   .catch((err: any) => console.log(err))
          } else {
            // 并发请求
            const promiseArray = []
            for (let i = 0; i < caseDataset.multiNodeList.length; i++) {
              const promiseItem = new Promise((resolve, reject) => {
                getExpandGraphFromNode(
                  {
                    guid: caseDataset.multiNodeList[i].guid,
                    typeName: caseDataset.multiNodeList[i].typeName,
                  },
                  caseDataset.multiNodeList[i].relationshipTypeName
                ).then((res: any) => {
                  resolve(res.data.content)
                })
              })
              promiseArray.push(promiseItem)
            }

            Promise.all(promiseArray).then((multiData) => {
              const nodeSet = new Set(
                rawData.graphData.nodes.map((d: any) => d.guid)
              )
              const edgeSet = new Set(
                rawData.graphData.edges.map((d: any) => d.guid)
              )
              multiData.forEach((data: any) => {
                data.nodes.forEach((t: any) => {
                  if (!nodeSet.has(t.guid)) {
                    rawData.graphData.nodes.push(t)
                    nodeSet.add(t.guid)
                  }
                })
                data.edges.forEach((t: any) => {
                  if (!nodeSet.has(t.guid)) {
                    rawData.graphData.edges.push(t)
                    edgeSet.add(t.guid)
                  }
                })
              })
              createGraph()

              // 后台缓存数据集
              setBussinessDatasetCache(rawData.bussinessDomain)
                .then((res: any) => {
                  // console.log('成功缓存数据集',res)
                })
                .catch((err) => {
                  console.log('缓存数据集error', err)
                })

              // // 读取初始推荐的扩展引导节点
              // const curGraph = {
              //   nodes: [...rawData.graph.allCurNodeByIdMap.values()].map(
              //     (item: any) => item.guid
              //   ),
              //   edges: [...rawData.graph.allCurLinkByIdMap.values()].map(
              //     (item: any) => item.guid
              //   ),
              // }

              // getRecommendInitExpandNodes(curGraph, rawData.bussinessDomain)
              //   .then((res: any) => {
              //     // 获取前 Math.min(4, curGraph.nodes.length) 个推荐节点
              //     const maxLength =
              //       curGraph.nodes.length > 50
              //         ? 10
              //         : parseInt(curGraph.nodes.length * 0.2)
              //     const initRecommendExpandNodes =
              //       res.data.content.recommendNodes.slice(
              //         0,
              //         Math.max(4, maxLength)
              //       )
              //     // 设置徽标
              //     rawData.graph.setInitRecommendNodesBadge(
              //       initRecommendExpandNodes
              //     )
              //   })
              //   .catch((err) => console.log(err))
            })
          }
        })
        .catch((err: any) => console.log(err))
    }

    /**
     * 开始任务
     */
    const startTask = () => {
      reactiveData.isStart = true
      reactiveData.curQuestionIndex = 1
      reactiveData.userAns = ''
      reactiveData.timestampStart = new Date()
      reactiveData.timeTick = 0

      realizeGraph()
    }

    /**
     * 提交答案
     */
    const submitAns = () => {
      // 清除计数器
      clearInterval(reactiveData.calOverTime)

      // 向后台发送提交请求
      const name = sessionStorage.getItem('name')
      const ansObj = {}
      const ansID = `S7_others_T${reactiveData.curQuestionIndex}_ans`
      const userAns = toRaw(reactiveData.isFindTargetNode)
      ansObj[ansID] = userAns
      const timeID = `S7_others_T${reactiveData.curQuestionIndex}_time`
      const useTime = (new Date() - toRaw(reactiveData.timestampStart)) / 1000
      ansObj[timeID] = useTime + 's'
      postAns(name, ansObj)

      // 判断是否结束
      if (reactiveData.curQuestionIndex === reactiveData.questionList.length) {
        reactiveData.isFinish = true

        // 停止之前的
        if (rawData.graph.GraphInstance) {
          rawData.graph.GraphInstance.simulation.stop()
          rawData.graph = {}
        }

        return
      }

      // 更新状态
      reactiveData.curQuestionIndex += 1
      reactiveData.userAns = ''
      reactiveData.timestampStart = new Date()
      reactiveData.isFindTargetNode = false
      reactiveData.timeTick = 0

      // 清除先前绘制的元素
      if (document.querySelector('#graph-render #graph-painter')) {
        document.querySelector('#graph-render #graph-painter')?.remove()
      }

      // 进行图谱绘制
      realizeGraph()
    }

    /**
     * 提交评星
     */
    const submitRate = () => {
      // 向后台发送提交请求
      const name = sessionStorage.getItem('name')
      const ansObj = {}
      const preDesc = 'S7_others_indicator_'
      reactiveData.rateAns.indicatorList.forEach((d) => {
        ansObj[preDesc + d.db] = toRaw(d.value)
      })
      postAns(name, ansObj)

      reactiveData.isFinishRate = true
      reactiveData.showFinishModel = true

      const interval = setInterval(() => {
        reactiveData.secondsToGo -= 1
      }, 1000)

      setTimeout(() => {
        clearInterval(interval)
        goToNextPage()
      }, reactiveData.secondsToGo * 1000)
    }

    /**
     * 控制是否能进入下一题
     */
    const canClickNext = computed(() => {
      if (reactiveData.timeTick >= reactiveData.overTimeSecond) {
        return true
      }
      return !reactiveData.isFinish && reactiveData.isFindTargetNode
    })

    onMounted(() => {
      // 清除先前绘制的元素
      if (document.querySelector('#graph-render #graph-painter')) {
        document.querySelector('#graph-render #graph-painter')?.remove()
      }
      // 初始化图谱相关数据
      initGraphInfos()
    })

    // 将数据和方法返回
    return {
      // 数据
      ...toRefs(reactiveData),

      // 方法
      startTask,
      submitAns,
      submitRate,
      goToNextPage,
      canClickNext,

      // 子组件
      contextMenu,
      // 子组件的回调方法
      triggerContextMenu, // 右键菜单操作的回调
      postSelectedNodeList, // 选择扩展列表节点后的回调

      // 交互菜单栏
      runFullScreen,
      runAutoZoom,
      runButtonZoom,
      runSwitchLayout,
      callBrushHandle,
      callFixSubGraph,
      runSubGraphLayout,
      runGraphLayout,
    }
  },
})
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
  /* text-align: center; */
  box-sizing: border-box;
  padding: 20px 0px;
}

.graph-container {
  /* background: linear-gradient(45deg, #ffffff 50%, #fcfcfc 0); */
  background-size: 10px 10px;
  position: relative;
  float: right;
  width: 78.9%;
  height: 100%;
  overflow: hidden;
}

.page-name {
  font-size: 26px;
  font-weight: bold;
  display: block;
  text-align: center;
}
div.hr {
  height: 1.2px;
  width: 90%;
  background-color: #cccccc;
  margin: 20px auto;
}
.introduction {
  padding: 0 30px;
  box-sizing: border-box;
  /* text-align: center; */
  font-size: 20px;
}
.introduction-info {
  margin: 5px 0;
}

._trans-block-center {
  display: block;
  margin: 0 auto;
}
.submit-button {
  margin-top: 10px;
}

.question-info {
  padding: 0 30px;
  box-sizing: border-box;
  text-align: justify;
  font-size: 20px;
  margin: 5px 0;
}

.answer-list {
  text-align: center;
  margin: 0 0 20px 0;
}
.answer-item {
  /* display: block; */
  height: 35px;
  line-height: 35px;
  margin-right: 20px;
  font-size: 16px;
}
.answer-item:last-child {
  margin-right: 0px;
}

.rate-container {
  padding: 0px 30px;
  box-sizing: border-box;
  text-align: justify;
  font-size: 20px;
}
.rate-info {
  margin: 5px 0;
}
.rate-label {
  margin-right: 15px;
}

.graphInfos-container {
  position: absolute;
  top: 20px;
  left: 30px;
  font-size: 20px;
}

.task-intro-img-container {
  padding: 20px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}
.task-intro-img {
  max-width: 100%;
  max-height: 100%;
  margin: 0 auto;
}

.control-toolbar {
  position: absolute;
  top: 20px;
  right: 30px;
}

.layout-ctx {
  text-align: center;
  padding: 20px 0;
  width: 300px;
  border-radius: 5px;
  border: 1px solid #cccccc;
  opacity: 0.8;
  background-color: #ffffff;
}

.graph-layout-ctx {
  position: absolute;
  right: 0px;
  top: 50px;
}

.subgraph-layout-ctx {
  position: absolute;
  right: 0px;
  top: 50px;
}

.layout-ctx .title-div {
  color: #000000;
  font-size: 20px;
  font-weight: bold;
  height: 25px;
  line-height: 25px;
}

.select-subgraph-div {
  margin-top: 10px;
  margin-bottom: 10px;
}

.select-subgraph {
  font-size: 16px;
  cursor: pointer;
  color: #40a9ff;
  margin-right: 10px;
  margin-left: 10px;
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

<style>
/* 套索样式 */
.lasso path {
  stroke: rgb(80, 80, 80);
  stroke-width: 2px;
}

.lasso .drawn {
  fill-opacity: 0.05;
}

.lasso .loop_close {
  fill: none;
  stroke-dasharray: 4, 4;
}

.lasso .origin {
  fill: #3399ff;
  fill-opacity: 0.5;
}

.not_possible {
  fill: rgb(200, 200, 200);
}

.possible {
  fill: #ec888c;
}

.selected {
  fill: steelblue;
}
</style>
