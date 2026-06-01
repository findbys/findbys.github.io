import { defineConfig } from 'vitepress'

const isGitHubPages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  title: 'findbys',
  description: '全栈工程师 | 前端技术博客 - 分享 Vue3、Flutter、工程化等技术干货',
  lang: 'zh-CN',
  base: isGitHubPages ? '/blog/' : '/',
  appearance: {
    initialValue: 'light',
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap', rel: 'stylesheet' }],
    ['meta', { name: 'theme-color', content: '#f8f7f2' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: '肖青林 - 全栈工程师技术博客' }],
    ['meta', { property: 'og:description', content: '分享前端、Flutter、工程化等技术干货' }],
  ],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '技能专区', link: '/skills/' },
      {
        text: '技术博客',
        items: [
          { text: '所有文章', link: '/blog/' },
          { text: 'Vue3 系列', link: '/blog/vue3/' },
          { text: 'Flutter 系列', link: '/blog/flutter/' },
          { text: '工程化', link: '/blog/engineering/' },
        ]
      },
      // { text: '基础教程', link: '/tutorials/' },
      // { text: '关于我', link: '/about' },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/findbys' },
    ],
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: '搜索文章', buttonAriaLabel: '搜索' },
              modal: {
                noResultsText: '未找到相关内容',
                resetButtonTitle: '清除',
                footer: { selectText: '选择', navigateText: '导航', closeText: '关闭' }
              }
            }
          }
        }
      }
    },
    footer: {
      message: '用代码构建美好世界 🚀',
      copyright: 'Copyright © 2024 findbys'
    }
  },
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'one-dark-pro'
    },
    lineNumbers: true,
  },
  vite: {
    optimizeDeps: {
      include: ['three', 'gsap']
    }
  }
})
