const {JSDOM}=require('/tmp/jt/node_modules/jsdom');const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('/home/claude/trilha/apps-script.gs','utf8');
/* ---- mock Apps Script ---- */
function mkSheet(name){const s={name,rows:[],getName(){return this.name},setName(n){this.name=n},getLastRow(){return this.rows.length},
 appendRow(r){this.rows.push(r.slice())},getDataRange(){const me=this;return{getValues(){return me.rows.map(r=>r.slice())}}},
 setFrozenRows(){}, getRange(r,c,nr,nc){const me=this;const o={getValue(){return(me.rows[r-1]||[])[c-1]||''},setValue(v){while(me.rows.length<r)me.rows.push([]);me.rows[r-1][c-1]=v},setValues(v){v.forEach((row,i)=>{while(me.rows.length<r+i)me.rows.push([]);row.forEach((x,j)=>me.rows[r-1+i][c-1+j]=x)})},setNumberFormat(){return o},setFontWeight(){return o},setBackground(){return o}};return o}};return s}
const sheets=[mkSheet('Sheet1')];sheets[0].rows.push(['Nome','Turma']);
const ctx={SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:n=>sheets.find(s=>s.name===n)||null,getSheets:()=>sheets,insertSheet:n=>{const s=mkSheet(n);sheets.push(s);return s}})},
 LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},Utilities:{formatDate:(d)=>d.toISOString().slice(5,16)},
 ContentService:{MimeType:{JAVASCRIPT:'js',JSON:'json'},createTextOutput:t=>({t,setMimeType(){return this}})},console};
vm.createContext(ctx);vm.runInContext(code,ctx);
function server(params){const out=ctx.doGet({parameter:params});const t=out.t;return JSON.parse(t.replace(/^[\w.$]+\(/,'').replace(/\);$/,''))}
const log=[];
/* ---- jsdom helpers ---- */
const html=fs.readFileSync('/home/claude/trilha/index.html','utf8');
function mk(){return new Promise(res=>{const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://t.netlify.app/',beforeParse(w){
 w.__off=0;const RD=w.Date;function D(...a){return a.length?new RD(...a):new RD(RD.now()+w.__off)}D.now=()=>RD.now()+w.__off;D.prototype=RD.prototype;w.Date=D;
 const ap=w.Node.prototype.appendChild;w.Node.prototype.appendChild=function(n){if(n.tagName==='SCRIPT'&&n.src&&n.src.indexOf('script.google.com')>=0){const u=new URL(n.src),p=Object.fromEntries(u.searchParams);const cb=p.cb;let r;try{r=server(p)}catch(e){r={ok:false,erro:String(e)}}log.push([p.a,p.tp||'',p.d||'']);setTimeout(()=>w[cb]&&w[cb](r),5);return n}return ap.call(this,n)};
 w.localStorage;}});setTimeout(()=>res(dom),200)})}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function fill(w,nome,turma){const d=w.document;d.getElementById('nm').value=nome;d.getElementById('tm').value=turma;d.getElementById('go').click();await wait(50)}
async function aula(w,n,plano){/* plano(i)->'ok'|'bad' */const d=w.document;for(let i=0;;i++){await wait(10);const A=w.S.au[n];if(!d.getElementById('rsp'))break;const idx=A.i,q=w.getQ(n,idx);const bad=plano(idx)==='bad';
  if(q.t==='mc'){const k=bad?(q.ci+1)%4:q.ci;d.querySelectorAll('.opt')[k].click()}else d.getElementById('num').value=String(bad?q.a+7:q.a).replace('.',',').replace(/^-/,'-');
  w.__off+=70000;await wait(620);const b=d.getElementById('rsp');if(b.disabled){console.log('BOTÃO NÃO LIBEROU q',idx+1,'aula',n);return false}b.click();await wait(20);
  d.getElementById('px').click();await wait(30);
  if(d.querySelector('#ov .ov [role],#ov .ov')&&d.getElementById('vt')){w.__off+=70000;await wait(650);const v=d.getElementById('vt');if(v.disabled){console.log('trava não liberou');return false}log.push(['TRAVA_OK',idx+1]);v.click();await wait(20)}}
 return true}

