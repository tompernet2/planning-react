import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import supabase from "../helper/supabaseClient";
import {
  CgCalendarDates,
  CgProfile,
  CgEricsson,
  CgMenu,
  CgClose,
} from "react-icons/cg";

import { TbLayoutSidebar } from "react-icons/tb";

function Navbar() {
  const [authenticated, setAuthenticated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setAuthenticated(!!session);
    };
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div>
      {/* Header Mobile - visible uniquement sur petit écran */}
      <div className="md:hidden fixed top-0 left-0 right-0 text-cream p-4 flex justify-between items-center z-50">
        <div className="flex items-start gap-2 w-full h-full bg-secondary rounded-2xl text-cream p-4">
          <button
            onClick={toggleMenu}
            className="text-cream hover:text-primary transition"
            aria-label="Toggle menu"
          >
            <TbLayoutSidebar className="w-7 h-7" />
          </button>
          <h1 className="text-2xl font-secondary">Planify</h1>
        </div>
      </div>

      {/* Sidebar */}
      <nav
        className={`
          fixed top-0 left-0 h-full w-full p-4 z-50 bg-cream transition-transform duration-300 ease-in-out
          md:translate-x-0 md:w-64
          ${isOpen ? "translate-x-0 w-64" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col w-full h-full bg-secondary rounded-2xl text-cream p-4">
          <div className="w-full flex place-content-between text-3xl p-3 font-secondary mb-4">
            <h1>Planify</h1>
            <button
              onClick={toggleMenu}
              className="text-cream hover:text-primary transition md:hidden"
              aria-label="Toggle menu"
            >
              <TbLayoutSidebar className="w-8 h-8" />
            </button>
          </div>

          <NavLink
            to="/dashboard"
            onClick={closeMenu}
            className={({ isActive }) =>
              `rounded-2xl px-3 py-2 hover:bg-primary hover:text-secondary transition ${
                isActive ? "bg-primary text-black" : ""
              } flex items-center mb-2`
            }
          >
            <CgProfile className="w-5 h-5 mr-2" />
            Compte
          </NavLink>

          <NavLink
            to="/"
            onClick={closeMenu}
            className={({ isActive }) =>
              `rounded-2xl px-3 py-2 hover:bg-primary hover:text-secondary transition ${
                isActive ? "bg-primary text-black" : ""
              } flex items-center mb-2`
            }
          >
            <CgCalendarDates className="w-5 h-5 mr-2" />
            Planning
          </NavLink>

          {authenticated && (
            <NavLink
              to="/demandes"
              onClick={closeMenu}
              className={({ isActive }) =>
                `rounded-2xl px-3 py-2 hover:bg-primary hover:text-secondary transition ${
                  isActive ? "bg-primary text-black" : ""
                } flex items-center mb-2`
              }
            >
              <CgEricsson className="w-5 h-5 mr-2" />
              Demandes
            </NavLink>
          )}
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
