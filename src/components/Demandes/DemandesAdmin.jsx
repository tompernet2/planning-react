import React, { useEffect, useState } from "react";
import supabase from "../../helper/supabaseClient";
import { FaCheck } from "react-icons/fa";
import { ImCross } from "react-icons/im";


function DemandesAdmin() {
  const [demandes, setDemandes] = useState([]);

  const fetchDemandes = async () => {
    const { data, error } = await supabase.from("demandes").select(`
        id,
        statut,
        creneau:creneaux(id, date, heure),
        client:profiles(email, nom, prenom)
      `);

    if (error) {
      console.error("Erreur récupération demandes :", error);
      return;
    }

    const sorted = data.sort((a, b) => {
      const dateA = new Date(`${a.creneau.date}T${a.creneau.heure}`);
      const dateB = new Date(`${b.creneau.date}T${b.creneau.heure}`);
      return dateB - dateA;
    });

    setDemandes(sorted);
  };

  const acceptDemande = async (demandeId, creneauId) => {
    const { data: creneau, error: errCreneau } = await supabase
      .from("creneaux")
      .select("statut")
      .eq("id", creneauId)
      .single();

    if (errCreneau || creneau.statut === "occupe") {
      alert("Ce créneau est déjà occupé !");
      return;
    }

    const { error: errDemande } = await supabase
      .from("demandes")
      .update({ statut: "accepte" })
      .eq("id", demandeId);

    if (errDemande) {
      console.error("Erreur acceptation :", errDemande);
      return;
    }

    const { error: errUpdate } = await supabase
      .from("creneaux")
      .update({ statut: "occupe" })
      .eq("id", creneauId);

    if (errUpdate) {
      console.error("Erreur mise à jour créneau :", errUpdate);
      return;
    }

    fetchDemandes();
  };

  const refuseDemande = async (demandeId, creneauId, statutActuel) => {
    const { error } = await supabase
      .from("demandes")
      .update({ statut: "refuse" })
      .eq("id", demandeId);

    if (error) {
      console.error("Erreur refus :", error);
      return;
    }

    if (statutActuel === "accepte") {
      const { error: errCreneau } = await supabase
        .from("creneaux")
        .update({ statut: "disponible" })
        .eq("id", creneauId);

      if (errCreneau) {
        console.error("Erreur libération créneau :", errCreneau);
      }
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
            <tr className="">
              <th className="p-4 text-left font-medium">Client</th>
              <th className="p-4 text-left font-medium">Date</th>
              <th className="p-4 text-left font-medium">Heure</th>
              <th className="p-4 text-left font-medium">Statut</th>
              <th className="p-4 text-left font-medium">Action</th>
            </tr>
          </thead>

          <tbody>
            {demandes.map((d) => (
              <tr key={d.id}>
                <td className="border-t border-gray-300 p-4 font-semibold">
                  {d.client.prenom} {d.client.nom}
                </td>
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
                        ? "text-red-200 bg-red font-medium p-2 rounded-xl"
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
                <td className="border-t border-gray-300 p-2">
                  {/* Bouton Accepter */}
                  <div className="relative inline-block">
                    <button
                      onClick={() => acceptDemande(d.id, d.creneau.id)}
                      disabled={d.statut === "accepte"}
                      className={`relative group p-3 rounded-xl mr-2 ${
                        d.statut === "accepte"
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-purple text-purple-200 hover:bg-purple-hover"
                      }`}
                    >
                      <FaCheck />

                      {/* Tooltip */}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 text-sm text-white bg-secondary rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        Accepter
                      </span>
                    </button>
                  </div>

                  {/* Bouton Refuser */}
                  <div className="relative inline-block">
                    <button
                      onClick={() =>
                        refuseDemande(d.id, d.creneau.id, d.statut)
                      }
                      disabled={d.statut === "refuse"}
                      className={`relative group p-3 rounded-xl ${
                        d.statut === "refuse"
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-red text-red-200 hover:bg-red-hover"
                      }`}
                    >
                      <ImCross/>
                      {/* Tooltip */}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 text-sm text-white bg-secondary rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        Refuser
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DemandesAdmin;
