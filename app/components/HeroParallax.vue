<script setup lang="ts">
import * as THREE from 'three'
import { fragmentShader, vertexShader } from '~/shaders/heroParallax'

const props = defineProps({
  image: { type: String, required: true },
  depthMap: { type: String, required: true },
  // Siła przesunięcia w UV. 0.02-0.06 to bezpieczny zakres.
  strength: { type: Number, default: 0.015 },
  // Damping lerpa. Niżej = cięższy, bardziej "kinowy" ruch.
  damping: { type: Number, default: 0.055 },
  // Ambientowy drift, żeby scena żyła gdy mysz stoi. 0 = wyłączony.
  drift: { type: Number, default: 0.15 },
})

const container = ref<HTMLDivElement | null>(null);
const isReady = ref(false);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.OrthographicCamera | null = null;
let mesh: THREE.Mesh | null = null;
let material: THREE.ShaderMaterial | null = null;
let geometry: THREE.PlaneGeometry | null = null;
let textures: THREE.Texture[] = [];
let rafId = 0;
let resizeObserver: ResizeObserver | null = null;
let flipStart: number = 0;

const FLIP_DURATION: number = 1600;
const pointerTarget = new THREE.Vector2(0, 0)
const pointerCurrent = new THREE.Vector2(0, 0)

function loadTexture(url: string) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (tex) => {
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

function updateCoverScale() {
  if (!container.value || !material) return

  const texture = material.uniforms.uTexture?.value
  if (!texture || !texture.image) return

  const boxRatio = container.value.clientWidth / container.value.clientHeight
  const imageRatio = texture.image.width / texture.image.height
  const scale = material.uniforms.uCoverScale?.value

  if (boxRatio > imageRatio) {
    scale.set(1, imageRatio / boxRatio)
  }
  else {
    scale.set(boxRatio / imageRatio, 1)
  }

   scale.multiplyScalar(0.82)
}

function resize() {
  if (!container.value || !renderer) return
  const { clientWidth: w, clientHeight: h } = container.value
  if (!w || !h) return

  renderer.setSize(w, h, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  updateCoverScale()
}

function onPointerMove(event: MouseEvent) {
  if (!container.value) return
  const rect = container.value.getBoundingClientRect()

  pointerTarget.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -(((event.clientY - rect.top) / rect.height) * 2 - 1),
  )
}

function onPointerLeave() {
  pointerTarget.set(0, 0)
}

onMounted(async () => {
  if (!container.value) return

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const [texture, depth] = await Promise.all([
    loadTexture(props.image),
    loadTexture(props.depthMap),
  ])
  textures = [texture, depth]

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  geometry = new THREE.PlaneGeometry(2.4, 2.4)

  material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
      uTexture: { value: texture },
      uDepth: { value: depth },
      uFlip: { value: 0 },
      uPerspective: { value: 0.7 },
      uApproach: { value: 1.8 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uCoverScale: { value: new THREE.Vector2(1, 1) },
      uStrength: { value: reducedMotion ? 0 : props.strength },
      uTime: { value: 0 },
      uDrift: { value: reducedMotion ? 0 : props.drift },
    },
  })

  mesh = new THREE.Mesh(geometry, material)
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
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave, { passive: true })
  }

  const clock = new THREE.Clock()

  const loop = () => {
    const elapsed = clock.getElapsedTime()

    if(flipStart === 0) flipStart = performance.now();

    const t = Math.min((performance.now() - flipStart) / FLIP_DURATION, 1);
    const eased = 1 - Math.pow(1 - Math.pow(t, 2.2), 2.2)
    const flip = 0.02 + 0.98 * eased;

    pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * props.damping
    pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * props.damping

    if (material) {
      const pointerUniform = material.uniforms.uPointer?.value;
      pointerUniform.copy(pointerCurrent);
      material.uniforms.uFlip.value = flip
      material.uniforms.uStrength.value = props.strength * flip
      material.uniforms.uTime.value = elapsed;
    }

    if (renderer && scene && camera) renderer.render(scene, camera)
    rafId = requestAnimationFrame(loop)
  }

  loop()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerleave', onPointerLeave)
  if (resizeObserver) resizeObserver.disconnect()

  textures.forEach(t => t.dispose())
  if (geometry) geometry.dispose()
  if (material) material.dispose()
  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
  }
})
</script>

<template>
  <div class="hero">
    <div ref="container" class="hero__canvas" :class="{ 'is-ready': isReady }" />

  </div>
</template>

<style scoped>
.hero {
  position: relative;
  width: 100%;
  height: 100svh;
  overflow: hidden;
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