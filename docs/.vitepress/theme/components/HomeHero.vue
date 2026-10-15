<template>
  <section
    class="home-hero"
    @pointerup="handleDragEnd"
    @pointercancel="handleDragEnd"
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

    <div class="creative-space-mark" aria-label="创意无极限">
      <span class="mark-orbit" aria-hidden="true"></span>
      <span class="mark-text" data-text="创意无极限">创意无极限</span>
      <span class="mark-spark" aria-hidden="true"></span>
    </div>

    <div class="hero-copy">
      <p class="hero-desc">
        关注 AI 、全栈、跨端、工程化。这里记录项目实践、技术复盘，以及对交互创意的长期打磨。
      </p>

      <div class="hero-actions">
        <a href="/blog/" class="btn-primary">读文章</a>
        <a href="/skills/" class="btn-secondary">看技能栈</a>
      </div>

      <div class="hero-notes" aria-label="profile highlights">
        <span>5+ 年开发经验</span>
        <span>Vue / React / Agent / Python / Java / Flutter / Node</span>
        <span>工程化架构与体验优化</span>
      </div>
    </div>

    <div
      class="hero-stage"
      aria-label="3D Pelican riding a bicycle simulation"
      @pointerleave="handleCanvasPointerLeave"
    >
      <!-- HUD Top Bar -->
      <div class="stage-hud-top">
        <div class="hud-status">
          <span class="status-pulse" :class="{ turbo: isTurbo }"></span>
          <span class="status-text">{{ isTurbo ? 'TURBO SPRINT // 68 KM/H' : 'PELICAN CRUISING // 26 KM/H' }}</span>
        </div>
        <div class="hud-actions">
          <button
            class="hud-btn"
            :class="{ active: isTurbo }"
            type="button"
            @click="toggleTurbo"
            title="加速冲刺"
          >
            <span>⚡ {{ isTurbo ? '狂暴巡航' : '加速冲刺' }}</span>
          </button>
          <button
            class="hud-btn"
            type="button"
            @click="ringBell"
            title="摁下车铃"
          >
            <span>🔔 车铃</span>
          </button>
          <button
            class="hud-btn"
            type="button"
            @click="cycleView"
            title="切换视角"
          >
            <span>🎥 视角: {{ viewNames[currentViewIndex] }}</span>
          </button>
        </div>
      </div>

      <canvas
        ref="canvasRef"
        class="scene-canvas"
        @pointerdown="handleDragStart"
        @pointermove="handleCanvasPointerMove"
        @pointerup="handleDragEnd"
        @pointercancel="handleDragEnd"
        @pointerleave="handleCanvasPointerLeave"
      />

      <!-- Honk speech bubble -->
      <transition name="honk-pop">
        <div v-if="showHonk" class="stage-honk" aria-hidden="true">
          <span>HONK! 嘎嘎! 🚲💨</span>
        </div>
      </transition>

      <div class="stage-caption">
        <span class="caption-kicker">AI BENCHMARK // PELICAN ON BICYCLE</span>
        <span>拖拽 360° 旋转 · 点击「冲刺」极速飙车</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import gsap from 'gsap'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const statementWords = ['Crafting', 'Digital', 'Experiences', 'with', 'Precision']

const isTurbo = ref(false)
const showHonk = ref(false)
const currentViewIndex = ref(0)
const viewNames = ['3/4 俯瞰', '侧面飞驰', '正面冲锋']

let renderer: THREE.WebGLRenderer | undefined
let scene: THREE.Scene | undefined
let camera: THREE.PerspectiveCamera | undefined
let frameId = 0
let resizeObserver: ResizeObserver | undefined

let worldGroup: THREE.Group | undefined
let bikeGroup: THREE.Group | undefined
let pelicanGroup: THREE.Group | undefined
let headGroup: THREE.Group | undefined
let upperBeak: THREE.Mesh | undefined
let pouchMesh: THREE.Mesh | undefined
let frontWheel: THREE.Group | undefined
let rearWheel: THREE.Group | undefined
let crankGroup: THREE.Group | undefined
let leftPedal: THREE.Mesh | undefined
let rightPedal: THREE.Mesh | undefined
let bellRippleMesh: THREE.Mesh | undefined

