<template>
  <section class="skill-section">
    <!-- Section Header -->
    <div class="section-header">
      <div class="section-tag">TECH SKILLS</div>
      <h2 class="section-title">技能专区</h2>
      <p class="section-sub">5年+积累，覆盖 Web / 跨端 / 后端 全技术链路</p>
    </div>

    <!-- Category Tabs -->
    <div class="category-tabs" role="tablist">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="tab-btn"
        :class="{ active: activeTab === cat.id }"
        @click="activeTab = cat.id"
        :aria-selected="activeTab === cat.id"
        role="tab"
      >
        <span class="tab-icon" v-html="cat.icon" />
        <span>{{ cat.label }}</span>
      </button>
    </div>

    <!-- Skills Grid -->
    <transition name="fade-slide" mode="out-in">
      <div class="skills-grid" :key="activeTab">
        <SkillCard
          v-for="skill in currentSkills"
          :key="skill.name"
          :skill="skill"
        />
      </div>
    </transition>

    <!-- Bottom Legend -->
    <!-- <div class="skill-legend">
      <span class="legend-item" v-for="l in legend" :key="l.label">
        <span class="legend-dot" :style="{ background: l.color }" />
        {{ l.label }}
      </span>
    </div> -->
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SkillCard, { type Skill } from './SkillCard.vue'

const activeTab = ref('web')

