<template>
  <div class="generateLoading">
    <template
      v-if="
        createLoading.showType === 'cover' || createLoading.showType === 'end'
      "
    >
      <div class="loading4" v-if="createLoading.loadingType == 1">
        <div class="rect1"></div>
        <div class="rect-box">
          <div class="rect2"></div>
          <div class="rect3"></div>
        </div>
        <div class="img1"></div>
        <div class="img2"></div>
      </div>
      <div class="loading5" v-else>
        <div class="rect1"></div>
        <div class="rect2"></div>
        <div class="rect3"></div>
        <div class="rect4"></div>
        <div class="img1"></div>
      </div>
    </template>
    <template v-else-if="createLoading.showType === 'catalog'">
      <div class="loading3">
        <div class="rect-box">
          <div class="rect"></div>
          <div class="rect-box1">
            <div class="rect-box2">
              <div class="rect3"></div>
              <div class="rect4"></div>
            </div>
            <div class="rect-box2">
              <div class="rect3"></div>
              <div class="rect4"></div>
            </div>
            <div class="rect-box2">
              <div class="rect3"></div>
              <div class="rect4"></div>
            </div>
            <div class="rect-box2">
              <div class="rect3"></div>
              <div class="rect4"></div>
            </div>
            <div class="rect-box2">
              <div class="rect3"></div>
              <div class="rect4"></div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else-if="createLoading.showType === 'chapter'">
      <div class="loading1" v-if="createLoading?.loadingType == 1">
        <div class="circle1"></div>
        <div class="rect1"></div>
        <div class="rect2"></div>
        <div class="circle2"></div>
        <div class="rect3"></div>
      </div>
      <div class="loading6" v-if="createLoading?.loadingType == 2">
        <div class="rect-box">
          <div class="text1">PART</div>
          <div class="rect1"></div>
          <div class="rect2"></div>
          <div class="rect3"></div>
        </div>
      </div>
    </template>
    <template v-else-if="createLoading?.showType === 'content'">
      <div class="loading2" v-if="createLoading.loadingType == 1">
        <div class="rect1"></div>
        <div class="rect-box">
          <div class="rect-box1">
            <div class="rect2"></div>
            <div class="rect3"></div>
            <div class="rect4"></div>
          </div>
          <div class="rect-box1">
            <div class="rect2"></div>
            <div class="rect3"></div>
            <div class="rect4"></div>
          </div>
        </div>
      </div>
      <div class="loading7" v-else-if="createLoading.loadingType == 2">
        <div class="rect1"></div>
        <div class="rect2">
          <div class="rect5"></div>
        </div>
        <div class="rect3"></div>
        <div class="rect4"></div>
      </div>
      <div class="loading8" v-else-if="createLoading.loadingType == 3">
        <div class="rect1"></div>
        <div class="rect-box">
          <div class="box1">
            <div class="circle1"></div>
            <div class="rect2"></div>
            <div class="rect3"></div>
          </div>
          <div class="box2">
            <div class="circle1"></div>
            <div class="rect2"></div>
            <div class="rect3"></div>
          </div>
          <div class="box3">
            <div class="circle1"></div>
            <div class="rect2"></div>
            <div class="rect3"></div>
          </div>
          <div class="box4">
            <div class="circle1"></div>
            <div class="rect2"></div>
            <div class="rect3"></div>
          </div>
        </div>
      </div>
      <div class="loading9" v-else-if="createLoading.loadingType == 4">
        <div class="rect1"></div>
        <div class="rect-box1">
          <div class="rect-box2">
            <div class="rect2"></div>
            <div class="rect3"></div>
            <div class="rect4"></div>
            <div class="rect5"></div>
          </div>
          <div class="rect-box3"></div>
        </div>
      </div>
      <div class="loading10" v-else-if="createLoading.loadingType == 5">
        <div class="rect1"></div>
        <div class="rect-box1">
          <div class="rect-box2">
            <div class="circle">1</div>
            <div class="rect2"></div>
            <div class="rect3"></div>
          </div>
          <div class="rect-box2">
            <div class="circle">2</div>
            <div class="rect2"></div>
            <div class="rect3"></div>
          </div>
        </div>
      </div>
    </template>
    <template v-else-if="createLoading?.showType === 'chart'">
      <div class="loading11">
        <div class="rect1"></div>
        <div class="img1"></div>
      </div>
    </template>
  </div>
