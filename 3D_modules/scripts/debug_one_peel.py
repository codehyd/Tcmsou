import math
import sys
from pathlib import Path
from mathutils import Vector, noise
import bpy
import bmesh

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
import display_standard as std
import chenpi_model as cm


def bbox_mesh(me, label):
    xs = [v.co.x for v in me.vertices]
    ys = [v.co.y for v in me.vertices]
    zs = [v.co.z for v in me.vertices]
    print(label, "size", round(max(xs)-min(xs), 5), round(max(ys)-min(ys), 5), round(max(zs)-min(zs), 5),
          "zrange", round(min(zs), 5), round(max(zs), 5), "n", len(me.vertices))


def bbox_obj(obj, label):
    print(label, "loc", tuple(round(x,4) for x in obj.location),
          "scale", tuple(round(x,4) for x in obj.scale),
          "rot", tuple(round(x,4) for x in obj.rotation_euler),
          "dims", tuple(round(x,4) for x in obj.dimensions))
    bbox_mesh(obj.data, label + "-local")


std.reset_scene()
spec = cm.PEEL_SPECS[0]
print("SPEC", spec)
bm = cm._build_peel_bmesh(spec)
xs = [v.co.x for v in bm.verts]
ys = [v.co.y for v in bm.verts]
zs = [v.co.z for v in bm.verts]
print("bmesh size", max(xs)-min(xs), max(ys)-min(ys), max(zs)-min(zs), "verts", len(bm.verts))
bm.free()

obj = cm.create_peel_object(spec, (cm.make_outer_material(), cm.make_inner_material(), cm.make_rim_material()))
bbox_obj(obj, "after create")
print("modifiers", [m.name + ":" + m.type for m in obj.modifiers])
cm.apply_object_modifiers(obj)
bbox_obj(obj, "after solidify apply")
