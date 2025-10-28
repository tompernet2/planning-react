// src/components/Demandes/DemandesAdmin.jsx
import React, { useEffect, useState } from "react";
import supabase from "../../helper/supabaseClient";

function DemandesAdmin() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDemandes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("demandes")
      .select(`
        id,
        statut,
        creneau:creneaux(date, heure),
        client:profiles(email)
      `);

    if (error) {
      console.error("Erreur récupération demandes :", error);
    } else {
      // Tri côté front par date puis heure
      const sorted = (data || []).sort((a, b) => {
        const dateA = new Date(`${a.creneau.date}T${a.creneau.heure}`);
        const dateB = new Date(`${b.creneau.date}T${b.creneau.heure}`);
        return dateA - dateB;
      });
      setDemandes(sorted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  return (
    <div className="p-6 m-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Toutes les demandes</h1>

      {loading && <p>Chargement...</p>}

      {!loading && demandes.length === 0 && <p>Aucune demande pour le moment.</p>}

      {!loading && demandes.length > 0 && (
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Heure</th>
              <th className="border p-2 text-left">Client</th>
              <th className="border p-2 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {demandes.map((d) => (
              <tr key={d.id}>
                <td className="border p-2">{d.creneau.date}</td>
                <td className="border p-2">{d.creneau.heure}</td>
                <td className="border p-2">{d.client.email}</td>
                <td className="border p-2">{d.statut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DemandesAdmin;
