export type MetricKey = 'think' | 'safe' | 'responsibility';
export type Metrics = Record<MetricKey, number>;

export type Choice = {
  id: string;
  label: string;
  consequence: string;
  repair?: string;
  delta: Metrics;
};

export type Scenario = {
  id: string;
  title: string;
  place: string;
  focus: string;
  icon: 'ball' | 'camera' | 'spark' | 'network' | 'words' | 'card' | 'road';
  image: string;
  scene: string;
  speaker: string;
  proposal: string;
  takeaway: string;
  choices: Choice[];
};

export const INITIAL_METRICS: Metrics = { think: 50, safe: 50, responsibility: 50 };

export const METRIC_META: Record<MetricKey, { label: string; short: string; color: string }> = {
  think: { label: '三思值', short: '先想後果', color: 'bg-[#f3a93b]' },
  safe: { label: '安全值', short: '保護人與界線', color: 'bg-[#2ba59b]' },
  responsibility: { label: '責任值', short: '誠實面對與補救', color: 'bg-[#5478c9]' },
};

const choice = (id: string, label: string, consequence: string, delta: Metrics, repair?: string): Choice => ({ id, label, consequence, delta, repair });

export const SCENARIOS: Scenario[] = [
  {
    id: 'S01', title: '下課打球', place: '校園走廊', focus: '時間、地點和方法', icon: 'ball', image: '/images/scenes/s01.webp',
    scene: '下課時間，阿哲拿著一顆軟式足球，在教室門口找你。', speaker: '阿哲',
    proposal: '這節下課有十分鐘，我們來踢一下！你想去哪裡玩？',
    takeaway: '踢球不是壞事，但時間、地點與玩法會改變後果。',
    choices: [
      choice('S01-SAFE', '去操場旁的小球場，注意時間，上課鐘響前回來。', '你們在可以活動的場地踢球，沒有妨礙通行，也準時回到教室。', { think: 10, safe: 8, responsibility: 5 }),
      choice('S01-RISK', '球場太遠了，我們在走廊輕輕傳就好。', '球滾到轉角，一位抱作業的同學為了閃球，作業散落一地。你不是故意撞他，但走廊本來就是通行的地方。', { think: -5, safe: -10, responsibility: -3 }, '你立刻停下來，和阿哲一起撿作業並向同學道歉。'),
      choice('S01-DANGER', '比賽誰能踢中教室門上的小窗！', '球撞翻班牌，也打斷同學休息。導師要求你們停止活動、說明經過並處理損壞。', { think: -10, safe: -15, responsibility: -8 }, '你承認是自己踢的，沒有把責任全推給阿哲。'),
    ],
  },
  {
    id: 'S02', title: '拍同學睡覺', place: '教室', focus: '玩笑、同意與隱私', icon: 'camera', image: '/images/scenes/s02.webp',
    scene: '午休快結束，小宇還趴在桌上睡覺，嘴角貼著一小片便條紙。', speaker: '阿哲',
    proposal: '這個畫面超好笑！拍下來加上「睡神」，傳班群一定很多人按讚。你來拍！',
    takeaway: '「只是好玩」不能代替別人的同意。',
    choices: [
      choice('S02-SAFE', '他沒有答應，先不要拍。等他醒來再問要不要一起合照。', '小宇知道你們沒有把他的睡相傳出去，放心地笑了。阿哲後來也加入合照。', { think: 10, safe: 3, responsibility: 8 }),
      choice('S02-RISK', '我先拍，但只放在手機裡，不傳應該沒關係。', '小宇醒來看到手機畫面，覺得自己被偷拍，很不舒服。沒有公開不代表不會影響別人的隱私。', { think: -5, safe: -3, responsibility: -6 }, '你當面刪除照片並道歉，答應以後先取得同意。'),
      choice('S02-DANGER', '好啊！只是開玩笑，他應該不會生氣。', '圖片很快被轉傳。老師要求刪圖，但有人已經截圖，無法保證完全收回。', { think: -12, safe: -8, responsibility: -15 }, '你在班群說明自己未經同意發圖，請大家刪除，也私下向小宇道歉。'),
    ],
  },
  {
    id: 'S03', title: '巷口沖天炮', place: '住家附近', focus: '危險物品與旁觀責任', icon: 'spark', image: '/images/scenes/s03.webp',
    scene: '放學後，你們在巷口看到一支別人留下、看起來還沒點過的沖天炮。', speaker: '阿哲',
    proposal: '這支好像還能用。旁邊空地現在沒人，我們試著點看看？',
    takeaway: '沒有親手點火，不代表幫忙、鼓勵或起鬨就沒有責任。',
    choices: [
      choice('S03-SAFE', '不要碰，告訴附近可信任的大人來處理。我們去球場吧。', '你們沒有移動或點燃爆竹，請大人協助處理。阿哲最後跟你去球場。', { think: 12, safe: 12, responsibility: 8 }),
      choice('S03-RISK', '我不點，但你要點的話，我站遠一點幫你錄影。', '你雖沒親手點火，卻讓阿哲覺得有人支持。沖天炮倒向一旁，火星差點碰到機車。', { think: -8, safe: -10, responsibility: -10 }, '你停止錄影、確認沒人受傷，並和阿哲向居民說明及道歉。'),
      choice('S03-DANGER', '空地沒人，點一下就跑，應該不會怎樣。', '沖天炮撞到牆面爆開，警報器響起，鄰居受到驚嚇。危險不會因為「無心」就消失。', { think: -15, safe: -18, responsibility: -15 }, '你留在現場，告訴大人真實經過並接受後續處理。'),
    ],
  },
  {
    id: 'S04', title: '網路交友衝突', place: '線上遊戲群組', focus: '不圍攻、不公開個資', icon: 'network', image: '/images/scenes/s04.webp',
    scene: '晚上，你登入常玩的線上遊戲。網友「暗影騎士」傳來一張爭吵截圖。', speaker: '暗影騎士',
    proposal: '這個人剛才一直說我很雷。幫我去留言罵他！我還找到他的學校和照片。',
    takeaway: '網路上的一句話也會影響真實的人，不圍攻、不公開個資，才不會擴大傷害。',
    choices: [
      choice('S04-RISK', '我不留言，但把截圖轉給朋友看看。', '截圖在更多群組間流傳，更多人加入評論。你沒有直接罵人，卻讓衝突擴大。', { think: -6, safe: -5, responsibility: -8 }, '你停止轉傳、刪除自己發出的截圖，並請收到的人不要再傳。'),
      choice('S04-SAFE', '我不幫忙罵人，也不要貼個資。先封鎖或檢舉，必要時找大人。', '你沒有加入圍攻，也提醒對方保留必要紀錄並尋求協助。衝突沒有因你而變大。', { think: 12, safe: 8, responsibility: 10 }),
      choice('S04-DANGER', '我換小帳去罵他，再把學校照片貼出去。', '個人資料被更多人看見，雙方持續互罵。平台停權帳號，家長與老師也開始處理。', { think: -15, safe: -12, responsibility: -16 }, '你停止攻擊、告訴可信任的大人，並配合刪除公開內容。'),
    ],
  },
  {
    id: 'S05', title: '習慣性罵髒話', place: '教室', focus: '表達生氣但不傷人', icon: 'words', image: '/images/scenes/s05.webp',
    scene: '下課時，你和阿哲玩桌遊。阿哲不小心碰倒你的棋子。', speaker: '阿哲',
    proposal: '糟糕，我不是故意的。你剛才好像要罵人了？反正你平常都這樣講啦！',
    takeaway: '習慣說出口的話仍可能傷人。停一下、換句話說，是可以練習的能力。',
    choices: [
      choice('S05-DANGER', '你就是故意的啦！每次都這麼笨！', '阿哲不再覺得這只是口頭禪，生氣地離開。生氣是真的，但不能用傷人的話處理。', { think: -12, safe: -5, responsibility: -15 }, '你說清楚自己在氣什麼，為罵人的話道歉，並一起排回棋子。'),
      choice('S05-RISK', '我沒有在罵你，那只是口頭禪，不用認真。', '阿哲沒有繼續爭，但表情不自在。「不是針對你」不能消除別人的感受。', { think: -5, safe: -2, responsibility: -7 }, '你改口說「我嚇了一跳」，並練習使用不傷人的替代語。'),
      choice('S05-SAFE', '我剛才很生氣，差點罵人。先一起排回去，下次請小心。', '你有表達不高興，也沒有用髒話攻擊朋友。阿哲道歉後，和你一起恢復遊戲。', { think: 8, safe: 4, responsibility: 12 }),
    ],
  },
  {
    id: 'S06', title: '撿到學生證', place: '校園樓梯', focus: '拾獲物與誠實處理', icon: 'card', image: '/images/scenes/s06.webp',
    scene: '放學前，你在樓梯旁撿到一張別班同學的學生證。', speaker: '阿哲',
    proposal: '先拿去合作社試試看能不能刷！反正等一下再還，他也不會少東西。',
    takeaway: '想幫忙也要選對方法；別人的物品與資料不能因為「只是一下」就隨意使用。',
    choices: [
      choice('S06-SAFE', '交到學務處失物招領，請老師聯絡本人。', '失主很快找回學生證。你沒有使用或拍下證件資料，也留下清楚的拾獲地點。', { think: 8, safe: 7, responsibility: 12 }),
      choice('S06-DANGER', '只刷一次看看，等一下再偷偷放回原地。', '使用紀錄留下來，失主很著急。即使打算歸還，未經同意使用仍會造成損失與信任問題。', { think: -14, safe: -10, responsibility: -16 }, '你停止使用，主動向師長說明完整經過並配合處理。'),
      choice('S06-RISK', '拍整張學生證傳班群，問大家是誰的。', '大家很快認出失主，但姓名、照片和證件資訊也被傳了出去。', { think: -4, safe: -6, responsibility: -5 }, '你收回訊息，改成只描述拾獲地點，並把證件交給師長。'),
    ],
  },
  {
    id: 'S07', title: '趕時間過馬路', place: '社區路口', focus: '方便與交通安全', icon: 'road', image: '/images/scenes/s07.webp',
    scene: '放學後，你們要去社區球場。行人號誌已變紅燈，下一次綠燈還要等一會兒。', speaker: '阿哲',
    proposal: '現在沒有車啦！直接穿過去，不然球場等一下就沒位置了。',
    takeaway: '「現在看起來沒事」不等於沒有風險；規則常在保護我們看不到的危險。',
    choices: [
      choice('S07-RISK', '我先看左右，真的沒車就趕快過去。', '走到一半時轉彎車輛接近，駕駛緊急減速。你忽略了號誌和視線死角。', { think: -7, safe: -13, responsibility: -5 }, '你們退回安全處，之後依號誌通行。'),
      choice('S07-DANGER', '我們比賽衝過去，我順便拍影片！', '你看著手機，沒注意轉彎車輛。車子急煞，駕駛和路人都受到驚嚇。', { think: -15, safe: -18, responsibility: -12 }, '你收起手機、離開車道，在安全處告訴大人剛才發生的事。'),
      choice('S07-SAFE', '球場可以等，安全不能賭。我們等綠燈。', '你們依號誌通過路口。雖然晚一點到球場，仍找到其他空間一起活動。', { think: 10, safe: 12, responsibility: 6 }),
    ],
  },
];

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function clamp(value: number) { return Math.max(0, Math.min(100, value)); }

export function getResult(metrics: Metrics) {
  const values = Object.values(metrics);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const minimum = Math.min(...values);
  const veryLowCount = values.filter((value) => value <= 10).length;
  if (average >= 68 && minimum >= 58) return { key: 'navigator', title: '後果導航員', text: '你常能在行動前看見後面幾步，也願意保護別人、為決定負責。' };
  if (average >= 50 && minimum >= 35) return { key: 'steady', title: '穩健選擇者', text: '你多數時候能作出穩健選擇。遇到「只是開玩笑」時，再多問一句「如果出事呢？」。' };
  if (average >= 20 && veryLowCount < 2) return { key: 'learner', title: '再想一步練習生', text: '你不是想傷害別人，只是有幾次決定得太快。先停三秒，再想後果。' };
  return { key: 'alert', title: '無心警報', text: '這次有幾個選擇帶來明顯風險。犯錯不是終點，停止、說明、道歉和補救能把事情導回正軌。' };
}
