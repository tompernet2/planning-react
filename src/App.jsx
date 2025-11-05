import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Demandes from "./pages/Demandes";
import Wrapper from "./pages/Wrapper";

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Navbar />
        {/* Padding top pour mobile (header), margin left pour desktop (sidebar) */}
        <main className="flex-1 pt-16 md:pt-0 md:ml-64 w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/demandes"
              element={
                <Wrapper>
                  <Demandes />
                </Wrapper>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;