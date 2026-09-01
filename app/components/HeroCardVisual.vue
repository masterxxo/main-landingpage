<script setup lang="ts">
import { gsap } from 'gsap'
import * as THREE from 'three'
import { fragmentShader, vertexShader } from '~/shaders/heroCard'
import { REDUCED_MOTION_QUERY } from '~/constants/media'

interface HeroCardVisualProps {
  image: string
  active?: boolean
  fixedSize?: boolean
  skipIntro?: boolean
  reveal?: number
  secondImage?: string
  showSecond?: boolean
  secondZoom?: number
  secondFocusY?: number
}

interface HeroUniforms extends Record<string, THREE.IUniform> {
  uTexture: THREE.IUniform<THREE.Texture>
  uFlip: THREE.IUniform<number>
  uPerspective: THREE.IUniform<number>
  uApproach: THREE.IUniform<number>
  uScale: THREE.IUniform<number>
  uCoverScale: THREE.IUniform<THREE.Vector2>
  uCoverOffset: THREE.IUniform<THREE.Vector2>
}

const props = withDefaults(defineProps<HeroCardVisualProps>(), {
  active: true,
  fixedSize: false,
  secondZoom: 1,
  secondFocusY: 0,
})

const COVER_ZOOM = 0.82

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
let secondTexture: THREE.Texture | null = null
let rafId = 0
let resizeObserver: ResizeObserver | null = null
let coverObserver: ResizeObserver | null = null
let entranceTimeline: gsap.core.Timeline | null = null
let reducedMotion = false
let noIntro = false
let externalReveal = false
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

  const showingSecond = secondTexture !== null && texture === secondTexture
  scale.multiplyScalar(showingSecond ? props.secondZoom : COVER_ZOOM)
  uniforms.uCoverOffset.value.set(0, showingSecond ? props.secondFocusY : 0)

  if (showingSecond && props.fixedSize && renderer) {
    const bufW = renderer.domElement.width
    const bufH = renderer.domElement.height
    const cw = container.value.clientWidth
    const ch = container.value.clientHeight
    if (bufW > 0 && bufH > 0 && cw > 0 && ch > 0) {
      const bufAspect = bufW / bufH
      scale.x *= Math.max(1, (ch * bufAspect) / cw)
      scale.y *= Math.max(1, cw / bufAspect / ch)
    }
  }
}

function resize(): void {
  if (!container.value || !renderer) return
  const { clientWidth: w, clientHeight: h } = container.value
  if (!w || !h) return

  renderer.setSize(w, h, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  updateCoverScale()
}

onMounted(async () => {
  if (!container.value) return

  reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches
  noIntro = reducedMotion || props.skipIntro === true
  externalReveal = props.reveal !== undefined

  const startFlat = noIntro && !externalReveal

  const texture = await loadTexture(props.image)
  textures = [texture]

  if (props.secondImage) {
    secondTexture = await loadTexture(props.secondImage)
    secondTexture.colorSpace = THREE.SRGBColorSpace
    textures.push(secondTexture)
  }

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  geometry = new THREE.PlaneGeometry(2.4, 2.4)

  uniforms = {
    uTexture: { value: texture },
    uFlip: { value: startFlat ? 1 : 0.02 },
    uPerspective: { value: 0.7 },
    uApproach: { value: 1.8 },
    uScale: { value: startFlat ? 1 : 0.55 },
    uCoverScale: { value: new THREE.Vector2(1, 1) },
    uCoverOffset: { value: new THREE.Vector2(0, 0) },
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

  if (props.fixedSize) {
    window.addEventListener('resize', resize, { passive: true })
    let lastCoverW = 0
    coverObserver = new ResizeObserver((entries) => {
      if (!uniforms || !secondTexture || uniforms.uTexture.value !== secondTexture) return
      const coverWidth = Math.round(entries[0]?.contentRect.width ?? 0)
      if (!coverWidth || coverWidth === lastCoverW) return
      lastCoverW = coverWidth
      updateCoverScale()
    })
    coverObserver.observe(container.value)
  }
  else {
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container.value)
  }

  if (props.showSecond && secondTexture) {
    uniforms.uTexture.value = secondTexture
    updateCoverScale()
  }

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

  if (externalReveal) {
    entranceTimeline.progress(gsap.utils.clamp(0, 1, props.reveal as number))
    if ((props.reveal as number) >= 1) emitRevealed()
  }
  else if (noIntro) {
    entranceTimeline.progress(1)
    if (props.active) emitRevealed()
  }
  else {
    if (props.active) entranceTimeline.play()
  }

  const loop = (): void => {
    if (renderer && scene && camera) renderer.render(scene, camera)
    rafId = requestAnimationFrame(loop)
  }

  loop()
})

watch(() => props.active, (isActive: boolean) => {
  if (externalReveal) return
  if (isActive && noIntro && isReady.value) emitRevealed()
  else if (isActive) entranceTimeline?.play()
  else entranceTimeline?.pause()
})

watch(() => props.reveal, (value) => {
  if (value == null || !entranceTimeline) return
  entranceTimeline.progress(gsap.utils.clamp(0, 1, value))
  if (value >= 1) emitRevealed()
})

watch(() => props.showSecond, (show) => {
  if (!uniforms) return
  const next = show ? secondTexture : textures[0]
  if (!next || uniforms.uTexture.value === next) return
  uniforms.uTexture.value = next
  updateCoverScale()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  entranceTimeline?.kill()
  window.removeEventListener('resize', resize)
  if (resizeObserver) resizeObserver.disconnect()
  if (coverObserver) coverObserver.disconnect()

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
    <div
      ref="container"
      class="hero__canvas"
      :class="{
        'is-ready': isReady,
        'is-fixed-size': fixedSize,
      }"
    />
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

.hero__canvas.is-fixed-size :deep(canvas) {
  position: absolute;
  top: 50%;
  left: 50%;
  width: auto;
  height: 100%;
  min-width: 100%;
  min-height: 100%;
  transform: translate(-50%, -50%);
}
</style>
