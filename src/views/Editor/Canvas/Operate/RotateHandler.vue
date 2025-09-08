<template>
  <div class="rotate-handler">
    <!-- <IconTransform class="icon" /> -->
    <i class="iconfont icon-shuaxin icon"></i>
  </div>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.rotate-handler {
  position: absolute;
  width: 28px;
  height: 28px;
  bottom: 0;
  margin-left: -14px;
  background: #ffffff;
  border: 1px solid #e1e1e1;
  box-shadow: 0px 4px 15px 0px rgba(0, 0, 0, 0.2);
  cursor: grab;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  .icon {
    font-weight: 600;
    color: $themeColor;
  }

  &:hover {
    background: #e5e3ff;
  }

  &:active {
    cursor: grabbing;
  }
}
</style>
