<template>
  <div
    ref="searchIframe"
    class="search-iframe"
    :style="{
      width: boxWidth + 'px',
      height: boxHeight + 'px',
    }"
  >
    <div class="rotate-wrapper">
      <div class="element-content">
        <div
          @click.stop
          class="iframe-content"
          :class="`iframe-${elementInfo.style}`"
          :style="{
            borderColor: initColor({
              type: 'themeColor',
              value: 'accent1',
              transparent: '1',
            }),
          }"
        >
          <template v-if="elementInfo.style === 'browser'">
            <div
              class="iframe-browser-search"
              @mousedown.stop
              @mouseup.stop
              @select.stop
              @copy.stop
              @keydown.stop
              @keydown.prevent
              @click.stop
            >
              <Input
                @keydown.stop
                @keyup.stop
                @blur.stop
                @keydown.enter.stop="handleUpdateSearch()"
                @keydown.enter.prevent
                @copy.stop
                class="title-input"
                id="isIframeSearch"
                v-model:value="searchUrl"
                placeholder="请输入地址"
              >
                <template #prefix> <IconSearch class="IconSearch" /> </template
              ></Input>
            </div>
            <div class="iframe-browser-content">
              <iframe
                :src="elementInfo.src"
                frameborder="0"
                width="100%"
                height="100%"
                allow="microphone; camera; geolocation; fullscreen; clipboard-write; compute-pressure"
                allowfullscreen
              ></iframe>
            </div>
          </template>
          <template
            v-else-if="
              elementInfo.style === 'pc' || elementInfo.style === 'mobile'
            "
          >
            <div
              class="container"
              :style="boxStyle"
              @dragstart.stop.prevent
              @drag.stop
              @dragend.stop
            >
              <img
                :style="{
                  'max-height': boxHeight + 'px',
                }"
                ref="pcImg"
                src="@/assets/image/computer.png"
                alt=""
                v-if="elementInfo.style === 'pc'"
              />
              <img
                ref="phoneImg"
                src="@/assets/image/phone.png"
                alt=""
                v-if="elementInfo.style === 'mobile'"
              />

              <div class="webIframe" :style="phoneStyle">
                <iframe
                  :src="elementInfo.src"
                  width="100%"
                  height="100%"
                  allow="microphone; camera; geolocation; fullscreen; clipboard-write; compute-pressure"
                  allowfullscreen
                ></iframe>
              </div>
            </div>
          </template>
          <template v-else>
            <iframe
              :src="elementInfo.src"
              frameborder="0"
              width="100%"
              height="100%"
              allow="microphone; camera; geolocation; fullscreen; clipboard-write; compute-pressure"
              allowfullscreen
            ></iframe>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import useColor from '@/hooks/useColor'
import Input from '@/components/Input.vue'
import message from '@/utils/message'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps<{
  elementInfo: PPTImageElement
}>()

const { initColor } = useColor()
const mainStore = useMainStore()
const { canvasScale } = storeToRefs(mainStore)
const slidesStore = useSlidesStore()
const searchUrl = ref('')
const phoneImg = ref<HTMLIFrameElement | null>(null)
const pcImg = ref<HTMLIFrameElement | null>(null)
const searchIframe = ref<HTMLIFrameElement | null>(null)
const boxStyle = ref({
  width: '100%',
})

