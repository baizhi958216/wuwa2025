<template>
  <div class="container">
    <div ref="canvasContainer" class="canvas-container"></div>

    <audio ref="audioPlayer" loop>
      <source src="/weijingzhilv.mp3" type="audio/mpeg">
    </audio>

    <div class="music-control" @click="toggleMusic" :class="{ playing: isPlaying }">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Myna UI Icons by Praveen Juge - https://github.com/praveenjuge/mynaui-icons/blob/main/LICENSE --><g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M9.713 3.64c.581-.495.872-.743 1.176-.888a2.58 2.58 0 0 1 2.222 0c.304.145.595.393 1.176.888c.599.51 1.207.768 2.007.831c.761.061 1.142.092 1.46.204c.734.26 1.312.837 1.571 1.572c.112.317.143.698.204 1.46c.063.8.32 1.407.83 2.006c.496.581.744.872.889 1.176c.336.703.336 1.52 0 2.222c-.145.304-.393.595-.888 1.176a3.3 3.3 0 0 0-.831 2.007c-.061.761-.092 1.142-.204 1.46a2.58 2.58 0 0 1-1.572 1.571c-.317.112-.698.143-1.46.204c-.8.063-1.407.32-2.006.83c-.581.496-.872.744-1.176.889a2.58 2.58 0 0 1-2.222 0c-.304-.145-.595-.393-1.176-.888a3.3 3.3 0 0 0-2.007-.831c-.761-.061-1.142-.092-1.46-.204a2.58 2.58 0 0 1-1.571-1.572c-.112-.317-.143-.698-.204-1.46a3.3 3.3 0 0 0-.83-2.006c-.496-.581-.744-.872-.89-1.176a2.58 2.58 0 0 1 .001-2.222c.145-.304.393-.595.888-1.176c.52-.611.769-1.223.831-2.007c.061-.761.092-1.142.204-1.46a2.58 2.58 0 0 1 1.572-1.571c.317-.112.698-.143 1.46-.204a3.3 3.3 0 0 0 2.006-.83"/><path d="M12.5 14.5V8.6a.6.6 0 0 1 .6-.6h1.4m-2 6.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0"/></g></svg>
    </div>

    <div v-if="showPlayButton" class="play-overlay" @click="handlePlayClick">
      <button class="play-button">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="30" r="28" stroke="white" stroke-width="2"/>
          <path d="M23 18L42 30L23 42V18Z" fill="white"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useAudioPlayer } from '../composables/useAudioPlayer'
import { useWaterEffect } from '../composables/useWaterEffect'

const images = [
  '/pics/0.webp',
  '/pics/1.webp',
  '/pics/2.webp',
  '/pics/3.webp',
  '/pics/4.webp',
  '/pics/5.webp',
  '/pics/6.webp',
  '/pics/7.webp',
  '/pics/8.webp',
  '/pics/9.webp',
  '/pics/10.webp',
  '/pics/11.webp',
  '/pics/12.webp',
  '/pics/13.webp',
  '/pics/14.webp',
  '/pics/15.webp',
  '/pics/16.webp',
  '/pics/17.webp',
  '/pics/18.webp',
  '/pics/19.webp',
  '/pics/20.webp',
  '/pics/21.webp',
  '/pics/22.webp',
  '/pics/23.webp',
  '/pics/24.webp',
  '/pics/25.webp',
  '/pics/26.webp',
  '/pics/27.webp',
  '/pics/28.webp',
  '/pics/29.webp',
  '/pics/30.webp',
  '/pics/31.webp',
  '/pics/32.webp',
  '/pics/33.webp',
  '/pics/34.webp',
  '/pics/35.webp',
  '/pics/36.webp',
  '/pics/37.webp',
  '/pics/38.webp',
  '/pics/39.webp',
  '/pics/40.webp',
  '/pics/41.webp'
]

// Audio player
const { audioPlayer, showPlayButton, isPlaying, startMusic, toggleMusic } = useAudioPlayer()
audioPlayer
// Water effect
const { canvasContainer, startSlideshow } = useWaterEffect(images, 5000, 1000)
canvasContainer
const handlePlayClick = () => {
  startMusic()
  startSlideshow()
}
</script>

<style>
*{
  margin: 0;
  padding: 0;
  /* Prevent text selection and dragging */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  /* Prevent image dragging */
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
  /* Prevent touch callout on iOS */
  -webkit-touch-callout: none;
}

.container{
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: #1a1a1a;
  /* Prevent pull-to-refresh on mobile */
  overscroll-behavior: none;
  touch-action: pan-x pan-y;
}

.canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
}

.canvas-container canvas {
  display: block;
  width: 100%;
  height: 100%;
  /* Prevent canvas dragging */
  pointer-events: auto;
  -webkit-user-drag: none;
  user-drag: none;
}

.play-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.play-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.play-button:hover {
  transform: scale(1.1);
}

.play-button svg {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.music-control {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.music-control:hover {
  transform: scale(1.1);
}

.music-control svg {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.music-control.playing svg {
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
