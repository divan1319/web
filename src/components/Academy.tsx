"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Award, BookOpen, BookmarkCheck, Check, CheckCircle2, ChevronDown,
  ChevronRight, Circle, ClipboardList, Clock3, Code2, Copy, Database, Download,
  ExternalLink, FileCode2, Filter, GraduationCap, Layers3, LayoutDashboard, Lightbulb,
  Menu, MessageSquareText, Moon, PanelLeftClose, PlayCircle, RotateCcw, Search, Settings2,
  ShieldCheck, Sparkles, Sun, Terminal, Trophy, Upload, X, Zap, type LucideIcon
} from "lucide-react";
import { lessons, modules, capstone, totalQuestions } from "@/lib/course";
import type { AppState, Lesson, LessonStatus } from "@/lib/types";

type Screen = "home"|"lesson"|"capstone"|"glossary"|"playground"|"settings";
type View = {screen:Screen;lessonId?:string};
type Panel = "theory"|"practice"|"quiz";
type QuizResult = {score:number;total:number;passed:boolean;results:{question:string;selected:number;correct:number;isCorrect:boolean;why:string}[]};
const EMPTY:AppState={progress:[],notes:{},labTasks:{},attempts:{},capstoneDone:[]};
const moduleLabels = ["C# y CRUD", "EF y PostgreSQL", "Arquitectura", "Seguridad", "Profundización", "Producción"];
const termList = [
  ["CLR","Common Language Runtime: ejecuta código administrado .NET."],["SDK","Herramientas para crear, compilar, probar y publicar aplicaciones."],
  [".csproj","Archivo XML de configuración de un proyecto .NET."],["ASP.NET Core","Framework web que recibe peticiones y ejecuta middleware/endpoints."],
  ["Middleware","Componente del pipeline HTTP que puede observar, procesar o delegar solicitudes."],
  ["DI","Inyección de dependencias: el contenedor crea objetos y resuelve sus dependencias."],
  ["Scoped","Ciclo de vida de dependencias con una instancia por ámbito, usualmente una solicitud HTTP."],
  ["Singleton","Una instancia compartida para la vida del contenedor."],["Transient","Nueva instancia por resolución del contenedor."],
  ["Record","Tipo C# con soporte para igualdad basada en valores y copia con with."],
  ["Nullable","Anotaciones que expresan cuándo puede aparecer null."],["DTO","Objeto que define datos de entrada o salida sin exponer directamente la entidad persistida."],
  ["DbContext","Unidad de trabajo de EF Core para consultar, rastrear y guardar cambios."],["DbSet<T>","Conjunto de entidades consultable y modificable mediante EF Core."],
  ["LINQ","Consultas integradas a C# sobre secuencias y proveedores como EF Core."],["IQueryable<T>","Consulta componible que un proveedor puede traducir y ejecutar."],
  ["IEnumerable<T>","Secuencia iterable, frecuentemente utilizada con colecciones ya materializadas."],
  ["AsNoTracking","Evita que EF Core rastree entidades de una consulta de lectura."],["N+1","Patrón ineficiente de una consulta inicial más una por cada elemento."],
  ["Unit of Work","Agrupa cambios para persistirlos de manera coordinada."],["Repository","Abstracción de acceso a datos que puede encapsular consultas/reglas de persistencia."],
  ["Migration","Cambio versionado de esquema de base de datos."],["ProblemDetails","Formato estándar para representar problemas HTTP."],
  ["CancellationToken","Token usado para solicitar cancelación cooperativa."],["Optimistic concurrency","Detección de cambios concurrentes mediante versión o token original."],
  ["Outbox","Patrón que guarda un evento en la misma transacción del cambio de negocio."],
  ["BOLA","Broken Object Level Authorization: acceso indebido a recursos de otros usuarios."],
  ["Keyset pagination","Paginación que continúa desde una clave en vez de un desplazamiento."],
  ["JWT","Token firmado que puede transportar claims; su firma, audiencia y emisor deben validarse."],
  ["Claim","Afirmación de identidad o autorización dentro de un principal autenticado."],
  ["OpenTelemetry","Instrumentación para métricas, logs y trazas distribuidas."],
  ["Testcontainers","Herramienta para levantar dependencias aisladas en contenedores durante tests."],
  ["Idempotencia","Propiedad que evita efectos duplicados al repetir una operación con la misma intención."],
];
function ProgressBar({value}:{value:number}) {return <div className="progress-track"><div className="progress-fill" style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></div>}
function ProgressRing({value,size=94}:{value:number;size?:number}){
  return <div className="progress-ring" style={{width:size,height:size,background:`conic-gradient(#7cdbbb ${Math.max(0,value)}%,rgba(255,255,255,.18) 0)`}}><div className="ring-inner"><strong>{value}%</strong><span>progreso</span></div></div>;
}
function Code({value,language="csharp"}:{value:string;language?:string}) {
  const [copied,setCopied]=useState(false);
  return <div className="code-panel">
    <div className="code-head"><span className="code-dots"><i/><i/><i/></span><span>{language.toUpperCase()}</span><button className="code-copy" onClick={async()=>{await navigator.clipboard.writeText(value).catch(()=>{});setCopied(true);setTimeout(()=>setCopied(false),1300)}} aria-label="Copiar código">{copied?<Check size={14}/>:<Copy size={14}/>} {copied?"Copiado":"Copiar"}</button></div>
    <pre><code>{value}</code></pre>
  </div>;
}
function Stat({icon:Icon,number,label,subtitle}:{icon:LucideIcon;number:string;label:string;subtitle:string}){
  return <div className="stat-card"><div className="stat-icon"><Icon size={19}/></div><div className="stat-num">{number}</div><div className="stat-label">{label}</div><div className="stat-sub">{subtitle}</div></div>;
}
function getHashView():View {
  if(typeof window==="undefined")return {screen:"home"};
  const raw=decodeURIComponent(window.location.hash.slice(1));
  if(raw.startsWith("/clase/")){const id=raw.slice(7);return lessons.some(l=>l.id===id)?{screen:"lesson",lessonId:id}:{screen:"home"}}
  return (["home","capstone","glossary","playground","settings"] as Screen[]).includes(raw.slice(1) as Screen)?{screen:raw.slice(1) as Screen}:{screen:"home"};
}
function LessonTag({lesson}:{lesson:Lesson}){return <span className={`level-pill ${lesson.level.toLowerCase()}`}>{lesson.level}</span>}
function FlowTiny(){return <div className="flow-tiny"><span><Code2 size={16}/> ASP.NET</span><ChevronRight size={15}/><span><Layers3 size={16}/> EF Core</span><ChevronRight size={15}/><span><Database size={16}/> PostgreSQL</span></div>}
function SummaryList({items}:{items:string[]}){return <ul className="summary-list">{items.map((item,i)=><li key={i}><CheckCircle2 size={16}/>{item}</li>)}</ul>}

