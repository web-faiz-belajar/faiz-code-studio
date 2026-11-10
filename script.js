
/* =========================================
   FAIZ CODE STUDIO 3.0
   Project, Explorer, Editor, Simulator
========================================= */

const STORAGE_KEY = "faiz_code_studio_v3";

/* ELEMENTS */

const $ = id => document.getElementById(id);

const projectSelect = $("projectSelect");
const fileDrawer = $("fileDrawer");
const fileTree = $("fileTree");
const editorTabs = $("editorTabs");
const codeEditor = $("codeEditor");
const lineNumbers = $("lineNumbers");
const activeFilePath = $("activeFilePath");
const saveStatus = $("saveStatus");
const languageStatus = $("languageStatus");
const previewFrame = $("previewFrame");
const previewStatus = $("previewStatus");

const modalOverlay = $("modalOverlay");
const modalTitle = $("modalTitle");
const modalInput = $("modalInput");
const modalHint = $("modalHint");

let projects = [];
let currentProjectId = null;
let activeFile = null;
let openTabs = [];
let selectedFolder = "";
let modalMode = "";
let toastTimer = null;


/* =========================================
   STARTER PROJECT
========================================= */

function makeStarterProject(name) {
    return {
        id: createId(),
        name,
        children: [
            {
                type: "file",
                name: "index.html",
                content: `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Saya</title>
</head>
<body>

    <h1>Halo Dunia!</h1>
    <p>Saya sedang belajar coding.</p>

</body>
</html>`
            },
            {
                type: "folder",
                name: "CSS",
                children: [
                    {
                        type: "file",
                        name: "style.css",
                        content: `body {
    font-family: Arial, sans-serif;
    background: #f1f5f9;
    color: #1e293b;
    text-align: center;
    padding: 30px;
}

h1 {
    color: #5267e8;
}`
                    }
                ]
            },
            {
                type: "folder",
                name: "JS",
                children: [
                    {
                        type: "file",
                        name: "script.js",
                        content: `console.log("Project berhasil dijalankan!");`
                    }
                ]
            }
        ]
    };
}

function createId() {
    return "id-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 8);
}


/* =========================================
   PROJECT STORAGE
========================================= */

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            projects,
            currentProjectId
        }));

        saveStatus.textContent = "● Saved";
    } catch (error) {
        saveStatus.textContent = "Gagal menyimpan";
        showToast("Penyimpanan browser penuh");
        console.error("Gagal menyimpan project:", error);
    }
}

function loadData() {
    try {
        const data = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        if (data && Array.isArray(data.projects)) {
            projects = data.projects;
            currentProjectId = data.currentProjectId;
        }
    } catch (error) {
        console.warn("Data project tidak terbaca", error);
    }

    if (!projects.length) {
        const project = makeStarterProject("Project 1");

        projects = [project];
        currentProjectId = project.id;

        saveData();
    }

    if (!projects.some(p => p.id === currentProjectId)) {
        currentProjectId = projects[0].id;
    }
}

function getProject() {
    return projects.find(p => p.id === currentProjectId);
}


/* =========================================
   PROJECT SELECTOR
========================================= */

function renderProjects() {
    projectSelect.innerHTML = "";

    projects.forEach(project => {
        const option = document.createElement("option");

        option.value = project.id;
        option.textContent = project.name;
        option.selected = project.id === currentProjectId;

        projectSelect.appendChild(option);
    });

    $("drawerProjectName").textContent =
        getProject()?.name || "Project Files";
}

projectSelect.addEventListener("change", () => {
    currentProjectId = projectSelect.value;

    activeFile = null;
    openTabs = [];
    selectedFolder = "";

    codeEditor.value = "";
    codeEditor.disabled = true;

    activeFilePath.textContent = "Belum ada file";
    languageStatus.textContent = "No file";

    saveData();
    renderAll();
    openFirstHtml();
});


/* =========================================
   FILE PATH SYSTEM
========================================= */

