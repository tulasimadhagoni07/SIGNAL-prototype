import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/DRACOLoader.js';

const container = document.getElementById('viewer');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

const keyLight = new THREE.DirectionalLight(0xfff5e9, 1.5);
keyLight.position.set(3, 5, 5);
scene.add(keyLight, new THREE.HemisphereLight(0xd9f2e7, 0x83918d, 0.8));
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = false;
controls.autoRotateSpeed = 1.2;
controls.minDistance = 1.8;
controls.maxDistance = 9;
let model;
let activeSiteKey = 'lungs';
const siteLabel = document.getElementById('anatomySiteLabel');
const siteMarkup = document.getElementById('anatomyMarkup');
const siteAnchors = {
    face: { x: 0.5, y: 0.87, z: 0.9 },
    heart: { x: 0.53, y: 0.71, z: 0.9 },
    lungs: { x: 0.5, y: 0.69, z: 0.9 },
    liver: { x: 0.55, y: 0.57, z: 0.9 },
    palm: { x: 0.31, y: 0.4, z: 0.9 }
};

function projectAnatomySite() {
    if (!model || !siteMarkup || !siteLabel) return;
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const anchor = siteAnchors[activeSiteKey] || siteAnchors.lungs;
    const point = new THREE.Vector3(
        bounds.min.x + size.x * anchor.x,
        bounds.min.y + size.y * anchor.y,
        bounds.min.z + size.z * anchor.z
    );
    point.project(camera);
    const visible = point.z > -1 && point.z < 1;
    const x = (point.x * 0.5 + 0.5) * container.clientWidth;
    const y = (-point.y * 0.5 + 0.5) * container.clientHeight;
    siteMarkup.style.display = visible ? 'block' : 'none';
    siteLabel.style.display = visible ? 'block' : 'none';
    if (visible) {
        siteMarkup.style.left = `${x}px`;
        siteMarkup.style.top = `${y}px`;
        siteLabel.style.left = `${Math.min(x + 70, container.clientWidth - 205)}px`;
        siteLabel.style.top = `${Math.max(y - 18, 8)}px`;
    }
}

window.addEventListener('anatomy-site-change', (event) => {
    activeSiteKey = event.detail?.key || 'lungs';
});

function frameModel(root) {
    const bounds = new THREE.Box3().setFromObject(root);
    const size = bounds.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);
    root.position.y -= bounds.min.y + size.y * 0.04;
    const alignedBounds = new THREE.Box3().setFromObject(root);
    const center = alignedBounds.getCenter(new THREE.Vector3());
    const viewCenter = center.y - size.y * 0.18;
    controls.target.set(center.x, viewCenter, center.z);
    camera.position.set(center.x, viewCenter, maxSize * 2.9);
    controls.update();
}

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/');
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.load('./muscular.glb', (gltf) => {
    model = gltf.scene;
    const bones = [];
    model.traverse((object) => {
        if (object.isBone) bones.push(object);
        if (object.isMesh) {
            object.material = object.material.clone();
            object.material.color.set(0x258ed0);
            object.material.emissive.set(0x0879bb);
            object.material.emissiveIntensity = 0.34;
            object.material.transparent = true;
            object.material.opacity = 0.78;
            object.material.depthWrite = false;
            object.material.side = THREE.DoubleSide;
            object.material.roughness = 0.3;
            object.material.metalness = 0.08;
        }
    });
    scene.add(model);
    if (bones.length) {
        const skeleton = new THREE.SkeletonHelper(model);
        skeleton.material.color.set(0xe9f7ff);
        skeleton.material.depthTest = false;
        skeleton.material.depthWrite = false;
        skeleton.renderOrder = 20;
        skeleton.material.linewidth = 2;
        scene.add(skeleton);
    } else {
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const skeletonMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, depthTest: false, depthWrite: false });
        const skeletonGuide = new THREE.Group();
        const addBone = (start, end) => {
            const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
            skeletonGuide.add(new THREE.Line(geometry, skeletonMaterial));
        };
        const y = (ratio) => bounds.min.y + size.y * ratio;
        const x = (ratio) => center.x + size.x * ratio;
        const z = center.z;
        addBone(new THREE.Vector3(x(0), y(0.83), z), new THREE.Vector3(x(0), y(0.34), z));
        [0.58, 0.67, 0.75].forEach((ratio) => addBone(new THREE.Vector3(x(-0.08), y(ratio), z), new THREE.Vector3(x(0.08), y(ratio), z)));
        addBone(new THREE.Vector3(x(-0.09), y(0.58), z), new THREE.Vector3(x(0.09), y(0.58), z));
        [-1, 1].forEach((side) => {
            addBone(new THREE.Vector3(x(side * 0.09), y(0.58), z), new THREE.Vector3(x(side * 0.15), y(0.43), z));
            addBone(new THREE.Vector3(x(side * 0.15), y(0.43), z), new THREE.Vector3(x(side * 0.2), y(0.27), z));
            addBone(new THREE.Vector3(x(side * 0.08), y(0.34), z), new THREE.Vector3(x(side * 0.09), y(0.17), z));
            addBone(new THREE.Vector3(x(side * 0.09), y(0.17), z), new THREE.Vector3(x(side * 0.08), y(0.02), z));
        });
        skeletonGuide.renderOrder = 20;
        model.add(skeletonGuide);
    }
    frameModel(model);
}, undefined, (error) => {
    console.error('Unable to load muscular.glb', error);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    projectAnatomySite();
    renderer.render(scene, camera);
}
animate();

document.getElementById('hiresToggleBtn')?.addEventListener('click', (event) => {
    controls.autoRotate = !controls.autoRotate;
    event.currentTarget.classList.toggle('active', controls.autoRotate);
    event.currentTarget.textContent = controls.autoRotate ? 'Pause 3D Rotation' : 'Auto-Rotate 3D Model';
});
document.getElementById('organViewBtn')?.addEventListener('click', (event) => {
    const modelBox = document.querySelector('.model-box');
    const showingReference = modelBox?.classList.toggle('show-organ-reference');
    event.currentTarget.textContent = showingReference ? 'View Live 3D Model' : 'View Organ Anatomy';
});
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});