const boxWidth = ref('100%')
const boxHeight = ref('100%')
const startsWithWWW = (str: string): boolean => {
  return str.startsWith('www.')
}
const handleUpdateSearch = () => {
  if (!searchUrl.value) {
    if (props.elementInfo.oldSrc) {
      slidesStore.updateElement({
        id: props.elementInfo.id,
        props: {
          src: props.elementInfo.oldSrc,
          oldSrc: '',
        },
      })
    }
    return
  }
  const linkRegExp =
    /^(https?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-.,@?^=%&:\/~+#]*[\w\-@?^=%&\/~+#])?$/
  if (searchUrl.value) {
    if (startsWithWWW(searchUrl.value)) {
      searchUrl.value = 'https://' + searchUrl.value
    }
  }
  if (!linkRegExp.test(searchUrl.value)) {
    message.error(t('iframePool.error'))
    return false
  }
  const parame = {
    src: searchUrl.value,
  }
  if (!props.elementInfo.oldSrc) {
    parame.oldSrc = props.elementInfo.src
  }
  slidesStore.updateElement({
    id: props.elementInfo.id,
    props: parame,
  })
}
const phoneStyle = ref({})
const setSeize = () => {
  nextTick(() => {
    boxWidth.value = document.documentElement.clientWidth - 280
    // 获取视口高度（不包括滚动条）
    boxHeight.value = document.documentElement.clientHeight - 150
  })
}
onMounted(() => {
  setSeize()
  if (props.elementInfo.style === 'mobile') {
    boxStyle.value = {
      height: '100%',
    }
    nextTick(() => {
      phoneImg.value.onload = function () {
        const phoneImgWidth = this.width - 40
        if (phoneImgWidth > 0) {
          phoneStyle.value = {
            width: phoneImgWidth + 'px',
          }
        }
      }
    })
  } else if (props.elementInfo.style === 'pc') {
    nextTick(() => {
      pcImg.value.onload = function () {
        const pcImgH = this.offsetHeight - 90
        if (pcImgH > 0) {
          phoneStyle.value = {
            height: pcImgH + 'px',
          }
        }
      }
    })
  }
})

window.addEventListener('resize', () => {
  setSeize()
})
</script>

<style lang="scss" scoped>
.search-iframe {
  color: #1a1a1a;
  font-size: 14px;
}
.rotate-wrapper {
  width: 100%;
  height: 100%;
}
.element-content {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: move;

  .iframe-content {
    border-radius: 15px;
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    background: url('https://image.static.yoojober.cn/web/chatppt/gif/f-3.gif')
      no-repeat center;
    background-size: 50px 50px;
    background-color: #fff;
  }

  .btn-tips {
    position: absolute;
    top: 5px;
    left: 5px;
    background-color: rgba(0, 0, 0, 0.5);
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    transform-origin: 0 0;
    opacity: 0;
    transition: opacity 1s;
  }
  .iframe-none {
    border-width: 2px;
    border-style: solid;
  }

  .iframe-browser {
    border-width: 2px;
    border-style: solid;
    padding: 10px 0;
  }
  .iframe-browser-search {
    height: 40px;
    border-radius: 40px;
    width: 100%;
    padding: 0 10px 10px;
    .IconSearch {
      font-size: 18px;
      margin-left: 6px;
      color: #686666cc;
    }
    .title-input {
      width: 100%;
      height: 100%;
      border-radius: 40px;
      background: #dddfff;
    }
    .input input {
      color: #1a1a1a;
      height: 50px !important;
      line-height: 50px !important;
    }
  }

  .iframe-browser-content {
    height: calc(100% - 40px);
  }

  .iframe-pc,
  .iframe-mobile {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .container {
    img {
      width: 100%;
      height: 100%;
    }
  }

  .iframe-pc {
    background-color: transparent;
    .webIframe {
      position: absolute;
      top: 49%;
      left: 50.3%;
      height: 58.5%;
      width: 78%;
      transform: translate(-50%, -50%);
      background: url('https://image.static.yoojober.cn/web/chatppt/gif/f-3.gif')
        no-repeat center;
      background-color: #fff;
      background-size: 50px 50px;
    }
  }

  .iframe-mobile {
    background-color: transparent;
    .webIframe {
      position: absolute;
      top: 50%;
      padding: 20rem;
      left: 50%;
      height: 76%;
      width: 36%;
      transform: translate(-50%, -50%);
      background: url('https://image.static.yoojober.cn/web/chatppt/gif/f-3.gif')
        no-repeat center;
      background-color: #fff;
      background-size: 50px 50px;
    }
  }
}
.color-mask {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
</style>
