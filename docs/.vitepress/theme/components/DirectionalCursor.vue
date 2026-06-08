<template>
  <div
    ref="cursorRef"
    class="directional-cursor"
    :class="{ active: isActive, pressing: isPressing }"
    aria-hidden="true"
  >
    <svg class="cursor-arrow" viewBox="0 0 44 44" fill="none">
      <path
        class="arrow-shadow"
        d="M40 22L7 6L16.4 22L7 38L40 22Z"
      />
      <path
        class="arrow-body"
        d="M40 22L7 6L16.4 22L7 38L40 22Z"
      />
      <path
        class="arrow-edge"
        d="M32.2 22L12.4 12.6L18.8 22L12.4 31.4L32.2 22Z"
      />
    </svg>
  </div>
  <div class="cursor-spark-layer" aria-hidden="true">
    <span
      v-for="spark in sparks"
      :key="spark.id"
      class="cursor-spark"
      :style="{
        transform: `translate3d(${spark.x}px, ${spark.y}px, 0) scale(${spark.scale})`,
        opacity: spark.opacity,
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

const cursorRef = ref<HTMLDivElement | null>(null)
const isActive = ref(false)
const isPressing = ref(false)
const sparks = shallowRef<Spark[]>([])

let frameId = 0
let enabled = false
let currentX = 0
let currentY = 0
let targetX = 0
let targetY = 0
let lastX = 0
let lastY = 0
let currentAngle = -42
let targetAngle = -42
let lastMoveAt = 0
const hotspotX = 32.7
const hotspotY = 18
let sparkId = 0
let lastSparkAt = 0

interface Spark {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  scale: number
  opacity: number
}

function normalizeAngleDiff(diff: number) {
  return ((diff + 180) % 360) - 180
}

function updateCursor() {
  if (!cursorRef.value) return

  currentX += (targetX - currentX) * 0.34
  currentY += (targetY - currentY) * 0.34

  const angleDiff = normalizeAngleDiff(targetAngle - currentAngle)
  currentAngle += angleDiff * 0.22

  const isRecentlyMoving = performance.now() - lastMoveAt < 180
  cursorRef.value.style.transform = `translate3d(${currentX - hotspotX}px, ${currentY - hotspotY}px, 0) rotate(${currentAngle}deg) scale(${isRecentlyMoving ? 1 : 0.94})`
  updateSparks()

  frameId = requestAnimationFrame(updateCursor)
}

function emitSpark(x: number, y: number, angle: number, speed: number) {
  const backAngle = angle + Math.PI
  const sideAngle = backAngle + (Math.random() - 0.5) * 1.45
  const drift = Math.min(5, speed * 0.08) + Math.random() * 1.8

  const spark: Spark = {
    id: sparkId++,
    x: x + Math.cos(backAngle) * 12 + (Math.random() - 0.5) * 6,
    y: y + Math.sin(backAngle) * 12 + (Math.random() - 0.5) * 6,
    vx: Math.cos(sideAngle) * drift,
    vy: Math.sin(sideAngle) * drift,
    life: 1,
    maxLife: 34 + Math.random() * 22,
    scale: 0.45 + Math.random() * 0.85,
    opacity: 0.85,
  }

  sparks.value = [...sparks.value.slice(-24), spark]
}

function updateSparks() {
  if (!sparks.value.length) return

  sparks.value = sparks.value
    .map((spark) => {
      const nextLife = spark.life + 1
      const progress = nextLife / spark.maxLife
      return {
        ...spark,
        x: spark.x + spark.vx,
        y: spark.y + spark.vy,
        vx: spark.vx * 0.94,
        vy: spark.vy * 0.94 + 0.015,
        life: nextLife,
        scale: spark.scale * 0.982,
        opacity: Math.max(0, (1 - progress) ** 1.7),
      }
    })
    .filter((spark) => spark.life < spark.maxLife && spark.opacity > 0.02)
}

function handlePointerMove(event: PointerEvent) {
  if (!enabled || event.pointerType !== 'mouse') return

  const dx = event.clientX - lastX
  const dy = event.clientY - lastY
  const speed = Math.hypot(dx, dy)
  targetX = event.clientX
  targetY = event.clientY

  if (speed > 1.5) {
    const angle = Math.atan2(dy, dx)
    targetAngle = angle * 180 / Math.PI
    lastMoveAt = performance.now()
    if (lastMoveAt - lastSparkAt > 18) {
      emitSpark(event.clientX, event.clientY, angle, speed)
      lastSparkAt = lastMoveAt
    }
  }

  lastX = event.clientX
  lastY = event.clientY
  isActive.value = true
}

function handlePointerDown(event: PointerEvent) {
  if (event.pointerType === 'mouse') isPressing.value = true
}

function handlePointerUp() {
  isPressing.value = false
}

function handlePointerLeave() {
  isActive.value = false
  isPressing.value = false
}

onMounted(() => {
  enabled = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  if (!enabled) return

  document.documentElement.classList.add('has-directional-cursor')
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerdown', handlePointerDown)
  window.addEventListener('pointerup', handlePointerUp)
  window.addEventListener('pointerleave', handlePointerLeave)
  frameId = requestAnimationFrame(updateCursor)
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('has-directional-cursor')
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerdown', handlePointerDown)
  window.removeEventListener('pointerup', handlePointerUp)
  window.removeEventListener('pointerleave', handlePointerLeave)
  cancelAnimationFrame(frameId)
})
</script>

<style scoped>
.directional-cursor {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 2147483647;
  width: 36px;
  height: 36px;
  opacity: 0;
  pointer-events: none;
  transform-origin: 32.7px 18px;
  transition: opacity 0.18s ease;
  will-change: transform;
}

.cursor-spark-layer {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  pointer-events: none;
  overflow: hidden;
}

.cursor-spark {
  position: fixed;
  left: -4px;
  top: -4px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background:
    radial-gradient(circle, #fff 0 18%, var(--c-brand-primary) 28%, color-mix(in srgb, var(--c-brand-secondary) 72%, transparent) 54%, transparent 72%);
  box-shadow:
    0 0 10px color-mix(in srgb, var(--c-brand-primary) 64%, transparent),
    0 0 22px color-mix(in srgb, var(--c-brand-secondary) 34%, transparent);
  will-change: transform, opacity;
}

.directional-cursor.active {
  opacity: 1;
}

.directional-cursor.pressing .cursor-arrow {
  transform: scale(0.86);
}

.cursor-arrow {
  width: 100%;
  height: 100%;
  overflow: visible;
  transform-origin: 32.7px 18px;
  transition: transform 0.12s ease;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.24));
}

.arrow-shadow {
  fill: rgba(0, 0, 0, 0.22);
  transform: translate(2px, 2px);
}

.arrow-body {
  fill: var(--c-brand-primary);
  stroke: var(--c-text-primary);
  stroke-width: 1.35;
  stroke-linejoin: round;
}

.arrow-edge {
  fill: color-mix(in srgb, #fff 36%, var(--c-brand-secondary));
  opacity: 0.86;
}
</style>
