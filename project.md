# MASTER SPEC — Sistema Profesional de Cotización de Letreros Publicitarios

> **Implementación autorizada el 20 de octubre de 2026.** Esta especificación conserva su texto de origen. Las decisiones posteriores aprobadas por el propietario se registran en [docs/decisiones-confirmadas.md](docs/decisiones-confirmadas.md) y prevalecen donde difieran: tarifa de corte por metro, exclusión de duración de máquina, captura de Illustrator referencial, doblado manual sin radio mínimo, entre otras. El alcance implementado y sus límites constan en [docs/entrega-01.md](docs/entrega-01.md).

**Versión:** 1.0 — Especificación maestra consolidada  
**Estado:** Planificación aprobada a nivel de requisitos; desarrollo pendiente de autorización  
**Destino:** Codex  
**Idioma de la aplicación:** Español  
**Moneda inicial:** USD  
**Unidades geométricas internas:** Milímetros (mm)  
**Entorno inicial:** Computadora local  
**Despliegue posterior:** Servidor web

---

# 1. VISIÓN GENERAL

Desarrollar una aplicación web profesional para cotizar trabajos de publicidad, principalmente letras corpóreas, cajas de luz, letreros planos, isotipos, respaldos y productos relacionados.

El sistema debe calcular costos reales de fabricación utilizando:

- Geometría vectorial del diseño.
- Área de material.
- Metros lineales de corte.
- Materiales, espesores y presentaciones.
- Aprovechamiento de planchas.
- Optimización de tiras para cantos.
- Retales reutilizables y desperdicios.
- Maquinaria y tiempos de operación.
- Mano de obra.
- Vinil adhesivo e impresión.
- Iluminación.
- Instalación.
- Gastos indirectos.
- Márgenes comerciales y precios mínimos.

El objetivo no es solamente generar precios, sino ayudar al propietario a determinar **cuánto material comprar, cómo cortarlo, cuánto se desperdicia y cuánto debe cobrar para obtener la rentabilidad deseada**.

El sistema debe ser escalable, configurable y permitir incorporar nuevos productos sin reprogramar todas las fórmulas.

## 1.1 Estrategia de producto

**Primera etapa: aplicación interna para el propietario.**

Debe mostrar todos los datos técnicos y económicos necesarios para elaborar cotizaciones.

Posteriormente podrán incorporarse empleados con permisos.

**Segunda etapa: cotizador público simplificado.**

Se integrará a una página web mediante una API segura y utilizará exactamente el mismo motor de cálculo.

El cliente podrá configurar su letrero, visualizarlo y solicitar un presupuesto, pero nunca accederá a costos internos, proveedores, desperdicios, tarifas de máquinas o márgenes.

No crear dos motores de precios independientes.

---

# 2. STACK TECNOLÓGICO

## Frontend

- React.
- Vite.
- TypeScript.
- **Tailwind CSS obligatorio.**
- Componentes reutilizables y accesibles.
- Diseño responsive.
- React Three Fiber / Three.js para el visualizador 3D.
- Biblioteca geométrica SVG especializada.
- OpenType.js o equivalente para conversión de texto a contornos.
- Gestión de estado y consultas al backend mediante soluciones mantenibles.

## Backend

- Laravel como API principal.
- PHP.
- MySQL.
- Autenticación y autorización por roles.
- Validación de entradas.
- Motor de recetas y costos ejecutado en el servidor.
- Procesamiento de archivos mediante tareas controladas.
- Generación de documentos PDF.
- Registro de auditoría.

## Desarrollo y despliegue

- Desarrollo inicial local.
- Entorno reproducible, preferentemente Docker Compose.
- Variables de entorno para credenciales y configuración.
- Migraciones y datos de prueba.
- Pruebas automatizadas.
- Preparación para despliegue posterior en servidor.

La arquitectura debe ser modular. El motor geométrico, el motor de costos y el optimizador de materiales deben tener responsabilidades separadas.

No introducir microservicios innecesarios desde el comienzo. El procesamiento pesado de archivos y nesting podrá separarse posteriormente.

---

# 3. REQUISITOS DE DISEÑO UI/UX

La aplicación debe tener una interfaz **muy profesional, moderna, limpia y orientada a productividad**.

No debe parecer un formulario administrativo antiguo ni una plantilla genérica.

