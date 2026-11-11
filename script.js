
"use strict";

/* =========================================
   FAIZ CODE STUDIO 5.1
========================================= */

const $ = id => document.getElementById(id);

const STORAGE_KEY = "faiz_code_studio_v5";

const defaultHTML = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Website</title>
</head>
<body>
<h1>Hello World!</h1>
<p>Selamat datang di project pertama saya.</p>
</body>
</html>`;

const defaultCSS = `body {
    font-family: Arial, sans-serif;
    padding: 30px;
    background: #f4f4f4;
}

h1 {
    color: #6758e8;
}`;

const defaultJS = `console.log("Hello from Faiz Code Studio!");`;

let projects = [];
let currentProjectId = null;
let activeFile = "index.html";
let activePanel = "terminal";
let autoSaveTimer = null;
let currentDevice = "mobile";
let isLandscape = false;

function uid() {
    return "p_" + Date.now() + "_" + Math.random().toString(36).slice(2,8);
}

function starterFiles(blank = false) {
    return {
        "index.html": blank ? "" : defaultHTML,
        "style.css": blank ? "" : defaultCSS,
        "script.js": blank ? "" : defaultJS
    };
}

function loadData() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (Array.isArray(saved)) projects = saved;
    } catch (error) {
        console.error(error);
    }

    renderProjects();
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
        showToast("Penyimpanan gagal. Periksa ruang browser.");
    }
}

function getProject() {
    return projects.find(p => p.id === currentProjectId);
}

/* =========================================
   DASHBOARD
========================================= */

function renderProjects() {
    const grid = $("projectGrid");
    const empty = $("emptyProjects");

    grid.innerHTML = "";
    $("projectCount").textContent = projects.length;

    empty.classList.toggle("hidden", projects.length > 0);

    projects.forEach(project => {
        const card = document.createElement("article");
        card.className = "project-card";

        const icon = document.createElement("div");
        icon.className = "project-card-icon";
        icon.textContent = "</>";

        const title = document.createElement("h3");
        title.textContent = project.name;

        const description = document.createElement("p");
        description.textContent = "HTML / CSS / JavaScript";

        const footer = document.createElement("div");
        footer.className = "project-card-footer";
        footer.textContent = "Open project →";

        card.append(icon, title, description, footer);

        card.addEventListener("click", () => openProject(project.id));

        grid.appendChild(card);
    });
}

function showDashboard() {
    $("dashboard").classList.remove("hidden");
    $("workspace").classList.add("hidden");
    $("breadcrumbTitle").textContent = "Dashboard";
    $("homeBtn").classList.add("active");
    $("projectsNavBtn").classList.remove("active");
    $("sidebar").classList.remove("open");
}

function openProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    currentProjectId = id;
    activeFile = Object.keys(project.files)[0] || "index.html";

    $("dashboard").classList.add("hidden");
    $("workspace").classList.remove("hidden");

    $("breadcrumbTitle").textContent = project.name;
    $("currentProjectName").textContent = project.name;
    $("currentProjectInfo").textContent = "Web Development Project";
    $("drawerProjectName").textContent = project.name;

    $("homeBtn").classList.remove("active");
    $("projectsNavBtn").classList.add("active");

    renderFiles();
    renderTabs();
    loadEditor();
    showToast("Project dibuka");

    $("sidebar").classList.remove("open");
}

/* =========================================
   PROJECT MANAGER
========================================= */

function openProjectModal() {
    $("projectModal").classList.remove("hidden");
    $("projectNameInput").value = "";
    $("projectNameInput").focus();
}

function createProject() {
    const name = $("projectNameInput").value.trim();

    if (!name) {
        showToast("Masukkan nama project");
        return;
    }

    const blank = $("projectTemplate").value === "blank";

    const project = {
        id: uid(),
        name,
        files: starterFiles(blank),
        created: Date.now()
    };

    projects.unshift(project);
    saveData();
    renderProjects();

    $("projectModal").classList.add("hidden");
    openProject(project.id);
}

function deleteProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    if (!confirm(`Hapus project "${project.name}"?`)) return;

    projects = projects.filter(p => p.id !== id);

    if (currentProjectId === id) {
        currentProjectId = null;
        showDashboard();
    }

    saveData();
    renderProjects();
    showToast("Project dihapus");
}

/* =========================================
   FILE EXPLORER
========================================= */

function renderFiles() {
    const project = getProject();
    if (!project) return;

    const list = $("fileList");
    list.innerHTML = "";

    Object.keys(project.files).forEach(filename => {
        const item = document.createElement("div");
        item.className = "file-item";
        item.classList.toggle("active", filename === activeFile);
        item.textContent = "📄 " + filename;

        item.addEventListener("click", () => {
            activeFile = filename;
            renderFiles();
            renderTabs();
            loadEditor();
            $("fileDrawer").classList.add("hidden");
        });

        list.appendChild(item);
    });
}

function renderTabs() {
    const project = getProject();
    if (!project) return;

    const tabs = $("tabsBar");
    tabs.innerHTML = "";

    Object.keys(project.files).forEach(filename => {
        const button = document.createElement("button");
        button.className = "editor-tab";
        button.textContent = filename;
        button.classList.toggle("active", filename === activeFile);

        button.addEventListener("click", () => {
            activeFile = filename;
            renderTabs();
            renderFiles();
            loadEditor();
        });

        tabs.appendChild(button);
    });
}

function loadEditor() {
    const project = getProject();
    if (!project) return;

    const content = project.files[activeFile] ?? "";

    $("codeEditor").value = content;
    $("activeFilePath").textContent = activeFile;
    $("languageLabel").textContent = getLanguage(activeFile);

    updateLineNumbers();
    updateCursorPosition();
    $("saveStatus").textContent = "Saved";
}

function getLanguage(filename) {
    if (filename.endsWith(".html")) return "HTML";
    if (filename.endsWith(".css")) return "CSS";
    if (filename.endsWith(".js")) return "JavaScript";
    if (filename.endsWith(".json")) return "JSON";
    return "TEXT";
}

function addFile() {
    const project = getProject();
    if (!project) return;

    const filename = prompt("Nama file baru:");

    if (!filename) return;

    if (project.files[filename] !== undefined) {
        showToast("File sudah ada");
        return;
    }

    project.files[filename] = "";
    activeFile = filename;

    saveData();
    renderFiles();
    renderTabs();
    loadEditor();
}

function importFiles(fileList) {
    const project = getProject();
    if (!project) return;

    Array.from(fileList).forEach(file => {
        const reader = new FileReader();

        reader.onload = () => {
            project.files[file.name] = String(reader.result);
            activeFile = file.name;

            saveData();
            renderFiles();
            renderTabs();
            loadEditor();
        };

        reader.readAsText(file);
    });
}

/* =========================================
   EDITOR
========================================= */

function updateLineNumbers() {
    const lines = $("codeEditor").value.split("\n").length;
    $("lineNumbers").textContent =
        Array.from({length: lines}, (_,i) => i + 1).join("\n");
}

function updateCursorPosition() {
    const editor = $("codeEditor");
    const position = editor.selectionStart;
    const before = editor.value.slice(0, position).split("\n");

    const line = before.length;
    const column = before[before.length - 1].length + 1;

    $("cursorPosition").textContent = `Ln ${line}, Col ${column}`;
}

function updateEditor() {
    const project = getProject();
    if (!project) return;

    project.files[activeFile] = $("codeEditor").value;

    $("saveStatus").textContent = "Unsaved";
    updateLineNumbers();
    updateCursorPosition();

    clearTimeout(autoSaveTimer);

    autoSaveTimer = setTimeout(() => {
        saveData();
        $("saveStatus").textContent = "Saved";
    }, 500);
}

function saveProject() {
    const project = getProject();
    if (!project) return;

    project.files[activeFile] = $("codeEditor").value;
    saveData();

    $("saveStatus").textContent = "Saved";
    showToast("Project tersimpan");
}

/* =========================================
   PREVIEW
========================================= */

function buildPreview() {
    const project = getProject();
    if (!project) return;

    const files = project.files;

    let html = files["index.html"] || defaultHTML;
    const css = files["style.css"] || "";
    const js = files["script.js"] || "";

    const styleTag = `<style>${css.replace(/<\/style/gi, "<\\/style")}</style>`;
    const scriptTag = `<script>${js.replace(/<\/script/gi, "<\\/script")}<\/script>`;

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

    $("previewFrame").srcdoc = html;
    $("consoleOutput").innerHTML = "";
}

function showPreview() {
    $("previewPanel").classList.remove("hidden");
    buildPreview();
    updateDevice();
}

function hidePreview() {
    $("previewPanel").classList.add("hidden");
}

/* =========================================
   DEVICE SIMULATOR
========================================= */

const deviceSettings = {
    mobile: {name:"Mobile Preview",width:390,height:844},
    tablet: {name:"Tablet Preview",width:768,height:1024},
    desktop: {name:"Desktop Preview",width:1440,height:900}
};

function updateDevice() {
    const frame = $("deviceFrame");
    if (!frame) return;

    const settings = deviceSettings[currentDevice];

    frame.classList.remove(
        "mobile-device",
        "tablet-device",
        "desktop-device",
        "landscape"
    );

    frame.classList.add(currentDevice);

    if (isLandscape && currentDevice !== "desktop") {
        frame.classList.add("landscape");
    }

    document.querySelectorAll(".device-option").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.device === currentDevice
        );
    });

    const width = isLandscape ? settings.height : settings.width;
    const height = isLandscape ? settings.width : settings.height;

    $("deviceName").textContent = settings.name;
    $("deviceResolution").textContent = `${width} × ${height}`;

    const stage = $("deviceStage");
    const availableWidth = Math.max(100, stage.clientWidth - 24);
    const availableHeight = Math.max(100, stage.clientHeight - 24);

    let frameWidth;
    let frameHeight;

    if (currentDevice === "mobile") {
        frameWidth = Math.min(isLandscape ? 410 : 230, availableWidth);
        frameHeight = Math.min(isLandscape ? 230 : 440, availableHeight);
    } else if (currentDevice === "tablet") {
        frameWidth = Math.min(isLandscape ? 560 : 430, availableWidth);
        frameHeight = Math.min(isLandscape ? 320 : 340, availableHeight);
    } else {
        frameWidth = Math.min(720, availableWidth);
        frameHeight = Math.min(400, availableHeight);
    }

    frame.style.width = frameWidth + "px";
    frame.style.height = frameHeight + "px";
}

document.querySelectorAll(".device-option").forEach(button => {
    button.addEventListener("click", () => {
        currentDevice = button.dataset.device;
        if (currentDevice === "desktop") isLandscape = false;
        updateDevice();
    });
});

$("previewRotateBtn").addEventListener("click", () => {
    if (currentDevice === "desktop") return;
    isLandscape = !isLandscape;
    updateDevice();
});

window.addEventListener("resize", updateDevice);

/* =========================================
   TERMINAL & CONSOLE
========================================= */

function logConsole(message, type = "log") {
    const output = $("consoleOutput");

    if (output.querySelector(".console-empty")) {
        output.innerHTML = "";
    }

    const line = document.createElement("p");
    line.className = type === "error" ? "console-error" : "console-log";
    line.textContent = message;

    output.appendChild(line);
}

function terminalCommand(command) {
    const value = command.trim();
    if (!value) return;

    const terminal = $("terminalView");
    const result = document.createElement("p");

    result.textContent = "❯ " + value;
    terminal.insertBefore(result, $("terminalInput").parentElement);

    if (value === "help") {
        showToast("Perintah: help, clear, run, save");
    } else if (value === "clear") {
        terminal.querySelectorAll("p:not(.terminal-welcome)").forEach(p => p.remove());
    } else if (value === "run") {
        buildPreview();
        showPreview();
    } else if (value === "save") {
        saveProject();
    } else {
        const response = document.createElement("p");
        response.textContent = "Command tidak dikenal. Ketik help.";
        terminal.insertBefore(response, $("terminalInput").parentElement);
    }

    $("terminalInput").value = "";
}

/* =========================================
   BOTTOM PANEL
========================================= */

function selectPanel(name) {
    activePanel = name;

    document.querySelectorAll(".bottom-tab").forEach(button => {
        button.classList.toggle("active", button.dataset.panel === name);
    });

    ["terminal","console","problems"].forEach(panel => {
        const element = $(panel + "View");
        element.classList.toggle("hidden", panel !== name);
    });
}

/* =========================================
   THEME
========================================= */

function applyTheme(theme) {
    let light = theme === "light";

    if (theme === "system") {
        light = window.matchMedia("(prefers-color-scheme: light)").matches;
    }

    document.body.classList.toggle("light-theme", light);
    localStorage.setItem("faiz_code_studio_theme", theme);

    $("appearanceSelect").value = theme;
}

function toggleTheme() {
    const light = document.body.classList.contains("light-theme");
    applyTheme(light ? "dark" : "light");
}

/* =========================================
   MODALS & UTILITIES
========================================= */

function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function openModal(id) {
    $(id).classList.remove("hidden");
}

function closeModal(id) {
    $(id).classList.add("hidden");
}

/* =========================================
   EXPORT / IMPORT
========================================= */

function exportProject() {
    const project = getProject();
    if (!project) return;

    const blob = new Blob(
        [JSON.stringify(project, null, 2)],
        {type:"application/json"}
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = project.name.replace(/[^a-z0-9_-]/gi,"_") + ".json";
    link.click();

    URL.revokeObjectURL(url);
    showToast("Project diekspor");
}

function importProject(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const project = JSON.parse(reader.result);

            if (!project.name || !project.files || typeof project.files !== "object") {
                throw new Error("Format project tidak valid");
            }

            project.id = uid();
            projects.unshift(project);

            saveData();
            renderProjects();

            showToast("Project berhasil diimpor");
        } catch (error) {
            showToast("File project tidak valid");
        }
    };

    reader.readAsText(file);
}

/* =========================================
   EVENT LISTENERS
========================================= */

$("newProjectBtn").addEventListener("click", openProjectModal);
$("emptyCreateBtn").addEventListener("click", openProjectModal);
$("confirmProjectBtn").addEventListener("click", createProject);

$("closeProjectModal").addEventListener("click", () => closeModal("projectModal"));

$("backDashboardBtn").addEventListener("click", showDashboard);
$("homeBtn").addEventListener("click", showDashboard);

$("projectsNavBtn").addEventListener("click", () => {
    showDashboard();
    $("projectsNavBtn").classList.add("active");
    $("homeBtn").classList.remove("active");
});

$("saveBtn").addEventListener("click", saveProject);

$("runBtn").addEventListener("click", () => {
    saveProject();
    showPreview();
});

$("previewBtn").addEventListener("click", showPreview);
$("closePreviewBtn").addEventListener("click", hidePreview);
$("reloadBtn").addEventListener("click", buildPreview);

$("fullscreenBtn").addEventListener("click", () => {
    const panel = $("previewPanel");

    if (panel.requestFullscreen) {
        panel.requestFullscreen().catch(() => showToast("Fullscreen tidak tersedia"));
    }
});

$("codeEditor").addEventListener("input", updateEditor);
$("codeEditor").addEventListener("click", updateCursorPosition);
$("codeEditor").addEventListener("keyup", updateCursorPosition);

$("fileMenuBtn").addEventListener("click", () => {
    $("fileDrawer").classList.toggle("hidden");
});

$("closeDrawerBtn").addEventListener("click", () => {
    $("fileDrawer").classList.add("hidden");
});

$("addFileBtn").addEventListener("click", addFile);

$("importFileBtn").addEventListener("click", () => {
    $("fileInput").click();
});

$("fileInput").addEventListener("change", event => {
    importFiles(event.target.files);
    event.target.value = "";
});

$("editorMoreBtn").addEventListener("click", exportProject);

$("toggleBottomPanelBtn").addEventListener("click", () => {
    $("bottomPanel").classList.toggle("collapsed");
});

$("clearConsoleBtn").addEventListener("click", () => {
    $("consoleOutput").innerHTML = '<p class="console-empty">Console output akan muncul di sini.</p>';
});

document.querySelectorAll(".bottom-tab").forEach(button => {
    button.addEventListener("click", () => selectPanel(button.dataset.panel));
});

$("terminalInput").addEventListener("keydown", event => {
    if (event.key === "Enter") {
        terminalCommand(event.target.value);
    }
});

$("menuBtn").addEventListener("click", () => {
    $("sidebar").classList.toggle("open");
});

$("themeBtn").addEventListener("click", toggleTheme);

$("settingsBtn").addEventListener("click", () => openModal("settingsModal"));
$("closeSettingsModal").addEventListener("click", () => closeModal("settingsModal"));

$("appearanceSelect").addEventListener("change", event => {
    applyTheme(event.target.value);
});

$("fontSizeSelect").addEventListener("change", event => {
    $("codeEditor").style.fontSize = event.target.value + "px";
});

$("searchBtn").addEventListener("click", () => {
    openModal("searchModal");
    $("searchInput").focus();
});

$("closeSearchModal").addEventListener("click", () => closeModal("searchModal"));

$("confirmSearchBtn").addEventListener("click", () => {
    const query = $("searchInput").value.trim().toLowerCase();

    if (!query) {
        $("searchMessage").textContent = "Masukkan kata pencarian.";
        return;
    }

    const matches = projects.filter(project => project.name.toLowerCase().includes(query));

    $("searchMessage").textContent =
        matches.length
        ? matches.map(project => project.name).join(", ")
        : "Project tidak ditemukan.";
});

$("viewAllBtn").addEventListener("click", () => {
    $("projectGrid").scrollIntoView({behavior:"smooth"});
});

$("projectImportInput").addEventListener("change", event => {
    importProject(event.target.files[0]);
    event.target.value = "";
});

/* =========================================
   KEYBOARD SHORTCUTS
========================================= */

document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveProject();
    }
});

/* =========================================
   INITIALIZATION
========================================= */

const savedTheme = localStorage.getItem("faiz_code_studio_theme") || "dark";

applyTheme(savedTheme);
loadData();

$("projectImportInput").addEventListener("click", () => {});

if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
        if (localStorage.getItem("faiz_code_studio_theme") === "system") {
            applyTheme("system");
        }
    });
}
