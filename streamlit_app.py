import io
import os
import zipfile
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
    "proveedores",
    "promociones",
    "auditoria_eventos",
    "cierres_caja",
]

MODULES = [
    "Panel",
    "Mozo / Salon",
    "Cocina KDS",
    "Caja",
    "Menu",
    "Recetas",
    "Mesas",
    "Inventario",
    "Compras",
    "Clientes",
    "Delivery",
    "Ticketera",
    "Reportes",
    "Sistema",
    "Backups",
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
    project = host.split(".")[0]
    masked = f"{project[:6]}...{project[-4:]}" if len(project) > 12 else project
    return host.replace(project, masked, 1)


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


def as_dataframe(rows: list[dict[str, Any]]) -> pd.DataFrame:
    return pd.DataFrame(rows or [])


def apply_text_filter(df: pd.DataFrame, text: str) -> pd.DataFrame:
    if df.empty or not text:
        return df
    text = text.lower().strip()
    searchable = df.astype(str).apply(lambda row: " ".join(row).lower(), axis=1)
    return df[searchable.str.contains(text, na=False)]


@st.cache_resource(show_spinner=False)
def get_supabase_client(url: str, key: str):
    if not url or not key:
        return None
    return create_client(normalize_supabase_url(url), key)


@st.cache_data(ttl=45, show_spinner=False)
def fetch_table(url: str, key: str, table_name: str, limit: int = 2000) -> dict[str, Any]:
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


def safe_columns(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    existing = [col for col in columns if col in df.columns]
    return df[existing] if existing else df


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


def section_header(title: str, subtitle: str) -> None:
    st.markdown(
        f"""
        <div class="module-hero">
            <div class="module-kicker">Restaurante Pro</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def empty_state(title: str, detail: str) -> None:
    st.markdown(
        f"""
        <div class="empty-state">
            <strong>{title}</strong>
            <span>{detail}</span>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_table(df: pd.DataFrame, columns: list[str] | None = None, height: int | None = None) -> None:
    if df.empty:
        empty_state("Sin registros", "Todavia no hay datos para mostrar en esta seccion.")
        return
    view = safe_columns(df, columns) if columns else df
    st.dataframe(view, width="stretch", hide_index=True, height=height)


def make_backup_zip(tables: dict[str, pd.DataFrame]) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, df in tables.items():
            archive.writestr(f"{name}.csv", df.to_csv(index=False))
    buffer.seek(0)
    return buffer.getvalue()


st.set_page_config(
    page_title="El Patron Pro",
    page_icon="EP",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    :root {
        --patron-ink: #2f241d;
        --patron-muted: #74675d;
        --patron-border: #ded4c7;
        --patron-card: #fffdf8;
        --patron-bg: #f5f1e9;
        --patron-brown: #6b4a35;
        --patron-brown-dark: #4d3227;
        --patron-green: #1f8f66;
        --patron-red: #b94b4b;
        --patron-blue: #315f84;
        --patron-dark: #171614;
    }
    .stApp {
        background: var(--patron-bg);
        color: var(--patron-ink);
    }
    .block-container {
        padding-top: 1.4rem;
        padding-bottom: 3rem;
        max-width: 1500px;
    }
    h1, h2, h3 {
        color: var(--patron-ink);
        letter-spacing: 0;
    }
    [data-testid="stSidebar"] {
        background: var(--patron-dark);
        border-right: 1px solid #2f2b26;
    }
    [data-testid="stSidebar"] * {
        color: #eee5d8;
    }
    [data-testid="stSidebar"] label,
    [data-testid="stSidebar"] .st-emotion-cache {
        color: #eee5d8;
    }
    [data-testid="stSidebar"] [role="radiogroup"] {
        gap: .35rem;
    }
    [data-testid="stSidebar"] [role="radio"] {
        border: 1px solid #8c623955;
        border-radius: 8px;
        padding: .55rem .65rem;
        background: #1f1d1a;
        min-height: 42px;
    }
    [data-testid="stSidebar"] [role="radio"]:has(input:checked) {
        background: var(--patron-brown);
        border-color: #d8b08a77;
    }
    .brand-box {
        border: 1px solid #8c623955;
        background: linear-gradient(180deg, #211f1c 0%, #161513 100%);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 12px 32px rgba(0,0,0,.18);
    }
    .brand-mark {
        width: 74px;
        height: 74px;
        border: 1px solid #d8b08a99;
        border-radius: 8px;
        display: grid;
        place-items: center;
        font-weight: 900;
        color: var(--patron-brown);
        background: #fff8ef;
        margin-bottom: .9rem;
        font-size: 1.35rem;
    }
    .brand-title {
        font-size: 1.25rem;
        line-height: 1.15;
        font-weight: 900;
        color: #fff;
    }
    .brand-subtitle {
        color: #d8b08a;
        font-size: .78rem;
        margin-top: .25rem;
        text-transform: uppercase;
        letter-spacing: .08rem;
        font-weight: 800;
    }
    .status-pill {
        display: inline-flex;
        align-items: center;
        gap: .45rem;
        border-radius: 999px;
        border: 1px solid #3f8f6b;
        background: #103524;
        color: #bff7da;
        padding: .32rem .7rem;
        font-size: .78rem;
        font-weight: 800;
    }
    .status-dot {
        width: .55rem;
        height: .55rem;
        border-radius: 999px;
        background: #20c17a;
    }
    .module-hero {
        border: 1px solid var(--patron-border);
        background: linear-gradient(135deg, #fffdf8 0%, #f4eadc 58%, #eaf2ec 100%);
        border-radius: 8px;
        padding: 1.35rem 1.45rem;
        margin-bottom: 1.15rem;
    }
    .module-kicker {
        color: var(--patron-brown);
        font-size: .78rem;
        text-transform: uppercase;
        font-weight: 900;
        letter-spacing: .08rem;
        margin-bottom: .35rem;
    }
    .module-hero h1 {
        font-size: clamp(2rem, 3.7vw, 3.5rem);
        font-weight: 900;
        line-height: 1;
        margin: 0;
    }
    .module-hero p {
        max-width: 880px;
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
        min-height: 116px;
        box-shadow: 0 1px 5px rgba(47, 36, 29, .06);
    }
    .metric-title {
        color: var(--patron-muted);
        font-size: .78rem;
        text-transform: uppercase;
        font-weight: 900;
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
    .section-card, div[data-testid="stMetric"] {
        border: 1px solid var(--patron-border);
        background: var(--patron-card);
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 1px 5px rgba(47, 36, 29, .05);
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
    .ticket {
        background: #fffdf8;
        border: 1px dashed #cbbba5;
        border-radius: 8px;
        padding: 1rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        white-space: pre-wrap;
        color: #1f1a16;
    }
    .small-muted {
        color: var(--patron-muted);
        font-size: .82rem;
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
            <div class="brand-title">El Patron Pro</div>
            <div class="brand-subtitle">Gestion gastronomica</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    if client:
        st.markdown('<span class="status-pill"><span class="status-dot"></span>Supabase conectado</span>', unsafe_allow_html=True)
    else:
        st.error("Falta configurar Supabase.")
    st.caption(f"Proyecto: {mask_url(supabase_url)}")
    st.caption("Clave anon configurada" if supabase_key else "Clave anon sin configurar")
    st.divider()
    active_module = st.radio("Modulos del sistema", MODULES, index=0, label_visibility="collapsed")
    st.divider()
    if st.button("Actualizar datos", width="stretch"):
        st.cache_data.clear()
        st.rerun()
    st.caption("Tip: usa el boton << de Streamlit arriba del panel para contraer el menu lateral.")

if not client:
    st.warning("Configura SUPABASE_URL y SUPABASE_ANON_KEY en Streamlit Secrets para abrir el sistema.")
    st.stop()

with st.spinner("Leyendo Supabase..."):
    table_results = {table: fetch_table(supabase_url, supabase_key, table) for table in APP_TABLES}
    data = {table: as_dataframe(table_results[table]["data"]) for table in CORE_TABLES}

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

productos = data["productos_menu"]
insumos = data["insumos"]
mesas = data["mesas"]
pedidos = data["pedidos_cabecera"]
detalles = data["pedido_detalle"]
recetas = data["recetas_escandallo"]
facturas = data["facturas"]
pagos = data["pagos"]
reservas = data["reservas"]
movimientos = data["movimientos_inventario"]
proveedores = data["proveedores"]
promociones = data["promociones"]
logs = data["auditoria_eventos"]
cierres = data["cierres_caja"]

ok_count = int((summary["estado"] == "OK").sum())
error_count = int((summary["estado"] == "ERROR").sum())
total_records = int(summary["registros"].sum())

productos_activos = len(productos)
if not productos.empty and "activo" in productos.columns:
    productos_activos = int(productos["activo"].fillna(False).astype(bool).sum())

stock_critico = pd.DataFrame()
if {"stock_actual", "stock_minimo"}.issubset(insumos.columns):
    stock_critico = insumos[insumos["stock_actual"].map(number) <= insumos["stock_minimo"].map(number)].copy()

comandas_abiertas = pd.DataFrame()
if not pedidos.empty and "estado_comanda" in pedidos.columns:
    estados_cerrados = {"cerrada", "cancelada", "cobrada", "finalizada", "entregada", "entregado_cobrado"}
    comandas_abiertas = pedidos[~pedidos["estado_comanda"].astype(str).str.lower().isin(estados_cerrados)].copy()
elif not pedidos.empty:
    comandas_abiertas = pedidos.copy()

facturacion_total = facturas["total"].map(number).sum() if "total" in facturas.columns else 0
ticket_promedio = facturacion_total / len(facturas) if len(facturas) else 0
mesas_ocupadas = int((mesas["estado"].astype(str).str.lower() == "ocupada").sum()) if "estado" in mesas.columns else 0
mesas_libres = int((mesas["estado"].astype(str).str.lower() == "libre").sum()) if "estado" in mesas.columns else len(mesas)


def render_top_metrics() -> None:
    cols = st.columns(5)
    with cols[0]:
        metric_card("Tablas OK", f"{ok_count}/{len(APP_TABLES)}", f"{error_count} con error", "#1f8f66" if error_count == 0 else "#b94b4b")
    with cols[1]:
        metric_card("Registros", f"{total_records}", "datos leidos", "#315f84")
    with cols[2]:
        metric_card("Menu activo", f"{productos_activos}", f"{len(productos)} productos", "#6b4a35")
    with cols[3]:
        metric_card("Stock critico", f"{len(stock_critico)}", "insumos bajo minimo", "#b94b4b" if len(stock_critico) else "#1f8f66")
    with cols[4]:
        metric_card("Comandas", f"{len(comandas_abiertas)}", f"ticket prom. {money(ticket_promedio)}", "#315f84")


if active_module == "Panel":
    section_header("Panel administrador", "Control general del salon, cocina, caja, stock y personal desde un unico tablero.")
    render_top_metrics()
    left, right = st.columns([1.2, 1])
    with left:
        st.subheader("Lectura general")
        if not productos.empty and "categoria" in productos.columns:
            category_counts = productos["categoria"].fillna("Sin categoria").value_counts().rename_axis("categoria").reset_index(name="productos")
            st.bar_chart(category_counts, x="categoria", y="productos", width="stretch")
        else:
            empty_state("Menu sin datos", "Carga productos_menu para ver la distribucion por categoria.")
    with right:
        st.subheader("Alertas")
        if error_count == 0:
            st.success("Las tablas principales responden correctamente.")
        else:
            st.error(f"{error_count} tablas con error.")

        if len(stock_critico) == 0:
            st.info("No hay insumos por debajo del minimo.")
        else:
            st.warning(f"{len(stock_critico)} insumos bajo minimo.")

        if len(comandas_abiertas) == 0:
            st.info("No hay comandas abiertas para revisar.")
        else:
            st.warning(f"{len(comandas_abiertas)} comandas abiertas.")
    st.subheader("Ultimos eventos")
    render_table(logs, ["fecha_hora", "modulo", "accion", "detalle"], height=260)

elif active_module == "Mozo / Salon":
    section_header("Terminal de mozo", "Mesas, pedidos, entrega y cuenta en modo tactil.")
    cols = st.columns(5)
    cols[0].metric("Mesas", len(mesas))
    cols[1].metric("Libres", mesas_libres)
    cols[2].metric("Ocupadas", mesas_ocupadas)
    cols[3].metric("En cuenta", len(comandas_abiertas))
    cols[4].metric("Menu", productos_activos)
    salon_left, salon_right = st.columns([1, 1.2])
    with salon_left:
        st.subheader("Salon")
        render_table(mesas, ["numero_mesa", "estado", "comensales"], height=360)
    with salon_right:
        st.subheader("Carta rapida")
        search = st.text_input("Buscar producto", placeholder="Nombre de plato, bebida o postre")
        menu_df = apply_text_filter(productos, search)
        render_table(menu_df, ["nombre", "categoria", "subcategoria", "tipo", "precio_venta", "activo"], height=360)
        st.download_button("Descargar carta para mozos", menu_df.to_csv(index=False).encode("utf-8-sig"), "carta_mozo.csv", "text/csv", width="stretch")

elif active_module == "Cocina KDS":
    section_header("Terminal de cocina", "Comandas vivas, tiempos de preparacion, despacho y control de escandallos.")
    cols = st.columns(5)
    estados = pedidos["estado_comanda"].astype(str).str.lower() if "estado_comanda" in pedidos.columns and not pedidos.empty else pd.Series(dtype=str)
    cols[0].metric("Pendientes", int((estados == "pendiente").sum()))
    cols[1].metric("En preparacion", int((estados == "en_cocina").sum()))
    cols[2].metric("Listos", int((estados == "listo").sum()))
    cols[3].metric("Platos activos", len(detalles))
    cols[4].metric("Mayor espera", "-" if pedidos.empty or "minutos_transcurridos" not in pedidos.columns else f"{int(pedidos['minutos_transcurridos'].map(number).max())}m")
    kds_cols = st.columns(3)
    for col, state, title in zip(kds_cols, ["pendiente", "en_cocina", "listo"], ["Pendiente", "En preparacion", "Listo para servir"]):
        with col:
            st.markdown(f"#### {title}")
            board = pedidos[pedidos["estado_comanda"].astype(str).str.lower() == state] if "estado_comanda" in pedidos.columns and not pedidos.empty else pd.DataFrame()
            render_table(board, ["id_pedido", "numero_mesa", "mozo", "fecha_hora", "items"], height=320)

elif active_module == "Caja":
    section_header("Terminal de caja", "Cobro rapido, cuenta dividida, tickets, cierres y facturacion.")
    cols = st.columns(4)
    cols[0].metric("Caja", "#1")
    cols[1].metric("Comandas abiertas", len(comandas_abiertas))
    cols[2].metric("Facturado", money(facturacion_total))
    cols[3].metric("Ticket promedio", money(ticket_promedio))
    left, right = st.columns([1.15, 1])
    with left:
        st.subheader("Cuentas pendientes")
        render_table(comandas_abiertas, ["id_pedido", "numero_mesa", "mozo", "estado_comanda", "fecha_hora"], height=350)
    with right:
        st.subheader("Facturacion rapida")
        render_table(facturas, ["numero_factura", "tipo_comprobante", "metodo_pago", "total", "fecha_emision"], height=260)
        ticket_text = f"El Patron Pro\nFecha: {datetime.now():%Y-%m-%d %H:%M}\nSubtotal: {money(facturacion_total)}\nServicio 10%: {money(facturacion_total * .10)}\nTOTAL: {money(facturacion_total * 1.10)}\nGracias por su visita."
        st.markdown(f"<div class='ticket'>{ticket_text}</div>", unsafe_allow_html=True)
        st.download_button("Reimprimir / descargar ticket", ticket_text.encode("utf-8"), "ticket_el_patron.txt", "text/plain", width="stretch")

elif active_module == "Menu":
    section_header("Administracion de menu", "Crear productos, revisar precios y controlar platos, bebidas, bodega y postres.")
    cols = st.columns(4)
    cols[0].metric("Productos", len(productos))
    cols[1].metric("Activos", productos_activos)
    cols[2].metric("Categorias", productos["categoria"].nunique() if "categoria" in productos.columns and not productos.empty else 0)
    cols[3].metric("Precio promedio", money(productos["precio_venta"].map(number).mean() if "precio_venta" in productos.columns else 0))
    filters = st.columns([1, 1, 1])
    menu_df = productos.copy()
    if not menu_df.empty and "categoria" in menu_df.columns:
        category = filters[0].selectbox("Categoria", ["Todas", *sorted(menu_df["categoria"].dropna().astype(str).unique())])
        if category != "Todas":
            menu_df = menu_df[menu_df["categoria"].astype(str) == category]
    if not menu_df.empty and "tipo" in menu_df.columns:
        product_type = filters[1].selectbox("Tipo", ["Todos", *sorted(menu_df["tipo"].dropna().astype(str).unique())])
        if product_type != "Todos":
            menu_df = menu_df[menu_df["tipo"].astype(str) == product_type]
    menu_df = apply_text_filter(menu_df, filters[2].text_input("Buscar", placeholder="Plato o bebida"))
    render_table(menu_df, ["nombre", "descripcion", "categoria", "subcategoria", "tipo", "precio_venta", "activo", "requiere_cocina"], height=520)

elif active_module == "Recetas":
    section_header("Recetas por plato", "Escandallo, ingredientes, cobertura de stock y productos pendientes de receta.")
    recipe_join = recetas.copy()
    if not recipe_join.empty and not productos.empty and "id_producto" in recipe_join.columns:
        recipe_join = recipe_join.merge(safe_columns(productos, ["id_producto", "nombre", "categoria"]), on="id_producto", how="left", suffixes=("", "_producto"))
    if not recipe_join.empty and not insumos.empty and "id_insumo" in recipe_join.columns:
        recipe_join = recipe_join.merge(safe_columns(insumos, ["id_insumo", "nombre", "stock_actual", "stock_minimo", "unidad_medida"]), on="id_insumo", how="left", suffixes=("_producto", "_insumo"))
    products_with_recipe = set(recetas["id_producto"].astype(str)) if "id_producto" in recetas.columns else set()
    products_without_recipe = productos[~productos["id_producto"].astype(str).isin(products_with_recipe)] if "id_producto" in productos.columns else pd.DataFrame()
    cols = st.columns(4)
    cols[0].metric("Productos", len(productos))
    cols[1].metric("Con receta", len(products_with_recipe))
    cols[2].metric("Sin receta", len(products_without_recipe))
    cols[3].metric("Lineas receta", len(recetas))
    tabs = st.tabs(["Matriz", "Pendientes"])
    with tabs[0]:
        render_table(recipe_join, ["nombre_producto", "categoria", "nombre_insumo", "cantidad_a_descontar", "unidad_medida", "stock_actual", "stock_minimo"], height=520)
    with tabs[1]:
        render_table(products_without_recipe, ["nombre", "categoria", "tipo", "precio_venta", "activo"], height=360)

elif active_module == "Mesas":
    section_header("Mesas y salon", "Distribucion, capacidad, estados y lectura del salon.")
    cols = st.columns(4)
    cols[0].metric("Mesas", len(mesas))
    cols[1].metric("Libres", mesas_libres)
    cols[2].metric("Ocupadas", mesas_ocupadas)
    cols[3].metric("Comensales", int(mesas["comensales"].map(number).sum()) if "comensales" in mesas.columns else 0)
    render_table(mesas, ["id_mesa", "numero_mesa", "estado", "comensales"], height=500)

elif active_module == "Inventario":
    section_header("Inventario y bodega", "Insumos, vinos, bebidas, mermas, movimientos y reposicion.")
    cols = st.columns(4)
    cols[0].metric("Insumos", len(insumos))
    cols[1].metric("Stock critico", len(stock_critico))
    cols[2].metric("Bebidas directas", int(insumos["es_bebida_directa"].fillna(False).astype(bool).sum()) if "es_bebida_directa" in insumos.columns else 0)
    cols[3].metric("Movimientos", len(movimientos))
    inv_df = insumos.copy()
    filters = st.columns([1, 1, 1])
    if not inv_df.empty and "categoria" in inv_df.columns:
        category = filters[0].selectbox("Categoria inventario", ["Todas", *sorted(inv_df["categoria"].dropna().astype(str).unique())])
        if category != "Todas":
            inv_df = inv_df[inv_df["categoria"].astype(str) == category]
    if filters[1].checkbox("Solo bajo minimo"):
        inv_df = inv_df[inv_df["stock_actual"].map(number) <= inv_df["stock_minimo"].map(number)] if {"stock_actual", "stock_minimo"}.issubset(inv_df.columns) else inv_df
    inv_df = apply_text_filter(inv_df, filters[2].text_input("Buscar insumo", placeholder="Carne, vino, proveedor"))
    render_table(inv_df, ["nombre", "categoria", "subcategoria", "stock_actual", "stock_minimo", "unidad_medida", "proveedor", "costo_unitario"], height=520)

elif active_module == "Compras":
    section_header("Compras y abastecimiento", "Lista sugerida de reposicion, proveedores y compras pendientes.")
    cols = st.columns(4)
    cols[0].metric("Sugeridos", len(stock_critico))
    cols[1].metric("Proveedores", len(proveedores))
    cols[2].metric("Insumos", len(insumos))
    cols[3].metric("Bodega", int(insumos["categoria"].astype(str).str.lower().str.contains("bodega").sum()) if "categoria" in insumos.columns else 0)
    left, right = st.columns([1.2, 1])
    with left:
        st.subheader("Reposicion sugerida")
        render_table(stock_critico if len(stock_critico) else insumos.head(12), ["nombre", "categoria", "stock_actual", "stock_minimo", "unidad_medida", "proveedor"], height=420)
    with right:
        st.subheader("Proveedores")
        render_table(proveedores, ["nombre", "contacto", "telefono", "email", "categoria"], height=420)

elif active_module == "Clientes":
    section_header("Clientes y fidelizacion", "Reservas, preferencias, historial y atencion premium.")
    cols = st.columns(4)
    cols[0].metric("Reservas", len(reservas))
    cols[1].metric("Mesas libres", mesas_libres)
    cols[2].metric("Tickets cobrados", len(facturas))
    cols[3].metric("Venta registrada", money(facturacion_total))
    render_table(reservas, ["fecha", "hora", "cliente", "telefono", "cantidad_personas", "estado", "id_mesa"], height=460)

elif active_module == "Delivery":
    section_header("Delivery y canales online", "Pedidos externos, canales, despacho y cola de cocina.")
    delivery_df = pedidos[pedidos["origen"].astype(str).str.lower().isin(["rappi", "pedidosya"])] if "origen" in pedidos.columns and not pedidos.empty else pd.DataFrame()
    cols = st.columns(4)
    cols[0].metric("Pedidos online", len(delivery_df))
    cols[1].metric("Canales", 2)
    cols[2].metric("Activos", len(comandas_abiertas))
    cols[3].metric("Listos", int((pedidos["estado_comanda"].astype(str).str.lower() == "listo").sum()) if "estado_comanda" in pedidos.columns and not pedidos.empty else 0)
    channel_cols = st.columns(2)
    channel_cols[0].info("Rappi conectado para lectura operativa.")
    channel_cols[1].info("PedidosYa conectado para lectura operativa.")
    render_table(delivery_df, ["id_pedido", "numero_mesa", "origen", "estado_comanda", "fecha_hora", "items"], height=420)

elif active_module == "Ticketera":
    section_header("Ticketera, PDF e impresion", "Cola de tickets, reimpresion, corte de caja y salida para impresora termica.")
    cols = st.columns(4)
    cols[0].metric("Tickets", len(facturas))
    cols[1].metric("Listos cocina", int((pedidos["estado_comanda"].astype(str).str.lower() == "listo").sum()) if "estado_comanda" in pedidos.columns and not pedidos.empty else 0)
    cols[2].metric("Cierres", len(cierres))
    cols[3].metric("Facturado", money(facturacion_total))
    ticket_text = f"El Patron Pro\nFecha: {datetime.now():%Y-%m-%d %H:%M}\nTickets: {len(facturas)}\nFacturado: {money(facturacion_total)}\nTicket promedio: {money(ticket_promedio)}\nESC/POS: preparado\nGracias por su visita."
    st.markdown(f"<div class='ticket'>{ticket_text}</div>", unsafe_allow_html=True)
    c1, c2 = st.columns(2)
    c1.download_button("Descargar ticket TXT", ticket_text.encode("utf-8"), "ticket_el_patron.txt", "text/plain", width="stretch")
    c2.download_button("Descargar facturas CSV", facturas.to_csv(index=False).encode("utf-8-sig"), "facturas_el_patron.csv", "text/csv", width="stretch")
    render_table(facturas, ["numero_factura", "tipo_comprobante", "metodo_pago", "total", "fecha_emision"], height=320)

elif active_module == "Reportes":
    section_header("Reportes / BI", "Ventas, menu, stock, comandas, mermas y lectura gerencial.")
    render_top_metrics()
    chart_cols = st.columns(2)
    with chart_cols[0]:
        st.subheader("Productos por categoria")
        if "categoria" in productos.columns and not productos.empty:
            st.bar_chart(productos["categoria"].fillna("Sin categoria").value_counts(), width="stretch")
        else:
            empty_state("Sin categorias", "No hay productos para graficar.")
    with chart_cols[1]:
        st.subheader("Stock critico")
        if len(stock_critico):
            st.bar_chart(stock_critico.set_index("nombre")["stock_actual"].map(number), width="stretch")
        else:
            empty_state("Stock sano", "No hay insumos bajo minimo.")

elif active_module == "Sistema":
    section_header("Sistema y Supabase", "Salud de tablas, explorador y diagnostico de integracion.")
    render_top_metrics()
    status_filter = st.radio("Filtro de tablas", ["Todas", "OK", "ERROR"], horizontal=True)
    status_df = summary if status_filter == "Todas" else summary[summary["estado"] == status_filter]
    render_table(status_df, ["tabla", "estado", "registros", "detalle"], height=420)
    with st.expander("Explorador de tablas"):
        table_name = st.selectbox("Tabla", APP_TABLES, index=APP_TABLES.index("productos_menu"))
        search = st.text_input("Buscar dentro de la tabla")
        result = fetch_table(supabase_url, supabase_key, table_name, limit=1000)
        df = apply_text_filter(as_dataframe(result["data"]), search) if result["ok"] else pd.DataFrame()
        render_table(df, height=420)

elif active_module == "Backups":
    section_header("Backups", "Descarga de datos operativos para resguardo y auditoria.")
    backup_tables = {name: as_dataframe(table_results[name]["data"]) for name in APP_TABLES if table_results[name]["ok"]}
    cols = st.columns(3)
    cols[0].metric("Tablas listas", len(backup_tables))
    cols[1].metric("Registros", total_records)
    cols[2].metric("Generado", datetime.now().strftime("%H:%M"))
    st.download_button(
        "Descargar backup completo ZIP",
        make_backup_zip(backup_tables),
        file_name=f"backup_el_patron_{datetime.now():%Y%m%d_%H%M}.zip",
        mime="application/zip",
        width="stretch",
    )
    render_table(summary, ["tabla", "estado", "registros", "detalle"], height=420)
