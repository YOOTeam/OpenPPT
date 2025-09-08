<template>
  <div class="fullscreen-beautify">
    <div class="left-box-content">
      <div
        class="left-box-top"
        :style="{ height: isFristTips ? 'auto' : '60rem' }"
      >
        <template v-if="!isFristTips">
          <div class="b-title">{{ $t('beautify.tips1') }}</div>
          <div class="b-tips">
            {{ $t('beautify.tips2') }}({{ $t('beautify.tips4') }})
          </div>
        </template>
        <template v-else>
          <div class="t-tips" v-html="beautifyTips"></div>
        </template>
      </div>
      <div class="left-box-slide">
        <div
          class="thumbnail-box"
          ref="upperThumbnailBox"
          @wheel.prevent="($event) => WheelThumbnails($event)"
        >
          <div
            v-for="(item, index) in viewSiles"
            :key="index"
            :class="['slide-item', index === activeIndex ? 'activeItems' : '']"
            ref="slideItems"
            @click="handleOpenItem(item, index)"
          >
            <ThumbnailSlide class="thumbnail" :slide="item" :size="355 * rem" />
            <div v-if="item.showOldImg" class="oldImgUrl-box">
              <template v-if="oldImgUrl">
                <img :src="oldImgUrl" alt="" />
              </template>
              <template v-else>
                <ThumbnailSlide
                  class="thumbnail"
                  :slide="slides[index]"
                  :size="355 * rem"
                />
              </template>
            </div>
            <!-- 页面标识 -->
            <div
              @click.stop="handlePageViewChange(item)"
              class="page-type"
              v-if="item.isShow && item?.tags?.custom?.page_type"
            >
              <a-tooltip
                :content="t('beautify.tips3')"
                position="tl"
                :content-style="{
                  fontSize: '12rem',
                  width: '360rem',
                }"
              >
                <span style="display: flex; align-items: center"
                  >{{ pageType(item?.tags?.custom?.page_type) }}
                  <IconHelp class="helpIcon"
                /></span>
              </a-tooltip>
              <div class="page-type-list" v-if="item.showPageList">
                <template v-for="pageitem in pageList" :key="pageitem">
                  <div
                    @click.stop="changeVisison(pageitem, item)"
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
            <div class="click-thumbs" @click.stop v-show="item.isShow">
              <IconThumbsUp
                class="icon"
                v-tooltip="t('beautify.isGood')"
                :class="item.isGood === 'yes' ? 'active-select' : ''"
                @click.stop="handleClickThumbs(item, 'yes')"
              />
              <IconThumbsUp
                class="icon no-good"
                v-tooltip="t('beautify.noGood')"
                :class="item.isGood === 'no' ? 'active-select' : ''"
                @click.stop="handleClickThumbs(item, 'no')"
              />
              <IconClearFormat
                class="icon"
                v-tooltip="t('beautify.oldPage')"
                @click.stop="handleClickThumbs(item, 'clear', index)"
              />
            </div>
            <div class="click-btn" @click.stop v-show="item.isShow">
              <!-- 单页 内容美化 -->
              <div
                class="click-btn-item"
                @click.stop="handleSingView(item)"
                v-if="
                  item?.tags?.custom?.page_type === 'background' ||
                  item?.tags?.custom?.page_type === 'content' ||
                  item?.tags?.custom?.page_type === 'multcontent' ||
                  !item?.tags?.custom?.page_type ||
                  !item?.tags ||
                  item.isError
                "
              >
                <i class="iconfont icon-AImeihua-01"></i>
                {{ $t('beautify.singlePage') }}
              </div>
              <!-- 查看原文 -->
              <div
                class="click-btn-item"
                @mousedown.stop="handleChildEvent(item, 'show')"
                @mouseup.stop="handleChildEvent(item, 'hiddent')"
                @click.stop
              >
                <i class="iconfont icon-chakanyuanwen"></i>
                {{
                  isOpenCompare
                    ? t('beautify.search')
                    : t('beautify.searchPage')
                }}
              </div>
            </div>
            <div class="loading" v-if="!item.isShow && !item.isError">
              <img
                class="beautifyLoading-gif"
                src="@/assets/image/f-3.gif"
                alt=""
              />
              <p>{{ $t('layoutPool.aiLayout') }}</p>
            </div>
          </div>
        </div>
        <div class="rate-box">
          <div class="compare" @click="handleCompare">
            <IconPreviewClose v-if="isOpenCompare" />
            <IconEyes v-else /> {{ $t('beautify.compare') }}
          </div>
        </div>
      </div>
      <div class="left-box-bottom">
        <div class="other-btn">
          <a-checkbox
            style="margin-right: 20rem"
            v-model="openDrawing"
            @change="(value) => handleToggle(value, 'img')"
            >{{ $t('layoutPool.aiDraw') }}
            <a-tooltip
              :content="t('layoutPool.tips8')"
              position="bl"
              :content-style="{
                fontSize: '12rem',
                width: '240rem',
              }"
            >
              <IconHelp class="helpIcon" /> </a-tooltip
          ></a-checkbox>
          <a-checkbox
            v-model="openColorSingle"
            @change="(value) => handleToggle(value, 'color')"
            >{{ $t('beautify.colorSingle') }}</a-checkbox
          >
        </div>
        <a-button class="close-btn" @click="handleClose">{{
          $t('beautify.closeBeautify')
        }}</a-button>
        <a-button
          class="sure-btn"
          :class="!beautifyEnd ? 'desable' : ''"
          :loading="beautifyLoading"
          @click="handleSave"
        >
          <i class="iconfont icon-a-1114" style="margin-right: 5rem"></i>
          <span> {{ $t('beautify.save') }} </span>
        </a-button>
      </div>
    </div>

    <div class="theme-box">
      <div
        class="theme-box-content"
        @scroll="handleScrollTheme"
        v-if="fullThemePages.list?.length"
      >
        <div
          class="theme-item"
          v-for="(item, index) in fullThemePages.list"
          :key="index"
          :id="`list-${item.id}`"
          @click="handleThemeClick(item, index)"
          @mouseenter="handleMouseOverRight(index)"
          @mouseleave="handleMouseLeaveRight()"
          :style="{
            borderColor: activeTheme === index ? '#4E3EFF' : '#e1e1e1',
          }"
        >
          <div class="themeSlideBox">
            <ThumbnailSlide
              v-if="item.slide"
              class="thumbnail"
              :slide="item.slide"
              :size="280 * rem"
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
          <div
            class="loading"
            v-if="!item.showSlide && fullThemePages.list?.length > 0"
          >
            <img
              class="beautifyLoading-gif"
              src="@/assets/image/f-3.gif"
              alt=""
            />
            <p style="color: #fff">{{ $t('layoutPool.aiLayout') }}</p>
          </div>
        </div>
        <div
          class="layout-item active-item"
          v-if="
            fullThemePages.list.length > 6 &&
            !fullThemePages.showLoding &&
            !fullThemePages.showError &&
            !fullThemePages.showNoData
          "
        >
          <div class="spinner-box">
            <div class="spinner-border"></div>
            <div class="spinner"></div>
          </div>
          <p>{{ $t('layoutPool.aiLoading') }}</p>
        </div>
      </div>
      <div
        class="theme-box-content loading-box"
        v-if="fullThemePages.showLoding"
      >
        <div class="theme-item" v-for="item in 6" :key="item">
          <div class="themeSlideBox"></div>
          <div class="colors-box"></div>
          <div class="loading">
            <img class="loading-img-gif" src="@/assets/image/f-1.gif" alt="" />
            <p>{{ $t('layoutPool.aiLayout') }}</p>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showBigView" class="beautify-search-view">
      <div class="beautify-search-view-content">
        <icon-close
          class="modal-close-beautify"
          :style="{ fontSize: '32rem' }"
          v-if="showBigView"
          @click="showBigView = false"
        />
        <div class="thumbnail-box-content">
          <ThumbnailSlide
            class="thumbnail"
            :slide="checkItem"
            :size="1100 * rem"
          />
          <div
            class="left-bar"
            @click="handleClickLeftOrRight('right')"
            v-if="showSearchIndex > 0"
          >
            <i class="iconfont icon-shangyiye"></i>
          </div>
          <div
            class="right-bar"
            @click="handleClickLeftOrRight('left')"
            v-if="showSearchIndex < viewSiles?.length - 1"
          >
            <i class="iconfont icon-xiayiye"></i>
          </div>
        </div>
        <div class="bottom-bar">
          <div
            class="thumbnail-box-bar"
            ref="thumbnailsRef"
            @wheel.prevent="($event) => handleMousewheelThumbnails($event)"
          >
            <ThumbnailSlide
              v-for="(item, index) in viewSiles"
              :key="index"
              class="thumbnail"
              :class="checkItem.id === item.id ? 'actives-item' : ''"
              :slide="item"
              :size="220 * rem"
              :id="`views-bar-${item.id}`"
              @click="handleChangeViewSearch(item, index)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import useBeatifyPage from '@/hooks/useBeatifyPage'
