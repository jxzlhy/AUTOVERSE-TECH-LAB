# Blender 自动化研究（PHASE 2F §8.5）

> 核实日期：2026-11-05 ｜ 状态：**R（官方文档研究）**——本机未安装 Blender，V 级执行验证待 Blender 环境就绪后进行（见"待验证"）

---

## 1. 结论速览

| 能力 | 官方 API | 自动化可行性 | V 级状态 |
| --- | --- | --- | --- |
| 无头批处理 | `blender --background --python script.py` | ✅ 官方 CLI 模式 | 待本机验证 |
| 场景操作 | `bpy`（Python API） | ✅ | 待验证 |
| glTF 导出 | `bpy.ops.export_scene.gltf(filepath, export_format='GLB', export_draco_mesh_compression_enable=…)` | ✅（io_scene_gltf 内置插件） | 待验证 |
| 自动命名 | `obj.name = …` + 自定义属性 `obj["part_id"] = …` | ✅ | 待验证 |
| 网格检查 | `mesh.vertices/polygons`、`obj.bound_box`、三角面统计 | ✅ | 待验证 |
| 材质检查 | `obj.material_slots`、`mat.use_nodes`、 Principled BSDF 节点参数 | ✅ | 待验证 |
| 优化 | Decimate 修改器 / `bpy.ops.object.modifier_apply`；纹理打包 | ✅ | 待验证 |
| Geometry Nodes | 通过节点树 API 程序化构建（复杂度高，建议限定模板化用途） | ⚠️ 可行但成本高 | 不在本轮 |

来源：Blender 官方 Python API 文档 <https://docs.blender.org/api/current/>（核实日期 2026-11-04）；glTF 导出选项见官方 io_scene_gltf 文档（同源）。许可：Blender 为 GPL，**导出的 glTF 资产不受 GPL 传染**（Blender 官方 FAQ 明确输出文件属于用户）——来源 <https://www.blender.org/about/license/>，商用资产管线可用。

## 2. AUTOVERSE 资产流水线设计（原始模型 → 入库）

```text
获取（许可核实，见 asset-sources.md）
→ Blender 无头检查脚本（tools/blender/inspect_asset.py）：
   场景统计 / 层级树 / 部件命名规范校验 / 材质清单 / 尺寸与包围盒
→ 规范化（自动命名 part_id / 原点归位 / 单位统一米）
→ 优化（Decimate 可选 / 纹理转 KTX2 走 gltf-transform CLI，不在 Blender 内做）
→ glTF 导出（GLB + Draco 可选）
→ tools/inspect-glb.mjs 复检（与本仓库现有工具闭环）
→ 质量分级（S/A/B/C，§8.2）+ CREDITS.md 建档
```

### 2.1 检查脚本要点（设计中，待 Blender 环境后实现并实测）

```python
# tools/blender/inspect_asset.py 伪代码骨架
import bpy, json
report = {"nodes": [], "materials": [], "warnings": []}
for obj in bpy.context.scene.objects:
    if obj.type == "MESH":
        report["nodes"].append({
            "name": obj.name,
            "part_id": obj.get("part_id"),          # 自定义属性（拆解标识）
            "tris": sum(len(p.vertices) - 2 for p in obj.data.polygons),
            "materials": [s.material.name for s in obj.material_slots if s.material],
            "dims": list(obj.dimensions),
        })
# 命名规范校验：part_id 缺失 → warnings（不自动猜测，§8.5 人工确认）
print("ATL_REPORT " + json.dumps(report))
```

- 输出走 stdout 前缀 `ATL_REPORT`（无头模式可靠解析），与本仓库 `tools/inspect-glb.mjs` 形成双检查。

## 3. 待验证清单（需 Blender ≥4.x 环境）

1. `--background` 无头运行与 ATL_REPORT 解析；
2. glTF 导出 Draco 开关与 three 端 DRACOLoader 解码闭环；
3. 自定义属性（part_id）经 glTF 导出后在 three `userData` 的保留情况；
4. Decimate 后法线/UV 完整性。

> 环境说明：Blender 安装包 ~300MB，本机网络策略（同 F11）可能拦截下载——列为用户待办（可选）：安装后由代理补 V 级验证。

## 4. 核实记录表

| 核实项 | 来源 | 日期 |
| --- | --- | --- |
| bpy API / 无头模式 | docs.blender.org/api/current | 2026-11-04 |
| glTF 导出器选项 | docs.blender.org（io_scene_gltf） | 2026-11-04 |
| GPL 与导出资产边界 | blender.org/about/license | 2026-11-04 |
| 上述脚本行为 | **未能核实**（无本机 Blender） | — |
