<template>
  <section
    class="home-hero"
    @pointermove="handlePointerMove"
    @pointerup="handleDragEnd"
    @pointercancel="handleDragEnd"
    @pointerleave="handlePointerLeave"
  >
    <div class="hero-statement" aria-label="Crafting Digital Experiences with Precision">
      <div class="statement-particles" aria-hidden="true">
        <span v-for="i in 20" :key="i" class="particle"></span>
      </div>
      <div class="statement-line-wrap">
        <span class="statement-word" v-for="(word, idx) in statementWords" :key="idx" :style="{ animationDelay: `${idx * 0.08}s` }">
          <span class="statement-char" v-for="(char, charIdx) in word" :key="charIdx" :style="{ animationDelay: `${idx * 0.08 + charIdx * 0.02}s` }">
            {{ char }}
          </span>
        </span>
      </div>
      <div class="statement-glow" aria-hidden="true"></div>
      <div class="underline-glow" aria-hidden="true"></div>
    </div>

    <div class="creative-space-mark" aria-label="清林的创意空间">
      <span class="mark-orbit" aria-hidden="true"></span>
      <span class="mark-text" data-text="清林的创意空间">清林的创意空间</span>
      <span class="mark-spark" aria-hidden="true"></span>
    </div>

    <div class="hero-copy">
      <p class="hero-desc">
        关注 Vue、跨端、工程化和 AI 辅助开发。这里记录项目实践、技术复盘，以及我对前端体验细节的长期打磨。
      </p>

      <div class="hero-actions">
        <a href="/blog/" class="btn-primary">读文章</a>
        <a href="/skills/" class="btn-secondary">看技能栈</a>
      </div>

      <div class="hero-notes" aria-label="profile highlights">
        <span>5+ 年开发经验</span>
        <span>Vue / Flutter / Node</span>
        <span>工程化与体验优化</span>
      </div>
    </div>

    <div class="hero-stage" aria-label="interactive 3D workspace">
      <canvas
        ref="canvasRef"
        class="scene-canvas"
        @pointerdown="handleDragStart"
        @pointermove="handleDragMove"
        @pointerup="handleDragEnd"
        @pointercancel="handleDragEnd"
        @pointerleave="handleDragEnd"
      />
      <div class="stage-caption">
        <span class="caption-kicker">interactive sketch</span>
        <span>拖动鼠标，观察模块之间的协作关系</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const statementWords = ['Crafting', 'Digital', 'Experiences', 'with', 'Precision']

let renderer: THREE.WebGLRenderer | undefined
let scene: THREE.Scene | undefined
let camera: THREE.PerspectiveCamera | undefined
let frameId = 0
let core: THREE.Mesh | undefined
let moduleGroup: THREE.Group | undefined
let lineGroup: THREE.Group | undefined
let resizeObserver: ResizeObserver | undefined

const pointer = new THREE.Vector2(0, 0)
const targetRotation = new THREE.Vector2(-0.16, 0.28)
const dragRotation = new THREE.Vector2(-0.16, 0.28)
let isDragging = false
let dragStartX = 0
let dragStartY = 0
let dragStartRotationX = 0
let dragStartRotationY = 0

function createRoundedBox(width: number, height: number, depth: number, radius: number) {
  const shape = new THREE.Shape()
  const x = -width / 2
  const y = -height / 2

  shape.moveTo(x + radius, y)
  shape.lineTo(x + width - radius, y)
  shape.quadraticCurveTo(x + width, y, x + width, y + radius)
  shape.lineTo(x + width, y + height - radius)
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  shape.lineTo(x + radius, y + height)
  shape.quadraticCurveTo(x, y + height, x, y + height - radius)
  shape.lineTo(x, y + radius)
  shape.quadraticCurveTo(x, y, x + radius, y)

  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 8,
    bevelSize: 0.025,
    bevelThickness: 0.025,
  }).center()
}

