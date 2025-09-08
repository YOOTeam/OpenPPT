export default () => {
  const returnText = (text: any) => {
    text = text.trimStart()
    text = text.replace(/\n/g, '<br />')
    const transformSingleCitation = (pageId: any) => {
      const id = parseInt(pageId.replace('C', ''))
      return `<a class='linkPage' pageId='${id}'>P${id + 1}</a>`
    }

    // 处理cite标签内容（可能包含多个引用）
    const processCiteTag = (citeContent: any) => {
      const citations = citeContent.match(/C\d+/g) || []
      return citations.map((ref: any) => transformSingleCitation(ref)).join('')
    }

    // 替换所有<cite>标签
    return text.replace(/<cite>\[(.*?)\]<\/cite>/g, (match, content) => {
      return processCiteTag(content)
    })
  }
  return {
    returnText,
  }
}
