<template>
  <div class="yoo-avatar" ref="container">
    <img :src="url" alt="Your Image" :style="imageStyle" ref="image" />
  </div>
</template>

<script>
import { ref, watch, onMounted, nextTick } from 'vue'
export default {
  name: 'YooAvatar',
  props: {
    src: String,
  },
  setup(props) {
    const url = ref(props.src)
    const container = ref(null)
    const image = ref(null)
    const imageStyle = ref({})
    watch(
      () => props.src,
      (newOption) => {
        url.value = newOption
        adjustImage()
      },
      {
        deep: true,
      }
    )
    onMounted(() => {
      nextTick(() => {
        adjustImage()
      })
    })
    const adjustImage = () => {
      if (!container.value || !image.value) return
      const containerRatio =
        container.value?.offsetWidth / container.value?.offsetHeight
      const img = new Image()
      img.src = url.value

      img.onload = () => {
        const imgRatio = img.width / img.height
        if (containerRatio > imgRatio) {
          imageStyle.value = {
            width: '100%',
            height: 'auto',
            top: 0,
            left: '50%',
            transform: 'translate(-50%, 0) scale(1)',
            position: 'relative',
          }
        } else {
          imageStyle.value = {
            width: 'auto',
            height: '100%',
            top: 0,
            left: '50%',
            transform: 'translate(-50%, 0) scale(1)',
            position: 'relative',
          }
        }
      }
    }
    return { url, imageStyle, image, container }
  },
}
</script>

<style scoped lang="scss">
.yoo-avatar {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #ffffff;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
  }
}
</style>
