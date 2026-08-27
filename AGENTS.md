# AGENTS.md

## Project conventions

- This is a Nuxt 4 application using Vue 3, TypeScript, Tailwind CSS 4, Three.js, and `@nuxt/fonts`.
- Use pnpm. Keep `pnpm-lock.yaml` as the only dependency lockfile.
- Write Vue components as TypeScript SFCs using `<script setup lang="ts">`.
- Follow Nuxt auto-import conventions for components and standard Vue/Nuxt composables.
- Name components `PascalCase.vue`, composables `useCamelCase`, functions and variables `camelCase`, and types/interfaces `PascalCase`.
- Use Vue `ref` and `computed` for local reactive state. Follow the existing `useState`-based `useBoot()` composable for shared boot state.
- Keep lifecycle-based reusable UI behavior in `app/composables/`.
- Keep GLSL shader source in `app/shaders/`, outside Vue SFCs.
- Reference files from `public/` with absolute paths such as `/img/...`.
- For animations and WebGL code, preserve `prefers-reduced-motion` handling and release timers, animation frames, listeners, observers, textures, and renderer resources in `onBeforeUnmount`.
- Styling currently combines Tailwind utilities, global utilities in `app/assets/css/main.css`, and scoped component CSS. Reuse the local pattern of the component being changed.
- Scoped CSS commonly uses BEM-style classes and `is-*` state classes.
- Formatting is not fully consistent and no formatter is configured. Avoid unrelated formatting changes.

## Structure

- `app/app.vue` — root view composition.
- `app/components/` — auto-imported Vue components.
- `app/composables/` — shared state and reusable UI behavior.
- `app/shaders/` — Three.js GLSL source.
- `app/assets/css/main.css` — global CSS and Tailwind utilities.
- `public/` — static images, depth maps, video, favicon, and robots file.

The boot sequence is owned by `useBoot()` and follows:

`loading -> intro -> reveal -> ready`

Use its transition functions and computed values instead of duplicating that state in components.

## Commands and validation

```bash
pnpm install
pnpm dev
pnpm build
pnpm generate
pnpm preview
```

There are no configured test, lint, format, or standalone type-check scripts. Use `pnpm build` as the available project-level validation for code changes.

## Generated and managed files

Do not manually modify generated or dependency directories:

- `node_modules/`
- `.nuxt/`, including `.nuxt/tsconfig.*`
- `.output/`
- `.nitro/`
- `.data/`
- `.cache/`
- `dist/`

Update `pnpm-lock.yaml` only through pnpm dependency operations. Do not commit local `.env` or `.env.*` files; `.env.example` is the configured exception.

## Change discipline

- Keep changes scoped to the requested behavior and avoid unrelated refactors.
- Do not assume an API layer, store library, router structure, or testing convention; none is currently established in the repository.
