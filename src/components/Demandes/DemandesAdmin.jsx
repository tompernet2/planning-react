import React, { useEffect, useState } from "react";
import supabase from "../../helper/supabaseClient";

function DemandesAdmin() {
  const [demandes, setDemandes] = useState([]);

  const fetchDemandes = async () => {
    const { data, error } = await supabase.from("demandes").select(`
        id,
        statut,
        creneau:creneaux(id, date, heure),
        client:profiles(email)
      `);

    if (error) {
      console.error("Erreur récupération demandes :", error);
      return;
    }

    const sorted = data.sort((a, b) => {
      const dateA = new Date(`${a.creneau.date}T${a.creneau.heure}`);
      const dateB = new Date(`${b.creneau.date}T${b.creneau.heure}`);
      return dateA - dateB;
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
            <tr>
              <th className="p-4 text-left">Client</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Heure</th>
              <th className="p-4 text-left">Statut</th>
              <th className="p-4 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {demandes.map((d) => (
              <tr key={d.id}>
                <td className="border-t border-gray-300 p-4">{d.client.email}</td>
                <td className="border-t border-gray-300 p-4">{d.creneau.date}</td>
                <td className="border-t border-gray-300 p-4">{d.creneau.heure}</td>
                <td className="border-t border-gray-300 p-4">
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
                <td className="border-t border-gray-300 p-4">
                  <button
                    onClick={() => acceptDemande(d.id, d.creneau.id)}
                    disabled={d.statut === "accepte"}
                    className={`px-2 py-1 rounded ${
                      d.statut === "accepte"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => refuseDemande(d.id, d.creneau.id, d.statut)}
                    disabled={d.statut === "refuse"}
                    className={`px-2 py-1 rounded ${
                      d.statut === "refuse"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    Refuser
                  </button>
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
