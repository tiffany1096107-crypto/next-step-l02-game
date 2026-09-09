'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BarChart3, BookOpenCheck, Building2, Camera, CameraOff,
  Check, ChevronRight, CircleDot, CircleStop, ClipboardList, CreditCard, DoorOpen,
  Eye, Flame, Gamepad2, GraduationCap, Hand, Lightbulb, LockKeyhole, MapPin,
  MessageCircle, MessageCircleWarning, Pause, RefreshCcw, Route, ScanLine, Send,
  Share2, ShieldCheck, Smartphone, Sparkles, Target, Trophy, UserRoundX, Users,
  Video, Volume2, Wifi, Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Choice, clamp, getResult, INITIAL_METRICS, METRIC_META, MetricKey, Metrics, SCENARIOS, Scenario, shuffle } from '@/lib/game-data';
import { syncGameRecordToFirebase } from '@/lib/firebase-client';

type View = 'home' | 'student-setup' | 'game' | 'result' | 'teacher';
type RoundResponse = {
  scenarioId: string;
  scenarioTitle: string;
  choiceId: string;
  choiceLabel: string;
  displayPosition: number;
  displayOrder: string[];
  consequence: string;
  repair?: string;
  delta: Metrics;
};
type GameRecord = {
  id: string;
  studentCode: string;
  completedAt: string;
  scenarioOrder: string[];
  responses: RoundResponse[];
  finalMetrics: Metrics;
  resultTitle: string;
};

const STORAGE_KEY = 'l02-game-preview-records';
const SETTINGS_KEY = 'l02-game-preview-settings';

const sceneIcons = {
  ball: CircleDot, camera: Camera, spark: Zap, network: Wifi,
  words: MessageCircleWarning, card: CreditCard, road: Route,
};

const choiceIcons: Record<string, typeof MapPin> = {
  'S01-SAFE': MapPin, 'S01-RISK': DoorOpen, 'S01-DANGER': Target,
  'S02-SAFE': CameraOff, 'S02-RISK': Smartphone, 'S02-DANGER': Send,
  'S03-SAFE': Hand, 'S03-RISK': Video, 'S03-DANGER': Flame,
  'S04-SAFE': ShieldCheck, 'S04-RISK': Share2, 'S04-DANGER': UserRoundX,
  'S05-SAFE': Pause, 'S05-RISK': MessageCircle, 'S05-DANGER': Volume2,
  'S06-SAFE': Building2, 'S06-RISK': Send, 'S06-DANGER': ScanLine,
  'S07-SAFE': CircleStop, 'S07-RISK': Eye, 'S07-DANGER': Video,
};

const resultImages: Record<string, string> = {
  navigator: '/images/results/navigator.webp', steady: '/images/results/steady.webp',
  learner: '/images/results/learner.webp', alert: '/images/results/alert.webp',
};

const consequenceImage = (choiceId: string) => `/images/consequences/${choiceId.toLowerCase()}.webp`;

const DEMO_RECORDS: GameRecord[] = [
  {
    id: 'DEMO-0826', studentCode: '示範－07', completedAt: '2026-09-09T10:18:00+08:00',
    scenarioOrder: ['S05', 'S01', 'S04'],
    responses: [], finalMetrics: { think: 63, safe: 57, responsibility: 61 }, resultTitle: '穩健選擇者',
  },
  {
    id: 'DEMO-0814', studentCode: '示範－12', completedAt: '2026-09-09T09:52:00+08:00',
    scenarioOrder: ['S03', 'S06', 'S07'],
    responses: [], finalMetrics: { think: 45, safe: 34, responsibility: 43 }, resultTitle: '無心警報',
  },
];

function MetricBars({ metrics, compact = false }: { metrics: Metrics; compact?: boolean }) {
  return (
    <div className={compact ? 'grid gap-2 sm:grid-cols-3' : 'grid gap-3 sm:grid-cols-3'}>
      {(Object.keys(METRIC_META) as MetricKey[]).map((key) => {
        const meta = METRIC_META[key];
        return (
          <Progress key={key} value={metrics[key]} className={`rounded-2xl border border-border/70 bg-white/75 ${compact ? 'p-3' : 'p-4'} shadow-sm`}>
            <ProgressLabel className="font-bold">{meta.label}</ProgressLabel>
            <ProgressValue className="font-black text-foreground">{metrics[key]}</ProgressValue>
            <ProgressTrack className="h-2.5 bg-muted"><ProgressIndicator className={meta.color} /></ProgressTrack>
            {!compact && <p className="w-full text-xs text-muted-foreground">{meta.short}</p>}
          </Progress>
        );
      })}
    </div>
  );
}

