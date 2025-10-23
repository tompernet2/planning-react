import React, { useEffect, useState } from "react";
import { CgArrowLeftR, CgArrowRightR } from "react-icons/cg";
import supabase from "../helper/supabaseClient";
import { useNavigate } from "react-router-dom";

function CalendarClient() {
  const [creneaux, setCreneaux] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

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
    const dateFormatee = date.toISOString().split("T")[0];
    return creneaux.find((c) => {
      const heureDB = c.heure.substring(0, 5);
      return c.date === dateFormatee && heureDB === heure;
    });
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
                        if (isAvailable) setShowConfirm(true);
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
            <h2 className="text-lg font-bold mb-4">
              Pour vous inscrire veuillez vous connecté
            </h2>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Non
              </button>
              <button
                onClick={() => navigate("/login")}
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
