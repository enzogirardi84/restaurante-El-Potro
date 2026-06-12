import os
from datetime import datetime
from typing import Any
from urllib.parse import urlparse

import pandas as pd
import streamlit as st
from dotenv import load_dotenv
from supabase import create_client


load_dotenv()

APP_TABLES = [
    "usuarios",
    "mesas",
    "insumos",
    "productos_menu",
    "recetas_escandallo",
    "pedidos_cabecera",
    "pedido_detalle",
    "mermas",
    "auditoria_eventos",
    "proveedores",
    "promociones",
    "reservas",
    "facturas",
    "pagos",
    "cierres_caja",
    "movimientos_inventario",
    "backups",
]

CORE_TABLES = [
    "productos_menu",
    "insumos",
    "mesas",
    "pedidos_cabecera",
    "pedido_detalle",
    "recetas_escandallo",
    "facturas",
    "pagos",
    "reservas",
    "movimientos_inventario",
]


def get_secret(name: str) -> str:
    try:
        if name in st.secrets:
            return str(st.secrets[name])
    except Exception:
        pass
    return os.getenv(name, "")


def normalize_supabase_url(url: str) -> str:
    return url.replace("/rest/v1", "").rstrip("/")


def mask_url(url: str) -> str:
    if not url:
        return "Sin configurar"
    host = urlparse(normalize_supabase_url(url)).netloc
    if not host:
        return "URL configurada"
    pieces = host.split(".")
    project = pieces[0]
    masked_project = f"{project[:6]}...{project[-4:]}" if len(project) > 12 else project
    return ".".join([masked_project, *pieces[1:]])


def money(value: Any) -> str:
    try:
        return f"${float(value):,.0f}".replace(",", ".")
    except (TypeError, ValueError):
        return "$0"


