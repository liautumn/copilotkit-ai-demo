import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/demos/chat',
      name: 'demo-chat',
      component: () => import('@/views/demos/ChatDemo.vue'),
    },
    {
      path: '/demos/sidebar',
      name: 'demo-sidebar',
      component: () => import('@/views/demos/SidebarDemo.vue'),
    },
    {
      path: '/demos/popup',
      name: 'demo-popup',
      component: () => import('@/views/demos/PopupDemo.vue'),
    },
    {
      path: '/demos/frontend-tools',
      name: 'demo-frontend-tools',
      component: () => import('@/views/demos/FrontendToolsDemo.vue'),
    },
    {
      path: '/demos/tool-rendering',
      name: 'demo-tool-rendering',
      component: () => import('@/views/demos/ToolRenderingDemo.vue'),
    },
    {
      path: '/demos/shared-state',
      name: 'demo-shared-state',
      component: () => import('@/views/demos/SharedStateDemo.vue'),
    },
    {
      path: '/demos/agent-context',
      name: 'demo-agent-context',
      component: () => import('@/views/demos/AgentContextDemo.vue'),
    },
    {
      path: '/demos/programmatic-control',
      name: 'demo-programmatic-control',
      component: () => import('@/views/demos/ProgrammaticControlDemo.vue'),
    },
    {
      path: '/demos/suggestions',
      name: 'demo-suggestions',
      component: () => import('@/views/demos/SuggestionsDemo.vue'),
    },
    {
      path: '/demos/interrupt',
      name: 'demo-interrupt',
      component: () => import('@/views/demos/InterruptDemo.vue'),
    },
    {
      path: '/demos/inspector',
      name: 'demo-inspector',
      component: () => import('@/views/demos/InspectorDemo.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
