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
parser.add_argument('exercise',choices=['lunge','bicepscurl','lateralraise','situp','plank','glutebridge','calfraise','reverselunge','shoulderpress','frontraise','bentoverrow','tricepskickback','mountainclimber','romaniandeadlift','bulgariansquat','wallsit','floorpress','sideplank','deadbug','birddog','lyinglegraise','shouldertap','highknees','buttkicks','skater','stepjack','jumpsquat'])
parser.add_argument('--rows',type=int,default=2)
parser.add_argument('--frames',type=int,default=8)
parser.add_argument('--grid', action='store_true', help='Explicit equal cells, fixed origin, preserves detached props and jump height; requires visually reviewed sheet')
parser.add_argument('--align-rows', action='store_true', help='Align row floor baselines without changing positions within each row')
parser.add_argument('--order', help='Comma-separated source cell indices in playback order')
parser.add_argument('--preserve-origin', action='store_true', help='Extract separate complete silhouettes while preserving their grid origins, including cell overflow')
parser.add_argument('--normalized', action='store_true', help='Re-encode a reviewed 256px lossless horizontal master without resizing or moving frames')
parser.add_argument('--frame-ms', type=int, default=200)
parser.add_argument('--output',type=Path,default=Path('public/exercise-previews'))
args=parser.parse_args()
im=Image.open(args.source).convert('RGBA'); w,h=im.size
if args.normalized:
    if (w,h)!=(256*args.frames,256):raise SystemExit('Normalized master must be a horizontal strip of 256px frames')
    normalized=[im.crop((i*256,0,(i+1)*256,256)) for i in range(args.frames)]
