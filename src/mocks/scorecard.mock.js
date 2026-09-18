// ============================================================
// MOCK — Balance Score Card
// ============================================================
//
// Sirve el mismo contrato que expondrá /api/scorecard/* (ver sección 2 y 3 de
// CONTRATO-BSC.md) para poder desarrollar y probar la interfaz sin depender del
// backend ni de la base EBI. Se activa con VITE_SCORECARD_MOCK=1 desde
// scorecard.service.js.
//
// Los kpi_id replican exactamente los fijados en la sección 1.4 del contrato
// (trazabilidad con WaPP.Metricos.idMetrico); el resto de los campos son datos
// plausibles, no cifras reales de negocio.

const CURRENT_YEAR = 2026;
const PIPELINE_AS_OF = "2026-09-16T05:32:00";

const PERSPECTIVE_NAMES = {
  1: "Financiera",
  2: "Cliente",
  3: "Procesos internos",
  4: "Capital Humano",
};

const AREAS = [
  { area_id: 1, area_name: "Total EZI", is_plant_view: 0, sort_order: 1 },
  { area_id: 2, area_name: "Plantas", is_plant_view: 1, sort_order: 2 },
  { area_id: 3, area_name: "Logística", is_plant_view: 0, sort_order: 3 },
  { area_id: 4, area_name: "Calidad", is_plant_view: 0, sort_order: 4 },
];

const PLANTS = [
  { plant_id: 0, plant_name: "EZI (consolidado)", in_scorecard: 0 },
  { plant_id: 1, plant_name: "Planta 1", in_scorecard: 1 },
  { plant_id: 2, plant_name: "Planta 2", in_scorecard: 1 },
  { plant_id: 3, plant_name: "Planta 3", in_scorecard: 0 },
  { plant_id: 4, plant_name: "Planta 4", in_scorecard: 1 },
  { plant_id: 5, plant_name: "Planta 5", in_scorecard: 0 },
  { plant_id: 6, plant_name: "Planta 6", in_scorecard: 1 },
  { plant_id: 7, plant_name: "Smart Factory", in_scorecard: 0 },
];

const SCORECARD_PLANT_IDS = PLANTS.filter((p) => p.in_scorecard).map((p) => p.plant_id);
const RELEVANT_PLANT_IDS = [0, ...SCORECARD_PLANT_IDS];

