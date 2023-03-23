import { defineConfig } from 'vite';
import * as path from 'path';
import vue from '@vitejs/plugin-vue';

// 按需引入 antd-vue
import ViteComponents, { AntDesignVueResolver } from 'vite-plugin-components';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 自动按需引入 antd-vue
    ViteComponents({
      customComponentResolvers: [AntDesignVueResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // 路径别名
    },
    extensions: ['.js', '.json', '.ts'], // 使用路径别名时想要省略的后缀名，可以自己 增减
  },
  server: {
    host: '127.0.0.1',
    port: 40190,
    // https: true,
    proxy: {
      // 数据资产图谱请求
      '/api': {
        // target: 'http://121.5.128.51:8888',
        // target: 'http://127.0.0.1:8888',
        target: 'http://192.168.1.118:8931',
        changeOrigin: true,
        ws: true, // websocket支持
        secure: false,
        rewrite: (urlPath: string) => urlPath.replace(/^\/api/, ''),
      },
      // 用户实验记录请求
      '/userStudy': {
        target: 'http://127.0.0.1:40192',
        changeOrigin: true,
        ws: true, // websocket支持
        secure: false,
        rewrite: (urlPath: string) => urlPath.replace(/^\/userStudy/, ''),
      },
    },
  },
});
