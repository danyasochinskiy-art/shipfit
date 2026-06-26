
// ═══════════════════════════════════════════════════════════════
// VERSION / ACCOUNTS / STORAGE / SUPABASE
// ═══════════════════════════════════════════════════════════════
const APP_VERSION = "1.1.0-supabase-prep";
if(typeof window !== "undefined") window.SHIPFIT_VERSION = APP_VERSION;
const DEFAULT_PROFILE = "daniil";
const PROFILE_DEFAULTS = {
  daniil: { name:"Daniil", lang:"ru" },
  second: { name:"Second account", lang:"en" }
};
const GLOBAL_STORAGE_KEYS = new Set(["shipfitProfile","shipfitProfileName","shipfitSupabaseConfig","shipfitSupabaseUserId","shipfitSupabaseEmail","shipfitLastEmail","shipfitPendingCloudProfile","shipfitDeviceId","shipfitLastCloudSyncAt","shipfitLastCloudPullAt"]);

function rawGet(k){ return window.localStorage.getItem(k); }
function rawSet(k,v){ window.localStorage.setItem(k,v); }
function rawRemove(k){ window.localStorage.removeItem(k); }

// One-time migration: the first local profile was previously named Roman.
// Keep already saved history by moving the namespace to Daniil.
(function migrateRomanToDaniil(){
  try{
    if(rawGet("shipfitProfile")==="roman") rawSet("shipfitProfile","daniil");
    if(rawGet("shipfitProfileName")==="Roman") rawSet("shipfitProfileName","Daniil");
    const oldPrefix="shipfit:roman:";
    const newPrefix="shipfit:daniil:";
    const keys=[];
    for(let i=0;i<window.localStorage.length;i++){
      const k=window.localStorage.key(i);
      if(k && k.startsWith(oldPrefix)) keys.push(k);
    }
    keys.forEach(k=>{
      const nk=newPrefix+k.slice(oldPrefix.length);
      if(rawGet(nk)===null) rawSet(nk,rawGet(k));
    });
  }catch(e){ console.warn("Profile migration skipped",e); }
})();

function currentProfileId(){ return rawGet("shipfitProfile") || DEFAULT_PROFILE; }
function currentProfileName(){ return rawGet("shipfitProfileName") || PROFILE_DEFAULTS[currentProfileId()]?.name || currentProfileId(); }
function nsKey(k){ return GLOBAL_STORAGE_KEYS.has(k) ? k : `shipfit:${currentProfileId()}:${k}`; }
const LS = {
  get(k){ return rawGet(nsKey(k)); },
  set(k,v){ rawSet(nsKey(k),v); },
  remove(k){ rawRemove(nsKey(k)); },
  keys(){
    const prefix = `shipfit:${currentProfileId()}:`;
    const out=[];
    for(let i=0;i<window.localStorage.length;i++){
      const k=window.localStorage.key(i);
      if(k && k.startsWith(prefix)) out.push(k.slice(prefix.length));
    }
    return out;
  }
};

