<template>
  <div>test</div>
  <a-button type="primary" @click="clickEvent">Primary Button</a-button>
  <a-rate v-model:value="value" />
</template>

<script lang="ts">
import {
  reactive,
  toRefs,
  defineComponent,
  // getCurrentInstance,
  // onMounted,
  // nextTick,
} from 'vue'

import { getRecommendInitExpandNodes } from '../utils/axios'

export default defineComponent({
  name: 'test',
  components: {},
  setup() {
    // 定义数据属性
    const data = reactive({
      value: 2,
    })

    // 定义方法
    const clickEvent = () => {
      const test = {
        bussinessDomain: '第一批数据',
        curGraph: {
          nodes: [
            'a6c952a5-a8b7-4d6a-b19d-2e5b0a9c9946',
            '7eb4dcfb-7736-4ac5-8af1-81107faa819a',
            'e7ba7795-1a63-44bb-8798-7d3555565c9c',
            '742a18f2-2920-4c62-816d-f80488e89e7b',
            '46d4ee1d-fa6a-4e8e-8507-a1aa6eab457c',
            '166b8379-d73c-4763-9b23-fe443fe7cc5a',
          ],
          edges: [
            'cedee49b-e6af-48a3-a0a7-ba1f0b6be72a',
            'bf48c93d-2d17-4bf1-9cd0-2e3bfec99d84',
            '5deaf70e-e64c-44f1-ad62-75193722b389',
            'a6a66e5f-a84e-4a96-84c8-edab476a2606',
            'e1f27968-0a3d-4cad-b23a-d43d0b78b42f',
          ],
        },
      }

      getRecommendInitExpandNodes(test.curGraph, test.bussinessDomain)
        .then((res: any) => {
          console.log(res)
        })
        .catch((err: any) => {
          console.log(err)
        })

      console.log('click')
    }
    // 将数据返回
    return {
      ...toRefs(data),
      clickEvent,
    }
  },
})
</script>

<style scoped>
</style>
