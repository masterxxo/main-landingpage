<template>
    <div
        ref="itemRef"
        :style="{ transform: transformStyle }"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
    >
        <slot />
    </div>
</template>
<script lang="ts" setup>
const itemRef = useTemplateRef('itemRef');
const transformStyle = ref('');

const handleMouseMove = (e: MouseEvent) => {
    if(!itemRef.value) return;

    const { left, top, width, height } = itemRef.value.getBoundingClientRect();

    const relativeX = (e.clientX - left) / width;
    const relativeY = (e.clientY - top) / height;
    console.log(e.clientY + "- clientY")
    console.log(top + " - top")
    console.log(height + " - height")

    const tiltX = (relativeY - 0.5) * 5;
    const tiltY = (relativeX - 0.5) * 5;
    console.log(relativeY);

    const newTransform = `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(0.98, 0.98, 0.98)`;

    transformStyle.value = newTransform;
    console.log(transformStyle.value);
}

const handleMouseLeave = () => {
    transformStyle.value = '';
}
</script>