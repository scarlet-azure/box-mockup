import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// =========================================================================
// 1. KONFIGURASI DESKRIPSI MODEL KEMASAN
// =========================================================================
const MODEL_DESCRIPTIONS = {
    tuck: "Kemasan ritel lipat standar dengan tutup atas-bawah berlawanan arah (Reverse Tuck-End).",
    mailer: "Kotak kirim e-commerce kokoh dengan lipatan kuping samping dan penutup depan (FEFCO 0427).",
    sleeve: "Kombinasi wadah laci (tray) dengan selongsong luar geser (sliding sleeve).",
    gable: "Kemasan dengan bagian atas mengerucut membentuk pegangan jinjing (cocok untuk bakery/gift).",
    pillow: "Kemasan melengkung ergonomis tanpa lem samping yang praktis dirakit.",
    display: "Kotak pajangan meja kasir (Point-of-Purchase) dengan bagian depan terbuka miring."
};

// =========================================================================
// 2. INISIALISASI SCENE, CAMERA & RENDERER THREE.JS
// =========================================================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f19);

const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(22, 18, 28);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.4;

// Pencahayaan Studio
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
keyLight.position.set(18, 30, 22);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xc7d2fe, 0.55);
fillLight.position.set(-20, 12, -15);
scene.add(fillLight);

// Grid & Lantai Bayangan
scene.add(new THREE.GridHelper(60, 30, 0x1e293b, 0x111827));

const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.ShadowMaterial({ opacity: 0.35 })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// =========================================================================
// 3. STATE APLIKASI
// =========================================================================
let viewMode = '3d'; // '3d' atau 'dieline'
let currentModelType = 'tuck';
let currentRoughness = 0.45;
let currentMetalness = 0.02;
let uploadedTexture = null;

const boxGroup = new THREE.Group();
scene.add(boxGroup);

function createDefaultSampleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(0, 0, 1024, 230);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, 940, 1024, 84);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SURYA ABADI PACKAGING', 512, 130);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 74px sans-serif';
    ctx.fillText('CUSTOM PRINT', 512, 480);

    ctx.fillStyle = '#64748b';
    ctx.font = '30px monospace';
    ctx.fillText('3D STRUCTURAL MOCKUP', 512, 545);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 6;
    ctx.strokeRect(45, 275, 934, 610);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

uploadedTexture = createDefaultSampleTexture();

function getDimensions() {
    return {
        P: Math.max(3, parseFloat(document.getElementById('input-length').value) || 12),
        L: Math.max(3, parseFloat(document.getElementById('input-width').value) || 8),
        T: Math.max(3, parseFloat(document.getElementById('input-height').value) || 18),
        baseHex: document.getElementById('base-color').value
    };
}

