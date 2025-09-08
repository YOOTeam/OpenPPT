<template>
  <div
    class="element-toolbar-element"
    :style="{ height: isFirstBox ? '300rem' : '374rem' }"
  >
    <template v-if="isFirstBox">
      <div class="mode-tips-title toolbar-title-mobile">
        <span> 插入幻灯片元素</span>
      </div>
      <template v-for="item in selectList" :key="item">
        <template v-if="item.type === 'image'">
          <FileInput
            @change="(files) => insertImageElement(files)"
            class="select-list"
          >
            <span><i class="iconfont" :class="item.icon"></i></span>
            <p>{{ item.name }}</p>
          </FileInput>
        </template>
        <div v-else @click="handleElement(item.type)" class="select-list">
          <span><i class="iconfont" :class="item.icon"></i></span>
          <p>{{ item.name }}</p>
          <div class="rightRow" v-if="item.type === 'shape'">
            <IconRight class="icon" />
          </div>
        </div>
      </template>
    </template>
    <template v-else>
      <div class="mode-tips-title toolbar-title-mobile">
        <span>选择形状：</span>
      </div>
      <div class="shape-pool">
        <div class="category" v-for="item in SHAPE_LIST()" :key="item.type">
          <div class="shape-list">
            <ShapeItemThumbnail
              class="shape-item"
              v-for="(shape, index) in item?.children"
              :key="index"
              :shape="shape"
              @click="insertShapeElement(shape)"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import useCreateElement from '@/hooks/useCreateElement'
import { getImageDataURL } from '@/utils/image'
import FileInput from '@/components/FileInput.vue'
import { type ShapePoolItem, SHAPE_LIST } from '@/configs/shapes'
import ShapeItemThumbnail from '@/views/Editor/RightToobar/ShapeItemThumbnail.vue'

import { onUploads } from '@/utils/upload'
import message from '@/utils/message'

const mainStore = useMainStore()
const { userToken } = storeToRefs(mainStore)

const slidesStore = useSlidesStore()
const { viewportRatio, viewportSize } = storeToRefs(slidesStore)

const { createTextElement, createImageElement, createShapeElement } =
  useCreateElement()

const isFirstBox = ref(true)
const selectList = reactive([
  {
    name: '文本      ',
    icon: 'icon-wenben',
    type: 'text',
  },
  {
    name: '图片',
    icon: 'icon-tupian',
    type: 'image',
  },
  {
    name: '图形',
    icon: 'icon-xingzhuang',
    type: 'shape',
  },
])

const handleElement = (type: string) => {
  if (type === 'text') {
    insertTextElement()
  } else if (type === 'shape') {
    isFirstBox.value = false
  }
}
const insertTextElement = () => {
  const width = 400
  const height = 66

  createTextElement(
    {
      left: (viewportSize.value - width) / 2,
      top: (viewportSize.value * viewportRatio.value - height) / 2,
      width,
      height,
    },
    { content: '<p>新添加文本</p>' }
  )
}

const insertImageElement = async (files: FileList) => {
  if (!files || !files[0]) return

  if (userToken.value) {
    message.info('正在上传中，请稍后...', { duration: 600000 })
    const res = await onUploads(files[0], 'image')
    if (res.url) {
      createImageElement(res.url)
      message.closeAll()
    } else {
      message.closeAll()
      message.error('上传失败')
    }
  } else {
    getImageDataURL(files[0]).then((dataURL) => createImageElement(dataURL))
  }
}

const insertShapeElement = (shape: any) => {
  const square: ShapePoolItem = {
    viewBox: [200, 200],
    path: 'M 0 0 L 200 0 L 200 200 L 0 200 Z',
  }
  const round: ShapePoolItem = {
    viewBox: [200, 200],
    path: 'M 100 0 A 50 50 0 1 1 100 200 A 50 50 0 1 1 100 0 Z',
  }
  const size = 200
  createShapeElement(
    {
      left: (viewportSize.value - size) / 2,
      top: (viewportSize.value * viewportRatio.value - size) / 2,
      width: size,
      height: size,
    },
    shape
  )
}
</script>
<style lang="scss" scope>
.element-toolbar-element {
  padding: 10rem;
  height: 200rem;
  @include mobile-element-toolber();
  .shape-pool {
    width: 100%;
    height: 300rem;
    overflow: auto;
    margin-bottom: 10rem;
    border-radius: 6rem;
    padding: 0;
    box-sizing: border-box;
  }
  .shape-list {
    @include flex-grid-layout();
  }
  .shape-item {
    @include flex-grid-layout-children(10, 14%);
    height: 0;
    padding-bottom: 14%;
    flex-shrink: 0;
  }

  .select-list {
    font-size: 18rem;
    display: flex;
    align-items: center;
    padding: 11rem 10rem;
    position: relative;
    i {
      font-size: 34rem;
      margin-right: 5rem;
      color: #6f6f66;
    }
    &:last-child {
      border-bottom: none;
    }

    .rightRow {
      width: 30rem;
      position: absolute;
      right: 0;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon {
      font-size: 18rem;
    }
  }
}
</style>