// Left & Right Leg meshes
interface LegRig {
  thigh: THREE.Mesh
  shin: THREE.Mesh
  foot: THREE.Mesh
  kneeMarker: THREE.Mesh
  hipPos: THREE.Vector3
  crankCenter: THREE.Vector3
  crankRadius: number
  offsetAngle: number
}
let leftLegRig: LegRig | undefined
let rightLegRig: LegRig | undefined

// Environment
let roadMarkings: THREE.Mesh[] = []
let windStreaks: { mesh: THREE.Mesh; speed: number; xSpan: number }[] = []
let cloudsGroup: THREE.Group | undefined

// Interaction & Physics
let pedalAngle = 0
let currentPedalSpeed = 3.5
let targetPedalSpeed = 3.5
let isDragging = false
let dragStartX = 0
let dragStartY = 0
let dragStartRotationX = 0
let dragStartRotationY = 0
let lastDragX = 0
let lastDragY = 0
let velocityX = 0
let velocityY = 0

const pointer = new THREE.Vector2(0, 0)
const targetRotation = new THREE.Vector2(-0.12, 0.45)
const dragRotation = new THREE.Vector2(-0.12, 0.45)

const viewPresets = [
  { x: -0.12, y: 0.45, camZ: 6.8 }, // 3/4 Perspective
  { x: 0.0, y: 0.0, camZ: 6.4 },   // Side View
  { x: -0.05, y: Math.PI / 2, camZ: 6.4 }, // Front View
]

function orientCylinder(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) {
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
  mesh.position.copy(mid)
  const dir = new THREE.Vector3().subVectors(b, a)
  const len = dir.length()
  mesh.scale.set(1, Math.max(len, 0.01), 1)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
}

function solveTwoBoneIK(
  H: THREE.Vector3,
  P: THREE.Vector3,
  L1: number,
  L2: number,
  fwdDir = new THREE.Vector3(1, 0, 0)
): THREE.Vector3 {
  const V = new THREE.Vector3().subVectors(P, H)
  const D = Math.min(V.length(), (L1 + L2) * 0.96)
  const U = V.clone().normalize()
  const proj = U.clone().multiplyScalar(fwdDir.dot(U))
  const N = new THREE.Vector3().subVectors(fwdDir, proj).normalize()
  const a = (L1 * L1 - L2 * L2 + D * D) / (2 * D)
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a))
  return H.clone().add(U.clone().multiplyScalar(a)).add(N.clone().multiplyScalar(h))
}

function createWheel(radius = 0.65): THREE.Group {
  const group = new THREE.Group()

  // Tire
  const tireMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.85 })
  const tire = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.048, 14, 40), tireMat)
  group.add(tire)

  // Rim
  const rimMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.8, roughness: 0.25 })
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius - 0.04, 0.022, 12, 40), rimMat)
  group.add(rim)

  // Hub
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 16), rimMat)
  hub.rotation.x = Math.PI / 2
  group.add(hub)

  // Spokes (12 spokes)
  const spokeMat = new THREE.LineBasicMaterial({ color: '#94a3b8', transparent: true, opacity: 0.55 })
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const spokePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.cos(angle) * (radius - 0.05), Math.sin(angle) * (radius - 0.05), 0),
    ]
    const spokeGeo = new THREE.BufferGeometry().setFromPoints(spokePoints)
    group.add(new THREE.Line(spokeGeo, spokeMat))
  }

  return group
}

function createBikeTube(a: THREE.Vector3, b: THREE.Vector3, mat: THREE.Material, radius = 0.034): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 10), mat)
  orientCylinder(mesh, a, b)
  return mesh
}