async function gab(w,n,bad3){const d=w.document;d.querySelector('button[data-v="A"]').click();await wait(10);d.getElementById('ini').click();await wait(30);
 const N=w.LESSONS[n-1].g.length;for(let i=0;i<N;i++){const q=w.getQ(n,i),bad=bad3&&i<3;if(q.t==='mc'){d.querySelector('.opt[data-q="'+i+'"][data-k="'+(bad?(q.ci+1)%4:q.ci)+'"]').click()}else{const f=d.querySelector('input[data-q="'+i+'"]');f.value=String(bad?q.a+7:q.a).replace('.',',');f.dispatchEvent(new w.Event('input'))}}
 const b0=d.getElementById('env');if(!b0.disabled){console.log('envio liberou antes do tempo mínimo');return false}
 w.__off+=700000;await wait(1200);const b=d.getElementById('env');if(b.disabled){console.log('envio não liberou');return false}b.click();await wait(40);return true}
(async()=>{let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FALHA:',m)}else console.log('ok:',m)};
 /* ===== Liberação ===== */
 const wl=(await mk()).window;await fill(wl,'Teste Lock','2º Ano A');await wait(100);
 ok(!wl.document.querySelector('button[data-n]'),'sem liberação: nenhuma aula abre');
 ok(wl.document.getElementById('app').innerHTML.indexOf('Aguardando liberação')>=0,'mostra aguardando liberação');
 ok(server({a:'liberar',s:'errada',au:1,v:1}).ok===false,'liberar com senha errada é recusado');
 ok(server({a:'config'}).lib[1]===false,'config: aula 1 fechada por padrão');
 ok(server({a:'liberar',s:'MUDE_ESTA_SENHA',au:1,v:1}).lib[1]===true,'liberar aula 1');
 wl.document.querySelector('#app').innerHTML='';wl.menu(1);wl.__off+=0;await wait(10);
 await new Promise(r=>{wl.carregaLib(r)});wl.menu(1);
 ok(!!wl.document.querySelector('button[data-n="1"]')&&!wl.document.querySelector('button[data-n="2"]'),'só a aula 1 liberada aparece aberta');
 ok(server({a:'liberar',s:'MUDE_ESTA_SENHA',au:1,v:0}).lib[1]===false,'fechar aula 1');
 [1,2,3,4,5].forEach(n=>server({a:'liberar',s:'MUDE_ESTA_SENHA',au:n,v:1}));
 ok(server({a:'painel',s:'MUDE_ESTA_SENHA'}).lib[5]===true,'painel devolve estado de liberação');
 /* ===== Aluno 1: Aula 1 plugada com 3 erros seguidos nas questões 3,4,5 ===== */
 const w1=(await mk()).window;await fill(w1,'Ana Silva','2º Ano A');
 ok(w1.document.getElementById('app').innerHTML.indexOf('Mural do caso')>=0,'mural abre após cadastro');
 w1.document.querySelector('button[data-n="1"]').click();await wait(20);w1.document.getElementById('ini').click();await wait(30);
 /* troca de tela */
 Object.defineProperty(w1.document,'hidden',{value:true,configurable:true});w1.document.dispatchEvent(new w1.Event('visibilitychange'));await wait(30);
 ok(w1.document.getElementById('ov').innerHTML.indexOf('Você saiu da tela')>=0,'overlay de troca de tela aparece');
 ok(log.some(l=>l[0]==='evento'&&l[1]==='troca_tela'),'evento troca_tela enviado ao professor');
 w1.__off+=7000;Object.defineProperty(w1.document,'hidden',{value:false,configurable:true});await wait(500);const vb=w1.document.getElementById('vb');ok(vb&&!vb.disabled,'botão Voltar libera após espera');vb.click();await wait(20);
 ok(await aula(w1,1,i=>(i>=2&&i<=4)?'bad':'ok'),'aula 1 percorrida');await wait(80);
 ok(log.some(l=>l[0]==='TRAVA_OK'),'trava anti-chute acionada após 3 erros seguidos');
 ok(log.some(l=>l[0]==='evento'&&l[1]==='trava_antichute'),'evento trava enviado');
 const A1=w1.S.au[1];ok(A1.env&&A1.env.acertos===13,'13 acertos registrados (obtido '+(A1.env&&A1.env.acertos)+')');ok(A1.env&&Math.abs(A1.env.pontos-1.63)<0.011,'pontos 1,63 (obtido '+(A1.env&&A1.env.pontos)+')');
 ok(A1.tr===1,'1 troca de tela contabilizada');ok(A1.lk===1,'1 trava contabilizada');
 ok(w1.document.getElementById('app').innerHTML.indexOf('Pista 1')>=0,'pista 1 liberada no resultado');
 /* ===== Dupla: aluna Ana (W1) cria código; Bia (W2) entra ===== */
 const w2=(await mk()).window;await fill(w2,'Bia Souza','2º Ano A');
 w1.document.getElementById('vm').click();await wait(20);w1.document.querySelector('button[data-n="2"]').click();await wait(30);
 ok(w1.document.getElementById('app').innerHTML.indexOf('Formar a dupla')>=0,'aula 2 exige dupla');
 w1.document.getElementById('bg').click();await wait(60);const cod=w1.S.cod;ok(/^[A-Z0-9]{5}$/.test(cod),'código da dupla gerado: '+cod);
 w2.document.querySelector('button[data-n="2"]').click();await wait(20);
 w2.document.getElementById('cc').value='ZZZZZ';w2.document.getElementById('be').click();await wait(60);ok(w2.document.getElementById('ce').textContent.indexOf('não encontrado')>=0,'código inválido rejeitado');
 w2.document.getElementById('cc').value=cod.toLowerCase();w2.document.getElementById('be').click();await wait(80);
 ok(w2.S.par==='Ana Silva','Bia pareada com Ana');
 await wait(4300);ok(w1.S.par==='Bia Souza','Ana recebeu o par por polling');
 /* mesmas questões para os dois */
 w1.document.getElementById('app').innerHTML.length;let same=true;for(let i=0;i<12;i++){if(w1.getQ(2,i).en!==w2.getQ(2,i).en)same=false}ok(same,'dupla recebe exatamente as mesmas questões');
 /* Ana faz a aula 2 inteira certa; Bia depois tenta enviar: deve receber dup */
 ok(await gab(w1,2,false),'aula 2 (Ana): gabarito preenchido e enviado após o tempo mínimo');await wait(80);
 ok(w1.S.au[2].env&&w1.S.au[2].env.pontos===2,'Ana: 2,0 pontos (obtido '+(w1.S.au[2].env&&w1.S.au[2].env.pontos)+')');
 {const bn=w2.document.querySelector('button[data-n="2"]');if(bn){bn.click();await wait(30)}}
 ok(await gab(w2,2,true),'aula 2 (Bia): gabarito com 3 erros enviado');await wait(80);ok(w2.document.getElementById('app').innerHTML.indexOf('Conferência das respostas')>=0,'Bia vê a conferência das respostas');
 ok(w2.S.au[2].env&&w2.S.au[2].env.dup===true&&w2.S.au[2].env.pontos===2,'Bia recebe a nota da dupla já lançada (dup, 2,0)');
 /* ===== Planilha ===== */
 const res=sheets.find(s=>s.name==='Resumo');ok(!!res,'aba Resumo (primeira aba renomeada)');
 const rows=res.rows.slice(1);const ana=rows.find(r=>r[0]==='Ana Silva'),bia=rows.find(r=>r[0]==='Bia Souza');
 ok(ana&&Math.abs(ana[8]-3.63)<0.011,'Resumo Ana: nota 3,63 (obtido '+(ana&&ana[8])+')');ok(bia&&bia[4]===2&&Math.abs(bia[8]-2)<0.011,'Resumo Bia: aula 2 = 2,0 pela dupla (obtido '+(bia&&bia[4])+')');
 ok(ana&&ana[9]===1&&ana[10]===1,'Resumo Ana registra 1 troca e 1 trava');
 const p=server({a:'painel',s:'errada'});ok(p.ok===false&&p.erro==='senha','painel recusa senha errada');
 const p2=server({a:'painel',s:'MUDE_ESTA_SENHA'});ok(p2.ok&&p2.resumo.length===2&&p2.eventos.length>3,'painel devolve dados com a senha');
 const rep=server({a:'aula',n:'Ana Silva',t:'2º Ano A',au:1,r:'1111111111111111'});ok(rep.dup===true&&rep.pontos<2,'reenvio da mesma aula não altera a nota');
 const cheia=server({a:'dupla_entrar',cod:cod,n:'Carlos Lima',t:'2º Ano A'});ok(cheia.erro==='cheia','terceiro aluno não entra em dupla completa');
 console.log(fails?'\n'+fails+' FALHAS':'\nTUDO OK');process.exit(fails?1:0)})();
