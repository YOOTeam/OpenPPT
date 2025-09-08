<template>
  <div class="operate-bar">
    <div
      class="operate-bar-item"
      v-for="item in option"
      :key="item.key"
      @click="handleOpenBar(item)"
      :class="item.key !== 'chat' ? 'operate-bar-other' : ''"
    >
      <template v-if="item.key === 'chat'">
        <img
          class="chat-img"
          src="@/assets/image/chat-normal.png"
          alt=""
          srcset=""
        />
        <img
          class="chat-img-hover"
          src="@/assets/image/chat-hover.png"
          alt=""
        />
        <i class="isChat">{{ item.label }}</i>
        <div
          class="position-relative"
          v-if="
            (props.elementType === 'text' && openChatBar) ||
            (props.elementType === 'image' && openChatBar) ||
            (props.elementType === 'shape' &&
              handleElement?.text?.content &&
              openChatBar) ||
            (props.elementType === 'shape' &&
              handleElement?.fillPicture?.src &&
              openChatBar)
          "
        >
          <template
            v-if="
              props.elementType === 'text' ||
              (props.elementType === 'shape' && handleElement?.text?.content)
            "
          >
            <div
              class="item-tips"
              v-for="item in textOpction"
              :key="item.key"
              @click.stop="handleOpenBar(item)"
              :class="item.key === 'textCreate' ? 'disabled-hover' : ''"
            >
              <img
                src="@/assets/image/textCreate.png"
                alt=""
                srcset=""
                v-if="item.key === 'textExpand'"
              />
              <img
                src="@/assets/image/textExpend.png"
                alt=""
                srcset=""
                v-else-if="item.key === 'textCreate'"
              />
              <img
                src="@/assets/image/textTranslate.png"
                alt=""
                srcset=""
                v-else
              />
              <div style="white-space: nowrap; width: fit-content">
                {{ item.name }}
              </div>
            </div>
          </template>
          <template v-else>
            <div
              :class="
                item.key === 'imgDirect'
                  ? 'item-tips disabled-hover'
                  : 'item-tips'
              "
              v-for="item in imgOpction"
              :key="item.key"
              @click.stop="handleOpenBar(item)"
            >
              <img
                src="@/assets/image/imgcreate.png"
                alt=""
                srcset=""
                v-if="item.key === 'imgCreate'"
              />
              <img
                src="@/assets/image/imgserach.png"
                alt=""
                srcset=""
                v-else-if="item.key === 'imgSearch'"
              />
              <img
                src="@/assets/image/imgdirection.png"
                alt=""
                srcset=""
                v-else
              />
              <div style="white-space: nowrap; width: fit-content">
                {{ item.name }}
              </div>
            </div>
          </template>
          <div
            class="translate-middle"
            v-if="
              (props.elementType === 'text' ||
                props.elementType === 'image' ||
                props.elementType === 'shape') &&
              openChatBar
            "
          >
            <template v-if="textType === 'assist'">
              <div
                class="item-tips"
                v-for="item in assistOption"
                :key="item.key"
                @click.stop="handleOpenBar(item)"
              >
                <div style="white-space: nowrap; width: fit-content">
                  {{ item.name }}
                </div>
              </div>
            </template>
            <template v-if="textType === 'translate'">
              <div
                class="item-tips"
                v-for="item in translationOption"
                :key="item.key"
                @click.stop="handleOpenBar(item)"
              >
                <div style="white-space: nowrap; width: fit-content">
                  {{ item.name }}
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
      <template v-else>
        <component :is="item.icon" v-if="item.key == 'group'" />
        <i class="iconfont" :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import useChatToolbar from '@/hooks/useChatToobar'
import { useMainStore } from '@/store'

import { storeToRefs } from 'pinia'
const mainStore = useMainStore()
const { handleElement } = storeToRefs(mainStore)
const { t } = useI18n()
const props = defineProps<{
  elementType: string
}>()

// 导入并使用钩子函数
const {
  option,
  openChatBar,
  textType,
  textOpction,
  imgOpction,
  assistOption,
  translationOption,
  handleOpenBar,
  getHistroyId,
} = useChatToolbar(props.elementType)

onMounted(() => {
  // 初始化历史ID
  getHistroyId()
})
</script>
<style lang="scss">
.operate-bar {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  margin-left: -5px;
  background: #fff;
  padding: 2px 4px;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.12);

  .operate-bar-item {
    font-size: 14px;
    padding: 8px 0px;
    min-width: 100px;
    text-align: center;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
    color: #1a1a1a;
    position: relative;
    span {
      white-space: nowrap;
    }
    .chat-img,
    .chat-img-hover {
      width: 24px;
      margin-left: 8px;
    }
    .iconfont {
      margin-right: 5px;
      color: #767676;
      font-size: 20px;
    }
    .chat-img-hover {
      display: none;
    }

    .isChat {
      font-weight: bold;
      min-width: 70px;
      cursor: pointer;
      background-clip: text;
      font-family: Alibaba PuHuiTi 2;
      font-size: 16px;
      font-weight: 900;
      background: linear-gradient(270deg, #6040fc 15%, #e750e6 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
    }
    &:hover {
      background: #f4f5f8;
      .chat-img {
        display: none;
      }
      .chat-img-hover {
        display: block;
      }

      .isChat {
        font-weight: bold;
        min-width: 70px;
        cursor: pointer;
        background-clip: text;
        font-family: Alibaba PuHuiTi 2;
        font-size: 16px;
        font-weight: 900;
        background: linear-gradient(190deg, #e750e6 10%, #6040fc 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
      }
      span {
        color: $themeColor;
      }
      .iconfont {
        color: $themeColor;
      }
    }

    &:active {
      span {
        color: $themeColor;
      }
      .iconfont {
        color: $themeColor;
      }
    }

    .position-relative {
      position: absolute;
      top: 50px;
      left: 0;
      padding: 5px 7px 5px 5px;
      background: #ffffff;
      box-shadow: 0px 0px 15px 0px rgba(166, 166, 166, 0.33);
      border-radius: 8px;
    }
    .translate-middle {
      position: absolute;
      top: 0;
      left: 105%;
      padding: 5px 7px 5px 5px;
      background: #ffffff;
      box-shadow: 0px 0px 15px 0px rgba(166, 166, 166, 0.33);
      border-radius: 8px;
    }
    .item-tips {
      font-size: 14px;
      display: flex;
      align-items: center;
      padding: 8px 6px;
      border-radius: 8px;
      img {
        width: 18px;
        margin-right: 4px;
      }

      &:hover {
        background: #f4f5f8;
        cursor: pointer;
      }
    }

    .disabled-hover {
      color: #aaaaaa;
      background: #fff;
      cursor: default;
      &:hover {
        background: #fff;
        cursor: default;
      }
      img {
        opacity: 0.6;
      }
    }
  }

  .operate-bar-other {
    &:active {
      background: #babaea;
    }
  }
}
</style>