function getNode(path) {
    const project = getProject();

    if (!project) return null;
    if (!path) return project;

    let current = project;

    for (const part of path.split("/")) {
        if (!current.children) return null;

        current = current.children.find(
            item => item.name === part
        );

        if (!current) return null;
    }

    return current;
}

function getAllFiles(nodes, parent = "") {
    let files = [];

    for (const node of nodes || []) {
        const path = parent
            ? parent + "/" + node.name
            : node.name;

        if (node.type === "file") {
            files.push({
                path,
                node
            });
        } else {
            files.push(
                ...getAllFiles(node.children, path)
            );
        }
    }

    return files;
}

function getParent(path) {
    const parts = path.split("/");
    const name = parts.pop();

    return {
        parentPath: parts.join("/"),
        name
    };
}


/* =========================================
   FILE EXPLORER
========================================= */

function getIcon(name, type) {
    if (type === "folder") return "📁";
    if (name.endsWith(".html")) return "🌐";
    if (name.endsWith(".css")) return "🎨";
    if (name.endsWith(".js")) return "📜";
    if (name.endsWith(".json")) return "⚙️";

    if (
        name.endsWith(".png") ||
        name.endsWith(".jpg")
    ) {
        return "🖼️";
    }

    return "📄";
}

function renderTree(nodes, parentPath = "", container = fileTree) {
    (nodes || []).forEach(node => {
        const path = parentPath
            ? parentPath + "/" + node.name
            : node.name;

        const row = document.createElement("div");
        row.className = "tree-row";

        const button = document.createElement("button");

        button.type = "button";
        button.className = "tree-entry";

        button.textContent =
            getIcon(node.name, node.type) + " " + node.name;

        if (node.type === "file") {
            if (path === activeFile) {
                button.classList.add("selected");
            }

            button.addEventListener("click", () => {
                openFile(path);
            });

            row.appendChild(button);
            container.appendChild(row);

            return;
        }

        button.addEventListener("click", () => {
            selectedFolder = path;

            const children = row.nextElementSibling;

            if (children) {
                children.classList.toggle("collapsed");
            }
        });

        const addButton = document.createElement("button");

        addButton.type = "button";
        addButton.className = "tree-action";
        addButton.textContent = "+";
        addButton.title = "Tambah di folder ini";

        addButton.addEventListener("click", () => {
            selectedFolder = path;
            showCreateModal("file");
        });

        row.append(button, addButton);
        container.appendChild(row);

        const childrenBox = document.createElement("div");

        childrenBox.className = "tree-children";

        container.appendChild(childrenBox);

        renderTree(node.children, path, childrenBox);
    });
}

function renderFileTree() {
    fileTree.innerHTML = "";

    const project = getProject();

    if (!project) return;

    if (!project.children.length) {
        const empty = document.createElement("div");

        empty.className = "empty-tree";
        empty.textContent =
            "Belum ada file. Tekan + File untuk mulai.";

        fileTree.appendChild(empty);

        return;
    }

    renderTree(project.children);
}


/* =========================================
   FILE EDITOR
========================================= */

function openFile(path) {
    const node = getNode(path);

    if (!node || node.type !== "file") return;

    activeFile = path;

    if (!openTabs.includes(path)) {
        openTabs.push(path);
    }

    codeEditor.disabled = false;
    codeEditor.value = node.content || "";

    activeFilePath.textContent = path;
    languageStatus.textContent = getLanguage(path);

    renderTabs();
    renderFileTree();
    updateLineNumbers();

    fileDrawer.classList.remove("open");
}

function getLanguage(path) {
    if (path.endsWith(".html")) return "HTML";
    if (path.endsWith(".css")) return "CSS";
    if (path.endsWith(".js")) return "JavaScript";
    if (path.endsWith(".json")) return "JSON";

    return "TEXT";
}

