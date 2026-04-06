# Paris Map

POC web de visualisation aerienne de Paris avec relief 3D, base sur les services IGN et rendu dans le navigateur avec `CesiumJS`.

Le projet vise un rendu simple a lancer localement:

- orthophoto IGN en fond principal
- terrain 3D derive des donnees d'altitude IGN
- navigation camera avec presets et reglages d'angle
- lecture d'altitude au clic
- interface legere, sans build ni backend

## Apercu

Le viewer charge une zone centree sur Paris et combine:

- `CesiumJS` pour le rendu WebGL et la navigation
- `WMTS` IGN pour l'imagerie (`Plan IGN` + orthophoto)
- `WMS` IGN pour l'altitude, convertie en tuiles de terrain cote client

L'objectif n'est pas de reproduire un jumeau numerique photo-realiste complet, mais d'obtenir une base fluide et exploitable pour explorer Paris en vue aerienne avec du relief.

## Fonctionnalites

- presets de navigation sur plusieurs zones de Paris
- boutons `Vue dessus` et `Vue oblique`
- reglage du cap camera
- reglage de l'inclinaison camera
- exageration du relief
- mesure d'altitude sur clic terrain
- panneau de controle superpose au viewer

## Lancer le projet

Le projet est statique. Un simple serveur HTTP local suffit.

```powershell
cd C:\Users\godef\OneDrive\Documents\GS-PARIS
py -m http.server 8080
```

Puis ouvrir [http://localhost:8080](http://localhost:8080).

## Controles

- clic gauche: rotation autour de la scene
- molette: zoom
- `Shift` + clic gauche: inclinaison
- clic sur le terrain: lecture d'altitude

## Structure

- `index.html`: structure de l'interface
- `styles.css`: habillage du panneau et du viewer
- `app.js`: initialisation Cesium, couches IGN, terrain et interactions

## Sources de donnees

- `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2`
- `HR.ORTHOIMAGERY.ORTHOPHOTOS`
- `ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES`

Documentation utile:

- [Guide Geoplateforme](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/)
- [WMTS IGN GetCapabilities](https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities)
- [WMS IGN GetCapabilities](https://data.geopf.fr/wms-r?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities)
- [CesiumJS Learn](https://cesium.com/learn/cesiumjs-learn/)

## Limites actuelles

- ce n'est pas un viewer photogrammetrique complet
- la resolution de l'imagerie depend des flux publics IGN
- le terrain est borne a Paris pour garder des performances acceptables
- le rendu headless n'est pas fiable pour valider le visuel, il faut tester dans un vrai navigateur

## Suite possible

- pre-tiling local du terrain pour gagner en fluidite
- ajout de couches de points ou LiDAR plus riches
- comparaison avec une version `Cesium World Terrain` ou `3D Tiles`
- preparation d'une version deployable