// kpi_id = idMetrico heredado de WaPP.Metricos; kpi_key kebab-case fijado en §1.4 del contrato.
// base/trend/noise son solo parámetros internos del generador, no viajan al catálogo.
const KPI_DEFS = [
  { kpi_id: 1, kpi_key: "ebitda", kpi_name: "EBITDA", kpi_subname: "Margen operativo", perspective_id: 1, formula_text: "Utilidad operativa + depreciación y amortización", unit_name: "Dólares (millones)", unit_format: "$#,0.0", source_type: "manual", higher_is_better: 1, shares_p1_p4: 0, base: 12.5, trend: 0.4, noise: 0.8 },
  { kpi_id: 2, kpi_key: "sales-usd", kpi_name: "Ventas", kpi_subname: "Facturación total", perspective_id: 1, formula_text: "Suma de facturación mensual en USD", unit_name: "Dólares (millones)", unit_format: "$#,0.0", source_type: "computed", higher_is_better: 1, shares_p1_p4: 1, base: 45.0, trend: 1.1, noise: 2.0 },
  { kpi_id: 3, kpi_key: "sales-usd-ex-sisamex", kpi_name: "Ventas sin Sisamex", kpi_subname: "Excluye cliente interno", perspective_id: 1, formula_text: "Ventas − facturación a Sisamex", unit_name: "Dólares (millones)", unit_format: "$#,0.0", source_type: "computed", higher_is_better: 1, shares_p1_p4: 1, base: 40.0, trend: 1.0, noise: 1.8 },
  { kpi_id: 4, kpi_key: "raw-material-inventory-days", kpi_name: "Días de inventario MP", kpi_subname: "Materia prima", perspective_id: 3, formula_text: "Inventario de MP / consumo diario promedio", unit_name: "Días", unit_format: "0.0", source_type: "manual", higher_is_better: 0, shares_p1_p4: 0, base: 18.5, trend: -0.2, noise: 1.2 },
  { kpi_id: 7, kpi_key: "external-ppm", kpi_name: "PPM externo", kpi_subname: "Defectos en cliente", perspective_id: 2, formula_text: "Piezas defectuosas / piezas embarcadas × 1,000,000", unit_name: "PPM", unit_format: "#,##0", source_type: "manual", higher_is_better: 0, shares_p1_p4: 0, base: 850, trend: -20, noise: 90 },
  { kpi_id: 8, kpi_key: "on-time-shipping", kpi_name: "Entregas a tiempo", kpi_subname: "OTD embarques", perspective_id: 2, formula_text: "Embarques a tiempo / embarques totales", unit_name: "Porcentaje", unit_format: "0.0 %", source_type: "computed", higher_is_better: 1, shares_p1_p4: 1, base: 0.94, trend: 0.004, noise: 0.02 },
  { kpi_id: 9, kpi_key: "ppap-on-time", kpi_name: "PPAP a tiempo", kpi_subname: "Aprobaciones de proceso", perspective_id: 2, formula_text: "PPAP entregados a tiempo / PPAP comprometidos", unit_name: "Porcentaje", unit_format: "0.0 %", source_type: "manual", higher_is_better: 1, shares_p1_p4: 0, base: 0.92, trend: 0.003, noise: 0.03 },
  { kpi_id: 10, kpi_key: "laser-scrap", kpi_name: "Scrap de láser", kpi_subname: "Corte", perspective_id: 3, formula_text: "Kg de scrap / kg procesados", unit_name: "Porcentaje", unit_format: "0.0 %", source_type: "computed", higher_is_better: 0, shares_p1_p4: 0, base: 0.035, trend: -0.001, noise: 0.006 },
  { kpi_id: 11, kpi_key: "productivity", kpi_name: "Productividad", kpi_subname: "Piezas por hora hombre", perspective_id: 3, formula_text: "Piezas producidas / horas hombre disponibles", unit_name: "Piezas/hora", unit_format: "0.0", source_type: "computed", higher_is_better: 1, shares_p1_p4: 1, base: 42.0, trend: 0.5, noise: 1.5 },
  { kpi_id: 12, kpi_key: "retention", kpi_name: "Retención de personal", kpi_subname: "Rotación inversa", perspective_id: 4, formula_text: "1 − (bajas / plantilla promedio)", unit_name: "Porcentaje", unit_format: "0.0 %", source_type: "manual", higher_is_better: 1, shares_p1_p4: 0, base: 0.95, trend: 0.002, noise: 0.015 },
  { kpi_id: 13, kpi_key: "turnover", kpi_name: "Rotación de personal", kpi_subname: "Bajas del periodo", perspective_id: 4, formula_text: "Bajas del periodo / plantilla promedio", unit_name: "Porcentaje", unit_format: "0.0 %", source_type: "manual", higher_is_better: 0, shares_p1_p4: 0, base: 0.08, trend: -0.001, noise: 0.015 },
  { kpi_id: 15, kpi_key: "customer-claims", kpi_name: "Quejas de cliente", kpi_subname: "Reclamos formales", perspective_id: 2, formula_text: "Conteo de quejas formales recibidas en el periodo", unit_name: "Quejas", unit_format: "#,##0", source_type: "manual", higher_is_better: 0, shares_p1_p4: 0, base: 6, trend: -0.1, noise: 2 },
  { kpi_id: 16, kpi_key: "cost-of-poor-quality", kpi_name: "Costo de mala calidad", kpi_subname: "COPQ", perspective_id: 3, formula_text: "Retrabajo + scrap + devoluciones", unit_name: "Dólares (millones)", unit_format: "$#,0.0", source_type: "computed", higher_is_better: 0, shares_p1_p4: 1, base: 2.1, trend: -0.03, noise: 0.25 },
  { kpi_id: 17, kpi_key: "plan-compliance", kpi_name: "Cumplimiento de plan", kpi_subname: "Plan de producción", perspective_id: 3, formula_text: "Piezas producidas / piezas planeadas", unit_name: "Porcentaje", unit_format: "0.0 %", source_type: "computed", higher_is_better: 1, shares_p1_p4: 0, base: 0.9, trend: 0.002, noise: 0.03 },
  { kpi_id: 19, kpi_key: "safety-osha-rate", kpi_name: "Índice de seguridad", kpi_subname: "Tasa OSHA", perspective_id: 4, formula_text: "Incidentes registrables × 200,000 / horas trabajadas", unit_name: "Índice", unit_format: "0.0", source_type: "manual", higher_is_better: 0, shares_p1_p4: 0, base: 1.2, trend: -0.02, noise: 0.3 },
  { kpi_id: 32, kpi_key: "training-plan", kpi_name: "Plan de capacitación", kpi_subname: "Cumplimiento de horas", perspective_id: 4, formula_text: "Horas de capacitación impartidas / horas planeadas", unit_name: "Porcentaje", unit_format: "0.0 %", source_type: "manual", higher_is_better: 1, shares_p1_p4: 0, base: 0.85, trend: 0.004, noise: 0.04 },
  { kpi_id: 33, kpi_key: "headcount-coverage", kpi_name: "Cobertura de plantilla", kpi_subname: "Vacantes cubiertas", perspective_id: 4, formula_text: "Plazas cubiertas al cierre del periodo", unit_name: "Personas", unit_format: "0", source_type: "manual", higher_is_better: 1, shares_p1_p4: 0, base: 96, trend: 0.3, noise: 3 },
];

