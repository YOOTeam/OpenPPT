<template>
  <div class="audio-style-panel">
    <div class="row" v-if="handleElement?.name">
      <div style="width: 40%">{{ $t('toolbar.viewname') }}</div>
      <div style="width: 60%">{{ handleElement.name }}</div>
    </div>

    <div class="row">{{ $t('toolbar.iconSet') }}</div>
    <div class="audio-shape">
      <span
        v-for="item in audioShape"
        class="path-item"
        :key="item.key"
        :class="activePath === item.key ? 'active' : ''"
        @click="updateAudio({ path: item.key })"
      >
        <i class="iconfont" :class="item.key"></i>
      </span>
    </div>
    <div class="row">
      <div style="width: 40%">{{ $t('toolbar.iconColor') }}</div>
      <Popover trigger="click" style="width: 60%">
        <template #content>
          <ColorPicker
            :modelValue="initColor(handleAudioElement.color)"
            @update:modelValue="(value) => updateAudio({ color: value })"
          />
        </template>
        <ColorButton :color="initColor(handleAudioElement.color)" />
      </Popover>
    </div>
    <div class="row">{{ $t('toolbar.playSet') }}</div>
    <div class="row">
      <Checkbox
        style="flex: 1"
        @update:value="(value) => updateAudio({ autoplay: value })"
        :value="handleAudioElement.autoplay"
        >{{ $t('toolbar.autoplay') }}</Checkbox
      >
      <Checkbox
        style="flex: 1"
        @update:value="(value) => updateAudio({ loop: value })"
        :value="handleAudioElement.loop"
        >{{ $t('toolbar.loopPlay') }}</Checkbox
      >
    </div>

    <div class="row">{{ $t('toolbar.audioFile') }}</div>
    <div class="row" style="justify-content: space-between">
      <div style="width: 40%">{{ $t('toolbar.updateVideo') }}</div>
      <FileInput
        style="flex: 1"
        accept=".mp3,.wav,.ogg,.flac,.aac"
        @change="(files) => setVideoSrc(files)"
      >
        <Button style="width: 100%">{{
          $t('toolbar.uploadLoaclVideo')
        }}</Button>
      </FileInput>
    </div>
    <div class="row">
      <div style="width: 40%">{{ $t('toolbar.inlineLink') }}</div>
      <Button style="flex: 1" @click="showUrl = !showUrl">
        {{ $t('toolbar.importLink') }}</Button
      >
    </div>
    <div v-if="showUrl">
      <TextArea
        v-model:value="linkUrl"
        :placeholder="t('toolbar.importLinkTips')"
        ref="textAreaRef"
      />
      <div style="text-align: right; margin-top: 10rem">
        <Button style="flex: 1" @click="updateVideo({ src: linkUrl })">
          {{ $t('toolbar.suerUpdate') }}</Button
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, type Ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTAudioElement } from '@/types/slides'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import { getImageDataURL } from '@/utils/image'
import ColorButton from '@/components/ColorButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Popover from '@/components/Popover.vue'
import FileInput from '@/components/FileInput.vue'
import Button from '@/components/Button.vue'
import TextArea from '@/components/TextArea.vue'
import Checkbox from '@/components/Checkbox.vue'
import useColor from '@/hooks/useColor'

import { onUploads } from '@/utils/upload'
import message from '@/utils/message'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { initColor } = useColor()
const slidesStore = useSlidesStore()
const { handleElement, userToken } = storeToRefs(useMainStore())
const showUrl = ref(false)
const linkUrl = ref('')
const handleAudioElement = handleElement as Ref<PPTAudioElement>

const audioShape = [
  {
    key: 'icon-yuyinqipao',
    path: '',
  },
  {
    key: 'icon-douyin-01',
    path: '',
  },
  {
    key: 'icon-ins-01',
    path: '',
  },
  {
    key: 'icon-Facebook-01',
    path: '',
  },
  {
    key: 'icon-kongzhi1',
    path: '',
  },
  {
    key: 'icon-kongzhi3-01',
    path: '',
  },
  {
    key: 'icon-Facebook2-01',
    path: '',
  },
  {
    key: 'icon-shipin2-01',
    path: '',
  },
  {
    key: 'icon-huoshipin-01',
    path: '',
  },
  {
    key: 'icon-tuite',
    path: '',
  },
  {
    key: 'icon-shipin3-01',
    path: '',
  },
  {
    key: 'icon-shipin1-01',
    path: '',
  },
  {
    key: 'icon-T-01',
    path: '',
  },
  {
    key: 'icon-in',
    path: '',
  },
  {
    key: 'icon-yinpinbofang',
    path: '',
  },
  {
    key: 'icon-a-AIyemianquanyibao1x',
    path: '',
  },
]

const { addHistorySnapshot } = useHistorySnapshot()

const updateAudio = (props: Partial<PPTAudioElement>) => {
  if (!handleElement.value) return
  slidesStore.updateElement({ id: handleElement.value.id, props })
  addHistorySnapshot()
}

const activePath = computed(() => {
  return handleAudioElement.value.path
})
const setVideoSrc = async (files: FileList) => {
  const imageFile = files[0]
  if (!imageFile) return
  if (userToken.value) {
    message.info(t('toolbar.uploadTips2'))
    const fileType = 'chatpptEditor'

    const res = await onUploads(imageFile, fileType)
    if (res.url) {
      updateAudio({ src: res.url })
      message.closeAll()
    }
  } else {
    getImageDataURL(imageFile).then((dataURL) => updateAudio({ src: dataURL }))
  }
}

onMounted(() => {
  if (handleAudioElement.value) linkUrl.value = handleAudioElement.value.src
})
</script>

<style lang="scss" scoped>
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.switch-row {
  height: 32px;
}
.switch-wrapper {
  text-align: right;
}

.audio-shape {
  width: 100%;
  height: 87rem;
  border-radius: 6px;
  opacity: 1;
  box-sizing: border-box;
  border: 1px solid #dddaff;
  margin-bottom: 20rem;
  overflow-x: auto;
  display: flex;
  flex-wrap: wrap;
  .path-item {
    margin: 6rem 4rem;
    color: #acabab;
    .iconfont {
      font-size: 24rem;
    }
    &:hover {
      color: $themeColor;
      cursor: pointer;
    }
  }

  .active {
    color: $themeColor;
  }
}
</style>
