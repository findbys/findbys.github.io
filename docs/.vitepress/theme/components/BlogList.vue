<template>
  <div class="blog-list">
    <div class="blog-grid">
      <a
        v-for="post in posts"
        :key="post.link"
        :href="post.link"
        class="blog-card"
      >
        <div class="card-category" :style="{ color: post.color, borderColor: post.color + '40', background: post.color + '12' }">
          {{ post.category }}
        </div>
        <h3 class="card-title">{{ post.title }}</h3>
        <p class="card-excerpt">{{ post.excerpt }}</p>
        <div class="card-footer">
          <div class="card-tags">
            <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div class="card-meta">
            <span class="date">{{ post.date }}</span>
            <span class="read-time">{{ post.readTime }}</span>
          </div>
        </div>
        <div class="card-arrow">→</div>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Post {
  title: string
  excerpt: string
  link: string
  category: string
  color: string
  tags: string[]
  date: string
  readTime: string
}

defineProps<{ posts: Post[] }>()
</script>

<style scoped>
.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.blog-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  background: var(--c-bg-card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--c-border-subtle);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all 0.25s ease;
  overflow: hidden;
}

.blog-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, color-mix(in srgb, var(--c-brand-primary) 5%, transparent), transparent);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.blog-card:hover {
  border-color: var(--c-border-glow);
  transform: translateY(-3px);
  box-shadow: var(--shadow-card);
}

.blog-card:hover::before { opacity: 1; }

.card-category {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid;
  width: fit-content;
  font-family: var(--font-mono);
}

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0;
  line-height: 1.4;
  transition: color 0.2s;
}

.blog-card:hover .card-title {
  color: var(--c-brand-primary);
}

.card-excerpt {
  font-size: 0.83rem;
  color: var(--c-text-muted);
  line-height: 1.6;
  margin: 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  background: color-mix(in srgb, var(--c-text-primary) 5%, transparent);
  border: 1px solid var(--c-border-subtle);
  color: var(--c-text-muted);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-family: var(--font-mono);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--c-text-muted);
}

.card-meta span::before {
  content: '· ';
  opacity: 0.4;
}
.card-meta .date::before { content: ''; }

.card-arrow {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  font-size: 1rem;
  color: var(--c-text-muted);
  opacity: 0;
  transform: translateX(-5px);
  transition: all 0.2s ease;
}
.blog-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--c-brand-primary);
}
</style>