function createLabelTexture(text: string, color: string) {
  const labelCanvas = document.createElement('canvas')
  labelCanvas.width = 256
  labelCanvas.height = 96
  const ctx = labelCanvas.getContext('2d')!

  ctx.clearRect(0, 0, labelCanvas.width, labelCanvas.height)
  ctx.fillStyle = 'rgba(245, 247, 250, 0.94)'
  ctx.font = '600 30px Inter, Microsoft YaHei, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 128, 48)

  ctx.strokeStyle = color
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(58, 76)
  ctx.lineTo(198, 76)
  ctx.stroke()

  const texture = new THREE.CanvasTexture(labelCanvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createModule(text: string, color: string, position: THREE.Vector3) {
  const geometry = createRoundedBox(1.24, 0.52, 0.08, 0.08)
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#101721'),
    roughness: 0.48,
    metalness: 0.12,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.035,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(position)

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.32 })
  )
  mesh.add(edge)

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: createLabelTexture(text, color),
    transparent: true,
    depthTest: false,
    depthWrite: false,
  }))
  sprite.scale.set(0.92, 0.34, 1)
  sprite.position.set(0, 0, 0.14)
  sprite.renderOrder = 10
  mesh.add(sprite)

  return mesh
}

function createConnection(from: THREE.Vector3, to: THREE.Vector3, color: string) {
  const curve = new THREE.CatmullRomCurve3([
    from.clone(),
    from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, 0.18, 0.2)),
    to.clone(),
  ])
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(36))
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.22 })
  )
}

function initScene(canvas: HTMLCanvasElement) {
  const host = canvas.parentElement!

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(host.clientWidth, host.clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(34, host.clientWidth / host.clientHeight, 0.1, 100)
  camera.position.set(0, 0.18, 7.45)

  const keyLight = new THREE.DirectionalLight('#f4d8a8', 2.5)
  keyLight.position.set(2.5, 3, 4)
  scene.add(keyLight)
  scene.add(new THREE.AmbientLight('#b8d8ff', 1.35))

  const fillLight = new THREE.PointLight('#86c5c0', 1.2, 8)
  fillLight.position.set(-2, -0.5, 3)
  scene.add(fillLight)

  moduleGroup = new THREE.Group()
  lineGroup = new THREE.Group()
  scene.add(lineGroup, moduleGroup)

  core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.54, 3),
    new THREE.MeshStandardMaterial({
      color: '#f4c36f',
      roughness: 0.34,
      metalness: 0.38,
      emissive: '#b86b2c',
      emissiveIntensity: 0.08,
    })
  )
  moduleGroup.add(core)

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.012, 10, 120),
    new THREE.MeshBasicMaterial({ color: '#f4c36f', transparent: true, opacity: 0.34 })
  )
  ring.rotation.x = Math.PI / 2.7
  moduleGroup.add(ring)

  const modules = [
    ['Vue', '#7ac7a8', new THREE.Vector3(-1.74, 1.02, -0.12)],
    ['React', '#74c7ec', new THREE.Vector3(0, 1.42, 0.08)],
    ['Flutter', '#77aee6', new THREE.Vector3(1.74, 1.02, -0.06)],
    ['Node', '#9fcb76', new THREE.Vector3(-1.76, -0.38, 0.12)],
    ['Python', '#e2b85c', new THREE.Vector3(1.76, -0.38, 0.1)],
    ['Java', '#d9876b', new THREE.Vector3(-0.92, -1.52, -0.04)],
    ['AI Agent', '#d7a45f', new THREE.Vector3(0.92, -1.52, -0.04)],
  ] as const

  modules.forEach(([label, color, position]) => {
    const module = createModule(label, color, position)
    moduleGroup!.add(module)
    lineGroup!.add(createConnection(new THREE.Vector3(0, 0, 0), position, color))
  })

  const grid = new THREE.GridHelper(5.2, 14, '#26313b', '#1b232b')
  grid.position.y = -1.88
  grid.rotation.x = 0.08
  scene.add(grid)

  resizeObserver = new ResizeObserver(() => resize())
  resizeObserver.observe(host)
}

function resize() {
  if (!renderer || !camera || !canvasRef.value?.parentElement) return
  const host = canvasRef.value.parentElement
  camera.aspect = host.clientWidth / host.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(host.clientWidth, host.clientHeight)
}

