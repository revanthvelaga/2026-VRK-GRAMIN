from pathlib import Path
import re
from PIL import Image, ImageDraw, ImageFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.utils import ImageReader
from xml.sax.saxutils import escape

ROOT=Path(__file__).resolve().parent
IMG=ROOT/'images'; IMG.mkdir(exist_ok=True)
OUT=ROOT.parent/'outputs'; OUT.mkdir(exist_ok=True)
FONT='C:/Windows/Fonts/segoeui.ttf'; BOLD='C:/Windows/Fonts/segoeuib.ttf'
green='#123d32'; pale='#edf3e8'; ink='#203a33'; gray='#617169'
def diagram(name,title,rows,foot):
    w=1500; rh=150; h=160+len(rows)*rh+100
    im=Image.new('RGB',(w,h),'white'); d=ImageDraw.Draw(im)
    f=ImageFont.truetype(FONT,27); fb=ImageFont.truetype(BOLD,30); ft=ImageFont.truetype(BOLD,38)
    d.text((40,30),title,font=ft,fill=ink)
    for i,row in enumerate(rows):
        y=115+i*rh; gap=26; bw=(1420-gap*(len(row)-1))/len(row)
        for j,txt in enumerate(row):
            x=40+j*(bw+gap);d.rounded_rectangle((x,y,x+bw,y+106),radius=16,fill=green if i==0 else pale,outline=green,width=2)
            lines=txt.split('\n'); lineh=36; yy=y+(106-lenh(lines)*lineh)/2
            for k,line in enumerate(lines):
                font=fb if k==0 else f; length=d.textlength(line,font=font)
                d.text((x+(bw-length)/2,yy+k*lineh),line,font=font,fill='white' if i==0 else ink)
        if i<len(rows)-1:
            xx=w//2;d.line((xx,y+110,xx,y+140),fill=gray,width=4);d.polygon([(xx-9,y+130),(xx+9,y+130),(xx,y+142)],fill=gray)
    d.text((40,h-65),foot,font=ImageFont.truetype(FONT,24),fill=gray)
    im.save(IMG/name)
def lenh(x):return len(x)
diagram('architecture.png','Implemented local runtime',[
 ['Customer view','Technician view','Owner view'],
 ['Same origin browser client\nEnglish default and Telugu customer labels'],
 ['Node HTTP API on loopback\nDemo identity + scoped access + input validation'],
 ['Booking domain\nLifecycle and approval guards','Retry protection\nUser key + request fingerprint'],
 ['Serialized local store\nBooking records, fee snapshots, history and retry results']
], 'Solid boxes are implemented. Local JSON persistence is for a single process only.')
diagram('lifecycle.png','Booking progress and separate payment state',[
 ['Customer requests','Owner assigns'],
 ['Technician travels','Technician inspects'],
 ['Estimate sent','Customer approves'],
 ['Repair starts','Service completed'],
 ['Payment: unpaid > failed or cash pending > paid']
], 'Cancel before travel: zero demo due. Decline repair: agreed inspection and travel only.')
diagram('data-model.png','Current stored booking model',[
 ['Booking ID','Customer ID','Technician ID'],
 ['Service + issue','Village + PIN + landmark','Requested visit window'],
 ['Lifecycle status','Payment status','Created and updated times'],
 ['Fee snapshot','Estimate + approval time','Completion + rating'],
 ['History entries','Receipt reference','User retry keys']
], 'Catalog and technicians are code-defined samples. Settings and bookings persist in local JSON.')
diagram('production.png','Proposed production deployment boundaries',[
 ['Customer PWA','Technician PWA','Owner dashboard'],
 ['HTTPS API + verified sessions\nTenant and booking authorization on every command'],
 ['Booking + dispatch','Quote + payment','Notification outbox'],
 ['Relational database\nTransactions, versions and unique event keys'],
 ['Server maps adapter','Server payment adapter','SMS and push adapter']
], 'Planned system. Provider keys and signed payment verification remain on the server.')

styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='DocTitle',fontName='Helvetica-Bold',fontSize=25,leading=31,spaceAfter=18,textColor=colors.black))
styles.add(ParagraphStyle(name='Head',fontName='Helvetica-Bold',fontSize=18,leading=23,spaceBefore=8,spaceAfter=15,textColor=colors.black))
styles.add(ParagraphStyle(name='Copy',fontName='Helvetica',fontSize=10.7,leading=16,spaceAfter=11,textColor=colors.HexColor(ink)))
styles.add(ParagraphStyle(name='Caption2',fontName='Helvetica',fontSize=9,leading=13,spaceBefore=7,spaceAfter=14,textColor=colors.HexColor(gray)))
styles.add(ParagraphStyle(name='Kicker',fontName='Helvetica-Bold',fontSize=9,leading=12,spaceAfter=12,textColor=colors.HexColor(gray)))
text=(ROOT/'ARCHITECTURE.md').read_text(encoding='utf8')
sections=re.split(r'^## ',text,flags=re.M)[1:]
story=[Paragraph('GRAMIN / PRODUCT AND ENGINEERING / 16 SEPTEMBER 2026',styles['Kicker']),Paragraph('Gramin app design and architecture',styles['DocTitle'])]
newpage={'Implemented local architecture','Customer experience','Owner dispatch experience','Technician experience','Booking lifecycle and money','Persistent model and API contract','Rural operation and accessibility','Production architecture and access boundaries','Implementation status','Validation and review guide','Phased delivery roadmap'}
for section in sections:
    heading,body=section.split('\n',1)
    if heading in newpage:story.append(PageBreak())
    story.append(Paragraph(escape(heading),styles['Head']))
    for para in body.strip().split('\n\n'):
        m=re.fullmatch(r'!\[(.*?)\]\((.*?)\)',para.strip())
        if m:
            p=ROOT/m.group(2)
            if not p.exists():continue
            crops={'customer.png':(120,230,1330,805),'admin.png':(120,230,1330,1050),'technician.png':(120,230,1330,1050)}
            if p.name in crops:
                crop=Image.open(p).crop(crops[p.name]);p=IMG/(p.stem+'-detail.png');crop.save(p)
            iw,ih=Image.open(p).size
            maxh=325 if 'architecture' in p.name or p.name in ['production.png','lifecycle.png','data-model.png'] else 320
            if p.name=='mobile.png':
                # Use the first mobile viewport rather than shrink the full scrolling page.
                mobile=Image.open(p);mobile.crop((0,0,mobile.width,min(844,mobile.height))).save(IMG/'mobile-viewport.png');p=IMG/'mobile-viewport.png';iw,ih=Image.open(p).size
            scale=min(475/iw,maxh/ih)
            story.append(RLImage(str(p),width=iw*scale,height=ih*scale,hAlign='LEFT'))
            kind='Architecture diagram' if p.name in ['architecture.png','production.png','lifecycle.png','data-model.png'] else 'Actual local prototype screenshot with sample data'
            story.append(Paragraph(escape(kind+' — '+m.group(1)).replace('—','-'),styles['Caption2']))
        else:
            safe=escape(para.replace('\n',' '))
            safe=re.sub(r'(https://\S+)',r'<link href="\1" color="#246353">India Post source listing</link>',safe)
            story.append(Paragraph(safe,styles['Copy']))

story.append(PageBreak())
story.append(Paragraph('Estimate approval and payment screens',styles['Head']))
story.append(Paragraph('The customer approves the itemised estimate before repair. A separate receipt confirms the simulated payment after completion. These cropped screenshots show actual local UI states; no money was transferred.',styles['Copy']))
for name,box,caption in [('estimate.png',(132,886,822,1370),'Customer estimate approval with a total of INR 749'),('completion.png',(132,1220,822,1740),'Completed visit and simulated payment receipt')]:
    p=IMG/name
    if p.exists():
        im=Image.open(p)
        if name=='completion.png':
            # Receipt appears below the quote card; retain the lower page content.
            box=(132,max(880,im.height-680),822,im.height-125)
        crop=im.crop(box);dest=IMG/(p.stem+'-detail.png');crop.save(dest)
        scale=min(465/crop.width,230/crop.height)
        story.append(RLImage(str(dest),width=crop.width*scale,height=crop.height*scale,hAlign='LEFT'))
        story.append(Paragraph(caption+' - actual prototype crop',styles['Caption2']))

def page(canvas,doc):
    canvas.saveState();canvas.setFont('Helvetica',8);canvas.setFillColor(colors.HexColor(gray));canvas.drawString(44,27,'GRAMIN   /   LOCAL PROTOTYPE AND PRODUCTION PLAN');canvas.drawRightString(551,27,str(doc.page));canvas.restoreState()
pdf=OUT/'Gramin app design and architecture.pdf'
SimpleDocTemplate(str(pdf),pagesize=(595.28,841.89),rightMargin=44,leftMargin=44,topMargin=42,bottomMargin=46,title='Gramin app design and architecture',author='Gramin project').build(story,onFirstPage=page,onLaterPages=page)
print(pdf)
