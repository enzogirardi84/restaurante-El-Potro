# Prompt Maestro Conectado - El Patrón Pro

Este prompt unifica todos los pedidos realizados para el sistema gastronómico: menú principal, logo, platos, bebidas, inventario, pedidos, descuento de insumos, cocina, caja, PDF, ticketera, Supabase, Streamlit y subida a GitHub.

Copiar y pegar este prompt completo cuando quieras seguir mejorando el proyecto con Codex, Gemini, AI Studio u otro asistente de programación.

```text
Actuá como arquitecto senior full-stack y especialista en software gastronómico profesional.

Proyecto:
Sistema "El Patrón Pro - Gestión Gastronómica", desarrollado con React, TypeScript, Vite, Tailwind CSS, Supabase/PostgreSQL y panel auxiliar Streamlit.

Objetivo general:
Revisar, conectar y mejorar todo el sistema para que funcione como un programa real de restaurante: desde que el mozo toma el pedido en mesa, hasta cocina, descuento automático de ingredientes, control de inventario, caja, facturación, PDF, ticketera, reportes y sincronización con Supabase.

Reglas de trabajo:
1. No eliminar funcionalidades existentes sin reemplazo claro.
2. Mantener la identidad visual "El Patrón" y el logo institucional.
3. Usar datos reales del restaurante: platos, bebidas, bodega, insumos, escandallos y mesas.
4. Mantener compatibilidad con modo offline/local y modo Supabase cloud.
5. No hardcodear claves reales ni subir secretos al repositorio.
6. Verificar con npm run lint, npm run build y pruebas básicas de Streamlit.
7. Subir los cambios al repositorio GitHub configurado cuando todo compile.

============================================================
1. IDENTIDAD VISUAL Y MENÚ PRINCIPAL
============================================================

Mejorar completamente el menú principal:
- Mostrar el logo oficial de El Patrón de forma clara en login, sidebar, home y ticket.
- Usar una estética premium gastronómica: cálida, elegante, profesional y fácil de leer.
- El primer panel debe orientar rápido al usuario: Mozo/Salón, Cocina KDS, Caja, Inventario, Menú, Recetas, Mesas, Reservas, Proveedores, Reportes, Sistema y Backups.
- Mostrar indicadores rápidos: mesas ocupadas, comandas pendientes, stock crítico, conexión Supabase y recaudación del turno.
- Evitar que sea una pantalla decorativa: debe ser un tablero operativo.
- Asegurar diseño responsive para notebooks, monitores y tablets.

============================================================
2. LOGO OFICIAL
============================================================

Integrar el logo del restaurante:
- Usar el logo "El Patrón Restaurante" con estética de caballo como marca visual.
- Permitir logo por defecto en archivos públicos y logo personalizado desde el módulo Sistema.
- Actualizar favicon, login, sidebar, home, tickets PDF y paneles principales.
- Evitar deformar el logo: usar object-fit contain y proporciones estables.
- Si el usuario carga un nuevo logo, guardarlo localmente y aplicarlo en todo el sistema.

============================================================
3. PLATOS, BEBIDAS Y CARTA COMPLETA
============================================================

Integrar todos los platos y bebidas en productos_menu, visibles en submódulos:

Categorías de comida:
- Entradas
- Pastas
- Carnes
- Pescados
- Comidas Criollas
- Postres
- Bebidas
- Bodega

Platos principales a incluir:
- Carpaccio de lomo curado
- Burrata di Andria
- Mollejas al verdeo con chardonnay
- Provoleta de campo crocante
- Empanadas cortadas a cuchillo "El Patrón"
- Rotolo di tata
- Cintas anchas en tinta de sepia
- Sorrentinos de cordero patagónico
- Ravioles de calabaza y almendras
- Gnocchis de papa andina al fierrito
- Ojo de bife con aligot de papa
- Bife de chorizo madurado 45 días
- Costillar braseado texturado
- Entraña fina grillada
- Matambrito de cerdo al verdeo
- Salmón rosado en costra de sésamo
- Abadejo al ajillo norteño
- Trucha patagónica a la manteca de almendras
- Cazuela de mariscos del Atlántico
- Filet de merluza premium a la romana
- Milanesa con guarnición Estilo Patrón
- Hamburguesa Clásica Gourmet
- Pastel de papa de lomo cortado a cuchillo
- Locro pulsudo tradicional
- Humita en cazuela de barro
- Flan casero con dulce de leche y crema
- Volcán de chocolate amargo
- Peras al Malbec Reserva
- Tiramisú de la casa
- Panqueque de dulce de leche quemado

Bebidas y bodega:
- Vinos La Rural: Trumpeter, Encuentro, Rutini
- Escorihuela Gascón: Escorihuela, Gran Reserva, Pequeñas Producciones
- Ruca Malén Capítulo 2
- Catena Zapata: Álamos, Saint Felicien, Nicasia, Padrillo, DV Catena, El Enemigo, Tikal, Angélica Zapata, Argentino, Luca
- Las Perdices: Las Perdices, Reserva, Don Juan, Exploración, Ala Colorada, Ala
- Salentein: Portillo, Reserva, Pyros, Numina, Primus
- Champagne/Espumantes: Baron B, Áluda, Encuentro, Salentein, Chandon
- Whisky, gin, fernet, aperitivos, gaseosas, agua y café

Cada producto debe tener:
- id_producto estable
- nombre
- descripcion
- precio_venta
- categoria
- subcategoria si corresponde
- tipo: plato, bebida o postre
- activo
- requiere_cocina
- tiempo_preparacion_estimado
- imagen si existe

============================================================
4. INVENTARIO, INSUMOS Y ESCANDALLOS
============================================================

Conectar cada plato con sus ingredientes mediante recetas_escandallo.

Cada insumo debe tener:
- id_insumo
- nombre
- categoria
- subcategoria
- proveedor
- stock_actual
- stock_minimo
- unidad_medida
- costo_unitario
- es_bebida_directa

Funcionamiento obligatorio:
- Al confirmar pedido, el sistema debe conocer qué productos fueron pedidos.
- Al pasar por cocina/KDS o al entregar/cerrar, debe descontar insumos según receta.
- Las bebidas directas deben descontarse por unidad sin receta compleja.
- Si un producto no tiene receta y requiere cocina, debe aparecer como alerta.
- Si falta stock, el sistema debe poder bloquear o advertir según configuración.
- Registrar cada descuento en movimientos_inventario.
- Registrar mermas manuales con motivo y usuario.
- Mostrar alertas de stock mínimo en Panel, Sistema, Inventario y Streamlit.

Flujo de stock:
1. Mozo selecciona mesa.
2. Mozo agrega platos y bebidas.
3. Se crea pedido_cabecera y pedido_detalle.
4. Cocina recibe comanda.
5. Al marcar preparado/entregado/cobrado, se descuenta stock.
6. Se registran movimientos por insumo.
7. Caja cobra y libera mesa.
8. Reportes muestran impacto de venta e inventario.

============================================================
5. MOZO, SALÓN Y PEDIDOS
============================================================

Mejorar flujo operativo:
- Selección clara de mozo activo.
- Distribución de mesas con estado: libre, ocupada, reservada, cerrando.
- Búsqueda de platos y bebidas por categoría.
- Carrito de comanda por mesa.
- Observaciones por plato y por pedido.
- Enviar pedido a cocina/KDS.
- Separar bebidas de cocina cuando corresponda.
- Evitar comandas sin mesa o sin productos.
- Mostrar total estimado de la mesa.
- Permitir agregar consumos a una mesa ya ocupada.

============================================================
6. COCINA KDS
============================================================

Mejorar monitor de cocina:
- Ver comandas pendientes, en preparación, listas y entregadas.
- Mostrar mesa, mozo, hora, demora, platos e indicaciones.
- Diferenciar cocina, bar y postres.
- Botones para iniciar preparación, marcar listo, entregar o cancelar.
- Al cancelar, reversar insumos si ya fueron descontados.
- Registrar auditoría de cada cambio.

============================================================
7. CAJA, PDF Y TICKETERA
============================================================

Mejorar módulo de caja:
- Mostrar comandas activas sin cobrar.
- Seleccionar mesa a cobrar.
- Calcular subtotal, descuentos, promociones, propina y total.
- Permitir pagos mixtos: efectivo, débito, crédito, transferencia, Mercado Pago.
- Permitir dividir cuenta por comensal o por productos.
- Emitir comprobante PDF.
- Generar ticket térmico de 80 mm.
- Preparar integración con ticketera ESC/POS.
- Si no hay ticketera física, usar fallback PDF.
- Registrar facturas, pagos y cierres de caja.
- Permitir abrir/reabrir turno fiscal y cierre diario.
- Descargar PDF de ticket y cierre.
- Guardar auditoría de caja.

Ticket debe incluir:
- Logo
- Nombre del restaurante
- Fecha y hora
- Mesa
- Mozo
- Detalle de productos
- Cantidad, precio unitario, subtotal
- Descuentos/promociones
- Medio de pago
- Total final
- Número de comprobante

============================================================
8. SUPABASE Y BASE DE DATOS
============================================================

Conectar todo con Supabase:
- Usar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para React.
- Usar SUPABASE_URL y SUPABASE_ANON_KEY para Streamlit.
- No usar ni subir claves privilegiadas.
- Mantener .env.local y .streamlit/secrets.toml ignorados por Git.
- SQL debe crear o actualizar tablas sin romper datos existentes.
- Usar DROP POLICY IF EXISTS antes de CREATE POLICY para evitar errores de políticas duplicadas.
- Activar RLS con políticas de desarrollo/demo.
- Preparar recomendaciones para producción.

Tablas principales:
- usuarios
- mesas
- insumos
- productos_menu
- recetas_escandallo
- pedidos_cabecera
- pedido_detalle
- mermas
- auditoria_eventos
- proveedores
- promociones
- reservas
- facturas
- pagos
- cierres_caja
- movimientos_inventario
- backups

============================================================
9. STREAMLIT
============================================================

Mejorar panel Streamlit:
- Conectar a Supabase con secrets.
- Mostrar conexión sin exponer claves.
- Mostrar KPIs operativos.
- Mostrar salud de tablas.
- Mostrar menú, inventario, comandas, caja, reservas y movimientos.
- Descargar CSV.
- Alertar stock crítico.
- Validar que todas las tablas respondan.
- Mantenerlo en modo lectura para seguridad.

============================================================
10. REPORTES, BI Y BACKUPS
============================================================

Agregar o mejorar:
- Ventas por categoría.
- Productos más vendidos.
- Stock crítico.
- Merma acumulada.
- Facturación por medio de pago.
- Ocupación de mesas.
- Tiempos de cocina.
- Backups JSON/CSV descargables.
- Copia de seguridad en Supabase.

============================================================
11. VALIDACIÓN FINAL
============================================================

Antes de terminar:
- Revisar errores TypeScript.
- Ejecutar npm run lint.
- Ejecutar npm run build.
- Ejecutar npm audit --audit-level=high.
- Ejecutar python -m py_compile streamlit_app.py.
- Probar Streamlit con Streamlit testing si está disponible.
- Revisar que no haya claves reales en archivos versionados.
- Confirmar que .env.local y .streamlit/secrets.toml no se suben.
- Hacer commit claro y push a GitHub.

Entregable final:
- Resumen de mejoras implementadas.
- Archivos modificados.
- Validaciones ejecutadas.
- Commit subido.
- URL de GitHub.
- URL local o cloud para probar.
```

## Prompt corto para continuar trabajo

```text
Continuá el proyecto El Patrón Pro usando el Prompt Maestro Conectado. Revisá el flujo completo restaurante: menú principal, logo, platos, bebidas, inventario, recetas, pedidos, cocina KDS, caja, PDF/ticketera, Supabase, Streamlit, reportes y backups. Implementá mejoras reales, verificá con lint/build/tests y subí a GitHub sin exponer secretos.
```
