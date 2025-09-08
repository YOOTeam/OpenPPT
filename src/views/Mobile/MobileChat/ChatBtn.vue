<template>
  <div class="mobile-chat-btn">
    <i class="iconfont icon-yuyin-01 icon"></i>
    <span class="Chat-title"> AI Chat </span>
  </div>
</template>
<script lange="ts" setup></script>
<style lang="scss">
.mobile-chat-btn {
  width: 94rem;
  height: 94rem;
  border-radius: 50%;
  background: #fff;
  justify-content: center;
  align-items: center;
  font-size: 14rem;
  color: #1a1a1a;
  box-shadow: 0rem 0rem 10rem 3rem rgb(232 225 225 / 47%);
  margin-bottom: 35rem;
  overflow: hidden;
  padding: 10rem;
  display: flex;
  flex-direction: column;
  -webkit-user-select: none; /* Chrome all / Safari all */
  -moz-user-select: none; /* Firefox all */
  -ms-user-select: none; /* IE 10+ */
  user-select: none; /* Likely future */
  -webkit-touch-callout: none; /* iOS Safari */
  z-index: 2;
  .icon {
    font-size: 32rem;
    color: $themeColor;
  }
  .Chat-title {
    margin-top: 6rem;
    font-size: 10rem;
    font-weight: bold;
    cursor: pointer;
    background: linear-gradient(93deg, #736cff 11%, #f04eff 37%, #ff489a 99%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}
</style>
