var SENHA = 'MUDE_ESTA_SENHA';          // senha do painel do professor
var PTS = 2;                             // pontos por aula (5 aulas = 10)
var TOT = {1:16, 2:12, 3:16, 4:12, 5:16}; // nº de questões por aula
var DUPLA_AULAS = [2, 4];                // aulas desplugadas em dupla
var TZ = 'America/Cuiaba';
var H = {
  Resumo: ['Nome','Turma','Dupla','Aula 1','Aula 2','Aula 3','Aula 4','Aula 5','Nota (0-10)','Trocas de tela','Travas anti-chute','Tempo parado (min)','Última atualização'],
  Aulas: ['Data/hora','Nome','Turma','Dupla','Aula','Acertos','Total','Pontos','Tempo ativo (min)','Tempo parado (min)','Trocas de tela','Travas','Respostas (bits)','Enviado por'],
  Eventos: ['Data/hora','Nome','Turma','Aula','Tipo','Detalhe'],
  Duplas: ['Código','Aluno A','Turma','Aluno B','Criada em','Entrou em'],
  Config: ['Aula','Liberada','Atualizado']
};

function doGet(e) {
  var p = (e && e.parameter) || {}, out;
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    switch (p.a) {
      case 'dupla_nova': out = duplaNova_(p); break;
      case 'dupla_entrar': out = duplaEntrar_(p); break;
      case 'dupla_ver': out = duplaVer_(p); break;
      case 'evento': out = evento_(p); break;
      case 'aula': out = aula_(p); break;
      case 'painel': out = painel_(p); break;
      case 'config': out = config_(); break;
      case 'liberar': out = liberar_(p); break;
      case 'ping': out = {ok: true}; break;
      default: out = {ok: false, erro: 'acao'};
    }
  } catch (err) {
    out = {ok: false, erro: String(err)};
  } finally {
    lock.releaseLock();
  }
  var js = JSON.stringify(out);
  var cb = String(p.cb || '').replace(/[^\w.$]/g, '');
  return ContentService.createTextOutput(cb ? cb + '(' + js + ');' : js)
    .setMimeType(cb ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function aba_(nome) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(nome);
  if (!sh && nome === 'Resumo') {
    var f = ss.getSheets()[0];
    if (String(f.getRange(1, 1).getValue()) === 'Nome') { f.setName('Resumo'); sh = f; }
  }
  if (!sh) sh = ss.insertSheet(nome);
  if (sh.getLastRow() === 0) sh.appendRow(H[nome]);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, H[nome].length).setFontWeight('bold').setBackground('#FFF3BF');
  return sh;
}
function limpa_(s) {
  s = String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').substring(0, 120).trim();
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function chave_(s) { return String(s).toLowerCase().replace(/\s+/g, ' ').trim(); }
function fmt_(d) { return d instanceof Date ? Utilities.formatDate(d, TZ, 'dd/MM HH:mm') : d; }
function codigo_() {
  var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
  for (var i = 0; i < 5; i++) s += c.charAt(Math.floor(Math.random() * c.length));
  return s;
}

// ---------- duplas ----------
function achaDupla_(sh, cod) {
  var d = sh.getDataRange().getValues();
  for (var i = 1; i < d.length; i++) if (String(d[i][0]) === cod) return {linha: i + 1, v: d[i]};
  return null;
}
function duplaNova_(p) {
  var nome = limpa_(p.n), turma = limpa_(p.t);
  if (!nome || !turma) return {ok: false, erro: 'dados'};
  var sh = aba_('Duplas'), cod;
  do { cod = codigo_(); } while (achaDupla_(sh, cod));
  sh.appendRow([cod, nome, turma, '', new Date(), '']);
  return {ok: true, cod: cod};
}
function duplaEntrar_(p) {
  var cod = String(p.cod || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  var nome = limpa_(p.n), turma = limpa_(p.t);
  var sh = aba_('Duplas'), r = achaDupla_(sh, cod);
  if (!r) return {ok: false, erro: 'codigo'};
  if (chave_(r.v[1]) === chave_(nome)) return {ok: false, erro: 'mesmo'};
  if (r.v[3] && chave_(r.v[3]) !== chave_(nome)) return {ok: false, erro: 'cheia'};
  if (chave_(r.v[2]) !== chave_(turma)) return {ok: false, erro: 'turma'};
  sh.getRange(r.linha, 4).setValue(nome);
  sh.getRange(r.linha, 6).setValue(new Date());
  return {ok: true, parceiro: r.v[1]};
}
function duplaVer_(p) {
  var cod = String(p.cod || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  var r = achaDupla_(aba_('Duplas'), cod);
  if (!r) return {ok: false, erro: 'codigo'};
  return {ok: true, a: r.v[1], b: r.v[3]};
}
function parceiro_(cod, nome) {
  var r = achaDupla_(aba_('Duplas'), String(cod || '').toUpperCase());
  if (!r) return '';
  if (chave_(r.v[1]) === chave_(nome)) return r.v[3] || '';
  if (chave_(r.v[3]) === chave_(nome)) return r.v[1] || '';
  return '';
}

// ---------- eventos e aulas ----------
function evento_(p) {
  aba_('Eventos').appendRow([new Date(), limpa_(p.n), limpa_(p.t), Number(p.au) || '', limpa_(p.tp), limpa_(p.d)]);
  return {ok: true};
}
function aula_(p) {
  var au = Number(p.au), tot = TOT[au];
  if (!tot) return {ok: false, erro: 'aula'};
  var nome = limpa_(p.n), turma = limpa_(p.t);
  if (!nome || !turma) return {ok: false, erro: 'dados'};
  var bits = String(p.r || '').replace(/[^01]/g, '').substring(0, tot);
  var ac = (bits.match(/1/g) || []).length;
  var pts = Math.round(ac / tot * PTS * 100) / 100;
  var cod = String(p.cod || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  var par = (DUPLA_AULAS.indexOf(au) >= 0 && cod) ? parceiro_(cod, nome) : '';
  var sh = aba_('Aulas'), d = sh.getDataRange().getValues();
  for (var i = 1; i < d.length; i++) {
    if (chave_(d[i][1]) === chave_(nome) && chave_(d[i][2]) === chave_(turma) && Number(d[i][4]) === au)
      return {ok: true, dup: true, pontos: Number(d[i][7]), acertos: Number(d[i][5]), total: Number(d[i][6])};
  }
  var tAtivo = Math.round((Number(p.ta) || 0) / 60 * 10) / 10;
  var tParado = Math.round((Number(p.tp) || 0) / 60 * 10) / 10;
  var tr = Number(p.tr) || 0, lk = Number(p.lk) || 0;
  var now = new Date();
  sh.appendRow([now, nome, turma, cod, au, ac, tot, pts, tAtivo, tParado, tr, lk, "'" + bits, nome]);
  sh.getRange(sh.getLastRow(), 13).setNumberFormat('@');
  recalcula_(nome, turma, cod);
  if (par) {
    sh.appendRow([now, par, turma, cod, au, ac, tot, pts, 0, 0, 0, 0, "'" + bits, 'dupla de ' + nome]);
    sh.getRange(sh.getLastRow(), 13).setNumberFormat('@');
    recalcula_(par, turma, cod);
  }
  return {ok: true, dup: false, pontos: pts, acertos: ac, total: tot, parceiro: par};
}
function recalcula_(nome, turma, cod) {
  var d = aba_('Aulas').getDataRange().getValues();
  var pts = [0, 0, 0, 0, 0], tem = [0, 0, 0, 0, 0], tr = 0, lk = 0, pa = 0;
  for (var i = 1; i < d.length; i++) {
    if (chave_(d[i][1]) !== chave_(nome) || chave_(d[i][2]) !== chave_(turma)) continue;
    var a = Number(d[i][4]) - 1;
    if (a >= 0 && a < 5) { pts[a] = Number(d[i][7]); tem[a] = 1; }
    pa += Number(d[i][9]) || 0; tr += Number(d[i][10]) || 0; lk += Number(d[i][11]) || 0;
  }
  var soma = 0; for (var k = 0; k < 5; k++) soma += pts[k];
  var row = [nome, turma, cod || '', tem[0] ? pts[0] : '', tem[1] ? pts[1] : '', tem[2] ? pts[2] : '', tem[3] ? pts[3] : '', tem[4] ? pts[4] : '',
    Math.round(soma * 100) / 100, tr, lk, Math.round(pa * 10) / 10, new Date()];
  var sh = aba_('Resumo'), r = sh.getDataRange().getValues(), linha = 0;
  for (var j = 1; j < r.length; j++) if (chave_(r[j][0]) === chave_(nome) && chave_(r[j][1]) === chave_(turma)) { linha = j + 1; break; }
  if (!linha) { sh.appendRow(row); linha = sh.getLastRow(); }
  else sh.getRange(linha, 1, 1, row.length).setValues([row]);
  sh.getRange(linha, 13).setNumberFormat('dd/MM/yyyy HH:mm');
}

// ---------- painel do professor ----------
function pega_(nome, max) {
  var d = aba_(nome).getDataRange().getValues();
  var corpo = d.slice(1);
  if (max && corpo.length > max) corpo = corpo.slice(corpo.length - max);
  return corpo.map(function (l) { return l.map(fmt_); });
}
function painel_(p) {
  if (String(p.s) !== SENHA) return {ok: false, erro: 'senha'};
  return {ok: true, lib: config_().lib, tot: TOT, resumo: pega_('Resumo', 500), aulas: pega_('Aulas', 800), eventos: pega_('Eventos', 600), duplas: pega_('Duplas', 300)};
}

// ---------- liberação das aulas (controlada pelo painel do professor) ----------
function config_() {
  var d = aba_('Config').getDataRange().getValues(), lib = {1: false, 2: false, 3: false, 4: false, 5: false};
  for (var i = 1; i < d.length; i++) lib[Number(d[i][0])] = String(d[i][1]) === 'SIM';
  return {ok: true, lib: lib};
}
function liberar_(p) {
  if (String(p.s) !== SENHA) return {ok: false, erro: 'senha'};
  var au = Number(p.au);
  if (!TOT[au]) return {ok: false, erro: 'aula'};
  var v = String(p.v) === '1' ? 'SIM' : 'NÃO', sh = aba_('Config'), d = sh.getDataRange().getValues(), linha = 0;
  for (var i = 1; i < d.length; i++) if (Number(d[i][0]) === au) { linha = i + 1; break; }
  if (!linha) sh.appendRow([au, v, new Date()]);
  else { sh.getRange(linha, 2).setValue(v); sh.getRange(linha, 3).setValue(new Date()); }
  aba_('Eventos').appendRow([new Date(), 'professor', '', au, 'liberacao', v === 'SIM' ? 'aula liberada' : 'aula fechada']);
  return config_();
}