function initScene(canvas: HTMLCanvasElement) {
  const host = canvas.parentElement!

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(host.clientWidth, host.clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(36, host.clientWidth / host.clientHeight, 0.1, 100)
  camera.position.set(0, 0.35, 6.8)

  // Cinematic Lighting
  const sunLight = new THREE.DirectionalLight('#fff7ed', 2.8)
  sunLight.position.set(4, 7, 5)
  scene.add(sunLight)

  const skyFill = new THREE.PointLight('#38bdf8', 1.8, 14)
  skyFill.position.set(-4, -1, 3)
  scene.add(skyFill)

  scene.add(new THREE.AmbientLight('#bae6fd', 1.1))

  worldGroup = new THREE.Group()
  scene.add(worldGroup)

  // 1. Build Bicycle
  bikeGroup = new THREE.Group()
  worldGroup.add(bikeGroup)

  const frameMat = new THREE.MeshStandardMaterial({
    color: '#06b6d4',
    metalness: 0.45,
    roughness: 0.25,
  })

  // Wheel positions
  const frontWheelPos = new THREE.Vector3(1.22, -0.4, 0)
  const rearWheelPos = new THREE.Vector3(-1.22, -0.4, 0)
  const bottomBracketPos = new THREE.Vector3(0, -0.4, 0)
  const seatLugPos = new THREE.Vector3(-0.32, 0.45, 0)
  const headTubeBottom = new THREE.Vector3(0.85, 0.42, 0)
  const headTubeTop = new THREE.Vector3(0.85, 0.65, 0)

  // Wheels
  frontWheel = createWheel(0.65)
  frontWheel.position.copy(frontWheelPos)
  bikeGroup.add(frontWheel)

  rearWheel = createWheel(0.65)
  rearWheel.position.copy(rearWheelPos)
  bikeGroup.add(rearWheel)

  // Main frame tubes
  bikeGroup.add(createBikeTube(bottomBracketPos, seatLugPos, frameMat)) // Seat tube
  bikeGroup.add(createBikeTube(bottomBracketPos, headTubeBottom, frameMat)) // Down tube
  bikeGroup.add(createBikeTube(seatLugPos, headTubeTop, frameMat)) // Top tube
  bikeGroup.add(createBikeTube(headTubeBottom, headTubeTop, frameMat, 0.042)) // Head tube

  // Stays (left & right)
  const staySpread = 0.12
  const rearLeft = new THREE.Vector3(-1.22, -0.4, staySpread)
  const rearRight = new THREE.Vector3(-1.22, -0.4, -staySpread)
  bikeGroup.add(createBikeTube(seatLugPos, rearLeft, frameMat, 0.024))
  bikeGroup.add(createBikeTube(seatLugPos, rearRight, frameMat, 0.024))
  bikeGroup.add(createBikeTube(bottomBracketPos, rearLeft, frameMat, 0.024))
  bikeGroup.add(createBikeTube(bottomBracketPos, rearRight, frameMat, 0.024))

  // Front fork
  const frontLeft = new THREE.Vector3(1.22, -0.4, staySpread)
  const frontRight = new THREE.Vector3(1.22, -0.4, -staySpread)
  bikeGroup.add(createBikeTube(headTubeBottom, frontLeft, frameMat, 0.026))
  bikeGroup.add(createBikeTube(headTubeBottom, frontRight, frameMat, 0.026))

  // Saddle (Seat)
  const saddleMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.6 })
  const saddle = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.48, 4), saddleMat)
  saddle.rotation.x = Math.PI / 2
  saddle.rotation.y = -Math.PI / 4
  saddle.scale.set(0.8, 1.2, 0.4)
  saddle.position.set(-0.35, 0.52, 0)
  bikeGroup.add(saddle)

  // Handlebars & Stem
  const chromeMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.85, roughness: 0.15 })
  const stem = createBikeTube(headTubeTop, new THREE.Vector3(0.85, 0.8, 0), chromeMat, 0.026)
  bikeGroup.add(stem)

  const hBar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.82, 10), chromeMat)
  hBar.rotation.x = Math.PI / 2
  hBar.position.set(0.85, 0.8, 0)
  bikeGroup.add(hBar)

  // Grips
  const gripMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.7 })
  const gripL = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.16, 10), gripMat)
  gripL.rotation.x = Math.PI / 2
  gripL.position.set(0.84, 0.8, 0.36)
  const gripR = gripL.clone()
  gripR.position.set(0.84, 0.8, -0.36)
  bikeGroup.add(gripL, gripR)

  // Bicycle Bell
  const bellMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.9, roughness: 0.1 })
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 10), bellMat)
  bell.position.set(0.86, 0.86, 0.32)
  bikeGroup.add(bell)

  // Bell shockwave ripple mesh
  const bellRippleGeo = new THREE.RingGeometry(0.05, 0.08, 24)
  const bellRippleMat = new THREE.MeshBasicMaterial({ color: '#fde047', transparent: true, opacity: 0, side: THREE.DoubleSide })
  bellRippleMesh = new THREE.Mesh(bellRippleGeo, bellRippleMat)
  bellRippleMesh.position.copy(bell.position)
  bellRippleMesh.rotation.x = -Math.PI / 3
  bikeGroup.add(bellRippleMesh)

  // Cranks & Pedals
  crankGroup = new THREE.Group()
  crankGroup.position.copy(bottomBracketPos)
  bikeGroup.add(crankGroup)

  const chainringMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.8, roughness: 0.2 })
  const chainring = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 24), chainringMat)
  chainring.rotation.x = Math.PI / 2
  crankGroup.add(chainring)

  const pedalMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.7 })
  const pedalGeo = new THREE.BoxGeometry(0.14, 0.03, 0.18)

  leftPedal = new THREE.Mesh(pedalGeo, pedalMat)
  rightPedal = new THREE.Mesh(pedalGeo, pedalMat)
  bikeGroup.add(leftPedal, rightPedal)

  // 2. Build 3D Pelican
  pelicanGroup = new THREE.Group()
  pelicanGroup.position.set(-0.35, 0.7, 0)
  worldGroup.add(pelicanGroup)

  const featherMat = new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    roughness: 0.48,
    metalness: 0.04,
  })

  // Chubby aerodynamic Pelican Body
  const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.56, 22, 18), featherMat)
  bodyMesh.scale.set(0.95, 1.05, 1.25)
  bodyMesh.rotation.z = -0.22 // Tilted forward cycling posture!
  pelicanGroup.add(bodyMesh)

  // Tail feathers
  const tailMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.6 })
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 4), tailMat)
  tail.position.set(-0.55, 0.12, 0)
  tail.rotation.z = Math.PI / 2.4
  pelicanGroup.add(tail)

  // Wings (Resting on handlebars)
  const wingGeo = new THREE.BoxGeometry(0.95, 0.14, 0.22)
  const wingL = new THREE.Mesh(wingGeo, featherMat)
  wingL.position.set(0.36, 0.16, 0.35)
  wingL.rotation.set(-0.15, 0.25, -0.22)
  const wingR = new THREE.Mesh(wingGeo, featherMat)
  wingR.position.set(0.36, 0.16, -0.35)
  wingR.rotation.set(0.15, -0.25, -0.22)
  pelicanGroup.add(wingL, wingR)

  // Head and Giant Iconic Pelican Beak
  headGroup = new THREE.Group()
  headGroup.position.set(0.48, 0.62, 0)
  pelicanGroup.add(headGroup)

  // Head sphere
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 18), featherMat)
  headGroup.add(headMesh)

  // Upper Beak
  const beakMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.35, metalness: 0.08 })
  upperBeak = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.09, 0.22), beakMat)
  upperBeak.position.set(0.46, 0.04, 0)
  headGroup.add(upperBeak)

  // Hooked beak tip
  const tipHook = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 8), new THREE.MeshStandardMaterial({ color: '#b45309' }))
  tipHook.position.set(0.88, -0.03, 0)
  tipHook.rotation.z = Math.PI / 1.3
  headGroup.add(tipHook)

  // Giant Throat Sac (Gular Pouch - 喉囊)
  const pouchMat = new THREE.MeshStandardMaterial({
    color: '#fb923c',
    roughness: 0.55,
    metalness: 0.05,
    transparent: true,
    opacity: 0.94,
  })
  pouchMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 16), pouchMat)
  pouchMesh.scale.set(1.15, 1.45, 0.75)
  pouchMesh.position.set(0.36, -0.2, 0)
  headGroup.add(pouchMesh)

  // Eyes (Left & Right)
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: '#ffffff' })
  const pupilMat = new THREE.MeshBasicMaterial({ color: '#0f172a' })

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), eyeWhiteMat)
  eyeL.position.set(0.14, 0.12, 0.18)
  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), pupilMat)
  pupilL.position.set(0.18, 0.12, 0.2)
  headGroup.add(eyeL, pupilL)

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), eyeWhiteMat)
  eyeR.position.set(0.14, 0.12, -0.18)
  const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), pupilMat)
  pupilR.position.set(0.18, 0.12, -0.2)
  headGroup.add(eyeR, pupilR)

  // Cool Aviator Sunglasses (墨镜)
  const shadesGroup = new THREE.Group()
  shadesGroup.position.set(0.2, 0.11, 0)

  const lensMat = new THREE.MeshStandardMaterial({ color: '#090d16', metalness: 0.92, roughness: 0.1 })
  const lensGeo = new THREE.BoxGeometry(0.04, 0.16, 0.18)

  const lensL = new THREE.Mesh(lensGeo, lensMat)
  lensL.position.set(0, 0, 0.18)
  const lensR = new THREE.Mesh(lensGeo, lensMat)
  lensR.position.set(0, 0, -0.18)

  const frameBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.024, 0.26),
    new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.8, roughness: 0.2 })
  )
  frameBridge.position.set(0, 0.05, 0)
  shadesGroup.add(lensL, lensR, frameBridge)
  headGroup.add(shadesGroup)

  // 3. Legs Rig (2-Bone IK Setup)
  const legMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.4 })
  const footMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.5 })

  function createLeg(hipZ: number, offsetAngle: number): LegRig {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 1, 10), legMat)
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 1, 10), legMat)
    const kneeMarker = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), legMat)
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.16), footMat)
    worldGroup!.add(thigh, shin, kneeMarker, foot)

    return {
      thigh,
      shin,
      kneeMarker,
      foot,
      hipPos: new THREE.Vector3(-0.35, 0.35, hipZ),
      crankCenter: new THREE.Vector3(0, -0.4, hipZ),
      crankRadius: 0.24,
      offsetAngle,
    }
  }

  leftLegRig = createLeg(0.24, 0)
  rightLegRig = createLeg(-0.24, Math.PI)

  // 4. Moving Road & Highway
  const roadGroup = new THREE.Group()
  roadGroup.position.y = -1.05
  worldGroup.add(roadGroup)

  const roadMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 3.4),
    new THREE.MeshStandardMaterial({ color: '#131c26', roughness: 0.9 })
  )
  roadMesh.rotation.x = -Math.PI / 2
  roadGroup.add(roadMesh)

  // Dashed lines along highway
  roadMarkings = []
  const dashMat = new THREE.MeshBasicMaterial({ color: '#facc15' })
  for (let i = 0; i < 9; i++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.09), dashMat)
    dash.rotation.x = -Math.PI / 2
    dash.position.set(-8 + i * 2, 0.005, 0)
    roadGroup.add(dash)
    roadMarkings.push(dash)
  }

  // 5. Speed Wind Streaks
  windStreaks = []
  const windMat = new THREE.MeshBasicMaterial({ color: '#a5f3fc', transparent: true, opacity: 0.45 })
  for (let i = 0; i < 32; i++) {
    const len = 0.8 + Math.random() * 1.6
    const streak = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 6), windMat)
    streak.rotation.z = Math.PI / 2
    streak.position.set((Math.random() - 0.5) * 14, -0.5 + Math.random() * 2.6, (Math.random() - 0.5) * 4)
    worldGroup.add(streak)
    windStreaks.push({
      mesh: streak,
      speed: 0.08 + Math.random() * 0.06,
      xSpan: 14,
    })
  }

  // 6. Background Puffy Low-Poly Clouds
  cloudsGroup = new THREE.Group()
  cloudsGroup.position.set(0, 2.2, -4.5)
  worldGroup.add(cloudsGroup)

  const cloudMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.9,
    transparent: true,
    opacity: 0.82,
  })

  function createCloud(cx: number, cy: number, cz: number, s: number) {
    const cGroup = new THREE.Group()
    cGroup.position.set(cx, cy, cz)
    cGroup.scale.setScalar(s)

    const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), cloudMat)
    const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 8), cloudMat)
    p2.position.set(0.4, 0.1, 0)
    const p3 = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), cloudMat)
    p3.position.set(0.8, -0.05, 0)

    cGroup.add(p1, p2, p3)
    return cGroup
  }

  cloudsGroup.add(createCloud(-4.5, 0.4, 0, 1.1))
  cloudsGroup.add(createCloud(1.2, 0.8, -1, 0.85))
  cloudsGroup.add(createCloud(6.0, 0.2, 0.5, 1.3))

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

