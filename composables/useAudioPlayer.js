import { ref } from 'vue'

export const useAudioPlayer = () => {
  const audioPlayer = ref(null)
  const showPlayButton = ref(true)
  const isPlaying = ref(false)

  const startMusic = () => {
    if (audioPlayer.value) {
      audioPlayer.value.play()
      isPlaying.value = true
      showPlayButton.value = false
    }
  }

  const toggleMusic = () => {
    if (!audioPlayer.value) return

    if (isPlaying.value) {
      audioPlayer.value.pause()
      isPlaying.value = false
    } else {
      audioPlayer.value.play()
      isPlaying.value = true
    }
  }

  return {
    audioPlayer,
    showPlayButton,
    isPlaying,
    startMusic,
    toggleMusic
  }
}
