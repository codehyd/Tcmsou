"""Step 4-5: build chenpi high poly in the confirmed display environment."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))

import display_standard as std  # noqa: E402
import chenpi_model as chenpi  # noqa: E402

CHENPI_BLEND = std.BLEND_DIR / "herbs" / "chenpi" / "chenpi_source.blend"


def render_with_temp_camera(filepath: Path, location, target) -> None:
    scene = bpy.context.scene
    official = scene.camera
    cam_data = bpy.data.cameras.new("_QA_Cam")
    cam_data.lens = std.CAMERA_LENS_MM
    cam_data.sensor_width = std.CAMERA_SENSOR_MM
    cam = bpy.data.objects.new("_QA_Cam", cam_data)
    cam.location = location
    bpy.context.scene.collection.objects.link(cam)
    empty = bpy.data.objects.new("_QA_Target", None)
    empty.location = target
    bpy.context.scene.collection.objects.link(empty)
    std.look_at(cam, empty)
    scene.camera = cam
    bpy.context.view_layer.update()
    std.render_still(filepath, resolution=1280, engine="EEVEE", samples=48)
    scene.camera = official
    bpy.data.objects.remove(cam, do_unlink=True)
    bpy.data.objects.remove(empty, do_unlink=True)
    bpy.data.cameras.remove(cam_data)


def main() -> None:
    std.open_standard_blend()
    high = chenpi.build_chenpi_high()
    CHENPI_BLEND.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(CHENPI_BLEND))

    out = std.PREVIEWS
    out.mkdir(parents=True, exist_ok=True)
    std.render_still(out / "03_chenpi_form_front.png", resolution=1280, engine="EEVEE", samples=64)

    render_with_temp_camera(
        out / "03_chenpi_form_side.png",
        location=(0.58, 0.0, 0.16),
        target=std.HERB_ANCHOR,
    )
    render_with_temp_camera(
        out / "03_chenpi_form_top.png",
        location=(0.0, 0.0, 0.42),
        target=std.HERB_ANCHOR,
    )
    render_with_temp_camera(
        out / "03_chenpi_form_close.png",
        location=(0.18, -0.18, 0.20),
        target=Vector(std.HERB_ANCHOR),
    )
    bpy.ops.wm.save_as_mainfile(filepath=str(CHENPI_BLEND))
    print("High poly stage complete:", high.name)


if __name__ == "__main__":
    main()
