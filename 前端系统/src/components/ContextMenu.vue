<template>
  <div class="graph-context-menu">
    <v-contextmenu ref="nodeContextMenu" class="context-menu">
      <v-contextmenu-item
        v-show="isShowContextMenuItem('console')"
        @click="consoleInfos"
        >查看节点信息</v-contextmenu-item
      >
      <v-contextmenu-submenu
        :v-show="filterExpandList(contextData.expandRelations).length > 0"
        title="关系扩展"
      >
        <v-contextmenu-item
          v-for="(relationTypeValue, keyName) in filterExpandList(
            contextData.expandRelations
          )"
          :key="relationTypeValue"
          v-show="isShowContextMenuItem(relationTypeValue)"
          @click="expandElement(relationTypeValue)"
          >{{ keyName }}
          {{
            contextData.currentExpandStatus[relationTypeValue]
              ? ' (已扩展)'
              : ''
          }}
        </v-contextmenu-item>
      </v-contextmenu-submenu>
      <v-contextmenu-item
        v-show="isShowContextMenuItem('pinOrUnpin')"
        @click="pinElement"
        >{{
          contextData.isPinStatus === true ? '解除锁定' : '锁定节点'
        }}</v-contextmenu-item
      >
      <v-contextmenu-item
        v-show="isShowContextMenuItem('showOrHidden')"
        @click="hiddenElement"
        >{{
          contextData.isHidden === true ? '显示节点' : '隐藏节点'
        }}</v-contextmenu-item
      >
    </v-contextmenu>

    <v-contextmenu ref="edgeContextMenu" class="context-menu">
      <v-contextmenu-item @click="consoleInfos"
        >查看连边信息</v-contextmenu-item
      >
      <v-contextmenu-submenu title="关系扩展">
        <v-contextmenu-item>TODO-连边关系扩展</v-contextmenu-item>
      </v-contextmenu-submenu>
      <v-contextmenu-item @click="hiddenElement">{{
        contextData.isHidden === true ? '显示连边' : '隐藏连边'
      }}</v-contextmenu-item>
    </v-contextmenu>

    <div
      class="recommend-nodes-list-tooltip"
      :style="{
        left: position.layerX + 'px',
        top: position.layerY + 'px',
      }"
      v-show="showRecommendNodeList === true"
    >
      <div v-show="!recommendNodesListSetup" class="loading-container">
        <a-spin></a-spin>
      </div>
      <div
        class="recommend-nodes-list-container"
        v-show="recommendNodesListSetup"
      >
        <div class="checkbox-top-infos">
          <a-checkbox
            :indeterminate="indeterminate"
            :checked="checkAll"
            @change="onCheckAllChange"
          >
            选择所有推荐关系
          </a-checkbox>
          <CloseCircleOutlined
            class="recommend-nodes-list-close"
            @click="closeRecommendList"
          />
        </div>
        <br />
        <a-checkbox-group
          class="checkbox-group"
          v-model:value="selectedRecommendInfos"
          @change="onChange"
        >
          <a-row
            type="flex"
            v-for="(item, index) in recommendNodesList"
            :key="index"
          >
            <a-col>
              <a-checkbox
                :value="item"
                :disabled="graphInfos.allCurNodeByIdMap.has(item.guid)"
                :default-checked="graphInfos.allCurNodeByIdMap.has(item.guid)"
              >
                节点类型:
                <span style="color: #999999">{{ item.typeName }}</span>
                &nbsp;&nbsp;&nbsp;关系类型:
                <span style="color: #999999">{{
                  relationshipChineseName(item.relatationshipTypeName)
                }}</span>
                &nbsp;&nbsp;&nbsp;推荐评分:
                <span style="color: #999999">{{ item.score }}</span>
              </a-checkbox>
            </a-col>
          </a-row>
        </a-checkbox-group>
        <br />
        <a-button
          :disabled="selectedRecommendInfos.length === 0"
          @click="postSelectedNodeList"
        >
          扩展所选节点
        </a-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  reactive,
  toRefs,
  defineComponent,
  getCurrentInstance,
  onMounted,
  toRaw,
  computed,
} from 'vue'

import { CloseCircleOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'ContextMenu',
  components: {
    CloseCircleOutlined,
  },
  props: {
    taskID: {
      type: String,
      required: true,
      default() {
        return ''
      },
    },
  },
  setup(props: any, context: any) {
    // 实例对象
    let currentInstance: any = null

    // 定义数据属性
    const reactiveData = reactive({
      taskID: props.taskID, // 上级任务ID

      graphInfos: {}, // 所记录的图谱信息
      contextMenuType: 'nodeContextMenu', // 右键菜单类型
      position: { left: 0, top: 0, layerX: 0, layerY: 0 }, // 菜单位置
      contextData: {
        guid: '',
        isHidden: false,
        isPinStatus: false,
        expandRelations: {},
        currentExpandStatus: {},
      }, // 操作的点边数据
      contextMenuInfos: {}, // 右键菜单触发时的信息

      // 智能交互导航相关
      showRecommendNodeList: false, // 是否显示推荐节点列表容器
      recommendNodesList: [], // 推荐的节点列表
      selectedRecommendInfos: [], // 选择的要扩展的节点列表
      indeterminate: false,
      checkAll: false, // 是否全选
    })

    // 计算属性
    /**
     * 看是否准备就绪了
     */
    const recommendNodesListSetup = computed(
      () => reactiveData.recommendNodesList.length !== 0
    )

    // 更新图谱数据信息
    const updateGraphInfos = (graphInfos: any) => {
      reactiveData.graphInfos = graphInfos
    }

    // 隐藏右键菜单
    const hideContextMenu = (contextMenuType = 'nodeContextMenu') => {
      if (contextMenuType === 'nodeContextMenu') {
        currentInstance.ctx.$refs.nodeContextMenu.hide()
      } else {
        currentInstance.ctx.$refs.nodeContextMenu.hide()
      }
    }

    // 显示右键菜单
    const showContextMenu = (
      contextMenuType: string,
      event: any,
      contextData: any
    ) => {
      // hideContextMenu()
      reactiveData.contextMenuType = contextMenuType
      reactiveData.contextData = contextData
      reactiveData.position.left = event.pageX
      reactiveData.position.top = event.pageY
      reactiveData.position.layerX = event.layerX
      reactiveData.position.layerY = event.layerY

      reactiveData.recommendNodesList = []
      reactiveData.showRecommendNodeList = false
      reactiveData.indeterminate = false
      reactiveData.checkAll = false
      reactiveData.selectedRecommendInfos = []

      if (reactiveData.contextMenuType === 'nodeContextMenu') {
        currentInstance.ctx.$refs.nodeContextMenu.show(reactiveData.position)
      }
      if (reactiveData.contextMenuType === 'edgeContextMenu') {
        currentInstance.ctx.$refs.edgeContextMenu.show(reactiveData.position)
      }
    }

    /**
     * 更新右键菜单操作元信息
     * @param operateType 右键菜单类型
     * @param params 操作附加参数
     */
    const updateContextMenuInfos = (operateType: string, params: any = {}) => {
      reactiveData.contextMenuInfos = {
        contextMenuType: reactiveData.contextMenuType,
        dataId: reactiveData.contextData.guid,
        operateType,
        params,
      }
    }

    /**
     * console查看点边信息
     */
    const consoleInfos = () => {
      updateContextMenuInfos('consoleInfos')
      context.emit('triggerContextMenu', toRaw(reactiveData.contextMenuInfos))
    }

    /**
     * 显示隐藏点边
     */
    const hiddenElement = () => {
      updateContextMenuInfos('hiddenData')
      context.emit('triggerContextMenu', toRaw(reactiveData.contextMenuInfos))
    }

    /**
     * 关系扩展
     */
    const expandElement = (expandRelationType: string) => {
      if (expandRelationType === 'getRecommendExpandNodes') {
        // 图交互导航
        reactiveData.showRecommendNodeList = true
        // 获取推荐扩展节点列表
        updateContextMenuInfos('getRecommendExpandNodes')
        context.emit('triggerContextMenu', toRaw(reactiveData.contextMenuInfos))
      } else {
        // 普通扩展
        updateContextMenuInfos('expandData', { expandRelationType })
        context.emit('triggerContextMenu', toRaw(reactiveData.contextMenuInfos))
      }
    }

    /**
     * 更新推荐节点列表
     * @param recommendNodeList 推荐节点列表
     */
    const changeRecommendNodeList = (recommendNodeList: any) => {
      reactiveData.recommendNodesList = recommendNodeList
      reactiveData.showRecommendNodeList = recommendNodeList.length > 0
    }

    // 在选择推荐节点时出发的 change 事件
    const onChange = (selectedRecommendInfos: any) => {
      reactiveData.indeterminate =
        !!selectedRecommendInfos.length &&
        selectedRecommendInfos.length < reactiveData.recommendNodesList.length
      reactiveData.checkAll =
        selectedRecommendInfos.length === reactiveData.recommendNodesList.length
    }

    const onCheckAllChange = (e: any) => {
      reactiveData.selectedRecommendInfos = e.target.checked
        ? reactiveData.recommendNodesList
        : []
      reactiveData.indeterminate = false
      reactiveData.checkAll = e.target.checked
    }

    // 发送获取基于筛选节点的图谱请求
    const postSelectedNodeList = () => {
      const selectedRecommendInfos = {
        relatedNodes: new Set(
          reactiveData.selectedRecommendInfos
            .map((t: any) => t.relatedNodes)
            .reduce((a: any, b: any) => a.concat(b))
        ),
        relatedEdges: new Set(
          reactiveData.selectedRecommendInfos
            .map((t: any) => t.relatedEdges)
            .reduce((a: any, b: any) => a.concat(b))
        ),
      }
      context.emit('postSelectedNodeList', selectedRecommendInfos)
      // this.selectedRecommendInfos.length = 0; // 清空
    }

    // 关闭推荐扩展节点菜单
    const closeRecommendList = () => {
      reactiveData.showRecommendNodeList = false
      context.emit('resetForceFxFy', reactiveData.contextData.guid)
      context.emit('runAutoZoom')
      // updateContextMenuInfos('consoleInfos')
      // context.emit('triggerContextMenu', reactiveData.contextMenuInfos)
    }

    /**
     * 钉住
     */
    const pinElement = () => {
      updateContextMenuInfos('pinElement')
      context.emit('triggerContextMenu', reactiveData.contextMenuInfos)
    }

    /**
     * 根据任务ID提供不同的右键菜单选项
     */
    const isShowContextMenuItem = (title: string) => {
      const consoleContextSet = new Set(['Scenario_1'])
      const pinOrUnpinContextSet = new Set(['Scenario_1'])
      const showOrHiddenContextSet = new Set(['Scenario_1', 'task_S6-ours'])
      const recommendExpandContextSet = new Set(['Scenario_1', 'task_S7-ours'])
      const expandAllContextSet = new Set([
        'Scenario_1',
        'task_S4-ours',
        
      ])
      const expandContextSet = new Set([
        'Scenario_1',
        'task_S4-ours',
        'task_S7-others',
        'task_S7-ours',
      ])
      let res

      switch (title) {
        case 'console':
          res = consoleContextSet.has(reactiveData.taskID)
          break
        case 'pinOrUnpin':
          res = pinOrUnpinContextSet.has(reactiveData.taskID)
          break
        case 'showOrHidden':
          res = showOrHiddenContextSet.has(reactiveData.taskID)
          break
        case 'getRecommendExpandNodes':
          res = recommendExpandContextSet.has(reactiveData.taskID)
          break
        case 'ALL':
          res = expandAllContextSet.has(reactiveData.taskID)
          break
        case 'LAST_PARENT_CHILD':
          res = expandContextSet.has(reactiveData.taskID)
          break
        case 'NEXT_PARENT_CHILD':
          res = expandContextSet.has(reactiveData.taskID)
          break
        case 'LOGICAL_PHYSICAL':
          res = expandContextSet.has(reactiveData.taskID)
          break
        case 'PK_FK':
          res = expandContextSet.has(reactiveData.taskID)
          break
        case 'DATA_FLOW':
          res = expandContextSet.has(reactiveData.taskID)
          break
        default:
          res = false
      }
      return res
    }
    /**
     * 可扩展类型过滤器
     */
    const filterExpandList = (expandRelations: any) => {
      const item = Object.assign({}, expandRelations)
      delete item['推荐关系']
      delete item['其他关系']
      return item
    }

    /**
     * 根据关系英文名称返回中文名称
     */
    const relationshipChineseName = (relationshipTypeName: string) => {
      let res = relationshipTypeName
      switch (relationshipTypeName) {
        case 'PARENT_CHILD':
          res = '父子关系'
          break
        case 'LOGICAL_PHYSICAL':
          res = '逻辑物理关系'
          break
        case 'DATA_FLOW':
          res = '数据流关系'
          break
        case 'PK_FK':
          res = '主外键关系'
          break
        default:
          break
      }
      return res
    }

    onMounted(() => {
      currentInstance = getCurrentInstance() as any
    })

    // 将数据返回
    return {
      ...toRefs(reactiveData),
      recommendNodesListSetup,

      // 右键菜单的事件处理
      consoleInfos,
      expandElement,
      hiddenElement,
      pinElement,

      // 内置函数
      showContextMenu,
      updateGraphInfos,
      changeRecommendNodeList,
      filterExpandList,
      isShowContextMenuItem,
      relationshipChineseName,

      // 推荐列表交互功能
      closeRecommendList,
      onCheckAllChange,
      onChange,
      postSelectedNodeList,
    }
  },
})
</script>

<style scoped>
.loading-container {
  text-align: center;
}

.recommend-nodes-list-container {
  background-color: #ffffffa0;
  border-radius: 4px;
  border: 1px solid #cccccc;
  padding: 20px 30px;
}

.checkbox-top-infos {
  border-bottom: '1px solid #E9E9E9';
  position: 'relative';
}

.recommend-nodes-list-close {
  float: right;
}

.recommend-nodes-list-tooltip {
  position: absolute;
  /*width: 200px;*/
}

.checkbox-group {
  width: 100%;
  overflow-y: scroll;
  height: 150px;
}
</style>
