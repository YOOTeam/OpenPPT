<template>
  <div class="MobileChat" @click="handleClose">
    <div class="mobile-chat-content chatScroll">
      <div class="isSpeack" v-if="status !== 'apiEnd'">
        <img class="imgbox" src="@/assets/image/audioActive.gif" alt="" />

        <template v-if="recordTime > 0.5">
          <p class="mobile-chat-tips" v-if="recorder && status === 'start'">
            <span>{{ formattedRecordTime }}</span>
          </p>
          <p class="mobile-chat-tips">松开即确认，上滑取消</p>
        </template>
      </div>

      <div v-for="(item, index) in chatList" :key="index">
        <DialgoCard :cardData="item" />
      </div>
    </div>

    <div class="mobile-chat-footer">
      <!-- <div class="closeBtn" @click="handleClose">关闭</div> -->

      <template v-if="status === 'apiEnd'">
        <div
          class="mobile-chat-btn"
          @touchstart.prevent="handleStart"
          @touchend="handleEnd"
        >
          <i class="iconfont icon-yuyin-01 icon"></i>
          <span class="Chat-title"> AI Chat </span>
        </div>
      </template>

      <div class="mobile-chat-btn" v-else @click.stop @touchstart.prevent>
        <div class="drop"></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
  reactive,
  nextTick,
} from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import message from '@/utils/message'
import Recorder from 'js-audio-recorder'
import { audio2text, ChatInstructions } from '@/api/careate'
import DialgoCard from '@/components/Chat/DialgoCard.vue'
import { nanoid } from 'nanoid'

const chatList = reactive([])
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { slideIndex, slides } = storeToRefs(slidesStore)
const { chatInfo, useInfo, mobileChangeMode } = storeToRefs(mainStore)
const loading = ref(false)
const recorder = ref(null)
const isRecording = ref(false)
const recordStartTime = ref(null)
const recordTimeInterval = ref(null)

const timer = ref(null)
const recordTime = ref(0)
const playTime = ref(0)
const status = ref('')
const isAction = ref('')

const formattedRecordTime = computed(() => {
  return Math.floor(recordTime.value) + 's'
})
const initAduio = () => {
  loading.value = true
  recorder.value = new Recorder({
    sampleBits: 16, // 采样位数，支持 8 或 16，默认是 16
    sampleRate: 16000, // 采样率，支持 11025、16000、22050、24000、44100、48000，根据浏览器默认值，Chrome 是 48000
    numChannels: 1, // 声道数，支持 1 或 2， 默认是 1
  })
  Recorder.getPermission().then(
    () => {
      loading.value = false
      recorder.value.start() // 开始录音
    },
    (error) => {
      loading.value = false
      message.info('请先允许该网页使用麦克风')
    }
  )
}
const initData = () => {
  isRecording.value = false
  if (recorder.value) {
    recorder.value.destroy().then(() => {
      recorder.value = null
    })
  }
  recordTime.value = 0
  playTime.value = 0
  clearTimeout(timer.value)
  clearTimeout(recordStartTime.value)
  clearInterval(recordTimeInterval.value)
}
const handleStart = () => {
  if (isAction.value) return
  startAduio()
}

const handleEnd = () => {
  if (isAction.value) return
  endAduio()
}
// 按钮按住事件
const startAduio = () => {
  status.value = 'start'
  isRecording.value = true
  recordStartTime.value = Date.now()
  updateRecordTime()
  recorder.value = new Recorder({
    sampleBits: 16, // 采样位数，支持 8 或 16，默认是 16
    sampleRate: 16000, // 采样率，支持 11025、16000、22050、24000、44100、48000，根据浏览器默认值，Chrome 是 48000
    numChannels: 1, // 声道数，支持 1 或 2， 默认是 1
  })
  Recorder.getPermission().then(
    () => {
      recorder.value.start() // 开始录音
    },
    (error) => {
      isAction.value = false
      handleClose()
    }
  )
}

