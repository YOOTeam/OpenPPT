<template>
  <div class="Interactive">
    <div class="mode-tips-title p16">
      <span> {{ $t('toolbar.other') }} </span>
    </div>
    <div class="p16 mt20">
      <div class="slide-pool">
        <div
          v-for="item in createList"
          class="create-item"
          :key="item.type"
          @click="handleInsert(item)"
        >
          <img class="img-gif" :src="item.gif" alt="" srcset="" />
          <div class="type-name">{{ item.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useMainStore } from '@/store'
import useCreateElement from '@/hooks/useCreateElement'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { createWebElement } = useCreateElement()
const mainStore = useMainStore()
const createList = reactive([
  {
    name: t('toolbar.iframeShow'),
    gif: 'https://image.static.yoojober.cn/web/chatppt/gif/gui.gif',
    type: 'iframe',
  },
])

const handleInsert = (item: any) => {
  if (item.type === 'iframe') {
    const w = 600
    const h = 500
    createWebElement('https://chatppt.cn/', w, h, 'none')
    mainStore.setOpenNoTokenToobal(false)
    mainStore.setShowToolbar(false)
    setTimeout(() => {
      mainStore.setShowToolbar(true)
      mainStore.setToolbarData({
        showEmpty: false,
        type: item.type,
        useact: 'update',
        x: 0,
        y: 0,
        contentStyle: { right: '100rem', left: 'auto' },
      })
    }, 500)
  }
}
</script>
<style lang="scss">
.Interactive {
  @include drage-modal-layout();
  min-height: 500rem;
  padding: 0;

  .p16 {
    padding: 0 16rem;
  }

  .mt20 {
    margin-top: 20rem;
  }

  .slide-pool {
    width: 100%;
    height: 450rem;
    overflow: auto;
  }

  .create-item {
    width: 100%;
    height: 150rem;
    border: 1rem solid #dddaff;
    border-radius: 6rem;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #959292;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    .img-gif {
      width: 100%;
      margin-left: 40rem;
    }
    &:hover {
      border-color: $themeColor;
    }
    .type-name {
      position: absolute;
      bottom: 0;
      left: 0;
      background: linear-gradient(248deg, #ece0ff 13%, #faecff 100%);
      border-radius: 0 6rem 0 6rem;
      padding: 6rem 20rem;
      color: #513b72;
      font-size: 14rem;
      font-weight: 500;
    }
  }
}
</style>
