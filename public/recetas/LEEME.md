# Fotos de las recetas

Cada receta muestra `/recetas/<slug>.jpg` (campo `image` en `src/lib/sample-data.ts`).
Formato: **JPG 1200x900** (4:3, que es lo que usan las tarjetas del home y del listado).

Si el archivo no existe, la web no se rompe: la tarjeta cae al emoji de la receta.

## Cómo llenar esta carpeta

### Opción A — fotos de banco, de uso libre

```bash
# Recomendado: key gratis e inmediata en https://www.pexels.com/api/
export PEXELS_API_KEY=xxxxxxxx

npm run recetas:imagenes buscar
```

Baja 5 candidatas por receta a `_candidatos/<slug>/` y deja la nº 1 elegida.
Mirá las candidatas y cambiá la que no te guste:

```bash
npm run recetas:imagenes elegir chips-de-kale 3
```

Sin `PEXELS_API_KEY` el script usa Openverse filtrado a CC0 y dominio público.
Funciona sin registrarse, pero las fotos de producto son bastante peores.

Los créditos y licencias quedan en `CREDITOS.md`, que el script genera solo a
partir de `fuentes.json` (el registro de de dónde salió cada foto). Los dos
archivos se commitean; `_candidatos/` no.

### Opción B — fotos propias de Bio Origen

Mejor que cualquier banco, y es lo que hay en `BIOORIGEN-WEB - Material de trabajo\`:

```bash
npm run recetas:imagenes importar tomates-secos "E:\ruta\a\la\foto.jpg"
```

Recorta y comprime al formato correcto. Las fotos propias no aparecen en `CREDITOS.md`.

### Ver qué falta

```bash
npm run recetas:imagenes estado
npm run recetas:imagenes limpiar   # borra _candidatos/ cuando ya elegiste
```

## Después de elegir las fotos

1. Commitear los `.jpg` de esta carpeta (`_candidatos/` está en `.gitignore`).
2. Impactar las recetas en la base, que es de donde lee la web:

```bash
npm run recetas:sync -- --dry-run   # ver qué cambiaría
npm run recetas:sync
```
