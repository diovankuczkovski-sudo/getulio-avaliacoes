var B=require('./banco.js'),bad=0,n=0;
B.LESSONS.forEach(function(L){
  console.log('Aula',L.n,L.g.length,'questões');
  L.g.forEach(function(g,qi){
    for(var s=1;s<=400;s++){
      var R=B.mkR(B.hash('x'+s)+L.n*1000+qi*7919),q;
      try{q=g(R)}catch(e){console.log('ERRO A'+L.n+'Q'+(qi+1),s,e.message);bad++;break}
      n++;
      var why=null;
      if(q.t==='mc'){if(q.o.length!==4)why='opções='+q.o.length;else if(new Set(q.o).size!==4)why='dup';}
      else{if(!isFinite(q.a))why='NaN';if(!(q.tol>0))why='tol';}
      if(q.b==null||q.b>=L.blocos.length)why='bloco';
      if(/NaN|undefined|Infinity/.test(q.en+q.sol))why='texto: '+(q.en+q.sol).match(/.{0,30}(NaN|undefined|Infinity).{0,20}/)[0];
      if(why){console.log('PROBLEMA A'+L.n+'Q'+(qi+1),'seed',s,why);bad++;break}
    }
  });
});
console.log('verificadas',n,'problemas',bad);
// verificações independentes
var L=B.LESSONS, fails=0;
function get(a,q,s){return L[a-1].g[q-1](B.mkR(B.hash('y'+s)+a*1000+(q-1)*7919))}
for(var s=1;s<=300;s++){
  // A1 Q6: a x + b = c, extrai números do enunciado
  var q=get(1,6,s),m=q.en.match(/(\d+)x \+ (\d+) = (\d+)/);if(m&&m[1]*q.a+ +m[2]!=+m[3]){fails++;console.log('A1Q6',s)}
  q=get(1,7,s);m=q.en.match(/x\/(\d+) \+ x\/(\d+) = (\d+)/);if(m&&Math.abs(q.a/m[1]+q.a/m[2]-m[3])>1e-9){fails++;console.log('A1Q7',s)}
  q=get(1,13,s);m=q.en.match(/x \+ (\d+)<\/b> m.*<b>(\d+) m²/);if(m&&q.a*(q.a+ +m[1])!=+m[2]){fails++;console.log('A1Q13',s)}
  q=get(1,12,s);m=q.en.match(/(\d+)x² = (\d+)/);if(m&&m[1]*q.a*q.a!=+m[2]){fails++;console.log('A1Q12',s)}
  q=get(1,11,s);m=q.en.match(/<b>(.*) = 0<\/b>/);
  q=get(5,15,s);if(q.sol.indexOf('Média')<0)fails++;
  var mm=q.sol.match(/variou ([\d,]+)\).*variou ([\d,]+)\)/);if(mm){var dm=+mm[1].replace(',','.'),dd=+mm[2].replace(',','.');if(!(dm>dd)){fails++;console.log('A5Q15 mediana mudou mais',s,mm[1],mm[2])}}
  q=get(5,12,s);if(q.o.length!==4)fails++;
  q=get(3,6,s);m=q.en.match(/a = <b>(\d+)<\/b>.*m = <b>(\d+)<\/b>/);if(m&&q.a*q.a!=m[1]*m[2]){fails++;console.log('A3Q6',s)}
  q=get(2,5,s);
}
console.log('independentes: falhas',fails);
