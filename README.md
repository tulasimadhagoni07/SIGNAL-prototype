# SIGNAL Public Health Reporting Prototype

SIGNAL is a browser-based public health reporting dashboard prototype. It combines case review, reportability data, clinical evidence, and an interactive 3D anatomy viewer.

## Features

- Patient and reportability dashboard with preset case scenarios.
- Dynamic case switching for tuberculosis, measles, pertussis, syphilis, legionellosis, hepatitis A, and a non-reportable encounter.
- Interactive blue 3D anatomy model loaded from `muscular.glb`.
- White skeleton overlay with orbit controls and optional auto-rotation.
- Disease-specific red, blinking location marker that follows the anatomy during zoom and rotation.
- Site labels mapped to the selected case, including lungs, face/oral cavity, palm/hand, liver, heart, and throat.
- Organ anatomy reference view using the existing high-resolution anatomy image.
- Upload support for JSON, XML, HL7, and text evidence files.
- Browser-side PDF/report actions included in the dashboard.

## Run Locally

The project uses browser ES modules, so serve it through a local HTTP server instead of opening `index.html` directly.

### Python

```powershell
py -m http.server 8000
```

Then open:

```text
http://localhost:8000/index.html
```

### Node.js alternative

If Node.js is installed, you can use any static server, for example:

```powershell
npx serve .
```

Open the URL printed by the command.

## Main Files

- `index.html` - Dashboard markup, styles, case data, upload handling, and report actions.
- `script.js` - Three.js viewer, GLB loading, skeleton rendering, camera controls, and disease-site projection.
- `muscular.glb` - Interactive 3D anatomy asset.
- `assets/holographic_body_hires.jpg` - Organ-inclusive anatomy reference view.
- `assets/body_3d_crop.png` - Original static anatomy asset retained for reference.
- `signal_test_suite/` - Sample clinical evidence JSON files.
- `build_dashboard.ps1` - Original dashboard generation script.

## 3D Viewer Controls

- **Auto-Rotate 3D Model** toggles automatic rotation.
- Drag the model to orbit around it.
- Scroll over the model to zoom.
- **View Organ Anatomy** switches to the organ reference image; the same button returns to the live 3D model.
- The red blinking marker and site label update when a different case is selected.

## Case Data

Preset cases are defined in `index.html` under `CASES`. Each case includes an `organ` field. The viewer maps that value to a 3D site anchor:

- Lung, tracheal, or bronchial terms -> lungs/chest
- Facial, buccal, oral, or oropharyngeal terms -> face/oral cavity
- Palm, sole, or hand terms -> palm/hand
- Liver or hepatic terms -> liver
- Heart or cardiac terms -> heart

To add another disease location, add a case entry and extend the site mapping in `loadCase()` and `siteAnchors` in `script.js`.

## External Runtime Dependencies

Three.js and its loaders are imported from jsDelivr at runtime:

- Three.js
- `GLTFLoader`
- `OrbitControls`
- `DRACOLoader`

An internet connection is required for the CDN imports and Draco decoder. The PDF actions also use jsPDF from a CDN.

## Publish to GitHub

Create an empty repository on GitHub, then run these commands from this project folder. Replace the URL with your own repository URL.

```powershell
git init
git add .
git commit -m "Add SIGNAL public health dashboard prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

For later updates:

```powershell
git add .
git commit -m "Update anatomy viewer"
git push
```

## Notes

This is a front-end prototype. It does not include a backend, authentication, database, or production clinical integration. Do not use the sample patient data or public-health workflows as production medical or reporting guidance.