function animate(time = 0) {
  if (!renderer || !scene || !camera || !moduleGroup || !core || !lineGroup) return

  const hoverX = isDragging ? 0 : pointer.y * 0.08
  const hoverY = isDragging ? 0 : pointer.x * 0.1
  targetRotation.x += (dragRotation.x + hoverX - targetRotation.x) * 0.08
  targetRotation.y += (dragRotation.y + hoverY - targetRotation.y) * 0.08

  moduleGroup.rotation.x = targetRotation.x
  moduleGroup.rotation.y = targetRotation.y
  lineGroup.rotation.copy(moduleGroup.rotation)

  core.rotation.x += 0.006
  core.rotation.y += 0.009
  moduleGroup.position.y = Math.sin(time * 0.0012) * 0.045
  lineGroup.position.y = moduleGroup.position.y

  renderer.render(scene, camera)
  frameId = requestAnimationFrame(animate)
}

function handlePointerMove(event: PointerEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
  pointer.y = -((event.clientY - rect.top) / rect.height - 0.5) * 2
}

function handlePointerLeave() {
  pointer.set(0, 0)
}

function handleDragStart(event: PointerEvent) {
  isDragging = true
  dragStartX = event.clientX
  dragStartY = event.clientY
  dragStartRotationX = dragRotation.x
  dragStartRotationY = dragRotation.y
  canvasRef.value?.setPointerCapture(event.pointerId)
}

function handleDragMove(event: PointerEvent) {
  if (!isDragging) return
  const deltaX = event.clientX - dragStartX
  const deltaY = event.clientY - dragStartY
  dragRotation.y = dragStartRotationY + deltaX * 0.008
  dragRotation.x = THREE.MathUtils.clamp(dragStartRotationX + deltaY * 0.006, -0.85, 0.85)
}

function handleDragEnd(event?: PointerEvent) {
  if (!isDragging) return
  isDragging = false
  if (event && canvasRef.value?.hasPointerCapture(event.pointerId)) {
    canvasRef.value.releasePointerCapture(event.pointerId)
  }
}

onMounted(() => {
  if (!canvasRef.value) return
  initScene(canvasRef.value)
  animate()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId)
  resizeObserver?.disconnect()
  renderer?.dispose()
  scene?.traverse((object: THREE.Object3D) => {
    const mesh = object as THREE.Mesh
    mesh.geometry?.dispose?.()
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(material)) material.forEach((m) => m.dispose())
    else material?.dispose?.()
  })
})
</script>

<style scoped>
.home-hero {
  position: relative;
  display: grid;
  grid-template-areas:
    "statement statement"
    "mark mark"
    "copy stage";
  grid-template-columns: minmax(0, 0.92fr) minmax(360px, 1.08fr);
  gap: clamp(1.75rem, 4vw, 3.2rem) clamp(2rem, 6vw, 5rem);
  align-items: center;
  min-height: calc(100vh - 64px);
  padding: clamp(5.25rem, 8vw, 7.2rem) 1.5rem 4rem;
  max-width: 1240px;
  margin: 0 auto;
  overflow: hidden;
}

.home-hero::before {
  content: '';
  position: absolute;
  inset: 88px 1.5rem auto;
  height: 1px;
  background: linear-gradient(90deg, rgba(244, 195, 111, 0), rgba(244, 195, 111, 0.28), rgba(134, 197, 192, 0));
}

.hero-copy {
  grid-area: copy;
  position: relative;
  z-index: 2;
  min-width: 0;
  /* 居上显示 */
  height: 100%;
  padding-top: 42px;

}

.creative-space-mark {
  grid-area: mark;
  position: relative;
  z-index: 2;
  display: inline-flex;
  justify-self: start;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  margin-top: -0.7rem;
  padding: 0.72rem 1.05rem 0.78rem;
  border-radius: 0;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--c-brand-primary) 10%, transparent), transparent 78%),
    radial-gradient(circle at 18% 40%, color-mix(in srgb, var(--c-brand-primary) 18%, transparent), transparent 42%);
  box-shadow:
    0 18px 48px color-mix(in srgb, var(--c-brand-primary) 10%, transparent);
  overflow: hidden;
  isolation: isolate;
  animation: markFloat 4.8s ease-in-out infinite;
}

