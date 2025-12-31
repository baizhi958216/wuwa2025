import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { vertexShader, fragmentShader } from '../shaders/waterShader'

export const useWaterEffect = (images, slideshowDuration = 5000, transitionDuration = 1000) => {
  const canvasContainer = ref(null)

  let scene, camera, renderer, mesh, material
  let ripples = []
  const maxRipples = 5
  let animationId = null
  let mouseX = 0
  let mouseY = 0
  let lastRippleTime = 0

  let currentImageIndex = 0
  let slideshowInterval = null
  let textureLoader = null
  let isTransitioning = false
  let transitionStartTime = 0
  let currentTexture = null
  let nextTexture = null

  // Calculate plane dimensions based on screen and image aspect ratios
  const calculatePlaneDimensions = (imageAspect, screenAspect) => {
    // Always use cover mode - fill screen, may crop image
    let planeWidth, planeHeight

    if (screenAspect > imageAspect) {
      // Screen is wider - fit to width, let height overflow
      planeWidth = screenAspect * 2
      planeHeight = planeWidth / imageAspect
    } else {
      // Screen is taller - fit to height, let width overflow
      planeHeight = 2
      planeWidth = planeHeight * imageAspect
    }

    return { planeWidth, planeHeight }
  }

  // Initialize Three.js scene
  const initThreeJS = () => {
    if (!canvasContainer.value) return

    // Scene
    scene = new THREE.Scene()

    // Camera
    const aspect = window.innerWidth / window.innerHeight
    camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10)
    camera.position.z = 1

    // Renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    canvasContainer.value.appendChild(renderer.domElement)

    // Initialize texture loader
    textureLoader = new THREE.TextureLoader()

    // Load first image
    loadImage(images[currentImageIndex], true)

    // Don't start slideshow automatically - wait for user interaction
  }

  // Load image and update texture
  const loadImage = (imagePath, isFirst = false) => {
    if (!textureLoader) return

    textureLoader.load(imagePath, (texture) => {
      if (isFirst) {
        // First time - create material and mesh
        currentTexture = texture

        material = new THREE.ShaderMaterial({
          uniforms: {
            uTexture: { value: texture },
            uTexture2: { value: texture },
            uMixFactor: { value: 0.0 },
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uRipples: { value: Array(5).fill(new THREE.Vector3(0, 0, -999)) },
            uRippleCount: { value: 0 }
          },
          vertexShader,
          fragmentShader
        })

        // Calculate aspect ratio to fit image
        const imageAspect = texture.image.width / texture.image.height
        const screenAspect = window.innerWidth / window.innerHeight

        const { planeWidth, planeHeight } = calculatePlaneDimensions(imageAspect, screenAspect)

        // Create plane geometry
        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
        mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        // Start animation
        animate()
      } else {
        // Start transition to new texture
        if (!isTransitioning) {
          nextTexture = texture
          isTransitioning = true
          transitionStartTime = performance.now() / 1000
          material.uniforms.uTexture2.value = nextTexture

          // Create automatic ripple effect for transition
          createTransitionRipples()
        }
      }
    })
  }

  // Start slideshow timer
  const startSlideshow = () => {
    slideshowInterval = setInterval(() => {
      currentImageIndex = (currentImageIndex + 1) % images.length
      loadImage(images[currentImageIndex])
    }, slideshowDuration)
  }

  // Mouse move handler
  const onMouseMove = (event) => {
    const rect = canvasContainer.value?.getBoundingClientRect()
    if (!rect) return

    // Convert to normalized coordinates (0 to 1)
    mouseX = (event.clientX - rect.left) / rect.width
    mouseY = 1.0 - (event.clientY - rect.top) / rect.height

    // Throttle ripple creation
    const currentTime = Date.now()
    if (currentTime - lastRippleTime > 100) {
      addRipple(mouseX, mouseY)
      lastRippleTime = currentTime
    }
  }

  // Touch move handler for mobile
  const onTouchMove = (event) => {
    // Prevent default scrolling behavior
    event.preventDefault()

    const rect = canvasContainer.value?.getBoundingClientRect()
    if (!rect || !event.touches[0]) return

    // Convert to normalized coordinates (0 to 1)
    const touch = event.touches[0]
    mouseX = (touch.clientX - rect.left) / rect.width
    mouseY = 1.0 - (touch.clientY - rect.top) / rect.height

    // Throttle ripple creation
    const currentTime = Date.now()
    if (currentTime - lastRippleTime > 100) {
      addRipple(mouseX, mouseY)
      lastRippleTime = currentTime
    }
  }

  // Add ripple at position
  const addRipple = (x, y) => {
    if (!material) return

    const currentTime = performance.now() / 1000

    // Add new ripple
    ripples.push({
      x,
      y,
      time: currentTime
    })

    // Keep only the most recent ripples
    if (ripples.length > maxRipples) {
      ripples.shift()
    }

    // Update shader uniforms
    const rippleArray = ripples.map(r => new THREE.Vector3(r.x, r.y, r.time))
    while (rippleArray.length < maxRipples) {
      rippleArray.push(new THREE.Vector3(0, 0, -999))
    }

    material.uniforms.uRipples.value = rippleArray
    material.uniforms.uRippleCount.value = ripples.length
  }

  // Create automatic ripple effect for slideshow transition
  const createTransitionRipples = () => {
    // Create a wave that sweeps across the screen from left to right
    const startDelay = 0
    const rippleInterval = 150 // milliseconds between each ripple
    const numRipples = 5

    for (let i = 0; i < numRipples; i++) {
      setTimeout(() => {
        // Create ripples that move from left to right
        const x = (i / (numRipples - 1)) // 0 to 1 across the screen
        const y = 0.5 + (Math.random() - 0.5) * 0.3 // Random vertical position near center
        addRipple(x, y)
      }, startDelay + i * rippleInterval)
    }
  }

  // Animation loop
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    if (material) {
      const currentTime = performance.now() / 1000
      material.uniforms.uTime.value = currentTime

      // Handle transition animation
      if (isTransitioning) {
        const elapsed = currentTime - transitionStartTime
        const progress = Math.min(elapsed / (transitionDuration / 1000), 1.0)

        // Smooth easing function
        const easedProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2

        material.uniforms.uMixFactor.value = easedProgress

        // Transition complete
        if (progress >= 1.0) {
          isTransitioning = false
          currentTexture = nextTexture
          material.uniforms.uTexture.value = currentTexture
          material.uniforms.uMixFactor.value = 0.0
        }
      }

      // Remove old ripples
      ripples = ripples.filter(r => currentTime - r.time < 3.0)

      if (ripples.length < material.uniforms.uRippleCount.value) {
        const rippleArray = ripples.map(r => new THREE.Vector3(r.x, r.y, r.time))
        while (rippleArray.length < maxRipples) {
          rippleArray.push(new THREE.Vector3(0, 0, -999))
        }
        material.uniforms.uRipples.value = rippleArray
        material.uniforms.uRippleCount.value = ripples.length
      }
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }

  // Window resize handler
  const onResize = () => {
    if (!renderer || !camera || !material || !mesh || !currentTexture) return

    const width = window.innerWidth
    const height = window.innerHeight
    const aspect = width / height

    camera.left = -aspect
    camera.right = aspect
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
    material.uniforms.uResolution.value.set(width, height)

    // Recalculate plane dimensions for new screen size
    const imageAspect = currentTexture.image.width / currentTexture.image.height
    const { planeWidth, planeHeight } = calculatePlaneDimensions(imageAspect, aspect)

    // Update mesh geometry
    mesh.geometry.dispose()
    mesh.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
  }

  // Lifecycle
  onMounted(() => {
    initThreeJS()
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('resize', onResize)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('resize', onResize)

    // Clear slideshow interval
    if (slideshowInterval) {
      clearInterval(slideshowInterval)
    }

    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    if (renderer) {
      renderer.dispose()
    }

    if (material) {
      material.dispose()
    }

    if (mesh && mesh.geometry) {
      mesh.geometry.dispose()
    }
  })

  return {
    canvasContainer,
    startSlideshow
  }
}
