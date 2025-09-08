<template>
  <div class="table-style-panel">
    <template v-if="textShow">
      <div class="row">
        <div style="width: 30%">{{ $t('toolbar.fontName') }}</div>
        <Select
          style="width: 70%"
          :value="textAttrs.fontname"
          @update:value="value => updateTextAttrs({ fontname: value as string })"
          :options="[...availableFonts, ...WEB_FONTS()]"
        >
          <template #icon>
            <IconFontSize />
          </template>
        </Select>
      </div>
      <div class="row">
        <div style="width: 30%">{{ $t('toolbar.fontSize') }}</div>
        <div style="width: 70%; display: flex; justify-content: space-between">
          <Select
            :value="textAttrs.fontsize"
            @update:value="value => updateTextAttrs({ fontsize: value as string })"
            :options="
              fontSizeOptions.map((item) => ({
                label: item,
                value: item,
              }))
            "
          >
            <template #icon>
              <IconAddText />
            </template>
          </Select>
          <Button
            class="font-size-btn"
            style="width: 20%"
            v-tooltip="t('toolbar.addSize')"
            @click="updateTextFontSzie('add')"
          >
            <IconFontSize />+
          </Button>
          <Button
            last
            class="font-size-btn"
            style="width: 20%"
            v-tooltip="t('toolbar.reduceSize')"
            @click="updateTextFontSzie('reduce')"
          >
            <IconFontSize />-
          </Button>
        </div>
      </div>

      <div class="row">
        <div style="width: 30%">{{ $t('toolbar.fontColor') }}</div>
        <Popover trigger="click" style="width: 70%">
          <template #content>
            <ColorPicker
              :modelValue="initColor(textAttrs.color)"
              @update:modelValue="(value) => updateTextAttrs({ color: value })"
            />
          </template>
          <ColorButton :color="initColor(textAttrs.color)" />
        </Popover>
      </div>

      <div class="row">
        <div style="width: 30%">{{ $t('toolbar.bgColor1') }}</div>
        <Popover trigger="click" style="width: 70%">
          <template #content>
            <ColorPicker
              :modelValue="initColor(textAttrs.backcolor)"
              @update:modelValue="
                (value) => updateTextAttrs({ backcolor: value })
              "
            />
          </template>
          <ColorButton :color="initColor(textAttrs.backcolor)" />
        </Popover>
      </div>

      <!-- <ButtonGroup class="row" passive>
        <Popover trigger="click" style="width: 50%">
          <template #content>
            <ColorPicker
              :modelValue="textAttrs.color"
              @update:modelValue="(value) => updateTextAttrs({ color: value })"
            />
          </template>
          <TextColorButton
            first
            v-tooltip="'文字颜色'"
            :color="textAttrs.color"
          >
            <IconText />
          </TextColorButton>
        </Popover>
        <Popover trigger="click" style="width: 50%">
          <template #content>
            <ColorPicker
              :modelValue="textAttrs.backcolor"
              @update:modelValue="
                (value) => updateTextAttrs({ backcolor: value })
              "
            />
          </template>
          <TextColorButton
            last
            v-tooltip="'单元格填充'"
            :color="textAttrs.backcolor"
          >
            <IconFill />
          </TextColorButton>
        </Popover>
      </ButtonGroup> -->

      <div class="row" style="align-items: self-start">
        <div style="width: 30%; padding-top: 10rem">
          {{ $t('toolbar.textStyle') }}
        </div>
        <div style="width: 70%">
          <ButtonGroup class="row">
            <CheckboxButton
              style="flex: 1"
              :checked="textAttrs.bold"
              v-tooltip="t('toolbar.bold')"
              @click="updateTextAttrs({ bold: !textAttrs.bold })"
            >
              <i class="iconfont toobar-icon-sizes icon-jiacu"></i>
            </CheckboxButton>
            <CheckboxButton
              style="flex: 1"
              :checked="textAttrs.em"
              v-tooltip="t('toolbar.italic')"
              @click="updateTextAttrs({ em: !textAttrs.em })"
            >
              <i class="iconfont toobar-icon-sizes icon-xieti"></i>
            </CheckboxButton>
            <CheckboxButton
              style="flex: 1"
              :checked="textAttrs.underline"
              v-tooltip="t('toolbar.underline')"
              @click="updateTextAttrs({ underline: !textAttrs.underline })"
            >
              <i class="iconfont toobar-icon-sizes icon-xiahuaxian"></i>
            </CheckboxButton>
            <CheckboxButton
              style="flex: 1"
              :checked="textAttrs.strikethrough"
              v-tooltip="t('toolbar.strikethrough')"
              @click="
                updateTextAttrs({ strikethrough: !textAttrs.strikethrough })
              "
            >
              <i class="iconfont toobar-icon-sizes icon-shanchuxian1"></i>
            </CheckboxButton>
          </ButtonGroup>

          <RadioGroup
            class="row"
            button-style="solid"
            :value="textAttrs.align"
            @update:value="value => updateTextAttrs({ align: value as TextAlign })"
          >
            <RadioButton
              value="left"
              v-tooltip="t('toolbar.alignLeft')"
              style="flex: 1"
              ><i class="iconfont icon-zuoduiqi toobar-icon-sizes"></i
            ></RadioButton>
            <RadioButton
              value="center"
              v-tooltip="t('toolbar.alignCenter')"
              style="flex: 1"
              ><i class="iconfont toobar-icon-sizes icon-juzhongduiqi"></i
            ></RadioButton>
            <RadioButton
              value="right"
              v-tooltip="t('toolbar.alignRight')"
              style="flex: 1"
              ><i class="iconfont toobar-icon-sizes icon-youduiqi"></i
            ></RadioButton>
            <RadioButton
              value="justify"
              v-tooltip="t('toolbar.justify')"
              style="flex: 1"
              ><i class="iconfont toobar-icon-sizes icon-liangduanduiqi"></i
            ></RadioButton>
          </RadioGroup>
        </div>
      </div>
    </template>
    <template v-else>
      <ElementOutline :fixed="true" :noGradient="true" />

      <Divider />
      <div class="row">{{ $t('toolbar.tableData') }}</div>

      <div class="row" style="margin-bottom: 0">
        <div class="row" style="margin-bottom: 0">
          <div style="width: 30%">{{ $t('toolbar.rowNum') }}</div>
          <NumberInput
            :value="rowCount || 0"
            @update:value="(value) => setTableRow(value)"
            style="flex: 1"
          />
        </div>
        <div class="row" style="margin-left: 5rem; margin-bottom: 0">
          <div style="width: 30%">{{ $t('toolbar.colNum') }}</div>
          <NumberInput
            :value="colCount || 0"
            @update:value="(value) => setTableCol(value)"
            style="flex: 1"
          />
        </div>
      </div>
      <!-- 
      <div class="row">
        <div style="width: 40%">{{$t('toolbar.rowNum')}}</div>
        <div class="set-count" style="width: 60%">
          <Button
            class="btn"
            :disabled="rowCount <= 1"
            @click="setTableRow(rowCount - 1)"
            ><IconMinus
          /></Button>
          <div class="count-text">{{ rowCount }}</div>
          <Button
            class="btn"
            :disabled="rowCount >= 30"
            @click="setTableRow(rowCount + 1)"
            ><IconPlus
          /></Button>
        </div>
      </div>
      <div class="row">
        <div style="width: 40%">{{$t('toolbar.colNum')}}</div>
        <div class="set-count" style="width: 60%">
          <Button
            class="btn"
            :disabled="colCount <= 1"
            @click="setTableCol(colCount - 1)"
            ><IconMinus
          /></Button>
          <div class="count-text">{{ colCount }}</div>
          <Button
            class="btn"
            :disabled="colCount >= 30"
            @click="setTableCol(colCount + 1)"
            ><IconPlus
          /></Button>
        </div>
      </div> -->

      <Divider />
      <div class="row">
        <div style="width: 40%">{{ $t('toolbar.tableType') }}</div>
        <Select
          style="width: 60%"
          :value="tableStyle"
          @update:value="(value) => toggleTable(value)"
          :options="[
            { label: t('toolbar.defaultTable'), value: 'default' },
            { label: t('toolbar.threeTable'), value: 'threeTable' },
          ]"
        />
      </div>

      <div class="row">
        <div style="width: 40%">{{ $t('toolbar.tableType') }}</div>
        <Select
          style="width: 60%"
          :value="hasTheme"
          @update:value="(value) => toggleTheme(value as string)"
          :options="[
            { label: t('toolbar.noBgTable'), value: 'none' },
            { label: t('toolbar.showBgTable'), value: 'show' },
          ]"
        />
      </div>
      <!-- <div class="row theme-switch">
        <div style="width: 40%">启用主题表格</div>
        <div class="switch-wrapper" style="width: 60%">
          <Switch
            :value="hasTheme"
            @update:value="(value) => toggleTheme(value)"
          />
        </div>
      </div> -->

      <template v-if="hasTheme !== 'none'">
        <div class="row">
          <div style="width: 40%">{{ $t('toolbar.fileColor') }}</div>
          <Popover trigger="click" style="width: 60%">
            <template #content>
              <ColorPicker
                :modelValue="initColor(theme.color)"
                @update:modelValue="(value) => updateTheme({ color: value })"
              />
            </template>
            <ColorButton :color="initColor(theme.color)" />
          </Popover>
        </div>
        <div class="row" style="align-items: flex-start">
          <div style="width: 30%; padding-top: 10rem">
            {{ $t('toolbar.tableImportant') }}
          </div>
          <div style="width: 70%">
            <div class="row">
              <Checkbox
                @update:value="(value) => updateTheme({ rowHeader: value })"
                :value="theme.rowHeader"
                style="flex: 1"
                >{{ $t('toolbar.firstRow') }}</Checkbox
              >
              <Checkbox
                @update:value="(value) => updateTheme({ colHeader: value })"
                :value="theme.colHeader"
                style="flex: 1"
                >{{ $t('toolbar.firstCol') }}</Checkbox
              >
            </div>
            <div class="row">
              <Checkbox
                @update:value="(value) => updateTheme({ rowFooter: value })"
                :value="theme.rowFooter"
                style="flex: 1"
                >{{ $t('toolbar.lastRow') }}</Checkbox
              >
              <Checkbox
                @update:value="(value) => updateTheme({ colFooter: value })"
                :value="theme.colFooter"
                style="flex: 1"
                >{{ $t('toolbar.lastCol') }}</Checkbox
              >
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import { useMainStore, useSlidesStore } from '@/store'
import type {
  PPTTableElement,
  TableCell,
  TableCellStyle,
  TableTheme,
  TextAlign,
} from '@/types/slides'
import { WEB_FONTS } from '@/configs/font'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