.creative-space-mark::before {
  content: '';
  position: absolute;
  inset: -1px -12%;
  background: linear-gradient(105deg, transparent 0 34%, color-mix(in srgb, #fff 48%, var(--c-brand-primary)) 47%, transparent 62% 100%);
  transform: translateX(-120%) skewX(-16deg);
  opacity: 0.72;
  animation: markSweep 5.2s cubic-bezier(0.45, 0, 0.2, 1) infinite;
  z-index: -1;
}

.creative-space-mark::after {
  content: '';
  position: absolute;
  left: 0;
  top: 16%;
  bottom: 16%;
  width: 3px;
  background: linear-gradient(180deg, var(--c-brand-primary), var(--c-brand-secondary));
  box-shadow: 0 0 18px color-mix(in srgb, var(--c-brand-primary) 52%, transparent);
  animation: markBarPulse 3.2s ease-in-out infinite;
}

.mark-orbit {
  position: absolute;
  left: 0.72rem;
  right: 0;
  top: 0;
  bottom: 0;
  border-top: 1px solid color-mix(in srgb, var(--c-brand-secondary) 40%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--c-brand-primary) 34%, transparent);
  mask-image: linear-gradient(90deg, #000 0 72%, transparent 100%);
  animation: markLineBreath 3.8s ease-in-out infinite;
}

.mark-text {
  position: relative;
  display: inline-block;
  color: transparent;
  background:
    linear-gradient(90deg, var(--c-text-primary), var(--c-brand-primary), var(--c-brand-secondary), var(--c-text-primary));
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: clamp(1.06rem, 1.65vw, 1.55rem);
  font-weight: 780;
  letter-spacing: 0.1em;
  line-height: 1;
  text-shadow: 0 12px 26px color-mix(in srgb, var(--c-brand-primary) 22%, transparent);
  animation: markTextGlow 4.8s ease-in-out infinite;
}

.mark-text::before,
.mark-text::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.mark-text::before {
  color: color-mix(in srgb, var(--c-brand-secondary) 70%, transparent);
  clip-path: inset(0 0 54% 0);
  transform: translateX(-1px);
  opacity: 0.5;
  animation: markSliceTop 3.4s steps(2, end) infinite;
}

.mark-text::after {
  color: color-mix(in srgb, var(--c-brand-primary) 76%, transparent);
  clip-path: inset(56% 0 0 0);
  transform: translateX(1px);
  opacity: 0.44;
  animation: markSliceBottom 3.4s steps(2, end) infinite;
}

.mark-spark {
  position: absolute;
  right: 0.62rem;
  top: 0.38rem;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #fff;
  box-shadow:
    0 0 12px var(--c-brand-primary),
    0 0 28px var(--c-brand-secondary);
  animation: markSpark 2.4s ease-in-out infinite;
}

.eyebrow {
  margin: 0 0 1rem;
  color: var(--c-brand-primary);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
}

.hero-statement {
  grid-area: statement;
  position: relative;
  display: block;
  width: 100%;
  margin: 0;
  padding-bottom: 1.1rem;
  color: var(--c-text-primary);
  min-width: 0;
}

.hero-statement::before,
.hero-statement::after,
.hero-statement .underline-glow {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  transform-origin: left;
  pointer-events: none;
}

.hero-statement::before {
  width: 100%;
  background: linear-gradient(90deg, 
    transparent 0%,
    color-mix(in srgb, var(--c-text-primary) 30%, transparent) 5%,
    color-mix(in srgb, var(--c-text-primary) 30%, transparent) 95%,
    transparent 100%);
  transform: scaleX(0);
  opacity: 0;
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.hero-statement::after {
  width: 100%;
  background: linear-gradient(90deg, 
    transparent 0%,
    var(--c-brand-primary) 10%,
    var(--c-brand-secondary) 50%,
    var(--c-brand-primary) 90%,
    transparent 100%);
  transform: scaleX(0);
  opacity: 0;
  transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.1s;
}

.hero-statement .underline-glow {
  width: 100%;
  height: 8px;
  bottom: -3px;
  background: radial-gradient(ellipse at center, 
    color-mix(in srgb, var(--c-brand-primary) 50%, transparent) 0%,
    transparent 70%);
  transform: scaleX(0);
  opacity: 0;
  filter: blur(4px);
  transition: all 1s cubic-bezier(0.22, 1, 0.36, 1) 0.2s;
}

.hero-statement:hover::before {
  transform: scaleX(1);
  opacity: 1;
}

.hero-statement:hover::after {
  transform: scaleX(1);
  opacity: 1;
  animation: underlineShimmer 2s ease-in-out infinite 0.5s;
}

.hero-statement:hover .underline-glow {
  transform: scaleX(1);
  opacity: 0.6;
  animation: glowPulse 2s ease-in-out infinite 0.3s;
}

.statement-particles {
  position: absolute;
  inset: -50% -20%;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--c-brand-primary);
  opacity: 0;
  animation: particleFloat 6s ease-in-out infinite;
}

.particle:nth-child(1) { left: 10%; top: 20%; animation-delay: 0s; }
.particle:nth-child(2) { left: 25%; top: 60%; animation-delay: 0.5s; }
.particle:nth-child(3) { left: 40%; top: 30%; animation-delay: 1s; }
.particle:nth-child(4) { left: 55%; top: 70%; animation-delay: 1.5s; }
.particle:nth-child(5) { left: 70%; top: 40%; animation-delay: 2s; }
.particle:nth-child(6) { left: 85%; top: 80%; animation-delay: 2.5s; }
.particle:nth-child(7) { left: 15%; top: 50%; animation-delay: 3s; }
.particle:nth-child(8) { left: 35%; top: 80%; animation-delay: 3.5s; }
.particle:nth-child(9) { left: 50%; top: 20%; animation-delay: 4s; }
.particle:nth-child(10) { left: 65%; top: 60%; animation-delay: 4.5s; }
.particle:nth-child(11) { left: 80%; top: 30%; animation-delay: 5s; }
.particle:nth-child(12) { left: 20%; top: 70%; animation-delay: 5.5s; }
.particle:nth-child(13) { left: 45%; top: 50%; animation-delay: 0.3s; }
.particle:nth-child(14) { left: 60%; top: 40%; animation-delay: 0.8s; }
.particle:nth-child(15) { left: 75%; top: 70%; animation-delay: 1.3s; }
.particle:nth-child(16) { left: 30%; top: 40%; animation-delay: 1.8s; }
.particle:nth-child(17) { left: 55%; top: 80%; animation-delay: 2.3s; }
.particle:nth-child(18) { left: 70%; top: 20%; animation-delay: 2.8s; }
.particle:nth-child(19) { left: 85%; top: 50%; animation-delay: 3.3s; }
.particle:nth-child(20) { left: 10%; top: 80%; animation-delay: 3.8s; }

.statement-line-wrap {
  position: relative;
  display: flex;
  gap: clamp(0.5rem, 1.5vw, 1rem);
  flex-wrap: wrap;
  align-items: center;
  z-index: 1;
}

.statement-word {
  display: inline-flex;
  gap: 0;
  opacity: 0;
  transform: translateY(30px) rotateX(-15deg);
  animation: wordReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.statement-char {
  display: inline-block;
  color: transparent;
  background:
    linear-gradient(135deg,
      color-mix(in srgb, var(--c-text-primary) 95%, var(--c-brand-secondary)) 0%,
      var(--c-brand-primary) 25%,
      var(--c-brand-secondary) 50%,
      var(--c-brand-primary) 75%,
      color-mix(in srgb, var(--c-text-primary) 95%, var(--c-brand-primary)) 100%);
  background-size: 300% 300%;
  background-position: 0% 50%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: Inter, 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  font-size: clamp(1.65rem, 4.35vw, 4.65rem);
  font-weight: 780;
  line-height: 1.05;
  letter-spacing: -0.035em;
  text-transform: none;
  filter: drop-shadow(0 8px 16px color-mix(in srgb, var(--c-brand-primary) 15%, transparent));
  opacity: 0;
  transform: translateY(20px) scale(0.8);
  animation: charReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
             charGradient 8s ease-in-out infinite;
}

.statement-glow {
  position: absolute;
  inset: -30%;
  background:
    radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--c-brand-primary) 25%, transparent) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, color-mix(in srgb, var(--c-brand-secondary) 20%, transparent) 0%, transparent 50%);
  opacity: 0;
  pointer-events: none;
  z-index: 0;
  animation: glowPulse 4s ease-in-out infinite;
}

