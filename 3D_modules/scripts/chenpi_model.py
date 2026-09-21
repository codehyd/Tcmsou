"""Procedural dried tangerine peel (chenpi) for the TCM display standard."""

from __future__ import annotations

import math
import random
from dataclasses import dataclass

import bpy
import bmesh
from mathutils import Vector, noise

import display_standard as std


FRUIT_RADIUS = 0.032  # a ~64 mm tangerine; every peel is a shell off this sphere


@dataclass
class PeelSpec:
    """A peel piece is a torn patch of a sphere, not a flat plate.

    Chenpi is stripped off a whole fruit, so the piece already carries the
    fruit's curvature; drying then shrinks the rim and curls it further inwards.
    `extent` is how much of the sphere the patch spans (polar angle, rad) and
    `curl` is the extra curvature drying adds at the rim (1.0 = plain sphere).
    """

    name: str
    seed: int
    radius: float
    span_u: float       # angular width of the patch (rad) along the fruit
    span_v: float       # angular height of the patch (rad)
    thickness: float
    curl: float
    lobes: int
    lobe_depth: float
    loc: tuple[float, float, float]
    rot: tuple[float, float, float]
    n_u: int = 40
    n_v: int = 30
    calyx: bool = False
    wrinkle: float = 1.0
    rim_wave: float = 0.0   # how much the rim curls unevenly, giving a wavy lip


# A loose pile of curved segments at different attitudes. rot Y near -pi/2 lays
# a patch down pitted-skin-up; near +pi/2 lays it down cup-up, showing the pith.
# Staying within ~0.2 rad of those two poles keeps the pile low and spread out
# instead of standing the shells on edge.
#
# Each piece is a wide, shallow arc: a large `radius` with a small span reads as
# dried peel, whereas a small radius with a span past ~1.8 rad closes into a
# half shell and the group looks like a cracked egg.
#
# Deep cupped pieces heaped on each other, per the reference: wide angular spans
# (past ~1.8 rad) close the patch into a bowl, which is the look wanted here.
# A lower layer of three carries the footprint, two more sit across the gaps.
PEEL_SPECS = [
    PeelSpec("Chenpi_Main", 111, 0.031, 1.90, 1.58, 0.0015, 1.18, 3, 0.09,
             (0.002, -0.004, 0.000), (0.14, 1.42, 0.35), 46, 38,
             calyx=True, wrinkle=1.20, rim_wave=0.09),
    PeelSpec("Chenpi_Secondary", 222, 0.030, 1.78, 1.50, 0.0014, 1.22, 2, 0.10,
             (-0.034, 0.012, 0.0020), (0.20, -1.36, 2.30), 42, 34,
             wrinkle=1.05, rim_wave=0.11),
    PeelSpec("Chenpi_Third", 333, 0.029, 1.82, 1.42, 0.0014, 1.16, 3, 0.11,
             (0.034, 0.014, 0.0035), (-0.18, 1.48, -1.15), 42, 32,
             wrinkle=1.30, rim_wave=0.08),
    PeelSpec("Chenpi_Fourth", 555, 0.027, 1.70, 1.38, 0.0013, 1.20, 3, 0.09,
             (0.012, -0.030, 0.0130), (0.26, -1.30, 1.70), 38, 30,
             wrinkle=1.10, rim_wave=0.10),
    PeelSpec("Chenpi_Small", 444, 0.024, 1.58, 1.30, 0.0012, 1.15, 2, 0.08,
             (-0.014, 0.026, 0.0150), (-0.22, 1.34, 0.90), 34, 28,
             wrinkle=0.95, rim_wave=0.09),
]


def _set(node, name: str, value) -> None:
    if name in node.inputs:
        node.inputs[name].default_value = value


def _link(nt, a, b) -> None:
    nt.links.new(a, b)


def _mix_color(nt, mix, a, b) -> None:
    if "A" in mix.inputs:
        _link(nt, a, mix.inputs["A"])
        _link(nt, b, mix.inputs["B"])
    else:
        _link(nt, a, mix.inputs[6])
        _link(nt, b, mix.inputs[7])