## 3.1 Dirección visual

- Estilo SaaS profesional.
- Diseño moderno tipo software industrial premium.
- Excelente jerarquía visual.
- Espaciado consistente.
- Tipografía legible y moderna.
- Iconografía uniforme.
- Tarjetas discretas.
- Bordes y sombras suaves.
- Tablas profesionales.
- Formularios compactos y claros.
- Colores funcionales para estados y alertas.
- Animaciones discretas, sin efectos innecesarios.
- Modo claro como diseño inicial.
- Preparación para modo oscuro.
- Paleta visual configurable desde un sistema de diseño.

Utilizar Tailwind CSS mediante tokens y componentes reutilizables.

No dispersar valores arbitrarios de colores, espaciados y estilos por toda la aplicación.

## 3.2 Experiencia de usuario

El sistema debe priorizar la velocidad de trabajo del propietario.

- Crear cotización en pocos pasos.
- Guardado de borradores.
- Actualización de costos al modificar opciones.
- Indicadores de cálculo en proceso.
- Alertas comprensibles.
- Deshacer cambios cuando sea posible.
- Confirmación antes de acciones destructivas.
- Búsqueda y filtros en catálogos.
- Navegación clara.
- Atajos de teclado cuando aporten valor.
- Interacciones accesibles por teclado.
- Estados vacíos, errores y cargas bien diseñados.

## 3.3 Pantalla principal del cotizador

Diseño recomendado para escritorio:

**Barra superior**
- Nombre del proyecto.
- Número de cotización.
- Cliente.
- Estado.
- Guardar.
- Duplicar.
- Exportar PDF.

**Panel lateral izquierdo**
- Diseño.
- Materiales.
- Frentes.
- Fondos.
- Cantos.
- Vinil e impresión.
- Iluminación.
- Instalación.
- Parámetros de fabricación.

**Área central**
- Vista del diseño.
- Plano de aprovechamiento de planchas.
- Posteriormente visualizador 3D.
- Herramientas de selección y zoom.

**Panel derecho**
- Resumen de materiales.
- Cantidad de planchas.
- Metros lineales.
- Desperdicio.
- Tiempo de fabricación.
- Costo total.
- Margen.
- Precio de venta.

La distribución debe adaptarse a pantallas pequeñas, pero la experiencia principal estará optimizada para escritorio.

---

# 4. FAMILIAS DE PRODUCTOS

El sistema deberá soportar progresivamente:

## 4.1 Letras corpóreas

- Acrílico.
- PVC.
- Aluminio.
- Impresión 3D.
- Con iluminación.
- Sin iluminación.
- Frente, fondo y cantos configurables.
- Profundidad configurable.
- Acabados por elemento.

## 4.2 Cajas de luz

- Frente.
- Fondo.
- Estructura.
- Profundidad.
- LED.
- Fuentes.
- Controladores.
- Cableado.
- Instalación.

## 4.3 Letreros planos

- Acrílico.
- PVC.
- Aluminio compuesto.
- Vinil.
- Impresión.
- Corte y fijaciones.

## 4.4 Respaldos

- Alucobond.
- PVC.
- Otros paneles compatibles.
- Estructuras.
- Cortes.
- Pliegues.
- Fijaciones.

La estructura del catálogo debe ser:

**Familia de producto → Método constructivo → Receta → Componentes y opciones compatibles.**

No crear fórmulas rígidas independientes para cada producto.

---

# 5. CATÁLOGO DE MATERIALES

Debe existir un catálogo centralizado.

Un mismo material podrá utilizarse para frentes, fondos, cantos y operaciones de corte.

## 5.1 Información del material

- Identificador.
- Nombre.
- Familia.
- Descripción.
- Color.
- Espesor.
- Acabado.
- Unidad de medida.
- Estado.
- Compatibilidad con procesos.
- Observaciones técnicas.

## 5.2 Presentaciones comerciales

Cada variante podrá tener distintas presentaciones:

- Ancho.
- Largo.
- Espesor.
- Unidad.
- Precio.
- Proveedor.
- Fecha de actualización.
- Disponibilidad.

**Presentación inicial habitual: 1200 × 2400 mm.**

Las dimensiones no deben estar codificadas de forma fija.

Los espesores serán completamente configurables.