const updateRecordTime = () => {
  recordTimeInterval.value = setInterval(() => {
    if (isRecording.value) {
      recordTime.value = (Date.now() - recordStartTime.value) / 1000
    }
  }, 1000) // 每100毫秒更新一次录音时间
}
// 按钮松开事件
const endAduio = async () => {
  isRecording.value = false
  // 停止更新录音时间
  clearInterval(recordTimeInterval.value)
  // 这里可以添加停止录音和处理录音文件的逻辑

  if (recorder.value === null || recorder.value.duration === 0) {
    message.info('请长按开启语音识别！')
    timer.value = null
    isAction.value = false
    handleClose()
    return false
  }
  recorder.value.stop() // 暂停录音
  timer.value = null

  const blob = recorder.value.getPCMBlob() // 获取 pcm 格式音频数据

  let baseFile = await Audiobase64(blob)

  baseFile = baseFile
    ? baseFile.replace('data:application/octet-stream;base64,', '')
    : ''
  isAction.value = false
  status.value = 'apiEnd'
  const params = {
    vendor: 'baidu',
    audio: baseFile,
    length: blob.size,
    rate: 16000,
    format: 'pcm',
  }
  let text = ''
  const result = await audio2text(params)
  if (result.code === 200) {
    text = result.data.content
  }
  handleSendSearch(text)
  initData()
}

const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const Audiobase64 = (file: any) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      resolve(reader.result as string)
    })
    reader.readAsDataURL(file)
  })
}
// 解析的文本 转化为指令
const handleSendSearch = async (val) => {
  const ask = {
    content: {
      custom_json: { name: 'ChatPPT', source: 1 },
      text: val || '...',
      type: '',
      description: '',
    },
    questionType: 'question',
    created_at: '1725440004',
    show_time: '',
    id: nanoid(5),
  }
  chatList.push(ask)
  nextTick(() => {
    const box = document.querySelector('.chatScroll')
    box.scrollTo(0, box.scrollHeight - box.clientHeight)
  })
  // 回答
  const feedBackInfo = {
    content: {
      custom_json: { name: 'ChatPPT', source: 0 },
      type: '',
      text: 'sorry，由于目前仅开放了部分指令能力，尼克暂时无法执行你的指令要求（但你的需求已经被收录），AI还在持续学习中...',
      description: '你可以尝试一些其他的要求或者操作',
    },
    created_at: '1725440004',
    show_time: '',
    id: nanoid(5),
    isLoading: true,
    questionType: 'request',
  }
  let chatInfoRes = null
  let feedBackData = null
  if (val) {
    setTimeout(() => {
      chatList.push(feedBackInfo)
      feedBackData = chatList.find((item) => item.id === feedBackInfo.id)
    }, 200)
    // 获取指令数据
    const res = await ChatInstructions({
      text: val,
      distribute: 'False',
      intent_model: 'model',
    })
    if (res.code === 200) {
      chatInfoRes = res.data
    } else {
      feedBackData.isLoading = false
    }
  } else {
    feedBackInfo.isLoading = false
    await delay(300)
    chatList.push(feedBackInfo)
  }
  // 返回的信息
  if (chatInfoRes) {
    handleFeedBack(chatInfoRes, feedBackData)
    feedBackData.isLoading = false
  }
  nextTick(() => {
    const box = document.querySelector('.chatScroll')
    box.scrollTo(0, box.scrollHeight - box.clientHeight)
  })
}