import { storeToRefs } from 'pinia'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import { useSlidesStore, useScreenStore } from '@/store'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const {
  handleThemeClick,
  handlePageViewChange,
  changeVisison,
  handleSingView,
  handleSave,
  handleClose,
  handleClickThumbs,
  handleOpenItem,
  handleCompare,
  initFunction,
  handleClickLeftOrRight,
  handleChangeViewSearch,
  WheelThumbnails,
  handleMousewheelThumbnails,
  handleMouseOverRight,
  handleMouseLeaveRight,
  handleScrollTheme,
  handleChildEvent,
  handleToggle,
  pageList,
  activeTheme,
  viewSiles,
  slides,
  beautifyFirstView,
  fullThemePages,
  watchInitData,
  isOpenCompare,
  showBigView,
  oldImgUrl,
  checkItem,
  slideItems,
  upperThumbnailBox,
  activeIndex,
  thumbnailsRef,
  beautifyEnd,
  beautifyLoading,
  showSearchIndex,
  beautifyTips,
  openColorSingle,
  openDrawing,
  isFristTips,
  showSelectTheme,
  handleUseTheme,
  knowledgeData,
} = useBeatifyPage()
const { rem } = storeToRefs(useScreenStore())

const pageType = computed(() => (value) => {
  return pageList.find((item: any) => item.type === value)?.name
})

