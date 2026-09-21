import shutil
from pathlib import Path
import bpy
import sys

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
import display_standard as std

src = std.PREVIEWS / "04_chenpi_low.png"
thumb = std.HERBS_DIR / "chenpi" / "chenpi-thumbnail.png"
try:
    shutil.copyfile(src, thumb)
    print("Copied thumbnail")
except Exception as e:
    alt = std.HERBS_DIR / "chenpi" / "chenpi-thumbnail-new.png"
    shutil.copyfile(src, alt)
    print("Thumbnail locked, wrote", alt, e)

bpy.ops.wm.open_mainfile(filepath=str(std.BLEND_DIR / "herbs" / "chenpi" / "chenpi_source.blend"))
target = bpy.data.objects.get("Chenpi") or bpy.data.objects.get("Chenpi_Low")
print("export", target.name if target else None)
if target:
    target.name = "Chenpi"
    target.data.name = "Chenpi"
    old = target.location.copy()
    target.location = (0.0, 0.0, 0.0)
    bpy.ops.object.select_all(action="DESELECT")
    target.select_set(True)
    bpy.context.view_layer.objects.active = target
    std.export_selected_glb(std.HERBS_DIR / "chenpi" / "chenpi.glb")
    target.location = old
    bpy.ops.wm.save_as_mainfile(filepath=str(std.BLEND_DIR / "herbs" / "chenpi" / "chenpi_source.blend"))