const categories = [
  { id: 'web', label: 'Web 前端', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' },
  { id: 'cross', label: '跨端开发', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>' },
  { id: 'engineering', label: '工程化', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>' },
  { id: 'backend', label: '后端能力', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' },
  { id: 'devops', label: 'DevOps', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>' },
  { id: 'ai', label: 'AI 工具', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>' },
]

const allSkills: Record<string, Skill[]> = {
  web: [
    {
      name: 'Vue3',
      color: '#42b883',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="#42b883"><path d="M2 3h3.5L12 15l6.5-12H22L12 21z"/><path d="M6.5 3H10l2 4 2-4h3.5L12 13z" fill="#35495e"/></svg>',
      level: 95,
      brief: 'Vue3 Composition API / 响应式系统 / 组件设计',
      tags: ['Vue3', 'Pinia', 'Vue Router', 'Vueuse'],
      points: ['精通 Composition API 与 Options API', '熟悉 Vue3 响应式原理（Proxy）', '封装可复用 Hooks 与组件库', '结合 Pinia 进行复杂状态管理'],
      since: '3+ 年',
      projects: '20+ 项目',
    },
    {
      name: 'React',
      color: '#61dafb',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="#61dafb"><circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="3.5" stroke="#61dafb" stroke-width="1.5" fill="none"/><ellipse cx="12" cy="12" rx="10" ry="3.5" stroke="#61dafb" stroke-width="1.5" fill="none" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="3.5" stroke="#61dafb" stroke-width="1.5" fill="none" transform="rotate(120 12 12)"/></svg>',
      level: 85,
      brief: 'Hooks / 状态管理 / 性能优化',
      tags: ['React 18', 'Redux', 'Next.js', 'Hooks'],
      points: ['熟练使用 React Hooks（useState/useEffect/useMemo）', '掌握 Context API 与 Redux 状态管理', '了解 React Fiber 渲染机制', '具备 Next.js SSR/SSG 开发经验'],
      since: '2+ 年',
      projects: '8+ 项目',
    },
    {
      name: 'TypeScript',
      color: '#3178c6',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24"><rect width="24" height="24" rx="3" fill="#3178c6"/><text x="3" y="17" font-size="9" font-weight="bold" fill="white" font-family="monospace">TS</text></svg>',
      level: 90,
      brief: '类型系统 / 泛型 / 工程化类型约束',
      tags: ['泛型', '装饰器', '类型推断', '工具类型'],
      points: ['精通 TypeScript 类型系统与高级类型', '熟练使用泛型进行抽象设计', '工程化类型约束与 API 类型生成', '结合 Zod 进行运行时类型验证'],
      since: '3+ 年',
      projects: '全项目覆盖',
    },
    {
      name: 'CSS / 动画',
      color: '#e34f8b',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24"><text x="2" y="17" font-size="9" font-weight="bold" fill="#e34f8b" font-family="monospace">CSS</text></svg>',
      level: 92,
      brief: 'Flex/Grid / CSS 动画 / 响应式 / TailwindCSS',
      tags: ['Flexbox', 'Grid', 'Animation', 'Tailwind'],
      points: ['精通 Flex / Grid 布局，熟悉复杂响应式设计', '熟练使用 CSS 动画（keyframe / transition）', '掌握 TailwindCSS / UnoCss 原子化 CSS', '了解 CSS-in-JS 及 CSS 变量设计系统'],
      since: '5+ 年',
      projects: '全覆盖',
    },
    {
      name: '组件库',
      color: '#ff6b35',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff6b35" stroke-width="1.5"><rect x="2" y="2" width="9" height="9" rx="1.5"/><rect x="13" y="2" width="9" height="9" rx="1.5"/><rect x="2" y="13" width="9" height="9" rx="1.5"/><rect x="13" y="13" width="9" height="9" rx="1.5"/></svg>',
      level: 88,
      brief: 'Element-Plus / Ant Design / Vant / Arco Design',
      tags: ['Element-Plus', 'Ant Design', 'Vant', 'Arco'],
      points: ['熟练使用 Element-Plus / Ant Design 开发后台', '掌握 Vant 进行移动端 H5 开发', '能基于组件库二次封装业务组件', '了解 Web Components 自定义组件'],
      since: '4+ 年',
      projects: '15+ 项目',
    },
    {
      name: 'JavaScript',
      color: '#f7df1e',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24"><rect width="24" height="24" rx="3" fill="#f7df1e"/><text x="3" y="17" font-size="9" font-weight="bold" fill="#333" font-family="monospace">JS</text></svg>',
      level: 95,
      brief: 'ES6+ / 异步 / 原型链 / 设计模式',
      tags: ['ES2024', 'Promise', '闭包', 'Proxy'],
      points: ['精通 ES6+ 所有语法特性', '深入理解原型链、闭包、作用域', '熟练掌握 Promise / async-await', '了解常用设计模式并能实际应用'],
      since: '5+ 年',
      projects: '全覆盖',
    },
  ],
  cross: [
    {
      name: 'uni-app',
      color: '#00bcd4',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#00bcd4" stroke-width="1.5"/><path d="M8 12h8M12 8v8" stroke="#00bcd4" stroke-width="1.5" stroke-linecap="round"/></svg>',
      level: 90,
      brief: 'H5 / App / 微信小程序 多端统一开发',
      tags: ['H5', 'App', '小程序', 'uni-ui'],
      points: ['熟练构建 H5 / App / 小程序 多端项目', '掌握条件编译与平台差异处理', '能适配复杂业务场景与性能优化', '熟悉 uni-app 与原生混合开发'],
      since: '3+ 年',
      projects: '10+ 项目',
    },
    {
      name: 'Flutter',
      color: '#54c5f8',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="#54c5f8"><path d="M14.31 0L4 10.31l3.19 3.19L20.69 0zm0 11.38l-3.19 3.19 3.19 3.19 3.19-3.19zm-3.19 6.37l3.19 3.19-3.19 3.19L7.94 21l3.18-3.25z"/></svg>',
      level: 88,
      brief: 'iOS / Android 双端原生级 App 开发',
      tags: ['Dart', 'Widget', 'BLoC', 'GetX'],
      points: ['精通 Flutter Widget 体系与生命周期', '熟练使用 BLoC / GetX / Riverpod 状态管理', '具备完整 App 架构设计经验', '了解 Flutter 渲染原理与性能优化'],
      since: '2+ 年',
      projects: '5+ App',
    },
    {
      name: '状态管理',
      color: '#a855f7',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      level: 85,
      brief: 'Pinia / Vuex / Redux / GetX / BLoC',
      tags: ['Pinia', 'Vuex', 'GetX', 'BLoC'],
      points: ['熟练使用 Pinia 进行 Vue3 状态管理', '掌握 Vuex 模块化架构设计', 'Flutter 端熟练 BLoC / GetX / Riverpod', '了解响应式编程 RxDart'],
      since: '4+ 年',
      projects: '全覆盖',
    },
    {
      name: '原生开发',
      color: '#f59e0b',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="19" x2="13" y2="19"/></svg>',
      level: 72,
      brief: 'Android / iOS 原生基础开发',
      tags: ['Android', 'iOS', 'Swift', 'Kotlin'],
      points: ['了解 Android Activity / Fragment 生命周期', '具备 iOS Swift UI 基础开发能力', '能进行 Flutter 与原生混合开发', '处理原生权限、推送等系统功能'],
      since: '1+ 年',
      projects: '3+ 项目',
    },
  ],
  engineering: [
    {
      name: 'Vite',
      color: '#bd34fe',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M21 3L13.7 20.3l-2.2-9.3L3 9.3z" fill="#bd34fe"/><path d="M13.7 20.3L11.5 11 3 9.3z" fill="#ffbd44"/></svg>',
      level: 90,
      brief: '构建优化 / 插件开发 / 性能调优',
      tags: ['Vite 5', '构建优化', '插件', 'HMR'],
      points: ['深入理解 Vite 构建原理与 Rollup 插件体系', '能独立进行项目构建优化配置', '掌握打包体积分析与代码分割', '开发过自定义 Vite 插件'],
      since: '3+ 年',
      projects: '全覆盖',
    },
    {
      name: 'Webpack',
      color: '#1c78c0',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5z" fill="#1c78c0"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#1c78c0" stroke-width="1.5"/></svg>',
      level: 82,
      brief: 'Loader / Plugin / 构建链路优化',
      tags: ['Loader', 'Plugin', '分包', '缓存'],
      points: ['熟练配置 Webpack 5 构建流程', '掌握自定义 Loader 和 Plugin 开发', '能进行 Tree-shaking 和代码分割', '了解 Webpack 模块联邦'],
      since: '3+ 年',
      projects: '10+ 项目',
    },
    {
      name: '工程规范',
      color: '#00ff88',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff88" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
      level: 88,
      brief: 'ESLint / Prettier / Husky / 单测',
      tags: ['ESLint', 'Prettier', 'Husky', 'Vitest'],
      points: ['搭建完整的代码规范体系（ESLint+Prettier）', '配置 Husky + lint-staged 提交检查', '编写 Vitest / Jest 单元测试', '建立 CI/CD 自动化流水线'],
      since: '3+ 年',
      projects: '全覆盖',
    },
    {
      name: 'Git 协作',
      color: '#f05032',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="#f05032"><path d="M23.546 10.93L13.067.452a1.55 1.55 0 0 0-2.188 0L8.708 2.627l2.76 2.76a1.838 1.838 0 0 1 2.327 2.341l2.658 2.66a1.838 1.838 0 0 1 1.9 3.039 1.837 1.837 0 0 1-2.617-2.58L13.1 8.2v6.394a1.837 1.837 0 0 1 .486 3.553 1.838 1.838 0 0 1-2.264-1.762 1.838 1.838 0 0 1 1.116-1.686V8.105a1.836 1.836 0 0 1-.996-2.41L8.707 2.993 .45 11.249a1.55 1.55 0 0 0 0 2.188l10.48 10.477a1.55 1.55 0 0 0 2.186 0l10.43-10.43a1.55 1.55 0 0 0 0-2.554z"/></svg>',
      level: 90,
      brief: 'Git Flow / 多人协作 / SVN',
      tags: ['Git', 'GitFlow', 'SVN', 'PR Review'],
      points: ['熟练使用 Git Flow 分支管理策略', '掌握 rebase、cherry-pick 等高级操作', '熟悉 Code Review 流程与规范', '有大型团队多人协作经验'],
      since: '5+ 年',
      projects: '全覆盖',
    },
  ],
  backend: [
    {
      name: 'Node.js',
      color: '#68a063',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="#68a063"><path d="M12 1.85c-.27 0-.55.07-.78.2L3.78 6.35c-.48.28-.78.8-.78 1.36v9.58c0 .56.3 1.08.78 1.36l7.44 4.3c.23.13.5.2.78.2s.55-.07.78-.2l7.44-4.3c.48-.28.78-.8.78-1.36V7.71c0-.56-.3-1.08-.78-1.36L12.78 2.05c-.23-.13-.5-.2-.78-.2z"/></svg>',
      level: 80,
      brief: 'Express / Koa / RESTful API 开发',
      tags: ['Express', 'Koa', 'NestJS', 'Prisma'],
      points: ['熟练使用 Express / Koa 构建 REST API', '了解 NestJS 依赖注入架构', '掌握 JWT 鉴权与中间件设计', '具备 BFF 层开发经验'],
      since: '2+ 年',
      projects: '8+ 项目',
    },
    {
      name: 'Python',
      color: '#3572a5',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="#3572a5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13v2H9v2h2v6h2v-6h2V9h-2V7h-2z"/></svg>',
      level: 75,
      brief: 'FastAPI / Django / 数据处理脚本',
      tags: ['FastAPI', 'Django', 'Pandas', 'Scrapy'],
      points: ['熟练使用 FastAPI 构建高性能 API', '了解 Django ORM 和后台管理', '具备数据处理和爬虫脚本能力', '了解机器学习基础（NumPy / Pandas）'],
      since: '2+ 年',
      projects: '5+ 项目',
    },
    {
      name: 'Java',
      color: '#ea2d2e',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><text x="3" y="18" font-size="10" font-weight="bold" fill="#ea2d2e" font-family="serif">Java</text></svg>',
      level: 70,
      brief: 'Spring Boot / MVC / 基础业务接口开发',
      tags: ['Spring Boot', 'MyBatis', 'Maven', 'MySQL'],
      points: ['熟悉 Spring Boot 项目搭建与配置', '掌握 MyBatis / JPA ORM 操作', '了解 Spring Security 基础鉴权', '具备 Maven 项目管理经验'],
      since: '1+ 年',
      projects: '3+ 项目',
    },
    {
      name: '数据库',
      color: '#336791',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#336791" stroke-width="1.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 5c0 1.66-4.03 3-9 3S3 6.66 3 5"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>',
      level: 78,
      brief: 'MySQL / MongoDB / Redis 基础运用',
      tags: ['MySQL', 'MongoDB', 'Redis', 'SQL'],
      points: ['熟练编写 SQL 复杂查询与优化', '了解 MongoDB 文档型数据库操作', '掌握 Redis 缓存策略与数据结构', '了解数据库设计与索引优化'],
      since: '3+ 年',
      projects: '全覆盖',
    },
  ],
  devops: [
    {
      name: 'Docker',
      color: '#2496ed',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="#2496ed"><path d="M13.98 11.08h2.12v-2h-2.12v2zm-3.02 0H13v-2h-2.04v2zM8 11.08h2.04v-2H8v2zm-3 0h2.06v-2H5v2zm3-3.06h2.04v-2H8v2zm3.02 0H13v-2h-2.02v2zm3-3.02h2.12V3H14v2zM2 13.07c-.1.51.03 1.02.35 1.41.58.7 1.6.95 2.53.95h14.4c.9 0 1.77-.22 2.56-.65.76-.44 1.36-1.08 1.73-1.84.5-1.02.57-2.16.5-3.26H2.35L2 13.07z"/></svg>',
      level: 78,
      brief: '容器化部署 / docker-compose / 镜像管理',
      tags: ['Docker', 'Compose', '镜像', 'CI/CD'],
      points: ['熟练使用 Docker 进行应用容器化', '掌握 docker-compose 多服务编排', '了解 Dockerfile 最佳实践与镜像优化', '具备容器部署与运维调试经验'],
      since: '2+ 年',
      projects: '8+ 项目',
    },
    {
      name: 'Linux',
      color: '#fcc624',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="#fcc624"><path d="M12.504 0c-.155 0-.315.008-.48.021C7.576.344 3.59 2.929 2.026 6.877c-.886 2.218-.907 4.697-.016 6.952 1.033 2.623 3.265 4.541 5.97 5.362.408.124.703-.186.703-.574v-1.2c0-.39-.005-.39-.39-.39-.546 0-1.096-.048-1.608-.15-1.3-.25-2.4-1.14-2.745-2.404-.13-.478-.41-.908-.745-1.24-.26-.245-.18-.41.094-.41.23 0 .45.102.633.248.462.366.804.887.993 1.47.466 1.43 1.753 2.116 3.075 1.79.294-.073.526-.234.622-.527l.072-.22c.157-.493.497-.845.95-1.04 2.95-1.26 4.52-4.235 3.938-7.365-.494-2.66-2.717-4.6-5.308-4.9-.277-.033-.56-.05-.846-.05H12.5z"/></svg>',
      level: 75,
      brief: 'Shell 脚本 / 服务器运维 / Nginx',
      tags: ['Linux', 'Shell', 'Nginx', 'SSH'],
      points: ['熟悉 Linux 常用命令与系统操作', '能编写 Shell 脚本进行自动化任务', '掌握 Nginx 配置（反向代理/SSL）', '具备服务器部署与问题排查能力'],
      since: '3+ 年',
      projects: '全覆盖',
    },
    {
      name: 'CI/CD',
      color: '#e05d44',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e05d44" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>',
      level: 80,
      brief: 'GitHub Actions / Jenkins / 自动化部署',
      tags: ['GitHub Actions', 'Jenkins', 'GitLab CI', 'Pipeline'],
      points: ['熟练配置 GitHub Actions 自动化工作流', '了解 Jenkins Pipeline 搭建', '能实现代码 Push → 测试 → 构建 → 部署 全流程', '掌握环境变量与密钥安全管理'],
      since: '2+ 年',
      projects: '10+ 项目',
    },
  ],
  ai: [
    {
      name: 'AI 辅助编程',
      color: '#00d4ff',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" stroke-width="1.5"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 2.96 17 2.5 2.5 0 0 1 4.5 12a2.5 2.5 0 0 1-1.54-5A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 21.04 17 2.5 2.5 0 0 0 19.5 12a2.5 2.5 0 0 0 1.54-5A2.5 2.5 0 0 0 14.5 2z"/></svg>',
      level: 92,
      brief: 'Cursor / Trae / Copilot / Windsurf 等 AI IDE',
      tags: ['Cursor', 'Trae', 'Copilot', 'Windsurf'],
      points: ['精通 Cursor AI 编辑器进行全流程辅助开发', '掌握 Trae / Windsurf 等新一代 AI IDE', '熟练使用 GitHub Copilot 提升编码效率', '能结合 AI 工具实现复杂项目的快速原型搭建'],
      since: '2+ 年',
      projects: '全覆盖',
    },
    {
      name: 'Prompt 工程',
      color: '#7b2fff',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7b2fff" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>',
      level: 88,
      brief: '结构化 Prompt / 思维链 / 多轮对话设计',
      tags: ['CoT', 'Few-shot', 'System Prompt', 'Function Call'],
      points: ['精通结构化 Prompt 编写与优化技巧', '掌握 CoT 思维链 / Few-shot 等高级提示策略', '能设计复杂多轮对话与 System Prompt 架构', '熟练使用 Function Calling 实现工具调用'],
      since: '2+ 年',
      projects: '10+ 项目',
    },
    {
      name: 'LLM 大模型应用',
      color: '#ff6b9d',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff6b9d" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>',
      level: 85,
      brief: 'GPT / Claude / Gemini / 开源模型集成开发',
      tags: ['OpenAI', 'Claude', 'Gemini', 'LLaMA'],
      points: ['熟练调用 OpenAI / Claude / Gemini 等 API', '掌握模型参数调优（Temperature / Top-P）', '了解开源模型部署（LLaMA / Qwen / DeepSeek）', '具备多模型 Fallback 与负载均衡架构经验'],
      since: '1+ 年',
      projects: '8+ 项目',
    },
    {
      name: 'RAG 检索增强',
      color: '#00ff88',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff88" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>',
      level: 80,
      brief: '向量数据库 / 文档切分 / 语义检索 / 知识库',
      tags: ['向量检索', 'Embedding', 'LangChain', 'ChromaDB'],
      points: ['掌握 RAG 流水线搭建（切分/嵌入/检索/生成）', '熟练使用 LangChain / LlamaIndex 框架', '了解向量数据库（Chroma / Pinecone / Milvus）', '具备企业知识库问答系统开发经验'],
      since: '1+ 年',
      projects: '5+ 项目',
    },
    {
      name: 'AI Agent 开发',
      color: '#f59e0b',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.57-3.25 3.93"/><path d="M8.56 13.49A8 8 0 0 0 4 20.5h16a8 8 0 0 0-4.56-7.01"/><circle cx="12" cy="6" r="2"/><path d="M16 20v-2a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M18 8l2-2M6 8L4 6M12 2V0"/></svg>',
      level: 78,
      brief: 'Multi-Agent / 工具链 / 自主决策系统',
      tags: ['AutoGPT', 'CrewAI', 'LangGraph', 'Tool Use'],
      points: ['掌握 AI Agent 架构设计（ReAct / Plan-and-Execute）', '熟悉 Multi-Agent 协作系统搭建', '能设计 Agent 工具链与 API 编排', '了解 CrewAI / LangGraph 等主流框架'],
      since: '1+ 年',
      projects: '3+ 项目',
    },
    {
      name: 'MCP 协议',
      color: '#a855f7',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="1.5"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M7 8h4M7 12h8M7 16h5"/><circle cx="18" cy="8" r="1.5" fill="#a855f7"/></svg>',
      level: 75,
      brief: 'Model Context Protocol / AI 工具标准化协议',
      tags: ['MCP', 'Tool Server', 'SSE', 'JSON-RPC'],
      points: ['了解 MCP 协议规范与设计理念', '能开发自定义 MCP Tool Server', '掌握 SSE / stdio 传输层实现', '具备将现有 API 封装为 MCP 服务的经验'],
      since: '0.5+ 年',
      projects: '3+ 项目',
    },
  ],
}

const currentSkills = computed(() => allSkills[activeTab.value] || [])

const legend = [
  { label: '90%+ 精通', color: '#00ff88' },
  { label: '80%+ 熟练', color: '#00d4ff' },
  { label: '70%+ 了解', color: '#7b2fff' },
]
</script>

<style scoped>
.skill-section {
  max-width: 1152px;
  margin: 0 auto;
  padding: 4rem 1.5rem 3rem;
}

.section-header {
  text-align: left;
  margin-bottom: 2.5rem;
}

.section-tag {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--c-brand-primary);
  margin-bottom: 0.75rem;
  font-family: var(--font-mono);
}

.section-title {
  font-size: clamp(1.75rem, 3vw, 2.55rem);
  font-weight: 760;
  color: var(--c-text-primary);
  margin: 0 0 0.5rem;
  border: none !important;
  padding: 0 !important;
}

.section-title::before { display: none !important; }

.section-sub {
  color: var(--c-text-muted);
  font-size: 0.9rem;
  margin: 0;
}

/* Tabs */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
  margin-bottom: 2.5rem;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  border-radius: 8px;
  border: 1px solid var(--c-border-subtle);
  background: transparent;
  color: var(--c-text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.22s ease;
  font-family: var(--font-sans);
}

.tab-btn:hover {
  border-color: rgba(244, 195, 111, 0.36);
  color: var(--c-brand-primary);
  background: rgba(244, 195, 111, 0.06);
}

.tab-btn.active {
  background: rgba(244, 195, 111, 0.11);
  border-color: var(--c-brand-primary);
  color: var(--c-brand-primary);
  box-shadow: none;
}

/* Grid */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

/* Transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Legend */
.skill-legend {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-top: 2rem;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: var(--c-text-muted);
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

@media (max-width: 640px) {
  .skills-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
  .section-title { font-size: 1.75rem; }
}
</style>
