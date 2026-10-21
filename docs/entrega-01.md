# Entrega 01 · Base de trabajo

## Implementado

- React/Vite/TypeScript y Tailwind con tokens de color y componentes accesibles reutilizables.
- Cotizador de tres paneles, flujo por etapas, selección de elemento, zoom/pan y vista de ejemplo claramente identificada.
- Borradores locales: crear, duplicar, abrir, eliminar con confirmación, autoguardar y descargar/restaurar copia JSON.
- Alta y edición local de variantes/presentaciones, proveedores y perfiles de corte sin precargar costos ni calibraciones.
- Analizador en worker de servidor: unidades/viewBox, transformaciones, curvas, longitud por operación, abiertos, duplicados, áreas con huecos y bloqueo de elementos no soportados. Solicitud cancelable y límite de tamaño/complejidad/tiempo.
- Laravel oficial con Sanctum, acceso de propietario, migraciones, API de catálogos, historial de precio, auditoría, fuentes SVG privadas y borradores que no aceptan precios ni aprobación enviados por el navegador.
- Funciones económicas decimales en PHP para costo de corte, mínimo operativo, margen, mínimo comercial e impuesto. No están conectadas a una receta comercial completa.
- Contratos Zod/TypeScript exportados como JSON Schema y entorno Docker preparado.

## Criterios comprobables

1. El ejemplo permite seleccionar letras, ver dimensiones y longitudes reales; nunca representa un plano inventado de planchas.
2. Guardar un material sin costo conserva `null`, no un cero implícito.
3. Al recargar, el borrador conserva medidas, selección de materiales y metadatos. Los originales se guardan aparte en IndexedDB.
4. Un SVG de 100 × 50 mm produce 300 mm de perímetro y 5000 mm²; huecos descuentan área y suman recorrido.
5. Una escala ambigua pide confirmación; duplicados/abiertos y contenido no soportado generan revisión.
6. El mismo corte no recibe cobro horario adicional. Mínimo operativo es un piso; margen sobre precio de venta; mínimo comercial después del margen e impuesto separado.
7. API privada responde 401 sin sesión y 403 sin rol propietario. Un borrador ajeno no se puede editar y no se aceptan precios/estados aprobados del navegador.
8. Layout revisado visualmente en escritorio y móvil; móvil no ofrece edición completa.

## Pendiente antes de uso productivo

La UI local aún no inicia sesión ni sincroniza con Laravel/MySQL. Las pruebas de base de datos usan SQLite en memoria; no se ha ejecutado MySQL ni Docker en este equipo. No existen todavía nesting, planos de planchas calculados, optimización de cantos, confirmación de uniones, cálculo de rollo de vinil, valoración operativa de retales, receta económica completa ni PDF. Ninguna de estas funciones se presenta como terminada.

El siguiente hito es conectar sesión/almacenamiento de la SPA a Laravel y comprobar el mismo catálogo sobre MySQL. Después: afinar análisis con SVG reales y continuar con cantos y nesting, revisando cada hito con el propietario.

## Ampliación: configuración y cálculo de costos

Se completó el acceso a tarifas de mano de obra, margen, impuesto, mínimo comercial e indirectos. El cotizador captura cantidades de material confirmadas, recorridos por perfil, minutos por operación, factor individual y costo de vinil. Laravel calcula el desglose y total con decimales; el navegador no replica fórmulas económicas. Los campos faltantes y los errores de conexión se muestran con acciones para completarlos o reintentar.

Este flujo permite presupuestar con **asignación manual de material y recorridos**. No sustituye el nesting pendiente. Las tarifas permanecen locales y todavía no se emiten revisiones comerciales inmutables ni PDF. La ruta local de cálculo no existe fuera del entorno local. No se añadieron ni ejecutaron pruebas nuevas en esta ampliación.
