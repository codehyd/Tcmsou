"""Step 6-10: low poly, bake textures, export chenpi.glb, render thumbnail."""

from pathlib import Path
import sys

import bpy

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))

import display_standard as std  # noqa: E402
import chenpi_model as chenpi  # noqa: E402

CHENPI_BLEND = std.BLEND_DIR / "herbs" / "chenpi" / "chenpi_source.blend"
CHENPI_GLB = std.HERBS_DIR / "chenpi" / "chenpi.glb"
THUMB = std.HERBS_DIR / "chenpi" / "chenpi-thumbnail.png"


def main() -> None:
    bpy.ops.wm.open_mainfile(filepath=str(CHENPI_BLEND))
    bpy.context.scene.camera = bpy.data.objects["Camera"]

    high = bpy.data.objects["Chenpi_High"]
    # New cupped cluster is already posed for the locked camera.

    # Ship the high-poly cage: ~17k tris is cheap for the web, and decimating
    # these thin shells eats the torn rims that carry the silhouette.
    low = chenpi.build_chenpi_low(high, ratio=1.0)
    low.name = "Chenpi"
    low.data.name = "Chenpi"
    maps = chenpi.bake_maps(high, low, size=2048, selected_to_active=False)
    chenpi.assign_baked_material(low, maps)

    chenpi.hide_for_render(high, True)
    low.location = std.HERB_ANCHOR
    chenpi.hide_for_render(low, False)

    bpy.ops.wm.save_as_mainfile(filepath=str(CHENPI_BLEND))

    std.render_still(std.PREVIEWS / "04_chenpi_low.png", resolution=1280, engine="EEVEE", samples=64)
    std.render_still(THUMB, resolution=1024, engine="EEVEE", samples=64)

    old_loc = low.location.copy()
    low.location = (0.0, 0.0, 0.0)
    bpy.ops.object.select_all(action="DESELECT")
    low.select_set(True)
    bpy.context.view_layer.objects.active = low
    std.export_selected_glb(CHENPI_GLB)
    low.location = old_loc

    bpy.ops.wm.save_as_mainfile(filepath=str(CHENPI_BLEND))
    print("Web stage complete")
    print("GLB", CHENPI_GLB, "exists", CHENPI_GLB.exists(), "size", CHENPI_GLB.stat().st_size if CHENPI_GLB.exists() else 0)
    print("Thumb", THUMB, THUMB.exists())


if __name__ == "__main__":
    main()
