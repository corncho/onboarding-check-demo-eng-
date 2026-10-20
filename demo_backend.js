/* Demo backend for the English version.
   It stands in for the Google Apps Script web app so the pages can be clicked through end to end
   with sample data only. Nothing is sent to any server; state lives in this browser (localStorage).
   Reset any time with the "Reset demo" link at the bottom left of every page. */
(function () {
  'use strict';
  var URLX = 'https://demo.invalid/exec';
  var KEY = 'qf_demo_state_v1';

  /* ---------- sample scenario (all fictional), dates are relative to today ---------- */
  function addDays(n) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; }
  function bizDay(n) { var d = addDays(n); while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1); return d; }   // due dates never fall on a weekend
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function mmdd(s) { var p = s.split('-'); return p[1] + p[2]; }
  var HIRE1 = iso(addDays(-33)), HIRE2 = iso(addDays(-92));
  var DEPT1 = 'Energy Division Operations Team';
  var DEPT2 = 'Convergence Division SI Business Solutions Team 1';
  var EXDEPT = 'Convergence Division SI Business';
  var P = {
    daniel: { token: 'DK7M2XQ4', role: '입사자', name: 'Daniel Kim' },
    grace:  { token: 'GL5R8WTN', role: '입사자', name: 'Grace Lee' },
    james:  { token: 'JC3H9ZPV', role: '팀장',   name: 'James Choi' },
    sarah:  { token: 'SH6K4DBA', role: '임원',   name: 'Sarah Han' }
  };
  var CODE = {
    n1: '1N-Daniel Kim-' + mmdd(HIRE1), h1: '1H-Daniel Kim-' + mmdd(HIRE1),
    n2: '2N-Grace Lee-' + mmdd(HIRE2), h2: '2H-Grace Lee-' + mmdd(HIRE2), e: '2E-Grace Lee-' + mmdd(HIRE2)
  };
  var DUE = { n1: iso(bizDay(2)), h1: iso(bizDay(5)), n2: iso(bizDay(3)), h2: iso(bizDay(7)), cats: iso(bizDay(7)), exec: iso(bizDay(10)) };

  /* ---------- links, same parameters as the real automation builds ---------- */
  var q = encodeURIComponent;
  function base() { return location.href.replace(/[?#].*$/, '').replace(/[^\/]*$/, ''); }
  function hub(tok) { return base() + 'my_tasks.html?me=' + q(tok); }
  function lnNew(round, name, dept, hire, cl, code, tok) {
    return base() + 'onboarding_survey.html?round=' + round + '&role=new&dept=' + q(dept) + '&hire=' + hire + '&cl=' + q(cl) + '&code=' + q(code) + '&name=' + q(name) + '&me=' + q(tok);
  }
  function lnHm(round, name, dept, hire, cl, code, leader, tok) {
    return base() + 'onboarding_survey.html?round=' + round + '&role=hm&dept=' + q(dept) + '&hire=' + hire + '&cl=' + q(cl) + '&code=' + q(code) + '&target=' + q(name) + '&name=' + q(leader) + '&me=' + q(tok);
  }
  function lnCats(name, dept, hire, cl, leader, code, ex, exdept, tok) {
    return base() + 'executive_approval.html?dept=' + q(dept) + '&target=' + q(name) + '&hire=' + hire + '&cl=' + q(cl) + '&hm=' + q(leader) + '&hmdept=' + q(dept) + '&code=' + q(code) + '&ex=' + q(ex) + '&exdept=' + q(exdept) + '&me=' + q(tok);
  }
  function lnExec(code, tok) { return base() + 'executive_approval.html?stage=exec&code=' + q(code) + '&me=' + q(tok); }

  function taskRows() {
    var d = P.daniel, g = P.grace, j = P.james, s = P.sarah;
    return [
      { who: d, k: 'n1', code: CODE.n1, target: 'Daniel Kim', due: DUE.n1, url: lnNew(1, 'Daniel Kim', DEPT1, HIRE1, 'CL2', CODE.n1, d.token) },
      { who: g, k: 'n2', code: CODE.n2, target: 'Grace Lee', due: DUE.n2, url: lnNew(2, 'Grace Lee', DEPT2, HIRE2, 'CL3', CODE.n2, g.token),
        next: { to: j.name, hub: hub(j.token), direct: lnHm(2, 'Grace Lee', DEPT2, HIRE2, 'CL3', CODE.h2, j.name, j.token) } },
      { who: j, k: 'h1', code: CODE.h1, target: 'Daniel Kim', due: DUE.h1, url: lnHm(1, 'Daniel Kim', DEPT1, HIRE1, 'CL2', CODE.h1, j.name, j.token) },
      { who: j, k: 'h2', code: CODE.h2, target: 'Grace Lee', due: DUE.h2, url: lnHm(2, 'Grace Lee', DEPT2, HIRE2, 'CL3', CODE.h2, j.name, j.token) },
      { who: j, k: 'cats', code: CODE.e, target: 'Grace Lee', due: DUE.cats, url: lnCats('Grace Lee', DEPT2, HIRE2, 'CL3', j.name, CODE.e, s.name, EXDEPT, j.token),
        next: { to: s.name, hub: hub(s.token), direct: lnExec(CODE.e, s.token) } },
      { who: s, k: 'exec', code: CODE.e, target: 'Grace Lee', due: DUE.exec, url: lnExec(CODE.e, s.token) }
    ];
  }

  /* ---------- state ---------- */
  var mem = null;
  function empty() { return { n1: {}, h1: {}, n2: {}, h2: {}, cats: {}, exec: {}, handoff: {} }; }
  function load() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { mem = null; }
    return mem || (mem = empty());
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {} }
  function reset() { mem = empty(); try { localStorage.removeItem(KEY); } catch (e) {} }
  function idOf(code) { return String(code || '').substring(3); }      // '1N-Daniel Kim-0912' -> 'Daniel Kim-0912'
  function kOfCode(code) { return { '1N': 'n1', '1H': 'h1', '2N': 'n2', '2H': 'h2', '2E': 'cats' }[String(code).substring(0, 2)] || ''; }
  function isDone(k, code) { return !!(load()[k] && load()[k][idOf(code)]); }
  function stateOf(k, code) {
    if (isDone(k, code)) return 'done';
    if (k === 'h2' && !isDone('n2', CODE.n2)) return 'wait';
    if (k === 'exec' && !isDone('cats', code)) return 'wait';
    return 'todo';
  }

  /* ---------- GET actions (JSONP) ---------- */
  function handleGet(p) {
    var a = p.action;
    if (a === 'ping') return { ok: true, message: 'demo', version: 'demo', build: 'demo' };
    if (a === 'checkLink') {
      var k = p.k || kOfCode(p.code);
      return { ok: true, status: 'open', done: k ? isDone(k, p.code) : false };
    }
    if (a === 'myTasks') {
      var person = null;
      Object.keys(P).forEach(function (n) { if (P[n].token === p.me) person = P[n]; });
      if (!person) return { ok: false, error: 'not_found' };
      var tasks = taskRows().filter(function (r) { return r.who === person; }).map(function (r) {
        return { k: r.k, code: r.code, who: r.target, due: r.due, st: stateOf(r.k, r.code), redo: false, url: r.url, next: r.next || null };
      });
      return { ok: true, data: { role: person.role, name: person.name, cycle: 'Demo', tasks: tasks } };
    }
    if (a === 'getSelf') {
      var id = idOf(p.code), n2 = load().n2[id];
      if (!n2) return { ok: true, data: { status: 'wait' } };
      if (load().h2[id]) return { ok: true, data: { status: 'done' } };
      return { ok: true, data: { status: 'ready', name: 'Grace Lee', dept: DEPT2, s: n2.answers } };
    }
    if (a === 'getPending') {
      var c = String(p.code), st = load();
      if (st.handoff[c]) return { ok: true, data: { code: c, status: 'pending', teamLead: st.handoff[c] } };
      if (st.exec[idOf(c)]) return { ok: true, data: { code: c, status: 'done', teamLead: {} } };
      if (st.cats[idOf(c)]) return { ok: true, data: { code: c, status: 'pending', teamLead: st.cats[idOf(c)] } };
      return { ok: false, error: 'not_found' };
    }
    return { ok: false, error: 'not_found' };
  }

  /* ---------- POST actions (fetch with a JSON body) ---------- */
  function handlePost(b) {
    var st = load(), id = idOf(b._code);
    if (b._kind === 'survey') {
      var rec = b.record || {};
      if (b._sheet === '1차_입사자') st.n1[id] = { at: Date.now() };
      else if (b._sheet === '1차_HM') st.h1[id] = { at: Date.now() };
      else if (b._sheet === '2차_입사자') {
        st.n2[id] = { at: Date.now(), answers: Object.keys(rec).filter(function (k) { return k.indexOf('자가점검_') === 0; }).map(function (k) { return rec[k]; }) };
      } else if (b._sheet === '2차_HM') st.h2[id] = { at: Date.now() };
    } else if (b._kind === 'self_handoff') {
      st.handoff[b._code] = b.teamLead;
    } else if (b._kind === 'exec_stage1') {
      st.cats[id] = b.teamLead || {};
    } else if (b._kind === 'exec_final') {
      st.exec[id] = { at: Date.now() };
    }
    save();
  }

  /* ---------- intercept JSONP script loads and POSTs to the fake address ---------- */
  var desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
  Object.defineProperty(HTMLScriptElement.prototype, 'src', {
    configurable: true,
    get: function () { return desc.get.call(this); },
    set: function (v) {
      if (String(v).indexOf(URLX) !== 0) { desc.set.call(this, v); return; }
      var params = {}; String(v).split('?')[1].split('&').forEach(function (kv) { var i = kv.indexOf('='); params[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1)); });
      var res = handleGet(params);
      setTimeout(function () { var f = window[params.callback]; if (typeof f === 'function') f(res); }, 250);
    }
  });
  var realFetch = window.fetch;
  window.fetch = function (u, opt) {
    if (String(u).indexOf(URLX) === 0) {
      try { handlePost(JSON.parse(opt.body)); } catch (e) {}
      return new Promise(function (r) { setTimeout(function () { r(new Response('OK')); }, 350); });
    }
    return realFetch.apply(this, arguments);
  };

  /* ---------- small banner with reset ---------- */
  window.QFDemo = { reset: reset, people: P };
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.createElement('div');
    b.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99;background:#1a2230;color:#fff;font:12px/1.4 system-ui,sans-serif;padding:8px 12px;border-radius:10px;opacity:.92;max-width:calc(100vw - 24px)';
    var narrow = window.innerWidth < 640;
    if (narrow) b.style.cssText += ';font-size:11px;padding:6px 10px;border-radius:8px';
    var home = location.pathname.indexOf('/emails/') >= 0 || location.pathname.indexOf('/guide/') >= 0 ? '../index.html' : 'index.html';
    b.innerHTML = '<b>DEMO</b> ' + (narrow ? 'sample data only' : 'sample data only, nothing is sent anywhere.') + ' <a href="' + home + '" style="color:#9ec1ff">Demo home</a> | <a href="#" id="qfReset" style="color:#9ec1ff">Reset demo</a>';
    document.body.appendChild(b);
    document.body.style.paddingBottom = '72px';   // keep the last lines of the page clear of the banner
    document.getElementById('qfReset').addEventListener('click', function (e) { e.preventDefault(); reset(); location.href = home; });
  });
})();
