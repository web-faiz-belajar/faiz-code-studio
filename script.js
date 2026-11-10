/* FAIZ CODE STUDIO 4.0 — PROJECTS / EXPLORER / EDITOR / SIMULATOR */
"use strict";
const $ = id => document.getElementById(id);
const codeEditor = $("codeEditor");
const STORAGE_KEY = "faiz_code_studio_v2"; // Keep v2 key to preserve existing projects.
const OLD_STORAGE_KEY = "faiz_code_studio_v1";
const defaultHTML = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Aplikasi Saya</title>
</head>
<body>
<h1>Halo Dunia!</h1>
<p>Selamat datang di aplikasi pertama saya.</p>
<button onclick="halo()">Klik Saya</button>
</body>
</html>`;
const defaultCSS = `body { font-family: Arial, sans-serif; text-align: center; padding: 30px; background: #f1f5f9; }
h1 { color: #5267e8; }
button { padding: 12px 20px; border: 0; border-radius: 8px; background: #5267e8; color: white; }`;
const defaultJS = `function halo() { alert("JavaScript berhasil berjalan!"); }`;
let projects=[], activeProjectId=null, activeFile=null, openFiles=[], autoSaveTimer=null, toastTimer=null;
function makeId(){return "project_"+Date.now()+"_"+Math.random().toString(36).slice(2,8)}
function escapeHTML(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function getExtension(n){const p=n.split(".");return p.length>1?p.pop().toLowerCase():"txt"}
function getFileIcon(n){return ({html:"🌐",htm:"🌐",css:"🎨",js:"⚡",json:"📋",txt:"📄"})[getExtension(n)]||"📄"}
function getLanguage(n){return ({html:"HTML",htm:"HTML",css:"CSS",js:"JAVASCRIPT",json:"JSON",txt:"TEXT"})[getExtension(n)]||"TEXT"}
function getActiveProject(){return projects.find(p=>p.id===activeProjectId)||null}
function createDefaultFiles(t="web"){return t==="blank"?{"index.html":"","style.css":"","script.js":""}:{"index.html":defaultHTML,"style.css":defaultCSS,"script.js":defaultJS}}
function showToast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2300)}
function saveAll(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:4,projects,activeProjectId,theme:document.body.classList.contains("light-theme")?"light":"dark"}));return true}catch(e){console.error(e);showToast("Penyimpanan penuh atau tidak tersedia.");return false}}
function loadAll(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const d=JSON.parse(raw);if(Array.isArray(d.projects)){projects=d.projects.filter(p=>p&&typeof p.id==="string"&&typeof p.name==="string"&&p.files&&typeof p.files==="object").map(p=>({id:p.id,name:p.name,files:p.files,createdAt:p.createdAt||Date.now(),updatedAt:p.updatedAt||Date.now()}));activeProjectId=d.activeProjectId||null;if(d.theme==="light")document.body.classList.add("light-theme");return}}migrateOldProject()}catch(e){console.error("Load error:",e);projects=[]}}
function migrateOldProject(){try{const raw=localStorage.getItem(OLD_STORAGE_KEY);if(raw){const d=JSON.parse(raw);if(d&&typeof d.html==="string"&&typeof d.css==="string"&&typeof d.js==="string"){const p={id:makeId(),name:"Project Lama",files:{"index.html":d.html,"style.css":d.css,"script.js":d.js},createdAt:Date.now(),updatedAt:Date.now()};projects.push(p);activeProjectId=p.id;saveAll();showToast("Project lama berhasil dipindahkan.");return}}}catch(e){console.error(e)}projects=[]}
function renderDashboard(){const grid=$("projectGrid"),empty=$("emptyProjects");$("projectCount").textContent=projects.length+" PROJECT";grid.innerHTML="";empty.classList.toggle("hidden",projects.length>0);projects.forEach(p=>{const card=document.createElement("article");card.className="project-card";card.innerHTML=`<div class="project-card-top"><div class="project-symbol">&lt;/&gt;</div><button class="project-menu" data-action="menu" aria-label="Menu project">•••</button></div><h3>${escapeHTML(p.name)}</h3><p>${Object.keys(p.files).length} file · Project lokal</p><div class="project-card-bottom"><span>FAIZ WORKSPACE</span><span class="open-project">OPEN →</span></div>`;card.addEventListener("click",e=>{if(e.target.closest("[data-action=menu]")){projectMenu(p.id);return}openProject(p.id)});grid.appendChild(card)})}
function projectMenu(id){const p=projects.find(x=>x.id===id);if(!p)return;const c=prompt("Project: "+p.name+"\n\n1 = Ganti nama\n2 = Hapus project");if(c==="1"){const n=prompt("Nama project baru:",p.name);if(n&&n.trim()){p.name=n.trim();p.updatedAt=Date.now();saveAll();renderDashboard();if(activeProjectId===id){$("currentProjectName").textContent=p.name;$("drawerProjectName").textContent=p.name}showToast("Nama project diperbarui.")}}else if(c==="2"&&confirm("Hapus project "+p.name+"?")){projects=projects.filter(x=>x.id!==id);if(activeProjectId===id){activeProjectId=null;goDashboard()}saveAll();renderDashboard();showToast("Project dihapus.")}}
function showProjectModal(){$("projectNameInput").value="";$("projectTemplate").value="web";$("projectModal").classList.remove("hidden");$("projectNameInput").focus()}
function hideProjectModal(){$("projectModal").classList.add("hidden")}
function createProject(){const name=$("projectNameInput").value.trim();if(!name){showToast("Masukkan nama project.");return}const p={id:makeId(),name,files:createDefaultFiles($("projectTemplate").value),createdAt:Date.now(),updatedAt:Date.now()};projects.unshift(p);activeProjectId=p.id;saveAll();hideProjectModal();renderDashboard();openProject(p.id);showToast("Project berhasil dibuat.")}
function openProject(id){const p=projects.find(x=>x.id===id);if(!p)return;activeProjectId=id;if(!Object.keys(p.files).length)p.files["index.html"]="";openFiles=Object.keys(p.files);activeFile=openFiles.includes("index.html")?"index.html":openFiles[0];$("dashboard").classList.add("hidden");$("workspace").classList.remove("hidden");$("workspace").classList.remove("preview-open");$("currentProjectName").textContent=p.name;$("drawerProjectName").textContent=p.name;renderFiles();renderTabs();loadEditor();saveAll()}
function goDashboard(){saveCurrentFile();$("workspace").classList.add("hidden");$("dashboard").classList.remove("hidden");closeSimulator();fileDrawerClose();renderDashboard();saveAll()}
$("homeBtn").addEventListener("click",goDashboard);$("backDashboardBtn").addEventListener("click",goDashboard);
function renderFiles(){const p=getActiveProject();if(!p)return;$("drawerProjectName").textContent=p.name;const list=$("fileList");list.innerHTML="";Object.keys(p.files).forEach(n=>{const b=document.createElement("button");b.className="file-item"+(n===activeFile?" active":"");b.innerHTML=`<span>${getFileIcon(n)}</span><span class="file-name">${escapeHTML(n)}</span><span class="file-more">⋮</span>`;b.addEventListener("click",e=>{if(e.target.closest(".file-more")){fileMenu(n);return}switchFile(n);fileDrawerClose()});list.appendChild(b)})}
function fileDrawerClose(){$("fileDrawer").classList.remove("open")}
$("fileMenuBtn").addEventListener("click",()=>$("fileDrawer").classList.toggle("open"));$("closeDrawerBtn").addEventListener("click",fileDrawerClose);
function addFile(){const p=getActiveProject();if(!p)return;const n=prompt("Nama file baru:\nContoh: about.html atau style.css");if(!n)return;const clean=n.trim();if(!/^[a-zA-Z0-9._-]+$/.test(clean)){showToast("Nama file tidak valid.");return}if(Object.prototype.hasOwnProperty.call(p.files,clean)){showToast("File sudah ada.");return}p.files[clean]="";openFiles.push(clean);p.updatedAt=Date.now();saveAll();switchFile(clean);renderFiles();showToast("File berhasil dibuat.")}
$("addFileBtn").addEventListener("click",addFile);
function fileMenu(name){const p=getActiveProject();if(!p)return;const c=prompt("File: "+name+"\n\n1 = Ganti nama\n2 = Hapus file");if(c==="1"){const n=prompt("Nama file baru:",name);if(!n)return;const clean=n.trim();if(!/^[a-zA-Z0-9._-]+$/.test(clean)){showToast("Nama file tidak valid.");return}if(Object.prototype.hasOwnProperty.call(p.files,clean)){showToast("Nama file sudah digunakan.");return}p.files[clean]=p.files[name];delete p.files[name];openFiles=openFiles.map(f=>f===name?clean:f);if(activeFile===name)activeFile=clean;saveAll();renderFiles();renderTabs();loadEditor();showToast("Nama file diperbarui.")}else if(c==="2"){if(Object.keys(p.files).length<=1){showToast("Project harus memiliki minimal satu file.");return}if(!confirm("Hapus file "+name+"?"))return;delete p.files[name];openFiles=openFiles.filter(f=>f!==name);if(activeFile===name)activeFile=openFiles[0];saveAll();renderFiles();renderTabs();loadEditor();showToast("File dihapus.")}}
function renderTabs(){const bar=$("tabsBar");bar.innerHTML="";openFiles.forEach(n=>{const b=document.createElement("button");b.className="editor-tab"+(n===activeFile?" active":"");b.innerHTML=`<span>${getFileIcon(n)}</span><span>${escapeHTML(n)}</span>`;b.addEventListener("click",()=>switchFile(n));bar.appendChild(b)})}
function switchFile(n){const p=getActiveProject();if(!p||p.files[n]===undefined)return;saveCurrentFile();activeFile=n;if(!openFiles.includes(n))openFiles.push(n);loadEditor();renderTabs();renderFiles()}
function loadEditor(){const p=getActiveProject();if(!p)return;codeEditor.value=p.files[activeFile]||"";$("activeFilePath").textContent=activeFile;$("languageLabel").textContent=getLanguage(activeFile);updateLineNumbers();updateCursor();$("saveStatus").textContent="SAVED"}
function saveCurrentFile(){const p=getActiveProject();if(!p||!activeFile||!codeEditor)return;p.files[activeFile]=codeEditor.value;p.updatedAt=Date.now()}
function saveEverything(){saveCurrentFile();if(saveAll())$("saveStatus").textContent="SAVED"}
function scheduleAutoSave(){$("saveStatus").textContent="SAVING...";clearTimeout(autoSaveTimer);autoSaveTimer=setTimeout(()=>{saveEverything()},500)}
codeEditor.addEventListener("input",()=>{saveCurrentFile();updateLineNumbers();updateCursor();scheduleAutoSave()});
function updateLineNumbers(){const count=codeEditor.value.split("\n").length;$("lineNumbers").textContent=Array.from({length:count},(_,i)=>i+1).join("\n")}
codeEditor.addEventListener("scroll",()=>$("lineNumbers").scrollTop=codeEditor.scrollTop);
function updateCursor(){const before=codeEditor.value.slice(0,codeEditor.selectionStart),lines=before.split("\n");$("cursorPosition").textContent=`LINE ${lines.length} : COL ${lines[lines.length-1].length+1}`}
["click","keyup","select"].forEach(ev=>codeEditor.addEventListener(ev,updateCursor));
codeEditor.addEventListener("keydown",e=>{if(e.key==="Tab"){e.preventDefault();const s=codeEditor.selectionStart,en=codeEditor.selectionEnd;codeEditor.setRangeText("    ",s,en,"end");saveCurrentFile();updateLineNumbers();updateCursor();scheduleAutoSave()}});
$("saveBtn").addEventListener("click",()=>{saveEverything();showToast("Project berhasil disimpan.")});
function openSearch(){$("searchInput").value="";$("searchMessage").textContent="";$("searchModal").classList.remove("hidden");$("searchInput").focus()}
$("searchBtn").addEventListener("click",openSearch);$("closeSearchModal").addEventListener("click",()=>$("searchModal").classList.add("hidden"));
function searchCode(){const q=$("searchInput").value;if(!q){$("searchMessage").textContent="Masukkan kata pencarian.";return}const content=codeEditor.value,index=content.toLowerCase().indexOf(q.toLowerCase());if(index<0){$("searchMessage").textContent="Tidak ditemukan di file ini.";return}codeEditor.focus();codeEditor.setSelectionRange(index,index+q.length);const line=content.slice(0,index).split("\n").length;codeEditor.scrollTop=Math.max(0,(line-3)*24.7);updateCursor();$("searchMessage").textContent="Ditemukan pada baris "+line}
$("confirmSearchBtn").addEventListener("click",searchCode);
function buildPreview(){const p=getActiveProject();if(!p)return "";let html=p.files["index.html"]||"",css=p.files["style.css"]||"",js=p.files["script.js"]||"";const style=`<style>\n${css}\n</style>`;const script=`<script>\n${js}\n<\/script>`;if(/<\/head\s*>/i.test(html))html=html.replace(/<\/head\s*>/i,style+"</head>");else html=style+html;if(/<\/body\s*>/i.test(html))html=html.replace(/<\/body\s*>/i,script+"</body>");else html+=script;return html}
function runCode(){saveEverything();const p=getActiveProject();if(!p){showToast("Buka project terlebih dahulu.");return}if(!p.files["index.html"]){showToast("File index.html belum tersedia.");return}$("previewFrame").srcdoc=buildPreview();showToast("Preview berhasil diperbarui.")}
function openSimulator(){const w=$("workspace");w.classList.add("preview-open");$("previewBtn").setAttribute("aria-expanded","true");$("previewBtn").title="Tutup simulator";runCode()}
function closeSimulator(){$("workspace").classList.remove("preview-open");$("previewBtn").setAttribute("aria-expanded","false");$("previewBtn").title="Buka simulator"}
$("runBtn").addEventListener("click",()=>openSimulator());$("reloadBtn").addEventListener("click",runCode);$("previewBtn").addEventListener("click",()=>{$("workspace").classList.contains("preview-open")?closeSimulator():openSimulator()});$("closePreviewBtn").addEventListener("click",closeSimulator);
$("fullscreenBtn").addEventListener("click",async()=>{const panel=$("previewPanel");try{if(!document.fullscreenElement)await panel.requestFullscreen();else await document.exitFullscreen()}catch(e){showToast("Fullscreen tidak didukung browser ini.")}});
$("newProjectBtn").addEventListener("click",showProjectModal);$("emptyCreateBtn").addEventListener("click",showProjectModal);$("closeProjectModal").addEventListener("click",hideProjectModal);$("confirmProjectBtn").addEventListener("click",createProject);
$("projectNameInput").addEventListener("keydown",e=>{if(e.key==="Enter")createProject()});$("searchInput").addEventListener("keydown",e=>{if(e.key==="Enter")searchCode()});
$("themeBtn").addEventListener("click",()=>{document.body.classList.toggle("light-theme");saveAll()});
loadAll();renderDashboard();
if("serviceWorker"in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js?v=4.0").catch(e=>console.error("Service Worker:",e)))}
window.addEventListener("pagehide",()=>{saveCurrentFile();saveAll()});
