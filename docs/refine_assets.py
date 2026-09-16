from pathlib import Path
p=Path('dist/app.js')
s=p.read_text(encoding='utf8')
icons='''const serviceIcon=id=>({ac:'<svg viewBox="0 0 24 24"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M8 4l4 4 4-4M8 20l4-4 4 4"/></svg>',plumbing:'<svg viewBox="0 0 24 24"><path d="M12 3C9 8 5 11 5 15a7 7 0 0 0 14 0c0-4-4-7-7-12Z"/></svg>',electrical:'<svg viewBox="0 0 24 24"><path d="m14 2-9 12h7l-2 8 9-12h-7Z"/></svg>',washing:'<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M4 7h16M7 4.5h2"/><circle cx="12" cy="14" r="4"/></svg>'}[id]);
'''
if 'const serviceIcon=' not in s:s=s.replace('const svc=id=>',icons+'const svc=id=>')
s=s.replace('${s.icon}','${serviceIcon(s.id)}')
p.write_text(s,encoding='utf8')
p=Path('dist/style.css');s=p.read_text(encoding='utf8');s+='\n.icon svg{width:29px;height:29px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}\n';p.write_text(s,encoding='utf8')
p=Path('tests/browser.cjs');s=p.read_text(encoding='utf8');s=s.replace('fullPage:true','fullPage:true,style:"#toast{visibility:hidden}"');p.write_text(s,encoding='utf8')
