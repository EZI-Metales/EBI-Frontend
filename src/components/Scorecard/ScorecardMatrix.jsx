import { useMemo, Fragment } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Typography, Chip, Tooltip } from "@mui/material";
import PropTypes from "prop-types";
import KpiCell from "./KpiCell";
import { MONTH_LABELS, SCORECARD_COLORS, buildValueMap, getCellModel } from "./scorecard.format";

const FIRST_COL_WIDTH = 240;

const HEADER_SX = {
  backgroundColor: SCORECARD_COLORS.perspectiveHeaderBg,
  color: SCORECARD_COLORS.perspectiveHeaderText,
  fontWeight: 600,
  whiteSpace: "nowrap",
};

/**
 * ============================================
 * SCORECARD MATRIX - Tabla del Balance Score Card
 * ============================================
 *
 * Agrupa los KPI del área por perspectiva (encabezado gris carbón) y arma,
 * por cada uno, las columnas fijas Y-2 | Y-1 | Meta | Ene..Dic | Y (YTD).
 * `stickyHeader` fija el encabezado; la primera columna se fija aparte con
 * position:sticky/left:0 para que el nombre del KPI no se pierda al hacer
 * scroll horizontal (overflow-x del TableContainer).
 */
const ScorecardMatrix = ({ kpis, values, targets, year, plantId, lastClosedMonth, canEditKpi, onEditCell }) => {
  const valueMap = useMemo(() => buildValueMap(values), [values]);

  const groups = useMemo(() => {
    const map = new Map();
    kpis.forEach((kpi) => {
      if (!map.has(kpi.perspective_id)) {
        map.set(kpi.perspective_id, { name: kpi.perspective_name, items: [] });
      }
      map.get(kpi.perspective_id).items.push(kpi);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([perspectiveId, group]) => ({ perspectiveId, ...group }));
  }, [kpis]);

  const columns = useMemo(
    () => [
      { key: "y2", label: String(year - 2) },
      { key: "y1", label: String(year - 1) },
      { key: "target", label: "Meta" },
      ...Array.from({ length: 12 }, (_, i) => ({ key: "month", month: i + 1, label: MONTH_LABELS[i] })),
      { key: "ytd", label: String(year), sublabel: "YTD" },
    ],
    [year]
  );

  if (!kpis.length) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, p: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No hay KPI configurados para esta selección.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer sx={{ flex: 1, overflow: "auto", border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
      <Table stickyHeader size="small" sx={{ borderCollapse: "separate" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...HEADER_SX, position: "sticky", left: 0, zIndex: 5, minWidth: FIRST_COL_WIDTH }}>KPI</TableCell>
            {columns.map((col) => (
              <TableCell key={`${col.key}-${col.month || ""}`} align="center" sx={{ ...HEADER_SX, minWidth: 84 }}>
                {col.label}
                {col.sublabel && (
                  <Typography variant="caption" component="div" sx={{ color: "inherit", opacity: 0.85, lineHeight: 1 }}>
                    {col.sublabel}
                  </Typography>
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map((group) => (
            <Fragment key={group.perspectiveId}>
              <TableRow>
                <TableCell colSpan={columns.length + 1} sx={{ ...HEADER_SX, position: "sticky", left: 0, zIndex: 2 }}>
                  {group.name}
                </TableCell>
              </TableRow>
              {group.items.map((kpi) => {
                const canEdit = canEditKpi(kpi);
                return (
                  <TableRow key={kpi.kpi_id} hover>
                    <TableCell
                      sx={{
                        position: "sticky",
                        left: 0,
                        zIndex: 1,
                        backgroundColor: "background.paper",
                        minWidth: FIRST_COL_WIDTH,
                        borderRight: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Tooltip title={kpi.formula_text || ""} arrow placement="right">
                        <Box>
                          <Typography sx={{ fontFamily: "Montserrat", fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>
                            {kpi.kpi_name}
                          </Typography>
                          {kpi.kpi_subname && (
                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", lineHeight: 1.3 }}>
                              {kpi.kpi_subname}
                            </Typography>
                          )}
                          <Chip label={`Peso ${kpi.weight}`} size="small" sx={{ mt: 0.5, height: 18, fontSize: 10 }} />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    {columns.map((col) => {
                      const cell = getCellModel({
                        kpi,
                        plantId,
                        year,
                        column: col.key,
                        month: col.month,
                        valueMap,
                        targets,
                        lastClosedMonth,
                        canEdit,
                      });
                      return (
                        <TableCell
                          key={`${kpi.kpi_id}-${col.key}-${col.month || ""}`}
                          align="center"
                          sx={{ p: 0, borderRight: "1px solid", borderColor: "divider" }}
                        >
                          <KpiCell
                            text={cell.text}
                            color={cell.color}
                            background={cell.background}
                            editable={cell.editable}
                            pending={cell.pending}
                            onClick={() =>
                              onEditCell({
                                kpi,
                                plantId,
                                periodYear: cell.periodYear,
                                periodMonth: cell.periodMonth,
                                currentValue: cell.value,
                                currentComment: cell.row?.comment || "",
                              })
                            }
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

ScorecardMatrix.propTypes = {
  kpis: PropTypes.arrayOf(
    PropTypes.shape({
      kpi_id: PropTypes.number.isRequired,
      kpi_name: PropTypes.string.isRequired,
      kpi_subname: PropTypes.string,
      perspective_id: PropTypes.number.isRequired,
      perspective_name: PropTypes.string.isRequired,
      formula_text: PropTypes.string,
      unit_format: PropTypes.string.isRequired,
      source_type: PropTypes.oneOf(["computed", "manual"]).isRequired,
      higher_is_better: PropTypes.number,
      weight: PropTypes.number,
    })
  ).isRequired,
  values: PropTypes.array.isRequired,
  targets: PropTypes.array.isRequired,
  year: PropTypes.number.isRequired,
  plantId: PropTypes.number.isRequired,
  lastClosedMonth: PropTypes.number.isRequired,
  canEditKpi: PropTypes.func.isRequired,
  onEditCell: PropTypes.func.isRequired,
};

export default ScorecardMatrix;
