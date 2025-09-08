<template>
  <div
    class="chat-box"
    @click.stop
    @keydown.stop
    @keyup.stop
    @blur.stop
    @copy.stop
    @paste.stop
  >
    <div class="chat-content chatScroll">
      <div class="chat-content-top">
        <div class="time">- {{ time }} -</div>
        <div class="content-box">
          <div class="content-img">
            <div class="img"></div>
          </div>
          <div class="content-text">
            {{ t('OpenModal.text9') }}
          </div>
          <div class="content-btn" @click="handleClick">
            <div class="btn">{{ t('OpenModal.text10') }}</div>
          </div>
        </div>
      </div>
      <div class="chat-content-search"></div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const time = ref('')
// 获取当前时间的月和日，格式为x月x日
const getTime = () => {
  const date = new Date()
  const month = date.getMonth() + 1
  const day = date.getDate()
  time.value = `${month}月${day}日`
}
const handleClick = () => {
  window.open('https://www.chatppt.cn')
}
onMounted(() => {
  getTime()
})
</script>
<style lang="scss" scoped>
.chat-box {
  @include drage-modal-layout();
  width: 360px;
  padding: 0;
  background: #ffffff;
  .title {
    padding: 10rem 0;
    border-radius: 5rem;
  }

  .chat-content {
    overflow-y: auto;
    font-size: 14rem;
    height: 754.09rem;
    .chat-content-top {
      .time {
        text-align: center;
        padding: 50rem 0 30rem 0;
        font-size: 14rem;
        font-weight: 400;
        line-height: 18rem;
        color: #a3a1b9;
      }
      .content-box {
        border: 1px solid #d5d2ff;
        background-color: #ffffff;
        border-radius: 8rem;
        margin: 0 16rem;
        padding: 1rem 0;
        .content-img {
          margin: 9rem 10rem 20rem 10rem;
          .img {
            height: 106rem;
            background-repeat: no-repeat;
            background-size: cover;
            background-image: url('//image.yoojober.com/users/2025-09/68b7fcd2b4d59.png');
          }
        }
        .content-text {
          margin: 0 20rem;
          font-size: 14rem;
          line-height: 24rem;
          color: #1a1a1a;
        }
        .content-btn {
          display: flex;
          justify-content: end;
          margin-top: 20rem;
          .btn {
            display: flex;
            align-items: center;
            border-radius: 7rem;
            opacity: 1;
            padding: 14rem 32rem;
            margin-right: 16rem;
            margin-bottom: 16rem;
            font-size: 16rem;
            font-weight: normal;
            color: #ffffff;
            background: #453bff;
            cursor: pointer;
            &:hover {
              background: #3a32e6;
            }
            &:active {
              background: #2a24c4;
            }
          }
        }
      }
    }
  }
  .chat-footer {
    padding: 15rem;
  }
}
</style>