function renderTabs() {
    editorTabs.innerHTML = "";

    openTabs.forEach(path => {
        const tab = document.createElement("button");

        tab.type = "button";
        tab.className = "editor-tab";

        if (path === activeFile) {
            tab.classList.add("active");
        }

        const name = path.split("/").pop();

        const label = document.createElement("span");

        label.textContent =
            getIcon(name, "file") + " " + name;

        const close = document.createElement("span");

        close.className = "tab-close";
        close.textContent = "×";

        close.addEventListener("click", event => {
            event.stopPropagation();
            closeTab(path);
        });

        tab.append(label, close);

        tab.addEventListener("click", () => {
            openFile(path);
        });

        editorTabs.appendChild(tab);
    });
}

function closeTab(path) {
    openTabs = openTabs.filter(item => item !== path);

    if (activeFile === path) {
        activeFile = openTabs[openTabs.length - 1] || null;

        if (activeFile) {
            openFile(activeFile);
        } else {
            codeEditor.value = "";
            codeEditor.disabled = true;

            activeFilePath.textContent = "Belum ada file";
            languageStatus.textContent = "No file";

            renderTabs();
            updateLineNumbers();
        }
    } else {
        renderTabs();
    }
}

function updateLineNumbers() {
    const total = Math.max(
        1,
        codeEditor.value.split("\n").length
    );

    lineNumbers.textContent = Array.from(
        { length: total },
        (_, i) => i + 1
    ).join("\n");
}

codeEditor.addEventListener("input", () => {
    const node = getNode(activeFile);

    if (!node || node.type !== "file") return;

    node.content = codeEditor.value;

    updateLineNumbers();
    saveData();
});

codeEditor.addEventListener("scroll", () => {
    lineNumbers.scrollTop = codeEditor.scrollTop;
});

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

        codeEditor.dispatchEvent(
            new Event("input")
        );
    }

    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "s"
    ) {
        event.preventDefault();

        saveData();
        showToast("Project tersimpan");
    }
});


/* =========================================
   CREATE PROJECT / FILE / FOLDER
========================================= */

function showCreateModal(mode) {
    modalMode = mode;

    modalOverlay.classList.remove("hidden");

    if (mode === "project") {
        modalTitle.textContent = "Project Baru";
        modalInput.placeholder = "Contoh: Project 2";
        modalHint.textContent =
            "Buat ruang kerja project baru.";
    }

    if (mode === "file") {
        modalTitle.textContent = "File Baru";
        modalInput.placeholder = "Contoh: index.html";
        modalHint.textContent =
            "Contoh ekstensi: .html, .css, .js";
    }

    if (mode === "folder") {
        modalTitle.textContent = "Folder Baru";
        modalInput.placeholder = "Contoh: images";
        modalHint.textContent =
            "Folder dibuat di lokasi yang dipilih.";
    }

    modalInput.value = "";

    $("modalConfirmBtn").textContent = "Buat";

    modalInput.focus();
}

function closeModal() {
    modalOverlay.classList.add("hidden");
    modalMode = "";
}

function createItem() {
    const name = modalInput.value.trim();

    if (!name) {
        showToast("Nama tidak boleh kosong");
        return;
    }

    if (
        name.includes("/") ||
        name.includes("\\") ||
        name === "." ||
        name === ".."
    ) {
        showToast("Nama tidak valid");
        return;
    }

    if (modalMode === "project") {
        if (
            projects.some(
                p => p.name.toLowerCase() === name.toLowerCase()
            )
        ) {
            showToast("Nama project sudah digunakan");
            return;
        }

        const project = makeStarterProject(name);

        projects.push(project);
        currentProjectId = project.id;

        activeFile = null;
        openTabs = [];
        selectedFolder = "";

        saveData();
        renderAll();
        renderWelcomeProjects();

        welcomeScreen.style.display = "none";

        openFirstHtml();
        closeModal();

        showToast("Project berhasil dibuat");

        return;
    }

    const parent = getNode(selectedFolder);

    if (!parent || !parent.children) {
        showToast("Lokasi folder tidak ditemukan");
        return;
    }

    if (
        parent.children.some(
            item => item.name.toLowerCase() === name.toLowerCase()
        )
    ) {
        showToast("Nama sudah digunakan");
        return;
    }

    if (modalMode === "folder") {
        parent.children.push({
            type: "folder",
            name,
            children: []
        });

        showToast("Folder berhasil dibuat");
    }

    if (modalMode === "file") {
        if (!/\.[a-zA-Z0-9]+$/.test(name)) {
            showToast(
                "Gunakan ekstensi seperti .html atau .css"
            );

            return;
        }

        const node = {
            type: "file",
            name,
            content: starterContent(name)
        };

        parent.children.push(node);

        const newPath = selectedFolder
            ? selectedFolder + "/" + name
            : name;

        saveData();
        renderAll();
        closeModal();

        openFile(newPath);

        showToast("File berhasil dibuat");

        return;
    }

    saveData();
    renderAll();

    closeModal();
}

