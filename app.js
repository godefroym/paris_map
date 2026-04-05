(function () {
  try {
    const { Cesium } = window;

    if (!Cesium) {
      throw new Error("Cesium n'a pas pu etre charge.");
    }

    const WMTS_URL = "https://data.geopf.fr/wmts";
    const WMS_URL = "https://data.geopf.fr/wms-r";
    const TERRAIN_LAYER = "ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES";
    const PLAN_LAYER = "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2";
    const ORTHO_LAYER = "HR.ORTHOIMAGERY.ORTHOPHOTOS";
    const TERRAIN_SAMPLES = 32;
    const MAX_TERRAIN_LEVEL = 11;
    const MAX_RESOLUTION_SCALE = 1.25;
    const PARIS_BOUNDS = {
      west: 2.14,
      south: 48.77,
      east: 2.51,
      north: 48.93,
    };

    const PRESETS = [
    {
      label: "Paris centre",
      hint: "Vue generale",
        lon: 2.3488,
        lat: 48.8534,
        height: 9500,
        heading: 18,
        pitch: -86,
    },
    {
      label: "Montmartre",
      hint: "Butte nord",
        lon: 2.343,
        lat: 48.8867,
        height: 5200,
        heading: 124,
        pitch: -76,
    },
    {
      label: "Belleville",
      hint: "Relief est",
        lon: 2.3904,
        lat: 48.8722,
        height: 5200,
        heading: 248,
        pitch: -76,
    },
    {
      label: "Buttes-Chaumont",
      hint: "Parc et denivele",
        lon: 2.3817,
        lat: 48.8809,
        height: 4200,
        heading: 214,
        pitch: -78,
    },
    {
      label: "Meudon",
      hint: "Coteaux sud-ouest",
        lon: 2.221,
        lat: 48.8125,
        height: 7600,
        heading: 50,
        pitch: -74,
    },
    {
      label: "La Defense",
      hint: "Plateau ouest",
        lon: 2.2372,
        lat: 48.8918,
        height: 6400,
        heading: 96,
        pitch: -74,
    },
  ];

    const ui = {
    presetList: document.querySelector("#preset-list"),
    hudPanel: document.querySelector(".glass"),
    protocolWarning: document.querySelector("#protocol-warning"),
    toggleOrtho: document.querySelector("#toggle-ortho"),
    exaggeration: document.querySelector("#exaggeration"),
    exaggerationValue: document.querySelector("#exaggeration-value"),
    cameraTop: document.querySelector("#camera-top"),
    cameraOblique: document.querySelector("#camera-oblique"),
    cameraHeading: document.querySelector("#camera-heading"),
    cameraHeadingValue: document.querySelector("#camera-heading-value"),
    cameraPitch: document.querySelector("#camera-pitch"),
    cameraPitchValue: document.querySelector("#camera-pitch-value"),
    cameraStats: document.querySelector("#camera-stats"),
    renderMode: document.querySelector("#render-mode"),
    pinnedAltitude: document.querySelector("#pinned-altitude"),
    coverageStats: document.querySelector("#coverage-stats"),
    loadStatus: document.querySelector("#load-status"),
    credits: document.querySelector("#credits"),
  };

    if (window.location.protocol === "file:") {
      ui.protocolWarning.classList.remove("hidden");
    }

    ui.exaggerationValue.textContent = `${ui.exaggeration.value}%`;
    ui.cameraHeadingValue.textContent = `${ui.cameraHeading.value}°`;
    ui.cameraPitchValue.textContent = `${ui.cameraPitch.value}°`;

    const tilingScheme = new Cesium.GeographicTilingScheme();
    const terrainTileCache = new Map();
    let currentTarget = {
      lon: PRESETS[0].lon,
      lat: PRESETS[0].lat,
      range: PRESETS[0].height,
    };

    function tileCacheKey(x, y, level) {
    return `${level}/${x}/${y}`;
  }

    function degreesRectangleForTile(x, y, level) {
    const rectangle = tilingScheme.tileXYToRectangle(x, y, level);
    return {
      west: Cesium.Math.toDegrees(rectangle.west),
      south: Cesium.Math.toDegrees(rectangle.south),
      east: Cesium.Math.toDegrees(rectangle.east),
      north: Cesium.Math.toDegrees(rectangle.north),
    };
  }

    function intersectsParisBounds(bounds) {
    return !(
      bounds.east < PARIS_BOUNDS.west ||
      bounds.west > PARIS_BOUNDS.east ||
      bounds.north < PARIS_BOUNDS.south ||
      bounds.south > PARIS_BOUNDS.north
    );
  }

    async function fetchTerrainTile(x, y, level) {
    if (level > MAX_TERRAIN_LEVEL) {
      return undefined;
    }

    const bounds = degreesRectangleForTile(x, y, level);

    if (!intersectsParisBounds(bounds)) {
      return new Float32Array(TERRAIN_SAMPLES * TERRAIN_SAMPLES);
    }

    const key = tileCacheKey(x, y, level);

    if (terrainTileCache.has(key)) {
      return terrainTileCache.get(key);
    }

    const params = new URLSearchParams({
      SERVICE: "WMS",
      VERSION: "1.3.0",
      REQUEST: "GetMap",
      LAYERS: TERRAIN_LAYER,
      CRS: "CRS:84",
      BBOX: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
      WIDTH: String(TERRAIN_SAMPLES),
      HEIGHT: String(TERRAIN_SAMPLES),
      FORMAT: "image/x-bil;bits=32",
      STYLES: "",
    });

    const promise = fetch(`${WMS_URL}?${params.toString()}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Terrain IGN HTTP ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const view = new DataView(buffer);
        const heights = new Float32Array(TERRAIN_SAMPLES * TERRAIN_SAMPLES);

        for (let i = 0; i < heights.length; i += 1) {
          const value = view.getFloat32(i * 4, true);
          heights[i] = Number.isFinite(value) ? value : 0;
        }

        return heights;
      })
      .catch(() => new Float32Array(TERRAIN_SAMPLES * TERRAIN_SAMPLES));

    terrainTileCache.set(key, promise);
    return promise;
  }

    const terrainProvider = new Cesium.CustomHeightmapTerrainProvider({
    width: TERRAIN_SAMPLES,
    height: TERRAIN_SAMPLES,
    tilingScheme,
    callback: fetchTerrainTile,
    credit: "IGN / Geoplateforme - Terrain",
  });

    const viewer = new Cesium.Viewer("viewer", {
    animation: false,
    baseLayer: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    selectionIndicator: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    timeline: false,
      requestRenderMode: false,
      scene3DOnly: true,
      creditContainer: ui.credits,
      msaaSamples: 1,
  });

    const scene = viewer.scene;
    scene.highDynamicRange = false;
    scene.skyAtmosphere.show = false;
    scene.skyBox.show = false;
    scene.backgroundColor = Cesium.Color.fromCssColorString("#11202a");
    scene.fog.enabled = true;
    scene.globe.depthTestAgainstTerrain = false;
    scene.globe.maximumScreenSpaceError = 5;
    scene.globe.tileCacheSize = 80;
    scene.globe.showGroundAtmosphere = false;
    scene.globe.baseColor = Cesium.Color.fromCssColorString("#11202a");
    scene.verticalExaggeration = Number(ui.exaggeration.value) / 100;
    scene.verticalExaggerationRelativeHeight = 0;
    scene.requestRender();

    if ("resolutionScale" in scene) {
      scene.resolutionScale = Math.min(window.devicePixelRatio || 1, MAX_RESOLUTION_SCALE);
    }

    viewer.camera.frustum.near = 1.0;
    const cameraController = viewer.scene.screenSpaceCameraController;
    cameraController.minimumZoomDistance = 300;
    cameraController.maximumZoomDistance = 30000;
    cameraController.enableRotate = true;
    cameraController.enableTranslate = true;
    cameraController.enableZoom = true;
    cameraController.enableTilt = true;
    cameraController.enableLook = true;
    cameraController.rotateEventTypes = [Cesium.CameraEventType.LEFT_DRAG];
    cameraController.tiltEventTypes = [
      Cesium.CameraEventType.MIDDLE_DRAG,
      {
        eventType: Cesium.CameraEventType.LEFT_DRAG,
        modifier: Cesium.KeyboardEventModifier.SHIFT,
      },
      Cesium.CameraEventType.PINCH,
    ];
    cameraController.zoomEventTypes = [
      Cesium.CameraEventType.RIGHT_DRAG,
      Cesium.CameraEventType.WHEEL,
      Cesium.CameraEventType.PINCH,
    ];

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        PRESETS[0].lon,
        PRESETS[0].lat,
        PRESETS[0].height,
      ),
      orientation: {
        heading: Cesium.Math.toRadians(PRESETS[0].heading),
        pitch: Cesium.Math.toRadians(PRESETS[0].pitch),
        roll: 0,
      },
    });

    const planLayer = viewer.imageryLayers.addImageryProvider(
      new Cesium.WebMapTileServiceImageryProvider({
        url: WMTS_URL,
        layer: PLAN_LAYER,
        style: "normal",
        format: "image/png",
        tileMatrixSetID: "PM_0_19",
        tilingScheme: new Cesium.WebMercatorTilingScheme(),
        minimumLevel: 0,
        maximumLevel: 19,
        enablePickFeatures: false,
        credit: "IGN / Geoplateforme - Plan IGN",
      }),
    );

    const orthoLayer = viewer.imageryLayers.addImageryProvider(
      new Cesium.WebMapTileServiceImageryProvider({
        url: WMTS_URL,
        layer: ORTHO_LAYER,
      style: "normal",
      format: "image/jpeg",
      tileMatrixSetID: "PM_6_19",
      tilingScheme: new Cesium.WebMercatorTilingScheme(),
      minimumLevel: 6,
      maximumLevel: 19,
      enablePickFeatures: false,
      credit: "IGN / Geoplateforme - Orthophotos",
    }),
    );

    planLayer.alpha = 1;
    orthoLayer.alpha = 1;

    function setLoadStatus(message) {
    ui.loadStatus.textContent = message;
  }

    function setPinnedAltitude(message) {
    ui.pinnedAltitude.textContent = message;
  }

    function updateCameraStats() {
    const position = viewer.camera.positionCartographic;
    const lon = Cesium.Math.toDegrees(position.longitude);
    const lat = Cesium.Math.toDegrees(position.latitude);
    ui.cameraStats.textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)} | ${Math.round(position.height).toLocaleString("fr-FR")} m`;
  }

    function normalizeHeadingDegrees(value) {
    return ((Math.round(value) % 360) + 360) % 360;
  }

    function updateAngleLabels(headingDeg, pitchVerticalDeg) {
    const headingWrapped = normalizeHeadingDegrees(headingDeg);
    const clampedPitch = Cesium.Math.clamp(Math.round(pitchVerticalDeg), 20, 89);

    ui.cameraHeading.value = String(headingWrapped);
    ui.cameraHeadingValue.textContent = `${headingWrapped}°`;
    ui.cameraPitch.value = String(clampedPitch);
    ui.cameraPitchValue.textContent = `${clampedPitch}°`;
  }

    function syncAngleControlsFromCamera() {
      updateAngleLabels(
        Cesium.Math.toDegrees(viewer.camera.heading),
        -Cesium.Math.toDegrees(viewer.camera.pitch),
      );
    }

    function pickCenterTarget() {
      const center = new Cesium.Cartesian2(
        scene.canvas.clientWidth * 0.5,
        scene.canvas.clientHeight * 0.5,
      );
      const ray = viewer.camera.getPickRay(center);
      const cartesian = ray ? scene.globe.pick(ray, scene) : null;

      if (!cartesian) {
        return currentTarget;
      }

      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const targetCartesian = Cesium.Cartesian3.fromDegrees(
        Cesium.Math.toDegrees(cartographic.longitude),
        Cesium.Math.toDegrees(cartographic.latitude),
        cartographic.height || 0,
      );

      return {
        lon: Cesium.Math.toDegrees(cartographic.longitude),
        lat: Cesium.Math.toDegrees(cartographic.latitude),
        range: Cesium.Cartesian3.distance(viewer.camera.position, targetCartesian),
      };
    }

    function applyCameraAngles(options = {}) {
      const target = options.target || pickCenterTarget() || currentTarget;
      const headingDeg = normalizeHeadingDegrees(Number(options.headingDeg ?? ui.cameraHeading.value));
      const pitchVerticalDeg = Cesium.Math.clamp(
        Number(options.pitchVerticalDeg ?? ui.cameraPitch.value),
        20,
        89,
      );
      const range = Cesium.Math.clamp(
        Number(options.range ?? target.range ?? viewer.camera.positionCartographic.height),
        700,
        40000,
      );
      const duration = Number(options.duration ?? 0);

      currentTarget = {
        lon: target.lon,
        lat: target.lat,
        range,
      };

      updateAngleLabels(headingDeg, pitchVerticalDeg);
      viewer.camera.cancelFlight();
      viewer.camera.flyToBoundingSphere(
        new Cesium.BoundingSphere(
          Cesium.Cartesian3.fromDegrees(target.lon, target.lat, 0),
          80,
        ),
        {
          duration,
          offset: new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(headingDeg),
            Cesium.Math.toRadians(-pitchVerticalDeg),
            range,
          ),
          complete: () => {
            updateCameraStats();
            syncAngleControlsFromCamera();
            scene.requestRender();
          },
          cancel: () => {
            updateCameraStats();
            syncAngleControlsFromCamera();
            scene.requestRender();
          },
        },
      );
    }

    function isolateHudInteractions() {
    if (!ui.hudPanel) {
      return;
    }

    const stop = (event) => {
      event.stopPropagation();
    };

    [
      "pointerdown",
      "pointerup",
      "pointermove",
      "mousedown",
      "mouseup",
      "mousemove",
      "click",
      "dblclick",
      "contextmenu",
      "wheel",
      "touchstart",
      "touchmove",
      "touchend",
    ].forEach((eventName) => {
      ui.hudPanel.addEventListener(eventName, stop, { capture: true });
    });
  }

    function renderPresets() {
    const fragment = document.createDocumentFragment();

    for (const preset of PRESETS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "preset-btn";
      button.innerHTML = `<strong>${preset.label}</strong><span>${preset.hint}</span>`;
      button.addEventListener("click", () => flyToPreset(preset));
      fragment.appendChild(button);
    }

    ui.presetList.replaceChildren(fragment);
  }

    function flyToPreset(preset, options = {}) {
      setLoadStatus(`Navigation vers ${preset.label}...`);
      currentTarget = {
        lon: preset.lon,
        lat: preset.lat,
        range: preset.height,
      };
      applyCameraAngles({
        target: currentTarget,
        headingDeg: preset.heading,
        pitchVerticalDeg: -preset.pitch,
        range: preset.height,
        duration: options.duration ?? 0.85,
      });
      setLoadStatus(`Vue ${preset.label} chargee.`);
      scene.requestRender();
    }

    renderPresets();
    isolateHudInteractions();

    ui.renderMode.textContent = "Cesium + orthophoto IGN sur terrain 3D optimise";
    ui.coverageStats.textContent = "Terrain detaille sur Paris, moteur regle pour privilegier la fluidite";
    setPinnedAltitude("Clique sur le terrain pour lire l'altitude.");
    setLoadStatus("Chargement de la carte puis activation du terrain 3D...");
    updateCameraStats();
    syncAngleControlsFromCamera();

    ui.toggleOrtho.addEventListener("change", () => {
      orthoLayer.show = ui.toggleOrtho.checked;
      planLayer.show = true;
      scene.requestRender();
    });

    ui.exaggeration.addEventListener("input", () => {
      ui.exaggerationValue.textContent = `${ui.exaggeration.value}%`;
      scene.verticalExaggeration = Number(ui.exaggeration.value) / 100;
      scene.requestRender();
    });

    ui.cameraHeading.addEventListener("input", () => {
      applyCameraAngles({ duration: 0 });
    });

    ui.cameraPitch.addEventListener("input", () => {
      applyCameraAngles({ duration: 0 });
    });

    ui.cameraTop.addEventListener("click", () => {
      applyCameraAngles({ pitchVerticalDeg: 88, duration: 0.35 });
    });

    ui.cameraOblique.addEventListener("click", () => {
      applyCameraAngles({ pitchVerticalDeg: 58, duration: 0.35 });
    });

    viewer.camera.moveEnd.addEventListener(() => {
      currentTarget = pickCenterTarget() || currentTarget;
      updateCameraStats();
      syncAngleControlsFromCamera();
      scene.requestRender();
    });

    window.addEventListener(
      "resize",
      () => {
        if ("resolutionScale" in scene) {
          scene.resolutionScale = Math.min(window.devicePixelRatio || 1, MAX_RESOLUTION_SCALE);
        }
        scene.requestRender();
      },
      { passive: true },
    );

    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction((click) => {
      const ray = viewer.camera.getPickRay(click.position);
      const cartesian = scene.globe.pick(ray, scene);

      if (!cartesian) {
        setPinnedAltitude("Point hors terrain.");
        return;
      }

      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      const height = cartographic.height || 0;

      setPinnedAltitude(`${height.toFixed(1).replace(".", ",")} m | ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      scene.requestRender();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    setTimeout(() => {
      viewer.terrainProvider = terrainProvider;
      setLoadStatus("Terrain 3D IGN active.");
      flyToPreset(PRESETS[0], { duration: 0.6 });
    }, 180);
  } catch (error) {
    const loadStatus = document.querySelector("#load-status");
    if (loadStatus) {
      loadStatus.textContent = `Erreur viewer: ${error.message}`;
    }
    console.error(error);
  }
})();
