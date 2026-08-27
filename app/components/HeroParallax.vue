<script setup lang="ts">
import { gsap } from 'gsap'
import * as THREE from 'three'
import { fragmentShader, vertexShader } from '~/shaders/heroParallax'

interface HeroParallaxProps {
  image: string
  depthMap: string
  strength?: number
  damping?: number
  drift?: number
  active?: boolean
}

interface HeroUniforms extends Record<string, THREE.IUniform> {
  uTexture: THREE.IUniform<THREE.Texture>
  uDepth: THREE.IUniform<THREE.Texture>
  uFlip: THREE.IUniform<number>
  uPerspective: THREE.IUniform<number>
  uApproach: THREE.IUniform<number>
  uScale: THREE.IUniform<number>
  uPointer: THREE.IUniform<THREE.Vector2>
  uCoverScale: THREE.IUniform<THREE.Vector2>
  uStrength: THREE.IUniform<number>
  uTime: THREE.IUniform<number>
  uDrift: THREE.IUniform<number>
}

const props = withDefaults(defineProps<HeroParallaxProps>(), {
  strength: 0.015,
  damping: 0.055,
  drift: 0.15,
  active: true,
})

const emit = defineEmits<{
  revealed: []
}>()

const { isVideoVisible } = useBoot()

const container = ref<HTMLDivElement | null>(null)
const isReady = ref<boolean>(false)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let material: THREE.ShaderMaterial | null = null
let geometry: THREE.PlaneGeometry | null = null
let uniforms: HeroUniforms | null = null
let textures: THREE.Texture[] = []
let rafId = 0
let resizeObserver: ResizeObserver | null = null
let entranceTimeline: gsap.core.Timeline | null = null
let pointerXTo: gsap.QuickToFunc | null = null
let pointerYTo: gsap.QuickToFunc | null = null
let reducedMotion = false
let hasRevealed = false

const FLIP_DURATION = 1.6

function emitRevealed(): void {
  if (hasRevealed) return
  hasRevealed = true
  emit('revealed')
}

function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise<THREE.Texture>((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (tex: THREE.Texture) => {
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        tex.generateMipmaps = false
        tex.wrapS = THREE.ClampToEdgeWrapping
        tex.wrapT = THREE.ClampToEdgeWrapping
        resolve(tex)
      },
      undefined,
      reject,
    )
  })
}

function updateCoverScale(): void {
  if (!container.value || !uniforms) return

  const texture = uniforms.uTexture.value
  const image = texture.image as { width?: number, height?: number } | undefined
  if (!image?.width || !image.height) return

  const boxRatio = container.value.clientWidth / container.value.clientHeight
  const imageRatio = image.width / image.height
  const scale = uniforms.uCoverScale.value

  if (boxRatio > imageRatio) {
    scale.set(1, imageRatio / boxRatio)
  }
  else {
    scale.set(boxRatio / imageRatio, 1)
  }

  scale.multiplyScalar(0.82)
}

function resize(): void {
  if (!container.value || !renderer) return
  const { clientWidth: w, clientHeight: h } = container.value
  if (!w || !h) return

  renderer.setSize(w, h, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  updateCoverScale()
}

function onPointerMove(event: PointerEvent): void {
  if (!container.value) return
  const rect = container.value.getBoundingClientRect()

  pointerXTo?.(((event.clientX - rect.left) / rect.width) * 2 - 1)
  pointerYTo?.(-(((event.clientY - rect.top) / rect.height) * 2 - 1))
}

function onPointerLeave(): void {
  pointerXTo?.(0)
  pointerYTo?.(0)
}

onMounted(async () => {
  if (!container.value) return

  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const [texture, depth]: [THREE.Texture, THREE.Texture] = await Promise.all([
    loadTexture(props.image),
    loadTexture(props.depthMap),
  ])

  textures = [texture, depth]

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  geometry = new THREE.PlaneGeometry(2.4, 2.4)

  uniforms = {
    uTexture: { value: texture },
    uDepth: { value: depth },
    uFlip: { value: reducedMotion ? 1 : 0.02 },
    uPerspective: { value: 0.7 },
    uApproach: { value: 1.8 },
    uScale: { value: reducedMotion ? 1 : 0.55 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uCoverScale: { value: new THREE.Vector2(1, 1) },
    uStrength: { value: 0 },
    uTime: { value: 0 },
    uDrift: { value: reducedMotion ? 0 : props.drift },
  }

  material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    uniforms,
  })

  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  texture.colorSpace = THREE.SRGBColorSpace
  container.value.appendChild(renderer.domElement)

  resize()
  isReady.value = true

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container.value)

  if (!reducedMotion) {
    const pointerDuration = Math.max(props.damping * 10, 0.1)
    pointerXTo = gsap.quickTo(uniforms.uPointer.value, 'x', {
      duration: pointerDuration,
      ease: 'power2.out',
    })
    pointerYTo = gsap.quickTo(uniforms.uPointer.value, 'y', {
      duration: pointerDuration,
      ease: 'power2.out',
    })

    entranceTimeline = gsap.timeline({ paused: true, onComplete: emitRevealed })
      .to(uniforms.uFlip, {
        value: 1,
        duration: FLIP_DURATION,
        ease: 'power2.inOut',
      }, 0)
      .to(uniforms.uScale, {
        value: 1,
        duration: FLIP_DURATION,
        ease: 'power2.inOut',
      }, 0)
      .to(uniforms.uStrength, {
        value: props.strength,
        duration: FLIP_DURATION,
        ease: 'power2.inOut',
      }, 0)

    if (props.active) entranceTimeline.play()

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave, { passive: true })
  }
  else if (props.active) {
    emitRevealed()
  }

  const clock = new THREE.Timer()

  const loop = (): void => {
    if (props.active && uniforms) uniforms.uTime.value = clock.getElapsed()

    if (renderer && scene && camera) renderer.render(scene, camera)
    rafId = requestAnimationFrame(loop)
  }

  loop()
})

watch(() => props.active, (isActive: boolean) => {
  if (isActive && reducedMotion && isReady.value) emitRevealed()
  else if (isActive) entranceTimeline?.play()
  else entranceTimeline?.pause()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  entranceTimeline?.kill()
  pointerXTo?.tween.kill()
  pointerYTo?.tween.kill()
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerleave', onPointerLeave)
  if (resizeObserver) resizeObserver.disconnect()

  textures.forEach((texture: THREE.Texture) => texture.dispose())
  geometry?.dispose()
  material?.dispose()
  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
  }
})
</script>

<template>
  <div class="hero" :class="{ 'is-transparent': !isVideoVisible }">
    <div ref="container" class="hero__canvas" :class="{ 'is-ready': isReady }" />
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  width: 100%;
  height: 100svh;
  overflow: hidden;
  background: transparent;
  transition: background 600ms ease; 
}

.hero.is-transparent {
  background: #05060a;
}

.hero__canvas {
  position: absolute;
  inset: 0;
  opacity: 0;
}

.hero__canvas.is-ready {
  opacity: 1;
}

.hero__canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