const KPI_BY_ID = new Map(KPI_DEFS.map((def) => [def.kpi_id, def]));

// Pesos por área (bridge_scorecard_kpi.weight). No tienen por qué sumar 100 entre
// áreas distintas: cada área pondera su propio subconjunto de KPI.
const AREA_KPI_WEIGHTS = {
  1: { 1: 10, 2: 15, 3: 5, 7: 5, 8: 10, 9: 5, 15: 5, 4: 5, 10: 5, 11: 5, 16: 5, 17: 5, 12: 5, 13: 5, 19: 5, 32: 3, 33: 2 },
  2: { 8: 15, 4: 10, 10: 15, 11: 15, 16: 15, 17: 15, 19: 10, 32: 5 },
  3: { 8: 30, 7: 25, 4: 25, 15: 20 },
  4: { 10: 25, 16: 25, 9: 20, 15: 15, 7: 15 },
};

function buildAreaKpis(areaId, weights) {
  const rows = Object.entries(weights).map(([kpiIdStr, weight]) => {
    const def = KPI_BY_ID.get(Number(kpiIdStr));
    return { def, weight };
  });
  rows.sort((a, b) => a.def.perspective_id - b.def.perspective_id || a.def.kpi_id - b.def.kpi_id);
  return rows.map((r, idx) => ({
    area_id: areaId,
    kpi_id: r.def.kpi_id,
    kpi_key: r.def.kpi_key,
    kpi_name: r.def.kpi_name,
    kpi_subname: r.def.kpi_subname,
    perspective_id: r.def.perspective_id,
    perspective_name: PERSPECTIVE_NAMES[r.def.perspective_id],
    formula_text: r.def.formula_text,
    unit_format: r.def.unit_format,
    source_type: r.def.source_type,
    higher_is_better: r.def.higher_is_better,
    shares_p1_p4: r.def.shares_p1_p4,
    weight: r.weight,
    sort_order: idx + 1,
    note: null,
  }));
}

const ALL_KPIS = AREAS.flatMap((area) => buildAreaKpis(area.area_id, AREA_KPI_WEIGHTS[area.area_id]));

// -------------------------------------------------------------------------
// Generador determinista de valores (mismo seed -> mismo número siempre)
// -------------------------------------------------------------------------

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function pseudoRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x); // [0, 1)
}

function decimalsFor(unitFormat) {
  if (unitFormat.includes("%")) return 4;
  if (unitFormat === "$#,0.0") return 2;
  if (unitFormat === "0.0") return 2;
  return 0; // '#,##0' y '0'
}

// Participación relativa de cada planta sobre el consolidado (suma 1.0);
// solo se usa para KPI "extensivos" (montos que sí se reparten entre plantas).
const PLANT_SHARE = { 1: 0.32, 2: 0.24, 4: 0.2, 6: 0.24 };
const EXTENSIVE_KPI_IDS = new Set([1, 2, 3, 16, 33]);

function valueFor(def, plantId, year, month) {
  const yearsFromBase = year - 2024;
  const seasonal = month ? Math.sin((month / 12) * Math.PI * 2) * def.noise * 0.5 : 0;
  const seed = def.kpi_id * 977 + plantId * 313 + year * 131 + month * 71;
  const noise = (pseudoRandom(seed) - 0.5) * 2 * def.noise;
  const scale = plantId !== 0 && EXTENSIVE_KPI_IDS.has(def.kpi_id) ? (PLANT_SHARE[plantId] ?? 0.25) : 1;
  const raw = def.base * scale + def.trend * yearsFromBase * scale + seasonal + noise;
  return round(Math.max(raw, 0), decimalsFor(def.unit_format));
}

