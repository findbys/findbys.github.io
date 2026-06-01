---
layout: home
title: findbys | 前端工程师
description: findbys 的个人技术博客，记录 Vue、Flutter、工程化与 AI 辅助开发实践。
---

<HomeHero />

<SkillSection />

<script setup>
const recentPosts = [
  {
    title: 'Vue3 Composition API 深度实践指南',
    excerpt: '从项目组织、组合式函数封装到响应式边界，梳理 Vue3 在真实业务里的落地经验。',
    link: '/blog/vue3/composition-api',
    category: 'Vue3',
    color: '#42b883',
    tags: ['Vue3', 'Composition API', 'Hooks'],
    date: '2024-12-15',
    readTime: '12 min',
  },
  {
    title: 'Flutter BLoC 状态管理最佳实践',
    excerpt: '围绕状态拆分、事件流和测试策略，记录 Flutter 项目里更稳的 BLoC 使用方式。',
    link: '/blog/flutter/bloc-pattern',
    category: 'Flutter',
    color: '#54c5f8',
    tags: ['Flutter', 'BLoC', 'Dart'],
    date: '2024-12-01',
    readTime: '15 min',
  },
  {
    title: 'Vite 构建优化全攻略',
    excerpt: '从依赖预构建、代码分割、静态资源策略到构建分析，整理 Vite 项目优化路径。',
    link: '/blog/engineering/vite-optimize',
    category: '工程化',
    color: '#bd34fe',
    tags: ['Vite', '性能优化', '构建'],
    date: '2024-11-20',
    readTime: '10 min',
  },
  {
    title: 'TypeScript 高级类型系统完全指南',
    excerpt: '用泛型、条件类型、映射类型和模板字面量类型提高业务代码的约束力。',
    link: '/blog/typescript-advanced',
    category: 'TypeScript',
    color: '#3178c6',
    tags: ['TypeScript', '类型系统', '泛型'],
    date: '2024-11-10',
    readTime: '18 min',
  },
]
</script>

<div class="home-blog-section">
  <div class="section-header">
    <div class="section-tag">NOTES</div>
    <h2 class="section-title">最近写下的东西</h2>
    <p class="section-sub">少一点口号，多一点从项目里长出来的细节。</p>
  </div>
  <BlogList :posts="recentPosts" />
  <div class="view-all-wrap">
    <a href="/blog/" class="view-all-btn">查看全部文章</a>
  </div>
</div>

<div class="home-footer-cta">
  <div class="cta-content">
    <p class="cta-kicker">open to collaboration</p>
    <h2>如果你也关心工程效率和产品体验，我们可以聊聊。</h2>
    <div class="cta-actions">
      <a href="/blog/" class="btn-secondary">浏览文章</a>
      <a href="https://github.com/findbys" class="btn-primary" target="_blank" rel="noreferrer">GitHub</a>
    </div>
  </div>
</div>

<style>
.home-blog-section {
  max-width: 1152px;
  margin: 0 auto;
  padding: 4.5rem 1.5rem 3.5rem;
}

.section-header {
  max-width: 680px;
  margin-bottom: 2rem;
}

.section-tag {
  display: inline-block;
  margin-bottom: 0.65rem;
  color: var(--c-brand-primary);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
}

.section-title {
  margin: 0;
  color: var(--c-text-primary);
  font-size: clamp(1.75rem, 3vw, 2.55rem);
  line-height: 1.16;
  border: none !important;
  padding: 0 !important;
}

.section-title::before {
  display: none !important;
}

.section-sub {
  margin: 0.7rem 0 0;
  color: var(--c-text-muted);
}

.view-all-wrap {
  display: flex;
  justify-content: flex-start;
  margin-top: 2rem;
}

.view-all-btn {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 1rem;
  border: 1px solid rgba(232, 244, 253, 0.16);
  border-radius: 8px;
  color: var(--c-text-primary);
  font-size: 0.9rem;
  font-weight: 650;
  text-decoration: none;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.view-all-btn:hover {
  transform: translateY(-2px);
  border-color: rgba(244, 195, 111, 0.42);
  background: rgba(244, 195, 111, 0.06);
}

.home-footer-cta {
  border-top: 1px solid rgba(232, 244, 253, 0.08);
  background: var(--c-footer-bg);
  padding: 4.5rem 1.5rem;
}

.cta-content {
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2rem;
  align-items: end;
}

.cta-kicker {
  grid-column: 1 / -1;
  margin: 0 0 -1.25rem;
  color: var(--c-brand-primary);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
}

.cta-content h2 {
  margin: 0;
  max-width: 680px;
  color: var(--c-text-primary);
  font-size: clamp(1.65rem, 3vw, 2.45rem);
  line-height: 1.2;
  border: none !important;
  padding: 0 !important;
}

.cta-content h2::before {
  display: none !important;
}

.cta-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 650;
  text-decoration: none;
}

.btn-primary {
  background: var(--c-brand-primary);
  color: var(--c-primary-button-text, #1a1308) !important;
  border: 1px solid transparent;
}

.btn-secondary {
  border: 1px solid rgba(232, 244, 253, 0.16);
  color: var(--c-text-primary);
}

.btn-primary:hover,
.btn-primary:focus-visible {
  color: var(--c-primary-button-text, #1a1308) !important;
}

.VPHome {
  padding-bottom: 0 !important;
}

@media (max-width: 720px) {
  .cta-content {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .cta-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
