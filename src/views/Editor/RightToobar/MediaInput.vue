<template>
  <div class="media-input">
    <Tabs
      :tabs="tabs"
      v-model:value="type"
      :tabsStyle="{ marginBottom: '15px' }"
    />

    <template v-if="type === 'video'">
      <div class="p16">
        <div class="drageModal-title">{{ $t('toolbar.uploadVieo') }}</div>
        <div class="file-upload-box">
          <FileInput
            accept="video/*"
            class="file-btn"
            @change="(files) => fileUpload(files)"
            ><span>{{ $t('toolbar.clickUploadVieo') }}</span>
          </FileInput>
        </div>
        <div class="drageModal-title">{{ $t('toolbar.inlineVieo') }}</div>
        <TextArea
          v-model:value="videoSrc"
          :placeholder="t('toolbar.placeVieo')"
        />
        <div class="btns">
          <Button @click="insertVideo()">{{ $t('toolbar.sure') }}</Button>
        </div>

        <div class="drageModal-title">{{ $t('toolbar.inlineVieoList') }}</div>
      </div>
      <div class="list-box">
        <div class="list" @scroll="handleScroll">
          <div
            v-for="(item, index) in videoList"
            class="video-item"
            :key="item"
          >
            <img :src="item.cover_url" v-if="item.cover_url" alt="" />
            <video
              @ended="handlePlayEnd"
              style="position: absolute; left: 0; top: 0"
              id="myVideo"
              width="100%"
              height="100%"
              :controls="false"
              v-if="active === index"
            >
              <source :src="item.url" type="video/mp4" />
            </video>
            <div class="btn">
              <IconAddOne class="icon" @click="handleInserVideo(item)" />

              <IconPauseOne
                class="icon"
                v-if="isPlay && active === index"
                @click="handlePlay('stop', index, item)"
              />
              <IconPlay
                class="icon"
                v-else
                @click="handlePlay('play', index, item)"
              />
            </div>
          </div>
        </div>
        <div class="tips" v-if="!userToken">
          <div>{{ $t('OpenModal.text5') }}</div>
          <div class="link" @click="handleLinkClick">
            {{ $t('OpenModal.text6') }}
          </div>
        </div>
      </div>
    </template>

    <template v-if="type === 'audio'">
      <div class="p16">
        <div class="drageModal-title">{{ $t('toolbar.uploadAudio') }}</div>
        <div class="file-upload-box">
          <FileInput
            accept=".mp3,.wav,.ogg,.flac,.aac"
            class="file-btn"
            @change="(files) => fileUpload(files)"
            ><span>{{ $t('toolbar.clickUploadAudio') }}</span>
          </FileInput>
        </div>
        <div class="drageModal-title">{{ $t('toolbar.inlineAudio') }}</div>
        <TextArea
          v-model:value="audioSrc"
          :placeholder="t('toolbar.placeAudio')"
        />
        <div class="btns">
          <Button @click="insertAudio()">{{ $t('toolbar.sure') }}</Button>
        </div>

        <div class="drageModal-title">{{ $t('toolbar.inlineAudioList') }}</div>
      </div>
      <div class="list-box">
        <div class="list" @scroll="handleScroll">
          <div
            v-for="(item, index) in audioList"
            class="audio-item"
            :key="item"
            :class="[active === index ? 'active' : '']"
          >
            <span class="title" v-tooltip="item.name">
              {{ item.name }}
            </span>
            <audio
              id="audioPlayer"
              :src="item.url"
              style="display: none"
              v-if="active === index"
            ></audio>
            <span class="btn">
              <IconAddOne class="icon" @click="handleInserAudio(item)" />
              <IconVolumeNotice class="icon" @click="handleAudioPaly(index)" />
            </span>
          </div>
        </div>
        <div class="tips" v-if="!userToken">
          <div>{{ $t('OpenModal.text5') }}</div>
          <div class="link" @click="handleLinkClick">
            {{ $t('OpenModal.text6') }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import Tabs from '@/components/Tabs.vue'
import Button from '@/components/Button.vue'
import TextArea from '@/components/TextArea.vue'
import FileInput from '@/components/FileInput.vue'
import { getImageDataURL } from '@/utils/image'

import { onUploads } from '@/utils/upload'
import message from '@/utils/message'
import { motionresource } from '@/api/careate'
import { VIDEO_LIST, AUDIO_LIST } from '@/configs/resources'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const mainStore = useMainStore()
const { userToken } = storeToRefs(mainStore)

const active = ref(-1)
const isPlay = ref(false)
const videoList = ref<any>([])

const audioList = ref<any>([])

type TypeKey = 'video' | 'audio'
interface TabItem {
  key: TypeKey
  label: string
}

const emit = defineEmits<{
  (event: 'insertVideo', payload: string): void
  (event: 'insertAudio', payload: string): void
  (event: 'close'): void
}>()

const type = ref<TypeKey>('video')

const videoSrc = ref('')
const audioSrc = ref('')

const tabs: TabItem[] = [
  { key: 'video', label: t('toolbar.video1') },
  { key: 'audio', label: t('toolbar.audio') },
]
const handleLinkClick = () => {
  window.open('https://wiki.yoo-ai.com/api/Open-PPT/open1.1.html', '_blank')
}
const fileUpload = async (files: FileList) => {
  const imageFile = files[0]
  if (!imageFile) return

  if (userToken.value) {
    message.info(t('toolbar.uploadTips2'))
    const fileType = 'chatpptEditor'

    const res = await onUploads(imageFile, fileType)
    if (res.url) {
      if (type.value === 'video') {
        emit('insertVideo', res.url)
      } else {
        emit('insertAudio', res.url)
      }
      message.closeAll()
      message.success(t('toolbar.addSuccess'))
    }
  } else {
    getImageDataURL(imageFile).then((dataURL) => {
      if (dataURL) {
        if (type.value === 'video') {
          emit('insertVideo', dataURL)
        } else {
          emit('insertAudio', dataURL)
        }
      }
    })
  }
}

const handlePlayEnd = () => {
  active.value = -1
  isPlay.value = false
}
const handleInserVideo = (item: any) => {
  handlePlayEnd()
  if (item.url) {
    emit('insertVideo', item.url)
  }
}
const handleInserAudio = (item: any) => {
  handlePlayEnd()
  if (item.url) {
    emit('insertAudio', item.url)
  }
}
const insertVideo = () => {
  if (!videoSrc.value) return message.error(t('toolbar.errorTips1'))
  emit('insertVideo', videoSrc.value)
}

const insertAudio = () => {
  if (!audioSrc.value) return message.error(t('toolbar.errorTips2'))
  emit('insertAudio', audioSrc.value)
}

const handlePlay = (type, index) => {
  active.value = index

  nextTick(() => {
    const video = document.getElementById('myVideo')
    if (type === 'play') {
      isPlay.value = true
      video.play()
    } else {
      isPlay.value = false
      video.pause()
    }
  })
}

const handleAudioPaly = (index) => {
  if (active.value !== index) {
    isPlay.value = false
  }
  active.value = index
  nextTick(() => {
    const audio = document.getElementById('audioPlayer')
    if (isPlay.value) {
      audio.pause()
      isPlay.value = false
    } else {
      audio.play()
      isPlay.value = true
    }
  })
}
const pageNumVideo: number = ref(1)
const pageNumAudio: number = ref(1)
const videoCount: number = ref(0)
const audioCount: number = ref(0)
const getResericeVideo = () => {
  if (!userToken.value) {
    videoList.value = VIDEO_LIST
    return
  }
  motionresource({
    type: 'video',
    limit: 10,
    page: pageNumVideo.value,
    order: 'commend',
  })
    .then((res) => {
      if (res.code === 200) {
        videoCount.value = res.data.count
        if (pageNumVideo.value === 1) {
          videoList.value = res.data.data
        } else {
          videoList.value = [...videoList.value, ...res.data.data]
        }
      } else {
        if (pageNumVideo.value === 1) {
          videoList.value = VIDEO_LIST
        }
      }
    })
    .catch(() => {
      videoList.value = VIDEO_LIST
    })
}

const getResericeAudio = () => {
  if (!userToken.value) {
    audioList.value = AUDIO_LIST
    return
  }
  motionresource({
    page: pageNumAudio.value,
    limit: 10,
    type: 'audio',
    order: 'commend',
  })
    .then((res) => {
      if (res.code === 200) {
        audioCount.value = res.data.count
        if (pageNumAudio.value === 1) {
          audioList.value = res.data.data
        } else {
          audioList.value = [...audioList.value, ...res.data.data]
        }
      } else {
        if (pageNumAudio.value === 1) {
          audioList.value = AUDIO_LIST
        }
      }
    })
    .catch(() => {
      audioList.value = AUDIO_LIST
    })
}
const handleScroll = (event) => {
  if (!userToken.value) return
  const { scrollTop, scrollHeight, clientHeight } = event.target
  // 当滚动到底部时加载更多数据
  if (scrollHeight - scrollTop - clientHeight < 2) {
    if (type.value === 'video') {
      if (videoCount.value > videoList.value.length) {
        pageNumVideo.value++
        getResericeVideo()
      }
    } else {
      pageNumAudio.value++
      if (audioCount.value > audioList.value.length) {
        getResericeAudio()
      }
    }
  }
}
onMounted(() => {
  getResericeVideo()
})

watch(type, () => {
  active.value = -1
  isPlay.value = false
  pageNumVideo.value = 1
  pageNumAudio.value = 1
  if (type.value === 'video') {
    getResericeVideo()
  } else {
    getResericeAudio()
  }
})
</script>

<style lang="scss">
.media-input {
  @include drage-modal-layout();
  padding: 0;
  .p16 {
    padding: 0 16rem;
  }
  .file-btn {
    margin-top: 5rem;
    display: inline-block;
    padding: 7rem 15rem;
    background: #fff;
    cursor: pointer;
    border-radius: 6rem;
    border: 1px solid $lightColor;
    color: $themeColor;
    margin-bottom: 15rem;
    &:hover {
      background: #ebe9fd;
      color: $themeColor;
    }

    &:active {
      background: $themeColor;
      color: #fff;
    }
  }

  .file-upload-box {
  }

  .tips-file {
    font-size: 12rem;
    color: #b3b3b3;
    margin-left: 5rem;
  }
  .list-box {
    padding: 5px 0 16rem;
    .tips {
      margin-top: 10rem;
      margin-left: 16rem;
      text-align: start;
      font-size: 16rem;
      color: #3d3d3d;
      .link {
        margin-left: 8rem;
        margin-top: 12rem;
        line-height: 23rem;
        letter-spacing: 0em;
        font-size: 14rem;
        color: #0256ff;
        cursor: pointer;
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .list {
    padding: 0 16rem;
    height: 250rem;
    overflow: auto;
    @include flex-grid-layout();
    justify-content: space-between;

    .video-item,
    .audio-item {
      cursor: pointer;
      flex-basis: 48%;
      /* 防止padding影响宽度 */
      border-radius: 10rem;
      border: 1rem solid $lightColor;
      height: 75rem;
      margin-bottom: 10rem;
      position: relative;
      overflow: hidden;

      &:hover {
        color: $themeColor;
      }
    }

    .audio-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .title {
        padding: 0 10px;
        white-space: nowrap; /* 确保文本在一行内显示 */
        overflow: hidden; /* 隐藏溢出的内容 */
        text-overflow: ellipsis; /* 使用省略号表示文本溢出 */
        width: 200rem; /* 设置一个宽度限制 */
      }

      .btn {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .icon {
        color: #b2abfc;
        font-size: 16rem;
        margin: 0 4rem;
        &:hover {
          color: $themeColor;
        }
      }
    }

    .active {
      .title {
        color: $themeColor;
      }

      .icon {
        color: $themeColor;
      }
    }

    .video-item {
      &:hover {
        background: rgba(0, 0, 0, 0.3);
      }
      .btn {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2;
        opacity: 0;

        .icon {
          color: #fff;
          font-size: 20rem;
          margin: 0 4rem;
          &:hover {
            color: $themeColor;
          }
        }
      }

      &:hover .btn {
        opacity: 1;
      }
    }

    .audio-item {
      flex-basis: 100%;
      height: 40rem;
    }
  }

  .textarea {
    border-radius: 10rem;
    line-height: 30rem;
    line-height: 22rem;
    padding: 10rem;
    height: 80rem;
    overflow: auto;
  }

  [contenteditable] {
    outline: none;
    border: none;
    width: 100%;

    &:empty:before {
      content: '';
      display: block;
    }
  }

  .button {
    font-size: 14rem;
  }
  .btns {
    margin: 10px 0;
  }
}
</style>