function updateLeg(leg: LegRig, angle: number) {
  const pedalP = new THREE.Vector3(
    leg.crankCenter.x + Math.sin(angle) * leg.crankRadius,
    leg.crankCenter.y - Math.cos(angle) * leg.crankRadius,
    leg.crankCenter.z
  )

  const knee = solveTwoBoneIK(leg.hipPos, pedalP, 0.42, 0.42)
  orientCylinder(leg.thigh, leg.hipPos, knee)
  orientCylinder(leg.shin, knee, pedalP)
  leg.kneeMarker.position.copy(knee)
  leg.foot.position.copy(pedalP)
  leg.foot.position.x += 0.05
}

function animate(time = 0) {
  if (!renderer || !scene || !camera || !worldGroup) return

  // 1. Rotation & Parallax damping
  if (!isDragging) {
    dragRotation.y += velocityX
    dragRotation.x = THREE.MathUtils.clamp(dragRotation.x + velocityY, -0.65, 0.65)
    velocityX *= 0.92
    velocityY *= 0.92
    if (Math.abs(velocityX) < 0.00001) velocityX = 0
    if (Math.abs(velocityY) < 0.00001) velocityY = 0
  }

  const hoverX = isDragging ? 0 : pointer.y * 0.04
  const hoverY = isDragging ? 0 : pointer.x * 0.05
  targetRotation.x += (dragRotation.x + hoverX - targetRotation.x) * 0.08
  targetRotation.y += (dragRotation.y + hoverY - targetRotation.y) * 0.08

  worldGroup.rotation.x = targetRotation.x
  worldGroup.rotation.y = targetRotation.y

  // 2. Dynamic Pedaling Cadence
  currentPedalSpeed += (targetPedalSpeed - currentPedalSpeed) * 0.08
  pedalAngle += currentPedalSpeed * 0.024

  // Crank rotation
  if (crankGroup) {
    crankGroup.rotation.z = -pedalAngle
  }

  // Wheels spin in sync
  if (frontWheel && rearWheel) {
    frontWheel.rotation.z = -pedalAngle * 1.5
    rearWheel.rotation.z = -pedalAngle * 1.5
  }

  // Update Left & Right Pedals
  if (leftPedal && rightPedal && leftLegRig && rightLegRig) {
    const leftAngle = pedalAngle + leftLegRig.offsetAngle
    const rightAngle = pedalAngle + rightLegRig.offsetAngle

    leftPedal.position.set(
      leftLegRig.crankCenter.x + Math.sin(leftAngle) * leftLegRig.crankRadius,
      leftLegRig.crankCenter.y - Math.cos(leftAngle) * leftLegRig.crankRadius,
      leftLegRig.crankCenter.z
    )

    rightPedal.position.set(
      rightLegRig.crankCenter.x + Math.sin(rightAngle) * rightLegRig.crankRadius,
      rightLegRig.crankCenter.y - Math.cos(rightAngle) * rightLegRig.crankRadius,
      rightLegRig.crankCenter.z
    )

    updateLeg(leftLegRig, leftAngle)
    updateLeg(rightLegRig, rightAngle)
  }

  // 3. Pelican Body Kinetics & Jiggle Physics
  if (pelicanGroup && headGroup && pouchMesh) {
    // Body bobs up & down with pedaling cadence
    pelicanGroup.position.y = 0.7 + Math.sin(pedalAngle * 2) * 0.032
    pelicanGroup.rotation.z = Math.sin(pedalAngle) * 0.025

    // In turbo mode, pelican tucks forward aggressively!
    const targetBodyLean = isTurbo.value ? -0.42 : -0.22
    pelicanGroup.children[0].rotation.z += (targetBodyLean - pelicanGroup.children[0].rotation.z) * 0.1

    // Head bobs with determination
    headGroup.rotation.z = Math.sin(pedalAngle) * 0.05

    // Throat pouch jiggles with secondary inertia!
    const jiggle = Math.sin(time * 0.012) * 0.06
    pouchMesh.scale.y = 1.45 + jiggle
    pouchMesh.scale.x = 1.15 - jiggle * 0.5
  }

  // 4. Road Moving Strip
  const moveSpeed = currentPedalSpeed * 0.038
  roadMarkings.forEach((dash) => {
    dash.position.x -= moveSpeed
    if (dash.position.x < -9) dash.position.x += 18
  })

  // 5. Wind Streaks Flying Past
  windStreaks.forEach((streak) => {
    streak.mesh.position.x -= moveSpeed * (isTurbo.value ? 2.8 : 1.6)
    if (streak.mesh.position.x < -8) {
      streak.mesh.position.x = 8
      streak.mesh.position.y = -0.5 + Math.random() * 2.6
    }
  })

  // 6. Clouds slow drift
  if (cloudsGroup) {
    cloudsGroup.position.x -= 0.003
    if (cloudsGroup.position.x < -5) cloudsGroup.position.x = 5
  }

  renderer.render(scene, camera)
  frameId = requestAnimationFrame(animate)
}

