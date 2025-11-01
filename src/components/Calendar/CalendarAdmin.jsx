import React, { useState, useEffect } from "react";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import supabase from "../../helper/supabaseClient";

function CalendarAdmin() {
  const [creneaux, setCreneaux] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Calcul des dates de la semaine
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

  // Gestion des clics et création
  const handleClickCase = (date, heure) => {
    const creneau = findCreneau(date, heure);
    if (creneau) return;

    setSelectedSlot({ date, heure });
    setShowConfirm(true);
  };

  const createCreneau = async (date, heure) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateFormatee = `${year}-${month}-${day}`;
    const heureFormatee = heure + ":00";

    const { data, error } = await supabase
      .from("creneaux")
      .insert([
        { date: dateFormatee, heure: heureFormatee, statut: "disponible" },
      ])
      .select();

    if (error) {
      console.error("Erreur création créneau :", error);
    } else {
      setCreneaux([...creneaux, data[0]]);
      setShowConfirm(false);
    }
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
                            className={`rounded-xl h-full w-full flex items-center justify-center text-sm ${
                              isAvailable
                                ? "bg-green text-green-100 cursor-default"
                                : "bg-red text-red-100 cursor-default"
                            }`}
                          >
                            {creneau.statut}
                          </div>
                        ) : (
                          <div
                            onClick={() => handleClickCase(date, heure)}
                            className="h-full w-full hover:bg-gray-100 cursor-pointer rounded-xl"
                          ></div>
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
        {showConfirm && selectedSlot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-cream p-8 rounded-2xl">
              <h2 className="text-lg font-bold mb-4">
                Créer un créneau le{" "}
                <span>
                  {selectedSlot.date.toLocaleDateString("fr-FR")}
                </span>{" "}
                à <span >{selectedSlot.heure}</span> ?
              </h2>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 bg-secondary hover:bg-secondary-100 cursor-pointer text-cream rounded-xl"
                >
                  Non
                </button>
                <button
                  onClick={() =>
                    createCreneau(selectedSlot.date, selectedSlot.heure)
                  }
                  className="px-4 py-2 bg-primary hover:bg-primary-hover cursor-pointer text-black rounded-xl"
                >
                  Oui
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarAdmin;
