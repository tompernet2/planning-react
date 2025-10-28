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
    <div className="p-6 m-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Toutes les demandes</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Date</th>
            <th className="border p-2">Heure</th>
            <th className="border p-2">Client</th>
            <th className="border p-2">Statut</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {demandes.map((d) => (
            <tr key={d.id}>
              <td className="border p-2">{d.creneau.date}</td>
              <td className="border p-2">{d.creneau.heure}</td>
              <td className="border p-2">{d.client.email}</td>
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
              <td className="border p-2 space-x-2">
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
  );
}

export default DemandesAdmin;
