<script setup lang="ts">
/** ENGINEERING UI · Component Inspector — 部件属性检查器（键值行 + 可信度标注位） */
export interface InspectorRow {
  label: string;
  value: string;
  /** confirmed=实测/解析确认 ｜ estimated=推算 ｜ unknown=无法判断（PHASE 2 §2.3 数据可信度约定） */
  certainty?: "confirmed" | "estimated" | "unknown";
}

withDefaults(defineProps<{ title: string; rows: InspectorRow[] }>(), {
  rows: () => [],
});
</script>

<template>
  <div class="av-insp" role="table" aria-label="部件检查器">
    <h4 class="av-insp__title">{{ title }}</h4>
    <dl class="av-insp__body">
      <div v-for="row in rows" :key="row.label" class="av-insp__row" role="row">
        <dt class="av-insp__label">{{ row.label }}</dt>
        <dd class="av-insp__value">
          {{ row.value }}
          <sup
            v-if="row.certainty && row.certainty !== 'confirmed'"
            class="av-insp__cert"
            :title="row.certainty === 'estimated' ? '推算值' : '无法判断'"
          >
            {{ row.certainty === "estimated" ? "≈" : "?" }}
          </sup>
        </dd>
      </div>
    </dl>
    <slot />
  </div>
</template>

<style scoped>
.av-insp {
  border: 1px solid var(--av-border-faint);
  border-radius: var(--av-radius-m);
  background: var(--av-glass-bg);
  overflow: hidden;
}

.av-insp__title {
  margin: 0;
  padding: 9px 14px;
  font-size: 12px;
  font-weight: 500;
  color: var(--av-text-primary);
  border-bottom: 1px solid var(--av-border-faint);
}

.av-insp__body {
  margin: 0;
  padding: 6px 0;
}

.av-insp__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  padding: 4px 14px;
}

.av-insp__label {
  font-size: 11px;
  color: var(--av-text-muted);
}

.av-insp__value {
  margin: 0;
  font-family: var(--av-font-mono);
  font-size: 11px;
  color: var(--av-text-primary);
}

.av-insp__cert {
  color: var(--av-warning);
  cursor: help;
}
</style>
