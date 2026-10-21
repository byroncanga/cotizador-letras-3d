# Taller · Cotizador de letreros

Primera entrega de la Fase 1: base visual, borradores locales, catálogos de configuración, análisis SVG inicial y API Laravel preparada. **No es todavía un cotizador listo para producción.**

## Abrir la primera entrega

Requiere Node 24+ y npm. Desde esta carpeta:

```sh
npm ci
npm run dev
```

Abrir [el cotizador local](http://127.0.0.1:5173). Este comando inicia Vite y el analizador geométrico. El botón «Explorar con un ejemplo» carga un SVG real de prueba; no contiene precios ni un plano de nesting inventado.

Los catálogos y borradores de esta entrega se guardan en **el navegador actual**, no en MySQL. Los archivos SVG originales se guardan en IndexedDB y se procesan en el servidor geométrico local. La copia JSON exportada incluye las medidas, pero no los originales; conserva también tus SVG.

## Arquitectura

| Ruta | Responsabilidad |
| --- | --- |
| `apps/web` | React, Vite, TypeScript y Tailwind 4. Interfaz y borradores de revisión. Sin fórmulas económicas. |
| `apps/api` | Laravel 13 / PHP 8.5: sesión propietaria, catálogo, auditoría, análisis y borradores protegidos. Motor económico decimal en servidor. |
| `services/geometry` | Normalización SVG y métricas con `svgpath`, `svg-path-properties` y Paper.js. Worker aislado con límite de tiempo. |
| `packages/contracts` | Tipos Zod/TypeScript y JSON Schema versionado. |
| `infra` | Entorno Docker para Laravel, MySQL y el servicio geométrico. |
| `docs` | Decisiones aprobadas y alcance verificable de la entrega. |

## Laravel y MySQL

Requiere PHP 8.5, Composer y MySQL 8.4. Se descargaron PHP y Composer locales para esta sesión en `.runtime/bin`; están ignorados por Git y no modifican el perfil de tu terminal. Si tienes PHP instalado globalmente, también puedes usar los comandos habituales de Laravel.

1. Copiar `apps/api/.env.example` a `apps/api/.env` si no existe.
2. Configurar las credenciales MySQL reales y ejecutar `composer install` dentro de `apps/api`.
3. Ejecutar `npm run api -- key:generate`, `npm run api -- migrate` y `npm run api -- taller:owner` desde la raíz.
4. Ejecutar `npm run dev:api` para iniciar la API en el puerto 8000.

La cuenta propietaria se crea con datos introducidos por el operador. No hay usuario, contraseña, materiales ni precios de producción sembrados. El archivo `.env` generado en esta sesión contiene una clave aleatoria de aplicación, sin credenciales de MySQL.

### Docker y EasyPanel

`Dockerfile` compila la SPA y la sirve con Nginx. `compose.yaml` levanta la web, Laravel, el servicio geométrico y MySQL; el punto de entrada HTTP es `web:80`. Para un servidor propio, copia `.env.example` como `.env`, genera una clave con `php artisan key:generate --show` dentro de `apps/api`, y completa `APP_KEY`, `APP_URL`, `TALLER_DB_PASSWORD` y `TALLER_DB_ROOT_PASSWORD` con valores secretos propios. Luego ejecuta `docker compose up --build -d` y aplica las migraciones con `docker compose exec api php artisan migrate --force`.

En EasyPanel, conecta este repositorio como aplicación Docker Compose usando `compose.yaml`, configura esas cuatro variables en el panel y dirige el dominio al servicio `web`, puerto `80`. Conserva los volúmenes `taller_mysql` y `taller_storage` al actualizar. No publiques directamente MySQL, Laravel ni el servicio geométrico.

**Estado de esta entrega:** el contenedor compila y sirve la interfaz, pero aún no es un cotizador de producción completo. Los borradores siguen en el navegador y el endpoint de previsualización de costos está restringido al modo local; la UI todavía no inicia sesión ni sincroniza cotizaciones con MySQL. No uses esta entrega para emitir precios comerciales hasta terminar esa integración. Docker no está instalado en el equipo de desarrollo de esta sesión, por lo que la imagen Docker no se pudo construir aquí; sí se verificó la compilación de la SPA con `npm run build`.

Las rutas privadas de `/api/v1` requieren Sanctum y rol propietario. La SPA integrada deberá obtener `/sanctum/csrf-cookie` y enviar `X-XSRF-TOKEN` al escribir. **La interfaz local aún no inicia sesión ni sincroniza con la API:** esa integración corresponde a la siguiente entrega. Para servir geometría en esa integración, usar `VITE_GEOMETRY_URL=/api/v1/designs` y adaptar la llamada al endpoint `/api/v1/designs/analyze`.

## Verificación

```sh
npm run typecheck
npm test
npm run contracts:check
npm run build
npm run api -- test --compact tests/Unit/CostingTest.php tests/Feature/WorkshopApiTest.php
```

Las pruebas PHP usan SQLite en memoria exclusivamente como base de prueba. La configuración del producto sigue siendo MySQL; el comportamiento del motor MySQL aún debe verificarse cuando esté disponible.

## Límites de esta entrega

- SVG: medidas preliminares de curvas, áreas, transformaciones, unidades, operaciones y detección de abiertos/duplicados. Formas superpuestas, texto vivo, SVG anidados, máscaras, referencias `use`, imágenes y estilos CSS complejos requieren revisión o conversión. Área de arcos evaluada numéricamente; aún falta calibración con el corpus real del taller.
- La longitud de corte es geométrica y todavía no incluye la compensación de kerf ni las líneas para fabricar las tiras. No confundirla con el recorrido de un plan completo de producción.
- No hay solver de nesting integrado, segmentación de uniones, consumo de vinil ni inventario operativo de retales. El área de planchas muestra un estado pendiente explícito.
- Los servicios económicos de corte y margen tienen pruebas unitarias, pero no constituyen aún una receta completa ni producen precios en pantalla.
- PDF, cotizaciones aprobadas, revisión inmutable y sincronización MySQL se incorporarán por etapas.

Consulta [las decisiones confirmadas](docs/decisiones-confirmadas.md) y [los criterios de esta entrega](docs/entrega-01.md).

## Costos y mano de obra

En **Configuración → Costos y mano de obra**, registra operaciones y tarifa por hora, margen sobre venta, impuesto, mínimo comercial e indirectos fijos por trabajo. No hay importes precargados: un campo vacío bloquea el precio; un cero debe ser intencional. Guarda las tarifas antes de volver al cotizador.

En **Cotizador → Costos**, confirma el material asignado por variante (cantidad de planchas completas/equivalentes o importe manual con motivo), añade los recorridos por perfil de corte y sus metros totales, confirma que incluyen frentes/fondos/tiras, introduce tiempos por operación y el costo de vinil. El total y su desglose se recalculan en Laravel. Los mínimos de corte y preparación se aplican una sola vez por perfil; la mano de obra usa minutos × tarifa/hora ÷ 60 y su factor individual.

`npm run dev` inicia ahora Laravel, geometría y Vite. La ruta de cálculo `/local/cost-preview` es una vista previa sin persistencia, disponible únicamente con `APP_ENV=local` y solicitudes de loopback. No lee ni escribe datos del propietario y no se registra en producción. Las tarifas aún se conservan en el navegador; el acceso productivo requerirá la integración autenticada con MySQL.

El precio mostrado corresponde a **asignaciones manuales confirmadas**, no a un nesting calculado. Todavía están pendientes el cálculo automático de planchas/vinil y el PDF comercial con aprobación.
