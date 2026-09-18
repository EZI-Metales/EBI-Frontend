import { List } from "@mui/material";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/auth/hooks/useAuth";
import MenuItem from "./components/MenuItem";
import SidebarFooter from "./components/SidebarFooter";
import SidebarHeader from "./components/SidebarHeader";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import { IconButton, Tooltip } from "@mui/material";
import PropTypes from "prop-types";
import { SidebarContainer } from "./Sidebar.styles";
import { useMenuContext } from "../Layout.context";

/**
 * ============================================
 * SIDEBAR - Menú lateral de navegación
 * ============================================
 *
 * Cambio estructural:
 * - Ya NO renderiza submenús/hijos
 * - Solo renderiza items de primer nivel
 * - Los hijos se renderizarán dinámicamente en el Topbar
 * - Actualiza activeMenuItem en el contexto cuando cambia la ruta
 */
const Sidebar = ({ isPinned, setIsPinned }) => {
  const [isExpanded, setIsExpanded] = useState(isPinned);
  const location = useLocation();
  const { menu } = useAuth(); // Obtener el menú ya mapeado desde AuthProvider
  const { setMenuItems: setGlobalMenuItems, setActiveMenuItem } =
    useMenuContext();

  useEffect(() => {
    setIsExpanded(isPinned);
  }, [isPinned]);

  // Función para encontrar el item padre activo basado en la ruta
  const findActiveParentItem = (items, currentPath) => {
    // Si estamos en /inicio, retornar el item de Home
    if (currentPath === "/inicio") {
      return null; // El item de Home se manejará directamente en MenuItem
    }

    for (const item of items) {
      // Verificar si este item está activo
      if (
        item.FullPath === currentPath ||
        currentPath.startsWith(item.FullPath + "/")
      ) {
        return item;
      }

      // Buscar en los hijos
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          if (
            child.FullPath === currentPath ||
            currentPath.startsWith(child.FullPath + "/")
          ) {
            return item; // Retornar el padre
          }

          // Buscar en nietos
          if (child.children && child.children.length > 0) {
            for (const grandChild of child.children) {
              if (
                grandChild.FullPath === currentPath ||
                currentPath.startsWith(grandChild.FullPath + "/")
              ) {
                return item; // Retornar el padre de nivel superior
              }
            }
          }
        }
      }
    }
    return null;
  };

  // Efecto para actualizar el activeMenuItem cuando cambia la ruta
  useEffect(() => {
    if (menu.length > 0) {
      const activeItem = findActiveParentItem(menu, location.pathname);
      if (activeItem) {
        setActiveMenuItem(activeItem);
      }
    }
  }, [location.pathname, menu, setActiveMenuItem]);

  // Efecto para sincronizar el menú con el contexto global
  useEffect(() => {
    if (menu.length > 0) {
      setGlobalMenuItems(menu);
    }
  }, [menu, setGlobalMenuItems]);

  const handlePinClick = () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    localStorage.setItem("sidebarPinned", newPinned);
  };

  const handleMouseEnter = () => {
    if (!isPinned) setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (!isPinned) setIsExpanded(false);
  };

  return (
    <SidebarContainer
      isexpanded={isExpanded.toString()}
      isPinned={isPinned.toString()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isExpanded && (
        <Tooltip
          title={isPinned ? "Desfijar menú" : "Fijar menú"}
          placement="right"
        >
          <IconButton
            size="small"
            onClick={handlePinClick}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 10,
            }}
          >
            {isPinned ? (
              <PushPinIcon fontSize="small" />
            ) : (
              <PushPinOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      )}
      <SidebarHeader isExpanded={isExpanded} />
      <List>
        {/* Item estático: Inicio */}
        <MenuItem
          key="home"
          item={{
            idMenu: -1, // ID especial para el item Home
            MenuName: "Inicio",
            MenuIcon: "Home",
            FullPath: "/inicio",
            SortOrder: 0,
            children: [],
          }}
          isExpanded={isExpanded}
        />

        {/* Item estático: Balance Score Card */}
        <MenuItem
          key="balance-score-card"
          item={{
            idMenu: -2, // ID especial, mismo patrón que el item Home
            MenuName: "Balance Score Card",
            MenuIcon: "Assessment",
            FullPath: "/balance-score-card",
            SortOrder: 1,
            children: [],
          }}
          isExpanded={isExpanded}
        />

        {/* Items dinámicos del menú */}
        {menu.map((item) => (
          <MenuItem key={item.idMenu} item={item} isExpanded={isExpanded} />
        ))}
      </List>
      <SidebarFooter isExpanded={isExpanded} />
    </SidebarContainer>
  );
};

Sidebar.propTypes = {
  isPinned: PropTypes.bool.isRequired,
  setIsPinned: PropTypes.func.isRequired,
};

export default Sidebar;
