import ScrollToTop from "./utils/hooks/scroll-to-top.hook";
import { Route, Routes } from "react-router-dom";
import Home from "./routes/home/home.page";
import Auth from "./routes/auth/auth.page";

function App() {
  return (
    <div className="main">
      <ScrollToTop />

      <Routes>
        <Route index element={<Home />} />
        <Route path="auth" element={<Auth />} />
      </Routes>
    </div>
  );
}

export default App;
