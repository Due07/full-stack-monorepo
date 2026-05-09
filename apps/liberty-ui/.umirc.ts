import path from 'node:path';
import UnoCSS from '@unocss/postcss';
import { defineConfig } from 'umi';

const proxyTarget = process.env.UMI_APP_API_PROXY_TARGET || 'http://0.0.0.0:3100';

export default defineConfig({
  npmClient: 'pnpm',
  esbuildMinifyIIFE: true,
  alias: {
    '@utils': path.resolve(__dirname, '../../utils'),
    '@contants': path.resolve(__dirname, './src/contants'),
  },
  extraPostCSSPlugins: [UnoCSS()],
  proxy: {
    '/api': {
      target: proxyTarget,
      changeOrigin: true,
    },
  },
  routes: [
    { path: '/login', component: '@/pages/login' },
    { path: '/403', component: '@/pages/403' },
    {
      path: '/',
      component: '@/layouts/AdminLayout',
      routes: [
        { path: '/', component: '@/pages/dashboard' },
        { path: '/profile', component: '@/pages/profile' },
        { path: '/users', component: '@/pages/users' },
        { path: '/users/:id', component: '@/pages/users/detail' },
        { path: '/users/:id/sessions', component: '@/pages/users/sessions' },
        { path: '/users/:id/login-history', component: '@/pages/users/login-history' },
        { path: '/audit-logs', component: '@/pages/audit-logs' },
      ],
    },
    { path: '*', component: '@/pages/404' },
  ],
});