import ElementOutline from '../common/ElementOutline.vue'
import ColorButton from '@/components/ColorButton.vue'
import CheckboxButton from '@/components/CheckboxButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Divider from '@/components/Divider.vue'
import Checkbox from '@/components/Checkbox.vue'
import Button from '@/components/Button.vue'
import ButtonGroup from '@/components/ButtonGroup.vue'
import RadioButton from '@/components/RadioButton.vue'
import RadioGroup from '@/components/RadioGroup.vue'
import Select from '@/components/Select.vue'
import Popover from '@/components/Popover.vue'
import NumberInput from '@/components/NumberInput.vue'
import useColor from '@/hooks/useColor'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = withDefaults(
  defineProps<{
    textShow?: boolean
  }>(),
  {
    textShow: false,
  }
)
const { initColor } = useColor()
const slidesStore = useSlidesStore()
const {
  handleElement,
  handleElementId,
  selectedTableCells: selectedCells,
  availableFonts,
} = storeToRefs(useMainStore())
const themeColor = computed(() => slidesStore.theme.themeColor)

const fontSizeOptions = [
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '22px',
  '24px',
  '28px',
  '32px',
]

const textAttrs = ref({
  bold: false,
  em: false,
  underline: false,
  strikethrough: false,
  color: '#000',
  backcolor: '',
  fontsize: '12px',
  fontname: '微软雅黑',
  align: 'left',
})