function handleCanvasPointerMove(event: PointerEvent) {
  if (!canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return

  pointer.x = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1)
  pointer.y = THREE.MathUtils.clamp(-((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1)

  if (isDragging) {
    const deltaX = event.clientX - dragStartX
    const deltaY = event.clientY - dragStartY

    velocityX = THREE.MathUtils.clamp((event.clientX - lastDragX) * 0.004, -0.05, 0.05)
    velocityY = THREE.MathUtils.clamp((event.clientY - lastDragY) * 0.003, -0.04, 0.04)

    lastDragX = event.clientX
    lastDragY = event.clientY

    dragRotation.y = dragStartRotationY + deltaX * 0.008
    dragRotation.x = THREE.MathUtils.clamp(dragStartRotationX + deltaY * 0.006, -0.65, 0.65)
  }
}

function handleCanvasPointerLeave() {
  if (!isDragging) {
    gsap.to(pointer, { x: 0, y: 0, duration: 0.6, ease: 'power2.out' })
  }
}

function handleDragStart(event: PointerEvent) {
  isDragging = true
  dragStartX = event.clientX
  dragStartY = event.clientY
  lastDragX = event.clientX
  lastDragY = event.clientY
  velocityX = 0
  velocityY = 0
  dragStartRotationX = dragRotation.x
  dragStartRotationY = dragRotation.y
  canvasRef.value?.setPointerCapture(event.pointerId)
}

function handleDragEnd(event?: PointerEvent) {
  if (!isDragging) return
  isDragging = false
  if (event && canvasRef.value?.hasPointerCapture(event.pointerId)) {
    canvasRef.value.releasePointerCapture(event.pointerId)
  }
}

function toggleTurbo() {
  isTurbo.value = !isTurbo.value
  targetPedalSpeed = isTurbo.value ? 8.2 : 3.5
}

function ringBell() {
  showHonk.value = true
  if (upperBeak) {
    gsap.fromTo(upperBeak.rotation, { z: 0 }, { z: 0.18, yoyo: true, repeat: 1, duration: 0.15 })
  }
  if (bellRippleMesh) {
    gsap.fromTo(
      bellRippleMesh.scale,
      { x: 0.2, y: 0.2 },
      { x: 3.2, y: 3.2, duration: 0.6, ease: 'power2.out' }
    )
    gsap.fromTo(
      bellRippleMesh.material,
      { opacity: 0.9 },
      { opacity: 0, duration: 0.6, ease: 'power2.out' }
    )
  }
  setTimeout(() => {
    showHonk.value = false
  }, 1600)
}

function cycleView() {
  currentViewIndex.value = (currentViewIndex.value + 1) % viewPresets.length
  const target = viewPresets[currentViewIndex.value]

  gsap.to(dragRotation, {
    x: target.x,
    y: target.y,
    duration: 0.85,
    ease: 'power3.out',
  })
  if (camera) {
    gsap.to(camera.position, {
      z: target.camZ,
      duration: 0.85,
      ease: 'power3.out',
    })
  }
  velocityX = 0
  velocityY = 0
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
    "statement"
    "mark"
    "copy"
    "stage";
  grid-template-columns: 100%;
  gap: clamp(1.75rem, 3.5vw, 2.75rem);
  align-items: stretch;
  min-height: auto;
  padding: clamp(4.8rem, 7vw, 6.5rem) 1.5rem 4rem;
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
  max-width: 820px;
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
  height: clamp(420px, 44vw, 580px);
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border-radius: 20px;
  background:
    radial-gradient(circle at 50% 46%, color-mix(in srgb, var(--c-brand-primary) 12%, transparent) 0%, transparent 60%),
    radial-gradient(circle at 80% 85%, color-mix(in srgb, var(--c-brand-secondary) 14%, transparent) 0%, transparent 50%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%),
    var(--c-hero-stage-bg);
  border: 1px solid color-mix(in srgb, var(--c-brand-primary) 24%, rgba(255, 255, 255, 0.12));
  box-shadow:
    0 24px 64px -12px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  transform: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.hero-stage:hover {
  border-color: color-mix(in srgb, var(--c-brand-primary) 40%, rgba(255, 255, 255, 0.18));
  box-shadow:
    0 28px 72px -12px color-mix(in srgb, var(--c-brand-primary) 18%, rgba(0, 0, 0, 0.42)),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.hero-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.7) 0%, transparent 80%);
  pointer-events: none;
  z-index: 1;
}

.stage-hud-top {
  position: absolute;
  top: 1.1rem;
  left: 1.2rem;
  right: 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  z-index: 5;
  pointer-events: none;
}

.hud-status {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.38rem 0.85rem;
  border-radius: 999px;
  background: rgba(12, 18, 28, 0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  flex-shrink: 0;
}

.status-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 10px #10b981;
  animation: hudPulse 2s ease-in-out infinite;
}

@keyframes hudPulse {
  0%, 100% { transform: scale(0.9); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
}

.status-text {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  color: rgba(240, 245, 250, 0.88);
  letter-spacing: 0.08em;
}

.status-pulse.turbo {
  background: #f59e0b;
  box-shadow: 0 0 14px #f59e0b, 0 0 28px #ef4444;
  animation: turboPulse 0.45s ease-in-out infinite;
}

@keyframes turboPulse {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.6); opacity: 1; }
}

