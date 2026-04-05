# Paris Relief IGN POC

POC statique pour visualiser Paris dans le navigateur avec une base plus fluide:

- moteur `CesiumJS`
- `Orthophoto 20 cm` IGN via `WMTS`
- terrain 3D IGN via `WMS BIL` converti en heightmaps
- photo drapee sur la geometrie terrain
- mesure d'altitude au clic
- exageration de relief reglable

## Lancer le POC

Le projet n'a pas besoin de build. Il faut juste un petit serveur HTTP local.

```powershell
cd C:\Users\godef\OneDrive\Documents\GS-PARIS
py -m http.server 8080
```

Puis ouvrir:

- [http://localhost:8080](http://localhost:8080)

## Ce que fait le POC

- recentre rapidement la camera sur plusieurs zones de Paris
- utilise `CesiumJS` pour le rendu et la navigation
- charge des hauteurs IGN et les convertit en terrain 3D
- drape l'orthophoto IGN au-dessus du relief
- garde la mesure terrain au clic sans calcul continu au survol
- limite la charge pour privilegier la fluidite

## Limites actuelles

- ce n'est pas encore un vrai `Gaussian Splat`
- la resolution photo publique de ce flux reste `20 cm`
- on gagne surtout en geometrie et en rendu, pas en detail photo invente
- le terrain est volontairement borne sur Paris pour garder des perfs correctes

## Sources officielles

- [Guide des services Geoplateforme](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/)
- [WMTS Geoplateforme](https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities)
- [WMS Geoplateforme](https://data.geopf.fr/wms-r?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities)
- [Cesium Terrain](https://cesium.com/learn/cesiumjs-learn/cesiumjs-terrain/)
