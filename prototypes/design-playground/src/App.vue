<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { createScrollNarrative } from "@atl/motion-system";
import { colors } from "@atl/shared";
import {
  AvBadge,
  AvButton,
  AvCard,
  AvDrawer,
  AvDropdown,
  AvInput,
  AvModal,
  AvNav,
  AvSearch,
  AvSelect,
  AvTabs,
  AvToast,
  AvToggle,
  AvTooltip,
} from "@atl/design-system";

// PART 7 Scroll Narrative（正式封装版，ScrollTrigger 由 motion-system 内部注册）
const narrativeSteps = [
  { year: "1886", title: "汽车诞生", text: "Karl Benz Patent-Motorwagen——交通文明的第一道车辙。" },
  { year: "1962", title: "性能纪元", text: "保时捷 901 面世，911 血统由此开始。" },
  { year: "1981", title: "不锈钢传奇", text: "DeLorean DMC-12 下线，随后成为时间机器。" },
  { year: "未来", title: "探索不止", text: "AUTOVERSE：一个宇宙，多个世界，无限探索。" },
];
let narrative: ReturnType<typeof createScrollNarrative> | null = null;
onMounted(() => {
  // 第二次迁移尝试：这次带 console 取证（F19 调试）
  try {
    narrative = createScrollNarrative(
      narrativeSteps.map((_, i) => ({ el: `.narr-step:nth-child(${i + 1})` })),
      { scope: ".narr-track" },
    );
    (window as unknown as { __mig: string }).__mig = "ok";
  } catch (err) {
    (window as unknown as { __mig: string }).__mig = `ERR:${String(err)}`;
  }
});
onBeforeUnmount(() => narrative?.destroy()); // PART 7：可清理

const modalOpen = ref(false);
const drawerOpen = ref(false);
const searchQ = ref("");
const selBrand = ref("delorean");
const navActive = ref("home");
const theme = ref<"space" | "museum">("space");
const themeSwitch = computed({
  get: () => theme.value === "museum",
  set: (v: boolean) => (theme.value = v ? "museum" : "space"),
});
const name = ref("");
const badEmail = ref("not-an-email");
const toastMsg = ref<string | null>(null);
let toastSeq = 0;

function fireToast(): void {
  toastSeq += 1;
  toastMsg.value = `操作已记录 #${toastSeq}`; // key 强制重建组件以重复演示
}

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
  <main class="page" :class="{ museum: theme === 'museum' }">
    <div class="theme-switch" style="pointer-events: auto; position: absolute; top: 14px; right: 16px; display: flex; gap: 8px">
      <AvToggle v-model="themeSwitch" label="MUSEUM 浅色主题" accent="#F59E0B" />
    </div>
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

    <!-- CORE UI v0.2：Dropdown/Tooltip/Drawer/Search/Select/Nav -->
    <AvCard title="CORE UI v0.2 · Dropdown / Tooltip / Drawer / Search / Select / Nav" tag="CORE UI">
      <div class="row" style="margin-bottom: 12px">
        <AvDropdown
          label="排序"
          :items="[
            { id: 'year', label: '按年代' },
            { id: 'brand', label: '按品牌' },
            { id: 'type', label: '按类型' },
          ]"
          @select="(id: string) => (navActive = id)"
        />
        <AvTooltip text="展品类型在数据层显式区分">
          <AvBadge kind="FICTION" />
        </AvTooltip>
        <AvButton @click="drawerOpen = true">打开抽屉</AvButton>
      </div>
      <div class="row" style="margin-bottom: 12px">
        <AvSearch v-model="searchQ" style="max-width: 280px" @search="(v: string) => (searchQ = v)" />
        <AvSelect
          v-model="selBrand"
          label="品牌"
          :options="[
            { value: 'delorean', label: 'DeLorean' },
            { value: 'porsche', label: 'Porsche' },
            { value: 'ferrari', label: 'Ferrari' },
          ]"
        />
      </div>
      <AvNav
        :items="[
          { id: 'home', label: '首页' },
          { id: 'museum', label: '文明博物馆' },
          { id: 'legends', label: '传奇馆' },
        ]"
        :active-id="navActive"
        @navigate="(id: string) => (navActive = id)"
      />
    </AvCard>

    <AvDrawer :open="drawerOpen" title="展品操作台" @close="drawerOpen = false">
      <p>ENGINEERING 操作入口将挂接在此（零件树/剖切/标注）。</p>
    </AvDrawer>

    <!-- Tabs + Toast -->
    <AvCard title="Tabs & Toast" tag="CORE UI v0.1">
      <AvTabs
        :tabs="[
          { id: 'overview', label: '总览' },
          { id: 'specs', label: '参数' },
          { id: 'history', label: '历史' },
        ]"
      >
        <template #overview>展品总览面板（键盘 ←/→ 可切换标签）。</template>
        <template #specs>参数面板：动力/底盘/尺寸。</template>
        <template #history>历史面板：1981—至今。</template>
      </AvTabs>
      <div class="row" style="margin-top: 14px">
        <AvButton variant="primary" @click="fireToast">触发 Toast</AvButton>
      </div>
    </AvCard>

    <AvModal :open="modalOpen" title="展品操作确认" @close="modalOpen = false">
      <p>确认将「DeLorean DMC-12」标记为收藏？此操作会同步到探索历史。</p>
      <div class="row modal-actions">
        <AvButton @click="modalOpen = false">取消</AvButton>
        <AvButton variant="primary" @click="modalOpen = false">确认</AvButton>
      </div>
    </AvModal>

    <AvToast v-if="toastMsg" :key="toastSeq" :message="toastMsg" kind="success" />

    <!-- PART 7 Scroll Narrative（ScrollTrigger 滚动叙事 Demo） -->
    <AvCard title="Scroll Narrative · 滚动叙事" tag="MOTION">
      <div class="narr-track">
        <div v-for="st in narrativeSteps" :key="st.year" class="narr-step">
          <span class="narr-year">{{ st.year }}</span>
          <div>
            <h4 class="narr-title">{{ st.title }}</h4>
            <p class="narr-text">{{ st.text }}</p>
          </div>
        </div>
      </div>
      <p class="note">createScrollNarrative 正式封装（packages/motion-system）：ScrollTrigger + scrub，reduced-motion 直达终态，onBeforeUnmount destroy 可清理。</p>
    </AvCard>

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
.narr-track { display: flex; flex-direction: column; gap: 26px; padding: 8px 4px; }
.narr-step { display: flex; gap: 18px; align-items: baseline; }
.narr-year { font-family: var(--av-font-mono); font-size: 20px; color: var(--av-nexus-500); min-width: 64px; }
.narr-title { margin: 0 0 4px; font-size: 14px; color: var(--av-text-primary); }
.narr-text { margin: 0; font-size: 12px; color: var(--av-text-secondary); line-height: 1.7; }
.page.museum {
  --av-bg-void: #f3efe7;
  --av-bg-elevated: #ffffff;
  --av-glass-bg: rgba(255, 255, 255, 0.9);
  --av-text-primary: #1c1a17;
  --av-text-secondary: #5c564d;
  --av-text-muted: #8a8378;
  --av-border-faint: rgba(28, 26, 23, 0.12);
  --av-nexus-500: #b4762a;
  background: var(--av-bg-void);
}
.page.museum .kicker, .page.museum .sub, .page.museum .note { color: var(--av-text-secondary); }
.theme-switch { z-index: 5; }
</style>
