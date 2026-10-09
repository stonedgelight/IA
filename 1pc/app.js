/* ~1% · app.js · PT-PT · sem dependências
   Dados em localStorage; sincronização opcional com a folha "Hora Sagrada" (Apps Script Web App, ficheiro hora-sagrada-v3.gs). */
(function () {
  'use strict';

  const VERSAO = '0.1.0';
  const CHAVE = 'umporcento.v1';
  const HORA_SAGRADA = 'Hora sagrada';
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const DIAS_LONGOS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const CORES = ['#b8860b', '#2f6f9f', '#2e7d5b', '#7b4b94', '#c0582b', '#1f8a8a', '#a3772a', '#5a6b8c'];
  const TIPOS_REFLEXAO = ['Identidade', 'Hábitos', 'Semana', '28 dias', '90 dias', 'Anual', 'Integridade'];

  /* ---------- datas ---------- */
  const pad = n => String(n).padStart(2, '0');
  const keyDe = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const dataDe = k => { const p = k.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2], 12, 0, 0); };
  const hojeKey = () => keyDe(new Date());
  const somaDias = (k, n) => keyDe(new Date(dataDe(k).getTime() + n * 86400000));
  const dow = k => dataDe(k).getDay();
  const fmtCurta = k => { const d = dataDe(k); return d.getDate() + ' ' + MESES[d.getMonth()]; };
  const fmtDM = k => k.slice(8, 10) + '/' + k.slice(5, 7);

  /* ---------- regras (iguais ao script da folha) ---------- */
  function parseDias(s) {
    const t = String(s || '').trim().toLowerCase();
    if (!t || t === 'todos' || t === 'todos os dias' || t === 'diário' || t === 'diario') return [0, 1, 2, 3, 4, 5, 6];
    const map = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, 'sáb': 6, sab: 6 };
    const out = [];
    t.split(/[,;\s\/]+/).forEach(p => { const k = p.slice(0, 3); if (map[k] !== undefined && out.indexOf(map[k]) < 0) out.push(map[k]); });
    return out.length ? out : [0, 1, 2, 3, 4, 5, 6];
  }
  const diasTexto = arr => (arr.length === 7 ? 'todos' : arr.slice().sort().map(i => DIAS[i]).join(','));
  function previsto(h, k) {
    if (parseDias(h.dias).indexOf(dow(k)) < 0) return false;
    if (h.inicio && k < h.inicio) return false;
    return true;
  }
  function estado(v, alvo) {
    if (v === '' || v === null || v === undefined) return 'na';
    if (typeof v === 'boolean') return v ? 'feito' : 'falhou';
    if (typeof v === 'number') return v >= alvo ? 'feito' : (v > 0 ? 'parcial' : 'falhou');
    return 'na';
  }
  const votosDe = v => (v === true ? 1 : (typeof v === 'number' ? v : 0));

  /* ---------- estado ---------- */
  const SEMENTES = [
    { nome: HORA_SAGRADA, cor: CORES[0], ativo: true, soLeitura: true, identidade: '', doisMin: 'Ignição + capítulo do dia (20 min). Conta como feito.', intencao: 'Às 9:30, à mesa, abro o Plano na linha de hoje.', empilhar: 'Depois da água e da luz, ignição; depois da ignição, livro; depois do livro, bloco.', sinal: 'Livro aberto na página do dia e tablet carregado, desde a véspera.', tentacao: 'Depois do bloco, o vídeo longo de inspiração. Nunca antes.', tribo: '', ritual: 'A ignição: o mesmo gesto, 3 a 5 min, todos os dias.', friccao: 'Atalho da folha no ecrã inicial.', ambiente: 'Véspera às 23:00: alvo escrito, livro aberto, telemóvel fora do quarto.', decisivo: 'Sentar à mesa às 9:30 antes de abrir qualquer outra coisa.', automacao: 'Calendar 9:30, alarme 9:25, email de véspera 23:05, trigger das 8:05.', recompensa: 'O X na Sequência, dito em voz alta ao acabar.', registo: 'Vem do Form (minuto 55).', parceiro: '', alvo: 1, dias: 'todos', hora: '09:30', inicio: '2026-09-22', nota: 'Hábito-âncora. Registo pelo Form; aqui só se vê.' },
    { nome: 'Em forma: corpo e mente', cor: CORES[4], ativo: true, identidade: 'Bom pai para o meu filho', doisMin: 'Calçar as sapatilhas e sair à rua 5 minutos (conta 1 vez).', intencao: '', empilhar: '', sinal: 'Sapatilhas junto à porta.', tentacao: '', tribo: '', ritual: '', friccao: '', ambiente: '', decisivo: '', automacao: '', recompensa: '', registo: 'Logo a seguir, marco a vez.', parceiro: '', alvo: 2, dias: 'todos', hora: '', inicio: '2026-10-09', nota: 'Na Atoms: "In shape mental and body", 2 vezes/dia.' },
    { nome: 'Respeitar o meu tempo de descanso', cor: CORES[1], ativo: true, identidade: 'Mais paz, força e eficiência durante o dia', doisMin: 'Pousar o telemóvel fora do quarto.', intencao: 'Às 23:00, no quarto: telemóvel fora, luz baixa.', empilhar: 'Depois do email de véspera (23:05).', sinal: 'O email "Hora Sagrada · véspera" é o sinal.', tentacao: 'Depois de respeitar o descanso, posso ver o filme ou a série.', tribo: '', ritual: '', friccao: '', ambiente: 'Alvo de amanhã escrito, livro aberto na página certa.', decisivo: 'Ir para o quarto quando o email chega.', automacao: 'Email automático às 23:05.', recompensa: '', registo: 'Depois de pousar o telemóvel, marco.', parceiro: '', alvo: 1, dias: 'todos', hora: '23:00', inicio: '2026-10-09', nota: 'Na Atoms: "Respect my resting time".' },
    { nome: 'Ver um filme ou série antes de dormir', cor: CORES[3], ativo: true, identidade: 'Feliz, a concluir o dia da melhor forma', doisMin: 'Um episódio curto ou 20 minutos de filme.', intencao: '', empilhar: 'Depois de "Respeitar o meu tempo de descanso".', sinal: '', tentacao: '', tribo: '', ritual: '', friccao: '', ambiente: '', decisivo: '', automacao: '', recompensa: 'É a recompensa do hábito anterior: só desbloqueia depois dele.', registo: 'Marco quando acabar o episódio.', parceiro: '', alvo: 1, dias: 'todos', hora: '', inicio: '2026-10-09', nota: 'Na Atoms: "See a movie or series before sleep", empilhado.' },
    { nome: 'Arrumar a casa', cor: CORES[5], ativo: true, identidade: '', doisMin: 'Dois minutos: uma superfície ou uma divisão.', intencao: '', empilhar: '', sinal: '', tentacao: '', tribo: '', ritual: '', friccao: '', ambiente: '', decisivo: '', automacao: '', recompensa: '', registo: 'Marco quando pousar o pano.', parceiro: '', alvo: 1, dias: 'todos', hora: '', inicio: '2026-10-09', nota: 'Na Atoms: "Clean my house".' },
    { nome: 'Contactar a Avó Carmo', cor: CORES[2], ativo: true, identidade: 'Uma pessoa ainda mais grata', doisMin: 'Uma mensagem ou uma chamada curta.', intencao: '', empilhar: '', sinal: '', tentacao: '', tribo: '', ritual: '', friccao: '', ambiente: '', decisivo: '', automacao: '', recompensa: '', registo: 'Marco ao desligar.', parceiro: '', alvo: 1, dias: 'todos', hora: '', inicio: '2026-10-09', nota: 'Na Atoms: "Contact my Avó Carmo", 6 dias seguidos até 9 out.' },
    { nome: 'Louça na máquina', cor: CORES[7], ativo: true, identidade: 'Uma pessoa mais arrumada', doisMin: 'Pôr o que está no lava-loiça (conta 1 vez).', intencao: 'Depois do pequeno-almoço e depois do jantar, na cozinha.', empilhar: '', sinal: '', tentacao: '', tribo: '', ritual: '', friccao: '', ambiente: '', decisivo: '', automacao: '', recompensa: '', registo: 'Marco 1 ou 2.', parceiro: '', alvo: 2, dias: 'todos', hora: '', inicio: '2026-10-09', nota: 'Na Atoms: "Put the dishes of dish machine", 2 vezes/dia.' },
    { nome: 'Ginásio', cor: CORES[6], ativo: true, identidade: '', doisMin: 'Calçar as sapatilhas e sair de casa.', intencao: '', empilhar: '', sinal: 'Saco do ginásio junto à porta, feito na véspera.', tentacao: '', tribo: '', ritual: '', friccao: '', ambiente: 'Saco preparado na véspera.', decisivo: '', automacao: 'A inscrição é o dispositivo de compromisso.', recompensa: '', registo: 'Depois do duche no ginásio, marco.', parceiro: '', alvo: 1, dias: 'Dom,Seg,Ter,Qua,Qui,Sex', hora: '', inicio: '2026-10-09', nota: 'Todos os dias exceto sábado (convívio). Substitui a caminhada.' }
  ];

  const base = () => ({
    versao: 1,
    perfil: { nome: 'André', identidade: '', inicioScorecard: '2026-10-12', lembreteNoite: '21:30', notificacoes: true },
    habitos: JSON.parse(JSON.stringify(SEMENTES)),
    registos: {},
    minimos: {},
    pendentes: [],
    reflexoes: [],
    scorecard: [
      [1, '', 'Acordar', 'Alarme', '', '', '', ''],
      [2, '', 'Desligar o alarme', '', '', '', '', ''],
      [3, '', '', '', '', '', '', ''],
      [4, '09:25', 'Alarme "Hora sagrada"', 'Relógio', '', '', '', ''],
      [5, '09:30', 'Água + luz', 'Sentar à mesa', '', '', '', ''],
      [6, '09:30', 'Ignição (3 a 5 min, sempre o mesmo gesto)', 'Água + luz', '', '', '', ''],
      [7, '09:35', 'Leitura: capítulo do dia', 'Fim da ignição', '', '', '', ''],
      [8, '09:50', 'Bloco (30 min)', 'Direção escrita', '', '', '', ''],
      [9, '10:20', 'Reflexão + Form', 'Fim do bloco', '', '', '', ''],
      [10, '10:25', 'Alvo de amanhã na folha', 'Form enviado', '', '', '', '']
    ],
    scorecardSujo: true,
    habitosSujos: true,
    licoes: { lidas: {}, notas: {} },
    sync: { url: '', token: '', ultima: '', formUrl: '' },
    ui: { diaSel: hojeKey(), ecra: 'hoje', tema: 'auto' }
  });

  let S = carregar();
  function carregar() {
    try {
      const raw = localStorage.getItem(CHAVE);
      if (!raw) return base();
      const s = JSON.parse(raw);
      const b = base();
      // campos novos em versões futuras
      Object.keys(b).forEach(k => { if (s[k] === undefined) s[k] = b[k]; });
      Object.keys(b.perfil).forEach(k => { if (s.perfil[k] === undefined) s.perfil[k] = b.perfil[k]; });
      Object.keys(b.sync).forEach(k => { if (s.sync[k] === undefined) s.sync[k] = b.sync[k]; });
      s.ui.diaSel = hojeKey();
      return s;
    } catch (e) { return base(); }
  }
  function guardar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch (e) { toast('Sem espaço para guardar.'); } }

  /* ---------- registos ---------- */
  const valorDe = (nome, k) => {
    const r = S.registos[nome];
    if (r && r[k] !== undefined) return r[k];
    const h = habPorNome(nome);
    if (!h || h.soLeitura) return '';                    // sem registo da folha: desconhecido, não falha
    return previsto(h, k) ? (Math.max(1, Number(h.alvo) || 1) > 1 ? 0 : false) : '';
  };
  const habPorNome = nome => S.habitos.find(h => h.nome === nome);

  function registar(nome, k, valor, minimo) {
    const h = habPorNome(nome);
    if (!h || h.soLeitura) return;
    S.registos[nome] = S.registos[nome] || {};
    S.registos[nome][k] = valor;
    S.minimos[nome] = S.minimos[nome] || {};
    if (minimo) S.minimos[nome][k] = true; else delete S.minimos[nome][k];
    S.pendentes = S.pendentes.filter(p => !(p.habito === nome && p.data === k));
    S.pendentes.push({ habito: nome, data: k, valor: valor });
    guardar();
  }

  // resumo de um hábito: sequência, melhor, total, última falha, alerta
  function resumo(h) {
    const alvo = Math.max(1, Number(h.alvo) || 1);
    const hoje = hojeKey();
    const inicio = h.inicio || somaDias(hoje, -120);
    const datas = [];
    for (let k = inicio; k <= hoje; k = somaDias(k, 1)) datas.push(k);
    let total = 0, ultimaFalha = '', seq = 0, melhor = 0, corrente = 0;
    const est = datas.map(k => {
      const v = previsto(h, k) ? valorDe(h.nome, k) : (S.registos[h.nome] && S.registos[h.nome][k] !== undefined ? S.registos[h.nome][k] : '');
      total += votosDe(v);
      return estado(v, alvo);
    });
    est.forEach((e, i) => {
      if (e === 'na') return;
      if (e === 'feito' || e === 'parcial') { corrente++; if (corrente > melhor) melhor = corrente; }
      else { if (datas[i] < hoje) ultimaFalha = datas[i]; corrente = 0; }
    });
    for (let i = est.length - 1; i >= 0; i--) {
      if (est[i] === 'na') continue;
      if (datas[i] === hoje && est[i] === 'falhou') continue;
      if (est[i] === 'feito' || est[i] === 'parcial') seq++; else break;
    }
    // alerta: últimos dois dias previstos antes de hoje
    const passados = [];
    for (let i = est.length - 1; i >= 0 && passados.length < 2; i--) { if (datas[i] >= hoje || est[i] === 'na') continue; passados.push({ k: datas[i], e: est[i] }); }
    let alerta = null;
    if (passados.length && passados[0].e === 'falhou') alerta = (passados.length > 1 && passados[1].e === 'falhou') ? { nivel: 2, dias: [passados[1].k, passados[0].k] } : { nivel: 1, dias: [passados[0].k] };
    return { seq, melhor, total, ultimaFalha, alerta, datas, est };
  }

  function habitosAtivos() { return S.habitos.filter(h => h.ativo); }
  function aposDe(h) {
    const m = String(h.empilhar || '').match(/depois de\s+["«“]?([^"»”.]+)["»”]?/i);
    if (!m) return null;
    const alvo = m[1].trim();
    const outro = S.habitos.find(x => x.nome.toLowerCase() === alvo.toLowerCase());
    return outro && outro.nome !== h.nome ? outro : null;
  }
  function bloqueado(h, k) {
    const a = aposDe(h);
    if (!a || !a.ativo || !previsto(a, k)) return null;
    return estado(valorDe(a.nome, k), Math.max(1, Number(a.alvo) || 1)) === 'feito' ? null : a;
  }
  function ordemPilha(lista) {
    // hábitos que dependem de outro ficam logo a seguir ao outro
    const out = [];
    const resto = lista.slice();
    const colocar = h => { if (out.indexOf(h) >= 0) return; const a = aposDe(h); if (a && resto.indexOf(a) >= 0) colocar(a); out.push(h); };
    resto.forEach(colocar);
    return out;
  }
  function diaPerfeito(k) {
    let prev = 0, feitos = 0, falhas = 0;
    habitosAtivos().forEach(h => { if (!previsto(h, k)) return; const e = estado(valorDe(h.nome, k), Math.max(1, Number(h.alvo) || 1)); if (e === 'na') return; prev++; if (e === 'feito') feitos++; if (e === 'falhou') falhas++; });
    if (!prev) return 'na';
    if (feitos === prev) return 'perfeito';
    if (feitos > 0 || falhas < prev) return 'parcial';
    return 'falha';
  }

  /* ---------- UI: utilitários ---------- */
  const $ = sel => document.querySelector(sel);
  const el = (tag, attrs, ...filhos) => {
    const n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(k => {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'style') n.style.cssText = attrs[k];
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    filhos.flat().forEach(f => { if (f === null || f === undefined || f === false) return; n.append(f.nodeType ? f : document.createTextNode(String(f))); });
    return n;
  };
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('ver'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('ver'), 2200); }
  function vibrar(ms) {
    try {
      if (Cap.Haptics) { Cap.Haptics.impact({ style: ms > 20 ? 'MEDIUM' : 'LIGHT' }); return; }
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) { /* sem vibração */ }
  }
  function abrirModal(conteudo) { const p = $('#modal-painel'); p.innerHTML = ''; p.append(conteudo); $('#modal').classList.add('aberto'); }
  function fecharModal() { $('#modal').classList.remove('aberto'); }
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') fecharModal(); });

  /* ---------- Capacitor (só na app Android) ---------- */
  const Cap = {};
  (function ligarCapacitor() {
    const C = window.Capacitor;
    if (!C || !C.registerPlugin) return;
    try { Cap.LocalNotifications = C.registerPlugin('LocalNotifications'); } catch (e) { /* plugin ausente */ }
    try { Cap.Haptics = C.registerPlugin('Haptics'); } catch (e) { /* plugin ausente */ }
    try { Cap.Share = C.registerPlugin('Share'); } catch (e) { /* plugin ausente */ }
    Cap.nativo = C.isNativePlatform ? C.isNativePlatform() : false;
  })();

  async function agendarNotificacoes() {
    if (!Cap.LocalNotifications || !Cap.nativo) return;
    try {
      const perm = await Cap.LocalNotifications.requestPermissions();
      if (perm && perm.display && perm.display !== 'granted') return;
      const pend = await Cap.LocalNotifications.getPending();
      if (pend && pend.notifications && pend.notifications.length) await Cap.LocalNotifications.cancel({ notifications: pend.notifications.map(n => ({ id: n.id })) });
      if (!S.perfil.notificacoes) return;
      const lista = [];
      let id = 100;
      habitosAtivos().forEach((h, hi) => {
        if (!h.hora || h.soLeitura) return;
        const hm = h.hora.split(':').map(Number);
        parseDias(h.dias).forEach(d => {
          lista.push({ id: id++, title: h.nome, body: (h.identidade ? 'Quero tornar-me ' + h.identidade + '. ' : '') + (h.doisMin ? 'Mínimo: ' + h.doisMin : ''), schedule: { on: { weekday: d + 1, hour: hm[0], minute: hm[1] || 0 }, allowWhileIdle: true }, smallIcon: 'ic_stat_name' });
        });
      });
      if (S.perfil.lembreteNoite) {
        const hm = S.perfil.lembreteNoite.split(':').map(Number);
        lista.push({ id: 90, title: '~1%', body: 'Ainda há votos por dar hoje? Marca o que fizeste; o que não fizeste, amanhã na versão de 2 minutos.', schedule: { on: { hour: hm[0], minute: hm[1] || 0 }, allowWhileIdle: true }, smallIcon: 'ic_stat_name' });
      }
      if (lista.length) await Cap.LocalNotifications.schedule({ notifications: lista });
    } catch (e) { console.warn('notificações', e); }
  }

  /* ---------- ecrã: Hoje ---------- */
  function renderHoje() {
    const r = $('#ecra-hoje'); r.innerHTML = '';
    const hoje = hojeKey();
    const k = S.ui.diaSel;
    const d = dataDe(k);
    r.append(el('div', { class: 'topo' },
      el('div', { class: 'marca' }, el('span', { class: 'til' }, '~'), '1%'),
      el('div', { class: 'data' }, (k === hoje ? 'hoje, ' : '') + DIAS_LONGOS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()])
    ));
    // faixa
    const faixa = el('div', { class: 'faixa', role: 'tablist' });
    for (let i = 6; i >= 0; i--) {
      const kk = somaDias(hoje, -i);
      const dd = dataDe(kk);
      const p = diaPerfeito(kk);
      faixa.append(el('button', { class: kk === k ? 'sel' : '', role: 'tab', 'aria-selected': kk === k, onclick: () => { S.ui.diaSel = kk; guardar(); renderHoje(); } },
        el('span', { class: 'dsem' }, DIAS[dd.getDay()]), el('span', { class: 'dnum' }, dd.getDate()), el('span', { class: 'ponto ' + (p === 'na' ? '' : p) })));
    }
    r.append(faixa);
    // votos do dia
    let votosDia = 0;
    habitosAtivos().forEach(h => { votosDia += votosDe(valorDe(h.nome, k)); });
    r.append(el('div', { class: 'votos-hoje' }, el('span', { class: 'n' }, votosDia), el('span', { class: 't' }, votosDia === 1 ? 'voto na pessoa que queres ser' : 'votos na pessoa que queres ser')));
    // recuperação
    if (k === hoje) {
      habitosAtivos().forEach(h => {
        const a = resumo(h).alerta;
        if (!a) return;
        const dias = a.dias.map(fmtDM).join(' e ');
        r.append(el('div', { class: 'aviso' + (a.nivel === 2 ? ' forte' : '') },
          el('b', null, h.nome), a.nivel === 2 ? ': dois dias seguidos a zero (' + dias + '). Hoje é obrigatório, na versão de 2 minutos.' : ': ' + (a.dias[0] === somaDias(hoje, -1) ? 'ontem' : fmtDM(a.dias[0])) + ' ficou a zero. Nunca duas vezes.',
          h.doisMin ? el('span', { class: 'min' }, 'Versão de 2 minutos: ' + h.doisMin) : null));
      });
    }
    // lição do dia (linha discreta)
    const lic = licaoDoDia();
    if (lic && !S.licoes.lidas[lic.id]) r.append(el('p', { class: 'quieto', style: 'margin-bottom:12px' }, 'Lição de hoje: ', el('a', { href: '#', onclick: e => { e.preventDefault(); irPara('mais'); abrirLicoes(); } }, lic.titulo)));
    // cartões
    const previstos = ordemPilha(habitosAtivos().filter(h => previsto(h, k)));
    if (!previstos.length) r.append(el('div', { class: 'vazio' }, 'Nada previsto para este dia.'));
    previstos.forEach(h => r.append(cartaoHabito(h, k)));
    if (k > hoje) r.append(el('p', { class: 'quieto' }, 'Dia futuro: só se marca quando chegar.'));
  }

  function cartaoHabito(h, k) {
    const alvo = Math.max(1, Number(h.alvo) || 1);
    const v = valorDe(h.nome, k);
    const e = estado(v, alvo);
    const rs = resumo(h);
    const bloq = bloqueado(h, k);
    const card = el('article', { class: 'habito' + (e === 'feito' ? ' feito' : '') + (bloq ? ' bloqueado' : ''), style: '--cor:' + (h.cor || CORES[0]) });
    card.append(el('div', { class: 'cab' },
      el('div', { class: 'nome' }, h.nome),
      el('div', { class: 'seq', title: 'sequência atual' }, el('span', { class: 'chama' }), rs.seq + (rs.seq === 1 ? ' dia' : ' dias'))));
    if (h.identidade) card.append(el('div', { class: 'quero' }, el('small', null, 'quero tornar-me'), el('div', { class: 'id' }, h.identidade)));
    const meta = [];
    if (alvo > 1) meta.push(alvo + ' vezes por dia');
    if (h.hora) meta.push(h.hora);
    if (h.intencao) meta.push(h.intencao);
    if (meta.length) card.append(el('div', { class: 'meta' }, meta.map(m => el('span', null, m))));
    if (bloq) card.append(el('div', { class: 'bloq' }, 'Desbloqueia depois de: ' + bloq.nome));

    if (h.soLeitura) {
      const txt = e === 'feito' ? 'Feito (registo do Form)' : e === 'falhou' ? 'Falhou (registo do Form)' : (k < hojeKey() ? 'Sem dados da folha' : 'Por registar no Form');
      card.append(el('div', { class: 'solei' }, el('span', { class: 'est' }, txt), S.sync.formUrl ? el('a', { href: S.sync.formUrl, target: '_blank', rel: 'noopener' }, 'Abrir Form') : el('span', { class: 'quieto' }, 'atualiza com Sincronizar')));
      return card;
    }
    const acao = el('div', { class: 'acao' });
    if (alvo > 1) {
      const n = typeof v === 'number' ? v : 0;
      const segs = el('div', { class: 'segs' });
      for (let i = 0; i < alvo; i++) segs.append(el('span', { class: 'seg' + (i < n ? ' on' : '') }));
      segs.append(el('span', { class: 'num' }, n + ' / ' + alvo));
      acao.append(el('div', { class: 'contador' },
        el('button', { 'aria-label': 'menos uma vez', onclick: () => { registar(h.nome, k, Math.max(0, n - 1)); renderHoje(); } }, '−'),
        segs,
        el('button', { 'aria-label': 'mais uma vez', onclick: () => { registar(h.nome, k, n + 1); vibrar(n + 1 >= alvo ? 40 : 15); if (n + 1 >= alvo) toast('+1 voto. ' + (h.identidade ? 'Mais perto de: ' + h.identidade : h.nome)); renderHoje(); } }, '+')));
    } else {
      const bot = el('button', { class: 'votar' + (e === 'feito' ? ' feito' : ''), 'aria-pressed': e === 'feito' });
      bot.innerHTML = '<svg viewBox="0 0 400 54" preserveAspectRatio="none" aria-hidden="true"><path class="onda" d="M8 27 C 60 2, 110 52, 160 27 S 260 2, 310 27 S 380 44, 392 27"/></svg>';
      const txt = el('span', { class: 'txt' }, e === 'feito' ? ((S.minimos[h.nome] && S.minimos[h.nome][k]) ? 'Feito na versão de 2 minutos' : 'Feito. Mais um voto.') : 'Manter premido para votar');
      bot.append(txt);
      ligarPremir(bot, () => {
        if (e === 'feito') { registar(h.nome, k, false); toast('Voto retirado.'); }
        else { registar(h.nome, k, true); vibrar(40); toast('+1 voto. ' + (h.identidade ? 'Mais perto de: ' + h.identidade : h.nome)); }
        renderHoje();
      });
      acao.append(bot);
    }
    const sec = el('div', { class: 'acoes-sec' });
    if (h.doisMin && e !== 'feito') sec.append(el('button', { class: 'btn-min', onclick: () => { registar(h.nome, k, alvo > 1 ? alvo : true, true); vibrar(30); toast('Conta. Apareceste.'); renderHoje(); } }, 'Fiz a versão de 2 min: ' + h.doisMin));
    if (e === 'feito' && alvo > 1) sec.append(el('button', { class: 'btn-min', onclick: () => { registar(h.nome, k, 0); renderHoje(); } }, 'Repor a zero'));
    acao.append(sec);
    card.append(acao);
    return card;
  }

  // manter premido 700 ms; soltar antes cancela
  function ligarPremir(bot, aoCompletar) {
    let t = null, completo = false;
    const inicio = ev => {
      if (ev.button !== undefined && ev.button !== 0) return;
      ev.preventDefault();
      completo = false;
      bot.classList.add('a-premir');
      t = setTimeout(() => { completo = true; bot.classList.remove('a-premir'); aoCompletar(); }, 700);
    };
    const fim = () => { if (t) clearTimeout(t); t = null; if (!completo) bot.classList.remove('a-premir'); };
    bot.addEventListener('pointerdown', inicio);
    bot.addEventListener('pointerup', fim);
    bot.addEventListener('pointerleave', fim);
    bot.addEventListener('pointercancel', fim);
    bot.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); aoCompletar(); } });
    bot.addEventListener('contextmenu', ev => ev.preventDefault());
  }

  /* ---------- ecrã: Hábitos ---------- */
  function renderHabitos() {
    const r = $('#ecra-habitos'); r.innerHTML = '';
    r.append(el('div', { class: 'topo' }, el('h1', null, 'Hábitos'), el('button', { class: 'btn peq', onclick: () => editarHabito(null) }, 'Novo hábito')));
    r.append(el('p', { class: 'quieto' }, 'Um hábito sem hora e local e sem versão de 2 minutos é um desejo. Toca para editar.'));
    const ul = el('ul', { class: 'lista' });
    ordemPilha(S.habitos).forEach(h => {
      const rs = resumo(h);
      const a = aposDe(h);
      ul.append(el('li', { onclick: () => editarHabito(h) },
        el('span', { class: 'cor', style: 'background:' + (h.cor || CORES[0]) }),
        el('div', { class: 'txt' }, el('div', { class: 'n' }, (a ? '↳ ' : '') + h.nome + (h.ativo ? '' : ' (pausado)')), el('div', { class: 's' }, [h.identidade ? 'quero tornar-me ' + h.identidade : 'sem identidade escrita', h.alvo > 1 ? h.alvo + '×/dia' : null, diasTexto(parseDias(h.dias)) === 'todos' ? null : diasTexto(parseDias(h.dias))].filter(Boolean).join(' · '))),
        el('div', { class: 'dir' }, rs.total + ' votos')));
    });
    r.append(ul);
  }

  function editarHabito(h) {
    const novo = !h;
    const f = novo ? { nome: '', cor: CORES[S.habitos.length % CORES.length], ativo: true, identidade: '', doisMin: '', intencao: '', empilhar: '', sinal: '', tentacao: '', tribo: '', ritual: '', friccao: '', ambiente: '', decisivo: '', automacao: '', recompensa: '', registo: '', parceiro: '', alvo: 1, dias: 'todos', hora: '', inicio: hojeKey(), nota: '' } : JSON.parse(JSON.stringify(h));
    const dias = parseDias(f.dias);
    const campo = (k, rotulo, ph, multi) => el('label', { class: 'campo' }, rotulo, multi
      ? el('textarea', { placeholder: ph || '', oninput: e => { f[k] = e.target.value; } }, f[k] || '')
      : el('input', { type: 'text', value: f[k] || '', placeholder: ph || '', oninput: e => { f[k] = e.target.value; } }));
    const painel = el('div', null);
    painel.append(el('div', { class: 'cab' }, el('h2', null, novo ? 'Novo hábito' : h.nome), el('button', { class: 'btn sec peq', onclick: fecharModal }, 'Fechar')));
    if (h && h.soLeitura) painel.append(el('p', { class: 'quieto' }, 'A Hora sagrada regista-se pelo Form; aqui podes editar a ficha, não o registo.'));
    painel.append(el('label', { class: 'campo' }, 'Nome curto (não mudar depois de começar a registar)', el('input', { type: 'text', value: f.nome, oninput: e => { f.nome = e.target.value; }, disabled: !novo && !!h.soLeitura })));
    painel.append(el('label', { class: 'campo' }, 'Quero tornar-me… (identidade, cap. 2)', el('input', { type: 'text', value: f.identidade, placeholder: 'ex.: uma pessoa ainda mais grata', oninput: e => { f.identidade = e.target.value; } })));
    painel.append(campo('doisMin', 'Versão de 2 minutos: o mínimo que conta (cap. 13)', 'ex.: calçar as sapatilhas e sair de casa'));
    // cor
    const cores = el('div', { class: 'cores' });
    CORES.forEach(c => cores.append(el('button', { type: 'button', class: f.cor === c ? 'on' : '', style: 'background:' + c, 'aria-label': 'cor', onclick: ev => { f.cor = c; cores.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === ev.currentTarget)); } })));
    painel.append(el('div', { class: 'campo' }, 'Cor', cores));
    // alvo, dias, hora
    painel.append(el('label', { class: 'campo' }, 'Vezes por dia (1 = uma caixa; 2 ou mais = contador)', el('input', { type: 'number', min: 1, max: 20, value: f.alvo, oninput: e => { f.alvo = Math.max(1, Math.floor(Number(e.target.value) || 1)); } })));
    const chips = el('div', { class: 'chips' });
    [1, 2, 3, 4, 5, 6, 0].forEach(d => chips.append(el('button', { type: 'button', class: dias.indexOf(d) >= 0 ? 'on' : '', onclick: ev => { const i = dias.indexOf(d); if (i >= 0) dias.splice(i, 1); else dias.push(d); ev.currentTarget.classList.toggle('on'); f.dias = dias.length ? diasTexto(dias) : 'todos'; } }, DIAS[d])));
    painel.append(el('div', { class: 'campo' }, 'Dias', chips));
    painel.append(el('label', { class: 'campo' }, 'Hora prevista (para o lembrete e o Calendar)', el('input', { type: 'time', value: f.hora, oninput: e => { f.hora = e.target.value; } })));
    painel.append(el('label', { class: 'campo' }, 'Início', el('input', { type: 'date', value: f.inicio, oninput: e => { f.inicio = e.target.value; } })));
    // leis
    const lei = (titulo, sub, ...campos) => el('div', { class: 'lei' }, el('h3', null, titulo), el('p', { class: 'quieto' }, sub), ...campos);
    const outros = S.habitos.filter(x => !h || x.nome !== h.nome);
    const sel = el('select', { onchange: e => { const n = e.target.value; f.empilhar = n ? 'Depois de "' + n + '".' : ''; txtEmp.value = f.empilhar; } }, el('option', { value: '' }, 'Nenhum (hábito novo começa a pilha)'), ...outros.map(x => el('option', { value: x.nome, selected: (aposDe(f) || {}).nome === x.nome }, x.nome)));
    const txtEmp = el('input', { type: 'text', value: f.empilhar || '', placeholder: 'ou escreve: Depois de [hábito atual], faço…', oninput: e => { f.empilhar = e.target.value; } });
    painel.append(lei('1.ª lei: tornar óbvio', 'Hora e local, empilhamento, sinal visível (pp. 64-77).',
      campo('intencao', 'Intenção de implementação: "Faço X às [HORA] em [LOCAL]"', 'ex.: Às 18:00, na cozinha'),
      el('label', { class: 'campo' }, 'Empilhar: depois de que hábito? (o seguinte só desbloqueia depois do anterior)', sel, txtEmp),
      campo('sinal', 'Sinal visível no ambiente', 'ex.: sapatilhas junto à porta')));
    painel.append(lei('2.ª lei: tornar atrativo', 'Tentação acoplada, tribo, ritual antes (pp. 95-113).',
      campo('tentacao', 'Tentação acoplada: "Depois de [este hábito], posso [o que quero]"', ''),
      campo('tribo', 'Tribo onde isto é o normal', ''),
      campo('ritual', 'Ritual de motivação imediatamente antes', '')));
    painel.append(lei('3.ª lei: tornar fácil', 'Fricção, ambiente preparado, momento decisivo, automação (pp. 126-144).',
      campo('friccao', 'Fricção removida: passos cortados', ''),
      campo('ambiente', 'Ambiente preparado na véspera', ''),
      campo('decisivo', 'Momento decisivo: a escolha pequena que decide o dia', ''),
      campo('automacao', 'Automação ou dispositivo de compromisso', '')));
    painel.append(lei('4.ª lei: tornar satisfatório', 'Recompensa imediata, registo a seguir, parceiro (pp. 149-167).',
      campo('recompensa', 'Recompensa imediata ao acabar', ''),
      campo('registo', 'Registo: "Depois de [hábito], marco"', ''),
      campo('parceiro', 'Parceiro de responsabilidade ou contrato', '')));
    painel.append(campo('nota', 'Nota', '', true));
    painel.append(el('div', { class: 'toggle' }, el('span', null, 'Ativo (aparece no Hoje e na grelha)'), el('input', { type: 'checkbox', checked: f.ativo, onchange: e => { f.ativo = e.target.checked; } })));
    const acoes = el('div', { class: 'linha-acoes' });
    acoes.append(el('button', { class: 'btn', onclick: () => {
      f.nome = String(f.nome || '').trim();
      if (!f.nome) { toast('Dá um nome ao hábito.'); return; }
      if (novo && habPorNome(f.nome)) { toast('Já existe um hábito com esse nome.'); return; }
      if (novo) S.habitos.push(f); else Object.assign(h, f);
      S.habitosSujos = true; guardar(); fecharModal(); renderTudo(); agendarNotificacoes(); toast(novo ? 'Hábito criado.' : 'Guardado.');
    } }, 'Guardar'));
    if (!novo && !h.soLeitura) acoes.append(el('button', { class: 'btn sec', onclick: () => {
      if (!confirm('Apagar "' + h.nome + '" da app? Os registos locais deste hábito também desaparecem (a folha mantém a coluna).')) return;
      S.habitos = S.habitos.filter(x => x !== h); delete S.registos[h.nome]; S.habitosSujos = true; guardar(); fecharModal(); renderTudo(); toast('Apagado.');
    } }, 'Apagar'));
    painel.append(acoes);
    abrirModal(painel);
  }

  /* ---------- ecrã: Scorecard ---------- */
  function renderScorecard() {
    const r = $('#ecra-scorecard'); r.innerHTML = '';
    r.append(el('div', { class: 'topo' }, el('h1', null, 'Scorecard'), el('button', { class: 'btn peq', onclick: () => { S.scorecard.push([S.scorecard.length + 1, '', '', '', '', '', '', '']); S.scorecardSujo = true; guardar(); renderScorecard(); } }, 'Nova linha')));
    const inicio = S.perfil.inicioScorecard || hojeKey();
    const fim = somaDias(inicio, 6);
    const hoje = hojeKey();
    const emObservacao = hoje >= inicio && hoje <= fim;
    const antes = hoje < inicio;
    r.append(el('div', { class: 'sc-aviso' }, antes
      ? 'Semana de observação: ' + fmtCurta(inicio) + ' a ' + fmtCurta(fim) + '. Até lá, lista a tua manhã, por ordem, desde acordar até às 9:30.'
      : emObservacao
        ? 'Semana de observação até ' + fmtCurta(fim) + ': só avaliar (+ − =) e dizer em voz alta. Decisões ficam fechadas até ' + fmtCurta(somaDias(fim, 1)) + ' (cap. 4, p. 59).'
        : 'Observação terminada. Agora, por linha: manter, retirar o sinal, ou empilhar aqui um hábito novo (caps. 5 e 7).'));
    r.append(el('p', { class: 'quieto' }, 'Critério (p. 58): isto aproxima-me ou afasta-me da pessoa que quero ser? Em dúvida, o resultado líquido a longo prazo.'));
    S.scorecard.forEach((linha, i) => {
      const aval = linha[4];
      const cls = aval === '+' ? 'mais' : (aval === '−' || aval === '-') ? 'menos' : '';
      const card = el('div', { class: 'sc-linha ' + cls });
      const set = (j, v) => { linha[j] = v; S.scorecardSujo = true; guardar(); };
      const seg = el('div', { class: 'aval', role: 'group', 'aria-label': 'avaliação' });
      [['+', 'mais'], ['=', 'igual'], ['−', 'menos']].forEach(([s, c]) => seg.append(el('button', { class: c + (aval === s || (s === '−' && aval === '-') ? ' on' : ''), onclick: () => { set(4, aval === s ? '' : s); renderScorecard(); } }, s)));
      card.append(el('div', { class: 'cab' },
        el('span', { class: 'ordem' }, i + 1),
        el('input', { class: 'hora', type: 'text', value: linha[1] || '', placeholder: 'hh:mm', oninput: e => set(1, e.target.value) }),
        el('input', { class: 'acao', type: 'text', value: linha[2] || '', placeholder: 'o que faço', oninput: e => set(2, e.target.value) }),
        seg));
      const mais = el('div', { class: 'mais-campos' },
        el('input', { type: 'text', value: linha[3] || '', placeholder: 'sinal: o que o dispara', oninput: e => set(3, e.target.value) }),
        el('input', { type: 'text', value: linha[5] || '', placeholder: 'porquê: aproxima ou afasta de quem quero ser?', oninput: e => set(5, e.target.value) }),
        el('input', { type: 'text', value: linha[6] || '', placeholder: 'em voz alta: "estou a fazer X e não preciso; vai custar-me Y"', oninput: e => set(6, e.target.value) }),
        el('input', { type: 'text', value: linha[7] || '', placeholder: 'decisão (depois da semana): manter / retirar o sinal / empilhar aqui…', disabled: antes || emObservacao, oninput: e => set(7, e.target.value) }));
      card.append(mais);
      const preenchidos = [3, 5, 6, 7].filter(j => linha[j]).length;
      card.append(el('div', { class: 'rodape' },
        el('button', { onclick: ev => { card.classList.toggle('aberta'); ev.currentTarget.textContent = card.classList.contains('aberta') ? 'Menos' : 'Detalhes' + (preenchidos ? ' (' + preenchidos + ')' : ''); } }, 'Detalhes' + (preenchidos ? ' (' + preenchidos + ')' : '')),
        el('button', { onclick: () => dizer(linha[6] || ('Estou a ' + (linha[2] || 'fazer isto') + '.')) }, 'Voz alta'),
        el('button', { onclick: () => { if (!confirm('Apagar esta linha?')) return; S.scorecard.splice(i, 1); S.scorecard.forEach((l, j) => { l[0] = j + 1; }); S.scorecardSujo = true; guardar(); renderScorecard(); } }, 'Apagar')));
      r.append(card);
    });
  }
  function dizer(texto) {
    try {
      if (!('speechSynthesis' in window)) { toast('Sem voz neste aparelho. Di-lo tu.'); return; }
      const u = new SpeechSynthesisUtterance(texto); u.lang = 'pt-PT'; u.rate = 0.95;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    } catch (e) { toast('Sem voz neste aparelho. Di-lo tu.'); }
  }

  /* ---------- ecrã: Progresso ---------- */
  function renderProgresso() {
    const r = $('#ecra-progresso'); r.innerHTML = '';
    r.append(el('div', { class: 'topo' }, el('h1', null, 'Progresso'), el('button', { class: 'btn sec peq', onclick: partilhar }, 'Partilhar')));
    const ativos = habitosAtivos();
    const res = ativos.map(h => ({ h, r: resumo(h) }));
    const total = res.reduce((a, x) => a + x.r.total, 0);
    const b1 = el('div', { class: 'bloco' });
    b1.append(el('div', { class: 'prog-total' }, el('span', { class: 'n' }, total), el('span', { class: 't' }, total === 1 ? 'voto dado na pessoa que queres ser' : 'votos dados na pessoa que queres ser')));
    const barra = el('div', { class: 'barra-votos', 'aria-hidden': true });
    res.forEach(x => { if (x.r.total > 0) barra.append(el('span', { style: 'width:' + (100 * x.r.total / Math.max(1, total)) + '%;background:' + x.h.cor, title: x.h.nome })); });
    b1.append(barra);
    const ul = el('ul', { class: 'lista' });
    res.sort((a, b) => b.r.total - a.r.total).forEach(x => ul.append(el('li', null,
      el('span', { class: 'cor', style: 'background:' + x.h.cor }),
      el('div', { class: 'txt' }, el('div', { class: 'n' }, x.h.nome), el('div', { class: 's' }, 'sequência ' + x.r.seq + ' · melhor ' + x.r.melhor + (x.r.ultimaFalha ? ' · última falha ' + fmtDM(x.r.ultimaFalha) : ''))),
      el('div', { class: 'dir' }, x.r.total + (x.r.total === 1 ? ' voto' : ' votos')))));
    b1.append(ul);
    r.append(b1);
    // dias perfeitos, últimos 28
    const hoje = hojeKey();
    let perfeitos = 0; const seqDias = [];
    for (let i = 27; i >= 0; i--) { const k = somaDias(hoje, -i); const p = diaPerfeito(k); if (p === 'perfeito') perfeitos++; seqDias.push(p); }
    const b2 = el('div', { class: 'bloco' });
    b2.append(el('h2', null, perfeitos + (perfeitos === 1 ? ' dia perfeito' : ' dias perfeitos') + ' nos últimos 28'));
    b2.append(el('p', { class: 'quieto' }, 'Dia perfeito: todos os hábitos previstos no alvo. Parcial conta para a sequência, não para aqui.'));
    const g = el('div', { class: 'grelha-mini', style: '--cor:var(--ouro)' });
    seqDias.forEach(p => g.append(el('span', { class: p === 'perfeito' ? 'f' : p === 'parcial' ? 'p' : p === 'falha' ? 'x' : 'na' })));
    b2.append(g);
    r.append(b2);
    // grelha por hábito (28 dias)
    ativos.forEach(h => {
      const b = el('div', { class: 'bloco', style: '--cor:' + h.cor });
      b.append(el('h3', null, h.nome));
      const g2 = el('div', { class: 'grelha-mini' });
      const alvo = Math.max(1, Number(h.alvo) || 1);
      for (let i = 27; i >= 0; i--) { const k = somaDias(hoje, -i); const e = previsto(h, k) ? estado(valorDe(h.nome, k), alvo) : 'na'; g2.append(el('span', { class: e === 'feito' ? 'f' : e === 'parcial' ? 'p' : e === 'falhou' ? (k < hoje ? 'x' : '') : 'na', title: fmtDM(k) })); }
      b.append(g2);
      r.append(b);
    });
    // reflexões
    r.append(blocoReflexao('Identidade', 'Estou a progredir para as identidades que escrevi?'));
    r.append(blocoReflexao('Hábitos', 'Como me sinto com o progresso dos meus hábitos?'));
    const hist = S.reflexoes.filter(x => x.resposta || x.nota).slice(-8).reverse();
    if (hist.length) {
      const b3 = el('div', { class: 'bloco' }); b3.append(el('h2', null, 'Reflexões recentes'));
      const ul3 = el('ul', { class: 'lista' });
      hist.forEach(x => ul3.append(el('li', null, el('div', { class: 'txt' }, el('div', { class: 'n' }, x.tipo + (x.nota ? ' · ' + x.nota + '/5' : '')), el('div', { class: 's' }, x.resposta || x.pergunta)), el('div', { class: 'dir' }, fmtDM(x.data)))));
      b3.append(ul3); r.append(b3);
    }
  }
  function blocoReflexao(tipo, pergunta) {
    const b = el('div', { class: 'bloco' });
    const ultimas = S.reflexoes.filter(x => x.tipo === tipo && x.nota).slice(-5);
    b.append(el('h2', null, 'Reflexão: ' + tipo.toLowerCase()));
    b.append(el('p', { class: 'serif', style: 'font-size:18px;font-style:italic' }, pergunta));
    let nota = 0; let texto = '';
    const esc = el('div', { class: 'escala', role: 'group', 'aria-label': 'de 1 (não) a 5 (sim)' });
    [1, 2, 3, 4, 5].forEach(n => esc.append(el('button', { onclick: ev => { nota = n; esc.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === ev.currentTarget)); } }, n)));
    b.append(el('div', { class: 'quieto', style: 'display:flex;justify-content:space-between' }, el('span', null, 'não'), el('span', null, 'sim')));
    b.append(esc);
    b.append(el('label', { class: 'campo' }, 'Uma a três linhas (opcional)', el('textarea', { oninput: e => { texto = e.target.value; } })));
    b.append(el('div', { class: 'linha-acoes' }, el('button', { class: 'btn peq', onclick: () => {
      if (!nota) { toast('Escolhe de 1 a 5.'); return; }
      S.reflexoes.push({ data: hojeKey(), tipo, nota, pergunta, resposta: texto, enviada: false }); guardar(); renderProgresso(); toast('Reflexão guardada.');
    } }, 'Guardar reflexão')));
    if (ultimas.length) { const u = el('div', { class: 'ultimas', 'aria-label': 'últimas 5' }); ultimas.forEach(x => u.append(el('span', { style: 'height:' + (x.nota * 20) + '%', title: fmtDM(x.data) + ': ' + x.nota }))); b.append(el('p', { class: 'quieto', style: 'margin:8px 0 0' }, 'Últimas ' + ultimas.length + ':'), u); }
    return b;
  }
  async function partilhar() {
    const ativos = habitosAtivos();
    const total = ativos.reduce((a, h) => a + resumo(h).total, 0);
    const linhas = ativos.map(h => { const r = resumo(h); return '· ' + h.nome + ': ' + r.total + ' votos, sequência ' + r.seq; });
    const texto = '~1% · ' + fmtCurta(hojeKey()) + '\n' + total + ' votos na pessoa que quero ser\n' + linhas.join('\n');
    try {
      if (Cap.Share) { await Cap.Share.share({ title: '~1%', text: texto }); return; }
      if (navigator.share) { await navigator.share({ title: '~1%', text: texto }); return; }
      await navigator.clipboard.writeText(texto); toast('Copiado. Cola onde quiseres.');
    } catch (e) { /* cancelado */ }
  }

  /* ---------- ecrã: Mais (lições, definições) ---------- */
  function renderMais() {
    const r = $('#ecra-mais'); r.innerHTML = '';
    r.append(el('div', { class: 'topo' }, el('h1', null, 'Mais'), el('span', { class: 'sync-estado ' + (S.pendentes.length || S.habitosSujos || S.scorecardSujo ? 'pendente' : (S.sync.ultima ? 'ok' : '')) }, S.sync.ultima ? 'sincronizado ' + S.sync.ultima.slice(11, 16) + ' ' + fmtDM(S.sync.ultima.slice(0, 10)) : 'sem sincronização')));
    const lic = licaoDoDia();
    const b0 = el('div', { class: 'bloco' });
    b0.append(el('h2', null, 'Lições'));
    b0.append(el('p', { class: 'quieto' }, 'Uma por capítulo, ao ritmo da tua leitura. As tuas notas ficam guardadas; os complementos são meus, com a página do PDF.'));
    b0.append(el('div', { class: 'linha-acoes' }, el('button', { class: 'btn peq', onclick: abrirLicoes }, lic && !S.licoes.lidas[lic.id] ? 'Ler a lição de hoje' : 'Abrir lições')));
    r.append(b0);
    // sincronização
    const b1 = el('div', { class: 'bloco' });
    b1.append(el('h2', null, 'Folha "Hora Sagrada"'));
    b1.append(el('p', { class: 'quieto' }, 'A app funciona sem rede. Quando sincronizas, os teus registos vão para a grelha "Registo hábitos" (que alimenta o email das 8:05) e a Hora sagrada vem do Form.'));
    b1.append(el('label', { class: 'campo' }, 'URL da aplicação web (termina em /exec)', el('input', { type: 'url', value: S.sync.url, placeholder: 'https://script.google.com/macros/s/…/exec', oninput: e => { S.sync.url = e.target.value.trim(); guardar(); } })));
    b1.append(el('label', { class: 'campo' }, 'Token (v3_gerarToken no Apps Script)', el('input', { type: 'password', value: S.sync.token, oninput: e => { S.sync.token = e.target.value.trim(); guardar(); } })));
    const pend = S.pendentes.length + (S.habitosSujos ? 1 : 0) + (S.scorecardSujo ? 1 : 0) + S.reflexoes.filter(x => !x.enviada).length;
    b1.append(el('div', { class: 'linha-acoes' },
      el('button', { class: 'btn', onclick: () => sincronizar(false) }, pend ? 'Sincronizar (' + pend + ' por enviar)' : 'Sincronizar'),
      el('button', { class: 'btn sec', onclick: () => sincronizar(true) }, 'Só obter da folha')));
    r.append(b1);
    // definições
    const b2 = el('div', { class: 'bloco' });
    b2.append(el('h2', null, 'Definições'));
    b2.append(el('label', { class: 'campo' }, 'Início da semana de observação do Scorecard', el('input', { type: 'date', value: S.perfil.inicioScorecard, oninput: e => { S.perfil.inicioScorecard = e.target.value; guardar(); } })));
    b2.append(el('label', { class: 'campo' }, 'Lembrete da noite (só na app Android)', el('input', { type: 'time', value: S.perfil.lembreteNoite, oninput: e => { S.perfil.lembreteNoite = e.target.value; guardar(); agendarNotificacoes(); } })));
    b2.append(el('div', { class: 'toggle' }, el('span', null, 'Lembretes nas horas dos hábitos (só na app Android)'), el('input', { type: 'checkbox', checked: S.perfil.notificacoes, onchange: e => { S.perfil.notificacoes = e.target.checked; guardar(); agendarNotificacoes(); } })));
    const temaSel = el('select', { onchange: e => { S.ui.tema = e.target.value; guardar(); aplicarTema(); } }, ...[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']].map(([v, t]) => el('option', { value: v, selected: S.ui.tema === v }, t)));
    b2.append(el('label', { class: 'campo' }, 'Tema', temaSel));
    b2.append(el('div', { class: 'linha-acoes' },
      el('button', { class: 'btn sec peq', onclick: exportar }, 'Exportar cópia (JSON)'),
      el('button', { class: 'btn sec peq', onclick: importar }, 'Importar cópia'),
      el('button', { class: 'btn sec peq', onclick: () => { if (confirm('Repor a app ao estado inicial? Os dados locais perdem-se (a folha fica).')) { localStorage.removeItem(CHAVE); S = base(); guardar(); renderTudo(); } } }, 'Repor')));
    b2.append(el('p', { class: 'quieto', style: 'margin-top:10px' }, '~1% versão ' + VERSAO + (Cap.nativo ? ' · Android' : ' · web') + '. Cada ação é um voto na pessoa que queres ser (Atomic Habits, p. 38).'));
    r.append(b2);
  }

  /* ---------- lições ---------- */
  const LICOES = [
    { id: 'c1', cap: 1, data: '2026-09-26', titulo: 'Juros compostos de ti próprio', tua: '24 set: "Grandes projetos são feitos de pequenas coisas: melhorar 1% todos os dias dá um resultado de 37 ao fim de um ano." 26 set: "Devemo-nos apoiar mais em sistemas do que em objetivos. Sistemas duram; objetivos ou se conseguem ou não."', comp: '1% melhor por dia composto durante um ano dá cerca de 37 vezes (1,01 elevado a 365), não 37%: é por isso que a diferença parece nula nas primeiras semanas e enorme ao fim de meses (pp. 15-16). O vale do desapontamento (pp. 20-22) é onde a maioria desiste. Resposta do livro: não subires ao nível dos objetivos, caíres ao nível dos sistemas (p. 29). O sistema, aqui, é a hora das 9:30 e esta grelha.', aplico: 'Esta app só mede sistema: votos e sequências, nunca "objetivo cumprido".', pag: 'pp. 15-30' },
    { id: 'c2', cap: 2, data: '2026-09-26', titulo: 'Cada ação é um voto', tua: '26 set, Direção: "A melhor maneira de mudar os meus hábitos não é focar-me no que quero alcançar mas no que me quero tornar. A identidade surge dos hábitos; cada ação é um voto para o tipo de pessoa que nos queremos tornar."', comp: 'Três camadas de mudança: resultados, processos, identidade (pp. 32-33). Começar pela identidade inverte a ordem habitual. Dois passos: decidir quem queres ser; provar a ti próprio com pequenas vitórias (p. 39). Não precisas de unanimidade, precisas de maioria de votos (p. 38). É por isso que cada hábito aqui começa por "quero tornar-me".', aplico: 'Escreve a identidade em cada hábito que ainda não a tem.', pag: 'pp. 31-41' },
    { id: 'c3', cap: 3, data: '2026-09-27', titulo: 'Quatro passos, quatro leis', tua: '', comp: 'Todo o hábito corre o mesmo ciclo: sinal, desejo, resposta, recompensa (pp. 47-50). As quatro leis são o ciclo visto do lado de quem desenha o hábito: tornar óbvio, atrativo, fácil, satisfatório; e as inversões para desfazer um mau hábito (p. 52). A ficha de cada hábito nesta app tem uma secção por lei.', aplico: 'Desenha a Hora sagrada no ciclo: sinal = água e luz; recompensa = o X dito em voz alta.', pag: 'pp. 42-52' },
    { id: 'c4', cap: 4, data: '2026-09-28', titulo: 'Primeiro ver, só depois mudar', tua: '', comp: 'Os maquinistas japoneses apontam e dizem em voz alta cada sinal; os erros caem 85% (p. 57). O Scorecard é a versão pessoal: lista a rotina, marca + − =, e durante uma semana não mudes nada (pp. 58-59). O critério não é moral: aproxima-me ou afasta-me de quem quero ser? Dizer em voz alta o mau hábito no momento ("vou ver o telemóvel e não preciso") tira-lhe o automatismo (p. 60).', aplico: 'Scorecard de 12 a 18 out: só observar.', pag: 'pp. 53-61' },
    { id: 'c5', cap: 5, data: '2026-09-29', titulo: 'Hora, local, e depois de quê', tua: '', comp: 'Quem escreve "faço X às [hora] em [local]" cumpre duas a três vezes mais do que quem só quer (pp. 63-64). Empilhar cola o hábito novo a um que já é automático: "depois de [hábito atual], faço [novo]" (p. 66). A tua pilha "descanso, depois filme" é isto, com a vantagem de o segundo ser a recompensa do primeiro (p. 95).', aplico: 'Dá hora e local aos hábitos que ainda não têm, sobretudo aos dois da noite.', pag: 'pp. 62-71' },
    { id: 'c6', cap: 6, data: '2026-09-30', titulo: 'O ambiente ganha à motivação', tua: '', comp: 'Mudar a disposição das garrafas de água numa cantina mudou o consumo sem convencer ninguém (pp. 72-73). Sê o arquiteto do teu ambiente, não só o consumidor (p. 77). "Um espaço, um uso" (p. 78): a mesa das 9:30 é para a hora, o quarto é para dormir.', aplico: 'Para cada hábito, um sinal visível: sapatilhas à porta, saco feito, livro aberto.', pag: 'pp. 72-80' },
    { id: 'c7', cap: 7, data: '2026-10-01', titulo: 'Autocontrolo é retirar o sinal', tua: '', comp: 'Os soldados que voltaram do Vietname deixaram a heroína porque o ambiente mudou, não porque ganharam força de vontade (pp. 81-83). Pessoas disciplinadas passam menos tempo em situações tentadoras (p. 84). Para um mau hábito, a pergunta útil é "que sinal o dispara?" e a ação é tirá-lo da vista.', aplico: 'No Scorecard, cada linha com "−" ganha um sinal a retirar, não um propósito de resistir.', pag: 'pp. 81-86' },
    { id: 'c8', cap: 8, data: '2026-10-02', titulo: 'É a antecipação que move', tua: '', comp: 'A dopamina sobe antes da recompensa, não depois (pp. 91-93). Tentação acoplada: só fazes o que queres (filme) depois do que precisas (descanso), e a antecipação passa a puxar o hábito difícil (pp. 95-96). Nesta app, o hábito-recompensa fica bloqueado até o anterior estar feito.', aplico: 'O vídeo longo de inspiração só depois do bloco.', pag: 'pp. 87-96' },
    { id: 'c9', cap: 9, data: '2026-10-03', titulo: 'A tribo decide o que é normal', tua: '', comp: 'Imitamos os próximos, os muitos e os poderosos (pp. 101-103). Juntar-te a um grupo onde o comportamento que queres é o normal, e com quem já tens algo em comum, é das ações mais eficazes do livro (p. 105). O ginásio é também uma tribo.', aplico: 'Nomeia a tribo do alvo de outubro e um passo para entrar.', pag: 'pp. 97-105' },
    { id: 'c10', cap: 10, data: '2026-10-04', titulo: 'Reformular e um ritual antes', tua: '', comp: 'Os hábitos são soluções modernas para desejos antigos (pp. 107-108). Mudar "tenho de" para "posso" muda o que sentes antes de agir (pp. 110-111). Ritual de motivação: algo de que gostas, curto e sempre igual, imediatamente antes do hábito difícil (p. 113). A tua ignição é isso.', aplico: 'A ignição é sempre o mesmo gesto, 3 a 5 minutos.', pag: 'pp. 106-114' },
    { id: 'c11', cap: 11, data: '2026-10-05', titulo: 'Movimento não é ação', tua: '', comp: 'Planear, ler, ver vídeos: movimento. Só a repetição do comportamento produz resultado (p. 117). O que conta é o número de repetições, não o tempo decorrido (pp. 120-121). Esta app conta repetições; a tua Hora sagrada acaba com algo visível.', aplico: 'Construir a app é movimento; o voto de hoje é ação.', pag: 'pp. 115-121' },
    { id: 'c12', cap: 12, data: '2026-10-06', titulo: 'O caminho de menor esforço', tua: '', comp: 'Vamos para a opção que exige menos (p. 124). Reduz os passos entre ti e o bom hábito e aumenta-os para o mau (pp. 126-128). "Repor a divisão" no fim de cada uso prepara a próxima vez (p. 127).', aplico: 'Esta app no ecrã inicial do telemóvel; a folha, também.', pag: 'pp. 122-130' },
    { id: 'c13', cap: 13, data: '2026-10-07', titulo: 'Dois minutos e momentos decisivos', tua: '', comp: 'Há meia dúzia de momentos por dia que decidem o resto (p. 132). Um hábito novo deve demorar menos de dois minutos (p. 134); dominar a arte de aparecer vem antes de otimizar (p. 138). Por isso cada hábito aqui tem a versão de 2 minutos, e ela conta.', aplico: 'A versão de 2 minutos está escrita em todos os hábitos? Então o email das 8:05 tem o que enviar.', pag: 'pp. 131-138' },
    { id: 'c14', cap: 14, data: '2026-10-08', titulo: 'Compromissos que não dependem de vontade', tua: '', comp: 'Victor Hugo trancou a roupa para ter de escrever (p. 139). Um dispositivo de compromisso decide no presente pelo futuro (pp. 139-141); automatizar é a versão definitiva (pp. 142-144). O teu trigger das 8:05, o email de véspera e a inscrição no ginásio são isto.', aplico: 'Qual é o próximo compromisso que não depende de vontade?', pag: 'pp. 139-145' },
    { id: 'c15', cap: 15, data: '2026-10-09', titulo: 'O que é recompensado repete-se', tua: '', comp: 'Regra cardinal: o que é recompensado já repete-se; o que é punido já evita-se (p. 149). O cérebro prefere o imediato ao futuro (pp. 150-151). Precisas de te sentir bem-sucedido já, mesmo em pequeno (p. 152). Daí o traço dourado, a vibração e o "+1 voto" neste ecrã.', aplico: 'Recompensa fixa ao minuto 60, dita em voz alta.', pag: 'pp. 146-155' },
    { id: 'c16', cap: 16, data: '2026-10-10', titulo: 'Marcar, e nunca falhar duas vezes', tua: '', comp: 'Um X no calendário é uma recompensa em si (p. 157). Regista logo a seguir ao hábito: "depois de [hábito], marco" (p. 160). Falhar uma vez é acidente; falhar duas é o início de um hábito novo (p. 161). E cuidado com Goodhart: quando a medida vira alvo, deixa de medir (p. 162). Por isso há "parcial" e "versão de 2 minutos" aqui, e não há contadores a zero.', aplico: 'Depois de cada hábito, a app. Nunca o dia seguinte.', pag: 'pp. 156-164' },
    { id: 'c17', cap: 17, data: '2026-10-11', titulo: 'Alguém a ver', tua: '', comp: 'Um parceiro cria um custo imediato à inação (p. 166). O contrato de hábito torna o custo público e assinado (pp. 167-169). O botão Partilhar no Progresso é a versão leve; a versão séria é uma pessoa e uma data.', aplico: 'Escolhe o parceiro e envia-lhe o resumo semanal.', pag: 'pp. 165-172' },
    { id: 'c18', cap: 18, data: '2026-10-12', titulo: 'Escolhe o jogo que te favorece', tua: '', comp: 'Os genes não dispensam trabalho; dizem onde trabalhar (p. 181). Hábitos alinhados com as tuas forças são mais fáceis de manter (pp. 176-178). Se o jogo não existe, cria-o (p. 179). Sistemas, engenharia e integração são a tua pista.', aplico: 'O alvo de outubro encaixa nas tuas forças? Ajusta-o se não.', pag: 'pp. 173-181' },
    { id: 'c19', cap: 19, data: '2026-10-13', titulo: 'Na fronteira da capacidade, sem tédio', tua: '', comp: 'Motivação máxima nas tarefas mesmo à beira do que consegues (p. 184). A maior ameaça não é falhar, é o tédio (p. 186). "Os profissionais cumprem o horário; os amadores deixam a vida atrapalhar" (p. 187). A hora estica? É aqui que se corrige: hora fixa, fim fixo.', aplico: 'Sobe um degrau na dificuldade do bloco quando a sequência estiver estável.', pag: 'pp. 182-188' },
    { id: 'c20', cap: 20, data: '2026-10-14', titulo: 'Rever para não adormecer', tua: '', comp: 'Hábitos mais prática deliberada dão mestria (p. 191); hábitos sozinhos dão piloto automático (p. 190). Revisão anual: o que correu bem, o que não correu, o que aprendi; relatório de integridade: valores, integridade, padrão mais alto (pp. 194-195). Uma identidade agarrada com força demais impede crescer (p. 196).', aplico: 'Reflexão de identidade ao domingo; revisão dos 28 dias a 18 out; 90 dias a 21 dez.', pag: 'pp. 189-198' },
    { id: 'c21', cap: 21, data: '2026-10-15', titulo: 'Pequenas lições das quatro leis', tua: '', comp: 'Da conclusão e do apêndice: uma moeda não faz um rico, mas em algum ponto fez (p. 199). A emoção vem antes da razão; agimos pelo que sentimos (pp. 205-206). Satisfação = gostar menos querer: baixa a expectativa, sobe a satisfação (p. 208). As tuas ações revelam o que queres de facto (p. 207).', aplico: 'Plano de quatro leis para o alvo de novembro: uma linha por lei.', pag: 'pp. 199-210' }
  ];
  function licoesDesbloqueadas() { const h = hojeKey(); return LICOES.filter(l => l.data <= h); }
  function licaoDoDia() { const d = licoesDesbloqueadas(); return d.length ? d[d.length - 1] : null; }
  function abrirLicoes() {
    const painel = el('div', null);
    painel.append(el('div', { class: 'cab' }, el('h2', null, 'Lições'), el('button', { class: 'btn sec peq', onclick: fecharModal }, 'Fechar')));
    const desbl = licoesDesbloqueadas().map(l => l.id);
    LICOES.slice().reverse().forEach(l => {
      const aberta = desbl.indexOf(l.id) >= 0;
      const card = el('div', { class: 'licao' + (aberta ? '' : ' fechada') });
      card.append(el('div', { class: 'cab' }, el('div', null, el('div', { class: 'cap' }, 'Capítulo ' + l.cap + ' · ' + fmtCurta(l.data)), el('div', { class: 'titulo' }, l.titulo)), aberta ? el('button', { class: 'btn sec peq', onclick: ev => { S.licoes.lidas[l.id] = !S.licoes.lidas[l.id]; guardar(); ev.currentTarget.textContent = S.licoes.lidas[l.id] ? 'Lida' : 'Marcar lida'; atualizarBadge(); } }, S.licoes.lidas[l.id] ? 'Lida' : 'Marcar lida') : el('span', { class: 'quieto' }, 'abre a ' + fmtCurta(l.data))));
      if (aberta) {
        const corpo = el('div', { class: 'corpo' });
        if (l.tua) corpo.append(el('p', null, el('b', null, 'A tua nota. '), l.tua));
        corpo.append(el('p', null, el('b', null, 'Complemento. '), l.comp));
        corpo.append(el('p', { class: 'aplico' }, 'Aplico: ' + l.aplico));
        corpo.append(el('textarea', { placeholder: 'A tua nota de hoje sobre este capítulo…', oninput: e => { S.licoes.notas[l.id] = e.target.value; guardar(); } }, S.licoes.notas[l.id] || ''));
        corpo.append(el('div', { class: 'pag' }, 'Atomic Habits, páginas do PDF: ' + l.pag));
        card.append(corpo);
      }
      painel.append(card);
    });
    abrirModal(painel);
  }
  function atualizarBadge() { const l = licaoDoDia(); $('#badge-licao').classList.toggle('oculto', !(l && !S.licoes.lidas[l.id])); }

  /* ---------- sincronização ---------- */
  async function sincronizar(soObter) {
    if (!S.sync.url || !S.sync.token) { toast('Preenche o URL e o token.'); return; }
    toast(soObter ? 'A obter da folha…' : 'A sincronizar…');
    try {
      let resp;
      if (soObter) {
        resp = await fetch(S.sync.url + '?token=' + encodeURIComponent(S.sync.token) + '&t=' + Date.now(), { method: 'GET', redirect: 'follow' });
      } else {
        const corpo = { token: S.sync.token, registos: S.pendentes.slice(), reflexoes: S.reflexoes.filter(x => !x.enviada).map(x => ({ data: x.data, tipo: x.tipo, nota: x.nota, pergunta: x.pergunta, resposta: x.resposta })) };
        if (S.habitosSujos) corpo.habitos = S.habitos.map(h => ({ nome: h.nome, ativo: !!h.ativo, identidade: h.identidade, doisMin: h.doisMin, intencao: h.intencao, empilhar: h.empilhar, sinal: h.sinal, tentacao: h.tentacao, tribo: h.tribo, ritual: h.ritual, friccao: h.friccao, ambiente: h.ambiente, decisivo: h.decisivo, automacao: h.automacao, recompensa: h.recompensa, registo: h.registo, parceiro: h.parceiro, alvo: h.alvo, dias: diasTexto(parseDias(h.dias)), hora: h.hora, inicio: h.inicio, nota: h.nota }));
        if (S.scorecardSujo) corpo.scorecard = S.scorecard;
        resp = await fetch(S.sync.url, { method: 'POST', body: JSON.stringify(corpo), redirect: 'follow' });
      }
      const dados = await resp.json();
      if (!dados || !dados.ok) { toast('A folha recusou: ' + ((dados && dados.erro) || 'erro')); return; }
      aplicarEstado(dados, !soObter);
      S.sync.ultima = new Date().toISOString();
      guardar(); renderTudo(); agendarNotificacoes();
      toast(soObter ? 'Folha lida.' : 'Sincronizado.');
    } catch (e) {
      console.warn(e);
      toast('Sem ligação à folha. Os registos ficam guardados para a próxima.');
    }
  }
  function aplicarEstado(d, enviou) {
    // hábitos: a folha manda; cores e marcação de só-leitura mantêm-se
    if (Array.isArray(d.habitos) && d.habitos.length) {
      const antigos = {}; S.habitos.forEach(h => { antigos[h.nome] = h; });
      S.habitos = d.habitos.map((x, i) => {
        const a = antigos[x.nome] || {};
        return { nome: x.nome, cor: a.cor || CORES[i % CORES.length], ativo: !!x.ativo, soLeitura: x.nome === HORA_SAGRADA, identidade: x.identidade || '', doisMin: x.doisMin || '', intencao: x.intencao || '', empilhar: x.empilhar || '', sinal: x.sinal || '', tentacao: x.tentacao || '', tribo: x.tribo || '', ritual: x.ritual || '', friccao: x.friccao || '', ambiente: x.ambiente || '', decisivo: x.decisivo || '', automacao: x.automacao || '', recompensa: x.recompensa || '', registo: x.registo || '', parceiro: x.parceiro || '', alvo: Math.max(1, Number(x.alvo) || 1), dias: x.dias || 'todos', hora: x.hora || '', inicio: x.inicio || '', nota: x.nota || '' };
      });
      if (enviou) S.habitosSujos = false;
    }
    if (d.registos && typeof d.registos === 'object') {
      Object.keys(d.registos).forEach(nome => {
        S.registos[nome] = S.registos[nome] || {};
        Object.keys(d.registos[nome]).forEach(k => { S.registos[nome][k] = d.registos[nome][k]; });
      });
      if (enviou) S.pendentes = [];
    }
    if (Array.isArray(d.scorecard) && (enviou || !S.scorecardSujo)) { if (d.scorecard.length) S.scorecard = d.scorecard; if (enviou) S.scorecardSujo = false; }
    if (Array.isArray(d.reflexoes)) {
      const locaisNaoEnviadas = enviou ? [] : S.reflexoes.filter(x => !x.enviada);
      S.reflexoes = d.reflexoes.map(x => ({ data: x.data, tipo: x.tipo, nota: x.nota, pergunta: x.pergunta, resposta: x.resposta, enviada: true })).concat(locaisNaoEnviadas);
    }
    if (d.formUrl) S.sync.formUrl = d.formUrl;
  }

  /* ---------- exportar / importar ---------- */
  function exportar() {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'um-por-cento-' + hojeKey() + '.json'; document.body.append(a); a.click(); a.remove();
  }
  function importar() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = () => { const f = inp.files[0]; if (!f) return; const fr = new FileReader(); fr.onload = () => { try { const s = JSON.parse(fr.result); if (!s.habitos) throw new Error('x'); S = s; guardar(); renderTudo(); toast('Importado.'); } catch (e) { toast('Ficheiro inválido.'); } }; fr.readAsText(f); };
    inp.click();
  }

  /* ---------- navegação ---------- */
  function irPara(nome) {
    S.ui.ecra = nome; guardar();
    document.querySelectorAll('.ecra').forEach(s => s.classList.toggle('ativo', s.id === 'ecra-' + nome));
    document.querySelectorAll('nav.barra button').forEach(b => b.classList.toggle('ativo', b.dataset.ecra === nome));
    window.scrollTo(0, 0);
    renderTudo();
  }
  document.querySelectorAll('nav.barra button').forEach(b => b.addEventListener('click', () => irPara(b.dataset.ecra)));
  function renderTudo() {
    const e = S.ui.ecra || 'hoje';
    if (e === 'hoje') renderHoje();
    if (e === 'habitos') renderHabitos();
    if (e === 'scorecard') renderScorecard();
    if (e === 'progresso') renderProgresso();
    if (e === 'mais') renderMais();
    atualizarBadge();
  }
  function aplicarTema() { const t = S.ui.tema || 'auto'; if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }

  /* ---------- arranque ---------- */
  aplicarTema();
  if (S.ui.ecra && S.ui.ecra !== 'hoje') { document.querySelectorAll('.ecra').forEach(s => s.classList.toggle('ativo', s.id === 'ecra-' + S.ui.ecra)); document.querySelectorAll('nav.barra button').forEach(b => b.classList.toggle('ativo', b.dataset.ecra === S.ui.ecra)); }
  renderTudo();
  agendarNotificacoes();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { S.ui.diaSel = hojeKey(); renderTudo(); } });
  if ('serviceWorker' in navigator && !Cap.nativo && location.protocol.indexOf('http') === 0) { navigator.serviceWorker.register('./sw.js').catch(() => { /* sem sw */ }); }
  window.UmPorCento = { estado: () => S, sincronizar, versao: VERSAO };
})();
