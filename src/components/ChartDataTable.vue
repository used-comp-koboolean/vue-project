<script setup>
import { computed, ref } from 'vue';
import dayjs from 'dayjs';

// data: Chart.js 의 config.data 객체 (차트와 같은 객체를 직접 수정)
const props = defineProps({
  data: { type: Object, required: true },
  // 항목(라벨) 입력 형식: 'text' | 'date' (시간축 차트)
  labelType: { type: String, default: 'text' },
});

const emit = defineEmits(['change']);

// data 는 반응형 객체가 아니므로 행 추가/삭제 후 표를 다시 그리기 위한 키
const rowsVersion = ref(0);

const firstValue = computed(() => props.data.datasets[0]?.data[0]);
// 플로팅 막대처럼 [시작, 끝] 형태의 데이터인지 여부
const isRangeData = computed(() => Array.isArray(firstValue.value));
// scatter / bubble 처럼 { x, y, r } 형태의 데이터인지 여부
const isPointData = computed(() => typeof firstValue.value === 'object' && !isRangeData.value);
const axes = computed(() => ('r' in (props.data.datasets[0]?.data[0] ?? {}) ? ['x', 'y', 'r'] : ['x', 'y']));

function notifyRowsChanged() {
  rowsVersion.value += 1;
  emit('change');
}

function readNumber(event) {
  const value = event.target.valueAsNumber;
  return Number.isNaN(value) ? null : value;
}

function updateLabel(row, event) {
  // 날짜를 지우는 중(빈 값)에는 시간축이 깨지지 않도록 반영하지 않음
  if (props.labelType === 'date' && !event.target.value) return;

  props.data.labels[row] = event.target.value;
  emit('change');
}

function updateValue(dataset, row, event) {
  const value = readNumber(event);
  if (value === null) return;

  dataset.data[row] = value;
  emit('change');
}

function updateRange(dataset, row, edge, event) {
  const value = readNumber(event);
  if (value === null) return;

  dataset.data[row][edge] = value;
  emit('change');
}

function updatePoint(point, axis, event) {
  const value = readNumber(event);
  if (value === null) return;

  point[axis] = value;
  emit('change');
}

function nextLabel() {
  const { labels } = props.data;

  if (props.labelType === 'date') {
    const lastDate = dayjs(labels[labels.length - 1]);
    return (lastDate.isValid() ? lastDate.add(1, 'day') : dayjs()).format('YYYY-MM-DD');
  }
  return `항목 ${labels.length + 1}`;
}

function addRow() {
  props.data.labels.push(nextLabel());
  props.data.datasets.forEach((dataset) => dataset.data.push(isRangeData.value ? [0, 0] : 0));
  notifyRowsChanged();
}

function removeRow(row) {
  if (props.data.labels.length <= 1) return;

  props.data.labels.splice(row, 1);
  props.data.datasets.forEach((dataset) => dataset.data.splice(row, 1));
  notifyRowsChanged();
}

function addPoint(dataset) {
  const point = Object.fromEntries(axes.value.map((axis) => [axis, axis === 'r' ? 10 : 50]));
  dataset.data.push(point);
  notifyRowsChanged();
}

function removePoint(dataset, row) {
  // 그룹마다 최소 1개는 남겨 x/y/r 형태 판별이 가능하도록 유지
  if (dataset.data.length <= 1) return;

  dataset.data.splice(row, 1);
  notifyRowsChanged();
}
</script>

<template>
  <div class="data-table">
    <div :key="rowsVersion" class="table-wrap">
      <table v-if="isPointData">
        <thead>
          <tr>
            <th>그룹</th>
            <th v-for="axis in axes" :key="axis">{{ axis.toUpperCase() }}</th>
            <th class="action-col" />
          </tr>
        </thead>
        <tbody>
          <template v-for="(dataset, col) in data.datasets" :key="col">
            <tr v-for="(point, row) in dataset.data" :key="`${col}-${row}`">
              <td class="label-cell">{{ dataset.label }}</td>
              <td v-for="axis in axes" :key="axis">
                <input type="number" step="any" :value="point[axis]" @input="updatePoint(point, axis, $event)" />
              </td>
              <td class="action-col">
                <button
                  type="button"
                  class="remove-btn"
                  title="행 삭제"
                  :disabled="dataset.data.length <= 1"
                  @click="removePoint(dataset, row)"
                >
                  ×
                </button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <table v-else>
        <thead>
          <tr>
            <th>{{ labelType === 'date' ? '날짜' : '항목' }}</th>
            <template v-for="(dataset, col) in data.datasets" :key="col">
              <template v-if="isRangeData">
                <th>{{ dataset.label }} 시작</th>
                <th>{{ dataset.label }} 끝</th>
              </template>
              <th v-else>{{ dataset.label ?? '값' }}</th>
            </template>
            <th class="action-col" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="(label, row) in data.labels" :key="row">
            <td>
              <input
                :type="labelType === 'date' ? 'date' : 'text'"
                :value="label"
                @input="updateLabel(row, $event)"
              />
            </td>
            <template v-for="(dataset, col) in data.datasets" :key="col">
              <template v-if="isRangeData">
                <td v-for="edge in [0, 1]" :key="edge">
                  <input
                    type="number"
                    step="any"
                    :value="dataset.data[row][edge]"
                    @input="updateRange(dataset, row, edge, $event)"
                  />
                </td>
              </template>
              <td v-else>
                <input
                  type="number"
                  step="any"
                  :value="dataset.data[row]"
                  @input="updateValue(dataset, row, $event)"
                />
              </td>
            </template>
            <td class="action-col">
              <button
                type="button"
                class="remove-btn"
                title="행 삭제"
                :disabled="data.labels.length <= 1"
                @click="removeRow(row)"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="add-actions">
      <template v-if="isPointData">
        <button
          v-for="(dataset, col) in data.datasets"
          :key="col"
          type="button"
          class="add-btn"
          @click="addPoint(dataset)"
        >
          + {{ dataset.label }} 행 추가
        </button>
      </template>
      <button v-else type="button" class="add-btn" @click="addRow">+ 행 추가</button>
    </div>
  </div>
</template>

<style scoped>
.data-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.table-wrap {
  max-height: 300px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 6px 8px;
  background: #f1f5f9;
  color: #374151;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

td {
  padding: 2px 4px;
  border-top: 1px solid #f1f5f9;
}

.label-cell {
  padding: 2px 8px;
  color: #6b7280;
  white-space: nowrap;
}

.action-col {
  width: 28px;
  padding: 2px;
  text-align: center;
}

input {
  width: 100%;
  min-width: 56px;
  padding: 4px 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  font: inherit;
  color: #1f2937;
}

input[type='date'] {
  min-width: 130px;
}

input:hover {
  border-color: #d5dbe7;
}

input:focus {
  border-color: #2563eb;
  outline: none;
  background: #fff;
}

.remove-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #9ca3af;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.remove-btn:hover:not(:disabled) {
  background: #fee2e2;
  color: #dc2626;
}

.remove-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.add-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.add-btn {
  padding: 5px 10px;
  border: 1px dashed #93c5fd;
  border-radius: 6px;
  background: #f8fafc;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.add-btn:hover {
  background: #e8eefc;
}
</style>
