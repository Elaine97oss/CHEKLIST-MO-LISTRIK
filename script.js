/* =========================================================
   FILE: script.js (Digunakan untuk semua form inspeksi)
========================================================= */

// 1. FUNGSI MERENDER TABEL
document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.getElementById('checklist-body');
    if (tbody && typeof checklistItems !== 'undefined') {
        let tableContent = '';
        checklistItems.forEach(item => {
            let jawabanInput = '';
            if (item.type === 'radio') {
                jawabanInput = `<select class="save-target"><option value="">- Pilih Status -</option>${item.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}</select>`;
            } else if (item.type === 'textarea') {
                jawabanInput = `<textarea rows="2" placeholder="..." class="save-target"></textarea>`;
            } else {
                jawabanInput = `<input type="text" placeholder="..." class="save-target">`;
            }

            tableContent += `
                <tr>
                    <td style="text-align: center;">${item.id}</td>
                    <td>${item.name}</td>
                    <td>${item.placeholder}</td>
                    <td>${jawabanInput}</td>
                    <td><textarea rows="2" placeholder="..." class="save-target"></textarea></td>
                    <td>
                        <div class="img-container" id="container_foto${item.id}">
                            <input type="file" accept="image/*" id="input_foto${item.id}" class="file-input no-print" onchange="previewAndCompressImage(event, 'foto${item.id}')">
                            <div class="img-wrapper">
                                <img id="foto${item.id}" class="preview-img">
                                <button id="btn_foto${item.id}" class="btn-remove no-print" onclick="removeImage('foto${item.id}')">✖</button>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = tableContent;
    }
    loadSession(); // Muat data dari localStorage
});

// 2. FITUR AUTO-SAVE & AUTO-RESIZE TEXTAREA
const SESSION_KEY = "Checklist_" + document.title.replace(/\s+/g, '_');

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

function saveSession() {
    const data = { inputs: [], images: {} };
    document.querySelectorAll('.save-target, input[type="date"]').forEach(el => {
        data.inputs.push(el.value);
    });
    document.querySelectorAll('.preview-img').forEach(img => {
        if (img.src && img.style.display === 'block') {
            data.images[img.id] = { src: img.src, fileKey: img.getAttribute('data-filekey') };
        }
    });
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function loadSession() {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
        const data = JSON.parse(stored);
        document.querySelectorAll('.save-target, input[type="date"]').forEach((el, index) => {
            if (data.inputs[index] !== undefined) el.value = data.inputs[index];
        });
        for (let id in data.images) {
            let imgInfo = data.images[id];
            let imgElement = document.getElementById(id);
            let btnElement = document.getElementById("btn_" + id);
            let inputElement = document.getElementById("input_" + id);

            if (imgElement && imgInfo.src) {
                imgElement.src = imgInfo.src;
                imgElement.style.display = 'block';
                imgElement.setAttribute("data-filekey", imgInfo.fileKey);
                uploadedFiles.add(imgInfo.fileKey); 
                if (btnElement) btnElement.style.display = 'block';
                if (inputElement) inputElement.style.display = 'none';
            }
        }
    }
    document.querySelectorAll('textarea').forEach(el => autoResizeTextarea(el));
}

document.addEventListener('input', function(event) {
    if (event.target.tagName.toLowerCase() === 'textarea') {
        autoResizeTextarea(event.target);
    }
    saveSession();
});
document.addEventListener('change', saveSession);

// 3. FITUR EXPORT & IMPORT
function exportSession() {
    saveSession(); 
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored || JSON.parse(stored).inputs.every(val => val === "")) {
        return alert("Belum ada data untuk diexport!");
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(stored);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", SESSION_KEY + "_Export.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importSession(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            JSON.parse(e.target.result); 
            localStorage.setItem(SESSION_KEY, e.target.result);
            alert("✅ Sesi berhasil dimuat! Halaman akan dimuat ulang.");
            location.reload(); 
        } catch(err) {
            alert("❌ File sesi tidak valid atau rusak!");
        }
        event.target.value = ""; 
    };
    reader.readAsText(file);
}

// 4. FITUR VALIDASI & CETAK (PRINT)
function validateAndPrint() {
    let isValid = true;

    // Buat div bayangan
    document.querySelectorAll('#checklist-body .save-target').forEach(el => {
        let printDiv = el.nextElementSibling;
        if (!printDiv || !printDiv.classList.contains('print-text')) {
            printDiv = document.createElement('div');
            printDiv.className = 'print-text';
            el.parentNode.insertBefore(printDiv, el.nextSibling);
        }
        let textValue = el.value;
        if (el.tagName.toLowerCase() === 'select' && el.selectedIndex > -1) {
            textValue = el.options[el.selectedIndex].text;
            if (el.value === "") textValue = ""; 
        }
        printDiv.textContent = textValue || "\u00A0"; 
    });

    document.querySelectorAll('textarea').forEach(el => autoResizeTextarea(el));

    document.querySelectorAll('.save-target, input[type="date"]').forEach(el => {
        el.classList.remove('error-field'); 
        if (el.value.trim() === '') {
            el.classList.add('error-field');
            isValid = false;
        }
    });

    if(typeof checklistItems !== 'undefined'){
        checklistItems.forEach(item => {
            let img = document.getElementById('foto' + item.id);
            let container = document.getElementById('container_foto' + item.id);
            if (container) container.classList.remove('error-img');
            if (img && img.style.display !== 'block') {
                if (container) container.classList.add('error-img');
                isValid = false;
            }
        });
    }

    if (isValid) {
        window.print();
    } else {
        alert("⚠️ GAGAL MENCETAK!\n\nHarap isi semua kotak dan unggah semua foto bukti. (Periksa bagian yang ditandai merah).");
    }
}

// 5. FITUR RESET FORM
function resetForm() {
    if (confirm("⚠️ PERINGATAN!\nApakah Anda yakin ingin MENGHAPUS semua isian dan foto untuk memulai inspeksi baru? Data lama tidak bisa dikembalikan kecuali sudah Anda Export.")) {
        localStorage.removeItem(SESSION_KEY);
        location.reload(); 
    }
}

// 6. FUNGSI KOMPRESI & GAMBAR
let uploadedFiles = new Set();
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_WIDTH = 800; const MAX_HEIGHT = 800;
            let width = img.width; let height = img.height;
            if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
            else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
            canvas.width = width; canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', 0.7));
        };
    };
}

function previewAndCompressImage(event, imageId) {
    var input = event.target;
    if (input.files && input.files[0]) {
        var file = input.files[0];
        var fileKey = file.name + "_" + file.size + "_" + file.lastModified;
        if (uploadedFiles.has(fileKey)) {
            alert("⚠️ PERINGATAN: Foto '" + file.name + "' sudah digunakan di item lain!");
            input.value = ""; return;
        }
        compressImage(file, function(compressedData) {
            var imgElement = document.getElementById(imageId);
            var btnElement = document.getElementById("btn_" + imageId);
            var oldKey = imgElement.getAttribute("data-filekey");
            if (oldKey) uploadedFiles.delete(oldKey);
            uploadedFiles.add(fileKey);
            imgElement.setAttribute("data-filekey", fileKey);
            imgElement.src = compressedData;
            imgElement.style.display = 'block';
            btnElement.style.display = 'block'; 
            input.style.display = 'none'; 
            document.getElementById('container_' + imageId).classList.remove('error-img');
            saveSession(); 
        });
    }
}

function removeImage(imageId) {
    var imgElement = document.getElementById(imageId);
    var btnElement = document.getElementById("btn_" + imageId);
    var inputElement = document.getElementById("input_" + imageId);
    var fileKey = imgElement.getAttribute("data-filekey");
    if (fileKey) {
        uploadedFiles.delete(fileKey);
        imgElement.removeAttribute("data-filekey");
    }
    imgElement.src = ""; imgElement.style.display = 'none'; btnElement.style.display = 'none'; 
    inputElement.value = ""; inputElement.style.display = 'block'; 
    saveSession(); 
}