## 5.3 Proveedores

- Varios proveedores por material.
- Precio de cada proveedor.
- Proveedor preferido.
- Historial de precios.
- Fecha de actualización.
- Disponibilidad.
- Alternativas compatibles.

Cambiar un costo afectará las cotizaciones nuevas, nunca los valores históricos congelados.

---

# 6. CATÁLOGO DE MAQUINARIA

Registrar las máquinas del taller.

Tipos previstos:

- Láser CO₂.
- Router CNC.
- Plotter de corte.
- Impresora UV.
- Equipos de doblado.
- Impresoras 3D.
- Otros equipos configurables.

## 6.1 Datos de máquina

- Nombre.
- Tipo.
- Área útil.
- Tarifa horaria.
- Costos operativos.
- Depreciación.
- Mantenimiento.
- Energía.
- Tiempo de preparación.
- Capacidad.
- Estado.

## 6.2 Perfiles de corte

El **kerf será configurable por máquina, material y espesor**.

Cada perfil debe incluir:

- Máquina.
- Material.
- Espesor.
- Velocidad efectiva.
- Kerf.
- Número de pasadas, si corresponde.
- Tiempo de preparación.
- Restricciones.
- Vigencia de calibración.

No utilizar una velocidad universal para todos los materiales.

El cálculo de tiempo debe contemplar recorridos de corte, preparación y operaciones auxiliares.

Evitar duplicar costos de energía, mano de obra o depreciación.

---

# 7. ANALIZADOR VECTORIAL

Esta es una funcionalidad esencial.

Debe permitir importar diseños y obtener mediciones similares a las mostradas por Adobe Illustrator en Información del documento.

## 7.1 Formatos

**Soporte geométrico prioritario:**
- SVG.

**Soporte posterior:**
- PDF vectorial.
- AI.
- EPS.

PDF, AI y EPS podrán requerir conversión.

Si un archivo no puede medirse correctamente, mostrar una vista previa cuando sea posible y solicitar revisión técnica.

No generar un precio definitivo automático basado en geometría no validada.

## 7.2 Datos que debe calcular

- Ancho.
- Alto.
- Área geométrica.
- Perímetro exterior.
- Perímetro interior.
- Metros lineales totales.
- Número de piezas.
- Número de contornos.
- Huecos.
- Trazados abiertos.
- Trazados duplicados.
- Complejidad.
- Escala.
- Transformaciones.

## 7.3 Ejemplo real de referencia

El propietario mostró una letra E en Illustrator cuya longitud de trazado es:

**435,494 mm = 0,435494 metros lineales.**

Cuando se disponga del SVG original, utilizarlo como caso de prueba.

La medición deberá coincidir con Illustrator dentro de una tolerancia acordada, siempre que la escala y los contornos sean equivalentes.

## 7.4 Reglas geométricas

- Todas las dimensiones internas en milímetros.
- Interpretar curvas Bézier.
- Respetar transformaciones.
- Detectar contornos interiores.
- Distinguir corte, grabado y marcado.
- No sumar contornos duplicados indiscriminadamente.
- Detectar unidades ambiguas.
- Permitir confirmar dimensiones.
- No ejecutar scripts contenidos en SVG.
- Limitar tamaño y complejidad de archivos.

**Importante:** distinguir tres conceptos:

1. Perímetro geométrico.
2. Recorrido real de máquina.
3. Longitud de cantos a fabricar.

No siempre serán iguales.

---

# 8. FABRICACIÓN DE CANTOS DE LETRAS CORPÓREAS

Esta sección representa el método real del taller y debe respetarse rigurosamente.

## 8.1 Método de fabricación confirmado

- Las letras normalmente tienen 50 mm de profundidad.
- La profundidad debe ser configurable.
- Los cantos se fabrican cortando tiras de acrílico.
- Las tiras se doblan para seguir los contornos.
- Se realizan uniones cuando es necesario.
- Las uniones serán sugeridas por el sistema y confirmadas por el operador.

## 8.2 Orientación de las tiras

Para una plancha de **1200 × 2400 mm**:

**Cada tira debe tener 1200 mm de largo.**

El ancho de cada tira corresponde a la profundidad de la letra, normalmente 50 mm.

Las tiras se obtienen dividiendo progresivamente la dimensión de 2400 mm.