def number(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


@st.cache_resource(show_spinner=False)
def get_supabase_client(url: str, key: str):
    if not url or not key:
        return None
    return create_client(normalize_supabase_url(url), key)


@st.cache_data(ttl=45, show_spinner=False)
def fetch_table(url: str, key: str, table_name: str, limit: int = 1000) -> dict[str, Any]:
    client = create_client(normalize_supabase_url(url), key)
    try:
        response = client.table(table_name).select("*", count="exact").limit(limit).execute()
        data = response.data or []
        return {
            "ok": True,
            "data": data,
            "count": response.count if response.count is not None else len(data),
            "error": "",
        }
    except Exception as exc:
        return {"ok": False, "data": [], "count": 0, "error": str(exc)}


def as_dataframe(rows: list[dict[str, Any]]) -> pd.DataFrame:
    if not rows:
        return pd.DataFrame()
    return pd.DataFrame(rows)


def apply_text_filter(df: pd.DataFrame, text: str) -> pd.DataFrame:
    if df.empty or not text:
        return df
    text = text.lower().strip()
    searchable = df.astype(str).apply(lambda row: " ".join(row).lower(), axis=1)
    return df[searchable.str.contains(text, na=False)]


def metric_card(title: str, value: str, caption: str = "", accent: str = "#6B4A35") -> None:
    st.markdown(
        f"""
        <div class="metric-card" style="border-top-color:{accent}">
            <div class="metric-title">{title}</div>
            <div class="metric-value">{value}</div>
            <div class="metric-caption">{caption}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_empty_state(title: str, detail: str) -> None:
    st.markdown(
        f"""
        <div class="empty-state">
            <strong>{title}</strong>
            <span>{detail}</span>
        </div>
        """,
        unsafe_allow_html=True,
    )


st.set_page_config(
    page_title="El Patrón Pro",
    page_icon="EP",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    :root {
        --patron-ink: #2f241d;
        --patron-muted: #817267;
        --patron-border: #e4ddd2;
        --patron-card: #fffdf8;
        --patron-bg: #f5f1e9;
        --patron-brown: #6b4a35;
        --patron-green: #1f8f66;
        --patron-red: #b94b4b;
        --patron-blue: #315f84;
    }
    .block-container {
        padding-top: 2.2rem;
        padding-bottom: 3rem;
        max-width: 1480px;
    }
    h1, h2, h3 {
        color: var(--patron-ink);
        letter-spacing: 0;
    }
    [data-testid="stSidebar"] {
        background: #fffaf1;
        border-right: 1px solid var(--patron-border);
    }
    .brand-box {
        border: 1px solid var(--patron-border);
        background: linear-gradient(180deg, #fffdf8 0%, #f5eee4 100%);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    .brand-mark {
        width: 46px;
        height: 46px;
        border: 1px solid #bda995;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-weight: 800;
        color: var(--patron-brown);
        background: #fff;
        margin-bottom: .75rem;
    }
    .brand-title {
        font-size: 1.05rem;
        line-height: 1.15;
        font-weight: 800;
        color: var(--patron-ink);
    }
    .brand-subtitle {
        color: var(--patron-muted);
        font-size: .78rem;
        margin-top: .25rem;
    }
    .status-pill {
        display: inline-flex;
        align-items: center;
        gap: .45rem;
        border-radius: 999px;
        border: 1px solid #b8dbc9;
        background: #effaf4;
        color: #166244;
        padding: .28rem .65rem;
        font-size: .78rem;
        font-weight: 700;
    }
    .status-dot {
        width: .55rem;
        height: .55rem;
        border-radius: 999px;
        background: var(--patron-green);
    }
    .hero {
        border: 1px solid var(--patron-border);
        background: linear-gradient(135deg, #fffdf8 0%, #f4eadc 58%, #eaf2ec 100%);
        border-radius: 8px;
        padding: 1.35rem 1.45rem;
        margin-bottom: 1.15rem;
    }
    .hero-kicker {
        color: var(--patron-brown);
        font-size: .78rem;
        text-transform: uppercase;
        font-weight: 800;
        letter-spacing: .06rem;
        margin-bottom: .35rem;
    }
    .hero-title {
        font-size: clamp(2rem, 4vw, 3.8rem);
        font-weight: 900;
        color: var(--patron-ink);
        line-height: 1;
        margin: 0;
    }
    .hero-copy {
        max-width: 820px;
        color: var(--patron-muted);
        margin-top: .7rem;
        font-size: 1rem;
    }
    .metric-card {
        border: 1px solid var(--patron-border);
        border-top: 4px solid var(--patron-brown);
        background: var(--patron-card);
        border-radius: 8px;
        padding: 1rem;
        min-height: 118px;
        box-shadow: 0 1px 5px rgba(47, 36, 29, .06);
    }
    .metric-title {
        color: var(--patron-muted);
        font-size: .78rem;
        text-transform: uppercase;
        font-weight: 800;
    }
    .metric-value {
        color: var(--patron-ink);
        font-size: 2rem;
        line-height: 1.2;
        font-weight: 900;
        margin-top: .3rem;
    }
    .metric-caption {
        color: var(--patron-muted);
        font-size: .82rem;
        min-height: 1.1rem;
        margin-top: .3rem;
    }
    .section-card {
        border: 1px solid var(--patron-border);
        background: var(--patron-card);
        border-radius: 8px;
        padding: 1rem;
    }
    .empty-state {
        border: 1px dashed #d8cdbc;
        background: #fffaf2;
        border-radius: 8px;
        padding: 1rem;
        color: var(--patron-muted);
        display: flex;
        flex-direction: column;
        gap: .2rem;
    }
    .empty-state strong {
        color: var(--patron-ink);
    }
    .small-muted {
        color: var(--patron-muted);
        font-size: .82rem;
    }
    div[data-testid="stMetric"] {
        background: var(--patron-card);
        border: 1px solid var(--patron-border);
        border-radius: 8px;
        padding: .85rem 1rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

supabase_url = get_secret("SUPABASE_URL")
supabase_key = get_secret("SUPABASE_ANON_KEY")
client = get_supabase_client(supabase_url, supabase_key)

with st.sidebar:
    st.markdown(
        """
        <div class="brand-box">
            <div class="brand-mark">EP</div>
            <div class="brand-title">El Patrón Pro</div>
            <div class="brand-subtitle">Gestión gastronómica y stock</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    if client:
        st.markdown('<span class="status-pill"><span class="status-dot"></span>Conectado a Supabase</span>', unsafe_allow_html=True)
    else:
        st.error("Falta configurar Supabase.")
    st.caption(f"Proyecto: {mask_url(supabase_url)}")
    st.caption("Clave anon: configurada" if supabase_key else "Clave anon: sin configurar")
    st.divider()
    if st.button("Actualizar datos", width="stretch"):
        st.cache_data.clear()
        st.rerun()
    st.caption("El panel usa solo `SUPABASE_URL` y `SUPABASE_ANON_KEY`. No necesita claves privilegiadas.")

if not client:
    st.warning("Configura `SUPABASE_URL` y `SUPABASE_ANON_KEY` en Streamlit Secrets para abrir el panel.")
    st.stop()

with st.spinner("Leyendo datos de Supabase..."):
    table_results = {table: fetch_table(supabase_url, supabase_key, table) for table in APP_TABLES}
    core_data = {table: as_dataframe(table_results[table]["data"]) for table in CORE_TABLES}

summary = pd.DataFrame(
    [
        {
            "tabla": table,
            "estado": "OK" if result["ok"] else "ERROR",
            "registros": result["count"],
            "detalle": "" if result["ok"] else result["error"][:180],
        }
        for table, result in table_results.items()
    ]
)

productos = core_data["productos_menu"]
insumos = core_data["insumos"]
mesas = core_data["mesas"]
pedidos = core_data["pedidos_cabecera"]
detalles = core_data["pedido_detalle"]
recetas = core_data["recetas_escandallo"]
facturas = core_data["facturas"]
pagos = core_data["pagos"]
reservas = core_data["reservas"]
movimientos = core_data["movimientos_inventario"]

ok_count = int((summary["estado"] == "OK").sum())
error_count = int((summary["estado"] == "ERROR").sum())
total_records = int(summary["registros"].sum())

productos_activos = 0
if not productos.empty and "activo" in productos.columns:
    productos_activos = int(productos["activo"].fillna(False).astype(bool).sum())
elif not productos.empty:
    productos_activos = len(productos)

stock_critico = pd.DataFrame()
if {"stock_actual", "stock_minimo"}.issubset(insumos.columns):
    stock_critico = insumos[insumos["stock_actual"].map(number) <= insumos["stock_minimo"].map(number)].copy()

comandas_abiertas = pd.DataFrame()
if not pedidos.empty and "estado_comanda" in pedidos.columns:
    estados_cerrados = {"cerrada", "cancelada", "cobrada", "finalizada", "entregada"}
    comandas_abiertas = pedidos[~pedidos["estado_comanda"].astype(str).str.lower().isin(estados_cerrados)].copy()
elif not pedidos.empty:
    comandas_abiertas = pedidos.copy()

facturacion_total = facturas["total"].map(number).sum() if "total" in facturas.columns else 0
ticket_promedio = facturacion_total / len(facturas) if len(facturas) else 0

st.markdown(
    """
    <div class="hero">
        <div class="hero-kicker">Panel conectado a Supabase</div>
        <h1 class="hero-title">Centro Operativo El Patrón</h1>
        <div class="hero-copy">
            Control rápido de tablas, menú, inventario, comandas y caja. Pensado para revisar la salud del sistema antes de operar o publicar cambios.
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

metric_cols = st.columns(5)
with metric_cols[0]:
    metric_card("Tablas OK", f"{ok_count}/{len(APP_TABLES)}", f"{error_count} con error", "#1f8f66" if error_count == 0 else "#b94b4b")
with metric_cols[1]:
    metric_card("Registros", f"{total_records}", "datos leidos en Supabase", "#315f84")
with metric_cols[2]:
    metric_card("Menu activo", f"{productos_activos}", f"{len(productos)} productos cargados", "#6b4a35")
with metric_cols[3]:
    metric_card("Stock critico", f"{len(stock_critico)}", "insumos bajo minimo", "#b94b4b" if len(stock_critico) else "#1f8f66")
with metric_cols[4]:
    metric_card("Comandas abiertas", f"{len(comandas_abiertas)}", f"ticket prom. {money(ticket_promedio)}", "#315f84")

tab_resumen, tab_menu, tab_inventario, tab_operacion, tab_tablas, tab_explorador = st.tabs(
    ["Resumen", "Menu", "Inventario", "Operacion", "Salud de tablas", "Explorador"]
)

with tab_resumen:
    left, right = st.columns([1.2, 1])
    with left:
        st.subheader("Lectura general")
        if not productos.empty and "categoria" in productos.columns:
            category_counts = productos["categoria"].fillna("Sin categoria").value_counts().rename_axis("categoria").reset_index(name="productos")
            st.bar_chart(category_counts, x="categoria", y="productos", width="stretch")
        else:
            render_empty_state("Menu sin datos suficientes", "Cuando cargues productos, aca vas a ver la distribucion por categoria.")

    with right:
        st.subheader("Alertas")
        if error_count:
            st.error(f"Hay {error_count} tablas con error. Revisar la pestana Salud de tablas.")
        else:
            st.success("Las tablas principales responden correctamente.")

        if len(stock_critico):
            st.warning(f"{len(stock_critico)} insumos estan por debajo del minimo.")
            cols = [col for col in ["nombre", "stock_actual", "stock_minimo", "unidad_medida", "categoria"] if col in stock_critico.columns]
            st.dataframe(stock_critico[cols].head(8), width="stretch", hide_index=True)
        else:
            st.info("No hay insumos por debajo del minimo.")

        if len(comandas_abiertas):
            st.warning(f"{len(comandas_abiertas)} comandas siguen abiertas.")
        else:
            st.info("No hay comandas abiertas para revisar.")

with tab_menu:
    st.subheader("Menu y carta")
    if productos.empty:
        render_empty_state("No hay productos cargados", "Carga o sincroniza productos_menu desde el modulo Sistema del programa principal.")
    else:
        col_a, col_b, col_c = st.columns(3)
        col_a.metric("Productos", len(productos))
        col_b.metric("Activos", productos_activos)
        promedio = productos["precio_venta"].map(number).mean() if "precio_venta" in productos.columns else 0
        col_c.metric("Precio promedio", money(promedio))

        filters = st.columns([1, 1, 1])
        category = "Todas"
        if "categoria" in productos.columns:
            categories = ["Todas", *sorted(productos["categoria"].dropna().astype(str).unique())]
            category = filters[0].selectbox("Categoria", categories)
        product_type = "Todos"
        if "tipo" in productos.columns:
            types = ["Todos", *sorted(productos["tipo"].dropna().astype(str).unique())]
            product_type = filters[1].selectbox("Tipo", types)
        search_menu = filters[2].text_input("Buscar en menu", placeholder="Plato, bebida o descripcion")

        menu_df = productos.copy()
        if category != "Todas" and "categoria" in menu_df.columns:
            menu_df = menu_df[menu_df["categoria"].astype(str) == category]
        if product_type != "Todos" and "tipo" in menu_df.columns:
            menu_df = menu_df[menu_df["tipo"].astype(str) == product_type]
        menu_df = apply_text_filter(menu_df, search_menu)
        menu_cols = [
            col
            for col in [
                "nombre",
                "categoria",
                "subcategoria",
                "tipo",
                "precio_venta",
                "activo",
                "requiere_cocina",
                "tiempo_preparacion_estimado",
                "descripcion",
            ]
            if col in menu_df.columns
        ]
        st.dataframe(menu_df[menu_cols] if menu_cols else menu_df, width="stretch", hide_index=True)
        st.download_button(
            "Descargar menu CSV",
            menu_df.to_csv(index=False).encode("utf-8-sig"),
            file_name=f"menu_el_patron_{datetime.now():%Y%m%d_%H%M}.csv",
            mime="text/csv",
            width="stretch",
        )

with tab_inventario:
    st.subheader("Inventario y bodega")
    if insumos.empty:
        render_empty_state("No hay insumos cargados", "Carga inventario desde el programa principal para activar alertas y control de stock.")
    else:
        col_a, col_b, col_c, col_d = st.columns(4)
        col_a.metric("Insumos", len(insumos))
        col_b.metric("Stock critico", len(stock_critico))
        bebidas = int(insumos["es_bebida_directa"].fillna(False).astype(bool).sum()) if "es_bebida_directa" in insumos.columns else 0
        col_c.metric("Bebidas directas", bebidas)
        costo_stock = 0
        if {"stock_actual", "costo_unitario"}.issubset(insumos.columns):
            costo_stock = (insumos["stock_actual"].map(number) * insumos["costo_unitario"].map(number)).sum()
        col_d.metric("Valorizacion stock", money(costo_stock))

        inv_filters = st.columns([1, 1, 1])
        inv_df = insumos.copy()
        inv_category = "Todas"
        if "categoria" in inv_df.columns:
            inv_category = inv_filters[0].selectbox("Categoria inventario", ["Todas", *sorted(inv_df["categoria"].dropna().astype(str).unique())])
        only_critical = inv_filters[1].checkbox("Solo bajo minimo")
        inv_search = inv_filters[2].text_input("Buscar insumo", placeholder="Carne, vino, proveedor")

        if inv_category != "Todas" and "categoria" in inv_df.columns:
            inv_df = inv_df[inv_df["categoria"].astype(str) == inv_category]
        if only_critical and {"stock_actual", "stock_minimo"}.issubset(inv_df.columns):
            inv_df = inv_df[inv_df["stock_actual"].map(number) <= inv_df["stock_minimo"].map(number)]
        inv_df = apply_text_filter(inv_df, inv_search)

        inv_cols = [
            col
            for col in [
                "nombre",
                "categoria",
                "subcategoria",
                "stock_actual",
                "stock_minimo",
                "unidad_medida",
                "proveedor",
                "costo_unitario",
                "es_bebida_directa",
            ]
            if col in inv_df.columns
        ]
        st.dataframe(inv_df[inv_cols] if inv_cols else inv_df, width="stretch", hide_index=True)
        st.download_button(
            "Descargar inventario CSV",
            inv_df.to_csv(index=False).encode("utf-8-sig"),
            file_name=f"inventario_el_patron_{datetime.now():%Y%m%d_%H%M}.csv",
            mime="text/csv",
            width="stretch",
        )

with tab_operacion:
    st.subheader("Operacion del salon")
    op_cols = st.columns(4)
    mesas_ocupadas = int((mesas["estado"].astype(str).str.lower() == "ocupada").sum()) if "estado" in mesas.columns else 0
    op_cols[0].metric("Mesas", len(mesas))
    op_cols[1].metric("Ocupadas", mesas_ocupadas)
    op_cols[2].metric("Comandas", len(pedidos))
    op_cols[3].metric("Facturado", money(facturacion_total))

    order_left, order_right = st.columns([1.1, 1])
    with order_left:
        st.markdown("#### Comandas")
        if pedidos.empty:
            render_empty_state("Sin comandas", "Cuando haya pedidos, se veran por estado, mesa y mozo.")
        else:
            order_cols = [col for col in ["id_pedido", "numero_mesa", "mozo", "estado_comanda", "fecha_hora", "stock_descontado", "items"] if col in pedidos.columns]
            st.dataframe(pedidos[order_cols] if order_cols else pedidos, width="stretch", hide_index=True)
    with order_right:
        st.markdown("#### Caja")
        if facturas.empty:
            render_empty_state("Sin facturas", "Los tickets y cobros apareceran cuando cierres comandas en Caja.")
        else:
            factura_cols = [col for col in ["numero_factura", "total", "tipo_comprobante", "metodo_pago", "fecha_emision"] if col in facturas.columns]
            st.dataframe(facturas[factura_cols] if factura_cols else facturas, width="stretch", hide_index=True)

    with st.expander("Detalles de pedidos y movimientos de inventario"):
        detail_tabs = st.tabs(["Detalle comandas", "Movimientos inventario", "Reservas", "Pagos"])
        with detail_tabs[0]:
            st.dataframe(detalles, width="stretch", hide_index=True)
        with detail_tabs[1]:
            st.dataframe(movimientos, width="stretch", hide_index=True)
        with detail_tabs[2]:
            st.dataframe(reservas, width="stretch", hide_index=True)
        with detail_tabs[3]:
            st.dataframe(pagos, width="stretch", hide_index=True)

with tab_tablas:
    st.subheader("Salud de tablas Supabase")
    status_filter = st.radio("Filtro", ["Todas", "OK", "ERROR"], horizontal=True)
    status_df = summary.copy()
    if status_filter != "Todas":
        status_df = status_df[status_df["estado"] == status_filter]
    st.dataframe(status_df, width="stretch", hide_index=True)
    st.download_button(
        "Descargar diagnostico CSV",
        summary.to_csv(index=False).encode("utf-8-sig"),
        file_name=f"diagnostico_supabase_{datetime.now():%Y%m%d_%H%M}.csv",
        mime="text/csv",
        width="stretch",
    )

with tab_explorador:
    st.subheader("Explorador de datos")
    table_name = st.selectbox("Tabla", APP_TABLES, index=APP_TABLES.index("productos_menu"))
    limit = st.slider("Filas a consultar", 10, 1000, 100, step=10)
    search = st.text_input("Buscar dentro de la tabla", placeholder="Texto libre")

    result = fetch_table(supabase_url, supabase_key, table_name, limit=limit)
    if not result["ok"]:
        st.error(result["error"])
    else:
        df = apply_text_filter(as_dataframe(result["data"]), search)
        st.caption(f"{result['count']} registros en Supabase. Mostrando {len(df)} filas luego del filtro.")
        if df.empty:
            render_empty_state("Tabla sin filas para mostrar", "Prueba otro filtro o carga datos desde el programa principal.")
        else:
            st.dataframe(df, width="stretch", hide_index=True)
            st.download_button(
                f"Descargar {table_name} CSV",
                df.to_csv(index=False).encode("utf-8-sig"),
                file_name=f"{table_name}_{datetime.now():%Y%m%d_%H%M}.csv",
                mime="text/csv",
                width="stretch",
            )
