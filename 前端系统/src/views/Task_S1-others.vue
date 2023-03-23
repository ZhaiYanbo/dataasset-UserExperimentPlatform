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
          <a-radio-group v-model:value="userAns">
            <a-radio
              v-for="(item, index) in questionList[curQuestionIndex - 1]
                .ansList"
              :key="index"
              class="answer-item"
              v-model:value="item.value"
              :disabled="isFinish"
            >
              {{ item.lable }}
            </a-radio>
          </a-radio-group>
          <a-button
            class="_trans-block-center submit-button"
            :disabled="isFinish || !Boolean(userAns)"
            @click="submitAns"
            >提交
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
          恭喜您已完成"增强语义图元视觉编码"实验A, {{ secondsToGo }}s
          后将跳转至"增强语义图元视觉编码"实验B
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
        <div class="graphInfos-container">
          {{ questionList[curQuestionIndex - 1].caseName }}&nbsp;&nbsp;Nodes:
          {{ graphData.nodes.length }}, Edges:
          {{ graphData.edges.length }}
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
import { reactive, toRefs, toRaw, defineComponent, onMounted } from 'vue'

// 导入UI库
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  BorderOuterOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons-vue'

import { useRouter } from 'vue-router'

// 引入提交答案请求
import { postAns } from '@/utils/axios'

// 导入图对象和数据
import OtherGraph from '@/graph-components/Task_S1/otherGraph'
import case1 from '@/static/dataset/Task_S1/case2-Nodes_171-Edges_193.json'
import case2 from '@/static/dataset/Task_S1/case3-Nodes_252-Edges_257.json'
import case3 from '@/static/dataset/Task_S1/case4-Nodes_356-Edges_411.json'

export default defineComponent({
  name: 'Task_S1-others',
  components: {
    FullscreenOutlined,
    FullscreenExitOutlined,
    BorderOuterOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
  },
  setup() {
    // 路由对象, 用于跳转
    const router = useRouter()

    // 定义响应式数据属性
    const reactiveData = reactive({
      // 任务相关
      taskID: 'Task_S1-others', // 任务ID
      taskName: '增强语义图元视觉编码实验A', // 任务标题
      taskInfosPre: '本实验共3个小任务，任务内容为：', // 任务说明前缀文本
      taskInfos:
        '每一个小任务将给出图谱全貌，请观察图谱节点图元编码，统计当前图谱中节点种类的数目', // 任务说明文字
      taskIntroImgPath: '../static/task-intro-img/Task_S1-others.png', // 任务介绍图片
      isStart: false, // 是否开始任务
      isFinish: false, // 是否结束任务
      useTarget: 'others', // 评星对象标识, others或ours
      showFinishModel: false, // 是否展示完成对话框
      secondsToGo: 5, // 自动跳转时间
      nextUrl: 'task_S1-ours', // 下一个路由

      // 问卷相关
      questionList: [
        {
          description: '请选择当前图谱中含有多少种类型的节点',
          ansList: [
            { value: 'A', lable: 'A. 6' },
            { value: 'B', lable: 'B. 7' },
            { value: 'C', lable: 'C. 8' },
            { value: 'D', lable: 'D. 9' },
          ],
          caseName: 'Case 1',
          caseDataset: case1,
        },
        {
          description: '请选择当前图谱中含有多少种类型的节点',
          ansList: [
            { value: 'A', lable: 'A. 6' },
            { value: 'B', lable: 'B. 7' },
            { value: 'C', lable: 'C. 8' },
            { value: 'D', lable: 'D. 9' },
          ],
          caseName: 'Case 2',
          caseDataset: case2,
        },
        {
          description: '请选择当前图谱中含有多少种类型的节点',
          ansList: [
            { value: 'A', lable: 'A. 6' },
            { value: 'B', lable: 'B. 7' },
            { value: 'C', lable: 'C. 8' },
            { value: 'D', lable: 'D. 9' },
          ],
          caseName: 'Case 3',
          caseDataset: case3,
        },
      ],
      curQuestionIndex: 1, // 当前题目编号
      userAns: '', // 用户答案
      timestampStart: new Date(), // 用户答题开始时间

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

      // 其他
      isFullBrowser: false, // 是否全屏
      curScale: 1.0, // 当前放缩倍数
      scaleDatal: 0.1, // 放缩增量
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
     * 初始化图谱相关数据
     */
    const initGraphInfos = () => {
      rawData.graph = {} // 图谱类对象
      rawData.graphData = case1 // 图谱数据
      rawData.selector = '#graph-render' // 渲染的元素选择器名称
      rawData.legendContainer = '#legend-container' // 图例渲染容器
      rawData.container = document.querySelector(rawData.selector) as any // 渲染容器
      rawData.width = (
        document.querySelector('.graph-container') as any
      ).clientWidth // 画布宽
      rawData.height = (
        document.querySelector('.graph-container') as any
      ).clientHeight // 画布高
      rawData.radius = 5 // 节点半径
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
      rawData.graph = new OtherGraph({
        selector: rawData.selector,
        container: rawData.container,
        legendContainer: rawData.legendContainer,
        width: rawData.width,
        height: rawData.height,
        radius: rawData.radius,
        data: rawData.graphData,
      })
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
     * 开始任务
     */
    const startTask = () => {
      reactiveData.isStart = true
      reactiveData.curQuestionIndex = 1
      reactiveData.userAns = ''
      reactiveData.timestampStart = new Date()
      reactiveData.graphData = case1
      rawData.graphData = toRaw(reactiveData.graphData)

      // 实例化图谱类对象并渲染
      createGraph()
    }

    /**
     * 提交答案
     */
    const submitAns = () => {
      // 向后台发送提交请求
      const name = sessionStorage.getItem('name')
      const ansObj = {}
      const ansID = `S1_others_T${reactiveData.curQuestionIndex}_ans`
      const userAns = toRaw(reactiveData.userAns)
      ansObj[ansID] = userAns
      const timeID = `S1_others_T${reactiveData.curQuestionIndex}_time`
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

      // 更新图谱数据并渲染图谱
      reactiveData.graphData =
        reactiveData.questionList[reactiveData.curQuestionIndex - 1].caseDataset
      rawData.graphData = toRaw(reactiveData.graphData)

      // 清除先前绘制的元素
      if (document.querySelector('#graph-render #graph-painter')) {
        document.querySelector('#graph-render #graph-painter')?.remove()
      }

      // 实例化图谱类对象并渲染
      createGraph()
    }

    /**
     * 提交评星
     */
    const submitRate = () => {
      // 向后台发送提交请求
      const name = sessionStorage.getItem('name')
      const ansObj = {}
      const preDesc = 'S1_others_indicator_'
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
      runFullScreen,
      runAutoZoom,
      runButtonZoom,
      goToNextPage,
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
