<script setup lang="ts">
import WelcomeItem from './WelcomeItem.vue'
import DocumentationIcon from './icons/IconDocumentation.vue'
import ToolingIcon from './icons/IconTooling.vue'
import EcosystemIcon from './icons/IconEcosystem.vue'
import CommunityIcon from './icons/IconCommunity.vue'
import SupportIcon from './icons/IconSupport.vue'

const openReadmeInEditor = () => fetch('/__open-in-editor?file=README.md')
</script>

<template>
  <WelcomeItem>
    <template #icon>
      <DocumentationIcon />
    </template>
    <template #heading>文档</template>

    Vue 的
    <a href="https://vuejs.org/" target="_blank" rel="noopener">官方文档</a>
    提供了上手所需的全部信息。
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <ToolingIcon />
    </template>
    <template #heading>工具链</template>

    这个项目使用
    <a href="https://vite.dev/guide/features.html" target="_blank" rel="noopener">Vite</a>
    提供开发服务和构建能力。推荐的 IDE 配置是
    <a href="https://code.visualstudio.com/" target="_blank" rel="noopener">VSCode</a>
    +
    <a href="https://github.com/vuejs/language-tools" target="_blank" rel="noopener"
      >Vue - Official</a
    >。如果需要测试组件和页面，可以使用
    <a href="https://vitest.dev/" target="_blank" rel="noopener">Vitest</a>
    以及
    <a href="https://www.cypress.io/" target="_blank" rel="noopener">Cypress</a>
    /
    <a href="https://playwright.dev/" target="_blank" rel="noopener">Playwright</a>.

    <br />

    更多说明见
    <a href="javascript:void(0)" @click="openReadmeInEditor"><code>README.md</code></a
    >.
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <EcosystemIcon />
    </template>
    <template #heading>生态</template>

    可以为项目选用这些官方工具和库：
    <a href="https://pinia.vuejs.org/" target="_blank" rel="noopener">Pinia</a>,
    <a href="https://router.vuejs.org/" target="_blank" rel="noopener">Vue Router</a>,
    <a href="https://test-utils.vuejs.org/" target="_blank" rel="noopener">Vue Test Utils</a>, and
    <a href="https://github.com/vuejs/devtools" target="_blank" rel="noopener">Vue Dev Tools</a>。
    如果还需要更多资源，可以查看
    <a href="https://github.com/vuejs/awesome-vue" target="_blank" rel="noopener">Awesome Vue</a>
    。
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <CommunityIcon />
    </template>
    <template #heading>社区</template>

    遇到问题时，可以在
    <a href="https://chat.vuejs.org" target="_blank" rel="noopener">Vue Land</a>
    官方 Discord，或
    <a href="https://stackoverflow.com/questions/tagged/vue.js" target="_blank" rel="noopener"
      >StackOverflow</a
    >
    提问。也可以关注官方
    <a href="https://bsky.app/profile/vuejs.org" target="_blank" rel="noopener">@vuejs.org</a>
    Bluesky 账号或
    <a href="https://x.com/vuejs" target="_blank" rel="noopener">@vuejs</a>
    X 账号，获取 Vue 生态的最新消息。
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <SupportIcon />
    </template>
    <template #heading>支持 Vue</template>

    Vue 是一个独立项目，长期发展依赖社区支持。你可以通过
    <a href="https://vuejs.org/sponsor/" target="_blank" rel="noopener">成为赞助者</a>
    提供帮助。
  </WelcomeItem>
</template>
