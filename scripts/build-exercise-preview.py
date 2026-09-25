#!/usr/bin/env python3
"""Build Torvik previews from visually reviewed, transparent generated sheets.
Requires Pillow 12.x. Detect complete connected silhouettes rather than fixed-width crops.
Usage: python3 scripts/build-exercise-preview.py INPUT ID [--rows 2] [--frames 8]
Normalized lossless sprites are also accepted with --rows 1, for reproducible encoding.
"""
import argparse
from collections import deque
from pathlib import Path
from PIL import Image

parser=argparse.ArgumentParser()
parser.add_argument('source',type=Path)
parser.add_argument('exercise',choices=['lunge','bicepscurl','lateralraise','situp','plank'])
parser.add_argument('--rows',type=int,default=2)
parser.add_argument('--frames',type=int,default=8)
parser.add_argument('--output',type=Path,default=Path('public/exercise-previews'))
args=parser.parse_args()
im=Image.open(args.source).convert('RGBA'); w,h=im.size
pixels=list(im.get_flattened_data())
# Generated sheets can contain isolated bright chroma spill. Never remove dark clothing.
alpha=bytearray(a if not (r>180 and g<55 and b<55) else 0 for r,g,b,a in pixels)
seen=bytearray(w*h); components=[]
for start in range(w*h):
    if seen[start] or alpha[start]<24: continue
    seen[start]=1; q=deque([start]); points=[]
    while q:
        i=q.popleft(); points.append(i); x,y=i%w,i//w
        for yy in range(max(0,y-1),min(h,y+2)):
            for xx in range(max(0,x-1),min(w,x+2)):
                j=yy*w+xx
                if not seen[j] and alpha[j]>=24: seen[j]=1; q.append(j)
    if len(points)>500: components.append(points)
components.sort(key=len,reverse=True)
if len(components)<args.frames: raise SystemExit('Too few separate silhouettes; inspect overlap or missing frames before continuing.')
chosen=components[:args.frames]
if len(components)>args.frames and len(components[args.frames])>len(chosen[-1])*.05:
    raise SystemExit('Unassigned large component: inspect disconnected limbs before continuing.')
frames=[]
for points in chosen:
    xs=[i%w for i in points]; ys=[i//w for i in points]
    box=(min(xs),min(ys),max(xs)+1,max(ys)+1)
    if box[0]==0 or box[1]==0 or box[2]==w or box[3]==h:
        raise SystemExit(f'Character touches source edge: {box}; repair source first.')
    mask=Image.new('L',(w,h)); data=bytearray(w*h)
    # Keep original antialiasing around the detected silhouette, not disconnected stains.
    for i in points:
        x,y=i%w,i//w
        for yy in range(max(0,y-1),min(h,y+2)):
            for xx in range(max(0,x-1),min(w,x+2)):
                j=yy*w+xx; data[j]=alpha[j]
    mask.frombytes(bytes(data)); piece=im.copy();piece.putalpha(mask)
    bounds=piece.getbbox(); assert bounds is not None
    frames.append((int(((box[1]+box[3])/2)/h*args.rows),(box[0]+box[2])/2,piece.crop(bounds)))
frames.sort(key=lambda item:(item[0],item[1]))
# One scale for the whole sequence. Horizontal centering and floor baseline are per pose.
scale=min(232/max(f.width for _,_,f in frames),232/max(f.height for _,_,f in frames))
normalized=[]
for _,_,f in frames:
    f=f.resize((round(f.width*scale),round(f.height*scale)),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(256,256));canvas.alpha_composite(f,((256-f.width)//2,244-f.height));normalized.append(canvas)
args.output.mkdir(parents=True,exist_ok=True)
base=args.output/f'torvik-{args.exercise}'
sprite=Image.new('RGBA',(256*len(normalized),256))
for index,f in enumerate(normalized):sprite.alpha_composite(f,(256*index,0))
sprite.save(str(base)+'-sprite.webp',lossless=True,method=6)
normalized[0].save(str(base)+'-still.webp',quality=88,method=6)
normalized[0].save(str(base)+'.webp',save_all=True,append_images=normalized[1:],duration=200,loop=0,quality=88,method=6,allow_mixed=False)
check=Image.open(str(base)+'.webp'); assert check.n_frames==args.frames
for index in range(check.n_frames):
    check.seek(index); f=check.convert('RGBA');box=f.getbbox();assert box and box[0]>0 and box[1]>0 and box[2]<256 and box[3]<256
    assert f.getchannel('A').getextrema()==(0,255)
# Contact sheet on the app background for review, outside the public assets.
review=Image.new('RGB',(256*4,256*((len(normalized)+3)//4)), '#182532')
for i,f in enumerate(normalized):review.paste(f,((i%4)*256,(i//4)*256),f)
review.save(f'/tmp/torvik-{args.exercise}-review.png')
print(f'{args.exercise}: {check.n_frames} frames, 256x256, {args.frames*200}ms, {Path(str(base)+".webp").stat().st_size} bytes')