**NO orientar las tiras para que midan 2400 mm de largo.**

Esta regla fue corregida expresamente durante la planificación y es obligatoria para la receta inicial.

## 8.3 Cálculo de cantidad de tiras

Considerar:

- Largo útil de 1200 mm.
- Ancho de tira según profundidad.
- Kerf del perfil de máquina.
- Márgenes de plancha.
- Separaciones.
- Defectos o restricciones.
- Cantidad de tiras necesarias.

El sistema debe calcular la capacidad real, no asumir automáticamente 48 tiras.

## 8.4 Tramos de cantos

El motor debe analizar cada contorno y determinar tramos fabricables.

No dividir arbitrariamente un contorno solo para mejorar el aprovechamiento.

Sugerir puntos de unión técnicamente razonables, preferentemente en zonas rectas o menos visibles.

Permitir que el operador:

- Confirme uniones.
- Cambie puntos.
- Agregue uniones.
- Elimine sugerencias.
- Revise la distribución resultante.

La longitud máxima de un tramo será determinada por la tira disponible y las reglas constructivas.

Las tolerancias y pérdidas de unión serán configurables.

## 8.5 Política de retales

**Regla confirmada:**

- Sobrante de 300 mm o más: reutilizable.
- Sobrante inferior a 300 mm: desperdicio.

La longitud mínima reutilizable debe ser configurable en administración, con 300 mm como valor inicial.

Los retales deben guardar:

- Material.
- Espesor.
- Color.
- Largo.
- Ancho.
- Origen.
- Disponibilidad.

El algoritmo debe intentar aprovechar retales compatibles cuando sea viable.

No considerar que todos los sobrantes tienen el mismo valor o utilidad.

---

# 9. VINIL OBLIGATORIO EN CANTOS

Las tiras de acrílico utilizadas para cantos deberán revestirse con vinil adhesivo del color elegido por el cliente.

Este acabado forma parte de la receta de fabricación y no debe confundirse con vinil decorativo opcional en los frentes.

## 9.1 Configuración

- Catálogo de viniles.
- Color.
- Tipo.
- Ancho de rollo.
- Longitud.
- Precio.
- Proveedor.
- Disponibilidad.
- Compatibilidad.

## 9.2 Consumo

El ancho necesario de vinil será:

**Profundidad del canto + margen configurable de aplicación.**

El sistema calculará:

- Longitud a revestir.
- Ancho necesario.
- Distribución en el rollo.
- Desperdicio.
- Costo del vinil.
- Tiempo de aplicación.
- Consumibles.

El margen de aplicación debe poder variar según el proceso.

Cambiar el color de vinil debe actualizar su precio sin modificar la geometría del acrílico.

---

# 10. APROVECHAMIENTO DE PLANCHAS Y NESTING

Esta funcionalidad debe estar presente desde la primera etapa interna.

El propietario quiere ver un dibujo de cómo se aprovechan las planchas, mostrando frentes, tiras y sobrantes.

## 10.1 Objetivo

Calcular y representar gráficamente:

- Cuántas planchas se necesitan.
- Qué piezas se cortan de cada plancha.
- Cómo se distribuyen los frentes.
- Cómo se distribuyen las tiras de cantos.
- Cuánto material se utiliza.
- Cuánto se desperdicia.
- Qué retales quedan disponibles.
- Porcentaje de aprovechamiento.

## 10.2 Nesting combinado

Cuando el frente y los cantos utilizan la misma variante de material y es técnicamente posible, el sistema debe intentar distribuirlos en una misma plancha.

No asignar automáticamente una plancha a frentes y otra a cantos.

El optimizador deberá combinar:

- Nesting 2D de frentes y fondos compatibles.
- Reservas de franjas para tiras de 1200 mm.
- Optimización 1D de los tramos de cantos.
- Márgenes.
- Kerf.
- Restricciones de orientación.
- Retales disponibles.

**El plano debe derivarse del cálculo real, no ser una ilustración inventada.**

## 10.3 Plano visual obligatorio

Mostrar una vista por plancha.

Cada plano deberá incluir:

- Número de plancha.
- Material.
- Espesor.
- Color.
- Dimensiones.
- Piezas dibujadas a escala.
- Etiquetas de piezas.
- Tiras.
- Zonas libres.
- Retales.
- Desperdicio.
- Porcentaje de aprovechamiento.

