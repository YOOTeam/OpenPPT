<template>
  <div class="editor-header">
    <div class="left" @click="handleRemov">
      <!-- 标题 -->
      <div class="title">
        <Input
          class="title-input"
          ref="titleInputRef"
          v-model:value="titleValue"
          @blur="handleUpdateTitle()"
          v-if="editingTitle && !isAllDisableEdit"
        ></Input>
        <div class="title-text" @click="startEditTitle()" :title="title" v-else>
          {{ title }}
        </div>
        <template v-if="actionTime">
          <div class="line"></div>
          <div class="save-time">
            <icon-check-circle />
            {{ $t('headSaveTime') }} ：{{ actionTime }}
          </div>
        </template>
      </div>
      <!-- 导入/打开 -->
      <div class="go-back" @click.stop="handleLogin" v-if="!userToken">
        <i
          class="iconfont icon-daorushengchengPPT icon"
          v-tooltip="t('headUploadTips')"
          style="margin-right: 4rem"
        ></i>
        {{ t('OpenModal.text7') }}
      </div>
      <FileInput accept=".pptx" @change="handleImportPPT" v-else>
        <div class="go-back">
          <i
            class="iconfont icon-daorushengchengPPT icon"
            v-tooltip="t('headUploadTips')"
            style="margin-right: 4rem"
          ></i>
          {{ t('OpenModal.text7') }}
        </div>
      </FileInput>
      <!-- 上传美化 -->

      <div class="go-back" @click.stop="handleLogin" v-if="!userToken">
        <i
          class="iconfont icon-AImeihua-01 icon"
          style="margin-right: 4rem"
        ></i>
        {{ t('OpenModal.text8') }}
      </div>

      <FileInput
        accept="application/vnd.openxmlformats-officedocument.presentationml.presentation"
        @change="handleUploadPPT"
        v-else
      >
        <div class="go-back">
          <i
            class="iconfont icon-AImeihua-01 icon"
            style="margin-right: 4rem"
          ></i>
          {{ t('OpenModal.text8') }}
        </div>
      </FileInput>
    </div>

    <div class="right" @click="handleRemov">
      <div class="group-menu-item" style="margin-right: 0">
        <div
          class="menu-item"
          v-tooltip="t('headPlayTips')"
          @click="handlePlay('page')"
        >
          <i class="iconfont icon-zaixianshipinkubofang icon"></i
          ><span>{{ $t('headPlay') }}</span>
        </div>
        <Popover
          trigger="click"
          center
          :contentStyle="popoverStyle"
          :placement="'bottom-end'"
        >
          <template #content>
            <PopoverMenuItem class="prop-menuItem" @click="handlePlay('page')">
              <i
                class="iconfont icon-congtoukaishibofang"
                style="margin-right: 4rem"
              ></i
              >{{ $t('headPlayAll') }}</PopoverMenuItem
            >
            <PopoverMenuItem
              class="prop-menuItem"
              @click="handlePlay('current')"
            >
              <i
                class="iconfont icon-congdangqianyekaishibofang icon"
                style="margin-right: 4rem"
              ></i>
              {{ $t('headPlayCurrent') }}</PopoverMenuItem
            >
          </template>
          <div class="arrow-btn"><IconDown class="arrow" /></div>
        </Popover>
      </div>

      <div
        class="menu-item color-set themeSeting"
        style="margin-left: 10rem"
        @click="handleOpenDialog"
      >
        <i class="iconfont icon-AIsheji icon" style="margin-right: 4rem"></i>
        {{ $t('headThemeSetting') }}
      </div>

      <Popover
        trigger="click"
        placement="bottom-start"
        v-model:value="downloadProp"
        :contentStyle="popoverStyle"
      >
        <template #content>
          <div class="menu-item-download" @click="handleDownload('ppt')">
            <i class="iconfont icon-a-PPTXwenjiankebianji"></i>
            <span>{{ $t('headExportPPT') }} </span>
          </div>
          <div class="menu-item-download" @click="handleDownload('pdf')">
            <i class="iconfont icon-PDF"></i>
            {{ $t('headExportPDF') }}
          </div>
          <div class="menu-item-download" @click="handleDownload('image')">
            <i class="iconfont icon-a-tupianchangtu"></i>
            {{ $t('headExportIMG') }}
          </div>
        </template>

        <div
          class="go-back"
          v-tooltip="t('headExportPPTTips')"
          style="margin-right: 0"
          @click="mainStore.setShowToolbar(false)"
        >
          <i class="iconfont icon-xiazai icon"></i>
        </div>
      </Popover>
    </div>

    <DownLoadFile v-if="showDownLoadFile" :downLoadType="downLoadType" />
    <BeautifyLoading
      :isUplaod="isUplaod"
      v-if="exporting || saveHistory.isloading"
    />
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref, onMounted, computed, reactive, onUnmounted } from 'vue'
import { IconCheckCircle } from '@arco-design/web-vue/es/icon'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore, useSnapshotStore } from '@/store'
import useScreening from '@/hooks/useScreening'
import useImport from '@/hooks/useImport'
import DownLoadFile from '@/views/components/DownLoadFile.vue'
import FileInput from '@/components/FileInput.vue'
import BeautifyLoading from '@/components/BeautifyLoading.vue'
import Input from '@/components/Input.vue'
import Popover from '@/components/Popover.vue'
import PopoverMenuItem from '@/components/PopoverMenuItem.vue'
import { nanoid } from 'nanoid'
import useAnimmation from '@/views/Screen/hooks/useAnimmation'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const snapshotStore = useSnapshotStore()

