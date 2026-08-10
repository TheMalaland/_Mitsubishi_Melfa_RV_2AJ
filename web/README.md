# Melfa RV-2AJ — Simulador Web

Versión web (React + TypeScript + Three.js) del simulador de MATLAB del brazo
robótico de 5 ejes Mitsubishi Melfa RV-2AJ que vive en la raíz de este
repositorio. Corre enteramente en el navegador: sin MATLAB, sin instalación,
sin conexión al robot físico.

## Qué incluye

- **Cinemática directa** — ingresa los 5 ángulos de articulación y observa la
  pose (X, Y, Z, alpha, beta) y la matriz de transformación del efector final.
- **Cinemática inversa** — ingresa una pose deseada y calcula los ángulos de
  articulación, con las mismas validaciones de rango y de espacio de trabajo
  que el código original.
- **Generador de trayectorias** — círculo, rectángulo y triángulo alrededor
  del punto de referencia, animados en tiempo real resolviendo IK punto por
  punto.
- **Visualización 3D** interactiva (orbit/zoom/pan) del brazo completo,
  usando la malla real del robot (los STL de `robot_nou.SLDASM`, en
  `public/models/`), no geometría genérica.

## Origen del código

La cinemática (`src/kinematics/`) es un port directo y verificado
numéricamente de los `.m` originales:

| Web (TypeScript)          | MATLAB original                                        |
| -------------------------- | ------------------------------------------------------- |
| `forwardKinematics.ts`     | `getXYZ.m`, `getTMat.m`, `JacobianMelfa.m` (cadena DH)   |
| `inverseKinematics.ts`     | `melfa_invk.m`                                           |
| `trajectories.ts`          | `CirculoPos.m`, `RectanguloPos.m`, `trianguloPos.m`      |
| `mat4.ts` (`dhTransform`)  | `GetDHParameters.m`                                      |

Las ~15 GUIs de MATLAB (GUIDE y App Designer) y la conexión serial al robot
físico (`PuertoSerial.m`, `send_instruction.m`) no se portaron: esta versión
es puramente de simulación/visualización.

## Desarrollo

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción en dist/
npm run preview   # sirve el build de producción localmente
```

## Deploy

`npm run build` genera un sitio 100% estático en `dist/` (los `.stl` de
`public/models/` se sirven como archivos separados) — se puede desplegar en
Vercel, Netlify, GitHub Pages o cualquier hosting estático, sin backend.

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FTheMalaland%2F_Mitsubishi_Melfa_RV_2AJ&root-directory=web&project-name=melfa-rv-2aj-simulador&repository-name=melfa-rv-2aj-simulador)

Este proyecto vive en `web/` dentro del repo, no en la raíz, así que al
importar en Vercel manualmente (sin el botón de arriba) hay que fijar eso:

1. [vercel.com/new](https://vercel.com/new) → importa este repositorio de GitHub.
2. En **Root Directory**, selecciona `web` (botón "Edit" junto al campo).
3. Framework Preset: **Vite** (se detecta solo). Build Command y Output
   Directory ya quedan definidos en `web/vercel.json` (`npm run build` →
   `dist`).
4. Deploy. No hace falta ninguna variable de entorno — es 100% estático.

Cada push a la rama conectada vuelve a desplegar automáticamente.

Para generar una versión de un solo archivo HTML (los `.stl` embebidos como
`data:` URIs, útil para compartir sin hosting):

```bash
npm run build
node build-artifact.mjs salida.html
```
