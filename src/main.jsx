import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles.css'

registerSW({ immediate: true })

const KANJI = [
['詩','し','詩を書く'],['葉','は','木の葉'],['習','ならう','漢字を習う'],['着','きる','服を着る'],['登','のぼる','山に登る'],['物','もの','持ち物'],['持','もつ','荷物を持つ'],['旅','たび','旅に出る'],['始','はじめる','勉強を始める'],['進','すすむ','前へ進む'],['動','うごく','体を動かす'],['深','ふかい','深い海'],['様','よう','同じ様子'],['面','めん','水面'],
['館','かん','図書館'],['号','ごう','三号車'],['調','しらべる','意味を調べる'],['使','つかう','辞書を使う'],['問','とう','問いに答える'],['意','い','意味'],['味','あじ','食べ物の味'],['湖','みずうみ','大きな湖'],['漢','かん','漢字'],['由','ゆう','理由'],['温','あたたかい','温かいお茶'],['酒','さけ','お酒'],['題','だい','問題'],['発','はつ','出発'],['章','しょう','第一章'],['平','たいら','平らな道'],
['決','きめる','予定を決める'],['事','こと','大事な事'],['落','おちる','葉が落ちる'],['相','あい','相手'],['洋','よう','西洋'],['服','ふく','洋服'],
['次','つぎ','次の問題'],['所','ところ','場所'],['県','けん','県'],['有','ゆう','有名'],['氷','こおり','氷を入れる'],['秒','びょう','十秒'],['農','のう','農家'],['仕','し','仕事'],['球','きゅう','地球'],['局','きょく','郵便局'],
['全','ぜん','全部'],['遊','あそぶ','公園で遊ぶ'],['表','ひょう','表を見る'],['昔','むかし','昔の話'],['世','せ','世界'],['界','かい','世界'],['速','はやい','速く走る'],['横','よこ','横に並ぶ'],['指','ゆび','指でさす'],['鉄','てつ','鉄道'],['安','やすい','安い店'],['定','てい','予定'],
['運','はこぶ','荷物を運ぶ'],['予','よ','予定'],['送','おくる','手紙を送る'],['住','すむ','東京に住む'],['具','ぐ','道具'],['拾','ひろう','ごみを拾う'],['向','むく','前を向く'],['坂','さか','坂道'],['悲','かなしい','悲しい話'],['緑','みどり','緑の葉'],['開','あける','窓を開ける'],['岸','きし','海岸'],['路','ろ','道路'],['感','かん','感想'],['対','たい','反対'],
['区','く','地区'],['陽','よう','太陽'],['整','ととのえる','列を整える'],['部','ぶ','一部分'],['泳','およぐ','海で泳ぐ'],['練','れん','練習'],['助','たすける','友だちを助ける'],['童','どう','児童'],['申','もうす','申しこむ'],
['品','しな','商品'],['商','しょう','商店'],['客','きゃく','お客さん'],['式','しき','入学式'],['去','きょ','去年'],['倍','ばい','二倍'],['筆','ふで','筆で書く'],['銀','ぎん','銀色'],
['植','うえる','花を植える'],['集','あつめる','虫を集める'],['化','か','変化'],['死','しぬ','虫が死ぬ'],['都','と','東京都']
].map(([kanji, reading, example]) => ({ kanji, reading, example }))

const STORAGE_KEY = 'grade3-kanji-summer-pwa-v2'
const initialState = { stars: 0, total: 0, correct: 0, days: {}, wrong: {}, right: {}, settings: { count: 5 } }
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5)
const todayKey = () => new Date().toLocaleDateString('sv-SE')

function loadState() {
  try { return { ...initialState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } }
  catch { return initialState }
}

