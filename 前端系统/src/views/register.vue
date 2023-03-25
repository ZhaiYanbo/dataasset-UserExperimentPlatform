<template>
  <div class="page-container">
    <div class="register-container">
      <p class="page-name">
        {{ taskName }}
      </p>
      <a-form
        ref="formRef"
        :model="userInfos"
        :rules="rules"
        class="form-container"
      >
        <a-form-item required label="姓名" name="name">
          <a-input v-model:value="userInfos.name" />
        </a-form-item>
        <a-form-item required label="性别" name="sex">
          <a-radio-group v-model:value="userInfos.sex">
            <a-radio value="男">男</a-radio>
            <a-radio value="女">女</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item required label="专业" name="major">
          <a-select
            v-model:value="userInfos.major"
            placeholder="请选择您的专业"
          >
            <a-select-option value="计算机科学与技术"
              >计算机科学与技术</a-select-option
            >
            <a-select-option value="计算机技术">计算机技术</a-select-option>
            <a-select-option value="通信工程">通信工程</a-select-option>
            <a-select-option value="其他">其他</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="联系电话">
          <a-input v-model:value="userInfos.telephone" />
        </a-form-item>
        <a-form-item style="text-align: center">
          <a-button style="margin-right: 20px" type="primary" @click="register"
            >注册</a-button
          >
          <a-button style="margin-left: 20px" @click="resetForm">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <a-modal
      v-model:visible="showFinishModel"
      :closable="false"
      :maskClosable="false"
      title="注册成功"
    >
      <p>
        恭喜您注册成功, {{ secondsToGo }}s 后将跳转至"增强语义图元视觉编码"实验A
      </p>
      <template #footer>
        <a-button key="submit" type="primary" @click="goToNextPage()"
          >立即跳转</a-button
        >
      </template>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { reactive, toRefs, ref, toRaw, defineComponent, onMounted } from 'vue'

import { useRouter } from 'vue-router'
import { registerUser } from '@/utils/axios'

export default defineComponent({
  name: 'register',
  components: {},
  setup() {
    // 路由对象, 用于跳转
    const router = useRouter()

    // 定义响应式数据属性
    const formRef = ref()
    const reactiveData = reactive({
      // 任务相关
      taskID: 'register', // 任务ID
      taskName: '用户注册', // 任务标题
      taskInfos: '任务描述文字', // 任务说明文字
      isFinish: false, // 是否结束任务
      showFinishModel: false, // 是否展示完成对话框
      secondsToGo: 5, // 自动跳转时间
      nextUrl: 'task_S1-others', // 下一个路由

      // 表单相关
      userInfos: {
        name: '', // 姓名
        sex: '', // 性别
        major: '', // 专业
        telephone: '', // 联系电话
      },
      rules: {
        name: [
          {
            required: true,
            message: '请输入您的姓名',
            trigger: 'blur',
          },
        ],
        sex: [
          {
            required: true,
            message: '请选择您的性别',
            trigger: 'change',
          },
        ],
        major: [
          {
            required: true,
            message: '请选择您的专业',
            trigger: 'change',
          },
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
     * 注册用户
     */
    const register = () => {
      formRef.value
        .validate()
        .then(() => {
        // 注册完成后
              /**
              sessionStorage.setItem('name', toRaw(reactiveData.userInfos.name)) // 设置缓存
              reactiveData.showFinishModel = true

              // 唤出跳转菜单
              const interval = setInterval(() => {
                reactiveData.secondsToGo -= 1
              }, 1000)
              setTimeout(() => {
                clearInterval(interval)
                goToNextPage()
              }, reactiveData.secondsToGo * 1000)
              */


          // 发送注册用户请求
          registerUser(toRaw(reactiveData.userInfos))
            .then((res) => {
              console.log("res",res)
              console.log("res.data",res.data)
              // 注册完成后
              sessionStorage.setItem('name', toRaw(reactiveData.userInfos.name)) // 设置缓存
              reactiveData.showFinishModel = true

              // 唤出跳转菜单
              const interval = setInterval(() => {
                reactiveData.secondsToGo -= 1
              }, 1000)
              setTimeout(() => {
                clearInterval(interval)
                goToNextPage()
              }, reactiveData.secondsToGo * 1000)
            })
            .catch((err) => {
              console.log('register error', err)
            })

        })
        .catch((err: any) => {
          console.log('error', err)
        })
    }

    /**
     * 重置表单项
     */
    const resetForm = () => {
      formRef.value.resetFields()
    }

    onMounted(() => {})

    // 将数据和方法返回
    return {
      // 数据
      formRef,
      ...toRefs(reactiveData),

      goToNextPage,

      register,
      resetForm,
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
