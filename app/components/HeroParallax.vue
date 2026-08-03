<template>
    <div class="hero">
        <div ref="container" class="hero__canvas" :class="{ 'is-ready': isReady }"></div>

        <div class="hero__content">
            <slot />
        </div>
    </div>
</template>

<script lang="ts" setup>
import * as THREE from "three";

const props = withDefaults(defineProps<{
    image: string
    depthMap: string
    strength?: number
    damping?: number
    drift?: number
}>(), {
    strength: 0.035,
    damping: 0.055,
    drift: 0.15,
});

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

const pointerTarget = new THREE.Vector2(0, 0);
const pointerCurrent = new THREE.Vector2(0, 0);

// const vertexShader = /* glsl */ `
//     varying vec2 vUv;
//     void main() {
//         vUv = uv;
//         gl_Position = vec4(position, 1.0);
//     }
// `
// const fragmentShader = /* glsl */ `
//   precision highp float;
 
//   uniform sampler2D uTexture;
//   uniform sampler2D uDepth;
//   uniform vec2 uPointer;
//   uniform vec2 uCoverScale;
//   uniform float uStrength;
//   uniform float uTime;
//   uniform float uDrift;
 
//   varying vec2 vUv;
 
//   const int STEPS = 16;
 
//   // Parallax occlusion mapping: idziemy warstwami w głąb aż trafimy
//   // na powierzchnię opisaną depth mapą. Daje ostre krawędzie zamiast
//   // rozmytego przesunięcia całej tekstury.
//   vec2 parallax(vec2 uv, vec2 dir) {
//     float layerDepth = 1.0 / float(STEPS);
//     vec2 deltaUv = dir / float(STEPS);
 
//     float currentLayer = 0.0;
//     vec2 currentUv = uv;
//     float sampled = 1.0 - texture2D(uDepth, currentUv).r;
 
//     for (int i = 0; i < STEPS; i++) {
//       if (currentLayer >= sampled) break;
//       currentUv += deltaUv;
//       sampled = 1.0 - texture2D(uDepth, currentUv).r;
//       currentLayer += layerDepth;
//     }
 
//     // interpolacja między ostatnimi dwoma krokami — kasuje schodkowanie
//     vec2 prevUv = currentUv - deltaUv;
//     float after = sampled - currentLayer;
//     float before = (1.0 - texture2D(uDepth, prevUv).r) - currentLayer + layerDepth;
//     float weight = after / (after - before);
 
//     return mix(currentUv, prevUv, weight);
//   }
 
//   void main() {
//     // cover: skalujemy UV wokół środka, żeby obrazek nie był rozciągnięty
//     vec2 uv = (vUv - 0.5) * uCoverScale + 0.5;
 
//     vec2 drift = vec2(
//       sin(uTime * 0.32) * 0.5,
//       cos(uTime * 0.21) * 0.5
//     ) * uDrift;
 
//     vec2 dir = (uPointer + drift) * uStrength;
//     vec2 shifted = parallax(uv, dir);
 
//     // poza zakresem tekstury robią się smugi — przycinamy do krawędzi
//     shifted = clamp(shifted, vec2(0.001), vec2(0.999));
 
//     gl_FragColor = texture2D(uTexture, shifted);
//   }
// `;

const vertexShader = 'x';
const fragmentShader = 'x';

function loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
        new THREE.TextureLoader().load(
            url,
            (tex) => {
                tex.minFilter = THREE.LinearFilter
                tex.magFilter = THREE.LinearFilter
                tex.generateMipmaps = false
                tex.wrapS = THREE.ClampToEdgeWrapping
                tex.wrapT = THREE.ClampToEdgeWrapping
                resolve(tex);
            },
            undefined,
            reject,
        )
    });
}

function updateCoverScale() {
    if (!container.value || !material) return;

    const texture = material.uniforms.uTexture?.value as THREE.Texture;
    if(!texture?.image) return;

    const boxRatio = container.value.clientWidth / container.value.clientHeight;
    const imageRatio = texture.image.width / texture.image.height;
    const scale = material.uniforms.uCoverScale?.value as THREE.Vector2;

    if (boxRatio > imageRatio) {
        scale.set(1, boxRatio / imageRatio);
    } else {
        scale.set(imageRatio/ boxRatio, 1);
    }
}

function resize() {
    if(!container.value || !renderer) return;
    const { clientWidth: w, clientHeight: h } = container.value;
    if(!w || !h) return;

    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    updateCoverScale();
}

function onPointerMove(event: PointerEvent) {
    if (!container.value) return;
    const rect = container.value.getBoundingClientRect();

    pointerTarget.set(
        ((event.clientX - rect.left) / rect.width) * 2 -1,
        -(((event.clientY - rect.top) / rect.height) * 2 -1),
    )
}

function onPointerLeave() {
    pointerTarget.set(0,0);
}

onMounted(async () => {
    if(!container.value) return;

    const reduceMotion = window.matchMedia('(prefers-reduce-motion: reduce)').matches;

    const [texture, depth] = await Promise.all([
        loadTexture(props.image),
        loadTexture(props.depthMap),
    ])
    textures = [texture, depth];

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    geometry = new THREE.PlaneGeometry(2, 2);

    material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uTexture: { value: texture },
            uDepth: { value: depth },
            uPointer: { value: new THREE.Vector2(0, 0) },
            uCoverScale: { value: new THREE.Vector2(1, 1) },
            uStrength: { value: reduceMotion ? 0 : props.strength },
            uTime: { value: 0 },
            uDrif: { value: reduceMotion ? 0 : props.drift },
        },
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    texture.colorSpace = THREE.SRGBColorSpace;
    container.value.appendChild(renderer.domElement);

    resize();
    isReady.value = true;

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container.value);

    if(!reduceMotion) {
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerleave', onPointerLeave, { passive: true });
    }

    const clock = new THREE.Clock();

    const loop = () => {
        const elapsed = clock.getElapsedTime();

        pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * props.damping;
        pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * props.damping;

        if(material) {
            ;(material.uniforms.uPointer?.value as THREE.Vector2).copy(pointerCurrent);
            material.uniforms.uTime?.value = elapsed;
        }

        if(renderer && scene && camera) renderer.render(scene, camera);
        rafId = requestAnimationFrame(loop);
    }

    loop();
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerleave', onPointerLeave)
  resizeObserver?.disconnect()
 
  textures.forEach(t => t.dispose())
  geometry?.dispose()
  material?.dispose()
  renderer?.dispose()
  renderer?.domElement.remove()
})
</script>
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
  transition: opacity 900ms ease;
}
 
.hero__canvas.is-ready {
  opacity: 1;
}
 
.hero__canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
 
/* Ramka jako osobna warstwa — nie border na obrazku, bo jechałaby razem z nim */
.hero__frame {
  position: absolute;
  inset: clamp(12px, 2vw, 32px);
  border: 1px solid rgb(255 255 255 / 0.18);
  pointer-events: none;
  z-index: 2;
}
 
.hero__vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 45%,
    rgb(5 6 10 / 0.75) 100%
  );
  pointer-events: none;
  z-index: 1;
}
 
.hero__content {
  position: relative;
  z-index: 3;
  display: grid;
  place-items: center;
  height: 100%;
  /* kontener przezroczysty dla myszy, ale dzieci klikalne */
  pointer-events: none;
}
 
.hero__content :deep(a),
.hero__content :deep(button) {
  pointer-events: auto;
}
</style>