// =========================================================================
// 4. BUILDER GEOMETRI 3D (6 MODEL KONSTRUKSI)
// =========================================================================
function rebuildBox3D() {
    while (boxGroup.children.length > 0) {
        const child = boxGroup.children[0];
        if (child.geometry) child.geometry.dispose();
        boxGroup.remove(child);
    }

    const { P, L, T, baseHex } = getDimensions();
    document.getElementById('dim-summary').innerText = `${P} × ${L} × ${T} cm`;

    const scale = 0.7;
    const w = P * scale;
    const d = L * scale;
    const h = T * scale;

    const plainMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(baseHex),
        roughness: currentRoughness,
        metalness: currentMetalness
    });

    const artMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(baseHex),
        map: uploadedTexture,
        roughness: currentRoughness,
        metalness: currentMetalness
    });

    const creaseMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });

    if (currentModelType === 'tuck') {
        // 1. STANDARD FOLDING BOX (TUCK-END)
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [plainMat, plainMat, plainMat, plainMat, artMat, artMat]);
        mesh.position.y = h / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        boxGroup.add(mesh);

        const topCrease = new THREE.Mesh(new THREE.BoxGeometry(w * 1.005, 0.08, d * 1.005), creaseMat);
        topCrease.position.y = h - 0.14;
        boxGroup.add(topCrease);

    } else if (currentModelType === 'mailer') {
        // 2. E-COMMERCE MAILER BOX
        const mH = Math.min(h, Math.max(w, d) * 0.52);
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, mH, d), [plainMat, plainMat, artMat, plainMat, plainMat, plainMat]);
        mesh.position.y = mH / 2;
        mesh.castShadow = true;
        boxGroup.add(mesh);

        const frontFlap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, mH * 0.88, 0.14), plainMat);
        frontFlap.position.set(0, mH / 2, d / 2 + 0.06);
        boxGroup.add(frontFlap);

        const earGeo = new THREE.BoxGeometry(0.14, mH * 0.72, d * 0.35);
        const leftEar = new THREE.Mesh(earGeo, plainMat);
        leftEar.position.set(-w / 2 - 0.05, mH / 2, d * 0.25);
        const rightEar = new THREE.Mesh(earGeo, plainMat);
        rightEar.position.set(w / 2 + 0.05, mH / 2, d * 0.25);
        boxGroup.add(leftEar, rightEar);

    } else if (currentModelType === 'sleeve') {
        // 3. DRAWER / SLIDER SLEEVE BOX (TRAY + OUTER SLEEVE)
        const sH = Math.min(h, d * 0.65);
        // Inner Tray (sedikit menonjol keluar di sisi kanan untuk efek geser)
        const trayMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
        const tray = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, sH * 0.92, d * 0.94), trayMat);
        tray.position.set(w * 0.18, sH / 2, 0);
        tray.castShadow = true;
        boxGroup.add(tray);

        // Outer Sleeve
        const sleeve = new THREE.Mesh(new THREE.BoxGeometry(w, sH, d), [plainMat, plainMat, artMat, plainMat, artMat, artMat]);
        sleeve.position.set(-w * 0.05, sH / 2, 0);
        sleeve.castShadow = true;
        boxGroup.add(sleeve);

    } else if (currentModelType === 'gable') {
        // 4. GABLE CARRIER BOX (BADAN KOTAK + ATAP SEGITIGA + HANDLE)
        const baseH = h * 0.68;
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, baseH, d), [plainMat, plainMat, plainMat, plainMat, artMat, artMat]);
        body.position.y = baseH / 2;
        body.castShadow = true;
        boxGroup.add(body);

        // Atap Prisma Segitiga
        const roofH = h * 0.22;
        const roofGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.71, roofH, 4);
        roofGeo.rotateY(Math.PI / 4);
        roofGeo.scale(w / Math.max(w, d), 1, d / Math.max(w, d));
        const roof = new THREE.Mesh(roofGeo, plainMat);
        roof.position.y = baseH + roofH / 2;
        roof.castShadow = true;
        boxGroup.add(roof);

        // Handle Pegangan Atas
        const handle = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, h * 0.12, 0.16), plainMat);
        handle.position.y = baseH + roofH + (h * 0.05);
        boxGroup.add(handle);

    } else if (currentModelType === 'pillow') {
        // 5. CURVED PILLOW BOX
        const geo = new THREE.CylinderGeometry(d * 0.55, d * 0.55, h, 36, 1);
        geo.scale(w / (d * 1.1), 1, 0.52);
        const mesh = new THREE.Mesh(geo, artMat);
        mesh.position.y = h / 2;
        mesh.castShadow = true;
        boxGroup.add(mesh);

    } else if (currentModelType === 'display') {
        // 6. COUNTER DISPLAY BOX (POP OPEN FRONT + HEADER BACKBOARD)
        const frontH = h * 0.42;
        const backH = h * 1.15;
        const wall = 0.18;

        // Alas & Dinding Depan Rendah
        const bottom = new THREE.Mesh(new THREE.BoxGeometry(w, wall, d), plainMat);
        bottom.position.y = wall / 2;
        const frontWall = new THREE.Mesh(new THREE.BoxGeometry(w, frontH, wall), artMat);
        frontWall.position.set(0, frontH / 2, d / 2 - wall / 2);

        // Header Belakang Tinggi
        const backHeader = new THREE.Mesh(new THREE.BoxGeometry(w, backH, wall), artMat);
        backHeader.position.set(0, backH / 2, -d / 2 + wall / 2);

        // Sisi Kiri & Kanan
        const sideGeo = new THREE.BoxGeometry(wall, frontH * 1.25, d);
        const leftWall = new THREE.Mesh(sideGeo, plainMat);
        leftWall.position.set(-w / 2 + wall / 2, (frontH * 1.25) / 2, 0);
        const rightWall = new THREE.Mesh(sideGeo, plainMat);
        rightWall.position.set(w / 2 - wall / 2, (frontH * 1.25) / 2, 0);

        [bottom, frontWall, backHeader, leftWall, rightWall].forEach(m => {
            m.castShadow = true;
            boxGroup.add(m);
        });
    }
}

