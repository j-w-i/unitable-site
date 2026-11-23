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
    { classes: [k('COMP1100', 'Lecture', KAMBRI[0], KAMBRI[1], KAMBRI[2], hm(10), hm(11), ['SA']), k('MATH1013', 'Lecture', MCH[0], MCH[1], MCH[2], hm(12), hm(13))] },
    { classes: [k('ECON1101', 'Lecture', 'Copland G31', 'Copland Theatre G31', 'Copland Building', hm(11), hm(13)), k('MATH1013', 'Tutorial', 'Hanna Neumann 1.33', 'Hanna Neumann, room 1.33', 'Hanna Neumann Building', hm(15), hm(16))] },
    { classes: [k('COMP1100', 'Lecture', KAMBRI[0], KAMBRI[1], KAMBRI[2], hm(10), hm(11), ['SA']), k('STAT1003', 'Lecture', 'Coombs LT', 'Coombs Lecture Theatre', 'Coombs Building', hm(14), hm(15))], sam: [hm(11), hm(13)] },
    { classes: [k('MATH1013', 'Lecture', MCH[0], MCH[1], MCH[2], hm(12), hm(13)), k('COMP1100', 'Computer lab', 'CSIT N113', 'CSIT, lab N113', 'CSIT Building', hm(14), hm(16), ['SA'])] },
    { classes: [k('ECON1101', 'Tutorial', 'Room 2.02', 'Copland, room 2.02', 'Copland Building', hm(9), hm(10)), k('STAT1003', 'Computer lab', 'Computer Lab 1.11', 'Copland, computer lab 1.11', 'Copland Building', hm(11), hm(13))] }
  ];

  // Study crew's revision session: a group event on Wednesday, on everyone's timetable until they say they can't go.
  var GEV = { id: 'g1', group: true, code: 'COMP1100 revision', act: 'Study crew', room: 'Chifley Library', place: 'Chifley Library', where: 'Chifley Library', start: hm(11), end: hm(12), hue: 4, friends: ['SA', 'MI'] };
  WEEK[2].classes.splice(1, 0, GEV);
  var FRIEND = { SA: { name: 'Sam', colour: '#c2569a' }, MI: { name: 'Mia', colour: '#1e9aae' }, JO: { name: 'Jordan', colour: '#b8891a' } };
  function avHTML(id, size, ring, label) {
    if (id === 'ME') return '<span class="av me" style="--s:' + size + 'px;--ring:' + ring + '" aria-hidden="true">You</span>';
    return '<span class="av" style="--acc:' + FRIEND[id].colour + ';--s:' + size + 'px;--ring:' + ring + '"' + (label ? ' role="img" aria-label="' + label + '"' : ' aria-hidden="true"') + '>' + id + '</span>';
  }
  function what(c) { return c.group ? c.code : c.code + ' ' + c.act; }

  // Classes the student hasn't hidden, and group events they haven't said they can't go to.
  function classesOf(d) { return WEEK[d].classes.filter(function (c) { return !S.hidden[c.id] && !(c.group && S.reply === false); }); }

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
    seen: 'busy',
    hidden: {},
    reply: null,
    planned: [],
    classmates: true,
    roomsByName: false
  };
  function nowAbs() { return at(TODAY, S.t); }
  function icon(id) { return '<svg class="icon" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }
  function samFree(day, m) { var s = WEEK[day].sam; return !!s && m >= s[0] && m < s[1]; }

  // ---------- Today: the answer ----------

  function codeSpan(c) { return '<span class="c h' + c.hue + '">' + c.code + '</span>'; }

  function answerFor(d, t) {
    var cl = classesOf(d), first = cl[0], last = cl[cl.length - 1];
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
            : 'Then ' + what(next) + ' · ' + next.room;
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
    var cl = classesOf(d), out = [];
    cl.forEach(function (c, i) {
      if (i > 0) {
        var gap = c.start - cl[i - 1].end;
        if (gap >= 15) out.push({ free: true, id: 'f' + d + '-' + i, start: cl[i - 1].end, end: c.start });
      }
      out.push(c);
    });
    return out;
  }
  function daySummary(cl) {
    var n = cl.filter(function (c) { return !c.group; }).length, g = cl.length - n;
    return n + ' class' + (n === 1 ? '' : 'es') + (g ? ', ' + g + ' group event' + (g === 1 ? '' : 's') : '');
  }
  function slabH(c) { return Math.max(MIN_SLAB, Math.round((c.end - c.start) * PX)); }
  function pleatH(p) { var full = Math.round((p.end - p.start) * PX); return p.end - p.start > PLEAT_OVER && !S.unfolded[p.id] ? FOLDED : full; }

  function eventHTML(c, d) {
    var bh = slabH(c), going = S.reply === true;
    var hd = '<div class="l1"><span class="code gname">' + esc(c.code) + '</span></div>' +
      '<div class="l2">' + esc(c.act + ' · ' + c.room) + (S.reply == null ? ' · Going?' : '') + '</div>';
    var detail =
      '<div class="dt-in">' +
      '<div class="when" data-when>' + range(c.start, c.end) + '</div>' +
      '<div class="where">' + icon('nav') + '<u>' + esc(c.place) + '</u></div>' +
      '<div class="acts"><button type="button" class="ghost" data-reply="going" aria-pressed="' + going + '">' + (going ? icon('check') : '') + 'Going</button>' +
      '<button type="button" class="ghost" data-reply="cant">Can\u2019t go</button>' +
      c.friends.map(function (f) { return avHTML(f, 22, 'var(--fill)', FRIEND[f].name + ' is going'); }).join('') +
      '<button type="button" class="inkcircle small" data-more-class aria-expanded="false" aria-label="Event details"><svg class="icon"><use href="#i-arrow"/></svg></button></div>' +
      '<div class="class-more" hidden><b>Study crew</b>Added by Sam. Bring your Lab 6 questions.</div></div>';
    return '<div class="piece" data-id="' + c.id + '">' +
      '<div class="tlabel">' + tab(c.start) + '<small>' + ampm(c.start) + '</small></div>' +
      '<div class="slab h' + c.hue + '" style="--bh:' + bh + 'px">' +
      '<div class="spent"></div>' +
      '<div class="hd s" aria-hidden="true">' + hd + '</div>' +
      '<div class="hd a" aria-hidden="true">' + hd + '</div>' +
      '<span class="left-tag" aria-hidden="true"></span>' +
      '<button class="hit" type="button" aria-expanded="false" aria-controls="dt-' + c.id + '"></button>' +
      '<div class="body"></div>' +
      '<div class="dt" id="dt-' + c.id + '" role="region" aria-label="' + esc(c.code) + ' details" inert>' + detail + '</div>' +
      '</div></div>';
  }

  function slabHTML(c, d) {
    if (c.group) return eventHTML(c, d);
    var bh = slabH(c), roomy = bh >= 96;
    var who = c.friends.length ? '<div class="who">' + c.friends.map(function (f) { return avHTML(f, 18, 'var(--fill)'); }).join('') + '</div>' : '';
    var hd = '<div class="l1"><span class="code">' + c.code + '</span><span class="act">' + esc(c.act) + '</span></div>' +
      '<div class="l2">' + esc(roomy ? c.room + ' · ' + c.where : c.room) + '</div>' + (roomy ? who : '');
    var others = WEEK.map(function (day, i) { return day.classes.filter(function (x) { return x.code === c.code && x.act === c.act; }).map(function (x) { return WD[i] + ' ' + range(x.start, x.end); }); })
      .reduce(function (a, b) { return a.concat(b); }, []);
    var detail =
      '<div class="dt-in">' +
      '<div class="when" data-when>' + range(c.start, c.end) + '</div>' +
      '<div class="where">' + icon('nav') + '<u>' + esc(c.place) + ', ' + esc(c.where) + '</u></div>' +
      '<div class="acts"><a class="ghost" href="#rooms">' + icon('rooms') + 'Free rooms</a>' +
      (classesOf(d).length > 1 ? '<button type="button" class="ghost" data-hide="' + c.id + '">Hide</button>' : '') +
      c.friends.map(function (f) { return avHTML(f, 22, 'var(--fill)', FRIEND[f].name + ' is in this class'); }).join('') +
      '<button type="button" class="inkcircle small" data-more-class aria-expanded="false" aria-label="Class details"><svg class="icon"><use href="#i-arrow"/></svg></button></div>' +
      '<div class="class-more" hidden><b>' + esc(NAMES[c.code]) + '</b>' + esc(c.act) + ' each week: ' + others.join(', ') + '</div></div>';
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
      (shared ? '<span class="av free" style="--acc:#c2569a;--ring:var(--ground)" aria-hidden="true">SA</span>' : '') +
      (foldable ? '<button class="hit" type="button" aria-expanded="' + !!open + '" aria-label="' + label + '"></button>' +
        '<a class="ghost rooms" href="#rooms" tabindex="' + (open ? 0 : -1) + '">' + icon('rooms') + 'Free rooms nearby</a>' : '<span class="sr">' + label + '</span>') +
      '</div>' + (foldable ? brk('l', open) + brk('r', open) : '') + '</div>';
  }

  function renderDay(dir) {
    var d = S.day, ps = pieces(d), cl = classesOf(d);
    var date = dateOf(d), hiddenN = WEEK[d].classes.filter(function (c) { return S.hidden[c.id]; }).length;
    var declined = d === TODAY && S.reply === false;
    var line = '<div class="day-line"><b>' + (d === TODAY ? 'Today' : WD_LONG[d]) + '</b><span>' + date.getDate() + ' Nov</span><span class="sum">' +
      daySummary(cl) + ' · ' + range(cl[0].start, cl[cl.length - 1].end) + '</span></div>';
    var html = '<div class="day' + (dir ? ' enter' + (dir < 0 ? ' back' : '') : '') + '">' + line + '<div class="track">' +
      ps.map(function (p) { return p.free ? pleatHTML(p, d) : slabHTML(p, d); }).join('') +
      '</div><div class="day-end">Done at ' + short(cl[cl.length - 1].end) +
      (hiddenN ? ' · ' + hiddenN + ' hidden <button type="button" class="link" data-unhide>Show</button>' : '') +
      (declined ? ' · Not going to ' + esc(GEV.code) + ' <button type="button" class="link" data-reply="clear">Undo</button>' : '') + '</div></div>';
    els.day.innerHTML = html;
    els.dayEl = els.day.firstChild;
    els.track = $('.track', els.dayEl);
    els.pieces = {};
    ps.forEach(function (p) { els.pieces[p.id] = { p: p, el: els.track.querySelector('[data-id="' + p.id + '"]') }; });
    if (S.open && els.pieces[S.open]) setOpen(S.open, true, true);
  }

  // Time-dependent parts of the day; cheap enough to run every tick.
  function updateDay() {
    var d = S.day, t = S.t, cl = classesOf(d);
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
      var label = what(p) + (p.group ? ', Study crew group event' + (S.reply == null ? ', not answered yet' : '') : '') + ', ' + short(p.start) + ' to ' + short(p.end) + ', ' + p.place +
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
    classesOf(d).forEach(function (c) {
      var top = 3 + (c.start - START) / (END - START) * 18, h = Math.max(2, (c.end - c.start) / (END - START) * 18);
      var gone = d < TODAY || (d === TODAY && t >= c.end);
      out += '<i class="h' + c.hue + (gone ? ' gone' : '') + '" style="top:' + top.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px"></i>';
    });
    if (d === TODAY && t > START && t < END) out += '<b style="top:' + (3 + (t - START) / (END - START) * 18 - 0.75).toFixed(1) + 'px"></b>';
    return out;
  }

  function renderRuler() {
    var html = '';
    for (var d = 0; d < 5; d++) {
      var date = dateOf(d);
      html += '<button type="button" data-day="' + d + '" aria-pressed="' + (d === S.day) + '"' + (d === TODAY ? ' aria-current="date"' : '') +
        ' aria-label="' + WD_LONG[d] + ' ' + date.getDate() + ' November, ' + classesOf(d).length + ' classes">' +
        '<span class="wd" aria-hidden="true">' + WD[d].toUpperCase() + '</span><span class="mini-wrap" aria-hidden="true"><span class="mini"></span>' +
        (DUE.some(function (x) { return Math.floor(x.at / 1440) === d; }) ? '<i class="stake"></i>' : '') + '</span><span class="num" aria-hidden="true">' + date.getDate() + '</span></button>';
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
    var line = 'Today · ' + WD[TODAY] + ' ' + dateOf(TODAY).getDate() + ' Nov · Week 5';
    els.home.hidden = d === TODAY;
    if (els.dateline.textContent !== line) els.dateline.textContent = line;
    // The answer is always about now; the day being looked at is named above its track.
    var a = answerFor(TODAY, S.t);
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
    classesOf(TODAY).forEach(function (c) {
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
      classesOf(d).forEach(function (c) {
        var top = (c.start - WK.start) * WK.px + 2, ht = (c.end - c.start) * WK.px - 4;
        html += '<button type="button" class="wslab h' + c.hue + '" data-d="' + d + '" data-id="' + c.id + '" style="top:' + top + 'px;height:' + ht + 'px" aria-label="' +
          what(c) + ', ' + WD_LONG[d] + ' ' + short(c.start) + ' to ' + short(c.end) + '. Open on the day">' +
          '<i class="spent"></i>' + ['s', 'a'].map(function (layer) {
            if (c.group) return '<span class="wt ' + layer + '"' + (layer === 's' ? ' aria-hidden="true"' : '') + '><span class="gt">' + esc(c.code) + '</span></span>';
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
    var t = S.t, cl = classesOf(TODAY), live = null;
    for (var i = 0; i < cl.length; i++) if (t < cl[i].end) { live = cl[i]; break; }
    els.week.querySelectorAll('.wslab').forEach(function (b) {
      var d = +b.dataset.d, c = classesOf(d).filter(function (x) { return x.id === b.dataset.id; })[0];
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
  var COURSES = ['COMP1100', 'ECON1101', 'MATH1013', 'STAT1003'];
  // A segmented control: a recessed track with a raised sheet on the choice, one tab stop.
  function segHTML(attr, opts, value) {
    var i = Math.max(0, opts.map(function (o) { return o[0]; }).indexOf(value));
    return '<span class="thumb" aria-hidden="true" style="width:calc((100% - 6px) / ' + opts.length + ');transform:translateX(' + i * 100 + '%)"></span>' +
      opts.map(function (o) {
        return '<button type="button" role="radio" ' + attr + '="' + o[0] + '" aria-checked="' + (o[0] === value) + '" tabindex="' + (o[0] === value ? 0 : -1) + '">' + o[1] + '</button>';
      }).join('');
  }
  function setSeg(el, attr, value) {
    var bs = [].slice.call(el.querySelectorAll('[role=radio]')), i = 0;
    bs.forEach(function (b, n) { var on = b.getAttribute(attr) === value; if (on) i = n; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
    var th = $('.thumb', el);
    if (el.classList.contains('scroll')) {
      // Chips: options keep their own widths and the strip scrolls; the sheet follows the choice.
      var b = bs[i];
      th.style.width = b.offsetWidth + 'px';
      th.style.transform = 'translateX(' + (b.offsetLeft - 3) + 'px)';
    } else th.style.transform = 'translateX(' + i * 100 + '%)';
  }
  function dueRow(x, now) {
    var lv = dueLevel(x, now), w = dueWhen(x, now);
    return '<div class="item h' + HUES[x.code] + (lv === 'done' ? ' done' : '') + '">' +
      '<button type="button" class="tilebtn" data-done="' + x.id + '" aria-pressed="' + (lv === 'done') + '" aria-label="' + esc((lv === 'done' ? 'Mark not done: ' : 'Mark done: ') + x.title) + '">' + tileHTML(x, lv, 30) + '</button>' +
      '<div class="it"><div class="tt">' + esc(x.title) + '</div><div class="ss">' + x.code + ' · ' + KIND[x.kind] + '</div></div>' +
      '<div class="ww' + (lv === 'urgent' ? ' urgent' : '') + '">' + w + '<small>' + clock(x.at % 1440) + '</small></div></div>';
  }
  function renderDue() {
    var now = nowAbs(), f = S.dueFilter, start = at(TODAY, 0), span = 14 * 1440;
    if (!els.dueChips.firstChild) els.dueChips.innerHTML = segHTML('data-f', [['all', 'All']].concat(COURSES.map(function (c) { return [c, c]; })), f);
    setSeg(els.dueChips, 'data-f', f);

    var rw = '<div class="bed"></div><span class="lbl today" style="left:0">Today</span>';
    [7, 14].forEach(function (i) {
      var x = ((at(i, 0) - start) / span * 100) + '%';
      rw += '<span class="mon" style="left:' + x + '"></span><span class="lbl" style="left:calc(' + x + ' + 4px)">Mon ' + dateOf(i).getDate() + '</span>';
    });
    DUE.forEach(function (x) {
      if (x.at - start > span || x.at < now) return;
      var lv = dueLevel(x, now);
      rw += '<span class="dia h' + HUES[x.code] + (lv === 'urgent' ? ' urgent' : '') + (lv === 'done' ? ' done' : '') + (f !== 'all' && f !== x.code ? ' off' : '') +
        '" style="left:' + ((x.at - start) / span * 100).toFixed(2) + '%"></span>';
    });
    rw += '<span class="rnow" style="left:' + ((now - start) / span * 100).toFixed(2) + '%"></span>';
    els.runway.innerHTML = rw;

    var shown = DUE.filter(function (x) { return f === 'all' || f === x.code; });
    var open = shown.filter(function (x) { return !S.done[x.id] && x.at > now; });
    var day = Math.floor(now / 1440);
    var today = open.filter(function (x) { return Math.floor(x.at / 1440) === day; });
    var week = open.filter(function (x) { return Math.floor(x.at / 1440) !== day && x.at - now < 7 * 1440; });
    var later = open.filter(function (x) { return x.at - now >= 7 * 1440; });
    var done = shown.filter(function (x) { return S.done[x.id]; });
    function section(title, items) { return items.length ? '<h3 class="screen-h">' + title + '</h3><div class="group">' + items.map(function (x) { return dueRow(x, now); }).join('') + '</div>' : ''; }
    var html = section('Today', today) + section('Next 7 days', week) + section('Later', later) + section('Done', done);
    els.dueLists.innerHTML = html || '<p class="fine-note center">Nothing due for ' + f + '.</p>';

    var next = open[0];
    els.dueHero.innerHTML = next ? '<div class="next-card h' + HUES[next.code] + '">' + tileHTML(next, dueLevel(next, now), 36) +
      '<div class="it"><div class="code">' + next.code + '</div><div class="tt">' + esc(next.title) + '</div><div class="ss">' + dueWhen(next, now) + ' · ' + clock(next.at % 1440) + '</div></div>' +
      '<svg class="icon chev-r" aria-hidden="true"><use href="#i-chevr"/></svg></div>' : '';
    tickDue(true);
  }
  function tickDue(force) {
    var now = nowAbs();
    var sig = DUE.map(function (x) { return dueLevel(x, now); }).join();
    if (!force && sig !== dueSig) { dueSig = sig; renderDue(); return; }
    dueSig = sig;
    var f = S.dueFilter;
    var open = DUE.filter(function (x) { return x.at > now && !S.done[x.id] && (f === 'all' || f === x.code); });
    var next = open[0], a, s;
    if (!next) { a = 'Nothing due'; s = 'All caught up'; }
    else {
      var left = next.at - now, when = left < 1440 ? 'in ' + countdown(left) : left < 2 * 1440 ? 'tomorrow' : 'in ' + Math.floor(left / 1440) + ' days';
      a = '<span class="d">Next due</span> <span class="' + (left < 1440 ? 'u' : '') + '">' + when + '</span>';
      var n = open.filter(function (x) { return x.at - now < 7 * 1440; }).length;
      s = n + ' due in the next 7 days';
    }
    els.dueAnswer.innerHTML = a;
    els.dueSub.textContent = s;
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
    { id: 'h1', label: 'In 1 hour' },
    { id: 'h2', label: 'In 2 hours' },
    { id: 'tomorrow', label: 'Tomorrow 9 am' }
  ];
  function roomsMoment() {
    if (S.roomsWhen === 'tomorrow') return { day: 1, t: hm(9) };
    return { day: 0, t: S.t + (S.roomsWhen === 'h1' ? 60 : S.roomsWhen === 'h2' ? 120 : 0) };
  }
  function freeUntil(room, mo) {
    var busy = room.days[mo.day];
    for (var i = 0; i < busy.length; i++) if (mo.t >= busy[i][0] && mo.t < busy[i][1]) return null;
    var next = busy.filter(function (b) { return b[0] > mo.t; })[0];
    return next ? next[0] : hm(24);
  }
  // The rooms a search is about: all of a building's when its name matches, otherwise the matching rooms.
  function roomsIn(b) {
    var q = S.roomsQ.trim().toLowerCase();
    if (!q || b.name.toLowerCase().indexOf(q) >= 0) return b.rooms;
    return b.rooms.filter(function (r) { return r.name.toLowerCase().indexOf(q) >= 0; });
  }
  function freeRooms(b, mo) { return roomsIn(b).filter(function (r) { return freeUntil(r, mo) != null; }); }
  function roomsMatches() {
    var q = S.roomsQ.trim().toLowerCase();
    return BUILDINGS.filter(function (b) {
      return !q || b.name.toLowerCase().indexOf(q) >= 0 || b.rooms.some(function (r) { return r.name.toLowerCase().indexOf(q) >= 0; });
    });
  }
  function buildingSub(b, free, mo) {
    var seats = free.reduce(function (a, r) { return Math.max(a, r.seats); }, 0);
    var soonest = free.map(function (r) { return freeUntil(r, mo); }).filter(function (u) { return u < hm(24); }).sort(function (x, y) { return x - y; })[0];
    return [seats ? 'Up to ' + seats + ' seats' : '', soonest != null && soonest - mo.t < 8 * 60 ? 'some until ' + short(soonest) : ''].filter(Boolean).join(' · ');
  }
  function roomItems(b, mo) {
    var rooms = freeRooms(b, mo).map(function (r) { return { r: r, until: freeUntil(r, mo) }; })
      .sort(function (x, y) { return y.until - x.until; });
    var shown = rooms.slice(0, 6);
    return shown.map(function (x) {
      return '<div class="item"><div class="it"><div class="tt">' + (b.name === 'Chifley Library' ? 'Study room ' : 'Room ') + x.r.num + '</div><div class="ss">' + x.r.seats + ' seats</div></div>' +
        '<div class="val">' + (x.until >= hm(18) ? 'Free all day' : 'Free until ' + short(x.until)) + '</div></div>';
    }).join('') + (rooms.length > 6 ? '<div class="item"><div class="it"><div class="ss">and ' + (rooms.length - 6) + ' more</div></div></div>' : '');
  }
  function renderRooms() {
    if (!els.roomsWhen.firstChild) els.roomsWhen.innerHTML = segHTML('data-w', WHEN.map(function (w) { return [w.id, w.label]; }), S.roomsWhen);
    setSeg(els.roomsWhen, 'data-w', S.roomsWhen);
    var mo = roomsMoment(), list = roomsMatches().map(function (b) { return { b: b, free: freeRooms(b, mo) }; })
      .filter(function (x) { return x.free.length; });
    list.sort(S.roomsByName ? function (x, y) { return x.b.name < y.b.name ? -1 : 1; } : function (x, y) { return y.free.length - x.free.length; });
    var extra = S.roomsAll || S.roomsQ ? 0 : Math.max(0, list.length - 6);
    if (extra) list = list.slice(0, 6);
    els.roomsList.innerHTML = list.length ? list.map(function (x) {
      var bi = BUILDINGS.indexOf(x.b), id = 'bld-' + bi, open = !!S.roomsOpen[x.b.name];
      return '<div class="bld group" data-b="' + bi + '"' + (open ? ' data-open' : '') + '>' +
        '<button type="button" aria-expanded="' + open + '" aria-controls="' + id + '">' +
        '<span class="big">' + x.free.length + '<small>of ' + roomsIn(x.b).length + '</small></span>' +
        '<span class="nm">' + esc(x.b.name) + '<small>' + buildingSub(x.b, x.free, mo) + '</small></span>' +
        '<svg class="icon chev" aria-hidden="true"><use href="#i-chev"/></svg></button>' +
        '<div class="rooms-list" id="' + id + '" style="height:' + (open ? 'auto' : '0') + '"' + (open ? '' : ' inert') + '><div class="rooms-in">' + (open ? roomItems(x.b, mo) : '') + '</div></div></div>';
    }).join('') + (extra ? '<button type="button" class="more" data-more>Show ' + extra + ' more buildings</button>' : '') : '<p class="fine-note">No free rooms match “' + esc(S.roomsQ) + '”.</p>';
    var total = 0, all = roomsMatches();
    all.forEach(function (b) { total += freeRooms(b, mo).length; });
    var nb = all.filter(function (b) { return freeRooms(b, mo).length; }).length;
    els.roomsAnswer.innerHTML = total + ' free <span class="d">in ' + nb + ' building' + (nb === 1 ? '' : 's') + '</span>';
    els.roomsSub.textContent = S.roomsWhen === 'now' ? 'Right now' : S.roomsWhen === 'tomorrow' ? 'At Thu 9 am' : 'At Wed ' + short(mo.t);
    els.roomsTitle.textContent = S.roomsWhen === 'now' ? 'Free now' : 'Free then';
    $('span', els.roomsSort).textContent = S.roomsByName ? 'A–Z' : 'Most free';
  }
  var roomsMinute = -1;
  function tickRooms() {
    // Only "now" and "in N hours" move with the clock; redraw at most once a demo quarter-hour.
    if (S.roomsWhen === 'tomorrow') return;
    var q = Math.floor(S.t / 15);
    if (q === roomsMinute) return;
    roomsMinute = q;
    if (els.roomsList.contains(document.activeElement)) return;
    renderRooms();
  }
  function toggleBuilding(el) {
    var b = BUILDINGS[+el.dataset.b], list = el.querySelector('.rooms-list'), btn = el.querySelector('button');
    var open = !el.hasAttribute('data-open');
    S.roomsOpen[b.name] = open;
    if (open) { el.setAttribute('data-open', ''); list.firstChild.innerHTML = roomItems(b, roomsMoment()); }
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
    if (reduced()) list.style.height = open ? 'auto' : '0px';
  }

  // ---------- Friends ----------

  // Avatar colours from data/timetable_builder.dart (no green: green is your own free time).
  var PEOPLE = [
    { id: 'ME', name: 'You', colour: 'var(--free)', busy: [] },
    { id: 'SA', name: 'Sam', colour: '#c2569a', busy: [[hm(10), hm(11)], [hm(13), hm(15)], [hm(16), hm(17)]] },
    { id: 'MI', name: 'Mia', colour: '#1e9aae', busy: [[hm(9), hm(10)], [hm(12), hm(13)], [hm(15), hm(17)]] },
    { id: 'JO', name: 'Jordan', colour: '#b8891a', busy: [[hm(11), hm(12)], [hm(14), hm(16)]] }
  ];
  function myBusy() { return classesOf(TODAY).filter(function (c) { return !c.group || S.reply === true; }).map(function (c) { return [c.start, c.end]; }); }
  function busyOf(p) { return p.id === 'ME' ? myBusy() : p.busy; }
  function together(ps) {
    var out = [], m = START;
    while (m < END) {
      var free = ps.every(function (p) { return !busyOf(p).some(function (b) { return m >= b[0] && m < b[1]; }); });
      if (free) { if (out.length && out[out.length - 1][1] === m) out[out.length - 1][1] = m + 15; else out.push([m, m + 15]); }
      m += 15;
    }
    return out.filter(function (w) { return w[1] - w[0] >= 30; });
  }
  function pct(m) { return ((Math.max(START, Math.min(END, m)) - START) / (END - START) * 100).toFixed(3) + '%'; }
  function statusOf(p, t) {
    var b = p.busy.filter(function (x) { return t >= x[0] && t < x[1]; })[0];
    if (b) return { busy: true, text: 'In class until ' + short(b[1]) };
    var next = p.busy.filter(function (x) { return x[0] > t && x[0] < END; })[0];
    return { busy: false, text: next ? 'Free until ' + short(next[0]) : 'Free for the rest of the day' };
  }
  function axisHTML() {
    var t = S.t, rows = '', ticks = '';
    PEOPLE.forEach(function (p) {
      var avatar = p.id === 'ME' ? '<span class="av me">You</span>' : '<span class="av" style="--acc:' + p.colour + '">' + p.id + '</span>';
      var lane = '<i class="bed"></i>' +
        (t < END ? '<i class="fr" style="left:' + pct(t) + ';right:0;background:' + p.colour + '"></i>' : '') +
        (t > START ? '<i class="fr gone" style="left:0;width:' + pct(t) + ';background:' + p.colour + '"></i>' : '') +
        busyOf(p).map(function (b) { return '<i class="busy' + (b[1] <= t ? ' gone' : '') + '" style="left:' + pct(b[0]) + ';width:calc(' + pct(b[1]) + ' - ' + pct(b[0]) + ')"></i>'; }).join('');
      rows += '<div class="arow">' + avatar + '<div class="lane">' + lane + '</div></div>';
    });
    var cols = together(PEOPLE).map(function (w) {
      return '<i class="together' + (w[1] <= t ? ' gone' : '') + '" style="left:' + pct(w[0]) + ';width:calc(' + pct(w[1]) + ' - ' + pct(w[0]) + ')"></i>';
    }).join('');
    for (var m = START; m <= END; m += 120) ticks += '<span style="left:' + pct(m) + '">' + short(m) + '</span>';
    return '<div class="lanes">' + cols + rows + (t > START && t < END ? '<i class="anow" style="left:' + pct(t) + '"></i>' : '') + '</div><div class="ticks">' + ticks + '</div>';
  }
  function renderFriends() {
    var t = S.t;
    els.frAxis.innerHTML = axisHTML();

    var friends = PEOPLE.slice(1), freeNow = friends.filter(function (p) { return !statusOf(p, t).busy; });
    els.frAnswer.innerHTML = freeNow.length
      ? (freeNow.length === 1 ? freeNow[0].name + ' is free' : freeNow.length + ' friends free') + ' <span class="d">now</span>'
      : '<span class="d">No friends free</span> now';
    var w = together(PEOPLE.slice(0, 2)).filter(function (x) { return x[1] > t; })[0];
    els.frSub.textContent = w ? 'You and Sam: free together ' + (w[0] <= t ? 'until ' + short(w[1]) : span(w[0], w[1])) : 'No more time free with Sam today';
    var list = friends.map(function (p) {
      var st = statusOf(p, t);
      return '<div class="item"><span class="av' + (st.busy ? '' : ' free') + '" style="--acc:' + p.colour + ';--s:34px;--ring:var(--sheet)" aria-hidden="true">' + p.id + '</span>' +
        '<div class="it"><div class="tt">' + p.name + '</div><div class="ss">' + st.text + '</div></div></div>';
    }).join('');
    if (els.frList.innerHTML !== list) els.frList.innerHTML = list;
  }
  function tickFriends() {
    renderFriends();
    if (els.groupPage && !els.groupPage.contains(document.activeElement)) renderGroups();
  }

  // ---------- Groups (friends/groups_screen.dart) ----------

  var FREE_HOURS = [[2, hm(17), hm(19)], [3, hm(16), hm(18)], [4, hm(13), hm(15)]];
  function facesHTML(ids, size) {
    return '<span class="faces" style="--s:' + size + 'px" aria-hidden="true">' + ids.map(function (id) { return avHTML(id, size, 'var(--sheet)'); }).join('') + '</span>';
  }
  function groupEvents() {
    var list = [];
    if (S.t < GEV.end || S.reply !== false) list.push({ id: 'g1', title: GEV.code, day: TODAY, start: GEV.start, reply: S.reply, others: GEV.friends.length });
    S.planned.forEach(function (e, i) { list.push({ id: 'p' + i, title: 'Study session', day: e[0], start: e[1], reply: true, others: 0 }); });
    return list;
  }
  function whenLabel(day, m) { return (day === TODAY ? 'Today' : day === TODAY + 1 ? 'Tomorrow' : WD[day]) + ' ' + short(m); }
  function replyMark(r) {
    return '<span class="reply-mark h4' + (r === false ? ' no' : '') + '" aria-hidden="true">' + (r === true ? icon('check') : r === false ? icon('plus') : '?') + '</span>';
  }
  function renderGroups() {
    var evs = groupEvents(), next = evs.filter(function (e) { return e.reply !== false; })[0];
    els.groupsList.innerHTML =
      '<button type="button" class="item press" data-open-group>' + facesHTML(['SA', 'MI', 'JO'], 30) +
      '<span class="it"><span class="tt">Study crew</span><span class="ss">' + (next ? 'Next: ' + esc(next.title) + ' · ' + whenLabel(next.day, next.start) : '4 people') + '</span></span>' +
      '<svg class="icon chev-r" aria-hidden="true"><use href="#i-chevr"/></svg></button>' +
      '<div class="item"><span class="it"><span class="tt">Join with a code</span><span class="ss">Got a group code from a friend? Join in a tap.</span></span></div>';
    var people = [['ME', 'You', 'Owner'], ['SA', 'Sam'], ['MI', 'Mia'], ['JO', 'Jordan']];
    els.groupPage.innerHTML =
      '<button type="button" class="back-chip" data-group-back><svg class="icon"><use href="#i-chevr"/></svg>Friends</button>' +
      facesHTML(['SA', 'MI', 'JO'], 44) +
      '<div class="answer">Study crew</div><div class="answer-sub">4 people</div>' +
      '<h3 class="screen-h">Today</h3><div class="fr-axis" aria-hidden="true">' + axisHTML() + '</div>' +
      '<h3 class="screen-h">Events</h3><div class="group">' + evs.map(function (e) {
        var going = e.others + (e.reply === true ? 1 : 0);
        return '<div class="item event-row">' + replyMark(e.reply) + '<span class="it"><span class="tt">' + esc(e.title) + '</span><span class="ss">' + whenLabel(e.day, e.start) + ' · ' + going + ' going</span>' +
          (e.id === 'g1' ? '<span class="acts"><button type="button" class="ghost" data-reply="going" aria-pressed="' + (e.reply === true) + '">Going</button><button type="button" class="ghost" data-reply="cant" aria-pressed="' + (e.reply === false) + '">Can’t go</button></span>' : '') +
          '</span></div>';
      }).join('') + '</div>' +
      '<h3 class="screen-h">When you’re all free</h3><div class="group">' + FREE_HOURS.map(function (w, i) {
        var planned = S.planned.some(function (e) { return e[0] === w[0] && e[1] === w[1]; });
        return '<button type="button" class="item press" data-plan="' + i + '"' + (planned ? ' disabled' : '') + '><span class="free-bar h4" aria-hidden="true"></span>' +
          '<span class="it"><span class="tt">' + WD[w[0]] + ' ' + span(w[1], w[2]) + '</span></span><span class="val">' + (planned ? 'Planned' : countdown(w[2] - w[1])) + '</span>' +
          (planned ? '' : icon('plus')) + '</button>';
      }).join('') + '</div>' +
      '<p class="fine-note">The next seven days, 8 am to 9 pm, an hour or more. Tap one to plan something then.</p>' +
      '<h3 class="screen-h">People</h3><div class="group">' + people.map(function (x) {
        return '<div class="item">' + avHTML(x[0], 34, 'var(--sheet)') + '<span class="it"><span class="tt">' + x[1] + '</span></span>' + (x[2] ? '<span class="val">' + x[2] + '</span>' : '') + '</div>';
      }).join('') + '</div>';
  }
  function setReply(r) {
    S.reply = r;
    if (r === false && S.open === 'g1') S.open = null;
    if (S.day === TODAY) renderDay(0);
    renderWeek(); renderFriends(); renderGroups(); update();
  }

  // What a friend sees of your Wednesday, at each visibility level.
  function renderSeen() {
    if (!els.seenSeg.firstChild) els.seenSeg.innerHTML = segHTML('data-v', [['none', 'Nothing'], ['busy', 'Busy times'], ['full', 'Everything']], S.seen);
    updateSeen();
  }
  function updateSeen() {
    setSeg(els.seenSeg, 'data-v', S.seen);
    var cl = classesOf(TODAY).filter(function (c) { return !c.group; }), html;
    if (S.seen === 'none') {
      html = '<div class="item"><div class="it"><div class="tt">Hidden from Sam</div><div class="ss">Not even when you’re busy</div></div></div>';
    } else {
      html = cl.map(function (c) {
        var time = '<div class="seen-t">' + short(c.start) + '<small>' + countdown(c.end - c.start) + '</small></div>';
        return S.seen === 'busy'
          ? '<div class="item">' + time + '<div class="it"><div class="tt">Busy</div><div class="ss">Until ' + short(c.end) + '</div></div></div>'
          : '<div class="item h' + c.hue + '">' + time + '<div class="it"><div class="tt"><b>' + c.code + '</b> ' + esc(c.act) + '</div><div class="ss">' + esc(c.room) + '</div></div></div>';
      }).join('');
    }
    els.seen.innerHTML = html;
    els.seen.dataset.v = S.seen;
    els.seen.classList.remove('swap'); void els.seen.offsetWidth; els.seen.classList.add('swap');
  }

  // ---------- The phone: one fixed iPhone, scaled as a whole; screens follow the chapters ----------

  var desktop = window.matchMedia('(min-width: 1024px)');
  var PHONE_W = 424, PHONE_H = 896;
  // The scale only changes with the window, never with what's on screen.
  function fitPhone() {
    var k;
    if (desktop.matches) {
      var clock = els.clock ? els.clock.offsetHeight + 18 : 80;
      k = (window.innerHeight - 60 - 32 - clock) / PHONE_H;
    } else {
      k = (document.documentElement.clientWidth - 32) / PHONE_W;
    }
    k = Math.max(0.55, Math.min(1, k));
    document.documentElement.style.setProperty('--k', k.toFixed(4));
  }

  var TAB_OF = { today: 0, week: 0, due: 1, rooms: 2, friends: 3, group: 3 };
  var page = 'today';
  function setPage(name, instant) {
    if (!desktop.matches) name = 'today';
    if (name === page && !instant) return;
    page = name;
    document.querySelectorAll('.page').forEach(function (p) {
      var on = p.dataset.page === name;
      p.hidden = !on;
      p.classList.toggle('on', on);
      p.classList.toggle('enter', on && !instant);
    });
    var i = TAB_OF[name] || 0;
    document.querySelectorAll('.tabbar [data-tab]').forEach(function (a, n) {
      if (n === i) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var mark = $('.tab-mark');
    if (mark) mark.style.transform = 'translateX(' + i * 100 + '%)';
    // Chip widths can only be measured once their screen is showing.
    if (name === 'due' && els.dueChips && els.dueChips.firstChild) setSeg(els.dueChips, 'data-f', S.dueFilter);
    if (name === 'rooms' && els.roomsWhen && els.roomsWhen.firstChild) setSeg(els.roomsWhen, 'data-w', S.roomsWhen);
  }

  // Desktop: each demo lives in its screen inside the phone. Smaller screens: under its chapter.
  var slots = {};
  function placeDemos() {
    document.querySelectorAll('[data-demo]').forEach(function (demo) {
      var name = demo.dataset.demo;
      if (!slots[name]) { slots[name] = document.createComment('demo:' + name); demo.parentNode.insertBefore(slots[name], demo); }
      var target = desktop.matches ? $('.page[data-page="' + name + '"]') : null;
      if (target && demo.parentNode !== target) target.appendChild(demo);
      if (!target && demo.parentNode !== slots[name].parentNode) slots[name].parentNode.insertBefore(demo, slots[name].nextSibling);
    });
    setPage(desktop.matches ? page : 'today', true);
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
    els.dueLists = $('[data-due-lists]');
    els.dueHero = $('[data-due-hero]');
    els.home = $('[data-home]');
    els.dueAnswer = $('[data-due-answer]');
    els.dueSub = $('[data-due-sub]');
    els.roomsWhen = $('[data-rooms-when]');
    els.roomsList = $('[data-rooms-list]');
    els.roomsAnswer = $('[data-rooms-answer]');
    els.roomsSub = $('[data-rooms-sub]');
    els.frList = $('[data-fr-list]');
    els.groupsList = $('[data-groups-list]');
    els.groupPage = $('[data-group-page]');
    els.roomsTitle = $('[data-rooms-title]');
    els.roomsSort = $('[data-rooms-sort]');
    els.frAxis = $('[data-fr-axis]');
    els.frAnswer = $('[data-fr-answer]');
    els.frSub = $('[data-fr-sub]');
    els.seenSeg = $('[data-seen-seg]');
    els.seen = $('[data-seen]');
    els.clock = $('[data-clock]');

    placeDemos();
    fitPhone();
    var fitQueued = false;
    window.addEventListener('resize', function () {
      if (fitQueued) return;
      fitQueued = true;
      requestAnimationFrame(function () { fitQueued = false; fitPhone(); });
    });
    var onMq = function () { placeDemos(); fitPhone(); };
    if (desktop.addEventListener) desktop.addEventListener('change', onMq); else desktop.addListener(onMq);
    if ('IntersectionObserver' in window) {
      var chapterIo = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting && desktop.matches) setPage(e.target.dataset.page); });
      }, { rootMargin: '-45% 0px -50% 0px' });
      document.querySelectorAll('.chapter[data-page]').forEach(function (ch) { chapterIo.observe(ch); });
    }
    // Arriving on a chapter link (#due): start on that screen.
    var arrived = location.hash && document.querySelector('.chapter' + location.hash.replace(/[^#\w-]/g, ''));
    if (arrived && arrived.dataset.page) setPage(arrived.dataset.page, true);

    renderRuler();
    renderDay(0);
    renderMoments();
    renderWeek();
    renderDue();
    renderRooms();
    renderFriends();
    renderSeen();
    renderGroups();
    update();
    run();

    els.day.addEventListener('click', function (e) {
      var hide = e.target.closest('[data-hide]');
      if (hide) {
        S.hidden[hide.dataset.hide] = true;
        S.open = null;
        renderDay(0); renderWeek(); renderFriends(); renderSeen(); update();
        var undo = $('[data-unhide]', els.day);
        if (undo) undo.focus();
        return;
      }
      if (e.target.closest('[data-unhide]')) {
        S.hidden = {};
        renderDay(0); renderWeek(); renderFriends(); renderSeen(); update();
        return;
      }
      var rep = e.target.closest('[data-reply]');
      if (rep) {
        var v = rep.dataset.reply;
        setReply(v === 'clear' ? null : v === 'going' ? (S.reply === true ? null : true) : false);
        return;
      }
      var more = e.target.closest('[data-more-class]');
      if (more) {
        var box = more.closest('.dt-in').querySelector('.class-more'), open = box.hidden;
        box.hidden = !open;
        more.setAttribute('aria-expanded', String(open));
        var dt = more.closest('.dt');
        dt.style.height = dt.firstChild.scrollHeight + 'px';
        return;
      }
      var hit = e.target.closest('.hit');
      if (!hit) return;
      var id = hit.closest('.piece').dataset.id;
      if (hit.closest('.slab')) toggleSlab(id); else togglePleat(id);
    });
    els.home.addEventListener('click', function () { setDay(TODAY); });
    function showWeek() {
      if (desktop.matches) setPage('week');
      else $('#week').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    }
    function showDay() {
      if (desktop.matches) setPage('today');
      else $('#today-demo').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    }
    $('[data-to-week]').addEventListener('click', showWeek);
    $('[data-to-day]').addEventListener('click', showDay);
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
      if (desktop.matches) setPage('today');
      else $('#today-demo').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      var hit = els.pieces[b.dataset.id] && els.pieces[b.dataset.id].el.querySelector('.hit');
      if (hit) hit.focus({ preventScroll: true });
    });

    els.dueChips.addEventListener('click', function (e) {
      var c = e.target.closest('[data-f]');
      if (!c) return;
      S.dueFilter = c.dataset.f;
      renderDue();
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
    els.dueLists.addEventListener('click', onDone);

    els.roomsWhen.addEventListener('click', function (e) {
      var c = e.target.closest('[data-w]');
      if (!c) return;
      S.roomsWhen = c.dataset.w;
      renderRooms();
    });
    els.roomsSort.addEventListener('click', function () { S.roomsByName = !S.roomsByName; renderRooms(); });
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

    var add = $('[data-add-friend]'), reveal = $('[data-code-reveal]');
    add.addEventListener('click', function () {
      reveal.hidden = !reveal.hidden;
      add.setAttribute('aria-expanded', String(!reveal.hidden));
    });
    // Groups: say whether you're going; the count follows.
    var rsvp = $('[data-rsvp]'), going = 'going';
    if (rsvp) {
      rsvp.innerHTML = segHTML('data-r', [['going', 'Going'], ['cant', 'Can\u2019t go']], going);
      rsvp.addEventListener('click', function (e) {
        var b = e.target.closest('[data-r]');
        if (!b) return;
        going = b.getAttribute('data-r');
        setSeg(rsvp, 'data-r', going);
        $('[data-going-count]').textContent = going === 'going' ? 3 : 2;
      });
    }
    function openGroup() {
      if (desktop.matches) setPage('group');
      else $('#groups').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    }
    els.groupsList.addEventListener('click', function (e) { if (e.target.closest('[data-open-group]')) openGroup(); });
    els.groupPage.addEventListener('click', function (e) {
      if (e.target.closest('[data-group-back]')) { setPage('friends'); return; }
      var r = e.target.closest('[data-reply]');
      if (r) { setReply(r.dataset.reply === 'going' ? (S.reply === true ? null : true) : (S.reply === false ? null : false)); var again = els.groupPage.querySelector('[data-reply="' + r.dataset.reply + '"]'); if (again) again.focus(); return; }
      var plan = e.target.closest('[data-plan]');
      if (plan && !plan.disabled) {
        var w = FREE_HOURS[+plan.dataset.plan];
        S.planned.push([w[0], w[1]]);
        renderGroups();
      }
    });
    var sw = $('[data-classmates]');
    sw.addEventListener('click', function () {
      S.classmates = !S.classmates;
      sw.setAttribute('aria-checked', String(S.classmates));
    });
    els.seenSeg.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v]');
      if (!b) return;
      S.seen = b.dataset.v;
      updateSeen();
    });
    // Arrow keys move through radio-style groups.
    [els.seenSeg, els.roomsWhen, els.dueChips, $('[data-rsvp]')].filter(Boolean).forEach(function (g) {
      g.addEventListener('keydown', function (e) {
        var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step && e.key !== 'Home' && e.key !== 'End') return;
        var bs = [].slice.call(g.querySelectorAll('[role=radio]')), i = bs.indexOf(document.activeElement);
        if (i < 0) return;
        e.preventDefault();
        var n = e.key === 'Home' ? bs[0] : e.key === 'End' ? bs[bs.length - 1] : bs[(i + step + bs.length) % bs.length];
        n.click();
        n.focus();
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
