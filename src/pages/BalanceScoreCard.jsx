import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography, Button, Alert } from "@mui/material";
import PropTypes from "prop-types";
import Loading from "@/components/common/Loading";
import ScorecardToolbar from "@/components/Scorecard/ScorecardToolbar";
import ScorecardMatrix from "@/components/Scorecard/ScorecardMatrix";
import KpiEntryDialog from "@/components/Scorecard/KpiEntryDialog";
import { scorecardService } from "@/services/scorecard.service";
import { SCORECARD_COLORS, formatAsOf, getLastClosedMonth } from "@/components/Scorecard/scorecard.format";

const LegendDot = ({ color, label }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
    <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
    <span>{label}</span>
  </Box>
);
LegendDot.propTypes = { color: PropTypes.string.isRequired, label: PropTypes.string.isRequired };

const ScorecardErrorState = ({ error, onRetry }) => {
  const isWaking = error?.code === "EBI_WAKING";
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, flex: 1, p: 4 }}>
      <Alert severity={isWaking ? "info" : "error"} sx={{ maxWidth: 480 }}>
        {isWaking ? "La base está despertando, reintenta en un minuto" : error?.message || "Ocurrió un error inesperado."}
      </Alert>
      <Button variant="outlined" onClick={onRetry}>
        Reintentar
      </Button>
    </Box>
  );
};
ScorecardErrorState.propTypes = {
  error: PropTypes.shape({ code: PropTypes.string, message: PropTypes.string }),
  onRetry: PropTypes.func.isRequired,
};

/**
 * ============================================
 * BALANCE SCORE CARD - Página principal
 * ============================================
 *
 * Orquesta catálogo + valores del servicio scorecard.service.js y arma la
 * matriz agrupada por perspectiva. Vista "Áreas": consolidado (plant_id=0)
 * de un área no-planta. Vista "Plantas": área is_plant_view=1 filtrada a una
 * sola planta a la vez (como el slicer del Power BI original) sin re-pedir
 * los valores al servidor (ya vienen las 4 plantas en la misma respuesta).
 */
const BalanceScoreCard = () => {
  const [catalog, setCatalog] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(null);

  const [view, setView] = useState("areas");
  const [areaId, setAreaId] = useState(null);
  const [plantAreaId, setPlantAreaId] = useState(null);
  const [plantId, setPlantId] = useState(null);
  const [year, setYear] = useState(null);

  const [valuesData, setValuesData] = useState(null);
  const [valuesLoading, setValuesLoading] = useState(false);
  const [valuesError, setValuesError] = useState(null);

  const [dialogContext, setDialogContext] = useState(null);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const data = await scorecardService.getCatalog();
      if (!data.success) {
        setCatalogError({ message: data.message || "No se pudo cargar el catálogo del Balance Score Card." });
        return;
      }
      setCatalog(data);
      const firstArea = data.areas.find((a) => !a.is_plant_view);
      const plantArea = data.areas.find((a) => a.is_plant_view);
      const firstPlant = data.plants.find((p) => p.in_scorecard);
      setAreaId(firstArea?.area_id ?? null);
      setPlantAreaId(plantArea?.area_id ?? null);
      setPlantId(firstPlant?.plant_id ?? null);
      setYear(data.current_year);
    } catch (err) {
      setCatalogError(err || { message: "Error al cargar el catálogo." });
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const effectiveAreaId = view === "plantas" ? plantAreaId : areaId;
  const effectivePlantId = view === "plantas" ? plantId : 0;

  const loadValues = useCallback(async () => {
    if (!effectiveAreaId || !year) return;
    setValuesLoading(true);
    setValuesError(null);
    try {
      const data = await scorecardService.getValues(effectiveAreaId, year);
      if (!data.success) {
        setValuesError({ message: data.message || "No se pudieron cargar los valores." });
        return;
      }
      setValuesData(data);
    } catch (err) {
      setValuesError(err || { message: "Error al cargar los valores." });
    } finally {
      setValuesLoading(false);
    }
  }, [effectiveAreaId, year]);

  useEffect(() => {
    loadValues();
  }, [loadValues]);

  const kpisForArea = useMemo(() => {
    if (!catalog || !effectiveAreaId) return [];
    return catalog.kpis.filter((k) => k.area_id === effectiveAreaId).sort((a, b) => a.sort_order - b.sort_order);
  }, [catalog, effectiveAreaId]);

  const canEditKpi = useCallback(
    (kpi) => {
      if (!catalog || kpi.source_type !== "manual") return false;
      return Boolean(catalog.editable?.all) || Boolean(catalog.editable?.kpi_ids?.includes(kpi.kpi_id));
    },
    [catalog]
  );

  const lastClosedMonth = useMemo(() => (year ? getLastClosedMonth(year) : 0), [year]);
  const years = useMemo(() => (catalog ? [catalog.current_year, catalog.current_year - 1, catalog.current_year - 2] : []), [catalog]);

  const handleSaveEntry = async (entry) => {
    const response = await scorecardService.postEntry(entry);
    if (!response.success) {
      throw new Error(response.message || "No se pudo guardar la captura.");
    }
    setDialogContext(null);
    await loadValues(); // refrescar valores tras capturar (§3 del contrato)
  };

  if (catalogLoading) {
    return <Loading text="Cargando el Balance Score Card..." />;
  }

  if (catalogError) {
    return <ScorecardErrorState error={catalogError} onRetry={loadCatalog} />;
  }

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", gap: 2 }}>
      <Box>
        <Typography variant="h5" sx={{ fontFamily: "Montserrat", fontWeight: 600, mb: 1.5 }}>
          Balance Score Card
        </Typography>
        <ScorecardToolbar
          view={view}
          onViewChange={setView}
          areas={catalog.areas.filter((a) => !a.is_plant_view)}
          areaId={areaId}
          onAreaChange={setAreaId}
          plants={catalog.plants.filter((p) => p.in_scorecard)}
          plantId={plantId}
          onPlantChange={setPlantId}
          years={years}
          year={year}
          onYearChange={setYear}
        />
      </Box>

      {valuesError ? (
        <ScorecardErrorState error={valuesError} onRetry={loadValues} />
      ) : valuesLoading || !valuesData ? (
        <Loading text="Cargando valores..." />
      ) : (
        <>
          <ScorecardMatrix
            kpis={kpisForArea}
            values={valuesData.values}
            targets={valuesData.targets}
            year={year}
            plantId={effectivePlantId}
            lastClosedMonth={lastClosedMonth}
            canEditKpi={canEditKpi}
            onEditCell={setDialogContext}
          />
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 1.5,
              fontSize: 12,
              color: "text.secondary",
            }}
          >
            <span>Automáticos al: {formatAsOf(valuesData.computed_as_of)}</span>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <LegendDot color={SCORECARD_COLORS.good} label="Cumple meta" />
              <LegendDot color={SCORECARD_COLORS.bad} label="No cumple meta" />
              <LegendDot color={SCORECARD_COLORS.historic} label="Histórico" />
              <LegendDot color={SCORECARD_COLORS.pending} label="Pendiente de captura" />
            </Box>
          </Box>
        </>
      )}

      <KpiEntryDialog open={Boolean(dialogContext)} context={dialogContext} onClose={() => setDialogContext(null)} onSave={handleSaveEntry} />
    </Box>
  );
};

export default BalanceScoreCard;
