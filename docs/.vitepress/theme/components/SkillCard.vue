<template>
  <div class="skill-card" :class="{ flipped }" @click="flipped = !flipped" @mouseenter="hover = true" @mouseleave="hover = false">
    <div class="card-inner">
      <!-- Front -->
      <div class="card-face card-front">
        <div class="card-icon" :style="{ color: skill.color, '--glow': skill.color }">
          <span v-html="skill.icon" />
        </div>
        <div class="card-level-ring">
          <svg viewBox="0 0 36 36" class="ring-svg">
            <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path class="ring-fill" :style="{ strokeDasharray: `${skill.level}, 100`, stroke: skill.color }"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <span class="ring-label">{{ skill.level }}%</span>
        </div>
        <h3 class="card-name">{{ skill.name }}</h3>
        <p class="card-desc">{{ skill.brief }}</p>
        <div class="card-tags">
          <span v-for="tag in skill.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
        <div class="flip-hint">点击查看详情 →</div>
      </div>

      <!-- Back -->
      <div class="card-face card-back">
        <h3 class="back-title" :style="{ color: skill.color }">{{ skill.name }}</h3>
        <div class="back-points">
          <div v-for="(pt, i) in skill.points" :key="i" class="point-item">
            <span class="point-dot" :style="{ background: skill.color }" />
            <span>{{ pt }}</span>
          </div>
        </div>
        <div class="back-meta">
          <div v-if="skill.since">
            <span class="meta-label">掌握时间</span>
            <span class="meta-val">{{ skill.since }}</span>
          </div>
          <div v-if="skill.projects">
            <span class="meta-label">项目经验</span>
            <span class="meta-val">{{ skill.projects }}</span>
          </div>
        </div>
        <div class="flip-hint">← 返回</div>
      </div>
    </div>

    <!-- Hover glow -->
    <div class="card-glow" :style="{ opacity: hover ? 1 : 0, '--glow-color': skill.color }" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface Skill {
  name: string
  icon: string
  color: string
  level: number
  brief: string
  tags: string[]
  points: string[]
  since?: string
  projects?: string
}

defineProps<{ skill: Skill }>()

const flipped = ref(false)
const hover = ref(false)
</script>

<style scoped>
.skill-card {
  perspective: 1000px;
  cursor: pointer;
  position: relative;
  height: 280px;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1);
}

.skill-card.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  background: var(--c-bg-card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--c-border-subtle);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transition: border-color 0.25s ease;
  overflow: hidden;
}

.skill-card:hover .card-face {
  border-color: var(--c-border-glow);
}

.card-back {
  transform: rotateY(180deg);
  align-items: flex-start;
  padding: 1.5rem;
}

/* Icon */
.card-icon {
  font-size: 2rem;
  display: flex;
  align-items: center;
  filter: drop-shadow(0 0 8px var(--glow));
  transition: transform 0.3s ease;
}
.skill-card:hover .card-icon {
  transform: scale(1.1);
}

/* Ring progress */
.card-level-ring {
  position: relative;
  width: 52px;
  height: 52px;
  margin: 0.25rem 0;
}
.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.ring-bg {
  fill: none;
  stroke: var(--c-border-subtle);
  stroke-width: 2.5;
}
.ring-fill {
  fill: none;
  stroke-width: 2.5;
  stroke-linecap: round;
  transition: stroke-dasharray 1s ease;
}
.ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--c-text-primary);
}

/* Name */
.card-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0;
  text-align: center;
}

/* Desc */
.card-desc {
  font-size: 0.75rem;
  color: var(--c-text-muted);
  text-align: center;
  line-height: 1.5;
  margin: 0;
  flex: 1;
}

/* Tags */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}
.tag {
  background: color-mix(in srgb, var(--c-brand-primary) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-brand-primary) 16%, transparent);
  color: var(--c-brand-primary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-family: var(--font-mono);
}

.flip-hint {
  font-size: 0.68rem;
  color: var(--c-text-muted);
  margin-top: auto;
}

/* Back */
.back-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
}
.back-points {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  width: 100%;
}
.point-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--c-text-secondary);
  line-height: 1.5;
}
.point-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}
.back-meta {
  display: flex;
  gap: 1.25rem;
  width: 100%;
  padding-top: 0.75rem;
  border-top: 1px solid var(--c-border-subtle);
}
.meta-label {
  display: block;
  font-size: 0.65rem;
  color: var(--c-text-muted);
  margin-bottom: 2px;
}
.meta-val {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--c-text-primary);
}

/* Glow */
.card-glow {
  position: absolute;
  inset: -1px;
  border-radius: var(--radius-lg);
  background: radial-gradient(ellipse at center, color-mix(in srgb, var(--glow-color) 15%, transparent), transparent 70%);
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: -1;
}
</style>
