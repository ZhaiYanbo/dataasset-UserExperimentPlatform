import { createApp } from 'vue';

// 引入 v-contextmenu
import contextmenu from 'v-contextmenu';
import 'v-contextmenu/dist/themes/default.css';

// 引入 antd-vue 组件
import 'ant-design-vue/dist/antd.css';
// import setupAntd from './utils/UI/antd-settings';

import App from './App.vue';
import router from './router';

const app = createApp(App);

// 注册 v-contextmenu 组件
app.use(contextmenu);

// 注册 antd-vue 组件
// setupAntd(app);

app.use(router).mount('#app');
