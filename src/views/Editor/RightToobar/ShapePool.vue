<template>
  <div class="shape-pool">
    <div class="mode-tips-title">
      <span> {{ $t('toolbar.addShape') }} </span>
    </div>
    <div class="drageModal-title">{{ $t('toolbar.customeDrawer') }}</div>
    <div class="flex">
      <div class="shap-btn" @click="selectShapeCustome">
        {{ $t('toolbar.drawer') }}
      </div>
      <div class="more-upload">
        <FileInput
          accept="image/svg+xml"
          class="file-btn"
          @change="(files) => fileUpload(files)"
          v-if="uploadType === 'file'"
        >
          <span>{{ $t('toolbar.uploadSvg') }}</span>
        </FileInput>
        <div class="file-btn" v-else>
          {{
            uploadType === 'url'
              ? $t('shapePool.uploadTypeUrl')
              : $t('shapePool.uploadTypeCode')
          }}
        </div>
        <div class="more-upload-icon">
          <i
            class="iconfont icon-jiantou_liebiaozhankai_o"
            :class="showUploadType ? 'open_list' : ''"
            @click="showUploadType = !showUploadType"
          ></i>
          <div class="mroe-upload-Type" v-if="showUploadType">
            <FileInput
              accept="image/svg+xml"
              class="upload-item"
              @change="(files) => fileUpload(files)"
            >
              <span>{{ $t('toolbar.uploadSvg') }}</span>
            </FileInput>
            <div class="upload-item" @click="handleUploadType('url')">
              {{ $t('shapePool.uploadTypeUrl') }}
            </div>
            <div class="upload-item" @click="handleUploadType('code')">
              {{ $t('shapePool.uploadTypeCode') }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showTextArea">
      <div class="drageModal-title">
        {{
          uploadType === 'url'
            ? $t('shapePool.uploadTypeUrl')
            : $t('shapePool.uploadTypeCode')
        }}
      </div>
      <TextArea
        class="text-area"
        v-model:value="textAreaValue"
        :placeholder="t('shapePool.placeholder')"
      ></TextArea>
      <div style="text-align: right; margin-top: 10rem">
        <Button style="flex: 1" @click="setSvgContent">{{
          $t('broaDside.confirm')
        }}</Button>
      </div>
    </div>

    <LinePool @select="handleLine" />
    <div class="category" v-for="item in SHAPE_LIST()" :key="item.type">
      <div class="shape-names">{{ item.type }}</div>
      <div class="shape-list">
        <ShapeItemThumbnail
          class="shape-item"
          v-for="(shape, index) in item.children"
          :key="index"
          :shape="shape"
          @click="selectShape(shape)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import { SHAPE_LIST, type ShapePoolItem } from '@/configs/shapes'
import type { LinePoolItem } from '@/configs/lines'
import ShapeItemThumbnail from './ShapeItemThumbnail.vue'
import LinePool from './LinePool.vue'
import { getSvgPathRange } from '@/utils/svgPathParser'
import FileInput from '@/components/FileInput.vue'
import { getSvgContent } from '@/utils/image'
import useCreateElement from '@/hooks/useCreateElement'
import { useI18n } from 'vue-i18n'
import TextArea from '@/components/TextArea.vue'
import Button from '@/components/Button.vue'
import { fetchUrl } from '@/utils/common'
import message from '@/utils/message'
import useSvgStyle from '@/hooks/useSvgStyle'

const { t } = useI18n()
const { returnNewShape } = useSvgStyle()
const { createShapeElement } = useCreateElement()
const slidesStore = useSlidesStore()
const { viewportRatio, viewportSize } = storeToRefs(slidesStore)
const emit = defineEmits<{
  (event: 'select', payload: ShapePoolItem): void
  (event: 'selectLine', payload: LinePoolItem): void
  (event: 'selectCustome'): void
}>()

const selectShape = (shape: ShapePoolItem) => {
  emit('select', shape)
}

const selectShapeCustome = () => {
  emit('selectCustome')
}
const handleLine = (line: LinePoolItem) => {
  emit('selectLine', line)
}

const textAreaValue = ref('')
const setSvgContent = async () => {
  try {
    if (textAreaValue.value.trim() === '') {
      return
    }
    let content: any = ''
    if (uploadType.value === 'url') {
      content = await fetchUrl(textAreaValue.value)
    } else {
      content = textAreaValue.value.replace(/\\"/g, '"').replace(/\\n/g, '\n')
    }
    svgSave(content)
  } catch (error) {
    if (uploadType.value === 'url') {
      message.error('无法获取资源数据')
    } else {
      message.error('SVG代码格式错误')
    }
  }
}

const showUploadType = ref(false)
const uploadType = ref('file')
const showTextArea = ref(false)
const fileUpload = async (files: FileList) => {
  showTextArea.value = false
  showUploadType.value = false
  uploadType.value = 'file'
  const imageFile = files[0]
  if (!imageFile) return
  getSvgContent(imageFile).then((dataURL) => {
    svgSave(dataURL)
  })
}

const svgSave = (dataURL: string) => {
  if (!dataURL || dataURL.trim() === '') {
    return
  }
  const shape = returnNewShape(dataURL)
  const position = {
    width: 100,
    height: 100,
    left: (viewportSize.value - 100) / 2,
    top: (viewportSize.value * viewportRatio.value - 100) / 2,
  }
  createShapeElement(position, shape, { attrArry: shape.attrArry || [] })
}

const handleUploadType = (type: string) => {
  uploadType.value = type
  showUploadType.value = false
  showTextArea.value = true
  textAreaValue.value = ''
}
</script>

<style lang="scss" scoped>
.shape-pool {
  @include drage-modal-layout();
}
.text-area {
  outline: 0;
  width: 100%;
  background-color: #fff;
  border: 1px solid #dddaff;
}
.file-btn {
  display: inline-block;
  padding: 7rem 15rem;
  background: #fff;
  cursor: pointer;
  border-top-left-radius: 6rem;
  border-bottom-left-radius: 6rem;

  color: $themeColor;
  &:hover {
    background: #ebe9fd;
    color: $themeColor;
  }

  &:active {
    background: $themeColor;
    color: #fff;
  }
}

.flex {
  margin: 15rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .shap-btn {
    padding: 7rem 10rem;
  }
}

.shap-btn {
  margin-right: 10rem;
  display: inline-block;
  padding: 7rem 15rem;
  background: #fff;
  cursor: pointer;
  border-radius: 6rem;
  border: 1px solid $lightColor;
  color: $themeColor;
  &:hover {
    background: #ebe9fd;
    color: $themeColor;
  }

  &:active {
    background: $themeColor;
    color: #fff;
  }
}

.shape-names {
  width: 100%;
  font-size: 14rem;
  color: #3d3d3d;
  margin: 10rem 0;
}

.shape-list {
  @include flex-grid-layout();
}

.shape-item {
  @include flex-grid-layout-children(10, 8%);

  height: 0;
  padding-bottom: 8%;
  flex-shrink: 0;
}
</style>
<style lang="scss">
.more-upload {
  border-radius: 6rem;
  display: flex;
  border: 1px solid $lightColor;
  justify-content: space-between;
  .more-upload-icon {
    display: flex;
    align-items: center;
    cursor: pointer;
    position: relative;
    border-top-right-radius: 6rem;
    border-bottom-right-radius: 6rem;

    .iconfont {
      font-size: 26rem;
      color: $lightColor;
      transition: transform 0.3s;
      &:hover {
        font-weight: bold;
        color: $themeColor;
      }
    }

    .open_list {
      transform: rotate(180deg);
    }
  }

  .mroe-upload-Type {
    position: absolute;
    width: 160rem;
    right: 0;
    top: 40rem;
    background: #fff;
    border-radius: 10rem;
    box-shadow: 0 0 10rem rgba(0, 0, 0, 0.1);
    padding: 10rem;
    z-index: 2;
    .upload-item {
      padding: 8rem 4rem;
      cursor: pointer;
      text-align: left;
      &:hover {
        background: $lightColor;
        border-radius: 5rem;
      }
    }
  }
}
</style>
