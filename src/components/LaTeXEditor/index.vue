<template>
  <div class="latex-editor">
    <template v-if="showTab">
      <Tabs
        :tabs="tabs"
        v-model:value="toolbarState"
        :style="{ justifyContent: value ? 'flex-start' : 'center' }"
      />
      <div class="content">
        <div class="symbol" v-if="toolbarState === 'symbol'">
          <!-- <Tabs :tabs="symbolTabs" v-model:value="selectedSymbolKey" spaceBetween
          :tabsStyle="{ margin: '10rem 10rem 0' }" /> -->
          <div class="symbol-pool">
            <div
              class="symbol-item"
              v-for="item in symbolPool"
              :key="item.latex"
              @click="insertSymbol(item.latex)"
            >
              <SymbolContent :latex="item.latex" />
            </div>
          </div>
        </div>
        <div class="formula" v-else>
          <div
            class="formula-item"
            v-for="item in formulaList"
            :key="item.label"
          >
            <div class="formula-title">{{ item.label }}</div>
            <div class="formula-item-content" @click="latex = item.latex">
              <FormulaContent :width="250" :height="100" :latex="item.latex" />
            </div>
          </div>
        </div>
      </div>
    </template>
    <div>
      <div class="drageModal-title mt20">{{ $t('latexPool.latexView') }}</div>
      <div class="preview">
        <div class="placeholder" v-if="!latex">
          {{ $t('latexPool.latexView') }}
        </div>
        <div class="preview-content" v-else>
          <FormulaContent :width="250" :height="138" :latex="latex" />
        </div>
      </div>
      <div class="drageModal-title mt20">{{ $t('latexPool.latexText') }}</div>
      <div class="input-area">
        <TextArea
          v-model:value="latex"
          :placeholder="t('latexPool.placeholder')"
          ref="textAreaRef"
        />
      </div>
    </div>
    <Button class="btn" @click="update()"
      >{{ value ? t('latexPool.update') : t('latexPool.insert') }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { hfmath } from './hfmath'
import { FORMULA_LIST, SYMBOL_LIST } from '@/configs/latex'
import message from '@/utils/message'
import { storeToRefs } from 'pinia'

import FormulaContent from './FormulaContent.vue'
import SymbolContent from './SymbolContent.vue'
import Button from '../Button.vue'
import TextArea from '../TextArea.vue'
import Tabs from '@/components/Tabs.vue'

import { useScreenStore } from '@/store'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const { rem } = storeToRefs(useScreenStore())

interface TabItem {
  key: 'symbol' | 'formula'
  label: string
}

const tabs: TabItem[] = [
  { label: t('latexPool.formula'), key: 'formula' },
  { label: t('latexPool.symbol'), key: 'symbol' },
]

interface LatexResult {
  latex: string
  path: string
  w: number
  h: number
}

const props = withDefaults(
  defineProps<{
    value?: string
    showTab?: boolean
  }>(),
  {
    value: '',
    showTab: true,
  }
)

const emit = defineEmits<{
  (event: 'update', payload: LatexResult): void
  (event: 'close'): void
}>()

const formulaList = FORMULA_LIST()

const symbolTabs = SYMBOL_LIST.map((item) => ({
  label: item.label,
  key: item.type,
}))

const latex = ref('')
const toolbarState = ref<'symbol' | 'formula'>('formula')
const textAreaRef = ref<InstanceType<typeof TextArea>>()

const selectedSymbolKey = ref(SYMBOL_LIST[0].type)
const symbolPool = computed(() => {
  const selectedSymbol = SYMBOL_LIST.find(
    (item) => item.type === selectedSymbolKey.value
  )
  return selectedSymbol?.children || []
})

onMounted(() => {
  if (props.value) latex.value = props.value
})

const update = () => {
  if (!latex.value) return message.error(t('latexPool.error'))

  const eq = new hfmath(latex.value)
  const pathd = eq.pathd({})
  const box = eq.box({})

  emit('update', {
    latex: latex.value,
    path: pathd,
    w: box.w + 32,
    h: box.h + 32,
  })
}

const insertSymbol = (latex: string) => {
  if (!textAreaRef.value) return
  textAreaRef.value.focus()
  document.execCommand('insertText', false, latex)
}
</script>

<style lang="scss" scoped>
.latex-editor {
  @include drage-modal-layout();
  width: 450rem;
}

.mt20 {
  margin-top: 20rem;
}
.btn {
  margin-top: 10rem;
}
.input-area {
  flex: 1;

  textarea {
    height: 100% !important;
    border-color: $borderColor !important;
    padding: 10rem !important;

    &:focus {
      box-shadow: none !important;
    }
  }
}

.preview {
  height: 160rem;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin: 10rem 0;
  border: 1rem solid $borderColor;
  user-select: none;
  border-radius: 10rem;
}

.placeholder {
  color: #888;
  font-size: 14rem;
}

.preview-content {
  width: 100%;
  height: 100%;
  padding: 10rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.formula,
.symbol-pool {
  padding: 12rem;
  height: 280rem;
  @include overflow-overlay();
  border: 1px solid #dddaff;
  border-radius: 6rem;
  margin: 15rem 0 10rem;
}

.formula-item {
  & + .formula-item {
    margin-top: 10rem;
  }

  .formula-title {
    margin-bottom: 5rem;
  }

  .formula-item-content {
    height: 60rem;
    padding: 5rem;
    display: flex;
    align-items: center;
    background-color: $hoverbg;
    cursor: pointer;
  }
}

.symbol-pool {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
  padding: 12rem;

  @include overflow-overlay();
}

.symbol-item {
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    background-color: $hoverbg;
    cursor: pointer;
  }
}
</style>
