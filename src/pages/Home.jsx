import React, { useEffect, useState } from "react";
import supabase from "../helper/supabaseClient";

import CalendarAdmin from "../components/Calendar/CalendarAdmin";
import CalendarClient from "../components/Calendar/CalendarClient";
import CalendarInvite from "../components/Calendar/CalendarInvite";

function Home() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");

  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      setUser(session.user);

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Erreur récupération role :", error);
      } else {
        setRole(data.role);
      }
    }
  };

  useEffect(() => {
    checkUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="p-4 m-5 ">
      {role === "admin" && <CalendarAdmin />}
      {role === "client" && <CalendarClient />}
      {/* Si aucun utilisateur n'est connecté ou rôle inconnu, on affiche l'invité */}
      {!user && <CalendarInvite />}
    </div>
  );
}

export default Home;
