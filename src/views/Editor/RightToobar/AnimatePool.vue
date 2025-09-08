<template>
  <div class="animate-pool">
    <Tabs
      :tabs="selectType !== 'default' ? tabs : tab"
      v-model:value="type"
      :tabsStyle="{ marginBottom: '15px' }"
    />

    <template v-if="type === 'interaction'">
      <div style="height: 460rem; position: relative">
        <div style="color: #1a1a1a; font-size: 14rem; margin: 10rem 0">
          {{ t('animatePool.interactiveMode') }}
        </div>
        <div class="animate-box">
          <li
            class="animate-item"
            v-for="(animate, index) in animateList"
            :class="animate.type === selectAnimate ? 'active' : ''"
            :key="index"
            @click="handleClickAnimate(animate)"
          >
            <div
              class="animate-content"
              :class="animate.type === selectAnimate ? 'active' : ''"
            >
              <!-- <IconChartLine size="24" /> -->
              <i
                class="iconfont icon-dianjiqiangtiao"
                v-if="animate.type === 'clickEmphasize'"
              ></i>
              <i
                class="iconfont icon-dianjishifangda"
                v-if="animate.type === 'clickZoom'"
              ></i>
              <i
                class="iconfont icon-zhugejujiaofangda"
                v-if="animate.type === 'focusZoom'"
              ></i>
              <i
                class="iconfont icon-wangyewaikuangyangshi-wuyangshi"
                v-if="animate.type === 'none'"
              ></i>

              <div style="margin-top: 5rem; text-align: center">
                {{ animate.label }}
              </div>
            </div>
          </li>
        </div>
        <div style="color: #1a1a1a; font-size: 14rem; margin: 10rem 0">
          {{ t('animatePool.interactiveElement') }}
        </div>
        <div class="btns">
          <Button
            v-for="item in bottonList"
            :key="item.type"
            class="btn"
            :class="item.type === selectType ? 'active' : ''"
            @click="handleSelect(item)"
            >{{ item.label }}</Button
          >
        </div>
        <div
          style="color: #767676; font-size: 12rem; margin: 20rem 0"
          v-if="selectType !== 'specified'"
        >
          {{ t('animatePool.interactiveModeTip') }}
        </div>
        <div
          style="
            color: #767676;
            font-size: 12rem;
            line-height: 20rem;
            margin: 20rem 0;
          "
          v-else
        >
          {{ t('animatePool.interactiveElementTip') }}
        </div>
      </div>
    </template>
    <template v-else>
      <div class="handler">
        <div>{{ t('animatePool.adjustPlayOrder') }}</div>
        <div class="icon-btns">
          <IconUp
            class="icon-btn"
            @click="
              handleOrderElement(handleElement, ElementOrderCommands.DOWN)
            "
          />

          <IconDown
            class="icon-btn"
            @click="handleOrderElement(handleElement, ElementOrderCommands.UP)"
          />
        </div>
      </div>
      <div class="element-list">
        <template v-for="(item, index) in elements" :key="item.id">
          <div style="display: flex">
            <div
              style="margin-top: 12rem"
              :style="{
                opacity: hideElementsIds.includes(item.id) ? '0.3' : '',
              }"
              :id="`element-list-${item.id}`"
            >
              {{ index + 1 }}.
            </div>
            <div style="flex: 1">
              <div class="group-els" v-if="item.type === 'group'">
                <div class="group-title">
                  {{ $t('themeSeting.group') }}
                  <div class="icons">
                    <Popover
                      trigger="click"
                      :contentStyle="popoverStyle"
                      @click.stop
                    >
                      <template #content>
                        <div
                          class="icon-item"
                          v-for="icon in iconList"
                          :key="icon.icon"
                          @click.stop="handleHiddenActive(item, icon.type)"
                          :class="{
                            active: hiddenActiveElementIdList.includes(item.id),
                          }"
                        >
                          <i :class="`iconfont ${icon.icon}`"></i>
                          <div>{{ icon.lable }}</div>
                        </div>
                      </template>
                      <i
                        :class="`iconfont ${currentIcon(item)}`"
                        style="cursor: pointer"
                      ></i>
                    </Popover>
                  </div>
                </div>
                <div
                  class="item"
                  :class="{
                    active: activeElementIdList.includes(groupItem.id),
                    'group-active': activeGroupElementId.includes(groupItem.id),
                  }"
                  v-for="groupItem in item.elements"
                  :key="groupItem.id"
                  @click="selectGroupEl(item, groupItem.id)"
                  @dblclick="enterEdit(groupItem.id)"
                >
                  <input
                    :id="`select-panel-input-${groupItem.id}`"
                    :value="groupItem.name || ELEMENT_TYPE_ZH[groupItem.type]"
                    class="input"
                    type="text"
                    v-if="editingElId === groupItem.id"
                    @blur="($event) => saveElementName($event, groupItem.id)"
                    @keydown.enter="
                      ($event) => saveElementName($event, groupItem.id)
                    "
                  />
                  <div
                    v-else
                    class="name"
                    :style="{
                      opacity: hideElementsIds.includes(groupItem.id)
                        ? '0.3'
                        : '',
                    }"
                  >
                    {{ groupItem.name || ELEMENT_TYPE_ZH[groupItem.type] }}
                  </div>
                </div>
              </div>
              <div
                class="item"
                :class="{ active: activeElementIdList.includes(item.id) }"
                v-else
                @click="(event) => selectElementWithCtrl(item.id, event)"
                @dblclick="enterEdit(item.id)"
              >
                <input
                  :id="`select-panel-input-${item.id}`"
                  :value="item.name || ELEMENT_TYPE_ZH[item.type]"
                  class="input"
                  type="text"
                  v-if="editingElId === item.id"
                  @blur="($event) => saveElementName($event, item.id)"
                  @keydown.enter="($event) => saveElementName($event, item.id)"
                />
                <div
                  v-else
                  class="name"
                  :style="{
                    opacity: hideElementsIds.includes(item.id) ? '0.3' : '',
                  }"
                >
                  {{ item.name || ELEMENT_TYPE_ZH[item.type] }}
                </div>
                <div class="icons">
                  <Popover
                    trigger="click"
                    :contentStyle="popoverStyle"
                    @click.stop
                  >
                    <template #content>
                      <div
                        class="icon-item"
                        v-for="icon in iconList"
                        :key="icon.icon"
                        @click.stop="handleHiddenActive(item, icon.type)"
                        :class="{
                          active: hiddenActiveElementIdList.includes(item.id),
                        }"
                      >
                        <i :class="`iconfont ${icon.icon}`"></i>
                        <div>{{ icon.lable }}</div>
                      </div>
                    </template>
                    <i :class="`iconfont ${currentIcon(item)}`"></i>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
      <div
        v-if="useBtn && canCombine"
        class="combination-btn"
        @click="handleUncombineElements()"
        style="cursor: pointer"
      >
        <Button>设置为分组交互</Button>
      </div>
      <div
        v-if="useBtn && !canCombine"
        class="combination-btn"
        @click="handleCombineElements()"
        style="cursor: pointer"
      >
        <Button>取消组合交互</Button>
      </div>
      <div v-if="!useBtn" class="combination-btn disabled">
        <Button>组合交互</Button>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import Button from '@/components/Button.vue'
import Tabs from '@/components/Tabs.vue'
import Popover from '@/components/Popover.vue'
import { useSlidesStore, useMainStore } from '@/store'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { computed, nextTick, ref, onMounted, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import type { PPTElement } from '@/types/slides'
import { ELEMENT_TYPE_ZH } from '@/configs/element'
import useOrderElement from '@/hooks/useOrderElement'
import useSelectElement from '@/hooks/useSelectElement'
import { ElementOrderCommands } from '@/types/edit'
import useCombineElement from '@/hooks/useCombineElement'

const slidesStore = useSlidesStore()
const mainStore = useMainStore()
const { currentSlide, slides } = storeToRefs(slidesStore)
const { canCombine, combineElements, uncombineElements } = useCombineElement()
const {
  handleElement,
  handleElementId,
  activeElementIdList,
  activeGroupElementId,
  activeElementList,
} = storeToRefs(mainStore)
const { orderElement } = useOrderElement()
const { selectElement } = useSelectElement()

interface GroupElements {
  type: 'group' // 标识这是一个组合元素
  id: string // 组合的唯一标识符
  elements: PPTElement[] // 组合内的元素列表
}
const type = ref('interaction')
type ElementItem = PPTElement | GroupElements
const hiddenActiveElementIdList = ref([])
const useBtn = ref(false)

const iconList = [
  {
    lable: '默认显示',
    icon: 'icon-morenxianshi',
    type: 'default',
  },
  {
    lable: '交互显示',
    icon: 'icon-jiaohuxianshi',
    type: 'clickZoom',
  },
  {
    lable: '无交互',
    icon: 'icon-wujiaohuxianshi',
    type: 'none',
  },
]
const popoverStyle = reactive({
  background: '#fff',
  color: '#1a1a1a',
  border: 'none',
  borderRadius: '8rem',
  padding: '5rem',
  boxShadow: '0px 0px 15rem 0rem rgba(166, 166, 166, 0.33)',
})
const hideElementsIds = computed(() => {
  return currentSlide.value.actionList?.hiddenElementsIds || []
})
const defaultElementIds = computed(() => {
  return currentSlide.value.actionList?.defaultElementIds || []
})

const editingElId = ref('')
// 定义标签页配置（完整版，包含交互播放和交互元素）
const tabs = [
  {
    label: t('animatePool.interactivePlay'),
    key: 'interaction',
  },
  {
    label: t('animatePool.interactiveElement'),
    key: 'elInteraction',
  },
]

const tab = [
  {
    label: t('animatePool.interactivePlay'),
    key: 'interaction',
  },
]

const animateList: any = [
  {
    type: 'none',
    label: t('animatePool.noInteraction'),
  },
  {
    type: 'clickZoom',
    label: t('animatePool.freeClickPlay'),
  },
  {
    type: 'focusZoom',
    label: t('animatePool.focusZoom'),
  },
  {
    type: 'clickEmphasize',
    label: t('animatePool.clickEmphasize'),
  },
]

const bottonList: any = [
  {
    type: 'default',
    label: t('animatePool.defaultAll'),
  },
  {
    type: 'onlyText',
    label: t('animatePool.onlyText'),
  },
  {
    type: 'specified',
    label: t('animatePool.specified'),
  },
]

const selectType = computed({
  // 获取当前幻灯片的交互类型设置，默认为'default'
  get() {
    return currentSlide.value.actionList?.elInteractionType || 'default'
  },
  // 更新交互类型设置到store
  set(value) {
    if (value === 'default') {
      slides.value.forEach((slide) => {
        const elementsId = slide.elements.map((el) => el.id)
        const hiddenElementsIds = []
        const toData = {
          actionList: {
            ...slide.actionList,
            elInteractionType: 'default',
            elementsId: elementsId,
            hiddenElementsIds: hiddenElementsIds,
          },
        }
        // 仅更新当前选中幻灯片的隐藏元素ID
        if (slide.id === currentSlide.value.id) {
          hideElementsIds.value = hiddenElementsIds
        }
        slidesStore.updateSlide(toData, slide.id)
      })
    }

    if (value === 'onlyText') {
      slides.value.forEach((slide) => {
        const TextElements = slide.elements.filter(
          (el) =>
            el.type === 'text' || (el?.type === 'shape' && el?.text?.content)
        )
        const textElementIds = TextElements.map((el) => el.id)
        const elementsId = slide.elements.map((el) => el.id)
        const hiddenElementsIds = elementsId.filter(
          (id) => !textElementIds.includes(id)
        )
        const toData = {
          actionList: {
            ...slide.actionList,
            elInteractionType: 'onlyText',
            elementsId: elementsId,
            hiddenElementsIds: hiddenElementsIds,
          },
        }
        // 更新所有幻灯片的隐藏id
        if (slide.id === currentSlide.value.id) {
          hideElementsIds.value = hiddenElementsIds
        }
        slidesStore.updateSlide(toData, slide.id)
      })
    }
    if (value === 'specified') {
      const currentHideIds = currentSlide.value.actionList?.hiddenElementsIds
      const elementsId = currentSlide.value.elements.map((el) => el.id)
      const toData = {
        actionList: {
          ...currentSlide.value.actionList,
          elInteractionType: 'specified',
          elementsId: elementsId,
          hiddenElementsIds: currentHideIds,
        },
      }
      slidesStore.updateSlide(toData)
    }
  },
})

const selectAnimate = computed({
  // 获取当前设置的动画类型
  get() {
    return currentSlide.value.actionList?.interactionType
  },
  // 更新动画类型设置到store
  set(value) {
    slides.value.forEach((slide) => {
      slidesStore.updateSlide(
        {
          actionList: {
            ...slide.actionList,
            interactionType: value,
          },
        },
        slide.id
      )
    })
  },
})

const elements = computed<ElementItem[]>(() => {
  // 创建一个临时数组用于存储处理后的元素列表
  const _elements: ElementItem[] = []

  // 确保 currentSlide.value 存在，避免空值错误
  if (!currentSlide.value) {
    return []
  }

  // 遍历当前幻灯片中的所有元素
  for (const el of currentSlide.value.elements) {
    // 检查当前元素是否属于某个组（通过groupId判断）
    if (el.groupId) {
      // 获取临时数组中的最后一个元素，用于检查是否需要合并到现有组
      const lastItem = _elements[_elements.length - 1]

      // 判断最后一个元素是否存在且为组类型，并且与当前元素的groupId相同
      // 如果满足条件，则将当前元素添加到该组的elements数组中
      if (
        lastItem &&
        lastItem.type === 'group' &&
        lastItem.id &&
        lastItem.id === el.groupId
      ) {
        // 深拷贝元素，确保数据是最新的
        lastItem.elements.push({ ...el })
      } else {
        // 如果不满足合并条件，则创建一个新的组元素
        _elements.push({ type: 'group', id: el.groupId, elements: [{ ...el }] })
      }
    } else {
      // 如果元素不属于任何组，直接将其添加到结果数组中
      _elements.push({ ...el })
    }
  }

  // 将处理后的元素列表反转，使最新添加的元素显示在前面
  return _elements
})

onMounted(() => {
  hideElementsIds.value = currentSlide.value.actionList?.hiddenElementsIds
})
// 选择组合元素的处理函数
const selectGroupEl = (item: GroupElements, id: string) => {
  // 如果当前已经选中该元素，则不做任何操作
  useBtn.value = true
  if (handleElementId.value === id) return

  // 如果该元素被隐藏，则不允许选择
  if (hiddenActiveElementIdList.value.includes(id)) return

  // 获取组合中所有元素的ID列表
  const idList = item.elements.map((el) => el.id)
  mainStore.setActiveElementIdList(idList)
  // 在下一个DOM更新周期后设置活动组合元素ID和处理元素
  nextTick(() => {
    mainStore.setActiveGroupElementId(id)
    // 查找并设置handleElement和handleElementId
    const element = currentSlide.value.elements.find((el) => el.id === id)
    if (element) {
      mainStore.setHandleElementId(id)
    }
  })
}
// 先添加一个新的函数来处理带Ctrl键的选择
const selectElementWithCtrl = (id: string, event: MouseEvent) => {
  // 检查Ctrl键是否被按下
  if (event.ctrlKey) {
    useBtn.value = true
    // 如果按下Ctrl键，则切换元素的选中状态
    if (activeElementIdList.value.includes(id)) {
      // 如果已选中，则移除
      const newActiveList = activeElementIdList.value.filter(
        (item) => item !== id
      )
      mainStore.setActiveElementIdList(newActiveList)
    } else {
      // 如果未选中，则添加
      const newActiveList = [...activeElementIdList.value, id]
      mainStore.setActiveElementIdList(newActiveList)
    }
  } else {
    useBtn.value = false
    selectElement(id)
  }
}
// 保存元素名称的函数
const saveElementName = (e: FocusEvent | KeyboardEvent, id: string) => {
  // 从事件目标中获取输入框的值作为新名称
  const name = (e.target as HTMLInputElement).value

  // 调用store更新元素的名称属性
  slidesStore.updateElement({ id, props: { name } })

  // 重置编辑状态
  editingElId.value = ''
}
// 进入元素名称编辑模式的函数
const enterEdit = (id: string) => {
  // 设置当前正在编辑的元素ID
  editingElId.value = id

  // 在DOM更新后聚焦到对应的输入框
  nextTick(() => {
    const inputRef = document.querySelector(
      `#select-panel-input-${id}`
    ) as HTMLInputElement
    inputRef.focus()
  })
}
// 处理交互类型选择的函数
const handleSelect = (item: any) => {
  // 更新选中的交互类型
  selectType.value = item.type
  // 根据选择的类型更新幻灯片数据
  if (item.type === 'default') {
    const elementsId = currentSlide.value.elements.map((el) => el.id)
    const toData = {
      actionList: {
        ...currentSlide.value.actionList,
        elInteractionType: 'default',
        elementsId: elementsId,
        hiddenElements: [],
      },
    }
    slidesStore.updateSlide(toData)
  }
  if (item.type === 'onlyText') {
    slides.value.forEach((slide) => {
      const TextElements = slide.elements.filter(
        (el) =>
          el.type === 'text' || (el?.type === 'shape' && el?.text?.content)
      )
      const textElementIds = TextElements.map((el) => el.id)
      const elementsId = slide.elements.map((el) => el.id)
      const hiddenElementsIds = elementsId.filter(
        (id) => !textElementIds.includes(id)
      )
      const toData = {
        actionList: {
          ...slide.actionList,
          elInteractionType: 'onlyText',
          elementsId: elementsId,
          hiddenElementsIds: hiddenElementsIds,
        },
      }
      // 仅更新当前选中幻灯片的隐藏元素ID
      if (slide.id === currentSlide.value.id) {
        hideElementsIds.value = hiddenElementsIds
      }
      slidesStore.updateSlide(toData, slide.id)
    })
  }
  if (item.type === 'specified') {
    const currentHideIds = currentSlide.value.actionList?.hiddenElementsIds
    const elementsId = currentSlide.value.elements.map((el) => el.id)
    const toData = {
      actionList: {
        ...currentSlide.value.actionList,
        elInteractionType: 'specified',
        elementsId: elementsId,
        hiddenElementsIds: currentHideIds,
      },
    }
    slidesStore.updateSlide(toData)
  }
}
// 处理动画选择的函数
const handleClickAnimate = (animate: any) => {
  selectAnimate.value = animate.type
  // 遍历所有幻灯片并传入ID更新
  slides.value.forEach((slide) => {
    slidesStore.updateSlide(
      {
        actionList: {
          ...slide.actionList,
          interactionType: animate.type,
        },
      },
      slide.id
    )
  })
}
const handleOrderElement = (element: any, type: any) => {
  const Element = document.getElementById(`element-list-${element.id}`)
  if (Element) {
    Element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'center',
    })
  }
  orderElement(element, type)
}

// 处理元素的隐藏状态，ID 为元素标识，type 为交互类型，可取值 'none'、'clickZoom'、'default'
const handleHiddenActive = (item: any, type?: string) => {
  const ID = item.id

  // 检查 ID 是否为组合元素
  if (item.type === 'group') {
    // 遍历组合元素中的每个子元素
    item.elements.forEach((el: any) => {
      // 递归调用 handleHiddenActive 处理子元素
      handleHiddenActive(el, type)
    })
    return
  }

  if (type === 'none') {
    handleNoneState(ID)
  } else if (type === 'clickZoom') {
    handleClickZoomState(ID)
  } else if (type === 'default') {
    handleDefaultState(ID)
  }

  const toData = {
    actionList: {
      ...currentSlide.value.actionList,
      hiddenElementsIds: hideElementsIds.value,
      defaultElementIds: defaultElementIds.value,
      elInteractionType: 'specified',
    },
  }
  slidesStore.updateSlide(toData)
}
// 处理 type 为 'none' 的状态
const handleNoneState = (ID: any) => {
  if (!hideElementsIds.value.includes(ID)) {
    hideElementsIds.value.push(ID)
  }
}
// 处理 type 为 'clickZoom' 的状态
const handleClickZoomState = (ID: any) => {
  // 分别查找元素在 hideElementsIds 和 defaultElementIds 中的索引
  const hideIndex = hideElementsIds.value.indexOf(ID)
  const defaultIndex = defaultElementIds.value.indexOf(ID)
  if (hideIndex > -1) {
    hideElementsIds.value.splice(hideIndex, 1)
  }
  if (defaultIndex > -1) {
    defaultElementIds.value.splice(defaultIndex, 1)
  }
}
// 处理 type 为 'default' 的状态
const handleDefaultState = (ID: any) => {
  if (!defaultElementIds.value.includes(ID)) {
    defaultElementIds.value.push(ID)
  }
  const index = hideElementsIds.value.indexOf(ID)
  if (index > -1) {
    hideElementsIds.value.splice(index, 1)
  }
}
// 取消组合
const handleCombineElements = () => {
  useBtn.value = false
  uncombineElements()
}
// 组合
const handleUncombineElements = () => {
  combineElements()
}
const currentIcon = (item: any) => {
  // 对于组类型元素，基于组内元素的状态决定图标
  if (item.type === 'group') {
    // 检查组内是否有元素
    if (item.elements && item.elements.length > 0) {
      // 优先检查组内是否有隐藏元素
      const hasHiddenElement = item.elements.some((el: any) =>
        hideElementsIds.value.includes(el.id)
      )
      if (hasHiddenElement) return 'icon-wujiaohuxianshi'

      // 检查是否有默认显示元素
      const hasDefaultElement = item.elements.some((el: any) =>
        defaultElementIds.value.includes(el.id)
      )
      if (hasDefaultElement) return 'icon-morenxianshi'

      // 默认情况
      return 'icon-jiaohuxianshi'
    }
    // 空组默认显示
    return 'icon-morenxianshi'
  }

  // 非组元素逻辑
  if (hideElementsIds.value.includes(item.id)) {
    return 'icon-wujiaohuxianshi'
  }
  if (defaultElementIds.value.includes(item.id)) {
    return 'icon-morenxianshi'
  }
  return 'icon-jiaohuxianshi'
}
</script>

<style lang="scss" scoped>
.animate-pool {
  @include drage-modal-layout();
  padding: 15rem 10rem;
  padding-top: 0;
}

.title {
  height: 28rem;
  line-height: 28rem;
  margin: 0 -10rem 10rem -10rem;
  padding: 0 14rem;
  font-size: 12rem;
  display: flex;
  justify-content: space-between;
  border-top-left-radius: $borderRadius;
  border-top-right-radius: $borderRadius;
  user-select: none;

  .right {
    cursor: pointer;
    &:hover {
      color: $themeColor;
    }
  }
}

table {
  border-collapse: separate;
}

td {
  width: 20rem;
  height: 20rem;
  border: 2rem solid #fff;
  background-color: #f7f7f7;
  border-radius: 10rem;
}

.cell {
  width: 100%;
  height: 100%;
  border: 1rem solid #dcdcdc;
  border-radius: 3rem;

  &.active {
    background-color: rgba($color: $themeColor, $alpha: 0.1);
    border-color: $themeColor;
  }
}

.custom {
  margin-top: 20rem;
  display: flex;
  align-items: center;

  .row {
    display: flex;
    align-items: center;

    & + .row {
      margin-left: 10rem;
    }
  }
}

.btns {
  display: flex;
  justify-content: center;
  margin: 12rem 0;
  text-align: center;
  .btn {
    margin: 4rem;
    font-size: 14rem;
    &.active {
      background-color: rgba($color: $themeColor, $alpha: 0.1);
      border-color: $themeColor;
    }
  }
}
.animate-box {
  margin-top: 15rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.animate-item {
  width: 48%;
  margin-bottom: 10rem;
  border-radius: 10rem;
  border: 1rem solid $lightColor;
  cursor: pointer;
  border-radius: 10rem;
  height: 80rem;
  padding-bottom: 19%;
  flex-shrink: 0;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #ebe9fd;
    color: $themeColor;
  }
  &.active {
    background-color: rgba($color: $themeColor, $alpha: 0.1);
    border-color: $themeColor;
    color: $themeColor;
  }
  .animate-content {
    @include absolute-0();

    display: flex;
    justify-content: center;
    align-items: center;
    color: #aaaaaa;
    flex-direction: column;
    &:hover {
      color: $themeColor;
    }
    &.active {
      color: $themeColor;
    }
  }
  .icon {
    position: absolute;
    right: 10rem;
    top: 10rem;
    font-size: 18rem;
    color: $themeColor;
  }
}

.animate-content {
  @include absolute-0();

  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;

  &:hover {
    color: $themeColor;
  }
}
.select-panel {
  user-select: none;
  @include drage-modal-layout();
  font-size: 14rem;
  min-height: 400rem;
}

.handler {
  height: 24rem;
  margin-bottom: 8rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .icon-btns {
    height: 100%;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  .icon-btn {
    width: 16rem;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
      color: $themeColor;
    }
  }
}
.element-list {
  height: 384rem;
  overflow: auto;
}
.combination-btn {
  display: flex;
  flex-direction: row-reverse;
  margin-top: 12rem;
}
.disabled {
  pointer-events: none;
  opacity: 0.5;
}
.item {
  padding: 6rem;
  font-size: 14rem;
  border-radius: $borderRadius;
  display: flex;
  align-items: center;
  cursor: pointer;

  &.active {
    background-color: rgba($color: $themeColor, $alpha: 0.1);
  }
  &.group-active {
    background-color: rgba($color: $themeColor, $alpha: 0.2);
  }
  &:hover {
    background-color: rgba($color: $themeColor, $alpha: 0.25);
  }

  .name {
    height: 24rem;
    line-height: 24rem;
    flex: 1;
    @include ellipsis-oneline();
  }
  .icons {
    width: 20rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 5rem;
  }
}
.group-els {
  padding: 5rem 0;

  .group-title {
    height: 24rem;
    line-height: 28rem;
    display: flex;
    justify-content: space-between;
    margin-bottom: 5rem;
    padding: 0 5rem;
  }
  .item {
    margin-left: 15rem;
  }
}
.input {
  width: 100%;
  height: 22rem;
  border: 0;
  outline: 0;
  padding-left: 0;
  padding-right: 0;
  flex: 1;
  font-size: 14rem;
  background-color: transparent;
}
</style>
<style lang="scss">
.icon-item {
  display: flex;
  align-items: center;
  padding: 6rem;
  i {
    display: inline-block;
    font-size: 20rem;
    margin-right: 8rem;
  }

  &:last-child::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 1rem;
    background: #f0f0f0;
  }
  &:hover {
    background: #f4f5f8;
    cursor: pointer;
  }
  &.active {
    color: $themeColor;
    .iconfont {
      opacity: 1;
    }
  }
  &.disabled {
    pointer-events: none;
    background: #f4f5f8;
    color: #aaaaaa;
  }
}
</style>
