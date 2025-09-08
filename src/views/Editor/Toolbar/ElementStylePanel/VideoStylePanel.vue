<template>
  <div class="video-style-panel">
    <div class="title">{{ $t('toolbar.videoImg') }}</div>
    <div class="background-image-wrapper">
      <FileInput @change="(files) => setVideoPoster(files)">
        <div class="background-image">
          <div
            class="content"
            :style="{
              backgroundImage: handleVideoElement.poster
                ? `url(${handleVideoElement.poster})`
                : '',
              '--bgC': handleVideoElement.poster ? '#ccc' : '',
            }"
          >
            <Button> <IconUpload /> {{ $t('toolbar.uploadPanel') }}</Button>
          </div>
        </div>
      </FileInput>
    </div>
    <div class="row" style="justify-content: flex-end">
      <Button @click="updateVideo({ poster: '' })">{{
        $t('toolbar.resectPanel')
      }}</Button>
    </div>

    <div class="row switch-row" style="justify-content: space-between">
      <div style="width: 40%">{{ $t('toolbar.playSet') }}</div>
      <Checkbox
        @update:value="(value) => updateVideo({ autoplay: value })"
        :value="handleVideoElement.autoplay"
        >{{ $t('toolbar.autoplay') }}</Checkbox
      >
    </div>
    <div class="row">{{ $t('toolbar.videoFile') }}</div>
    <div class="row" style="justify-content: space-between">
      <div style="width: 40%">{{ $t('toolbar.updateVideo') }}</div>
      <FileInput
        style="flex: 1"
        accept="video/*"
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
import { ref, type Ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTVideoElement } from '@/types/slides'
import { getImageDataURL } from '@/utils/image'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import TextArea from '@/components/TextArea.vue'
import FileInput from '@/components/FileInput.vue'
import Button from '@/components/Button.vue'
import Checkbox from '@/components/Checkbox.vue'
import { onUploads } from '@/utils/upload'
import message from '@/utils/message'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const slidesStore = useSlidesStore()
const { handleElement, userToken } = storeToRefs(useMainStore())

const handleVideoElement = handleElement as Ref<PPTVideoElement>
const showUrl = ref(false)
const linkUrl = ref('')

const { addHistorySnapshot } = useHistorySnapshot()

const updateVideo = (props: Partial<PPTVideoElement>) => {
  if (!handleElement.value) return
  slidesStore.updateElement({ id: handleElement.value.id, props })
  addHistorySnapshot()
}

// 设置{{$t('toolbar.videoImg')}}
const setVideoPoster = async (files: FileList) => {
  const imageFile = files[0]
  if (!imageFile) return
  if (userToken.value) {
    message.info(t('toolbar.uploadTips2'))
    const res = await onUploads(imageFile, 'image')
    if (res.url) {
      updateVideo({ poster: res.url })
      message.closeAll()
    }
  } else {
    getImageDataURL(imageFile).then((dataURL) =>
      updateVideo({ poster: dataURL })
    )
  }
}

const setVideoSrc = async (files: FileList) => {
  const imageFile = files[0]
  if (!imageFile) return
  if (userToken.value) {
    message.info(t('toolbar.uploadTips2'))
    const fileType = 'chatpptEditor'

    const res = await onUploads(imageFile, fileType)
    if (res.url) {
      updateVideo({ src: res.url })
      message.closeAll()
    }
  } else {
    getImageDataURL(imageFile).then((dataURL) => updateVideo({ src: dataURL }))
  }
}

onMounted(() => {
  if (handleVideoElement.value) linkUrl.value = handleVideoElement.value.src
})
</script>

<style lang="scss" scoped>
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.title {
  margin-bottom: 10px;
}
.background-image-wrapper {
  margin-bottom: 10px;
}
.background-image {
  height: 0;
  padding-bottom: 56.25%;
  border: 1px solid $lightColor;
  border-radius: $borderRadius;
  position: relative;
  transition: all $transitionDelay;
  overflow: hidden;

  &:hover {
    border-color: $themeColor;
    color: $themeColor;
  }

  .content {
    @include absolute-0();

    display: flex;
    justify-content: center;
    align-items: center;
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
    cursor: pointer;
    &:hover {
      background-color: var(--bgC);
    }
  }
}
.switch-row {
  height: 32px;
}
.switch-wrapper {
  text-align: right;
}
</style>