h1 {
  margin: 0;
  color: var(--c-text-primary) !important;
  background: none;
  -webkit-text-fill-color: var(--c-text-primary) !important;
  font-size: clamp(2.45rem, 5.2vw, 4.9rem);
  line-height: 1.05;
  font-weight: 760;
  max-width: 760px;
}

.hero-desc {
  max-width: 620px;
  margin: 1.35rem 0 0;
  color: var(--c-text-secondary);
  font-size: 1.02rem;
  line-height: 1.9;
  overflow-wrap: anywhere;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 1.1rem;
  border-radius: 8px;
  font-size: 0.92rem;
  font-weight: 650;
  text-decoration: none;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.btn-primary {
  background: #f4c36f;
  color: #1a1308;
}

.btn-secondary {
  border: 1px solid rgba(232, 244, 253, 0.18);
  color: var(--c-text-primary);
  background: rgba(255, 255, 255, 0.035);
}

.btn-primary:hover,
.btn-secondary:hover {
  transform: translateY(-2px);
}

.btn-secondary:hover {
  border-color: rgba(244, 195, 111, 0.42);
  background: rgba(244, 195, 111, 0.06);
}

.hero-notes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 2rem;
  color: var(--c-text-muted);
  font-size: 0.82rem;
}

.hero-notes span {
  border-left: 1px solid rgba(244, 195, 111, 0.34);
  padding-left: 0.72rem;
}

