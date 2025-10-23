// src/components/Navbar.tsx
import React from "react";
import { NavLink } from "react-router-dom";

import { CgCalendarDates, CgProfile } from "react-icons/cg";

function Navbar() {
  return (
    <div className="w-64 bg-white text-black flex flex-col p-4">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `rounded p-2 hover:bg-gray-200 transition ${
            isActive ? "bg-gray-300 font-semibold" : ""
          } flex items-center`
        }
      >
        <CgProfile className="w-5 h-5 mr-2" />
        Compte
      </NavLink>

      <NavLink
        to="/"
        className={({ isActive }) =>
          `rounded p-2 hover:bg-gray-200 transition ${
            isActive ? "bg-gray-300 font-semibold" : ""
          } flex items-center`
        }
      >
        <CgCalendarDates className="w-5 h-5 mr-2" />
        Planning
      </NavLink>
    </div>
  );
}

export default Navbar;
