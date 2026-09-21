import bpy
from pathlib import Path
import sys

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
import display_standard as std

bpy.ops.wm.open_mainfile(filepath=str(std.BLEND_DIR / "herbs" / "chenpi" / "chenpi_source.blend"))

print("objects:")
for o in bpy.data.objects:
    if o.type == "MESH":
        mats = [m.name if m else None for m in o.data.materials]
        print(o.name, o.data.name, "loc", tuple(round(x,4) for x in o.location), "dims", tuple(round(x,4) for x in o.dimensions), mats)

target = bpy.data.objects.get("Chenpi_Low")
print("export target", target.name if target else None, target.data.name if target else None)
if target:
    target.name = "Chenpi"
    target.data.name = "Chenpi"
    high = bpy.data.objects.get("Chenpi_High")
    if high is not None:
        high["chenpi_presented"] = 1
    old = target.location.copy()
    target.location = (0.0, 0.0, 0.0)
    bpy.ops.object.select_all(action="DESELECT")
    target.select_set(True)
    bpy.context.view_layer.objects.active = target
    std.export_selected_glb(std.HERBS_DIR / "chenpi" / "chenpi.glb")
    target.location = old
    bpy.ops.wm.save_as_mainfile(filepath=str(std.BLEND_DIR / "herbs" / "chenpi" / "chenpi_source.blend"))
    print("done")
