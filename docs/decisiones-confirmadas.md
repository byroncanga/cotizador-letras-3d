# Decisiones confirmadas · 20 de octubre de 2026

Fuente: `project.md` y respuestas del propietario en las rondas 1–16. El mensaje «implementemos» autoriza comenzar el desarrollo modular. No implica dar por aceptadas etapas todavía no verificadas.

## Cambios que prevalecen sobre el documento original

- El corte de máquina se cobra por metro lineal, con tarifa por máquina, material y espesor. Preparación aparte y mínimo operativo como piso; sin cargo horario adicional por el mismo corte.
- La duración de máquina se excluye de la primera fase. La mano de obra sí usa tiempos por operación y admite tiempos reales opcionales.
- Illustrator es solo referencia visual. No se exige comparación con su medición ni existe un SVG original de la captura.
- Los cantos se forman mediante calentamiento y doblado manual. No se configura radio mínimo ni se bloquean contornos por radio.
- El plano de Fase 1 se inspecciona, selecciona y amplía, sin mover piezas manualmente.
- Confirmación adicional durante la implementación: las tiras conservan los dos bordes originales de la plancha de 1200 mm. No se recortan extremos; su largo permanece en 1200 mm. Los márgenes del resto de piezas no deben acortar estas tiras. El optimizador deberá modelar explícitamente los bordes originales, las separaciones y los cortes que sí se realizan.

## Fabricación y geometría

- Materiales independientes para frente, fondo y cantos.
- Planchas configurables, habitual 1200 × 2400 mm; profundidad configurable, habitual 50 mm.
- Tiras de 1200 mm, sobre el lado de 1200 mm; ancho igual a profundidad. Nunca se giran para producir tiras de 2400 mm.
- Frentes con giro de 90° salvo material direccional.
- Kerf y separación por perfil de máquina/material/espesor; margen por presentación de plancha.
- Texto convertido a contornos; capas/colores asignados a operaciones. Elementos no clasificados requieren revisión.
- Geometría cerrada para cantos; trazos abiertos separados y revisables. Recorrido de corte, contorno geométrico y longitud de canto son cantidades distintas.
- Duplicados se señalan sin borrarlos ni cobrarlos automáticamente dos veces.
- Conservar unidades físicas y transformaciones. Escala ambigua exige confirmar una dimensión manteniendo proporción.
- Precisión interna conservada; presentación de mm con 3 decimales y metros con 6.
- Uniones sugeridas por longitud fabricable y geometría, preferentemente rectas/menos visibles, siempre confirmadas por el operador. Tipo y pérdida configurables.
- Vinil obligatorio en cantos. Ancho = profundidad + margen de aplicación configurado. Su cambio de color no altera geometría de acrílico.

## Nesting y retales

- Plano derivado del resultado real, con frentes y tiras combinados solo cuando la variante y restricciones coinciden.
- Primero retales confirmados y compatibles, después minimizar adquisición de material nuevo y desperdicio. Con igual cantidad de planchas, preferir sobrantes más reutilizables.
- No entregar layouts superpuestos o fuera de restricciones. Explicar los impedimentos y alternativas.
- Sobrantes lineales <300 mm se descartan; umbral configurable. Los irregulares conservan contorno real y no se evalúan solo por área o rectángulo envolvente.
- Solo ingresan a inventario tras confirmar material, geometría, condición y ubicación física. Conservar origen y costo, asignando consumo una sola vez.

## Economía y documentos

- Proveedor preferido con alternativas, fechas e historial; copias de precios en cada cotización.
- Consumo físico, adquisición, costo asignado, desperdicio y retales por separado. Cobro proporcional/plancha completa/ajuste autorizado por cotización; motivo obligatorio para ajuste manual.
- Mano de obra por operación y tiempo de preparación/ejecución; complejidad solo en operaciones afectadas. Tiempos reales opcionales, sin recalibración automática.
- Margen predeterminado por receta, ajustable por propietario. Precio = costo / (1−margen). Mínimos operativos en costo, comerciales después del margen. Impuestos configurables por separado.
- PDF comercial sin proveedores, costos internos, margen o desperdicio. Vigencia predeterminada configurable y modificable por cotización.
- Borradores automáticos, revisión congelada al aprobar. Pendientes críticos bloquean aprobación/PDF final.

## UI y despliegue

- Marfil claro, grafito, verde azulado. Barra lateral compacta. Parámetros izquierdos, visor central y resumen derecho; paneles plegables.
- Precio/margen/estado primero y desglose expandible. Catálogos con búsqueda/filtros y edición lateral.
- Flujo: proyecto/cliente → SVG → receta/materiales → uniones/plano → costos → PDF.
- Colores semánticos y leyenda en plano. Recalcular de inmediato en segundo plano y descartar respuestas obsoletas.
- Móvil para consulta; escritorio/tableta para edición completa.
- Propietario administrador con sesión, instalación local y preparación para servidor. API pública, otros productos y 3D en fases posteriores.
- React/Vite/TypeScript/Tailwind; Laravel/MySQL. Economía exclusivamente en servidor; contratos compartidos. Three.js/R3F se incorporará en su fase.
