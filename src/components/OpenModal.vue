<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        class="modal"
        ref="modalRef"
        v-show="visible"
        tabindex="-1"
        @keyup.esc="onEsc()"
      >
        <div class="mask" @click="onClickMask()"></div>
        <Transition
          name="modal-zoom"
          @afterLeave="contentVisible = false"
          @before-enter="contentVisible = true"
        >
          <div class="modal-content" v-show="visible">
            <div
              class="img-box"
              :style="{
                width: data?.img?.w + 'rem',
                height: data?.img?.h + 'rem',
                backgroundImage: `url(${data?.img?.url})`,
              }"
            ></div>
            <i class="i-close" @click="closeModal"></i>
            <div
              class="title"
              :style="{ marginTop: data?.img?.h / 2 + 10 + 'rem' }"
              v-if="data?.title"
            >
              {{ data?.title }}
            </div>
            <div class="content">
              <div class="content-in" v-if="data?.content">
                {{ data?.content }}
              </div>
            </div>
            <div class="link-btn">
              <div class="link" v-if="data?.linkText">
                <a :href="data?.link" target="_blank">{{ data?.linkText }}</a>
              </div>
              <div class="btn" v-if="data?.btnText" @click="closeModal">
                <span>{{ data?.btnText }}</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch, type CSSProperties } from 'vue'
import { useMainStore } from '@/store'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const mainStore = useMainStore()
const props = defineProps<{
  visible: boolean
  width?: any
  closeButton?: boolean
  closeOnClickMask?: boolean
  closeOnEsc?: boolean
  contentStyle?: CSSProperties
  data?: {
    title: string
    content: string
    link: string
    linkText: string
    btnText: string
    img: {
      w: number
      h: number
      url: string
    }
  }
}>()

const data = computed(() => ({
  title: t('OpenModal.text1'),
  content: t('OpenModal.text2'),
  link: 'https://wiki.yoo-ai.com/api/Open-PPT/open1.1.html',
  linkText: t('OpenModal.text3'),
  btnText: t('OpenModal.text4'),
  img: {
    w: 156,
    h: 132,
    url: '//image.yoojober.com/users/2025-08/68a6f2611cac9.png',
  },
  ...props.data,
}))

const modalRef = ref<HTMLDivElement>()

const emit = defineEmits<{
  (event: 'update:visible', payload: boolean): void
}>()

const contentVisible = ref(false)
const closeModal = () => {
  mainStore.setOpenNoTokenModal(false)
}

watch(
  () => props.visible,
  () => {
    if (props.visible) {
      nextTick(() => modalRef.value!.focus())
    }
  }
)

const close = () => {
  emit('update:visible', false)
}

const onEsc = () => {
  if (props.visible && props.closeOnEsc) close()
}

const onClickMask = () => {
  if (props.closeOnClickMask) close()
}
</script>

<style lang="scss" scoped>
.modal,
.mask {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
}

.modal {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  outline: 0;
  border: 0;
}

.mask {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
}

.modal-content {
  width: 700rem;
  z-index: 1000;
  padding: 20px;
  background: #fff;
  border-radius: $borderRadius;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  position: relative;
}
.title {
  font-family: 思源黑体;
  font-size: 18rem;
  font-weight: bold;
  line-height: 23rem;
  letter-spacing: 0em;
  color: #1a1a1a;
  text-align: center;
  margin-bottom: 20rem;
}
.content {
  margin: 0 22rem;
  border-radius: 12rem;
  opacity: 1;
  background: #faf9ff;
  .content-in {
    font-size: 16rem;
    padding: 20rem 38rem;
    font-family: 思源黑体;
    font-weight: normal;
    line-height: 28rem;
    color: #6f66ca;
  }
}
.link-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .link {
    margin-left: 20rem;
    text-align: center;
    margin-top: 46rem;
    font-family: 思源黑体;
    font-size: 16rem;
    font-weight: normal;
    line-height: 23rem;
    letter-spacing: 0em;
    color: #0256ff;
    cursor: pointer;
    a {
      color: #0256ff;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }
  .btn {
    margin-top: 46rem;
    border-radius: 7rem;
    opacity: 1;
    display: flex;
    background: #453bff;
    cursor: pointer;
    &:hover {
      background: #3a32e6;
    }
    &:active {
      background: #2a24c4;
    }
    span {
      margin: 16rem 32rem;
      font-size: 16rem;
      font-weight: normal;
      line-height: 12rem;
      letter-spacing: 0em;
      color: #ffffff;
    }
  }
}

.img-box {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: absolute;
  top: -70rem;
  left: 50%;
  transform: translateX(-50%);
}
.i-close {
  position: absolute;
  top: 0;
  right: -50rem;
  cursor: pointer;
  background-image: url(@/assets/image/close.png);
  width: 30rem;
  height: 30rem;
  background-size: cover;
  background-repeat: no-repeat;
  display: inline-block;
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
