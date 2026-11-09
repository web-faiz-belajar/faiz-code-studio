
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
            tab.textContent.toLowerCase() === type
        );
    });
}

function runCode() {
    const html = document.getElementById("htmlCode").value;
    const css = document.getElementById("cssCode").value;
    const js = document.getElementById("jsCode").value;

    const preview = document.getElementById("previewFrame");

    preview.srcdoc = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>${css}</style>
        </head>
        <body>
            ${html}
            <script>
                ${js.replace(/<\/script/gi, "<\\/script")}
            <\/script>
        </body>
        </html>
    `;
}

runCode();
