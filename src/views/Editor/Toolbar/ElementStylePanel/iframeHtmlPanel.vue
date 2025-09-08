<template>
  <div class="iframe-style-panel" v-if="userToken">
    <div class="row">{{ $t('iframePool.aiIframe') }}</div>
    <div class="text-box">
      <TextArea
        v-model:value="iframeText"
        :placeholder="t('iframePool.placeholder')"
      />
      <!-- 添加文件上传输入框 -->
      <input
        type="file"
        accept=".html,.htm"
        @change="handleFileUpload"
        style="display: none"
        ref="fileInput"
      />
      <!-- 生成按钮 -->
      <div
        class="active-btn"
        :class="`active-btn${createState}`"
        @click="handleCreate"
      >
        <i class="iconfont icon-shengchengwangye" v-if="createState === 0"></i>
        <icon-loading v-else-if="createState === 1" />
        <i class="iconfont icon-yunhang" v-else-if="createState === 2"></i>
        <span class="btn-name">{{ btnName }}</span>
      </div>
      <!-- 上传按钮 -->
      <div class="active-btn-up" @click="triggerFileInput">
        <i class="iconfont icon-shangchuan"></i>
        <span class="btn-name">{{ $t('iframePool.localIframe') }}</span>
      </div>
    </div>
    <div class="row" style="margin-top: 15rem" v-if="!createState">
      {{ $t('iframePool.title') }}
    </div>
    <div class="iframe-html" :style="{ height: userToken ? '500rem' : '' }">
      <div class="iframe-list" @scroll="handleScroll" v-if="!createState">
        <div
          class="iframe-html-item"
          v-for="item in iframeList"
          :key="item"
          :class="acitveHtml === item.file_key ? 'actvie-html' : ''"
          @click="handleSetHtml(item)"
        >
          <span
            class="html-tips"
            :style="{
              color: item.example ? '#D28223' : '#675BCD',
              background: item.example ? '#FFF7E7' : '#fff',
              borderColor: item.example ? '#FFF7E7' : '#978FDB',
            }"
          >
            {{
              item.example ? t('iframePool.tips1') : t('iframePool.tips2')
            }}</span
          ><span class="html-name"> {{ item.name }}</span>
        </div>
        <div class="noDate" v-if="isEnd">{{ $t('layoutPool.nodata') }}</div>
      </div>
      <template v-else>
        <div class="code-html">html</div>
        <div class="iframe-html-code" ref="codeElement">
          <pre><code class="language-html" v-html="highlightedCode"></code></pre>
        </div>
      </template>
    </div>
  </div>
  <div class="iframe-style-panel" v-else>
    <div class="row">{{ $t('iframePool.aiIframe') }}</div>

    <div class="text-box user">
      <PoolOpenModal :visible="openNoTokenToobal" />
    </div>

    <div class="row" style="margin-top: 15rem" v-if="!createState">
      {{ $t('iframePool.title') }}
    </div>
    <div class="iframe-html" :style="{ height: userToken ? '500rem' : '' }">
      <div class="iframe-list" @scroll="handleScroll" v-if="!createState">
        <div
          class="iframe-html-item"
          v-for="item in iframeList"
          :key="item"
          :class="acitveHtml === item.file_key ? 'actvie-html' : ''"
          @click="handleSetHtml(item)"
        >
          <span
            class="html-tips"
            :style="{
              color: item.example ? '#D28223' : '#675BCD',
              background: item.example ? '#FFF7E7' : '#fff',
              borderColor: item.example ? '#FFF7E7' : '#978FDB',
            }"
          >
            {{
              item.example ? t('iframePool.tips1') : t('iframePool.tips2')
            }}</span
          ><span class="html-name"> {{ item.name }}</span>
        </div>
        <div class="noDate" v-if="isEnd">{{ $t('layoutPool.nodata') }}</div>
      </div>
      <template v-else>
        <div class="code-html">html</div>
        <div class="iframe-html-code" ref="codeElement">
          <pre><code class="language-html" v-html="highlightedCode"></code></pre>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type Ref, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import { IconLoading } from '@arco-design/web-vue/es/icon'
