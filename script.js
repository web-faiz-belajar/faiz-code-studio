
/* ==========================================
   FAIZ CODE STUDIO 2.0
   PROJECT MANAGER + EDITOR + SIMULATOR
========================================== */

const $ = id => document.getElementById(id);

const STORAGE_KEY = "faiz_code_studio_v2";
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

const defaultCSS = `body {
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 30px;
    background: #f1f5f9;
}

h1 {
    color: #5267e8;
}

button {
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    background: #5267e8;
    color: white;
}`;

const defaultJS = `function halo() {
    alert("JavaScript berhasil berjalan!");
}`;

/* DEFAULT FILES */

function createDefaultFiles(template = "web") {
    if (template === "blank") {
        return {
            "index.html": "",
            "style.css": "",
            "script.js": ""
        };
    }

    return {
        "index.html": defaultHTML,
        "style.css": defaultCSS,
        "script.js": defaultJS
    };
}

/* PROJECT DATA */

let projects = [];
let activeProjectId = null;
let activeFile = null;
let openFiles = [];
let autoSaveTimer = null;
let toastTimer = null;

/* HELPERS */

function makeId() {
    return "project_" + Date.now() + "_" +
        Math.random().toString(36).slice(2, 8);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getExtension(name) {
    const parts = name.split(".");
    return parts.length > 1
        ? parts.pop().toLowerCase()
        : "txt";
}

function getFileIcon(name) {
    const ext = getExtension(name);

    return {
        html: "🌐",
        htm: "🌐",
        css: "🎨",
        js: "⚡",
        json: "📋",
        txt: "📄"
    }[ext] || "📄";
}

function getLanguage(name) {
    const ext = getExtension(name);

    return {
        html: "HTML",
        htm: "HTML",
        css: "CSS",
        js: "JAVASCRIPT",
        json: "JSON",
        txt: "TEXT"
    }[ext] || "TEXT";
}

function getActiveProject() {
    return projects.find(project =>
        project.id === activeProjectId
    ) || null;
}

/* STORAGE */

function saveAll() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                version: 2,
                projects,
                activeProjectId,
                theme: document.body.classList.contains("light-theme")
                    ? "light"
                    : "dark"
            })
        );

        return true;
    } catch (error) {
        console.error("Storage error:", error);
        showToast("Penyimpanan penuh atau tidak tersedia.");
        return false;
    }
}

function loadAll() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const data = JSON.parse(saved);

            if (Array.isArray(data.projects)) {
                projects = data.projects
                    .filter(project =>
                        project &&
                        typeof project.id === "string" &&
                        typeof project.name === "string" &&
                        project.files &&
                        typeof project.files === "object"
                    )
                    .map(project => ({
                        id: project.id,
                        name: project.name,
                        files: project.files,
                        createdAt: project.createdAt || Date.now(),
                        updatedAt: project.updatedAt || Date.now()
                    }));

                activeProjectId = data.activeProjectId || null;

                if (data.theme === "light") {
                    document.body.classList.add("light-theme");
                }

                return;
            }
        }

        migrateOldProject();

    } catch (error) {
        console.error("Load error:", error);
        projects = [];
    }
}

/* MIGRATE VERSION 1 */

