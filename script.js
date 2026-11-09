
// ===============================
// FAIZ CODE STUDIO
// ===============================

// PINDAH TAB EDITOR
function openTab(type) {
    const editors = {
        html: document.getElementById("htmlCode"),
        css: document.getElementById("cssCode"),
        js: document.getElementById("jsCode")
    };

    Object.keys(editors).forEach(key => {
        editors[key].hidden = key !== type;
    });

    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.toggle(
            "active",
            tab.textContent.trim().toLowerCase() === type
        );
    });
}

// MENJALANKAN KODE
function runCode() {
    const html = document.getElementById("htmlCode").value;
    const css = document.getElementById("cssCode").value;
    const js = document.getElementById("jsCode").value;

    const preview = document.getElementById("previewFrame");

    preview.srcdoc = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${css}</style>
        </head>
        <body>
            ${html}

            <script>
                try {
                    ${js.replace(/<\/script/gi, "<\\/script")}
                } catch (error) {
                    console.error(error);
                }
            <\/script>
        </body>
        </html>
    `;
}

// MENAMBAHKAN INDENTASI DENGAN TOMBOL TAB
document.querySelectorAll(".editor textarea").forEach(editor => {

    editor.addEventListener("keydown", function(event) {

        if (event.key === "Tab") {
            event.preventDefault();

            const start = this.selectionStart;
            const end = this.selectionEnd;

            this.value =
                this.value.substring(0, start) +
                "    " +
                this.value.substring(end);

            this.selectionStart = this.selectionEnd = start + 4;
        }

    });

});

// MENJALANKAN KODE PERTAMA KALI
runCode();
