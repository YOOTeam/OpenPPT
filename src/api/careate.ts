import { request } from '@/utils/HttpRequest'

// Layout-Model
export function viewThemeModle(query: any, requestId?: string) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'vision_slide',
      params: JSON.stringify(query),
    },
    requestId,
  })
}
export function writtenWords(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'writtenwords',
      params: JSON.stringify(query),
    },
  })
}

// Cancel Reg
export function canceltask(query: any, requestId?: string) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'vision_cancel',
      params: JSON.stringify(query),
    },
    requestId,
  })
}

/**
 * Get Online Resource
 * @param {*} query
 * @returns
 */
export function motionresource(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'get',
      service: 'resource',
      params: JSON.stringify(query),
    },
  })
}

// Image Generate1
export function textToImgApiPost(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'image',
      params: JSON.stringify(query),
    },
  })
}

// Image Generate 2
export function instructionToImage(query: any) {
  return request({
    url: '/motionchat/instructiontoimage',
    method: 'post',
    data: query,
    isJson: true,
  })
}

// Image Generate 3
export function imageToImage(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'searchimg',
      params: JSON.stringify(query),
    },
  })
}

// Content Generate
export function writtenwords(query: any) {
  return request({
    url: '/chatpptsse/writtenwords',
    method: 'post',
    data: query,
    isJson: true,
  })
}

// Save File
export function SaveJsonData(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'save',
      params: JSON.stringify(query),
    },
  })
}

// Voice Chat
export function audio2text(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'audio2text',
      params: JSON.stringify(query),
    },
  })
}

// Chat Instruct
export function ChatInstructions(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'detect',
      params: JSON.stringify(query),
    },
  })
}

export function chatFeedback(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'chatFeedback',
      params: JSON.stringify(query),
    },
  })
}

// Read Files
export function ppt2json(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'ppt_json',
      params: JSON.stringify(query),
    },
  })
}

// Gen Speach-Notes
export function createnote(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'createnote',
      params: JSON.stringify(query),
    },
  })
}

// Chat Infos
export function getRunChat(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'get',
      service: 'getRunChat',
      params: JSON.stringify(query),
    },
  })
}

// Get Images
export function getTemplatBackGround(query: any, requestId?: string) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'get',
      service: 'bg',
      params: JSON.stringify(query),
    },
    requestId,
  })
}

// Get ThemeColor
export function getTemplatColors(query: any, requestId?: string) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'get',
      service: 'color',
      params: JSON.stringify(query),
    },
    requestId,
  })
}

// Full Slides
export function getFullPageTemplat(query: any, requestId?: string) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'get',
      service: 'fullPage',
      params: JSON.stringify(query),
    },
    requestId,
  })
}

// Slides More
export function getFullPageTemplatScroll(query: any, requestId?: string) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'get',
      service: 'fullPageScroll',
      params: JSON.stringify(query),
    },
    requestId,
  })
}

// New Slide
export function getNewPageTemplat(query: any, requestId?: string) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'get',
      service: 'newPage',
      params: JSON.stringify(query),
    },
    requestId,
  })
}

// Slide
export function getOnePageTemplat(query: any, requestId?: string) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'get',
      service: 'onePage',
      params: JSON.stringify(query),
    },
    requestId,
  })
}

// Slide Files
export function getOnePageDetail(query: any, requestId?: string) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'get',
      service: 'getOnePageDetail',
      params: JSON.stringify(query),
    },
    requestId,
  })
}

// Translator
export function translateText(query: any, requestId?: string) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'texttotrans',
      params: JSON.stringify(query),
    },
    requestId,
  })
}

// Get Icons
export function getTextIcon(query: any, requestId?: string) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'get',
      service: 'icon',
      params: JSON.stringify(query),
    },
    requestId,
  })
}

// beautify Slide
export function beautifyUpload(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'beautify',
      params: JSON.stringify(query),
    },
  })
}

// chatppt Beautify
export function PPTFileInfo(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'dataTransmission',
      params: JSON.stringify(query),
    },
  })
}

// Get Upload Images
export function PPTImage(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'screenshot',
      params: JSON.stringify(query),
    },
  })
}

// Gen PPTX Files
export function json2ppt(query: any, requestId?: string) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'json2ppt',
      params: JSON.stringify(query),
      timeout: 120,
    },
    requestId,
  })
}

// Get Upload Files
export function getPPTFileInfo(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'get',
      service: 'jsoninfo',
      params: JSON.stringify(query),
    },
  })
}

// Text Styles
export function analyseStyle(query: any, requestId?: string) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'analyseStyle',
      params: JSON.stringify(query),
    },
  })
}

// Web Pages
export function getHtmllist(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'get',
      service: 'htmllist',
      params: JSON.stringify(query),
    },
  })
}

// Add WebPage
export function getHtmladd(query: any) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'post',
      service: 'htmladd',
      params: JSON.stringify(query),
    },
  })
}

// chat
export function runChatOfficial(query: any) {
  return request({
    url: 'runChatOfficial',
    method: 'post',
    data: query,
  })
}
