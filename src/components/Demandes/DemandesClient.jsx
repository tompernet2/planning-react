import React, { useEffect, useState } from "react";
import supabase from "../../helper/supabaseClient";
import { FaTrash } from "react-icons/fa";

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
        .select(
          `
          id,
          statut,
          creneau:creneaux(id, date, heure)
        `
        )
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
    const { error } = await supabase
      .from("demandes")
      .delete()
      .eq("id", demandeId);

    if (error) {
      console.error("Erreur désinscription :", error);
      return;
    }

    if (statutActuel === "accepte") {
      const { error: errCreneau } = await supabase
        .from("creneaux")
        .update({ statut: "disponible" })
        .eq("id", creneauId);

      if (errCreneau) console.error("Erreur libération créneau :", errCreneau);
    }

    fetchDemandes();
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Mes demandes</h2>

      <div className="rounded-2xl  overflow-hidden bg-white">
        <table className="w-full table-fixed ">
          <thead>
            <tr>
              <th className="p-4 text-left font-medium">Date</th>
              <th className="p-4 text-left font-medium">Heure</th>
              <th className="p-4 text-left font-medium">Statut</th>
              <th className="p-4 text-center font-medium">Action</th>
            </tr>
          </thead>

          <tbody>
            {demandes.map((d) => (
              <tr key={d.id}>
                <td className="border-t border-gray-300 p-4">
                  {new Date(d.creneau.date).toLocaleDateString("fr-FR")}
                </td>
                <td className="border-t border-gray-300 p-4">
                  {d.creneau.heure.substring(0, 5)}
                </td>
                <td className="border-t border-gray-300 p-4">
                  <span
                    className={
                      d.statut === "accepte"
                        ? "text-purple-200 font-medium bg-purple p-2 rounded-xl"
                        : d.statut === "refuse"
                        ? "text-gray-500 bg-gray-300 font-medium p-2 rounded-xl"
                        : "text-yellow-200 bg-yellow font-medium p-2 rounded-xl"
                    }
                  >
                    {
                      {
                        accepte: "Accepté",
                        en_attente: "En attente",
                        refuse: "Refusé",
                      }[d.statut]
                    }
                  </span>
                </td>
                <td className="border-t border-gray-300 p-2 text-center">
                  {(d.statut === "en_attente" || d.statut === "accepte") && (
                    <div className="relative inline-block">
                      <button
                        onClick={() =>
                          desinscrireDemande(d.id, d.creneau.id, d.statut)
                        }
                        className="relative group p-3 rounded-xl bg-secondary text-white hover:bg-secondary-100 cursor-pointer"
                      >
                        <FaTrash />

                        {/* Tooltip */}
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-xl text-sm text-white bg-secondary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                          Se désinscrire
                        </span>
                      </button>
                    </div>
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
    </div>
  );
}

export default DemandesClient;
