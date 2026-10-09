# -*- coding: utf-8 -*-
# 签桶黑底素材 -> 透明 webp（按 asset-geometry-verify 技能:覆盖率还原 alpha + 除底防黑边）
from PIL import Image
import os

SRC = r"C:\Users\14819\xwechat_files\wxid_lte5ou5fq8p322_98bd\temp\InputTemp\77b1919e-3e39-40be-9656-ec1b3e648e18.png"
OUT_DIR = r"C:\Users\14819\Desktop\upon-star-dev-spec\upon-star-dev-spec\assets"
TMP = os.path.join(os.environ.get("TEMP", "."), "qian_preview")

im = Image.open(SRC).convert("RGB")
W, H = im.size
print("source:", W, H)

# 1) 四角+边缘带实测背景（每处 24x24 平均）
px = im.load()
def avg(x0, y0):
    rs = gs = bs = n = 0
    for y in range(y0, y0+24):
        for x in range(x0, x0+24):
            r, g, b = px[x, y]; rs += r; gs += g; bs += b; n += 1
    return (rs/n, gs/n, bs/n)
corners = [avg(0,0), avg(W-24,0), avg(0,H-24), avg(W-24,H-24), avg(W//2-12,0), avg(W//2-12,H-24)]
BG = tuple(sum(c[i] for c in corners)/len(corners) for i in range(3))
print("BG:", [round(v,1) for v in BG], "corners:", [[round(v) for v in c] for c in corners])

LO = max(BG) + 2.0
FULL = 236.0
print("LO:", LO, "FULL:", FULL)

# 2) 覆盖率还原 alpha（单遍逐像素,无 numpy）+ 除底
src = im.tobytes()
out = bytearray(len(src) + W*H)  # RGBA interleaved manually -> use Image.frombytes later
rgba = bytearray(W*H*4)
for i in range(W*H):
    r = src[i*3]; g = src[i*3+1]; b = src[i*3+2]
    mx = r if r > g else g
    if b > mx: mx = b
    if mx <= LO:
        a = 0.0
    elif mx >= FULL:
        a = 1.0
    else:
        t = (mx - LO) / (FULL - LO)
        a = t*t*(3 - 2*t)  # smoothstep
    j = i*4
    if a <= 0:
        rgba[j] = rgba[j+1] = rgba[j+2] = 0; rgba[j+3] = 0
    else:
        if a < 1.0:
            # 除底: C = (p - (1-a)*BG)/a
            ia = 1.0 - a
            r2 = (r - ia*BG[0]) / a; g2 = (g - ia*BG[1]) / a; b2 = (b - ia*BG[2]) / a
            r = 0 if r2 < 0 else (255 if r2 > 255 else r2)
            g = 0 if g2 < 0 else (255 if g2 > 255 else g2)
            b = 0 if b2 < 0 else (255 if b2 > 255 else b2)
        rgba[j] = int(r+0.5); rgba[j+1] = int(g+0.5); rgba[j+2] = int(b+0.5)
        rgba[j+3] = int(a*255+0.5)

im_a = Image.frombytes("RGBA", (W, H), bytes(rgba))

# 3) alpha 统计
hist = im_a.split()[3].histogram()
tot = W*H
print("alpha=0: %.1f%%  alpha>200: %.1f%%  mid: %.1f%%" % (
    hist[0]*100.0/tot, sum(hist[200:])*100.0/tot, sum(hist[1:200])*100.0/tot))

# 4) 裁到内容 bbox（烟雾星光保留,留 8px 边）
bbox = im_a.getbbox()
print("bbox:", bbox)
if bbox:
    pad = 8
    l = max(0, bbox[0]-pad); t = max(0, bbox[1]-pad)
    r = min(W, bbox[2]+pad); btm = min(H, bbox[3]+pad)
    im_a = im_a.crop((l, t, r, btm))
print("cropped:", im_a.size)

# 5) 缩到 320 宽（最大显示 96px,约 3.3x）+ 输出 webp
tw = 320
th = round(im_a.size[1] * tw / im_a.size[0])
im_out = im_a.resize((tw, th), Image.LANCZOS)
out_path = os.path.join(OUT_DIR, "qian-tube.webp")
im_out.save(out_path, "WEBP", quality=88, method=6)
print("saved:", out_path, im_out.size, os.path.getsize(out_path)//1024, "KB")

# 6) 肉眼复核:叠在页面深色底(#0d0d14)上导出 jpg
bg_img = Image.new("RGB", (tw+80, th+80), (13, 13, 20))
bg_img.paste(im_out, (40, 40), im_out)
bg_img.save(TMP + ".jpg", quality=90)
print("preview:", TMP + ".jpg")
