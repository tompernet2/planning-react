import React, { useEffect, useState } from "react";
import supabase from "../helper/supabaseClient";

import DemandesAdmin from "../components/Demandes/DemandesAdmin";
import DemandesClient from "../components/Demandes/DemandesClient";

function Demandes() {
  const [role, setRole] = useState("");

  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
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
    <div className="p-4 m-5">
      {role === "admin" && <DemandesAdmin />}
      {role === "client" && <DemandesClient />}
    </div>
  );
}

export default Demandes;
