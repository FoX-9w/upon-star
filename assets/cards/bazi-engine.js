/* =========================================================
   Upon Star — assets/cards/bazi-engine.js
   八字排盘计算引擎（纯本地 JS，无外部依赖）
   - 公历 → 四柱（年月日时）天干地支
   - 月柱按节气换月（非农历月）
   - 日柱查表（1900-2100）
   - 时柱按日干推算时干
   - 五行分布、大运排盘
   使用：window.BAZI.compute(y,m,d,h,gender)
   ========================================================= */
window.BAZI = (function () {
  'use strict';

  // 10 天干 + 12 地支
  var TG = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var DZ = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

  // 天干阴阳
  var YINYANG = {
    '甲':'阳','乙':'阴','丙':'阳','丁':'阴','戊':'阳','己':'阴',
    '庚':'阳','辛':'阴','壬':'阳','癸':'阴'
  };

  // 天干五行
  var WUXING_GAN = {
    '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土',
    '庚':'金','辛':'金','壬':'水','癸':'水'
  };

  // 地支五行（含藏干主气）
  var ZHI_MAIN = {
    '子':'癸','丑':'己','寅':'甲','卯':'乙','辰':'戊','巳':'丙',
    '午':'丁','未':'己','申':'庚','酉':'辛','戌':'戊','亥':'壬'
  };
  var WUXING_ZHI = {
    '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火',
    '午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'
  };

  // 五行相生：木→火→土→金→水→木
  var SHENG = { '木':'火','火':'土','土':'金','金':'水','水':'木' };
  // 五行相克：木→土→水→火→金→木
  var KE = { '木':'土','土':'水','水':'火','火':'金','金':'木' };

  // 时辰→地支（每支 2 小时，子时为 23-1）
  var HOUR_TO_ZHI = [
    {h:0, z:'子'}, {h:1, z:'丑'}, {h:3, z:'寅'}, {h:5, z:'卯'},
    {h:7, z:'辰'}, {h:9, z:'巳'}, {h:11, z:'午'}, {h:13, z:'未'},
    {h:15, z:'申'}, {h:17, z:'酉'}, {h:19, z:'戌'}, {h:21, z:'亥'}, {h:23, z:'子'}
  ];

  // 五虎遁：年上起月（甲己之年丙作首，乙庚之岁戊为头，丙辛必定寻庚起，丁壬壬位顺行流，戊癸甲寅好追求）
  var YEAR_MONTH_GAN = {
    '甲':'丙','己':'丙','乙':'戊','庚':'戊','丙':'庚','辛':'庚','丁':'壬','壬':'壬','戊':'甲','癸':'甲'
  };

  // 五鼠遁：日上起时（甲己还加甲，乙庚丙作初，丙辛从戊起，丁壬庚子居，戊癸何方发，壬子是真途）
  var DAY_HOUR_GAN = {
    '甲':'甲','己':'甲','乙':'丙','庚':'丙','丙':'戊','辛':'戊','丁':'庚','壬':'庚','戊':'壬','癸':'壬'
  };

  // 节气月支：每个节气对应月柱的起始
  // 简化用近似日期（±1天误差，足够八字符号查询）
  // 立春 2/4，惊蛰 3/6，清明 4/5，立夏 5/6，芒种 6/6，小暑 7/7，立秋 8/7/8，白露 9/8，寒露 10/8，立冬 11/7/8，大雪 12/7，小寒 1/6
  var JIEQI = [
    {month:1, day:6,  zhi:'丑', name:'小寒'},
    {month:2, day:4,  zhi:'寅', name:'立春'},
    {month:3, day:6,  zhi:'卯', name:'惊蛰'},
    {month:4, day:5,  zhi:'辰', name:'清明'},
    {month:5, day:6,  zhi:'巳', name:'立夏'},
    {month:6, day:6,  zhi:'午', name:'芒种'},
    {month:7, day:7,  zhi:'未', name:'小暑'},
    {month:8, day:7,  zhi:'申', name:'立秋'},
    {month:9, day:8,  zhi:'酉', name:'白露'},
    {month:10,day:8,  zhi:'戌', name:'寒露'},
    {month:11,day:7,  zhi:'亥', name:'立冬'},
    {month:12,day:7,  zhi:'子', name:'大雪'}
  ];

  // 1900-1-1 的干支索引（基准日：1900-01-31 = 甲子日，索引 0）
  // 甲子 0 乙丑 1 ... 癸亥 59
  var BASE_DATE = new Date(1900, 0, 31); // 1900-01-31 = 甲子
  var BASE_GANZHI = 0;

  function daysBetween(a, b){
    var ms = b.getTime() - a.getTime();
    return Math.floor(ms / 86400000);
  }

  // 公历 → 日干支索引
  function getDayGZIndex(year, month, day){
    var dt = new Date(year, month-1, day);
    var d = daysBetween(BASE_DATE, dt);
    return ((BASE_GANZHI + d) % 60 + 60) % 60;
  }

  // 公历 → 年干支索引
  function getYearGZIndex(year){
    // 1900 年庚子 = 36
    // 1984 = 甲子 = 0，差 84 年 → (year - 1984) % 60
    return ((year - 1984) % 60 + 60) % 60;
  }

  // 节气月支：根据公历 (m,d) 找它属于哪个节气月
  function getMonthZhiBySolar(year, m, d){
    var prev = JIEQI[0]; // 小寒
    var cur = JIEQI[1]; // 立春
    // 倒序遍历找最近的节气
    for(var i=JIEQI.length-1; i>=0; i--){
      var jq = JIEQI[i];
      if((m > jq.month) || (m === jq.month && d >= jq.day)){
        prev = JIEQI[(i+11) % 12]; // 上一个节气
        cur = jq;
        // 月支 = cur.zhi（该节气起至下一节气止）
        return cur.zhi;
      }
    }
    return '丑'; // 默认小寒前
  }

  // 推年柱（以立春换年）
  function yearPillar(year, m, d){
    var y = year;
    // 立春前仍算上一年
    if(m < 2 || (m === 2 && d < 4)) y -= 1;
    var gzIdx = getYearGZIndex(y);
    return { gan: TG[gzIdx % 10], zhi: DZ[gzIdx % 12] };
  }

  // 推月柱
  function monthPillar(year, m, d, yearGan){
    var zhi = getMonthZhiBySolar(year, m, d);
    var zhiIdx = DZ.indexOf(zhi);
    // 月干 = 五虎遁：(yearGan → 起首天干)，再按 zhiIdx 顺序递推（寅=0）
    var startGan = YEAR_MONTH_GAN[yearGan];
    var startIdx = TG.indexOf(startGan);
    // 寅月为第 1 个月（zhi=寅 索引 2），zhi 索引 0=子 不属于月支；用 zhiIdx 相对于 寅(2) 的偏移
    var offset = (zhiIdx - 2 + 12) % 12;
    var ganIdx = (startIdx + offset) % 10;
    return { gan: TG[ganIdx], zhi: zhi };
  }

  // 推日柱
  function dayPillar(year, m, d){
    var gzIdx = getDayGZIndex(year, m, d);
    return { gan: TG[gzIdx % 10], zhi: DZ[gzIdx % 12] };
  }

  // 推时柱
  function hourPillar(hour, dayGan){
    // hour: 0..23
    var zhi;
    if(hour >= 23 || hour < 1) zhi = '子';
    else zhi = DZ[Math.floor((hour + 1) / 2)];
    var zhiIdx = DZ.indexOf(zhi);
    // 时干 = 五鼠遁
    var startGan = DAY_HOUR_GAN[dayGan];
    var startIdx = TG.indexOf(startGan);
    var ganIdx = (startIdx + zhiIdx) % 10;
    return { gan: TG[ganIdx], zhi: zhi };
  }

  // 五行计数（含地支本气）
  function countWuXing(pillars){
    var c = { '金':0, '木':0, '水':0, '火':0, '土':0 };
    pillars.forEach(function(p){
      c[WUXING_GAN[p.gan]]++;
      c[WUXING_ZHI[p.zhi]]++;
    });
    return c;
  }

  // 大运排盘
  // 男阳年/女阴年 → 顺排；男阴年/女阳年 → 逆排
  function computeDaYun(result, gender, count){
    var yearGan = result.pillars[0].gan;
    var yearYang = (YINYANG[yearGan] === '阳');
    var forward = (gender === 'M' && yearYang) || (gender === 'F' && !yearYang);

    // 大运起始：出生日到下一个节气（顺）或上一个节气（逆）的天数 /3 = 起运年龄
    var bYear = result.birthYear;
    var bMonth = result.birthMonth;
    var bDay = result.birthDay;
    var birth = new Date(bYear, bMonth-1, bDay);

    // 找下一/上一个节气日期（跨年处理：顺排出生在大雪后、逆排出生在小寒前都需取邻年节气）
    var candidates = [];
    for(var yy = bYear - 1; yy <= bYear + 1; yy++){
      for(var i=0; i<JIEQI.length; i++){
        candidates.push({ date: new Date(yy, JIEQI[i].month-1, JIEQI[i].day), jq: JIEQI[i] });
      }
    }
    candidates.sort(function(a, b){ return a.date.getTime() - b.date.getTime(); });
    var nextJq = null, prevJq = null;
    for(var c=0; c<candidates.length; c++){
      if(forward){ if(candidates[c].date > birth){ nextJq = candidates[c]; break; } }
      else { if(candidates[c].date < birth) prevJq = candidates[c]; }
    }
    if(!nextJq) nextJq = candidates[candidates.length - 1]; // 理论上不会触发
    if(!prevJq) prevJq = candidates[0];
    var daysDiff = forward ? daysBetween(birth, nextJq.date) : daysBetween(prevJq.date, birth);
    var startAge = Math.max(1, Math.floor(daysDiff / 3));

    // 顺排：从月柱下一支开始；逆排：上一支
    var monthGan = result.pillars[1].gan;
    var monthZhi = result.pillars[1].zhi;
    var startGanIdx = TG.indexOf(monthGan);
    var startZhiIdx = DZ.indexOf(monthZhi);

    var arr = [];
    for(var k=0; k<count; k++){
      var gIdx, zIdx;
      if(forward){
        gIdx = (startGanIdx + k + 1) % 10;
        zIdx = (startZhiIdx + k + 1) % 12;
      } else {
        gIdx = (startGanIdx - k - 1 + 100) % 10;
        zIdx = (startZhiIdx - k - 1 + 12) % 12;
      }
      arr.push({
        startAge: startAge + k * 10,
        gan: TG[gIdx],
        zhi: DZ[zIdx]
      });
    }
    return arr;
  }

  function compute(y, m, d, h, gender){
    if(y < 1900 || y > 2100) throw new Error('年份超出范围（1900-2100）');
    if(m < 1 || m > 12) throw new Error('月份错误');
    if(d < 1 || d > 31) throw new Error('日期错误');
    if(h < 0 || h > 23) throw new Error('小时错误');

    var yp = yearPillar(y, m, d);
    var dp = dayPillar(y, m, d);
    var mp = monthPillar(y, m, d, yp.gan);
    var hp = hourPillar(h, dp.gan);

    return {
      birthYear: y, birthMonth: m, birthDay: d, birthHour: h, gender: gender,
      pillars: [yp, mp, dp, hp],
      dayGan: dp.gan
    };
  }

  return {
    TG: TG, DZ: DZ,
    YINYANG: YINYANG,
    WUXING_GAN: WUXING_GAN, WUXING_ZHI: WUXING_ZHI,
    SHENG: SHENG, KE: KE,
    ZHI_MAIN: ZHI_MAIN,
    compute: compute,
    countWuXing: countWuXing,
    computeDaYun: computeDaYun
  };
})();
