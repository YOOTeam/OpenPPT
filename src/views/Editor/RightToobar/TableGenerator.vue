<template>
  <div class="table-generator">
    <div class="mode-tips-title">
      <span> {{ $t('toolbar.addTable') }}</span>
    </div>
    <div style="color: #767676; font-size: 12rem; margin-bottom: 10rem">
      {{ $t('toolbar.tableTips') }}
      <!-- {{ endCell.length ? `${endCell[0]} x ${endCell[1]}` : '' }} -->
    </div>
    <table @click="handleClickTable()" @dblclick="isClick = false">
      <tbody>
        <tr v-for="row in 12" :key="row">
          <td
            @mouseenter="hadleMouseEnter(row, col)"
            v-for="col in 13"
            :key="col"
          >
            <div
              class="cell"
              :class="{
                active:
                  endCell.length && row <= endCell[0] && col <= endCell[1],
              }"
            ></div>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="custom">
      <div class="row">
        <div class="label" style="width: 35%">{{ $t('toolbar.rowNum') }}</div>
        <NumberInput
          :min="1"
          :max="20"
          v-model:value="customRow"
          style="width: 65%"
        />
      </div>
      <div class="row">
        <div class="label" style="width: 35%">{{ $t('toolbar.colNum') }}</div>
        <NumberInput
          :min="1"
          :max="20"
          v-model:value="customCol"
          style="width: 65%"
        />
      </div>
    </div>
    <div class="btns">
      <!-- <Button class="btn" @click="close()">取消</Button> -->
      <Button class="btn" @click="insertCustomTable()">{{
        $t('toolbar.addTableTips')
      }}</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import message from '@/utils/message'
import Button from '@/components/Button.vue'
import NumberInput from '@/components/NumberInput.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
interface InsertData {
  row: number
  col: number
}

const emit = defineEmits<{
  (event: 'insert', payload: InsertData): void
  (event: 'close'): void
}>()

const endCell = ref<number[]>([])
const customRow = ref(3)
const customCol = ref(3)
const isCustom = ref(false)
const isClick = ref(false)

const handleClickTable = () => {
  if (!endCell.value.length) return
  const [row, col] = endCell.value
  isClick.value = true
}

const hadleMouseEnter = (row, col) => {
  if (isClick.value) return
  endCell.value = [row, col]
  customRow.value = row
  customCol.value = col
}

const insertCustomTable = () => {
  if (customRow.value < 1 || customRow.value > 20) {
    return message.warning(t('lastReamrk.error'))
  }
  if (customCol.value < 1 || customCol.value > 20) {
    return message.warning(t('lastReamrk.error'))
  }
  emit('insert', { row: customRow.value, col: customCol.value })
  isCustom.value = false
}

const close = () => {
  emit('close')
  isCustom.value = false
}
</script>

<style lang="scss" scoped>
.table-generator {
  @include drage-modal-layout();
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
  margin-top: 20rem;
  text-align: left;

  .btn {
    font-size: 14rem;
  }
}
</style>