// 更新返回的信息
const handleFeedBack = (chatInfo: any, feedBackInfo: any) => {
  const params = chatInfo.params
  if (params) {
    let isSuccss = false
    // 指令转化 更改主题色
    if (params?.property?.themeColor && !params?.property?.style) {
      // 更改主题色
      feedBackInfo.action = {
        type: 'themeColor',
        isAllPage: true,
        value: params.property.themeColor,
      }
      isSuccss = true
    } else if (
      (params?.feature?.layout === '美化排版' && !params?.property?.style) ||
      (params?.feature?.layout === '单页美化' && !params?.property?.style)
    ) {
      // 更改模版 分为单页美化 全文美化
      feedBackInfo.action = {
        type: 'pageBeautify',
        isAllPage: false,
        num: 0,
      }
      // 1.第一种情况 有单位 如第一页 1页
      // 第一种情况 过滤单位 是否大于ppt章节数
      const unit: any = params?.property?.unit
      if (unit) {
        if (unit.indexOf('全部') > -1) {
          feedBackInfo.action.isAllPage = true
          isSuccss = true
        } else {
          let pageNum = unit.replace(/\D/g, '')
          if (pageNum) {
            feedBackInfo.action.num = Number(pageNum)
          } else {
            pageNum = extractAndConvertChineseNumbers(unit)
            if (pageNum?.length) {
              feedBackInfo.action.num = pageNum[0]
            }
          }
          isSuccss = true
        }
      } else {
        const pageKey = ['章节页', '目录页', '结束页', '封面页']
        // 2.第二种情况 无单位 指定页面 当前页 结束页 封面页等  全文。。。
        // 第二种情况需要考虑
        // 1.当前页面 是否是在编辑页/预览页
        if (
          params?.property?.page?.indexOf('当前页') > -1 ||
          params?.property?.page?.indexOf('指定页') > -1 ||
          params?.object?.page?.indexOf('普通页面') > -1 ||
          params?.object?.ppt?.indexOf('PPT') > -1 ||
          (!params?.property && !params?.object)
        ) {
          if (mobileChangeMode.value === 'preview') {
            feedBackInfo.action = {
              type: 'pageBeautify',
              isAllPage: false,
              num: 0,
            }
          } else {
            feedBackInfo.action = {
              type: 'pageBeautify',
              isAllPage: false,
              num: slideIndex.value,
            }
          }
          isSuccss = true
        } else if (params?.property?.page?.indexOf('全部') > -1) {
          feedBackInfo.action.isAllPage = true
          feedBackInfo.action.num = 0
          isSuccss = true
        } else if (
          pageKey.includes(params?.property?.page) ||
          pageKey.includes(params?.object?.page)
        ) {
          // 2.结束页，封面页 等 判断是否有封面页面 等 有 美化
          const type = params?.property?.page || params?.object?.page
          let flage = ''
          switch (type) {
            case '封面页':
              flage = 'cover'
              break
            case '结束页':
              flage = 'end'
              break
            case '目录页':
              flage = 'catalog'
              break
            case '章节页':
              flage = 'chapter'
              break
            default:
              break
          }
          feedBackInfo.action = {
            type: 'pageBeautify',
            isAllPage: false,
            pagesName: type,
            flage,
          }
          isSuccss = true
        }
      }
    } else if (params?.feature?.layout === '全文美化') {
      // 更改模版全文美化
      feedBackInfo.action = {
        type: 'pageBeautify',
        isAllPage: true,
        num: 0,
      }
      isSuccss = true
    } else if (params?.property?.style) {
      // 更改主题 风格 属于全文美化
      feedBackInfo.action = {
        type: 'style',
        isAllPage: true,
        value: params.property.style,
      }
      if (params.property.themeColor) {
        feedBackInfo.action.color = params.property.themeColor.replace('系', '')
      }
      isSuccss = true
    }

    if (isSuccss) {
      feedBackInfo.content.text = `我们将为你进行${chatInfo.operation}服务，请确认是否继续进行？`
      feedBackInfo.content.description = '可以语音回复确认或者点击“确认”'
      feedBackInfo.content.actionBtn = [
        {
          name: '确认',
          actionFn: (val, card) => handleSure(val, card),
          type: 'primary',
        },
      ]
    }
  }
}

const chineseToArabicMap: { [key: string]: number } = {
  零: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  百: 100,
  千: 1000,
  万: 10000,
  亿: 100000000,
}

const chineseNumberPattern = /[\u4e00-\u9fa5]+/g

function convertChineseToArabic(chineseNumber: string): number {
  let result = 0
  let section = 0
  let unit = 1
  let lastUnit = 1
  for (let i = chineseNumber.length - 1; i >= 0; i--) {
    const char = chineseNumber[i]
    const value = chineseToArabicMap[char]

    if (i === 0) {
      if (section < lastUnit) {
        section += lastUnit
      }
    }

    if (!value) continue
    if (value >= 10) {
      if (value > lastUnit) {
        unit = value
      } else {
        unit *= value
      }
    } else {
      section += value * unit
    }

    lastUnit = value
    if (unit >= 10000) {
      result += section
      section = 0
      unit = 1
    }
  }

  result += section
  return result
}

// 将文本的中文 ，数字提取出来
function extractAndConvertChineseNumbers(input: string): number[] {
  const matches = input.match(chineseNumberPattern)
  if (!matches) return []
  return matches.map((match) => convertChineseToArabic(match))
}

