
/* =====================================
   FAIZ CODE STUDIO 2.0
   Project & File Explorer System
===================================== */

const STORAGE_KEY = "faizCodeStudio_v2";

let projects = [];
let currentProjectId = null;
let openTabs = [];
let activeFilePath = null;
let selectedFolderPath = "";
let modalAction = null;

/* =====================================
   ELEMENTS
===================================== */

const projectSelect = document.getElementById("projectSelect");
const fileTree = document.getElementById("fileTree");
const codeEditor = document.getElementById("codeEditor");
const editorTabs = document.getElementById("editorTabs");
const activeFilePathElement = document.getElementById("activeFilePath");
const lineNumbers = document.getElementById("lineNumbers");
const saveStatus = document.getElementById("saveStatus");
const previewFrame = document.getElementById("previewFrame");

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalInput = document.getElementById("modalInput");
const confirmModalBtn = document.getElementById("confirmModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");

const toastElement = document.getElementById("toast");

/* =====================================
   DEFAULT PROJECT
===================================== */

function createStarterProject(name = "Project 1") {
    return {
        id: "project-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
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
    <p>Selamat datang di project pertama saya.</p>

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

/* =====================================
   STORAGE
===================================== */

function saveProjects() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        projects,
        currentProjectId
    }));

    saveStatus.textContent = "Tersimpan";
}

function loadProjects() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (saved && Array.isArray(saved.projects) && saved.projects.length) {
            projects = saved.projects;
            currentProjectId = saved.currentProjectId;
        }
    } catch (error) {
        console.warn("Data project tidak bisa dibaca:", error);
    }

    if (!projects.length) {
        const starter = createStarterProject();
        projects = [starter];
        currentProjectId = starter.id;
        saveProjects();
    }

    if (!projects.some(project => project.id === currentProjectId)) {
        currentProjectId = projects[0].id;
    }
}

function getCurrentProject() {
    return projects.find(project => project.id === currentProjectId);
}

/* =====================================
   PATH SYSTEM
===================================== */

function getNode(path) {
    const project = getCurrentProject();

    if (!project) return null;

    if (!path) return project;

    const parts = path.split("/");
    let current = project;

    for (const part of parts) {
        if (!current.children) return null;

        current = current.children.find(item => item.name === part);

        if (!current) return null;
    }

    return current;
}

function getParent(path) {
    const parts = path.split("/");
    const name = parts.pop();

    return {
        parent: parts.join("/"),
        name
    };
}

function getAllFiles(nodes, parent = "") {
    let result = [];

    nodes.forEach(node => {
        const path = parent ? parent + "/" + node.name : node.name;

        if (node.type === "file") {
            result.push({ node, path });
        } else {
            result = result.concat(getAllFiles(node.children, path));
        }
    });

    return result;
}

/* =====================================
   PROJECT SELECTOR
===================================== */

function renderProjectSelect() {
    projectSelect.innerHTML = "";

    projects.forEach(project => {
        const option = document.createElement("option");
        option.value = project.id;
        option.textContent = project.name;

        if (project.id === currentProjectId) {
            option.selected = true;
        }

        projectSelect.appendChild(option);
    });
}

projectSelect.addEventListener("change", () => {
    currentProjectId = projectSelect.value;
    openTabs = [];
    activeFilePath = null;
    selectedFolderPath = "";

    saveProjects();
    renderAll();
    codeEditor.value = "";
    activeFilePathElement.textContent = "Belum ada file";
    lineNumbers.textContent = "1";
});

/* =====================================
   FILE EXPLORER
===================================== */

