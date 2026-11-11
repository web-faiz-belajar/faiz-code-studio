
/* =========================================================
   FAIZ CODE STUDIO 5.0
   PREMIUM EDITION
   PROJECT MANAGER + EDITOR + SIMULATOR
========================================================= */

"use strict";

/* =========================
   CONFIGURATION
========================= */

const STORAGE_KEY = "faiz_code_studio_v2";
const OLD_STORAGE_KEY = "faiz_code_studio_v1";
const NEW_STORAGE_KEY = "faiz_code_studio_v5";

const $ = id => document.getElementById(id);

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main>
        <h1>Hello World!</h1>
        <p>Welcome to my project.</p>
        <button id="helloBtn">Click Me</button>
    </main>
    <script src="script.js"><\/script>
</body>
</html>`;

const DEFAULT_CSS = `* {
    box-sizing: border-box;
}

body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    background: #101827;
    color: white;
    font-family: Arial, sans-serif;
}

main {
    text-align: center;
    padding: 35px;
}

h1 {
    color: #8b78ff;
}

button {
    padding: 12px 20px;
    border: 0;
    border-radius: 10px;
    background: #8975ff;
    color: white;
    cursor: pointer;
}`;

const DEFAULT_JS = `const button = document.getElementById("helloBtn");

button.addEventListener("click", () => {
    alert("Hello from Faiz Code Studio!");
});`;

/* =========================
   APPLICATION STATE
========================= */

let projects = [];
let activeProjectId = null;
let activeFile = null;
let openFiles = [];

let currentPanel = "terminal";
let currentTheme = "dark";
let editorFontSize = 14;

let saveTimer = null;
let toastTimer = null;
let searchResults = [];

/* =========================
   ELEMENTS
========================= */

const dashboard = $("dashboard");
const workspace = $("workspace");

const projectGrid = $("projectGrid");
const projectCount = $("projectCount");
const emptyProjects = $("emptyProjects");

const codeEditor = $("codeEditor");
const lineNumbers = $("lineNumbers");

const previewPanel = $("previewPanel");
const previewFrame = $("previewFrame");

const fileDrawer = $("fileDrawer");
const fileList = $("fileList");

const tabsBar = $("tabsBar");

const toastElement = $("toast");

/* =========================
   UTILITIES
========================= */

function createId() {
    return "project_" + Date.now() + "_" +
        Math.random().toString(36).slice(2, 8);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function getActiveProject() {
    return projects.find(project => project.id === activeProjectId);
}

function getExtension(filename) {
    return filename.split(".").pop().toLowerCase();
}

function getLanguage(filename) {
    const extension = getExtension(filename);

    const languages = {
        html: "HTML",
        htm: "HTML",
        css: "CSS",
        js: "JAVASCRIPT",
        json: "JSON",
        txt: "TEXT",
        md: "MARKDOWN",
        svg: "SVG",
        xml: "XML"
    };

    return languages[extension] || "TEXT";
}

function getFileIcon(filename) {
    const extension = getExtension(filename);

    const icons = {
        html: "🌐",
        htm: "🌐",
        css: "🎨",
        js: "⚡",
        json: "📋",
        md: "📝",
        txt: "📄",
        svg: "💠"
    };

    return icons[extension] || "📄";
}

function showToast(message) {
    if (!toastElement) return;

    toastElement.textContent = message;
    toastElement.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toastElement.classList.remove("show");
    }, 2500);
}

/* =========================
   PROJECT DATA
========================= */

function createDefaultFiles(template = "html") {
    if (template === "blank") {
        return {
            "index.html": "",
            "style.css": "",
            "script.js": ""
        };
    }

    return {
        "index.html": DEFAULT_HTML,
        "style.css": DEFAULT_CSS,
        "script.js": DEFAULT_JS
    };
}

function normalizeProject(project) {
    if (!project || typeof project !== "object") {
        return null;
    }

    const files = {};

    if (project.files && typeof project.files === "object") {
        for (const [name, content] of Object.entries(project.files)) {
            if (typeof content === "string") {
                files[name] = content;
            }
        }
    }

    if (!Object.keys(files).length) {
        Object.assign(files, createDefaultFiles());
    }

    return {
        id: String(project.id || createId()),
        name: String(project.name || "Untitled Project"),
        files,
        createdAt: project.createdAt || Date.now(),
        updatedAt: project.updatedAt || Date.now()
    };
}

/* =========================
   STORAGE
========================= */

function loadData() {
    let saved = null;

    try {
        saved =
            JSON.parse(localStorage.getItem(NEW_STORAGE_KEY)) ||
            JSON.parse(localStorage.getItem(STORAGE_KEY)) ||
            JSON.parse(localStorage.getItem(OLD_STORAGE_KEY));
    } catch (error) {
        console.error("Storage loading error:", error);
    }

    if (Array.isArray(saved)) {
        projects = saved.map(normalizeProject).filter(Boolean);
    } else if (saved && typeof saved === "object") {
        projects = Array.isArray(saved.projects)
            ? saved.projects.map(normalizeProject).filter(Boolean)
            : [];

        currentTheme = saved.theme || "dark";
        editorFontSize = Number(saved.fontSize) || 14;
    }

    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        activeProjectId = saved.activeProjectId || null;
    }

    if (!projects.length) {
        projects = [];
    }

    if (!projects.some(project => project.id === activeProjectId)) {
        activeProjectId = null;
    }

    applyTheme();
    applyFontSize();
}

function saveData() {
    const data = {
        version: 5,
        projects,
        activeProjectId,
        theme: currentTheme,
        fontSize: editorFontSize
    };

    try {
        localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        showToast("Penyimpanan penuh atau tidak tersedia");
        console.error(error);
    }
}

function scheduleSave() {
    const status = $("saveStatus");

    if (status) {
        status.textContent = "Unsaved...";
    }

    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        saveCurrentFile();
        saveData();

        if (status) {
            status.textContent = "Saved";
        }
    }, 500);
}

function saveCurrentFile() {
    const project = getActiveProject();

    if (!project || !activeFile || !codeEditor) return;

    project.files[activeFile] = codeEditor.value;
    project.updatedAt = Date.now();
}

/* =========================
   DASHBOARD
========================= */

function renderDashboard() {
    if (!projectGrid) return;

    projectGrid.innerHTML = "";

    if (projectCount) {
        projectCount.textContent = projects.length;
    }

    if (emptyProjects) {
        emptyProjects.classList.toggle("hidden", projects.length > 0);
    }

    projects.forEach(project => {
        const card = document.createElement("article");

        card.className = "project-card";

        const fileCount = Object.keys(project.files).length;

        card.innerHTML = `
            <div class="project-card-icon">⌘</div>
            <h3>${escapeHTML(project.name)}</h3>
            <p>Web Development Project</p>
            <div class="project-card-footer">
                <span>${fileCount} files</span>
                <span>Open project →</span>
            </div>
        `;

        card.addEventListener("click", () => {
            openProject(project.id);
        });

        card.addEventListener("contextmenu", event => {
            event.preventDefault();
            projectMenu(project.id);
        });

        projectGrid.appendChild(card);
    });
}

/* =========================
   PROJECT MANAGER
========================= */

function openProjectModal() {
    const modal = $("projectModal");

    if (!modal) return;

    $("projectModalTitle").textContent = "Create Project";
    $("projectNameInput").value = "";
    $("projectTemplate").value = "html";

    modal.classList.remove("hidden");
    $("projectNameInput").focus();
}

function closeProjectModal() {
    $("projectModal")?.classList.add("hidden");
}

function createProject() {
    const nameInput = $("projectNameInput");
    const templateInput = $("projectTemplate");

    const name = nameInput.value.trim();
    const template = templateInput.value;

    if (!name) {
        showToast("Masukkan nama project terlebih dahulu");
        nameInput.focus();
        return;
    }

    const project = {
        id: createId(),
        name,
        files: createDefaultFiles(template),
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    projects.unshift(project);

    saveData();
    renderDashboard();
    closeProjectModal();
    openProject(project.id);

    showToast("Project berhasil dibuat");
}

function projectMenu(id) {
    const project = projects.find(item => item.id === id);

    if (!project) return;

    const action = prompt(
        `Project: ${project.name}\n\n` +
        "Ketik salah satu:\n" +
        "1 = Rename\n" +
        "2 = Export\n" +
        "3 = Delete\n\n" +
        "Kosongkan untuk batal."
    );

    if (action === "1") {
        renameProject(id);
    } else if (action === "2") {
        exportProject(id);
    } else if (action === "3") {
        deleteProject(id);
    }
}

function renameProject(id) {
    const project = projects.find(item => item.id === id);
    if (!project) return;

    const name = prompt("Nama project baru:", project.name);

    if (!name || !name.trim()) return;

    project.name = name.trim();
    project.updatedAt = Date.now();

    saveData();
    renderDashboard();
    updateWorkspaceHeader();

    showToast("Project berhasil diubah");
}

function deleteProject(id) {
    const project = projects.find(item => item.id === id);
    if (!project) return;

    if (!confirm(`Hapus project "${project.name}"?`)) return;

    projects = projects.filter(item => item.id !== id);

    if (activeProjectId === id) {
        activeProjectId = null;
        activeFile = null;
        openFiles = [];

        showDashboard();
    }

    saveData();
    renderDashboard();

    showToast("Project dihapus");
}

/* =========================
   WORKSPACE
========================= */

function openProject(id) {
    const project = projects.find(item => item.id === id);

    if (!project) return;

    activeProjectId = id;

    const firstFile = Object.keys(project.files)[0];

    activeFile = firstFile || null;
    openFiles = activeFile ? [activeFile] : [];

    dashboard?.classList.add("hidden");
    workspace?.classList.remove("hidden");

    fileDrawer?.classList.add("hidden");
    previewPanel?.classList.add("hidden");

    updateWorkspaceHeader();
    renderFiles();
    renderTabs();

    if (activeFile) {
        loadFile(activeFile);
    } else {
        codeEditor.value = "";
    }

    saveData();
}

function showDashboard() {
    saveCurrentFile();
    saveData();

    workspace?.classList.add("hidden");
    dashboard?.classList.remove("hidden");

    $("breadcrumbTitle").textContent = "Dashboard";

    renderDashboard();
}

function updateWorkspaceHeader() {
    const project = getActiveProject();

    if (!project) return;

    $("currentProjectName").textContent = project.name;
    $("currentProjectInfo").textContent =
        `${Object.keys(project.files).length} project files`;

    $("drawerProjectName").textContent = project.name;
    $("breadcrumbTitle").textContent = project.name;
}

/* =========================
   FILE EXPLORER
========================= */

function renderFiles() {
    const project = getActiveProject();

    if (!project || !fileList) return;

    fileList.innerHTML = "";

    Object.keys(project.files).forEach(filename => {
        const item = document.createElement("div");

        item.className =
            "file-item" + (filename === activeFile ? " active" : "");

        item.innerHTML = `
            <span>${getFileIcon(filename)}</span>
            <span>${escapeHTML(filename)}</span>
        `;

        item.addEventListener("click", () => {
            openFile(filename);
        });

        item.addEventListener("contextmenu", event => {
            event.preventDefault();
            fileMenu(filename);
        });

        fileList.appendChild(item);
    });
}

function fileMenu(filename) {
    const action = prompt(
        `File: ${filename}\n\n` +
        "1 = Rename\n" +
        "2 = Delete\n" +
        "3 = Duplicate\n\n" +
        "Kosongkan untuk batal."
    );

    if (action === "1") {
        renameFile(filename);
    } else if (action === "2") {
        deleteFile(filename);
    } else if (action === "3") {
        duplicateFile(filename);
    }
}

function addNewFile() {
    const project = getActiveProject();
    if (!project) return;

    const filename = prompt("Nama file baru:", "new-file.js");

    if (!filename || !filename.trim()) return;

    const cleanName = filename.trim();

    if (project.files[cleanName] !== undefined) {
        showToast("Nama file sudah digunakan");
        return;
    }

    project.files[cleanName] = "";

    saveData();
    renderFiles();
    openFile(cleanName);

    showToast("File berhasil dibuat");
}

function renameFile(oldName) {
    const project = getActiveProject();
    if (!project) return;

    const newName = prompt("Nama file baru:", oldName);

    if (!newName || !newName.trim()) return;

    const cleanName = newName.trim();

    if (project.files[cleanName] !== undefined) {
        showToast("Nama file sudah digunakan");
        return;
    }

    project.files[cleanName] = project.files[oldName];
    delete project.files[oldName];

    openFiles = openFiles.map(name =>
        name === oldName ? cleanName : name
    );

    if (activeFile === oldName) {
        activeFile = cleanName;
    }

    saveData();
    renderFiles();
    renderTabs();

    if (activeFile === cleanName) {
        loadFile(cleanName);
    }

    showToast("Nama file berhasil diubah");
}

function deleteFile(filename) {
    const project = getActiveProject();
    if (!project) return;

    if (Object.keys(project.files).length <= 1) {
        showToast("Project harus memiliki minimal satu file");
        return;
    }

    if (!confirm(`Hapus file ${filename}?`)) return;

    delete project.files[filename];

    openFiles = openFiles.filter(name => name !== filename);

    if (activeFile === filename) {
        activeFile = openFiles[0] || Object.keys(project.files)[0];
    }

    if (activeFile && !openFiles.includes(activeFile)) {
        openFiles.push(activeFile);
    }

    saveData();
    renderFiles();
    renderTabs();
    loadFile(activeFile);

    showToast("File berhasil dihapus");
}

function duplicateFile(filename) {
    const project = getActiveProject();
    if (!project) return;

    let newName = filename.replace(/(\.[^.]+)?$/, "-copy$1");

    let counter = 2;

    while (project.files[newName] !== undefined) {
        newName = filename.replace(
            /(\.[^.]+)?$/,
            `-copy-${counter++}$1`
        );
    }

    project.files[newName] = project.files[filename];

    saveData();
    renderFiles();
    openFile(newName);

    showToast("File berhasil diduplikasi");
}

/* =========================
   FILE TABS
========================= */

function openFile(filename) {
    const project = getActiveProject();

    if (!project || project.files[filename] === undefined) return;

    saveCurrentFile();

    activeFile = filename;

    if (!openFiles.includes(filename)) {
        openFiles.push(filename);
    }

    renderFiles();
    renderTabs();
    loadFile(filename);
}

function loadFile(filename) {
    const project = getActiveProject();

    if (!project || !filename) return;

    activeFile = filename;

    codeEditor.value = project.files[filename] ?? "";

    $("activeFilePath").textContent = filename;
    $("languageLabel").textContent = getLanguage(filename);

    updateLineNumbers();
    updateCursorPosition();
}

function renderTabs() {
    const project = getActiveProject();

    if (!project || !tabsBar) return;

    tabsBar.innerHTML = "";

    openFiles.forEach(filename => {
        if (project.files[filename] === undefined) return;

        const tab = document.createElement("button");

        tab.className =
            "editor-tab" + (filename === activeFile ? " active" : "");

        tab.innerHTML = `
            <span>${getFileIcon(filename)}</span>
            <span>${escapeHTML(filename)}</span>
            <span class="tab-close">×</span>
        `;

        tab.addEventListener("click", event => {
            if (event.target.classList.contains("tab-close")) {
                closeTab(filename);
            } else {
                openFile(filename);
            }
        });

        tabsBar.appendChild(tab);
    });
}

function closeTab(filename) {
    saveCurrentFile();

    openFiles = openFiles.filter(name => name !== filename);

    if (activeFile === filename) {
        activeFile = openFiles[openFiles.length - 1] || null;
    }

    if (activeFile) {
        loadFile(activeFile);
    } else {
        codeEditor.value = "";
        $("activeFilePath").textContent = "No file";
        $("languageLabel").textContent = "TEXT";
        updateLineNumbers();
    }

    renderTabs();
    renderFiles();
}

/* =========================
   CODE EDITOR
========================= */

function updateLineNumbers() {
    if (!lineNumbers || !codeEditor) return;

    const count = Math.max(
        1,
        codeEditor.value.split("\n").length
    );

    lineNumbers.textContent = Array.from(
        { length: count },
        (_, index) => index + 1
    ).join("\n");
}

function updateCursorPosition() {
    if (!codeEditor) return;

    const position = codeEditor.selectionStart;
    const before = codeEditor.value.slice(0, position);

    const line = before.split("\n").length;
    const column = before.length - before.lastIndexOf("\n");

    $("cursorPosition").textContent =
        `Ln ${line}, Col ${column}`;
}

function handleEditorInput() {
    updateLineNumbers();
    updateCursorPosition();
    scheduleSave();
}

function insertEditorText(text) {
    const start = codeEditor.selectionStart;
    const end = codeEditor.selectionEnd;

    codeEditor.setRangeText(text, start, end, "end");

    handleEditorInput();
    codeEditor.focus();
}

function handleEditorKeydown(event) {
    if (event.key === "Tab") {
        event.preventDefault();
        insertEditorText("    ");
    }

    if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        manualSave();
    }

    if (event.key === "Enter" && event.ctrlKey) {
        event.preventDefault();
        runProject();
    }
}

function manualSave() {
    clearTimeout(saveTimer);

    saveCurrentFile();
    saveData();

    $("saveStatus").textContent = "Saved";

    showToast("Project berhasil disimpan");
}

/* =========================
   SIMULATOR
========================= */

function buildPreviewHTML() {
    const project = getActiveProject();

    if (!project) return "";

    let html = project.files["index.html"] || DEFAULT_HTML;

    const css = project.files["style.css"] || "";
    const js = project.files["script.js"] || "";

    const styleTag = `<style>${css.replace(/<\/style/gi, "<\\/style")}</style>`;

    const scriptTag = `
