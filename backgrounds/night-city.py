import random, math, sys
random.seed(77)
W,H=3456,2234
o=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
'''<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#030106"/><stop offset="0.35" stop-color="#0b0410"/>
 <stop offset="0.6" stop-color="#2b0714"/><stop offset="0.75" stop-color="#140409"/><stop offset="1" stop-color="#050205"/></linearGradient>
<radialGradient id="gR" cx="0.68" cy="0.55" r="0.5"><stop offset="0" stop-color="#ff003c" stop-opacity="0.32"/><stop offset="1" stop-color="#ff003c" stop-opacity="0"/></radialGradient>
<radialGradient id="gC" cx="0.12" cy="0.62" r="0.35"><stop offset="0" stop-color="#00f0ff" stop-opacity="0.14"/><stop offset="1" stop-color="#00f0ff" stop-opacity="0"/></radialGradient>
<radialGradient id="gY" cx="0.42" cy="0.7" r="0.3"><stop offset="0" stop-color="#fcee0a" stop-opacity="0.08"/><stop offset="1" stop-color="#fcee0a" stop-opacity="0"/></radialGradient>
<linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff003c" stop-opacity="0"/><stop offset="1" stop-color="#5a0820" stop-opacity="0.55"/></linearGradient>
<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" fill-opacity="0.3"/></pattern>
</defs>''',
f'<rect width="{W}" height="{H}" fill="url(#sky)"/>',
f'<rect width="{W}" height="{H}" fill="url(#gR)"/><rect width="{W}" height="{H}" fill="url(#gC)"/><rect width="{W}" height="{H}" fill="url(#gY)"/>']

NEON=["#ff003c","#00f0ff","#fcee0a","#ff2a9d"]
def envelope(x,phase,amp):
    return amp*(0.55*math.sin(x/W*math.pi*2.3+phase)+0.45*math.sin(x/W*math.pi*5.1+phase*1.7))

def windows(x,top,w,base,lit,op):
    if lit<=0: return
    tone=random.choice(["#fcee0a","#fcee0a","#ffb86b","#00f0ff","#ff5a6e"])
    cw,ch,gx,gy=random.choice([(6,3,14,18),(4,4,10,14),(10,3,18,22)])
    for wy in range(int(top)+16,int(base)-8,gy):
        for wx in range(x+8,x+w-cw-6,gx):
            if random.random()<lit:
                o.append(f'<rect x="{wx}" y="{wy}" width="{cw}" height="{ch}" fill="{tone}" fill-opacity="{op*random.uniform(.35,1):.2f}"/>')

def layer(base,hmin,hmax,phase,col,op,wmin,wmax,signs):
    x=-random.randint(0,60)
    while x<W:
        w=random.randint(wmin,wmax)
        mid=(hmin+hmax)/2+envelope(x+w/2,phase,(hmax-hmin)/2)
        h=max(hmin*0.6,mid+random.uniform(-(hmax-hmin)*0.25,(hmax-hmin)*0.25))
        top=base-h
        o.append(f'<rect x="{x}" y="{top:.0f}" width="{w}" height="{H-top:.0f}" fill="{col}"/>')
        # stepped crown
        if random.random()<0.35:
            iw=int(w*random.uniform(.4,.7)); ih=random.randint(20,80)
            o.append(f'<rect x="{x+(w-iw)//2}" y="{top-ih:.0f}" width="{iw}" height="{ih}" fill="{col}"/>')
        if random.random()<0.3:
            ah=random.randint(40,140); ax=x+random.randint(8,max(9,w-8))
            o.append(f'<rect x="{ax}" y="{top-ah:.0f}" width="3" height="{ah}" fill="{col}"/>')
            o.append(f'<circle cx="{ax+1.5}" cy="{top-ah:.0f}" r="3" fill="#ff003c" fill-opacity="0.9"/>')
        windows(x,top,w,H,random.choice([0,0.08,0.15,0.25,0.4]),op)
        if signs and w>60 and random.random()<signs:
            c=random.choice(NEON)
            if random.random()<0.5:  # vertical sign
                sw=random.randint(16,26); sh=random.randint(120,260); sx=x+random.choice([4,w-sw-4]); sy=top+random.randint(30,160)
                o.append(f'<rect x="{sx}" y="{sy:.0f}" width="{sw}" height="{sh}" fill="{c}" fill-opacity="0.5" filter="url(#blur)"/>')
                o.append(f'<rect x="{sx}" y="{sy:.0f}" width="{sw}" height="{sh}" fill="#08040a" stroke="{c}" stroke-width="2"/>')
                for k in range(sy.__int__()+10, int(sy+sh-12), 22):
                    o.append(f'<rect x="{sx+5}" y="{k}" width="{sw-10}" height="10" fill="{c}" fill-opacity="0.85"/>')
            else:  # horizontal billboard
                bw=int(w*random.uniform(.6,.9)); bh=random.randint(26,60); bx=x+(w-bw)//2; by=top+random.randint(40,200)
                o.append(f'<rect x="{bx}" y="{by:.0f}" width="{bw}" height="{bh}" fill="{c}" fill-opacity="0.45" filter="url(#blur)"/>')
                o.append(f'<rect x="{bx}" y="{by:.0f}" width="{bw}" height="{bh}" fill="#08040a" stroke="{c}" stroke-width="3"/>')
                o.append(f'<rect x="{bx+8}" y="{by+bh/2-3:.0f}" width="{int(bw*random.uniform(.3,.8))}" height="6" fill="{c}" fill-opacity="0.8"/>')
        x+=w+random.randint(0,14)

# megatower, center-right
tx,tw=int(W*0.6),150
o.append(f'<path d="M{tx} {H} L{tx} {H*0.2:.0f} L{tx+tw*0.3:.0f} {H*0.12:.0f} L{tx+tw*0.7:.0f} {H*0.12:.0f} L{tx+tw} {H*0.2:.0f} L{tx+tw} {H} Z" fill="#1d0a16"/>')
o.append(f'<rect x="{tx+tw/2-3:.0f}" y="{H*0.13:.0f}" width="6" height="{H*0.5:.0f}" fill="#ff003c" fill-opacity="0.55" filter="url(#blur)"/>')
o.append(f'<rect x="{tx+tw/2-1:.0f}" y="{H*0.13:.0f}" width="2" height="{H*0.5:.0f}" fill="#ff5a6e"/>')
o.append(f'<rect x="0" y="0" width="{W}" height="{H}" fill="url(#fog)"/>')

layer(H*0.98,H*0.38,H*0.62,0.3,"#1f0a17",0.35,50,130,0.0)
o.append(f'<rect x="0" y="{H*0.45:.0f}" width="{W}" height="{H*0.55:.0f}" fill="url(#fog)"/>')
layer(H*1.0,H*0.26,H*0.46,2.1,"#110610",0.6,80,190,0.12)
o.append(f'<rect x="0" y="{H*0.6:.0f}" width="{W}" height="{H*0.4:.0f}" fill="url(#fog)" opacity="0.7"/>')
layer(H*1.0,H*0.12,H*0.3,4.0,"#060307",0.9,110,260,0.35)

# flying cars
for _ in range(10):
    cx=random.randint(0,W); cy=random.randint(int(H*0.12),int(H*0.5)); L=random.randint(30,90); c=random.choice(["#fcee0a","#ff003c","#00f0ff"])
    o.append(f'<rect x="{cx}" y="{cy}" width="{L}" height="2" fill="{c}" fill-opacity="0.7"/>')

o.append(f'<rect width="{W}" height="{H}" fill="url(#scan)"/></svg>')
open(sys.argv[1],"w").write("\n".join(o))
