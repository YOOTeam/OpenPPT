import { uploads, uploadPut, uploadsPPT } from '@/api/userInfo'
import { BosClient } from '@baiducloud/sdk'
import { fileMd5Sum } from './common'

const isUpload = false
export const onUploads = async (
  file: any,
  type: any,
  requestId?: string,
  headers?: any
) => {
  try {
    const params: any = {
      type: type,
      mime: file.type,
      size: file.size,
      file: file.name,
      hash: {},
    }

    const fileMd5 = await fileMd5Sum(file)
    if (fileMd5) {
      params.hash = fileMd5
    }
    let data: any
    if (params.type === 'userChatPptTempFile') {
      data = await uploadsPPT(params, requestId)
    } else {
      data = await uploads(params, requestId)
    }
    let result
    const client = new BosClient({})

    if (data.code !== 200) {
      return { result, url: '', key: '', fileMd5 }
    }
    try {
      const tokenData = data.data

      if (tokenData?.type === 'local') {
        const formData = new FormData()
        // 添加文件
        formData.append('file', file) // fileInput 是 HTML 中的 <input type="file"> 元素
        // 添加其他表单字段（可选）
        formData.append('token', tokenData.token)
        const putRes: any = await uploadPut(formData)
        if (putRes.code !== 200) {
          return { url: '' }
        }
        return {
          result,
          url: putRes?.data?.url,
          key: putRes?.data?.path,
          fileMd5,
        }
      }
      const config = {
        endpoint: tokenData.end_point, // 传入Bucket所在区域域名
        credentials: {
          ak: tokenData.accessKeyID, // 您的AccessKey
          sk: tokenData.secretAccessKey, // 您的SecretAccessKey
        },
        sessionToken: tokenData.sessionToken, // STS服务器下发的sessionToken
      }
      client.config = config
      const bucket = tokenData.buck_name
      const key = tokenData.object_key
      if (!tokenData.headers && headers) {
        tokenData.headers = {}
      }
      if (headers) {
        tokenData.headers = { ...tokenData.headers, ...headers }
      }

      result = await client.putObjectFromBlob(
        bucket,
        key,
        file,
        tokenData.headers
      )
      if (result?.http_headers?.etag) {
        return {
          result,
          url: tokenData?.result_url,
          key: tokenData?.object_key,
          fileMd5,
        }
      }
      return { result, url: '', key: '', fileMd5 }
    } catch (error) {
      result = error
      return { result, url: '', key: '', fileMd5 }
    }
  } catch (error) {}
}
