<template>
  <div class="imgaePool">
    <div class="mode-tips-title p16">
      <span> {{ $t('toolbar.addImage') }} </span>
    </div>
    <div class="file-btn m16">
      <FileInput @change="(files) => insertImageElement(files)">
        <span>{{ $t('toolbar.clickUploadImg') }}</span>
      </FileInput>
    </div>
    <div class="drageModal-title m16" style="margin-top: 5rem">
      {{ $t('toolbar.inlineImg') }}
    </div>
    <div class="imgBox">
      <div class="img-list" @scroll="handleScroll">
        <div v-for="item in imageList" class="image-item" :key="item">
          <img :src="item.cover_url" v-if="item.cover_url" alt="" />
          <div class="btn" @click="handleInserImage(item)">
            <span> {{ $t('toolbar.insert') }} </span>
          </div>
        </div>
      </div>
      <div class="tips" v-if="!userToken">
        <div>{{ $t('OpenModal.text5') }}</div>
        <div class="link" @click="handleLinkClick">
          {{ $t('OpenModal.text6') }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import useCreateElement from '@/hooks/useCreateElement'
import { getImageDataURL } from '@/utils/image'
import FileInput from '@/components/FileInput.vue'
import { motionresource } from '@/api/careate'
import { PHOTOS } from '@/configs/resources'
import { onUploads } from '@/utils/upload'
import message from '@/utils/message'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const mainStore = useMainStore()
const { userToken } = storeToRefs(mainStore)

const imageList = ref<any>([])
const { createImageElement } = useCreateElement()

const insertImageElement = async (files: FileList) => {
  const imageFile = files[0]
  if (!imageFile) return
  if (userToken.value) {
    message.info(t('toolbar.uploadTips2'))
    const res = await onUploads(imageFile, 'image')
    if (res.url) {
      createImageElement(res.url)
      message.closeAll()
    }
  } else {
    getImageDataURL(imageFile).then((dataURL) => {
      createImageElement(dataURL)
    })
  }
}
const handleLinkClick = () => {
  window.open('https://wiki.yoo-ai.com/api/Open-PPT/open1.1.html', '_blank')
}
const handleInserImage = (item: any) => {
  if (item.url) {
    createImageElement(item.url, 460, 320)
  }
}
const pageNum: number = ref(1)
const listCount: number = ref(0)
const getReserice = () => {
  if (!userToken.value) {
    imageList.value = PHOTOS
    return
  }
  motionresource({
    limit: 20,
    type: 'photo',
    order: 'commend',
    page: pageNum.value,
  })
    .then((res) => {
      if (res.code === 200) {
        listCount.value = res.data.count
        if (pageNum.value === 1) {
          imageList.value = res.data.data
        } else {
          imageList.value = [...imageList.value, ...res.data.data]
        }
      } else {
        if (pageNum.value === 1) {
          imageList.value = PHOTOS
        }
      }
    })
    .catch(() => {
      imageList.value = PHOTOS
    })
}
const handleScroll = (event) => {
  if (!userToken.value) return
  const { scrollTop, scrollHeight, clientHeight } = event.target
  // 当滚动到底部时加载更多数据
  if (scrollHeight - scrollTop - clientHeight < 2) {
    if (listCount.value > imageList.value.length) {
      pageNum.value++
      getReserice()
    }
  }
}
onMounted(() => {
  getReserice()
})
</script>
<style lang="scss">
.imgaePool {
  @include drage-modal-layout();
  padding: 0;

  .p16 {
    padding: 0 16rem;
  }

  .m16 {
    margin: 0 16rem;
  }

  .file-btn {
    margin-top: 5rem;
    display: inline-block;
    padding: 7rem 15rem;
    background: #fff;
    cursor: pointer;
    border-radius: 6rem;
    border: 1px solid $lightColor;
    color: $themeColor;
    margin-bottom: 10rem;
    &:hover {
      background: #ebe9fd;
      color: $themeColor;
    }

    &:active {
      background: $themeColor;
      color: #fff;
    }
  }

  .imgBox {
    margin-bottom: 15rem;
    .tips {
      margin-top: 10rem;
      margin-left: 16rem;
      text-align: start;
      font-size: 16rem;
      color: #3d3d3d;
      .link {
        margin-left: 8rem;
        margin-top: 12rem;
        line-height: 23rem;
        letter-spacing: 0em;
        font-size: 14rem;
        color: #0256ff;
        cursor: pointer;
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .img-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    height: 450rem;
    overflow: auto;
    padding: 0 16rem;
    margin-top: 15rem;

    .image-item {
      cursor: pointer;
      flex-basis: 47%;
      /* 防止padding影响宽度 */
      border-radius: 6rem;
      box-sizing: border-box;
      border: 1rem solid $lightColor;
      height: 80rem;
      margin-bottom: 10rem;
      position: relative;
      overflow: hidden;
      img {
        width: 100%;
        height: 100%;
      }

      .btn {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2;
        opacity: 0;

        span {
          width: 62rem;
          height: 30rem;
          border-radius: 6rem;
          background: #fff;
          text-align: center;
          line-height: 30rem;
          border: 1px solid $lightColor;
          &:hover {
            border-color: $themeColor;
          }

          &:active {
            background: $lightColor;
            border-color: $themeColor;
          }
        }
      }

      &:hover {
        color: $themeColor;
      }

      &:hover .btn {
        opacity: 1;
      }
    }
  }
}
</style>