const { title, currentSlide } = storeToRefs(slidesStore)
const { actionTime } = storeToRefs(snapshotStore)

const { enterScreening, enterScreeningFromStart } = useScreening()
const { actionAnimationActive, addHoverClass } = useAnimmation()
const { importJsonFile, importPPTXFile, exporting } = useImport()
const mainMenuVisible = ref(false)
const downloadProp = ref(false)
const editingTitle = ref(false)
const titleInputRef = ref<InstanceType<typeof Input>>()
const titleValue = ref('')
const { showDownLoadFile, isAllDisableEdit, saveHistory, userToken } =
  storeToRefs(mainStore)

const isUplaod = ref(false)
const popoverStyle = reactive({
  background: 'rgb(0 0 0 / 80%)',
  color: '#fff',
  border: 'none',
  borderRadius: '10rem',
  padding: '10rem',
})

const downLoadType = ref('')

// 播放
const handlePlay = (type: string) => {
  if (currentSlide.value?.actionList?.interactionType !== 'none') {
    mainStore.setActionAnimation(true)
    addHoverClass()
    actionAnimationActive()
  }

  slidesStore.setPPTView({ type: 'default', sourceID: '' })
  mainStore.setOpenNoTokenToobal(false)
  mainStore.setShowToolbar(false)

  if (type === 'page') {
    enterScreeningFromStart()
  } else {
    enterScreening()
  }
}

// 上传美化
const handleUploadPPT = (files) => {
  slidesStore.setPPTView({ type: 'default', sourceID: '' })
  isUplaod.value = true
  const statisPathString = nanoid(10)
  mainStore.setBeautifyDataNew(null)
  sessionStorage.setItem('statisPathString', statisPathString)
  importPPTXFile(files, 'beautify')
  mainMenuVisible.value = false
}

// 上传json
const handleImportJosn = async (files) => {
  mainStore.setBeautifyDataNew(null)
  isUplaod.value = true

  importJsonFile(files)
  mainMenuVisible.value = false
}
// 上传ppt
const handleImportPPT = async (files) => {
  slidesStore.setPPTView({ type: 'default', sourceID: '' })

  isUplaod.value = true
  mainMenuVisible.value = false
  mainStore.setBeautifyDataNew(null)
  await importPPTXFile(files)
  const statisPathString = nanoid(10)
  sessionStorage.setItem('statisPathString', statisPathString)
}
const handleLogin = () => {
  if (!userToken.value) {
    mainStore.setOpenNoTokenModal(true)
  }
}
const handleDownload = async (type) => {
  if (type === 'pptx') {
    if (!userToken.value) {
      mainStore.setOpenNoTokenModal(true)
      return
    }
    type = 'ppt'
  }
  if (type === 'ppt') {
    if (!userToken.value) {
      mainStore.setOpenNoTokenModal(true)
      return
    }
  }

  downloadProp.value = false
  downLoadType.value = type
  mainStore.setShowDownLoadFile(true)
}

const handleRemov = () => {
  mainStore.setActiveElementIdList([])
  mainStore.setHandleElementId('')
}

const startEditTitle = () => {
  titleValue.value = title.value
  editingTitle.value = true
  nextTick(() => titleInputRef.value?.focus())
}

const handleUpdateTitle = () => {
  slidesStore.setTitle(titleValue.value)
  editingTitle.value = false
}

const handleOpenDialog = () => {
  mainStore.setToolbarData({
    showEmpty: false,
    type: 'themeStyle',
    useact: 'add',
    x: 0,
    y: 0,
    contentStyle: { right: '100rem', left: 'auto' },
  })
  mainStore.setShowToolbar(true)
}
</script>