// =========================================================================
// 5. GENERATOR POLA DIELINE 2D INTERAKTIF (LIVE CANVAS)
// =========================================================================
function renderDieline2D() {
    const canvas = document.getElementById('dieline-canvas');
    const ctx = canvas.getContext('2d');
    const { P, L, T, baseHex } = getDimensions();

    const pxPerCm = 26;
    const p = P * pxPerCm;
    const l = L * pxPerCm;
    const t = T * pxPerCm;
    const flap = Math.min(l * 0.65, 55);
    const glueTab = 28;
    const pad = 65;

    const totalW = (p * 2) + (l * 2) + glueTab + (pad * 2);
    const totalH = t + (l * 2) + (flap * 2) + (pad * 2);

    canvas.width = totalW;
    canvas.height = totalH;

    // Background Kertas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalW, totalH);

    // Header Blueprint
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`DIELINE BLUEPRINT | MODEL: ${currentModelType.toUpperCase()} | UKURAN: ${P} × ${L} × ${T} cm`, pad, 34);

    const startX = pad + glueTab;
    const bodyY = pad + flap + l;

    // Helper Gambar Persegi Panjang Cut / Crease
    function drawPanel(x, y, w, h, label, isMainArt = false) {
        if (isMainArt) {
            ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
            ctx.fillRect(x, y, w, h);
        } else if (baseHex.toLowerCase() !== '#ffffff') {
            ctx.fillStyle = baseHex + '33';
            ctx.fillRect(x, y, w, h);
        }

        // Garis Crease (Hijau Putus-Putus)
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 5]);
        ctx.strokeRect(x, y, w, h);

        // Label Ukuran Panel
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + w / 2, y + h / 2 + 4);
    }

    function drawCutBox(x, y, w, h, label = '') {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([]);
        ctx.strokeRect(x, y, w, h);
        if (label) {
            ctx.fillStyle = '#64748b';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + w / 2, y + h / 2 + 4);
        }
    }

    // 4 Panel Utama Melingkar (Samping Kiri - Depan - Samping Kanan - Belakang)
    let curX = startX;
    drawPanel(curX, bodyY, l, t, `Samping (${L}×${T})`);
    curX += l;
    drawPanel(curX, bodyY, p, t, `DEPAN (${P}×${T})`, true);
    const frontX = curX;
    curX += p;
    drawPanel(curX, bodyY, l, t, `Samping (${L}×${T})`);
    curX += l;
    drawPanel(curX, bodyY, p, t, `BELAKANG (${P}×${T})`, true);
    const backX = curX;

    // Glue Tab Kiri (Garis Potong Merah Trapesium)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(startX, bodyY);
    ctx.lineTo(startX - glueTab, bodyY + 14);
    ctx.lineTo(startX - glueTab, bodyY + t - 14);
    ctx.lineTo(startX, bodyY + t);
    ctx.stroke();

    // Tutup Atas & Lid Masuk pada Panel Depan
    drawCutBox(frontX, bodyY - l, p, l, `Tutup Atas (${P}×${L})`);
    drawCutBox(frontX + 6, bodyY - l - flap, p - 12, flap, 'Tuck Flap');

    // Tutup Bawah & Lid Masuk pada Panel Belakang (Reverse Tuck)
    drawCutBox(backX, bodyY + t, p, l, `Tutup Bawah (${P}×${L})`);
    drawCutBox(backX + 6, bodyY + t + l, p - 12, flap, 'Tuck Flap');

    // Dust Flaps (Kuping Penahan Debu Samping Atas & Bawah)
    const dustH = l * 0.55;
    drawCutBox(startX + 4, bodyY - dustH, l - 8, dustH, 'Dust Flap');
    drawCutBox(startX + l + p + 4, bodyY - dustH, l - 8, dustH, 'Dust Flap');
    drawCutBox(startX + 4, bodyY + t, l - 8, dustH, 'Dust Flap');
    drawCutBox(startX + l + p + 4, bodyY + t, l - 8, dustH, 'Dust Flap');
}

