<template>
  <div
    class="element-toolbar-file"
    :style="{ height: fileStyle === 'important' ? '284rem' : '264rem' }"
  >
    <template v-if="fileStyle === 'important'">
      <div v-for="item in importantList" :key="item" class="file-list">
        <span><i class="iconfont" :class="item.icon"></i></span>
        <div>
          <p style="font-size: 18rem">{{ item.name }}</p>
          <p style="font-size: 14rem; color: #999; margin-top: 2rem">
            {{ item.tips }}
          </p>
        </div>
      </div>
    </template>
    <template v-if="fileStyle === 'download'">
      <div
        v-for="item in downloadList"
        :key="item"
        class="file-list"
        @click="download(item.type)"
      >
        <span><i class="iconfont" :class="item.icon"></i></span>
        <p>{{ item.name }}</p>
      </div>
    </template>
  </div>
</template>
<script lang="ts" setup>
import { reactive } from 'vue'

defineProps<{
  fileStyle?: string
  download: (type: string) => void
}>()

const importantList = reactive([
  {
    name: '上传/导入为云文档',
    tips: '支持多端（PC网页、移动H5、小程序等）实时编辑，协同编辑更轻松',
    icon: 'icon-AIyuntufenxi ',
  },
  {
    name: '上传PPT智能美化',
    tips: '可满足基于你的文档PPT一键智能美化，AI自动美化',
    icon: 'icon-AIzhishiwenda',
  },
  {
    name: '导入文件生成PPT',
    tips: '支持pdf、word、xmind、图片等超过30种文件类型生成PPT',
    icon: 'icon-AIzhuanPDF',
  },
])

const downloadList = reactive([
  {
    name: '下载PPTX文件（支持Office编辑）',
    icon: 'icon-a-PPTXwenjiankebianji',
    type: 'ppt',
  },
  {
    name: '文件导出为PDF文件',
    icon: 'icon-PDF',
    type: 'pdf',
  },
  {
    name: '文件导出为长图文件',
    icon: 'icon-a-tupianchangtu',
    type: 'png',
  },
])
</script>
<style lang="scss">
.element-toolbar-file {
  padding: 10rem;
  @include mobile-element-toolber();

  .file-list {
    font-size: 18rem;
    display: flex;
    align-items: center;
    padding: 16rem 10rem;
    i {
      font-size: 34rem;
      margin-right: 5rem;
      color: #6f6f66;
    }
    &:last-child {
      border-bottom: none;
    }
  }
}
</style>
