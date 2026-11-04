# CREDITS — 入库资产许可档案

> 规则见 assets/README.md；每条记录必须含来源 URL、许可、署名要求、核实日期。

## ToyCar.glb

| 项 | 值 |
| --- | --- |
| 来源 | Khronos glTF-Sample-Assets（Models/ToyCar） |
| URL | https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ToyCar |
| 许可 | **CC0-1.0**（模型全部文件，官方 LICENSE.md 核实） |
| 作者 | Guido Odendahl（车型）、Eric Chadwich（扩展与场景合成） |
| 署名要求 | 无（CC0；本档案署名为致谢而非义务） |
| 元数据许可 | 仓库元数据文件为 CC-BY-4.0（本档案引用了其中事实，注明来源即可） |
| 商标条款 | 许可明确排除 Logo 与商标 |
| 入库文件 | assets/models/khronos/ToyCar.glb（5.17MB）+ ToyCar.LICENSE.md |
| 检查报告 | docs/06-assets-and-data/inspect-ToyCar.json |
| 质量分级 | C（工程示意模型，modelType=SIMULATED；3 mesh，无独立机械组件） |
| 核实日期 | 2026-11-05 |
| 用途 | 资产管线验证、PBR/transmission/clearcoat 渲染验证、GLB 检查工具基准 |

## ToyCar-draco.glb（衍生件）

| 项 | 值 |
| --- | --- |
| 来源 | Blender 4.x 无头导出（本仓库 tools/ 流程，源件为上条 CC0 ToyCar.glb） |
| 许可 | **CC0-1.0**（衍生件随源件） |
| 压缩 | KHR_draco_mesh_compression level 6 ｜ 5.42MB → **2.22MB（-59%）** |
| 解码验证 | three DRACOLoader（解码器 vendored 于 public/draco-decoders/，Apache-2.0）— 解码后 3 mesh/108.9K tris 与源件一致 |
| 用途 | `?draco=1` 通道（PART 2.2/8.5 闭环） |
| 核实日期 | 2026-11-05 |
