import "./App.css";
import { BrowserRouter as Router } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MainRoutes from "./Routes/MainRoute";
function App() {
  return (
    <>
      <ToastContainer />
      <Router>
        <MainRoutes />
      </Router>
    </>
  );
}

export default App;
