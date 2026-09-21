import bpy
from pathlib import Path
import sys
from mathutils import Euler

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
import display_standard as std

bpy.ops.wm.open_mainfile(filepath=str(std.BLEND_DIR / "herbs" / "chenpi" / "chenpi_source.blend"))
obj = bpy.data.objects["Chenpi_High"]
base_loc = obj.location.copy()

rots = [
    ("a", (1.05, 0.25, 0.65)),
    ("b", (1.20, -0.10, 0.90)),
    ("c", (0.35, 1.35, 0.40)),
    ("d", (0.90, 0.70, 2.40)),
    ("e", (1.10, 0.40, -0.80)),
    ("f", (0.20, 0.15, 3.14)),
]

for name, euler in rots:
    obj.rotation_euler = Euler(euler, "XYZ")
    obj.location = base_loc
    bpy.context.view_layer.update()
    std.render_still(std.PREVIEWS / f"rot_{name}.png", resolution=768, engine="EEVEE", samples=24)
    print("rendered", name, euler)