function App() {
  const [screen, setScreen] = useState('home')
  const [data, setData] = useState(loadState)
  const [quiz, setQuiz] = useState([])
  const [index, setIndex] = useState(0)
  const [quizCorrect, setQuizCorrect] = useState(0)
  const [selected, setSelected] = useState(null)
  const [writeItem, setWriteItem] = useState(() => KANJI[Math.floor(Math.random() * KANJI.length)])
  const [showWriteAnswer, setShowWriteAnswer] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }, [data])
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const mastered = useMemo(() => KANJI.filter(x => (data.right[x.kanji] || 0) >= 3 && (data.right[x.kanji] || 0) > (data.wrong[x.kanji] || 0)).length, [data])
  const weakItems = useMemo(() => KANJI.map(x => ({ ...x, score: (data.wrong[x.kanji] || 0) - (data.right[x.kanji] || 0) })).filter(x => x.score > 0).sort((a,b) => b.score-a.score), [data])

  const makeQuestion = (item) => {
    const readingMode = Math.random() < .5
    const field = readingMode ? 'reading' : 'kanji'
    const answer = item[field]
    const distractors = shuffle(KANJI.filter(x => x.kanji !== item.kanji).map(x => x[field])).filter((v,i,a) => a.indexOf(v) === i).slice(0,3)
    return {
      item, answer, choices: shuffle([answer, ...distractors]),
      type: readingMode ? '読み方をえらぼう' : '漢字をえらぼう',
      prompt: readingMode ? `「${item.example}」の「${item.kanji}」の読み方は？` : `「${item.reading}」に合う漢字は？`
    }
  }

  const startQuiz = (mode = 'mixed') => {
    const count = Number(data.settings.count || 5)
    const pool = mode === 'weak' && weakItems.length >= 4 ? weakItems : KANJI
    setQuiz(shuffle(pool).slice(0, Math.min(count, pool.length)).map(makeQuestion))
    setIndex(0); setQuizCorrect(0); setSelected(null); setScreen('quiz')
  }

  const answer = (value) => {
    if (selected !== null) return
    const q = quiz[index]
    const ok = value === q.answer
    setSelected(value)
    if (ok) setQuizCorrect(v => v + 1)
    setData(prev => ({
      ...prev,
      stars: prev.stars + (ok ? 2 : 0), total: prev.total + 1, correct: prev.correct + (ok ? 1 : 0),
      days: { ...prev.days, [todayKey()]: (prev.days[todayKey()] || 0) + 1 },
      right: ok ? { ...prev.right, [q.item.kanji]: (prev.right[q.item.kanji] || 0) + 1 } : prev.right,
      wrong: ok ? prev.wrong : { ...prev.wrong, [q.item.kanji]: (prev.wrong[q.item.kanji] || 0) + 1 }
    }))
  }

  const next = () => {
    if (index + 1 >= quiz.length) setScreen('result')
    else { setIndex(v => v + 1); setSelected(null) }
  }

  const install = async () => {
    if (installPrompt) { installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null) }
    else alert('iPhoneではSafariの共有ボタンから「ホーム画面に追加」を選んでください。')
  }

  return <div className="app">
    <header className="top"><div className="brand">🏝️ 夏休み漢字たんけん<small>小学3年生・1学期</small></div><div className="pill">⭐ {data.stars}</div></header>

    {screen === 'home' && <>
      <section className="card hero"><div><h1>今日も5問、出発！</h1><p>1学期の漢字を少しずつ復習。間違えた漢字は、苦手漢字コースでもう一度。</p></div><div className="island">🗺️</div></section>
      <section className="grid">
        <button className="menu primary" onClick={() => startQuiz('mixed')}><strong>▶ 今日の問題</strong><span>読み・漢字選びをまぜて出題</span></button>
        <button className="menu" onClick={() => startQuiz('weak')}><strong>🔥 苦手漢字</strong><span>{weakItems.length ? `${weakItems.length}字を復習` : '間違えた漢字を中心に復習'}</span></button>
        <button className="menu" onClick={() => setScreen('write')}><strong>✍️ 書き取り練習</strong><span>指やApple Pencilで書いて自己採点</span></button>
        <button className="menu" onClick={() => setScreen('record')}><strong>📅 学習きろく</strong><span>カレンダーと苦手漢字を見る</span></button>
      </section>
      <section className="card"><h2>これまでの記録</h2><div className="stats">
        <Stat value={Object.keys(data.days).length} label="学習した日"/><Stat value={data.total} label="答えた数"/><Stat value={data.total ? `${Math.round(data.correct/data.total*100)}%` : '0%'} label="正解率"/><Stat value={mastered} label="マスター漢字"/>
      </div></section>
      <button className="install" onClick={install}>📲 ホーム画面に追加する</button>
    </>}

    {screen === 'quiz' && quiz[index] && <Quiz q={quiz[index]} index={index} total={quiz.length} selected={selected} answer={answer} next={next} quit={() => setScreen('home')} />}
    {screen === 'result' && <section className="card result"><div className="celebrate">🎉</div><h1>よくできました！</h1><div className="big-score">{quizCorrect}/{quiz.length}</div><p>{quizCorrect === quiz.length ? '全問正解！すごい！' : `${quiz.length-quizCorrect}問は、また復習しよう。`}</p><div className="actions"><button className="btn primary" onClick={() => startQuiz('mixed')}>もう一度</button><button className="btn sub" onClick={() => setScreen('home')}>ホームへ</button></div></section>}
    {screen === 'record' && <Record data={data} weakItems={weakItems} setData={setData} back={() => setScreen('home')} />}
    {screen === 'write' && <WritePractice item={writeItem} setItem={setWriteItem} showAnswer={showWriteAnswer} setShowAnswer={setShowWriteAnswer} canvasRef={canvasRef} back={() => setScreen('home')} />}
    <footer>学習データはこの端末に保存され、オフラインでも使えます。</footer>
  </div>
}