Las piezas deben poder seleccionarse para ver sus propiedades.

La interfaz debe permitir zoom y navegación entre planchas.

La reorganización manual de piezas queda como una capacidad deseada; su inclusión en la primera entrega deberá evaluarse por complejidad. La visualización automática correcta sí es obligatoria.

## 10.4 Política de cobro de planchas

El administrador podrá seleccionar por cotización:

1. Cobro proporcional del material utilizado.
2. Cobro de plancha completa.
3. Asignación manual autorizada.

Guardar por separado:

- Consumo físico.
- Costo de adquisición.
- Costo asignado al proyecto.
- Desperdicio.
- Retales reutilizables.

Toda modificación manual debe registrar responsable y motivo.

---

# 11. RECETAS DE PRODUCCIÓN

Las recetas deben ser configurables y versionadas.

Cada receta contendrá:

- Familia de producto.
- Método constructivo.
- Materiales obligatorios.
- Materiales opcionales.
- Operaciones.
- Máquinas.
- Tiempos estándar.
- Factores de complejidad.
- Desperdicios.
- Consumibles.
- Restricciones.
- Mínimos.
- Reglas comerciales.

## 11.1 Primera receta obligatoria

**Letra corpórea de acrílico con cantos forrados.**

Componentes:

1. Frente de acrílico.
2. Fondo configurable.
3. Cantos de acrílico.
4. Tiras y uniones.
5. Vinil de cantos.
6. Corte láser.
7. Doblado.
8. Pegado.
9. Armado.
10. Consumibles.
11. Mano de obra.
12. Costos indirectos.
13. Margen.
14. Precio mínimo.

La iluminación deberá estar contemplada como componente opcional del modelo, aunque su implementación completa puede quedar para una etapa posterior.

---

# 12. MANO DE OBRA

Se utilizarán tiempos estándar por proceso, ajustables según complejidad.

Cada operación tendrá:

- Tiempo de preparación.
- Tiempo por unidad.
- Unidad de medida.
- Tarifa de operario.
- Factor de complejidad.
- Tiempo real opcional para calibración.

Operaciones previstas:

- Preparación de archivo.
- Preparación de máquina.
- Corte.
- Doblado.
- Pegado.
- Armado.
- Aplicación de vinil.
- Instalación de LED.
- Cableado.
- Pruebas.
- Limpieza.
- Empaque.

No aplicar un factor general de complejidad a operaciones que no estén afectadas.

Distinguir tiempo de máquina y tiempo humano para evitar doble cobro.

---

# 13. MOTOR DE PRECIOS

## 13.1 Costos directos

Incluir:

- Materiales.
- Maquinaria.
- Mano de obra.
- Iluminación.
- Acabados.
- Instalación.
- Consumibles.

## 13.2 Costos indirectos

Asignar gastos indirectos mediante reglas configurables.

Evitar duplicaciones con tarifas de maquinaria o mano de obra.

## 13.3 Margen

Utilizar margen sobre precio de venta, no confundirlo con recargo sobre costo.

Fórmula principal:

**Precio = Costo total / (1 − margen objetivo)**

El margen se expresa como fracción entre 0 y 1.

## 13.4 Precios mínimos

Configurar mínimos:

- Por producto.
- Por operación.
- Por preparación de máquina.
- Por trabajo.

Los mínimos de costo operativo se aplicarán en la etapa de costos; los mínimos comerciales se aplicarán sobre el precio de venta.

## 13.5 Impuestos

- Configurables.
- Aplicados según las reglas fiscales correspondientes.
- No codificar una tasa fija permanente.

## 13.6 Versionado

Cada cotización conservará:

- Costos utilizados.
- Tarifas de máquinas.
- Recetas.
- Margen.
- Precios de proveedores.
- Impuestos.
- Ajustes manuales.
- Fecha y versión.

Actualizar un catálogo nunca debe alterar una cotización histórica.

---

# 14. ILUMINACIÓN

La decisión comercial confirmada es **calcular la iluminación mediante tarifa por metro cuadrado**.

Tarifas independientes para:

- LED blanco.
- LED cálido.
- RGB.
- RGB direccionable.

Agregar:

