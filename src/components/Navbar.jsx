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
    <div className="fixed flex flex-col w-64 bg-secondary rounded-2xl text-cream p-4 m-5" style={{ height: "calc(100vh - 2.5rem)" }}>
      <div className="w-full text-3xl  p-3 font-secondary">
        <h1>Planify</h1>
      </div>
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `rounded-2xl px-3 py-2 hover:bg-primary hover:text-secondary transition ${
            isActive ? "bg-primary hover:bg-primary-hover text-black" : ""
          } flex items-center`
        }
      >
        <CgProfile className="w-5 h-5 mr-2" />
        Compte
      </NavLink>

      <NavLink
        to="/"
        className={({ isActive }) =>
          `rounded-2xl px-3 py-2 hover:bg-primary hover:text-secondary transition ${
            isActive ? "bg-primary hover:bg-primary-hover text-black" : ""
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
            `rounded-2xl px-3 py-2 hover:bg-primary hover:text-secondary transition ${
              isActive ? "bg-primary hover:bg-primary-hover text-black" : ""
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
