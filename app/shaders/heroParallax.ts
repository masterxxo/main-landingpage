// Shadery trzymamy poza .vue — znaki `<` i nawiasy klamrowe w GLSL
// potrafią rozjechać narzędzia skanujące bloki <script> w SFC.

export const vertexShader = /* glsl */ `
uniform float uFlip;
  uniform float uPerspective;
  uniform float uApproach;
  uniform float uScale;

  varying vec2 vUv;
  varying float vShade;

  void main() {
    vUv = uv;

    float c = uFlip;
    float s = sqrt(max(1.0 - c * c, 0.0));

    // uScale kurczy CAŁĄ kartę - obie osie - więc rogi są widoczne
    vec2 p = position.xy * uScale;

    float x = p.x * c;
    float z = p.x * s;

    vShade = mix(0.25, 1.0, c);

    float approach = (1.0 - uFlip) * uApproach;

    float w = 1.0 + (z + approach) * uPerspective;
    gl_Position = vec4(x, p.y, 0.0, w);
  }
`

export const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform sampler2D uDepth;
  uniform vec2 uPointer;
  uniform vec2 uCoverScale;
  uniform vec2 uCoverOffset;
  uniform float uStrength;
  uniform float uTime;
  uniform float uDrift;

  varying vec2 vUv;
  varying float vShade;

  const int STEPS = 16;

  // Parallax occlusion mapping: idziemy warstwami w głąb aż trafimy
  // na powierzchnię opisaną depth mapą. Daje ostre krawędzie zamiast
  // rozmytego przesunięcia całej tekstury.
  vec2 parallax(vec2 uv, vec2 dir) {
    float layerDepth = 1.0 / float(STEPS);
    vec2 deltaUv = dir / float(STEPS);

    float currentLayer = 0.0;
    vec2 currentUv = uv;
    float sampled = 1.0 - texture2D(uDepth, currentUv).r;

    for (int i = 0; i < STEPS; i++) {
      if (currentLayer >= sampled) break;
      currentUv += deltaUv;
      sampled = 1.0 - texture2D(uDepth, currentUv).r;
      currentLayer += layerDepth;
    }

    // interpolacja między ostatnimi dwoma krokami — kasuje schodkowanie
    vec2 prevUv = currentUv - deltaUv;
    float after = sampled - currentLayer;
    float before = (1.0 - texture2D(uDepth, prevUv).r) - currentLayer + layerDepth;
    float weight = after / (after - before);

    return mix(currentUv, prevUv, weight);
  }

  void main() {
    // cover: skalujemy UV wokół środka, żeby obrazek nie był rozciągnięty;
    // uCoverOffset przesuwa kadr (np. pionowe ognisko twarzy dla secondImage)
    vec2 uv = (vUv - 0.5) * uCoverScale + 0.5 + uCoverOffset;

    vec2 drift = vec2(
      sin(uTime * 0.32) * 0.5,
      cos(uTime * 0.21) * 0.5
    ) * uDrift;

    vec2 dir = (uPointer + drift) * uStrength * uCoverScale;
    vec2 shifted = parallax(uv, dir);

    // poza zakresem tekstury robią się smugi — przycinamy do krawędzi
    shifted = clamp(shifted, vec2(0.001), vec2(0.999));

    gl_FragColor = vec4(texture2D(uTexture, shifted).rgb * vShade, 1.0);
  }
`