- Costo mínimo.
- Accesorios no incluidos en tarifa.
- Fuentes.
- Controladores.
- Cableado.
- Validaciones técnicas.

La tarifa por m² debe indicar explícitamente qué componentes incluye.

La simulación visual LED no reemplaza la validación eléctrica.

---

# 15. VINIL E IMPRESIÓN DECORATIVA POR ELEMENTO

Funcionalidad prevista para etapas posteriores.

El cliente o el operador podrá seleccionar elementos individuales del diseño:

- Una letra.
- Varias letras.
- Isotipo.
- Símbolo.
- Respaldo.
- Otras piezas.

La selección debe funcionar:

1. Directamente sobre el diseño.
2. Desde una lista de elementos.

Acabados previstos:

- Sin acabado adicional.
- Vinil de color.
- Vinil impreso.
- Vinil translúcido.
- Impresión UV directa.

El costo debe contemplar:

- Material.
- Impresión.
- Corte de contorno.
- Aplicación.
- Desperdicio.
- Preparación.

No cobrar tinta cuando se utiliza vinil sólido sin impresión.

Los acabados se asignarán por elemento y superficie cuando la receta lo permita.

---

# 16. VISUALIZADOR 3D

Funcionalidad posterior, pero prevista desde la arquitectura inicial.

Utilizar Three.js o React Three Fiber.

Capacidades:

- Rotación.
- Zoom.
- Vista frontal.
- Vista lateral.
- Vista en perspectiva.
- Profundidad real.
- Materiales diferenciados.
- Frente, cantos y fondo.
- Colores.
- Vinil e impresión.
- Respaldo.
- Iluminación simulada.
- Encendido y apagado de LED.
- Actualización al cambiar opciones.

El visualizador será una representación comercial aproximada, no una simulación fotométrica certificada.

**Regla esencial:** el visor 3D y el motor de costos deben utilizar el mismo modelo geométrico normalizado.

No construir dos geometrías independientes.

---

# 17. IMPRESIÓN 3D

Se contempla una familia de letras fabricadas mediante impresión FDM.

Costos previstos:

- Filamento.
- Peso estimado.
- Tiempo de impresión.
- Energía.
- Desgaste.
- Posprocesado.
- Fallos estimados.
- Tapas.
- Iluminación.
- Mano de obra.

La estimación inicial utilizará perfiles calibrados.

Posteriormente se podrán importar datos del laminador.

No intentar construir un laminador completo dentro del cotizador.

---

# 18. INSTALACIÓN

La instalación se cotizará como servicio independiente.

Variables:

- Técnicos.
- Horas.
- Transporte.
- Distancia.
- Altura.
- Escaleras.
- Elevadores.
- Herramientas.
- Fijaciones.
- Consumibles.
- Complejidad.
- Permisos cuando correspondan.

Trabajos especiales o en altura podrán exigir revisión técnica antes de aprobar el precio.

---

# 19. PROYECTOS Y COTIZACIONES

La primera versión será para uso interno del propietario.

## 19.1 Funcionalidades

- Crear proyecto.
- Guardar borrador.
- Editar proyecto.
- Duplicar proyecto.
- Asignar cliente.
- Registrar descripción.
- Adjuntar diseños.
- Seleccionar receta.
- Calcular costos.
- Visualizar planchas.
- Ajustar margen.
- Registrar observaciones.
- Generar cotización PDF.
- Consultar historial.
- Revisar versiones.

## 19.2 Estados

- Borrador.
- En cálculo.
- Requiere revisión.
- Cotizado.
- Enviado.
- Aceptado.
- Rechazado.
- Vencido.

## 19.3 PDF comercial

Debe incluir:

- Datos del negocio.
- Datos del cliente.
- Número de cotización.
- Fecha.
- Descripción del trabajo.
- Materiales y acabados comerciales.
- Dimensiones.
- Cantidad.
- Precio.
- Impuestos.
- Total.
- Condiciones.
- Vigencia.

No mostrar proveedores, costos internos, márgenes ni desperdicios al cliente.

Posteriormente podrán generarse hojas técnicas internas de producción.

---

# 20. USUARIOS Y PERMISOS

## Primera etapa

Un propietario administrador con acceso completo.

## Etapas posteriores

