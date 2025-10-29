// src/components/DemandesClient.jsx
import React, { useEffect, useState } from "react";
import supabase from "../../helper/supabaseClient";

function DemandesClient() {
  const [demandes, setDemandes] = useState([]);

  const fetchDemandes = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("demandes")
        .select(`
          id,
          statut,
          creneau:creneaux(id, date, heure)
        `)
        .eq("client_id", session.user.id);

      if (error) {
        console.error("Erreur récupération demandes :", error);
        return;
      }

      const sorted = (data || []).sort((a, b) => {
        const dateA = new Date(`${a.creneau.date}T${a.creneau.heure}`);
        const dateB = new Date(`${b.creneau.date}T${b.creneau.heure}`);
        return dateA - dateB;
      });

      setDemandes(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  const desinscrireDemande = async (demandeId, creneauId, statutActuel) => {
    // 1️⃣ Supprimer la demande
    const { error } = await supabase
      .from("demandes")
      .delete()
      .eq("id", demandeId);

    if (error) {
      console.error("Erreur désinscription :", error);
      return;
    }

    // 2️⃣ Si la demande était acceptée, libérer le créneau
    if (statutActuel === "accepte") {
      const { error: errCreneau } = await supabase
        .from("creneaux")
        .update({ statut: "disponible" })
        .eq("id", creneauId);

      if (errCreneau) console.error("Erreur libération créneau :", errCreneau);
    }

    // 3️⃣ Actualiser l'affichage des demandes
    fetchDemandes();
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  return (
    <div className="p-6 m-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Mes demandes</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Date</th>
            <th className="border p-2">Heure</th>
            <th className="border p-2">Statut</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {demandes.map((d) => (
            <tr key={d.id}>
              <td className="border p-2">{d.creneau.date}</td>
              <td className="border p-2">{d.creneau.heure}</td>
              <td className="border p-2">
                <span
                  className={
                    d.statut === "accepte"
                      ? "text-green-600 font-medium"
                      : d.statut === "refuse"
                      ? "text-red-600 font-medium"
                      : "text-orange-600 font-medium"
                  }
                >
                  {d.statut.charAt(0).toUpperCase() + d.statut.slice(1)}
                </span>
              </td>
              <td className="border p-2">
                {(d.statut === "en_attente" || d.statut === "accepte") && (
                  <button
                    onClick={() =>
                      desinscrireDemande(d.id, d.creneau.id, d.statut)
                    }
                    className="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                  >
                    Se désinscrire
                  </button>
                )}
                {d.statut === "refuse" && (
                  <span className="text-gray-500">Aucune action</span>
                )}
              </td>
            </tr>
          ))}
          {demandes.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center p-4 text-gray-500">
                Aucune demande
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DemandesClient;
