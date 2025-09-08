<template>
  <div class="line-pool">
    <div class="category" v-for="(item, i) in LINE_LIST()" :key="item.type">
      <div class="shape-names">{{ item.type }}</div>
      <div class="line-list">
        <div class="line-item" v-for="(line, j) in item.children" :key="j">
          <div class="line-content" @click="selectLine(line)">
            <svg overflow="visible" width="16 " height="16">
              <defs>
                <LinePointMarker
                  class="line-marker"
                  v-if="line.points[0]"
                  :id="`preset-line-${i}-${j}`"
                  position="start"
                  :type="line.points[0]"
                  color="currentColor"
                  :baseSize="1"
                />
                <LinePointMarker
                  class="line-marker"
                  v-if="line.points[1]"
                  :id="`preset-line-${i}-${j}`"
                  position="end"
                  :type="line.points[1]"
                  color="currentColor"
                  :baseSize="1"
                />
              </defs>
              <path
                class="line-path"
                :d="line.path"
                stroke="currentColor"
                fill="none"
                stroke-width="1"
                :stroke-dasharray="line.style === 'solid' ? '0, 0' : '4, 1'"
                :marker-start="
                  line.points[0]
                    ? `url(#${`preset-line-${i}-${j}`}-${line.points[0]}-start)`
                    : ''
                "
                :marker-end="
                  line.points[1]
                    ? `url(#${`preset-line-${i}-${j}`}-${line.points[1]}-end)`
                    : ''
                "
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { LINE_LIST, type LinePoolItem } from '@/configs/lines'

import LinePointMarker from '@/views/components/element/LineElement/LinePointMarker.vue'

const emit = defineEmits<{
  (event: 'select', payload: LinePoolItem): void
}>()

const selectLine = (line: LinePoolItem) => {
  emit('select', line)
}
</script>

<style lang="scss" scoped>
.line-pool {
  width: 100%;
}

.shape-names {
  width: 100%;
  font-size: 14rem;
  color: #3d3d3d;
  margin: 10rem 0;
}

.line-list {
  @include flex-grid-layout();

  margin-bottom: 10rem;
}

.line-item {
  @include flex-grid-layout-children(10, 8%);
  height: 0;
  padding-bottom: 8%;
  flex-shrink: 0;
  position: relative;
  cursor: pointer;
}

.line-content {
  @include absolute-0();

  display: flex;
  justify-content: center;
  align-items: center;
  color: #acabab;

  &:hover {
    color: $themeColor;
  }

  svg:not(:root) {
    overflow: visible;
  }
}
</style>