import TextArea from '@/components/TextArea.vue'
import { onUploads } from '@/utils/upload'
import useCommonApi from '@/hooks/useCommonApi'
import { getHtmllist, getHtmladd } from '@/api/careate'
import message from '@/utils/message'
import { isHtmlString } from '@/utils/common'
import { htmlDemo } from '@/mocks/htmlDemo'
import PoolOpenModal from '@/components/PoolOpenModal.vue'
import Prism from 'prismjs'
import 'prismjs/themes/prism-solarizedlight.css'
// 正确导入语言支持
import 'prismjs/components/prism-markup' // 基础标记语言，包括HTML
import 'prismjs/components/prism-clike' // 类C语言基础
import 'prismjs/components/prism-javascript' // JavaScript

import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { cancelRequest, fetchStreamData, streamResult, isLoading, error } =
  useCommonApi()

const { handleElement, handleElementId, userToken, openNoTokenToobal } =
  storeToRefs(mainStore)
const { addHistorySnapshot } = useHistorySnapshot()

const iframeText = ref('')
const btnName = ref(t('iframePool.create'))
const createState = ref(0) // 0生成 1 生成中 2生成成功 3生成失败
const iframeStyle = ref('none')
const iframeList = ref([])

const rawCode = ref('')
const highlightedCode = ref(null)
const codeElement = ref(null)
const acitveHtml = ref('')

watch(
  () => handleElement.value,
  (newVal) => {
    if (newVal?.type === 'iframe') {
      getHtmlList()
    }
  }
)

