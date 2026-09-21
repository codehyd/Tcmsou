import bpy
from mathutils import Vector
from pathlib import Path
import sys

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
import display_standard as std

bpy.ops.wm.open_mainfile(filepath=str(std.BLEND_DIR / "herbs" / "chenpi" / "chenpi_source.blend"))

print("=== OBJECTS ===")
for obj in bpy.data.objects:
    dims = tuple(round(x, 4) for x in obj.dimensions)
    loc = tuple(round(x, 4) for x in obj.location)
    print(f"{obj.name:24} type={obj.type:8} loc={loc} dims={dims} hide_render={obj.hide_render}")

obj = bpy.data.objects.get("Chenpi_High")
if obj:
    ws = [obj.matrix_world @ v.co for v in obj.data.vertices]
    xs, ys, zs = [c.x for c in ws], [c.y for c in ws], [c.z for c in ws]
    print("Chenpi world bbox:")
    print("  X", round(min(xs), 4), round(max(xs), 4), "size", round(max(xs) - min(xs), 4))
    print("  Y", round(min(ys), 4), round(max(ys), 4), "size", round(max(ys) - min(ys), 4))
    print("  Z", round(min(zs), 4), round(max(zs), 4), "size", round(max(zs) - min(zs), 4))
    print("  verts", len(obj.data.vertices), "mats", [m.name if m else None for m in obj.data.materials])
    print("  matrix_world\n", obj.matrix_world)
else:
    print("Chenpi_High missing")