const theme = ref<TableTheme>()
const hasTheme = ref('none')
const rowCount = ref(0)
const colCount = ref(0)
const minRowCount = ref(0)
const minColCount = ref(0)
const tableStyle = ref('default')
watch(
  handleElement,
  () => {
    if (!handleElement.value || handleElement.value.type !== 'table') return

    theme.value = handleElement.value.theme
    if (theme.value) {
      hasTheme.value = 'show'
    } else {
      hasTheme.value = 'none'
    }

    rowCount.value = handleElement.value.data.length
    colCount.value = handleElement.value.data[0].length

    minRowCount.value = handleElement.value.data.length
    minColCount.value = handleElement.value.data[0].length
    tableStyle.value = handleElement.value?.tableStyle || 'default'
  },
  { deep: true, immediate: true }
)

const { addHistorySnapshot } = useHistorySnapshot()

// 更新当前选中单元格的文本样式状态
const updateTextAttrState = () => {
  if (!handleElement.value || handleElement.value.type !== 'table') return

  let rowIndex = 0
  let colIndex = 0
  if (selectedCells.value.length) {
    const selectedCell = selectedCells.value[0]
    rowIndex = +selectedCell.split('_')[0]
    colIndex = +selectedCell.split('_')[1]
  }
  const style = handleElement.value.data[rowIndex][colIndex].style

  if (!style) {
    textAttrs.value = {
      bold: false,
      em: false,
      underline: false,
      strikethrough: false,
      color: '#000',
      backcolor: '',
      fontsize: '12px',
      fontname: '微软雅黑',
      align: 'left',
    }
  } else {
    textAttrs.value = {
      bold: !!style.bold,
      em: !!style.em,
      underline: !!style.underline,
      strikethrough: !!style.strikethrough,
      color: style.color || '#000',
      backcolor: style.backcolor || '',
      fontsize: style.fontsize || '12px',
      fontname: style.fontname || '微软雅黑',
      align: style.align || 'left',
    }
  }
}

onMounted(() => {
  if (selectedCells.value.length) updateTextAttrState()
})

watch(selectedCells, updateTextAttrState)

const updateElement = (props: Partial<PPTTableElement>) => {
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

const updateTextFontSzie = (type: any) => {
  let fontSzie = parseInt(textAttrs.value.fontsize)
  if (type === 'add') {
    fontSzie += 2
  } else {
    fontSzie -= 2
  }
  if (fontSzie < 12) {
    fontSzie = 12
  } else if (fontSzie > 32) {
    fontSzie = 32
  }

  updateTextAttrs({ fontsize: fontSzie + 'px' })
}

// 设置单元格内容文本样式
const updateTextAttrs = (textAttrProp: Partial<TableCellStyle>) => {
  const _handleElement = handleElement.value as PPTTableElement

  const data: TableCell[][] = JSON.parse(JSON.stringify(_handleElement.data))

  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      if (
        !selectedCells.value.length ||
        selectedCells.value.includes(`${i}_${j}`)
      ) {
        const style = data[i][j].style || {}
        data[i][j].style = { ...style, ...textAttrProp }
      }
    }
  }
  updateElement({ data })
  updateTextAttrState()
}

// 更新表格主题主题色、标题行、汇总行、第一列、{{$t('toolbar.lastCol')}}
const updateTheme = (themeProp: Partial<TableTheme>) => {
  if (!theme.value) return
  const _theme = { ...theme.value, ...themeProp }
  if (themeProp.color) {
    const _handleElement = handleElement.value as PPTTableElement
    const data: TableCell[][] = JSON.parse(JSON.stringify(_handleElement.data))
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        if (data[i][j]?.style?.backcolor) {
          delete data[i][j].style.backcolor
        }
      }
    }
    updateElement({ theme: _theme, data })
  } else {
    updateElement({ theme: _theme })
  }
}