**Vendedor:**
- Crear cotizaciones.
- Consultar precios autorizados.
- Revisar proyectos.
- Confirmar uniones.
- Generar documentos.

**Administrador:**
- Modificar costos.
- Gestionar proveedores.
- Modificar recetas.
- Cambiar márgenes.
- Autorizar excepciones.
- Aprobar ajustes manuales.

**Cliente público:**
- Configurar.
- Visualizar.
- Obtener estimación.
- Solicitar cotización.

El cliente público no requerirá registro para configurar un producto, pero deberá proporcionar datos de contacto para enviar una solicitud.

---

# 21. FUTURA API PÚBLICA

La futura web utilizará el mismo backend y las mismas reglas de costos.

Debe permitir:

- Consultar productos disponibles.
- Consultar opciones comerciales.
- Enviar dimensiones.
- Enviar diseños compatibles.
- Solicitar estimación.
- Guardar solicitud.
- Obtener estado.

Debe proteger:

- Costos.
- Proveedores.
- Tarifas internas.
- Márgenes.
- Reglas administrativas.
- Información privada.

Aplicar autenticación cuando corresponda, límites de solicitudes y validación en servidor.

Nunca confiar en precios enviados por el navegador.

---

# 22. SEGURIDAD Y CALIDAD

- Validación de archivos.
- Saneamiento de SVG.
- Conversión de documentos en procesos aislados.
- Límites de tamaño.
- Límites de complejidad geométrica.
- Protección contra archivos maliciosos.
- Autorización por rol.
- Auditoría de cambios.
- Protección de credenciales.
- Copias de seguridad.
- Cálculos monetarios decimales.
- Pruebas automatizadas.
- Manejo claro de errores.
- Rendimiento adecuado con diseños complejos.

---

# 23. PRUEBAS OBLIGATORIAS

## Geometría

- Rectángulo de 100 × 50 mm: perímetro 300 mm.
- Área del mismo rectángulo: 5000 mm².
- Los huecos interiores restan área.
- Los huecos que requieren corte suman recorrido.
- Respetar escala y transformaciones.
- Comparar la letra E de Illustrator con su SVG original.

## Cantos

- Tiras orientadas sobre el lado de 1200 mm.
- Profundidad configurable.
- Kerf según máquina/material/espesor.
- Retales inferiores a 300 mm descartados.
- Retales de 300 mm o más identificados como aprovechables.
- Uniones revisables por operador.
- Desperdicio correctamente registrado.

## Vinil

- Cambio de color modifica el costo correspondiente.
- Margen de aplicación configurable.
- Consumo según dimensiones del rollo.
- Mano de obra de aplicación independiente.

## Planchas

- Piezas dibujadas a escala.
- No permitir superposiciones.
- Respetar márgenes y kerf.
- Mostrar cantidad de planchas.
- Mostrar aprovechamiento.
- Mostrar retales.
- Mostrar desperdicio.
- Coincidencia entre plano y desglose de materiales.

## Precios

- Aplicar márgenes correctamente.
- Respetar mínimos.
- No duplicar costos.
- Guardar versiones.
- No modificar cotizaciones históricas.
- Separar costo interno y precio comercial.

---

# 24. ETAPAS DE DESARROLLO

## Fase 1 — Cotizador interno de letras acrílicas

Prioridad máxima.

Entregables:

1. Base del proyecto.
2. Diseño UI/UX profesional con Tailwind.
3. Panel administrativo.
4. Catálogo de materiales.
5. Proveedores.
6. Maquinaria.
7. Perfiles de corte.
8. Analizador SVG.
9. Cálculo de áreas y perímetros.
10. Motor de cantos.
11. Optimización de tiras.
12. Política de retales.
13. Vinil de cantos.
14. Receta de letras corpóreas.
15. Plano visual de aprovechamiento.
16. Costos y márgenes.
17. Gestión de proyectos.
18. Cotización PDF.
19. Pruebas con casos reales.

## Fase 2 — Ampliación de productos

- Cajas de luz.
- Letreros planos.
- Respaldos.
- Nuevos materiales.
- Más recetas.
- Instalación.
- Iluminación completa.

## Fase 3 — Visualización y acabados

- Visor 3D.
- Materiales visuales.
- Simulación LED.
- Selección por elemento.
- Vinil decorativo.
- Impresión UV.

