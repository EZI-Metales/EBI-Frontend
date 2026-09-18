import api from "./api.service";
import { scorecardMock } from "@/mocks/scorecard.mock";

// Modo mock: si VITE_SCORECARD_MOCK=1 el servicio sirve src/mocks/scorecard.mock.js
// en lugar de pegarle al backend. Pensado para desarrollar y probar la pantalla sin
// depender de Backend-EPS ni de la base EBI (ver README.md, sección Balance Score Card).
const USE_MOCK = import.meta.env.VITE_SCORECARD_MOCK === "1";

export const scorecardService = {
  /**
   * Catálogo del Balance Score Card: áreas, plantas, KPI y qué puede capturar el usuario.
   * @returns {Promise<Object>} { success, user, areas, plants, kpis, editable, current_year }
   */
  getCatalog: async () => {
    if (USE_MOCK) return scorecardMock.getCatalog();
    const { data } = await api.get("/scorecard/catalog");
    return data;
  },

  /**
   * Valores y metas de un área para un año (trae también Y-2 y Y-1).
   * @param {number} areaId
   * @param {number} year
   * @returns {Promise<Object>} { success, area_id, year, plant_ids, values, targets, computed_as_of }
   */
  getValues: async (areaId, year) => {
    if (USE_MOCK) return scorecardMock.getValues(areaId, year);
    const { data } = await api.get("/scorecard/values", { params: { area: areaId, year } });
    return data;
  },

  /**
   * Captura manual de una celda (KPI de tipo 'manual' únicamente).
   * @param {{kpi_id:number, plant_id:number, period_year:number, period_month:number, value:number|null, comment?:string}} entry
   * @returns {Promise<Object>} { success, entry }
   */
  postEntry: async (entry) => {
    if (USE_MOCK) return scorecardMock.postEntry(entry);
    const { data } = await api.post("/scorecard/entries", entry);
    return data;
  },
};

export default scorecardService;
