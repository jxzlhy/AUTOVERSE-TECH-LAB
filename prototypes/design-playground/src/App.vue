<script setup lang="ts">
import { ref } from "vue";
import { colors } from "@atl/shared";
import { AvBadge, AvButton, AvCard, AvInput, AvModal } from "@atl/design-system";

const modalOpen = ref(false);
const name = ref("");
const badEmail = ref("not-an-email");

const swatches = [
  { label: "bg-void", value: colors.bgVoid },
  { label: "bg-deep", value: colors.bgDeep },
  { label: "bg-elevated", value: colors.bgElevated },
  { label: "nexus-500", value: colors.nexus[500] },
  { label: "nexus-700", value: colors.nexus[700] },
  { label: "real", value: colors.exhibit.real },
  { label: "fiction", value: colors.exhibit.fiction },
  { label: "concept", value: colors.exhibit.concept },
  { label: "success", value: colors.status.success },
  { label: "warning", value: colors.status.warning },
  { label: "danger", value: colors.status.danger },
  { label: "info", value: colors.status.info },
];
</script>

<template>
  <main class="page">
    <header class="page-head">
      <span class="kicker">AUTOVERSE DESIGN SYSTEM</span>
      <h1>CORE UI Playground <em>v0</em></h1>
      <p class="sub">
        组件 = Headless 逻辑 + Design Tokens 样式（packages/design-system）。本页面是组件状态验收环境。
      </p>
    </header>

    <!-- 色板 -->
    <AvCard title="Color Tokens" tag="TOKENS">
      <div class="swatches">
        <figure v-for="s in swatches" :key="s.label" class="swatch">
          <span class="swatch__chip" :style="{ background: s.value }" />
          <figcaption class="swatch__label">{{ s.label }}<br /><code>{{ s.value }}</code></figcaption>
        </figure>
      </div>
    </AvCard>

    <div class="grid">
      <!-- Button 矩阵 -->
      <AvCard title="Button · variant × state" tag="CORE UI">
        <div class="row">
          <AvButton variant="primary">主要操作</AvButton>
          <AvButton>次要操作</AvButton>
          <AvButton variant="danger">危险操作</AvButton>
        </div>
        <div class="row">
          <AvButton variant="primary" loading>加载中</AvButton>
          <AvButton variant="primary" disabled>禁用</AvButton>
          <AvButton size="s">小尺寸</AvButton>
        </div>
      </AvCard>

      <!-- Badge -->
      <AvCard title="Badge · 展品语义" tag="CORE UI">
        <div class="row">
          <AvBadge kind="REAL" />
          <AvBadge kind="FICTION" />
          <AvBadge kind="CONCEPT" />
        </div>
        <p class="note">文字 + 色双通道（无障碍 §9.5：色彩不是唯一区分手段）。</p>
      </AvCard>

      <!-- Input -->
      <AvCard title="Input · 状态" tag="CORE UI">
        <AvInput v-model="name" label="展品名称" placeholder="例如：DeLorean DMC-12" />
        <div class="gap" />
        <AvInput v-model="badEmail" label="邮箱（错误态）" error="邮箱格式不正确" />
        <div class="gap" />
        <AvInput label="禁用态" model-value="不可编辑" disabled />
      </AvCard>

      <!-- Modal -->
      <AvCard title="Modal · 对话框" tag="CORE UI">
        <div class="row">
          <AvButton variant="primary" @click="modalOpen = true">打开对话框</AvButton>
        </div>
        <p class="note">Esc / 点击遮罩关闭；打开时锁定背景滚动。</p>
      </AvCard>
    </div>

    <AvModal :open="modalOpen" title="展品操作确认" @close="modalOpen = false">
      <p>确认将「DeLorean DMC-12」标记为收藏？此操作会同步到探索历史。</p>
      <div class="row modal-actions">
        <AvButton @click="modalOpen = false">取消</AvButton>
        <AvButton variant="primary" @click="modalOpen = false">确认</AvButton>
      </div>
    </AvModal>

    <footer class="page-foot">
      <span class="kicker">docs/04-design-system · playground v0 · 2026-11-05</span>
    </footer>
  </main>
</template>

<style scoped>
.page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 48px 28px 64px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-head h1 {
  margin: 6px 0 4px;
  font-size: 28px;
  font-weight: 600;
}

.page-head h1 em {
  font-style: normal;
  color: var(--av-nexus-500);
  font-size: 16px;
  margin-left: 6px;
}

.kicker {
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--av-text-secondary);
}

.sub {
  margin: 0;
  font-size: 13px;
  color: var(--av-text-secondary);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}

.swatch {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.swatch__chip {
  height: 40px;
  border-radius: var(--av-radius-m);
  border: 1px solid var(--av-border-faint);
}

.swatch__label {
  font-size: 10px;
  color: var(--av-text-secondary);
  line-height: 1.5;
}

.swatch__label code {
  font-family: var(--av-font-mono);
  font-size: 9px;
  color: var(--av-text-muted);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.gap {
  height: 10px;
}

.note {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--av-text-muted);
}

.modal-actions {
  justify-content: flex-end;
  margin-top: 18px;
}

.page-foot {
  margin-top: 24px;
}
</style>
