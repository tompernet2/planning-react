// src/components/CalendarClient.jsx
import React, { useEffect, useState } from "react";
import { CgArrowLeftR, CgArrowRightR } from "react-icons/cg";
import supabase from "../../helper/supabaseClient";

function CalendarClient() {
  const [creneaux, setCreneaux] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [mesAcceptedCreneauIds, setMesAcceptedCreneauIds] = useState([]);
  const [mesPendingCreneauIds, setMesPendingCreneauIds] = useState([]);

  const heures = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  const getDebutSemaine = (date) => {
    const d = new Date(date);
    const jour = d.getDay();
    const diff = jour === 0 ? -6 : 1 - jour;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getJoursSemaine = () => {
    const debut = getDebutSemaine(currentDate);
    const jours = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(debut);
      date.setDate(debut.getDate() + i);
      jours.push(date);
    }
    return jours;
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const semainePrecedente = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const semaineSuivante = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const findCreneau = (date, heure) => {
    const dateFormatee = formatDate(date);
    return creneaux.find((c) => {
      const heureDB = c.heure.substring(0, 5);
      return c.date === dateFormatee && heureDB === heure;
    });
  };

  const findCreneauId = async (date, heure) => {
    const dateFormatee = formatDate(date);
    const heureFormatee = heure + ":00";

    const { data, error } = await supabase
      .from("creneaux")
      .select("id")
      .eq("date", dateFormatee)
      .eq("heure", heureFormatee)
      .single();

    if (error) {
      console.error("Erreur id non trouvé :", error);
      return null;
    }
    return data.id;
  };

  const createDemande = async (creneauId) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error } = await supabase.from("demandes").insert([
      {
        creneau_id: creneauId,
        client_id: session.user.id,
        statut: "en_attente",
      },
    ]);

    if (error) {
      console.error("Erreur création demande :", error);
    } else {
      setShowConfirm(false);
      setCurrentDate(new Date(currentDate));
      console.log("Demande créée");
    }
  };

  const handleSlotClick = (date, heure) => {
    setSelectedSlot({ date, heure });
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    const creneauId = await findCreneauId(
      selectedSlot.date,
      selectedSlot.heure
    );

    if (creneauId) {
      await createDemande(creneauId);
    } else {
      console.error("Créneau non trouvé !");
    }
  };

  useEffect(() => {
    const fetchCreneauxEtDemandes = async () => {
      try {
        const debut = getDebutSemaine(currentDate);
        const fin = new Date(debut);
        fin.setDate(debut.getDate() + 6);

        const debutStr = debut.toISOString().split("T")[0];
        const finStr = fin.toISOString().split("T")[0];

        const { data: creneauxData, error: creneauxError } = await supabase
          .from("creneaux")
          .select("*")
          .gte("date", debutStr)
          .lte("date", finStr);

        if (creneauxError) throw creneauxError;
        setCreneaux(creneauxData || []);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) return;

        const creneauIds = (creneauxData || []).map((c) => c.id);
        if (creneauIds.length === 0) {
          setMesAcceptedCreneauIds([]);
          setMesPendingCreneauIds([]);
          return;
        }

        const { data: acceptedData } = await supabase
          .from("demandes")
          .select("creneau_id")
          .in("creneau_id", creneauIds)
          .eq("client_id", session.user.id)
          .eq("statut", "accepte");

        setMesAcceptedCreneauIds((acceptedData || []).map((d) => d.creneau_id));

        const { data: pendingData } = await supabase
          .from("demandes")
          .select("creneau_id")
          .in("creneau_id", creneauIds)
          .eq("client_id", session.user.id)
          .eq("statut", "en_attente");

        setMesPendingCreneauIds((pendingData || []).map((d) => d.creneau_id));
      } catch (err) {
        console.error("Erreur dans le chargement du planning :", err);
        setCreneaux([]);
        setMesAcceptedCreneauIds([]);
        setMesPendingCreneauIds([]);
      }
    };

    fetchCreneauxEtDemandes();
  }, [currentDate]);

  const joursSemaine = getJoursSemaine();

  return (
    <div>
      <h1>Planning Client</h1>

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={semainePrecedente}
          className="flex items-center p-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          <CgArrowLeftR className="w-5 h-5 mr-2" />
          Précédent
        </button>

        <h2 className="text-xl font-bold">
          Semaine du {joursSemaine[0].toLocaleDateString("fr-FR")}
        </h2>

        <button
          onClick={semaineSuivante}
          className="flex items-center p-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Suivant
          <CgArrowRightR className="w-5 h-5 ml-2" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-100">Heure</th>
              {joursSemaine.map((date, i) => (
                <th key={i} className="border p-2 bg-gray-100 w-1/7">
                  {date.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  })}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {heures.map((heure) => (
              <tr key={heure}>
                <td className="border p-2 font-medium text-center bg-gray-50">
                  {heure}
                </td>

                {joursSemaine.map((date, i) => {
                  const creneau = findCreneau(date, heure);

                  let bgColor = "cursor-default";
                  let text = "";

                  if (creneau) {
                    if (mesAcceptedCreneauIds.includes(creneau.id)) {
                      bgColor = "bg-blue-500 text-white cursor-default";
                      text = "réservé";
                    } else if (mesPendingCreneauIds.includes(creneau.id)) {
                      bgColor = "bg-yellow-400 text-black cursor-default";
                      text = "inscrit";
                    } else if (creneau.statut === "disponible") {
                      bgColor = "bg-green-400 cursor-pointer";
                      text = "disponible";
                    } else {
                      bgColor = "bg-red-500 text-white cursor-default";
                      text = "occupé";
                    }
                  }

                  const canClick =
                    creneau?.statut === "disponible" &&
                    !mesAcceptedCreneauIds.includes(creneau.id) &&
                    !mesPendingCreneauIds.includes(creneau.id);

                  return (
                    <td
                      key={i}
                      onClick={() =>
                        canClick && handleSlotClick(date, heure)
                      }
                      className={`border p-4 text-center ${bgColor}`}
                    >
                      {text}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-4">
              Voulez vous vous inscrire ?
            </h2>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Non
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Oui
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarClient;
