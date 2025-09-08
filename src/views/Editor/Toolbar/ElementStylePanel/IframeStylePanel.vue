<template>
  <div class="iframe-panel">
    <div class="row" v-if="handleElement?.name">
      <div style="width: 40%">{{ $t('toolbar.viewname') }}</div>
      <div style="width: 60%" class="leveName">{{ handleElement.name }}</div>
    </div>
    <div class="row" style="margin: 15rem 0">
      {{ $t('iframePool.updatelink') }}
    </div>
    <TextArea
      v-model:value="iframeUrl"
      :placeholder="t('iframePool.placeholder1')"
      @keydown.enter="handleInsert"
      @blur="handleInsert"
    />
    <div class="row" style="margin: 15rem 0">
      {{ $t('iframePool.borderStyle') }}
    </div>
    <div class="iframe-style">
      <div
        v-for="item in iframeStyleList"
        :key="item"
        class="iframe-style-item"
        :class="iframeStyle === item.type ? 'active' : ''"
        @click="handleChangeStyle(item)"
      >
        <i class="iconfont" :class="item.icon"></i>
        <span>
          {{ item.name }}
        </span>
        <IconCheckOne class="icon" v-if="iframeStyle === item.type" />
      </div>
    </div>
    <div class="row" style="margin-top: 10rem">
      {{ $t('iframePool.playStyle') }}
    </div>
    <div class="iframe-style">
      <div
        class="iframe-style-item"
        :class="isMark === item.value ? 'active' : ''"
        v-for="item in markList"
        :key="item.name"
        @click="handleSetMark(item)"
        style="height: auto; justify-content: space-between"
      >
        <img
          class="img-style"
          src="@/assets/image/f-5.gif"
          alt=""
          v-if="item.value"
        />
        <img class="img-style" src="@/assets/image/f-4.gif" alt="" v-else />

        <span style="margin-bottom: 10rem">
          {{ item.name }}
        </span>
        <IconCheckOne class="icon" v-if="isMark === item.value" />
      </div>
    </div>
    <!-- <div style="text-align: right">
      <Button @click="handleInsert">确定更新</Button>
    </div> -->
  </div>
</template>

<script lang="ts" setup>
import { type Ref, ref, reactive, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import TextArea from '@/components/TextArea.vue'
import message from '@/utils/message'

import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const mainStore = useMainStore()
const slidesStore = useSlidesStore()

const { handleElement, handleElementId } = storeToRefs(mainStore)

const { addHistorySnapshot } = useHistorySnapshot()

const iframeUrl = ref('')
const iframeStyle = ref('none')
const isMark = ref(false)
const markList = reactive([
  {
    name: t('iframePool.tips3'),
    value: false,
  },
  {
    name: t('iframePool.tips4'),
    value: true,
  },
])
const iframeStyleList = reactive([
  {
    icon: 'icon-wangyewaikuangyangshi-wuyangshi',
    type: 'none',
    name: t('iframePool.noStyle'),
  },
  {
    icon: 'icon-wangyewaikuangyangshi-liulanqi',
    type: 'browser',
    name: t('iframePool.browser'),
  },
  {
    icon: 'icon-wangyewaikuangyangshi-diannao',
    type: 'pc',
    name: t('iframePool.pc'),
  },
  {
    icon: 'icon-wangyewaikuangyangshi-shouji',
    type: 'mobile',
    name: t('iframePool.mobile'),
  },
])

watch(
  handleElement,
  () => {
    iframeUrl.value = handleElement.value?.src
    iframeStyle.value = handleElement.value?.style || 'none'
    isMark.value = handleElement.value?.isMark || false
  },
  { deep: true, immediate: true }
)
const startsWithWWW = (str: string): boolean => {
  return str.startsWith('www.')
}
const handleInsert = (value) => {
  const linkRegExp =
    /^(https?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-.,@?^=%&:\/~+#]*[\w\-@?^=%&\/~+#])?$/

  if (iframeUrl.value) {
    if (startsWithWWW(iframeUrl.value)) {
      iframeUrl.value = 'https://' + iframeUrl.value
    }
    iframeUrl.value = iframeUrl.value.trim()
  }
  if (!linkRegExp.test(iframeUrl.value)) {
    message.error(t('iframePool.error'))
    return false
  }

  const props = {
    src: iframeUrl.value,
    oldSrc: '',
  }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

const handleChangeStyle = (item: any) => {
  iframeStyle.value = item.type
  const props = {
    style: item.type,
  }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

const handleSetMark = (item: any) => {
  isMark.value = item.value
  const props = {
    isMark: item.value,
  }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}
</script>

<style lang="scss" scoped>
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10rem;
}
.iframe-panel {
  height: 660rem;
}
.iframe-style {
  margin-bottom: 10rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  .iframe-style-item {
    width: 48%;
    margin-bottom: 10rem;
    border-radius: 10rem;
    border: 1rem solid #dddaff;
    cursor: pointer;
    height: 90rem;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    color: #aaaaaa;
    overflow: hidden;
    i {
      font-size: 34rem;
    }

    .img-style {
      width: 100%;
      height: 90rem;
      margin-bottom: 10rem;
    }
    span {
      font-size: 12rem;
      margin: 3rem 0 0;
      color: #1a1a1a;
      text-align: center;
    }
    &:hover {
      cursor: pointer;
      background: #ebe9fd;
      color: #4e3eff;
    }
    &:hover i {
      color: #4e3eff;
    }
    &:hover span {
      color: #4e3eff;
    }
    .icon {
      position: absolute;
      right: 10rem;
      top: 10rem;
      font-size: 18rem;
      color: $themeColor;
    }
  }
  .active {
    border: 1rem solid $themeColor;
    i,
    span {
      color: #4e3eff;
    }
  }
}
</style>