<style lang="scss" scoped>
.fileBox {
  font-size: 14rem;
  .file-content {
    max-height: 320rem;
    overflow-y: auto;
    padding: 0 0 20rem;
    cursor: pointer;
    font-size: 16rem;

    .noData {
      width: 300rem;
      height: 150rem;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 14rem;
    }
  }

  .title-list {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 45rem;
    padding: 6rem 10rem;
    border-radius: 10rem;
    font-size: 14rem;

    &:hover {
      background: rgba(0, 0, 0, 0.8);
    }

    &:hover .title-name {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .title-name {
    width: 155rem;
    font-size: 14rem;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden; /* 隐藏溢出的文本 */
    margin-right: 15rem;
    cursor: pointer;
  }

  .shareUser {
    border-radius: 8rem;
    background: linear-gradient(180deg, #6040fc 0%, #e750e6 85%);
    width: 105rem;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden; /* 隐藏溢出的文本 */

    backdrop-filter: blur(10px);
    font-size: 12rem;
    color: #fff;
    font-weight: bold;
    padding: 2rem 4rem;
    margin-right: 15rem;
  }
}

.fileBox-history {
  user-select: none;
  .title-list {
    position: relative;
    &:hover .reback {
      display: block;
    }
    &:hover .file-timer {
      color: red;
    }
  }
  .file-content {
    padding-bottom: 5rem;
  }

  .file-timer {
    margin-right: 100rem;
    position: relative;
    cursor: default;
  }

  .file-new {
    position: absolute;
    right: -40rem;
    top: 0rem;
    padding: 2rem 7rem;
    border-radius: 15rem;
    font-size: 12rem;
    color: #fff;
    background: rgb(115, 187, 6);
  }

  .reback {
    position: absolute;
    right: 0;
    padding: 5rem 10rem;
    font-size: 14rem;
    background: red;
    border-radius: 15rem;
    display: none;
  }

  .more-historyList {
    text-align: right;
    font-size: 14rem;
    line-height: 40rem;
    span {
      cursor: pointer;
      padding: 10rem 15rem;
      border-radius: 10rem;
      &:hover {
        color: rgba(255, 255, 255, 0.5);
        background: rgba($color: #000000, $alpha: 0.7);
      }
      &:active {
        color: rgba(255, 255, 255, 1);
        background: rgba($color: #000000, $alpha: 0.4);
      }
    }
  }
}
.file-btn {
  padding: 10rem 5rem;
  font-size: 14rem;
  cursor: pointer;
  border-bottom: 1rem solid #d5d9dc5f;

  .file-ppt {
    padding: 8rem 10rem;
    margin-right: 10rem;
    i {
      font-size: 20rem;
    }
  }
  &:hover {
    border-radius: 10rem;
    background: rgba(0, 0, 0, 0.7);
    color: rgba(255, 255, 255, 1);
  }
  &:active {
    border-radius: 10rem;
    background: rgba(0, 0, 0, 0.5);
    color: rgba(255, 255, 255, 0.7);
  }
}
.btn-document {
  font-size: 12rem;
  user-select: none;
  color: #fffb29;
  cursor: pointer;
  padding: 5rem 15rem;
  background: rgba(0, 0, 0, 0.4);
  height: 35rem;
  border-bottom-left-radius: 10rem;
  border-bottom-right-radius: 10rem;
  display: flex;
  border-radius: 10rem;
  align-items: center;
  span:hover {
    color: #a5a305;
  }
  span:active {
    color: #6d6c07;
  }
}
.file-open {
  font-size: 14rem;
  margin: 0 20rem 0 15rem;
}
.Beta {
  background: linear-gradient(90deg, #effeff 0%, #84f936 97%);
  padding: 2rem 12rem;
  color: #137a41;
  font-weight: bold;
  border-top-left-radius: 10rem;
  border-bottom-right-radius: 10rem;
}
.editor-header {
  user-select: none;
  display: flex;
  justify-content: space-between;
  padding: 0 20rem;
  color: #fff;
}
.fileSroce {
  width: 360rem;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 15rem;
  position: absolute;
  z-index: 999;
  text-align: left;
  padding: 15rem;
  line-height: 22rem;
}
.share-btn {
  cursor: pointer;
  height: 34rem;
  background: rgba(0, 0, 0, 0.4);
  font-size: 12rem;
  padding: 4rem 10rem;
  border-radius: 8rem;
  margin: 0 10rem;
  display: flex;
  justify-content: center;
  align-items: center;
  .icon {
    margin-right: 4rem;
  }
  &:hover {
    background-color: rgba(0, 0, 0, 0.6);
  }
  &:active {
    background-color: rgba(0, 0, 0, 0.3);
  }
}
.left,
.right {
  display: flex;
  justify-content: center;
  align-items: center;
}
.go-back,
.title,
.group-menu-item,
.color-set {
  height: 34rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10rem;
  line-height: 34rem;
  margin-right: 10rem;
  &:hover {
    background-color: rgba(0, 0, 0, 0.6);
  }
  &:active {
    background-color: rgba(0, 0, 0, 0.3);
  }
}

.go-back {
  display: flex;
  padding: 0 8rem 0 6rem;
  font-size: 14rem;
  text-align: center;
  cursor: pointer;
  .icon {
    font-size: 22rem;
    color: #fff;
  }
}
.menu-item {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12rem;
  padding: 0 10rem;
  margin: 0;
  cursor: pointer;

  .icon {
    font-size: 22rem;
    color: #fff;
  }
}

.color-set {
  margin-right: 10rem;
  icon {
    margin-right: 2rem;
  }
}
.open-share-status {
  display: flex;
  align-items: center;
  margin-left: 6rem;
  i {
    font-size: 16rem;
    margin-right: 4rem;
  }
  border-radius: 4rem;
  opacity: 1;
  font-size: 12rem;
  font-weight: bold;
  /* 自动布局 */
  padding: 2rem 5rem;
  background: linear-gradient(100deg, #6040fc 0%, #e750e6 85%);
  backdrop-filter: blur(10px);
  white-space: nowrap;
}

.menu-item-download {
  display: flex;
  height: 45rem;
  align-items: center;
  cursor: pointer;
  padding: 5rem 10rem;
  border-radius: 8rem;
  &:hover {
    background-color: rgba(0, 0, 0, 0.6);
  }
  &:active {
    background-color: rgba(0, 0, 0, 0.3);
  }

  .img_svip {
    width: 54rem;
    margin-left: 20rem;
  }

  .iconfont {
    margin-right: 4rem;
  }
  .isBetaClass {
    border-top-right-radius: 4rem;
    border-bottom-left-radius: 4rem;
    border-bottom-right-radius: 15rem;
    border-top-left-radius: 15rem;
    padding: 4rem 10rem;
    margin-left: 10rem;
    opacity: 1;
    background: linear-gradient(90deg, #effeff 0%, #84f936 97%);
    font-size: 12rem;
    font-weight: bold;
    line-height: normal;
    text-align: justify; /* 浏览器可能不支持 */
    letter-spacing: -0.06em;
    font-variation-settings: 'opsz' auto;
    font-feature-settings: 'kern' on;
    color: #137a41;
  }
}
.group-menu-item {
  display: flex;
  align-items: center;
  border-radius: 10rem;

  &:hover {
    background-color: rgba(0, 0, 0, 0.6);
  }
  &:active {
    background-color: rgba(0, 0, 0, 0.3);
  }

  .menu-item {
    padding-right: 0rem;
    span {
      margin: 0 2rem;
    }
  }
  .popover {
    height: 100%;
    cursor: pointer;
    padding: 0 5rem;
  }

  .arrow-btn {
    width: 24rem;
    height: 24rem;
    border-radius: 6rem;

    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-size: 14rem;
    &:hover {
      background-color: rgba(0, 0, 0, 0.4);
    }
    &:active {
      background-color: rgba(0, 0, 0, 0.6);
    }
  }
}

.title {
  font-size: 14rem;
  padding: 0 5rem;
  display: flex;
  align-items: center;
  .line {
    width: 1rem;
    height: 12rem;
    background: rgba(255, 255, 255, 0.66);
    margin-left: 5rem;
  }

  .save-time {
    font-size: 12rem;
    color: #d5d9dc;
    margin-left: 6rem;
  }

  .title-input {
    width: 200rem;
    height: 100%;
    padding-left: 0;
    padding-right: 0;
    outline: none;
    background: transparent;
    border: none;
  }
  .title-text {
    min-width: 20rem;
    max-width: 400rem;
    line-height: 34rem;
    padding: 0 6rem;
    cursor: pointer;

    @include ellipsis-oneline();
  }
}
.github-link {
  display: inline-block;
  height: 30rem;
}
</style>
<style lang="scss">
.prop-menuItem {
  display: flex;
  align-items: center;
  padding: 10rem 20rem 10rem 5rem !important;
  text-align: left;
  &:hover {
    border-radius: 6rem;
    background: rgba(0, 0, 0, 0.9) !important;
  }
}
.layoutAround {
  justify-content: space-between;
}
.title-input {
  input {
    background: transparent;
    color: #fff !important;
    font-size: 14rem !important;
    height: 34rem !important;
  }
}
.rowSpaceBetween {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.rowAlignCenter {
  display: flex;
  align-items: center;
}

.rowColCenter {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
