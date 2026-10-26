#!/usr/bin/env python3
"""BEDSIT revolver asset prep: smooth away factory roll-marks in the geometry, use the
painted-out textures (dif_clean / nor_clean), add invented 'DROVER' roll-marks, write a
1024-JPEG game GLB.  python3 prep_revolver.py  -> revolver_game.glb"""
import json, struct, io, numpy as np
from PIL import Image, ImageDraw, ImageFont
SRC = '/tmp/glb/revolver.glb'; OUT = '/tmp/glb/revolver_game.glb'
b = open(SRC, 'rb').read(); jl = struct.unpack('<I', b[12:16])[0]; J = json.loads(b[20:20+jl])
BIN = b[20+jl+8:]
def acc(i, dt, n):
    a = J['accessors'][i]; v = J['bufferViews'][a['bufferView']]; o = v.get('byteOffset', 0)
    return np.frombuffer(BIN[o:o+v['byteLength']], dtype=dt).reshape(-1, n).copy()
P = acc(0, np.float32, 3); N = acc(1, np.float32, 3); UV = acc(2, np.float32, 2); I = acc(3, np.uint16, 3)
# regions that carried factory marks (model units; barrel +z, y up)
BOX = [dict(z=(0.38, 0.90), y=(0.33, 0.48), ax=0.05),   # barrel roll-marks
       dict(z=(-0.49, -0.34), y=(0.11, 0.24), ax=0.03),  # frame mark
       dict(z=(-0.72, -0.57), y=(0.03, 0.17), ax=0.04)]  # grip medallion
def inbox(p, B, pad=0.0):
    return ((p[:, 2] > B['z'][0]-pad) & (p[:, 2] < B['z'][1]+pad) & (p[:, 1] > B['y'][0]-pad) &
            (p[:, 1] < B['y'][1]+pad) & (np.abs(p[:, 0]) > B['ax']))
# ---- weld + Taubin smooth inside boxes (kills relief lettering)
key = np.round(P / 2e-5).astype(np.int64)
_, wid, inv = np.unique(key, axis=0, return_index=True, return_inverse=True); inv = inv.ravel()
W = P[wid].astype(np.float64); F = inv[I]
nb = [set() for _ in range(len(W))]
for a, b2, c in F:
    nb[a].update((b2, c)); nb[b2].update((a, c)); nb[c].update((a, b2))
mov = np.zeros(len(W), bool)
for B in BOX[1:]: mov |= inbox(W, B)   # barrel: decal covers it; smoothing there tears UV islands
idx = np.where(mov)[0]; nbl = [np.fromiter(nb[i], int) for i in idx]
print('smoothing', len(idx), 'welded verts')
for it in range(int(__import__("os").environ.get("SMIT","40"))):
    for lam in (0.55, -0.58):
        L = np.array([W[n].mean(0) for n in nbl]) - W[idx]; W[idx] += lam * L
P2 = W[inv].astype(np.float32)
# normals for touched verts: area-weighted face normals over welded neighbourhood
fn = np.cross(W[F[:, 1]] - W[F[:, 0]], W[F[:, 2]] - W[F[:, 0]]); acc_n = np.zeros_like(W)
for k in range(3): np.add.at(acc_n, F[:, k], fn)
acc_n /= np.linalg.norm(acc_n, axis=1, keepdims=True) + 1e-12
tv = mov[inv]; N2 = N.copy(); N2[tv] = acc_n[inv[tv]].astype(np.float32)
# keep sign consistent with original (doubleSided mesh, but lighting cares)
flip = (N2[tv] * N[tv]).sum(1) < 0; t2 = np.where(tv)[0]; N2[t2[flip]] *= -1
print('moved max', np.abs(P2 - P).max())
# ---- textures
dif = Image.open('/tmp/glb/dif_clean.png').convert('RGB'); nor = Image.open('/tmp/glb/nor_clean.png').convert('RGB')
TW, TH = dif.size; D = np.asarray(dif).astype(np.float32)
# texel -> 3D position map for barrel-side triangles (planar decal projection)
pos = np.full((TH, TW, 3), np.nan, np.float32); nrm = np.zeros((TH, TW), np.float32)
cen = P2[I].mean(1); fN = np.cross(P2[I[:, 1]] - P2[I[:, 0]], P2[I[:, 2]] - P2[I[:, 0]])
DB = dict(z=(0.30, 0.94), y=(0.30, 0.52), ax=0.05)
sel = np.where(inbox(cen, DB))[0]
for tol in (0.0, 0.25):
  for t in sel:
      uv = UV[I[t]] * [TW, TH]; p3 = P2[I[t]]
      x0, y0 = np.floor(uv.min(0)).astype(int); x1, y1 = np.ceil(uv.max(0)).astype(int)
      xs, ys = np.meshgrid(np.arange(x0, x1+1), np.arange(y0, y1+1)); q = np.stack([xs+0.5, ys+0.5], -1)
      a, bb, c = uv; m = np.array([bb-a, c-a]).T
      if abs(np.linalg.det(m)) < 1e-9: continue
      l = np.linalg.solve(m, (q - a).reshape(-1, 2).T).T; l1, l2 = l[:, 0], l[:, 1]; l0 = 1-l1-l2
      ok = (l0 > -0.02-tol) & (l1 > -0.02-tol) & (l2 > -0.02-tol)
      qq = q.reshape(-1, 2)[ok].astype(int); w = np.stack([l0, l1, l2], 1)[ok]
      g = (qq[:, 0] >= 0) & (qq[:, 0] < TW) & (qq[:, 1] >= 0) & (qq[:, 1] < TH); qq, w = qq[g], w[g]
      if tol: e = np.isnan(pos[qq[:, 1], qq[:, 0], 0]); qq, w = qq[e], w[e]
      pos[qq[:, 1], qq[:, 0]] = w @ p3; nrm[qq[:, 1], qq[:, 0]] = np.sign(cen[t, 0])