watch(
  beautifyFirstView,
  async (newVal) => {
    isFristTips.value = true
    viewSiles.value =
      slides.value.length > 0 ? JSON.parse(JSON.stringify(slides.value)) : []
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
.beautify-search-view {
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
  .cursor-p,
  a {
    cursor: pointer !important;
  }

  .chat-base {
    width: 1022rem;
    .cursor-p,
    a {
      cursor: pointer !important;
    }

    .hoverText {
      cursor: pointer;
    }
  }
}

.thumbnail-box-content {
  position: relative;
  .thumbnail {
    border-radius: 15rem;
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
  &:hover {
    color: #bebcbc;
  }
  &:active {
    color: #fff;
  }
}
.beautify-search-view-content {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  transform: scale(0);
  overflow: hidden;
  animation: fadeInHeight 0.3s forwards ease-in;
  animation-delay: 0.2s;
  padding: 0 60rem;
}

@keyframes fadeInHeight {
  100% {
    transform: scale(1);
  }
}
.fullscreen-beautify {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;

  background-color: rgba($color: #000, $alpha: 0.8);

  .theme-box {
    width: 327rem;
    height: calc(100% - 220rem);
    opacity: 1;
    background: #ffffff;
    box-sizing: border-box;
    border: 1rem solid #d5d2ff;
    border-radius: 10rem;
    padding: 15rem 0rem;
    position: relative;
    overflow: hidden;
    .select_Theme {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 78rem;
      background: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
  .theme-box-content {
    width: 100%;
    height: 100%;
    overflow: auto;
    padding: 0 10rem;
  }

  .theme-item {
    cursor: pointer;
    position: relative;
    width: 100%;
    background: #ffffff;
    box-sizing: border-box;
    border: 3rem solid #e1e1e1;
    border-radius: 10rem;
    overflow: hidden;
    padding: 8rem;
    .themeSlideBox {
      border-radius: 8rem;
      overflow: hidden;
      transition: transform 0.5s;
    }
    margin-bottom: 16rem;
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
    &:hover .themeSlideBox {
      transform: scale(1.1);
    }
  }

  .loading-box {
    .themeSlideBox {
      height: 180rem;
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
    overflow: hidden;
    position: relative;
    width: 100%;
    height: 200rem;
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
    background: #f7f6f6;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    img {
      width: 90rem;
    }
  }
  .spinner-box {
    position: relative;
    width: 40rem;
    height: 40rem;
    margin-bottom: 10rem;
    .spinner-border {
      position: absolute;
      margin: auto;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      width: 40rem;
      height: 40rem;
      border: 10rem solid #eadffa;
      border-radius: 50%;
    }

    .spinner {
      position: absolute;
      margin: auto;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      width: 40rem;
      height: 40rem;
      background: linear-gradient(#f7f6f6, #f7f6f6),
        linear-gradient(270deg, #6040fc 15%, #e750e6 100%);
      background-clip: padding-box, border-box;
      border: 6rem solid transparent;
      border-top-color: #eadffa;
      border-left-color: #eadffa;
      border-right-color: #eadffa;
      border-radius: 50%;
      animation: spinner 0.8s linear infinite;
    }
    @keyframes spinner {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  }
  .left-box-content {
    width: 1226rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: 18rem;
    padding-left: 40rem;
    color: #fff;
    margin-right: 40rem;
    position: relative;
  }
  .left-box-top {
    height: 60px;
  }
  .t-tips {
    font-size: 20rem;
  }
  .left-box-slide {
    width: 100%;
    height: calc(100% - 300rem);
    border-radius: 14rem;
    background: #fff;
    margin: 20rem 0;
    overflow: hidden;
    position: relative;
  }

  .thumbnail-box {
    height: calc(100% - 66rem);
    overflow-y: auto;
    padding: 20rem 30rem;
    @include flex-grid-layout();
  }

  .slide-item {
    @include flex-grid-layout-children(3, 32%);
    overflow: hidden;
    min-height: 200rem;
    border-radius: 6px;
    opacity: 1;
    background-color: #ecf4ff;
    position: relative;
    border: 2rem solid #e1e1e1;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: zoom-in;
    transition: transform 0.2s;
    &:hover {
      transform: scale(1.1);
      box-shadow: 0 1rem 13rem 8rem #e7e7e7;
      border: 2rem solid #fff;
      .click-btn,
      .click-thumbs,
      .click-btn-item,
      .page-type {
        opacity: 1;
      }
    }

    .oldImgUrl-box {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 18rem;
      img {
        width: 100%;
        height: 100%;
        border-radius: 6rem;
      }
    }

    .click-btn {
      opacity: 0;
      position: absolute;
      right: 8rem;
      bottom: 5rem;
      font-size: 12rem;
    }

    .click-btn-item,
    .click-thumbs {
      opacity: 0;
      border-radius: 6rem;
      padding: 3rem 6rem;
      background: rgba(0, 0, 0, 0.6);
      cursor: pointer;
      margin: 10rem;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 1px 3rem 5rem 2rem rgba(232, 231, 231, 0.12);
      .iconfont {
        font-size: 14rem;
        margin-right: 5rem;
      }
    }

    .click-thumbs {
      position: absolute;
      left: 8rem;
      bottom: 5rem;
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
        margin: 0rem 5rem 2rem;
        transition: transform;
        &:hover {
          color: $lightColor;
        }
        &:active {
          color: $themeColor;
        }
      }
    }

    .page-type {
      opacity: 0;
      cursor: pointer;
      user-select: none;
      font-size: 12rem;
      color: #9f9b9b;
      position: absolute;
      top: 10rem;
      left: 10rem;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      .helpIcon {
        font-size: 14rem;
        cursor: pointer;
        margin-left: 4rem;
      }
      padding: 8rem;
      background: #e9e7f3;
      border-radius: 5rem;
    }
  }

  @keyframes showList {
    100% {
      opacity: 1;
    }
  }
  .page-type-list {
    position: absolute;
    top: 35rem;
    width: 90rem;
    padding: 4rem;
    background-color: #fff;
    border-radius: 5rem;
    box-shadow: 0rem 0rem 3rem 1rem #ccc;
    opacity: 0;
    animation: showList 0.8s forwards;
    & > div {
      line-height: 20rem;
      cursor: pointer;
      padding: 2rem 4rem;
      &:hover {
        background: $lightColor;
        color: $themeColor;

        border-radius: 5rem;
      }
    }
  }
  .activeItems {
    opacity: 0;
    z-index: -5;
  }
  .loading-img-gif {
    width: 120rem;
    height: auto;
    margin: 10rem 0;
  }

  .loading {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background-color: #8e8e8e33;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    p {
      margin-top: 10rem;
      font-size: 12rem;
      color: #2d2d2d;
    }
    .beautifyLoading-gif {
      width: 45rem;
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

  .b-title {
    font-size: 24rem;
    font-weight: bold;
    line-height: 44rem;
  }
  .rate-box {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 66rem;
    border-radius: 14rem;
    color: #767676;
    background: #ffffff;
    box-shadow: 0px -4px 10px 0px rgba(0, 0, 0, 0.12);
    display: flex;
    align-items: center;
    padding: 0 20rem;
  }

  .compare {
    user-select: none;
    position: absolute;
    right: 20rem;
    top: 24rem;
    cursor: pointer;
    display: flex;
    font-size: 16rem;
    align-items: center;
    .i-icon {
      font-size: 24rem;
    }
    &:hover {
      color: $themeColor;
    }
    &:active {
      color: $lightColor;
    }
  }
  .left-box-bottom {
    position: relative;
    text-align: center;
    height: 40rem;
    display: flex;
    justify-content: center;
    align-items: center;
    button + button {
      margin-left: 20rem;
      vertical-align: middle;
    }

    .other-btn {
      position: absolute;
      left: 0rem;
      top: 50%;
      transform: translateY(-50%);
      ::v-deep(.arco-checkbox-label) {
        color: #fff;
        font-size: 14rem;
      }
      ::v-deep(.arco-icon-hover:hover::before),
      ::v-deep(.arco-icon-hover.arco-checkbox-icon-hover::before) {
        width: 0;
        height: 0;
      }
      ::v-deep(.arco-checkbox-icon) {
        border-radius: 50%;
      }
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
}
</style>
<style lang="scss">
.beautify-search-view {
  color: #1a1a1a;
  --yoo-theme-color: #4e3eff;
  --yoo-color-white: #ffffff;
  .template-base.base_web {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  .font-Medium {
    color: #1a1a1a !important;
  }
  .knowledge-base .knowledge-box .knowledge-content .content-base-button a {
    cursor: pointer;
  }
  button.arco-btn.arco-btn-secondary {
    padding: 0 10px;
    outline: none;
    border: 0;
    border-radius: 4px;
    background: var(--yoo-theme-color);
    color: var(--yoo-color-white);
    cursor: pointer;
    box-sizing: border-box;
  }
  .arco-btn-primary,
  .arco-btn-primary[type='button'],
  .arco-btn-primary[type='submit'] {
    background-color: var(--yoo-theme-color);
  }
  button.arco-btn.arco-btn-secondary:hover,
  .arco-btn-primary:hover,
  .arco-btn-primary[type='button']:hover,
  .arco-btn-primary[type='submit']:hover {
    background: #6052ff;
    color: var(--yoo-color-white);
  }
  button.arco-btn.arco-btn-secondary:active,
  .arco-btn-primary:active,
  .arco-btn-primary[type='button']:active,
  .arco-btn-primary[type='submit']:active {
    background: #3523f9;
    color: var(--yoo-color-white);
  }
  .arco-btn-primary.arco-btn-disabled,
  .arco-btn-primary[type='button'].arco-btn-disabled,
  .arco-btn-primary[type='submit'].arco-btn-disabled {
    color: #fff;
    background-color: var(--color-primary-light-3);
    border-color: transparent;
    cursor: not-allowed;
  }
  button.arco-btn.arco-btn-secondary:disabled {
    background: #eeeeee;
    color: #767676;
    pointer-events: none;
  }
}
</style>