function starterContent(name) {
    if (name.endsWith(".html")) {
        return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Halaman Baru</title>
</head>
<body>

    <h1>Halaman Baru</h1>

</body>
</html>`;
    }

    if (name.endsWith(".css")) {
        return `body {
    font-family: Arial, sans-serif;
}`;
    }

    if (name.endsWith(".js")) {
        return `console.log("Halo dari JavaScript!");`;
    }

    if (name.endsWith(".json")) {
        return `{
    "name": "Project Saya"
}`;
    }

    return "";
}


/* =========================================
   MODAL EVENTS
========================================= */

$("newProjectBtn").addEventListener("click", () => {
    showCreateModal("project");
});

$("addFileBtn").addEventListener("click", () => {
    showCreateModal("file");
});

$("addFolderBtn").addEventListener("click", () => {
    showCreateModal("folder");
});

$("modalConfirmBtn").addEventListener("click", createItem);
$("modalCancelBtn").addEventListener("click", closeModal);
$("modalCloseBtn").addEventListener("click", closeModal);

modalOverlay.addEventListener("click", event => {
    if (event.target === modalOverlay) {
        closeModal();
    }
});

modalInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        createItem();
    }

    if (event.key === "Escape") {
        closeModal();
    }
});


/* =========================================
   FILE DRAWER
========================================= */

$("fileMenuBtn").addEventListener("click", () => {
    fileDrawer.classList.toggle("open");
});

$("closeDrawerBtn").addEventListener("click", () => {
    fileDrawer.classList.remove("open");
});


/* =========================================
   RUN CODE IN PHONE
========================================= */

function escapeStyle(text) {
    return text.replace(/<\/style/gi, "<\\/style");
}

function escapeScript(text) {
    return text.replace(/<\/script/gi, "<\\/script");
}

function runCode() {
    const project = getProject();

    if (!project) return;

    const files = getAllFiles(project.children);

    const htmlFile = files.find(file =>
        file.path.split("/").pop().toLowerCase() === "index.html"
    ) || files.find(file =>
        file.path.toLowerCase().endsWith(".html")
    );

    if (!htmlFile) {
        showToast("Buat file HTML terlebih dahulu");
        return;
    }

    let html = htmlFile.node.content || "";

    const css = files
        .filter(file => file.path.toLowerCase().endsWith(".css"))
        .map(file => file.node.content || "")
        .join("\n");

    const js = files
        .filter(file => file.path.toLowerCase().endsWith(".js"))
        .map(file => file.node.content || "")
        .join("\n");

    // Hapus link CSS lokal
    html = html.replace(
        /<link\b[^>]*href=["'][^"']+\.css(?:\?[^"']*)?["'][^>]*>/gi,
        ""
    );

    // Hapus script JS lokal
    html = html.replace(
        /<script\b[^>]*src=["'][^"']+\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi,
        ""
    );

    // Gabungkan CSS
    const styleTag =
        "<style>" +
        escapeStyle(css) +
        "</style>";

    // Diagnostik error JavaScript
    const diagnosticScript = `
window.addEventListener("error", function(event) {
    const box = document.createElement("pre");

    box.style.cssText = "position:fixed;z-index:999999;bottom:10px;left:10px;right:10px;padding:12px;background:#8b1e2d;color:white;font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;";

    box.textContent =
        "ERROR: " + event.message +
        "\\nFile: " + event.filename +
        "\\nBaris: " + event.lineno +
        "\\nKolom: " + event.colno;

    document.body.appendChild(box);
});

window.addEventListener("unhandledrejection", function(event) {
    alert("Promise Error: " + String(event.reason));
});
`;

    // Gabungkan JavaScript
    const scriptTag =
        "<script>" +
        diagnosticScript +
        "\n" +
        escapeScript(js) +
        "<\\/script>";

    // Masukkan CSS ke HEAD
    if (/<\/head>/i.test(html)) {
        html = html.replace(
            /<\/head>/i,
            styleTag + "</head>"
        );
    } else {
        html = styleTag + html;
    }

    // Masukkan JavaScript sebelum BODY ditutup
    if (/<\/body>/i.test(html)) {
        html = html.replace(
            /<\/body>/i,
            scriptTag + "</body>"
        );
    } else {
        html += scriptTag;
    }

    // Jalankan di simulator HP
    previewFrame.srcdoc = html;

    previewStatus.textContent = "Preview running";

    showToast("Project berhasil dijalankan");
}

$("runBtn").addEventListener("click", runCode);
$("reloadBtn").addEventListener("click", runCode);

$("saveBtn").addEventListener("click", () => {
    saveData();
    showToast("Project tersimpan");
});


/* =========================================
   FULLSCREEN SIMULATOR
========================================= */

const previewPanel = document.querySelector(".preview-panel");

$("fullscreenBtn").addEventListener("click", () => {
    previewPanel.classList.toggle("fullscreen");
});


/* =========================================
   TOAST
========================================= */

function showToast(message) {
    const toast = $("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}


/* =========================================
   INITIALIZATION
========================================= */

function renderAll() {
    renderProjects();
    renderFileTree();
    renderTabs();
}

function openFirstHtml() {
    const project = getProject();

    if (!project) return;

    const firstHtml = getAllFiles(project.children).find(file =>
        file.path.split("/").pop().toLowerCase() === "index.html"
    );

    if (firstHtml) {
        openFile(firstHtml.path);
    }
}

loadData();
renderAll();
openFirstHtml();


/* =====================================
   WELCOME SCREEN - PROJECT SYSTEM
===================================== */

const welcomeScreen = $("welcomeScreen");
const welcomeProjectList = $("welcomeProjectList");

/* TAMPILKAN DAFTAR PROJECT */

function renderWelcomeProjects() {
    welcomeProjectList.innerHTML = "";

    projects.forEach(project => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "welcome-project-item";
        button.textContent = project.name;

        button.addEventListener("click", () => {
            enterWelcomeProject(project.id);
        });

        welcomeProjectList.appendChild(button);
    });
}

/* MASUK KE PROJECT */

function enterWelcomeProject(projectId) {
    currentProjectId = projectId;

    activeFile = null;
    openTabs = [];
    selectedFolder = "";

    codeEditor.value = "";
    codeEditor.disabled = true;

    activeFilePath.textContent = "Belum ada file";
    languageStatus.textContent = "No file";

    saveData();
    renderAll();
    openFirstHtml();

    welcomeScreen.style.display = "none";
}

/* TOMBOL PROJECT BARU */

$("welcomeNewProject").addEventListener("click", () => {
    showCreateModal("project");
});

/* TAMPILKAN PROJECT SAAT APLIKASI DIBUKA */

renderWelcomeProjects();

welcomeScreen.style.display = "flex";


/* =========================================
   SERVICE WORKER REGISTRATION
========================================= */

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then(() => {
                console.log(
                    "Faiz Code Studio siap digunakan."
                );
            })
            .catch(error => {
                console.error(
                    "Service Worker gagal:",
                    error
                );
            });
    });
}