const handleSure = (value: any, card: any) => {
  const ask = {
    content: {
      custom_json: { name: 'ChatPPT', source: 1 },
      text: '确定',
      type: '',
      description: '',
      questionType: 'question',
    },

    created_at: '1725440004',
    show_time: '',
  }
  chatList.push(ask)
  nextTick(() => {
    const box = document.querySelector('.chatScroll')
    box.scrollTo(0, box.scrollHeight - box.clientHeight)
  })
  setTimeout(() => {
    const feedBackInfo = {
      content: {
        custom_json: { name: 'ChatPPT', source: 0 },
        text: 'AI即将为你启动创作服务...',
      },
      created_at: '1725440004',
      show_time: '',
      questionType: 'request',
    }
    chatList.push(feedBackInfo)
    setTimeout(() => {
      hadleCloseBox(card)
    }, 1000)
    nextTick(() => {
      const box = document.querySelector('.chatScroll')
      box.scrollTo(0, box.scrollHeight - box.clientHeight)
    })
  }, 300)
}

const hadleCloseBox = (data?: any) => {
  handleClose()
  mainStore.setMobileChatResule(data)
}

const fetchData = async (url) => {
  const context = new (window.AudioContext || window.webkitAudioContext)()
  let sample_rate = 1600
  try {
    const response = await fetch(url)
    const buffer: any = await response.arrayBuffer()
    const audioBuffer = await context.decodeAudioData(buffer)
    const sampleRate = audioBuffer.sampleRate
    sample_rate = sampleRate
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
  return sample_rate
}

watch(
  chatInfo,
  () => {
    status.value = chatInfo.value.status
    if (chatInfo.value.status === 'start') {
      isAction.value = true
      startAduio()
    } else if (chatInfo.value.status === 'end') {
      isAction.value = true
      endAduio()
    }
  },
  { deep: true }
)

const handleClose = () => {
  mainStore.setShowMobileChat(false)
}
onMounted(() => {})

onUnmounted(() => {
  clearInterval(recordTimeInterval.value)
  initData()
})
</script>
<style lang="scss">
.MobileChat {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 99;
  background: rgba($color: #000000, $alpha: 0.9);
  .mobile-chat-content {
    height: calc(100% - 108rem);
    padding: 30rem 20rem;
    overflow-y: auto;
    font-size: 12rem;
    position: relative;
  }
  .chat-steam-drum .chat-steam-box {
    border: none;
  }
  .drop {
    position: relative;
    width: 10rem;
    height: 10rem;
    background-color: rgba(0, 0, 255, 0.949);
    border-radius: 50%;
    animation: ripple 2s infinite;
  }

  .drop::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    animation: ripple-wave 2s infinite;
  }

  @keyframes ripple {
    0% {
      opacity: 0.5;
      width: 0;
      height: 0;
    }
    75% {
      opacity: 0;
      width: 69rem;
      height: 69rem;
    }

    100% {
      opacity: 0;
      width: 0;
      height: 0;
    }
  }

  @keyframes ripple-wave {
    0% {
      opacity: 0.5;
      width: 0;
      height: 0;
    }
    75% {
      opacity: 0;
      width: 100%;
      height: 100%;
    }

    100% {
      opacity: 0;
      width: 0;
      height: 0;
    }
  }

  .closeBtn {
    position: absolute;
    right: 30rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 18rem;
    color: #9ca0a8;
  }
  .isSpeack {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 10;
    background: rgba($color: #000000, $alpha: 0.3);
    border-radius: 10rem;
    padding: 10rem 30rem;
  }

  .mobile-chat-tips {
    font-size: 12rem;
    color: #fff;
    margin-top: 20rem;
  }

  .imgbox {
    width: 100rem;
  }

  .chat-btn-gif {
    -webkit-touch-callout: none;
    user-select: none;
    width: 60rem;
    pointer-events: none;
  }
  .mobile-chat-footer {
    position: absolute;
    bottom: 0;
    height: 108rem;
    width: 100%;
    border-top-right-radius: 30rem;
    border-top-left-radius: 30rem;
    display: flex;
    justify-content: center;
    align-items: flex-end;
  }
}

.mobile-chat-content::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
