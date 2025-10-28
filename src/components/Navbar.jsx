import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import supabase from "../helper/supabaseClient";
import { CgCalendarDates, CgProfile, CgEricsson } from "react-icons/cg";

function Navbar() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setAuthenticated(!!session);
    };
    checkSession();

    // listener connexions / déconnexions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
    });

    // Nettoyage
    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

      {authenticated && (
        <NavLink
          to="/demandes"
          className={({ isActive }) =>
            `rounded p-2 hover:bg-gray-200 transition ${
              isActive ? "bg-gray-300 font-semibold" : ""
            } flex items-center`
          }
        >
          <CgEricsson className="w-5 h-5 mr-2" />
          Demandes
        </NavLink>
      )}
    </div>
  );
}

export default Navbar;
