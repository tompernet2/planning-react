import React, { useEffect, useState } from "react";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import supabase from "../../helper/supabaseClient";
import { useNavigate } from "react-router-dom";

function CalendarInvite() {
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateFormatee = `${year}-${month}-${day}`;
    return creneaux.find((c) => {
      const heureDB = c.heure.substring(0, 5);
      return c.date === dateFormatee && heureDB === heure;
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Planning Hebdomadaire</h1>
      <div className="rounded-2xl bg-white p-4  ">
        {/* Navigation semaine */}
        <div className="flex items-center justify-between mb-6">
          {/* Mois et Année */}
          <div className="text-2xl font-bold text-secondary flex items-center gap-2">
            <span>
              {joursSemaine[3]
                .toLocaleDateString("fr-FR", {
                  month: "long",
                })
                .replace(/^\w/, (c) => c.toUpperCase())}
            </span>
            <span>{joursSemaine[3].getFullYear()}</span>
          </div>
          {/* Nav */}
          <div className="flex items-center gap-1 rounded-xl overflow-hidden text-cream">
            <button
              onClick={semainePrecedente}
              className="flex items-center p-3 bg-secondary cursor-pointer rounded hover:bg-secondary-100"
            >
              <AiOutlineLeft className="w-5 h-5" />
            </button>

            <div className="h-full bg-secondary px-2">
              <h2 className="text-xl p-2">
                {joursSemaine[0].toLocaleDateString("fr-FR", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                -{" "}
                {joursSemaine[6].toLocaleDateString("fr-FR", {
                  month: "short",
                  day: "numeric",
                })}
              </h2>
            </div>

            <button
              onClick={semaineSuivante}
              className="flex items-center p-3 bg-secondary cursor-pointer rounded hover:bg-secondary-100"
            >
              <AiOutlineRight className="w-5 h-5" />
            </button>
          </div>
          <div className="w-16"></div> {/* Spacer pour équilibrer */}
        </div>

        {/* Grille calendrier */}
        <div className="rounded-2xl border border-gray-300 overflow-hidden">
          <table className="w-full table-fixed">
            <thead>
              <tr>
                <th className="border-r border-b border-gray-300 p-2 w-20">
                  Heure
                </th>
                {joursSemaine.map((date, i) => (
                  <th
                    key={i}
                    className={`border-b border-gray-300 p-2 ${
                      i < 6 ? "border-r" : ""
                    }`}
                  >
                    {date.toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                    })}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {heures.map((heure, index) => (
                <tr key={heure}>
                  <td
                    className={`border-r border-gray-300 text-gray-500 p-4 font-medium align-top h-24 ${
                      index < heures.length - 1 ? "border-b" : ""
                    }`}
                  >
                    {heure}
                  </td>

                  {joursSemaine.map((date, i) => {
                    const creneau = findCreneau(date, heure);
                    const isAvailable =
                      creneau && creneau.statut === "disponible";

                    return (
                      <td
                        key={i}
                        className={`p-0.5 h-24 ${i < 6 ? "border-r" : ""} ${
                          index < heures.length - 1 ? "border-b" : ""
                        } border-gray-300`}
                      >
                        {creneau ? (
                          <div
                            onClick={() => {
                              if (isAvailable) setShowConfirm(true);
                            }}
                            className={`rounded-xl h-full w-full flex p-2 flex-col text-sm ${
                              isAvailable
                                ? "bg-green text-green-100 cursor-pointer hover:bg-green-hover"
                                : "bg-red text-red-100 cursor-default"
                            }`}
                          >
                            <span className="font-semibold">
                              {creneau.statut === "disponible"
                                ? "Disponible"
                                : "Occupé"}
                            </span>
                            <span
                              className={
                                isAvailable ? "text-green-200" : "text-red-200"
                              }
                            >
                              {" "}
                              {heure} -{" "}
                              {String(
                                parseInt(heure.split(":")[0]) + 1
                              ).padStart(2, "0") +
                                ":" +
                                heure.split(":")[1]}
                            </span>
                          </div>
                        ) : (
                          <div className="h-full w-full"></div>
                        )}
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
            <div className="bg-cream p-8 rounded-2xl">
              <h2 className="text-lg font-bold mb-4">
                Pour vous inscrire veuillez vous connecté
              </h2>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 bg-secondary hover:bg-secondary-100 cursor-pointer text-cream rounded-xl"
                >
                  Fermer
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover cursor-pointer text-black rounded-xl"
                >
                  Se connecter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarInvite;
