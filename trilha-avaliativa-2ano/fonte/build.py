import json,re
URL='https://script.google.com/macros/s/AKfycbxsAYe_k9HNaHTBziw-hGePcLxp8Gqq0eW1a0M-lSfLuQwInHaCY2OdQwAiDT-OBqMl/exec'
imgs=open('img/imgs.json').read()
banco=open('banco.js').read().replace("if(typeof module!=='undefined')module.exports={LESSONS,mkR,hash,fmt,FT,tabelaFatores,triSVG};","")
a=open('app.template.html').read()
a=a.replace("if(A.fim||A.env||$('ov').innerHTML.indexOf('troca')>=0&&G.away)return;","if(A.fim||A.env||G.away)return;")
a=a.replace('@@URL@@',URL).replace('@@IMGS@@',imgs).replace('@@BANCO@@',banco)
open('index.html','w').write(a)
p=open('painel.template.html').read().replace('@@URL@@',URL)
open('painel.html','w').write(p)
print(len(a)//1024,'KB index;',len(p)//1024,'KB painel')
