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
    title: 'Flutter 渲染原理深度解析：从 setState 到屏幕像素点亮的全链路拆解',
    excerpt: '从三棵树 canUpdate 复用机制切入，顺着 VSync 信号完整拆解 Build、Layout（RelayoutBoundary）、Paint（RepaintBoundary）与 Composite 源码调用链，对比 Skia 与 Impeller 引擎演进。',
    link: '/blog/flutter/render-principle',
    category: 'Flutter',
    color: '#54c5f8',
    tags: ['Flutter', '渲染原理', 'PipelineOwner', 'Impeller', '性能优化'],
    date: '2026-10-28',
    readTime: '22 min',
  },
  {
    title: '掉发、防脱与毛发再生：现代医学已经验证的事实与机理',
    excerpt: '拆解雄脱生理学机制、DHT 与毛囊微型化。汇总 JAMA Dermatology 网状分析、非那雄胺/度他雄胺、米诺地尔、微针与红光治疗等临床验证方案，搭配高清中文医学图解。',
    link: '/blog/health/hair-loss-prevention-and-regrowth-guide',
    category: '前沿科学与健康',
    color: '#06b6d4',
    tags: ['脱发', '毛发再生', '雄脱', '非那雄胺', '米诺地尔', '循证医学'],
    date: '2026-10-15',
    readTime: '20 min',
  },
  {
    title: '科学抗衰老与抗氧化全景指南：基于顶级学术论文与医学研究的循证综述',
    excerpt: '检索 Cell、Nature、Science、NEJM、CALERIE 等顶尖研究，系统解析衰老十二大标志、抗氧化悖论、生活方式干预、功能性食物与前沿药理学。',
    link: '/blog/health/anti-aging-and-antioxidant-guide',
    category: '前沿科学与健康',
    color: '#10b981',
    tags: ['抗衰老', '抗氧化', '长寿医学', '营养学', '循证医学'],
    date: '2026-10-13',
    readTime: '25 min',
  },
  {
    title: '深入浅出 Flutter 底层通信：从 BinaryMessenger 原理到双端实战与架构演进',
    excerpt: '从 BinaryMessenger 二进制消息传递机制与线程模型切入，手把手拆解 MethodChannel、EventChannel、BasicMessageChannel 双端实现，对比 Pigeon 与 Dart FFI 演进。',
    link: '/blog/flutter/flutter-native-communication',
    category: 'Flutter',
    color: '#54c5f8',
    tags: ['Flutter', '跨平台通信', 'Platform Channel', 'Android', 'iOS'],
    date: '2026-09-01',
    readTime: '20 min',
  },
  {
    title: '深入 Dart 事件循环：单线程如何撑起高并发',
    excerpt: '从 Event Loop、Microtask Queue、Event Queue 的优先级调度，到与 JavaScript 事件循环的本质差异，再到 UI 卡顿避坑，一篇讲透 Dart 异步底层运转。',
    link: '/blog/dart/event-loop',
    category: 'Dart',
    color: '#0175c2',
    tags: ['Dart', 'Flutter', '事件循环', '异步', 'Isolate'],
    date: '2026-08-27',
    readTime: '20 min',
  },
  {
    title: 'Flutter Riverpod Clean Architecture：一份可直接落地的生产级模板',
    excerpt: '介绍 ssoad/flutter_riverpod_clean_architecture 模板，从四层划分、目录组织到 Riverpod 依赖注入，配完整代码示例与真实架构图。',
    link: '/blog/flutter/flutter-riverpod-clean-arch',
    category: 'Flutter',
    color: '#54c5f8',
    tags: ['Flutter', 'Riverpod', 'Clean Architecture', '状态管理'],
    date: '2026-08-25',
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
