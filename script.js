
function runCode() {

    // Mengambil kode HTML dari editor
    const html = document.getElementById("htmlCode").value;

    // Mengambil layar simulator
    const preview = document.getElementById("previewFrame");

    // Menampilkan hasil kode ke simulator
    preview.srcdoc = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 15px;
                    color: #222;
                }
            </style>
        </head>
        <body>
            ${html}
        </body>
        </html>
    `;
}

// Menjalankan kode pertama kali
runCode();
