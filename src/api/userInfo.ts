import { request } from '@/utils/HttpRequest'

export function uploads(query: any, requestId?: string) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'get',
      service: 'token',
      params: JSON.stringify(query),
    },
    requestId,
  })
}
export function uploadsPPT(query: any, requestId?: string) {
  return request({
    url: '/open-ppt/c-service',
    method: 'post',
    data: {
      method: 'get',
      service: 'uploadPPT',
      params: JSON.stringify(query),
    },
    requestId,
  })
}
export function setBehaviors(query: any, requestId?: string) {
  return request({
    url: '/user/behavior',
    method: 'post',
    data: query,
    requestId,
  })
}

export function uploadPut(query: any) {
  return request({
    url: '/upload/put',
    method: 'post',
    data: query,
    isJson: true,
  })
}

export function userEdit(query: any) {
  return request({
    url: '/user/edituserext',
    method: 'post',
    data: query,
  })
}