function periodsForYear(year) {
  return year === CURRENT_YEAR ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [0];
}

// ---- Valores computados (inmutables: los publica el pipeline, no el usuario) ----

const computedRows = [];
for (const def of KPI_DEFS) {
  if (def.source_type !== "computed") continue;
  for (const plantId of RELEVANT_PLANT_IDS) {
    for (const year of [2024, 2025, 2026]) {
      for (const month of periodsForYear(year)) {
        computedRows.push({
          kpi_id: def.kpi_id,
          plant_id: plantId,
          period_year: year,
          period_month: month,
          value: valueFor(def, plantId, year, month),
          source: "computed",
          as_of: PIPELINE_AS_OF,
          entered_by: null,
          comment: null,
        });
      }
    }
  }
}

// ---- Valores manuales (mutables: "capture.kpi_entry", última captura gana) ----

function manualKey(kpiId, plantId, year, month) {
  return `${kpiId}|${plantId}|${year}|${month}`;
}

const manualStore = new Map();

function setManual(def, plantId, year, month, { entered_by, entered_at, source, comment = null }) {
  manualStore.set(manualKey(def.kpi_id, plantId, year, month), {
    kpi_id: def.kpi_id,
    plant_id: plantId,
    period_year: year,
    period_month: month,
    value: valueFor(def, plantId, year, month),
    source,
    as_of: entered_at,
    entered_by,
    comment,
  });
}

// Huecos deliberados: captura manual faltante en un mes ya cerrado (dispara el
// punto naranja "Pendiente de captura"). Todos caen en meses <= agosto/2026.
const DELIBERATE_GAPS = new Set([
  manualKey(13, 0, 2026, 4),
  manualKey(19, 0, 2026, 6),
  manualKey(33, 0, 2026, 7),
  manualKey(32, 1, 2026, 3),
  manualKey(4, 2, 2026, 5),
]);

const ENTERED_BY_POOL = ["ARamos", "jgomez", "lmartinez"];
let seedCounter = 0;

for (const def of KPI_DEFS) {
  if (def.source_type !== "manual") continue;
  for (const plantId of RELEVANT_PLANT_IDS) {
    for (const year of [2024, 2025, 2026]) {
      for (const month of periodsForYear(year)) {
        // El YTD/anual del año en curso (month 0) se deja sin precargar a propósito:
        // nace de una captura explícita del usuario, no de un promedio inventado.
        if (month === 0 && year === CURRENT_YEAR) continue;
        const key = manualKey(def.kpi_id, plantId, year, month);
        if (DELIBERATE_GAPS.has(key)) continue;

        const isHistoric = year !== CURRENT_YEAR;
        seedCounter += 1;
        setManual(def, plantId, year, month, {
          entered_by: isHistoric ? "wapp-migration" : ENTERED_BY_POOL[seedCounter % ENTERED_BY_POOL.length],
          entered_at: isHistoric ? `${year}-12-20T09:00:00` : `2026-${String(month).padStart(2, "0")}-05T09:00:00`,
          source: isHistoric ? "wapp-migration" : "web",
        });
      }
    }
  }
}

// Un par de comentarios de ejemplo sobre capturas ya sembradas.
const ppapEntry = manualStore.get(manualKey(9, 0, 2026, 3));
if (ppapEntry) ppapEntry.comment = "Se recalculó tras el cierre de PPAP con Navistar.";
const claimsEntry = manualStore.get(manualKey(15, 0, 2026, 2));
if (claimsEntry) claimsEntry.comment = "Incluye una queja reabierta de Bobcat.";

// -------------------------------------------------------------------------
// Metas (capture.kpi_target)
// -------------------------------------------------------------------------

const TARGETS = [];
function addTarget(kpiId, plantId, targetValue, higherIsBetter, validFrom, validTo = null) {
  TARGETS.push({
    kpi_id: kpiId,
    plant_id: plantId,
    target_value: targetValue,
    higher_is_better: higherIsBetter,
    valid_from: validFrom,
    valid_to: validTo,
  });
}

