// // 全局引入样式
import 'ant-design-vue/dist/antd.css';

// 手动按需引入组件
import { Button, Rate } from 'ant-design-vue';

const plugins = [Button, Rate];

const setupAntd = (app: any) => {
  plugins.forEach((plugin: any) => {
    app.use(plugin);
  });
};

export default setupAntd;