function migrateOldProject() {
    try {
        const old = localStorage.getItem(OLD_STORAGE_KEY);

        if (old) {
            const data = JSON.parse(old);

            if (
                data &&
                typeof data.html === "string" &&
                typeof data.css === "string" &&
                typeof data.js === "string"
            ) {
                const project = {
                    id: makeId(),
                    name: "Project Lama",
                    files: {
                        "index.html": data.html,
                        "style.css": data.css,
                        "script.js": data.js
                    },
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                projects.push(project);
                activeProjectId = project.id;
                saveAll();

                showToast("Project versi 1.0 berhasil dipindahkan.");
                return;
            }
        }
    } catch (error) {
        console.error("Migration error:", error);
    }

    projects = [];
}

/* TOAST */

function showToast(message) {
    const toast = $("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2300);
}

/* DASHBOARD */

function renderDashboard() {
    const grid = $("projectGrid");
    const empty = $("emptyProjects");

    $("projectCount").textContent =
        projects.length + " PROJECT";

    grid.innerHTML = "";

    empty.classList.toggle("hidden", projects.length > 0);

    projects.forEach(project => {
        const fileCount = Object.keys(project.files).length;

        const card = document.createElement("article");
        card.className = "project-card";

        card.innerHTML = `
            <div class="project-card-top">
                <div class="project-symbol">⌘</div>
                <button class="project-menu" data-action="menu"
                    aria-label="Menu project">•••</button>
            </div>

            <h3>${escapeHTML(project.name)}</h3>
            <p>${fileCount} file · Project lokal</p>

            <div class="project-card-bottom">
                <span>FAIZ WORKSPACE</span>
                <span class="open-project">BUKA →</span>
            </div>
        `;

        card.addEventListener("click", event => {
            if (event.target.closest("[data-action='menu']")) {
                projectMenu(project.id);
                return;
            }

            openProject(project.id);
        });

        grid.appendChild(card);
    });
}

function projectMenu(id) {
    const project = projects.find(item => item.id === id);
    if (!project) return;

    const choice = prompt(
        "Project: " + project.name +
        "\n\nKetik salah satu:\n1 = Ganti nama\n2 = Hapus project"
    );

    if (choice === "1") {
        const newName = prompt("Nama project baru:", project.name);

        if (newName && newName.trim()) {
            project.name = newName.trim();
            project.updatedAt = Date.now();
            saveAll();
            renderDashboard();
            showToast("Nama project diperbarui.");
        }
    }

    if (choice === "2") {
        if (confirm("Hapus project " + project.name + "?")) {
            projects = projects.filter(item => item.id !== id);

            if (activeProjectId === id) {
                activeProjectId = null;
            }

            saveAll();
            renderDashboard();
            showToast("Project dihapus.");
        }
    }
}

/* PROJECT MODAL */

function showProjectModal() {
    $("projectNameInput").value = "";
    $("projectTemplate").value = "web";
    $("projectModal").classList.remove("hidden");
    $("projectNameInput").focus();
}

function hideProjectModal() {
    $("projectModal").classList.add("hidden");
}

function createProject() {
    const name = $("projectNameInput").value.trim();

    if (!name) {
        showToast("Masukkan nama project.");
        return;
    }

    const project = {
        id: makeId(),
        name,
        files: createDefaultFiles($("projectTemplate").value),
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    projects.unshift(project);
    activeProjectId = project.id;

    saveAll();
    hideProjectModal();
    renderDashboard();
    openProject(project.id);

    showToast("Project berhasil dibuat.");
}

/* OPEN PROJECT */

function openProject(id) {
    const project = projects.find(item => item.id === id);
    if (!project) return;

    activeProjectId = id;

    const fileNames = Object.keys(project.files);

    if (fileNames.length === 0) {
        project.files["index.html"] = "";
    }

    openFiles = Object.keys(project.files);

    activeFile = openFiles.includes("index.html")
        ? "index.html"
        : openFiles[0];

    $("dashboard").classList.add("hidden");
    $("workspace").classList.remove("hidden");

    $("currentProjectName").textContent = project.name;
    $("currentProjectInfo").textContent = "LOCAL PROJECT";
    $("drawerProjectName").textContent = project.name;

    renderFiles();
    renderTabs();
    loadEditor();
    saveAll();
}

/* DASHBOARD NAVIGATION */

function goDashboard() {
    saveCurrentFile();

    $("workspace").classList.add("hidden");
    $("dashboard").classList.remove("hidden");

    closeSimulator();
    fileDrawerClose();

    renderDashboard();
    saveAll();
}

$("homeBtn").addEventListener("click", goDashboard);
$("backDashboardBtn").addEventListener("click", goDashboard);

/* FILE EXPLORER */

function renderFiles() {
    const project = getActiveProject();
    if (!project) return;

    $("drawerProjectName").textContent = project.name;

    const list = $("fileList");
    list.innerHTML = "";

    Object.keys(project.files).forEach(name => {
        const button = document.createElement("button");
        button.className = "file-item" +
            (name === activeFile ? " active" : "");

        button.innerHTML = `
            <span>${getFileIcon(name)}</span>
            <span class="file-name">${escapeHTML(name)}</span>
            <span class="file-more">⋮</span>
        `;

        button.addEventListener("click", event => {
            if (event.target.closest(".file-more")) {
                fileMenu(name);
                return;
            }

            switchFile(name);
            fileDrawerClose();
        });

        list.appendChild(button);
    });
}

function fileDrawerClose() {
    $("fileDrawer").classList.remove("open");
}

$("fileMenuBtn").addEventListener("click", () => {
    $("fileDrawer").classList.toggle("open");
});

$("closeDrawerBtn").addEventListener("click", fileDrawerClose);

/* ADD FILE */

function addFile() {
    const project = getActiveProject();
    if (!project) return;

    const name = prompt(
        "Nama file baru:\nContoh: about.html atau style.css"
    );

    if (!name) return;

    const cleanName = name.trim();

    if (!/^[a-zA-Z0-9._-]+$/.test(cleanName)) {
        showToast("Nama file tidak valid.");
        return;
    }

    if (project.files[cleanName] !== undefined) {
        showToast("File sudah ada.");
        return;
    }

    project.files[cleanName] = "";
    openFiles.push(cleanName);

    project.updatedAt = Date.now();

    saveAll();
    switchFile(cleanName);
    renderFiles();

    showToast("File berhasil dibuat.");
}

$("addFileBtn").addEventListener("click", addFile);

/* FILE MENU */

function fileMenu(name) {
    const project = getActiveProject();
    if (!project) return;

    const choice = prompt(
        "File: " + name +
        "\n\n1 = Ganti nama\n2 = Hapus file"
    );

    if (choice === "1") {
        const newName = prompt("Nama file baru:", name);

        if (!newName) return;

        const cleanName = newName.trim();

        if (!/^[a-zA-Z0-9._-]+$/.test(cleanName)) {
            showToast("Nama file tidak valid.");
            return;
        }

        if (project.files[cleanName] !== undefined) {
            showToast("Nama file sudah digunakan.");
            return;
        }

        project.files[cleanName] = project.files[name];
        delete project.files[name];

        openFiles = openFiles.map(file =>
            file === name ? cleanName : file
        );

        if (activeFile === name) {
            activeFile = cleanName;
        }

        saveAll();
        renderFiles();
        renderTabs();
        loadEditor();

        showToast("Nama file diperbarui.");
    }

    if (choice === "2") {
        if (Object.keys(project.files).length <= 1) {
            showToast("Project harus memiliki minimal satu file.");
            return;
        }

        if (!confirm("Hapus file " + name + "?")) return;

        delete project.files[name];
        openFiles = openFiles.filter(file => file !== name);

        if (activeFile === name) {
            activeFile = openFiles[0];
        }

        saveAll();
        renderFiles();
        renderTabs();
        loadEditor();

        showToast("File dihapus.");
    }
}

/* FILE TABS */

function renderTabs() {
    const bar = $("tabsBar");
    bar.innerHTML = "";

    openFiles.forEach(name => {
        const tab = document.createElement("button");

        tab.className = "editor-tab" +
            (name === activeFile ? " active" : "");

        tab.innerHTML = `
            <span>${getFileIcon(name)}</span>
            <span>${escapeHTML(name)}</span>
        `;

        tab.addEventListener("click", () => switchFile(name));

        bar.appendChild(tab);
    });
}

function switchFile(name) {
    const project = getActiveProject();
    if (!project || project.files[name] === undefined) return;

    saveCurrentFile();

    activeFile = name;

    if (!openFiles.includes(name)) {
        openFiles.push(name);
    }

    loadEditor();
    renderTabs();
    renderFiles();
}

/* EDITOR */

function loadEditor() {
    const project = getActiveProject();
    if (!project) return;

    codeEditor.value = project.files[activeFile] || "";

    $("activeFilePath").textContent = activeFile;
    $("languageLabel").textContent = getLanguage(activeFile);

    updateLineNumbers();
    updateCursor();
    $("saveStatus").textContent = "TERSIMPAN";
}

function saveCurrentFile() {
    const project = getActiveProject();
    if (!project || !activeFile) return;

    project.files[activeFile] = codeEditor.value;
    project.updatedAt = Date.now();
}

function saveEverything() {
    saveCurrentFile();

    if (saveAll()) {
        $("saveStatus").textContent = "TERSIMPAN";
    }
}

function scheduleAutoSave() {
    $("saveStatus").textContent = "MENYIMPAN...";

    clearTimeout(autoSaveTimer);

    autoSaveTimer = setTimeout(() => {
        saveEverything();
        $("saveStatus").textContent = "TERSIMPAN";
    }, 500);
}

codeEditor.addEventListener("input", () => {
    saveCurrentFile();
    updateLineNumbers();
    updateCursor();
    scheduleAutoSave();
});

/* LINE NUMBERS */

function updateLineNumbers() {
    const count = codeEditor.value.split("\n").length;

    $("lineNumbers").textContent = Array.from(
        { length: count },
        (_, index) => index + 1
    ).join("\n");
}

codeEditor.addEventListener("scroll", () => {
    $("lineNumbers").scrollTop = codeEditor.scrollTop;
});

/* CURSOR POSITION */

function updateCursor() {
    const before = codeEditor.value.slice(
        0,
        codeEditor.selectionStart
    );

    const lines = before.split("\n");
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;

    $("cursorPosition").textContent =
        `LINE ${line} : COL ${column}`;
}

["click", "keyup", "select"].forEach(eventName => {
    codeEditor.addEventListener(eventName, updateCursor);
});

/* TAB KEY */

codeEditor.addEventListener("keydown", event => {
    if (event.key === "Tab") {
        event.preventDefault();

        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;

        codeEditor.setRangeText(
            "    ",
            start,
            end,
            "end"
        );

        saveCurrentFile();
        updateLineNumbers();
        scheduleAutoSave();
    }
});

/* SAVE BUTTON */

$("saveBtn").addEventListener("click", () => {
    saveEverything();
    showToast("Project berhasil disimpan.");
});

/* SEARCH */

function openSearch() {
    $("searchInput").value = "";
    $("searchMessage").textContent = "";
    $("searchModal").classList.remove("hidden");
    $("searchInput").focus();
}

$("searchBtn").addEventListener("click", openSearch);

$("closeSearchModal").addEventListener("click", () => {
    $("searchModal").classList.add("hidden");
});

function searchCode() {
    const query = $("searchInput").value;

    if (!query) {
        $("searchMessage").textContent = "Masukkan kata pencarian.";
        return;
    }

    const content = codeEditor.value;
    const index = content.toLowerCase().indexOf(query.toLowerCase());

    if (index === -1) {
        $("searchMessage").textContent = "Tidak ditemukan di file ini.";
        return;
    }

    codeEditor.focus();
    codeEditor.setSelectionRange(index, index + query.length);

    const before = content.slice(0, index);
    const line = before.split("\n").length;

    const lineHeight = 20.4;
    codeEditor.scrollTop = Math.max(0, (line - 3) * lineHeight);

    $("searchMessage").textContent =
        "Ditemukan pada baris " + line;
}

$("confirmSearchBtn").addEventListener("click", searchCode);

/* BUILD PREVIEW */

function buildPreview() {
    const project = getActiveProject();
    if (!project) return "";

    const files = project.files;

    let html = files["index.html"] || "";
    const css = files["style.css"] || "";
    const js = files["script.js"] || "";

    const styleTag = `
<style>
${css}
</style>
`;

    const scriptTag = `
<script>
${js}
<\/script>
`;

    if (/<\/head\s*>/i.test(html)) {
        html = html.replace(
            /<\/head\s*>/i,
            styleTag + "</head>"
        );
    } else {
        html = styleTag + html;
    }

    if (/<\/body\s*>/i.test(html)) {
        html = html.replace(
            /<\/body\s*>/i,
            scriptTag + "</body>"
        );
    } else {
        html += scriptTag;
    }

    return html;
}

/* RUN */

function runCode() {
    saveEverything();

    const project = getActiveProject();

    if (!project) {
        showToast("Buka project terlebih dahulu.");
        return;
    }

    if (!project.files["index.html"]) {
        showToast("File index.html belum tersedia.");
        return;
    }

    $("previewFrame").srcdoc = buildPreview();
    showToast("Preview berhasil diperbarui.");
}

$("runBtn").addEventListener("click", () => {
    runCode();
    openSimulator();
});

$("reloadBtn").addEventListener("click", runCode);

/* SIMULATOR */

function openSimulator() {
    $("workspace").classList.add("preview-open");
    $("previewBtn").setAttribute("aria-expanded", "true");
    $("previewBtn").title = "Tutup Simulator";

    runCode();
}

function closeSimulator() {
    $("workspace").classList.remove("preview-open");
    $("previewBtn").setAttribute("aria-expanded", "false");
    $("previewBtn").title = "Buka Simulator";
}

$("previewBtn").addEventListener("click", () => {
    const isOpen = $("workspace").classList.contains("preview-open");

    if (isOpen) {
        closeSimulator();
    } else {
        openSimulator();
    }
});

$("closePreviewBtn").addEventListener("click", closeSimulator);

/* FULLSCREEN */

$("fullscreenBtn").addEventListener("click", async () => {
    const panel = $("previewPanel");

    try {
        if (!document.fullscreenElement) {
            await panel.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    } catch (error) {
        showToast("Fullscreen tidak didukung browser ini.");
    }
});

/* PROJECT EVENTS */

$("newProjectBtn").addEventListener("click", showProjectModal);
$("emptyCreateBtn").addEventListener("click", showProjectModal);
$("closeProjectModal").addEventListener("click", hideProjectModal);
$("confirmProjectBtn").addEventListener("click", createProject);

/* THEME */

$("themeBtn").addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    saveAll();
});

/* INITIALIZATION */

loadAll();
renderDashboard();

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .catch(error => {
                console.error("Service Worker:", error);
            });
    });
}

/* KEEP DATA WHEN LEAVING */

window.addEventListener("pagehide", () => {
    saveCurrentFile();
    saveAll();
});