function renderTree(nodes, parentPath = "", container = fileTree) {
    nodes.forEach(node => {
        const path = parentPath
            ? parentPath + "/" + node.name
            : node.name;

        const item = document.createElement("div");
        item.className = "tree-item";

        const button = document.createElement("button");
        button.className = "tree-entry";
        button.type = "button";

        const icon = node.type === "folder" ? "📁" : getFileIcon(node.name);

        button.textContent = icon + " " + node.name;

        if (node.type === "folder") {
            const childrenBox = document.createElement("div");
            childrenBox.className = "tree-children";

            button.addEventListener("click", () => {
                selectedFolderPath = path;
                childrenBox.classList.toggle("tree-closed");
                button.classList.toggle("selected");
            });

            item.appendChild(button);
            item.appendChild(childrenBox);

            renderTree(node.children || [], path, childrenBox);
        } else {
            button.addEventListener("click", () => {
                openFile(path);
            });

            if (activeFilePath === path) {
                button.classList.add("selected");
            }

            item.appendChild(button);
        }

        container.appendChild(item);
    });
}

function getFileIcon(name) {
    if (name.endsWith(".html")) return "🌐";
    if (name.endsWith(".css")) return "🎨";
    if (name.endsWith(".js")) return "📜";
    return "📄";
}

function renderFileTree() {
    fileTree.innerHTML = "";

    const project = getCurrentProject();

    if (!project) return;

    renderTree(project.children);
}

/* =====================================
   FILE EDITOR
===================================== */

function openFile(path) {
    const node = getNode(path);

    if (!node || node.type !== "file") return;

    if (!openTabs.includes(path)) {
        openTabs.push(path);
    }

    activeFilePath = path;

    codeEditor.value = node.content || "";
    activeFilePathElement.textContent = path;

    renderTabs();
    updateLineNumbers();
    renderFileTree();

    saveStatus.textContent = "File dibuka";
}

function renderTabs() {
    editorTabs.innerHTML = "";

    openTabs.forEach(path => {
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = "editor-tab";

        if (path === activeFilePath) {
            tab.classList.add("active");
        }

        const name = path.split("/").pop();
        tab.textContent = name + " ×";

        tab.addEventListener("click", () => {
            if (activeFilePath === path) {
                closeTab(path);
            } else {
                openFile(path);
            }
        });

        editorTabs.appendChild(tab);
    });
}

function closeTab(path) {
    openTabs = openTabs.filter(tab => tab !== path);

    if (activeFilePath === path) {
        activeFilePath = openTabs[openTabs.length - 1] || null;

        if (activeFilePath) {
            openFile(activeFilePath);
        } else {
            codeEditor.value = "";
            activeFilePathElement.textContent = "Belum ada file";
            renderTabs();
            renderFileTree();
            updateLineNumbers();
        }
    } else {
        renderTabs();
    }
}

codeEditor.addEventListener("input", () => {
    const node = getNode(activeFilePath);

    if (!node || node.type !== "file") return;

    node.content = codeEditor.value;

    saveProjects();
    updateLineNumbers();
    saveStatus.textContent = "Tersimpan otomatis";
});

function updateLineNumbers() {
    const count = codeEditor.value.split("\n").length;

    lineNumbers.textContent = Array.from(
        { length: count },
        (_, index) => index + 1
    ).join("\n");
}

/* =====================================
   CREATE PROJECT / FOLDER / FILE
===================================== */

function showModal(title, placeholder, action) {
    modalTitle.textContent = title;
    modalInput.placeholder = placeholder;
    modalInput.value = "";
    modalAction = action;

    modalOverlay.classList.remove("hidden");
    modalInput.focus();
}

function closeModal() {
    modalOverlay.classList.add("hidden");
    modalAction = null;
}

function showToast(message) {
    toastElement.textContent = message;
    toastElement.style.opacity = "1";

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toastElement.style.opacity = "0";
    }, 1800);
}

document.getElementById("newProjectBtn").addEventListener("click", () => {
    showModal("Project Baru", "Contoh: Project 2", "project");
});

document.getElementById("newFolderBtn").addEventListener("click", () => {
    showModal("Folder Baru", "Contoh: images", "folder");
});

document.getElementById("newFileBtn").addEventListener("click", () => {
    showModal("File Baru", "Contoh: index.html", "file");
});

cancelModalBtn.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", event => {
    if (event.target === modalOverlay) closeModal();
});

confirmModalBtn.addEventListener("click", createItem);

