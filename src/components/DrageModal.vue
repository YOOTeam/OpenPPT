<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        class="modal drageModal"
        ref="modalRef"
        v-show="visible"
        tabindex="-1"
        @keyup.esc="onEsc()"
        :style="{ ...Styles, ...props.contentStyle }"
        :class="props.className"
      >
        <!-- <Transition
          name="modal-zoom"
          @afterLeave="contentVisible = false"
          @before-enter="contentVisible = true"
        > -->
        <div class="modal-content" v-show="visible">
          <div class="modal-header" @mousedown="handMoveMOdal">
            <slot name="title"></slot>
            <span class="line"></span>
            <span class="close-btn" @click.stop="close" @mousedown.stop>
              <slot name="icon"></slot>
              <IconClose />
            </span>
          </div>

          <slot></slot>
        </div>
        <!-- </Transition> -->
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch, type CSSProperties } from 'vue'
import { storeToRefs } from 'pinia'
import { useScreenStore, useMainStore } from '@/store'
import { icons } from '@/plugins/icon'

const mainStore = useMainStore()
const { viewTemlpate } = storeToRefs(mainStore)
const { IconClose } = icons
const { rem } = storeToRefs(useScreenStore())

const props = withDefaults(
  defineProps<{
    visible: boolean
    width?: number
    x?: any
    y?: any
    closeButton?: boolean
    closeOnClickMask?: boolean
    closeOnEsc?: boolean
    contentStyle?: CSSProperties
    type?: string
    className?: string
  }>(),
  {
    x: '',
    y: '',
    width: 480,
    closeButton: false,
    closeOnClickMask: true,
    closeOnEsc: true,
    type: '',
    className: '',
  }
)

const modalRef = ref<HTMLDivElement>()

const emit = defineEmits<{
  (event: 'update:visible', payload: boolean): void
  (event: 'closed', payload: any): void
}>()

const contentVisible = ref(false)

const Styles = computed(() => {
  const style = {
    left: props.x + 'rem',
    top: props.y + 'rem',
    transform: '',
  }
  if (typeof props.x !== 'number') {
    style.left =
      document.body.clientWidth / 2 - (props.width * rem.value) / 2 + 'rem'
  }
  if (typeof props.y !== 'number') {
    style.top = '50%'
    style.transform = ' translateY(-50%)'
  }
  return style
})

watch(
  () => props.visible,
  () => {
    if (props.visible) {
      nextTick(() => modalRef.value!.focus())
    }
  }
)

const close = (event?: any) => {
  emit('closed', event)
}

const onEsc = () => {
  if (props.visible && props.closeOnEsc) close()
}

const onClickMask = (e: any) => {
  if (viewTemlpate?.value.type === 'allView') return

  if (
    e.target.closest('.Toobar') ||
    e.target.closest('.modal') ||
    e.target.closest('.viewport-wrapper') ||
    e.target.closest('.catalog-add') ||
    e.target.closest('.themeSeting') ||
    e.target.closest('.tippy-box') ||
    e.target.closest('.i-icon-play') ||
    e.target.nodeName === 'svg' ||
    e.target.nodeName === 'path' ||
    e.target.nodeName === 'BODY' ||
    e.target.nodeName === 'HTML'
  ) {
  } else {
    if (props.closeOnClickMask) close()
  }
}

const handMoveMOdal = (e: any) => {
  const domWidth = document.body.clientWidth
  const domHeight = document.body.clientHeight
  const clickLeft = e.offsetX
  const clickTop = e.offsetY
  const dom = e.target.closest('.modal')
  const width = dom.offsetWidth
  const height = dom.offsetHeight
  let isMove = false
  document.onmousemove = (e) => {
    dom.style.transform = ''
    dom.classList.add('drage-userSelect')
    e.preventDefault()
    let left = e.x - clickLeft
    let top = e.y - clickTop
    if (left < 0) {
      left = 0
    }
    if (top < 0) {
      top = 0
    }

    if (left + width > domWidth || top + height > domHeight) {
      return
    }
    dom.style.right = 'auto'

    dom.style.left = left + 'px'
    dom.style.top = top + 'px'
    isMove = true
  }
  document.onmouseup = (e) => {
    document.onmousemove = null
    document.onmouseup = null
    if (isMove) {
      const obj = {
        left: dom.style.left,
        top: dom.style.top,
        right: dom.style.right,
        transform: '',
      }
      mainStore.setToolbarItemData({ contentStyle: obj })
    }
    dom.classList.remove('drage-userSelect')
  }
}

window.addEventListener('click', onClickMask)
</script>

<style lang="scss" scoped>
.modal {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  outline: 0;
  border: 0;
  top: 0;
  left: 0;
  z-index: 999;
}

.drage-userSelect {
  user-select: none;
}

.modal-content {
  z-index: 10000;
  background: #fff;
  border-radius: $borderRadius;
  overflow: hidden;
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.2);
  position: relative;
}

.modal-header {
  width: 100%;
  height: 60rem;
  cursor: move;
  position: relative;

  .line {
    position: absolute;
    left: 50%;
    top: 40%;
    transform: translate(-50%, -30%);
    width: 75rem;
    height: 4rem;
    border-radius: 5rem;
    opacity: 1;
    background: #dedede;
  }
}

.close-btn {
  width: 20rem;
  height: 20rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 16rem;
  right: 16rem;
  cursor: pointer;
  font-size: 18rem;
  color: #aaaaaa;
  &:hover {
    color: $themeColor;
  }
  &:active {
    color: $lightColor;
  }
}

.modal-fade-enter-active {
  animation: modal-fade-enter 0.25s both ease-in;
}

.modal-fade-leave-active {
  animation: modal-fade-leave 0.25s both ease-out;
}

.modal-zoom-enter-active {
  animation: modal-zoom-enter 0.25s both cubic-bezier(0.4, 0, 0, 1.5);
}

.modal-zoom-leave-active {
  animation: modal-zoom-leave 0.25s both;
}

@keyframes modal-fade-enter {
  from {
    opacity: 0;
  }
}

@keyframes modal-fade-leave {
  to {
    opacity: 0;
  }
}

@keyframes modal-zoom-enter {
  from {
    transform: scale3d(0.3, 0.3, 0.3);
  }
}

@keyframes modal-zoom-leave {
  to {
    transform: scale3d(0.3, 0.3, 0.3);
  }
}
</style>
