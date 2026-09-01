<template>
  <div>
    <BootSequence
      video-src="/video/rogson_intro.mp4"
      :intro-duration="6000"
      :reveal-duration="1750"
      :preload="['/img/hero_main.png', '/img/about_img.jpeg', '/img/contact.jpeg']"
    />
    <HeroSection />
    <AppsSection />
    <ContactSection background-image="/img/contact.jpeg" />
    <NavigationOverlay />
  </div>
</template>
