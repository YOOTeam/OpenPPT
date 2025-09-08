<template>
  <div
    class="chat-card"
    :class="[
      cardData.questionType === 'question' ? 'chat-ul-right' : '',
      cardData.content.type,
    ]"
  >
    <div
      class="chat-steam-drum"
      :class="[
        cardData.questionType === 'request'
          ? 'chat-sourceleft'
          : 'chat-sourceright',
        cardData.content?.showHistory ? 'history' : '',
      ]"
    >
      <div class="chat-steam-box" v-if="!cardData.isLoading">
        <div
          class="chat-card-content"
          @click="handleClick"
          v-html="cardData.content.text"
        ></div>
        <div
          class="chat-card-description"
          v-html="cardData.content.description"
        ></div>
        <div
          class="chat-card-aciton-btn"
          v-if="cardData.content.actionBtn"
          @click.stop
        >
          <Button
            :type="item?.type || 'default'"
            v-for="(item, index) in cardData.content.actionBtn"
            :key="index"
            @click="item.actionFn(item, cardData)"
            >{{ item.name }}</Button
          >
        </div>
      </div>
      <div class="chat-steam-box" v-else>
        <div class="loading">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { nextTick, ref, reactive, onMounted } from 'vue'
import Button from '@/components/Button.vue'
const props = defineProps({
  cardData: {
    type: Object,
  },
})

const emit = defineEmits(['click'])

const handleClick = (event) => {
  if (
    event?.target?.nodeName === 'A' &&
    event?.target?.className === 'linkPage'
  ) {
    emit('click', {
      type: 'pageLink',
      value: event.target.getAttribute('pageid'),
    })
  }
}
</script>
<style lang="scss">
.chat-card {
  .linkPage {
    cursor: pointer;
    text-decoration: underline;
    margin: 0 4rem;
  }
  margin-bottom: 14rem;
  &.chat-ul-right {
    text-align: right;
    &:hover {
      .godmode-btn {
        opacity: 1;
        transition: all 0.3s linear;
      }
    }
    .godmode-btn {
      opacity: 0;
      margin-right: 8px;
      font-size: 15px;
      transition: all 0.3s linear;
      &:active {
        opacity: 0.9;
      }
      &.disabled {
        display: none;
        pointer-events: none;
      }
    }
  }
}

.chat-steam-drum {
  display: inline-block;
  max-width: 100%;
  font-size: 14rem;
  line-height: 22rem;
  color: #1a1a1a;
  text-align: left;
  overflow-wrap: break-word;
  opacity: 0;
  animation: chatshow 0.2s ease-out 0.1s forwards;
  box-sizing: border-box;
  .chat-steam-box {
    background: #fff;
    border-radius: 8rem;
    padding: 10rem;
    border: 1px solid #d5d2ff;

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40rem;
      font-size: 20rem;
    }

    .loading span {
      display: inline-block;
      opacity: 0;
      animation: blink 2s infinite both;
      margin-right: 2rem;
    }

    .loading span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .loading span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes blink {
      0% {
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }
  }

  .chat-card-description {
    margin: 4rem 0;
    font-size: 12rem;
    color: #999;
  }

  .chat-card-aciton-btn {
    display: flex;
    justify-content: flex-end;
  }

  &.chat-sourceright {
    .chat-steam-box {
      color: #fff;
      background: $themeColor;
    }
  }

  &-content {
    white-space: pre-wrap;
    padding: 8rem 10rem;
    box-sizing: border-box;
  }
}
@keyframes chatshow {
  0% {
    opacity: 0;
    transform: translateY(50rem);
  }
  100% {
    opacity: 1;
    transform: none;
  }
}
</style>