function updateAll() {
    rebuildBox3D();
    renderDieline2D();
}

// =========================================================================
// 6. EVENT LISTENERS & SWITCHER MODE
// =========================================================================
function setViewMode(mode) {
    viewMode = mode;
    const btn3D = document.getElementById('mode-btn-3d');
    const btnDieline = document.getElementById('mode-btn-dieline');
    const container3D = document.getElementById('canvas-container');
    const containerDieline = document.getElementById('dieline-container');
    const controls3DBar = document.getElementById('controls-3d-bar');

    if (mode === '3d') {
        btn3D.className = 'px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold cursor-pointer transition-all';
        btnDieline.className = 'px-4 py-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-all';
        container3D.classList.remove('hidden');
        containerDieline.classList.add('hidden');
        containerDieline.classList.remove('flex');
        controls3DBar.classList.remove('hidden');
    } else {
        btnDieline.className = 'px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold cursor-pointer transition-all';
        btn3D.className = 'px-4 py-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-all';
        container3D.classList.add('hidden');
        containerDieline.classList.remove('hidden');
        containerDieline.classList.add('flex');
        controls3DBar.classList.add('hidden');
        renderDieline2D();
    }
}

document.getElementById('mode-btn-3d').addEventListener('click', () => setViewMode('3d'));
document.getElementById('mode-btn-dieline').addEventListener('click', () => setViewMode('dieline'));

// Dropdown Model Box
document.getElementById('select-model').addEventListener('change', (e) => {
    currentModelType = e.target.value;
    document.getElementById('model-desc').innerText = MODEL_DESCRIPTIONS[currentModelType] || '';
    updateAll();
});

// Input Dimensi & Warna
['input-length', 'input-width', 'input-height', 'base-color'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateAll);
});

// Finishing Material
document.querySelectorAll('.finish-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.finish-btn').forEach(b => {
            b.className = 'finish-btn py-2 bg-slate-800 hover:bg-indigo-600 rounded-xl border border-slate-700 cursor-pointer transition-colors';
        });
        btn.className = 'finish-btn active py-2 bg-indigo-600 text-white font-bold rounded-xl border border-indigo-500 cursor-pointer transition-colors';

        const mode = btn.getAttribute('data-finish');
        if (mode === 'glossy') {
            currentRoughness = 0.1;
            currentMetalness = 0.08;
        } else if (mode === 'matte') {
            currentRoughness = 0.45;
            currentMetalness = 0.02;
        } else if (mode === 'kraft') {
            currentRoughness = 0.88;
            currentMetalness = 0.0;
            document.getElementById('base-color').value = '#c29b6e';
        }
        updateAll();
    });
});

// Upload Artwork
document.getElementById('artwork-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('file-label').innerText = `Terpasang: ${file.name}`;
    document.getElementById('file-label').classList.add('text-emerald-400');

    const url = URL.createObjectURL(file);
    new THREE.TextureLoader().load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        uploadedTexture = tex;
        rebuildBox3D();
    });
});

// Kontrol Kamera
document.getElementById('btn-rotate').addEventListener('click', (e) => {
    controls.autoRotate = !controls.autoRotate;
    e.target.innerText = controls.autoRotate ? 'Pause Rotasi' : 'Auto Rotasi';
});

document.getElementById('btn-reset-cam').addEventListener('click', () => {
    camera.position.set(22, 18, 28);
    controls.target.set(0, 5, 0);
    controls.update();
});

// Export PNG
document.getElementById('btn-download-dieline').addEventListener('click', () => {
    renderDieline2D();
    const { P, L, T } = getDimensions();
    const canvas = document.getElementById('dieline-canvas');
    const link = document.createElement('a');
    link.download = `dieline-${currentModelType}-${P}x${L}x${T}cm.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});

document.getElementById('btn-export-render').addEventListener('click', () => {
    if (viewMode !== '3d') setViewMode('3d');
    renderer.render(scene, camera);
    const { P, L, T } = getDimensions();
    const link = document.createElement('a');
    link.download = `3d-mockup-${currentModelType}-${P}x${L}x${T}cm.png`;
    link.href = renderer.domElement.toDataURL('image/png');
    link.click();
});

// Responsive Resize
window.addEventListener('resize', () => {
    if (container.clientWidth > 0 && container.clientHeight > 0) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
});

// Render Awal
updateAll();

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