elif args.grid:
    if args.frames % args.rows: raise SystemExit('Frames must divide evenly into rows.')
    cols=args.frames//args.rows
    cells=[]
    for index in range(args.frames):
        row,col=divmod(index,cols)
        box=(round(col*w/cols),round(row*h/args.rows),round((col+1)*w/cols),round((row+1)*h/args.rows))
        frame=im.crop(box)
        fw,fh=frame.size
        pixels=list(frame.get_flattened_data())
        alpha=bytearray((255 if a>=250 else a) if not (r>180 and g<55 and b<55) else 0 for r,g,b,a in pixels)
        seen=bytearray(fw*fh); cleaned=bytearray(fw*fh)
        for start in range(fw*fh):
            if seen[start] or alpha[start]<24: continue
            seen[start]=1;q=deque([start]);points=[]
            while q:
                i=q.popleft();points.append(i);x,y=i%fw,i//fw
                for yy in range(max(0,y-1),min(fh,y+2)):
                    for xx in range(max(0,x-1),min(fw,x+2)):
                        j=yy*fw+xx
                        if not seen[j] and alpha[j]>=24:seen[j]=1;q.append(j)
            if len(points)<100:continue
            for i in points:
                x,y=i%fw,i//fw
                for yy in range(max(0,y-1),min(fh,y+2)):
                    for xx in range(max(0,x-1),min(fw,x+2)):
                        j=yy*fw+xx;cleaned[j]=alpha[j]
        mask=Image.frombytes('L',(fw,fh),bytes(cleaned));frame.putalpha(mask)
        bounds=mask.point(lambda a:255 if a>=128 else 0).getbbox()
        if not bounds: raise SystemExit(f'Empty frame {index}')
        if bounds[0]==0 or bounds[1]==0 or bounds[2]==fw or bounds[3]==fh:
            raise SystemExit(f'Frame {index} touches its cell boundary: {bounds}; review/repair sheet')
        cells.append(frame)
    floor=[max(cells[r*cols+c].getbbox()[3] for c in range(cols)) for r in range(args.rows)]
    shifts=[max(floor)-v if args.align_rows else 0 for v in floor]
    # One scale preserves proportions even when generated cells are not square.
    cw=max(f.width for f in cells);ch=max(f.height+shifts[i//cols] for i,f in enumerate(cells))
    scale=min(232/cw,232/ch)
    normalized=[]
    order=list(map(int,args.order.split(','))) if args.order else list(range(args.frames))
    if len(order)!=args.frames or any(i<0 or i>=args.frames for i in order):raise SystemExit('Invalid playback order')
    for index in order:
        frame=cells[index].resize((round(cells[index].width*scale),round(cells[index].height*scale)),Image.Resampling.LANCZOS)
        canvas=Image.new('RGBA',(256,256))
        canvas.alpha_composite(frame,((256-round(cw*scale))//2,12+round(shifts[index//cols]*scale)))
        normalized.append(canvas)
else:
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
        frames.append((int(((box[1]+box[3])/2)/h*args.rows),(box[0]+box[2])/2,piece.crop(bounds),bounds))
    frames.sort(key=lambda item:(item[0],item[1]))
    # One scale for the whole sequence. Horizontal centering and floor baseline are per pose.
    scale=min(232/max(f.width for _,_,f,_ in frames),232/max(f.height for _,_,f,_ in frames))
    normalized=[]
    if args.preserve_origin:
        cols=args.frames//args.rows
        origins=[(b[0]-(i%cols)*w/cols,b[1]-(i//cols)*h/args.rows) for i,(_,_,_,b) in enumerate(frames)]
        floors=[max(origins[i][1]+frames[i][2].height for i in range(r*cols,(r+1)*cols)) for r in range(args.rows)]
        shifts=[max(floors)-v if args.align_rows else 0 for v in floors]
        left=min(x for x,y in origins);top=min(y+shifts[i//cols] for i,(x,y) in enumerate(origins))
        right=max(origins[i][0]+f.width for i,(_,_,f,_) in enumerate(frames))
        bottom=max(origins[i][1]+f.height+shifts[i//cols] for i,(_,_,f,_) in enumerate(frames))
        scale=min(232/(right-left),232/(bottom-top))
        for i,(_,_,f,_) in enumerate(frames):
            f=f.resize((round(f.width*scale),round(f.height*scale)),Image.Resampling.LANCZOS)
            canvas=Image.new('RGBA',(256,256));x,y=origins[i]
            canvas.alpha_composite(f,(12+round((x-left)*scale),12+round((y+shifts[i//cols]-top)*scale)));normalized.append(canvas)
    else:
        for _,_,f,_ in frames:
            f=f.resize((round(f.width*scale),round(f.height*scale)),Image.Resampling.LANCZOS)
            canvas=Image.new('RGBA',(256,256));canvas.alpha_composite(f,((256-f.width)//2,244-f.height));normalized.append(canvas)
args.output.mkdir(parents=True,exist_ok=True)
base=args.output/f'torvik-{args.exercise}'
sprite=Image.new('RGBA',(256*len(normalized),256))
for index,f in enumerate(normalized):sprite.alpha_composite(f,(256*index,0))
sprite.save(str(base)+'-sprite.webp',lossless=True,method=6)
normalized[0].save(str(base)+'-still.webp',quality=88,method=6)
normalized[0].save(str(base)+'.webp',save_all=True,append_images=normalized[1:],duration=args.frame_ms,loop=0,quality=88,method=6,allow_mixed=False)
check=Image.open(str(base)+'.webp'); assert check.n_frames==args.frames
for index in range(check.n_frames):
    check.seek(index); f=check.convert('RGBA');box=f.getbbox();assert box and box[0]>0 and box[1]>0 and box[2]<256 and box[3]<256
    assert f.getchannel('A').getextrema()==(0,255)
# Contact sheet on the app background for review, outside the public assets.
review=Image.new('RGB',(256*4,256*((len(normalized)+3)//4)), '#182532')
for i,f in enumerate(normalized):review.paste(f,((i%4)*256,(i//4)*256),f)
review.save(f'/tmp/torvik-{args.exercise}-review.png')
print(f'{args.exercise}: {check.n_frames} frames, 256x256, {args.frames*args.frame_ms}ms, {Path(str(base)+".webp").stat().st_size} bytes')
