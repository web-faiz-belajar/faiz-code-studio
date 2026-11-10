
/* ==================================
   FAIZ CODE STUDIO 1.0
================================== */

const $ = id => document.getElementById(id);

const STORAGE_KEY = "faiz_code_studio_v1";

/* DEFAULT PROJECT */

const defaultFiles = {
    html: `<!DOCTYPE html>
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

    <script src="script.js"><\/script>
</body>
</html>`,

    css: `body {
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
}`,

    js: `function halo() {
    alert("Halo! JavaScript berhasil berjalan.");
}`
};

/* ELEMENTS */

const workspace = $("workspace");
const codeEditor = $("codeEditor");
const fileDrawer = $("fileDrawer");
const togglePreviewBtn = $("togglePreviewBtn");
const previewFrame = $("previewFrame");

let files = loadProject();
let activeFile = "html";

/* LOAD PROJECT */

function loadProject() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            if (
                parsed &&
                typeof parsed.html === "string" &&
                typeof parsed.css === "string" &&
                typeof parsed.js === "string"
            ) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Gagal membaca project:", error);
    }

    return { ...defaultFiles };
}

/* SAVE PROJECT */

function saveProject() {
    files[activeFile] = codeEditor.value;

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(files)
        );

        $("saveStatus").textContent = "Tersimpan";
    } catch (error) {
        $("saveStatus").textContent = "Gagal simpan";
        console.error(error);
    }
}

/* FILE INFORMATION */

const fileInfo = {
    html: {
        name: "index.html",
        icon: "🌐",
        language: "HTML"
    },

    css: {
        name: "style.css",
        icon: "🎨",
        language: "CSS"
    },

    js: {
        name: "script.js",
        icon: "⚡",
        language: "JAVASCRIPT"
    }
};

/* OPEN FILE */

function openFile(type) {
    if (!fileInfo[type]) return;

    files[activeFile] = codeEditor.value;

    activeFile = type;

    codeEditor.value = files[type];

    $("activeFilePath").textContent =
        fileInfo[type].name;

    $("tabName").textContent =
        fileInfo[type].icon + " " + fileInfo[type].name;

    $("languageLabel").textContent =
        fileInfo[type].language;

    document.querySelectorAll(".file-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.file === type
        );
    });

    $("saveStatus").textContent = "Tersimpan";
}

/* FILE BUTTONS */

document.querySelectorAll(".file-item").forEach(button => {
    button.addEventListener("click", () => {
        openFile(button.dataset.file);
        fileDrawer.classList.remove("open");
    });
});

/* FILE EXPLORER */

$("fileMenuBtn").addEventListener("click", () => {
    fileDrawer.classList.toggle("open");
});

$("closeDrawerBtn").addEventListener("click", () => {
    fileDrawer.classList.remove("open");
});

/* EDITOR */

codeEditor.addEventListener("input", () => {
    files[activeFile] = codeEditor.value;
    $("saveStatus").textContent = "Belum disimpan";
});

/* SAVE BUTTON */

$("saveBtn").addEventListener("click", saveProject);

/* BUILD PREVIEW */

function buildPreview() {
    files[activeFile] = codeEditor.value;

    let html = files.html;
    const css = files.css;
    const js = files.js;

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

    if (/<\/head>/i.test(html)) {
        html = html.replace(
            /<\/head>/i,
            styleTag + "</head>"
        );
    } else {
        html = styleTag + html;
    }

    if (/<\/body>/i.test(html)) {
        html = html.replace(
            /<\/body>/i,
            scriptTag + "</body>"
        );
    } else {
        html += scriptTag;
    }

    return html;
}

/* RUN CODE */

function runCode() {
    saveProject();

    previewFrame.srcdoc = buildPreview();

    $("saveStatus").textContent = "Preview diperbarui";
}

$("runBtn").addEventListener("click", runCode);

$("reloadBtn").addEventListener("click", runCode);

/* SIMULATOR BUTTON */

function openSimulator() {
    workspace.classList.add("preview-open");

    togglePreviewBtn.title = "Tutup Simulator";
    togglePreviewBtn.setAttribute("aria-expanded", "true");

    runCode();
}

function closeSimulator() {
    workspace.classList.remove("preview-open");

    togglePreviewBtn.title = "Buka Simulator";
    togglePreviewBtn.setAttribute("aria-expanded", "false");
}

togglePreviewBtn.addEventListener("click", () => {
    const isOpen = workspace.classList.contains("preview-open");

    if (isOpen) {
        closeSimulator();
    } else {
        openSimulator();
    }
});

$("closePreviewBtn").addEventListener("click", closeSimulator);

/* KEYBOARD TAB SUPPORT */

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

        files[activeFile] = codeEditor.value;
    }
});

/* INITIALIZE */

openFile("html");
runCode();

/* SERVICE WORKER */

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .catch(error => {
                console.error(
                    "Service Worker gagal:",
                    error
                );
            });
    });
}