function AppHeader({ onHome, badge }: { onHome: () => void; badge?: string }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <button onClick={onHome} className="flex items-center gap-3 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary" aria-label="回到首頁">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_5px_0_oklch(0.38_0.08_242)]"><BookOpenCheck className="size-6" /></span>
        <span><strong className="block text-sm tracking-[.12em] text-primary">L2 無心的錯誤</strong><small className="text-xs text-muted-foreground">下一步，想清楚！</small></span>
      </button>
      {badge && <Badge className="h-8 bg-secondary px-3 text-secondary-foreground">{badge}</Badge>}
    </header>
  );
}

function DeltaPills({ delta }: { delta: Metrics }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(METRIC_META) as MetricKey[]).map((key) => (
        <Badge key={key} variant="outline" className={delta[key] >= 0 ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-800'}>
          {METRIC_META[key].label} {delta[key] > 0 ? '+' : ''}{delta[key]}
        </Badge>
      ))}
    </div>
  );
}

export function GameApp() {
  const [view, setView] = useState<View>('home');
  const [studentCode, setStudentCode] = useState('');
  const [enabledIds, setEnabledIds] = useState<string[]>(SCENARIOS.map((item) => item.id));
  const [requiredId, setRequiredId] = useState<string>('');
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [rounds, setRounds] = useState<Scenario[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [metrics, setMetrics] = useState<Metrics>(INITIAL_METRICS);
  const [responses, setResponses] = useState<RoundResponse[]>([]);
  const [settingsMessage, setSettingsMessage] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const settings = localStorage.getItem(SETTINGS_KEY);
      if (saved) setRecords(JSON.parse(saved));
      if (settings) {
        const parsed = JSON.parse(settings);
        setEnabledIds(parsed.enabledIds ?? SCENARIOS.map((item) => item.id));
        setRequiredId(parsed.requiredId ?? '');
      }
    } catch { /* Keep the preview usable when browser storage is unavailable. */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch { /* preview only */ }
  }, [records]);

  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ enabledIds, requiredId })); } catch { /* preview only */ }
  }, [enabledIds, requiredId]);

  const startGame = (code = studentCode || '訪客') => {
    const pool = SCENARIOS.filter((scenario) => enabledIds.includes(scenario.id));
    if (pool.length < 3) { setSettingsMessage('請先啟用至少 3 個情境。'); return; }
    const required = pool.find((scenario) => scenario.id === requiredId);
    const rest = required ? pool.filter((scenario) => scenario.id !== required.id) : pool;
    const picked = required ? [required, ...shuffle(rest).slice(0, 2)] : shuffle(pool).slice(0, 3);
    const ordered = shuffle(picked);
    setStudentCode(code.trim() || '訪客');
    setRounds(ordered); setRoundIndex(0); setChoices(shuffle(ordered[0].choices));
    setMetrics(INITIAL_METRICS); setResponses([]); setSelected(null); setView('game');
  };

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool?: (tool: unknown, options?: unknown) => unknown } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'start_random_game', title: '開始三輪情境遊戲',
      description: '使用目前教師設定，開始一場新的三輪隨機情境遊戲。',
      inputSchema: { type: 'object', properties: { studentCode: { type: 'string' } }, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input: unknown) => {
        const code = typeof input === 'object' && input && 'studentCode' in input ? String((input as { studentCode: unknown }).studentCode) : '訪客';
        startGame(code); return { status: 'started', rounds: 3 };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [enabledIds, requiredId]);

  const choose = (item: Choice, position: number) => {
    if (selected) return;
    const nextMetrics = {
      think: clamp(metrics.think + item.delta.think),
      safe: clamp(metrics.safe + item.delta.safe),
      responsibility: clamp(metrics.responsibility + item.delta.responsibility),
    };
    const scenario = rounds[roundIndex];
    setSelected(item); setMetrics(nextMetrics);
    setResponses((current) => [...current, {
      scenarioId: scenario.id, scenarioTitle: scenario.title, choiceId: item.id,
      choiceLabel: item.label, displayPosition: position + 1, displayOrder: choices.map((choiceItem) => choiceItem.id),
      consequence: item.consequence, repair: item.repair, delta: item.delta,
    }]);
  };

  const nextRound = () => {
    if (roundIndex < 2) {
      const next = roundIndex + 1;
      setRoundIndex(next); setChoices(shuffle(rounds[next].choices)); setSelected(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const result = getResult(metrics);
    const record: GameRecord = {
      id: `G-${Date.now().toString(36).toUpperCase()}`, studentCode,
      completedAt: new Date().toISOString(), scenarioOrder: rounds.map((item) => item.id),
      responses, finalMetrics: metrics, resultTitle: result.title,
    };
    setRecords((current) => [record, ...current]);
    void syncGameRecordToFirebase(record);
    setView('result'); window.scrollTo({ top: 0 });
  };

  const resetHome = () => { setView('home'); setSelected(null); setSettingsMessage(''); };
  const scenario = rounds[roundIndex];

  if (view === 'home') return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,oklch(0.91_0.09_244/.34),transparent_34%),radial-gradient(circle_at_88%_88%,oklch(0.9_0.1_68/.35),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-10 sm:py-8">
        <AppHeader onHome={resetHome} badge="公開測試版" />
        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.05fr_.95fr]">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-5 h-8 border-primary/25 bg-white/60 px-3 text-primary"><Sparkles /> 三輪選擇，一次練習</Badge>
            <h1 className="text-balance text-5xl font-black leading-[1.08] tracking-tight text-primary sm:text-6xl lg:text-7xl">下一步，<span className="relative inline-block text-accent-foreground after:absolute after:inset-x-0 after:-bottom-1 after:-z-10 after:h-3 after:-rotate-1 after:rounded-full after:bg-accent">想清楚！</span></h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-foreground/75">朋友的提議聽起來很好玩，但接下來會發生什麼？</p>
            <div className="mt-7 grid max-w-xl grid-cols-3 gap-3 text-center">
              {[['1', '停一下', '數 1、2、3'], ['2', '想後果', '會影響誰？'], ['3', '做決定', '並且負責']].map(([number, title, note]) => (
                <div key={number} className="rounded-2xl border border-border/70 bg-white/70 px-2 py-4 shadow-sm"><span className="mx-auto grid size-8 place-items-center rounded-full bg-accent font-black text-accent-foreground">{number}</span><p className="mt-2 font-bold">{title}</p><p className="text-xs text-muted-foreground">{note}</p></div>
              ))}
            </div>
          </div>
          <Card className="border-2 border-primary/10 bg-card/92 py-0 shadow-[0_24px_70px_oklch(0.32_0.05_240/.14)]">
            <CardContent className="p-6 sm:p-8">
              <p className="text-sm font-bold tracking-widest text-muted-foreground">選擇入口</p><h2 className="mt-2 text-2xl font-black text-primary">今天要從哪裡開始？</h2>
              <div className="mt-6 space-y-4">
                <Button onClick={() => setView('student-setup')} size="lg" className="h-auto w-full justify-between rounded-2xl px-5 py-5 text-left text-base shadow-[0_5px_0_oklch(0.38_0.08_242)]"><span className="flex items-center gap-4"><span className="grid size-11 place-items-center rounded-xl bg-white/15"><Gamepad2 className="size-6" /></span><span><strong className="block text-lg">我是學生</strong><small className="font-medium opacity-80">開始三輪情境挑戰</small></span></span><ArrowRight className="size-6" /></Button>
                <Button onClick={() => setView('teacher')} variant="outline" size="lg" className="h-auto w-full justify-between rounded-2xl border-2 px-5 py-5 text-left text-base"><span className="flex items-center gap-4"><span className="grid size-11 place-items-center rounded-xl bg-secondary"><GraduationCap className="size-6 text-secondary-foreground" /></span><span><strong className="block text-lg">我是教師</strong><small className="font-medium text-muted-foreground">查看紀錄與指定情境</small></span></span><ArrowRight className="size-6" /></Button>
              </div>
              <p className="mt-6 rounded-xl bg-muted px-4 py-3 text-center text-sm font-medium text-muted-foreground">每次隨機出現 3 個不同情境</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );

  if (view === 'student-setup') return (
    <main className="min-h-screen bg-background px-5 py-6 sm:px-10 sm:py-8">
      <div className="mx-auto max-w-3xl"><AppHeader onHome={resetHome} badge="學生挑戰" />
        <Card className="mt-10 border-2 border-primary/10 bg-card py-0 shadow-xl"><CardContent className="p-7 sm:p-10">
          <Badge className="bg-accent text-accent-foreground">開始之前</Badge><h1 className="mt-4 text-3xl font-black text-primary">準備好做三次選擇了嗎？</h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">輸入座號或學生代碼。預覽版只會把紀錄保存在這個瀏覽器。</p>
          <label className="mt-7 block text-base font-bold" htmlFor="studentCode">學生代碼</label>
          <Input id="studentCode" value={studentCode} onChange={(event) => setStudentCode(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') startGame(); }} placeholder="例如：701-07" className="mt-2 h-13 rounded-xl bg-white px-4 text-lg" maxLength={20} />
          <div className="mt-6 rounded-2xl bg-secondary/70 p-5"><p className="font-black text-secondary-foreground">記住三個動作</p><p className="mt-2 text-base leading-7 text-secondary-foreground/90">停下來數 1、2、3 → 想一想會有什麼後果 → 做出決定，並對後果負責。</p></div>
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button variant="ghost" size="lg" onClick={resetHome}><ArrowLeft />返回</Button><Button size="lg" className="h-12 rounded-xl px-6 text-base" onClick={() => startGame()}>開始抽題<ArrowRight /></Button></div>
        </CardContent></Card>
      </div>
    </main>
  );

  if (view === 'game' && scenario) {
    const SceneIcon = sceneIcons[scenario.icon];
    return (
      <main className="min-h-screen bg-background px-4 py-5 sm:px-8 sm:py-7">
        <div className="mx-auto max-w-5xl"><AppHeader onHome={resetHome} badge={`第 ${roundIndex + 1}／3 輪`} />
          <div className="mt-6"><MetricBars metrics={metrics} compact /></div>
          <div className="mt-6 grid gap-5 lg:grid-cols-[.78fr_1.22fr]">
            <Card className="border-0 bg-primary py-0 text-primary-foreground shadow-[0_8px_0_oklch(0.38_0.08_242)]"><CardContent className="flex h-full flex-col p-6 sm:p-7">
              <div className="flex items-center justify-between"><Badge className="bg-white/15 text-white">{scenario.place}</Badge><span className="text-sm font-bold opacity-75">{scenario.id}</span></div>
              <div className="relative mt-6 overflow-hidden rounded-2xl border-4 border-white/20 bg-white/10 shadow-lg">
                <img src={scenario.image} alt={`${scenario.title}情境水彩插圖`} className="aspect-[4/3] w-full object-cover" />
                <span className="absolute bottom-3 left-3 grid size-11 place-items-center rounded-xl bg-primary/90 text-white shadow-md"><SceneIcon className="size-6" /></span>
              </div>
              <h1 className="mt-5 text-3xl font-black">{scenario.title}</h1><p className="mt-3 text-base leading-7 text-white/80">{scenario.scene}</p>
              <div className="mt-auto pt-8"><p className="text-sm font-bold text-white/65">這一題想想</p><p className="mt-1 font-bold">{scenario.focus}</p></div>
            </CardContent></Card>
            <Card className="border-2 border-primary/10 bg-card py-0 shadow-lg"><CardContent className="p-5 sm:p-7">
              <div className="rounded-2xl border-l-4 border-accent bg-accent/15 p-5"><p className="text-sm font-black text-accent-foreground">{scenario.speaker}說：</p><p className="mt-2 text-lg font-bold leading-8">「{scenario.proposal}」</p></div>
              {!selected ? <>
                <p className="mb-3 mt-6 font-black text-primary">你會怎麼回答？</p><div className="space-y-3">{choices.map((item, index) => {
                  const ChoiceIcon = choiceIcons[item.id] ?? MessageCircle;
                  return <button key={item.id} onClick={() => choose(item, index)} className="group grid w-full grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-2xl border-2 border-border bg-white p-3.5 text-left text-base font-bold leading-7 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"><span className="relative grid size-12 shrink-0 place-items-center rounded-xl bg-muted text-primary group-hover:bg-primary group-hover:text-white"><ChoiceIcon className="size-6" /><small className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-accent text-[11px] font-black text-accent-foreground">{index + 1}</small></span><span>{item.label}</span><ChevronRight className="size-5 shrink-0 text-muted-foreground" /></button>;
                })}</div><p className="mt-4 text-center text-xs text-muted-foreground">線條圖只幫助理解內容，不代表答案好壞；請讀完再決定。</p>
              </> : <div className="mt-6" aria-live="polite"><Badge className="bg-secondary text-secondary-foreground"><Check />選擇完成</Badge><h2 className="mt-4 text-2xl font-black text-primary">接下來發生了……</h2><div className="mt-4 overflow-hidden rounded-2xl border-2 border-primary/10 bg-muted shadow-sm"><img src={consequenceImage(selected.id)} alt={`${scenario.title}中這個選擇造成的後果水彩圖`} className="aspect-[16/9] w-full object-cover" /></div><p className="mt-4 text-base leading-8">{selected.consequence}</p>{selected.repair && <div className="mt-4 rounded-2xl bg-secondary/60 p-4"><p className="font-black text-secondary-foreground">可以這樣補救</p><p className="mt-1 leading-7 text-secondary-foreground/90">{selected.repair}</p></div>}<div className="mt-5"><DeltaPills delta={selected.delta} /></div><p className="mt-5 rounded-xl bg-muted p-4 font-bold leading-7">{scenario.takeaway}</p><Button onClick={nextRound} size="lg" className="mt-6 h-12 w-full rounded-xl text-base">{roundIndex === 2 ? '查看最後結果' : '進入下一輪'}<ArrowRight /></Button></div>}
            </CardContent></Card>
          </div>
        </div>
      </main>
    );
  }

  if (view === 'result') {
    const result = getResult(metrics);
    const lowest = (Object.keys(metrics) as MetricKey[]).sort((a, b) => metrics[a] - metrics[b])[0];
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-8"><div className="mx-auto max-w-5xl"><AppHeader onHome={resetHome} badge="挑戰完成" />
        <section className="mt-7 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <Card className="border-0 bg-primary py-0 text-primary-foreground shadow-[0_8px_0_oklch(0.38_0.08_242)]"><CardContent className="p-6 sm:p-8"><div className="overflow-hidden rounded-2xl border-4 border-white/20 bg-white/10"><img src={resultImages[result.key]} alt={`${result.title}結果水彩插圖`} className="aspect-[4/3] w-full object-cover" /></div><div className="mt-5 flex items-center gap-3"><Trophy className="size-9 text-accent" /><div><p className="text-sm font-bold tracking-widest text-white/65">你的稱號</p><h1 className="text-4xl font-black">{result.title}</h1></div></div><p className="mt-4 text-lg leading-8 text-white/85">{result.text}</p><div className="mt-6 rounded-2xl bg-white/12 p-5"><p className="font-black">這次最需要練習</p><p className="mt-1 text-lg">{METRIC_META[lowest].label}｜{METRIC_META[lowest].short}</p></div></CardContent></Card>
          <div><MetricBars metrics={metrics} /><Card className="mt-5 border-2 border-accent/40 bg-card py-0"><CardContent className="p-6"><div className="flex items-center gap-3"><Lightbulb className="size-7 text-accent-foreground" /><h2 className="text-2xl font-black text-primary">遇到提議時：停、想、做</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{[['1', '停', '停下來，數 1、2、3。'], ['2', '想', '想一想會有什麼後果。'], ['3', '做', '做出決定，並對後果負責。']].map(([number, title, text]) => <div key={number} className="rounded-2xl bg-muted p-4"><span className="grid size-8 place-items-center rounded-full bg-accent font-black text-accent-foreground">{number}</span><p className="mt-3 text-xl font-black">{title}</p><p className="mt-1 leading-6 text-muted-foreground">{text}</p></div>)}</div><p className="mt-5 text-center text-lg font-black text-accent-foreground">停一下，想後果，再決定；做了選擇，就要負責。</p></CardContent></Card></div>
        </section>
        <section className="mt-7"><h2 className="text-2xl font-black text-primary">三次選擇回顧</h2><div className="mt-4 grid gap-4 lg:grid-cols-3">{responses.map((response, index) => <Card key={`${response.scenarioId}-${index}`} className="py-0"><CardContent className="p-5"><Badge variant="outline">第 {index + 1} 輪</Badge><h3 className="mt-3 text-lg font-black">{response.scenarioTitle}</h3><p className="mt-2 text-sm font-bold leading-6">你的選擇：{response.choiceLabel}</p><div className="mt-4"><DeltaPills delta={response.delta} /></div></CardContent></Card>)}</div></section>
        <div className="my-8 flex flex-col gap-3 sm:flex-row sm:justify-center"><Button variant="outline" size="lg" onClick={() => setView('teacher')}><ClipboardList />查看教師端紀錄</Button><Button size="lg" onClick={() => { setStudentCode(''); setView('student-setup'); }}><RefreshCcw />再玩一次</Button></div>
      </div></main>
    );
  }

  const allRecords = [...records, ...DEMO_RECORDS];
  const averages = allRecords.length ? (Object.keys(INITIAL_METRICS) as MetricKey[]).reduce((acc, key) => ({ ...acc, [key]: Math.round(allRecords.reduce((sum, record) => sum + record.finalMetrics[key], 0) / allRecords.length) }), {} as Metrics) : INITIAL_METRICS;

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-5 sm:px-8"><div className="mx-auto max-w-7xl"><AppHeader onHome={resetHome} badge="教師端｜本機預覽" />
      <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-black text-primary">班級學習概況</h1><p className="mt-1 text-base text-muted-foreground">預覽版紀錄只存在這個瀏覽器；標示「示範」的資料可用來預覽版面。</p></div><Button onClick={() => setView('student-setup')}><Gamepad2 />切換到學生端</Button></div>
      <Tabs defaultValue="overview" className="mt-6"><TabsList className="h-11 w-full justify-start overflow-x-auto rounded-xl bg-white p-1 sm:w-fit"><TabsTrigger value="overview" className="px-4"><BarChart3 />總覽</TabsTrigger><TabsTrigger value="records" className="px-4"><ClipboardList />遊戲紀錄</TabsTrigger><TabsTrigger value="scenarios" className="px-4"><Sparkles />指定情境</TabsTrigger></TabsList>
        <TabsContent value="overview" className="mt-5"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><SummaryCard icon={Users} label="完成遊戲" value={`${allRecords.length} 次`} note={`${records.length} 筆實際預覽紀錄`} /><SummaryCard icon={ClipboardList} label="今日紀錄" value={`${allRecords.length} 次`} note="含 2 筆示範資料" /><SummaryCard icon={ShieldCheck} label="平均安全值" value={`${averages.safe}`} note="三項中可優先討論" /><SummaryCard icon={Sparkles} label="目前必出" value={requiredId || '未指定'} note={requiredId ? SCENARIOS.find((item) => item.id === requiredId)?.title ?? '' : '由啟用題庫隨機抽題'} /></div><Card className="mt-5 py-0"><CardHeader className="border-b p-6"><CardTitle className="text-xl font-black text-primary">班級選擇力平均</CardTitle></CardHeader><CardContent className="p-6"><MetricBars metrics={averages} /></CardContent></Card></TabsContent>
        <TabsContent value="records" className="mt-5"><Card className="py-0"><CardHeader className="border-b p-5"><CardTitle className="text-xl font-black text-primary">每次遊戲紀錄</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-muted text-sm text-muted-foreground"><tr><th className="p-4">學生代碼</th><th className="p-4">完成時間</th><th className="p-4">情境順序</th><th className="p-4">三思／安全／責任</th><th className="p-4">結果</th></tr></thead><tbody>{allRecords.map((record) => <tr key={record.id} className="border-t bg-white"><td className="p-4 font-bold">{record.studentCode}{record.id.startsWith('DEMO') && <Badge variant="outline" className="ml-2">示範</Badge>}</td><td className="p-4 text-sm text-muted-foreground">{new Date(record.completedAt).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td className="p-4"><div className="flex gap-1">{record.scenarioOrder.map((id) => <Badge key={id} variant="secondary">{id}</Badge>)}</div></td><td className="p-4 font-bold tabular-nums">{record.finalMetrics.think}／{record.finalMetrics.safe}／{record.finalMetrics.responsibility}</td><td className="p-4"><Badge>{record.resultTitle}</Badge></td></tr>)}</tbody></table></div>{allRecords.length === 0 && <p className="p-10 text-center text-muted-foreground">還沒有完成紀錄。</p>}</CardContent></Card></TabsContent>
        <TabsContent value="scenarios" className="mt-5"><div className="grid gap-5 lg:grid-cols-[1fr_.72fr]"><Card className="py-0"><CardHeader className="border-b p-5"><CardTitle className="text-xl font-black text-primary">情境題庫</CardTitle></CardHeader><CardContent className="divide-y p-0">{SCENARIOS.map((item) => { const Icon = sceneIcons[item.icon]; const isEnabled = enabledIds.includes(item.id); return <div key={item.id} className="flex items-center gap-4 p-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted"><Icon className="size-5 text-primary" /></span><div className="min-w-0 flex-1"><p className="font-black">{item.id}｜{item.title}</p><p className="truncate text-sm text-muted-foreground">{item.focus}</p></div><Switch checked={isEnabled} onCheckedChange={(checked) => { if (!checked && enabledIds.length <= 3) { setSettingsMessage('至少要保留 3 個啟用情境。'); return; } const next = checked ? [...enabledIds, item.id] : enabledIds.filter((id) => id !== item.id); setEnabledIds(next); if (!checked && requiredId === item.id) setRequiredId(''); setSettingsMessage('設定已保存在本機預覽。'); }} aria-label={`${isEnabled ? '停用' : '啟用'}${item.title}`} /></div>; })}</CardContent></Card>
          <Card className="h-fit border-2 border-primary/10 py-0"><CardContent className="p-6"><Badge className="bg-accent text-accent-foreground">教師指定</Badge><h2 className="mt-3 text-xl font-black text-primary">本次必出情境</h2><p className="mt-2 leading-6 text-muted-foreground">學生仍會回答三題；指定題保證出現，另外兩題隨機抽出，三題順序也會洗牌。</p><div className="mt-5 space-y-2"><button onClick={() => { setRequiredId(''); setSettingsMessage('已改回完全隨機。'); }} className={`flex w-full items-center justify-between rounded-xl border-2 p-3 text-left font-bold ${requiredId === '' ? 'border-primary bg-primary/5' : 'border-border bg-white'}`}>不指定，完全隨機{requiredId === '' && <Check className="size-5 text-primary" />}</button>{SCENARIOS.filter((item) => enabledIds.includes(item.id)).map((item) => <button key={item.id} onClick={() => { setRequiredId(item.id); setSettingsMessage(`已指定 ${item.id}｜${item.title}`); }} className={`flex w-full items-center justify-between rounded-xl border-2 p-3 text-left font-bold ${requiredId === item.id ? 'border-primary bg-primary/5' : 'border-border bg-white'}`}><span>{item.id}｜{item.title}</span>{requiredId === item.id && <Check className="size-5 text-primary" />}</button>)}</div>{settingsMessage && <p className="mt-4 rounded-xl bg-secondary/70 p-3 text-sm font-bold text-secondary-foreground" role="status">{settingsMessage}</p>}<Button className="mt-5 w-full" onClick={() => setView('student-setup')}>用這個設定開始預覽<ArrowRight /></Button><div className="mt-5 flex gap-2 rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground"><LockKeyhole className="mt-0.5 size-4 shrink-0" /><p>Firebase 安全規則與雲端送出介面已預留；正式啟用教師登入前，這裡仍只顯示目前裝置的紀錄。</p></div></CardContent></Card>
        </div></TabsContent>
      </Tabs>
    </div></main>
  );
}

function SummaryCard({ icon: Icon, label, value, note }: { icon: typeof Users; label: string; value: string; note: string }) {
  return <Card className="py-0"><CardContent className="p-5"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-secondary"><Icon className="size-5 text-secondary-foreground" /></span><ArrowRight className="size-4 text-muted-foreground" /></div><p className="mt-4 text-sm font-bold text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-black text-primary">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></CardContent></Card>;
}
