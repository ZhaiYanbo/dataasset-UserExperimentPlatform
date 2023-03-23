import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: '首页',
    component: () => import('../views/register.vue'),
  },
  {
    path: '/register',
    name: '用户注册',
    component: () => import('../views/register.vue'),
  },
  {
    path: '/task_S1-others',
    name: '增强语义图元视觉编码others',
    component: () => import('../views/Task_S1-others.vue'),
  },
  {
    path: '/task_S1-ours',
    name: '增强语义图元视觉编码ours',
    component: () => import('../views/Task_S1-ours.vue'),
  },
  {
    path: '/task_S2-others',
    name: '高聚合点边视觉抽象化简others',
    component: () => import('../views/Task_S2-others.vue'),
  },
  {
    path: '/task_S2-ours',
    name: '高聚合点边视觉抽象化简ours',
    component: () => import('../views/Task_S2-ours.vue'),
  },
  {
    path: '/task_S3-others',
    name: '图骨干计算与分层布局others',
    component: () => import('../views/Task_S3-others.vue'),
  },
  {
    path: '/task_S3-ours',
    name: '图骨干计算与分层布局ours',
    component: () => import('../views/Task_S3-ours.vue'),
  },
  {
    path: '/task_S4-others',
    name: '主结构保持的增量布局others',
    component: () => import('../views/Task_S4-others.vue'),
  },
  {
    path: '/task_S4-ours',
    name: '主结构保持的增量布局ours',
    component: () => import('../views/Task_S4-ours.vue'),
  },
  {
    path: '/task_S5-others',
    name: '全局与局部可调的混合布局others',
    component: () => import('../views/Task_S5-others.vue'),
  },
  {
    path: '/task_S5-ours',
    name: '全局与局部可调的混合布局ours',
    component: () => import('../views/Task_S5-ours.vue'),
  },
  {
    path: '/task_S6-ours',
    name: '基本图交互分析技术ours',
    component: () => import('../views/Task_S6-ours.vue'),
  },
  {
    path: '/task_S7-others',
    name: '智能化图交互分析导航others',
    component: () => import('../views/Task_S7-others.vue'),
  },
  {
    path: '/task_S7-ours',
    name: '智能化图交互分析导航ours',
    component: () => import('../views/Task_S7-ours.vue'),
  },
  {
    path: '/task_S8-1-others',
    name: '基于关系链路的图计算others',
    component: () => import('../views/Task_S8-1-others.vue'),
  },
  {
    path: '/task_S8-1-ours',
    name: '基于关系链路的图计算ours',
    component: () => import('../views/Task_S8-1-ours.vue'),
  },
  {
    path: '/task_S8-2-others',
    name: '基于社群的图计算others',
    component: () => import('../views/Task_S8-2-others.vue'),
  },
  {
    path: '/task_S8-2-ours',
    name: '基于社群的图计算ours',
    component: () => import('../views/Task_S8-2-ours.vue'),
  },
  {
    path: '/task_S8-3-ours',
    name: '基于中心性的图计算ours',
    component: () => import('../views/Task_S8-3-ours.vue'),
  },
  {
    path: '/task_S8-3-others',
    name: '基于中心性的图计算others',
    component: () => import('../views/Task_S8-3-others.vue'),
  },
  {
    path: '/task_S9',
    name: '原型系统综合对比评价',
    component: () => import('../views/Task_S9.vue'),
  },
  {
    path: '/Scenario_1',
    name: '场景一迁移测试',
    component: () => import('../views/Scenario_1.vue'),
  },
  {
    path: '/Scenario_2',
    name: '场景二迁移测试',
    component: () => import('../views/Scenario_2.vue'),
  },
  {
    path: '/view_db',
    name: '查看数据库记录',
    component: () => import('../views/view_db.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
