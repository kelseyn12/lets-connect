import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Connecting from "./pages/Connecting";
import Chat from "./pages/Chat";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/connecting" element={<Connecting />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