function knownProfileId(id){
  return !!PROFILE_DEFAULTS[id];
}
function cloudProfileId(){
  const id = currentProfileId();
  return knownProfileId(id) ? id : DEFAULT_PROFILE;
}
function ensureActiveProfile(){
  let id = rawGet("shipfitProfile");
  if(!knownProfileId(id)){
    id = rawGet("shipfitPendingCloudProfile") || DEFAULT_PROFILE;
    if(!knownProfileId(id)) id = DEFAULT_PROFILE;
    rawSet("shipfitProfile", id);
    rawSet("shipfitProfileName", PROFILE_DEFAULTS[id]?.name || id);
  }
  ensureProfileLanguage(id);
  return id;
}
function getDeviceId(){
  let id = rawGet("shipfitDeviceId");
  if(!id){
    id = `device_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
    rawSet("shipfitDeviceId", id);
  }
  return id;
}
function rememberSupabaseUser(user){
  if(!user) return;
  rawSet("shipfitSupabaseUserId", user.id || "");
  rawSet("shipfitSupabaseEmail", user.email || "");
}
function clearSupabaseUser(){
  rawRemove("shipfitSupabaseUserId");
  rawRemove("shipfitSupabaseEmail");
}
function supabaseLibraryLoaded(){
  return !!(window.supabase && typeof window.supabase.createClient === "function");
}
function supabaseConfigReady(){
  const cfg = getSupabaseConfig();
  return !!(cfg.url && cfg.anonKey);
}

const DEFAULT_SUPABASE_CONFIG = { url:"", anonKey:"", table:"shipfit_user_history" };
function getSupabaseConfig(){
  try { return {...DEFAULT_SUPABASE_CONFIG, ...JSON.parse(rawGet("shipfitSupabaseConfig")||"{}")} } catch { return DEFAULT_SUPABASE_CONFIG; }
}
let supabaseClient = null;
function initSupabaseClient(){
  const cfg = getSupabaseConfig();
  if(!cfg.url || !cfg.anonKey || !supabaseLibraryLoaded()) return null;
  if(!supabaseClient){
    supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "shipfit_supabase_session"
      }
    });
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if(session?.user){
        rememberSupabaseUser(session.user);
        ensureActiveProfile();
        showLoginState();
        renderCloudStatus();
        if(event === "SIGNED_IN" || event === "TOKEN_REFRESHED"){
          await pullFromCloud(true);
          renderAll();
        }
      }else if(event === "SIGNED_OUT"){
        clearSupabaseUser();
        renderCloudStatus();
      }
    });
  }
  return supabaseClient;
}
function t2(ru,en){ return isEn() ? en : ru; }
function todayIso(){ return isoDate(getToday()); }

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════
const SCHEDULE = [
  {port:"Salvador",terminal:"Salvador Tecon",arrival:"2026-06-29T18:30:00",departure:"2026-06-30T07:30:00"},
  {port:"Santos",terminal:"Santos Brasil Terminal",arrival:"2026-07-03T19:00:00",departure:"2026-07-04T19:00:00"},
  {port:"Itapoa",terminal:"Itapoa Terminais",arrival:"2026-07-06T00:01:00",departure:"2026-07-07T06:00:00"},
  {port:"Itajai",terminal:"JBS Terminais Itajai",arrival:"2026-07-07T22:00:00",departure:"2026-07-08T08:00:00"},
  {port:"Paranagua",terminal:"TCP Paranagua",arrival:"2026-07-09T07:00:00",departure:"2026-07-10T09:00:00"},
  {port:"Santos",terminal:"Brasil Terminal Portuario",arrival:"2026-07-11T07:00:00",departure:"2026-07-12T07:00:00"},
  {port:"Port Tangier Med",terminal:"Port Tangier Mediterranee",arrival:"2026-07-27T00:01:00",departure:"2026-07-27T19:00:00"},
  {port:"Algeciras",terminal:"Algeciras - ML Terminal",arrival:"2026-07-28T08:00:00",departure:"2026-07-29T06:00:00"},
  {port:"Algeciras",terminal:"TTI Algeciras",arrival:"2026-07-29T14:00:00",departure:"2026-07-30T02:00:00"},
  {port:"Port Tangier Med",terminal:"Eurogate Tanger Terminal",arrival:"2026-07-30T19:00:00",departure:"2026-07-31T07:00:00"},
  {port:"Port Tangier Med",terminal:"Tanger Med 2",arrival:"2026-08-01T03:00:00",departure:"2026-08-01T23:00:00"},
  {port:"Salvador",terminal:"Salvador Tecon",arrival:"2026-08-10T20:00:00",departure:"2026-08-11T09:00:00"},
  {port:"Santos",terminal:"Santos Brasil Terminal",arrival:"2026-08-14T19:00:00",departure:"2026-08-15T19:00:00"},
  {port:"Itapoa",terminal:"Itapoa Terminais",arrival:"2026-08-17T00:01:00",departure:"2026-08-18T06:00:00"},
  {port:"Itajai",terminal:"JBS Terminais Itajai",arrival:"2026-08-18T22:00:00",departure:"2026-08-19T08:00:00"},
  {port:"Paranagua",terminal:"TCP Paranagua",arrival:"2026-08-20T07:00:00",departure:"2026-08-21T09:00:00"},
  {port:"Santos",terminal:"Brasil Terminal Portuario",arrival:"2026-08-22T07:00:00",departure:"2026-08-23T07:00:00"},
  {port:"Port Tangier Med",terminal:"Port Tangier Mediterranee",arrival:"2026-09-07T00:01:00",departure:"2026-09-07T19:00:00"},
  {port:"Algeciras",terminal:"Algeciras - ML Terminal",arrival:"2026-09-08T08:00:00",departure:"2026-09-09T06:00:00"},
  {port:"Algeciras",terminal:"TTI Algeciras",arrival:"2026-09-09T14:00:00",departure:"2026-09-10T02:00:00"},
  {port:"Port Tangier Med",terminal:"Eurogate Tanger Terminal",arrival:"2026-09-10T19:00:00",departure:"2026-09-11T07:00:00"},
  {port:"Port Tangier Med",terminal:"Tanger Med 2",arrival:"2026-09-12T03:00:00",departure:"2026-09-12T23:00:00"},
  {port:"Salvador",terminal:"Salvador Tecon",arrival:"2026-09-21T20:00:00",departure:"2026-09-22T09:00:00"},
  {port:"Santos",terminal:"Santos Brasil Terminal",arrival:"2026-09-25T19:00:00",departure:"2026-09-26T19:00:00"},
  {port:"Itapoa",terminal:"Itapoa Terminais",arrival:"2026-09-28T00:01:00",departure:"2026-09-29T06:00:00"},
  {port:"Itajai",terminal:"JBS Terminais Itajai",arrival:"2026-09-29T22:00:00",departure:"2026-09-30T08:00:00"},
  {port:"Paranagua",terminal:"TCP Paranagua",arrival:"2026-10-01T07:00:00",departure:"2026-10-02T09:00:00"}
];

const WORKOUTS = {
  UPPER_A:{title:"Верх A",subtitle:"Грудь + спина + плечи",level:"Heavy",duration:65,focus:"Масса верхней части тела",exercises:[
    {name:"Жим гантелей лёжа",en:"Dumbbell bench press",sets:"4",reps:"8–12",muscles:"Грудь, трицепс, передняя дельта",equipment:"Гантели + скамья",how:"Ляг на скамью, гантели над грудью. Опускай локти под 45°, контролируй движение и жми вверх.",mistake:"Не разводи локти слишком широко и не прогибай поясницу."},
    {name:"Тяга верхнего блока к груди",en:"Lat pulldown",sets:"4",reps:"8–12",muscles:"Широчайшие, бицепс",equipment:"Верхний блок",how:"Сядь ровно, потяни рукоять к верхней части груди. Локти идут вниз, корпус не раскачивается.",mistake:"Не тяни за шею и не дёргай вес."},
    {name:"Тяга сидя на блоке",en:"Seated cable row",sets:"3",reps:"10–12",muscles:"Спина, задняя дельта",equipment:"Нижний блок",how:"Спина ровная. Тяни рукоять к животу, своди лопатки назад.",mistake:"Не округляй спину и не работай поясницей."},
    {name:"Жим гантелей сидя",en:"Seated dumbbell shoulder press",sets:"3",reps:"8–10",muscles:"Плечи, трицепс",equipment:"Гантели + скамья",how:"Сядь, гантели у плеч. Жми вверх без сильного прогиба в пояснице.",mistake:"Не бей гантели вверху и не выгибайся."},
    {name:"Разведения гантелей в стороны",en:"Dumbbell lateral raise",sets:"3",reps:"12–20",muscles:"Средняя дельта",equipment:"Гантели",how:"Лёгкий вес. Поднимай руки до уровня плеч, локоть немного согнут.",mistake:"Не раскачивай корпус."},
    {name:"Трицепс на блоке",en:"Cable triceps pushdown",sets:"3",reps:"10–15",muscles:"Трицепс",equipment:"Блок",how:"Локти прижаты к корпусу. Разгибай руки вниз, плечи не двигаются.",mistake:"Не наклоняйся всем телом на рукоять."},
    {name:"Бицепс с гантелями",en:"Dumbbell curl",sets:"3",reps:"10–15",muscles:"Бицепс",equipment:"Гантели",how:"Локти рядом с корпусом. Поднимай гантели без рывка.",mistake:"Не раскачивай спину."}
  ]},
  LOWER_A:{title:"Низ A",subtitle:"Ноги + задняя цепь",level:"Heavy",duration:65,focus:"Ноги, ягодицы, корпус",exercises:[
    {name:"Goblet squat",en:"Goblet squat",sets:"4",reps:"8–12",muscles:"Квадрицепс, ягодицы",equipment:"1 гантель",how:"Держи гантель у груди. Садись вниз, колени идут по направлению носков, спина ровная.",mistake:"Не заваливай колени внутрь."},
    {name:"Румынская тяга с гантелями",en:"Dumbbell Romanian deadlift",sets:"4",reps:"8–12",muscles:"Задняя поверхность бедра, ягодицы, спина",equipment:"Гантели",how:"Гантели у бёдер. Отводи таз назад, спина ровная, чувствуешь растяжение задней поверхности бедра.",mistake:"Не округляй спину."},
    {name:"Болгарские выпады",en:"Bulgarian split squat",sets:"3",reps:"8–10/нога",muscles:"Квадрицепс, ягодицы",equipment:"Гантели + скамья",how:"Задняя нога на скамье. Опускайся медленно, передняя стопа уверенно стоит на полу.",mistake:"Не падай вперёд и не заваливай колено."},
    {name:"Разгибание ног",en:"Leg extension",sets:"3",reps:"12–15",muscles:"Квадрицепс",equipment:"Тренажёр",how:"Разгибай ноги вверх, наверху пауза 1 секунда.",mistake:"Не бросай вес вниз."},
    {name:"Сгибание ног",en:"Leg curl",sets:"3",reps:"12–15",muscles:"Задняя поверхность бедра",equipment:"Тренажёр",how:"Сгибай ноги медленно, чувствуй заднюю поверхность бедра.",mistake:"Не дёргай вес."},
    {name:"Икры с гантелями",en:"Standing calf raise",sets:"4",reps:"12–20",muscles:"Икры",equipment:"Гантели",how:"Поднимайся на носки, наверху пауза.",mistake:"Не пружинь слишком быстро."},
    {name:"Планка",en:"Plank",sets:"3",reps:"30–60 сек",muscles:"Корпус",equipment:"Коврик",how:"Корпус ровный, живот напряжён.",mistake:"Не проваливай поясницу."}
  ]},
  UPPER_B:{title:"Верх B",subtitle:"Объём + руки",level:"Medium",duration:55,focus:"Спина, грудь, руки",exercises:[
    {name:"Наклонный жим гантелей",en:"Incline dumbbell press",sets:"4",reps:"8–12",muscles:"Верх груди, плечи, трицепс",equipment:"Гантели + скамья",how:"Скамья под углом. Жми гантели вверх, контролируй опускание.",mistake:"Не поднимай плечи к ушам."},
    {name:"Тяга одной гантели в наклоне",en:"One-arm dumbbell row",sets:"4",reps:"8–12/рука",muscles:"Спина, широчайшие",equipment:"Гантель + скамья",how:"Одна рука на скамье. Тяни гантель к тазу, лопатка назад.",mistake:"Не крути корпусом."},
    {name:"Тяга верхнего блока узким хватом",en:"Close-grip lat pulldown",sets:"3",reps:"10–12",muscles:"Спина, бицепс",equipment:"Верхний блок",how:"Тяни рукоять к груди, локти вниз и назад.",mistake:"Не раскачивай корпус."},
    {name:"Разводка на грудь",en:"Dumbbell fly",sets:"3",reps:"12–15",muscles:"Грудь",equipment:"Гантели",how:"Руки чуть согнуты. Разводи гантели до комфортного растяжения груди.",mistake:"Не опускай слишком глубоко, если тянет плечо."},
    {name:"Face pull на блоке",en:"Cable face pull",sets:"3",reps:"15–20",muscles:"Задняя дельта, верх спины",equipment:"Канат + блок",how:"Тяни канат к лицу, локти высоко.",mistake:"Не тяни вниз к груди."},
    {name:"Молотковые сгибания",en:"Hammer curl",sets:"3",reps:"10–12",muscles:"Бицепс, предплечья",equipment:"Гантели",how:"Гантели вертикально, как молоток. Поднимай без раскачки.",mistake:"Не уводи локти вперёд."},
    {name:"Трицепс над головой",en:"Overhead triceps extension",sets:"3",reps:"12–15",muscles:"Трицепс",equipment:"Гантель или блок",how:"Руки над головой, разгибай локти контролируемо.",mistake:"Не выгибай поясницу."}
  ]},
  LOWER_B:{title:"Низ B",subtitle:"Ноги + корпус",level:"Medium",duration:55,focus:"Ноги без штанги",exercises:[
    {name:"Румынская тяга с гантелями",en:"Dumbbell Romanian deadlift",sets:"4",reps:"8–10",muscles:"Задняя поверхность бедра, ягодицы",equipment:"Гантели",how:"Таз назад, спина ровная, гантели идут вдоль ног.",mistake:"Не округляй спину."},
    {name:"Выпады назад",en:"Reverse lunge",sets:"3",reps:"10/нога",muscles:"Ноги, ягодицы",equipment:"Гантели",how:"Шаг назад, опускайся контролируемо. Основная нагрузка на передней ноге.",mistake:"Не заваливай корпус."},
    {name:"Медленный goblet squat",en:"Tempo goblet squat",sets:"3",reps:"12",muscles:"Квадрицепс, ягодицы",equipment:"1 гантель",how:"3 секунды вниз, 1 секунда пауза, затем вверх.",mistake:"Не теряй контроль внизу."},
    {name:"Cable pull-through",en:"Cable pull-through",sets:"3",reps:"12–15",muscles:"Ягодицы, задняя поверхность бедра",equipment:"Нижний блок + канат",how:"Канат между ног. Отводи таз назад и выпрямляйся ягодицами.",mistake:"Не превращай движение в присед."},
    {name:"Разгибание ног",en:"Leg extension",sets:"3",reps:"15",muscles:"Квадрицепс",equipment:"Тренажёр",how:"Контроль и пауза наверху.",mistake:"Не делай рывком."},
    {name:"Икры",en:"Calf raise",sets:"4",reps:"15–20",muscles:"Икры",equipment:"Гантели",how:"Полная амплитуда, наверху пауза.",mistake:"Не подпрыгивай."},
    {name:"Боковая планка",en:"Side plank",sets:"3",reps:"30 сек/сторона",muscles:"Корпус",equipment:"Коврик",how:"Корпус в одну линию, таз не падает.",mistake:"Не заваливай плечо."}
  ]},
  PORT:{title:"Port Pump",subtitle:"Короткий памп",level:"Light",duration:28,focus:"Тонус без перегруза",exercises:[
    {name:"Вело или дорожка",en:"Easy bike/walk",sets:"1",reps:"5 мин",muscles:"Разминка",equipment:"Кардио",how:"Лёгкий темп, просто разогреться.",mistake:"Не превращай в тяжёлое кардио."},
    {name:"Жим гантелей или тренажёр",en:"Dumbbell/machine press",sets:"2",reps:"12–15",muscles:"Грудь, трицепс",equipment:"Гантели/тренажёр",how:"Лёгко-средний вес, не до отказа.",mistake:"Не работай через усталость после вахты."},
    {name:"Тяга блока",en:"Cable row/pulldown",sets:"2",reps:"12–15",muscles:"Спина",equipment:"Блок",how:"Спина ровная, без рывков.",mistake:"Не дёргай вес."},
    {name:"Разведения плеч",en:"Lateral raise",sets:"2",reps:"15–20",muscles:"Плечи",equipment:"Гантели",how:"Плавно, лёгкий вес.",mistake:"Не раскачивайся."},
    {name:"Бицепс + трицепс",en:"Arms superset",sets:"2",reps:"12–15",muscles:"Руки",equipment:"Гантели/блок",how:"Сделай бицепс, затем трицепс, отдых 45–60 сек.",mistake:"Не гонись за весом."}
  ]},
  MEDIUM:{title:"Full body",subtitle:"Средняя тренировка",level:"Medium",duration:40,focus:"Всё тело без перегруза",exercises:[
    {name:"Жим гантелей",en:"Dumbbell press",sets:"3",reps:"10",muscles:"Грудь",equipment:"Гантели",how:"Рабочий, но не максимальный вес.",mistake:"Не делай до отказа."},
    {name:"Тяга верхнего блока",en:"Lat pulldown",sets:"3",reps:"10",muscles:"Спина",equipment:"Верхний блок",how:"Контроль лопаток, локти вниз.",mistake:"Не раскачивайся."},
    {name:"Goblet squat",en:"Goblet squat",sets:"2",reps:"12",muscles:"Ноги",equipment:"1 гантель",how:"Лёгко-средний вес, техника чистая.",mistake:"Не убивай ноги перед портом."},
    {name:"Румынская тяга",en:"Romanian deadlift",sets:"2",reps:"12",muscles:"Задняя поверхность бедра",equipment:"Гантели",how:"Медленно и чисто.",mistake:"Не округляй спину."},
    {name:"Плечи в стороны",en:"Lateral raise",sets:"2",reps:"15",muscles:"Плечи",equipment:"Гантели",how:"Памп, лёгкий вес.",mistake:"Не дёргай."},
    {name:"Пресс",en:"Core",sets:"2",reps:"15",muscles:"Корпус",equipment:"Коврик",how:"Скручивания или планка.",mistake:"Не тяни шею."}
  ]},
  REST:{title:"Recovery",subtitle:"Восстановление",level:"Recovery",duration:12,focus:"Суставы, дыхание, сон",exercises:[
    {name:"Мобилити плеч и груди",en:"Shoulder & chest mobility",sets:"1",reps:"4 мин",muscles:"Плечи, грудь",equipment:"Без оборудования",how:"Круги руками, поперечные растяжки, лёгкое открытие груди у стены. Дыши спокойно.",mistake:"Не дави через боль."},
    {name:"Мобилити бёдер и поясницы",en:"Hip & lower back mobility",sets:"1",reps:"4 мин",muscles:"Таз, поясница, задняя поверхность бедра",equipment:"Без оборудования",how:"Голубь, сгибатели бедра, кошка-корова. Медленно, с дыханием.",mistake:"Не пружинь резко в конечных точках."},
    {name:"Дыхание и расслабление",en:"Breathing & recovery",sets:"1",reps:"4 мин",muscles:"Диафрагма, нервная система",equipment:"Без оборудования",how:"4 сек вдох — 7 сек задержка — 8 сек выдох. Лёжа или сидя. 5–6 циклов.",mistake:"Не спеши."}
  ]}
};

const START = new Date("2026-06-22T00:00:00");
const END = new Date("2026-10-15T23:59:59");
// 4-workout sequence (index into SEQ)
const SEQ = ["UPPER_A","LOWER_A","UPPER_B","LOWER_B"];

// ═══════════════════════════════════════════════════════════════
// LANGUAGE / I18N
// ═══════════════════════════════════════════════════════════════
const I18N = {
  "Сегодня": "Today",
  "Календарь": "Calendar",
  "Зал": "Gym",
  "Прогресс": "Progress",
  "Настройки": "Settings",
  "Эта неделя": "This week",
  "Нажми на день для деталей и переноса.": "Tap a day for details and rescheduling.",
  "Тренировка сегодня": "Today's workout",
  "Упражнения и техника.": "Exercises and technique.",
  "Питание и добавки": "Nutrition and supplements",
  "Цель набора массы — 10k шагов у тебя есть.": "Mass-gain target — you already get ~10k steps.",
  "У тебя ~10k шагов/день. Кардио не нужно. Добавь углеводы: банан, йогурт, рис, творог.": "You already walk about 10k steps/day. No extra cardio needed. Add carbs: banana, yogurt, rice, cottage cheese.",
  "Протеин": "Protein",
  "Вода": "Water",
  "Креатин": "Creatine",
  "кг сейчас": "kg now",
  "цель кг": "target kg",
  "следующий порт": "next port",
  "вахта + 12–16": "watch + 12–16",
  "Voyage calendar": "Voyage calendar",
  "Тип дня, порты, переносы.": "Day type, ports and reschedules.",
  "Port calls": "Port calls",
  "Расписание Maersk Lamanai.": "Maersk Lamanai schedule.",
  "Workout mode": "Workout mode",
  "Подходы, отдых, таймер.": "Sets, rest and timer.",
  "Exercise library": "Exercise library",
  "Нажми для техники.": "Tap to view technique.",
  "Прогресс веса": "Bodyweight progress",
  "82 кг → цель 88 кг к 15 октября.": "82 kg → target 88 kg by 15 October.",
  "Вес сегодня, напр. 82.4": "Weight today, e.g. 82.4",
  "Сохранить": "Save",
  "Сила — топ сеты": "Strength — top sets",
  "Записывай лучшие подходы.": "Log your best sets.",
  "Пример: DB press 24kg × 10": "Example: DB press 24 kg × 10",
  "Добавить": "Add",
  "Compliance эта неделя": "This week's compliance",
  "Тренировки / пропуски / переносы.": "Workouts / skips / reschedules.",
  "Хранятся локально на телефоне.": "Stored locally on your phone.",
  "Начальный вес": "Starting weight",
  "Целевой вес": "Target weight",
  "Тренировок в неделю": "Workouts per week",
  "Очистить данные": "Clear data",
  "Добавки": "Supplements",
  "Не является медицинской рекомендацией.": "This is not medical advice.",
  "Принимать с едой, содержащей жиры.": "Take with a meal containing fats.",
  "1 порция согласно инструкции с едой.": "1 serving with food, according to the label.",
  "Каждый день, в том числе в дни отдыха.": "Every day, including rest days.",
  "Вечером. Прекратить при симптомах со стороны печени/щитовидки.": "Evening. Stop if liver/thyroid symptoms appear.",
  "Тренировка": "Workout",
  "Отмечай подходы.": "Tick off your sets.",
  "Закрыть": "Close",
  "90с отдых": "90s rest",
  "60с": "60s",
  "120с": "120s",
  "Завершить": "Finish",
  "Отмена": "Cancel",
  "Понедельник": "Monday",
  "Что делать сегодня?": "What should we do today?",
  "Выбери причину, чтобы обновить план.": "Choose a reason to update the plan.",
  "Очень устал": "Very tired",
  "Плохой сон": "Bad sleep",
  "Портовый день": "Port day",
  "Болят ноги": "Legs sore",
  "Перенести на завтра": "Move to tomorrow",
  "Пропустить": "Skip",
  "Готовность к тренировке": "Workout readiness",
  "4 быстрых вопроса": "4 quick questions",
  "В море": "At sea",
  "Порт:": "Port:",
  "Перед портом:": "Before port:",
  "После порта": "After port",
  "ТРЕНИРОВКА": "WORKOUT",
  "ОТДЫХ": "REST",
  "ОПЦИОНАЛЬНО": "OPTIONAL",
  "ПЕРЕНЕСЕНО": "MOVED",
  "ПРОПУЩЕНО": "SKIPPED",
  "Отдых": "Rest",
  "Опционально": "Optional",
  "Перенесено": "Moved",
  "Пропущено": "Skipped",
  "Recovery день": "Recovery day",
  "Сегодня отдых": "Rest today",
  "Сон, питание, мобилити.": "Sleep, food, mobility.",
  "Начать (опционально)": "Start (optional)",
  "Начать тренировку": "Start workout",
  "Устал": "Tired",
  "Перенести": "Move",
  "тренировки за неделю": "workouts this week",
  "Выполнено": "Done",
  "Цель": "Target",
  "День отдыха.": "Rest day.",
  "Адаптация": "Adaptation",
  "База": "Base",
  "Разгрузка": "Deload",
  "Набор массы": "Mass gain",
  "Финальный блок": "Final block",
  "Настройки сохранены": "Settings saved",
  "Данные очищены": "Data cleared",
  "Вес сохранён": "Weight saved",
  "Запись добавлена": "Entry added",
  "Записей нет.": "No entries yet.",
  "Отдых завершён!": "Rest finished!",
  "Ошибка": "Common mistake",
  "Верх A": "Upper A",
  "Низ A": "Lower A",
  "Верх B": "Upper B",
  "Низ B": "Lower B",
  "Грудь + спина + плечи": "Chest + back + shoulders",
  "Ноги + задняя цепь": "Legs + posterior chain",
  "Объём + руки": "Volume + arms",
  "Ноги + корпус": "Legs + core",
  "Средняя тренировка": "Medium workout",
  "Восстановление": "Recovery",
  "Короткий памп": "Short pump",
  "Масса верхней части тела": "Upper-body mass",
  "Ноги, ягодицы, корпус": "Legs, glutes, core",
  "Спина, грудь, руки": "Back, chest, arms",
  "Ноги без штанги": "Legs without barbell",
  "Всё тело без перегруза": "Full body without overload",
  "Суставы, дыхание, сон": "Joints, breathing, sleep",
  "Тонус без перегруза": "Tone without overload",
  "Жим гантелей лёжа": "Dumbbell bench press",
  "Тяга верхнего блока к груди": "Lat pulldown to chest",
  "Тяга сидя на блоке": "Seated cable row",
  "Жим гантелей сидя": "Seated dumbbell shoulder press",
  "Разведения гантелей в стороны": "Dumbbell lateral raise",
  "Трицепс на блоке": "Cable triceps pushdown",
  "Бицепс с гантелями": "Dumbbell curl",
  "Румынская тяга с гантелями": "Dumbbell Romanian deadlift",
  "Болгарские выпады": "Bulgarian split squat",
  "Разгибание ног": "Leg extension",
  "Сгибание ног": "Leg curl",
  "Икры с гантелями": "Standing calf raise",
  "Планка": "Plank",
  "Наклонный жим гантелей": "Incline dumbbell press",
  "Тяга одной гантели в наклоне": "One-arm dumbbell row",
  "Тяга верхнего блока узким хватом": "Close-grip lat pulldown",
  "Разводка на грудь": "Dumbbell fly",
  "Face pull на блоке": "Cable face pull",
  "Молотковые сгибания": "Hammer curl",
  "Трицепс над головой": "Overhead triceps extension",
  "Выпады назад": "Reverse lunge",
  "Медленный goblet squat": "Tempo goblet squat",
  "Икры": "Calves",
  "Боковая планка": "Side plank",
  "Вело или дорожка": "Easy bike / treadmill",
  "Жим гантелей или тренажёр": "Dumbbell or machine press",
  "Тяга блока": "Cable row / pulldown",
  "Разведения плеч": "Lateral raise",
  "Бицепс + трицепс": "Biceps + triceps",
  "Жим гантелей": "Dumbbell press",
  "Тяга верхнего блока": "Lat pulldown",
  "Румынская тяга": "Romanian deadlift",
  "Плечи в стороны": "Lateral raise",
  "Пресс": "Core",
  "Мобилити плеч и груди": "Shoulder and chest mobility",
  "Мобилити бёдер и поясницы": "Hip and lower-back mobility",
  "Дыхание и расслабление": "Breathing and relaxation",
  "Мышцы": "Muscles",
  "Оборудование": "Equipment",
  "Как делать": "How to do it",
  "Грудь, трицепс, передняя дельта": "Chest, triceps, front delts",
  "Широчайшие, бицепс": "Lats, biceps",
  "Спина, задняя дельта": "Back, rear delts",
  "Плечи, трицепс": "Shoulders, triceps",
  "Средняя дельта": "Side delts",
  "Трицепс": "Triceps",
  "Бицепс": "Biceps",
  "Квадрицепс, ягодицы": "Quads, glutes",
  "Задняя поверхность бедра, ягодицы, спина": "Hamstrings, glutes, back",
  "Задняя поверхность бедра": "Hamstrings",
  "Квадрицепс": "Quads",
  "Корпус": "Core",
  "Верх груди, плечи, трицепс": "Upper chest, shoulders, triceps",
  "Спина, широчайшие": "Back, lats",
  "Грудь": "Chest",
  "Задняя дельта, верх спины": "Rear delts, upper back",
  "Бицепс, предплечья": "Biceps, forearms",
  "Ноги, ягодицы": "Legs, glutes",
  "Ягодицы, задняя поверхность бедра": "Glutes, hamstrings",
  "Разминка": "Warm-up",
  "Плечи": "Shoulders",
  "Руки": "Arms",
  "Таз, поясница, задняя поверхность бедра": "Hips, lower back, hamstrings",
  "Диафрагма, нервная система": "Diaphragm, nervous system",
  "Гантели": "Dumbbells",
  "Гантели + скамья": "Dumbbells + bench",
  "Верхний блок": "Lat pulldown / high cable",
  "Нижний блок": "Low cable",
  "Блок": "Cable",
  "Тренажёр": "Machine",
  "1 гантель": "1 dumbbell",
  "Коврик": "Mat",
  "Гантель + скамья": "Dumbbell + bench",
  "Канат + блок": "Rope + cable",
  "Гантель или блок": "Dumbbell or cable",
  "Нижний блок + канат": "Low cable + rope",
  "Кардио": "Cardio",
  "Гантели/тренажёр": "Dumbbells / machine",
  "Гантели/блок": "Dumbbells / cable",
  "Без оборудования": "No equipment",
  "Ляг на скамью, гантели над грудью. Опускай локти под 45°, контролируй движение и жми вверх.": "Lie on the bench with dumbbells above your chest. Lower elbows at about 45°, control the movement, then press up.",
  "Не разводи локти слишком широко и не прогибай поясницу.": "Do not flare elbows too wide or overarch your lower back.",
  "Сядь ровно, потяни рукоять к верхней части груди. Локти идут вниз, корпус не раскачивается.": "Sit tall and pull the handle to the upper chest. Elbows move down, torso stays still.",
  "Не тяни за шею и не дёргай вес.": "Do not pull behind the neck and do not jerk the weight.",
  "Спина ровная. Тяни рукоять к животу, своди лопатки назад.": "Keep your back straight. Pull the handle to your stomach and squeeze shoulder blades back.",
  "Не округляй спину и не работай поясницей.": "Do not round your back or use your lower back to pull.",
  "Сядь, гантели у плеч. Жми вверх без сильного прогиба в пояснице.": "Sit down with dumbbells at shoulder level. Press up without excessive lower-back arch.",
  "Не бей гантели вверху и не выгибайся.": "Do not crash the dumbbells at the top or lean back.",
  "Лёгкий вес. Поднимай руки до уровня плеч, локоть немного согнут.": "Use light weight. Raise arms to shoulder level with elbows slightly bent.",
  "Не раскачивай корпус.": "Do not swing your torso.",
  "Локти прижаты к корпусу. Разгибай руки вниз, плечи не двигаются.": "Keep elbows close to your body. Extend arms down while shoulders stay still.",
  "Не наклоняйся всем телом на рукоять.": "Do not lean your whole body onto the handle.",
  "Локти рядом с корпусом. Поднимай гантели без рывка.": "Keep elbows near your torso. Curl dumbbells without jerking.",
  "Не раскачивай спину.": "Do not swing your back.",
  "Держи гантель у груди. Садись вниз, колени идут по направлению носков, спина ровная.": "Hold the dumbbell at your chest. Sit down, knees track toward toes, back stays straight.",
  "Не заваливай колени внутрь.": "Do not let knees cave inward.",
  "Гантели у бёдер. Отводи таз назад, спина ровная, чувствуешь растяжение задней поверхности бедра.": "Dumbbells by thighs. Push hips back, keep back straight, feel hamstring stretch.",
  "Не округляй спину.": "Do not round your back.",
  "Задняя нога на скамье. Опускайся медленно, передняя стопа уверенно стоит на полу.": "Back foot on bench. Lower slowly, front foot stable on the floor.",
  "Не падай вперёд и не заваливай колено.": "Do not fall forward or let the knee collapse.",
  "Разгибай ноги вверх, наверху пауза 1 секунда.": "Extend legs up and pause one second at the top.",
  "Не бросай вес вниз.": "Do not drop the weight down.",
  "Сгибай ноги медленно, чувствуй заднюю поверхность бедра.": "Curl legs slowly and feel the hamstrings.",
  "Не дёргай вес.": "Do not jerk the weight.",
  "Поднимайся на носки, наверху пауза.": "Rise onto your toes and pause at the top.",
  "Не пружинь слишком быстро.": "Do not bounce too fast.",
  "Корпус ровный, живот напряжён.": "Keep body straight and core tight.",
  "Не проваливай поясницу.": "Do not let your lower back sag.",
  "Скамья под углом. Жми гантели вверх, контролируй опускание.": "Set bench at an incline. Press dumbbells up and control the lowering.",
  "Не поднимай плечи к ушам.": "Do not shrug shoulders toward ears.",
  "Одна рука на скамье. Тяни гантель к тазу, лопатка назад.": "One hand on bench. Pull dumbbell toward your hip, shoulder blade back.",
  "Не крути корпусом.": "Do not rotate your torso.",
  "Тяни рукоять к груди, локти вниз и назад.": "Pull the handle to your chest, elbows down and back.",
  "Руки чуть согнуты. Разводи гантели до комфортного растяжения груди.": "Keep arms slightly bent. Open dumbbells until you feel a comfortable chest stretch.",
  "Не опускай слишком глубоко, если тянет плечо.": "Do not go too deep if your shoulder feels strained.",
  "Тяни канат к лицу, локти высоко.": "Pull the rope toward your face, elbows high.",
  "Не тяни вниз к груди.": "Do not pull down to your chest.",
  "Гантели вертикально, как молоток. Поднимай без раскачки.": "Keep dumbbells vertical like a hammer. Curl without swinging.",
  "Не уводи локти вперёд.": "Do not let elbows drift forward.",
  "Руки над головой, разгибай локти контролируемо.": "Hands overhead, extend elbows under control.",
  "Не выгибай поясницу.": "Do not overarch the lower back.",
  "Шаг назад, опускайся контролируемо. Основная нагрузка на передней ноге.": "Step back and lower under control. Main load stays on the front leg.",
  "Не заваливай корпус.": "Do not let your torso collapse.",
  "3 секунды вниз, 1 секунда пауза, затем вверх.": "3 seconds down, 1 second pause, then up.",
  "Не теряй контроль внизу.": "Do not lose control at the bottom.",
  "Канат между ног. Отводи таз назад и выпрямляйся ягодицами.": "Rope between legs. Push hips back, then extend with glutes.",
  "Не превращай движение в присед.": "Do not turn it into a squat.",
  "Контроль и пауза наверху.": "Control and pause at the top.",
  "Не делай рывком.": "Do not jerk.",
  "Полная амплитуда, наверху пауза.": "Full range of motion, pause at the top.",
  "Не подпрыгивай.": "Do not bounce.",
  "Корпус в одну линию, таз не падает.": "Body in one line, hips do not drop.",
  "Не заваливай плечо.": "Do not collapse the shoulder.",
  "Лёгкий темп, просто разогреться.": "Easy pace, just warm up.",
  "Не превращай в тяжёлое кардио.": "Do not turn it into hard cardio.",
  "Лёгко-средний вес, не до отказа.": "Light-to-moderate weight, not to failure.",
  "Не работай через усталость после вахты.": "Do not push through watch-related fatigue.",
  "Спина ровная, без рывков.": "Back straight, no jerking.",
  "Плавно, лёгкий вес.": "Smooth movement, light weight.",
  "Не раскачивайся.": "Do not swing.",
  "Сделай бицепс, затем трицепс, отдых 45–60 сек.": "Do biceps, then triceps, rest 45–60 seconds.",
  "Не гонись за весом.": "Do not chase weight.",
  "Рабочий, но не максимальный вес.": "Working but not maximal weight.",
  "Не делай до отказа.": "Do not go to failure.",
  "Контроль лопаток, локти вниз.": "Control shoulder blades, elbows down.",
  "Лёгко-средний вес, техника чистая.": "Light-to-moderate weight, clean technique.",
  "Не убивай ноги перед портом.": "Do not destroy legs before port.",
  "Медленно и чисто.": "Slow and clean.",
  "Памп, лёгкий вес.": "Pump, light weight.",
  "Не дёргай.": "Do not jerk.",
  "Скручивания или планка.": "Crunches or plank.",
  "Не тяни шею.": "Do not pull your neck.",
  "Круги руками, поперечные растяжки, лёгкое открытие груди у стены. Дыши спокойно.": "Arm circles, cross-body stretches, light chest opening against wall. Breathe calmly.",
  "Не дави через боль.": "Do not push through pain.",
  "Голубь, сгибатели бедра, кошка-корова. Медленно, с дыханием.": "Pigeon, hip flexors, cat-cow. Slow and with breathing.",
  "Не пружинь резко в конечных точках.": "Do not bounce hard at end range.",
  "4 сек вдох — 7 сек задержка — 8 сек выдох. Лёжа или сидя. 5–6 циклов.": "4 sec inhale — 7 sec hold — 8 sec exhale. Lying or seated. 5–6 cycles.",
  "Не спеши.": "Do not rush.",
  "Портовый day — опциональный памп": "Port day — optional pump",
  "Портовый день — опциональный памп": "Port day — optional pump",
  "Тренировка опциональна.": "Workout is optional.",
  "После порта: сон и восстановление. Не тренируйся тяжело.": "After port: sleep and recovery. Do not train heavy.",
  "Разгрузочная неделя. Объём снижен, техника важна.": "Deload week. Lower volume, technique matters.",
  "Два тяжёлых дня подряд — сегодня отдых обязателен.": "Two hard days in a row — rest is mandatory today.",
  "День отдыха. Сон, еда, мобилити если хочется.": "Rest day. Sleep, food, mobility if you want.",
  "Можно сделать короткий памп (20–30 мин) или отдохнуть. По самочувствию.": "You can do a short pump (20–30 min) or rest. Depends on how you feel.",
  "Слишком устал": "Too tired",
  "Плохой сон (<6ч)": "Bad sleep (<6h)",
  "Перенесено с вчера": "Moved from yesterday",
  "Перенесено с другого дня": "Moved from another day",
  "Тренировка перенесена на следующий день": "Workout moved to the next day",
  "Полная тренировка": "Full workout",
  "Средняя нагрузка": "Medium load",
  "Устал, тяжело": "Tired, feels hard",
  "Нормально, справлюсь": "Okay, I can handle it",
  "Нет, всё хорошо": "No, all good",
  "Немного, но терпимо": "A little, but manageable",
  "Да, ноют": "Yes, sore",
  "Меньше 5 часов": "Less than 5 hours",
  "5–6 часов": "5–6 hours",
  "7+ часов": "7+ hours",
  "Как спал?": "How did you sleep?",
  "Как самочувствие?": "How do you feel?",
  "Ноги болят?": "Are your legs sore?",
  "Готов к тренировке?": "Ready to train?",
  "Понял, отдыхаю": "Got it, I will rest",
  "GIF не загрузился.": "GIF failed to load.",
  "Техника описана ниже. Проверь интернет или путь к GIF.": "Technique is described below. Check internet or GIF path.",
  "Free GIF demo. Source: public GitHub dataset, educational / non-commercial use.": "Free GIF demo. Source: public GitHub dataset, educational / non-commercial use.",
  "Подберите комфортный стартовый вес": "Choose a comfortable starting weight",
  "Рекомендуемый вес": "Recommended weight",
  "кг": "kg",
  "сек": "sec",
  "повт.": "reps",
  "Подходы": "Sets",
  "Упражнения:": "Exercises:",
  "Начать —": "Start —",
  "✓ Отметить выполнено": "✓ Mark as done",
  "↷ Перенести": "↷ Move",
  "↩ Восстановить план": "↩ Restore plan",
  "🏋️ Начать тренировку": "🏋️ Start workout",
  "Упражнения и техника": "Exercises and technique",
  "Техника описана ниже": "Technique described below",
  "от старта": "from start",
  "цель": "target",
  "Локальное тестирование сейчас. Magic Link позже.": "Local testing now. Magic Link later.",
  "Локальный Daniil": "Daniil local",
  "Второй аккаунт": "Second local",
  "Опциональная cloud sync позже": "optional cloud sync later",
  "Email для Magic Link": "Email for Magic Link",
  "Сохранить config": "Save config",
  "Отправить login link": "Send login link",
  "Для текущего тестирования используй локальный Daniil. Supabase Magic Link подготовлен, но не обязателен.": "For current testing use Daniil local. Supabase Magic Link is prepared but not required.",
  "Пока не настраивай Supabase. Сначала закончи local QA и стабильность ежедневного использования.": "Do not configure Supabase yet. First finish local QA and daily-use stability.",
  "Сегодня": "Today",
  "В море": "At sea",
  "Фаза": "Phase",
  "Начать тренировку": "Start workout",
  "✓ Готово": "✓ Done",
  "серия 0": "streak 0",
  "Безопасность local данных": "Local data safety",
  "Напоминание о backup и статус local app.": "Backup reminder and local app status.",
  "Статус backup загружается...": "Backup status loading...",
  "Экспорт backup": "Export backup",
  "Запустить QA проверку": "Run QA check",
  "Проверка восстановления": "Recovery check",
  "Сон, усталость, болезненность и заметка по здоровью.": "Sleep, fatigue, soreness and health note.",
  "Сон": "Sleep",
  "Хорошо": "Good",
  "Плохо": "Bad",
  "Усталость": "Fatigue",
  "Низкая": "Low",
  "Средняя": "Medium",
  "Высокая": "High",
  "Болезненность": "Soreness",
  "Заметка": "Note",
  "боль в голени, астма, спина, стресс...": "shin pain, asthma, back, stress...",
  "Сохранить recovery": "Save recovery",
  "Применить совет": "Apply advice",
  "Трекер питания": "Nutrition tracker",
  "Протеин, вода, калории и добавки.": "Protein, water, calories and supplements.",
  "Протеин, г": "Protein, g",
  "Вода, л": "Water, L",
  "Калории": "Calories",
  "Достаточно": "Enough",
  "Низко": "Low",
  "Высоко": "High",
  "Заметка по еде": "Food note",
  "рис, яйца, йогурт, банан...": "rice, eggs, yogurt, banana...",
  "Мультивитамин": "Multivitamin",
  "Сохранить питание": "Save nutrition",
  "Если пропустишь тренировочный день, ShipFit может перенести её на следующий доступный не-портовый день и отметить исходный день как пропущенный.": "If you miss a training day, ShipFit can move it to the next available non-port day and mark the original day as skipped.",
  "Тренировка": "Train",
  "Опционально": "Optional",
  "Порт": "Port",
  "Отдых": "Rest",
  "Режим тренировки": "Workout mode",
  "Старт": "Start",
  "Библиотека упражнений": "Exercise library",
  "Интеллект следующей тренировки": "Next workout intelligence",
  "Еженедельный обзор прогресса": "Weekly progress review",
  "Инсайты прогресса": "Progress insights",
  "Backup / Restore / Cloud": "Backup / Restore / Cloud",
  "Экспорт JSON": "Export JSON",
  "Импорт JSON": "Import JSON",
  "Синхронизировать с Supabase": "Sync to Supabase",
  "Загрузить из Supabase": "Pull from Supabase",
  "Локальный backup ещё не создан.": "No local backup exported yet.",
  "Local режим. Supabase sync опционален.": "Local mode. Supabase sync is optional.",
  "Статус проверки": "Verification status",
  "Что реально проверено в этом RC.": "What is actually verified in this RC.",
  "Ручной QA тест": "Manual QA test",
  "Быстрая фиксация PASS / FAIL прямо в приложении.": "Quick PASS / FAIL tracking directly in the app.",
  "Начать QA session": "Start QA session",
  "Экспорт QA report": "Export QA report",
  "Сбросить QA": "Reset QA",
  "PWA / offline": "PWA / offline",
  "Установить app shell и кешировать local файлы.": "Install app shell and cache local files.",
  "Установить приложение": "Install app",
  "Включить offline shell": "Enable offline shell",
  "Очистить app cache": "Clear app cache",
  "Статус PWA загружается...": "PWA status loading...",
  "Local QA diagnostics": "Local QA diagnostics",
  "Проверить storage, обязательный UI, календарь и app shell.": "Check storage, required UI, calendar and app shell.",
  "Запустить local QA check": "Run local QA check",
  "Экспорт diagnostics": "Export diagnostics",
  "Supabase cloud config": "Supabase cloud config",
  "Сохранить Supabase config": "Save Supabase config",
  "Supabase deferred. Не подключай к CropMarine production. Позже использовать только отдельный проект.": "Supabase is deferred. Do not connect this to CropMarine production. Use a separate project only later.",
  "Таймер отдыха": "Rest timer",
  "Готово": "Ready",
  "Протеин": "Protein",
  "Вода": "Water",
  "Заполнено": "Logged",
  "Режим браузера": "Browser mode",
  "Режим установленного приложения": "Installed mode",
  "Service Worker доступен": "Service Worker available",
  "Service Worker требует http/https": "Service Worker needs http/https",
  "Онлайн": "Online",
  "Оффлайн": "Offline",
  "Установка готова": "Install ready",
  "Install prompt пока не готов": "Install prompt not ready",
  "Войти": "Login",
  "Выйти": "Logout",
  "Supabase готов к настройке. Используй отдельный проект, не CropMarine production.": "Supabase is ready to configure. Use a separate project, not CropMarine production.",
  "Email для Magic Link": "Email for Magic Link",
  "Отправить Magic Link": "Send Magic Link",
  "Supabase не подключён": "Supabase is not connected",
  "Supabase client library не загружена": "Supabase client library is not loaded",
  "Supabase config не сохранён": "Supabase config is not saved",
  "Supabase сессия активна": "Supabase session active",
  "Supabase config сохранён. Теперь отправь Magic Link или войди в Supabase.": "Supabase config saved. Now send Magic Link or sign in with Supabase.",
  "Сначала сделай локальный backup JSON перед загрузкой из Supabase.": "Export a local JSON backup before pulling from Supabase.",
  "Загрузка из Supabase заменит локальные данные текущего профиля. Продолжить?": "Pulling from Supabase will replace local data for the current profile. Continue?",
  "Cloud sync доступен только для профилей Daniil и Second.": "Cloud sync is available only for Daniil and Second profiles.",
  "Magic Link отправлен": "Magic Link sent",
  "Sync complete": "Sync complete",
  "Cloud data loaded": "Cloud data loaded"
};
const I18N_REVERSE = Object.fromEntries(Object.entries(I18N).map(([ru,en]) => [en, ru]));
function defaultLangForProfile(id=currentProfileId()){
  return PROFILE_DEFAULTS[id]?.lang || "ru";
}
function profileLangKey(id=currentProfileId()){
  return `shipfit:${id}:shipfitLang`;
}
function ensureProfileLanguage(id=currentProfileId()){
  const key = profileLangKey(id);
  if(rawGet(key) === null) rawSet(key, defaultLangForProfile(id));
}
function getLang(){
  return LS.get("shipfitLang") || defaultLangForProfile();
}
function isEn(){ return getLang()==="en"; }
function toggleLanguage(){
  ensureProfileLanguage();
  LS.set("shipfitLang", isEn()?"ru":"en");
  location.reload();
}
function i18nText(text){
  if(!text) return text;
  const lang = getLang();
  const dict = lang === "en" ? I18N : I18N_REVERSE;
  let out = text;
  const trimmed = out.trim();
  if(dict[trimmed]) return out.replace(trimmed, dict[trimmed]);
  Object.keys(dict).sort((a,b)=>b.length-a.length).forEach(k=>{
    if(k.length<2) return;
    if(out.includes(k)) out = out.split(k).join(dict[k]);
  });
  return out;
}
function translateNode(root=document.body){
  if(!root) return;
  if(document.documentElement) document.documentElement.lang=getLang();
  const btn=$("langToggle");
  if(btn) btn.textContent=isEn()?"RU":"EN";
  if(typeof document.createTreeWalker === "function" && typeof NodeFilter !== "undefined"){
    const skip = new Set(["SCRIPT","STYLE"]);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        const p=node.parentElement;
        if(!p || skip.has(p.tagName)) return NodeFilter.FILTER_REJECT;
        if(!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      const v=i18nText(n.nodeValue);
      if(v!==n.nodeValue) n.nodeValue=v;
    });
  }
  document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach(el=>{
    el.placeholder=i18nText(el.placeholder);
  });
  document.querySelectorAll("[title]").forEach(el=>el.title=i18nText(el.title));
}
let shipfitI18nObserver = null;
function setupLanguage(){
  ensureProfileLanguage();
  if(document.documentElement) document.documentElement.lang=getLang();
  const btn=$("langToggle");
  if(btn) btn.textContent=isEn()?"RU":"EN";
  if(!shipfitI18nObserver && typeof MutationObserver !== "undefined"){
    shipfitI18nObserver = new MutationObserver(muts=>{
      for(const m of muts){
        if(m.type==="childList") m.addedNodes.forEach(n=>{ if(n.nodeType===1) translateNode(n); });
        if(m.type==="characterData") m.target.nodeValue=i18nText(m.target.nodeValue);
      }
    });
    shipfitI18nObserver.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
  translateNode(document.body);
}


let selectedMonth = null;
let timerInterval = null;
let dayModalIso = null;

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2,"0");
const fmtDate = d => `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`;
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const dt = s => new Date(s);
const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
const daysBetween = (a,b) => Math.floor((new Date(b.getFullYear(),b.getMonth(),b.getDate()) - new Date(a.getFullYear(),a.getMonth(),a.getDate()))/86400000);
const sameDay = (a,b) => a.getFullYear()==b.getFullYear() && a.getMonth()==b.getMonth() && a.getDate()==b.getDate();

function getToday(){
  const real = new Date();
  if(real < START || real > END) return new Date("2026-06-23T12:00:00");
  return new Date(real.getFullYear(), real.getMonth(), real.getDate(), 12,0,0);
}
function getSettings(){
  return JSON.parse(LS.get("shipfitSettings") || '{"startWeight":82,"targetWeight":88,"weeklyTarget":4}');
}
function saveSettings(){
  const s = {
    startWeight: Number($("setStartWeight").value||82),
    targetWeight: Number($("setTargetWeight").value||88),
    weeklyTarget: Number($("setWeeklyTarget").value||4)
  };
  LS.set("shipfitSettings",JSON.stringify(s));
  toast("Настройки сохранены");
  renderAll();
}
function doneDates(){ return JSON.parse(LS.get("doneWorkouts")||"[]"); }
function weightLog(){ return JSON.parse(LS.get("weightLog")||"[]"); }
function strengthLog(){ return JSON.parse(LS.get("strengthLog")||"[]"); }
// Overrides: {iso: {status, reason}} — MOVED, SKIPPED, RECOVERY
function overrides(){ return JSON.parse(LS.get("dayOverrides")||"{}"); }
function setOverride(iso, obj){
  const ov = overrides();
  ov[iso] = obj;
  LS.set("dayOverrides", JSON.stringify(ov));
}
function clearOverride(iso){
  const ov = overrides();
  delete ov[iso];
  LS.set("dayOverrides", JSON.stringify(ov));
}

// ═══════════════════════════════════════════════════════════════
// PORT & PHASE LOGIC
// ═══════════════════════════════════════════════════════════════
function portInfo(day){
  const start = new Date(day); start.setHours(0,0,0,0);
  const end = new Date(day); end.setHours(23,59,59,999);
  const inPort = SCHEDULE.find(p => dt(p.arrival)<=end && dt(p.departure)>=start);
  if(inPort) return {type:"PORT", port:inPort};
  const next = SCHEDULE.find(p => dt(p.arrival)>day);
  if(next){
    const hrs = (dt(next.arrival)-day)/36e5;
    if(hrs<=30) return {type:"PRE_PORT",port:next};
  }
  const prev = [...SCHEDULE].reverse().find(p=>dt(p.departure)<day);
  if(prev){
    const hrs = (day-dt(prev.departure))/36e5;
    if(hrs<=24) return {type:"POST_PORT",port:prev};
  }
  return {type:"SEA"};
}
function phaseFor(day){
  const d = daysBetween(START, day);
  if(d<=13) return "Адаптация";
  if(d<=41) return "База";
  if(d<=48) return "Разгрузка";
  if(d<=90) return "Набор массы";
  if(d<=97) return "Разгрузка";
  return "Финальный блок";
}

// ═══════════════════════════════════════════════════════════════
// v0.3 SMART WEEKLY PLANNER
// Returns {dayType, workoutKey, label, reason, canTrain}
// dayTypes: TRAIN, REST, OPTIONAL, PORT_PUMP, RECOVERY, MOVED, SKIPPED
// ═══════════════════════════════════════════════════════════════
function planWeek(weekMon){
  // Build 7-day plan for the week starting weekMon
  const plan = [];
  for(let i=0;i<7;i++){
    const day = addDays(weekMon, i);
    plan.push(planDay(day, plan));
  }
  return plan;
}

function planDay(day, priorDaysThisWeek=[]){
  const iso = isoDate(day);
  const ov = overrides()[iso];
  const p = portInfo(day);
  const phase = phaseFor(day);
  const done = new Set(doneDates());
  const isDone = done.has(fmtDate(day));

  // Count heavy train days so far this week
  const heavyDone = priorDaysThisWeek.filter(d=>d.dayType==="TRAIN").length;
  // Count any consecutive heavy days before today
  let consec = 0;
  for(let i=priorDaysThisWeek.length-1;i>=0;i--){
    if(priorDaysThisWeek[i].dayType==="TRAIN") consec++;
    else break;
  }
  // Tomorrow is port? (for leg protection)
  const tomorrow = addDays(day,1);
  const tomorrowPort = portInfo(tomorrow).type==="PORT";

  // Check if override exists
  if(ov){
    if(ov.status==="SKIPPED") return {dayType:"SKIPPED",workoutKey:"REST",label:"Пропущено",reason:ov.reason||"Пропущено",isDone,iso};
    if(ov.status==="MOVED_HERE"){
      // A workout was moved to this day
      const wk = ov.workoutKey||"UPPER_A";
      return {dayType:"TRAIN",workoutKey:wk,label:WORKOUTS[wk].title+" (перенос)",reason:"Перенесено с другого дня",isDone,iso};
    }
    if(ov.status==="MOVED_AWAY"){
      return {dayType:"MOVED",workoutKey:"REST",label:"Перенесено",reason:"Тренировка перенесена на следующий день",isDone,iso};
    }
    if(ov.status==="RECOVERY"){
      return {dayType:"RECOVERY",workoutKey:"REST",label:"Recovery",reason:ov.reason||"Восстановление",isDone,iso};
    }
    if(ov.status==="PORT_PUMP"){
      return {dayType:"PORT_PUMP",workoutKey:"PORT",label:"Port Pump",reason:"Портовый day — опциональный памп",isDone,iso};
    }
  }

  // PORT day → PORT_PUMP (optional, not mandatory)
  if(p.type==="PORT"){
    return {dayType:"PORT_PUMP",workoutKey:"PORT",label:"Port Pump",reason:`Порт: ${p.port.port} — вахта 00–04 / 12–16. Тренировка опциональна.`,isDone,iso};
  }
  // POST_PORT → full recovery
  if(p.type==="POST_PORT"){
    return {dayType:"RECOVERY",workoutKey:"REST",label:"Recovery",reason:"После порта: сон и восстановление. Не тренируйся тяжело.",isDone,iso};
  }
  // PRE_PORT → light/optional, no legs
  if(p.type==="PRE_PORT"){
    return {dayType:"OPTIONAL",workoutKey:"MEDIUM",label:"Опционально",reason:`Завтра порт (${p.port.port}). Лёгкая тренировка или отдых — ноги не трогать.`,isDone,iso};
  }
  // Deload week
  if(phase==="Разгрузка"||phase==="Deload"){
    return {dayType:"OPTIONAL",workoutKey:"MEDIUM",label:"Разгрузка",reason:"Разгрузочная неделя. Объём снижен, техника важна.",isDone,iso};
  }
  // Prevent >2 heavy days in a row
  if(consec>=2){
    return {dayType:"REST",workoutKey:"REST",label:"Отдых",reason:"Два тяжёлых дня подряд — сегодня отдых обязателен.",isDone,iso};
  }
  // Weekly target: 4 train days, rest distributed
  // Build smart weekly pattern with rest days
  const weekPattern = getWeekPattern(day, phase);
  return weekPattern;
}

function getWeekPattern(day, phase){
  // Weekly 4-train pattern with smart distribution
  // Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
  const dow = (day.getDay()+6)%7; // Mon=0
  const p = portInfo(day);
  const tomorrow = addDays(day,1);
  const tomorrowPort = portInfo(tomorrow).type==="PORT";
  const dayAfter = addDays(day,2);
  const dayAfterPort = portInfo(dayAfter).type==="PORT";

  // Figure out which training slot this is
  const d = daysBetween(START, day);
  const iso = isoDate(day);
  const done = new Set(doneDates());
  const isDone = done.has(fmtDate(day));

  // 4-on, 3-off weekly template:
  // Mon: TRAIN, Tue: REST, Wed: TRAIN, Thu: REST/Mobility, Fri: TRAIN, Sat: OPTIONAL, Sun: TRAIN or REST
  const WEEK_TEMPLATE = {
    0: "TRAIN",   // Mon
    1: "REST",    // Tue
    2: "TRAIN",   // Wed
    3: "REST",    // Thu
    4: "TRAIN",   // Fri
    5: "OPTIONAL",// Sat
    6: "TRAIN"    // Sun
  };
  const templateType = WEEK_TEMPLATE[dow];

  // Assign workout key based on how many train days have happened since START
  // Count TRAIN days so far from START to today (approximate)
  const safeSeqBase = Math.max(0, Math.floor(d / 2));
  const seqIdx = ((safeSeqBase % SEQ.length) + SEQ.length) % SEQ.length; // safe modulo for dates before START
  const wkKey = SEQ[seqIdx] || SEQ[0];
  const w = WORKOUTS[wkKey] || WORKOUTS.UPPER_A;

  // Protect legs before port tomorrow
  let actualKey = wkKey;
  if(tomorrowPort && (actualKey==="LOWER_A"||actualKey==="LOWER_B")){
    actualKey = "UPPER_A"; // swap to upper if legs were planned
  }

  const isDoneToday = done.has(fmtDate(day));

  if(templateType==="TRAIN"){
    return {
      dayType:"TRAIN",
      workoutKey:actualKey,
      label:(WORKOUTS[actualKey]||w).title,
      reason:`${phase} · Силовая тренировка · ${(WORKOUTS[actualKey]||w).duration} мин`,
      isDone:isDoneToday,
      iso
    };
  }
  if(templateType==="REST"){
    return {
      dayType:"REST",
      workoutKey:"REST",
      label:"Отдых",
      reason:"День отдыха. Сон, еда, мобилити если хочется.",
      isDone:isDoneToday,
      iso
    };
  }
  if(templateType==="OPTIONAL"){
    return {
      dayType:"OPTIONAL",
      workoutKey:"PORT",
      label:"Опционально",
      reason:"Можно сделать короткий памп (20–30 мин) или отдохнуть. По самочувствию.",
      isDone:isDoneToday,
      iso
    };
  }
  return {
    dayType:"REST",workoutKey:"REST",label:"Отдых",reason:"День отдыха.",isDone:isDoneToday,iso
  };
}

// ═══════════════════════════════════════════════════════════════
// TODAY LOGIC
// ═══════════════════════════════════════════════════════════════
function getTodayPlan(){
  const today = getToday();
  const mon = weekStart(today);
  // Build week up to today
  const prior = [];
  for(let i=0;i<7;i++){
    const d = addDays(mon,i);
    if(sameDay(d,today)) break;
    prior.push(planDay(d, prior));
  }
  return planDay(today, prior);
}

function weekStart(day){
  const d = new Date(day);
  const diff = (d.getDay()+6)%7;
  d.setDate(d.getDate()-diff);
  d.setHours(12,0,0,0);
  return d;
}
function weekDoneCount(){
  const today=getToday();
  const start=weekStart(today);
  const done=doneDates();
  let c=0;
  for(let i=0;i<7;i++) if(done.includes(fmtDate(addDays(start,i)))) c++;
  return c;
}
function streak(){
  const done=new Set(doneDates());
  let c=0; let d=getToday();
  while(done.has(fmtDate(d))){c++;d=addDays(d,-1);}
  return c;
}
function nextPort(day){
  return SCHEDULE.find(p=>dt(p.arrival)>day);
}

// ═══════════════════════════════════════════════════════════════
// RENDER TODAY
// ═══════════════════════════════════════════════════════════════
function renderToday(){
  const today = getToday();
  const plan = getTodayPlan();
  const p = portInfo(today);

  $("todayDate").textContent = fmtDate(today);
  $("phase").textContent = phaseFor(today);

  // Ship status pill
  let statusTxt="В море"; let statusCls="pill sea";
  if(p.type==="PORT"){statusTxt=`Порт: ${p.port.port}`;statusCls="pill port";}
  if(p.type==="PRE_PORT"){statusTxt=`Перед портом: ${p.port.port}`;statusCls="pill port";}
  if(p.type==="POST_PORT"){statusTxt="После порта";statusCls="pill warn";}
  $("shipStatus").textContent=statusTxt;
  $("shipStatus").className=statusCls;

  // Day status banner
  const banner = $("dayStatusBanner");
  const typeMap = {TRAIN:"train",REST:"rest",OPTIONAL:"optional",PORT_PUMP:"port-pump",RECOVERY:"recovery",MOVED:"moved",SKIPPED:"skipped"};
  const tc = typeMap[plan.dayType]||"rest";
  banner.className = `dayStatusBanner ${tc}`;
  $("dsBadge").className = `dsBadge ${tc}`;

  const labelMap = {TRAIN:"ТРЕНИРОВКА",REST:"ОТДЫХ",OPTIONAL:"ОПЦИОНАЛЬНО",PORT_PUMP:"PORT PUMP",RECOVERY:"RECOVERY",MOVED:"ПЕРЕНЕСЕНО",SKIPPED:"ПРОПУЩЕНО"};
  $("dsBadge").textContent = labelMap[plan.dayType]||plan.dayType;

  const w = WORKOUTS[plan.workoutKey];
  $("dsTitle").textContent = plan.dayType==="REST"||plan.dayType==="RECOVERY" ? (plan.dayType==="REST"?"Сегодня отдых":"Recovery день") : w.title + (plan.dayType==="OPTIONAL"?" (опционально)":plan.dayType==="PORT_PUMP"?" — короткий памп":"");
  $("dsSub").textContent = plan.dayType==="REST"||plan.dayType==="RECOVERY" ? "Сон, питание, мобилити." : `${w.duration} мин · ${w.focus}`;
  $("dsReason").textContent = plan.reason;

  // CTA buttons
  const cta = $("todayCTA");
  const qa = $("quickActions");
  if(plan.dayType==="REST"||plan.dayType==="RECOVERY"){
    cta.style.display="none";
    if(qa) qa.style.display="none";
  } else if(plan.dayType==="SKIPPED"||plan.dayType==="MOVED"){
    cta.style.display="none";
    if(qa) qa.style.display="none";
  } else {
    cta.style.display="flex";
    if(qa) qa.style.display="grid";
    // Adjust start button text for optional
    const startBtn = $("btnStartWorkout");
    if(plan.dayType==="OPTIONAL"||plan.dayType==="PORT_PUMP"){
      startBtn.textContent="Начать (опционально)";
    } else {
      startBtn.textContent="Начать тренировку";
    }
  }

  // Exercise list
  const excCard = $("exerciseCard");
  if(plan.dayType==="REST"||plan.dayType==="RECOVERY"){
    excCard.style.display="none";
  } else {
    excCard.style.display="block";
    $("exerciseCardTitle").textContent = plan.dayType==="REST" ? "Recovery" :
      plan.dayType==="PORT_PUMP" ? "Port Pump" :
      plan.dayType==="OPTIONAL" ? "Опциональная тренировка" : "Тренировка сегодня";
    $("workoutMeta").textContent = `${w.duration} мин · ${w.focus} · ${w.level}`;
    renderExerciseList(plan.workoutKey, "exerciseList");
  }

  // Ring
  const s = getSettings();
  const done = weekDoneCount();
  const pct = Math.min(100, Math.round(done/s.weeklyTarget*100));
  $("weekRing").style.setProperty("--p",pct);
  $("weekPct").textContent=pct+"%";
  $("weekDone").textContent=`${done} / ${s.weeklyTarget}`;
  $("streakText").textContent=`streak ${streak()}`;

  // Weight
  const lastW = weightLog().at(-1);
  $("currentWeight").textContent = lastW?lastW.weight:s.startWeight;
  $("targetWeight").textContent = s.targetWeight;

  // Next port
  const np = nextPort(today);
  $("nextPort").textContent = np?np.port.split(" ")[0]:"—";

  renderWeek();
  renderWeekCompliance();
}

// ═══════════════════════════════════════════════════════════════
// RENDER WEEK STRIP
// ═══════════════════════════════════════════════════════════════
function renderWeek(){
  const today = getToday();
  const mon = weekStart(today);
  const done = new Set(doneDates());
  const dows=["ПН","ВТ","СР","ЧТ","ПТ","СБ","ВС"];
  const prior=[];
  $("weekStrip").innerHTML = Array.from({length:7},(_,i)=>{
    const day = addDays(mon,i);
    const plan = planDay(day, [...prior]);
    prior.push(plan);
    const typeMap={TRAIN:"train",REST:"rest",OPTIONAL:"optional",PORT_PUMP:"port-pump",RECOVERY:"recovery",MOVED:"moved",SKIPPED:"skipped"};
    const tc=typeMap[plan.dayType]||"rest";
    const labelMap={TRAIN:"TRAIN",REST:"REST",OPTIONAL:"OPT",PORT_PUMP:"PORT",RECOVERY:"REC",MOVED:"MOVED",SKIPPED:"SKIP"};
    const isDoneDay = done.has(fmtDate(day));
    return `<div class="dayChip ${sameDay(day,today)?"today":""} ${isDoneDay?"done":""} ${plan.dayType==="MOVED"?"moved":""} ${plan.dayType==="SKIPPED"?"skipped":""}" onclick="openDay('${isoDate(day)}')">
      <div class="dow">${dows[i]}</div>
      <div class="num">${day.getDate()}</div>
      <span class="dtype ${tc}">${labelMap[plan.dayType]||"?"}</span>
      <div class="shortlabel">${plan.workoutKey!=="REST"?WORKOUTS[plan.workoutKey].title:""}</div>
    </div>`;
  }).join("");
}

// ═══════════════════════════════════════════════════════════════
// WEEK COMPLIANCE BOXES
// ═══════════════════════════════════════════════════════════════
function renderWeekCompliance(targetId="weekCompliance"){
  const today=getToday();
  const mon=weekStart(today);
  const done=new Set(doneDates());
  const ov=overrides();
  let trainDone=0, skipped=0, moved=0, recovery=0;
  const prior=[];
  for(let i=0;i<7;i++){
    const day=addDays(mon,i);
    const plan=planDay(day,[...prior]);
    prior.push(plan);
    const iso=isoDate(day);
    if(done.has(fmtDate(day))) trainDone++;
    if(plan.dayType==="SKIPPED") skipped++;
    if(plan.dayType==="MOVED") moved++;
    if(plan.dayType==="RECOVERY") recovery++;
  }
  const s=getSettings();
  $(targetId).innerHTML=`
    <div class="wc done"><div class="wcNum">${trainDone}</div><div class="wcLbl">Выполнено</div></div>
    <div class="wc"><div class="wcNum">${s.weeklyTarget}</div><div class="wcLbl">Цель</div></div>
    <div class="wc moved"><div class="wcNum">${moved}</div><div class="wcLbl">Перенесено</div></div>
    <div class="wc skipped"><div class="wcNum">${skipped}</div><div class="wcLbl">Пропущено</div></div>
  `;
  if($(targetId.replace("weekCompliance","progressCompliance"))){
    $("progressCompliance").innerHTML = $(targetId).innerHTML;
  }
}

// ═══════════════════════════════════════════════════════════════
// RENDER MONTH
// ═══════════════════════════════════════════════════════════════
function renderMonth(){
  const today=getToday();
  if(!selectedMonth) selectedMonth=new Date(today.getFullYear(),today.getMonth(),1,12);
  const mNames = isEn()
    ? ["January","February","March","April","May","June","July","August","September","October","November","December"]
    : ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekDays = isEn() ? ["M","T","W","T","F","S","S"] : ["П","В","С","Ч","П","С","В"];
  $("monthTitle").innerHTML=`
    <button class="ghost" style="padding:8px 12px" onclick="shiftMonth(-1)">‹</button>
    <span>${mNames[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}</span>
    <button class="ghost" style="padding:8px 12px" onclick="shiftMonth(1)">›</button>`;
  $("monthHead").innerHTML=weekDays.map(x=>`<div class="monthHead">${x}</div>`).join("");
  const first=new Date(selectedMonth.getFullYear(),selectedMonth.getMonth(),1,12);
  const offset=(first.getDay()+6)%7;
  const gridStart=addDays(first,-offset);
  const done=new Set(doneDates());
  let html="";
  for(let i=0;i<42;i++){
    const day=addDays(gridStart,i);
    const plan=planDay(day);
    const p=portInfo(day);
    const currentMonth=day.getMonth()===selectedMonth.getMonth();
    const typeMap={TRAIN:"train",REST:"rest",OPTIONAL:"optional",PORT_PUMP:"port-pump",RECOVERY:"recovery",MOVED:"moved",SKIPPED:"skipped"};
    const tc=typeMap[plan.dayType]||"rest";
    const markClass=p.type==="PORT"?"port":tc;
    const tagTxt=p.type==="PORT"?p.port.port:plan.label;
    const cls=["calDay",currentMonth?"":"muted",sameDay(day,today)?"today":"",done.has(fmtDate(day))?"done":"",plan.dayType==="MOVED"?"moved":"",plan.dayType==="SKIPPED"?"skipped":""].join(" ");
    html+=`<div class="${cls}" onclick="openDay('${isoDate(day)}')">
      <div class="n">${day.getDate()}</div>
      <span class="mark ${markClass}"></span>
      <div class="ctag ${p.type==="PORT"?"port":tc}">${tagTxt}</div>
    </div>`;
  }
  $("monthCal").innerHTML=html;
}
function shiftMonth(n){ selectedMonth=new Date(selectedMonth.getFullYear(),selectedMonth.getMonth()+n,1,12); renderMonth(); }
function goToday(){ selectedMonth=null; renderMonth(); }

// ═══════════════════════════════════════════════════════════════
// RENDER PORTS
// ═══════════════════════════════════════════════════════════════
function renderPorts(){
  const today=getToday();
  $("portList").innerHTML=SCHEDULE.filter(p=>dt(p.departure)>today).slice(0,8).map(p=>`
    <div class="historyLine">
      <div><b>${p.port}</b><br><span style="color:var(--muted)">${p.terminal}</span></div>
      <div style="text-align:right">${fmtDate(dt(p.arrival))}<br><span style="color:var(--muted)">${pad(dt(p.arrival).getHours())}:${pad(dt(p.arrival).getMinutes())}</span></div>
    </div>`).join("");
}

// ═══════════════════════════════════════════════════════════════
// EXERCISE ANIMATION HELPERS (v0.3.1)
// ═══════════════════════════════════════════════════════════════
function motionType(name){
  const n=(name||"").toLowerCase();
  if(n.includes("наклонный жим")) return "incline";
  if(n.includes("жим гантелей лёжа")||n.includes("жим гантелей или тренаж")||n==="жим гантелей"||n.includes("dumbbell press")) return "press";
  if(n.includes("тяга верхнего блока")||n.includes("узким хватом")) return "pulldown";
  if(n.includes("тяга сидя")||n==="тяга блока") return "row";
  if(n.includes("жим гантелей сидя")) return "shoulder";
  if(n.includes("разведения гантелей в стороны")||n.includes("плечи в стороны")||n.includes("разведения плеч")) return "lateral";
  if(n.includes("трицепс на блоке")) return "triceps";
  if(n.includes("бицепс")||n.includes("молотковые")) return "curl";
  if(n.includes("трицепс над головой")) return "overhead";
  if(n.includes("goblet")||n.includes("присед")) return "squat";
  if(n.includes("румынская")||n==="румынская тяга") return "rdl";
  if(n.includes("болгарские")||n.includes("выпады назад")||n.includes("выпады")) return "lunge";
  if(n.includes("разгибание ног")) return "legext";
  if(n.includes("сгибание ног")) return "legcurl";
  if(n.includes("икры")) return "calf";
  if(n==="планка") return "plank";
  if(n.includes("боковая планка")) return "sideplank";
  if(n.includes("тяга одной гантели")) return "onerow";
  if(n.includes("разводка на грудь")) return "fly";
  if(n.includes("face pull")) return "facepull";
  if(n.includes("pull-through")) return "pullthrough";
  if(n.includes("вело")||n.includes("дорожка")) return "cardio";
  if(n.includes("мобилити")) return "mobility";
  if(n.includes("пресс")) return "core";
  return "mobility";
}
const GIF_BASE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";
const EXERCISE_MEDIA = {
  "Жим гантелей лёжа": {gif:"videos/0289-SpYC0Kp.gif", source:"dumbbell bench press"},
  "Жим гантелей": {gif:"videos/0289-SpYC0Kp.gif", source:"dumbbell bench press"},
  "Жим гантелей или тренажёр": {gif:"videos/0289-SpYC0Kp.gif", source:"dumbbell bench press"},
  "Наклонный жим гантелей": {gif:"videos/0314-ns0SIbU.gif", source:"dumbbell incline bench press"},
  "Тяга верхнего блока к груди": {gif:"videos/2330-LEprlgG.gif", source:"cable lat pulldown full range of motion"},
  "Тяга верхнего блока": {gif:"videos/2330-LEprlgG.gif", source:"cable lat pulldown full range of motion"},
  "Тяга верхнего блока узким хватом": {gif:"videos/2330-LEprlgG.gif", source:"cable lat pulldown"},
  "Тяга сидя на блоке": {gif:"videos/0861-fUBheHs.gif", source:"cable seated row"},
  "Тяга блока": {gif:"videos/0861-fUBheHs.gif", source:"cable seated row"},
  "Жим гантелей сидя": {gif:"videos/0405-znQUdHY.gif", source:"dumbbell seated shoulder press"},
  "Разведения гантелей в стороны": {gif:"videos/0311-AQ0mC4Y.gif", source:"dumbbell full can lateral raise"},
  "Разведения плеч": {gif:"videos/0311-AQ0mC4Y.gif", source:"dumbbell lateral raise"},
  "Плечи в стороны": {gif:"videos/0311-AQ0mC4Y.gif", source:"dumbbell lateral raise"},
  "Трицепс на блоке": {gif:"videos/0241-gAwDzB3.gif", source:"cable triceps pushdown (v-bar)"},
  "Бицепс с гантелями": {gif:"videos/0313-slDvUAU.gif", source:"dumbbell hammer curl"},
  "Молотковые сгибания": {gif:"videos/0313-slDvUAU.gif", source:"dumbbell hammer curl"},
  "Goblet squat": {gif:"videos/1760-yn8yg1r.gif", source:"dumbbell goblet squat"},
  "Медленный goblet squat": {gif:"videos/1760-yn8yg1r.gif", source:"dumbbell goblet squat"},
  "Румынская тяга с гантелями": {gif:"videos/1459-rR0LJzx.gif", source:"dumbbell romanian deadlift"},
  "Румынская тяга": {gif:"videos/1459-rR0LJzx.gif", source:"dumbbell romanian deadlift"},
  "Болгарские выпады": {gif:"videos/0336-RRWFUcw.gif", source:"dumbbell lunge (closest free GIF)"},
  "Выпады назад": {gif:"videos/0381-?PLACEHOLDER.gif", source:"dumbbell rear lunge"},
  "Разгибание ног": {gif:"videos/0585-?PLACEHOLDER.gif", source:"lever leg extension"},
  "Сгибание ног": {gif:"videos/1766-ZSY3MsL.gif", source:"self assisted inverse leg curl"},
  "Икры с гантелями": {gif:"videos/1382-xo6sENf.gif", source:"dumbbell standing calf raise variant"},
  "Икры": {gif:"videos/1382-xo6sENf.gif", source:"dumbbell standing calf raise variant"},
  "Планка": {gif:"videos/3145-pvBMLHA.gif", source:"push-up / plank movement"},
  "Боковая планка": {gif:"videos/0664-KhHJ338.gif", source:"push-up to side plank"},
  "Тяга одной гантели в наклоне": {gif:"videos/1330-ZIViNh1.gif", source:"dumbbell one arm row variant"},
  "Разводка на грудь": {gif:"videos/0308-yz9nUhF.gif", source:"dumbbell fly"},
  "Face pull на блоке": {gif:"videos/3697-G61cXLk.gif", source:"cable rear-delt pull variant"},
  "Трицепс над головой": {gif:"videos/0362-nAuHPcD.gif", source:"dumbbell one arm triceps extension"},
  "Cable pull-through": {gif:"videos/0196-?PLACEHOLDER.gif", source:"cable pull through"},
  "Вело или дорожка": {gif:"videos/0003-1ZFqTDN.gif", source:"air bike / warm-up placeholder"},
  "Пресс": {gif:"videos/0001-2gPfomN.gif", source:"3/4 sit-up"},
  "Мобилити плеч и груди": {gif:"videos/1512-qBcKorM.gif", source:"mobility/stretch placeholder"},
  "Мобилити бёдер и поясницы": {gif:"videos/1512-qBcKorM.gif", source:"mobility/stretch placeholder"},
  "Дыхание и расслабление": {gif:"videos/0001-2gPfomN.gif", source:"breathing / core placeholder"}
};

function escapeAttr(value){
  return String(value||"").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
}
function getExerciseMedia(name){
  if(EXERCISE_MEDIA[name]) return EXERCISE_MEDIA[name];
  const n=(name||"").toLowerCase();
  if(n.includes("жим")) return EXERCISE_MEDIA["Жим гантелей лёжа"];
  if(n.includes("тяга верхнего")) return EXERCISE_MEDIA["Тяга верхнего блока к груди"];
  if(n.includes("тяга сидя")||n==="тяга блока") return EXERCISE_MEDIA["Тяга сидя на блоке"];
  if(n.includes("goblet")) return EXERCISE_MEDIA["Goblet squat"];
  if(n.includes("румын")) return EXERCISE_MEDIA["Румынская тяга с гантелями"];
  if(n.includes("выпад")||n.includes("болгар")) return EXERCISE_MEDIA["Болгарские выпады"];
  if(n.includes("икры")) return EXERCISE_MEDIA["Икры с гантелями"];
  if(n.includes("планка")) return EXERCISE_MEDIA["Планка"];
  return null;
}
function fallbackDemo(name){
  const type=motionType(name);
  return `<div class="gifFallback">GIF не загрузился.<br>Используй текстовые шаги ниже: старт → движение → финиш.</div>`;
}
function motionDemo(name){
  const media=getExerciseMedia(name);
  if(!media || !media.gif || media.gif.includes("?PLACEHOLDER")){
    return `<div class="gifDemo failed" aria-label="${escapeAttr(name)} demo">${fallbackDemo(name)}<div class="gifMeta"><span class="gifBadge">TEXT</span><span class="gifSource">Нет бесплатного GIF для этого упражнения</span></div></div>`;
  }
  const src=GIF_BASE+media.gif;
  return `<div class="gifDemo" aria-label="${escapeAttr(name)} GIF demo">
    <img src="${src}" alt="${escapeAttr(name)} техника выполнения" loading="lazy" onerror="this.closest('.gifDemo').classList.add('failed')">
    ${fallbackDemo(name)}
    <div class="gifMeta"><span class="gifBadge">GIF demo</span><span class="gifSource">${escapeAttr(media.source)}</span></div>
  </div>`;
}
// ═══════════════════════════════════════════════════════════════
// RENDER EXERCISE LIST
// ═══════════════════════════════════════════════════════════════
function renderExerciseList(key, targetId){
  const w=WORKOUTS[key];
  const exercises=getEffectiveExercises(key);
  $(targetId).innerHTML=exercises.map((e,i)=>`
    <div class="exerciseCard" onclick="this.classList.toggle('open')">
      <div class="exHead">
        <div><div class="exName">${i+1}. ${e.name}</div><div class="exEn">${e.en}</div></div>
        <div class="exBadge">${e.sets}×${e.reps}</div>
      </div>
      <div class="swapBar">${replacementSelectHtml(e,i)}</div>
      <div class="exBody">
        ${motionDemo(e.name)}
        <div class="infoGrid">
          <div class="infoBox"><b>Как делать</b>${e.how}</div>
          <div class="infoBox"><b>Ошибка</b>${e.mistake}</div>
          <div class="infoBox"><b>Мышцы</b>${e.muscles}</div>
          <div class="infoBox"><b>Оборудование</b>${e.equipment}</div>
        </div>
      </div>
    </div>`).join("");
}

function renderLibrary(){
  const seen=new Map();
  Object.values(WORKOUTS).forEach(w=>w.exercises.forEach(e=>{if(!seen.has(e.name))seen.set(e.name,e);}));
  $("library").innerHTML=[...seen.values()].map((e,i)=>`
    <div class="exerciseCard" onclick="this.classList.toggle('open')">
      <div class="exHead"><div><div class="exName">${e.name}</div><div class="exEn">${e.en}</div></div><div class="exBadge">${e.equipment}</div></div>
      <div class="exBody">${motionDemo(e.name)}<div class="infoGrid"><div class="infoBox"><b>Как делать</b>${e.how}</div><div class="infoBox"><b>Ошибка</b>${e.mistake}</div><div class="infoBox"><b>Мышцы</b>${e.muscles}</div><div class="infoBox"><b>Подходы</b>${e.sets}×${e.reps}</div></div></div>
    </div>`).join("");
}

function renderHistory(){
  const w=weightLog();
  $("weightHistory").innerHTML=w.length?w.slice(-12).reverse().map(x=>`<div class="historyLine"><span>${escapeAttr(x.date)}</span><b>${escapeAttr(x.weight)} кг</b></div>`).join(""):`<p style="color:var(--muted)">Записей нет.</p>`;
  const s=strengthLog();
  $("strengthHistory").innerHTML=s.length?s.slice(-12).reverse().map(x=>`<div class="historyLine"><span>${escapeAttr(x.date)}</span><b>${escapeAttr(x.note)}</b></div>`).join(""):`<p style="color:var(--muted)">Записей нет.</p>`;
}

// ═══════════════════════════════════════════════════════════════
// DAY MODAL (click on calendar/week day)
// ═══════════════════════════════════════════════════════════════
function openDay(iso){
  const d=new Date(iso+"T12:00:00");
  const today=getToday();
  dayModalIso=iso;
  const plan=planDay(d);
  const p=portInfo(d);
  const dows=["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
  const dowNames=["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
  $("dayModalTitle").textContent=dowNames[d.getDay()];
  $("dayModalSub").textContent=fmtDate(d)+(p.type==="PORT"?` · Порт: ${p.port.port}`:p.type==="PRE_PORT"?` · Перед портом: ${p.port.port}`:"");

  // Banner
  const typeMap={TRAIN:"train",REST:"rest",OPTIONAL:"optional",PORT_PUMP:"port-pump",RECOVERY:"recovery",MOVED:"moved",SKIPPED:"skipped"};
  const tc=typeMap[plan.dayType]||"rest";
  const labelMap={TRAIN:"ТРЕНИРОВКА",REST:"ОТДЫХ",OPTIONAL:"ОПЦИОНАЛЬНО",PORT_PUMP:"PORT PUMP",RECOVERY:"RECOVERY",MOVED:"ПЕРЕНЕСЕНО",SKIPPED:"ПРОПУЩЕНО"};
  const w=WORKOUTS[plan.workoutKey];
  $("dayModalBanner").innerHTML=`
    <div class="dayStatusBanner ${tc}" style="margin-bottom:12px">
      <span class="dsBadge ${tc}">${labelMap[plan.dayType]||plan.dayType}</span>
      <div class="dsTitle">${plan.label}</div>
      <div class="dsSub">${plan.dayType!=="REST"&&plan.dayType!=="RECOVERY"&&plan.dayType!=="MOVED"&&plan.dayType!=="SKIPPED"?`${w.duration} мин · ${w.focus}`:""}</div>
      <div class="dsReason">${plan.reason}</div>
    </div>`;

  // Port info
  let portHtml="";
  if(p.type==="PORT") portHtml=`<div class="noteBox">⚓ Вахта 00–04 / 12–16. Короткая тренировка только по желанию.</div>`;

  // Content
  let content="";
  if(plan.dayType==="REST"||plan.dayType==="RECOVERY"){
    content=`<div class="restCard"><div class="restIcon">${plan.dayType==="RECOVERY"?"🔄":"😴"}</div><h3>${plan.dayType==="RECOVERY"?"Recovery":"День отдыха"}</h3><p>Сон, питание, мобилити. Не нужно тренироваться.</p></div>`;
  }
  $("dayModalContent").innerHTML=portHtml+content;

  // Actions (only for today or future)
  const isPast=d<today && !sameDay(d,today);
  let actHtml="";
  if(!isPast){
    if(sameDay(d,today)){
      if(plan.dayType==="TRAIN"||plan.dayType==="OPTIONAL"||plan.dayType==="PORT_PUMP"){
        actHtml=`<div class="actionGrid">
          <div class="actionBtn primary" onclick="closeDayModal();startWorkout()">🏋️ Начать тренировку</div>
          <div class="actionBtn" onclick="closeDayModal();markDoneDay('${iso}')">✓ Отметить выполнено</div>
          <div class="actionBtn warn" onclick="closeDayModal();moveWorkoutToNextAvailable('${iso}')">↷ Next available</div>
          <div class="actionBtn" onclick="closeDayModal();setRecoveryDay('${iso}')">🔄 Recovery only</div>
          <div class="actionBtn danger" onclick="closeDayModal();applySkipDirect('${iso}','skip')">✗ Пропустить</div>
        </div>`;
      }
    } else {
      // Future day
      if(plan.dayType==="TRAIN"){
        actHtml=`<div class="actionGrid">
          <div class="actionBtn warn" onclick="moveWorkoutToNextAvailable('${iso}');closeDayModal()">↷ Next available</div>
          <div class="actionBtn" onclick="setRecoveryDay('${iso}');closeDayModal()">🔄 Recovery only</div>
          <div class="actionBtn danger" onclick="applySkipDirect('${iso}','skip');closeDayModal()">✗ Пропустить</div>
        </div>`;
      } else if(plan.dayType==="MOVED"||plan.dayType==="SKIPPED"){
        actHtml=`<div class="actionGrid">
          <div class="actionBtn" onclick="clearOverride('${iso}');closeDayModal();renderAll()">↩ Восстановить план</div>
        </div>`;
      }
    }
  } else {
    // Past: show done status
    const done=new Set(doneDates());
    if(done.has(fmtDate(d))){
      actHtml=`<div style="color:var(--good);font-weight:800;margin:8px 0">✓ Тренировка выполнена</div>`;
    }
  }
  $("dayModalActions").innerHTML=actHtml;

  // Exercises preview
  if(plan.dayType!=="REST"&&plan.dayType!=="RECOVERY"&&plan.dayType!=="SKIPPED"&&plan.dayType!=="MOVED"){
    $("dayModalExercises").innerHTML=`<div style="margin-top:12px"><b style="font-size:15px">Упражнения:</b><div id="dayModalExList" style="margin-top:8px"></div></div>`;
    setTimeout(()=>{
      if($("dayModalExList")) renderExerciseList(plan.workoutKey,"dayModalExList");
    },10);
  } else {
    $("dayModalExercises").innerHTML="";
  }

  $("dayModal").classList.add("show");
}
function closeDayModal(){ $("dayModal").classList.remove("show"); }

// ═══════════════════════════════════════════════════════════════
// SKIP/MOVE/ADJUST LOGIC
// ═══════════════════════════════════════════════════════════════
function openSkipMenu(){ $("skipModal").classList.add("show"); }
function closeSkipModal(){ $("skipModal").classList.remove("show"); $("skipAdvice").style.display="none"; }

const SKIP_ADVICE = {
  too_tired: {status:"RECOVERY",reason:"Слишком устал",advice:"Сегодня Recovery вместо тренировки. Сон — лучшее восстановление. Тренировка перенесена на следующий доступный день.",icon:"😴"},
  bad_sleep:  {status:"RECOVERY",reason:"Плохой сон (<6ч)",advice:"Тренировка перенесена. После плохого сна тяжёлая работа даёт мало результата и повышает риск травмы.",icon:"🌙"},
  port_day:   {status:"PORT_PUMP",reason:"Портовый день",advice:"Переведено в Port Pump — опциональная лёгкая тренировка 20–30 мин если будет время и силы после вахты.",icon:"⚓"},
  legs_sore:  {status:"RECOVERY",reason:"Болят ноги",advice:"Если болят ноги — тренировка низа переносится. Если сегодня верх — можно делать, но скажи себе честно.",icon:"🦵"},
  move:       {status:"MOVED_AWAY",reason:"Перенесено на следующий день",advice:"Тренировка перенесена на завтра.",icon:"📅"},
  skip:       {status:"SKIPPED",reason:"Пропущено",advice:"Тренировка пропущена. Это нормально, главное не пропускать системно.",icon:"✗"}
};

function applySkip(type){
  const today=getToday();
  const iso=isoDate(today);
  const plan=getTodayPlan();
  const info=SKIP_ADVICE[type];
  if(!info) return;

  setOverride(iso,{status:info.status,reason:info.reason,workoutKey:plan.workoutKey});

  // If moved, set override for tomorrow
  if(type==="move"){
    const tomorrow=addDays(today,1);
    const tIso=isoDate(tomorrow);
    setOverride(tIso,{status:"MOVED_HERE",reason:"Перенесено с вчера",workoutKey:plan.workoutKey});
  }

  const adv=$("skipAdvice");
  adv.style.display="block";
  adv.innerHTML=`${info.icon} <b>${info.advice}</b>`;

  setTimeout(()=>{
    closeSkipModal();
    renderAll();
    toast(info.icon+" "+info.reason);
  },1800);
}

function applySkipDirect(iso, type){
  if(type==="move"){ moveWorkoutToNextAvailable(iso); return; }
  if(type==="recovery"){ setRecoveryDay(iso); return; }
  const info=SKIP_ADVICE[type]||SKIP_ADVICE["skip"];
  setOverride(iso,{status:info.status,reason:info.reason});
  renderAll(); renderMonth();
  toast(info.icon+" "+info.reason);
}

function markDoneDay(iso){
  const d=new Date(iso+"T12:00:00");
  const arr=doneDates();
  const fd=fmtDate(d);
  if(!arr.includes(fd)) arr.push(fd);
  LS.set("doneWorkouts",JSON.stringify(arr));
  toast("Тренировка отмечена ✓");
  confetti();
  renderAll();
}

// ═══════════════════════════════════════════════════════════════
// READINESS CHECK
// ═══════════════════════════════════════════════════════════════
let readinessAnswers = {};
let currentWorkoutKey = null;

const READINESS_QS = [
  {
    key:"sleep", q:"Как спал?", sub:"Это важнее всего для роста мышц.",
    opts:[
      {icon:"😴", label:"7+ часов", val:2},
      {icon:"😐", label:"5–6 часов", val:0},
      {icon:"😵", label:"Меньше 5 часов", val:-3}
    ]
  },
  {
    key:"energy", q:"Энергия прямо сейчас?", sub:"Честный ответ — лучше чем переоценить.",
    opts:[
      {icon:"⚡", label:"Заряжен, готов работать", val:1},
      {icon:"🙂", label:"Нормально, справлюсь", val:0},
      {icon:"🥱", label:"Устал, тяжело", val:-2}
    ]
  },
  {
    key:"legs", q:"Болят ноги, колени или бёдра?", sub:"Особенно если вчера была нагрузка.",
    opts:[
      {icon:"✅", label:"Нет, всё хорошо", val:0, flag:false},
      {icon:"⚠️", label:"Немного, но терпимо", val:0, flag:false},
      {icon:"🚫", label:"Да, ноют", val:-1, flag:true}
    ]
  },
  {
    key:"shoulders", q:"Плечи, шея или спина?", sub:"Не работай через боль — не стоит.",
    opts:[
      {icon:"✅", label:"Нет, всё хорошо", val:0, flag:false},
      {icon:"⚠️", label:"Немного, но терпимо", val:0, flag:false},
      {icon:"🚫", label:"Да, ноют", val:-1, flag:true}
    ]
  }
];

function openReadinessCheck(){
  readinessAnswers = {};
  renderReadinessStep(0);
  $("readinessModal").classList.add("show");
}
function closeReadiness(){ $("readinessModal").classList.remove("show"); }

function renderReadinessStep(stepIdx){
  const pct = Math.round((stepIdx / READINESS_QS.length) * 100);
  $("readBar").style.width = pct + "%";

  if(stepIdx >= READINESS_QS.length){
    renderReadinessResult();
    return;
  }

  const q = READINESS_QS[stepIdx];
  $("readinessContent").innerHTML = `
    <div class="readQ">${stepIdx+1}. ${q.q}</div>
    <div class="readSub">${q.sub}</div>
    <div class="readOpts">
      ${q.opts.map((o,i) => `
        <div class="readOpt" onclick="answerReadiness('${q.key}', ${o.val}, ${o.flag||false}, ${stepIdx+1})">
          <span class="readIcon">${o.icon}</span>
          <span>${o.label}</span>
        </div>`).join("")}
    </div>`;
}

function answerReadiness(key, val, flag, nextStep){
  readinessAnswers[key] = {val, flag};
  renderReadinessStep(nextStep);
}

function evaluateReadiness(){
  let score = 0;
  let legFlag = false, shoulderFlag = false;
  for(const [k,v] of Object.entries(readinessAnswers)){
    score += v.val;
    if(k==="legs" && v.flag) legFlag = true;
    if(k==="shoulders" && v.flag) shoulderFlag = true;
  }

  const plan = getTodayPlan();
  let key = plan.workoutKey;
  const isLegDay = key==="LOWER_A"||key==="LOWER_B";
  const isUpperDay = key==="UPPER_A"||key==="UPPER_B";

  // Pain overrides (before score adjustment)
  if(legFlag && isLegDay) key = "UPPER_A";
  if(shoulderFlag && isUpperDay) key = "LOWER_A";

  // Score → intensity
  let level, icon, title, sub;
  if(score >= 2){
    level="heavy"; icon="🔥"; title="Полная тренировка";
    sub=`${WORKOUTS[key].title} · ${WORKOUTS[key].duration} мин`;
  } else if(score >= 0){
    level="medium"; icon="💪"; title="Средняя нагрузка";
    key = isLegDay ? "LOWER_B" : "MEDIUM";
    sub=`${WORKOUTS[key].title} · ${WORKOUTS[key].duration} мин`;
  } else if(score >= -2){
    level="light"; icon="⚡"; title="Короткий памп";
    key="PORT";
    sub="Port Pump · 28 мин · Лёгкий тонус";
  } else {
    level="rest"; icon="🔄"; title="Сегодня recovery";
    key="REST";
    sub="Мобилити 12 мин · Восстановление";
  }

  return {key, level, icon, title, sub, score};
}

function renderReadinessResult(){
  $("readBar").style.width="100%";
  const res = evaluateReadiness();
  const sleep = readinessAnswers.sleep;
  const legNote = readinessAnswers.legs?.flag ? "⚠️ Переключено на верх — ноги берегём." : "";
  const shdNote = readinessAnswers.shoulders?.flag ? "⚠️ Переключено на низ — плечи берегём." : "";

  $("readinessContent").innerHTML = `
    <div class="readResult ${res.level}">
      <div class="readResultIcon">${res.icon}</div>
      <div class="readResultTitle">${res.title}</div>
      <div class="readResultSub">${res.sub}</div>
      ${legNote ? `<div style="margin-top:8px;font-size:12px;color:#fcd34d">${legNote}</div>` : ""}
      ${shdNote ? `<div style="margin-top:8px;font-size:12px;color:#fcd34d">${shdNote}</div>` : ""}
    </div>
    ${sleep?.val === -3 ? `<div class="noteBox">⚠️ Меньше 5 часов сна. Тренировка возможна, но рост мышц будет ниже. Сегодня главное — не навредить.</div>` : ""}
    <div class="ctaRow" style="margin-top:14px">
      ${res.key === "REST"
        ? `<button class="secondary" style="flex:1" onclick="closeReadiness()">Понял, отдыхаю</button>`
        : `<button class="primary" style="flex:1" onclick="proceedWorkout('${res.key}')">Начать — ${res.title}</button>
           <button class="ghost" onclick="closeReadiness()">Отмена</button>`
      }
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
// SET LOGGING & PROGRESSION
// ═══════════════════════════════════════════════════════════════
function getSetLog(iso){
  return JSON.parse(LS.get("setlog_"+iso)||"{}");
}
function saveSetEntry(iso, wk, exName, setIdx, w, r){
  const log = getSetLog(iso);
  if(!log[wk]) log[wk]={};
  if(!log[wk][exName]) log[wk][exName]=[];
  log[wk][exName][setIdx]={w,r};
  LS.set("setlog_"+iso, JSON.stringify(log));
}

function getLastSets(exName){
  // Search back 60 days for last entry
  const today = getToday();
  for(let i=1;i<=60;i++){
    const d = addDays(today,-i);
    const iso = isoDate(d);
    const log = getSetLog(iso);
    for(const wk of Object.keys(log)){
      if(log[wk][exName] && log[wk][exName].length > 0){
        return {date:iso, sets:log[wk][exName]};
      }
    }
  }
  return null;
}

function progressionHint(exName, repsStr){
  const plan=progressionPlan(exName,repsStr);
  if(plan.state==="start") return null;
  return `${plan.label}: ${plan.detail}`;
}

// toggleSetDone is defined in Workout Engine Pro section.

// ═══════════════════════════════════════════════════════════════
// WORKOUT MODAL
// ═══════════════════════════════════════════════════════════════
function startWorkout(){ openReadinessCheck(); }

function proceedWorkout(key){
  closeReadiness();
  currentWorkoutKey = key;
  workoutStartedAt = new Date().toISOString();
  focusIdx = 0;
  focusSetIdx = 0;

  const w = WORKOUTS[key];
  if(!w){ toast(t2("Тренировка не найдена","Workout not found")); return; }

  $("modalTitle").textContent = `${w.title}: ${w.subtitle}`;
  $("modalSub").textContent = `${w.duration} мин · ${w.focus}`;
  $("workoutModal").classList.add("show");

  hydrateAllSetInputs();
  jumpToNextOpenSet(0);
  renderWorkoutEngine();
  resumeRestTimer();
}

let workoutStartedAt = null;
let restTimerEndAt = 0;
let restTimerSec = 90;
let focusIdx = 0;
let focusSetIdx = 0;

function getFocusExercise(){
  const exs=getEffectiveExercises(currentWorkoutKey);
  return {exs,e:exs[focusIdx]||exs[0]};
}

function closeWorkout(){
  $("workoutModal").classList.remove("show");
  if(timerInterval){ clearInterval(timerInterval); timerInterval=null; }
}

function getSkippedExercises(iso=todayIso()){
  return JSON.parse(LS.get("skippedExercises_"+iso)||"[]");
}
function saveSkippedExercises(arr,iso=todayIso()){
  LS.set("skippedExercises_"+iso, JSON.stringify([...new Set(arr)]));
}
function isExerciseSkipped(name){
  return getSkippedExercises().includes(name);
}
function setExerciseSkipped(name, reason="manual"){
  const arr=getSkippedExercises();
  if(!arr.includes(name)) arr.push(name);
  saveSkippedExercises(arr);
  const notes=JSON.parse(LS.get("skippedExerciseNotes_"+todayIso())||"{}");
  notes[name]={reason,at:new Date().toISOString()};
  LS.set("skippedExerciseNotes_"+todayIso(),JSON.stringify(notes));
}
function restoreSkippedExercise(name){
  saveSkippedExercises(getSkippedExercises().filter(x=>x!==name));
  const notes=JSON.parse(LS.get("skippedExerciseNotes_"+todayIso())||"{}");
  delete notes[name];
  LS.set("skippedExerciseNotes_"+todayIso(),JSON.stringify(notes));
}

function plannedSetCount(e){
  return Math.max(1, Math.min(parseInt(e?.sets)||1, 4));
}
function exerciseSavedSets(e){
  if(!currentWorkoutKey || !e) return [];
  const log=getSetLog(todayIso());
  return (log?.[currentWorkoutKey]?.[e.name]||[]).filter(s=>s&&s.w&&s.r);
}
function exerciseSetLog(e){
  if(!currentWorkoutKey || !e) return [];
  const log=getSetLog(todayIso());
  return log?.[currentWorkoutKey]?.[e.name] || [];
}
function workoutProgress(){
  const exs=getEffectiveExercises(currentWorkoutKey);
  const skipped=getSkippedExercises();
  const totalSets=exs.filter(e=>!skipped.includes(e.name)).reduce((sum,e)=>sum+plannedSetCount(e),0);
  const savedSets=exs.filter(e=>!skipped.includes(e.name)).reduce((sum,e)=>sum+exerciseSavedSets(e).length,0);
  const completedExercises=exs.filter(e=>skipped.includes(e.name) || exerciseSavedSets(e).length>=plannedSetCount(e)).length;
  const percent=totalSets ? Math.min(100, Math.round(savedSets/totalSets*100)) : 0;
  return {exs,skipped,totalSets,savedSets,completedExercises,percent,allDone: exs.length>0 && completedExercises>=exs.length};
}
function findNextOpenExercise(startIdx=0){
  const {exs,skipped}=workoutProgress();
  for(let i=startIdx;i<exs.length;i++){
    const e=exs[i];
    if(skipped.includes(e.name)) continue;
    if(exerciseSavedSets(e).length < plannedSetCount(e)) return i;
  }
  for(let i=0;i<startIdx;i++){
    const e=exs[i];
    if(skipped.includes(e.name)) continue;
    if(exerciseSavedSets(e).length < plannedSetCount(e)) return i;
  }
  return -1;
}
function jumpToNextOpenSet(startIdx=0){
  const idx=findNextOpenExercise(startIdx);
  if(idx>=0){
    focusIdx=idx;
    const {exs}=workoutProgress();
    const e=exs[focusIdx];
    const logs=exerciseSetLog(e);
    const max=plannedSetCount(e);
    let next=0;
    for(let i=0;i<max;i++){
      if(!logs[i] || !logs[i].w || !logs[i].r){ next=i; break; }
      next=i;
    }
    focusSetIdx=Math.min(next,max-1);
    return true;
  }
  return false;
}

function hydrateAllSetInputs(){
  const el=$("modalExercises"); if(!el || !currentWorkoutKey) return;
  const exs=getEffectiveExercises(currentWorkoutKey);
  el.innerHTML = exs.map((e,i)=>{
    const sets=plannedSetCount(e);
    const saved=exerciseSetLog(e);
    const skipped=isExerciseSkipped(e.name);
    const rows=Array.from({length:sets},(_,j)=>{
      const s=saved[j]||{};
      const done=!!(s.w&&s.r);
      return `<div class="miniSetRow ${done?"done":""}">
        <span>Set ${j+1}</span>
        <input class="setInp" type="number" inputmode="decimal" placeholder="kg" id="w_${i}_${j}" value="${escapeAttr(s.w||"")}" />
        <input class="setInp" type="number" inputmode="numeric" placeholder="reps" id="r_${i}_${j}" value="${escapeAttr(s.r||"")}" />
        <button class="tiny ${done?"primary":"secondary"}" onclick="toggleSetDone(this,${i},${j})">${done?"✓":"Save"}</button>
      </div>`;
    }).join("");
    return `<div class="miniExercise ${skipped?"skipped":""}">
      <div class="miniExerciseTop">
        <b>${i+1}. ${escapeAttr(isEn()?e.en:e.name)}</b>
        <span>${skipped?t2("пропущено","skipped"):`${exerciseSavedSets(e).length}/${sets}`}</span>
      </div>
      ${rows}
    </div>`;
  }).join("");
}

function renderWorkoutProgressHero(){
  const el=$("workoutProgressHero"); if(!el || !currentWorkoutKey) return;
  const w=WORKOUTS[currentWorkoutKey];
  const p=workoutProgress();
  el.innerHTML=`<div class="engineTopLine">
    <div><b>${p.savedSets}/${p.totalSets}</b><span>${t2("подходов записано","sets saved")}</span></div>
    <div><b>${p.completedExercises}/${p.exs.length}</b><span>${t2("упражнений","exercises")}</span></div>
    <div><b>${p.percent}%</b><span>${t2("готово","complete")}</span></div>
  </div>
  <div class="engineProgress"><span style="width:${p.percent}%"></span></div>
  <div class="engineMeta">${escapeAttr(w?.title||"")} · ${escapeAttr(w?.focus||"")} · ${new Date(workoutStartedAt||Date.now()).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</div>`;
}

function renderWorkoutEngine(){
  renderWorkoutProgressHero();
  renderFocusPanel();
  hydrateAllSetInputs();
  renderFinishSummaryPreview();
}

function renderFocusPanel(){
  const el=$("focusWorkoutPanel"); if(!el || !currentWorkoutKey) return;
  const completion=$("workoutCompletionPanel");
  if(completion) completion.innerHTML="";

  const p=workoutProgress();
  if(!p.exs.length){ el.innerHTML=""; return; }

  if(p.allDone){
    el.innerHTML=`<div class="focusPanel workoutCompleteHero">
      <div class="completeIcon">✓</div>
      <h3>${t2("План тренировки закрыт","Workout plan complete")}</h3>
      <p>${t2("Все упражнения выполнены или пропущены. Проверь итог и заверши тренировку.","All exercises are completed or skipped. Review the summary and finish the workout.")}</p>
      <div class="ctaRow">
        <button class="primary" onclick="finishWorkout()">${t2("Завершить тренировку","Finish workout")}</button>
        <button class="secondary" onclick="focusPrevExercise()">${t2("Вернуться к упражнениям","Back to exercises")}</button>
      </div>
    </div>`;
    renderWorkoutCompletionPreview();
    return;
  }

  if(isExerciseSkipped(p.exs[focusIdx]?.name)) jumpToNextOpenSet(focusIdx+1);
  const {exs,e}=getFocusExercise(); 
  if(!e){el.innerHTML="";return;}

  const sets=plannedSetCount(e);
  const existing=exerciseSetLog(e);
  focusSetIdx=Math.min(focusSetIdx,sets-1);
  const saved=exerciseSavedSets(e);
  const plan=progressionPlan(e.name,e.reps);
  const current=existing[focusSetIdx]||{};
  const rec=current.w || plan.nextWeight || "";
  const currentDone=!!(current.w && current.r);
  const exercisePercent=Math.min(100,Math.round(saved.length/sets*100));

  el.innerHTML=`<div class="focusPanel proFocus ${plan.state}">
    <div class="focusTop pro">
      <span>${focusIdx+1}/${exs.length}</span>
      <div><b>${escapeAttr(isEn()?e.en:e.name)}</b><small>${escapeAttr(isEn()?e.name:e.en)}</small></div>
      <em>${e.sets}×${e.reps}</em>
    </div>

    <div class="exerciseProgressLine"><span style="width:${exercisePercent}%"></span></div>

    ${motionDemo(e.name)}

    <div class="focusProgress">
      <b>${t2("Сет","Set")} ${focusSetIdx+1}/${sets}</b>
      <span>${saved.length}/${sets} ${t2("сохранено","saved")}</span>
    </div>

    <div class="recWeight ${plan.state}">
      <strong>${plan.nextWeight?plan.nextWeight+" kg":"—"}</strong>
      <div><b>${escapeAttr(plan.label||t2("Старт","Start"))}</b> · ${escapeAttr(plan.detail)}</div>
    </div>

    <div class="focusInputs proInputs">
      <label>${t2("Вес","Weight")}
        <div class="stepInput"><button onclick="adjustFocusField('focusWeight',-2)">−</button><input id="focusWeight" type="number" inputmode="decimal" value="${escapeAttr(rec)}" placeholder="kg"><button onclick="adjustFocusField('focusWeight',2)">+</button></div>
      </label>
      <label>${t2("Повторы","Reps")}
        <div class="stepInput"><button onclick="adjustFocusField('focusReps',-1,0)">−</button><input id="focusReps" type="number" inputmode="numeric" value="${escapeAttr(current.r||"")}" placeholder="reps"><button onclick="adjustFocusField('focusReps',1)">+</button></div>
      </label>
      <button class="primary saveSetBtn ${currentDone?"done":""}" onclick="focusDoneSet()">${currentDone?"✓ "+t2("Обновить сет","Update set"):"✓ "+t2("Сет готов","Done set")}</button>
    </div>

    <div class="focusText">${escapeAttr(isEn()?e.en:e.how)}</div>

    <div class="swapBar proSwap">
      ${replacementSelectHtml(e,focusIdx)}
      <button class="ghost tiny" onclick="focusSkipExercise()">${t2("Пропустить","Skip")}</button>
    </div>

    <div class="ctaRow proNav">
      <button class="secondary" onclick="focusPrevExercise()">← ${t2("Упр.","Exercise")}</button>
      <button class="secondary" onclick="focusPrevSet()">← ${t2("Сет","Set")}</button>
      <button class="secondary" onclick="focusNextSet()">${t2("Сет","Set")} →</button>
      <button class="primary" onclick="focusNextExercise()">${t2("Дальше","Next")} →</button>
    </div>
  </div>`;
}

function adjustFocusField(id,delta,min){
  const el=$(id); if(!el) return;
  const cur=parseFloat(el.value||"0")||0;
  const next=Math.max(min ?? 0, cur+delta);
  el.value=Number.isInteger(next)?String(next):next.toFixed(1);
}

function focusDoneSet(){
  if(!currentWorkoutKey) return;
  const {e}=getFocusExercise(); if(!e) return;
  const w=$("focusWeight")?.value||""; const r=$("focusReps")?.value||"";
  if(!w || !r){ toast(t2("Введи вес и повторы","Enter weight and reps")); return; }
  saveSetEntry(todayIso(), currentWorkoutKey, e.name, focusSetIdx, w, r);

  const rowW=$("w_"+focusIdx+"_"+focusSetIdx), rowR=$("r_"+focusIdx+"_"+focusSetIdx);
  if(rowW) rowW.value=w; if(rowR) rowR.value=r;

  startRest(restTimerSec || 90);
  const sets=plannedSetCount(e);
  if(focusSetIdx < sets-1){
    focusSetIdx++;
  }else{
    const found=jumpToNextOpenSet(focusIdx+1);
    if(!found) focusSetIdx=sets-1;
  }
  renderWorkoutEngine();
}

function focusNextSet(){ const {e}=getFocusExercise(); focusSetIdx=Math.min(plannedSetCount(e)-1,focusSetIdx+1); renderFocusPanel(); }
function focusPrevSet(){ focusSetIdx=Math.max(0,focusSetIdx-1); renderFocusPanel(); }
function focusNextExercise(show=true){ const {exs}=getFocusExercise(); focusIdx=Math.min(exs.length-1,focusIdx+1); focusSetIdx=0; jumpToNextOpenSet(focusIdx); if(show) renderWorkoutEngine(); }
function focusPrevExercise(){ focusIdx=Math.max(0,focusIdx-1); focusSetIdx=0; renderWorkoutEngine(); }
function focusNext(){ focusNextExercise(true); }
function focusPrev(){ focusPrevExercise(); }
function focusSkipExercise(){
  const {e}=getFocusExercise(); if(!e) return;
  if(!confirm(t2("Пропустить это упражнение?","Skip this exercise?"))) return;
  setExerciseSkipped(e.name,"manual skip");
  toast(t2("Упражнение пропущено","Exercise skipped"));
  jumpToNextOpenSet(focusIdx+1);
  renderWorkoutEngine();
}
function restoreCurrentExercise(){
  const {e}=getFocusExercise(); if(!e) return;
  restoreSkippedExercise(e.name);
  renderWorkoutEngine();
}

function toggleSetDone(btn, exIdx, setIdx){
  const iso = todayIso();
  const wInp = document.getElementById(`w_${exIdx}_${setIdx}`);
  const rInp = document.getElementById(`r_${exIdx}_${setIdx}`);
  const exs=getEffectiveExercises(currentWorkoutKey);
  const exName = btn.dataset.exname || exs[exIdx]?.name || "";
  const w = wInp?.value||"";
  const r = rInp?.value||"";
  if(!w || !r){ toast(t2("Введи вес и повторы","Enter weight and reps")); return; }
  saveSetEntry(iso, currentWorkoutKey, exName, setIdx, w, r);
  btn.classList.add("done");
  if(wInp) wInp.classList.add("done");
  if(rInp) rInp.classList.add("done");
  renderWorkoutEngine();
}

function startRest(sec){
  restTimerSec=sec;
  restTimerEndAt=Date.now() + sec*1000;
  LS.set("restTimerEndAt", String(restTimerEndAt));
  LS.set("restTimerSec", String(sec));
  resumeRestTimer();
}
function resumeRestTimer(){
  if(timerInterval) clearInterval(timerInterval);
  const saved=parseInt(LS.get("restTimerEndAt")||"0",10);
  if(saved && saved>Date.now()) restTimerEndAt=saved;
  const tick=()=>{
    const left=Math.max(0,Math.ceil((restTimerEndAt-Date.now())/1000));
    const m=Math.floor(left/60),s=left%60;
    if($("timer")) $("timer").textContent=left>0?`${pad(m)}:${pad(s)}`:"Ready";
    if($("timerLabel")) $("timerLabel").textContent=left>0?t2("Отдых","Rest"):`${t2("Готов к сету","Ready for set")}`;
    if(left<=0){
      clearInterval(timerInterval); timerInterval=null;
      LS.remove("restTimerEndAt");
      if(restTimerEndAt) toast(t2("Отдых завершён","Rest complete"));
      restTimerEndAt=0;
    }
  };
  tick();
  if(restTimerEndAt>Date.now()) timerInterval=setInterval(tick,500);
}
function stopRest(){
  if(timerInterval){ clearInterval(timerInterval); timerInterval=null; }
  restTimerEndAt=0;
  LS.remove("restTimerEndAt");
  if($("timer")) $("timer").textContent="Ready";
  if($("timerLabel")) $("timerLabel").textContent=t2("Готов к сету","Ready for set");
}

function buildWorkoutSummary(){
  const iso=todayIso(); const log=getSetLog(iso); const wk=currentWorkoutKey; const exs=getEffectiveExercises(wk||"");
  const skipped=getSkippedExercises(iso);
  const lines=exs.map(e=>{
    const sets=(log?.[wk]?.[e.name]||[]).filter(s=>s&&s.w&&s.r);
    const best=sets.length ? sets.slice().sort((a,b)=>(parseFloat(b.w||0)*parseInt(b.r||0))-(parseFloat(a.w||0)*parseInt(a.r||0)))[0] : null;
    return {name:e.name,en:e.en,sets,best,skipped:skipped.includes(e.name),plannedSets:plannedSetCount(e)};
  });
  const totalSets=lines.reduce((a,x)=>a+x.sets.length,0);
  const skippedCount=lines.filter(x=>x.skipped).length;
  const volume=lines.reduce((sum,x)=>sum+x.sets.reduce((s,set)=>s+(parseFloat(set.w||0)*parseInt(set.r||0)),0),0);
  return {iso,workoutKey:wk,title:WORKOUTS[wk]?.title||wk,totalSets,skippedCount,volume:Math.round(volume),lines,skipped,startedAt:workoutStartedAt,finishedAt:new Date().toISOString()};
}
function buildWorkoutSummaryDraft(){ return buildWorkoutSummary(); }
function saveWorkoutSummary(){
  const summary=buildWorkoutSummary();
  const all=JSON.parse(LS.get("workoutSummaries")||"[]");
  const filtered=all.filter(x=>x.iso!==summary.iso || x.workoutKey!==summary.workoutKey);
  filtered.push(summary);
  LS.set("workoutSummaries",JSON.stringify(filtered.slice(-30)));
  return summary;
}
function renderWorkoutCompletionPreview(){
  const el=$("workoutCompletionPanel"); if(!el || !currentWorkoutKey) return;
  const summary=buildWorkoutSummaryDraft();
  el.innerHTML=`<div class="completionPreview">
    <b>${t2("Итог перед завершением","Pre-finish summary")}</b>
    <div class="engineTopLine compact">
      <div><b>${summary.totalSets}</b><span>${t2("подходов","sets")}</span></div>
      <div><b>${summary.volume}</b><span>kg × reps</span></div>
      <div><b>${summary.skippedCount}</b><span>${t2("пропущено","skipped")}</span></div>
    </div>
  </div>`;
}
function renderFinishSummaryPreview(){
  const el=$("finishSummaryPreview"); if(!el || !currentWorkoutKey) return;
  const summary=buildWorkoutSummaryDraft();
  if(!summary.totalSets){
    el.textContent=t2("Запиши хотя бы один сет, потом завершай тренировку.","Save at least one set before finishing the workout.");
    return;
  }
  const top=summary.lines.filter(x=>x.sets.length).slice(0,4).map(x=>`${isEn()?x.en:x.name}: ${x.sets.length}/${x.plannedSets}`).join(" · ");
  el.innerHTML=`<b>${t2("Текущий итог","Current summary")}: ${summary.totalSets} ${t2("подходов","sets")} · ${summary.volume} kg×reps</b><br>${escapeAttr(top)}`;
}
function finishWorkout(){
  const draft=buildWorkoutSummaryDraft();
  if(!draft.totalSets && !confirm(t2("Нет записанных сетов. Всё равно завершить?","No saved sets. Finish anyway?"))) return;
  const summary=saveWorkoutSummary();
  markDone();
  stopRest();
  closeWorkout();
  toast(`${t2("Тренировка завершена","Workout finished")}: ${summary.totalSets} ${t2("подходов","sets")} · ${summary.volume} kg×reps`);
  renderWorkoutSummaries();
  renderExerciseProgressDashboard();
}
function workoutSummaries(){ return JSON.parse(LS.get("workoutSummaries")||"[]"); }
function renderWorkoutSummaries(){
  const latest=workoutSummaries().slice(-8).reverse();
  const lastEl=$("lastWorkoutSummary");
  const histEl=$("workoutSummaryHistory");
  const render=s=>`<div class="summaryLine proSummary">
    <div><b>${escapeAttr(s.title||s.workoutKey)}</b><small>${s.iso} · ${s.totalSets} ${t2("подходов","sets")} · ${s.volume||0} kg×reps</small></div>
    <span>${s.skippedCount||0} ${t2("skip","skip")}</span>
  </div>`;
  if(lastEl) lastEl.innerHTML=latest[0]?render(latest[0]):`<p style="color:var(--muted)">${t2("Пока нет завершённых тренировок.","No completed workouts yet.")}</p>`;
  if(histEl) histEl.innerHTML=latest.length?latest.map(render).join(""):`<p style="color:var(--muted)">${t2("История пока пустая.","History is empty.")}</p>`;
}

// ═══════════════════════════════════════════════════════════════
// MARK DONE
// ═══════════════════════════════════════════════════════════════
function markDone(){
  const today=fmtDate(getToday());
  const arr=doneDates();
  if(!arr.includes(today)) arr.push(today);
  LS.set("doneWorkouts",JSON.stringify(arr));
  toast("Тренировка выполнена! 💪");
  confetti();
  renderAll();
}

// ═══════════════════════════════════════════════════════════════
// SUPPLEMENTS
// ═══════════════════════════════════════════════════════════════
function toggleSupplement(name){
  const today=fmtDate(getToday());
  const key="supp_"+today;
  const data=JSON.parse(LS.get(key)||"{}");
  data[name]=!data[name];
  LS.set(key,JSON.stringify(data));
  toast(`${name} ${data[name]?"✓ принято":"отменено"}`);
}

// ═══════════════════════════════════════════════════════════════
// PROGRESS
// ═══════════════════════════════════════════════════════════════
function saveWeight(){
  const v=$("weightInput").value.trim().replace(",",".");
  if(!v) return;
  const weight=Number(v);
  if(!Number.isFinite(weight) || weight <= 0 || weight > 400){
    toast(t2("Введи корректный вес","Enter a valid weight"));
    return;
  }
  const arr=weightLog();
  arr.push({date:fmtDate(getToday()),weight:String(weight)});
  LS.set("weightLog",JSON.stringify(arr));
  $("weightInput").value="";
  toast("Вес сохранён");
  renderAll();
}
function saveStrength(){
  const v=$("strengthInput").value.trim();
  if(!v) return;
  const arr=strengthLog();
  arr.push({date:fmtDate(getToday()),note:v});
  LS.set("strengthLog",JSON.stringify(arr));
  $("strengthInput").value="";
  toast("Запись добавлена");
  renderHistory();
}

// ═══════════════════════════════════════════════════════════════
// WORKOUT PREVIEW (workout tab)
// ═══════════════════════════════════════════════════════════════
function renderWorkoutPreview(){
  const plan=getTodayPlan();
  renderExerciseList(plan.workoutKey,"workoutPreview");
}

// ═══════════════════════════════════════════════════════════════
// WEIGHT CHART
// ═══════════════════════════════════════════════════════════════
function renderWeightChart(){
  const el = $("weightChart");
  if(!el) return;
  const log = weightLog();
  const s = getSettings();
  const target = s.targetWeight || 88;
  const startW = s.startWeight || 82;

  if(log.length < 2){
    el.innerHTML = `<div class="chartEmpty">Добавь хотя бы 2 записи веса,<br>чтобы увидеть график.</div>`;
    return;
  }

  const pts = log.slice(-20).map(e=>({
    d:e.date,
    w:parseFloat(e.weight)||0
  }));

  const W=800, H=140, padL=42, padR=14, padT=18, padB=28;
  const chartW=W-padL-padR, chartH=H-padT-padB;
  const allW=[...pts.map(p=>p.w), target, startW];
  const minW=Math.min(...allW)-0.5;
  const maxW=Math.max(...allW)+0.5;
  const scaleX=i=>(i/(pts.length-1||1))*chartW+padL;
  const scaleY=v=>padT + (1-(v-minW)/(maxW-minW||1))*chartH;

  const linePoints = pts.map((p,i)=>`${scaleX(i)},${scaleY(p.w)}`).join(" ");
  const areaPoints = `${padL},${padT+chartH} ` + pts.map((p,i)=>`${scaleX(i)},${scaleY(p.w)}`).join(" ") + ` ${scaleX(pts.length-1)},${padT+chartH}`;
  const goalY = scaleY(target);
  const startY = scaleY(startW);
  const currW = pts.at(-1).w;
  const currY = scaleY(currW);

  // Y axis labels (3 labels)
  const yLabels = [minW+0.5, (minW+maxW)/2, maxW-0.5].map(v=>({v, y:scaleY(v)}));

  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <defs>
      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#f6c453"/>
        <stop offset="100%" stop-color="#ff8f3d"/>
      </linearGradient>
      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f6c453" stop-opacity=".18"/>
        <stop offset="100%" stop-color="#f6c453" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <!-- Grid lines -->
    ${yLabels.map(({v,y})=>`
      <line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
      <text x="${padL-6}" y="${y+4}" text-anchor="end" font-size="10" fill="#8da2b7" font-family="-apple-system,sans-serif">${v.toFixed(1)}</text>`).join("")}
    <!-- Goal line -->
    <line x1="${padL}" y1="${goalY}" x2="${W-padR}" y2="${goalY}" stroke="#4ade80" stroke-width="1.5" stroke-dasharray="5 3" opacity=".6"/>
    <text x="${W-padR+2}" y="${goalY+4}" font-size="10" fill="#4ade80" font-family="-apple-system,sans-serif">цель</text>
    <!-- Start line -->
    <line x1="${padL}" y1="${startY}" x2="${W-padR}" y2="${startY}" stroke="#8da2b7" stroke-width="1" stroke-dasharray="3 3" opacity=".4"/>
    <!-- Area fill -->
    <polygon points="${areaPoints}" fill="url(#areaGrad)"/>
    <!-- Line -->
    <polyline points="${linePoints}" stroke="url(#lineGrad)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Dots -->
    ${pts.map((p,i)=>`<circle cx="${scaleX(i)}" cy="${scaleY(p.w)}" r="${i===pts.length-1?5:3}" fill="${i===pts.length-1?"#f6c453":"#8fb2d8"}" stroke="#0b1622" stroke-width="2"/>`).join("")}
    <!-- Current weight label -->
    <text x="${scaleX(pts.length-1)}" y="${scaleY(currW)-10}" text-anchor="middle" font-size="12" font-weight="800" fill="#ffe29a" font-family="-apple-system,sans-serif">${currW}кг</text>
    <!-- X axis dates (first and last) -->
    <text x="${padL}" y="${H-6}" text-anchor="start" font-size="9" fill="#8da2b7" font-family="-apple-system,sans-serif">${escapeAttr(pts[0].d.slice(0,5))}</text>
    <text x="${scaleX(pts.length-1)}" y="${H-6}" text-anchor="end" font-size="9" fill="#8da2b7" font-family="-apple-system,sans-serif">${escapeAttr(pts.at(-1).d.slice(0,5))}</text>
    <!-- Delta label -->
    <text x="${W/2}" y="${H-6}" text-anchor="middle" font-size="10" fill="${currW>=startW?"#4ade80":"#fb7185"}" font-family="-apple-system,sans-serif">${currW>=startW?"+":""}${(currW-startW).toFixed(1)}кг от старта</text>
  </svg>`;
}


// ═══════════════════════════════════════════════════════════════
// SHIPFIT v0.6.0 LOCAL RC: workout pro, progression, smart calendar, data safety
// ═══════════════════════════════════════════════════════════════
function loginLocalProfile(id,name){
  const profileId = knownProfileId(id) ? id : DEFAULT_PROFILE;
  rawSet("shipfitProfile", profileId);
  rawSet("shipfitProfileName", name || PROFILE_DEFAULTS[profileId]?.name || profileId);
  rawSet("shipfitPendingCloudProfile", profileId);
  ensureProfileLanguage(profileId);
  setupLanguage();
  showLoginState();
  renderCloudStatus();
  renderAll();
  toast(t2("Аккаунт открыт","Account opened"));
}
async function logoutProfile(){
  const client=initSupabaseClient();
  if(client) await client.auth.signOut();
  rawRemove("shipfitProfile");
  rawRemove("shipfitProfileName");
  rawRemove("shipfitPendingCloudProfile");
  clearSupabaseUser();
  setupLanguage();
  showLoginState();
  translateNode(document.body);
  renderCloudStatus();
  toast(t2("Вы вышли","Logged out"));
}
function showLoginState(){
  const logged = !!rawGet("shipfitProfile");
  const login = $("loginScreen");
  if(login) login.classList.toggle("hide", logged);
  const app = document.querySelector(".app");
  const nav = document.querySelector(".nav");
  if(app) app.classList.toggle("locked", !logged);
  if(nav) nav.classList.toggle("locked", !logged);
  const chip=$("profileChip");
  if(chip) chip.textContent = logged ? currentProfileName() : t2("Войти","Login");
  const loginStatus=$("loginStatus");
  if(loginStatus) loginStatus.textContent = logged ? t2("Сессия активна. Повторный вход не нужен.","Session is active. You stay logged in.") : t2("Введите email и получите одноразовую ссылку.","Enter email to receive a one-time login link.");
}
function saveSupabaseConfig(){
  const activeScope = document.querySelector("#settings.section.active") || document.querySelector("#loginScreen:not(.hide)") || document;
  const urlEl = activeScope.querySelector("[data-supabase-url]") || $("supabaseUrl");
  const anonEl = activeScope.querySelector("[data-supabase-anon]") || $("supabaseAnon");
  const url=urlEl?.value?.trim()||"";
  const anonKey=anonEl?.value?.trim()||"";
  rawSet("shipfitSupabaseConfig", JSON.stringify({url,anonKey,table:"shipfit_user_history"}));
  supabaseClient=null;
  loadSupabaseConfigToInputs();
  renderCloudStatus();
  toast(t2("Supabase config сохранён. Теперь отправь Magic Link или войди в Supabase.","Supabase config saved. Now send Magic Link or sign in with Supabase."));
}
function loadSupabaseConfigToInputs(){
  const cfg=getSupabaseConfig();
  document.querySelectorAll("[data-supabase-url],#supabaseUrl").forEach(el=>el.value=cfg.url||"");
  document.querySelectorAll("[data-supabase-anon],#supabaseAnon").forEach(el=>el.value=cfg.anonKey||"");
  document.querySelectorAll("[data-supabase-email],#settingsLoginEmail,#loginEmail").forEach(el=>{ if(!el.value) el.value=rawGet("shipfitLastEmail")||""; });
}
async function loginSupabase(){
  return sendMagicLink();
}
async function sendMagicLink(){
  const email=($("settingsLoginEmail")?.value || $("loginEmail")?.value || rawGet("shipfitLastEmail") || "").trim();
  const activeProfile = knownProfileId(rawGet("shipfitProfile")) ? rawGet("shipfitProfile") : DEFAULT_PROFILE;
  rawSet("shipfitPendingCloudProfile", activeProfile);
  const client=initSupabaseClient();
  if(!supabaseLibraryLoaded()){ toast(t2("Supabase client library не загружена","Supabase client library is not loaded")); return; }
  if(!client){ toast(t2("Сначала укажи Supabase URL и anon key","Add Supabase URL and anon key first")); return; }
  if(!email){ toast(t2("Введите email","Enter email")); return; }
  const redirectTo = window.location.origin + window.location.pathname;
  const {error}=await client.auth.signInWithOtp({
    email,
    options:{
      emailRedirectTo: redirectTo,
      shouldCreateUser: false
    }
  });
  if(error){
    toast(error.message);
    return;
  }
  rawSet("shipfitLastEmail", email);
  loadSupabaseConfigToInputs();
  if($("loginStatus")) $("loginStatus").textContent=t2("Ссылка отправлена. Открой email на этом устройстве.","Login link sent. Open your email on this device.");
  renderCloudStatus();
  toast(t2("Magic Link отправлен","Magic Link sent"));
}
async function initAuthSession(){
  const client=initSupabaseClient();
  if(!client){
    showLoginState();
    renderCloudStatus();
    return;
  }
  const {data}=await client.auth.getSession();
  const session=data?.session;
  if(session?.user){
    rememberSupabaseUser(session.user);
    ensureActiveProfile();
    showLoginState();
    await pullFromCloud(true);
    renderAll();
  }else{
    showLoginState();
    renderCloudStatus();
  }
}
function collectBackupData(){
  const data={};
  LS.keys().forEach(k=>{ data[k]=LS.get(k); });
  return {app:"ShipFit",version:APP_VERSION,profile:cloudProfileId(),profileName:currentProfileName(),deviceId:getDeviceId(),exportedAt:new Date().toISOString(),data};
}
function restoreBackupData(payload){
  if(!payload || payload.app !== "ShipFit" || !payload.data) throw new Error("Invalid ShipFit backup");
  Object.entries(payload.data).forEach(([k,v])=>LS.set(k,v));
}
function exportBackup(){
  const payload=collectBackupData();
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=`shipfit_backup_${cloudProfileId()}_${todayIso()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  rawSet("shipfitLastBackupAt", new Date().toISOString());
  renderBackupStatus();
  toast(t2("Backup скачан","Backup downloaded"));
}
function importBackup(event){
  const file=event.target.files?.[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{ restoreBackupData(JSON.parse(reader.result)); renderAll(); toast(t2("Backup восстановлен","Backup restored")); }
    catch(e){ toast(t2("Ошибка импорта","Import error")+": "+e.message); }
  };
  reader.readAsText(file);
  event.target.value="";
}
function renderCloudStatus(){
  const el=$("syncStatus");
  if(!el) return;
  const cfgReady = supabaseConfigReady();
  const libReady = supabaseLibraryLoaded();
  const email = rawGet("shipfitSupabaseEmail") || rawGet("shipfitLastEmail") || "";
  const lastSync = rawGet("shipfitLastCloudSyncAt");
  const lastPull = rawGet("shipfitLastCloudPullAt");
  let text = t2("Supabase не подключён","Supabase is not connected");
  if(!libReady) text = t2("Supabase client library не загружена","Supabase client library is not loaded");
  else if(!cfgReady) text = t2("Supabase config не сохранён","Supabase config is not saved");
  else if(rawGet("shipfitSupabaseUserId")) text = `${t2("Supabase сессия активна","Supabase session active")}: ${email || "user"}`;
  else if(email) text = `${t2("Magic Link email","Magic Link email")}: ${email}`;
  if(lastSync) text += ` · ${t2("Sync","Sync")}: ${new Date(lastSync).toLocaleString()}`;
  if(lastPull) text += ` · ${t2("Pull","Pull")}: ${new Date(lastPull).toLocaleString()}`;
  el.textContent=text;
}
async function syncToCloud(){
  const client=initSupabaseClient();
  if(!supabaseLibraryLoaded()){ toast(t2("Supabase client library не загружена","Supabase client library is not loaded")); return; }
  if(!client){ toast(t2("Supabase не настроен","Supabase not configured")); return; }
  const {data:userData}=await client.auth.getUser();
  const user=userData?.user;
  if(!user){ toast(t2("Сначала login через Supabase","Login with Supabase first")); return; }
  const profileId = cloudProfileId();
  if(!knownProfileId(profileId)){ toast(t2("Cloud sync доступен только для профилей Daniil и Second.","Cloud sync is available only for Daniil and Second profiles.")); return; }
  const cfg=getSupabaseConfig();
  const payload=collectBackupData();
  const payloadSize = new Blob([JSON.stringify(payload)]).size;
  if(payloadSize > 4_500_000 && !confirm(t2("Backup большой. Продолжить sync?","Backup is large. Continue sync?"))) return;
  const row={
    user_id:user.id,
    profile_id:profileId,
    app_version:APP_VERSION,
    device_id:getDeviceId(),
    data:payload,
    updated_at:new Date().toISOString()
  };
  const {error}=await client.from(cfg.table).upsert(row,{onConflict:"user_id,profile_id"});
  if(error){ toast(error.message); return; }
  rawSet("shipfitLastCloudSyncAt", new Date().toISOString());
  renderCloudStatus();
  toast(t2("Sync complete","Sync complete"));
}
async function pullFromCloud(silent=false){
  const client=initSupabaseClient();
  if(!client){ if(!silent) toast(t2("Supabase не настроен","Supabase not configured")); return; }
  const {data:userData}=await client.auth.getUser();
  const user=userData?.user;
  if(!user){ if(!silent) toast(t2("Сначала login через Supabase","Login with Supabase first")); return; }
  const cfg=getSupabaseConfig();
  const profileId = cloudProfileId();
  const {data,error}=await client.from(cfg.table).select("data,updated_at,app_version,device_id").eq("user_id",user.id).eq("profile_id",profileId).maybeSingle();
  if(error){ toast(error.message); return; }
  if(data?.data){
    const hasLocalData = LS.keys().some(k=>!['shipfitLang'].includes(k));
    if(hasLocalData && !silent && !confirm(t2("Загрузка из Supabase заменит локальные данные текущего профиля. Продолжить?","Pulling from Supabase will replace local data for the current profile. Continue?"))) return;
    restoreBackupData(data.data);
    rawSet("shipfitLastCloudPullAt", new Date().toISOString());
    renderCloudStatus();
    if($("syncStatus")) $("syncStatus").textContent=t2("Данные загружены из Supabase","Pulled from Supabase");
    if(!silent) toast(t2("Cloud data loaded","Cloud data loaded"));
  }
  else if(!silent) toast(t2("Cloud backup не найден","No cloud backup found"));
}

function recoveryLog(){ return JSON.parse(LS.get("recoveryLog")||"{}"); }
function nutritionLog(){ return JSON.parse(LS.get("nutritionLog")||"{}"); }
function saveRecovery(){
  const log=recoveryLog();
  log[todayIso()]={sleep:$("recSleep").value,fatigue:$("recFatigue").value,soreness:$("recSoreness").value,note:$("recNote").value,updatedAt:new Date().toISOString()};
  LS.set("recoveryLog",JSON.stringify(log));
  renderRecovery();
  toast(t2("Recovery сохранён","Recovery saved"));
}
function recoveryScore(r){
  if(!r) return 0;
  let score=0;
  if(r.sleep==="bad") score+=2; if(r.sleep==="ok") score+=1;
  if(r.fatigue==="high") score+=2; if(r.fatigue==="medium") score+=1;
  if(r.soreness==="high") score+=2; if(r.soreness==="medium") score+=1;
  if((r.note||"").trim()) score+=1;
  return score;
}
function renderRecovery(){
  const r=recoveryLog()[todayIso()]||{};
  if($("recSleep")) $("recSleep").value=r.sleep||"good";
  if($("recFatigue")) $("recFatigue").value=r.fatigue||"low";
  if($("recSoreness")) $("recSoreness").value=r.soreness||"low";
  if($("recNote")) $("recNote").value=r.note||"";
  const score=recoveryScore(r);
  const advice= score>=5 ? t2("Красный день: лучше recovery / mobility only.","Red day: recovery or mobility only.") : score>=3 ? t2("Жёлтый день: снизь вес, меньше подходов.","Yellow day: reduce load and volume.") : t2("Зелёный день: можно тренироваться по плану.","Green day: train as planned.");
  if($("recoveryAdvice")) $("recoveryAdvice").textContent=advice;
}
function applyRecoveryAdvice(){
  const r=recoveryLog()[todayIso()]||{};
  const score=recoveryScore(r);
  if(score>=5) applySkip("too_tired");
  else if(score>=3) toast(t2("Работай легче: -1 подход или -10% вес","Go lighter: -1 set or -10% load"));
  else toast(t2("Можно тренироваться по плану","Train as planned"));
}
function saveNutrition(){
  const log=nutritionLog();
  log[todayIso()]={protein:$("nutProtein").value,water:$("nutWater").value,calories:$("nutCalories").value,note:$("nutNote").value,creatine:$("nutCreatine").checked,omega:$("nutOmega").checked,multi:$("nutMulti").checked,ashwa:$("nutAshwa").checked,updatedAt:new Date().toISOString()};
  LS.set("nutritionLog",JSON.stringify(log));
  renderNutrition();
  toast(t2("Nutrition сохранён","Nutrition saved"));
}
function renderNutrition(){
  const n=nutritionLog()[todayIso()]||{};
  if($("nutProtein")) $("nutProtein").value=n.protein||"";
  if($("nutWater")) $("nutWater").value=n.water||"";
  if($("nutCalories")) $("nutCalories").value=n.calories||"enough";
  if($("nutNote")) $("nutNote").value=n.note||"";
  ["Creatine","Omega","Multi","Ashwa"].forEach(k=>{ const el=$("nut"+k); if(el) el.checked=!!n[k.toLowerCase()]; });
  const protein=parseFloat(n.protein||0), water=parseFloat(n.water||0);
  const msg=[];
  msg.push(protein>=150?t2("Protein OK","Protein OK"):t2("Protein низко","Protein low"));
  msg.push(water>=2.5?t2("Water OK","Water OK"):t2("Water низко","Water low"));
  if(n.calories==="low") msg.push(t2("Добавь углеводы","Add carbs"));
  if($("nutritionSummary")) $("nutritionSummary").textContent=msg.join(" · ");
}

function allExerciseDefs(){
  const map=new Map();
  Object.values(WORKOUTS).forEach(w=>w.exercises.forEach(e=>{ if(!map.has(e.name)) map.set(e.name,e); }));
  return map;
}
function exerciseSwaps(){ return JSON.parse(LS.get("exerciseSwaps")||"{}"); }
function setExerciseSwap(original, replacement){
  const sw=exerciseSwaps();
  if(!replacement || replacement===original) delete sw[original]; else sw[original]=replacement;
  LS.set("exerciseSwaps",JSON.stringify(sw));
  toast(t2("Упражнение заменено","Exercise replaced"));
  renderAll();
  if($("workoutModal")?.classList.contains("show") && currentWorkoutKey) proceedWorkout(currentWorkoutKey);
}
function replacementOptions(original){
  const defs=allExerciseDefs();
  const orig=defs.get(original);
  const list=[...defs.values()].filter(e=>e.name!==original);
  const preferred=list.filter(e=>e.equipment===orig?.equipment || e.muscles===orig?.muscles || e.en.toLowerCase().includes((orig?.en||"").split(" ")[0].toLowerCase()));
  return (preferred.length?preferred:list).slice(0,8);
}
function getEffectiveExercises(key){
  const w=WORKOUTS[key]; if(!w) return [];
  const defs=allExerciseDefs(); const sw=exerciseSwaps();
  return w.exercises.map(e=>sw[e.name] && defs.get(sw[e.name]) ? {...defs.get(sw[e.name]), originalName:e.name, replaced:true} : e);
}
function replacementSelectHtml(e,i){
  const opts=replacementOptions(e.originalName||e.name);
  return `<select class="swapSelect" onchange="setExerciseSwap('${escapeAttr(e.originalName||e.name)}', this.value)"><option value="">${t2("Заменить упражнение","Replace exercise")}</option>${opts.map(o=>`<option value="${escapeAttr(o.name)}">${escapeAttr(isEn()?o.en:o.name)}</option>`).join("")}</select>${e.replaced?`<button class="ghost tiny" onclick="setExerciseSwap('${escapeAttr(e.originalName)}','')">${t2("Вернуть","Restore")}</button>`:""}`;
}

function parseRepRange(repsStr){
  const nums=String(repsStr||"").match(/\d+/g)||[];
  const lower=parseInt(nums[0]||"8",10);
  const upper=parseInt(nums[nums.length-1]||nums[0]||"12",10);
  return {lower,upper};
}
function progressionPlan(exName,repsStr){
  const last=getLastSets(exName);
  if(!last) return {state:"start",nextWeight:"",label:t2("Стартовый вес","Start weight"),detail:t2("Истории пока нет. Начни с комфортного веса.","No history yet. Start with a comfortable weight.")};
  const sets=last.sets.filter(s=>s&&s.w&&s.r).map(s=>({w:parseFloat(s.w),r:parseInt(s.r,10)})).filter(s=>Number.isFinite(s.w)&&Number.isFinite(s.r));
  if(!sets.length) return {state:"start",nextWeight:"",label:t2("Стартовый вес","Start weight"),detail:t2("Истории пока нет. Начни с комфортного веса.","No valid set history yet.")};
  const {lower,upper}=parseRepRange(repsStr);
  const base=sets[0].w;
  const allHitUpper=sets.every(s=>s.r>=upper);
  const avgReps=sets.reduce((a,s)=>a+s.r,0)/sets.length;
  const best=sets.slice().sort((a,b)=>(b.w*b.r)-(a.w*a.r))[0];
  const repsText=sets.map(s=>`${s.w}×${s.r}`).join(" / ");
  if(allHitUpper){
    const next=(base+2).toFixed(0);
    return {state:"increase",nextWeight:next,label:t2("+2 кг","+2 kg"),detail:t2(`Прошлый раз: ${repsText}. Все сеты достигли ${upper} повторов.`, `Last time: ${repsText}. All sets hit ${upper} reps.`),best};
  }
  if(avgReps < lower){
    const next=Math.max(0,base-2).toFixed(0);
    return {state:"deload",nextWeight:next,label:t2("Снизить","Reduce"),detail:t2(`Прошлый раз: ${repsText}. Средние повторы ниже диапазона ${lower}–${upper}.`, `Last time: ${repsText}. Average reps are below ${lower}–${upper}.`),best};
  }
  return {state:"repeat",nextWeight:base.toFixed(0),label:t2("Повторить вес","Repeat weight"),detail:t2(`Прошлый раз: ${repsText}. Оставь вес и добери повторы.`, `Last time: ${repsText}. Keep the weight and add reps.`),best};
}
function suggestedWeight(exName,repsStr){
  const p=progressionPlan(exName,repsStr);
  return p.nextWeight||"";
}
function allSetHistory(){
  const rows=[];
  LS.keys().filter(k=>k.startsWith("setlog_")).forEach(k=>{
    const iso=k.replace("setlog_","");
    let log={}; try{log=JSON.parse(LS.get(k)||"{}")}catch{}
    Object.entries(log).forEach(([wk,exs])=>Object.entries(exs||{}).forEach(([name,sets])=>{
      (sets||[]).forEach((s,idx)=>{ if(s&&s.w&&s.r) rows.push({iso,wk,name,setIdx:idx,w:parseFloat(s.w),r:parseInt(s.r)}); });
    }));
  });
  return rows.sort((a,b)=>a.iso.localeCompare(b.iso));
}
function renderExerciseProgressDashboard(){
  const el=$("exerciseProgressDashboard"); if(!el) return;
  const rows=allSetHistory();
  if(!rows.length){ el.innerHTML=`<p style="color:var(--muted)">${t2("Пока нет записей подходов.","No set history yet.")}</p>`; return; }
  const grouped={}; rows.forEach(r=>{ (grouped[r.name] ||= []).push(r); });
  const defs=allExerciseDefs();
  const cards=Object.entries(grouped).map(([name,arr])=>{
    const lastDate=arr.at(-1).iso;
    const last=arr.filter(x=>x.iso===lastDate);
    const best=arr.slice().sort((a,b)=>(b.w*b.r)-(a.w*a.r))[0];
    const first=arr[0];
    const def=defs.get(name)||{};
    const plan=progressionPlan(name,def.reps);
    const lastStr=last.map(x=>`${x.w}×${x.r}`).join(" / ");
    const trend=((best.w*best.r)-(first.w*first.r));
    return `<div class="progressExercise ${plan.state}"><div><b>${escapeAttr(isEn()?def.en||name:name)}</b><small>${lastDate} · ${escapeAttr(lastStr)}</small><small>${t2("Тренд","Trend")}: ${trend>=0?"+":""}${trend.toFixed(0)} volume points</small></div><div><span>${t2("Лучший","Best")}: ${best.w}×${best.r}</span><strong>${t2("Next","Next")}: ${plan.nextWeight||"—"}${plan.nextWeight?" kg":""}</strong><em>${escapeAttr(plan.label)}</em></div></div>`;
  }).join("");
  el.innerHTML=cards;
}


// ═══════════════════════════════════════════════════════════════
// v0.9.0 PROGRESS INTELLIGENCE
// ═══════════════════════════════════════════════════════════════
function getLastNDaysSetRows(days=7){
  const out=[];
  const today=getToday();
  for(let i=0;i<days;i++){
    const iso=isoDate(addDays(today,-i));
    const log=getSetLog(iso);
    Object.entries(log||{}).forEach(([wk,exs])=>{
      Object.entries(exs||{}).forEach(([name,sets])=>{
        (sets||[]).forEach((s,idx)=>{
          const w=parseFloat(s?.w);
          const r=parseInt(s?.r,10);
          if(Number.isFinite(w)&&Number.isFinite(r)) out.push({iso,wk,name,setIdx:idx,w,r,volume:w*r});
        });
      });
    });
  }
  return out.sort((a,b)=>a.iso.localeCompare(b.iso));
}
function getWorkoutDatesWithSets(days=7){
  return [...new Set(getLastNDaysSetRows(days).map(r=>r.iso))].sort();
}
function weeklyProgressStats(days=7){
  const rows=getLastNDaysSetRows(days);
  const prevRows=(()=>{
    const out=[]; const today=getToday();
    for(let i=days;i<days*2;i++){
      const iso=isoDate(addDays(today,-i));
      const log=getSetLog(iso);
      Object.entries(log||{}).forEach(([wk,exs])=>Object.entries(exs||{}).forEach(([name,sets])=>(sets||[]).forEach((s,idx)=>{
        const w=parseFloat(s?.w), r=parseInt(s?.r,10);
        if(Number.isFinite(w)&&Number.isFinite(r)) out.push({iso,wk,name,setIdx:idx,w,r,volume:w*r});
      })));
    }
    return out;
  })();
  const totalVolume=rows.reduce((a,r)=>a+r.volume,0);
  const prevVolume=prevRows.reduce((a,r)=>a+r.volume,0);
  const totalSets=rows.length;
  const trainingDays=getWorkoutDatesWithSets(days).length;
  const summaries=workoutSummaries().filter(s=>{
    const d=new Date((s.iso||"").replaceAll(".","-"));
    return !Number.isNaN(d.getTime()) && (Date.now()-d.getTime()) <= days*86400000;
  });
  const skipped=summaries.reduce((a,s)=>a+(s.skippedCount||0),0);
  const volumeDelta=prevVolume ? ((totalVolume-prevVolume)/prevVolume)*100 : null;
  return {rows,prevRows,totalVolume,prevVolume,totalSets,trainingDays,skipped,volumeDelta};
}
function bestSetForExercise(name){
  const rows=allSetHistory().filter(r=>r.name===name);
  if(!rows.length) return null;
  return rows.sort((a,b)=>(b.w*b.r)-(a.w*a.r))[0];
}
function recentSetTrend(name){
  const rows=allSetHistory().filter(r=>r.name===name);
  if(rows.length<2) return {label:t2("Нет тренда","No trend"),delta:0,state:"neutral"};
  const first=rows[0], last=rows[rows.length-1];
  const delta=(last.w*last.r)-(first.w*first.r);
  return {
    label: delta>0 ? t2("растёт","improving") : delta<0 ? t2("просел","down") : t2("стабильно","stable"),
    delta,
    state: delta>0 ? "good" : delta<0 ? "warn" : "neutral"
  };
}
function nextWorkoutKeyGuess(){
  const todayPlan=getWeekPattern(getToday(),phaseFor(getToday()));
  if(todayPlan?.workoutKey && WORKOUTS[todayPlan.workoutKey]) return todayPlan.workoutKey;
  const keys=Object.keys(WORKOUTS||{});
  return keys[0]||null;
}
function renderNextWorkoutIntelligence(){
  const el=$("nextWorkoutIntelligence"); if(!el) return;
  const wk=nextWorkoutKeyGuess();
  if(!wk || !WORKOUTS[wk]){ el.innerHTML=`<p style="color:var(--muted)">${t2("Тренировка не найдена.","Workout not found.")}</p>`; return; }
  const exs=getEffectiveExercises(wk);
  const cards=exs.slice(0,6).map(e=>{
    const plan=progressionPlan(e.name,e.reps);
    const best=bestSetForExercise(e.name);
    const trend=recentSetTrend(e.name);
    return `<div class="intelligenceCard ${plan.state}">
      <div>
        <b>${escapeAttr(isEn()?e.en||e.name:e.name)}</b>
        <small>${escapeAttr(e.sets)}×${escapeAttr(e.reps)} · ${trend.label}${trend.delta?` (${trend.delta>0?"+":""}${trend.delta.toFixed(0)})`:""}</small>
      </div>
      <div>
        <strong>${plan.nextWeight?plan.nextWeight+" kg":"—"}</strong>
        <span>${escapeAttr(plan.label)}</span>
        <em>${best?t2("Best","Best")+`: ${best.w}×${best.r}`:t2("No history","No history")}</em>
      </div>
    </div>`;
  }).join("");
  el.innerHTML=`<div class="nextWorkoutHeader"><b>${escapeAttr(WORKOUTS[wk].title)} · ${escapeAttr(WORKOUTS[wk].subtitle)}</b><span>${t2("Следующая рекомендация","Next recommendation")}</span></div>${cards}`;
}
function renderWeeklyProgressReview(){
  const el=$("weeklyProgressReview"); if(!el) return;
  const s=weeklyProgressStats(7);
  const delta=s.volumeDelta===null ? "—" : `${s.volumeDelta>=0?"+":""}${s.volumeDelta.toFixed(0)}%`;
  const deltaClass=s.volumeDelta===null?"neutral":s.volumeDelta>=0?"good":"warn";
  const consistency=Math.min(100, Math.round((s.trainingDays/(getSettings().weeklyTarget||4))*100));
  el.innerHTML=`<div class="weeklyReviewGrid">
    <div><b>${s.totalSets}</b><span>${t2("sets this week","sets this week")}</span></div>
    <div><b>${Math.round(s.totalVolume)}</b><span>kg×reps</span></div>
    <div><b>${s.trainingDays}/${getSettings().weeklyTarget||4}</b><span>${t2("training days","training days")}</span></div>
    <div class="${deltaClass}"><b>${delta}</b><span>${t2("vs previous 7d","vs previous 7d")}</span></div>
  </div>
  <div class="consistencyBar"><span style="width:${consistency}%"></span></div>
  <p class="progressHint">${consistency>=75?t2("Хорошая стабильность. Можно аккуратно повышать нагрузку.","Good consistency. You can progress carefully."):t2("Сначала добери стабильность, потом повышай веса.","First improve consistency, then increase weights.")}</p>`;
}
function renderProgressInsights(){
  renderNextWorkoutIntelligence();
  renderWeeklyProgressReview();
  const el=$("progressInsights"); if(!el) return;
  const s=weeklyProgressStats(7);
  const insights=[];
  if(!s.rows.length){
    insights.push({type:"warn",title:t2("Нет данных по сетам","No set data"),text:t2("Запиши хотя бы одну тренировку через Focus Mode.","Log at least one workout through Focus Mode.")});
  }else{
    if(s.volumeDelta!==null && s.volumeDelta>25) insights.push({type:"warn",title:t2("Резкий рост объёма","Volume increased fast"),text:t2("Нагрузка выросла больше чем на 25%. Следи за восстановлением.","Volume increased by more than 25%. Watch recovery.")});
    if(s.volumeDelta!==null && s.volumeDelta< -20) insights.push({type:"warn",title:t2("Объём просел","Volume dropped"),text:t2("Возможно, была усталость или пропуски. Не повышай вес резко.","Likely fatigue or missed sessions. Do not increase weights aggressively.")});
    if(s.trainingDays>=3) insights.push({type:"good",title:t2("Стабильность хорошая","Good consistency"),text:t2("Есть база для прогресса. Повышай только упражнения, где все повторы выполнены.","You have a base for progress. Increase only exercises where all reps were completed.")});
    if(s.skipped>2) insights.push({type:"warn",title:t2("Много skip","Many skips"),text:t2("Проверь сон, боль в ногах и портовые дни. Лучше снизить объём.","Check sleep, shin pain and port days. Consider reducing volume.")});
  }
  if(!insights.length) insights.push({type:"neutral",title:t2("Нормальный режим","Normal mode"),text:t2("Продолжай текущую нагрузку и записывай подходы.","Keep current load and keep logging sets.")});
  el.innerHTML=insights.map(i=>`<div class="insight ${i.type}"><b>${escapeAttr(i.title)}</b><p>${escapeAttr(i.text)}</p></div>`).join("");
}
function renderProgressIntelligence(){
  renderNextWorkoutIntelligence();
  renderWeeklyProgressReview();
  renderProgressInsights();
}

function findNextAvailableDay(fromDate, maxDays=14){
  for(let i=1;i<=maxDays;i++){
    const d=addDays(fromDate,i);
    const p=portInfo(d);
    const plan=getWeekPattern(d,phaseFor(d));
    if(p.type!=="PORT" && plan.dayType!=="MOVED" && plan.dayType!=="SKIPPED") return d;
  }
  return addDays(fromDate,1);
}
function moveWorkoutToNextAvailable(iso){
  const d=new Date(iso+"T12:00:00");
  const plan=getWeekPattern(d,phaseFor(d));
  const target=findNextAvailableDay(d);
  const targetIso=isoDate(target);
  setOverride(iso,{status:"MOVED_AWAY",reason:t2("Перенесено на следующий доступный день","Moved to next available day"),workoutKey:plan.workoutKey,label:plan.label});
  setOverride(targetIso,{status:"MOVED_HERE",from:iso,reason:t2("Перенесено с другого дня","Moved from another day"),workoutKey:plan.workoutKey,label:plan.label});
  renderAll(); renderMonth();
  toast(`${t2("Перенесено на","Moved to")} ${fmtDate(target)}`);
}
function moveTodayWorkoutToNextAvailable(){ moveWorkoutToNextAvailable(isoDate(getToday())); }
function setRecoveryDay(iso){
  setOverride(iso,{status:"RECOVERY",reason:t2("Recovery вручную","Manual recovery")});
  renderAll(); renderMonth();
  toast(t2("День отмечен как Recovery","Marked as Recovery"));
}
function renderCalendarIntelligenceSummary(){
  const el=$("calendarIntelligenceSummary"); if(!el) return;
  const done=new Set(doneDates());
  let missed=0,moved=0,ports=0;
  const today=getToday();
  for(let i=0;i<14;i++){
    const d=addDays(today,-i); const plan=getWeekPattern(d,phaseFor(d)); const iso=isoDate(d);
    if(portInfo(d).type==="PORT") ports++;
    if(plan.dayType==="MOVED") moved++;
    if(plan.dayType==="TRAIN" && !done.has(fmtDate(d)) && d<today) missed++;
  }
  el.innerHTML=`${t2("За последние 14 дней","Last 14 days")}: <b>${missed}</b> ${t2("пропущено","missed")}, <b>${moved}</b> ${t2("перенесено","moved")}, <b>${ports}</b> ${t2("портовых дней","port days")}.`;
}

function autoRescheduleMissed(){
  const ov=overrides();
  const done=doneDates();
  let moved=0;
  for(let i=1;i<=14;i++){
    const d=addDays(getToday(),-i); const iso=isoDate(d); const fmt=fmtDate(d);
    const plan=getWeekPattern(d,phaseFor(d));
    if(plan.dayType==="TRAIN" && !done.includes(fmt) && !ov[iso]){
      const target=findNextAvailableDay(getToday(),14+moved);
      const targetIso=isoDate(addDays(target,moved));
      ov[iso]={type:"SKIPPED",reason:"auto-rescheduled",workoutKey:plan.workoutKey,label:plan.label};
      ov[targetIso]={type:"MOVED",from:iso,workoutKey:plan.workoutKey,label:plan.label,reason:"Auto-rescheduled missed workout"};
      moved++;
    }
  }
  LS.set("dayOverrides",JSON.stringify(ov));
  renderAll(); renderMonth();
  toast(moved?`${t2("Перенесено","Rescheduled")}: ${moved}`:t2("Нет пропущенных тренировок","No missed workouts"));
}

// Old v0.6 focus-mode implementation removed in v0.8.0.

// ═══════════════════════════════════════════════════════════════
// UI NAVIGATION
// ═══════════════════════════════════════════════════════════════
function showSection(id){
  const target=$(id);
  if(!target){
    toast(t2("Раздел не найден","Section not found")+": "+id);
    return;
  }
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  target.classList.add("active");
  document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));
  window.scrollTo({top:0,behavior:"smooth"});
  if(id==="calendar") renderMonth();
  if(id==="workout") renderWorkoutPreview();
  if(id==="progress"){renderHistory();renderWeekCompliance();renderWeightChart();renderExerciseProgressDashboard();renderProgressIntelligence();}
  if(id==="plan") renderProductPlan();
}

function openSettings(){ showSection("settings"); }
function toast(msg){
  $("toast").textContent=msg;
  $("toast").classList.add("show");
  setTimeout(()=>$("toast").classList.remove("show"),1900);
}
function confetti(){
  const c=$("confetti");
  c.innerHTML="";
  for(let i=0;i<34;i++){
    const el=document.createElement("i");
    el.style.left=Math.random()*100+"vw";
    el.style.animationDelay=Math.random()*280+"ms";
    el.style.background=["#f6c453","#ff8f3d","#4ade80","#38bdf8","#a78bfa"][Math.floor(Math.random()*5)];
    c.appendChild(el);
  }
  setTimeout(()=>c.innerHTML="",1300);
}
function clearAll(){
  if(!confirm(t2("Очистить все данные ShipFit для текущего аккаунта?","Clear all ShipFit data for current account?"))) return;
  if(!confirm(t2("Это действие нельзя отменить. Backup JSON уже сделан?","This cannot be undone. Have you exported a JSON backup?"))) return;
  LS.keys().forEach(k=>LS.remove(k));
  toast(t2("Данные очищены","Data cleared"));
  renderAll();
}
function renderBackupStatus(){
  const info=backupAgeInfo();
  ["backupStatus","backupMiniStatus"].forEach(id=>{
    const el=$(id); if(!el) return;
    el.textContent=info.text;
    el.classList.toggle("warnBox", info.level==="warn");
    el.classList.toggle("okBox", info.level==="ok");
  });
}
function renderNutritionWeeklySummary(){
  const el=$("nutritionWeeklySummary"); if(!el) return;
  const log=nutritionLog();
  let proteinOk=0,waterOk=0,creatineOk=0,days=0;
  for(let i=0;i<7;i++){
    const iso=isoDate(addDays(getToday(),-i)); const n=log[iso];
    if(!n) continue; days++;
    if(parseFloat(n.protein||0)>=150) proteinOk++;
    if(parseFloat(n.water||0)>=2.5) waterOk++;
    if(n.creatine) creatineOk++;
  }
  el.innerHTML=`<div class="miniMetrics"><div><b>${proteinOk}/7</b><span>${t2("Протеин","Protein")}</span></div><div><b>${waterOk}/7</b><span>${t2("Вода","Water")}</span></div><div><b>${creatineOk}/7</b><span>Creatine</span></div><div><b>${days}/7</b><span>${t2("Заполнено","Logged")}</span></div></div>`;
}
function renderAll(){
  showLoginState();
  const s=getSettings();
  $("setStartWeight").value=s.startWeight;
  $("setTargetWeight").value=s.targetWeight;
  $("setWeeklyTarget").value=s.weeklyTarget;
  renderToday();
  renderPorts();
  renderLibrary();
  renderHistory();
  renderWeekCompliance();
  renderWeightChart();
  renderExerciseProgressDashboard();
  renderRecovery();
  renderNutrition();
  renderNutritionWeeklySummary();
  renderWorkoutSummaries();
  renderBackupStatus();
  renderCalendarIntelligenceSummary();
  renderPwaStatus();
  updateOfflineStatus();
  renderQaStatus();
  renderProductPlan();
  renderProgressIntelligence();
  if(typeof translateNode === "function") translateNode(document.body);
  loadSupabaseConfigToInputs();
  renderCloudStatus();
  if($("progressCompliance")) renderWeekCompliance("progressCompliance");
}
// ═══════════════════════════════════════════════════════════════
// v0.7.2 GLOBAL PRODUCT ROADMAP + QA SUPPORT
// ═══════════════════════════════════════════════════════════════
const PRODUCT_ROADMAP = [
  {
    id:"M1",
    title:"Local Stability",
    status:"DONE",
    target:"v0.7.x",
    goal:"Daily-use local app without Supabase dependency.",
    items:[
      "Calendar, training, recovery, nutrition and backup must work in local mode.",
      "Daniil and Second account must stay separated.",
      "No blank screens or broken modals.",
      "Manual QA on phone before moving to cloud."
    ]
  },
  {
    id:"M2",
    title:"Workout Engine Pro",
    status:"DONE",
    target:"v0.8.x",
    goal:"Training flow should feel like a real app, not a form.",
    items:[
      "One exercise and one set at a time.",
      "Persistent rest timer and set history.",
      "Workout summary with skipped exercises and load progression.",
      "Exercise replacement by equipment and muscle group."
    ]
  },
  {
    id:"M3",
    title:"Progress Intelligence",
    status:"DONE",
    target:"v0.9.x",
    goal:"Recommendations should be useful and safe.",
    items:[
      "Next weight based on last completed session.",
      "Repeat, increase or reduce decision.",
      "Trend by exercise.",
      "Weekly progress review."
    ]
  },
  {
    id:"M4",
    title:"Ship Calendar Intelligence",
    status:"DEFERRED",
    target:"v1.0.x",
    goal:"Plan training around port calls and fatigue.",
    items:[
      "Manual drag/move day workflow.",
      "Port-day rules.",
      "Missed workout recovery.",
      "Weekly compliance and readiness score."
    ]
  },
  {
    id:"M5",
    title:"Cloud Ready",
    status:"DEFERRED",
    target:"v1.1.x",
    goal:"Prepare Supabase only after local app is stable.",
    items:[
      "Separate Supabase project.",
      "Magic Link email login.",
      "RLS-protected per-user history.",
      "Cloud sync and restore."
    ]
  },
  {
    id:"M6",
    title:"Hosted PWA",
    status:"DEFERRED",
    target:"v1.2.x",
    goal:"Deploy after Supabase setup.",
    items:[
      "Cloudflare Pages pages.dev domain.",
      "PWA install on phone.",
      "Offline app shell.",
      "Final mobile smoke test."
    ]
  }
];

const RELEASE_GATE = [
  {name:"Local login Daniil", status:"NOT TESTED"},
  {name:"Second local account isolation", status:"NOT TESTED"},
  {name:"Calendar renders all voyage months", status:"NOT TESTED"},
  {name:"Workout focus mode saves sets", status:"NOT TESTED"},
  {name:"Finish workout creates summary", status:"NOT TESTED"},
  {name:"Progress dashboard updates from saved sets", status:"NOT TESTED"},
  {name:"Recovery and nutrition save correctly", status:"NOT TESTED"},
  {name:"Backup export and import", status:"NOT TESTED"},
  {name:"Diagnostics export", status:"NOT TESTED"},
  {name:"Mobile browser smoke test", status:"NOT TESTED"}
];

const NEXT_BUILD_QUEUE = [
  {version:"v1.1.0", title:"Supabase Prep RC", scope:"Current build: optional Magic Link sync prepared, pending browser/mobile/Supabase live tests."},
  {version:"v1.1.1", title:"Post-deploy bugfix", scope:"Only if test deploy, phone smoke test, or Supabase pilot finds bugs."},
  {version:"v1.2.0", title:"Supabase acceptance", scope:"Separate Supabase project live test, RLS verification, and Magic Link acceptance."},
  {version:"v1.3.0", title:"Hosted PWA hardening", scope:"Only after Supabase is accepted."}
];

function roadmapStatusClass(status){
  const s=String(status||"").toLowerCase();
  if(s.includes("progress")) return "roadProgress";
  if(s.includes("next")) return "roadNext";
  if(s.includes("defer")) return "roadDeferred";
  if(s.includes("done") || s.includes("pass")) return "roadDone";
  return "roadNeutral";
}

function renderRoadmapOverview(){
  const el=$("roadmapOverview"); if(!el) return;
  el.innerHTML = PRODUCT_ROADMAP.map(m=>`
    <div class="roadmapItem ${roadmapStatusClass(m.status)}">
      <div class="roadHead">
        <b>${escapeAttr(m.id)} · ${escapeAttr(m.title)}</b>
        <span>${escapeAttr(m.status)}</span>
      </div>
      <p>${escapeAttr(m.goal)}</p>
      <small>${escapeAttr(m.target)}</small>
      <ul>${m.items.map(i=>`<li>${escapeAttr(i)}</li>`).join("")}</ul>
    </div>
  `).join("");
}

function renderCurrentMilestone(){
  const el=$("currentMilestone"); if(!el) return;
  const current=PRODUCT_ROADMAP.find(m=>m.status==="IN PROGRESS") || PRODUCT_ROADMAP[0];
  el.innerHTML=`
    <div class="milestoneHero">
      <span>${escapeAttr(current.id)}</span>
      <div>
        <h3>${escapeAttr(current.title)}</h3>
        <p>${escapeAttr(current.goal)}</p>
      </div>
    </div>
    <div class="noteBox compact">${t2("Локальная финальная версия подготовлена. Supabase и cloud sync пока отложены.","Final local release is prepared. Supabase and cloud sync stay deferred.")}</div>
  `;
}

function releaseGateStore(){ return JSON.parse(LS.get("releaseGate")||"null") || RELEASE_GATE; }
function saveReleaseGate(items){ LS.set("releaseGate", JSON.stringify(items)); }
function setGateStatus(i,status){
  const items=releaseGateStore();
  if(items[i]) items[i].status=status;
  saveReleaseGate(items);
  renderReleaseGate();
}
function renderReleaseGate(){
  const el=$("releaseGate"); if(!el) return;
  const items=releaseGateStore();
  const pass=items.filter(x=>x.status==="PASS").length;
  el.innerHTML=`
    <div class="qaScore ${pass===items.length?"pass":"warn"}"><b>${pass}/${items.length}</b><span>${t2("release checks passed","release checks passed")}</span></div>
    ${items.map((x,i)=>`
      <div class="gateLine ${String(x.status).toLowerCase()}">
        <span>${escapeAttr(x.status)}</span>
        <b>${escapeAttr(x.name)}</b>
        <select onchange="setGateStatus(${i},this.value)">
          ${["NOT TESTED","PASS","FAIL","BLOCKED"].map(s=>`<option value="${s}" ${x.status===s?"selected":""}>${s}</option>`).join("")}
        </select>
      </div>
    `).join("")}
  `;
}

function renderNextBuildQueue(){
  const el=$("nextBuildQueue"); if(!el) return;
  el.innerHTML = NEXT_BUILD_QUEUE.map((x,i)=>`
    <div class="buildQueueItem">
      <span>${i+1}</span>
      <div><b>${escapeAttr(x.version)} · ${escapeAttr(x.title)}</b><p>${escapeAttr(x.scope)}</p></div>
    </div>
  `).join("");
}


const MANUAL_QA_ITEMS = [
  {key:"login_daniil", title:"Login: Daniil local", steps:["Open app","Click Daniil local","Profile chip shows Daniil"]},
  {key:"login_second", title:"Login: Second account isolation", steps:["Logout","Open Second local","Check data separation"]},
  {key:"today_screen", title:"Today screen", steps:["Open Today","Check week strip","Check backup reminder","Check workout card"]},
  {key:"workout_flow", title:"Workout Focus Mode", steps:["Start workout","Save one set","Rest timer starts","Finish workout","Summary appears"]},
  {key:"calendar", title:"Calendar", steps:["Open Calendar","Month renders","Move today","Auto-reschedule"]},
  {key:"progress", title:"Progress", steps:["Open Progress","Exercise dashboard visible","Export backup","Export diagnostics"]},
  {key:"recovery_nutrition", title:"Recovery + Nutrition", steps:["Save recovery","Apply advice","Save nutrition","Check weekly consistency"]},
  {key:"pwa_local", title:"PWA local status", steps:["Open Settings","Check PWA status","Run Local QA diagnostics"]},
  {key:"reload", title:"Reload persistence", steps:["Save data","Reload page","Check data still exists"]},
  {key:"mobile", title:"Mobile browser smoke test", steps:["Open on phone","Check nav","Open workout modal","No clipped bottom buttons"]},
  {key:"final_test_deploy", title:"RC test deploy", steps:["Upload ZIP to test hosting","Open HTTPS URL","Login Daniil local","Run local QA diagnostics","Export backup"]}
];

function manualQaState(){
  return JSON.parse(LS.get("manualQaSession")||"null") || {
    startedAt:null,
    updatedAt:null,
    items: MANUAL_QA_ITEMS.map(x=>({...x,status:"NOT TESTED",note:""}))
  };
}
function saveManualQaState(state){
  state.updatedAt = new Date().toISOString();
  LS.set("manualQaSession", JSON.stringify(state));
}
function startManualQaSession(){
  const state = manualQaState();
  if(!state.startedAt) state.startedAt = new Date().toISOString();
  saveManualQaState(state);
  renderManualQaPanel();
  toast(t2("QA session started","QA session started"));
}
function resetManualQaSession(){
  if(!confirm(t2("Сбросить QA session?","Reset QA session?"))) return;
  LS.remove("manualQaSession");
  renderManualQaPanel();
  toast(t2("QA сброшен","QA reset"));
}
function setManualQaStatus(key,status){
  const state=manualQaState();
  const item=state.items.find(x=>x.key===key);
  if(item) item.status=status;
  saveManualQaState(state);
  renderManualQaPanel();
  renderVerificationStatus();
}
function saveManualQaNote(key,value){
  const state=manualQaState();
  const item=state.items.find(x=>x.key===key);
  if(item) item.note=value;
  saveManualQaState(state);
}
function renderManualQaPanel(){
  const el=$("manualQaPanel"); if(!el) return;
  const state=manualQaState();
  const items=state.items || [];
  const pass=items.filter(x=>x.status==="PASS").length;
  const fail=items.filter(x=>x.status==="FAIL").length;
  const blocked=items.filter(x=>x.status==="BLOCKED").length;
  el.innerHTML=`
    <div class="qaSessionHead">
      <div><b>${pass}/${items.length}</b><span>PASS</span></div>
      <div><b>${fail}</b><span>FAIL</span></div>
      <div><b>${blocked}</b><span>BLOCKED</span></div>
      <div><b>${state.startedAt ? new Date(state.startedAt).toLocaleDateString() : "—"}</b><span>Started</span></div>
    </div>
    ${items.map(item=>`
      <div class="manualQaItem ${String(item.status).toLowerCase().replace(" ","-")}">
        <div class="manualQaTop">
          <b>${escapeAttr(item.title)}</b>
          <select onchange="setManualQaStatus('${escapeAttr(item.key)}',this.value)">
            ${["NOT TESTED","PASS","FAIL","BLOCKED"].map(s=>`<option value="${s}" ${item.status===s?"selected":""}>${s}</option>`).join("")}
          </select>
        </div>
        <ol>${(item.steps||[]).map(s=>`<li>${escapeAttr(s)}</li>`).join("")}</ol>
        <textarea placeholder="${t2("Комментарий / баг / скрин номер","Note / bug / screenshot number")}" oninput="saveManualQaNote('${escapeAttr(item.key)}',this.value)">${escapeAttr(item.note||"")}</textarea>
      </div>
    `).join("")}
  `;
}
function exportManualQaReport(){
  const state=manualQaState();
  const payload={
    app:"ShipFit",
    version:APP_VERSION,
    profile:currentProfileId(),
    profileName:currentProfileName(),
    exportedAt:new Date().toISOString(),
    qa:state,
    diagnostics:collectDiagnostics()
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=`shipfit_manual_qa_${APP_VERSION}_${todayIso()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  toast(t2("QA report exported","QA report exported"));
}


function renderVerificationStatus(){
  const el=$("verificationStatusPanel"); if(!el) return;
  const rows=[
    ["Static JS syntax","PASS"],
    ["Duplicate HTML IDs","PASS"],
    ["Inline handler targets","PASS"],
    ["Section boundaries","PASS"],
    ["Boot order","PASS"],
    ["Node runtime smoke","PASS"],
    ["Headless Chromium smoke","BLOCKED"],
    ["Mobile Safari / Android Chrome","NOT TESTED"],
    ["Supabase Magic Link","PREPARED"]
  ];
  el.innerHTML=rows.map(([name,status])=>`<div class="verifyLine ${status.toLowerCase().replaceAll(" ","-")}"><b>${escapeAttr(status)}</b><span>${escapeAttr(name)}</span></div>`).join("");
}

function renderProductPlan(){
  renderRoadmapOverview();
  renderCurrentMilestone();
  renderReleaseGate();
  renderNextBuildQueue();
  renderManualQaPanel();
  renderVerificationStatus();
}

// ═══════════════════════════════════════════════════════════════
// v0.6.1 PWA / OFFLINE SHELL / LOCAL QA
// ═══════════════════════════════════════════════════════════════
let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  renderPwaStatus();
});

function pwaAvailable(){
  return "serviceWorker" in navigator && location.protocol.startsWith("http");
}

async function registerPwa(forceToast=false){
  const el=$("pwaStatus");
  if(!("serviceWorker" in navigator)){
    if(el) el.textContent=t2("Service Worker не поддерживается этим браузером.","Service Worker is not supported by this browser.");
    if(forceToast) toast(t2("PWA не поддерживается","PWA is not supported"));
    return false;
  }
  if(!location.protocol.startsWith("http")){
    if(el) el.textContent=t2("Offline/PWA работает только через http/https, не через file://.","Offline/PWA works only on http/https, not file://.");
    if(forceToast) toast(t2("Открой через hosting или local server","Open via hosting or local server"));
    return false;
  }
  try{
    const reg = await navigator.serviceWorker.register("sw.js");
    if(el) el.textContent=t2("Offline shell включён. Локальные файлы будут кешироваться.","Offline shell enabled. Local files will be cached.");
    if(forceToast) toast(t2("Offline shell включён","Offline shell enabled"));
    return reg;
  }catch(e){
    if(el) el.textContent=t2("Ошибка PWA: ","PWA error: ")+e.message;
    if(forceToast) toast(t2("Ошибка PWA","PWA error"));
    return false;
  }
}

async function clearAppCache(){
  if(!("caches" in window)){ toast(t2("Cache API недоступен","Cache API unavailable")); return; }
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith("shipfit-")).map(k=>caches.delete(k)));
  toast(t2("App cache очищен","App cache cleared"));
  renderPwaStatus();
}

async function promptInstall(){
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    const result=await deferredInstallPrompt.userChoice;
    deferredInstallPrompt=null;
    renderPwaStatus();
    toast(result.outcome==="accepted" ? t2("Установка началась","Install started") : t2("Установка отменена","Install dismissed"));
    return;
  }
  toast(t2("Install prompt пока недоступен. Открой сайт через HTTPS и включи offline shell.","Install prompt is not available yet. Open via HTTPS and enable offline shell."));
}

function renderPwaStatus(){
  const el=$("pwaStatus"); if(!el) return;
  const installed = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
  const pieces=[];
  pieces.push(installed ? t2("✓ Режим установленного приложения","✓ Installed mode") : t2("Режим браузера","Browser mode"));
  pieces.push(pwaAvailable() ? t2("Service Worker доступен","Service Worker available") : t2("Service Worker требует http/https","Service Worker needs http/https"));
  pieces.push(navigator.onLine ? t2("Онлайн","Online") : t2("Оффлайн","Offline"));
  pieces.push(deferredInstallPrompt ? t2("Установка готова","Install ready") : t2("Install prompt пока не готов","Install prompt not ready"));
  el.textContent=pieces.join(" · ");
}

function updateOfflineStatus(){
  const el=$("offlineStatus"); if(!el) return;
  el.classList.toggle("show", !navigator.onLine);
  el.textContent = navigator.onLine ? "" : t2("Offline mode: данные сохраняются локально","Offline mode: data saves locally");
  renderPwaStatus();
}

window.addEventListener("online", updateOfflineStatus);
window.addEventListener("offline", updateOfflineStatus);

function localHealthChecks(){
  const checks=[];
  const add=(name, ok, detail)=>checks.push({name, ok:!!ok, detail:detail||""});
  add("App version", /^1\.(0|1)\./.test(APP_VERSION), APP_VERSION);
  add("Profile active", !!rawGet("shipfitProfile"), currentProfileName());
  add("LocalStorage writable", (()=>{try{rawSet("shipfit_test","1"); rawRemove("shipfit_test"); return true;}catch{return false;}})(), "");
  add("Workout data", !!WORKOUTS && Object.keys(WORKOUTS).length>=5, `${Object.keys(WORKOUTS||{}).length} workouts`);
  add("Schedule loaded", Array.isArray(SCHEDULE) && SCHEDULE.length>=20, `${SCHEDULE.length} port calls`);
  add("Calendar DOM", !!$("monthCal") && !!$("weekStrip"), "month/week containers");
  add("Focus mode DOM", !!$("focusWorkoutPanel") && !!$("finishSummaryPreview"), "focus + preview");
  add("Backup controls", !!$("backupStatus") && !!$("backupMiniStatus"), "backup panels");
  add("Recovery tracker", !!$("recSleep") && !!$("recFatigue") && !!$("recSoreness"), "recovery fields");
  add("Nutrition tracker", !!$("nutProtein") && !!$("nutWater") && !!$("nutCalories"), "nutrition fields");
  add("PWA shell", pwaAvailable(), location.protocol);
  return checks;
}

function renderQaStatus(checks=localHealthChecks()){
  const el=$("qaStatusPanel"); if(!el) return;
  const passed=checks.filter(c=>c.ok).length;
  el.innerHTML=`<div class="qaScore ${passed===checks.length?"pass":"warn"}"><b>${passed}/${checks.length}</b><span>${t2("проверок пройдено","checks passed")}</span></div>`+
    checks.map(c=>`<div class="qaLine ${c.ok?"pass":"fail"}"><b>${c.ok?"PASS":"CHECK"}</b><span>${escapeAttr(c.name)}</span><small>${escapeAttr(c.detail)}</small></div>`).join("");
}

function runLocalHealthCheck(){
  const checks=localHealthChecks();
  renderQaStatus(checks);
  const failed=checks.filter(c=>!c.ok);
  toast(failed.length ? `${t2("Проверить","Check")}: ${failed.length}` : t2("Local QA PASS","Local QA PASS"));
  return checks;
}

function collectDiagnostics(){
  const checks=localHealthChecks();
  return {
    app:"ShipFit",
    version:APP_VERSION,
    profile:currentProfileId(),
    profileName:currentProfileName(),
    exportedAt:new Date().toISOString(),
    url: location.href,
    protocol: location.protocol,
    online:navigator.onLine,
    userAgent:navigator.userAgent,
    pwaAvailable:pwaAvailable(),
    scheduleCount:SCHEDULE.length,
    workoutCount:Object.keys(WORKOUTS||{}).length,
    localKeys:LS.keys().length,
    checks
  };
}

function exportDiagnostics(){
  const payload=collectDiagnostics();
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=`shipfit_diagnostics_${todayIso()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  toast(t2("Diagnostics exported","Diagnostics exported"));
}

function backupAgeInfo(){
  const last=rawGet("shipfitLastBackupAt");
  if(!last) return {level:"warn", text:t2("Backup ещё не создавался. Сделай Export JSON.","No backup exported yet. Use Export JSON.")};
  const days=Math.floor((Date.now()-new Date(last).getTime())/86400000);
  if(days>=7) return {level:"warn", text:`⚠️ ${t2("Последний backup был","Last backup was")} ${days} ${t2("дней назад","days ago")}.`};
  return {level:"ok", text:`✓ ${t2("Последний backup","Last backup")}: ${new Date(last).toLocaleString()}`};
}

// renderFinishSummaryPreview defined in Workout Engine Pro section.





// ═══════════════════════════════════════════════════════════════
// BOOT AFTER ALL DECLARATIONS
// ═══════════════════════════════════════════════════════════════
function bootShipFitV101(){
  setupLanguage();
  renderAll();
  initAuthSession();
  registerPwa(false);
}
if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", bootShipFitV101, {once:true});
}else{
  bootShipFitV101();
}
