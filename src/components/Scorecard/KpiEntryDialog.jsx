import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, Alert, Box } from "@mui/material";
import PropTypes from "prop-types";

const isPercentFormat = (unitFormat) => Boolean(unitFormat?.includes("%"));

/**
 * ============================================
 * KPI ENTRY DIALOG - Captura manual de una celda
 * ============================================
 *
 * Diálogo de captura para KPI 'manual'. Para formatos con '%' el operador
 * teclea el número en porcentaje (ej. 94.2) y aquí se guarda ÷100 (0.942),
 * tal como lo pide la sección 3 del contrato.
 */
const KpiEntryDialog = ({ open, context, onClose, onSave }) => {
  const [inputValue, setInputValue] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !context) return;
    const { kpi, currentValue, currentComment } = context;
    const percent = isPercentFormat(kpi.unit_format);
    const displayValue =
      currentValue === null || currentValue === undefined ? "" : percent ? round2(currentValue * 100) : currentValue;
    setInputValue(displayValue === "" ? "" : String(displayValue));
    setComment(currentComment || "");
    setError("");
  }, [open, context]);

  if (!context) return null;

  const { kpi, periodYear, periodMonth } = context;
  const percent = isPercentFormat(kpi.unit_format);
  const periodLabel = periodMonth === 0 ? `${periodYear} (acumulado)` : `${String(periodMonth).padStart(2, "0")}/${periodYear}`;

  const handleSave = async () => {
    setError("");
    if (inputValue.trim() === "") {
      setError("Captura un valor o cancela.");
      return;
    }
    const parsed = Number(inputValue);
    if (Number.isNaN(parsed)) {
      setError("El valor debe ser numérico.");
      return;
    }
    const value = percent ? parsed / 100 : parsed;
    setSaving(true);
    try {
      await onSave({
        kpi_id: kpi.kpi_id,
        plant_id: context.plantId,
        period_year: periodYear,
        period_month: periodMonth,
        value,
        comment: comment || undefined,
      });
    } catch (err) {
      setError(err?.message || "No se pudo guardar la captura.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontFamily: "Montserrat", fontWeight: 600 }}>Captura de {kpi.kpi_name}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {kpi.kpi_subname ? `${kpi.kpi_subname} · ` : ""}Periodo {periodLabel}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            autoFocus
            label={percent ? "Valor (%)" : "Valor"}
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            fullWidth
            slotProps={{ htmlInput: { step: "any" } }}
          />
          <TextField
            label="Comentario (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

function round2(n) {
  return Math.round(n * 100) / 100;
}

KpiEntryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  context: PropTypes.shape({
    kpi: PropTypes.shape({
      kpi_id: PropTypes.number.isRequired,
      kpi_name: PropTypes.string.isRequired,
      kpi_subname: PropTypes.string,
      unit_format: PropTypes.string,
    }).isRequired,
    plantId: PropTypes.number.isRequired,
    periodYear: PropTypes.number.isRequired,
    periodMonth: PropTypes.number.isRequired,
    currentValue: PropTypes.number,
    currentComment: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default KpiEntryDialog;