function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggleTheme() {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    setDark(theme === "dark");
    try {
      localStorage.setItem("dotnet-atlas-theme", theme);
    } catch {
      // The theme still applies when browser storage is unavailable.
    }
  }

  return (
    <button type="button" className="theme-toggle" aria-label="Modo oscuro" aria-pressed={dark}
      title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"} onClick={toggleTheme}>
      {dark ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
    </button>
  );
}

export default function Academy(){
  const [view,setView]=useState<View>({screen:"home"});
  const [panel,setPanel]=useState<Panel>("theory");
  const [state,setState]=useState<AppState>(EMPTY);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [search,setSearch]=useState("");
  const [glossarySearch,setGlossarySearch]=useState("");
  const [sidebar,setSidebar]=useState(false);
  const [expanded,setExpanded]=useState<string[]>(modules);
  const [answers,setAnswers]=useState<Record<number,number>>({});
  const [result,setResult]=useState<QuizResult|null>(null);
  const [solution,setSolution]=useState(false);
  const [note,setNote]=useState("");
  const [noteSaved,setNoteSaved]=useState(false);
  const [pgResolved,setPgResolved]=useState("all");
  const [pgSearch,setPgSearch]=useState("");
  const [pgPage,setPgPage]=useState(1);
  const [pgSize,setPgSize]=useState(5);
  const importRef=useRef<HTMLInputElement>(null);

  const refreshState=useCallback(async()=>{
    const response=await fetch("/api/state",{cache:"no-store"});
    if(!response.ok)throw new Error("No se pudo leer el progreso de SQLite.");
    const data=await response.json() as AppState;
    setState(data);
  },[]);
  useEffect(()=>{
    setView(getHashView());
    const onHash=()=>setView(getHashView());
    window.addEventListener("hashchange",onHash);
    refreshState().catch(e=>setError(String(e))).finally(()=>setLoading(false));
    return()=>window.removeEventListener("hashchange",onHash);
  },[refreshState]);
  const current=lessons.find(l=>l.id===view.lessonId);
  useEffect(()=>{
    setAnswers({});setResult(null);setSolution(false);setPanel("theory");
    setNote(current?state.notes[current.id]??"":"");setNoteSaved(false);
    window.scrollTo({top:0,behavior:"instant"});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[view.lessonId,view.screen]);
  const progressFor=(id:string):LessonStatus|undefined=>state.progress.find(r=>r.lessonId===id);
  const isCompleted=(id:string)=>{const p=progressFor(id);return Boolean(p?.read && p?.passed)};
  const finished=lessons.filter(l=>isCompleted(l.id)).length;
  const seen=lessons.filter(l=>progressFor(l.id)?.read).length;
  const percentage=Math.round(finished/lessons.length*100);
  const quizAttempts=state.progress.reduce((sum,p)=>sum+p.attempts,0);
  const nextLesson=lessons.find(l=>!isCompleted(l.id))??lessons[lessons.length-1];
  const index=current?lessons.findIndex(l=>l.id===current.id):-1;

  const navigate=(v:View)=>{
    const fragment=v.screen==="lesson"?`#/clase/${v.lessonId}`:`#/${v.screen}`;
    if(window.location.hash===fragment)setView(v);else window.location.hash=fragment;
    setSidebar(false);
  };
  const send=async (url:string, body:unknown, then?:()=>void)=>{
    setBusy(true);setError(null);
    try{
      const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const payload=await res.json();
      if(!res.ok)throw new Error(payload.error || "No se pudo guardar el cambio.");
      await refreshState();then?.();
      return payload;
    }catch(e){setError(e instanceof Error?e.message:String(e));return null}
    finally{setBusy(false)}
  };
  const completeRead=()=>current&&send("/api/progress",{lessonId:current.id,read:!progressFor(current.id)?.read});
  const toggleTask=(task:number)=>{
    if(!current)return;
    const done=!(state.labTasks[current.id]??[]).includes(task);
    void send("/api/lab",{lessonId:current.id,index:task,done});
  };
  const submitQuiz=async()=>{
    if(!current)return;
    const selected=current.quiz.map((_,i)=>answers[i]);
    const response=await send("/api/quiz",{lessonId:current.id,answers:selected});
    if(response)setResult(response as QuizResult);
  };
  const saveNote=async()=>{
    if(!current)return;
    await send("/api/notes",{lessonId:current.id,note},()=>{setNoteSaved(true);setTimeout(()=>setNoteSaved(false),1700)});
  };
  const filteredLessons=useMemo(()=>lessons.filter(l=>`${l.title} ${l.lead} ${l.module}`.toLowerCase().includes(search.toLowerCase().trim())),[search]);
  useEffect(()=>{if(!loading&&current)setNote(state.notes[current.id]??"");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[loading]);

  return <div className="shell">
    {sidebar&&<button className="sidebar-backdrop" aria-label="Cerrar menú" onClick={()=>setSidebar(false)}/>}
    <aside className={`sidebar ${sidebar?"open":""}`}>
      <button className="brand" onClick={()=>navigate({screen:"home"})}>
        <span className="brand-symbol"><span>⌘</span></span>
        <span><strong>dotnet<span className="brand-accent">atlas</span></strong><small>ACADEMIA DE INGENIERÍA</small></span>
      </button>
      <div className="sidebar-scroll">
        <div className="nav-caption">TU ESPACIO</div>
        <button className={`nav-main ${view.screen==="home"?"selected":""}`} onClick={()=>navigate({screen:"home"})}><LayoutDashboard size={17}/> Vista general</button>
        <button className={`nav-main ${view.screen==="playground"?"selected":""}`} onClick={()=>navigate({screen:"playground"})}><Terminal size={17}/> Laboratorio LINQ <span className="nav-new">LIVE</span></button>
        <button className={`nav-main ${view.screen==="glossary"?"selected":""}`} onClick={()=>navigate({screen:"glossary"})}><BookOpen size={17}/> Glosario técnico</button>
        <button className={`nav-main ${view.screen==="capstone"?"selected":""}`} onClick={()=>navigate({screen:"capstone"})}><Trophy size={17}/> Proyecto final</button>
        <div className="nav-caption caption-course">RUTA DE APRENDIZAJE <span>{lessons.length} CLASES</span></div>
        <div className="sidebar-search"><Search size={15}/><input aria-label="Buscar clases" placeholder="Buscar una clase..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button onClick={()=>setSearch("")} aria-label="Borrar búsqueda"><X size={13}/></button>}</div>
        {modules.map((mod,i)=>{
          const group=filteredLessons.filter(l=>l.module===mod);
          if(group.length===0)return null;
          const open=expanded.includes(mod)||search.length>0;
          const done=lessons.filter(l=>l.module===mod&&isCompleted(l.id)).length;
          const total=lessons.filter(l=>l.module===mod).length;
          return <div className="module-nav" key={mod}>
            <button className="module-toggle" onClick={()=>setExpanded(prev=>prev.includes(mod)?prev.filter(x=>x!==mod):[...prev,mod])}>
              <span className="module-index">{String(i+1).padStart(2,"0")}</span><span>{moduleLabels[i]}</span><small>{done}/{total}</small>{open?<ChevronDown size={14}/>:<ChevronRight size={14}/>}</button>
            {open&&<div className="lesson-links">{group.map(l=><button key={l.id} className={`lesson-link ${view.lessonId===l.id?"current":""}`} onClick={()=>navigate({screen:"lesson",lessonId:l.id})}>
                <span className={`lesson-dot ${isCompleted(l.id)?"done":progressFor(l.id)?.read?"partial":""}`}>{isCompleted(l.id)?<Check size={10}/>:l.number}</span><span className="lesson-link-name">{l.title}</span>
              </button>)}</div>}
          </div>;
        })}
      </div>
      <div className="sidebar-footer"><button className={`nav-main ${view.screen==="settings"?"selected":""}`} onClick={()=>navigate({screen:"settings"})}><Settings2 size={17}/> Datos y configuración</button><div className="mini-progress"><div className="mini-progress-top"><span>Tu avance</span><strong>{percentage}%</strong></div><ProgressBar value={percentage}/><small>{finished} de {lessons.length} clases completadas</small></div></div>
    </aside>

    <div className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="menu-button" onClick={()=>setSidebar(v=>!v)} aria-label="Abrir menú"><Menu size={20}/></button><span className="crumb">FORMACIÓN / <strong>{view.screen==="home"?"Panel principal":view.screen==="lesson"?`CLASE ${current?.number??""}`:view.screen==="capstone"?"PROYECTO FINAL":view.screen==="glossary"?"GLOSARIO":view.screen==="playground"?"LABORATORIO":"CONFIGURACIÓN"}</strong></span></div><div className="topbar-right"><span className="env-pill"><span className="env-dot"/> modo local</span><span className="db-pill"><Database size={13}/> SQLite · progreso</span><ThemeToggle/></div></header>
      {error&&<div className="error-banner"><span>{error}</span><button onClick={()=>setError(null)}><X size={16}/></button></div>}
      {loading?<div className="loading"><div className="spinner"/> Cargando tu progreso...</div>:
        <main className="content">
          {view.screen==="home"&&<>
            <div className="intro-strip"><span className="intro-dot"/> CAMPUS INTERACTIVO <span className="intro-divider">/</span> RUTA COMPLETA DE BACKEND EMPRESARIAL</div>
            <section className="hero">
              <div className="hero-bg-mark">.NET</div>
              <div className="hero-content"><span className="eyebrow"><Sparkles size={14}/> APRENDIZAJE BASADO EN PROYECTOS</span><h1>De C# a software<br/><em>empresarial real.</em></h1><p>Una ruta práctica para dominar ASP.NET Core, Entity Framework, PostgreSQL, arquitectura, pruebas y despliegue. Una API de tickets como hilo conductor.</p><div className="hero-actions"><button className="btn btn-mint" onClick={()=>navigate({screen:"lesson",lessonId:nextLesson.id})}><PlayCircle size={18}/>{seen===0?"Comenzar ruta":"Continuar aprendizaje"}<ArrowRight size={17}/></button><button className="btn btn-hero-ghost" onClick={()=>navigate({screen:"capstone"})}><Trophy size={17}/> Ver el proyecto final</button></div></div>
              <div className="hero-aside"><ProgressRing value={percentage}/><div className="hero-aside-note">Tu camino,<br/><strong>a tu ritmo.</strong></div></div>
            </section>
            <div className="stats-grid"><Stat icon={BookOpen} number={String(lessons.length)} label="Clases guiadas" subtitle="Las clases del chat y lo que sigue"/><Stat icon={CheckCircle2} number={String(finished)} label="Clases aprobadas" subtitle={`${seen} marcadas como leídas`}/><Stat icon={ClipboardList} number={String(totalQuestions)} label="Preguntas de evaluación" subtitle="Corrección y explicación"/><Stat icon={Zap} number={String(quizAttempts)} label="Intentos registrados" subtitle="Historial conservado en SQLite"/></div>
            <div className="section-heading"><div><p className="overline">SIGUIENTE PASO</p><h2>Continuá por donde vas</h2></div><button className="text-link" onClick={()=>navigate({screen:"lesson",lessonId:nextLesson.id})}>Abrir clase <ArrowRight size={16}/></button></div>
            <button className="continue-card" onClick={()=>navigate({screen:"lesson",lessonId:nextLesson.id})}><div className="continue-number">{String(nextLesson.number).padStart(2,"0")}</div><div className="continue-body"><span className="continue-kicker">{nextLesson.module}</span><h3>{nextLesson.title}</h3><p>{nextLesson.lead}</p><div className="continue-meta"><Clock3 size={14}/> {nextLesson.duration} min · {nextLesson.quiz.length} preguntas · laboratorio</div></div><span className="round-arrow"><ArrowRight size={20}/></span></button>
            <div className="section-heading modules-title"><div><p className="overline">ROADMAP</p><h2>El mismo proyecto, paso a paso.</h2></div><span className="subtle-label">{lessons.length} lecciones</span></div>
            <div className="module-grid">{modules.map((m,i)=>{
              const group=lessons.filter(l=>l.module===m);
              const done=group.filter(l=>isCompleted(l.id)).length;
              const icons=[Code2,Layers3,Database,ShieldCheck,Zap,Trophy];const Icon=icons[i];
              return <button key={m} className="module-card" onClick={()=>navigate({screen:"lesson",lessonId:group.find(l=>!isCompleted(l.id))?.id??group[0].id})}>
                <div className="module-card-top"><span className={`module-art mod-${i}`}><Icon size={23}/></span><span className="module-count">MÓDULO {String(i+1).padStart(2,"0")}</span></div><h3>{m.split(" · ")[1]}</h3><p>{group.length} clases · {group.reduce((n,l)=>n+l.duration,0)} min estimados</p><ProgressBar value={Math.round(done/group.length*100)}/><div className="module-card-bottom"><span>{done}/{group.length} completadas</span><ArrowRight size={16}/></div>
              </button>;
            })}</div>
            <div className="bottom-note"><div className="bottom-icon"><Database size={20}/></div><div><strong>Dos bases de datos, dos propósitos.</strong><p>La plataforma guarda tu progreso local en <b>SQLite</b>. La API del proyecto de práctica utiliza <b>PostgreSQL</b> con EF Core.</p></div></div>
          </>}
          {view.screen==="lesson"&&current&&<>
            <div className="lesson-top"><button className="back-link" onClick={()=>navigate({screen:"home"})}><ArrowLeft size={16}/> Volver al panel</button><span className="lesson-position">CLASE {String(current.number).padStart(2,"0")} / {lessons.length}</span></div>
            <div className="lesson-header"><div className="lesson-header-main"><div className="lesson-meta-top"><span className="module-pill">{current.module}</span><LessonTag lesson={current}/></div><h1>{current.title}</h1><p>{current.lead}</p><div className="lesson-chips"><span><Clock3 size={15}/> {current.duration} min</span><span><FileCode2 size={15}/> {current.sections.length} temas</span><span><ClipboardList size={15}/> {current.quiz.length} preguntas</span></div></div><div className="lesson-header-icon"><BookOpen size={42}/></div></div>
            <div className="lesson-body-grid"><div>
              <div className="tab-bar" role="tablist" aria-label="Secciones de la clase">
                <button role="tab" aria-selected={panel==="theory"} className={panel==="theory"?"active":""} onClick={()=>setPanel("theory")}><BookOpen size={17}/> Lección</button>
                <button role="tab" aria-selected={panel==="practice"} className={panel==="practice"?"active":""} onClick={()=>setPanel("practice")}><Terminal size={17}/> Laboratorio {(state.labTasks[current.id]??[]).length===current.lab.tasks.length&&<CheckCircle2 size={14}/>}</button>
                <button role="tab" aria-selected={panel==="quiz"} className={panel==="quiz"?"active":""} onClick={()=>setPanel("quiz")}><ClipboardList size={17}/> Evaluación {progressFor(current.id)?.passed&&<CheckCircle2 size={14}/>}</button>
              </div>
              {panel==="theory"&&<div className="reading-panel"><div className="lesson-intro"><span className="block-eyebrow"><TargetIcon/> OBJETIVOS DE APRENDIZAJE</span><SummaryList items={current.outcomes}/></div>
                {current.files&&<div className="course-path"><strong><FileCode2 size={16}/> Sobre tu propia API</strong><p>Seguí sobre el proyecto TicketsApi que ya creaste. Estos archivos son los que revisás o modificás en esta clase:</p><div className="course-file-list">{current.files.map(f=><code key={f}>{f}</code>)}</div></div>}
                <details className="lesson-index" open={current.sections.length > 8 ? undefined : true}>
                  <summary><BookOpen size={16}/> Índice de la clase <span>{current.sections.length} apartados</span></summary>
                  <div className="lesson-index-links">{current.sections.map((section,i)=><button type="button" key={i} onClick={()=>document.getElementById(`paso-${current.number}-${i+1}`)?.scrollIntoView({behavior:"smooth",block:"start"})}>
                    <span>{String(i+1).padStart(2,"0")}</span>{section.heading}
                  </button>)}</div>
                </details>
                {current.sections.map((s,i)=><article className="reading-section" key={i} id={`paso-${current.number}-${i+1}`}>
                  <div className="step-heading"><span>{String(i+1).padStart(2,"0")}</span><h2>{s.heading}</h2></div>
                  {s.explanation.split("\n\n").map((p,j)=><p className={`body-copy ${p.startsWith("DEFINICIÓN.")?"definition-copy":p.startsWith("APLICACIÓN EN TICKETSAPI.")?"application-copy":""}`} key={j}>{p.startsWith("DEFINICIÓN.")?<><strong>Definición. </strong>{p.slice(12)}</>:p.startsWith("APLICACIÓN EN TICKETSAPI.")?<><strong>Aplicación en TicketsApi. </strong>{p.slice(26)}</>:p}</p>)}
                  {s.file&&<div className="section-file"><FileCode2 size={15}/><span>{s.file}</span></div>}
                  {s.code&&<Code value={s.code} language={s.language}/>}
                  {s.snippets?.map((example,j)=><div className="lesson-extra" key={j}><h3>{example.label}</h3><Code value={example.code} language={example.language}/></div>)}
                  {Boolean(s.details?.length)&&<ul className="lesson-tips">{s.details?.map((tip,j)=><li key={j}>{tip}</li>)}</ul>}
                  {s.insight&&<div className="insight"><Lightbulb size={17}/><p>{s.insight}</p></div>}
                </article>)}
                {current.checkpoint&&<div className="course-checkpoint"><CheckCircle2 size={18}/><div><strong>Al terminar esta clase, deberías conseguir:</strong><p>{current.checkpoint}</p></div></div>}
                <div className="lesson-action-row"><button className={`btn ${progressFor(current.id)?.read?"btn-outline":"btn-primary"}`} disabled={busy} onClick={completeRead}>{progressFor(current.id)?.read?<><CheckCircle2 size={17}/> Lección leída</>:<><BookmarkCheck size={17}/> Marcar como leída</>}</button><button className="btn btn-outline" onClick={()=>setPanel("practice")}>Ir al laboratorio <ArrowRight size={16}/></button></div>
              </div>}
              {panel==="practice"&&<div className="reading-panel"><span className="block-eyebrow"><Terminal size={16}/> TU TURNO</span><h2 className="panel-title">{current.lab.title}</h2><p className="body-copy">{current.lab.instructions}</p><div className="task-progress"><span>{(state.labTasks[current.id]??[]).length} / {current.lab.tasks.length} tareas</span><ProgressBar value={(state.labTasks[current.id]??[]).length/current.lab.tasks.length*100}/></div><div className="task-list">{current.lab.tasks.map((t,i)=><label key={i} className={`task ${state.labTasks[current.id]?.includes(i)?"checked":""}`}><input type="checkbox" checked={Boolean(state.labTasks[current.id]?.includes(i))} onChange={()=>toggleTask(i)} disabled={busy}/><span className="task-checkbox"><Check size={14}/></span><span>{t}</span></label>)}</div><div className="solution-area"><button onClick={()=>setSolution(!solution)} className="solution-toggle"><Lightbulb size={17}/> {solution?"Ocultar propuesta de solución":"Revisar solución de referencia"} {solution?<ChevronDown size={16}/>:<ChevronRight size={16}/>}</button>{solution&&<><p>Compará tu implementación antes de copiar el ejemplo:</p><Code value={current.lab.solution} /></>}</div><div className="lesson-action-row"><button className="btn btn-primary" onClick={()=>setPanel("quiz")}>Pasar a la evaluación <ArrowRight size={16}/></button></div></div>}
              {panel==="quiz"&&<div className="reading-panel"><div className="quiz-intro"><span className="block-eyebrow"><GraduationCap size={16}/> EVALUACIÓN DE CONOCIMIENTOS</span><h2 className="panel-title">Comprobá lo aprendido</h2><p className="body-copy">{current.quiz.length} preguntas de selección única. Se aprueba con al menos {Array.from({length:current.quiz.length+1},(_,i)=>i).find(n=>Math.round(n/current.quiz.length*100)>=67)} de {current.quiz.length} respuestas correctas (67%). Podés repetir la evaluación cuando quieras.</p></div>{current.quiz.map((q,i)=><div className="quiz-question" key={q.id}><div className="question-title"><span>{String(i+1).padStart(2,"0")}</span><h3>{q.prompt}</h3></div><div className="quiz-options">{q.options.map((op,j)=>{
                const selected=answers[i]===j;const disclosed=Boolean(result);const correct=disclosed&&result?.results[i].correct===j;const wrong=disclosed&&selected&&!correct;
                return <button type="button" disabled={disclosed} key={j} className={`quiz-option ${selected?"selected":""} ${correct?"correct":""} ${wrong?"wrong":""}`} onClick={()=>setAnswers(a=>({...a,[i]:j}))}><span className="option-letter">{String.fromCharCode(65+j)}</span><span>{op}</span>{correct?<CheckCircle2 size={19}/>:wrong?<X size={19}/>:selected?<Circle size={15}/>:null}</button>;
              })}</div>{result&&<div className={`question-feedback ${result.results[i].isCorrect?"positive":"negative"}`}><strong>{result.results[i].isCorrect?"Respuesta correcta":"Punto para reforzar"}</strong><p>{q.why}</p></div>}</div>)}
                {!result?<button className="btn btn-primary quiz-submit" disabled={busy||Object.keys(answers).length!==current.quiz.length} onClick={submitQuiz}><ClipboardList size={17}/> Corregir evaluación</button>:<div className="quiz-result"><div className={`result-number ${result.passed?"passed":"failed"}`}>{result.score}/{result.total}</div><div><h3>{result.passed?"¡Evaluación aprobada!":"Todavía podés mejorar"}</h3><p>{result.passed?"La puntuación quedó guardada en SQLite.":"Revisá el feedback e intentá nuevamente. El mejor resultado se conserva."}</p><button className="btn btn-outline btn-small" onClick={()=>{setAnswers({});setResult(null)}}><RotateCcw size={15}/> Repetir evaluación</button></div></div>}
                {Boolean(state.attempts[current.id]?.length)&&<div className="attempt-history"><strong>Historial de intentos</strong><div>{state.attempts[current.id].slice(0,6).map((a,i)=><span key={i}>Intento reciente {i+1}: <b>{a.score}/{a.total}</b></span>)}</div></div>}
              </div>}
              <div className="lesson-pager"><button disabled={index===0} onClick={()=>navigate({screen:"lesson",lessonId:lessons[index-1].id})}><ArrowLeft size={16}/> Clase anterior</button><button onClick={()=>index===lessons.length-1?navigate({screen:"capstone"}):navigate({screen:"lesson",lessonId:lessons[index+1].id})}>{index===lessons.length-1?"Proyecto final":"Siguiente clase"} <ArrowRight size={16}/></button></div>
            </div><aside className="lesson-rail"><div className="rail-card"><div className="rail-title"><GraduationCap size={17}/> ESTADO DE LA CLASE</div><div className="rail-step"><span className={progressFor(current.id)?.read?"complete":""}><Check size={13}/></span><p>Lectura completada</p></div><div className="rail-step"><span className={(state.labTasks[current.id]??[]).length===current.lab.tasks.length?"complete":""}><Check size={13}/></span><p>Laboratorio realizado</p></div><div className="rail-step"><span className={progressFor(current.id)?.passed?"complete":""}><Check size={13}/></span><p>Evaluación aprobada</p></div><ProgressBar value={(Number(Boolean(progressFor(current.id)?.read))+Number(Boolean(progressFor(current.id)?.passed))+((state.labTasks[current.id]??[]).length/current.lab.tasks.length))/3*100}/><div className="rail-foot">Mejor examen: <b>{progressFor(current.id)?.attempts?`${progressFor(current.id)?.bestScore}%`:"Sin intentos"}</b></div></div>
              <div className="rail-card"><div className="rail-title"><BookOpen size={17}/> DOCUMENTACIÓN OFICIAL</div>{current.resources.map(r=><a className="resource-link" key={r.url} href={r.url} target="_blank" rel="noopener noreferrer">{r.label}<ExternalLink size={13}/></a>)}</div>
              <div className="rail-card notes-card"><div className="rail-title"><MessageSquareText size={17}/> NOTAS PERSONALES</div><p>Guardá hallazgos, dudas o comandos para retomarlos después.</p><textarea value={note} onChange={e=>{setNote(e.target.value);setNoteSaved(false)}} rows={5} placeholder="Ej.: revisar cómo funciona AsNoTracking..."/><button className="btn btn-outline btn-small" onClick={saveNote} disabled={busy}>{noteSaved?<Check size={15}/>:<BookmarkCheck size={15}/>} {noteSaved?"Guardado":"Guardar en SQLite"}</button></div>
            </aside></div>
          </>}
          {view.screen==="capstone"&&<><div className="page-top"><span className="overline">PROYECTO DE GRADUACIÓN</span><h1>{capstone.name}</h1><p>{capstone.description}</p></div><div className="capstone-banner"><div><Trophy size={32}/><h2>Construí, probá y desplegá</h2><p>Tu proyecto final unifica todo lo aprendido en un flujo empresarial con criterios verificables.</p></div><span className="big-cap">26 <small>clases</small></span></div><div className="section-heading"><div><p className="overline">RÚBRICA DE ENTREGA</p><h2>Requisitos de aceptación</h2></div></div><div className="acceptance-progress"><strong>{(state.capstoneDone??[]).length} / {capstone.acceptance.length}</strong> criterios completados <ProgressBar value={(state.capstoneDone??[]).length/capstone.acceptance.length*100}/></div><div className="acceptance-list">{capstone.acceptance.map((a,i)=><button className={`acceptance-item ${state.capstoneDone?.includes(i)?"achieved":""}`} key={a} onClick={()=>void send("/api/capstone",{index:i,done:!state.capstoneDone?.includes(i)})}><span className="accept-num">{state.capstoneDone?.includes(i)?<CheckCircle2 size={19}/>:String(i+1).padStart(2,"0")}</span><p>{a}</p><ArrowRight size={15}/></button>)}</div><div className="section-heading"><div><p className="overline">ENTREGABLES</p><h2>Qué deberías poder presentar</h2></div></div><div className="deliver-grid">{capstone.deliverables.map((a,i)=><div className="deliver-card" key={a}><span className="deliver-icon"><CheckCircle2 size={20}/></span><strong>{a}</strong><small>Entregable {String(i+1).padStart(2,"0")}</small></div>)}</div><div className="bottom-note"><BookOpen size={24}/><div><strong>Documentación dentro del repositorio</strong><p>Revisá <code>docs/CAPSTONE.md</code>, <code>docs/ARQUITECTURA.md</code> y la aplicación de ejemplo en <code>backend/Tickets.Api/</code>.</p></div></div></>}
          {view.screen==="glossary"&&<><div className="page-top"><span className="overline">REFERENCIA RÁPIDA</span><h1>Glosario de ingeniería .NET</h1><p>Conceptos clave, de la sintaxis de C# a los patrones que aparecen en sistemas de producción.</p></div><div className="glossary-filter"><Search size={19}/><input placeholder="Buscar un concepto..." value={glossarySearch} onChange={e=>setGlossarySearch(e.target.value)}/></div><div className="glossary-grid">{termList.filter(t=>t.join(' ').toLowerCase().includes(glossarySearch.toLowerCase())).map(([name,definition])=><div className="glossary-item" key={name}><h3>{name}</h3><p>{definition}</p></div>)}</div></>}
          {view.screen==="playground"&&<><div className="page-top"><span className="overline">LABORATORIO INTERACTIVO</span><h1>Explorá LINQ y su SQL equivalente</h1><p>Modificá los filtros y observá qué registros devolvería la consulta. Es un simulador de conceptos en React; las consultas reales se ejecutan en la API .NET + PostgreSQL.</p></div><div className="playground-layout"><div className="play-control"><div className="rail-title"><Filter size={17}/> PARÁMETROS DE CONSULTA</div><label>Estado del ticket<select value={pgResolved} onChange={e=>{setPgResolved(e.target.value);setPgPage(1)}}><option value="all">Todos</option><option value="false">Pendientes</option><option value="true">Resueltos</option></select></label><label>Buscar por título<input value={pgSearch} onChange={e=>{setPgSearch(e.target.value);setPgPage(1)}} placeholder="Ej. factura"/></label><label>Registros por página<select value={pgSize} onChange={e=>{setPgSize(Number(e.target.value));setPgPage(1)}}><option value="5">5</option><option value="10">10</option></select></label><div className="play-note"><Lightbulb size={17}/> Cambiá el estado y la búsqueda para ver cómo varía la consulta.</div></div><div className="play-output"><span className="block-eyebrow">EXPRESIÓN LINQ</span><Code value={`IQueryable<Ticket> query = db.Tickets.AsNoTracking();\n${pgResolved==="all"?"// Sin filtro de estado":`query = query.Where(t => t.Resuelto == ${pgResolved});`}\n${pgSearch.trim()?`query = query.Where(t => EF.Functions.ILike(t.Titulo, "%${pgSearch.trim().replaceAll('"','')}%"));`:'// Sin búsqueda por título'}\nvar tickets = await query.OrderByDescending(t => t.Id)\n    .Skip(${(pgPage-1)*pgSize}).Take(${pgSize})\n    .Select(t => new TicketResponse(t.Id,t.Titulo,t.Resuelto))\n    .ToListAsync();`}/><span className="block-eyebrow">SQL EQUIVALENTE CONCEPTUAL</span><Code language="sql" value={`SELECT id, titulo, resuelto FROM tickets\nWHERE 1=1${pgResolved==="all"?"":`\n  AND resuelto = ${pgResolved}`}${pgSearch.trim()?`\n  AND titulo ILIKE '%${pgSearch.trim().replaceAll("'","''")}%'`:""}\nORDER BY id DESC\nLIMIT ${pgSize} OFFSET ${(pgPage-1)*pgSize};`}/><PlaygroundTable status={pgResolved} search={pgSearch} page={pgPage} pageSize={pgSize} onPage={setPgPage}/></div></div></>}
          {view.screen==="settings"&&<><div className="page-top"><span className="overline">CONFIGURACIÓN LOCAL</span><h1>Datos y seguimiento</h1><p>Todo el progreso se almacena en un archivo SQLite del equipo que ejecuta Next.js. No se envían tus notas a servicios externos.</p></div><div className="settings-grid"><div className="settings-card"><div className="setting-icon"><Database size={23}/></div><h3>Base de datos local</h3><p><code>web/data/progreso.sqlite</code></p><p>La API de aprendizaje usa SQLite; el backend de tickets usa PostgreSQL.</p></div><div className="settings-card"><div className="setting-icon"><Download size={23}/></div><h3>Respaldar progreso</h3><p>Descargá un JSON con tus calificaciones, lecturas, notas y tareas marcadas.</p><a className="btn btn-primary btn-small" href="/api/export"><Download size={16}/> Exportar JSON</a></div><div className="settings-card"><div className="setting-icon"><Upload size={23}/></div><h3>Restaurar progreso</h3><p>Importá un respaldo exportado desde esta aplicación. Reemplaza el estado actual.</p><input ref={importRef} type="file" accept="application/json,.json" hidden onChange={async e=>{const f=e.target.files?.[0];if(!f)return;try{const payload=JSON.parse(await f.text());if(!window.confirm("¿Reemplazar todo tu progreso actual con este respaldo?"))return;await send("/api/import",payload);}catch{setError("El respaldo no contiene JSON válido.")}e.target.value=""}}/><button className="btn btn-outline btn-small" onClick={()=>importRef.current?.click()}><Upload size={16}/> Importar respaldo</button></div><div className="settings-card danger"><div className="setting-icon"><RotateCcw size={23}/></div><h3>Reiniciar aprendizaje</h3><p>Elimina notas, lecturas, tareas y evaluaciones de SQLite. No afecta PostgreSQL.</p><button className="btn btn-danger btn-small" onClick={()=>{if(window.confirm("¿Eliminar definitivamente todo el progreso guardado en SQLite?"))void send("/api/reset",{})}}><RotateCcw size={16}/> Reiniciar todo</button></div></div></>}
        </main>}
      <footer className="footer"><span>DOTNET ATLAS <span className="footer-dot">•</span> EDICIÓN LOCAL</span><span>Next.js + SQLite para aprender <b>·</b> .NET 10 + PostgreSQL para construir</span></footer>
    </div>
  </div>;
}
function TargetIcon(){return <GraduationCap size={16}/>}
const sampleTickets=Array.from({length:24},(_,i)=>({id:24-i,titulo:["Error al generar factura","Problema de acceso","Falla al reservar","Validación de horario","Error de pago","Solicitud de soporte"][i%6],resuelto:i%3===0}));
function PlaygroundTable({status,search,page,pageSize,onPage}:{status:string;search:string;page:number;pageSize:number;onPage:(n:number)=>void}){
  const rows=sampleTickets.filter(t=>(status==="all"||String(t.resuelto)===status)&&t.titulo.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')));
  const totalPages=Math.max(1,Math.ceil(rows.length/pageSize));
  return <div className="play-table"><div className="play-table-title"><h3>Vista previa del resultado</h3><span>{rows.length} registros</span></div><table><thead><tr><th>ID</th><th>TÍTULO</th><th>ESTADO</th></tr></thead><tbody>{rows.slice((page-1)*pageSize,page*pageSize).map(t=><tr key={t.id}><td>#{t.id}</td><td>{t.titulo}</td><td><span className={`table-status ${t.resuelto?"resolved":"pending"}`}>{t.resuelto?"Resuelto":"Pendiente"}</span></td></tr>)}{rows.length===0&&<tr><td colSpan={3} className="no-results">No hay resultados para esos filtros.</td></tr>}</tbody></table><div className="table-pager"><span>Página {page} de {totalPages}</span><div><button onClick={()=>onPage(Math.max(1,page-1))} disabled={page<=1}><ArrowLeft size={16}/></button><button onClick={()=>onPage(Math.min(totalPages,page+1))} disabled={page>=totalPages}><ArrowRight size={16}/></button></div></div></div>;
}
