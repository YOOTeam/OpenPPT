<template>
  <div class="element-toolbar-element" :style="{ height: '300rem' }">
    <div class="mode-tips-title toolbar-title-mobile">
      <span> 添加超链接</span>
    </div>
    <div class="link-popover">
      <div class="link-name">输入超链接</div>
      <TextArea
        :padding="6"
        v-model:value="address"
        placeholder="请输入网页链接地址"
        :rows="4"
      />
      <div class="btns">
        <Button @click="clearLink" style="margin-right: 6rem">清空</Button>
        <Button type="primary" @click="updateLink">确认</Button>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import useLink from '@/hooks/useLink'
import TextArea from '@/components/TextArea.vue'
import Button from '@/components/Button.vue'
const emit = defineEmits<{
  (event: 'close'): void
}>()
const { handleElement } = storeToRefs(useMainStore())
const address = ref('')
onMounted(() => {
  if (handleElement.value?.link) {
    if (handleElement.value.link.type === 'web') {
      address.value = handleElement.value.link.target
    }
  }
})
const { setLink } = useLink()

const clearLink = () => {
  address.value = ''
}
const updateLink = () => {
  const link: PPTElementLink = {
    type: 'web',
    target: address.value,
  }
  if (handleElement.value) {
    setLink(handleElement.value, link)
  }
  emit('close')
}
</script>
<style lang="scss" scope>
.element-toolbar-element {
  padding: 10rem;
  height: 200rem;
  @include mobile-element-toolber();

  .link-popover {
    padding: 0 10rem;
    font-size: 14rem;
  }

  .link-name {
    font-size: 16rem;
    margin-bottom: 10rem;
  }
  .input {
    width: 100%;
    height: 32px;
  }

  .btns {
    text-align: right;
    margin-top: 10rem;
  }
}
</style>
