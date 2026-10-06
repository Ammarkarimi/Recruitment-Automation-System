import "./App.css";
import { BrowserRouter as Router } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import MainRoutes from "./Routes/MainRoute";
import { AuthProvider } from "./lib/AuthContext";

const theme = createTheme({
  palette: {
    primary: { main: "#4f46e5" },
    secondary: { main: "#7c3aed" },
    background: { default: "#f5f6fb" },
  },
  shape: { borderRadius: 10 },
  typography: { fontFamily: "Inter, Roboto, 'Segoe UI', Arial, sans-serif", button: { textTransform: "none" } },
  components: {
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: "1px solid #e6e8f0" } } },
    MuiAppBar: { styleOverrides: { root: { border: 0 } } },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer position="top-right" autoClose={3500} />
      <AuthProvider>
        <Router>
          <MainRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
