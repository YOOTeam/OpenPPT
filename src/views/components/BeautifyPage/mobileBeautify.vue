<template>
  <div class="fullscreen-beautify-mobile">
    <div class="left-box-top">
      <div class="b-title">请确认美化后的风格：</div>
      <div class="b-tips">
        当前内容为根据你的PPT内容进行AI识别美化而来，AI效果持续迭代中，请根据结果进行确认和使用(支持二次在线编辑)
      </div>
      <div class="rate-box">
        邀请为AI评分：
        <a-rate :model-value="rateUser" @change="handleRange" />
      </div>

      <div class="change-modle" @click="handleChangeModle">换一批</div>
      <div class="theme-box">
        <div
          class="theme-box-content"
          ref="themeRef"
          v-if="fullThemePages?.list.length"
        >
          <div
            class="theme-item"
            v-for="(item, index) in fullThemePages.list"
            :key="index"
            @click="handleThemeClick(item, index)"
            :style="{
              borderColor: activeTheme === index ? '#4E3EFF' : '#e1e1e1',
            }"
          >
            <div class="themeSlideBox">
              <ThumbnailSlide
                v-if="item.slide"
                class="thumbnail"
                :slide="item.slide"
                :size="168 * rem"
              />
            </div>

            <div class="colors" v-if="item.colorList">
              <div
                class="color-block"
                v-for="(color, index) in item.colorList"
                :key="index"
                :style="{ backgroundColor: color }"
              ></div>
            </div>
            <IconCheckOne
              theme="filled"
              class="icon"
              v-if="activeTheme === index"
            />
            <div class="click" v-else></div>
            <!--  -->
          </div>
        </div>
        <div
          class="theme-box-content loading-box"
          v-if="fullThemePages.showLoding"
        >
          <div class="theme-item" v-for="(item, index) in 6" :key="item">
            <div
              class="themeSlideBox"
              :style="{
                'animation-delay': `${0.5 * index}s`,
              }"
            ></div>
            <div class="colors-box"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="left-box-slide">
      <div class="thumbnail-box" ref="upperThumbnailBox">
        <div
          v-for="(item, index) in viewSiles"
          :key="index"
          :class="['slide-item', index === activeIndex ? 'activeItems' : '']"
          :style="{
            width:
              index === 0 ||
              (index === viewSiles?.length - 1 && index % 2 !== 0)
                ? '100%'
                : '48%',
          }"
          ref="slideItems"
          @click="handleOpenItem(item, index)"
        >
          <ThumbnailSlide
            class="thumbnail"
            :slide="item"
            :size="
              index === 0 ||
              (index === viewSiles?.length - 1 && index % 2 !== 0)
                ? 440 * rem
                : 215 * rem
            "
          />
          <div class="loading" v-if="!item.isShow && !item.isError">
            <p
              :style="{
                marginTop:
                  index === 0 ||
                  (index === viewSiles?.length - 1 && index % 2 !== 0)
                    ? '110rem'
                    : '70rem',
              }"
            >
              AI渲染中...
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="left-box-bottom">
      <a-button class="close-btn" @click="handleClose">放弃美化</a-button>
      <a-button
        class="sure-btn"
        :class="!beautifyEnd ? 'desable' : ''"
        :loading="beautifyLoading"
        @click="handleSave(true)"
      >
        <i class="iconfont icon-a-1114" style="margin-right: 5rem"></i>
        <!-- <span v-if="!checkBeautify"> 开通会员 </span> -->
        <!-- <span v-else> 确认使用 </span> -->
        <span> 确认使用 </span>
        <!-- <i class="user-flage" v-if="checkBeautify === 1">限免1次</i> -->
      </a-button>
    </div>
    <transition name="fade">
      <div
        v-if="showBigView"
        class="beautify-search-mobile"
        @click=";(checkItem.showPageList = false), (showBigView = false)"
      >
        <div
          class="beautify-search-mobile-content"
          @click=";(checkItem.showPageList = false), (showBigView = false)"
        >
          <!-- <icon-close
            class="modal-close-beautify"
            :style="{ fontSize: '32rem' }"
            v-if="showBigView"
            @click="showBigView = false"
          /> -->
          <div
            @click.stop="handlePageViewChange(checkItem)"
            class="page-type"
            v-if="checkItem.isShow && checkItem?.tags?.custom?.page_type"
          >
            <span>
              {{ pageType(checkItem?.tags?.custom?.page_type) }}
              <i
                class="iconfont icon-jiantou_liebiaozhankai_o isJiantou"
                :class="checkItem.showPageList ? 'isJiantou-acitve' : ''"
              ></i>
            </span>
            <div class="page-type-list" v-if="checkItem.showPageList">
              <template v-for="pageitem in pageList" :key="pageitem">
                <div
                  @click.stop="changeVisison(pageitem.name, checkItem)"
                  v-if="
                    pageitem.type === 'cover' ||
                    pageitem.type === 'catalog' ||
                    pageitem.type === 'chapter' ||
                    pageitem.type === 'content' ||
                    pageitem.type === 'end'
                  "
                >
                  {{ pageitem.name }}
                </div>
              </template>
            </div>
          </div>
          <div class="thumbnail-box-content" @click.stop>
            <ThumbnailSlide
              class="thumbnail"
              :slide="checkItem"
              :size="420 * rem"
            />
            <div v-if="checkItem.showOldImg" class="oldImgUrl-box">
              <template v-if="oldImgUrl">
                <img :src="oldImgUrl" alt="" />
              </template>
              <template v-else>
                <ThumbnailSlide
                  class="thumbnail"
                  :slide="slides[checkItemIndex]"
                  :size="420 * rem"
                />
              </template>
            </div>
            <div class="loading" v-if="!checkItem.isShow">
              <p>AI渲染中...</p>
            </div>
          </div>
          <div class="mobile-big-search" v-if="checkItem.isShow">
            <div class="click-thumbs" @click.stop>
              <i
                class="iconfont icon-zan icon"
                :class="checkItem.isGood === 'yes' ? 'active-select' : ''"
                @click.stop="handleClickThumbs(checkItem, 'yes')"
              ></i>
              <i
                class="iconfont icon-cai icon no-good"
                :class="checkItem.isGood === 'no' ? 'active-select' : ''"
                @click.stop="handleClickThumbs(checkItem, 'no')"
              ></i>
            </div>
            <div class="click-btn" @click.stop>
              <div
                class="click-btn-item"
                @click.stop="handleSingView(checkItem)"
                v-if="
                  checkItem?.tags?.custom?.page_type === 'background' ||
                  checkItem?.tags?.custom?.page_type === 'content' ||
                  checkItem?.tags?.custom?.page_type === 'multcontent' ||
                  !checkItem?.tags?.custom?.page_type ||
                  !checkItem?.tags ||
                  checkItem.isError
                "
              >
                <i class="iconfont icon-AImeihua-01"></i>
                单页美化
              </div>
              <div
                class="click-btn-item"
                @click.stop="handleChildEventMobile(checkItem)"
              >
                <i class="iconfont icon-chakanyuanwen"></i>
                {{ checkItem.showOldImg ? '查看美化页面' : '查看原始页面' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useScreenStore } from '@/store'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import { debounce } from 'lodash'

import useBeatifyPage from '@/hooks/useBeatifyPage'
const { rem } = storeToRefs(useScreenStore())
const {
  handleThemeClick,
  handleDomToView,
  handlePageViewChange,
  changeVisison,
  handleSingView,
  handleSave,
  handleClose,
  handleClickThumbs,
  handleOpenItem,
  handleRange,
  handleCompare,
  initFunction,
  pageList,
  activeTheme,
  viewSiles,
  slides,
  beautifyFirstView,
  fullThemePages,
  getFullTemplate,
  watchInitData,
  isOpenCompare,
  rateUser,
  showBigView,
  oldImgUrl,
  checkItem,
  slideItems,
  upperThumbnailBox,
  activeIndex,
  beautifyEnd,
  beautifyLoading,
  acitveThemeId,
  handleChildEventMobile,
  checkItemIndex,
  themeRef,
  FullApiChannle,
} = useBeatifyPage()

FullApiChannle.value = 'mobile'
const slidesStore = useSlidesStore()

const pageType = computed(() => (value) => {
  return pageList.find((item: any) => item.type === value)?.name
})

// 主题换一批
const handleChangeModle = debounce(
  function () {
    fullThemePages.value.list = []
    fullThemePages.value.showLoding = true
    fullThemePages.value.showError = false
    getFullTemplate(6, acitveThemeId.value)
    activeTheme.value = 0
    nextTick(() => {
      if (themeRef.value) {
        themeRef.value.children[0].scrollIntoView({ behavior: 'smooth' })
      }
    })
  },
  300,
  { trailing: true }
)

watch(
  beautifyFirstView,
  async (newVal) => {
    fullThemePages.value.showLoding = true
    watchInitData.value = JSON.parse(JSON.stringify(newVal))
    if (newVal?.viewData) {
      initFunction(newVal)
    } else {
      initFunction(null, true)
    }
  },
  {
    immediate: true,
  }
)
</script>

<style lang="scss" scoped>
.fullscreen-beautify-mobile {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 10rem 0rem;
  width: 100%;
  font-size: 14rem;
  color: #fff;
  background-color: rgba($color: #000, $alpha: 0.8);
  .theme-box-content {
    width: 100%;
    overflow-x: auto;
    white-space: nowrap;
  }

  .change-modle {
    width: 90rem;
    height: 35rem;
    border-radius: 10rem;
    opacity: 1;
    background: rgba(0, 0, 0, 1);
    text-align: center;
    line-height: 35rem;
    margin-bottom: 10rem;
  }

  .theme-item {
    display: inline-block;
    position: relative;
    background: #ffffff;
    box-sizing: border-box;
    border: 3rem solid #e1e1e1;
    border-radius: 10rem;
    overflow: hidden;
    padding: 2rem;
    margin-right: 10rem;
    min-width: 178rem;
    min-height: 128rem;
    margin-bottom: 6rem;
    .themeSlideBox {
      border-radius: 8rem;
      overflow: hidden;
    }
    .click {
      width: 30rem;
      border-radius: 50%;
      height: 30rem;
      position: absolute;
      right: 10rem;
      top: 10rem;
      color: $themeColor;
      border: 1rem solid $themeColor;
      cursor: pointer;
      background: #fff;
    }
    .icon {
      position: absolute;
      right: 10rem;
      top: 10rem;
      color: $themeColor;
      font-size: 30rem;
    }
    .colors {
      margin-top: 5rem;
      display: flex;
      justify-content: center;
      border-radius: 6rem;
      border: 1rem solid #e6e1e1;
      background: #fff;
      overflow: hidden;
    }
    .color-block {
      flex: 1;
      height: 22rem;
      box-shadow: 1rem 1rem 5rem 1rem #000;
    }
  }

  .loading-box {
    .themeSlideBox {
      height: 120rem;
      background-size: 200% 200%; /* 背景图大小 */
      background-image: linear-gradient(
        90deg,
        #ecf4ff,
        #ecf4ff,
        #9389fc55,
        #ffffff
      );
      animation: flow 10s ease infinite;
    }

    @keyframes flow {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }
  }
  .layout-item {
    display: inline-block;
    overflow: hidden;
    position: relative;
    width: 178rem;
    min-height: 140rem;
    margin-bottom: 10rem;
    border: 1rem solid #ddd;
    border-radius: 10rem;

    &:hover .btns {
      opacity: 1;
    }

    &:hover .thumbnail {
      outline-color: $themeColor;
    }

    .btns {
      @include absolute-0();
      border-radius: 10rem;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      display: flex;
      background-color: rgba($color: #000, $alpha: 0.25);
      opacity: 0;
    }

    .thumbnail {
      outline: none;
    }
  }

  .active-item {
    font-size: 14rem;
    color: #bebcbc;
    background: rgba(235, 234, 234, 0.5);

    img {
      width: 90rem;
    }
  }

  .left-box-slide {
    width: 100%;
    height: calc(100% - 400rem);
    margin: 10rem 0;
    overflow: hidden;
    position: relative;
  }

  .thumbnail-box {
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    padding-left: 10rem;
  }

  .slide-item {
    overflow: hidden;
    width: 48%;
    min-height: 110rem;
    border-radius: 6px;
    opacity: 1;
    background-color: #ecf4ff;
    position: relative;
    border: 2rem solid #e1e1e1;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: zoom-in;
    margin: 0 5rem 10rem 0;
    &:first-child {
      width: 100%;
    }
    &:hover {
      border: 2rem solid #fff;
    }
  }
  .oldImgUrl-box {
    border-radius: 15rem;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18rem;
    background: #fff;
    overflow: hidden;
    padding: 8rem;
    img {
      width: 100%;
      height: 100%;
      border-radius: 6rem;
    }
  }

  .click-btn {
    font-size: 12rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .mobile-big-search {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-top: 10rem;
    padding: 10rem 0;
  }

  .click-btn-item {
    border-radius: 6rem;
    padding: 8rem 10rem;
    background: rgba(0, 0, 0, 1);
    cursor: pointer;
    margin-left: 16rem;
    display: flex;
    justify-content: center;
    align-items: center;
    .iconfont {
      font-size: 14rem;
      margin-right: 5rem;
    }
  }

  .click-thumbs {
    font-size: 18rem;
    padding-top: 4rem;
    color: #fff;
    .no-good {
      transform: rotate(180deg);
    }
    .active-select {
      color: #8c84f0;
    }
    .icon {
      padding: 4rem 6rem;
      background: rgba(0, 0, 0, 1);
      margin-right: 16rem;
      border-radius: 6rem;
      transition: transform;
      font-size: 24rem;
      &:hover {
        color: $lightColor;
      }
      &:active {
        color: $themeColor;
      }
    }
  }

  .page-type {
    position: relative;
    user-select: none;
    font-size: 14rem;
    color: #000;
    left: 0;
    width: 129rem;
    margin-bottom: 10rem;
    span {
      padding: 8rem 10rem;
      width: 100%;
      height: 45rem;
      border-radius: 7rem;
      opacity: 1;
      background: #ffffff;
      box-shadow: 0px -2px 10px 0px rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;

      .isJiantou {
        font-size: 26rem;
        transition: transform 0.4s;
        color: #5018f9;
      }

      .isJiantou-acitve {
        transform: rotate(180deg);
      }
    }
  }
  @keyframes showList {
    100% {
      opacity: 1;
    }
  }
  .page-type-list {
    position: absolute;
    z-index: 9;
    top: 62rem;
    width: 129rem;
    padding: 4rem;
    background-color: #fff;
    border-radius: 5rem;
    box-shadow: 0rem 4rem 10rem 0rem rgba(0, 0, 0, 0.08);
    opacity: 0;
    animation: showList 0.8s forwards;
    & > div {
      line-height: 40rem;
      padding: 2rem 6rem;
      border-radius: 5rem;
      &:hover {
        background: $lightColor;
        color: $themeColor;
      }
    }
  }
  .activeItems {
    opacity: 0;
    z-index: -5;
  }

  .loading {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    p {
      margin-top: 100rem;
      font-size: 12rem;
    }
  }

  .itemAnimation {
    .thumbnail {
      opacity: 0;
      animation: fadeIn 1s forwards;
    }

    .loading {
      opacity: 1;
      animation: fadeHiden 1s forwards;
    }
  }

  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes fadeHiden {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  .left-box-top {
    padding: 0rem 15rem;
  }

  .b-title {
    font-size: 20rem;
    font-weight: bold;
    line-height: 44rem;
  }
  .b-tips {
    font-size: 16rem;
  }
  .rate-box {
    width: 100%;
    display: flex;
    align-items: center;
    font-size: 16rem;
    margin-top: 4rem;
  }
  .left-box-bottom {
    text-align: center;
    button + button {
      margin-left: 20rem;
      vertical-align: middle;
    }

    .close-btn {
      font-size: 14rem;
      color: $themeColor;
      border-radius: 8rem;
      border: 1px solid #dddaff;
    }

    .sure-btn {
      position: relative;
      border-radius: 8rem;
      font-size: 14rem;
      background: linear-gradient(344deg, #e6bd5e 0%, #ffe7a7 98%);
      box-sizing: border-box;
      border: 1px solid #fff3da;
      backdrop-filter: blur(10px);
      color: #6d4f09;
      &:hover {
        background: linear-gradient(354deg, #ecc975 0%, #fff3d1 98%);
        border: 1px solid #fff3da;
      }
      &:active {
        background: linear-gradient(354deg, #d7af51 2%, #ffde85 99%);
        border: 1px solid #fff3da;
      }

      .user-flage {
        position: absolute;
        right: -12rem;
        top: -18rem;
        border-top-left-radius: 8rem;
        border-top-right-radius: 2rem;
        border-bottom-left-radius: 2rem;
        border-bottom-right-radius: 8rem;
        padding: 2rem 8rem;
        background: linear-gradient(90deg, #cafdff 0%, #84f936 97%);
        font-family: Alibaba PuHuiTi 2;
        font-size: 14rem;
        font-weight: bold;
        line-height: normal;
        text-align: justify; /* 浏览器可能不支持 */
        color: #137a41;
      }
    }

    .desable {
      background: #e1e1e1;
      cursor: default;
      &:hover {
        background: #ececec;
      }
      &:active {
        background: #e1e1e1;
      }
    }
  }
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s;
  }
  .fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
    opacity: 0;
  }
  .beautify-search-mobile {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba($color: #000000, $alpha: 0.65);
    z-index: 1000;
    font-size: 14rem;
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .thumbnail-box-content {
    position: relative;
    padding: 8rem;
    background: #fff;
    border-radius: 10rem;
    .thumbnail {
      border-radius: 10rem;
      overflow: hidden;
    }
    &:hover {
      .left-bar,
      .right-bar {
        opacity: 1;
      }
    }
    &::after {
      position: absolute;
      content: '';
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
    }

    .left-bar,
    .right-bar {
      position: absolute;
      top: 50%;
      transform: translateX(-50%);
      width: 60rem;
      height: 60rem;
      text-align: center;
      line-height: 60rem;
      .iconfont {
        font-size: 60rem;
      }

      border-radius: 50%;
      transition: opacity 0.5s;
      cursor: pointer;
      color: #dddcdc;
      z-index: 3;
      opacity: 0;
    }
    .left-bar {
      left: -30rem;
      :hover {
        color: $themeColor;
        border-radius: 50%;
      }
    }

    .right-bar {
      right: -90rem;
      :hover {
        color: $themeColor;
        border-radius: 50%;
      }
    }
  }
  .bottom-bar {
    width: 100%;
    padding: 6rem 4rem 0 4rem;
    border: 1rem solid #e1e1e1;
    margin-top: 20rem;
    background-color: #fff;
    border-radius: 10rem;
  }
  .thumbnail-box-bar {
    width: 1098rem;
    overflow-x: auto;
    white-space: nowrap;

    .thumbnail {
      margin: 0 3rem;
      border-radius: 6rem;
      overflow: hidden;
      display: inline-block;
      cursor: pointer;
      border: 4rem solid #e1e1e1;
    }

    .actives-item {
      border: 4rem solid $themeColor;
    }
  }
  .modal-close-beautify {
    margin-bottom: 40rem;
    cursor: pointer;
    transition: transform 0.5s ease-in;
    &:hover {
      transform: rotate(180deg);
    }
  }
  .beautify-search-mobile-content {
    display: flex;
    justify-content: center;
    flex-direction: column;
    transform: scale(0);
    overflow: hidden;
    animation: fadeInHeight 0.3s forwards ease-in;
    animation-delay: 0.2s;
  }

  @keyframes fadeInHeight {
    100% {
      transform: scale(1);
    }
  }
}
</style>