def make_outer_material() -> bpy.types.Material:
    """Dried tangerine flavedo: orange-yellow to orange-brown, irregular oil pits."""
    mat = bpy.data.materials.get("Chenpi_Outer") or bpy.data.materials.new("Chenpi_Outer")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (1280, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (980, 0)
    _set(bsdf, "Metallic", 0.0)
    _set(bsdf, "Roughness", 0.88)
    _set(bsdf, "Specular IOR Level", 0.10)
    _set(bsdf, "Specular", 0.10)
    _set(bsdf, "Coat Weight", 0.0)

    coord = nt.nodes.new("ShaderNodeTexCoord")
    coord.location = (-980, 40)

    # Object coordinates are in metres and a peel is only ~0.05 m across, so every
    # texture scale below is tuned against that, not against a 1 m default cube.
    warp_n = nt.nodes.new("ShaderNodeTexNoise")
    warp_n.location = (-760, 220)
    _set(warp_n, "Scale", 120.0)
    _set(warp_n, "Detail", 4.0)
    _set(warp_n, "Roughness", 0.52)
    _link(nt, coord.outputs["Object"], warp_n.inputs["Vector"])

    warp_scale = nt.nodes.new("ShaderNodeVectorMath")
    warp_scale.location = (-540, 220)
    warp_scale.operation = "SCALE"
    warp_scale.inputs["Scale"].default_value = 0.0006
    _link(nt, warp_n.outputs["Color"], warp_scale.inputs[0])

    warped = nt.nodes.new("ShaderNodeVectorMath")
    warped.location = (-320, 80)
    warped.operation = "ADD"
    _link(nt, coord.outputs["Object"], warped.inputs[0])
    _link(nt, warp_scale.outputs["Vector"], warped.inputs[1])

    glands = nt.nodes.new("ShaderNodeTexVoronoi")
    glands.location = (-80, 240)
    glands.feature = "F1"
    _set(glands, "Scale", 820.0)  # ~1.2 mm cells: coarse pitting as in the photo
    _set(glands, "Randomness", 1.0)
    _link(nt, warped.outputs["Vector"], glands.inputs["Vector"])

    # A second, finer gland layer. Taking the minimum distance of the two mixes
    # large and small pits together so the surface is not a regular dot screen.
    glands2 = nt.nodes.new("ShaderNodeTexVoronoi")
    glands2.location = (-80, 700)
    glands2.feature = "F1"
    _set(glands2, "Scale", 1700.0)
    _set(glands2, "Randomness", 1.0)
    _link(nt, warped.outputs["Vector"], glands2.inputs["Vector"])

    gland_mix = nt.nodes.new("ShaderNodeMath")
    gland_mix.location = (100, 700)
    gland_mix.operation = "MINIMUM"
    _link(nt, glands.outputs["Distance"], gland_mix.inputs[0])
    _link(nt, glands2.outputs["Distance"], gland_mix.inputs[1])

    # Reticulation: the raised net of ridges between shallow basins that gives
    # dried peel its crazed look. Voronoi edge distance draws exactly that mesh.
    net = nt.nodes.new("ShaderNodeTexVoronoi")
    net.location = (-80, 980)
    net.feature = "DISTANCE_TO_EDGE"
    _set(net, "Scale", 680.0)  # ~1.5 mm cells; coarser reads as cracked mud
    _set(net, "Randomness", 1.0)
    _link(nt, warped.outputs["Vector"], net.inputs["Vector"])

    net_r = nt.nodes.new("ShaderNodeValToRGB")
    net_r.location = (140, 980)
    # Narrow band: only the sliver next to a cell border darkens, so the result
    # is a line network rather than blotchy cells.
    net_r.color_ramp.elements[0].position = 0.0
    net_r.color_ramp.elements[0].color = (0.66, 0.66, 0.66, 1)
    net_r.color_ramp.elements[1].position = 0.07
    net_r.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1)
    _link(nt, net.outputs["Distance"], net_r.inputs["Fac"])

    blotch = nt.nodes.new("ShaderNodeTexNoise")
    blotch.location = (-80, -40)
    _set(blotch, "Scale", 26.0)
    _set(blotch, "Detail", 6.0)
    _set(blotch, "Roughness", 0.52)
    _link(nt, coord.outputs["Object"], blotch.inputs["Vector"])

    grain = nt.nodes.new("ShaderNodeTexNoise")
    grain.location = (-80, -280)
    _set(grain, "Scale", 420.0)
    _set(grain, "Detail", 5.0)
    _set(grain, "Roughness", 0.55)
    _link(nt, warped.outputs["Vector"], grain.inputs["Vector"])

    age = nt.nodes.new("ShaderNodeValToRGB")
    age.location = (180, -20)
    # Reference is a rust / red-brown, not orange: keep green well under half of
    # red and leave a little blue in so it never reads as saturated citrus.
    age.color_ramp.elements[0].position = 0.22
    # These values are baked into the GLB albedo and viewed under neutral web
    # lighting, not the pedestal's key light — tuned dark against the key light
    # they come out near-black in a browser.
    age.color_ramp.elements[0].color = (0.0460, 0.0170, 0.0042, 1)
    age.color_ramp.elements[1].position = 0.80
    age.color_ramp.elements[1].color = (0.3000, 0.1350, 0.0320, 1)
    mid = age.color_ramp.elements.new(0.50)
    mid.color = (0.1250, 0.0530, 0.0125, 1)
    _link(nt, blotch.outputs["Fac"], age.inputs["Fac"])

    gland_dark = nt.nodes.new("ShaderNodeValToRGB")
    gland_dark.location = (180, 240)
    gland_dark.color_ramp.elements[0].position = 0.10
    gland_dark.color_ramp.elements[0].color = (0.0400, 0.0155, 0.0050, 1)
    gland_dark.color_ramp.elements[1].position = 0.55
    gland_dark.color_ramp.elements[1].color = (0.2050, 0.0930, 0.0300, 1)
    _link(nt, gland_mix.outputs["Value"], gland_dark.inputs["Fac"])

    # Uniform pitting reads as a printed dot screen. Vary how strongly the pits
    # show across the surface so some patches are worn smooth and others coarse.
    pit_mask = nt.nodes.new("ShaderNodeTexNoise")
    pit_mask.location = (-80, 460)
    _set(pit_mask, "Scale", 85.0)
    _set(pit_mask, "Detail", 3.0)
    _set(pit_mask, "Roughness", 0.60)
    _link(nt, coord.outputs["Object"], pit_mask.inputs["Vector"])

    pit_amt = nt.nodes.new("ShaderNodeMath")
    pit_amt.location = (180, 460)
    pit_amt.operation = "MULTIPLY_ADD"
    _link(nt, pit_mask.outputs["Fac"], pit_amt.inputs[0])
    # Keep the colour contribution low: an oil gland is a dent that catches
    # shadow, not a dark dot. Most of its read should come from bump_g below.
    pit_amt.inputs[1].default_value = 0.34
    pit_amt.inputs[2].default_value = 0.06

    mix = nt.nodes.new("ShaderNodeMix")
    mix.location = (460, 80)
    mix.data_type = "RGBA"
    mix.blend_type = "MIX"
    _link(nt, pit_amt.outputs["Value"], mix.inputs["Factor"])
    _mix_color(nt, mix, age.outputs["Color"], gland_dark.outputs["Color"])
    color_out = mix.outputs.get("Result") or mix.outputs[0]

    hsv = nt.nodes.new("ShaderNodeHueSaturation")
    hsv.location = (700, 80)
    # Pushing brightness up without pulling saturation back turns the skin pink.
    # AgX pulls a lot of chroma out of warm tones; under-saturating here is what
    # left the skin looking salmon rather than the reference's golden amber.
    _set(hsv, "Saturation", 1.05)
    _set(hsv, "Value", 0.90)
    _link(nt, color_out, hsv.inputs["Color"])

    bump_g = nt.nodes.new("ShaderNodeBump")
    bump_g.location = (460, -220)
    bump_g.invert = True
    _set(bump_g, "Strength", 0.95)
    _set(bump_g, "Distance", 0.00034)
    _link(nt, gland_mix.outputs["Value"], bump_g.inputs["Height"])

    bump_net = nt.nodes.new("ShaderNodeBump")
    bump_net.location = (580, -220)
    _set(bump_net, "Strength", 0.35)
    _set(bump_net, "Distance", 0.00022)
    _link(nt, net.outputs["Distance"], bump_net.inputs["Height"])
    _link(nt, bump_g.outputs["Normal"], bump_net.inputs["Normal"])

    bump_n = nt.nodes.new("ShaderNodeBump")
    bump_n.location = (700, -220)
    _set(bump_n, "Strength", 0.16)
    _set(bump_n, "Distance", 0.00006)
    _link(nt, grain.outputs["Fac"], bump_n.inputs["Height"])
    _link(nt, bump_net.outputs["Normal"], bump_n.inputs["Normal"])

    rough = nt.nodes.new("ShaderNodeMath")
    rough.location = (460, -400)
    rough.operation = "MULTIPLY_ADD"
    _link(nt, blotch.outputs["Fac"], rough.inputs[0])
    rough.inputs[1].default_value = 0.07
    rough.inputs[2].default_value = 0.84

    # Broad aging patina: whole regions of a real slab go near-black brown.
    patina_n = nt.nodes.new("ShaderNodeTexNoise")
    patina_n.location = (460, 420)
    _set(patina_n, "Scale", 17.0)
    _set(patina_n, "Detail", 4.0)
    _set(patina_n, "Roughness", 0.62)
    _link(nt, coord.outputs["Object"], patina_n.inputs["Vector"])

    patina_r = nt.nodes.new("ShaderNodeValToRGB")
    patina_r.location = (700, 420)
    patina_r.color_ramp.elements[0].position = 0.30
    patina_r.color_ramp.elements[0].color = (0.52, 0.52, 0.52, 1)
    patina_r.color_ramp.elements[1].position = 0.72
    patina_r.color_ramp.elements[1].color = (1.12, 1.12, 1.12, 1)
    _link(nt, patina_n.outputs["Fac"], patina_r.inputs["Fac"])

    patina = nt.nodes.new("ShaderNodeMix")
    patina.location = (860, 220)
    patina.data_type = "RGBA"
    patina.blend_type = "MULTIPLY"
    _set(patina, "Factor", 1.0)
    _mix_color(nt, patina, hsv.outputs["Color"], patina_r.outputs["Color"])
    patina_out = patina.outputs.get("Result") or patina.outputs[0]

    net_col = nt.nodes.new("ShaderNodeMix")
    net_col.location = (860, 420)
    net_col.data_type = "RGBA"
    net_col.blend_type = "MULTIPLY"
    _set(net_col, "Factor", 1.0)
    _mix_color(nt, net_col, patina_out, net_r.outputs["Color"])
    net_out = net_col.outputs.get("Result") or net_col.outputs[0]

    _link(nt, net_out, bsdf.inputs["Base Color"])
    _link(nt, rough.outputs["Value"], bsdf.inputs["Roughness"])
    _link(nt, bump_n.outputs["Normal"], bsdf.inputs["Normal"])
    _link(nt, bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def make_inner_material() -> bpy.types.Material:
    """Thin dried pith lining: pale cream, fine fibers. Not foam or flesh."""
    mat = bpy.data.materials.get("Chenpi_Inner") or bpy.data.materials.new("Chenpi_Inner")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (860, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (600, 0)
    _set(bsdf, "Metallic", 0.0)
    _set(bsdf, "Roughness", 0.93)
    _set(bsdf, "Specular IOR Level", 0.05)
    _set(bsdf, "Specular", 0.05)
    _set(bsdf, "Coat Weight", 0.0)

    coord = nt.nodes.new("ShaderNodeTexCoord")
    coord.location = (-640, 0)
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.location = (-440, 0)
    mapping.inputs["Scale"].default_value = (2.1, 0.85, 1.0)
    _link(nt, coord.outputs["Object"], mapping.inputs["Vector"])

    # Pith is spongy and stringy, not felt. A single fine noise gives an even
    # grey speckle; the coarse stretched layer below supplies the vascular
    # fibres that actually identify the inner face.
    fib_map = nt.nodes.new("ShaderNodeMapping")
    fib_map.location = (-440, 300)
    fib_map.inputs["Scale"].default_value = (0.8, 20.0, 20.0)
    _link(nt, coord.outputs["Object"], fib_map.inputs["Vector"])

    fibre = nt.nodes.new("ShaderNodeTexNoise")
    fibre.location = (-200, 300)
    _set(fibre, "Scale", 60.0)
    _set(fibre, "Detail", 7.0)
    _set(fibre, "Roughness", 0.65)
    _link(nt, fib_map.outputs["Vector"], fibre.inputs["Vector"])

    ntex = nt.nodes.new("ShaderNodeTexNoise")
    ntex.location = (-200, 40)
    _set(ntex, "Scale", 550.0)  # metre-scale coords: fine pith grain, not blobs
    _set(ntex, "Detail", 8.0)
    _set(ntex, "Roughness", 0.58)
    _link(nt, mapping.outputs["Vector"], ntex.inputs["Vector"])

    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.location = (80, 40)
    # Warm ivory, the colour of dried pith. Desaturating this far enough to tame
    # it under the key light is what turned it grey and stopped reading as peel.
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = (0.118, 0.084, 0.046, 1)
    ramp.color_ramp.elements[1].position = 0.68
    ramp.color_ramp.elements[1].color = (0.365, 0.272, 0.158, 1)
    _link(nt, fibre.outputs["Fac"], ramp.inputs["Fac"])

    # Patches where the pith has aged towards tan, so it is never a flat tone.
    stain_n = nt.nodes.new("ShaderNodeTexNoise")
    stain_n.location = (-200, -140)
    _set(stain_n, "Scale", 95.0)
    _set(stain_n, "Detail", 5.0)
    _set(stain_n, "Roughness", 0.60)
    _link(nt, coord.outputs["Object"], stain_n.inputs["Vector"])

    stain_r = nt.nodes.new("ShaderNodeValToRGB")
    stain_r.location = (80, -140)
    stain_r.color_ramp.elements[0].position = 0.34
    stain_r.color_ramp.elements[0].color = (0.50, 0.43, 0.34, 1)
    stain_r.color_ramp.elements[1].position = 0.70
    stain_r.color_ramp.elements[1].color = (1.08, 1.08, 1.08, 1)
    _link(nt, stain_n.outputs["Fac"], stain_r.inputs["Fac"])

    stain = nt.nodes.new("ShaderNodeMix")
    stain.location = (340, -100)
    stain.data_type = "RGBA"
    stain.blend_type = "MULTIPLY"
    _set(stain, "Factor", 1.0)
    _mix_color(nt, stain, ramp.outputs["Color"], stain_r.outputs["Color"])
    stain_out = stain.outputs.get("Result") or stain.outputs[0]

    # The vein network is the clearest feature of the inner face in the
    # reference — coarser and more contrasty than the reticulation outside.
    veins = nt.nodes.new("ShaderNodeTexVoronoi")
    veins.location = (-200, 520)
    veins.feature = "DISTANCE_TO_EDGE"
    _set(veins, "Scale", 280.0)  # ~3.5 mm cells: finer than this and the net
    # vanishes at normal viewing distance, which is what made the pith read flat
    _set(veins, "Randomness", 1.0)
    _link(nt, coord.outputs["Object"], veins.inputs["Vector"])

    vein_r = nt.nodes.new("ShaderNodeValToRGB")
    vein_r.location = (80, 520)
    vein_r.color_ramp.elements[0].position = 0.0
    vein_r.color_ramp.elements[0].color = (0.40, 0.34, 0.26, 1)
    vein_r.color_ramp.elements[1].position = 0.15
    vein_r.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1)
    _link(nt, veins.outputs["Distance"], vein_r.inputs["Fac"])

    vein_col = nt.nodes.new("ShaderNodeMix")
    vein_col.location = (340, 240)
    vein_col.data_type = "RGBA"
    vein_col.blend_type = "MULTIPLY"
    _set(vein_col, "Factor", 1.0)
    _mix_color(nt, vein_col, stain_out, vein_r.outputs["Color"])
    stain_out = vein_col.outputs.get("Result") or vein_col.outputs[0]

    hsv = nt.nodes.new("ShaderNodeHueSaturation")
    hsv.location = (460, 40)
    _set(hsv, "Saturation", 1.15)
    _set(hsv, "Value", 0.78)
    _link(nt, stain_out, hsv.inputs["Color"])

    bump_f = nt.nodes.new("ShaderNodeBump")
    bump_f.location = (80, -340)
    _set(bump_f, "Strength", 0.55)
    _set(bump_f, "Distance", 0.00035)
    _link(nt, fibre.outputs["Fac"], bump_f.inputs["Height"])

    bump_v = nt.nodes.new("ShaderNodeBump")
    bump_v.location = (220, -340)
    _set(bump_v, "Strength", 0.85)
    _set(bump_v, "Distance", 0.00060)
    _link(nt, veins.outputs["Distance"], bump_v.inputs["Height"])
    _link(nt, bump_f.outputs["Normal"], bump_v.inputs["Normal"])

    bump = nt.nodes.new("ShaderNodeBump")
    bump.location = (340, -340)
    _set(bump, "Strength", 0.45)
    _set(bump, "Distance", 0.00010)
    _link(nt, ntex.outputs["Fac"], bump.inputs["Height"])
    _link(nt, bump_v.outputs["Normal"], bump.inputs["Normal"])

    _link(nt, hsv.outputs["Color"], bsdf.inputs["Base Color"])
    _link(nt, bump.outputs["Normal"], bsdf.inputs["Normal"])
    _link(nt, bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def make_rim_material() -> bpy.types.Material:
    """Thin peel cross-section: mostly orange-brown, not a cream frame."""
    mat = bpy.data.materials.get("Chenpi_Rim") or bpy.data.materials.new("Chenpi_Rim")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (500, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (260, 0)
    _set(bsdf, "Metallic", 0.0)
    _set(bsdf, "Roughness", 0.92)
    _set(bsdf, "Specular IOR Level", 0.10)
    _set(bsdf, "Specular", 0.10)

    # A flat colour here turns every torn edge into a smooth band of piping,
    # which is the most artificial thing on the model. Break it up.
    coord = nt.nodes.new("ShaderNodeTexCoord")
    coord.location = (-440, 0)

    ntex = nt.nodes.new("ShaderNodeTexNoise")
    ntex.location = (-240, 0)
    _set(ntex, "Scale", 620.0)
    _set(ntex, "Detail", 6.0)
    _set(ntex, "Roughness", 0.60)
    _link(nt, coord.outputs["Object"], ntex.inputs["Vector"])

    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.location = (-20, 0)
    ramp.color_ramp.elements[0].position = 0.30
    ramp.color_ramp.elements[0].color = (0.0180, 0.0072, 0.0028, 1)
    ramp.color_ramp.elements[1].position = 0.72
    ramp.color_ramp.elements[1].color = (0.0620, 0.0290, 0.0130, 1)
    _link(nt, ntex.outputs["Fac"], ramp.inputs["Fac"])

    bump = nt.nodes.new("ShaderNodeBump")
    bump.location = (-20, -240)
    _set(bump, "Strength", 0.50)
    _set(bump, "Distance", 0.00018)
    _link(nt, ntex.outputs["Fac"], bump.inputs["Height"])

    _link(nt, ramp.outputs["Color"], bsdf.inputs["Base Color"])
    _link(nt, bump.outputs["Normal"], bsdf.inputs["Normal"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def _irregular_radius(theta: float, spec: PeelSpec) -> float:
    """How far the patch reaches at this azimuth, as a fraction of `extent`.

    A peel torn off a fruit splits into a few broad tongues separated by deeper
    tears, so the boundary is lobed and uneven rather than a clean circle.
    """
    seed = float(spec.seed)
    phase = seed * 0.37
    lobe = 0.5 + 0.5 * math.cos(spec.lobes * theta + phase)
    r = 1.0 - spec.lobe_depth * lobe

    nse = noise.noise(Vector((math.cos(theta) * 2.2, math.sin(theta) * 2.2, seed * 0.05)))
    jag = noise.noise(Vector((math.cos(theta) * 5.5, math.sin(theta) * 5.5, seed * 0.11)))
    jag2 = noise.noise(Vector((math.cos(theta) * 11.0, math.sin(theta) * 11.0, seed * 0.19)))
    r *= 1.0 + 0.11 * nse + 0.055 * jag + 0.024 * jag2

    # Tear bites. On a deep bowl these cut all the way down the wall, so keep
    # them shallow or the lip turns into a row of sharp teeth.
    for k, (amp, width) in enumerate(((0.085, 0.075), (0.050, 0.045))):
        ang = (seed * (0.41 + 0.32 * k) + 1.7 + 2.4 * k) % math.tau
        d = (theta - ang + math.pi) % math.tau - math.pi
        r -= amp * math.exp(-(d * d) / width)

    return max(0.34, min(1.20, r))


def _build_sheet_bmesh(spec: PeelSpec):
    """A torn segment of a fruit's skin, shrunk and curled inwards by drying.

    The patch is a curved quadrilateral on the sphere, bounded in both
    longitude and latitude — an orange-quarter, not a full cap. A full cap that
    curls past a hemisphere closes up and reads as a whole fruit.
    """
    bm = bmesh.new()
    n_u, n_v = spec.n_u, spec.n_v
    seed = float(spec.seed)
    R = spec.radius

    grid = []
    for i in range(n_u + 1):
        a = -1.0 + 2.0 * i / n_u
        row = []
        for j in range(n_v + 1):
            b = -1.0 + 2.0 * j / n_v

            # Torn outline: shrink the parameter square by a direction-dependent
            # factor, so the boundary frays while the interior stays even.
            theta = math.atan2(b, a)
            f = _irregular_radius(theta, spec)
            au, bv = a * f, b * f

            m = max(abs(au), abs(bv))          # 1.0 at the rim
            g = 1.0 + (spec.curl - 1.0) * m * m  # drying wraps the rim further in
            if spec.rim_wave:
                # Drying is uneven around the edge, so parts of the lip roll in
                # further than others. Without this the bowl has a turned rim.
                ripple = math.cos(3.0 * theta + seed * 0.29) * 0.65 + math.cos(
                    5.0 * theta + seed * 0.53
                ) * 0.35
                g *= 1.0 + spec.rim_wave * ripple * m * m
            lam = 0.5 * spec.span_u * au * g
            bet = 0.5 * spec.span_v * bv * g

            rad = R * (1.0 - 0.09 * m * m)
            # Drying puckers the whole patch, not just its rim. Without several
            # octaves here the shell stays a clean dome and reads as leather.
            w1 = noise.noise(Vector((au * 2.4, bv * 2.4, seed)))
            w2 = noise.noise(Vector((au * 5.5, bv * 5.5, seed + 2.0)))
            w3 = noise.noise(Vector((au * 11.0, bv * 11.0, seed + 4.0)))
            w4 = noise.noise(Vector((au * 22.0, bv * 22.0, seed + 8.0)))
            rad += spec.wrinkle * (
                0.0018 * w1 + 0.0009 * w2 + 0.00045 * w3 + 0.00020 * w4
            ) * (0.55 + 0.45 * m)

            cb = math.cos(bet)
            x = rad * cb * math.cos(lam)
            y = rad * cb * math.sin(lam)
            z = rad * math.sin(bet)

            if spec.calyx:
                # Shallow star-shaped stem scar at the middle of the patch: a
                # strong cue that this came off a whole fruit.
                d2 = au * au + bv * bv
                s_amt = math.exp(-d2 / 0.045)
                s_amt *= 0.72 + 0.28 * math.cos(5.0 * theta + 0.6)
                scale = 1.0 - 0.050 * s_amt
                x, y, z = x * scale, y * scale, z * scale

            row.append(bm.verts.new((x, y, z)))
        grid.append(row)

    for i in range(n_u):
        for j in range(n_v):
            bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))

    bm.verts.ensure_lookup_table()
    thick_w = [1.0] * len(bm.verts)
    for i in range(n_u + 1):
        a = -1.0 + 2.0 * i / n_u
        for j in range(n_v + 1):
            b = -1.0 + 2.0 * j / n_v
            m = max(abs(a), abs(b))
            thick_w[grid[i][j].index] = 0.58 + 0.42 * (1.0 - m ** 1.6)

    # Shell built with the convex (skin) side outwards; Solidify then grows the
    # pith inwards, so face normals must point away from the sphere centre.
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    outward = sum(f.normal.dot(f.calc_center_median().normalized()) for f in bm.faces)
    if outward < 0.0:
        bmesh.ops.reverse_faces(bm, faces=list(bm.faces))

    # The patch is generated around the fruit's centre, which sits a full radius
    # away from the peel itself. Left there, every piece orbits a shared origin
    # and the group closes into a cracked shell. Recentre so `loc` and `rot` act
    # on the piece itself.
    centre = sum((v.co for v in bm.verts), Vector()) / len(bm.verts)
    bmesh.ops.translate(bm, verts=list(bm.verts), vec=-centre)
    return bm, thick_w


@dataclass
class StripSpec:
    """One shred of 陈皮丝: a knife-cut ribbon of peel.

    A strip keeps the fruit's curvature across its narrow width, so its section
    is a trough rather than a flat band, and drying twists that trough along the
    length. `curl_r` is the section radius — small values roll it up tightly.
    """

    name: str
    seed: int
    length: float
    width: float
    curl_r: float
    thickness: float
    twist: float                # total twist along the length, radians
    bend: float                 # lateral sweep of the centreline
    loc: tuple[float, float, float]
    rot: tuple[float, float, float]
    n_l: int = 30
    n_w: int = 6


def _build_strip_bmesh(spec: StripSpec):
    """Sweep a curved cross-section along a wandering, twisting centreline."""
    bm = bmesh.new()
    seed = float(spec.seed)
    n_l, n_w = spec.n_l, spec.n_w
    half = 0.5 * spec.width / spec.curl_r   # half the section's angular width

    def centre(t: float) -> Vector:
        s = (t - 0.5) * spec.length
        y = spec.bend * noise.noise(Vector((t * 2.3, seed * 0.13, 0.0)))
        z = 0.45 * spec.bend * noise.noise(Vector((t * 3.1, seed * 0.29, 5.0)))
        return Vector((s, y, z))

    grid = []
    for i in range(n_l + 1):
        t = i / n_l
        p = centre(t)
        eps = 1.0 / (2.0 * n_l)
        tangent = (centre(min(1.0, t + eps)) - centre(max(0.0, t - eps)))
        if tangent.length < 1e-9:
            tangent = Vector((1.0, 0.0, 0.0))
        tangent.normalize()
        nrm = tangent.cross(Vector((0.0, 0.0, 1.0)))
        if nrm.length < 1e-6:
            nrm = tangent.cross(Vector((0.0, 1.0, 0.0)))
        nrm.normalize()
        # Section points sit on a circle centred at p - B*r, so the convex side
        # — the one carrying the skin — faces +B. Orient B up by default so a
        # strip lying flat shows skin, not pith.
        binorm = -tangent.cross(nrm).normalized()

        phi = spec.twist * (t - 0.5) + 0.35 * noise.noise(
            Vector((t * 2.7, seed * 0.41, 9.0))
        )
        cp, sp = math.cos(phi), math.sin(phi)
        n_r = nrm * cp + binorm * sp
        b_r = -nrm * sp + binorm * cp
        if i == n_l // 2:
            b_ref = b_r.copy()

        # Knife cuts are near-straight, so the width only breathes a little.
        w_mod = 1.0 + 0.10 * noise.noise(Vector((t * 4.5, seed * 0.67, 2.0)))
        row = []
        for j in range(n_w + 1):
            u = -1.0 + 2.0 * j / n_w
            a = u * half * w_mod
            r = spec.curl_r * (
                1.0 + 0.05 * noise.noise(Vector((t * 6.0, u * 3.0, seed)))
            )
            off = n_r * (r * math.sin(a)) + b_r * (r * (math.cos(a) - 1.0))
            row.append(bm.verts.new(p + off))
        grid.append(row)

    for i in range(n_l):
        for j in range(n_w):
            bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))

    bm.verts.ensure_lookup_table()
    thick_w = [1.0] * len(bm.verts)
    for i in range(n_l + 1):
        for j in range(n_w + 1):
            u = abs(-1.0 + 2.0 * j / n_w)
            thick_w[grid[i][j].index] = 0.70 + 0.30 * (1.0 - u ** 1.6)

    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    # Normals must sit on the convex side, otherwise Solidify grows the pith
    # slab over the skin and every strip reads pale. Test at mid-length, where
    # the twisted frame is known, rather than against an end-of-loop vector.
    if sum(f.normal.dot(b_ref) for f in bm.faces) < 0.0:
        bmesh.ops.reverse_faces(bm, faces=list(bm.faces))

    centre_pt = sum((v.co for v in bm.verts), Vector()) / len(bm.verts)
    bmesh.ops.translate(bm, verts=list(bm.verts), vec=-centre_pt)
    return bm, thick_w


def strip_specs() -> list:
    """A loose heap of shreds, criss-crossed and settling into the gaps."""
    rng = random.Random(20240918)
    specs = []
    n = 26
    for k in range(n):
        # Lower strips spread wide, later ones land nearer the middle so the
        # pile has a raised centre instead of an even carpet.
        frac = k / (n - 1)
        spread = 0.031 * (1.0 - 0.55 * frac)
        ang = rng.uniform(0.0, math.tau)
        rad = spread * math.sqrt(rng.random())
        specs.append(
            StripSpec(
                name=f"Chenpi_Strip_{k + 1:02d}",
                seed=101 + k * 37,
                length=rng.uniform(0.026, 0.046),
                width=rng.uniform(0.0038, 0.0068),
                # Shallow troughs: a tight radius here rolls the strip into
                # something closer to a twig than a shred of peel.
                curl_r=rng.uniform(0.0050, 0.0140),
                thickness=rng.uniform(0.0011, 0.0015),
                twist=rng.uniform(-1.9, 1.9),
                bend=rng.uniform(0.0016, 0.0052),
                loc=(
                    math.cos(ang) * rad,
                    math.sin(ang) * rad,
                    0.00075 * k + rng.uniform(-0.0004, 0.0004),
                ),
                rot=(
                    rng.uniform(-0.30, 0.30),
                    rng.uniform(-0.30, 0.30),
                    rng.uniform(0.0, math.tau),
                ),
                n_l=30,
                n_w=6,
            )
        )
    return specs


def create_peel_object(spec, materials: tuple) -> bpy.types.Object:
    builder = _build_strip_bmesh if isinstance(spec, StripSpec) else _build_sheet_bmesh
    bm, thick_w = builder(spec)
    mesh = bpy.data.meshes.new(spec.name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(spec.name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    outer, inner, rim = materials
    obj.data.materials.append(outer)
    obj.data.materials.append(inner)
    obj.data.materials.append(rim)

    vg = obj.vertex_groups.new(name="peel_thick")
    for idx, weight in enumerate(thick_w):
        if idx < len(obj.data.vertices):
            vg.add([idx], float(weight), "REPLACE")

    solid = obj.modifiers.new("Solidify", "SOLIDIFY")
    solid.thickness = spec.thickness
    solid.offset = -1.0
    solid.use_even_offset = False
    try:
        solid.use_quality_normals = False
    except Exception:
        pass
    solid.use_rim = True
    solid.material_offset = 1
    solid.material_offset_rim = 2
    solid.vertex_group = vg.name
    try:
        solid.thickness_clamp = 0.0
    except Exception:
        pass
    apply_object_modifiers(obj)
    cleanup_thin_mesh(obj)

    obj.location = spec.loc
    obj.rotation_euler = spec.rot
    shade_peel(obj)
    return obj


def apply_object_modifiers(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.context.view_layer.update()
    for mod in list(obj.modifiers):
        if mod.type == "NODES":
            obj.modifiers.remove(mod)
            continue
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except Exception as exc:
            print(f"Failed to apply {mod.name} on {obj.name}: {exc}")


def cleanup_thin_mesh(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    try:
        bpy.ops.mesh.remove_doubles(threshold=0.00012)
    except Exception:
        pass
    try:
        bpy.ops.mesh.dissolve_degenerate(threshold=0.00008)
    except Exception:
        pass
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")


def shade_peel(obj: bpy.types.Object) -> None:
    for poly in obj.data.polygons:
        poly.use_smooth = True


def join_named(objs: list, name: str) -> bpy.types.Object:
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
        o.hide_set(False)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    joined = bpy.context.active_object
    joined.name = name
    joined.data.name = name
    return joined


def recenter_origin(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")


def mesh_stats(obj: bpy.types.Object) -> str:
    me = obj.data
    tris = sum(len(p.vertices) - 2 for p in me.polygons)
    return f"{obj.name}: verts={len(me.vertices)} faces={len(me.polygons)} tris≈{tris}"


# "strips" builds 陈皮丝, the shredded decoction form; "bowls" keeps the whole
# cupped pieces. Both use the same materials.
FORM = "strips"


def build_chenpi_high() -> bpy.types.Object:
    col = std.collection("Herb_Chenpi_High")
    materials = (make_outer_material(), make_inner_material(), make_rim_material())
    pieces = []
    specs = strip_specs() if FORM == "strips" else PEEL_SPECS
    for spec in specs:
        obj = create_peel_object(spec, materials)
        std.link_exclusive(obj, col)
        pieces.append(obj)
        print(mesh_stats(obj))

    # Joining is required for the bake, so keep an editable per-peel copy in the
    # source blend. Hidden, never exported.
    parts = std.collection("Herb_Chenpi_Parts")
    for obj in pieces:
        part = duplicate_mesh_object(obj, f"{obj.name}_Part")
        std.link_exclusive(part, parts)
        hide_for_render(part, True)

    high = join_named(pieces, "Chenpi_High")
    recenter_origin(high)
    high.location = std.HERB_ANCHOR
    std.link_exclusive(high, col)
    print("Joined high:", mesh_stats(high))
    print("High dimensions:", tuple(round(x, 4) for x in high.dimensions))
    return high


def hide_for_render(obj: bpy.types.Object, hide: bool) -> None:
    obj.hide_render = hide
    obj.hide_viewport = hide
    try:
        obj.hide_set(hide)
    except Exception:
        pass


def duplicate_mesh_object(obj: bpy.types.Object, name: str) -> bpy.types.Object:
    mesh = obj.data.copy()
    dup = obj.copy()
    dup.data = mesh
    dup.name = name
    bpy.context.scene.collection.objects.link(dup)
    return dup


def build_chenpi_low(high: bpy.types.Object, ratio: float = 0.35) -> bpy.types.Object:
    col = std.collection("Herb_Chenpi_Low")
    low = duplicate_mesh_object(high, "Chenpi_Low")
    std.link_exclusive(low, col)
    # A re-run opens a blend where the high poly was left hidden, and the copy
    # inherits that; hidden objects cannot be edited.
    hide_for_render(low, False)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = low
    low.select_set(True)
    # ratio >= 1 keeps the high-poly cage. These shells are thin and their torn
    # rims carry the silhouette, so collapsing them costs more than it saves.
    if ratio < 1.0:
        dec = low.modifiers.new("Decimate", "DECIMATE")
        dec.ratio = ratio
        dec.use_collapse_triangulate = True
        apply_object_modifiers(low)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66.0), island_margin=0.016)
    bpy.ops.object.mode_set(mode="OBJECT")
    print("Low:", mesh_stats(low))
    return low


def _ensure_image(name: str, size: int, is_data: bool) -> bpy.types.Image:
    img = bpy.data.images.get(name)
    if img is None:
        img = bpy.data.images.new(name, width=size, height=size, alpha=False, float_buffer=False)
    img.generated_color = (0.5, 0.5, 0.5, 1.0)
    img.colorspace_settings.name = "Non-Color" if is_data else "sRGB"
    return img


def _prepare_bake_targets(obj: bpy.types.Object, image: bpy.types.Image) -> None:
    if not obj.data.materials:
        mat = bpy.data.materials.new("BakeTarget")
        mat.use_nodes = True
        obj.data.materials.append(mat)
    for mat in obj.data.materials:
        if mat is None:
            continue
        mat.use_nodes = True
        nt = mat.node_tree
        node = None
        for n in nt.nodes:
            if n.type == "TEX_IMAGE" and n.image == image:
                node = n
                break
        if node is None:
            node = nt.nodes.new("ShaderNodeTexImage")
            node.image = image
            node.label = "BakeTarget"
        for n in nt.nodes:
            n.select = False
        node.select = True
        nt.nodes.active = node


def bake_maps(
    high: bpy.types.Object,
    low: bpy.types.Object,
    size: int = 1024,
    selected_to_active: bool = True,
) -> dict:
    """Bake the procedural peel shaders down to textures.

    When `low` is not decimated it shares the high-poly cage, and projecting one
    onto a coincident surface only introduces ray noise — bake in place instead.
    """
    tex_dir = std.BLEND_DIR / "herbs" / "chenpi" / "textures"
    tex_dir.mkdir(parents=True, exist_ok=True)
    std.enable_cycles_gpu()
    scene = bpy.context.scene
    scene.cycles.samples = 24
    bake = scene.render.bake
    bake.use_selected_to_active = selected_to_active
    bake.cage_extrusion = 0.006
    bake.max_ray_distance = 0.03
    bake.margin = 10
    bake.margin_type = "EXTEND"

    maps = {
        "albedo": _ensure_image("chenpi_albedo", size, False),
        "normal": _ensure_image("chenpi_normal", size, True),
        "roughness": _ensure_image("chenpi_roughness", size, True),
    }

    jobs = [
        ("albedo", "DIFFUSE", {"use_pass_direct": False, "use_pass_indirect": False, "use_pass_color": True}),
        ("normal", "NORMAL", {}),
        ("roughness", "ROUGHNESS", {}),
    ]

    for key, bake_type, flags in jobs:
        image = maps[key]
        _prepare_bake_targets(low, image)
        bpy.ops.object.select_all(action="DESELECT")
        low.hide_set(False)
        low.select_set(True)
        if selected_to_active:
            high.hide_set(False)
            high.hide_render = False
            high.select_set(True)
        else:
            hide_for_render(high, True)
        bpy.context.view_layer.objects.active = low
        for attr, val in {
            "use_pass_direct": False,
            "use_pass_indirect": False,
            "use_pass_color": True,
        }.items():
            if hasattr(bake, attr):
                setattr(bake, attr, flags.get(attr, val) if bake_type == "DIFFUSE" else False)
        if bake_type == "NORMAL":
            bake.normal_space = "TANGENT"
        print(f"Baking {bake_type}...")
        try:
            bpy.ops.object.bake(type=bake_type)
        except Exception as exc:
            print(f"Selected-to-active {bake_type} failed ({exc}), baking from low only")
            bake.use_selected_to_active = False
            bpy.ops.object.select_all(action="DESELECT")
            low.select_set(True)
            bpy.context.view_layer.objects.active = low
            bpy.ops.object.bake(type=bake_type)
            bake.use_selected_to_active = selected_to_active
        path = tex_dir / f"{image.name}.png"
        image.filepath_raw = str(path)
        image.file_format = "PNG"
        image.save()
        print("Saved", path)

    return maps


def assign_baked_material(obj: bpy.types.Object, maps: dict) -> bpy.types.Material:
    mat = bpy.data.materials.get("Chenpi_Baked") or bpy.data.materials.new("Chenpi_Baked")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (520, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (240, 0)
    _set(bsdf, "Metallic", 0.0)
    _set(bsdf, "Specular IOR Level", 0.25)
    _set(bsdf, "Specular", 0.25)

    tex_c = nt.nodes.new("ShaderNodeTexImage")
    tex_c.location = (-220, 160)
    tex_c.image = maps["albedo"]
    tex_c.image.colorspace_settings.name = "sRGB"

    tex_n = nt.nodes.new("ShaderNodeTexImage")
    tex_n.location = (-220, -40)
    tex_n.image = maps["normal"]
    tex_n.image.colorspace_settings.name = "Non-Color"
    nmap = nt.nodes.new("ShaderNodeNormalMap")
    nmap.location = (20, -40)

    tex_r = nt.nodes.new("ShaderNodeTexImage")
    tex_r.location = (-220, -260)
    tex_r.image = maps["roughness"]
    tex_r.image.colorspace_settings.name = "Non-Color"

    nt.links.new(tex_c.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(tex_n.outputs["Color"], nmap.inputs["Color"])
    nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    nt.links.new(tex_r.outputs["Color"], bsdf.inputs["Roughness"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return mat


def apply_presentation_rotation(obj: bpy.types.Object) -> None:
    if obj.get("chenpi_presented"):
        print("Presentation rotation already applied")
        obj.location = std.HERB_ANCHOR
        return
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    obj.location = std.HERB_ANCHOR
    obj["chenpi_presented"] = 1