const Stat = ({value,label}) => <div className="stat"><b>{value}</b><small>{label}</small></div>

function Quiz({q,index,total,selected,answer,next,quit}) {
  const done = selected !== null
  return <section className="card"><div className="question-head"><button className="btn sub" onClick={quit}>← やめる</button><div className="progress"><div style={{width:`${((index + (done?1:0))/total)*100}%`}} /></div><b>{index+1}/{total}</b></div><div className="qtype">{q.type}</div><div className="prompt">{q.prompt}</div><div className="choices">{q.choices.map(c => <button key={c} disabled={done} onClick={() => answer(c)} className={`choice ${done && c===q.answer ? 'correct' : ''} ${done && c===selected && c!==q.answer ? 'wrong' : ''}`}>{c}</button>)}</div>{done && <div className={`feedback ${selected===q.answer?'ok':'ng'}`}>{selected===q.answer ? `せいかい！ 例：${q.item.example} ⭐2` : `おしい！ 正解は「${q.answer}」。例：${q.item.example}`}</div>}{done && <div className="actions"><button className="btn primary" onClick={next}>つぎへ →</button></div>}</section>
}

function Record({data,weakItems,setData,back}) {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth()
  const blanks = Array(new Date(y,m,1).getDay()).fill(null)
  const days = Array.from({length:new Date(y,m+1,0).getDate()}, (_,i) => i+1)
  return <><section className="card"><div className="question-head"><button className="btn sub" onClick={back}>← ホーム</button><h2>{y}年{m+1}月</h2><span/></div><div className="calendar">{['日','月','火','水','木','金','土'].map(d=><div className="day header" key={d}>{d}</div>)}{blanks.map((_,i)=><div key={`b${i}`} />)}{days.map(d=>{const key=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;return <div key={d} className={`day ${data.days[key]?'done':''} ${d===now.getDate()?'today':''}`}><b>{d}</b><i>{data.days[key]?'⭐':''}</i></div>})}</div></section><section className="card"><h2>苦手な漢字</h2><div className="weak-list">{weakItems.length ? weakItems.slice(0,20).map(x=><span className="kanji-chip" key={x.kanji}>{x.kanji}</span>) : <span className="muted">まだ苦手漢字はありません。</span>}</div></section><section className="card"><h2>設定</h2><label className="settings-row"><span>1回の問題数</span><select value={data.settings.count} onChange={e=>setData(p=>({...p,settings:{...p.settings,count:Number(e.target.value)}}))}><option value="5">5問</option><option value="10">10問</option><option value="20">20問</option></select></label><div className="actions"><button className="btn warn" onClick={()=>{if(confirm('学習記録をすべて消しますか？')) setData(initialState)}}>記録をリセット</button></div></section></>
}

function WritePractice({item,setItem,showAnswer,setShowAnswer,canvasRef,back}) {
  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas.getContext('2d'); let drawing=false
    ctx.lineWidth=14; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#17324d'
    const p=e=>{const r=canvas.getBoundingClientRect(),t=e.touches?.[0]||e;return{x:(t.clientX-r.left)*canvas.width/r.width,y:(t.clientY-r.top)*canvas.height/r.height}}
    const down=e=>{drawing=true;const x=p(e);ctx.beginPath();ctx.moveTo(x.x,x.y);e.preventDefault()}; const move=e=>{if(!drawing)return;const x=p(e);ctx.lineTo(x.x,x.y);ctx.stroke();e.preventDefault()}; const up=()=>drawing=false
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);window.addEventListener('pointerup',up)
    return()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up)}
  }, [canvasRef])
  const clear=()=>canvasRef.current.getContext('2d').clearRect(0,0,canvasRef.current.width,canvasRef.current.height)
  const next=()=>{setItem(KANJI[Math.floor(Math.random()*KANJI.length)]);setShowAnswer(false);clear()}
  return <section className="card"><div className="question-head"><button className="btn sub" onClick={back}>← ホーム</button><h2>書き取り練習</h2><span/></div><p className="muted">「{item.reading}」を漢字で書こう。</p><div className="prompt">「{item.reading}」</div><canvas ref={canvasRef} width="800" height="500" />{showAnswer&&<div className="answer-box">答え：{item.kanji}<small>{item.example}</small></div>}<div className="actions"><button className="btn sub" onClick={clear}>消す</button><button className="btn primary" onClick={()=>setShowAnswer(true)}>答えを見る</button><button className="btn sub" onClick={next}>つぎの問題</button></div></section>
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
