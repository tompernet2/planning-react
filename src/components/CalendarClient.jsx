import React, { useEffect, useState } from "react";
import { CgArrowLeftR, CgArrowRightR } from "react-icons/cg";
import supabase from "../helper/supabaseClient";
//import { useNavigate } from "react-router-dom";

function CalendarClient() {
  const [creneaux, setCreneaux] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  //const navigate = useNavigate();

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

  // Navigation
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

  // Chargement des créneaux de la semaine
  useEffect(() => {
    const fetchCreneaux = async () => {
      const debut = getDebutSemaine(currentDate);
      const fin = new Date(debut);
      fin.setDate(debut.getDate() + 6);

      const { data, error } = await supabase
        .from("creneaux")
        .select("*")
        .gte("date", debut.toISOString().split("T")[0])
        .lte("date", fin.toISOString().split("T")[0]);

      if (error) {
        console.error("Erreur chargement créneaux :", error);
      } else {
        setCreneaux(data || []);
      }
    };

    fetchCreneaux();
  }, [currentDate]);

  const joursSemaine = getJoursSemaine();

  const findCreneau = (date, heure) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateFormatee = `${year}-${month}-${day}`;   
    return creneaux.find((c) => {
      const heureDB = c.heure.substring(0, 5);
      return c.date === dateFormatee && heureDB === heure;
    });
  };

  const findCreneauId = async (date, heure) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateFormatee = `${year}-${month}-${day}`;   
    const heureFormatee = heure + ":00";

    const { data, error } = await supabase
      .from("creneaux")
      .select("id")
      .eq("date", dateFormatee)
      .eq("heure", heureFormatee)
      .single();

    if (error) {
      console.error("Erreur id non trouvé :", error);
    } else {
      return data.id
    }
  };

  // Vérifier si l'utilisateur est déjà inscrit à ce créneau
  const checkIfAlreadyRegistered = async (creneauId) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data, error } = await supabase
      .from("demandes")
      .select("*")
      .eq("creneau_id", creneauId)
      .eq("client_id", session.user.id);

    if (error) {
      console.error("Erreur vérification inscription :", error);
      return false;
    }
    
    return data && data.length > 0;
  };

  const createDemande = async (creneauId) => {
    const { data: { session } } = await supabase.auth.getSession();

    console.log("creneauId =", creneauId);
    console.log("session.user.id =", session.user.id);
    const { error } = await supabase
      .from("demandes")
      .insert([
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
      console.log("Demande créé")
    }
  };

  const handleSlotClick = async (date, heure) => {
    const creneauId = await findCreneauId(date, heure);
    if (creneauId) {
      const isRegistered = await checkIfAlreadyRegistered(creneauId);
      setAlreadyRegistered(isRegistered);
      setSelectedSlot({ date, heure });
      setShowConfirm(true);
    } else {
      console.error("Créneau non trouvé !");
    }
  };

  const handleConfirm = async () => {
    const creneauId = await findCreneauId(selectedSlot.date, selectedSlot.heure);
    if (creneauId) {
      await createDemande(creneauId);
    } else {
      console.error("Créneau non trouvé !");
    }
  };

  return (
    <div>
      <h1>Planning Client</h1>

      {/* Navigation semaine */}
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

      {/* Grille calendrier */}
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
                  const bgColor = creneau ? "bg-green-400" : "bg-gray-50";
                  const isAvailable =
                    creneau && creneau.statut === "disponible";

                  return (
                    <td
                      key={i}
                      onClick={() => {
                        if (isAvailable) {
                          handleSlotClick(date, heure);
                        }
                      }}
                      className={`border p-4 text-center ${bgColor} ${
                        isAvailable ? "cursor-pointer" : ""
                      }`}
                    >
                      {creneau ? creneau.statut : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg">
            {alreadyRegistered ? (
              // Modal si déjà inscrit
              <>
                <h2 className="text-lg font-bold mb-4">
                  Vous êtes déjà inscrit
                </h2>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 bg-gray-300 rounded"
                  >
                    Fermer
                  </button>
                </div>
              </>
            ) : (
              // Modal pour nouvelle inscription
              <>
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
                    onClick={() => {
                      if (selectedSlot) {
                        handleConfirm()
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Oui
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarClient;