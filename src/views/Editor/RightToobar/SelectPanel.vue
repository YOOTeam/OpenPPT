<template>
  <div class="select-panel p16">
    <div class="mode-tips-title">
      <span
        >{{ $t('themeSeting.pageLeve') }} （{{ activeElementIdList.length }}/{{
          currentSlide.elements.length
        }}）</span
      >
    </div>
    <!-- `选择（${activeElementIdList.length}/${currentSlide.elements.length}） -->
    <div class="handler" v-if="elements.length">
      <div class="btns">
        <Button
          size="small"
          style="margin-right: 5rem"
          @click="showAllElements()"
          >{{ $t('themeSeting.allShow') }}</Button
        >
        <Button size="small" @click="hideAllElements()">{{
          $t('themeSeting.allHiddent')
        }}</Button>
      </div>
      <div class="icon-btns" v-if="handleElement">
        <IconUp
          class="icon-btn"
          @click="orderElement(handleElement!, ElementOrderCommands.UP)"
        />

        <IconDown
          class="icon-btn"
          @click="orderElement(handleElement!, ElementOrderCommands.DOWN)"
        />
      </div>
    </div>
    <div class="element-list">
      <template v-for="item in elements" :key="item.id">
        <div class="group-els" v-if="item.type === 'group'">
          <div class="group-title">{{ $t('themeSeting.group') }}</div>
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
              @keydown.enter="($event) => saveElementName($event, groupItem.id)"
            />
            <div v-else class="name">
              {{ groupItem.name || ELEMENT_TYPE_ZH[groupItem.type] }}
            </div>
            <div class="icons">
              <IconPreviewClose
                style="font-size: 17rem"
                @click.stop="toggleHideElement(groupItem.id)"
                v-if="hiddenElementIdList.includes(groupItem.id)"
              />
              <IconPreviewOpen
                style="font-size: 17rem"
                @click.stop="toggleHideElement(groupItem.id)"
                v-else
              />
            </div>
          </div>
        </div>
        <div
          class="item"
          :class="{ active: activeElementIdList.includes(item.id) }"
          v-else
          @click="selectElement(item.id)"
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
          <div v-else class="name">
            {{ item.name || ELEMENT_TYPE_ZH[item.type] }}
          </div>
          <div class="icons">
            <IconPreviewClose
              style="font-size: 17rem"
              @click.stop="toggleHideElement(item.id)"
              v-if="hiddenElementIdList.includes(item.id)"
            />
            <IconPreviewOpen
              style="font-size: 17rem"
              @click.stop="toggleHideElement(item.id)"
              v-else
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import type { PPTElement } from '@/types/slides'
import { ELEMENT_TYPE_ZH } from '@/configs/element'
import useOrderElement from '@/hooks/useOrderElement'
import useHideElement from '@/hooks/useHideElement'
import useSelectElement from '@/hooks/useSelectElement'
import { ElementOrderCommands } from '@/types/edit'

import Button from '@/components/Button.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const slidesStore = useSlidesStore()
const mainStore = useMainStore()
const { currentSlide } = storeToRefs(slidesStore)
const {
  handleElement,
  handleElementId,
  activeElementIdList,
  activeGroupElementId,
  hiddenElementIdList,
} = storeToRefs(mainStore)

const { orderElement } = useOrderElement()
const { selectElement } = useSelectElement()
const { toggleHideElement, showAllElements, hideAllElements } = useHideElement()

interface GroupElements {
  type: 'group'
  id: string
  elements: PPTElement[]
}
type ElementItem = PPTElement | GroupElements

const elements = computed<ElementItem[]>(() => {
  const _elements: ElementItem[] = []
  for (const el of currentSlide.value.elements) {
    if (el.groupId) {
      const lastItem = _elements[_elements.length - 1]

      if (
        lastItem &&
        lastItem.type === 'group' &&
        lastItem.id &&
        lastItem.id === el.groupId
      ) {
        lastItem.elements.push(el)
      } else _elements.push({ type: 'group', id: el.groupId, elements: [el] })
    } else _elements.push(el)
  }

  return _elements.reverse()
})

const selectGroupEl = (item: GroupElements, id: string) => {
  if (handleElementId.value === id) return
  if (hiddenElementIdList.value.includes(id)) return

  const idList = item.elements.map((el) => el.id)
  mainStore.setActiveElementIdList(idList)
  mainStore.setHandleElementId(id)
  nextTick(() => mainStore.setActiveGroupElementId(id))
}

const editingElId = ref('')

const saveElementName = (e: FocusEvent | KeyboardEvent, id: string) => {
  const name = (e.target as HTMLInputElement).value
  slidesStore.updateElement({ id, props: { name } })
  editingElId.value = ''
}

const enterEdit = (id: string) => {
  editingElId.value = id
  nextTick(() => {
    const inputRef = document.querySelector(
      `#select-panel-input-${id}`
    ) as HTMLInputElement
    inputRef.focus()
  })
}
</script>

<style lang="scss" scoped>
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
  height: calc(100% - 32rem);
  overflow: auto;
}
.item {
  padding: 5rem;
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