def font(sz):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf']:
        try: return ImageFont.truetype(f, sz)
        except OSError: pass
    return ImageFont.load_default()
def stamp(lines, z0, z1, yc, lh):
    """render text lines into a (z,y) plane image; returns sampler(z,y)->0..1 ink"""
    S = 4000; Wz = z1-z0; img = Image.new('L', (int(Wz*S), int(len(lines)*lh*1.5*S)), 0); d = ImageDraw.Draw(img)
    for k, (txt, sc) in enumerate(lines):
        f = font(int(lh*sc*S)); bw = d.textlength(txt, font=f)
        d.text(((img.width-bw)/2, k*lh*1.5*S + (1-sc)*lh*S*0.5), txt, fill=255, font=f)
    A = np.asarray(img).astype(np.float32)/255; Hh = img.height/S
    def samp(u, v):  # u along text (0..Wz), v down from top
        ix = (u*S).astype(int); iy = (v*S).astype(int)
        g = (ix >= 0) & (ix < A.shape[1]) & (iy >= 0) & (iy < A.shape[0]); o = np.zeros(len(u), np.float32)
        o[g] = A[iy[g], ix[g]]; return o
    return samp, Hh
ink = np.zeros((TH, TW), np.float32); have = ~np.isnan(pos[..., 0])
for side, lines in ((1, [('DROVER ARMS CO.', 1.0), ('.357 MAGNUM  CTG', 0.72)]),
                    (-1, [('DROVER  MODEL 87', 1.0), ('BALLARAT  VIC', 0.72)])):
    z0, z1, yc, lh = 0.42, 0.88, 0.405, 0.034
    samp, Hh = stamp(lines, z0, z1, yc, lh)
    m = have & (nrm == side); p = pos[m]
    u = (z1 - p[:, 2]) if side > 0 else (p[:, 2] - z0)   # +x side: +z reads to the left
    v = (yc + Hh/2) - p[:, 1]
    ink[m] = samp(u, v)
ink = np.asarray(Image.fromarray((ink*255).astype(np.uint8)).filter(__import__('PIL.ImageFilter', fromlist=['x']).GaussianBlur(0.7))).astype(np.float32)/255
D = D * (1 - 0.62*ink[..., None]) + 18*ink[..., None]
print('decal texels', int((ink > 0.3).sum()))
dif2 = Image.fromarray(np.clip(D, 0, 255).astype(np.uint8))
dif2.save('/tmp/glb/dif_final.png')
mr = Image.open('/tmp/glb/texture_metallic-texture_roughness.png').convert('RGB')
# engraved letters: rougher, less metal
MR = np.asarray(mr).astype(np.float32); MR[..., 1] = MR[..., 1]*(1-ink) + 230*ink
mr = Image.fromarray(np.clip(MR, 0, 255).astype(np.uint8))
def jpg(im, q=88):
    s = io.BytesIO(); im.resize((1024, 1024), Image.LANCZOS).save(s, 'JPEG', quality=q); return s.getvalue()
imgs = [jpg(nor, 92), jpg(dif2), jpg(mr)]
# ---- write GLB
blobs = [P2.tobytes(), N2.tobytes(), UV.tobytes(), I.astype(np.uint16).tobytes()] + imgs
J2 = json.loads(json.dumps(J)); off = 0; bvs = []
for k, bl in enumerate(blobs):
    v = {'buffer': 0, 'byteLength': len(bl), 'byteOffset': off}
    if k < 3: v['target'] = 34962
    elif k == 3: v['target'] = 34963
    bvs.append(v); off += (len(bl)+3)//4*4
J2['bufferViews'] = bvs
J2['accessors'][0]['min'] = P2.min(0).tolist(); J2['accessors'][0]['max'] = P2.max(0).tolist()
for im in J2['images']: im['mimeType'] = 'image/jpeg'
data = b''.join(bl + b'\0'*((4-len(bl) % 4) % 4) for bl in blobs); J2['buffers'] = [{'byteLength': len(data)}]
js = json.dumps(J2, separators=(',', ':')).encode(); js += b' '*((4-len(js) % 4) % 4)
glb = struct.pack('<III', 0x46546C67, 2, 12+8+len(js)+8+len(data)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(data), 0x004E4942) + data
open(OUT, 'wb').write(glb); print('wrote', OUT, len(glb))
