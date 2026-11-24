const B=require('./banco.js'),fs=require('fs');
const css='<style>body{font:15px/1.45 Arial,sans-serif;margin:0;color:#111}.pg{padding:18px 26px;page-break-after:always}h1{font-size:20px;margin:0 0 4px}h3{margin:12px 0 4px;font-size:15px}.cab{display:flex;justify-content:space-between;border:2px solid #111;padding:6px 10px;margin-bottom:8px}.q{border:1.5px solid #111;border-radius:6px;padding:8px 10px;margin:8px 0;page-break-inside:avoid;min-height:110px}table{border-collapse:collapse}td,th{border:1px solid #111;padding:2px 8px}svg.graf{max-width:330px}.sm{font-size:12px;color:#444}.ver{font-size:30px;font-weight:bold;border:3px solid #111;padding:0 14px;border-radius:8px}.k td{vertical-align:top}</style>';
function getQ(n,L,i){const R=B.mkR(B.hash('ver'+L)+n*1000+i*7919),q=B.LESSONS[n-1].g[i](R);if(q.t==='mc'){const c=q.o[0];q.o=R.sh(q.o);q.ci=q.o.indexOf(c)}return q}
const blk=b=>b.h.replace('@@TABELA@@',B.tabelaFatores()).replace('@@TRI@@',B.triSVG(4,9,6));
function folha(n){const L=B.LESSONS[n-1];let h='<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Aula '+n+' · folha da dupla</title>'+css+'</head><body>';
 for(const v of ['A','B','C','D']){h+='<div class="pg"><div class="cab"><div><h1>Trilha 2º ano · Aula '+n+': '+L.titulo+'</h1><div class="sm">Dupla: ____________________________ e ____________________________ · Turma: ________</div></div><div class="ver">'+v+'</div></div><p class="sm"><b>Versão '+v+'.</b> Resolvam em dupla, na folha, sem calculadora. Depois digitem só as respostas finais no gabarito do site (escolham a letra '+v+').</p>';
  L.blocos.forEach(b=>{h+='<h3>'+b.t+'</h3>'+blk(b)});
  for(let i=0;i<L.g.length;i++){const q=getQ(n,v,i);h+='<div class="q"><b>'+(i+1)+'.</b> '+q.en+(q.svg||'')+(q.t==='mc'?'<br>'+q.o.map((o,k)=>'<b>'+'ABCD'[k]+')</b> '+o).join(' &nbsp;&nbsp; '):'<br><span class="sm">Resposta'+(q.un?' ('+q.un+')':'')+': ________________</span>')+'<br><br><span class="sm">Resolução:</span></div>'}
  h+='</div>'}
 fs.writeFileSync('dossie-aula'+n+'.html',h+'</body></html>')}
function gab(){let h='<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Gabarito do professor · aulas desplugadas</title>'+css+'</head><body><div class="pg"><h1>Gabarito do professor · aulas desplugadas (2 e 4)</h1><p class="sm">Uso exclusivo do professor. Não imprimir para os alunos.</p>';
 for(const n of [2,4]){const L=B.LESSONS[n-1];h+='<h3>Aula '+n+' · '+L.titulo+'</h3><table class="k"><tr><th>Q</th>'+['A','B','C','D'].map(v=>'<th>Versão '+v+'</th>').join('')+'</tr>';
  for(let i=0;i<L.g.length;i++){h+='<tr><td><b>'+(i+1)+'</b></td>';for(const v of ['A','B','C','D']){const q=getQ(n,v,i);h+='<td>'+(q.t==='mc'?'<b>'+'ABCD'[q.ci]+'</b>':B.fmt(q.a,3)+(q.un?' '+q.un:''))+'</td>'}h+='</tr>'}h+='</table><br>'}
 fs.writeFileSync('gabarito-professor.html',h+'</div></body></html>')}
folha(2);folha(4);gab();console.log('ok')
