"""Step 1-3: build the reusable museum pedestal, camera, lights, background."""

from pathlib import Path
import sys

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))

import display_standard as std  # noqa: E402


def main() -> None:
    std.build_environment()
    std.save_standard_blend()
    std.export_showcase()

    previews = std.PREVIEWS
    previews.mkdir(parents=True, exist_ok=True)

    std.render_still(previews / "01_pedestal.png", resolution=1280, engine="EEVEE", samples=64)

    volume = std.add_preview_volume()
    std.render_still(previews / "02_composition_gap.png", resolution=1280, engine="EEVEE", samples=64)

    bpy = __import__("bpy")
    bpy.data.objects.remove(volume, do_unlink=True)
    std.save_standard_blend()
    print("Environment stage complete.")


if __name__ == "__main__":
    main()