const handleCreate = async () => {
  if (!iframeText.value) {
    message.warning(t('iframePool.error1'))
    return
  }
  if (createState.value === 1) {
    return
  }

  if (createState.value === 0) {
    try {
      // 尝试从剪贴板读取HTML代码
      const clipboardContent = await navigator.clipboard.readText()
      // 简单检查是否为HTML内容
      if (isHtmlString(clipboardContent)) {
        rawCode.value = clipboardContent
        highlightedCode.value = Prism.highlight(
          rawCode.value,
          Prism.languages.html,
          'html'
        )
        createState.value = 2
        btnName.value = t('iframePool.runing')

        // 自动滚动到底部
        if (codeElement.value) {
          codeElement.value.scrollTop = codeElement.value.scrollHeight
        }
        return
      }
    } catch (error) {
      console.error('剪贴板读取失败:', error)
      message.warning(t('iframePool.clipboardError'))
    }

    // 如果剪贴板没有有效HTML内容，则继续AI生成流程
    createState.value = 1
    btnName.value = t('iframePool.creating')
    await fetchStreamData('/chatpptsse/writtenwords', {
      type: 'Createhtml',
      params: {
        text: iframeText.value,
      },
      version: '1',
      stream: true,
    })
  } else if (createState.value === 2) {
    const htmlStr = rawCode.value
      .replace('```html', '')
      .replace('```', '')
      .trim()
    const blob = new Blob([htmlStr], { type: 'text/html' })
    const file = new File([blob], `${iframeText.value}.html`, {
      type: 'text/html',
      lastModified: new Date().getTime(),
    })

    const res: any = await onUploads(file, 'htmlFile', '', {
      'Content-Type': 'text/html',
    })
    if (!res?.url) return { code: 500 }

    const props = {
      src: res?.url,
      oldSrc: '',
    }
    slidesStore.updateElement({ id: handleElementId.value, props })
    addHistorySnapshot()
    const titleMatch = htmlStr.match(/<title>(.*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1] : null
    const resAdd: any = await getHtmladd({
      file_key: res?.url,
      name: title || iframeText.value,
    })
    if (resAdd.code === 200) {
      acitveHtml.value = res?.url
      pageData.page = 1
      iframeList.value = []
      getHtmlList()
    }
    // 清空输入框
    iframeText.value = ''
    createState.value = 0
    btnName.value = t('iframePool.create')
    rawCode.value = ''
    highlightedCode.value = null
  }
}
const handleSetHtml = (item: any) => {
  iframeText.value = item.name
  acitveHtml.value = item.file_key
  const props = {
    src: item?.file_key,
    oldSrc: '',
  }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
const pageData: any = {
  page: 1,
  pageSize: 30,
}
const isEnd = ref(false)
const getHtmlList = async () => {
  if (!userToken.value) {
    mainStore.setOpenNoTokenToobal(true)
    const res: any[] = htmlDemo
    if (res?.length > 0) {
      const Res = res.map((item: any) => {
        return {
          ...item,
          example: true,
        }
      })
      iframeList.value = Res
    }
  } else {
    const res: any = await getHtmllist({
      page: pageData.page,
      limit: pageData.pageSize,
    })
    if (res.code === 200) {
      if (res.data.demo?.length > 0 && pageData.page === 1) {
        res.data.demo = res.data.demo.map((item: any) => {
          return {
            ...item,
            example: true,
          }
        })
        iframeList.value = res.data.demo
      }
      if (pageData.page > 1 && res.data.data.length === 0) {
        isEnd.value = true
      }
      iframeList.value = [...iframeList.value, ...res.data.data]
    }
  }
}

const handleScroll = async (event: any) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target
  // 当滚动到底部时加载更多数据
  if (scrollHeight - scrollTop - clientHeight < 2) {
    pageData.page++
    getHtmlList()
  }
}

// 组件卸载时取消请求
onBeforeUnmount(cancelRequest)

onMounted(() => {
  getHtmlList()
})
watch(
  handleElement,
  () => {
    iframeStyle.value = handleElement.value?.style || 'none'
  },
  { deep: true, immediate: true }
)

watch(
  streamResult,
  (newValue) => {
    if (newValue.errCode === 0) {
      rawCode.value = newValue?.content
      highlightedCode.value = Prism.highlight(
        rawCode.value,
        Prism.languages.html,
        'html'
      )
      // 自动滚动到底部
      if (codeElement.value) {
        codeElement.value.scrollTop = codeElement.value.scrollHeight
      }
    } else if (newValue.errCode === 200) {
      createState.value = 2
      btnName.value = t('iframePool.runing')
    }
  },
  { deep: true }
)

// 添加文件上传相关引用
const fileInput = ref<HTMLInputElement | null>(null)

// 触发文件选择对话框
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
    // 重置文件输入，允许重复上传同一文件
    fileInput.value.value = ''
  }
}

// 处理文件上传
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    try {
      // 读取文件内容
      const reader = new FileReader()
      reader.onload = async (e) => {
        if (e.target?.result) {
          const htmlContent = e.target.result as string
          // 更新代码展示
          rawCode.value = htmlContent
          highlightedCode.value = Prism.highlight(
            htmlContent,
            Prism.languages.html,
            'html'
          )
          // 更新状态为可运行
          createState.value = 2
          btnName.value = t('iframePool.runing')
          // 提取文件名作为iframeText
          iframeText.value = file.name.replace(/\.html?$/, '')
          // 自动滚动到代码底部
          if (codeElement.value) {
            codeElement.value.scrollTop = codeElement.value.scrollHeight
          }

          // 自动上传并应用HTML内容
          try {
            const htmlStr = rawCode.value.trim()
            const blob = new Blob([htmlStr], { type: 'text/html' })
            const uploadFile = new File([blob], file.name, {
              type: 'text/html',
              lastModified: new Date().getTime(),
            })

            const res: any = await onUploads(uploadFile, 'htmlFile', '', {
              'Content-Type': 'text/html',
            })
            if (!res?.url) {
              message.error(t('iframePool.uploadError'))
              return
            }
            const props = {
              src: res?.url,
              oldSrc: '',
            }
            slidesStore.updateElement({ id: handleElementId.value, props })
            addHistorySnapshot()
            const titleMatch = htmlStr.match(/<title>(.*?)<\/title>/i)
            const title = titleMatch ? titleMatch[1] : null
            const resAdd: any = await getHtmladd({
              file_key: res?.url,
              name: title || iframeText.value,
            })
            if (resAdd.code === 200) {
              acitveHtml.value = res?.url
              pageData.page = 1
              iframeList.value = []
              getHtmlList()
            }

            // 重置状态
            iframeText.value = ''
            createState.value = 0
            btnName.value = t('iframePool.create')
            rawCode.value = ''
            highlightedCode.value = null
          } catch (error) {
            message.error(t('iframePool.uploadError'))
            // 重置状态
            createState.value = 0
            btnName.value = t('iframePool.create')
          }
        }
      }
      reader.readAsText(file)
    } catch (error) {
      message.error(t('iframePool.uploadError'))
    }
  }
}
</script>

