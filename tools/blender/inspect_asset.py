# ATL 资产检查（Blender 无头模式）——PHASE 2F §8.5
# 用法：blender --background --python tools/blender/inspect_asset.py -- <file.blend|glb经导入>
# 输出：stdout 前缀 "ATL_REPORT " + JSON（与本仓库 tools/inspect-glb.mjs 双检闭环）
import bpy
import json
import sys

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if not argv:
    print("ATL_REPORT " + json.dumps({"error": "no input file"}))
    sys.exit(2)

# .glb 输入：先导入再检查（无头模式）
if argv[0].lower().endswith((".glb", ".gltf")):
    bpy.ops.import_scene.gltf(filepath=argv[0])

report = {"file": argv[0], "nodes": [], "materials": [], "warnings": []}
for obj in bpy.context.scene.objects:
    if obj.type == "MESH":
        mesh = obj.data
        tris = sum(len(p.vertices) - 2 for p in mesh.polygons)
        mats = [s.material.name for s in obj.material_slots if s.material]
        report["nodes"].append({
            "name": obj.name,
            "part_id": obj.get("part_id"),  # 拆解标识自定义属性（缺失进 warnings）
            "tris": tris,
            "materials": mats,
            "dims": [round(v, 4) for v in obj.dimensions],
        })
        if not obj.get("part_id"):
            report["warnings"].append(f"missing part_id: {obj.name}")
for mat in bpy.data.materials:
    report["materials"].append({
        "name": mat.name,
        "use_nodes": mat.use_nodes,
    })

report["counts"] = {
    "objects": len(bpy.context.scene.objects),
    "meshes": len([o for o in bpy.context.scene.objects if o.type == "MESH"]),
    "materials": len(bpy.data.materials),
}
print("ATL_REPORT " + json.dumps(report, ensure_ascii=False))
