// Unitable home page demos: a working day track, week, Due, Rooms and Friends,
// all driven by one demo clock on the demo account's Wednesday (Week 5).
// Geometry and behaviour follow apps/flutter/lib/today/day_track.dart.
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return reduceMq.matches; };

  // ---------- Geometry and formatting ----------

  var PX = 0.95;        // points per minute
  var FOLDED = 54;      // a folded pleat
  var MIN_SLAB = 44;
  var PLEAT_OVER = 90;  // free time longer than this folds
  var TODAY = 2;        // Wednesday
  var DAY0 = new Date(2026, 10, 16); // Monday 16 November 2026
  var WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var WD_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function hm(h, m) { return h * 60 + (m || 0); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function h12(m) { var h = Math.floor(m / 60) % 24; return h % 12 === 0 ? 12 : h % 12; }
  function ampm(m) { return Math.floor(m / 60) % 24 < 12 ? 'am' : 'pm'; }
  function mm(m) { var x = Math.round(m) % 60; return x < 10 ? '0' + x : '' + x; }
  // 10:38 (the now tab), 10:38 am, 2 pm
  function tab(m) { return h12(m) + ':' + mm(m); }
  function clock(m) { return h12(m) + ':' + mm(m) + '\u00a0' + ampm(m); }
  function short(m) { return Math.round(m) % 60 === 0 ? h12(m) + '\u00a0' + ampm(m) : clock(m); }
  function range(a, b) { return clock(a).replace('\u00a0' + ampm(a), ampm(a) === ampm(b) ? '' : '\u00a0' + ampm(a)) + '\u00a0– ' + clock(b); }
  // 11 am – 2 pm
  function span(a, b) { return short(a) + '\u00a0– ' + short(b); }
  // Countdowns round up, so it never says "0 min".
  function countdown(mins) {
    var m = Math.max(1, Math.ceil(mins - 1e-9));
    if (m < 60) return m + '\u00a0min';
    var h = Math.floor(m / 60), r = m % 60;
    return h + '\u00a0h' + (r ? ' ' + r + '\u00a0min' : '');
  }
  function spoken(mins) {
    var m = Math.max(1, Math.ceil(mins - 1e-9)), h = Math.floor(m / 60), r = m % 60;
    function u(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
    return h ? u(h, 'hour') + (r ? ' ' + u(r, 'minute') : '') : u(r, 'minute');
  }
  function dateOf(i) { return new Date(DAY0.getFullYear(), DAY0.getMonth(), DAY0.getDate() + i); }
  function dayName(i) { return WD[(i % 7 + 7) % 7]; }

  // ---------- The demo account's week ----------

  var HUES = { COMP1100: 0, ECON1101: 1, MATH1013: 2, STAT1003: 3 };
  var NAMES = {
    COMP1100: 'Programming as Problem Solving',
    ECON1101: 'Microeconomics 1',
    MATH1013: 'Mathematics and Applications 1',
    STAT1003: 'Statistical Techniques'
  };
  var uid = 0;
  function k(code, act, room, place, where, start, end, friends) {
    return { id: 'c' + (uid++), code: code, act: act, room: room, place: place, where: where, start: start, end: end, hue: HUES[code], friends: friends || [] };
  }
  var KAMBRI = ['Kambri Cinema', 'Kambri Cultural Centre Cinema', 'Kambri precinct'];
  var MCH = ['Manning Clark LT', 'Manning Clark Hall', 'Kambri precinct'];
  var WEEK = [
    { classes: [k('COMP1100', 'Lecture', KAMBRI[0], KAMBRI[1], KAMBRI[2], hm(10), hm(11), ['ST']), k('MATH1013', 'Lecture', MCH[0], MCH[1], MCH[2], hm(12), hm(13))] },
    { classes: [k('ECON1101', 'Lecture', 'Copland G31', 'Copland Theatre G31', 'Copland Building', hm(11), hm(13)), k('MATH1013', 'Tutorial', 'Hanna Neumann 1.33', 'Hanna Neumann, room 1.33', 'Hanna Neumann Building', hm(15), hm(16))] },
    { classes: [k('COMP1100', 'Lecture', KAMBRI[0], KAMBRI[1], KAMBRI[2], hm(10), hm(11), ['ST']), k('STAT1003', 'Lecture', 'Coombs LT', 'Coombs Lecture Theatre', 'Coombs Building', hm(14), hm(15))], sam: [hm(11), hm(13)] },
    { classes: [k('MATH1013', 'Lecture', MCH[0], MCH[1], MCH[2], hm(12), hm(13)), k('COMP1100', 'Computer lab', 'CSIT N113', 'CSIT, lab N113', 'CSIT Building', hm(14), hm(16), ['ST'])] },
    { classes: [k('ECON1101', 'Tutorial', 'Room 2.02', 'Copland, room 2.02', 'Copland Building', hm(9), hm(10)), k('STAT1003', 'Computer lab', 'Computer Lab 1.11', 'Copland, computer lab 1.11', 'Copland Building', hm(11), hm(13))] }
  ];

  // Deadlines, in minutes from Monday 16 Nov 00:00.
  function at(day, m) { return day * 1440 + m; }
  var DUE = [
    { id: 'q2', title: 'Quiz 2', code: 'STAT1003', kind: 'quiz', at: at(2, hm(23, 59)) },
    { id: 'ps3', title: 'Problem set 3', code: 'MATH1013', kind: 'homework', at: at(4, hm(23, 59)) },
    { id: 'lab6', title: 'Lab 6', code: 'COMP1100', kind: 'lab', at: at(5, hm(17)) },
    { id: 'tq4', title: 'Tutorial quiz 4', code: 'ECON1101', kind: 'quiz', at: at(7, hm(9)) },
    { id: 'a2s', title: 'Assignment 2', code: 'STAT1003', kind: 'assignment', at: at(10, hm(23, 59)) },
    { id: 'mid', title: 'Mid-semester exam', code: 'MATH1013', kind: 'exam', at: at(11, hm(14)) },
    { id: 'a2c', title: 'Assignment 2: Lambda calculus', code: 'COMP1100', kind: 'assignment', at: at(15, hm(23, 59)) },
    { id: 'ess', title: 'Essay plan', code: 'ECON1101', kind: 'assignment', at: at(17, hm(17)) }
  ];
  var KIND = { quiz: 'Quiz', homework: 'Homework', lab: 'Lab', assignment: 'Assignment', exam: 'Exam' };

  var START = hm(8), END = hm(18);
  var S = {
    t: hm(10, 38),
    day: TODAY,
    open: null,
    unfolded: {},
    playing: !reduced(),
    visible: true,
    done: {},
    dueFilter: 'all',
    roomsWhen: 'now',
    roomsQ: '',
    roomsOpen: {},
    people: { ST: true, MC: false, JL: false },
    seen: 'busy'
  };
  function nowAbs() { return at(TODAY, S.t); }
  function icon(id) { return '<svg class="icon" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }
  function samFree(day, m) { var s = WEEK[day].sam; return !!s && m >= s[0] && m < s[1]; }

  // ---------- Today: the answer ----------

  function codeSpan(c) { return '<span class="c h' + c.hue + '">' + c.code + '</span>'; }

  function answerFor(d, t) {
    var cl = WEEK[d].classes, first = cl[0], last = cl[cl.length - 1];
    if (d < TODAY) return { a: '<span class="d">Done at</span> ' + short(last.end), s: cl.length + ' classes · ' + cl.map(function (c) { return c.code; }).join(', ') };
    if (d > TODAY) {
      var then = cl[1];
      return {
        a: codeSpan(first) + ' <span class="d">at</span> ' + short(first.start),
        s: then ? 'Then ' + then.code + ' ' + then.act + ' at ' + short(then.start) + ' · done at ' + short(last.end) : 'Done at ' + short(last.end)
      };
    }
    for (var i = 0; i < cl.length; i++) {
      var c = cl[i], next = cl[i + 1];
      if (t >= c.start && t < c.end) {
        var sub = 'Then you’re done for the day';
        if (next) {
          var gap = next.start - c.end;
          var sam = WEEK[d].sam, ov = sam ? Math.max(0, Math.min(sam[1], next.start) - Math.max(sam[0], c.end)) : 0;
          sub = gap >= 15
            ? 'Then ' + countdown(gap) + ' free' + (ov ? ', ' + (ov >= gap ? 'all' : countdown(ov)) + ' with Sam' : '') + ' · ' + next.code + ' at ' + short(next.start)
            : 'Then ' + next.code + ' ' + next.act + ' · ' + next.room;
        }
        return { a: codeSpan(c) + ' <span class="d">ends in</span> ' + countdown(c.end - t), s: sub };
      }
      if (t < c.start) {
        if (i === 0) return { a: codeSpan(c) + ' <span class="d">in</span> ' + countdown(c.start - t), s: c.act + ' · ' + c.room };
        return { a: '<span class="d">Free for</span> ' + countdown(c.start - t), s: (samFree(d, t) ? 'Sam is free until ' + short(WEEK[d].sam[1]) + ' · ' : '') + c.code + ' at ' + short(c.start) };
      }
    }
    return { a: '<span class="d">Done for</span> today', s: '<span class="u">Quiz 2</span> due tonight · MATH1013 at 12 pm tomorrow' };
  }

  // ---------- Today: the day track ----------

  var els = {};
  var nowEl = document.createElement('div');
  nowEl.className = 'now';
  nowEl.setAttribute('aria-hidden', 'true');
  nowEl.innerHTML = '<div class="now-tab"><span></span></div>';

  function pieces(d) {
    var cl = WEEK[d].classes, out = [];
    cl.forEach(function (c, i) {
      if (i > 0) {
        var gap = c.start - cl[i - 1].end;
        if (gap >= 15) out.push({ free: true, id: 'f' + d + '-' + i, start: cl[i - 1].end, end: c.start });
      }
      out.push(c);
    });
    return out;
  }
  function slabH(c) { return Math.max(MIN_SLAB, Math.round((c.end - c.start) * PX)); }
  function pleatH(p) { var full = Math.round((p.end - p.start) * PX); return p.end - p.start > PLEAT_OVER && !S.unfolded[p.id] ? FOLDED : full; }

  function slabHTML(c, d) {
    var bh = slabH(c), roomy = bh >= 96;
    var who = c.friends.length ? '<div class="who">' + c.friends.map(function () { return '<span class="av h5" style="--s:18px;--ring:var(--fill)">ST</span>'; }).join('') + '</div>' : '';
    var hd = '<div class="l1"><span class="code">' + c.code + '</span><span class="act">' + esc(c.act) + '</span></div>' +
      '<div class="l2">' + esc(roomy ? c.room + ' · ' + c.where : c.room) + '</div>' + (roomy ? who : '');
    var detail =
      '<div class="dt-in"><div class="dt-rule"></div>' +
      '<div class="when" data-when>' + range(c.start, c.end) + ' · ' + countdown(c.end - c.start) + '</div>' +
      '<div class="where">' + esc(c.place) + '<small>' + esc(NAMES[c.code]) + '</small></div>' +
      (c.friends.length ? '<div class="with"><span class="av h5" style="--s:22px" aria-hidden="true">ST</span>Sam is in this class too</div>' : '') +
      '<div class="acts"><a class="ghost" href="#rooms">' + icon('rooms') + 'Free rooms nearby</a></div></div>';
    return '<div class="piece" data-id="' + c.id + '">' +
      '<div class="tlabel">' + tab(c.start) + '<small>' + ampm(c.start) + '</small></div>' +
      '<div class="slab h' + c.hue + '" style="--bh:' + bh + 'px">' +
      '<div class="spent"></div>' +
      '<div class="hd s" aria-hidden="true">' + hd + '</div>' +
      '<div class="hd a" aria-hidden="true">' + hd + '</div>' +
      '<span class="left-tag" aria-hidden="true"></span>' +
      '<button class="hit" type="button" aria-expanded="false" aria-controls="dt-' + c.id + '"></button>' +
      '<div class="body"></div>' +
      '<div class="dt" id="dt-' + c.id + '" role="region" aria-label="' + c.code + ' details" inert>' + detail + '</div>' +
      '</div></div>';
  }

  function brk(side, open) {
    var p = 'M2 6.5L8 2.5M2 11.5L8 7.5';
    return '<svg class="brk ' + side + '" viewBox="0 0 10 14" aria-hidden="true"' + (open ? ' style="--fold:0"' : '') + '><path class="bg" d="' + p + '"/><path class="fg" d="' + p + '"/></svg>';
  }

  function pleatHTML(p, d) {
    var len = p.end - p.start, foldable = len > PLEAT_OVER, sam = WEEK[d].sam;
    var shared = sam && sam[0] < p.end && sam[1] > p.start ? [Math.max(sam[0], p.start), Math.min(sam[1], p.end)] : null;
    var t2 = span(p.start, p.end) + (shared ? ' · Sam is free too' : '');
    var marks = '';
    for (var h = Math.floor(p.start / 60) + 1; h * 60 < p.end; h++) marks += '<span style="top:' + Math.round((h * 60 - p.start) * PX) + 'px">' + short(h * 60) + '</span>';
    var label = spoken(len) + ' free, ' + short(p.start) + ' to ' + short(p.end) + (shared ? ', Sam is free too' : '');
    var open = !foldable || S.unfolded[p.id];
    return '<div class="piece" data-id="' + p.id + '">' +
      '<div class="pleat' + (foldable ? '' : ' fixed') + (len < 75 ? ' short' : '') + (open ? ' unfolded' : '') + '" style="height:' + pleatH(p) + 'px;--open:' + (open ? 1 : 0) + '">' +
      (shared ? '<div class="shared" style="--s0:' + ((shared[0] - p.start) / len * 100) + '%;--s1:' + ((p.end - shared[1]) / len * 100) + '%"></div>' : '') +
      '<div class="edge"></div>' +
      (foldable ? '<div class="marks" aria-hidden="true">' + marks + '</div>' : '') +
      '<div class="txt" aria-hidden="true"><div class="t1">' + countdown(len) + ' free</div><div class="t2">' + t2 + '</div></div>' +
      (shared ? '<span class="av h5 free" style="--ring:var(--ground)" aria-hidden="true">ST</span>' : '') +
      (foldable ? '<button class="hit" type="button" aria-expanded="' + !!open + '" aria-label="' + label + '"></button>' +
        '<a class="ghost rooms" href="#rooms" tabindex="' + (open ? 0 : -1) + '">' + icon('rooms') + 'Free rooms nearby</a>' : '<span class="sr">' + label + '</span>') +
      '</div>' + (foldable ? brk('l', open) + brk('r', open) : '') + '</div>';
  }

  function renderDay(dir) {
    var d = S.day, ps = pieces(d), cl = WEEK[d].classes;
    var html = '<div class="day' + (dir ? ' enter' + (dir < 0 ? ' back' : '') : '') + '"><div class="track">' +
      ps.map(function (p) { return p.free ? pleatHTML(p, d) : slabHTML(p, d); }).join('') +
      '</div><div class="day-end">Done at ' + short(cl[cl.length - 1].end) + '</div></div>';
    els.day.innerHTML = html;
    els.dayEl = els.day.firstChild;
    els.track = $('.track', els.dayEl);
    els.pieces = {};
    ps.forEach(function (p) { els.pieces[p.id] = { p: p, el: els.track.querySelector('[data-id="' + p.id + '"]') }; });
    if (S.open && els.pieces[S.open]) setOpen(S.open, true, true);
  }

  // Time-dependent parts of the day; cheap enough to run every tick.
  function updateDay() {
    var d = S.day, t = S.t, cl = WEEK[d].classes;
    var live = null;
    if (d === TODAY) {
      for (var i = 0; i < cl.length; i++) if (t < cl[i].end) { live = cl[i]; break; }
    }
    var nowHost = null, nowTop = null, nowPct = null;
    // The now tab sits in the time column: hide a start label it would cover (as the app does).
    var ids = Object.keys(els.pieces), hideLabel = null;
    if (d === TODAY) ids.forEach(function (id, i) {
      var p = els.pieces[id].p;
      if (t < p.start || t >= p.end) return;
      if (!p.free && (t - p.start) / (p.end - p.start) * slabH(p) < 46) hideLabel = id;
      if (p.free && ids[i + 1] && (1 - (t - p.start) / (p.end - p.start)) * pleatH(p) < 30) hideLabel = ids[i + 1];
    });
    ids.forEach(function (id) {
      var item = els.pieces[id], p = item.p, el = item.el;
      var past = d < TODAY || (d === TODAY && t >= p.end);
      var happening = d === TODAY && t >= p.start && t < p.end;
      if (p.free) {
        if (happening) { nowHost = el; nowPct = (t - p.start) / (p.end - p.start); }
        return;
      }
      var slab = el.querySelector('.slab'), bh = slabH(p);
      var sp = past ? bh : happening ? bh * (t - p.start) / (p.end - p.start) : 0;
      slab.style.setProperty('--sp', sp.toFixed(1) + 'px');
      slab.classList.toggle('past', past);
      slab.classList.toggle('live', p === live);
      var lbl = el.querySelector('.tlabel');
      lbl.classList.toggle('past', past);
      lbl.classList.toggle('hide', id === hideLabel);
      var tag = el.querySelector('.left-tag');
      if (happening) {
        // What's left sits in the part that's left; near the end it moves up beside the code.
        var below = bh - sp >= 18;
        tag.textContent = countdown(p.end - t) + ' left';
        tag.style.top = below ? (sp + 3) + 'px' : '9px';
        tag.classList.toggle('top', !below);
        tag.hidden = false;
      } else tag.hidden = true;
      if (happening) { nowHost = el; nowTop = sp; }
      var label = p.code + ' ' + p.act + ', ' + short(p.start) + ' to ' + short(p.end) + ', ' + p.place +
        (happening ? ', ends in ' + spoken(p.end - t) : past ? ', finished' : d === TODAY ? ', starts in ' + spoken(p.start - t) : '');
      var hit = el.querySelector('.hit');
      if (hit.getAttribute('aria-label') !== label) hit.setAttribute('aria-label', label);
      var when = el.querySelector('[data-when]');
      var w = range(p.start, p.end) + ' · ' + countdown(p.end - p.start) + (d === TODAY && t < p.start ? '<span> · in ' + countdown(p.start - t) + '</span>' : '');
      if (when.innerHTML !== w) when.innerHTML = w;
    });

    nowEl.querySelector('span').textContent = tab(t);
    if (d !== TODAY) { if (nowEl.parentNode) nowEl.remove(); return; }
    if (nowHost) {
      nowEl.classList.remove('outside');
      if (nowEl.parentNode !== nowHost) nowHost.appendChild(nowEl);
      nowEl.style.top = nowTop != null ? nowTop + 'px' : 'calc(' + (nowPct * 100).toFixed(3) + '%)';
    } else {
      nowEl.classList.add('outside');
      nowEl.style.top = '';
      var before = t < cl[0].start;
      var ref = before ? els.track : els.dayEl.querySelector('.day-end');
      if (nowEl.nextSibling !== ref || nowEl.parentNode !== els.dayEl) els.dayEl.insertBefore(nowEl, before ? els.track : ref.nextSibling);
    }
  }

  function setOpen(id, open, instant) {
    var item = els.pieces[id];
    if (!item) return;
    var slab = item.el.querySelector('.slab'), dt = slab.querySelector('.dt'), hit = slab.querySelector('.hit');
    var h = dt.firstChild.scrollHeight;
    if (instant) dt.style.transition = 'none';
    dt.style.height = open ? h + 'px' : '0px';
    slab.classList.toggle('open', open);
    hit.setAttribute('aria-expanded', String(open));
    dt.inert = !open;
    if (instant) { dt.offsetHeight; dt.style.transition = ''; }
  }

  function toggleSlab(id) {
    if (S.open && S.open !== id) setOpen(S.open, false);
    var open = S.open !== id;
    S.open = open ? id : null;
    setOpen(id, open);
  }

  function togglePleat(id) {
    var item = els.pieces[id], p = item.p, pl = item.el.querySelector('.pleat');
    S.unfolded[id] = !S.unfolded[id];
    var open = S.unfolded[id];
    pl.style.height = pleatH(p) + 'px';
    pl.style.setProperty('--open', open ? 1 : 0);
    pl.classList.toggle('unfolded', open);
    item.el.querySelectorAll('.brk').forEach(function (b) { b.style.setProperty('--fold', open ? 0 : 1); });
    pl.querySelector('.hit').setAttribute('aria-expanded', String(open));
    pl.querySelector('.rooms').tabIndex = open ? 0 : -1;
  }

  // ---------- Today: ruler, stakes, header ----------

  function miniHTML(d, t) {
    var out = '';
    WEEK[d].classes.forEach(function (c) {
      var top = 3 + (c.start - START) / (END - START) * 16, h = Math.max(2, (c.end - c.start) / (END - START) * 16);
      var gone = d < TODAY || (d === TODAY && t >= c.end);
      out += '<i class="h' + c.hue + (gone ? ' gone' : '') + '" style="top:' + top.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px"></i>';
    });
    if (d === TODAY && t > START && t < END) out += '<b style="top:' + (3 + (t - START) / (END - START) * 16 - 0.75).toFixed(1) + 'px"></b>';
    return out;
  }

  function renderRuler() {
    var html = '';
    for (var d = 0; d < 5; d++) {
      var date = dateOf(d);
      html += '<button type="button" data-day="' + d + '" aria-pressed="' + (d === S.day) + '"' + (d === TODAY ? ' aria-current="date"' : '') +
        ' aria-label="' + WD_LONG[d] + ' ' + date.getDate() + ' November, ' + WEEK[d].classes.length + ' classes">' +
        '<span class="wd" aria-hidden="true">' + WD[d].toUpperCase() + '</span><span class="mini" aria-hidden="true"></span><span class="num" aria-hidden="true">' + date.getDate() + '</span></button>';
    }
    els.ruler.innerHTML = html + '<span class="mark" aria-hidden="true"></span>';
    els.mark = $('.mark', els.ruler);
  }

  function updateRuler() {
    var btns = els.ruler.querySelectorAll('button');
    for (var d = 0; d < 5; d++) {
      btns[d].setAttribute('aria-pressed', String(d === S.day));
      var m = miniHTML(d, S.t), mini = btns[d].querySelector('.mini');
      if (mini.innerHTML !== m) mini.innerHTML = m;
    }
    els.mark.style.transform = 'translateX(' + S.day * 100 + '%)';
  }

  function dueLevel(item, now) {
    if (S.done[item.id]) return 'done';
    var left = item.at - now;
    return left < 0 ? 'past' : left < 1440 ? 'urgent' : left < 3 * 1440 ? 'soon' : 'later';
  }
  function dueWhen(item, now) {
    var day = Math.floor(item.at / 1440), today = Math.floor(now / 1440), m = item.at % 1440;
    if (day === today) return m >= hm(17) ? 'Tonight' : 'Today';
    if (day === today + 1) return 'Tomorrow';
    if (day - today < 7) return dayName(day);
    var dt = dateOf(day);
    return dt.getDate() + ' ' + MONTHS[dt.getMonth()];
  }
  function tileHTML(item, level, size) {
    var cls = level === 'urgent' ? ' urgent' : level === 'soon' ? ' soon' : level === 'done' ? ' done' : '';
    return '<span class="tile h' + HUES[item.code] + cls + '" style="--s:' + size + 'px">' + icon(level === 'done' ? 'check' : item.kind) + '</span>';
  }

  function renderStakes() {
    var now = nowAbs();
    var upcoming = DUE.filter(function (x) { return x.at > now && !S.done[x.id]; });
    var urgent = upcoming.filter(function (x) { return x.at - now < 1440; });
    var soon = upcoming.filter(function (x) { return x.at - now >= 1440; }).slice(0, Math.max(1, 3 - urgent.length));
    function row(x) {
      var lv = dueLevel(x, now), w = dueWhen(x, now);
      return '<div class="stake h' + HUES[x.code] + '" role="listitem" aria-label="' + esc(x.title + ', ' + x.code + ', due ' + w + ' at ' + clock(x.at % 1440)) + (lv === 'urgent' ? ', due within a day' : '') + '">' +
        '<span class="t" aria-hidden="true">' + (lv === 'urgent' ? tab(x.at % 1440) : '') + '</span>' + tileHTML(x, lv, 22) +
        '<span class="ti" aria-hidden="true">' + (lv === 'later' ? esc(x.title) : '<b>' + esc(x.title) + '</b>') + '<span class="c">' + x.code + '</span></span>' +
        '<span class="w ' + lv + '" aria-hidden="true">' + w + '</span></div>';
    }
    var html = (urgent.length ? '<div role="list" aria-label="Due within a day">' + urgent.map(row).join('') + '</div>' : '') +
      (soon.length ? '<div class="stakes-h" aria-hidden="true">Due soon</div><div role="list" aria-label="Due soon">' + soon.map(row).join('') + '</div>' : '');
    if (els.stakes.innerHTML !== html) els.stakes.innerHTML = html;
  }

  function updateHeader() {
    var d = S.day, date = dateOf(d);
    var line = (d === TODAY ? 'Today · ' : '') + WD[d] + ' ' + date.getDate() + ' Nov · Week 5';
    if (els.dateline.textContent !== line) els.dateline.textContent = line;
    var a = answerFor(d, S.t);
    if (els.answer.innerHTML !== a.a) els.answer.innerHTML = a.a;
    if (els.answerSub.innerHTML !== a.s) els.answerSub.innerHTML = a.s;
  }

  // ---------- The demo clock ----------

  var timer = null;
  function setClockUI() {
    els.statusTime.textContent = tab(S.t);
    els.read.textContent = clock(S.t);
    els.scrub.value = Math.round(S.t);
    els.scrub.setAttribute('aria-valuetext', 'Wednesday ' + clock(S.t));
    // The scrubber's bed is a sideways day: course ticks, grey once spent.
    var span = END - START, stops = [];
    WEEK[TODAY].classes.forEach(function (c) {
      var a = ((c.start - START) / span * 100).toFixed(2), b = ((c.end - START) / span * 100).toFixed(2);
      var col = S.t >= c.end ? 'var(--spent)' : 'var(--h' + c.hue + '-acc)';
      stops.push('linear-gradient(to right, transparent ' + a + '%, ' + col + ' ' + a + '%, ' + col + ' ' + b + '%, transparent ' + b + '%) 0 7px / 100% 8px no-repeat');
    });
    var p = ((S.t - START) / span * 100).toFixed(2);
    stops.push('linear-gradient(to right, var(--spent) ' + p + '%, transparent ' + p + '%) 0 0 / 100% 100% no-repeat');
    stops.push('var(--track)');
    els.scrub.style.setProperty('--rbg', stops.join(', '));
    var label = S.playing ? 'Pause the demo clock' : S.t >= END ? 'Replay the day' : 'Play the demo clock';
    els.play.setAttribute('aria-label', label);
    els.play.querySelector('use').setAttribute('href', S.playing ? '#i-pause' : S.t >= END ? '#i-replay' : '#i-play');
  }

  var lastMinute = -1;
  function update() {
    setClockUI();
    updateHeader();
    updateDay();
    updateRuler();
    var minute = Math.floor(S.t);
    if (minute !== lastMinute) {
      lastMinute = minute;
      renderStakes();
      updateWeek();
      updateMoments();
      tickDue();
      tickRooms();
      tickFriends();
    }
  }

  function run() {
    clearInterval(timer);
    timer = null;
    if (S.playing && S.visible && !document.hidden) {
      timer = setInterval(function () {
        S.t = Math.min(END, S.t + 1);
        if (S.t >= END) { S.playing = false; run(); }
        update();
      }, 1000);
    }
  }
  function setPlaying(on) {
    if (on && S.t >= END) S.t = hm(8, 30);
    S.playing = on;
    run();
    update();
  }
  function setDay(d, openId) {
    if (d === S.day && !openId) return;
    var dir = d === S.day ? 0 : d > S.day ? 1 : -1;
    if (S.open && (!openId || openId !== S.open)) S.open = null;
    S.day = d;
    if (openId) S.open = openId;
    renderDay(dir);
    update();
  }

  // ---------- Answer-first moments ----------

  var MOMENTS = [hm(9, 40), hm(10, 38), hm(11, 15), hm(14, 50), hm(16, 10)];
  function renderMoments() {
    els.moments.innerHTML = MOMENTS.map(function (m) {
      var a = answerFor(TODAY, m);
      return '<li data-m="' + m + '"><div class="now-tab" aria-hidden="true"><span>' + tab(m) + '</span></div>' +
        '<div class="answer"><span class="sr">At ' + clock(m) + ': </span>' + a.a + '</div><div class="answer-sub">' + a.s + '</div></li>';
    }).join('');
  }
  function updateMoments() {
    var best = null;
    MOMENTS.forEach(function (m) { if (m <= S.t) best = m; });
    els.moments.querySelectorAll('li').forEach(function (li) { li.classList.toggle('is-now', +li.dataset.m === best); });
  }

  // ---------- Week ----------

  var WK = { start: hm(9), end: hm(17), px: 0.75 };
  function renderWeek() {
    var h = (WK.end - WK.start) * WK.px, html = '<div></div>';
    for (var d = 0; d < 5; d++) html += '<div class="wh' + (d === TODAY ? ' today' : '') + '">' + WD[d].toUpperCase() + '<b>' + dateOf(d).getDate() + '</b></div>';
    html += '<div class="axis" style="height:' + h + 'px" aria-hidden="true">';
    for (var x = WK.start; x <= WK.end; x += 60) html += '<span style="top:' + (x - WK.start) * WK.px + 'px">' + h12(x) + '</span>';
    html += '</div>';
    for (d = 0; d < 5; d++) {
      html += '<div class="wcol" style="height:' + h + 'px" role="group" aria-label="' + WD_LONG[d] + '">';
      WEEK[d].classes.forEach(function (c) {
        var top = (c.start - WK.start) * WK.px + 2, ht = (c.end - c.start) * WK.px - 4;
        html += '<button type="button" class="wslab h' + c.hue + '" data-d="' + d + '" data-id="' + c.id + '" style="top:' + top + 'px;height:' + ht + 'px" aria-label="' +
          c.code + ' ' + c.act + ', ' + WD_LONG[d] + ' ' + short(c.start) + ' to ' + short(c.end) + '. Open on the day">' +
          '<i class="spent"></i>' + ['s', 'a'].map(function (layer) {
            return '<span class="wt ' + layer + '"' + (layer === 's' ? ' aria-hidden="true"' : '') + '><span class="cl">' + c.code.slice(0, 4) + '</span><span class="cn">' + c.code.slice(4) + '</span>' +
              (c.end - c.start >= 120 ? '<span class="ca">' + esc(c.act === 'Computer lab' ? 'Lab' : c.act) + '</span>' : '') + '</span>';
          }).join('') + '</button>';
      });
      if (d === TODAY) html += '<div class="wnow" aria-hidden="true"></div>';
      html += '</div>';
    }
    els.week.innerHTML = html;
  }
  function updateWeek() {
    var t = S.t, cl = WEEK[TODAY].classes, live = null;
    for (var i = 0; i < cl.length; i++) if (t < cl[i].end) { live = cl[i]; break; }
    els.week.querySelectorAll('.wslab').forEach(function (b) {
      var d = +b.dataset.d, c = WEEK[d].classes.filter(function (x) { return x.id === b.dataset.id; })[0];
      var past = d < TODAY || (d === TODAY && t >= c.end), happening = d === TODAY && t >= c.start && t < c.end;
      b.classList.toggle('past', past);
      b.classList.toggle('live', c === live);
      var ht = (c.end - c.start) * WK.px - 4;
      b.style.setProperty('--sp', (past ? ht : happening ? ht * (t - c.start) / (c.end - c.start) : 0) + 'px');
    });
    var wn = $('.wnow', els.week);
    if (wn) { wn.hidden = t < WK.start || t > WK.end; wn.style.top = (t - WK.start) * WK.px + 'px'; }
  }

  // ---------- Due ----------

  var dueSig = '';
  function renderDue() {
    var now = nowAbs(), f = S.dueFilter, start = at(TODAY, 0), span = 14 * 1440;
    var codes = ['all', 'COMP1100', 'ECON1101', 'MATH1013', 'STAT1003'];
    els.dueChips.innerHTML = codes.map(function (c) {
      return '<button type="button" class="chip" data-f="' + c + '" aria-pressed="' + (f === c) + '">' + (c === 'all' ? 'All' : c) + '</button>';
    }).join('');

    var rw = '<div class="bed"></div><span class="lbl today" style="left:0">Today</span>';
    [7, 14].forEach(function (i) {
      var x = ((at(i, 0) - start) / span * 100) + '%';
      rw += '<span class="mon" style="left:' + x + '"></span><span class="lbl" style="left:calc(' + x + ' + 4px)">Mon ' + dateOf(i).getDate() + '</span>';
    });
    DUE.forEach(function (x) {
      if (x.at - start > span) return;
      var lv = dueLevel(x, now);
      rw += '<span class="dia h' + HUES[x.code] + (lv === 'urgent' ? ' urgent' : '') + (lv === 'done' ? ' done' : '') + (f !== 'all' && f !== x.code ? ' off' : '') +
        '" style="left:' + ((x.at - start) / span * 100).toFixed(2) + '%"></span>';
    });
    rw += '<span class="rnow" style="left:' + ((now - start) / span * 100).toFixed(2) + '%"></span>';
    els.runway.innerHTML = rw;

    function row(x) {
      var lv = dueLevel(x, now), w = dueWhen(x, now);
      return '<div class="row h' + HUES[x.code] + (lv === 'done' ? ' done' : '') + '"' + (f !== 'all' && f !== x.code ? ' hidden' : '') + '>' +
        '<button type="button" class="tilebtn" data-done="' + x.id + '" aria-pressed="' + (lv === 'done') + '" aria-label="' + esc((lv === 'done' ? 'Mark not done: ' : 'Mark done: ') + x.title) + '">' + tileHTML(x, lv, 30) + '</button>' +
        '<div style="min-width:0"><div class="tt">' + esc(x.title) + '</div><div class="ss"><span class="c">' + x.code + '</span> · ' + KIND[x.kind] + '</div></div>' +
        '<div class="ww' + (lv === 'urgent' ? ' urgent' : '') + '">' + w + '<small>' + clock(x.at % 1440) + '</small></div></div>';
    }
    var soon = DUE.filter(function (x) { return x.at - now < 7 * 1440; }), later = DUE.filter(function (x) { return x.at - now >= 7 * 1440; });
    function list(items) {
      var shown = items.filter(function (x) { return f === 'all' || f === x.code; }).length;
      return items.map(row).join('') + (shown ? '' : '<div class="empty">Nothing for ' + f + ' here.</div>');
    }
    els.dueSoon.innerHTML = list(soon);
    els.dueLater.innerHTML = list(later);
    tickDue(true);
  }
  function tickDue(force) {
    var now = nowAbs();
    var sig = DUE.map(function (x) { return dueLevel(x, now); }).join();
    if (!force && sig !== dueSig) { dueSig = sig; renderDue(); return; }
    dueSig = sig;
    var next = DUE.filter(function (x) { return x.at > now && !S.done[x.id]; })[0];
    var inWeek = DUE.filter(function (x) { return x.at > now && x.at - now < 7 * 1440 && !S.done[x.id]; }).length;
    var a, s;
    if (!next) { a = '<span class="d">Nothing</span> due'; s = 'All caught up'; }
    else {
      var days = Math.floor(next.at / 1440) - Math.floor(now / 1440), w = dueWhen(next, now).toLowerCase();
      a = '<span class="d">Next due</span> ' + (days === 0 ? '<span class="u">' + w + '</span>' : days === 1 ? w : 'in ' + days + ' days');
      s = '<span class="c h' + HUES[next.code] + '">' + esc(next.title) + '</span> · ' + next.code + ' at ' + clock(next.at % 1440) + ' · ' + inWeek + ' due in the next 7 days';
    }
    els.dueAnswer.innerHTML = a;
    els.dueSub.innerHTML = s;
  }

  // ---------- Rooms ----------

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6d2b79f5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var BUILDINGS = [
    ['Marie Reay Teaching Centre', 'Marie Reay', 22, 20, 240],
    ['Hanna Neumann', 'Hanna Neumann', 14, 24, 60],
    ['CSIT', 'CSIT', 16, 20, 120],
    ['Copland', 'Copland', 13, 20, 300],
    ['Coombs Extension', 'Coombs Ext', 10, 16, 48],
    ['Chifley Library', 'Chifley study room', 12, 4, 8],
    ['Peter Karmel', 'Peter Karmel', 9, 12, 125],
    ['Baldessin Precinct', 'Baldessin', 11, 20, 52],
    ['AD Hope', 'AD Hope', 8, 18, 35],
    ['Kambri Cultural Centre', 'Kambri', 6, 30, 160]
  ].map(function (b, bi) {
    var r = rng(bi * 97 + 13), rooms = [];
    for (var i = 0; i < b[2]; i++) {
      var floor = 1 + Math.floor(r() * 3), num = floor + '.' + String((i + 1) * 2).padStart(2, '0');
      var seats = Math.round((b[3] + Math.pow(r(), 2.2) * (b[4] - b[3])) / 2) * 2;
      // A day of bookings for Wednesday (0) and Thursday (1).
      var days = [0, 1].map(function () {
        var busy = [], m = hm(8) + Math.floor(r() * 3) * 30;
        while (m < hm(18)) {
          if (r() < 0.42) { var len = (1 + Math.floor(r() * 3)) * 60; busy.push([m, Math.min(hm(18), m + len)]); m += len; }
          else m += 60 + Math.floor(r() * 2) * 30;
        }
        return busy;
      });
      rooms.push({ name: b[1] + ' ' + num, num: num, seats: seats, days: days });
    }
    return { name: b[0], rooms: rooms, max: Math.max.apply(null, rooms.map(function (x) { return x.seats; })) };
  });
  var WHEN = [
    { id: 'now', label: 'Now' },
    { id: 'hour', label: 'In an hour' },
    { id: 'tomorrow', label: 'Tomorrow 9 am' }
  ];
  function roomsMoment() {
    if (S.roomsWhen === 'tomorrow') return { day: 1, t: hm(9) };
    return { day: 0, t: S.t + (S.roomsWhen === 'hour' ? 60 : 0) };
  }
  function freeUntil(room, mo) {
    var busy = room.days[mo.day];
    for (var i = 0; i < busy.length; i++) if (mo.t >= busy[i][0] && mo.t < busy[i][1]) return null;
    var next = busy.filter(function (b) { return b[0] > mo.t; })[0];
    return next ? next[0] : hm(18);
  }
  // The rooms a search is about: all of a building's when its name matches, otherwise the matching rooms.
  function roomsIn(b) {
    var q = S.roomsQ.trim().toLowerCase();
    if (!q || b.name.toLowerCase().indexOf(q) >= 0) return b.rooms;
    return b.rooms.filter(function (r) { return r.name.toLowerCase().indexOf(q) >= 0; });
  }
  function freeCount(b, mo) { return roomsIn(b).filter(function (r) { return freeUntil(r, mo) != null; }).length; }
  function roomsMatches() {
    var q = S.roomsQ.trim().toLowerCase();
    return BUILDINGS.filter(function (b) {
      return !q || b.name.toLowerCase().indexOf(q) >= 0 || b.rooms.some(function (r) { return r.name.toLowerCase().indexOf(q) >= 0; });
    });
  }
  function renderRooms() {
    els.roomsWhen.innerHTML = WHEN.map(function (w) {
      return '<button type="button" class="chip" role="radio" data-w="' + w.id + '" aria-checked="' + (S.roomsWhen === w.id) + '" tabindex="' + (S.roomsWhen === w.id ? 0 : -1) + '">' + w.label + '</button>';
    }).join('');
    var mo = roomsMoment(), list = roomsMatches();
    list = list.map(function (b) { return { b: b, free: freeCount(b, mo) }; })
      .sort(function (x, y) { return y.free - x.free; });
    var extra = S.roomsAll || S.roomsQ ? 0 : Math.max(0, list.length - 6);
    if (extra) list = list.slice(0, 6);
    els.roomsList.innerHTML = list.length ? list.map(function (x, i) {
      var id = 'bld-' + BUILDINGS.indexOf(x.b), open = !!S.roomsOpen[x.b.name];
      return '<div class="bld" data-b="' + BUILDINGS.indexOf(x.b) + '"' + (open ? ' data-open' : '') + '>' +
        '<button type="button" aria-expanded="' + open + '" aria-controls="' + id + '">' +
        '<span class="big" data-free>' + x.free + '<small>of ' + roomsIn(x.b).length + '</small></span>' +
        '<span class="nm">' + esc(x.b.name) + '<small>Up to ' + x.b.max + ' seats</small></span>' +
        '<svg class="icon chev" aria-hidden="true"><use href="#i-chev"/></svg></button>' +
        '<div class="rooms-list" id="' + id + '" style="height:' + (open ? 'auto' : '0') + '"' + (open ? '' : ' inert') + '><div class="rooms-in" data-rooms-in></div></div></div>';
    }).join('') + (extra ? '<button type="button" class="more" data-more>Show ' + extra + ' more buildings</button>' : '') : '<div class="empty">No rooms or buildings match “' + esc(S.roomsQ) + '”.</div>';
    tickRooms();
  }
  function roomsHTML(b, mo) {
    var rooms = roomsIn(b)
      .map(function (r) { return { r: r, until: freeUntil(r, mo) }; })
      .sort(function (x, y) { return (y.until == null ? -1 : y.until) - (x.until == null ? -1 : x.until); });
    var shown = rooms.slice(0, 5), span = END - START;
    return shown.map(function (x) {
      var busy = x.r.days[mo.day], strip = '', prev = START;
      busy.forEach(function (bk) {
        if (bk[0] > prev) strip += '<i class="fr" style="left:' + ((prev - START) / span * 100) + '%;width:' + ((bk[0] - prev) / span * 100) + '%"></i>';
        strip += '<i class="bk" style="left:' + ((bk[0] - START) / span * 100) + '%;width:' + ((bk[1] - bk[0]) / span * 100) + '%"></i>';
        prev = bk[1];
      });
      if (prev < END) strip += '<i class="fr" style="left:' + ((prev - START) / span * 100) + '%;width:' + ((END - prev) / span * 100) + '%"></i>';
      if (mo.t < END) strip += '<i class="sn" style="left:' + ((mo.t - START) / span * 100) + '%"></i>';
      var until = x.until == null ? 'Booked' : x.until >= hm(18) ? (mo.t >= hm(17) ? 'Free tonight' : 'Free rest of day') : 'Free until ' + short(x.until);
      return '<div class="room"><span><b>' + (b.name === 'Chifley Library' ? 'Study room ' : 'Room ') + x.r.num + '</b> · ' + x.r.seats + ' seats</span><span class="until' + (x.until == null ? ' no' : '') + '">' + until + '</span>' +
        '<span class="strip" aria-hidden="true">' + strip + '</span></div>';
    }).join('') + (rooms.length > 5 ? '<div class="fine">and ' + (rooms.length - 5) + ' more</div>' : '');
  }
  function tickRooms() {
    var mo = roomsMoment(), list = roomsMatches(), total = 0;
    els.roomsList.querySelectorAll('.bld').forEach(function (el) {
      var b = BUILDINGS[+el.dataset.b];
      el.querySelector('[data-free]').firstChild.nodeValue = freeCount(b, mo);
      if (el.hasAttribute('data-open')) el.querySelector('[data-rooms-in]').innerHTML = roomsHTML(b, mo);
    });
    list.forEach(function (b) { total += freeCount(b, mo); });
    els.roomsAnswer.innerHTML = total + ' free <span class="d">in ' + list.length + ' building' + (list.length === 1 ? '' : 's') + '</span>';
    els.roomsSub.textContent = S.roomsWhen === 'tomorrow' ? 'At 9 am tomorrow · Thu 19 Nov' : 'At ' + clock(mo.t) + ' · Wed 18 Nov';
  }
  function toggleBuilding(el) {
    var b = BUILDINGS[+el.dataset.b], list = el.querySelector('.rooms-list'), btn = el.querySelector('button');
    var open = !el.hasAttribute('data-open');
    S.roomsOpen[b.name] = open;
    if (open) {
      el.setAttribute('data-open', '');
      el.querySelector('[data-rooms-in]').innerHTML = roomsHTML(b, roomsMoment());
    }
    var h = list.firstChild.scrollHeight;
    list.style.height = (open ? 0 : h) + 'px';
    list.offsetHeight;
    list.style.height = (open ? h : 0) + 'px';
    if (!open) el.removeAttribute('data-open');
    list.inert = !open;
    btn.setAttribute('aria-expanded', String(open));
    list.addEventListener('transitionend', function done(e) {
      if (e.propertyName !== 'height') return;
      list.removeEventListener('transitionend', done);
      if (S.roomsOpen[b.name]) list.style.height = 'auto';
    });
    if (reduced()) { list.style.height = open ? 'auto' : '0px'; }
  }

  // ---------- Friends ----------

  var PEOPLE = [
    { id: 'ME', name: 'You', hue: 0, busy: WEEK[TODAY].classes.map(function (c) { return [c.start, c.end]; }) },
    { id: 'ST', name: 'Sam', full: 'Sam Taylor', hue: 5, busy: [[hm(10), hm(11)], [hm(13), hm(15)], [hm(16), hm(17)]] },
    { id: 'MC', name: 'Mia', full: 'Mia Chen', hue: 4, busy: [[hm(9), hm(10)], [hm(12), hm(13)], [hm(15), hm(17)]] },
    { id: 'JL', name: 'Jordan', full: 'Jordan Lee', hue: 6, busy: [[hm(11), hm(12)], [hm(14), hm(16)]] }
  ];
  function chosen() { return PEOPLE.filter(function (p) { return p.id === 'ME' || S.people[p.id]; }); }
  function together(ps) {
    var out = [], m = START;
    while (m < END) {
      var free = ps.every(function (p) { return !p.busy.some(function (b) { return m >= b[0] && m < b[1]; }); });
      if (free) { if (out.length && out[out.length - 1][1] === m) out[out.length - 1][1] = m + 15; else out.push([m, m + 15]); }
      m += 15;
    }
    return out.filter(function (w) { return w[1] - w[0] >= 30; });
  }
  function pct(m) { return ((m - START) / (END - START) * 100).toFixed(3) + '%'; }
  function renderFriends() {
    els.frPeople.innerHTML = PEOPLE.map(function (p) {
      var me = p.id === 'ME';
      return '<button type="button" class="person" ' + (me ? 'disabled aria-pressed="true"' : 'data-p="' + p.id + '" aria-pressed="' + !!S.people[p.id] + '"') + '>' +
        '<span class="av ' + (me ? 'me' : 'h' + p.hue) + '" aria-hidden="true">' + (me ? 'You' : p.id) + '</span>' + (me ? 'You' : p.full) + '</button>';
    }).join('');
    var rows = PEOPLE.map(function (p) {
      var me = p.id === 'ME';
      return '<div class="arow' + (me || S.people[p.id] ? '' : ' hidden') + '" data-row="' + p.id + '"><span class="av ' + (me ? 'me' : 'h' + p.hue) + '">' + (me ? 'You' : p.id) + '</span><div class="lane">' +
        p.busy.map(function (b) { return '<i class="busy" style="left:' + pct(b[0]) + ';width:calc(' + pct(b[1]) + ' - ' + pct(b[0]) + ')"></i>'; }).join('') + '</div></div>';
    }).join('');
    var ticks = '';
    for (var m = START; m <= END; m += 120) ticks += '<span style="left:' + pct(m) + '">' + short(m) + '</span>';
    els.frAxis.innerHTML = '<div class="lanes"><div class="lanes-in"><div data-together></div>' + rows + '<div class="anow"></div></div></div><div class="ticks">' + ticks + '</div>';
    tickFriends();
  }
  function tickFriends() {
    var ps = chosen(), ws = together(ps), t = S.t;
    $('[data-together]', els.frAxis).innerHTML = ws.map(function (w) {
      return '<div class="together" style="left:' + pct(w[0]) + ';width:calc(' + pct(w[1]) + ' - ' + pct(w[0]) + ')"></div>';
    }).join('');
    PEOPLE.forEach(function (p) {
      var row = els.frAxis.querySelector('[data-row="' + p.id + '"]');
      if (row) row.classList.toggle('hidden', !(p.id === 'ME' || S.people[p.id]));
    });
    $('.anow', els.frAxis).style.left = pct(Math.max(START, Math.min(END, t)));
    var cur = ws.filter(function (w) { return t >= w[0] && t < w[1]; })[0], next = ws.filter(function (w) { return w[0] > t; })[0];
    var names = ps.map(function (p) { return p.name; }), who = names.length === 2 ? names.join(' and ') : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
    var a, sub;
    if (ps.length === 1) { a = 'Pick a friend <span class="d">to compare</span>'; sub = 'Your free time is hatched'; }
    else {
      if (cur) a = '<span class="d">Free together until</span> ' + short(cur[1]);
      else if (next) a = '<span class="d">Free together</span> ' + span(next[0], next[1]);
      else a = '<span class="d">No more free time together</span> today';
      sub = who + (ws.length > 1 ? ' · free together ' + ws.length + ' times today' : '');
    }
    els.frAnswer.innerHTML = a;
    els.frSub.textContent = sub;
  }

  function renderSeen() {
    var opts = [['none', 'Nothing'], ['busy', 'Busy times'], ['full', 'Everything']];
    els.seenSeg.innerHTML = '<span class="thumb" aria-hidden="true"></span>' + opts.map(function (o) {
      return '<button type="button" role="radio" data-v="' + o[0] + '" aria-checked="' + (S.seen === o[0]) + '" tabindex="' + (S.seen === o[0] ? 0 : -1) + '">' + o[1] + '</button>';
    }).join('');
    var from = hm(9), span = hm(16) - from;
    els.seen.innerHTML = WEEK[TODAY].classes.map(function (c) {
      return '<div class="blk h' + c.hue + '" style="left:calc(4px + (100% - 8px) * ' + ((c.start - from) / span).toFixed(3) + ');width:calc((100% - 8px) * ' + ((c.end - c.start) / span).toFixed(3) + ' - 4px)">' +
        '<span class="code">' + c.code.slice(0, 4) + '</span><span>' + c.code.slice(4) + '</span><span class="busy">Busy</span></div>';
    }).join('') + '<div class="nothing">Sam sees nothing of your timetable</div>';
    updateSeen();
  }
  function updateSeen() {
    var i = ['none', 'busy', 'full'].indexOf(S.seen);
    els.seen.dataset.v = S.seen;
    var thumb = $('.thumb', els.seenSeg);
    thumb.style.width = 'calc((100% - 6px) / 3)';
    thumb.style.transform = 'translateX(' + i * 100 + '%)';
    els.seenSeg.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.v === S.seen)); b.tabIndex = b.dataset.v === S.seen ? 0 : -1; });
    var label = { none: 'Sam sees nothing of your timetable', busy: 'Sam sees grey blocks when you are busy, without what or where', full: 'Sam sees your classes' }[S.seen];
    els.seen.setAttribute('aria-label', label);
    els.seen.setAttribute('role', 'img');
  }

  // ---------- Wiring ----------

  function init() {
    els.day = $('[data-day]');
    if (!els.day) return;
    els.ruler = $('[data-ruler]');
    els.stakes = $('[data-stakes]');
    els.dateline = $('[data-dateline]');
    els.answer = $('[data-answer]');
    els.answerSub = $('[data-answer-sub]');
    els.statusTime = $('[data-status-time]');
    els.read = $('[data-clock-read]');
    els.scrub = $('[data-scrub]');
    els.play = $('[data-play]');
    els.moments = $('[data-moments]');
    els.week = $('[data-week]');
    els.runway = $('[data-runway]');
    els.dueChips = $('[data-due-chips]');
    els.dueSoon = $('[data-due-soon]');
    els.dueLater = $('[data-due-later]');
    els.dueAnswer = $('[data-due-answer]');
    els.dueSub = $('[data-due-sub]');
    els.roomsWhen = $('[data-rooms-when]');
    els.roomsList = $('[data-rooms-list]');
    els.roomsAnswer = $('[data-rooms-answer]');
    els.roomsSub = $('[data-rooms-sub]');
    els.frPeople = $('[data-fr-people]');
    els.frAxis = $('[data-fr-axis]');
    els.frAnswer = $('[data-fr-answer]');
    els.frSub = $('[data-fr-sub]');
    els.seenSeg = $('[data-seen-seg]');
    els.seen = $('[data-seen]');

    renderRuler();
    renderDay(0);
    renderMoments();
    renderWeek();
    renderDue();
    renderRooms();
    renderFriends();
    renderSeen();
    update();
    run();

    els.day.addEventListener('click', function (e) {
      var hit = e.target.closest('.hit');
      if (!hit) return;
      var id = hit.closest('.piece').dataset.id;
      if (hit.closest('.slab')) toggleSlab(id); else togglePleat(id);
    });
    els.ruler.addEventListener('click', function (e) {
      var b = e.target.closest('[data-day]');
      if (b) setDay(+b.dataset.day);
    });
    // Swipe the day sideways, as in the app.
    var sx = null, sy = null;
    els.day.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    els.day.addEventListener('touchend', function (e) {
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) setDay(Math.max(0, Math.min(4, S.day + (dx < 0 ? 1 : -1))));
    }, { passive: true });

    els.play.addEventListener('click', function () { setPlaying(!S.playing); });
    els.scrub.addEventListener('input', function () {
      S.playing = false;
      run();
      S.t = +els.scrub.value;
      if (S.day !== TODAY) setDay(TODAY); else update();
    });

    els.week.addEventListener('click', function (e) {
      var b = e.target.closest('.wslab');
      if (!b) return;
      setDay(+b.dataset.d, b.dataset.id);
      var demo = $('#today-demo');
      demo.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      var hit = els.pieces[b.dataset.id] && els.pieces[b.dataset.id].el.querySelector('.hit');
      if (hit) hit.focus({ preventScroll: true });
    });

    els.dueChips.addEventListener('click', function (e) {
      var c = e.target.closest('[data-f]');
      if (!c) return;
      S.dueFilter = c.dataset.f;
      renderDue();
      els.dueChips.querySelector('[data-f="' + S.dueFilter + '"]').focus();
    });
    function onDone(e) {
      var b = e.target.closest('[data-done]');
      if (!b) return;
      var id = b.dataset.done;
      S.done[id] = !S.done[id];
      renderDue();
      renderStakes();
      var again = document.querySelector('[data-done="' + id + '"]');
      if (again) again.focus();
    }
    els.dueSoon.addEventListener('click', onDone);
    els.dueLater.addEventListener('click', onDone);

    els.roomsWhen.addEventListener('click', function (e) {
      var c = e.target.closest('[data-w]');
      if (!c) return;
      S.roomsWhen = c.dataset.w;
      renderRooms();
      els.roomsWhen.querySelector('[data-w="' + S.roomsWhen + '"]').focus();
    });
    $('[data-rooms-q]').addEventListener('input', function (e) { S.roomsQ = e.target.value; renderRooms(); });
    els.roomsList.addEventListener('click', function (e) {
      if (e.target.closest('[data-more]')) {
        S.roomsAll = true;
        renderRooms();
        var first = els.roomsList.querySelectorAll('.bld > button')[6];
        if (first) first.focus();
        return;
      }
      var b = e.target.closest('.bld > button');
      if (b) toggleBuilding(b.parentNode);
    });

    els.frPeople.addEventListener('click', function (e) {
      var b = e.target.closest('[data-p]');
      if (!b) return;
      S.people[b.dataset.p] = !S.people[b.dataset.p];
      b.setAttribute('aria-pressed', String(S.people[b.dataset.p]));
      tickFriends();
    });
    els.seenSeg.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v]');
      if (!b) return;
      S.seen = b.dataset.v;
      updateSeen();
    });
    // Arrow keys move through radio-style groups.
    [els.seenSeg, els.roomsWhen].forEach(function (g) {
      g.addEventListener('keydown', function (e) {
        var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step && e.key !== 'Home' && e.key !== 'End') return;
        var bs = [].slice.call(g.querySelectorAll('[role=radio]')), i = bs.indexOf(document.activeElement);
        if (i < 0) return;
        e.preventDefault();
        var n = e.key === 'Home' ? bs[0] : e.key === 'End' ? bs[bs.length - 1] : bs[(i + step + bs.length) % bs.length];
        n.click();
        var again = g.querySelector('[data-v="' + n.dataset.v + '"],[data-w="' + n.dataset.w + '"]');
        (again || n).focus();
      });
    });

    // The clock only runs while the demo is on screen and the tab is visible.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { S.visible = es[0].isIntersecting; run(); }, { threshold: 0.1 }).observe($('#today-demo'));
    }
    document.addEventListener('visibilitychange', run);
    reduceMq.addEventListener && reduceMq.addEventListener('change', function () { if (reduced()) { S.playing = false; run(); update(); } });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
