import { Box, Tooltip } from "@mui/material";
import PropTypes from "prop-types";
import { SCORECARD_COLORS } from "./scorecard.format";

/**
 * ============================================
 * KPI CELL - Celda de valor de la matriz del BSC
 * ============================================
 *
 * Celda "tonta": solo pinta texto + color + fondo que le llegan ya resueltos
 * desde scorecard.format.js. Si es editable, reacciona al hover/click; si
 * está pendiente de captura, dibuja el punto naranja con tooltip.
 */
const KpiCell = ({ text, color, background, editable, pending, onClick }) => (
  <Box
    onClick={editable ? onClick : undefined}
    role={editable ? "button" : undefined}
    tabIndex={editable ? 0 : undefined}
    onKeyDown={
      editable
        ? (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          }
        : undefined
    }
    sx={{
      position: "relative",
      height: "100%",
      minHeight: 40,
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "6px 8px",
      backgroundColor: background,
      color,
      fontSize: 13,
      fontVariantNumeric: "tabular-nums",
      cursor: editable ? "pointer" : "default",
      "&:hover": editable
        ? { outline: `1px solid ${SCORECARD_COLORS.perspectiveHeaderBg}`, outlineOffset: "-1px" }
        : undefined,
    }}
  >
    {text}
    {pending && (
      <Tooltip title="Pendiente de captura" arrow>
        <Box
          component="span"
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: SCORECARD_COLORS.pending,
          }}
        />
      </Tooltip>
    )}
  </Box>
);

KpiCell.propTypes = {
  text: PropTypes.node,
  color: PropTypes.string,
  background: PropTypes.string,
  editable: PropTypes.bool,
  pending: PropTypes.bool,
  onClick: PropTypes.func,
};

export default KpiCell;
