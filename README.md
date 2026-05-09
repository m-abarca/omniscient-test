# Mini Production Orders System

Mini-SaaS de Órdenes de Producción: Directus (SQLite) + NestJS + Next.js (Ant Design), organizado como monorepo de Yarn workspaces.

## Requisitos

- Docker con Compose v2 (`docker compose ...`).
- Solo si quieres correr los tests fuera de Docker: Node 20.10+ con corepack.

## Levantar el stack

```bash
git clone https://github.com/m-abarca/omniscient-test omniscient
cd omniscient
cp .env.example .env
```

Edita `.env` y pon dos hex aleatorios en `DIRECTUS_KEY` y `DIRECTUS_SECRET`:

```bash
openssl rand -hex 32    # copia el resultado a DIRECTUS_KEY
openssl rand -hex 32    # copia el resultado a DIRECTUS_SECRET
```

Luego:

```bash
docker compose up --build
```

La primera vez tarda algunos minutos (descarga 4 imágenes, compila backend y frontend). Cuando veas `Backend listening on http://0.0.0.0:3001` está todo arriba.

URLs:

| URL | Servicio |
|---|---|
| http://localhost:3000 | Frontend (tabla, alta, botón "Reschedule conflicts") |
| http://localhost:3001/orders | API REST del backend |
| http://localhost:8055 | Admin de Directus (login con `DIRECTUS_ADMIN_EMAIL` / `DIRECTUS_ADMIN_PASSWORD` del `.env`) |

Para detener:

```bash
docker compose down        # conserva la base SQLite
docker compose down -v     # borra el volumen y empieza de cero
```

## Caso de prueba: rescheduling de conflictos

1. Abre http://localhost:3000.
2. Click en **"New order"** y crea la **Orden A** (queda con status `planned` por defecto):
   - Reference: `ORD-A` · Product: `Widget` · Quantity: `10`
   - Start: `2026-06-01 08:00` · End: `2026-06-05 17:00`
3. Click en **"New order"** otra vez y crea la **Orden B** (su rango se solapa con A):
   - Reference: `ORD-B` · Product: `Widget` · Quantity: `5`
   - Start: `2026-06-03 08:00` · End: `2026-06-07 17:00`
4. Ambas aparecen en la tabla con status `planned` y rangos solapados.
5. Click en **"Reschedule conflicts"**. Aparece el toast `1 order rescheduled`.
6. Verás que `ORD-B` ahora arranca cuando termina `ORD-A` (`2026-06-05 17:00`) y conserva su duración original (4 días 9 horas).
7. Click en **"Reschedule conflicts"** otra vez: toast `No conflicts to resolve`. El algoritmo es idempotente.

## Tests del algoritmo

13 casos de borde cubiertos en Jest:

```bash
corepack enable
yarn install
yarn workspace @omniscient/backend test
```

## Cómo maneja el algoritmo los casos borde

Función pura `reschedulePlanned()` en [`apps/backend/libs/rescheduling/src/reschedule.ts`](apps/backend/libs/rescheduling/src/reschedule.ts):

- **Solo participan órdenes con `status === 'planned'`**; otros estados son invisibles al algoritmo.
- **Orden por `(createdAt ASC, id ASC)`**. El `id` desempata de forma determinista cuando dos órdenes comparten `createdAt`.
- **Intervalos semi-abiertos `[start, end)`**. Dos órdenes que se tocan en el borde (`A.endDate === B.startDate`) NO se consideran solapadas.
- **Cursor + duración preservada**. Avanza un cursor con el último `endDate` visto; si una orden empieza antes del cursor, la desplaza a `cursor` conservando su duración exacta (incluido 0).
- **Devuelve solo las modificadas** para que el backend haga el mínimo número de PATCHes a Directus.
- **No muta el input** y es **idempotente**: aplicar el resultado y volver a correr no produce más cambios.