modalInput.addEventListener("keydown", event => {
    if (event.key === "Enter") createItem();
});

function createItem() {
    const name = modalInput.value.trim();

    if (!name) {
        showToast("Nama tidak boleh kosong");
        return;
    }

    if (name.includes("/") || name.includes("\\") || name === "." || name === "..") {
        showToast("Nama tidak valid");
        return;
    }

    if (modalAction === "project") {
        const project = createStarterProject(name);

        projects.push(project);
        currentProjectId = project.id;
        openTabs = [];
        activeFilePath = null;
        selectedFolderPath = "";

        saveProjects();
        renderAll();

        closeModal();
        showToast("Project berhasil dibuat");
        return;
    }

    const parent = getNode(selectedFolderPath);

    if (!parent || !parent.children) {
        showToast("Folder tujuan tidak ditemukan");
        return;
    }

    if (parent.children.some(item => item.name === name)) {
        showToast("Nama sudah digunakan");
        return;
    }

    if (modalAction === "folder") {
        parent.children.push({
            type: "folder",
            name,
            children: []
        });

        showToast("Folder berhasil dibuat");
    }

    if (modalAction === "file") {
        if (!/\.[a-zA-Z0-9]+$/.test(name)) {
            showToast("Tambahkan ekstensi file, misalnya .html");
            return;
        }

        parent.children.push({
            type: "file",
            name,
            content: getStarterContent(name)
        });

        showToast("File berhasil dibuat");
    }

    saveProjects();
    renderAll();
    closeModal();
}

function getStarterContent(name) {
    if (name.endsWith(".html")) {
        return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Halaman Baru</title>
</head>
<body>

    <h1>Halo Dunia!</h1>

</body>
</html>`;
    }

    if (name.endsWith(".css")) {
        return `body {
    font-family: Arial, sans-serif;
}`;
    }

    if (name.endsWith(".js")) {
        return `console.log("Halo Dunia!");`;
    }

    return "";
}

/* =====================================
   RUN CODE IN PHONE SIMULATOR
===================================== */

function runCode() {
    const project = getCurrentProject();

    if (!project) return;

    const files = getAllFiles(project.children);

    const htmlFile = files.find(file =>
        file.path.toLowerCase().endsWith(".html")
    );

    if (!htmlFile) {
        showToast("Project belum memiliki file HTML");
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

    html = html.replace(
        /<link\b[^>]*href=["'][^"']+\.css(?:\?[^"']*)?["'][^>]*>/gi,
        ""
    );

    html = html.replace(
        /<script\b[^>]*src=["'][^"']+\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi,
        ""
    );

    const styleTag = `<style>${css}</style>`;
    const scriptTag = `<script>${js}<\/script>`;

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

    previewFrame.srcdoc = html;
    showToast("Project berhasil dijalankan!");
}

document.getElementById("runBtn").addEventListener("click", runCode);
document.getElementById("reloadBtn").addEventListener("click", runCode);

/* =====================================
   MENU
===================================== */

document.getElementById("menuBtn").addEventListener("click", () => {
    const layout = document.querySelector(".app-layout");
    const sidebar = document.getElementById("sidebar");

    sidebar.style.display = "";

    layout.classList.toggle("sidebar-closed");
});

/* =====================================
   KEYBOARD SHORTCUT
===================================== */

codeEditor.addEventListener("keydown", event => {
    if (event.key === "Tab") {
        event.preventDefault();

        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;

        codeEditor.setRangeText("    ", start, end, "end");

        codeEditor.dispatchEvent(new Event("input"));
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveProjects();
        showToast("Project tersimpan");
    }
});

/* =====================================
   INITIALIZATION
===================================== */

function renderAll() {
    renderProjectSelect();
    renderFileTree();
    renderTabs();
}

loadProjects();
renderAll();

if (getCurrentProject()) {
    const firstHtml = getAllFiles(getCurrentProject().children)
        .find(file => file.path.endsWith(".html"));

    if (firstHtml) {
        openFile(firstHtml.path);
    }
}
