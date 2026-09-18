import { Box, ToggleButton, ToggleButtonGroup, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import PropTypes from "prop-types";

/**
 * ============================================
 * SCORECARD TOOLBAR - Selectores del BSC
 * ============================================
 *
 * Vista (Áreas | Plantas) + Área/Planta según la vista + Año.
 * Se envuelve (flexWrap) para seguir siendo usable a 400px de ancho.
 */
const ScorecardToolbar = ({ view, onViewChange, areas, areaId, onAreaChange, plants, plantId, onPlantChange, years, year, onYearChange }) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
    <ToggleButtonGroup value={view} exclusive size="small" onChange={(_, next) => next && onViewChange(next)} aria-label="Vista">
      <ToggleButton value="areas">Áreas</ToggleButton>
      <ToggleButton value="plantas">Plantas</ToggleButton>
    </ToggleButtonGroup>

    {view === "areas" ? (
      <FormControl size="small" sx={{ minWidth: 190 }}>
        <InputLabel id="bsc-area-label">Área</InputLabel>
        <Select labelId="bsc-area-label" label="Área" value={areaId ?? ""} onChange={(e) => onAreaChange(Number(e.target.value))}>
          {areas.map((a) => (
            <MenuItem key={a.area_id} value={a.area_id}>
              {a.area_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    ) : (
      <FormControl size="small" sx={{ minWidth: 190 }}>
        <InputLabel id="bsc-plant-label">Planta</InputLabel>
        <Select labelId="bsc-plant-label" label="Planta" value={plantId ?? ""} onChange={(e) => onPlantChange(Number(e.target.value))}>
          {plants.map((p) => (
            <MenuItem key={p.plant_id} value={p.plant_id}>
              {p.plant_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )}

    <FormControl size="small" sx={{ minWidth: 110 }}>
      <InputLabel id="bsc-year-label">Año</InputLabel>
      <Select labelId="bsc-year-label" label="Año" value={year ?? ""} onChange={(e) => onYearChange(Number(e.target.value))}>
        {years.map((y) => (
          <MenuItem key={y} value={y}>
            {y}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Box>
);

ScorecardToolbar.propTypes = {
  view: PropTypes.oneOf(["areas", "plantas"]).isRequired,
  onViewChange: PropTypes.func.isRequired,
  areas: PropTypes.arrayOf(PropTypes.shape({ area_id: PropTypes.number, area_name: PropTypes.string })).isRequired,
  areaId: PropTypes.number,
  onAreaChange: PropTypes.func.isRequired,
  plants: PropTypes.arrayOf(PropTypes.shape({ plant_id: PropTypes.number, plant_name: PropTypes.string })).isRequired,
  plantId: PropTypes.number,
  onPlantChange: PropTypes.func.isRequired,
  years: PropTypes.arrayOf(PropTypes.number).isRequired,
  year: PropTypes.number,
  onYearChange: PropTypes.func.isRequired,
};

export default ScorecardToolbar;