</template>

<script setup lange="ts">
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'

const mainStore = useMainStore()
const { createLoading } = storeToRefs(mainStore)
</script>

<style lang="scss" scoped>
.generateLoading {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1000;
  overflow: hidden;
  border-radius: 10rem;
  background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.6) 46%,
      rgba(255, 255, 255, 1) 50%,
      rgba(255, 255, 255, 0.6) 54%
    )
    #f2f2f2;

  background-size: 300% 100%;
  animation: l1 1s infinite linear;
  .loading1 {
    scale: 1;
    position: relative;

    .circle1 {
      width: 416.16rem;
      height: 416.16rem;
      border-radius: 50%;
      background: rgba(237, 239, 241, 0.52);
      animation: anima;
      position: absolute;
      top: -150rem;
      left: -150rem;
      animation: anima 3s infinite;
      animation-delay: 0s;
    }
    .rect1 {
      width: 1093.49rem;
      height: 134.55rem;
      border-radius: 10rem;
      background: #edeff1;
      margin: 0 auto;
      position: absolute;
      top: 238rem;
      left: 0;
      right: 0;
      animation: anima 3s infinite;
      animation-delay: 0.3s;
    }
    .rect2 {
      width: 1093.49rem;
      height: 39.79rem;
      border-radius: 10rem;
      background: #edeff1;
      margin: 0 auto;
      position: absolute;
      top: 422rem;
      left: 0;
      right: 0;
      animation: anima 3s infinite;
      animation-delay: 0.4s;
    }
    .circle2 {
      width: 416.16rem;
      height: 416.16rem;
      border-radius: 50%;
      background: rgba(237, 239, 241, 0.52);
      position: absolute;
      top: 422rem;
      left: 973rem;
      right: 0;
      animation: anima 3s infinite;
      animation-delay: 0.6s;
    }

    .rect3 {
      width: 136.73rem;
      height: 39.79rem;
      border-radius: 10rem;

      background: #edeff1;
      position: absolute;
      top: 575.81rem;
      left: 1027.86rem;
      right: 0;
      animation: anima 3s infinite;
      animation-delay: 0.6s;
    }
  }
  .loading2 {
    position: relative;
    .rect1 {
      width: 1093.49rem;
      height: 134.55rem;
      border-radius: 10rem;
      background: #edeff1;
      margin: 0 auto;
      position: absolute;
      top: 54rem;
      left: 0;
      right: 0;
      animation: anima 3s infinite;
      animation-delay: 0s;
    }
    .rect-box {
      display: flex;
      justify-content: space-between;
      width: 1093.49rem;
      height: 434.55rem;
      border-radius: 10rem;
      margin: 0 auto;
      position: absolute;
      top: 206rem;
      left: 0;
      right: 0;

      .rect-box1 {
        width: 518.04rem;
        border-radius: 10rem;
        .rect2 {
          width: 518.04rem;
          height: 259.55rem;
          border-radius: 10rem;
          background: #edeff1;
          animation: anima 3s infinite;
          animation-delay: 0.3s;
        }
        .rect3 {
          width: 518.04rem;
          height: 41.19rem;
          border-radius: 10rem;
          background: red;
          margin: 0 auto;
          position: absolute;
          top: 295rem;
          background: #edeff1;
          animation: anima 3s infinite;
          animation-delay: 0.6s;
        }
        .rect4 {
          width: 518.04rem;
          height: 41.19rem;
          border-radius: 10rem;
          background: red;
          margin: 0 auto;
          position: absolute;
          top: 373rem;
          background: #edeff1;
          animation: anima 3s infinite;
          animation-delay: 0.6s;
        }
      }
    }
  }
  .loading3 {
    width: 100%;
    height: 100%;
    .rect-box {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: space-around;
      align-items: center;
      .rect {
        width: 189.92rem;
        height: 111.12rem;
        border-radius: 10rem;
        background: #edeff1;
        animation: anima 3s infinite;
        animation-delay: 0s;
      }
      .rect-box1 {
        width: 60%;
        height: 80%;
        display: flex;
        flex-direction: column;

        justify-content: space-around;
        animation: anima 3s infinite;
        animation-delay: 0.3s;

        .rect-box2 {
          display: flex;
          flex-direction: row;

          .rect3 {
            width: 59.62rem;
            height: 61.52rem;
            border-radius: 10rem;
            background: #edeff1;
            margin: 0 52rem;
          }
          .rect4 {
            width: 480.79rem;
            height: 61.52rem;
            border-radius: 10rem;
            background: #edeff1;
          }
        }
      }
    }
  }
  .loading4 {
    position: relative;
    width: 100%;
    height: 100%;
    .rect1 {
      width: 153.39px;
      height: 153.39px;
      border-radius: 5rem 0rem 0rem 0rem;
      background: #edeff1;
      position: absolute;
      top: 34rem;
      left: 29rem;
      animation: anima 3s infinite;
      animation-delay: 0s;
    }
    .rect-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      animation: anima 3s infinite;
      animation-delay: 0.2s;
      .rect2 {
        width: 570.65rem;
        height: 134.55rem;
        border-radius: 10rem;
        opacity: 1;

        background: #edeff1;
      }
      .rect3 {
        width: 570.65rem;
        height: 39.79rem;
        border-radius: 10rem;
        opacity: 1;

        background: #edeff1;
        margin-top: 50rem;
      }
    }
    .img1 {
      width: 164.98rem;
      height: 164.97rem;
      position: absolute;
      top: 32rem;
      right: 48rem;
      background-image: url('@/assets/image/generateLoading1.png');
      background-size: contain;
      animation: anima 3s infinite;
      animation-delay: 0s;
    }
    .img2 {
      width: 460.16rem;
      height: 460.16rem;
      position: absolute;
      right: 0rem;
      bottom: 0;
      background-image: url('@/assets/image/generateLoading2.png');
      background-size: contain;
      animation: anima 3s infinite;
      animation-delay: 0s;
    }
  }
  .loading5 {
    .rect1 {
      width: 108.75rem;
      height: 39.79rem;
      border-radius: 10rem;
      background: #edeff1;
      position: absolute;
      top: 56rem;
      left: 60rem;
      animation: anima 3s infinite;
      animation-delay: 0s;
    }
    .rect2 {
      width: 570.65rem;
      height: 134.55rem;
      border-radius: 10rem;
      background: #edeff1;
      position: absolute;
      top: 222rem;
      left: 60rem;
      animation: anima 3s infinite;
      animation-delay: 0.2s;
    }
    .rect3 {
      width: 570.65rem;
      height: 39.79rem;
      border-radius: 10rem;
      background: #edeff1;
      position: absolute;
      top: 406rem;
      left: 60rem;
      animation: anima 3s infinite;
      animation-delay: 0.4s;
    }
    .rect4 {
      width: 327.35rem;
      height: 39.79rem;
      border-radius: 10rem;
      background: #edeff1;
      position: absolute;
      top: 508rem;
      left: 60rem;
      animation: anima 3s infinite;
      animation-delay: 0.6s;
    }
    .img1 {
      width: 548.67rem;
      height: 417.26rem;
      background-image: url('@/assets/image/generateLoading3.png');
      background-size: contain;
      position: absolute;
      bottom: 4.5rem;
      right: 15rem;
      animation: anima 3s infinite;
      animation-delay: 0.8s;
    }
  }
  .loading6 {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    .rect-box {
      position: relative;
      width: 1093.49rem;
      height: 400.28rem;
      .text1 {
        color: #edeff1;
        font-family: SourceHanSansCN-Medium;
        position: absolute;
        top: 20rem;
        font-size: 84rem;
        left: 50rem;
        animation: anima 3s infinite;
        animation-delay: 0s;
      }
      .rect1 {
        width: 179.76rem;
        height: 161.59rem;
        border-radius: 10rem;
        background: #edeff1;
        position: absolute;
        top: 135rem;
        left: 50rem;
        animation: anima 3s infinite;
        animation-delay: 0s;
      }
      .rect2 {
        width: 734.72rem;
        height: 134.55rem;
        border-radius: 10rem;
        background: #edeff1;
        position: absolute;
        top: 74rem;
        left: 313rem;
        animation: anima 3s infinite;
        animation-delay: 0.2s;
      }
      .rect3 {
        width: 734.72rem;
        height: 39.79rem;
        border-radius: 10rem;
        background: #edeff1;
        position: absolute;
        top: 257rem;
        left: 313rem;
        animation: anima 3s infinite;
        animation-delay: 0.2s;
      }
    }
  }
  .loading7 {
    .rect1 {
      width: 1093.49rem;
      height: 300.28rem;
      border-radius: 10rem;
      background: #edeff1;
      position: absolute;
      left: 0;
      right: 0;
      margin: 0 auto;
      top: 54rem;
      animation: anima 3s infinite;
      animation-delay: 0s;
    }
    .rect2 {
      position: absolute;
      width: 1093.49rem;
      height: 75.89rem;
      border-radius: 10rem;
      margin: 0 auto;
      position: absolute;
      left: 0;
      right: 0;
      top: 390rem;
      animation: anima 3s infinite;
      animation-delay: 0.2s;
    }
    .rect3 {
      width: 1093.49rem;
      height: 41.19rem;
      border-radius: 10rem;
      background: #edeff1;
      margin: 0 auto;
      position: absolute;
      left: 0;
      right: 0;
      top: 502rem;
      animation: anima 3s infinite;
      animation-delay: 0.4s;
    }

    .rect4 {
      width: 1093.49rem;
      height: 41.19rem;
      border-radius: 10rem;
      background: #edeff1;
      margin: 0 auto;
      position: absolute;
      left: 0;
      right: 0;
      top: 580rem;
      animation: anima 3s infinite;
      animation-delay: 0.6s;
    }
    .rect5 {
      width: 380.21rem;
      height: 75.89rem;
      position: absolute;
      border-radius: 10rem;
      background: #edeff1;
      margin: 0 auto;
    }
  }
  .loading8 {
    .rect1 {
      width: 1093.49rem;
      height: 106.23rem;
      border-radius: 10rem;
      background: #edeff1;
      margin: 0 auto;
      position: absolute;
      left: 0;
      right: 0;
      top: 78rem;
      animation: anima 3s infinite;
      animation-delay: 0s;
    }
    .rect-box {
      display: flex;
      justify-content: space-around;
      position: absolute;
      left: 0;
      right: 0;
      top: 242rem;
      .box1 {
        animation: anima 3s infinite;
        animation-delay: 0.2s;
        .circle1 {
          width: 180.42rem;
          height: 180.42rem;
          background: #edeff1;
          border-radius: 50%;
        }
        .rect2 {
          width: 184.93rem;
          height: 42.04rem;
          border-radius: 10rem;
          opacity: 1;
          margin-top: 28rem;
          background: #edeff1;
        }
        .rect3 {
          width: 112.86rem;
          height: 42.04rem;
          border-radius: 10rem;
          opacity: 1;
          margin-top: 24rem;
          background: #edeff1;
        }
      }
      .box2 {
        animation: anima 3s infinite;
        animation-delay: 0.4s;
        .circle1 {
          width: 180.42rem;
          height: 180.42rem;
          background: #edeff1;
          border-radius: 50%;
        }
        .rect2 {
          width: 184.93rem;
          height: 42.04rem;
          border-radius: 10rem;
          opacity: 1;
          margin-top: 28rem;
          background: #edeff1;
        }
        .rect3 {
          width: 112.86rem;
          height: 42.04rem;
          border-radius: 10rem;
          opacity: 1;
          margin-top: 24rem;
          background: #edeff1;
        }
      }
      .box3 {
        animation: anima 3s infinite;
        animation-delay: 0.6s;
        .circle1 {
          width: 180.42rem;
          height: 180.42rem;
          background: #edeff1;
          border-radius: 50%;
        }
        .rect2 {
          width: 184.93rem;
          height: 42.04rem;
          border-radius: 10rem;
          opacity: 1;
          margin-top: 28rem;
          background: #edeff1;
        }
        .rect3 {
          width: 112.86rem;
          height: 42.04rem;
          border-radius: 10rem;
          opacity: 1;
          margin-top: 24rem;
          background: #edeff1;
        }
      }
      .box4 {
        animation: anima 3s infinite;
        animation-delay: 0.8s;
        .circle1 {
          width: 180.42rem;
          height: 180.42rem;
          background: #edeff1;
          border-radius: 50%;
        }
        .rect2 {
          width: 184.93rem;
          height: 42.04rem;
          border-radius: 10rem;
          opacity: 1;
          margin-top: 28rem;
          background: #edeff1;
        }
        .rect3 {
          width: 112.86rem;
          height: 42.04rem;
          border-radius: 10rem;
          opacity: 1;
          margin-top: 24rem;
          background: #edeff1;
        }
      }
    }
  }
  .loading9 {
    .rect1 {
      width: 1093.49rem;
      height: 106.23rem;
      border-radius: 10rem;
      opacity: 1;
      background: #edeff1;
      margin: 0 auto;
      position: absolute;
      left: 0;
      right: 0;
      top: 78rem;
      animation: anima 3s infinite;
      animation-delay: 0s;
    }
    .rect-box1 {
      margin: 0 auto;
      position: absolute;
      left: 0;
      right: 0;
      top: 248rem;
      display: flex;
      justify-content: space-around;
      .rect-box2 {
        animation: anima 3s infinite;
        animation-delay: 0.2s;
        .rect2 {
          width: 517.63rem;
          height: 42.04rem;
          border-radius: 10rem;
          background: #edeff1;
        }
        .rect3 {
          width: 315.9rem;
          height: 42.04rem;
          border-radius: 10rem;
          background: #edeff1;
          margin-top: 24rem;
        }
        .rect4 {
          width: 517.63rem;
          height: 42.04rem;
          border-radius: 10rem;
          background: #edeff1;
          margin-top: 74rem;
        }
        .rect5 {
          width: 315.9rem;
          height: 42.04rem;
          border-radius: 10rem;
          background: #edeff1;
          margin-top: 24rem;
        }
      }
      .rect-box3 {
        width: 509.65rem;
        height: 349.77rem;
        border-radius: 10rem;
        background: #edeff1;
        animation: anima 3s infinite;
        animation-delay: 0.4s;
      }
    }
  }
  .loading10 {
    display: flex;
    justify-content: space-around;
    padding-top: 43rem;
    .rect1 {
      width: 466.81rem;
      height: 581.36rem;
      border-radius: 10rem;
      background: #edeff1;
      animation: anima 3s infinite;
      animation-delay: 0s;
    }
    .rect-box1 {
      .rect-box2 {
        .circle {
          width: 86.21rem;
          height: 86.21rem;
          background: #edeff1;
          font-size: 50rem;
          border-radius: 50%;
          text-align: center;
          line-height: 86.21rem;
          -webkit-text-stroke: #87898a;
          text-stroke: #87898a;
          margin-top: 49rem;
          font-family: SourceHanSansCN-Medium;
          animation: anima 3s infinite;
          animation-delay: 0.2s;
        }
        .rect2 {
          width: 517.63rem;
          height: 42.04rem;
          border-radius: 10rem;
          background: #edeff1;
          margin-top: 24rem;
          animation: anima 3s infinite;
          animation-delay: 0.4s;
        }
        .rect3 {
          width: 315.9rem;
          height: 42.04rem;
          border-radius: 10rem;
          background: #edeff1;
          margin-top: 24rem;
          animation: anima 3s infinite;
          animation-delay: 0.4s;
        }
      }
    }
  }
  .loading11 {
    .rect1 {
      width: 1093.49rem;
      height: 106.23rem;
      border-radius: 10rem;
      background: #edeff1;
      margin: 0 auto;
      position: absolute;
      left: 0;
      right: 0;
      top: 47rem;
      animation: anima 3s infinite;
      animation-delay: 0s;
    }
    .img1 {
      background-image: url('@/assets/image/generateLoading4.png');
      background-size: contain;
      background-repeat: no-repeat;
      width: 754.73rem;
      height: 400.54rem;
      position: absolute;
      margin: 0 auto;
      left: 0;
      right: 0;
      top: 262rem;
      animation: anima 3s infinite;
      animation-delay: 0.2s;
    }
  }

  @keyframes l1 {
    0% {
      background-position: right;
    }
  }
  @keyframes anima {
    0% {
      opacity: 0;
      transform: translateY(100rem);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>
