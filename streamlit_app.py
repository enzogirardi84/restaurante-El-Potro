import os
from typing import Any

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


def get_secret(name: str) -> str:
    if name in st.secrets:
        return str(st.secrets[name])
    return os.getenv(name, "")


@st.cache_resource(show_spinner=False)
def get_supabase_client(url: str, key: str):
    if not url or not key:
        return None
    return create_client(url.rstrip("/"), key)


def fetch_table(client: Any, table_name: str, limit: int = 25) -> tuple[list[dict[str, Any]], str | None]:
    try:
        response = client.table(table_name).select("*").limit(limit).execute()
        return response.data or [], None
    except Exception as exc:
        return [], str(exc)


st.set_page_config(
    page_title="El Patrón Pro",
    page_icon="🍽️",
    layout="wide",
)

st.title("El Patrón Pro")
st.caption("Panel Streamlit de conexión, diagnóstico y lectura rápida de Supabase.")

supabase_url = get_secret("SUPABASE_URL")
supabase_key = get_secret("SUPABASE_ANON_KEY")
client = get_supabase_client(supabase_url, supabase_key)

with st.sidebar:
    st.header("Conexión")
    st.write("Supabase URL:", supabase_url or "Sin configurar")
    st.write("Anon key:", "Configurada" if supabase_key else "Sin configurar")
    st.divider()
    st.caption("Configurar en `.streamlit/secrets.toml` o Streamlit Cloud Secrets.")

if not client:
    st.warning("Faltan SUPABASE_URL y SUPABASE_ANON_KEY.")
    st.stop()

summary_rows = []
for table in APP_TABLES:
    rows, error = fetch_table(client, table, limit=1)
    summary_rows.append(
        {
            "tabla": table,
            "estado": "OK" if error is None else "ERROR",
            "detalle": "" if error is None else error[:160],
            "muestra": len(rows),
        }
    )

summary = pd.DataFrame(summary_rows)
ok_count = int((summary["estado"] == "OK").sum())
error_count = int((summary["estado"] == "ERROR").sum())

col_ok, col_error, col_total = st.columns(3)
col_ok.metric("Tablas OK", ok_count)
col_error.metric("Errores", error_count)
col_total.metric("Tablas revisadas", len(APP_TABLES))

st.subheader("Estado de tablas")
st.dataframe(summary, use_container_width=True, hide_index=True)

selected_table = st.selectbox("Ver datos de tabla", APP_TABLES, index=APP_TABLES.index("productos_menu"))
limit = st.slider("Filas a consultar", 5, 100, 25, step=5)
rows, error = fetch_table(client, selected_table, limit=limit)

if error:
    st.error(error)
elif not rows:
    st.info("La tabla existe, pero no tiene datos para mostrar.")
else:
    st.dataframe(pd.DataFrame(rows), use_container_width=True)
