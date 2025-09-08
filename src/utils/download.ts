export const axiosDownload = async (url: string, fileName?: string) => {
  if (url.indexOf('?') > -1) {
    url = url + '&t=' + Date.now()
  } else {
    url = `${url}?t=${Date.now()}`
  }
  try {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then((response: any) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }
          // 创建一个可读流
          const reader = response.body.getReader()
          const chunks: any = []

          // 读取数据
          return new Promise((resolve, reject) => {
            function pump() {
              reader
                .read()
                .then(({ done, value }) => {
                  if (done) {
                    resolve(new Blob(chunks))
                    return
                  }
                  chunks.push(value)
                  pump()
                })
                .catch(reject)
            }
            pump()
          })
        })
        .then((blob: any) => {
          // 创建下载链接
          const downloadUrl = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = `${fileName}.pptx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(downloadUrl)
          resolve(true)
        })
        .catch((error) => {
          console.error('Error:', error)
          reject(false)
        })
    })
  } catch (error) {
    return false
  }
}