.hero-stage {
  grid-area: stage;
  position: relative;
  height: clamp(380px, 48vw, 560px);
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.012)),
    radial-gradient(circle at 52% 42%, rgba(244, 195, 111, 0.12), transparent 36%),
    var(--c-hero-stage-bg);
  border: 1px solid rgba(232, 244, 253, 0.1);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.28);
  transform: translateY(clamp(0.5rem, 2.2vw, 1.75rem));
}

.hero-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(to bottom, rgba(0,0,0,0.58), transparent 82%);
  pointer-events: none;
}

.scene-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}

.scene-canvas:active {
  cursor: grabbing;
}

.stage-caption {
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: rgba(232, 244, 253, 0.66);
  font-size: 0.78rem;
  pointer-events: none;
}

.caption-kicker {
  color: #f4c36f;
  font-family: var(--font-mono);
}

@media (max-width: 900px) {
  .home-hero {
    grid-template-areas:
      "statement"
      "mark"
      "copy"
      "stage";
    grid-template-columns: 1fr;
    min-height: auto;
    padding-top: 5.5rem;
  }

  .hero-stage {
    height: 420px;
    transform: none;
  }

  .creative-space-mark {
    justify-self: start;
    margin-top: -0.4rem;
  }

  .statement-line {
    font-size: clamp(1.25rem, 6.2vw, 3.4rem);
    letter-spacing: -0.045em;
  }
}

@media (max-width: 640px) {
  .home-hero {
    width: 100%;
    max-width: 100%;
    padding-inline: 1rem;
    gap: 2rem;
  }

  .hero-statement {
    padding-bottom: 0.85rem;
    overflow-x: clip;
  }

  .creative-space-mark {
    padding: 0.62rem 0.82rem 0.66rem 0.95rem;
  }

  .mark-text {
    font-size: clamp(0.95rem, 5.2vw, 1.22rem);
    letter-spacing: 0.06em;
  }

  .statement-line {
    width: 100%;
    font-size: clamp(0.92rem, 4.82vw, 1.85rem);
    line-height: 1.02;
    letter-spacing: -0.055em;
  }

  h1 {
    font-size: 2.2rem;
  }

  .hero-desc {
    font-size: 0.96rem;
  }

  .hero-notes {
    display: grid;
    grid-template-columns: 1fr;
  }

  .hero-stage {
    height: 360px;
    max-width: calc(100vw - 2rem);
  }

  .stage-caption {
    flex-direction: column;
    gap: 0.2rem;
  }
}

