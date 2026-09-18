import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./Auth.context";
import { authService } from "../services/auth.service";
import { storage } from "../utils/storage";

// Modo mock del Balance Score Card (VITE_SCORECARD_MOCK=1): no hay backend disponible
// para autenticar, así que se simula una sesión ya válida con un usuario ficticio para
// poder navegar y probar la pantalla. Cambio acotado detrás de la bandera; el login
// real (authService) sigue intacto para cuando sí hay backend. Ver README.md.
const isMockMode = import.meta.env.VITE_SCORECARD_MOCK === "1";
const MOCK_USER = { idUsuario: 0, Nombre: "Modo demostración" };

export const AuthProvider = ({ children }) => {
  // Inicializar con datos de storage si existen (o con el usuario ficticio en modo mock)
  const [user, setUser] = useState(() => (isMockMode ? MOCK_USER : storage.getUser()));
  const [isAuthenticated, setIsAuthenticated] = useState(() => isMockMode || !!storage.getUser());
  const [loading, setLoading] = useState(!isMockMode);
  const [errors, setErrors] = useState([]);
  const [menu, setMenu] = useState([]);
  const navigate = useNavigate();

  const signin = async (credentials) => {
    try {
      setErrors([]);
      setLoading(true);
      const response = await authService.login(credentials);

      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        return response;
      } else {
        storage.clearAuth();
        setUser(null);
        setIsAuthenticated(false);
        setErrors([response.message]);
        return response;
      }
    } catch (error) {
      console.error("[AuthProvider] Error en signin:", error);
      const errorMessage = "Error de conexión con el servidor";
      setErrors([errorMessage]);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    authService.logout();
    storage.clearAuth();
    setUser(null);
    setIsAuthenticated(false);
    setMenu([]);
    setErrors([]);
    navigate("/login");
  }, [navigate]);

  // Verificar autenticación al iniciar/refrescar
  useEffect(() => {
    if (isMockMode) {
      // Sesión simulada: no hay backend que validar ni menú que pedir.
      setUser(MOCK_USER);
      setIsAuthenticated(true);
      setMenu([]);
      setLoading(false);
      return;
    }

    const validateAuth = async () => {
      try {
        setLoading(true);
        
        const storedUser = storage.getUser();
        
        if (storedUser) {
          const isValid = await authService.validateSession();
          
          if (isValid) {
            setUser(storedUser);
            setIsAuthenticated(true);
            
            const menuResponse = await authService.getMenu();
            if (menuResponse.success) {
              setMenu(menuResponse.menu);
            }
          } else {
            storage.clearAuth();
            setUser(null);
            setIsAuthenticated(false);
            setMenu([]);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setMenu([]);
        }
      } catch (error) {
        console.error("[AuthProvider] Error validando sesión:", error);
        storage.clearAuth();
        setUser(null);
        setIsAuthenticated(false);
        setMenu([]);
      } finally {
        setLoading(false);
      }
    };

    validateAuth();
  }, []);

  // Cargar menú cuando el usuario está autenticado
  useEffect(() => {
    if (isMockMode) return; // menú vacío fijo en modo mock, no hay backend que preguntar

    const loadMenu = async () => {
      if (isAuthenticated && user && menu.length === 0) {
        try {
          const menuResponse = await authService.getMenu();
          if (menuResponse.success) {
            setMenu(menuResponse.menu);
          }
        } catch (error) {
          console.error("[AuthProvider] Error al cargar menú:", error);
        }
      }
    };

    loadMenu();
  }, [isAuthenticated, user, menu.length]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        errors,
        menu,
        signin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