<script>
(function () {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    function sendToParent(type, args) {
        try {
            parent.postMessage({
                source: "faiz-studio-preview",
                type,
                message: Array.from(args).map(item => {
                    if (typeof item === "object") {
                        try { return JSON.stringify(item); }
                        catch { return String(item); }
                    }
                    return String(item);
                }).join(" ")
            }, "*");
        } catch (error) {}
    }

    console.log = function (...args) {
        originalLog.apply(console, args);
        sendToParent("log", args);
    };

    console.error = function (...args) {
        originalError.apply(console, args);
        sendToParent("error", args);
    };

    console.warn = function (...args) {
        originalWarn.apply(console, args);
        sendToParent("warn", args);
    };

    window.addEventListener("error", event => {
        sendToParent("error", [event.message]);
    });

    window.addEventListener("unhandledrejection", event => {
        sendToParent("error", [event.reason]);
    });
})();
<\/script>
<script>${js.replace(/<\/script/gi, "<\\/script")}<\/script>`;

    if (/<\/head>/i.test(html)) {
        html = html.replace(/<\/head>/i, styleTag + "</head>");
    } else {
        html = styleTag + html;
    }

    if (/<\/body>/i.test(html)) {
        html = html.replace(/<\/body>/i, scriptTag + "</body>");
    } else {
        html += scriptTag;
    }

    return html;
}

function runProject() {
    saveCurrentFile();
    saveData();

    if (!getActiveProject()) {
        showToast("Buka project terlebih dahulu");
        return;
    }

    clearConsole();

    previewFrame.srcdoc = buildPreviewHTML();

    previewPanel.classList.remove("hidden");

    showToast("Project berhasil dijalankan");
}

function reloadPreview() {
    if (!getActiveProject()) return;

    previewFrame.srcdoc = buildPreviewHTML();

    showToast("Preview diperbarui");
}

function closePreview() {
    previewPanel?.classList.add("hidden");
}

function togglePreview() {
    if (!getActiveProject()) return;

    if (previewPanel.classList.contains("hidden")) {
        runProject();
    } else {
        closePreview();
    }
}

function fullscreenPreview() {
    const frame = previewFrame;

    if (!frame) return;

    if (frame.requestFullscreen) {
        frame.requestFullscreen().catch(() => {
            showToast("Fullscreen tidak tersedia");
        });
    } else {
        showToast("Fullscreen tidak didukung browser");
    }
}

/* =========================
   CONSOLE
========================= */

function switchBottomPanel(name) {
    currentPanel = name;

    $("terminalView").classList.toggle(
        "hidden",
        name !== "terminal"
    );

    $("consoleView").classList.toggle(
        "hidden",
        name !== "console"
    );

    $("problemsView").classList.toggle(
        "hidden",
        name !== "problems"
    );

    document.querySelectorAll(".bottom-tab").forEach(tab => {
        tab.classList.toggle(
            "active",
            tab.dataset.panel === name
        );
    });
}

function writeConsole(message, type = "log") {
    const output = $("consoleOutput");

    const item = document.createElement("p");

    item.className =
        type === "error" ? "console-error" :
        type === "warn" ? "console-log" :
        "console-log";

    item.textContent = `[${type.toUpperCase()}] ${message}`;

    output.appendChild(item);

    switchBottomPanel("console");
}

function clearConsole() {
    $("consoleOutput").innerHTML =
        '<p class="console-empty">Console output akan muncul di sini.</p>';

    $("problemsOutput").textContent =
        "Belum ada masalah terdeteksi.";
}

window.addEventListener("message", event => {
    const data = event.data;

    if (!data || data.source !== "faiz-studio-preview") return;

    writeConsole(data.message, data.type);

    if (data.type === "error") {
        $("problemsOutput").textContent = data.message;
    }
});

/* =========================
   TERMINAL
========================= */

function runTerminalCommand() {
    const input = $("terminalInput");
    const command = input.value.trim();

    if (!command) return;

    const terminal = $("terminalView");

    const line = document.createElement("p");
    line.textContent = `❯ ${command}`;
    terminal.insertBefore(line, input.parentElement);

    input.value = "";

    const project = getActiveProject();

    const parts = command.split(/\s+/);
    const action = parts[0].toLowerCase();

    const output = message => {
        const result = document.createElement("p");
        result.textContent = message;
        terminal.insertBefore(result, input.parentElement);
    };

    if (action === "help") {
        output("Commands: help, ls, pwd, clear, date, projects, run");
    } else if (action === "clear") {
        terminal.querySelectorAll("p").forEach(item => {
            if (!item.classList.contains("terminal-welcome")) {
                item.remove();
            }
        });
    } else if (action === "pwd") {
        output(project ? `/workspace/${project.name}` : "/workspace");
    } else if (action === "ls") {
        output(
            project
                ? Object.keys(project.files).join("    ")
                : "Tidak ada project aktif."
        );
    } else if (action === "date") {
        output(new Date().toLocaleString("id-ID"));
    } else if (action === "projects") {
        output(
            projects.length
                ? projects.map(item => item.name).join(", ")
                : "Belum ada project."
        );
    } else if (action === "run") {
        runProject();
        output("Menjalankan preview...");
    } else {
        output(`Command tidak dikenal: ${action}. Ketik help.`);
    }

    terminal.scrollTop = terminal.scrollHeight;
}

/* =========================================================
   SEARCH
========================================================= */

function openSearch() {
    $("searchModal").classList.remove("hidden");
    $("searchInput").value = "";
    $("searchMessage").textContent = "";
    $("searchInput").focus();
}

function performSearch() {
    const query = $("searchInput").value.trim().toLowerCase();

    if (!query) {
        $("searchMessage").textContent = "Masukkan kata pencarian.";
        return;
    }

    searchResults = [];

    projects.forEach(project => {
        if (project.name.toLowerCase().includes(query)) {
            searchResults.push({
                project,
                filename: null
            });
        }

        Object.entries(project.files).forEach(([filename, content]) => {
            if (
                filename.toLowerCase().includes(query) ||
                content.toLowerCase().includes(query)
            ) {
                searchResults.push({
                    project,
                    filename
                });
            }
        });
    });

    $("searchMessage").textContent =
        `${searchResults.length} hasil ditemukan.`;

    if (!searchResults.length) {
        showToast("Tidak ada hasil ditemukan");
        return;
    }

    const first = searchResults[0];

    $("searchModal").classList.add("hidden");

    openProject(first.project.id);

    if (first.filename) {
        openFile(first.filename);
    }

    showToast("Hasil pencarian dibuka");
}

/* =========================================================
   IMPORT / EXPORT PROJECT
========================================================= */

function exportProject(id = activeProjectId) {
    const project = projects.find(item => item.id === id);

    if (!project) {
        showToast("Project tidak ditemukan");
        return;
    }

    const blob = new Blob(
        [JSON.stringify(project, null, 2)],
        { type: "application/json" }
    );

    downloadBlob(blob, `${project.name}.json`);

    showToast("Project berhasil diekspor");
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importProjectFile(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const imported = normalizeProject(
                JSON.parse(reader.result)
            );

            if (!imported) {
                throw new Error("Invalid project");
            }

            imported.id = createId();
            imported.name = imported.name + " (Imported)";

            projects.unshift(imported);

            saveData();
            renderDashboard();
            openProject(imported.id);

            showToast("Project berhasil diimpor");
        } catch (error) {
            showToast("File project tidak valid");
            console.error(error);
        }
    };

    reader.readAsText(file);
}

function importIndividualFiles(files) {
    const project = getActiveProject();

    if (!project) {
        showToast("Buka project terlebih dahulu");
        return;
    }

    Array.from(files).forEach(file => {
        const reader = new FileReader();

        reader.onload = () => {
            project.files[file.name] = String(reader.result);

            saveData();
            renderFiles();

            showToast(`${file.name} berhasil diimpor`);
        };

        reader.readAsText(file);
    });
}

/* =========================================================
   THEME
========================================================= */

function applyTheme() {
    const systemDark = window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

    const useDark =
        currentTheme === "dark" ||
        (currentTheme === "system" && systemDark);

    document.body.classList.toggle("light-theme", !useDark);

    if ($("appearanceSelect")) {
        $("appearanceSelect").value = currentTheme;
    }
}

function setTheme(theme) {
    currentTheme = theme;

    applyTheme();
    saveData();

    showToast(`Tema ${theme} diterapkan`);
}

function toggleTheme() {
    setTheme(
        currentTheme === "dark" ? "light" : "dark"
    );
}

function applyFontSize() {
    if (codeEditor) {
        codeEditor.style.fontSize = `${editorFontSize}px`;
    }

    if ($("fontSizeSelect")) {
        $("fontSizeSelect").value = String(editorFontSize);
    }
}

/* =========================================================
   SETTINGS
========================================================= */

function openSettings() {
    $("settingsModal").classList.remove("hidden");
}

function closeSettings() {
    $("settingsModal").classList.add("hidden");
}

/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function toggleSidebar() {
    $("sidebar")?.classList.toggle("open");
}

/* =========================================================
   BOTTOM PANEL
========================================================= */

function toggleBottomPanel() {
    $("bottomPanel")?.classList.toggle("collapsed");
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

function bindEvents() {

    $("homeBtn")?.addEventListener("click", () => {
        showDashboard();
        $("sidebar")?.classList.remove("open");
    });

    $("projectsNavBtn")?.addEventListener("click", () => {
        showDashboard();
        $("sidebar")?.classList.remove("open");
    });

    $("menuBtn")?.addEventListener("click", toggleSidebar);

    $("newProjectBtn")?.addEventListener("click", openProjectModal);
    $("emptyCreateBtn")?.addEventListener("click", openProjectModal);

    $("closeProjectModal")?.addEventListener(
        "click",
        closeProjectModal
    );

    $("confirmProjectBtn")?.addEventListener(
        "click",
        createProject
    );

    $("projectNameInput")?.addEventListener("keydown", event => {
        if (event.key === "Enter") createProject();
    });

    $("backDashboardBtn")?.addEventListener(
        "click",
        showDashboard
    );

    $("fileMenuBtn")?.addEventListener("click", () => {
        fileDrawer?.classList.toggle("hidden");
    });

    $("closeDrawerBtn")?.addEventListener("click", () => {
        fileDrawer?.classList.add("hidden");
    });

    $("addFileBtn")?.addEventListener("click", addNewFile);

    $("saveBtn")?.addEventListener("click", manualSave);

    $("runBtn")?.addEventListener("click", runProject);

    $("previewBtn")?.addEventListener("click", togglePreview);

    $("reloadBtn")?.addEventListener("click", reloadPreview);

    $("closePreviewBtn")?.addEventListener("click", closePreview);

    $("fullscreenBtn")?.addEventListener(
        "click",
        fullscreenPreview
    );

    $("searchBtn")?.addEventListener("click", openSearch);

    $("closeSearchModal")?.addEventListener("click", () => {
        $("searchModal").classList.add("hidden");
    });

    $("confirmSearchBtn")?.addEventListener(
        "click",
        performSearch
    );

    $("searchInput")?.addEventListener("keydown", event => {
        if (event.key === "Enter") performSearch();
    });

    $("themeBtn")?.addEventListener("click", toggleTheme);

    $("settingsBtn")?.addEventListener("click", openSettings);

    $("closeSettingsModal")?.addEventListener(
        "click",
        closeSettings
    );

    $("appearanceSelect")?.addEventListener("change", event => {
        setTheme(event.target.value);
    });

    $("fontSizeSelect")?.addEventListener("change", event => {
        editorFontSize = Number(event.target.value);
        applyFontSize();
        saveData();
    });

    $("clearConsoleBtn")?.addEventListener("click", clearConsole);

    $("toggleBottomPanelBtn")?.addEventListener(
        "click",
        toggleBottomPanel
    );

    $("terminalInput")?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            runTerminalCommand();
        }
    });

    document.querySelectorAll(".bottom-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            switchBottomPanel(tab.dataset.panel);
        });
    });

    codeEditor?.addEventListener("input", handleEditorInput);

    codeEditor?.addEventListener(
        "keydown",
        handleEditorKeydown
    );

    codeEditor?.addEventListener("click", updateCursorPosition);

    codeEditor?.addEventListener("keyup", updateCursorPosition);

    $("importFileBtn")?.addEventListener("click", () => {
        $("fileInput").click();
    });

    $("fileInput")?.addEventListener("change", event => {
        importIndividualFiles(event.target.files);
        event.target.value = "";
    });

    $("exportProjectBtn")?.addEventListener("click", () => {
        exportProject();
    });

    $("importProjectBtn")?.addEventListener("click", () => {
        $("projectImportInput").click();
    });

    $("projectImportInput")?.addEventListener("change", event => {
        importProjectFile(event.target.files[0]);
        event.target.value = "";
    });

    $("viewAllBtn")?.addEventListener("click", () => {
        renderDashboard();
        showToast("Menampilkan semua project");
    });

    /* CLOSE MODALS BY CLICKING OUTSIDE */

    ["projectModal", "searchModal", "settingsModal"].forEach(id => {
        $(id)?.addEventListener("click", event => {
            if (event.target.id === id) {
                $(id).classList.add("hidden");
            }
        });
    });

    /* KEYBOARD SHORTCUTS */

    document.addEventListener("keydown", event => {
        const modifier = event.ctrlKey || event.metaKey;

        if (modifier && event.key.toLowerCase() === "k") {
            event.preventDefault();
            openSearch();
        }

        if (modifier && event.key.toLowerCase() === "s") {
            event.preventDefault();
            manualSave();
        }

        if (event.key === "Escape") {
            fileDrawer?.classList.add("hidden");
            $("searchModal")?.classList.add("hidden");
            $("settingsModal")?.classList.add("hidden");
            $("projectModal")?.classList.add("hidden");
        }
    });
}

/* =========================================================
   SYSTEM THEME LISTENER
========================================================= */

if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)")
        .addEventListener?.("change", () => {
            if (currentTheme === "system") {
                applyTheme();
            }
        });
}

/* =========================================================
   SERVICE WORKER
========================================================= */

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .catch(error => {
                console.warn("Service Worker:", error);
            });
    });
}

/* =========================================================
   INITIALIZATION
========================================================= */

function initializeApp() {
    loadData();

    bindEvents();

    renderDashboard();

    switchBottomPanel("terminal");

    applyTheme();
    applyFontSize();

    registerServiceWorker();

    console.log("Faiz Code Studio 5.0 initialized.");
}

initializeApp();

/* =========================================
   ADAPTIVE DEVICE SIMULATOR
========================================= */

(() => {
    const deviceFrame = document.getElementById("deviceFrame");
    const deviceOptions = document.querySelectorAll(".device-option");
    const rotateButton = document.getElementById("previewRotateBtn");
    const deviceName = document.getElementById("deviceName");
    const deviceResolution = document.getElementById("deviceResolution");

    if (
        !deviceFrame ||
        !rotateButton ||
        !deviceName ||
        !deviceResolution
    ) return;

    let currentDevice = "mobile";
    let isLandscape = false;

    const deviceSettings = {
        mobile: {
            name: "Mobile Preview",
            width: 390,
            height: 844
        },
        tablet: {
            name: "Tablet Preview",
            width: 768,
            height: 1024
        },
        desktop: {
            name: "Desktop Preview",
            width: 1440,
            height: 900
        }
    };

    function updateDevice() {
        const settings = deviceSettings[currentDevice];

        deviceFrame.classList.remove(
            "mobile-device",
            "tablet-device",
            "desktop-device",
            "landscape"
        );

        deviceFrame.classList.add(`${currentDevice}-device`);

        if (isLandscape && currentDevice !== "desktop") {
            deviceFrame.classList.add("landscape");
        }

        deviceOptions.forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.device === currentDevice
            );
        });

        const width = isLandscape
            ? settings.height
            : settings.width;

        const height = isLandscape
            ? settings.width
            : settings.height;

        deviceName.textContent = settings.name;

        deviceResolution.textContent =
            `${width} × ${height}`;

        deviceFrame.style.setProperty(
            "--device-width",
            `${width}px`
        );

        deviceFrame.style.setProperty(
            "--device-height",
            `${height}px`
        );
    }

    deviceOptions.forEach(button => {
        button.addEventListener("click", () => {
            const selectedDevice = button.dataset.device;

            if (!deviceSettings[selectedDevice]) return;

            currentDevice = selectedDevice;

            if (currentDevice === "desktop") {
                isLandscape = false;
            }

            updateDevice();
        });
    });

    rotateButton.addEventListener("click", () => {
        if (currentDevice === "desktop") return;

        isLandscape = !isLandscape;
        updateDevice();
    });

    updateDevice();
})();


/* DEVICE DRAG - INTERACTION SAFE */

(() => {
    const stage = document.getElementById("deviceStage");
    const frame = document.getElementById("deviceFrame");

    if (!stage || !frame) return;

    let active = false;
    let startX = 0;
    let startY = 0;
    let offsetX = 0;
    let offsetY = 0;

    // Drag hanya dimulai dari area frame,
    // bukan dari layar website.
    frame.addEventListener("pointerdown", event => {
        if (event.target.closest("iframe, .device-screen")) return;

        active = true;
        startX = event.clientX;
        startY = event.clientY;

        frame.classList.add("dragging");
        frame.setPointerCapture(event.pointerId);
    });

    frame.addEventListener("pointermove", event => {
        if (!active) return;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        const stageRect = stage.getBoundingClientRect();
        const maxX = Math.max(0, (stageRect.width - frame.offsetWidth) / 2);
        const maxY = Math.max(0, (stageRect.height - frame.offsetHeight) / 2);

        offsetX = Math.max(-maxX, Math.min(maxX, offsetX + dx));
        offsetY = Math.max(-maxY, Math.min(maxY, offsetY + dy));

        startX = event.clientX;
        startY = event.clientY;

        frame.style.transform =
            `translate(${offsetX}px, ${offsetY}px)`;
    });

    function stopDrag() {
        active = false;
        frame.classList.remove("dragging");
    }

    frame.addEventListener("pointerup", stopDrag);
    frame.addEventListener("pointercancel", stopDrag);
})();