@keyframes statementReveal {
  from {
    opacity: 0;
    transform: translateY(0.34em);
    mask-position: 100% 0;
    -webkit-mask-position: 100% 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    mask-position: 0 0;
    -webkit-mask-position: 0 0;
  }
}

@keyframes statementSheen {
  0%, 34% {
    background-position: 0 0;
  }
  58%, 100% {
    background-position: 100% 0;
  }
}

@keyframes statementGlint {
  0%, 38% {
    transform: translateX(-62%) skewX(-14deg);
    opacity: 0;
  }
  48% {
    opacity: 0.3;
  }
  66%, 100% {
    transform: translateX(62%) skewX(-14deg);
    opacity: 0;
  }
}

@keyframes statementRule {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

@keyframes statementAccent {
  0% {
    transform: translateX(0) scaleX(0.28);
    opacity: 0.55;
  }
  42% {
    transform: translateX(74%) scaleX(0.82);
    opacity: 1;
  }
  100% {
    transform: translateX(190%) scaleX(0.18);
    opacity: 0;
  }
}

@keyframes particleFloat {
  0%, 100% {
    opacity: 0;
    transform: translateY(0) scale(0);
  }
  10% {
    opacity: 0.8;
    transform: translateY(-20px) scale(1);
  }
  50% {
    opacity: 0.4;
    transform: translateY(-60px) scale(0.8);
  }
  90% {
    opacity: 0;
    transform: translateY(-100px) scale(0.4);
  }
}

@keyframes wordReveal {
  0% {
    opacity: 0;
    transform: translateY(30px) rotateX(-15deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotateX(0);
  }
}

@keyframes charReveal {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  60% {
    opacity: 1;
    transform: translateY(-5px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes charGradient {
  0%, 100% {
    background-position: 0% 50%;
  }
  25% {
    background-position: 100% 50%;
  }
  50% {
    background-position: 50% 100%;
  }
  75% {
    background-position: 50% 0%;
  }
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

@keyframes underlineShimmer {
  0%, 100% {
    background-position: -200% 0;
  }
  50% {
    background-position: 200% 0;
  }
}

.hero-statement::after {
  background-size: 200% 100%;
}

@keyframes markFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes markSweep {
  0%, 42% {
    transform: translateX(-120%) skewX(-16deg);
  }
  68%, 100% {
    transform: translateX(120%) skewX(-16deg);
  }
}

@keyframes markLineBreath {
  0%, 100% {
    transform: scaleX(0.82);
    opacity: 0.48;
  }
  50% {
    transform: scaleX(1);
    opacity: 0.95;
  }
}

@keyframes markTextGlow {
  0%, 100% {
    background-position: 0% 50%;
    filter: saturate(1);
  }
  50% {
    background-position: 100% 50%;
    filter: saturate(1.25);
  }
}

@keyframes markSliceTop {
  0%, 72%, 100% {
    transform: translateX(-1px);
    opacity: 0.38;
  }
  76% {
    transform: translateX(4px);
    opacity: 0.72;
  }
  80% {
    transform: translateX(-3px);
    opacity: 0.24;
  }
}

@keyframes markSliceBottom {
  0%, 72%, 100% {
    transform: translateX(1px);
    opacity: 0.34;
  }
  76% {
    transform: translateX(-4px);
    opacity: 0.68;
  }
  80% {
    transform: translateX(3px);
    opacity: 0.2;
  }
}

@keyframes markSpark {
  0%, 100% {
    transform: scale(0.72);
    opacity: 0.44;
  }
  45% {
    transform: scale(1.25);
    opacity: 1;
  }
}

@keyframes markBarPulse {
  0%, 100% {
    transform: scaleY(0.72);
    opacity: 0.58;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}
</style>
