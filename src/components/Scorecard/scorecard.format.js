// ============================================================
// Balance Score Card — funciones puras de formato, color y vigencia de meta
// ============================================================
//
// Reglas heredadas del BSC en Power BI (ver sección 3 de CONTRATO-BSC.md).
// Sin dependencias de React ni de MUI: solo transforman datos, así que se
// pueden usar igual desde ScorecardMatrix, KpiCell o el propio KpiEntryDialog.

export const SCORECARD_COLORS = {
  historic: "#999999",
  neutral: "#000000",
  good: "#05A005",
  bad: "#FF0000",
  targetBg: "#EFEDF0",
  regularBg: "#F5F3F5",
  pending: "#ff5c35",
  perspectiveHeaderBg: "#373a36",
  perspectiveHeaderText: "#ffffff",
};

export const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/**
 * Último mes cerrado para un año dado:
 * - año en curso -> mes anterior al actual
 * - año pasado -> 12 (todo el año está cerrado)
 * - año futuro -> 0 (nada está cerrado todavía)
 */
export function getLastClosedMonth(year, referenceDate = new Date()) {
  const currentYear = referenceDate.getFullYear();
  if (year < currentYear) return 12;
  if (year > currentYear) return 0;
  return referenceDate.getMonth(); // getMonth() es 0-based: ya es "mes actual (1-based) - 1"
}

/**
 * Formatea un valor según unit_format (misma regla para el valor y para la meta).
 */
export function formatKpiValue(value, unitFormat) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const numeric = Number(value);
  if (!unitFormat) return String(numeric);
  if (unitFormat.includes("%")) return `${(numeric * 100).toFixed(1)} %`;
  if (unitFormat === "$#,0.0") {
    return `$${numeric.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
  }
  if (unitFormat === "#,##0") return Math.round(numeric).toLocaleString("en-US");
  if (unitFormat === "0.0") return numeric.toFixed(1);
  if (unitFormat === "0") return String(Math.round(numeric));
  return String(numeric);
}

// "La meta se formatea igual que el valor" (§3 del contrato).
export const formatTargetValue = formatKpiValue;

function periodBounds(year, month) {
  if (!month) {
    return { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year, 11, 31)) };
  }
  return { start: new Date(Date.UTC(year, month - 1, 1)), end: new Date(Date.UTC(year, month, 0)) };
}

/**
 * Meta vigente para (kpi, planta, periodo): valid_from <= fin del periodo y
 * (valid_to nulo o >= inicio del periodo). Si hay varias, gana la de valid_from mayor.
 */
export function resolveTarget(targets, kpiId, plantId, year, month) {
  if (!targets?.length) return null;
  const { start, end } = periodBounds(year, month);
  const candidates = targets.filter((t) => {
    if (t.kpi_id !== kpiId || t.plant_id !== plantId) return false;
    const validFrom = new Date(`${t.valid_from}T00:00:00Z`);
    const validTo = t.valid_to ? new Date(`${t.valid_to}T00:00:00Z`) : null;
    return validFrom <= end && (!validTo || validTo >= start);
  });
  if (!candidates.length) return null;
  return candidates.reduce((latest, t) => (t.valid_from > latest.valid_from ? t : latest));
}

/**
 * Color del valor: gris en histórico, negro sin meta, verde/rojo según
 * higher_is_better al comparar contra la meta vigente.
 */
export function getValueColor({ value, target, higherIsBetter }) {
  if (value === null || value === undefined || !target) return SCORECARD_COLORS.neutral;
  const meetsTarget = higherIsBetter === 0 ? value <= target.target_value : value >= target.target_value;
  return meetsTarget ? SCORECARD_COLORS.good : SCORECARD_COLORS.bad;
}

/** Fondo de celda: #EFEDF0 para Meta/YTD, #F5F3F5 el resto. */
export function getCellBackground(column) {
  return column === "target" || column === "ytd" ? SCORECARD_COLORS.targetBg : SCORECARD_COLORS.regularBg;
}

/** Punto naranja "Pendiente de captura": solo meses (no anual/YTD) de un KPI manual, sin dato, ya cerrados. */
export function isPendingCapture({ sourceType, value, column, month, lastClosedMonth }) {
  if (sourceType !== "manual") return false;
  if (column !== "month") return false;
  if (value !== null && value !== undefined) return false;
  return month >= 1 && month <= lastClosedMonth;
}

/** Índice rápido values[] -> Map por llave kpi|planta|año|mes. */
export function buildValueMap(values) {
  const map = new Map();
  for (const row of values || []) {
    map.set(`${row.kpi_id}|${row.plant_id}|${row.period_year}|${row.period_month}`, row);
  }
  return map;
}

/**
 * Arma todo lo que necesita una celda de la matriz: texto formateado, color,
 * fondo, si es editable y si debe mostrar el punto de "pendiente de captura".
 *
 * @param {'y2'|'y1'|'target'|'month'|'ytd'} column
 */
export function getCellModel({ kpi, plantId, year, column, month, valueMap, targets, lastClosedMonth, canEdit }) {
  if (column === "target") {
    const refMonth = lastClosedMonth >= 1 ? lastClosedMonth : 1;
    const target = resolveTarget(targets, kpi.kpi_id, plantId, year, refMonth);
    return {
      text: target ? formatTargetValue(target.target_value, kpi.unit_format) : "—",
      color: SCORECARD_COLORS.neutral,
      background: SCORECARD_COLORS.targetBg,
      editable: false,
      pending: false,
      value: target?.target_value ?? null,
      periodYear: year,
      periodMonth: 0,
    };
  }

  const isHistoric = column === "y2" || column === "y1";
  const periodYear = column === "y2" ? year - 2 : column === "y1" ? year - 1 : year;
  const periodMonth = column === "month" ? month : 0;

  const row = valueMap.get(`${kpi.kpi_id}|${plantId}|${periodYear}|${periodMonth}`) || null;
  const value = row ? row.value : null;

  let target = null;
  if (column === "month") {
    target = resolveTarget(targets, kpi.kpi_id, plantId, periodYear, periodMonth);
  } else if (column === "ytd") {
    const refMonth = lastClosedMonth >= 1 ? lastClosedMonth : 1;
    target = resolveTarget(targets, kpi.kpi_id, plantId, periodYear, refMonth);
  }

  const pending = isPendingCapture({
    sourceType: kpi.source_type,
    value,
    column,
    month: periodMonth,
    lastClosedMonth,
  });

  return {
    text: formatKpiValue(value, kpi.unit_format),
    color: isHistoric ? SCORECARD_COLORS.historic : getValueColor({ value, target, higherIsBetter: kpi.higher_is_better }),
    background: getCellBackground(column),
    editable: Boolean(canEdit) && kpi.source_type === "manual" && !isHistoric,
    pending,
    value,
    row,
    periodYear,
    periodMonth,
  };
}

/** Formatea el "Automáticos al:" del pie de página. */
export function formatAsOf(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
