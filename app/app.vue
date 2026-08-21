<template>
  <div>
    <BootSequence
      video-src="/video/rogson_intro.mp4"
      :intro-duration="8000"
      :reveal-duration="1400"
      :preload="['/img/hero_1.png', '/img/hero-depth-12.png']"
    />
    <HeroSection />
    <NavigationOverlay />
  </div>
</template>