## Fase 4 — Formatos y optimización avanzada

- PDF vectorial.
- AI.
- EPS.
- Conversión segura.
- Nesting avanzado.
- Edición manual del plano.
- Gestión avanzada de retales.
- Impresión 3D y datos de laminadores.

## Fase 5 — Cotizador público

- Interfaz simplificada.
- API pública segura.
- Estimación comercial.
- Solicitudes de clientes.
- Integración con página web.
- Sin exposición de costos internos.

Las fases posteriores no deben impedir diseñar desde el inicio una arquitectura extensible.

---

# 25. DECISIONES PENDIENTES Y CONFIGURABLES

No inventar estos datos:

- Precios reales de planchas.
- Proveedores reales.
- Espesores disponibles.
- Máquinas existentes.
- Velocidades.
- Kerf.
- Márgenes de seguridad.
- Tolerancias de doblado.
- Longitud mínima de segmento.
- Pérdidas de unión.
- Tarifas de mano de obra.
- Costos indirectos.
- Márgenes comerciales.
- Precios mínimos.
- Presentaciones de vinil.
- Márgenes de aplicación.
- Tarifas LED.
- Datos fiscales y comerciales del negocio.

Crear campos configurables y utilizar datos ficticios claramente identificados durante las pruebas.

---

# 26. INSTRUCCIONES OBLIGATORIAS PARA CODEX

1. Leer esta especificación completa antes de proponer cambios.
2. No empezar a programar sin autorización explícita.
3. Primero revisar contradicciones, riesgos y dependencias.
4. Proponer arquitectura y estructura de carpetas.
5. Proponer modelo de datos.
6. Definir contratos entre motor geométrico, optimizador y motor de costos.
7. Diseñar primero el sistema visual de la aplicación.
8. Utilizar Tailwind CSS y TypeScript en el frontend.
9. Priorizar código modular, mantenible y comprobable.
10. No implementar todas las fases simultáneamente.
11. Dividir el trabajo en tareas pequeñas verificables.
12. Crear pruebas para cálculos geométricos y económicos.
13. No inventar precios ni reglas técnicas.
14. Consultar decisiones ambiguas antes de implementar.
15. Mantener el cálculo económico en el servidor.
16. No duplicar lógica de cotización entre frontend y backend.
17. No presentar planos ilustrativos como resultados reales de nesting.
18. No dar por terminada una funcionalidad sin verificar sus criterios de aceptación.
19. Conservar esta especificación como fuente principal de requisitos.
20. Registrar las decisiones nuevas y los cambios aprobados.

---

# 27. PRIMERA TAREA SOLICITADA A CODEX

**No escribir código todavía.**

Analiza esta especificación y entrega:

1. Evaluación de viabilidad.
2. Contradicciones o vacíos técnicos.
3. Arquitectura recomendada.
4. Modelo de datos inicial.
5. Estructura de carpetas.
6. Diseño conceptual de las pantallas principales.
7. Propuesta de sistema de diseño UI/UX con Tailwind.
8. Librerías recomendadas para SVG, geometría y nesting.
9. Estrategia de pruebas.
10. Plan detallado de implementación de la Fase 1.
11. Riesgos y decisiones que requieren confirmación.
12. Criterios de aceptación por módulo.

**Esperar autorización expresa del propietario antes de crear archivos, instalar dependencias o programar.**

---

# 28. PRINCIPIO FUNDAMENTAL DEL PROYECTO

El sistema debe ser capaz de responder con precisión:

**¿Qué voy a fabricar?**

**¿Qué materiales necesito?**

**¿Cuántas planchas voy a utilizar?**

**¿Cómo debo cortarlas?**

**¿Cuánto acrílico necesito para los frentes y los cantos?**

**¿Cuánto material puedo aprovechar?**

**¿Cuánto voy a desperdiciar?**

**¿Cuánto vinil necesito?**

**¿Cuánto tiempo tardará la fabricación?**

**¿Cuánto me costará producirlo?**

**¿Cuánto debo cobrar para obtener el margen deseado?**

Y debe mostrar estas respuestas mediante una interfaz profesional, un plano de aprovechamiento comprensible y una cotización comercial lista para entregar al cliente.

**FIN DE LA ESPECIFICACIÓN MAESTRA.**
