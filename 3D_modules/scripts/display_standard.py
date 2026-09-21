"""Reusable museum-collection display standard for TCM herb assets.

Blender Z-up, meters. glTF export converts to Y-up for the web app.
Do not change camera, lights, or pedestal after they are confirmed.
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector


SCRIPTS_DIR = Path(__file__).resolve().parent
ROOT = SCRIPTS_DIR.parent
BLEND_DIR = ROOT / "blender"
PREVIEWS = ROOT / "previews"
SHOWCASE_DIR = ROOT / "showcase"
HERBS_DIR = ROOT / "herbs"

STANDARD_BLEND = BLEND_DIR / "herb_display_standard.blend"
STANDARD_JSON = ROOT / "display-standard.json"
SHOWCASE_GLB = SHOWCASE_DIR / "showcase.glb"

# --- Confirmed spatial standard (meters) ---
PEDESTAL_HEIGHT = 0.032
PEDESTAL_RADIUS = 0.126
FLOAT_GAP = 0.088
HERB_ANCHOR = (0.0, 0.0, 0.156)

# 3/4 view, pulled back so the herb is fully in frame and the pedestal stays subordinate.
CAMERA_LOCATION = (0.46, -0.46, 0.30)
CAMERA_TARGET = (0.0, 0.0, 0.108)
CAMERA_LENS_MM = 85.0
CAMERA_SENSOR_MM = 36.0

# Warm key / cool fill / warm rim — museum vitrine, not sci-fi.
# Energies are tuned for Blender 5 EEVEE; dark materials must stay dark.
KEY_LOCATION = (0.46, -0.22, 0.48)
FILL_LOCATION = (-0.40, -0.50, 0.13)
RIM_LOCATION = (-0.18, 0.52, 0.36)
LIGHT_TARGET = (0.0, 0.0, 0.12)


def ensure_dirs() -> None:
    for path in (
        BLEND_DIR,
        PREVIEWS,
        SHOWCASE_DIR,
        HERBS_DIR,
        BLEND_DIR / "herbs" / "chenpi",
        HERBS_DIR / "chenpi",
        BLEND_DIR / "herbs" / "chenpi" / "textures",
    ):
        path.mkdir(parents=True, exist_ok=True)


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if bpy.context.scene is None:
        bpy.ops.scene.new(type="NEW")


def collection(name: str) -> bpy.types.Collection:
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col


def link_exclusive(obj: bpy.types.Object, col: bpy.types.Collection) -> None:
    if obj.name not in col.objects:
        col.objects.link(obj)
    if obj.name in bpy.context.scene.collection.objects and col is not bpy.context.scene.collection:
        bpy.context.scene.collection.objects.unlink(obj)


def set_input(node, name: str, value) -> None:
    if name in node.inputs:
        node.inputs[name].default_value = value


def make_material(name: str, **principled) -> bpy.types.Material:
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (360, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    for key, value in principled.items():
        socket = key.replace("_", " ")
        # Common Blender 4/5 names
        aliases = {
            "Base Color": ["Base Color"],
            "Metallic": ["Metallic"],
            "Roughness": ["Roughness"],
            "Specular IOR Level": ["Specular IOR Level", "Specular"],
            "IOR": ["IOR"],
            "Coat Weight": ["Coat Weight", "Clearcoat"],
            "Coat Roughness": ["Coat Roughness", "Clearcoat Roughness"],
            "Emission Color": ["Emission Color", "Emission"],
            "Emission Strength": ["Emission Strength"],
        }
        names = aliases.get(socket, [socket, key])
        for n in names:
            if n in bsdf.inputs:
                bsdf.inputs[n].default_value = value
                break
    return mat


def smooth_obj(obj: bpy.types.Object, angle_deg: float = 35.0) -> None:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    mesh = obj.data
    if hasattr(mesh, "use_auto_smooth"):
        mesh.use_auto_smooth = True
        mesh.auto_smooth_angle = math.radians(angle_deg)
    else:
        try:
            bpy.ops.object.shade_auto_smooth(angle=math.radians(angle_deg))
        except Exception:
            pass
    obj.select_set(False)


def look_at(obj: bpy.types.Object, target: bpy.types.Object) -> None:
    con = obj.constraints.get("TrackTo") or obj.constraints.new(type="TRACK_TO")
    con.name = "TrackTo"
    con.target = target
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"


def new_empty(name: str, location, col: bpy.types.Collection) -> bpy.types.Object:
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_type = "PLAIN_AXES"
    empty.empty_display_size = 0.04
    empty.location = location
    link_exclusive(empty, col)
    return empty


def lathe_profile(name: str, profile_xz, steps: int = 96) -> bpy.types.Object:
    """profile_xz: list of (radius, height). Closed solid by spinning around Z."""
    bm = bmesh.new()
    verts = [bm.verts.new((r, 0.0, z)) for r, z in profile_xz]
    for i in range(len(verts) - 1):
        bm.edges.new((verts[i], verts[i + 1]))
    geom = list(bm.verts) + list(bm.edges)
    bmesh.ops.spin(
        bm,
        geom=geom,
        cent=(0.0, 0.0, 0.0),
        axis=(0.0, 0.0, 1.0),
        angle=math.radians(360.0),
        steps=steps,
        use_duplicate=False,
    )
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def build_pedestal(col: bpy.types.Collection) -> bpy.types.Object:
    """Low museum / collection puck. Not a table, not a lectern."""
    body_profile = [
        (0.000, 0.000),
        (0.118, 0.000),
        (0.126, 0.0035),
        (0.126, 0.0155),
        (0.112, 0.0190),
        (0.096, 0.0190),
        (0.093, 0.0275),
        (0.078, 0.0305),
        (0.000, 0.0305),
    ]
    body = lathe_profile("Display_Pedestal_Body", body_profile, steps=96)

    ring_profile = [
        (0.082, 0.0306),
        (0.094, 0.0306),
        (0.094, 0.0332),
        (0.082, 0.0332),
        (0.082, 0.0306),
    ]
    ring = lathe_profile("Display_Pedestal_Ring", ring_profile, steps=96)

    stone = make_material(
        "Pedestal_Stone",
        Base_Color=(0.045, 0.042, 0.048, 1.0),
        Metallic=0.18,
        Roughness=0.42,
        Specular_IOR_Level=0.32,
        Coat_Weight=0.03,
        Coat_Roughness=0.40,
    )
    brass = make_material(
        "Pedestal_Brass",
        Base_Color=(0.38, 0.24, 0.11, 1.0),
        Metallic=1.0,
        Roughness=0.32,
        Specular_IOR_Level=0.5,
        Coat_Weight=0.06,
        Coat_Roughness=0.28,
    )
    body.data.materials.append(stone)
    ring.data.materials.append(brass)

    bpy.context.view_layer.objects.active = body
    body.select_set(True)
    ring.select_set(True)
    bpy.ops.object.join()
    pedestal = bpy.context.active_object
    pedestal.name = "Display_Pedestal"
    pedestal.data.name = "Display_Pedestal"
    smooth_obj(pedestal, 40.0)
    pedestal.location = (0.0, 0.0, 0.0)
    link_exclusive(pedestal, col)
    return pedestal


def build_background(col: bpy.types.Collection) -> bpy.types.Object:
    """Dark studio cyc. A small bright floor disc would read as a table — avoid that."""
    bm = bmesh.new()
    floor = 4.0
    v0 = bm.verts.new((-floor, -floor, -0.0012))
    v1 = bm.verts.new((floor, -floor, -0.0012))
    v2 = bm.verts.new((floor, floor, -0.0012))
    v3 = bm.verts.new((-floor, floor, -0.0012))
    bm.faces.new((v0, v1, v2, v3))
    back_y = 1.6
    w, h = 6.0, 3.2
    b0 = bm.verts.new((-w * 0.5, back_y, -0.0012))
    b1 = bm.verts.new((w * 0.5, back_y, -0.0012))
    b2 = bm.verts.new((w * 0.5, back_y, h))
    b3 = bm.verts.new((-w * 0.5, back_y, h))
    bm.faces.new((b0, b1, b2, b3))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    mesh = bpy.data.meshes.new("Background")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Background", mesh)
    bpy.context.scene.collection.objects.link(obj)
    mat = make_material(
        "Background_Matte",
        Base_Color=(0.009, 0.0085, 0.0095, 1.0),
        Metallic=0.0,
        Roughness=0.96,
        Specular_IOR_Level=0.08,
    )
    obj.data.materials.append(mat)
    link_exclusive(obj, col)
    return obj


def add_area_light(name, location, energy, color, size, col, target) -> bpy.types.Object:
    light_data = bpy.data.lights.new(name=name, type="AREA")
    light_data.shape = "DISK"
    light_data.size = size
    light_data.energy = energy
    light_data.color = color
    light_data.diffuse_factor = 1.0
    light_data.specular_factor = 1.0
    obj = bpy.data.objects.new(name, light_data)
    obj.location = location
    bpy.context.scene.collection.objects.link(obj)
    link_exclusive(obj, col)
    look_at(obj, target)
    return obj


def build_camera_and_lights(col: bpy.types.Collection):
    target = new_empty("Look_Target", CAMERA_TARGET, col)

    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = CAMERA_LENS_MM
    cam_data.sensor_width = CAMERA_SENSOR_MM
    cam_data.clip_start = 0.02
    cam_data.clip_end = 20.0
    cam_data.dof.use_dof = False
    cam = bpy.data.objects.new("Camera", cam_data)
    cam.location = CAMERA_LOCATION
    bpy.context.scene.collection.objects.link(cam)
    link_exclusive(cam, col)
    look_at(cam, target)
    bpy.context.scene.camera = cam

    herb_anchor = new_empty("Herb_Anchor", HERB_ANCHOR, col)

    key = add_area_light(
        "Key_Light",
        KEY_LOCATION,
        energy=18.0,
        color=(1.0, 0.92, 0.82),
        size=0.32,
        col=col,
        target=target,
    )
    fill = add_area_light(
        "Fill_Light",
        FILL_LOCATION,
        energy=4.5,
        color=(0.70, 0.78, 0.94),
        size=0.50,
        col=col,
        target=target,
    )
    rim = add_area_light(
        "Rim_Light",
        RIM_LOCATION,
        energy=7.5,
        color=(1.0, 0.88, 0.76),
        size=0.24,
        col=col,
        target=target,
    )

    world = bpy.data.worlds.new("MuseumWorld")
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (0.006, 0.0055, 0.005, 1.0)
    bg.inputs["Strength"].default_value = 0.08
    out = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
    bpy.context.scene.world = world

    return {
        "camera": cam,
        "target": target,
        "herb_anchor": herb_anchor,
        "key": key,
        "fill": fill,
        "rim": rim,
    }


def configure_color_management() -> None:
    scene = bpy.context.scene
    scene.view_settings.view_transform = "AgX"
    try:
        scene.view_settings.look = "None"
    except TypeError:
        pass
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0
    scene.display_settings.display_device = "sRGB"


def available_engines():
    try:
        return list(bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items.keys())
    except Exception:
        return []


def set_render_engine(prefer: str = "EEVEE") -> str:
    engines = available_engines()
    print("Available render engines:", engines)
    scene = bpy.context.scene
    if prefer.upper() == "CYCLES" and "CYCLES" in engines:
        scene.render.engine = "CYCLES"
        return "CYCLES"
    for name in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "EEVEE"):
        if name in engines:
            scene.render.engine = name
            return name
    if "CYCLES" in engines:
        scene.render.engine = "CYCLES"
        return "CYCLES"
    if engines:
        scene.render.engine = engines[0]
        return engines[0]
    return scene.render.engine


def enable_cycles_gpu() -> None:
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.samples = 96
    scene.cycles.use_denoising = True
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
    except (KeyError, AttributeError):
        scene.cycles.device = "CPU"
        print("Cycles addon prefs missing; using CPU")
        return
    for dtype in ("OPTIX", "CUDA", "HIP", "ONEAPI"):
        try:
            prefs.compute_device_type = dtype
            prefs.get_devices()
            used = []
            for d in prefs.devices:
                is_cpu = d.type in {"CPU"}
                d.use = not is_cpu
                if d.use:
                    used.append(f"{d.name}({d.type})")
            if used:
                print(f"Cycles GPU via {dtype}: {used}")
                return
        except Exception as exc:
            print(f"Skip {dtype}: {exc}")
    scene.cycles.device = "CPU"
    print("Cycles using CPU")


def setup_render(resolution: int = 1280, engine: str = "EEVEE", samples: int | None = None) -> None:
    scene = bpy.context.scene
    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = False
    configure_color_management()
    chosen = set_render_engine(engine)
    if chosen == "CYCLES":
        enable_cycles_gpu()
        if samples:
            scene.cycles.samples = samples
    else:
        if hasattr(scene, "eevee"):
            if hasattr(scene.eevee, "taa_render_samples"):
                scene.eevee.taa_render_samples = samples or 64
            if hasattr(scene.eevee, "use_raytracing"):
                scene.eevee.use_raytracing = True
    print("Using engine:", chosen)


def render_still(filepath: Path, resolution: int = 1280, engine: str = "EEVEE", samples: int | None = None) -> None:
    bpy.context.view_layer.update()
    setup_render(resolution=resolution, engine=engine, samples=samples)
    bpy.context.scene.render.filepath = str(filepath)
    bpy.ops.render.render(write_still=True)
    print("Wrote", filepath)


def write_standard_json() -> None:
    data = {
        "version": 1,
        "units": "meters",
        "blenderUp": "Z",
        "gltfUp": "Y",
        "pedestal": {
            "object": "Display_Pedestal",
            "height": PEDESTAL_HEIGHT,
            "radius": PEDESTAL_RADIUS,
            "file": "showcase/showcase.glb",
        },
        "herbPlacement": {
            "anchorObject": "Herb_Anchor",
            "positionBlenderZup": list(HERB_ANCHOR),
            "positionThreeYup": [HERB_ANCHOR[0], HERB_ANCHOR[2], -HERB_ANCHOR[1]],
            "floatGap": FLOAT_GAP,
            "note": "Place each herb GLB origin at Herb_Anchor. Do not sit the herb on the pedestal top.",
        },
        "camera": {
            "location": list(CAMERA_LOCATION),
            "target": list(CAMERA_TARGET),
            "focalLengthMm": CAMERA_LENS_MM,
            "sensorMm": CAMERA_SENSOR_MM,
        },
        "lights": ["Key_Light", "Fill_Light", "Rim_Light"],
        "background": "Background",
    }
    STANDARD_JSON.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print("Wrote", STANDARD_JSON)


def export_selected_glb(filepath: Path) -> None:
    filepath.parent.mkdir(parents=True, exist_ok=True)
    kwargs = dict(
        filepath=str(filepath),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_cameras=False,
        export_lights=False,
        export_extras=False,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_animations=False,
        export_skins=False,
    )
    op = bpy.ops.export_scene.gltf
    rna = op.get_rna_type() if hasattr(op, "get_rna_type") else None
    if rna is not None:
        valid = set(p.identifier for p in rna.properties)
        kwargs = {k: v for k, v in kwargs.items() if k in valid}
    bpy.ops.export_scene.gltf(**kwargs)
    print("Exported", filepath)


def export_showcase() -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj = bpy.data.objects["Display_Pedestal"]
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    export_selected_glb(SHOWCASE_GLB)


def add_preview_volume() -> bpy.types.Object:
    """Temporary scale reference occupying the future herb volume."""
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=2,
        radius=0.048,
        location=HERB_ANCHOR,
    )
    obj = bpy.context.active_object
    obj.name = "_Preview_HerbVolume"
    mat = make_material(
        "Preview_HerbVolume",
        Base_Color=(0.72, 0.32, 0.10, 1.0),
        Metallic=0.0,
        Roughness=0.55,
        Emission_Color=(0.72, 0.32, 0.10, 1.0),
        Emission_Strength=0.08,
    )
    if "Alpha" in mat.node_tree.nodes["Principled BSDF"].inputs:
        mat.node_tree.nodes["Principled BSDF"].inputs["Alpha"].default_value = 0.45
        mat.blend_method = "BLEND"
    obj.data.materials.append(mat)
    env = collection("Showcase_Environment")
    link_exclusive(obj, env)
    return obj


def build_environment() -> dict:
    ensure_dirs()
    reset_scene()
    env = collection("Showcase_Environment")
    pedestal = build_pedestal(env)
    background = build_background(env)
    rig = build_camera_and_lights(env)
    write_standard_json()
    return {"pedestal": pedestal, "background": background, **rig}


def save_standard_blend() -> None:
    BLEND_DIR.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(STANDARD_BLEND))
    print("Saved", STANDARD_BLEND)


def open_standard_blend() -> None:
    bpy.ops.wm.open_mainfile(filepath=str(STANDARD_BLEND))
    bpy.context.scene.camera = bpy.data.objects["Camera"]
