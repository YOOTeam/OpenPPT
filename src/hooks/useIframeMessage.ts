export default () => {
  //
  const GetIframeMessage = async (event: any) => {
    // 确保消息来源可靠
    const data = event.data
    if (data?.channel === 'editor-parent') {
    }
  }

  const SendIframeMessage = (data: any) => {
    // 判断是否是iframe嵌套
    const parentPage = window.parent // 通过window.parent获取父窗口
    const res: any = {
      channel: 'editor',
      ...data,
    }
    parentPage.postMessage(JSON.parse(JSON.stringify(res)), '*')
  }

  const isInIfram = () => {
    try {
      // 检查 window.self 和 window.top 是否相等
      return window.self !== window.top
    } catch (e) {
      // 如果访问 window.top 时抛出异常（例如跨域情况），说明是在 iframe 中
      return true
    }
  }

  return {
    isInIfram,
    SendIframeMessage,
  }
}
