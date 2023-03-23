<template>
  <div class="page-container">
    <div class="register-container">
      <p class="page-name">
        {{ taskName }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { reactive, toRefs, ref, defineComponent, onMounted } from 'vue'

import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'view_db',
  components: {},
  setup() {
    // 路由对象, 用于跳转
    const router = useRouter()

    // 定义响应式数据属性
    const formRef = ref()
    const reactiveData = reactive({
      // 任务相关
      taskID: 'view_db', // 任务ID
      taskName: '查看数据库记录', // 任务标题
      taskInfos: '任务描述文字', // 任务说明文字
      isFinish: false, // 是否结束任务
      showFinishModel: false, // 是否展示完成对话框
      secondsToGo: 5, // 自动跳转时间
      nextUrl: 'register', // 下一个路由
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

    onMounted(() => {})

    // 将数据和方法返回
    return {
      // 数据
      formRef,
      ...toRefs(reactiveData),

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

.register-container {
  padding: 30px;
  text-align: center;
}

.page-name {
  font-size: 30px;
  font-weight: bold;
}

.form-container {
  text-align: justify;
  width: 40%;
  margin: 0 auto;
}
</style>
