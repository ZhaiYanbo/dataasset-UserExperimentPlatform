<template>
  <div class="page-container">
    <div class="main-container" v-show="!isFinish">
      <p class="page-name">
        {{ taskName }}
      </p>
      <p class="introduction-info">
        {{ taskInfosPre }}
      </p>
      <p class="introduction-info">
        {{ taskInfos }}
      </p>
      <div class="rate-container rate-others">
        <p class="rate-info">{{ rateAnsOthers.description }}</p>
        <div class="rate-list">
          <div
            class="rate-item"
            v-for="item in rateAnsOthers.indicatorList"
            :key="item.label"
          >
            <span class="rate-label">{{ item.label }}</span>
            <a-rate v-model:value="item.value" />
          </div>
        </div>
      </div>
      <div class="rate-container rate-ours">
        <p class="rate-info">{{ rateAnsOurs.description }}</p>
        <div class="rate-list">
          <div
            class="rate-item"
            v-for="item in rateAnsOurs.indicatorList"
            :key="item.label"
          >
            <span class="rate-label">{{ item.label }}</span>
            <a-rate v-model:value="item.value" />
          </div>
        </div>
      </div>
      <a-button
        class="_trans-block-center submit-button"
        :disabled="
          !rateAnsOthers.indicatorList
            .map((d) => d.value)
            .every((d) => Boolean(d)) ||
          !rateAnsOurs.indicatorList
            .map((d) => d.value)
            .every((d) => Boolean(d)) ||
          isFinish
        "
        @click="submitRate"
        >提交
      </a-button>
    </div>
    <div class="finish-infos" v-show="isFinish">
      <span>恭喜您已完成全部用户评估实验，感谢您的参与</span> <br />
      <SmileOutlined style="font-size: 60px; margin-top: 30px" />
    </div>
  </div>
</template>

<script lang="ts">
import {
  reactive,
  toRefs,
  ref,
  h,
  toRaw,
  defineComponent,
  onMounted,
} from 'vue'

// 导入UI库
import { SmileOutlined } from '@ant-design/icons-vue'

import { Modal } from 'ant-design-vue'

import { useRouter } from 'vue-router'

// 引入提交答案请求
import { postAns } from '@/utils/axios'

export default defineComponent({
  name: 'Task_S9',
  components: {
    SmileOutlined,
  },
  setup() {
    // 路由对象, 用于跳转
    const router = useRouter()

    // 定义响应式数据属性
    const formRef = ref()
    const reactiveData = reactive({
      // 任务相关
      taskID: 'Task_S9', // 任务ID
      taskName: '原型系统综合对比评价', // 任务标题
      taskInfosPre: '', // 任务说明前缀文本
      taskInfos: '请分别对本系统先前各实验环节下的两组实验围绕如下指标进行评星', // 任务说明文字
      isFinish: false, // 是否结束任务
      showFinishModel: false, // 是否展示完成对话框
      secondsToGo: 5, // 自动跳转时间
      nextUrl: 'register', // 下一个路由

      // 对比系统评星
      rateAnsOthers: {
        description: '对比系统(实验组A)',
        indicatorList: [
          { value: 0, label: '易读性', db: 'readability' },
          { value: 0, label: '易学性', db: 'learnability' },
          { value: 0, label: '美观性', db: 'beauty' },
          { value: 0, label: '满意度', db: 'satisfaction' },
        ],
      },

      // 原型系统评星
      rateAnsOurs: {
        description: '原型系统(实验组B)',
        indicatorList: [
          { value: 0, label: '易读性', db: 'readability' },
          { value: 0, label: '易学性', db: 'learnability' },
          { value: 0, label: '美观性', db: 'beauty' },
          { value: 0, label: '满意度', db: 'satisfaction' },
        ],
      },
    })

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
     * 提交评星
     */
    const submitRate = () => {
      // 向后台发送提交请求
      const name = sessionStorage.getItem('name')
      const ansObj = {}
      const preDescOther = 'S9_others_indicator_'
      reactiveData.rateAnsOthers.indicatorList.forEach((d) => {
        ansObj[preDescOther + d.db] = toRaw(d.value)
      })
      const preDescOur = 'S9_ours_indicator_'
      reactiveData.rateAnsOurs.indicatorList.forEach((d) => {
        ansObj[preDescOur + d.db] = toRaw(d.value)
      })
      postAns(name, ansObj)

      reactiveData.isFinish = true
      Modal.success({
        title: () => '完成提示',
        content: () =>
          h('div', {}, [h('p', '恭喜您已完成全部用户实验，感谢您的参与')]),
      })
    }

    onMounted(() => {})

    // 将数据和方法返回
    return {
      // 数据
      formRef,
      ...toRefs(reactiveData),

      goToNextPage,
      submitRate,
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

.main-container {
  padding: 30px;
  text-align: center;
  width: 50%;
  margin: 0 auto;
  overflow: hidden;
}
.finish-infos {
  padding: 65px;
  text-align: center;
  width: 50%;
  margin: 0 auto;
  overflow: hidden;
  font-size: 28px;
}

.page-name {
  font-size: 30px;
  font-weight: bold;
}
.introduction-info {
  margin: 10px 0;
  font-size: 20px;
}

.rate-container {
  width: 50%;
  float: left;
  margin: 0 auto;
  font-size: 22px;
  box-sizing: border-box;
  margin-bottom: 20px;
}

.rate-info {
  margin: 5px 0;
}
.rate-label {
  margin-right: 15px;
}

._trans-block-center {
  display: block;
  margin: 20px auto;
}
</style>