.hud-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  flex-wrap: nowrap;
}

.hud-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.78rem;
  border-radius: 999px;
  background: rgba(12, 18, 28, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(240, 245, 250, 0.88);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  pointer-events: auto;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hud-btn:hover {
  background: rgba(6, 182, 212, 0.18);
  border-color: rgba(6, 182, 212, 0.5);
  color: #38bdf8;
  transform: translateY(-1px);
}

.hud-btn:active {
  transform: translateY(0);
}

.hud-btn.active {
  background: rgba(245, 158, 11, 0.25);
  border-color: #f59e0b;
  color: #fde047;
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.4);
}

.stage-honk {
  position: absolute;
  top: 4.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.92);
  color: #0f172a;
  font-family: var(--font-mono);
  font-size: 0.92rem;
  font-weight: 800;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.5);
  pointer-events: none;
  z-index: 6;
  white-space: nowrap;
}

.honk-pop-enter-active,
.honk-pop-leave-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.honk-pop-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(12px) scale(0.6);
}

.honk-pop-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-16px) scale(0.8);
}

.scene-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
  z-index: 2;
}

.scene-canvas:active {
  cursor: grabbing;
}

.stage-caption {
  position: absolute;
  left: 1.2rem;
  right: 1.2rem;
  bottom: 1.1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  color: rgba(232, 244, 253, 0.7);
  font-size: 0.76rem;
  pointer-events: none;
  z-index: 5;
}

.caption-kicker {
  color: var(--c-brand-primary);
  font-family: var(--font-mono);
  font-weight: 600;
  letter-spacing: 0.05em;
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
    height: 380px;
    max-width: calc(100vw - 2rem);
  }

  .stage-hud-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    left: 0.8rem;
    right: 0.8rem;
    top: 0.8rem;
  }

  .hud-actions {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .hud-actions::-webkit-scrollbar {
    display: none;
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
