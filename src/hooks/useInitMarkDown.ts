import { ref } from 'vue'
import { useChatInfo } from '@/store'

export default () => {
  const chatInfoStore = useChatInfo()

  const textRepalce = (str: any) => {
    // 正则表达式匹配标题和列表项
    const formattedStr = str
      .replace(/(#{1,5} [^#]+)/g, '\n$1\n') // 在标题前后添加换行符
      .replace(/(-\s[^\n]+)/g, '\n$1\n') // 在列表项前后添加换行符
      .replace(/\n+/g, '\n') // 去掉多余的换行符
      .trim() // 去掉首尾空白

    chatInfoStore.setPptJsonData({ content: formattedStr })
    return formattedStr
  }

  const MarkDownContent = (content: string) => {
    if (content.indexOf('\n') === -1) {
      content = textRepalce(content)
    }
    const arr = content.split('\n')
    let firstList: any = []
    let catalogList: any = []
    const emptyIndexList: any = []
    arr.forEach((element: any, index: number) => {
      if (element.startsWith('## ')) {
        emptyIndexList.push(index)
      }
      if (element.startsWith('# ')) {
        firstList.push(element.replace('# ', ''))
      }
    })

    const rangeList: any = []
    for (let index = 0; index < emptyIndexList.length; index++) {
      const element = emptyIndexList[index]
      const nextElement = emptyIndexList[index + 1]
      const range = {
        start: element,
        end: nextElement ? nextElement : arr.length,
      }

      rangeList.push(range)
    }

    const contentList: any = []
    for (let index = 0; index < rangeList.length; index++) {
      const element = rangeList[index]
      const range = {
        start: element.start,
        end: element.end,
      }
      const content = arr.slice(range.start, range.end)
      const catalogTitle: any = content.find((ele: any) =>
        ele.startsWith('## ')
      )
      catalogList.push(catalogTitle?.replace('## ', ''))

      const hasThree = content.find((ele: any) => ele.startsWith('### '))

      if (hasThree) {
        // 有3级
        const threeIndex: any = []
        content.forEach((ele: any, index: number) => {
          if (ele.startsWith('### ')) {
            threeIndex.push(index)
          }
        })
        const threeRang: any = []
        threeIndex.forEach((ele: any, index: number) => {
          const nextElement = threeIndex[index + 1]
          const range = {
            start: ele,
            end: nextElement ? nextElement : content.length,
          }
          threeRang.push(range)
        })

        threeRang.forEach((ele: any) => {
          const three = content.slice(ele.start, ele.end)
          const threeTitle: any = three.find((ele: any) =>
            ele.startsWith('### ')
          )
          const obj = returnThreeContent(
            threeTitle?.replace('### ', ''),
            three,
            index + 1
          )
          if (obj) {
            contentList.push(obj)
          }
        })
      } else {
        const obj = returnThreeContent(
          catalogTitle?.replace('## ', ''),
          content,
          index + 1
        )

        if (obj) {
          contentList.push(obj)
        }
      }
    }
    firstList = firstList.map((item: any) => {
      // 去除序号
      return resectTitle(item).replace('\r', '')
    })

    catalogList = catalogList.map((item: any) => {
      return resectTitle(item).replace('\r', '')
    })
    contentList.forEach((item: any) => {
      item.title = resectTitle(item.title).replace('\r', '')
      if (item.content?.length) {
        let contentArr: any = []
        item.content.forEach((element: any) => {
          element = element.replace(/\*\*：(?!\n)/g, '**：\n')
          let newList = element.split('\n').filter((item: any) => {
            return item.trim() !== ''
          })
          let titleIndex = -1
          const textList: any = []
          if (
            newList?.length === 1 &&
            newList[0].indexOf('：') > -1 &&
            newList[0].indexOf('**') === -1
          ) {
            newList = newList[0].split('：')
            newList = newList.map((el: any, index: number) => {
              if (index === 0) {
                el = el.replace(el, `**${el}**：`)
              }
              return el.trim()
            })
          }

          for (let index = 0; index < newList.length; index++) {
            let el = newList[index]
            el = el.trim().replace('\r', '')
            if (el.indexOf('¥¥¥') > -1) {
              continue
            }

            if (el.indexOf('**') > -1) {
              if (titleIndex === -1) {
                titleIndex = index
              } else {
                const data = {
                  content: newList.slice(titleIndex + 1, index + 1)?.length
                    ? newList.slice(titleIndex + 1, index).join('\n')
                    : '',
                  title: replaceChileTitle(newList[titleIndex]),
                }
                if (!data.content && data.title) {
                  data.content = data.title
                  data.title = ''
                }
                textList.push(data)
                titleIndex = index
              }
            }

            if (index === newList.length - 1 && !textList?.length) {
              if (titleIndex > -1) {
                const data = {
                  content: newList.slice(titleIndex + 1, index + 1)?.length
                    ? newList.slice(titleIndex + 1, index + 1).join('\n')
                    : '',
                  title: replaceChileTitle(newList[titleIndex]),
                }
                if (!data.content && data.title) {
                  data.content = data.title
                  data.title = ''
                }
                textList.push(data)
              } else {
                newList.forEach((e: any) => {
                  textList.push({
                    content: e,
                    title: '',
                  })
                })
              }
            }
          }

          if (textList?.length) {
            contentArr = [...contentArr, ...textList]
          }
        })
        item.content = JSON.parse(JSON.stringify(contentArr))
      }
      if (item.data) {
        item.table = []
        item.data.forEach((el: any) => {
          const leng = el.header.length
          el.datas = el.datas.map((item: any) => {
            return item.slice(0, leng)
          })
          el.datas = el.datas
            .map((row: any) =>
              row.filter((cell: any) => cell && cell.indexOf('---') === -1)
            )
            .filter((row: any) => row.length > 0)
          el.datas = [...[el.header], ...el.datas]
          item.table.push(JSON.parse(JSON.stringify(el.datas)))
        })
        delete item.data
      }
    })
    return {
      firstList,
      catalog: catalogList,
      conentList: contentList,
    }
  }

  interface Section {
    content?: string[]
    data?: {
      header: string[]
      datas: string[][]
      type: string
    }
  }

  const replaceChileTitle = (str: string) => {
    return str.replace('**：', '').replace('**', '')
  }

  const resectTitle = (str: string) => {
    const regex =
      /^(?:\d+(?:\.\d+)+[:：]?|\d+(?:\.\d+)*[\.、]|\d+\s*[\.、]|[一二三四五六七八九十]+[、.．]|\s*)\s*/gm
    let result = str ? str.replace(regex, '') : ''
    if (result.startsWith('.')) {
      result = result.slice(1, result.length)
    }
    return result
  }
  const returnThreeContent = (title: string, content: any, num: number) => {
    const textContent = content.join('\n')
    const threeContent = markdownToArray(textContent)
    const obj: any = { title: title, chatperNum: num, type: 'content' }
    if (threeContent?.length) {
      let chatData: any = threeContent.map((ele: any) => {
        return ele.data ? ele.data : ''
      })

      let content: any = []
      threeContent.forEach((ele: any) => {
        if (ele.content?.length) {
          const isSpecial = ele.content.filter((ss: any) => {
            return ss.indexOf('¥¥¥') > -1
          })
          if (isSpecial.length) {
            const str = ele.content.join('\n').replace(/¥¥¥/g, '').trim()
            if (str?.length) {
              ele.content = [str]
            }
          }

          content = [...content, ...ele.content]
        }
      })

      obj.content = content.filter((ele: any) => ele)

      if (chatData?.length) {
        chatData = chatData.filter((ele: any) => ele)
        obj.data = chatData
      }
    }

    return obj
  }
  const markdownToArray = (markdown: string): Section[] => {
    const lines = markdown.split('\n')
    const result: Section[] = []
    let currentSection: Section = {}

    let index = 0
    for (const line of lines) {
      // 处理加粗文本（**）
      if (line.startsWith('#### ')) {
        index += 1
        const title = line.replace('#### ', '').trim()
        currentSection.content = currentSection.content || []
        currentSection.content.push(`${title}：`)
      } else if (line.startsWith('- **')) {
        const title = line.replace('- ', '').trim()
        currentSection.content = currentSection.content || []
        if (index > 0 && currentSection.content[index - 1]) {
          currentSection.content[index - 1] += `\n${title}`
        } else {
          currentSection.content.push(`${title}`)
        }
      } else if (line.startsWith('    - ')) {
        const title = line.replace('    - ', '').trim()
        currentSection.content = currentSection.content || []
        currentSection.content.push(`${title}`)
      } else if (line.startsWith('*   ')) {
        const title = line.replace('*   ', '').trim()
        currentSection.content = currentSection.content || []
        currentSection.content.push(`${title}`)
      } else if (line.startsWith(' * ')) {
        const title = line.replace(' * ', '').trim()
        currentSection.content = currentSection.content || []
        currentSection.content.push(`${title}`)
      }
      // 处理列表项
      else if (line.startsWith('  - ')) {
        const text = line.replace('  - ', '').trim()
        currentSection.content = currentSection.content || []
        if (index > 0 && currentSection.content[index - 1]) {
          currentSection.content[index - 1] += `\n${text}`
        } else {
          currentSection.content.push(`${text}`)
        }
      }
      // 处理表格
      else if (line.includes('|')) {
        const tableLines = lines.filter((l) => l.includes('|'))
        const header = tableLines[0]
          .split('|')
          .map((cell) => cell.trim())
          .filter((cell) => cell)
        let datas = tableLines.slice(1).map((row) =>
          row
            .split('|')
            .map((cell) => cell.trim())
            .filter((cell) => cell && cell.indexOf('-----') === -1)
        )

        datas = datas.filter((row) => row.length > 0)
        currentSection.data = {
          header,
          datas,
          type: 'table',
        }

        let hasData = false
        if (result?.length) {
          for (let index = 0; index < result.length; index++) {
            const ele = result[index]
            if (ele?.data) {
              const old = JSON.stringify(ele.data)
              const newss = JSON.stringify(currentSection.data)
              if (old === newss) {
                hasData = true
              }
            }
            if (hasData) {
              break
            }
          }
        }
        if (!hasData) {
          result.push(currentSection)
        }

        currentSection = {}
      }
      // 处理普通文本
      else if (line.startsWith('- ')) {
        const text = line.replace('- ', '').trim()
        currentSection.content = currentSection.content || []

        if (index > 0 && currentSection.content[index - 1]) {
          currentSection.content[index - 1] += `\n${text}`
        } else {
          currentSection.content.push(`${text}`)
        }
      } else {
        if (line.indexOf('##') === -1 && line.length) {
          currentSection.content = currentSection.content || []
          if (index > 0 && currentSection.content[index - 1]) {
            currentSection.content[index - 1] += `\n¥¥¥${line}`
          } else {
            currentSection.content.push(`¥¥¥${line}`)
          }
        } else {
          if (currentSection.content) {
            currentSection.content[
              currentSection.content.length - 1
            ] += `\n${line}`
          }
        }
      }
    }

    // 添加最后一个 section
    if (currentSection.content || currentSection.data) {
      result.push(currentSection)
    }

    return result
  }
  return {
    MarkDownContent,
  }
}