for (const def of KPI_DEFS) {
  addTarget(def.kpi_id, 0, round(def.base, decimalsFor(def.unit_format)), def.higher_is_better, "2024-01-01", null);
}
// Meta más exigente vigente desde 2026 para Ventas: dos filas activas y solapadas
// a propósito, para ejercitar "si hay varias, la de valid_from mayor" (§3 del contrato).
addTarget(2, 0, round(KPI_DEFS.find((d) => d.kpi_id === 2).base * 1.08, 2), 1, "2026-01-01", null);

// Metas por planta para los KPI que participan en la vista "Plantas". Los KPI
// "extensivos" (montos) se reparten con la misma PLANT_SHARE que valueFor(), para
// comparar manzanas con manzanas; los de tasa/índice usan la meta consolidada tal cual.
const PLANT_VIEW_KPI_IDS = Object.keys(AREA_KPI_WEIGHTS[2]).map(Number);
for (const kpiId of PLANT_VIEW_KPI_IDS) {
  const def = KPI_BY_ID.get(kpiId);
  for (const plantId of SCORECARD_PLANT_IDS) {
    const scale = EXTENSIVE_KPI_IDS.has(kpiId) ? (PLANT_SHARE[plantId] ?? 0.25) : 1;
    addTarget(kpiId, plantId, round(def.base * scale, decimalsFor(def.unit_format)), def.higher_is_better, "2024-01-01", null);
  }
}

// -------------------------------------------------------------------------
// API pública del mock (misma forma que /api/scorecard/*)
// -------------------------------------------------------------------------

export const scorecardMock = {
  getCatalog: async () => ({
    success: true,
    user: { idUsuario: 0, login: "demo", name: "Modo demostración", isAdmin: true },
    areas: AREAS,
    plants: PLANTS,
    kpis: ALL_KPIS,
    editable: { all: true, kpi_ids: [] },
    current_year: CURRENT_YEAR,
  }),

  getValues: async (areaId, year) => {
    const numericAreaId = Number(areaId);
    const numericYear = Number(year);
    const area = AREAS.find((a) => a.area_id === numericAreaId);
    if (!area) {
      return { success: false, message: `Área ${areaId} no existe en el catálogo del Balance Score Card.` };
    }
    const plantIds = area.is_plant_view ? SCORECARD_PLANT_IDS : [0];
    const kpiIds = new Set(ALL_KPIS.filter((k) => k.area_id === numericAreaId).map((k) => k.kpi_id));
    const years = new Set([numericYear - 2, numericYear - 1, numericYear]);

    const values = [];
    for (const row of computedRows) {
      if (kpiIds.has(row.kpi_id) && plantIds.includes(row.plant_id) && years.has(row.period_year)) {
        values.push(row);
      }
    }
    for (const row of manualStore.values()) {
      if (kpiIds.has(row.kpi_id) && plantIds.includes(row.plant_id) && years.has(row.period_year)) {
        values.push(row);
      }
    }

    const targets = TARGETS.filter((t) => kpiIds.has(t.kpi_id) && plantIds.includes(t.plant_id));

    const computedAsOfCandidates = values.filter((v) => v.source === "computed").map((v) => v.as_of);
    const computedAsOf = computedAsOfCandidates.length ? computedAsOfCandidates.sort().at(-1) : null;

    return {
      success: true,
      area_id: numericAreaId,
      year: numericYear,
      plant_ids: plantIds,
      values,
      targets,
      computed_as_of: computedAsOf,
    };
  },

  postEntry: async (entry) => {
    const { kpi_id, plant_id, period_year, period_month, value, comment } = entry || {};
    const def = KPI_BY_ID.get(Number(kpi_id));
    if (!def) {
      return { success: false, message: "El KPI indicado no existe en el catálogo." };
    }
    if (def.source_type !== "manual") {
      return { success: false, message: "Este KPI es automático; no admite captura manual." };
    }
    const row = {
      kpi_id: def.kpi_id,
      plant_id: Number(plant_id),
      period_year: Number(period_year),
      period_month: Number(period_month),
      value: value === null || value === undefined || value === "" ? null : Number(value),
      source: "web",
      as_of: new Date().toISOString(),
      entered_by: "demo",
      comment: comment || null,
    };
    manualStore.set(manualKey(row.kpi_id, row.plant_id, row.period_year, row.period_month), row);
    return { success: true, entry: row };
  },
};

export default scorecardMock;
