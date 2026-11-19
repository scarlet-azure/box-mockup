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

const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(26, 20, 32);

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
controls.target.set(0, 3.5, 0);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35; // Rotasi lambat dan halus
controls.update();

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
let viewMode = '3d';
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

    // Skala diperhalus (0.42) agar ukuran awal pas dan proporsional di viewport
    const scale = 0.42;
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
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [plainMat, plainMat, plainMat, plainMat, artMat, artMat]);
        mesh.position.y = h / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        boxGroup.add(mesh);

        const topCrease = new THREE.Mesh(new THREE.BoxGeometry(w * 1.005, 0.05, d * 1.005), creaseMat);
        topCrease.position.y = h - 0.1;
        boxGroup.add(topCrease);

    } else if (currentModelType === 'mailer') {
        const mH = Math.min(h, Math.max(w, d) * 0.52);
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, mH, d), [plainMat, plainMat, artMat, plainMat, plainMat, plainMat]);
        mesh.position.y = mH / 2;
        mesh.castShadow = true;
        boxGroup.add(mesh);

        const frontFlap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, mH * 0.88, 0.1), plainMat);
        frontFlap.position.set(0, mH / 2, d / 2 + 0.04);
        boxGroup.add(frontFlap);

        const earGeo = new THREE.BoxGeometry(0.1, mH * 0.72, d * 0.35);
        const leftEar = new THREE.Mesh(earGeo, plainMat);
        leftEar.position.set(-w / 2 - 0.03, mH / 2, d * 0.25);
        const rightEar = new THREE.Mesh(earGeo, plainMat);
        rightEar.position.set(w / 2 + 0.03, mH / 2, d * 0.25);
        boxGroup.add(leftEar, rightEar);

    } else if (currentModelType === 'sleeve') {
        const sH = Math.min(h, d * 0.65);
        const trayMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
        const tray = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, sH * 0.92, d * 0.94), trayMat);
        tray.position.set(w * 0.18, sH / 2, 0);
        tray.castShadow = true;
        boxGroup.add(tray);

        const sleeve = new THREE.Mesh(new THREE.BoxGeometry(w, sH, d), [plainMat, plainMat, artMat, plainMat, artMat, artMat]);
        sleeve.position.set(-w * 0.05, sH / 2, 0);
        sleeve.castShadow = true;
        boxGroup.add(sleeve);

    } else if (currentModelType === 'gable') {
        const baseH = h * 0.68;
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, baseH, d), [plainMat, plainMat, plainMat, plainMat, artMat, artMat]);
        body.position.y = baseH / 2;
        body.castShadow = true;
        boxGroup.add(body);

        const roofH = h * 0.22;
        const roofGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.71, roofH, 4);
        roofGeo.rotateY(Math.PI / 4);
        roofGeo.scale(w / Math.max(w, d), 1, d / Math.max(w, d));
        const roof = new THREE.Mesh(roofGeo, plainMat);
        roof.position.y = baseH + roofH / 2;
        roof.castShadow = true;
        boxGroup.add(roof);

        const handle = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, h * 0.12, 0.12), plainMat);
        handle.position.y = baseH + roofH + (h * 0.05);
        boxGroup.add(handle);

    } else if (currentModelType === 'pillow') {
        const geo = new THREE.CylinderGeometry(d * 0.55, d * 0.55, h, 36, 1);
        geo.scale(w / (d * 1.1), 1, 0.52);
        const mesh = new THREE.Mesh(geo, artMat);
        mesh.position.y = h / 2;
        mesh.castShadow = true;
        boxGroup.add(mesh);

    } else if (currentModelType === 'display') {
        const frontH = h * 0.42;
        const backH = h * 1.12;
        const wall = 0.14;

        const bottom = new THREE.Mesh(new THREE.BoxGeometry(w, wall, d), plainMat);
        bottom.position.y = wall / 2;
        const frontWall = new THREE.Mesh(new THREE.BoxGeometry(w, frontH, wall), artMat);
        frontWall.position.set(0, frontH / 2, d / 2 - wall / 2);

        const backHeader = new THREE.Mesh(new THREE.BoxGeometry(w, backH, wall), artMat);
        backHeader.position.set(0, backH / 2, -d / 2 + wall / 2);

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
// 5. GENERATOR POLA DIELINE 2D SPESIFIK UNTUK TIAP MODEL
// =========================================================================
function renderDieline2D() {
    const canvas = document.getElementById('dieline-canvas');
    const ctx = canvas.getContext('2d');
    const { P, L, T, baseHex } = getDimensions();

    const px = 22; // Skala piksel per cm agar pas di layar
    const p = P * px;
    const l = L * px;
    const t = T * px;
    const pad = 55;

    // Helper menggambar garis crease (lipatan - hijau putus-putus)
    function drawCreaseRect(x, y, w, h, label = '', highlight = false) {
        if (highlight) {
            ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
            ctx.fillRect(x, y, w, h);
        } else if (baseHex.toLowerCase() !== '#ffffff') {
            ctx.fillStyle = baseHex + '28';
            ctx.fillRect(x, y, w, h);
        }
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 5]);
        ctx.strokeRect(x, y, w, h);

        if (label) {
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + w / 2, y + h / 2 + 4);
        }
    }

    // Helper menggambar garis potong (cut - merah solid)
    function drawCutRect(x, y, w, h, label = '') {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([]);
        ctx.strokeRect(x, y, w, h);

        if (label) {
            ctx.fillStyle = '#64748b';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + w / 2, y + h / 2 + 4);
        }
    }

    function drawHeader(title) {
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(title, pad, 32);
    }

    // ---------------------------------------------------------------------
    // A. MODEL 1: REVERSE TUCK-END (FOLDING BOX)
    // ---------------------------------------------------------------------
    if (currentModelType === 'tuck') {
        const flap = Math.min(l * 0.6, 48);
        const glue = 26;
        canvas.width = (p * 2) + (l * 2) + glue + pad * 2;
        canvas.height = t + (l * 2) + (flap * 2) + pad * 2;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawHeader(`DIELINE: REVERSE TUCK-END | ${P} × ${L} × ${T} cm`);

        const startX = pad + glue;
        const bodyY = pad + flap + l;

        drawCreaseRect(startX, bodyY, l, t, `Samping (${L}×${T})`);
        drawCreaseRect(startX + l, bodyY, p, t, `DEPAN (${P}×${T})`, true);
        drawCreaseRect(startX + l + p, bodyY, l, t, `Samping (${L}×${T})`);
        drawCreaseRect(startX + l * 2 + p, bodyY, p, t, `BELAKANG (${P}×${T})`, true);

        // Glue Tab Kiri
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(startX, bodyY);
        ctx.lineTo(startX - glue, bodyY + 12);
        ctx.lineTo(startX - glue, bodyY + t - 12);
        ctx.lineTo(startX, bodyY + t);
        ctx.stroke();

        // Tutup Atas (Panel Depan) & Tutup Bawah (Panel Belakang)
        const frontX = startX + l;
        const backX = startX + l * 2 + p;
        drawCutRect(frontX, bodyY - l, p, l, `Tutup Atas`);
        drawCutRect(frontX + 5, bodyY - l - flap, p - 10, flap, 'Tuck Flap');
        drawCutRect(backX, bodyY + t, p, l, `Tutup Bawah`);
        drawCutRect(backX + 5, bodyY + t + l, p - 10, flap, 'Tuck Flap');

        // Dust Flaps
        const dust = l * 0.52;
        drawCutRect(startX + 4, bodyY - dust, l - 8, dust, 'Dust');
        drawCutRect(startX + l + p + 4, bodyY - dust, l - 8, dust, 'Dust');
        drawCutRect(startX + 4, bodyY + t, l - 8, dust, 'Dust');
        drawCutRect(startX + l + p + 4, bodyY + t, l - 8, dust, 'Dust');

    // ---------------------------------------------------------------------
    // B. MODEL 2: E-COMMERCE MAILER BOX (FEFCO 0427)
    // ---------------------------------------------------------------------
    } else if (currentModelType === 'mailer') {
        const mT = Math.min(t, Math.max(p, l) * 0.52);
        const ear = mT * 0.7;
        const lockTab = 28;
        canvas.width = p + (mT * 4) + (ear * 2) + pad * 2;
        canvas.height = (l * 2) + (mT * 3) + lockTab + pad * 2;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawHeader(`DIELINE: MAILER BOX (FEFCO 0427) | ${P} × ${L} × ${Math.round(mT / px * 10) / 10} cm`);

        const centerX = canvas.width / 2 - p / 2;
        const baseY = pad + lockTab + mT + l;

        // Alas Bawah (Base)
        drawCreaseRect(centerX, baseY, p, l, `ALAS (${P}×${L})`);
        // Dinding Belakang & Tutup Atas (Top Lid)
        drawCreaseRect(centerX, baseY - mT, p, mT, `Dinding Blk`);
        drawCreaseRect(centerX, baseY - mT - l, p, l, `TUTUP ATAS (${P}×${L})`, true);
        // Lid Lipatan Depan + Lock Tabs
        drawCutRect(centerX, baseY - mT * 2 - l, p, mT, `Front Lid`);
        drawCutRect(centerX + p * 0.15, baseY - mT * 2 - l - lockTab, p * 0.2, lockTab, 'Lock');
        drawCutRect(centerX + p * 0.65, baseY - mT * 2 - l - lockTab, p * 0.2, lockTab, 'Lock');

        // Dinding Depan Double-Wall
        drawCreaseRect(centerX, baseY + l, p, mT, `Dinding Dpn Luar`);
        drawCutRect(centerX, baseY + l + mT, p, mT, `Lipat Dalam`);

        // Dinding Samping Kiri & Kanan + Roll-over Ears
        drawCreaseRect(centerX - mT, baseY, mT, l, `Samping`);
        drawCutRect(centerX - mT * 2, baseY, mT, l, `Roll Wall`);
        drawCutRect(centerX - mT - ear, baseY - ear, ear, ear, 'Ear');
        drawCutRect(centerX - mT - ear, baseY + l, ear, ear, 'Ear');

        drawCreaseRect(centerX + p, baseY, mT, l, `Samping`);
        drawCutRect(centerX + p + mT, baseY, mT, l, `Roll Wall`);
        drawCutRect(centerX + p + mT, baseY - ear, ear, ear, 'Ear');
        drawCutRect(centerX + p + mT, baseY + l, ear, ear, 'Ear');

    // ---------------------------------------------------------------------
    // C. MODEL 3: DRAWER / SLIDER SLEEVE BOX (2 KOMPONEN)
    // ---------------------------------------------------------------------
    } else if (currentModelType === 'sleeve') {
        const sT = Math.min(t, l * 0.65);
        const glue = 24;
        const gap = 50;
        canvas.width = Math.max((p * 2) + (sT * 2) + glue, p + sT * 4) + pad * 2;
        canvas.height = l + l + (sT * 4) + gap + pad * 2;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawHeader(`DIELINE: SLIDER SLEEVE + TRAY | ${P} × ${L} × ${Math.round(sT / px * 10) / 10} cm`);

        // BAGIAN 1: OUTER SLEEVE (ATAS)
        const slX = pad + glue;
        const slY = pad + 20;
        drawCreaseRect(slX, slY, sT, l, `Sisi`);
        drawCreaseRect(slX + sT, slY, p, l, `SLEEVE ATAS (${P}×${L})`, true);
        drawCreaseRect(slX + sT + p, slY, sT, l, `Sisi`);
        drawCreaseRect(slX + sT * 2 + p, slY, p, l, `SLEEVE BAWAH (${P}×${L})`, true);
        drawCutRect(slX - glue, slY + 6, glue, l - 12, 'Glue');

        // BAGIAN 2: INNER TRAY / LACI (BAWAH)
        const trX = pad + sT * 2;
        const trY = slY + l + gap + sT * 2;
        drawCreaseRect(trX, trY, p, l, `ALAS TRAY (${P}×${L})`);
        // Dinding Ganda Tray
        drawCreaseRect(trX, trY - sT, p, sT, 'Dinding');
        drawCutRect(trX, trY - sT * 2, p, sT, 'Lipat Dalam');
        drawCreaseRect(trX, trY + l, p, sT, 'Dinding');
        drawCutRect(trX, trY + l + sT, p, sT, 'Lipat Dalam');

        drawCreaseRect(trX - sT, trY, sT, l, 'Sisi');
        drawCutRect(trX - sT * 2, trY, sT, l, 'Lipat');
        drawCreaseRect(trX + p, trY, sT, l, 'Sisi');
        drawCutRect(trX + p + sT, trY, sT, l, 'Lipat');

    // ---------------------------------------------------------------------
    // D. MODEL 4: GABLE CARRIER BOX (KOTAK TENTENG)
    // ---------------------------------------------------------------------
    } else if (currentModelType === 'gable') {
        const baseH = t * 0.68;
        const roofH = t * 0.22;
        const handleH = t * 0.14;
        const bottomLock = l * 0.55;
        const glue = 25;

        canvas.width = (p * 2) + (l * 2) + glue + pad * 2;
        canvas.height = handleH + roofH + baseH + bottomLock + pad * 2;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawHeader(`DIELINE: GABLE CARRIER BOX | ${P} × ${L} × ${T} cm`);

        const startX = pad + glue;
        const bodyY = pad + handleH + roofH;

        // 4 Panel Badan
        drawCreaseRect(startX, bodyY, l, baseH, `Samping`);
        drawCreaseRect(startX + l, bodyY, p, baseH, `DEPAN (${P}×${Math.round(baseH / px)})`, true);
        drawCreaseRect(startX + l + p, bodyY, l, baseH, `Samping`);
        drawCreaseRect(startX + l * 2 + p, bodyY, p, baseH, `BELAKANG (${P}×${Math.round(baseH / px)})`, true);
        drawCutRect(startX - glue, bodyY + 10, glue, baseH - 20, 'Glue');

        // Atap Gable & Handle Jinjing di atas Panel Depan & Belakang
        [startX + l, startX + l * 2 + p].forEach(pxPos => {
            drawCreaseRect(pxPos, bodyY - roofH, p, roofH, 'Atap Gable');
            drawCutRect(pxPos, bodyY - roofH - handleH, p, handleH, 'Handle Pegangan');
            // Lubang jari handle
            ctx.strokeStyle = '#f43f5e';
            ctx.setLineDash([]);
            ctx.strokeRect(pxPos + p * 0.25, bodyY - roofH - handleH * 0.65, p * 0.5, handleH * 0.35);
        });

        // Lipatan Segitiga Samping (Gusset)
        [startX, startX + l + p].forEach(lxPos => {
            drawCutRect(lxPos + 4, bodyY - roofH * 0.85, l - 8, roofH * 0.85, 'Gusset');
        });

        // Auto-Lock Bottom Flaps
        drawCutRect(startX, bodyY + baseH, l, bottomLock, 'Bottom');
        drawCutRect(startX + l, bodyY + baseH, p, bottomLock, 'Bottom Lock');
        drawCutRect(startX + l + p, bodyY + baseH, l, bottomLock, 'Bottom');
        drawCutRect(startX + l * 2 + p, bodyY + baseH, p, bottomLock, 'Bottom Lock');

    // ---------------------------------------------------------------------
    // E. MODEL 5: CURVED PILLOW BOX (KEMASAN BANTAL)
    // ---------------------------------------------------------------------
    } else if (currentModelType === 'pillow') {
        const arcH = l * 0.45;
        const glue = 24;
        canvas.width = (p * 2) + glue + pad * 2;
        canvas.height = t + (arcH * 2) + pad * 2;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawHeader(`DIELINE: CURVED PILLOW BOX | ${P} × ${L} × ${T} cm`);

        const startX = pad + glue;
        const bodyY = pad + arcH;

        drawCreaseRect(startX, bodyY, p, t, `SISI DEPAN (${P}×${T})`, true);
        drawCreaseRect(startX + p, bodyY, p, t, `SISI BELAKANG (${P}×${T})`, true);
        drawCutRect(startX - glue, bodyY + 12, glue, t - 24, 'Glue');

        // Garis Potong & Crease Lengkung (Arcs) pada masing-masing sisi
        [startX, startX + p].forEach(panelX => {
            // Lengkungan Luar (Cut - Merah)
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 2.2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(panelX, bodyY);
            ctx.quadraticCurveTo(panelX + p / 2, bodyY - arcH * 1.4, panelX + p, bodyY);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(panelX, bodyY + t);
            ctx.quadraticCurveTo(panelX + p / 2, bodyY + t + arcH * 1.4, panelX + p, bodyY + t);
            ctx.stroke();

            // Lengkungan Dalam (Crease Lipatan - Hijau Putus-Putus)
            ctx.strokeStyle = '#10b981';
            ctx.setLineDash([6, 5]);
            ctx.beginPath();
            ctx.moveTo(panelX, bodyY);
            ctx.quadraticCurveTo(panelX + p / 2, bodyY + arcH * 0.9, panelX + p, bodyY);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(panelX, bodyY + t);
            ctx.quadraticCurveTo(panelX + p / 2, bodyY + t - arcH * 0.9, panelX + p, bodyY + t);
            ctx.stroke();
        });

    // ---------------------------------------------------------------------
    // F. MODEL 6: COUNTER DISPLAY BOX (POP OPEN TOP)
    // ---------------------------------------------------------------------
    } else if (currentModelType === 'display') {
        const frontH = t * 0.42;
        const backH = t * 1.12;
        canvas.width = p + (l * 2) + pad * 2;
        canvas.height = backH + l + frontH + pad * 2;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawHeader(`DIELINE: COUNTER DISPLAY BOX (POP) | ${P} × ${L} × ${T} cm`);

        const centerX = pad + l;
        const baseY = pad + backH;

        // Alas Tengah
        drawCreaseRect(centerX, baseY, p, l, `ALAS DISPLAY (${P}×${L})`);
        // Header Belakang Tinggi
        drawCreaseRect(centerX, baseY - backH, p, backH, `HEADER BACKBOARD (${P}×${Math.round(backH / px)})`, true);
        // Dinding Depan Rendah
        drawCreaseRect(centerX, baseY + l, p, frontH, `FRONT LIP (${P}×${Math.round(frontH / px)})`, true);

        // Dinding Samping Miring (Trapesium)
        // Kiri
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(centerX, baseY);
        ctx.lineTo(centerX - l, baseY - backH * 0.35);
        ctx.lineTo(centerX - l, baseY + l);
        ctx.lineTo(centerX, baseY + l);
        ctx.stroke();

        // Kanan
        ctx.beginPath();
        ctx.moveTo(centerX + p, baseY);
        ctx.lineTo(centerX + p + l, baseY - backH * 0.35);
        ctx.lineTo(centerX + p + l, baseY + l);
        ctx.lineTo(centerX + p, baseY + l);
        ctx.stroke();
    }
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

document.getElementById('select-model').addEventListener('change', (e) => {
    currentModelType = e.target.value;
    document.getElementById('model-desc').innerText = MODEL_DESCRIPTIONS[currentModelType] || '';
    updateAll();
});

['input-length', 'input-width', 'input-height', 'base-color'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateAll);
});

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

document.getElementById('btn-rotate').addEventListener('click', (e) => {
    controls.autoRotate = !controls.autoRotate;
    e.target.innerText = controls.autoRotate ? 'Pause Rotasi' : 'Auto Rotasi';
});

document.getElementById('btn-reset-cam').addEventListener('click', () => {
    camera.position.set(26, 20, 32);
    controls.target.set(0, 3.5, 0);
    controls.update();
});

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

window.addEventListener('resize', () => {
    if (container.clientWidth > 0 && container.clientHeight > 0) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
});

updateAll();

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
