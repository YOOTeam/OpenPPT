<template>
  <div class="add-text-node">
    <div class="mode-tips-title">
      <span> {{ $t('toolbar.addText') }} </span>
    </div>
    <div class="drageModal-content">
      <div class="select-box">
        <div
          class="select-text"
          v-for="item in list"
          :key="item.type"
          @click="handleSelect(item)"
          :class="[selectText === item.type ? 'active' : '']"
        >
          <div :style="{ fontSize: '14rem', fontWeight: 600 }">
            {{ item.type }}
          </div>
          <div class="label">{{ item.name }}</div>
        </div>
      </div>
      <div class="alignLeft">
        <span>{{ $t('toolbar.textDirection') }}</span>
        <ButtonGroup class="row">
          <Button
            v-for="item in direction"
            :key="item.value"
            :class="[directionValue === item.value ? 'active' : '']"
            style="flex: 1; height: 40rem; line-height: 40rem"
            @click="handleChange(item.value)"
            >{{ item.label }}</Button
          >
        </ButtonGroup>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref } from 'vue'
import Button from '@/components/Button.vue'
import ButtonGroup from '@/components/ButtonGroup.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const emit = defineEmits<{
  (event: 'createText', payload: any): void
}>()

const list = reactive([
  {
    name: t('toolbar.titleBox'),
    type: 'H1',
    size: '20rem',
  },
  {
    name: t('toolbar.subtitleBox'),
    type: 'H2',
    size: '18rem',
  },
  {
    name: t('toolbar.textBox'),
    type: 'T1',
    size: '16rem',
  },
  {
    name: t('toolbar.noteBox'),
    type: 'T2',
    size: '12rem',
  },
])

const selectText = ref('')
const directionValue = ref('horizontal')
const direction = reactive([
  {
    value: 'horizontal',
    label: t('toolbar.hDirection'),
  },
  {
    value: 'vertical',
    label: t('toolbar.vDirection'),
  },
])

const handleSelect = (item: any) => {
  selectText.value = item.type
  emit('createText', { vertical: directionValue.value, type: selectText.value })
}

const handleChange = (value) => {
  directionValue.value = value
  emit('createText', { vertical: directionValue.value, type: selectText.value })
}
</script>
<style lang="scss">
.add-text-node {
  @include drage-modal-layout();
  width: 312rem;
  .arco-radio-group {
    display: flex;
    margin-left: 15rem;

    .arco-tag {
      padding: 0;
    }

    .arco-radio {
      font-size: 14rem;
      margin-right: 0;

      .arco-tag-size-medium {
        font-size: 14rem;
      }
    }

    .arco-tag-checked {
      background: transparent;
    }
  }

  .alignLeft {
    margin-top: 10rem;
    .row {
      width: 100%;
      display: flex;
      align-items: center;
      margin-top: 10rem;
    }

    .active {
      border-color: $themeColor;
      color: $themeColor;
      position: relative;
    }

    .button:first-child {
      &.active {
        &::after {
          content: '';
          width: 1px;
          height: calc(100% + 2rem);
          background-color: #4e3eff;
          position: absolute;
          top: -1px;
          right: -1px;
        }
      }
    }
  }
  .select-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .select-text {
    vertical-align: top;
    width: 48%;
    display: inline-block;
    text-align: center;
    color: #1a1a1a;
    font-size: 14rem;
    padding: 20rem 0;
    height: 80rem;
    border-radius: 10rem;
    margin-bottom: 10rem;
    border: 1rem solid $lightColor;
    cursor: pointer;

    &:hover {
      color: $themeColor;
      border: 1rem solid $themeColor;
    }
  }

  .active {
    color: $themeColor;
    border: 1rem solid $themeColor;
  }

  .label {
    margin-top: 8rem;
  }
}
</style>
