<template>
  <div class="top-nav-bar">
    <span class="title">重要数据资产识别用户实验系统</span>
  </div>
</template>

<script lang="ts">
import { reactive, toRefs, defineComponent } from 'vue'

export default defineComponent({
  name: 'topnavbar',
  components: {},
  setup() {
    // 定义数据属性
    const reactiveData = reactive({})

    // 将数据返回
    return {
      ...toRefs(reactiveData),
    }
  },
})
</script>

<style scoped>
.top-nav-bar {
  height: 80px;
  line-height: 80px;
  background-color: #ffffff;
  margin-bottom: 1%;
  padding: 0 30px;
  border-radius: 8px;
  box-sizing: border-box;
  box-shadow: 1px 1px 5px #cccccc;
}
.title {
  font-size: 34px;
  font-weight: bold;
}

.page-name {
  font-size: 25px;
}
</style>
