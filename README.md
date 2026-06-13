# El Patrón - Sistema Gestor Gastronómico

Aplicación web para administrar la operación diaria de un restaurante: menú principal, mesas, comandas, cocina/KDS, caja, inventario, recetas por escandallo, proveedores, promociones, reservas, facturación, tickets PDF, backups y sincronización opcional con Supabase.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS 4
- Supabase JS para persistencia remota opcional
- Streamlit para panel auxiliar de diagnóstico Supabase
- jsPDF para comprobantes descargables
- Datos iniciales locales para modo demo/offline

## Requisitos

- Node.js 20 o superior recomendado
- Proyecto Supabase opcional si se quiere sincronizar datos en la nube

## Instalación

```bash
npm install
```

## Configuración

Copiar `.env.example` a `.env.local` y completar al menos las credenciales del acceso:

```env
VITE_ADMIN_USERNAME="tu-usuario"
VITE_ADMIN_PASSWORD="tu-clave"
```

La app puede ejecutarse sin Supabase usando los datos locales de demostración. Para conectar Supabase:

```env
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-key"
```

Luego ejecutar en Supabase SQL Editor el script `supabase/RUN_THIS_IN_SUPABASE.sql` o la migración correspondiente si el proyecto está vacío. Desde el módulo `Sistema` se puede probar conexión, sembrar datos o descargar datos remotos.

Nota de seguridad: el login actual es una barrera de interfaz para operación local. Antes de exponer la app públicamente, reemplazarlo por Supabase Auth o por sesiones de backend.

## Desarrollo

```bash
npm run dev
```

La app levanta en:

```text
http://localhost:3000
```

## Verificación

```bash
npm run lint
npm run build
```

## Panel Streamlit + Supabase

El repositorio incluye un panel Streamlit opcional para revisar la conexión con Supabase, validar tablas y consultar datos rápidos.

```bash
pip install -r requirements.txt
streamlit run streamlit_app.py
```

Para Streamlit Cloud, cargar los valores de Supabase en `App settings > Secrets`.

## Limpieza

```bash
npm run clean
```

## Módulos

- Menú principal operativo
- Mozo / Salón
- Cocina KDS
- Caja y cierres
- Facturación y PDF
- Menú y carta
- Recetas / escandallos
- Inventario y movimientos
- Mesas
- Reservas
- Proveedores
- Promociones
- Reportes / BI
- Sistema y Supabase
- Backups
