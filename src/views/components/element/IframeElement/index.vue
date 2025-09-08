<template>
  <div
    class="editable-element-iframe"
    :class="{ lock: elementInfo.lock }"
    :style="{
      top: elementInfo.top + 'px',
      left: elementInfo.left + 'px',
      width: elementInfo.width + 'px',
      height: elementInfo.height + 'px',
    }"
  >
    <div
      class="rotate-wrapper"
      :style="{ transform: `rotate(${elementInfo.rotate}deg)` }"
    >
      <div
        class="element-content"
        v-contextmenu="contextmenus"
        @mousedown="($event) => handleSelectElement($event)"
        @touchstart="($event) => handleSelectElement($event)"
      >
        <div
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
          <div
            class="mark-box"
            v-if="!editable || elementInfo.lock"
            @dblclick="startEdit()"
            @mousedown="($event) => handleSelectElement($event)"
            @touchstart="($event) => handleSelectElement($event)"
          >
            <div
              class="btn-tips"
              v-if="handleElementId === elementInfo.id"
              :style="{ transform: `scale(${1 / canvasScale})` }"
            >
              {{ $t('toolbar.dubCliclkEditor') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { PPTIframeElement } from '@/types/slides'
import { useMainStore, useSlidesStore } from '@/store'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useColor from '@/hooks/useColor'
import Input from '@/components/Input.vue'
import message from '@/utils/message'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { initColor } = useColor()
const props = defineProps<{
  elementInfo: PPTIframeElement
  selectElement: (
    e: MouseEvent | TouchEvent,
    element: PPTIframeElement,
    canMove?: boolean
  ) => void
  dragElement: (e: MouseEvent | TouchEvent, element: PPTIframeElement) => void
  contextmenus: () => any[] | null
}>()

const searchUrl = ref('')
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const phoneImg = ref<HTMLIFrameElement | null>(null)
const pcImg = ref<HTMLIFrameElement | null>(null)
const phoneStyle = ref({})
const boxStyle = ref({
  width: '100%',
})
const { canvasScale, handleElementId, isScaling } = storeToRefs(mainStore)

const { addHistorySnapshot } = useHistorySnapshot()

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
  slidesStore.updateElement({
    id: props.elementInfo.id,
    props: {
      src: searchUrl.value,
      oldSrc: props.elementInfo.src,
    },
  })
}

const handleSelectElement = (e: MouseEvent | TouchEvent) => {
  if (props.elementInfo.lock) return
  e.stopPropagation()
  props.selectElement(e, props.elementInfo)
}

const editable = ref(false)

watch(handleElementId, () => {
  if (handleElementId.value !== props.elementInfo.id) editable.value = false
})

watch(editable, () => {
  mainStore.setDisableHotkeysState(editable.value)
})

const startEdit = () => {
  if (!props.elementInfo.lock) editable.value = true
}

const setImgIfrmaeWH = (type: string) => {
  if (type === 'mobile') {
    boxStyle.value = {
      height: '100%',
    }
    nextTick(() => {
      if (phoneImg.value?.width) {
        const phoneImgWidth = phoneImg.value.width - 28
        if (phoneImgWidth > 0) {
          phoneStyle.value = {
            width: phoneImgWidth + 'px',
          }
        }
      } else {
        phoneImg.value.onload = function () {
          const phoneImgWidth = this.width - 30
          if (phoneImgWidth > 0) {
            phoneStyle.value = {
              width: phoneImgWidth + 'px',
            }
          }
        }
      }
    })
  } else if (type === 'pc') {
    boxStyle.value = {
      width: '100%',
    }
    nextTick(() => {
      if (pcImg.value?.height) {
        const pcImgH = pcImg.value.height - 50
        if (pcImgH > 0) {
          phoneStyle.value = {
            height: pcImgH + 'px',
          }
        }
      } else {
        pcImg.value.onload = function () {
          const pcImgH = this.offsetHeight - 50
          if (pcImgH > 0) {
            phoneStyle.value = {
              height: pcImgH + 'px',
            }
          }
        }
      }
    })
  }
}
watch(
  () => props.elementInfo,
  (newValue) => {
    setImgIfrmaeWH(newValue.style)
  },
  {
    deep: true,
  }
)
onMounted(() => {
  setImgIfrmaeWH(props.elementInfo.style)
})
</script>

<style lang="scss" scoped>
.editable-element-iframe {
  position: absolute;
  color: #1a1a1a;
  font-size: 14px;
  &.lock .element-content {
    cursor: default;
  }
}

.btn-tips {
  position: absolute;
  top: 5px;
  left: 5px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 6px 12px;
  font-size: 12px;
  transform-origin: 0 0;
  border-radius: 6px;
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
    background-image: url('https://image.static.yoojober.cn/web/chatppt/gif/f-3.gif');
    background-repeat: no-repeat;
    background-position: center;
    background-size: 50px 50px;
    background-color: #fff;
  }
  .mark-box {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
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
    position: relative;
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
      padding: 8px;
      overflow: hidden;
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
<style lang="scss">
.iframe-browser-search {
  .input input {
    color: #1a1a1a !important;
    height: 30px !important;
    line-height: 30px !important;
    font-size: 14px !important;
    padding-left: 10px;
    padding-right: 20px;
  }
}
</style>
