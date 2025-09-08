<template>
  <div class="latex-style-panel">
    <LaTeXEditor
      :showTab="openSHow"
      :value="handleLatexElement.latex"
      @update="
        (data) => {
          updateLatexData(data)
        }
      "
    />

    <!-- <div class="drageModal-title">公式文本</div>
    <div class="input-area">
      <TextArea
        v-model:value="latex"
        placeholder="输入 LaTeX 公式"
        ref="textAreaRef"
      />
    </div>
    <div class="drageModal-title">公式预览</div>
    <div class="preview">
      <div class="placeholder" v-if="!latex">公式预览</div>
      <div class="preview-content" v-else>
        <FormulaContent :width="190" :height="138" :latex="latex" />
      </div>
    </div> -->
    <div class="row editor_latex" style="justify-content: space-between">
      <!-- <Button @click="latexEditorVisible = true">{{$t('latexPool.latexDifferentiation')}}</Button> -->
      <div style="flex: 1">{{ $t('latexPool.latexDifferentiation') }}</div>
      <Switch
        style="widht: 15%"
        :value="openSHow"
        @update:value="(value) => (openSHow = value)"
      />
    </div>
    <Divider />
    <div class="row">
      <div style="width: 40%">{{ $t('latexPool.latexColor') }}</div>
      <Popover trigger="click" style="width: 60%">
        <template #content>
          <ColorPicker
            :modelValue="handleLatexElement.color"
            @update:modelValue="(value) => updateLatex({ color: value })"
          />
        </template>
        <ColorButton :color="handleLatexElement.color" />
      </Popover>
    </div>
    <div class="row">
      <div style="width: 40%">{{ $t('latexPool.fontSize') }}</div>
      <NumberInput
        :min="1"
        :max="3"
        :value="handleLatexElement.strokeWidth"
        @update:value="(value) => updateLatex({ strokeWidth: value })"
        style="width: 60%"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, type Ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTLatexElement } from '@/types/slides'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

import ColorButton from '@/components/ColorButton.vue'
import LaTeXEditor from '@/components/LaTeXEditor/index.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Divider from '@/components/Divider.vue'
import NumberInput from '@/components/NumberInput.vue'
import Popover from '@/components/Popover.vue'
import Switch from '@/components/Switch.vue'

import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const slidesStore = useSlidesStore()
const { handleElement } = storeToRefs(useMainStore())

const handleLatexElement = handleElement as Ref<PPTLatexElement>

const latex = ref('')
const { addHistorySnapshot } = useHistorySnapshot()
const openSHow = ref(false)
const updateLatex = (props: Partial<PPTLatexElement>) => {
  if (!handleElement.value) return
  slidesStore.updateElement({ id: handleElement.value.id, props })
  addHistorySnapshot()
}

const updateLatexData = (data: {
  path: string
  latex: string
  w: number
  h: number
}) => {
  updateLatex({
    path: data.path,
    latex: data.latex,
    width: data.w,
    height: data.h,
    viewBox: [data.w, data.h],
  })
}

onMounted(() => {
  if (handleLatexElement.value) latex.value = handleLatexElement.value.latex
})
</script>

<style lang="scss" scoped>
.latex-style-panel {
  position: relative;
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.editor_latex {
  justify-content: space-between;
  position: absolute;
  bottom: 118rem;
  width: 145rem;
  right: 10rem;
}
.preview {
  height: 160rem;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  text-align: center;
  margin-top: 20rem;
  border: 1rem solid $borderColor;
  user-select: none;
  border-radius: 10rem;
  margin-bottom: 20rem;
}
</style>
