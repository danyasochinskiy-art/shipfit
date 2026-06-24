:root{
  --bg:#071018;--bg2:#0b1622;--card:rgba(18,29,43,.78);--card2:rgba(22,35,50,.92);
  --line:rgba(255,255,255,.08);--text:#eef6ff;--muted:#8da2b7;
  --accent:#f6c453;--accent2:#ff8f3d;--good:#4ade80;--warn:#f59e0b;--bad:#fb7185;
  --sea:#38bdf8;--port:#a78bfa;--recovery:#94a3b8;--optional:#34d399;
  --shadow:0 22px 60px rgba(0,0,0,.35);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;color:var(--text);
  font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,Arial,sans-serif;
  background:radial-gradient(circle at 15% 0%,rgba(56,189,248,.18),transparent 32%),
    radial-gradient(circle at 100% 10%,rgba(246,196,83,.13),transparent 25%),
    linear-gradient(180deg,#071018,#0a121d 52%,#060b12);
  min-height:100vh;overflow-x:hidden;
}
body:before{
  content:"";position:fixed;inset:0;
  background:linear-gradient(120deg,rgba(255,255,255,.035) 0 1px,transparent 1px 120px),
    linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 88px);
  mask-image:linear-gradient(to bottom,rgba(0,0,0,.75),transparent 80%);
  pointer-events:none;
}
.app{max-width:980px;margin:0 auto;padding:18px 14px 100px}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;animation:dropIn .55s ease both}
.brand{display:flex;align-items:center;gap:10px}
.logo{
  width:44px;height:44px;border-radius:16px;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  color:#101820;display:grid;place-items:center;font-weight:950;font-size:15px;
  box-shadow:0 12px 30px rgba(246,196,83,.24);
}
.brand h1{font-size:20px;margin:0;letter-spacing:-.5px}
.brand p{margin:2px 0 0;color:var(--muted);font-size:12px}
.iconBtn{
  border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--text);
  width:44px;height:44px;border-radius:15px;display:grid;place-items:center;font-size:18px;
}
.topActions{display:flex;align-items:center;gap:8px}
.langBtn{font-size:12px;font-weight:950;letter-spacing:.06em}
.hero{
  position:relative;border:1px solid var(--line);
  background:linear-gradient(145deg,rgba(20,35,52,.92),rgba(9,19,31,.8));
  border-radius:28px;padding:18px;box-shadow:var(--shadow);overflow:hidden;
  animation:fadeUp .5s ease both;
}
.hero:before{
  content:"";position:absolute;inset:-80px -30px auto auto;width:210px;height:210px;border-radius:50%;
  background:radial-gradient(circle,rgba(246,196,83,.22),transparent 65%);
  animation:pulse 4s ease-in-out infinite;
}
/* DAY STATUS BANNER */
.dayStatusBanner{
  border-radius:20px;padding:14px 16px;margin-bottom:14px;position:relative;
  border:1px solid rgba(255,255,255,.1);
}
.dayStatusBanner.train{background:rgba(246,196,83,.08);border-color:rgba(246,196,83,.3)}
.dayStatusBanner.rest{background:rgba(148,163,184,.07);border-color:rgba(148,163,184,.25)}
.dayStatusBanner.optional{background:rgba(52,211,153,.07);border-color:rgba(52,211,153,.25)}
.dayStatusBanner.port-pump{background:rgba(167,139,250,.08);border-color:rgba(167,139,250,.3)}
.dayStatusBanner.recovery{background:rgba(148,163,184,.07);border-color:rgba(148,163,184,.25)}
.dayStatusBanner.moved{background:rgba(245,158,11,.07);border-color:rgba(245,158,11,.3)}
.dayStatusBanner.skipped{background:rgba(251,113,133,.07);border-color:rgba(251,113,133,.25)}
.dsBadge{
  display:inline-block;font-size:11px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;
  padding:4px 10px;border-radius:99px;margin-bottom:8px;
}
.dsBadge.train{background:rgba(246,196,83,.18);color:#ffe29a}
.dsBadge.rest{background:rgba(148,163,184,.14);color:#b0bfcf}
.dsBadge.optional{background:rgba(52,211,153,.14);color:#6ee7b7}
.dsBadge.port-pump{background:rgba(167,139,250,.18);color:#d6c9ff}
.dsBadge.recovery{background:rgba(148,163,184,.14);color:#b0bfcf}
.dsBadge.moved{background:rgba(245,158,11,.16);color:#fcd34d}
.dsBadge.skipped{background:rgba(251,113,133,.14);color:#fda4b0}
.dsTitle{font-size:22px;font-weight:950;letter-spacing:-.5px;margin:0 0 4px}
.dsSub{color:#b5c5d6;font-size:13px;margin:0 0 10px}
.dsReason{font-size:12px;color:var(--muted)}
.heroGrid{display:grid;grid-template-columns:1fr;gap:14px;position:relative}
.statusRow{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.pill{
  font-size:12px;line-height:1;border:1px solid var(--line);color:var(--text);
  padding:8px 10px;border-radius:999px;background:rgba(255,255,255,.045);backdrop-filter:blur(8px);
}
.pill.accent{border-color:rgba(246,196,83,.45);color:#ffe29a;background:rgba(246,196,83,.09)}
.pill.sea{border-color:rgba(56,189,248,.4);color:#9be3ff;background:rgba(56,189,248,.08)}
.pill.port{border-color:rgba(167,139,250,.45);color:#d6c9ff;background:rgba(167,139,250,.09)}
.pill.good{border-color:rgba(74,222,128,.45);color:#a6f7c1;background:rgba(74,222,128,.08)}
.pill.warn{border-color:rgba(245,158,11,.4);color:#fcd34d;background:rgba(245,158,11,.08)}
.ringWrap{display:flex;gap:14px;align-items:center;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:22px;padding:12px}
.ring{
  width:92px;height:92px;border-radius:50%;
  background:conic-gradient(var(--accent) calc(var(--p)*1%),rgba(255,255,255,.08) 0);
  display:grid;place-items:center;position:relative;flex:0 0 auto;
}
.ring:after{content:"";position:absolute;inset:8px;border-radius:50%;background:#111c29}
.ring span{position:relative;z-index:1;font-weight:950;font-size:20px}
.ringInfo b{display:block;font-size:18px}
.ringInfo small{color:var(--muted);line-height:1.4}
.statsGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:14px}
.stat{background:rgba(255,255,255,.045);border:1px solid var(--line);border-radius:20px;padding:12px;animation:fadeUp .5s ease both}
.stat .value{font-size:22px;font-weight:950;letter-spacing:-.5px}
.stat .label{font-size:12px;color:var(--muted);margin-top:4px}
.section{display:none;animation:fadeUp .32s ease both}
.section.active{display:block}
.card{
  border:1px solid var(--line);background:var(--card);border-radius:24px;padding:16px;margin:14px 0;
  box-shadow:0 16px 40px rgba(0,0,0,.20);backdrop-filter:blur(18px);
}
.cardTitle{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px}
.cardTitle h2{font-size:19px;margin:0;letter-spacing:-.35px}
.cardTitle p{margin:4px 0 0;color:var(--muted);font-size:13px}
/* WEEK STRIP v0.3 */
.weekStrip{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.dayChip{
  min-height:84px;border:1px solid var(--line);border-radius:18px;padding:8px 4px 6px;
  text-align:center;background:rgba(255,255,255,.025);position:relative;cursor:pointer;
  transition:border-color .15s ease,background .15s ease;overflow:hidden;
}
.dayChip:active{transform:scale(.97)}
.dayChip.today{border-color:rgba(246,196,83,.65);background:rgba(246,196,83,.06)}
.dayChip.done{border-color:rgba(74,222,128,.5);background:rgba(74,222,128,.05)}
.dayChip.moved{border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.04)}
.dayChip.skipped{opacity:.55}
.dayChip .dow{font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.dayChip .num{font-size:17px;font-weight:950;margin:3px 0 4px}
.dayChip .dtype{font-size:9px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;padding:2px 5px;border-radius:6px;display:inline-block}
.dtype.train{background:rgba(246,196,83,.2);color:#ffe29a}
.dtype.rest{background:rgba(148,163,184,.15);color:#9eb3c7}
.dtype.optional{background:rgba(52,211,153,.15);color:#6ee7b7}
.dtype.port-pump{background:rgba(167,139,250,.2);color:#d6c9ff}
.dtype.recovery{background:rgba(148,163,184,.12);color:#9eb3c7}
.dtype.moved{background:rgba(245,158,11,.18);color:#fcd34d}
.dtype.skipped{background:rgba(251,113,133,.15);color:#fda4b0}
.dayChip .shortlabel{font-size:9px;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px}
/* MONTH CAL */
.monthCal{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
.monthHead{color:var(--muted);font-size:11px;text-align:center;padding:6px 0}
.calDay{
  min-height:54px;border:1px solid var(--line);border-radius:14px;padding:5px;background:rgba(255,255,255,.025);
  font-size:12px;position:relative;cursor:pointer;transition:border-color .15s;
}
.calDay:active{transform:scale(.97)}
.calDay.muted{opacity:.28}
.calDay.today{border-color:var(--accent);box-shadow:0 0 0 1px rgba(246,196,83,.12)}
.calDay.done{background:rgba(74,222,128,.07);border-color:rgba(74,222,128,.35)}
.calDay.moved{border-color:rgba(245,158,11,.4)}
.calDay.skipped{opacity:.45}
.calDay .n{font-weight:850}
.calDay .ctag{font-size:9px;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ctag.train{color:#ffe29a}
.ctag.rest{color:var(--muted)}
.ctag.optional{color:#6ee7b7}
.ctag.port-pump{color:#d6c9ff}
.ctag.recovery{color:var(--muted)}
.ctag.moved{color:#fcd34d}
.ctag.skipped{color:#fda4b0}
.ctag.port{color:#d6c9ff}
.calDay .mark{position:absolute;right:5px;top:5px;width:6px;height:6px;border-radius:50%}
.mark.train{background:var(--accent)}
.mark.rest{background:var(--recovery)}
.mark.port{background:var(--port)}
.mark.optional{background:var(--optional)}
/* DAY MODAL */
.dayModal{
  position:fixed;inset:0;background:rgba(0,0,0,.7);display:none;align-items:flex-end;z-index:80;
}
.dayModal.show{display:flex}
.sheet{
  width:100%;max-width:760px;margin:0 auto;background:#101a27;border:1px solid var(--line);
  border-radius:28px 28px 0 0;padding:18px;max-height:88vh;overflow:auto;animation:slideSheet .25s ease both;
}
.dayModalTitle{font-size:22px;font-weight:950;margin:0 0 4px;letter-spacing:-.5px}
.dayModalSub{color:var(--muted);font-size:13px;margin:0 0 14px}
/* Move/skip actions */
.actionGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
.actionBtn{
  background:rgba(255,255,255,.045);border:1px solid var(--line);color:var(--text);
  border-radius:18px;padding:12px;font-size:13px;font-weight:800;text-align:center;cursor:pointer;
  transition:background .15s;
}
.actionBtn:active{transform:scale(.98)}
.actionBtn.primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#101820;border-color:transparent}
.actionBtn.warn{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.3);color:#fcd34d}
.actionBtn.danger{background:rgba(251,113,133,.08);border-color:rgba(251,113,133,.25);color:#fda4b0}
.actionBtn.port{background:rgba(167,139,250,.1);border-color:rgba(167,139,250,.3);color:#d6c9ff}
.skipReasons{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
.reasonBtn{
  background:rgba(255,255,255,.04);border:1px solid var(--line);color:var(--muted);
  border-radius:16px;padding:11px 10px;font-size:13px;font-weight:700;cursor:pointer;text-align:center;
}
.reasonBtn:active{transform:scale(.97)}
/* EXERCISE */
.exerciseCard{background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:20px;margin:10px 0;overflow:hidden}
.exHead{display:flex;justify-content:space-between;gap:10px;padding:13px;cursor:pointer}
.exName{font-weight:900}
.exEn{font-size:12px;color:var(--muted);margin-top:3px}
.exBadge{font-size:12px;color:#ffe29a;white-space:nowrap;font-weight:850}
.exBody{display:none;border-top:1px solid var(--line);padding:13px;color:#bfd0df;font-size:13px;line-height:1.45}
.exerciseCard.open .exBody{display:block}
.infoGrid{display:grid;grid-template-columns:1fr;gap:8px;margin-top:8px}
.infoBox{background:rgba(255,255,255,.035);border:1px solid var(--line);border-radius:15px;padding:10px}
.infoBox b{display:block;color:var(--text);margin-bottom:4px}
/* PROGRESS */
.progressBars{display:grid;gap:11px}
.barRow{display:grid;grid-template-columns:84px 1fr 48px;gap:9px;align-items:center;font-size:13px}
.bar{height:10px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}
.bar span{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:999px}
.inputRow{display:grid;grid-template-columns:1fr auto;gap:8px;margin:8px 0}
input,select{
  width:100%;background:rgba(255,255,255,.055);border:1px solid var(--line);border-radius:15px;color:var(--text);
  padding:12px;font:inherit;outline:none;
}
input:focus,select:focus{border-color:rgba(246,196,83,.6)}
.historyLine{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid var(--line);padding:10px 0;color:#c7d4e2;font-size:13px}
/* WEEK COMPLIANCE */
.weekCompliance{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
.wc{background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:18px;padding:12px;text-align:center}
.wc .wcNum{font-size:28px;font-weight:950;letter-spacing:-.5px}
.wc .wcLbl{font-size:11px;color:var(--muted);margin-top:3px}
.wc.done .wcNum{color:var(--good)}
.wc.moved .wcNum{color:var(--warn)}
.wc.skipped .wcNum{color:var(--bad)}
.wc.recovery .wcNum{color:var(--recovery)}
/* NAV */
.nav{
  position:fixed;left:50%;bottom:12px;transform:translateX(-50%);width:min(94vw,520px);
  background:rgba(12,22,34,.88);border:1px solid var(--line);border-radius:24px;padding:8px;
  display:grid;grid-template-columns:repeat(6,1fr);gap:6px;backdrop-filter:blur(18px);
  box-shadow:var(--shadow);z-index:50;
}
.nav button{padding:9px 5px;border-radius:17px;background:transparent;color:var(--muted);font-size:11px;font-weight:800}
.nav button.active{background:rgba(246,196,83,.14);color:#ffe29a}
.nav span{display:block;font-size:19px;margin-bottom:3px}
/* WORKOUT MODAL */
.modal{position:fixed;inset:0;background:rgba(0,0,0,.66);display:none;align-items:flex-end;z-index:80}
.modal.show{display:flex}
.timer{text-align:center;font-size:54px;font-weight:950;letter-spacing:-2px;margin:10px 0;color:#ffe29a}
.setGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}
.setCell{border:1px solid var(--line);border-radius:15px;padding:10px;text-align:center;background:rgba(255,255,255,.04);cursor:pointer;font-size:13px;font-weight:800}
.setCell.done{background:rgba(74,222,128,.10);border-color:rgba(74,222,128,.45);color:var(--good)}
/* REST CARD (not a workout) */
.restCard{
  background:rgba(148,163,184,.06);border:1px solid rgba(148,163,184,.2);
  border-radius:22px;padding:20px;margin:10px 0;text-align:center;
}
.restCard .restIcon{font-size:42px;margin-bottom:8px}
.restCard h3{margin:0 0 6px;font-size:20px;font-weight:950}
.restCard p{color:var(--muted);font-size:13px;line-height:1.5;margin:0}
/* TOAST */
.toast{
  position:fixed;left:50%;top:14px;transform:translateX(-50%) translateY(-80px);
  background:#142033;border:1px solid var(--line);color:var(--text);padding:12px 16px;border-radius:16px;
  box-shadow:var(--shadow);z-index:100;transition:.25s ease;max-width:92vw;text-align:center;
}
.toast.show{transform:translateX(-50%) translateY(0)}
.confetti{position:fixed;inset:0;pointer-events:none;z-index:110;overflow:hidden}
.confetti i{
  position:absolute;width:8px;height:14px;background:var(--accent);top:-20px;border-radius:3px;
  animation:fall 900ms ease-in forwards;
}
/* DIVIDER */
.divider{height:1px;background:var(--line);margin:14px 0}
/* CTAROW */
.ctaRow{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
button{
  font:inherit;border:0;border-radius:16px;padding:13px 14px;font-weight:850;cursor:pointer;
  transition:transform .16s ease,filter .16s ease,background .16s ease;
}
button:active{transform:scale(.98)}
.primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#101820;box-shadow:0 12px 28px rgba(246,196,83,.18)}
.secondary{background:rgba(255,255,255,.06);color:var(--text);border:1px solid var(--line)}
.ghost{background:transparent;color:var(--muted);border:1px solid var(--line)}
/* NOTE BOX */
.noteBox{
  background:rgba(56,189,248,.06);border:1px solid rgba(56,189,248,.2);
  border-radius:16px;padding:12px;font-size:13px;color:#9be3ff;margin:10px 0;line-height:1.45;
}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes dropIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.08);opacity:1}}
@keyframes slideSheet{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes fall{to{transform:translateY(105vh) rotate(560deg);opacity:.2}}

/* ── Exercise motion demos ─────────────────────────────── */
.motion{position:relative;height:132px;margin:0 0 12px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:radial-gradient(circle at 20% 18%,rgba(246,196,83,.14),transparent 26%),linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.02));overflow:hidden}
.motion:before{content:"";position:absolute;left:14px;right:14px;bottom:18px;height:2px;background:rgba(255,255,255,.12);border-radius:999px}
.motion .label{position:absolute;left:10px;top:9px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#ffe29a;font-weight:900}
.motion .person{position:absolute;inset:0}
.motion .head,.motion .torso,.motion .armL,.motion .armR,.motion .legL,.motion .legR,.motion .weight,.motion .bench,.motion .cable,.motion .seat,.motion .ball{position:absolute;display:block}
.motion .head{width:16px;height:16px;border-radius:50%;background:#eaf2ff;left:50%;top:29px;transform:translateX(-50%)}
.motion .torso{width:9px;height:34px;border-radius:999px;background:#c6d7ea;left:50%;top:47px;transform:translateX(-50%);transform-origin:50% 0}
.motion .armL,.motion .armR,.motion .legL,.motion .legR{height:7px;width:34px;border-radius:999px;background:#8fb2d8;transform-origin:5px 50%}
.motion .armL{left:calc(50% - 4px);top:50px;transform:rotate(145deg)}
.motion .armR{left:calc(50% - 2px);top:50px;transform:rotate(35deg)}
.motion .legL{left:calc(50% - 2px);top:79px;transform:rotate(115deg);background:#6f94bd}
.motion .legR{left:calc(50% - 4px);top:79px;transform:rotate(65deg);background:#6f94bd}
.motion .weight{width:12px;height:12px;border-radius:4px;background:linear-gradient(135deg,#f6c453,#ff8f3d)}
.motion .bench{left:34px;right:34px;bottom:26px;height:8px;border-radius:999px;background:#40546b}
.motion .cable{width:2px;background:rgba(246,196,83,.55);top:18px;bottom:38px;left:50%;transform:translateX(-50%)}
.motion .seat{width:44px;height:9px;border-radius:9px;background:#40546b;left:calc(50% - 22px);bottom:30px}
.motion .ball{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#f6c453,#ff8f3d);left:calc(50% - 14px);top:56px}
/* press */
.motion.press .head{left:45%;top:65px}.motion.press .torso{left:49%;top:72px;width:52px;height:8px;transform:rotate(0deg);background:#c6d7ea}.motion.press .armL{left:45%;top:62px;animation:pressArmL 1.7s ease-in-out infinite}.motion.press .armR{left:54%;top:62px;animation:pressArmR 1.7s ease-in-out infinite}.motion.press .weight.w1{left:35%;top:39px;animation:pressWeightL 1.7s ease-in-out infinite}.motion.press .weight.w2{right:35%;top:39px;animation:pressWeightR 1.7s ease-in-out infinite}
/* incline */
.motion.incline .bench{transform:rotate(-14deg);bottom:40px;left:48px;right:44px}.motion.incline .head{left:43%;top:58px}.motion.incline .torso{left:50%;top:68px;width:52px;height:8px;transform:rotate(-14deg)}.motion.incline .armL{left:45%;top:55px;animation:pressArmL 1.6s ease-in-out infinite}.motion.incline .armR{left:54%;top:55px;animation:pressArmR 1.6s ease-in-out infinite}.motion.incline .weight.w1{left:35%;top:35px;animation:pressWeightL 1.6s ease-in-out infinite}.motion.incline .weight.w2{right:35%;top:35px;animation:pressWeightR 1.6s ease-in-out infinite}
/* pulldown */
.motion.pulldown .cable{top:14px;bottom:70px}.motion.pulldown .head{top:55px}.motion.pulldown .torso{top:73px;height:30px}.motion.pulldown .armL{top:55px;left:calc(50% - 6px);animation:pulldownL 1.5s ease-in-out infinite}.motion.pulldown .armR{top:55px;left:calc(50% - 1px);animation:pulldownR 1.5s ease-in-out infinite}.motion.pulldown .bar{position:absolute;left:calc(50% - 48px);top:23px;width:96px;height:5px;border-radius:999px;background:#f6c453;animation:pulldownBar 1.5s ease-in-out infinite}
/* row */
.motion.row .seat{bottom:24px}.motion.row .head{left:37%;top:47px}.motion.row .torso{left:39%;top:64px;transform:rotate(-14deg)}.motion.row .armL,.motion.row .armR{left:42%;top:66px;animation:rowArms 1.45s ease-in-out infinite}.motion.row .cable{height:2px;width:80px;top:69px;left:54%;bottom:auto;background:rgba(246,196,83,.55);animation:rowCable 1.45s ease-in-out infinite}
/* shoulder */
.motion.shoulder .armL{animation:shoulderL 1.55s ease-in-out infinite}.motion.shoulder .armR{animation:shoulderR 1.55s ease-in-out infinite}.motion.shoulder .weight.w1{left:38%;top:30px;animation:shoulderWL 1.55s ease-in-out infinite}.motion.shoulder .weight.w2{right:38%;top:30px;animation:shoulderWR 1.55s ease-in-out infinite}
/* lateral */
.motion.lateral .armL{animation:lateralL 1.55s ease-in-out infinite}.motion.lateral .armR{animation:lateralR 1.55s ease-in-out infinite}.motion.lateral .weight.w1{left:28%;top:61px;animation:lateralWL 1.55s ease-in-out infinite}.motion.lateral .weight.w2{right:28%;top:61px;animation:lateralWR 1.55s ease-in-out infinite}
/* curl / triceps */
.motion.curl .armL{animation:curlL 1.35s ease-in-out infinite}.motion.curl .armR{animation:curlR 1.35s ease-in-out infinite}.motion.curl .weight.w1{left:36%;top:72px;animation:curlWL 1.35s ease-in-out infinite}.motion.curl .weight.w2{right:36%;top:72px;animation:curlWR 1.35s ease-in-out infinite}
.motion.triceps .cable{left:58%;top:15px;bottom:45px}.motion.triceps .armR{left:55%;top:54px;animation:tricepsArm 1.35s ease-in-out infinite}.motion.triceps .weight.w2{right:28%;top:73px;animation:tricepsW 1.35s ease-in-out infinite}
.motion.overhead .armL{left:47%;top:43px;animation:overheadL 1.45s ease-in-out infinite}.motion.overhead .armR{left:51%;top:43px;animation:overheadR 1.45s ease-in-out infinite}.motion.overhead .weight.w1{left:calc(50% - 6px);top:22px;animation:overheadW 1.45s ease-in-out infinite}
/* squat / lunge / calf */
.motion.squat .person{animation:squatBody 1.65s ease-in-out infinite}.motion.squat .legL{animation:squatLegL 1.65s ease-in-out infinite}.motion.squat .legR{animation:squatLegR 1.65s ease-in-out infinite}.motion.squat .ball{animation:squatBall 1.65s ease-in-out infinite}
.motion.lunge .person{animation:lungeBody 1.7s ease-in-out infinite}.motion.lunge .legL{animation:lungeLegL 1.7s ease-in-out infinite}.motion.lunge .legR{animation:lungeLegR 1.7s ease-in-out infinite}
.motion.calf .person{animation:calfBody 1.2s ease-in-out infinite}.motion.calf .legL{transform:rotate(95deg)}.motion.calf .legR{transform:rotate(85deg)}
/* rdl / pull-through */
.motion.rdl .torso{animation:rdlTorso 1.7s ease-in-out infinite}.motion.rdl .armL{animation:rdlArmL 1.7s ease-in-out infinite}.motion.rdl .armR{animation:rdlArmR 1.7s ease-in-out infinite}.motion.rdl .weight.w1{left:38%;top:83px;animation:rdlWL 1.7s ease-in-out infinite}.motion.rdl .weight.w2{right:38%;top:83px;animation:rdlWR 1.7s ease-in-out infinite}
.motion.pullthrough .cable{height:2px;width:74px;top:82px;left:25%;bottom:auto}.motion.pullthrough .person{animation:pullBody 1.7s ease-in-out infinite}.motion.pullthrough .torso{animation:rdlTorso 1.7s ease-in-out infinite}
/* machines */
.motion.legext .seat{bottom:56px;left:39%}.motion.legext .head{left:44%;top:32px}.motion.legext .torso{left:45%;top:49px;transform:rotate(-8deg)}.motion.legext .legL{left:45%;top:80px;animation:legExt 1.35s ease-in-out infinite}
.motion.legcurl .head{left:43%;top:62px}.motion.legcurl .torso{left:48%;top:71px;width:60px;height:8px}.motion.legcurl .bench{bottom:44px}.motion.legcurl .legL{left:55%;top:76px;animation:legCurl 1.35s ease-in-out infinite}
/* plank / cardio / mobility / core */
.motion.plank .head{left:31%;top:73px}.motion.plank .torso{left:48%;top:78px;width:60px;height:8px;transform:rotate(0deg)}.motion.plank .armL{left:29%;top:82px;transform:rotate(0deg);width:24px}.motion.plank .legL{left:65%;top:82px;transform:rotate(0deg);width:34px}.motion.plank .person{animation:plankPulse 1.8s ease-in-out infinite}
.motion.sideplank .head{left:33%;top:70px}.motion.sideplank .torso{left:50%;top:76px;width:62px;height:8px;transform:rotate(-6deg)}.motion.sideplank .armL{left:35%;top:84px;transform:rotate(96deg);width:25px}.motion.sideplank .legL{left:64%;top:80px;transform:rotate(0deg)}
.motion.cardio .person{animation:cardioBounce .75s ease-in-out infinite}
.motion.mobility .armL{animation:mobilityArmL 1.7s ease-in-out infinite}.motion.mobility .armR{animation:mobilityArmR 1.7s ease-in-out infinite}
.motion.core .torso{animation:coreTorso 1.5s ease-in-out infinite}.motion.core .head{animation:coreHead 1.5s ease-in-out infinite}
/* fly / face pull / one-arm row */
.motion.fly .head{left:45%;top:65px}.motion.fly .torso{left:49%;top:72px;width:52px;height:8px}.motion.fly .bench{bottom:38px}.motion.fly .armL{left:45%;top:60px;animation:flyL 1.6s ease-in-out infinite}.motion.fly .armR{left:54%;top:60px;animation:flyR 1.6s ease-in-out infinite}.motion.fly .weight.w1{left:32%;top:54px;animation:flyWL 1.6s ease-in-out infinite}.motion.fly .weight.w2{right:32%;top:54px;animation:flyWR 1.6s ease-in-out infinite}
.motion.facepull .cable{height:2px;width:72px;left:54%;top:51px;bottom:auto}.motion.facepull .head{left:40%;top:47px}.motion.facepull .torso{left:41%;top:64px}.motion.facepull .armL,.motion.facepull .armR{left:43%;top:52px;animation:facePull 1.5s ease-in-out infinite}
.motion.onerow .bench{left:28px;right:86px;bottom:42px}.motion.onerow .head{left:42%;top:45px}.motion.onerow .torso{left:46%;top:63px;transform:rotate(-38deg)}.motion.onerow .armR{left:50%;top:66px;animation:oneRowArm 1.5s ease-in-out infinite}.motion.onerow .weight.w2{right:31%;top:75px;animation:oneRowW 1.5s ease-in-out infinite}
/* keyframes */
@keyframes pressArmL{0%,100%{transform:rotate(145deg)}50%{transform:rotate(250deg)}}
@keyframes pressArmR{0%,100%{transform:rotate(35deg)}50%{transform:rotate(-70deg)}}
@keyframes pressWeightL{0%,100%{transform:translate(0,18px)}50%{transform:translate(7px,-7px)}}
@keyframes pressWeightR{0%,100%{transform:translate(0,18px)}50%{transform:translate(-7px,-7px)}}
@keyframes pulldownL{0%,100%{transform:rotate(238deg)}50%{transform:rotate(160deg)}}
@keyframes pulldownR{0%,100%{transform:rotate(-58deg)}50%{transform:rotate(20deg)}}
@keyframes pulldownBar{0%,100%{transform:translateY(0)}50%{transform:translateY(24px)}}
@keyframes rowArms{0%,100%{transform:rotate(0deg) translateX(28px)}50%{transform:rotate(0deg) translateX(0)}}
@keyframes rowCable{0%,100%{width:96px}50%{width:56px}}
@keyframes shoulderL{0%,100%{transform:rotate(145deg)}50%{transform:rotate(250deg)}}
@keyframes shoulderR{0%,100%{transform:rotate(35deg)}50%{transform:rotate(-70deg)}}
@keyframes shoulderWL{0%,100%{transform:translate(0,26px)}50%{transform:translate(6px,-4px)}}
@keyframes shoulderWR{0%,100%{transform:translate(0,26px)}50%{transform:translate(-6px,-4px)}}
@keyframes lateralL{0%,100%{transform:rotate(120deg)}50%{transform:rotate(195deg)}}
@keyframes lateralR{0%,100%{transform:rotate(60deg)}50%{transform:rotate(-15deg)}}
@keyframes lateralWL{0%,100%{transform:translate(18px,10px)}50%{transform:translate(-2px,-17px)}}
@keyframes lateralWR{0%,100%{transform:translate(-18px,10px)}50%{transform:translate(2px,-17px)}}
@keyframes curlL{0%,100%{transform:rotate(115deg)}50%{transform:rotate(55deg)}}
@keyframes curlR{0%,100%{transform:rotate(65deg)}50%{transform:rotate(125deg)}}
@keyframes curlWL{0%,100%{transform:translate(8px,8px)}50%{transform:translate(22px,-16px)}}
@keyframes curlWR{0%,100%{transform:translate(-8px,8px)}50%{transform:translate(-22px,-16px)}}
@keyframes tricepsArm{0%,100%{transform:rotate(75deg)}50%{transform:rotate(105deg)}}
@keyframes tricepsW{0%,100%{transform:translateY(-16px)}50%{transform:translateY(9px)}}
@keyframes overheadL{0%,100%{transform:rotate(245deg)}50%{transform:rotate(280deg)}}
@keyframes overheadR{0%,100%{transform:rotate(-65deg)}50%{transform:rotate(-100deg)}}
@keyframes overheadW{0%,100%{transform:translateY(9px)}50%{transform:translateY(-8px)}}
@keyframes squatBody{0%,100%{transform:translateY(0)}50%{transform:translateY(20px)}}
@keyframes squatLegL{0%,100%{transform:rotate(110deg)}50%{transform:rotate(145deg)}}
@keyframes squatLegR{0%,100%{transform:rotate(70deg)}50%{transform:rotate(35deg)}}
@keyframes squatBall{0%,100%{transform:translateY(0)}50%{transform:translateY(20px)}}
@keyframes lungeBody{0%,100%{transform:translateY(0) translateX(0)}50%{transform:translateY(15px) translateX(-7px)}}
@keyframes lungeLegL{0%,100%{transform:rotate(105deg)}50%{transform:rotate(150deg)}}
@keyframes lungeLegR{0%,100%{transform:rotate(35deg)}50%{transform:rotate(10deg)}}
@keyframes calfBody{0%,100%{transform:translateY(4px)}50%{transform:translateY(-5px)}}
@keyframes rdlTorso{0%,100%{transform:translateX(-50%) rotate(0deg)}50%{transform:translateX(-50%) rotate(45deg)}}
@keyframes rdlArmL{0%,100%{transform:rotate(115deg)}50%{transform:rotate(82deg)}}
@keyframes rdlArmR{0%,100%{transform:rotate(65deg)}50%{transform:rotate(98deg)}}
@keyframes rdlWL{0%,100%{transform:translateY(0)}50%{transform:translateY(18px)}}
@keyframes rdlWR{0%,100%{transform:translateY(0)}50%{transform:translateY(18px)}}
@keyframes pullBody{0%,100%{transform:translateX(8px)}50%{transform:translateX(-4px)}}
@keyframes legExt{0%,100%{transform:rotate(75deg)}50%{transform:rotate(5deg)}}
@keyframes legCurl{0%,100%{transform:rotate(15deg)}50%{transform:rotate(85deg)}}
@keyframes plankPulse{50%{transform:translateY(-2px)}}
@keyframes cardioBounce{50%{transform:translateY(-8px)}}
@keyframes mobilityArmL{0%,100%{transform:rotate(130deg)}50%{transform:rotate(220deg)}}
@keyframes mobilityArmR{0%,100%{transform:rotate(50deg)}50%{transform:rotate(-40deg)}}
@keyframes coreTorso{0%,100%{transform:translateX(-50%) rotate(0deg)}50%{transform:translateX(-50%) rotate(-18deg)}}
@keyframes coreHead{50%{transform:translateX(-50%) translateY(-9px)}}
@keyframes flyL{0%,100%{transform:rotate(200deg)}50%{transform:rotate(250deg)}}
@keyframes flyR{0%,100%{transform:rotate(-20deg)}50%{transform:rotate(-70deg)}}
@keyframes flyWL{0%,100%{transform:translate(-18px,4px)}50%{transform:translate(4px,-8px)}}
@keyframes flyWR{0%,100%{transform:translate(18px,4px)}50%{transform:translate(-4px,-8px)}}
@keyframes facePull{0%,100%{transform:rotate(0deg) translateX(34px)}50%{transform:rotate(0deg) translateX(3px)}}
@keyframes oneRowArm{0%,100%{transform:rotate(90deg)}50%{transform:rotate(35deg)}}
@keyframes oneRowW{0%,100%{transform:translateY(14px)}50%{transform:translateY(-10px)}}
@media(prefers-reduced-motion:reduce){.motion *,.motion,.person{animation:none!important}}

/* ── Quick action buttons ───────────────────────────────── */
.quickBtns{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px}
/* ── Readiness check modal ──────────────────────────────── */
.readProgress{height:3px;background:rgba(255,255,255,.08);border-radius:999px;margin-bottom:18px;overflow:hidden}
.readProgress b{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:999px;transition:width .3s ease}
.readQ{font-size:18px;font-weight:950;margin:0 0 4px;letter-spacing:-.4px}
.readSub{font-size:13px;color:var(--muted);margin:0 0 14px}
.readOpts{display:grid;grid-template-columns:1fr;gap:8px;margin:0 0 14px}
.readOpt{background:rgba(255,255,255,.05);border:2px solid transparent;border-radius:16px;padding:12px 14px;font-size:14px;font-weight:700;cursor:pointer;text-align:left;color:var(--text);transition:all .18s;display:flex;align-items:center;gap:12px}
.readOpt:active{transform:scale(.98)}.readOpt.sel,.readOpt:hover{background:rgba(246,196,83,.1);border-color:rgba(246,196,83,.5);color:#ffe29a}
.readIcon{font-size:22px;flex:0 0 auto}
.readResult{border-radius:18px;padding:18px;margin:10px 0;text-align:center}
.readResult.heavy{background:rgba(246,196,83,.1);border:1px solid rgba(246,196,83,.3)}
.readResult.medium{background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.25)}
.readResult.light{background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.3)}
.readResult.rest{background:rgba(148,163,184,.07);border:1px solid rgba(148,163,184,.2)}
.readResultIcon{font-size:42px;margin-bottom:8px}
.readResultTitle{font-size:20px;font-weight:950;margin:0 0 4px}
.readResultSub{font-size:13px;color:var(--muted);margin:0 0 14px}
/* ── Set logging ────────────────────────────────────────── */
.setRows{margin:10px 0 4px}
.setRow{display:grid;grid-template-columns:38px 1fr 1fr 38px;gap:6px;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.setRow:last-child{border-bottom:none}
.setNum{font-size:11px;color:var(--muted);font-weight:900;text-align:center;letter-spacing:.04em}
.setInp{background:rgba(255,255,255,.07);border:1px solid var(--line);border-radius:11px;color:var(--text);padding:8px 4px;font:inherit;font-size:15px;font-weight:800;text-align:center;width:100%;-moz-appearance:textfield}
.setInp::-webkit-outer-spin-button,.setInp::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.setInp:focus{border-color:rgba(246,196,83,.6);outline:none;background:rgba(246,196,83,.06)}
.setInp.done{background:rgba(74,222,128,.08);border-color:rgba(74,222,128,.35);color:var(--good)}
.setTick{width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.04);border:1px solid var(--line);font-size:15px;display:grid;place-items:center;cursor:pointer;transition:all .15s}
.setTick:active{transform:scale(.93)}.setTick.done{background:rgba(74,222,128,.15);border-color:rgba(74,222,128,.5);color:var(--good)}
.setHead{display:grid;grid-template-columns:38px 1fr 1fr 38px;gap:6px;font-size:10px;color:var(--muted);font-weight:900;text-transform:uppercase;letter-spacing:.06em;padding:0 0 4px;border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:2px}
.hintBox{font-size:12px;color:#9be3ff;background:rgba(56,189,248,.07);border:1px solid rgba(56,189,248,.18);border-radius:11px;padding:8px 11px;margin:8px 0;line-height:1.5}
/* ── Weight chart ───────────────────────────────────────── */
.chartWrap{margin:12px 0;border-radius:16px;background:rgba(255,255,255,.03);border:1px solid var(--line);overflow:hidden}
.chartWrap svg{display:block;width:100%}
.chartEmpty{text-align:center;padding:32px;color:var(--muted);font-size:13px}

@media(min-width:760px){
  .heroGrid{grid-template-columns:1.5fr .9fr;align-items:center}
  .statsGrid{grid-template-columns:repeat(4,1fr)}
  .infoGrid{grid-template-columns:repeat(2,1fr)}
  .weekCompliance{grid-template-columns:repeat(4,1fr)}
}


/* ── Real GIF exercise demos v0.4.0 ───────────────────────── */
.gifDemo{
  position:relative;
  margin:0 0 14px;
  border-radius:18px;
  border:1px solid rgba(255,255,255,.09);
  background:linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.02));
  overflow:hidden;
  min-height:220px;
}
.gifDemo img{
  display:block;
  width:100%;
  height:220px;
  object-fit:contain;
  background:#0b1117;
}
.gifDemo .gifMeta{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  padding:8px 10px;
  border-top:1px solid rgba(255,255,255,.08);
  font-size:11px;
  color:var(--muted);
}
.gifDemo .gifBadge{
  display:inline-flex;
  align-items:center;
  gap:5px;
  padding:4px 8px;
  border-radius:999px;
  background:rgba(246,196,83,.12);
  color:#ffe29a;
  font-weight:800;
  white-space:nowrap;
}
.gifDemo .gifSource{
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  text-align:right;
}
.gifFallback{
  display:none;
  align-items:center;
  justify-content:center;
  min-height:220px;
  padding:18px;
  color:var(--muted);
  text-align:center;
  line-height:1.5;
  background:radial-gradient(circle at 50% 10%,rgba(246,196,83,.12),transparent 38%),#0b1117;
}
.gifDemo.failed img{display:none}
.gifDemo.failed .gifFallback{display:flex}
.gifLicenseNote{
  margin:6px 0 12px;
  padding:9px 11px;
  border:1px solid rgba(246,196,83,.16);
  background:rgba(246,196,83,.07);
  color:#d7e2ee;
  border-radius:13px;
  font-size:12px;
  line-height:1.45;
}

/* ── v0.5.0 product upgrade ─────────────────────────────── */
.loginScreen{position:fixed;inset:0;z-index:120;background:radial-gradient(circle at 20% 10%,rgba(246,196,83,.18),transparent 28%),linear-gradient(160deg,#071018,#0b1622);display:flex;align-items:center;justify-content:center;padding:22px}
.loginScreen.hide{display:none}
.loginCard{width:min(460px,100%);border:1px solid rgba(255,255,255,.12);background:rgba(13,25,38,.92);box-shadow:0 24px 80px rgba(0,0,0,.45);border-radius:28px;padding:24px;text-align:center}
.loginLogo{width:58px;height:58px;margin:0 auto 12px;border-radius:18px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;color:#111827;font-weight:950;font-size:20px}
.loginCard h1{margin:0;font-size:32px}.loginSub{color:var(--muted);margin:6px 0 16px}.profileGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.profileBtn{border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.05);color:var(--text);padding:16px;font-weight:900}.loginDivider{margin:18px 0 10px;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.08em}.loginHint{font-size:12px;color:var(--muted);line-height:1.5}.locked{filter:blur(2px);pointer-events:none}.nav.locked{display:none}.profileChip{font-size:11px;color:#ffe29a;border:1px solid rgba(246,196,83,.25);background:rgba(246,196,83,.08);border-radius:999px;padding:7px 9px;font-weight:900}.syncBtn{font-size:14px}.inputRow.stacked{display:grid;grid-template-columns:1fr;gap:9px}.miniActions{display:flex;gap:8px;flex-wrap:wrap}.ctaRow.wrap{flex-wrap:wrap}.fileBtn{position:relative;display:inline-grid;place-items:center;cursor:pointer}.fileBtn input{display:none}.trackerGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.trackerGrid label{font-size:12px;color:var(--muted);display:grid;gap:6px}.trackerGrid input,.trackerGrid select,.swapSelect{width:100%;border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--text);border-radius:12px;padding:11px}.checkGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0}.checkGrid label{border:1px solid var(--line);border-radius:12px;padding:10px;color:#c7d4e2;background:rgba(255,255,255,.03);font-size:13px}.noteBox.compact{font-size:12px;margin-top:10px}.progressExercise{display:grid;grid-template-columns:1.3fr .9fr;gap:10px;align-items:center;border-bottom:1px solid var(--line);padding:12px 0}.progressExercise b{display:block;color:var(--text);font-size:13px}.progressExercise small{display:block;color:var(--muted);font-size:11px;margin-top:3px}.progressExercise span{display:block;color:#c7d4e2;font-size:12px}.progressExercise strong{display:block;color:#ffe29a;font-size:13px;margin-top:3px}.swapBar{display:flex;gap:8px;align-items:center;margin:8px 0}.swapBar .tiny{font-size:11px;padding:7px 9px}.recWeight{font-size:12px;color:#c7d4e2;margin:6px 0}.recWeight strong{color:#ffe29a}.recWeight.muted{color:var(--muted);font-style:italic}.focusPanel{border:1px solid rgba(246,196,83,.18);background:rgba(246,196,83,.06);border-radius:18px;padding:12px;margin-bottom:12px}.focusTop{display:flex;align-items:center;gap:8px;margin-bottom:8px}.focusTop span{color:#111827;background:var(--accent);border-radius:999px;padding:4px 8px;font-size:11px;font-weight:950}.focusTop b{flex:1;font-size:14px}.focusTop em{font-style:normal;color:#ffe29a;font-weight:900;font-size:12px}.focusText{font-size:13px;color:#c7d4e2;line-height:1.45;margin:8px 0}
@media(max-width:520px){.trackerGrid,.progressExercise{grid-template-columns:1fr}.profileGrid{grid-template-columns:1fr}.profileChip{display:none}}

.trackerGrid .wide{grid-column:1/-1}.loginCard .noteBox{margin-top:12px;text-align:left}.loginCard input{min-width:0}.profileBtn.local{opacity:.85}


/* v0.6.0 Local RC */
.allSetsDetails{margin-top:12px;border:1px solid var(--line);border-radius:16px;padding:10px;background:rgba(255,255,255,.025)}
.allSetsDetails summary{cursor:pointer;color:#c7d4e2;font-weight:900;font-size:13px}
.proFocus{position:relative;overflow:hidden}.proFocus.increase{border-color:rgba(74,222,128,.35)}.proFocus.repeat{border-color:rgba(246,196,83,.28)}.proFocus.deload{border-color:rgba(251,113,133,.35)}
.focusProgress{display:flex;justify-content:space-between;gap:10px;align-items:center;margin:10px 0;color:#c7d4e2;font-size:13px}.focusProgress b{color:#fff}.focusProgress span{color:var(--muted)}
.focusInputs{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;margin:12px 0}.focusInputs label{display:grid;gap:6px;color:var(--muted);font-size:12px}.focusInputs input{border:1px solid var(--line);background:rgba(255,255,255,.04);border-radius:12px;color:var(--text);padding:12px;font-weight:900}.focusInputs button{height:44px}
.progressExercise em{display:block;font-style:normal;color:var(--muted);font-size:11px;margin-top:4px}.progressExercise.increase strong{color:#4ade80}.progressExercise.deload strong{color:#fb7185}.progressExercise.repeat strong{color:#ffe29a}
.summaryLine{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);padding:10px 0}.summaryLine b{display:block}.summaryLine small{display:block;color:var(--muted);font-size:11px;margin-top:3px}.summaryLine span{color:#ffe29a;font-size:12px;font-weight:900}
.miniMetrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.miniMetrics div{border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.035);padding:12px;text-align:center}.miniMetrics b{display:block;font-size:20px;color:#ffe29a}.miniMetrics span{display:block;color:var(--muted);font-size:11px;margin-top:3px}
@media(max-width:640px){.focusInputs{grid-template-columns:1fr 1fr}.focusInputs button{grid-column:1/-1}.miniMetrics{grid-template-columns:repeat(2,minmax(0,1fr))}}


/* v0.6.1 PWA / QA polish */
.offlineStatus{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:150;background:#f97316;color:#111827;font-weight:950;border-radius:999px;padding:8px 14px;box-shadow:0 12px 34px rgba(0,0,0,.35);display:none;font-size:12px}
.offlineStatus.show{display:block}
.compactCard{border-color:rgba(246,196,83,.18)}
.warnBox{border-color:rgba(249,115,22,.28)!important;background:rgba(249,115,22,.08)!important;color:#fed7aa!important}
.okBox{border-color:rgba(74,222,128,.24)!important;background:rgba(74,222,128,.07)!important;color:#bbf7d0!important}
.qaStatusPanel{display:grid;gap:8px;margin-top:10px}
.qaScore{display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:16px;padding:12px;background:rgba(255,255,255,.04)}
.qaScore b{font-size:22px;color:#ffe29a}.qaScore span{color:var(--muted);font-size:13px}
.qaScore.pass{border-color:rgba(74,222,128,.24);background:rgba(74,222,128,.06)}
.qaScore.warn{border-color:rgba(249,115,22,.24);background:rgba(249,115,22,.06)}
.qaLine{display:grid;grid-template-columns:66px 1fr;gap:6px;align-items:center;border:1px solid var(--line);border-radius:13px;padding:9px 10px;background:rgba(255,255,255,.025)}
.qaLine b{font-size:11px;border-radius:999px;padding:4px 7px;text-align:center}
.qaLine.pass b{background:rgba(74,222,128,.16);color:#bbf7d0}
.qaLine.fail b{background:rgba(249,115,22,.16);color:#fed7aa}
.qaLine span{font-weight:800;font-size:13px}.qaLine small{grid-column:2;color:var(--muted);font-size:11px}


/* v0.7.0 global product foundation */
.roadmapItem{border:1px solid var(--line);border-radius:18px;padding:14px;margin:10px 0;background:rgba(255,255,255,.035)}
.roadmapItem .roadHead{display:flex;justify-content:space-between;gap:10px;align-items:center}
.roadmapItem .roadHead b{font-size:14px;color:var(--text)}
.roadmapItem .roadHead span{font-size:10px;font-weight:950;border-radius:999px;padding:5px 8px;background:rgba(255,255,255,.08);color:#d7e2ee}
.roadmapItem p{color:#c7d4e2;font-size:13px;line-height:1.45;margin:8px 0}
.roadmapItem small{display:block;color:#ffe29a;font-weight:900;margin-bottom:8px}
.roadmapItem ul{margin:8px 0 0;padding-left:18px;color:var(--muted);font-size:12px;line-height:1.55}
.roadProgress{border-color:rgba(246,196,83,.3);background:rgba(246,196,83,.07)}
.roadNext{border-color:rgba(56,189,248,.22);background:rgba(56,189,248,.055)}
.roadDeferred{opacity:.82}
.roadDone{border-color:rgba(74,222,128,.24);background:rgba(74,222,128,.06)}
.milestoneHero{display:flex;gap:12px;align-items:flex-start;border:1px solid rgba(246,196,83,.22);background:rgba(246,196,83,.07);border-radius:18px;padding:15px;margin-bottom:12px}
.milestoneHero>span{width:44px;height:44px;display:grid;place-items:center;border-radius:15px;background:var(--accent);color:#111827;font-weight:950}
.milestoneHero h3{margin:0;color:var(--text);font-size:18px}.milestoneHero p{margin:5px 0 0;color:#c7d4e2;font-size:13px;line-height:1.45}
.gateLine{display:grid;grid-template-columns:88px 1fr 130px;gap:8px;align-items:center;border:1px solid var(--line);border-radius:14px;padding:10px;margin:8px 0;background:rgba(255,255,255,.025)}
.gateLine span{font-size:10px;font-weight:950;border-radius:999px;padding:5px 7px;text-align:center;background:rgba(255,255,255,.08);color:#d7e2ee}
.gateLine b{font-size:13px;color:#d7e2ee}.gateLine select{border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--text);border-radius:10px;padding:8px}
.gateLine.pass{border-color:rgba(74,222,128,.22);background:rgba(74,222,128,.05)}.gateLine.pass span{background:rgba(74,222,128,.16);color:#bbf7d0}
.gateLine.fail{border-color:rgba(251,113,133,.24);background:rgba(251,113,133,.055)}.gateLine.fail span{background:rgba(251,113,133,.16);color:#fecdd3}
.gateLine.blocked{border-color:rgba(249,115,22,.24);background:rgba(249,115,22,.055)}.gateLine.blocked span{background:rgba(249,115,22,.16);color:#fed7aa}
.buildQueueItem{display:grid;grid-template-columns:36px 1fr;gap:10px;border:1px solid var(--line);border-radius:16px;padding:12px;margin:9px 0;background:rgba(255,255,255,.03)}
.buildQueueItem>span{width:28px;height:28px;display:grid;place-items:center;border-radius:10px;background:rgba(246,196,83,.12);color:#ffe29a;font-weight:950}
.buildQueueItem b{display:block;color:var(--text);font-size:13px}.buildQueueItem p{margin:4px 0 0;color:var(--muted);font-size:12px;line-height:1.45}
@media(max-width:560px){.gateLine{grid-template-columns:1fr}.gateLine select{width:100%}}


/* v0.7.2 UI/text cleanup + manual QA support */
.nav{width:min(96vw,620px)}
.nav button{font-size:10px}
.nav span{font-size:17px}
.qaSessionHead{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0 12px}
.qaSessionHead div{border:1px solid var(--line);border-radius:15px;background:rgba(255,255,255,.035);padding:10px;text-align:center}
.qaSessionHead b{display:block;color:#ffe29a;font-size:18px}.qaSessionHead span{font-size:10px;color:var(--muted);text-transform:uppercase;font-weight:900}
.manualQaItem{border:1px solid var(--line);border-radius:17px;background:rgba(255,255,255,.028);padding:12px;margin:10px 0}
.manualQaItem.pass{border-color:rgba(74,222,128,.25);background:rgba(74,222,128,.055)}
.manualQaItem.fail{border-color:rgba(251,113,133,.26);background:rgba(251,113,133,.055)}
.manualQaItem.blocked{border-color:rgba(249,115,22,.26);background:rgba(249,115,22,.055)}
.manualQaTop{display:grid;grid-template-columns:1fr 135px;gap:10px;align-items:center}
.manualQaTop b{font-size:14px;color:var(--text)}.manualQaTop select{border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--text);border-radius:11px;padding:8px}
.manualQaItem ol{margin:10px 0 10px;padding-left:22px;color:#c7d4e2;font-size:12px;line-height:1.55}
.manualQaItem textarea{width:100%;min-height:58px;border:1px solid var(--line);background:rgba(255,255,255,.035);color:var(--text);border-radius:13px;padding:10px;resize:vertical;font:inherit;font-size:12px}
@media(max-width:560px){
  .nav{width:96vw;grid-template-columns:repeat(6,1fr);gap:4px;padding:6px}
  .nav button{font-size:9px;padding:8px 2px;border-radius:14px}
  .nav span{font-size:15px}
  .qaSessionHead{grid-template-columns:repeat(2,1fr)}
  .manualQaTop{grid-template-columns:1fr}
}


/* v0.8.0 Workout Engine Pro */
.workoutSheet{max-height:94vh;overflow:auto}
.workoutTitleBar{position:sticky;top:0;z-index:2;background:linear-gradient(180deg,rgba(12,22,34,.96),rgba(12,22,34,.78));backdrop-filter:blur(14px);padding-bottom:10px}
.workoutProgressHero{border:1px solid rgba(246,196,83,.18);background:rgba(246,196,83,.055);border-radius:18px;padding:12px;margin-bottom:12px}
.engineTopLine{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.engineTopLine div{border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.035);border-radius:14px;padding:10px;text-align:center}
.engineTopLine b{display:block;color:#ffe29a;font-size:18px}.engineTopLine span{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;font-weight:900;margin-top:2px}
.engineTopLine.compact{margin-top:10px}.engineTopLine.compact div{padding:8px}.engineTopLine.compact b{font-size:16px}
.engineProgress{height:8px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;margin:10px 0 5px}
.engineProgress span,.exerciseProgressLine span{display:block;height:100%;background:linear-gradient(90deg,#f6c453,#4ade80);border-radius:999px}
.engineMeta{color:#c7d4e2;font-size:12px;font-weight:800}
.timerBox{border:1px solid var(--line);background:rgba(255,255,255,.03);border-radius:20px;padding:12px;margin-bottom:12px;text-align:center}
.timerLabel{color:var(--muted);font-size:11px;text-transform:uppercase;font-weight:950;letter-spacing:.08em}
.timerControls{justify-content:center;margin-top:8px}.timerControls button{min-width:58px}
.focusTop.pro{display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:10px}
.focusTop.pro span{width:36px;height:36px;display:grid;place-items:center;border-radius:13px;background:rgba(246,196,83,.14);color:#ffe29a;font-weight:950}
.focusTop.pro b{display:block;color:var(--text);font-size:17px}.focusTop.pro small{display:block;color:var(--muted);font-size:12px;margin-top:2px}.focusTop.pro em{font-style:normal;color:#ffe29a;font-weight:950}
.exerciseProgressLine{height:7px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;margin:12px 0}
.proInputs{grid-template-columns:1fr 1fr auto}
.stepInput{display:grid;grid-template-columns:36px 1fr 36px;gap:5px}.stepInput button{border:1px solid var(--line);background:rgba(255,255,255,.04);color:#ffe29a;border-radius:11px;font-weight:950}
.saveSetBtn.done{background:rgba(74,222,128,.18);color:#bbf7d0;border-color:rgba(74,222,128,.3)}
.proSwap{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.proSwap select{flex:1;min-width:180px}
.proNav{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.proNav button{min-width:0}
.workoutCompleteHero{text-align:center;border-color:rgba(74,222,128,.28);background:rgba(74,222,128,.055)}
.completeIcon{width:56px;height:56px;border-radius:20px;background:rgba(74,222,128,.18);color:#bbf7d0;display:grid;place-items:center;font-weight:950;font-size:28px;margin:0 auto 10px}
.workoutCompleteHero h3{margin:0 0 6px;font-size:20px}.workoutCompleteHero p{color:var(--muted);font-size:13px;line-height:1.45;margin:0 0 12px}
.completionPreview{border:1px solid rgba(74,222,128,.24);background:rgba(74,222,128,.055);border-radius:18px;padding:12px;margin:12px 0}.completionPreview>b{color:#bbf7d0}
.miniExercise{border:1px solid var(--line);border-radius:16px;padding:10px;margin:10px 0;background:rgba(255,255,255,.025)}.miniExercise.skipped{opacity:.58}
.miniExerciseTop{display:flex;justify-content:space-between;gap:10px;margin-bottom:8px}.miniExerciseTop b{font-size:13px}.miniExerciseTop span{color:#ffe29a;font-size:12px;font-weight:950}
.miniSetRow{display:grid;grid-template-columns:54px 1fr 1fr 58px;gap:6px;align-items:center;margin:6px 0}.miniSetRow span{color:var(--muted);font-size:11px;font-weight:900}.miniSetRow.done{background:rgba(74,222,128,.045);border-radius:12px}
.proSummary{border-color:rgba(246,196,83,.16)}
@media(max-width:560px){
  .engineTopLine{grid-template-columns:repeat(3,1fr);gap:5px}.engineTopLine div{padding:8px 4px}.engineTopLine b{font-size:15px}.engineTopLine span{font-size:8px}
  .proInputs{grid-template-columns:1fr}.proNav{grid-template-columns:repeat(2,1fr)}
  .focusTop.pro{grid-template-columns:34px 1fr}.focusTop.pro em{grid-column:2}
  .miniSetRow{grid-template-columns:44px 1fr 1fr 48px}
}


/* v0.9.0 Progress Intelligence */
.nextWorkoutHeader{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;border:1px solid var(--line);border-radius:16px;padding:12px;margin-bottom:10px;background:rgba(246,196,83,.06)}
.nextWorkoutHeader b{color:var(--text)}.nextWorkoutHeader span{color:#ffe29a;font-size:11px;font-weight:900;text-transform:uppercase}
.intelligenceCard{display:grid;grid-template-columns:1fr 115px;gap:12px;border:1px solid var(--line);border-radius:16px;padding:12px;margin:9px 0;background:rgba(255,255,255,.028)}
.intelligenceCard b{display:block;color:var(--text);font-size:14px}.intelligenceCard small{display:block;color:var(--muted);font-size:11px;margin-top:4px}
.intelligenceCard strong{display:block;color:#ffe29a;font-size:20px;text-align:right}.intelligenceCard span{display:block;color:#c7d4e2;font-size:11px;text-align:right;font-weight:900}.intelligenceCard em{display:block;color:var(--muted);font-size:10px;text-align:right;font-style:normal;margin-top:3px}
.intelligenceCard.increase{border-color:rgba(74,222,128,.25);background:rgba(74,222,128,.055)}
.intelligenceCard.deload{border-color:rgba(251,113,133,.26);background:rgba(251,113,133,.055)}
.intelligenceCard.repeat{border-color:rgba(246,196,83,.24);background:rgba(246,196,83,.045)}
.weeklyReviewGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
.weeklyReviewGrid div{border:1px solid var(--line);border-radius:15px;background:rgba(255,255,255,.035);padding:12px;text-align:center}
.weeklyReviewGrid b{display:block;color:#ffe29a;font-size:20px}.weeklyReviewGrid span{font-size:10px;color:var(--muted);font-weight:900;text-transform:uppercase}
.weeklyReviewGrid .good b{color:#86efac}.weeklyReviewGrid .warn b{color:#fda4af}
.consistencyBar{height:10px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden;margin:8px 0 12px}.consistencyBar span{display:block;height:100%;background:linear-gradient(90deg,#f6c453,#4ade80);border-radius:inherit}
.progressHint{color:#c7d4e2;font-size:13px;line-height:1.45;margin:0}
.insight{border:1px solid var(--line);border-radius:16px;padding:12px;margin:9px 0;background:rgba(255,255,255,.03)}
.insight b{display:block;color:var(--text);font-size:14px}.insight p{color:var(--muted);font-size:12px;line-height:1.45;margin:5px 0 0}
.insight.good{border-color:rgba(74,222,128,.25);background:rgba(74,222,128,.055)}
.insight.warn{border-color:rgba(249,115,22,.26);background:rgba(249,115,22,.055)}
@media(max-width:560px){.intelligenceCard{grid-template-columns:1fr}.intelligenceCard strong,.intelligenceCard span,.intelligenceCard em{text-align:left}.weeklyReviewGrid{grid-template-columns:repeat(2,1fr)}}


/* v1.0.0 Final Local Release */
.finalReleaseCard{border-color:rgba(74,222,128,.28);background:linear-gradient(135deg,rgba(74,222,128,.08),rgba(246,196,83,.045));}
.finalReleaseCard h2{color:#bbf7d0}


/* v1.0.1 Verification hardening */
.verificationStatusPanel{display:grid;gap:8px}
.verifyLine{display:grid;grid-template-columns:110px 1fr;gap:10px;align-items:center;border:1px solid var(--line);border-radius:14px;padding:10px;background:rgba(255,255,255,.028)}
.verifyLine b{font-size:10px;border-radius:999px;padding:5px 7px;text-align:center;background:rgba(255,255,255,.08);color:#d7e2ee}
.verifyLine.pass{border-color:rgba(74,222,128,.24);background:rgba(74,222,128,.055)}.verifyLine.pass b{background:rgba(74,222,128,.16);color:#bbf7d0}
.verifyLine.pending{border-color:rgba(246,196,83,.24);background:rgba(246,196,83,.055)}.verifyLine.pending b{background:rgba(246,196,83,.16);color:#ffe29a}
.verifyLine.not-tested,.verifyLine.deferred{opacity:.82}
.verifyLine span{color:#c7d4e2;font-size:13px;font-weight:800}
