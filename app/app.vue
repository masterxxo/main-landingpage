<template>
  <div>
    <BootSequence
      video-src="/video/rogson_intro.mp4"
      :intro-duration="6000"
      :reveal-duration="1750"
      :preload="['/img/hero_main.png', '/img/hero-depth-12.png', '/img/about_img.jpeg']"
    />
    <HeroSection />
    <AboutSection />
    <NavigationOverlay />
  </div>
</template>
