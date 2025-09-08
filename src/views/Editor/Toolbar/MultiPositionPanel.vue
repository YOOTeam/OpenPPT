<template>
  <div class="multi-position-panel">
    <div class="row">{{ $t('positionPool.elementAlign') }}</div>
    <ButtonGroup class="row align-btn">
      <Button
        style="flex: 1; padding: 0"
        @click="alignElement(ElementAlignCommands.LEFT)"
        ><IconAlignLeft />{{ $t('positionPool.right') }}</Button
      >

      <Button
        style="flex: 1; padding: 0"
        @click="alignElement(ElementAlignCommands.RIGHT)"
        ><IconAlignRight />{{ $t('positionPool.left') }}</Button
      >
    </ButtonGroup>
    <ButtonGroup class="row align-btn">
      <Button
        style="flex: 1; padding: 0"
        @click="alignElement(ElementAlignCommands.TOP)"
        ><IconAlignTop />{{ $t('positionPool.top') }}</Button
      >

      <Button
        style="flex: 1; padding: 0"
        @click="alignElement(ElementAlignCommands.BOTTOM)"
        ><IconAlignBottom />{{ $t('positionPool.bottom1') }}</Button
      >
    </ButtonGroup>
    <ButtonGroup class="row align-btn">
      <Button
        style="flex: 1; padding: 0"
        @click="alignElement(ElementAlignCommands.HORIZONTAL)"
        ><IconAlignHorizontally />{{ $t('positionPool.center') }}</Button
      >
      <Button
        style="flex: 1; padding: 0"
        @click="alignElement(ElementAlignCommands.VERTICAL)"
        ><IconAlignVertically />{{ $t('canvas.setHcenter') }}</Button
      >
    </ButtonGroup>
    <ButtonGroup class="row" v-if="displayItemCount > 2">
      <Button style="flex: 1; padding: 0" @click="uniformHorizontalDisplay()"
        >水平均匀分布</Button
      >
      <Button style="flex: 1; padding: 0" @click="uniformVerticalDisplay()"
        >垂直均匀分布</Button
      >
    </ButtonGroup>

    <Divider />

    <!-- <ButtonGroup class="row"> -->
    <div class="row">
      <Button
        :disabled="!canCombine"
        @click="combineElements()"
        style="flex: 1; margin-right: 5rem"
        ><IconGroup style="margin-right: 3px" />{{
          $t('positionPool.group')
        }}</Button
      >
      <Button
        :disabled="canCombine"
        @click="uncombineElements()"
        style="flex: 1; margin-left: 5rem"
        ><IconUngroup style="margin-right: 3px" />{{
          $t('positionPool.noGroup')
        }}</Button
      >
    </div>

    <!-- </ButtonGroup> -->
  </div>
</template>

<script lang="ts" setup>
import { ElementAlignCommands } from '@/types/edit'
import useCombineElement from '@/hooks/useCombineElement'
import useAlignActiveElement from '@/hooks/useAlignActiveElement'
import useAlignElementToCanvas from '@/hooks/useAlignElementToCanvas'
import useUniformDisplayElement from '@/hooks/useUniformDisplayElement'
import Divider from '@/components/Divider.vue'
import Button from '@/components/Button.vue'
import ButtonGroup from '@/components/ButtonGroup.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { canCombine, combineElements, uncombineElements } = useCombineElement()
const { alignActiveElement } = useAlignActiveElement()
const { alignElementToCanvas } = useAlignElementToCanvas()
const { displayItemCount, uniformHorizontalDisplay, uniformVerticalDisplay } =
  useUniformDisplayElement()

// 多选元素对齐，需要先判断当前所选中的元素状态：
// 如果所选元素为一组组合元素，则将它对齐到画布；
// 如果所选元素不是组合元素或不止一组元素（即当前为可组合状态），则将这多个（多组）元素相互对齐。
const alignElement = (command: ElementAlignCommands) => {
  if (canCombine.value) alignActiveElement(command)
  else alignElementToCanvas(command)
}
</script>

<style lang="scss" scoped>
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.align-btn {
  .button {
    padding: 0 4rem;
  }
}
</style>
