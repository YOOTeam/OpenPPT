export const baseUrlConfig = {
  hostUrl: `${location.origin}/`,
  apiUrl: window._AIP_BASE_URL || import.meta.env.VITE_APP_BASE_API,
}

export const backUrl = (Routre: string) => {
  const url: any = localStorage.getItem('refs_url')
  const domain = url ? url.match(/^(https?:\/\/[^/]+)/)[0] : ''
  if (domain) {
    window.location.assign(`${domain}/${Routre}`)
  } else {
    const baseUrl = baseUrlConfig.hostUrl
    window.location.assign(`${baseUrl}${Routre}`)
  }
}

export const returnHomeUrl = () => {
  const url: any = localStorage.getItem('refs_url')
  const domain = url ? url.match(/^(https?:\/\/[^/]+)/)[0] : ''
  let homeUrl = ''
  if (domain) {
    homeUrl = domain + '/'
  } else {
    const baseUrl = baseUrlConfig.hostUrl
    homeUrl = baseUrl
  }
  return homeUrl
}
