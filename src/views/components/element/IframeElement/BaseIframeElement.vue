<template>
  <div
    class="base-element-iframe"
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
                src="@/assets/image/computer.png"
                alt=""
                ref="pcImg"
                v-if="elementInfo.style === 'pc'"
              />
              <img
                src="@/assets/image/phone.png"
                alt=""
                ref="phoneImg"
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
          <div class="mark-box" v-if="elementInfo.isMark">
            <div
              carp="68df251594547faf"
              class="btn-tips"
              @click="handleOpenBox"
              :style="{ transform: `scale(${1 / canvasScale})` }"
            >
              <i class="iconfont icon-fangdachakan"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    <a-modal
      v-model:visible="showBox"
      @cancel="handleCancel"
      v-if="showBox"
      width="auto"
      :footer="false"
      :modal-class="'iframe-box-mm'"
    >
      <div class="close-icon">
        <i class="iconfont icon-daoru-guanbijindu"></i>
      </div>
      <SearchBigElement :elementInfo="props.elementInfo" />
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import useColor from '@/hooks/useColor'
import Input from '@/components/Input.vue'
import message from '@/utils/message'
import SearchBigElement from './SearchBigElement.vue'
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
const boxStyle = ref({
  width: '100%',
})
const phoneImg = ref<HTMLIFrameElement | null>(null)
const pcImg = ref<HTMLIFrameElement | null>(null)
const phoneStyle = ref({})
const showBox = ref(false)
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

const setImgIfrmaeWH = (type: string) => {
  if (type === 'mobile') {
    boxStyle.value = {
      height: '100%',
    }
    nextTick(() => {
      if (phoneImg.value?.width) {
        const phoneImgWidth = phoneImg.value.width - 30
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

const handleOpenBox = () => {
  showBox.value = true
}
const handleCancel = () => {
  showBox.value = false
}
onMounted(() => {
  setImgIfrmaeWH(props.elementInfo.style)
})
</script>

<style lang="scss" scoped>
.base-element-iframe {
  position: absolute;
  color: #1a1a1a;
  font-size: 14px;
}
.mark-box-modal {
  overflow: auto;
}

.rotate-wrapper {
  width: 100%;
  height: 100%;
}

.close-icon {
  position: absolute;
  top: 0;
  right: -60px;
  z-index: 999;
  color: #fff;
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
    right: 15px;
    background: #ffffff;
    box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.3);
    color: $themeColor;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    transform-origin: 0 0;
    opacity: 0;
    transition: opacity 1s;
    cursor: pointer;

    &:active {
      background: #dddaff;
      outline: 1px solid $themeColor;
    }
    &:hover {
      outline: 1px solid $themeColor;
    }
  }
  .mark-box {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: default;
    &:hover .btn-tips {
      opacity: 1;
    }
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
.iframe-box-mm {
  .arco-modal-header {
    position: relative;
    height: 0;
    border: 0;
    padding: 0;
  }
  .arco-modal-close-btn {
    position: absolute;
    right: -100rem;

    .arco-icon-hover:hover::before {
      background-color: #676565;
    }
    .arco-icon-hover {
      font-size: 24rem;
      color: #fff;
      background: #3d3d3d;
      border-radius: 10rem;
      cursor: pointer;
      width: 45rem;
      height: 45rem;
      text-align: center;
      line-height: 45rem;

      &:hover ::before {
        color: #fff;
        background: #303030;
      }
    }
    .arco-icon-hover::before {
      width: 45rem;
      height: 45rem;
      border-radius: 10rem;
    }
  }
}
</style>
