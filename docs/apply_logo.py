from pathlib import Path
p=Path('dist/index.html');s=p.read_text(encoding='utf8');s=s.replace('<span class="brand-icon">⌂</span>','<img class="brand-logo" src="/assets/gramin-logo.png" alt="Gramin home services logo" width="52" height="52">');p.write_text(s,encoding='utf8')
p=Path('dist/style.css');s=p.read_text(encoding='utf8');s+='\n.brand-logo{width:52px;height:52px;object-fit:contain;flex-shrink:0;background:white}\n';p.write_text(s,encoding='utf8')
p=Path('docs/LAUNCH-TASKS.md');s=p.read_text(encoding='utf8');s=s.replace('- [ ] Create the requested logo — initial generation was interrupted before a result was returned','- [x] Create the requested logo and add it to the prototype header');p.write_text(s,encoding='utf8')