// 开启/关闭表格主题
const toggleTheme = (checked: string) => {
  if (checked === 'show') {
    const props = {}
    if (tableStyle.value === 'threeTable') {
      props.theme = {
        color: themeColor.value,
        rowHeader: false,
        rowFooter: false,
        colHeader: false,
        colFooter: false,
      }
    } else {
      props.theme = {
        color: themeColor.value,
        rowHeader: true,
        rowFooter: false,
        colHeader: false,
        colFooter: false,
      }
    }

    updateElement(props)
  } else {
    slidesStore.removeElementProps({
      id: handleElementId.value,
      propName: 'theme',
    })
    addHistorySnapshot()
  }
}

const toggleTable = (value: string) => {
  const obj = {}
  if (value === 'default') {
    obj.rowHeader = true
    obj.colHeader = false
    obj.rowFooter = false
    obj.colFooter = false
  } else if (value === 'threeTable') {
    obj.rowHeader = false
    obj.colHeader = false
    obj.rowFooter = false
    obj.colFooter = false
  }
  if (hasTheme.value !== 'none') {
    const _theme = { ...theme.value, ...obj }
    const outline = handleElement.value.outline
    outline.width = 1
    updateElement({ theme: _theme, outline: outline, tableStyle: value })
  } else {
    updateElement({ tableStyle: value })
  }
}

// 设置表格{{$t('toolbar.rowNum')}}
const setTableRow = (value: number) => {
  const _handleElement = handleElement.value as PPTTableElement
  const rowCount = _handleElement.data.length

  if (value > rowCount) {
    const rowCells: TableCell[] = new Array(colCount.value).fill({
      id: nanoid(10),
      colspan: 1,
      rowspan: 1,
      text: '',
    })
    const newTableCells: TableCell[][] = new Array(value - rowCount).fill(
      rowCells
    )

    const tableCells: TableCell[][] = JSON.parse(
      JSON.stringify(_handleElement.data)
    )
    tableCells.push(...newTableCells)

    updateElement({ data: tableCells })
  } else {
    const tableCells: TableCell[][] = _handleElement.data.slice(0, value)
    updateElement({ data: tableCells })
  }
}

// 设置表格{{$t('toolbar.colNum')}}
const setTableCol = (value: number) => {
  const _handleElement = handleElement.value as PPTTableElement
  const colCount = _handleElement.data[0].length

  let tableCells = _handleElement.data
  let colSizeList = _handleElement.colWidths.map(
    (item) => item * _handleElement.width
  )

  if (value > colCount) {
    tableCells = tableCells.map((item) => {
      const cells: TableCell[] = new Array(value - colCount).fill({
        id: nanoid(10),
        colspan: 1,
        rowspan: 1,
        text: '',
      })
      item.push(...cells)
      return item
    })

    const newColSizeList: number[] = new Array(value - colCount).fill(100)
    colSizeList.push(...newColSizeList)
  } else {
    tableCells = tableCells.map((item) => item.slice(0, value))
    colSizeList = colSizeList.slice(0, value)
  }

  const width = colSizeList.reduce((a, b) => a + b)
  const colWidths = colSizeList.map((item) => item / width)

  const props = {
    width,
    data: tableCells,
    colWidths,
  }
  updateElement(props)
}
</script>

<style lang="scss" scoped>
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10rem;
}
.theme-switch {
  margin-bottom: 18rem;
}
.switch-wrapper {
  text-align: right;
}
.set-count {
  display: flex;
  justify-content: center;
  align-items: center;

  .btn {
    padding: 0 8rem;
  }

  .count-text {
    flex: 1;
    text-align: center;
    margin: 0 8rem;
  }
}
</style>