<style lang="scss" scoped>
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10rem;
}
.noDate {
  text-align: center;
  color: #b0adad;
}
.iframe-style-panel {
  .text-box {
    position: relative;
    .textarea {
      padding-bottom: 35rem;
    }
  }
  .user {
    position: relative;
    height: 400rem;
    border-radius: 6px;
    opacity: 1;
    overflow: hidden;
    border: 1px solid #dddaff;
    .textarea {
      padding-bottom: 35rem;
    }
  }
  .active-btn {
    position: absolute;
    bottom: 10rem;
    right: 10rem;
    padding: 6rem 14rem;
    border-radius: 5rem;
    font-size: 14rem;
    background: $themeColor;
    color: #fff;
    cursor: pointer;
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
    i {
      font-size: 16rem;
    }
    .btn-name {
      margin-left: 8rem;
    }
    &:hover {
      background: darken($themeColor, 10%);
    }
    &:active {
      background: #d8d8d8;
    }
  }
  .active-btn-up {
    position: absolute;
    bottom: 10rem;
    left: 10rem;
    font-size: 14rem;
    padding: 6rem 14rem;
    border-radius: 5rem;
    background: $themeColor;
    color: #fff;
    cursor: pointer;
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
    i {
      font-size: 14rem;
    }
    .btn-name {
      margin-left: 8rem;
    }
    &:hover {
      background: darken($themeColor, 10%);
    }
    &:active {
      background: #d8d8d8;
    }
  }
  .active-btn1 {
    background: #d8d8d8;
    color: #fff;
    cursor: default;
    &:hover {
      background: #d8d8d8;
    }
  }
}
.iframe-html {
  margin-top: 10rem;
  .iframe-html-item {
    display: flex;
    padding: 8rem 4rem;
    margin: 2rem 0;
    align-items: center;
    font-size: 12rem;
    border-radius: 5rem;
    color: #7b7777;

    &:hover {
      background: #e5e3ff;
      .html-name {
        color: #000;
      }
    }
  }

  .iframe-list {
    height: 100%;
    overflow: auto;
  }
  .actvie-html {
    background: #e5e3ff;
    .html-name {
      color: #000;
    }
  }
  .html-tips {
    border-radius: 4rem;
    background: #dddbdb;
    margin-right: 10rem;
    height: 20rem;
    font-weight: bold;
    text-align: center;
    line-height: 20rem;
    width: 70rem;
    font-size: 12rem;
    border-width: 1rem;
    border-style: solid;
  }
  .html-name {
    flex: 1;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden; /* 隐藏溢出的文本 */
    cursor: pointer;
    font-size: 14rem;
  }
  .iframe-html-code {
    background: #fafbff;
    box-sizing: border-box;
    border-: 1px solid #dddaff;
    width: 100%;
    height: calc(100% - 42rem);
    overflow: auto;
    border-radius: 0 0 10rem 10rem;
    border: 1px solid #dddaff;
    padding: 10rem;
    color: #fff;
  }
  .code-html {
    background: #eceef7;
    box-sizing: border-box;
    border-radius: 10rem 10rem 0 0;
    border: 1px solid #dddaff;
    border-bottom: 0;
    font-size: 12rem;
    padding: 10rem 10rem;
    color: #7985ba;
  }
}
</style>
