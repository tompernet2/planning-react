import React, { useEffect, useState } from "react";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import supabase from "../../helper/supabaseClient";
import { useNavigate } from "react-router-dom";

function CalendarInvite() {
  const [creneaux, setCreneaux] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
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
    setSelectedDay(null);
  };

  const semaineSuivante = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
    setSelectedDay(null);
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
    <div className="p-2 md:p-0">
      <h1 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 px-1 md:px-0">
        Planning Hebdomadaire
      </h1>
      <div className="rounded-xl md:rounded-2xl bg-white p-3 md:p-4">
        {/* Navigation semaine */}
        <div className="flex justify-between mb-4 md:mb-6 flex-col gap-2 md:items-center md:flex-row">
          {/* Mois et Année */}
          <div className="text-base md:text-2xl font-bold text-secondary flex items-center gap-2">
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
          <div className="flex items-stretch gap-1 rounded-lg md:rounded-xl w-full md:w-fit overflow-hidden text-cream">
            <button
              onClick={semainePrecedente}
              className="flex items-center justify-center px-4 py-2 md:py-0 md:px-4 bg-secondary cursor-pointer hover:bg-secondary-100 flex-1 md:flex-none"
            >
              <AiOutlineLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center bg-secondary px-2 flex-1 md:flex-none">
              <h2 className="text-sm md:text-base p-1 md:p-2 whitespace-nowrap">
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
              className="flex items-center justify-center px-4 py-2 md:py-0 md:px-4 bg-secondary cursor-pointer hover:bg-secondary-100 flex-1 md:flex-none"
            >
              <AiOutlineRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VERSION MOBILE - Sélection de jour puis créneaux */}
        <div className="block lg:hidden">
          {/* Les 7 jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {joursSemaine.map((date, index) => {
              const isSelected = selectedDay === index;
              const isToday = new Date().toDateString() === date.toDateString();
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDay(index)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-secondary text-cream"
                      : isToday
                      ? "bg-primary text-black"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="text-xs font-medium">
                    {date.toLocaleDateString("fr-FR", { weekday: "short" }).substring(0, 3)}
                  </span>
                  <span className="text-lg font-bold mt-1">
                    {date.getDate()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Créneaux du jour sélectionné */}
          {selectedDay !== null ? (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">
                {joursSemaine[selectedDay].toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).replace(/^\w/, (c) => c.toUpperCase())}
              </h3>
              
              {heures.map((heure) => {
                const creneau = findCreneau(joursSemaine[selectedDay], heure);
                const isAvailable = creneau && creneau.statut === "disponible";
                const heureDebut = heure;
                const heureFin = String(parseInt(heure.split(":")[0]) + 1).padStart(2, "0") + ":" + heure.split(":")[1];
                
                return (
                  <div
                    key={heure}
                    onClick={() => {
                      if (isAvailable) setShowConfirm(true);
                    }}
                    className={`rounded-lg p-3 ${
                      creneau
                        ? isAvailable
                          ? "bg-green text-green-100 cursor-pointer active:bg-green-hover"
                          : "bg-gray-300 text-gray-700"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">
                        {creneau 
                          ? (creneau.statut === "disponible" ? "Disponible" : "Occupé")
                          : "Non défini"
                        }
                      </span>
                      <span className={`text-sm ${
                        creneau
                          ? isAvailable ? "text-green-200" : "text-gray-500"
                          : "text-gray-400"
                      }`}>
                        {heureDebut} - {heureFin}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              Sélectionnez un jour pour voir les créneaux
            </div>
          )}
        </div>

        {/* VERSION DESKTOP - Grille calendrier */}
        <div className="hidden lg:block rounded-2xl border border-gray-300 overflow-x-auto">
          <table className="w-full table-fixed min-w-[640px]">
            <thead>
              <tr>
                <th className="border-r border-b border-gray-300 p-2 w-16 md:w-20 text-xs md:text-sm">
                  Heure
                </th>
                {joursSemaine.map((date, i) => (
                  <th
                    key={i}
                    className={`border-b border-gray-300 p-1 md:p-2 text-xs md:text-sm ${
                      i < 6 ? "border-r" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="hidden lg:inline">
                        {date.toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="lg:hidden">
                        {date.toLocaleDateString("fr-FR", {
                          weekday: "short",
                        }).substring(0, 3)}
                      </span>
                      <span className="lg:hidden font-bold">
                        {date.getDate()}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {heures.map((heure, index) => (
                <tr key={heure}>
                  <td
                    className={`border-r border-gray-300 text-gray-500 p-2 md:p-4 font-medium align-top h-16 md:h-24 text-xs md:text-sm ${
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
                        className={`p-0.5 h-16 md:h-24 ${i < 6 ? "border-r" : ""} ${
                          index < heures.length - 1 ? "border-b" : ""
                        } border-gray-300`}
                      >
                        {creneau ? (
                          <div
                            onClick={() => {
                              if (isAvailable) setShowConfirm(true);
                            }}
                            className={`rounded-lg md:rounded-xl h-full w-full flex p-1.5 md:p-2 flex-col text-xs md:text-sm ${
                              isAvailable
                                ? "bg-green text-green-100 cursor-pointer hover:bg-green-hover"
                                : "bg-gray-300 text-gray-700 cursor-default"
                            }`}
                          >
                            <span className="font-semibold text-[10px] md:text-sm">
                              {creneau.statut === "disponible"
                                ? "Dispo"
                                : "Occupé"}
                            </span>
                            <span
                              className={`text-[9px] md:text-xs ${
                                isAvailable ? "text-green-200" : "text-gray-500"
                              }`}
                            >
                              {heure.substring(0, 5)} -{" "}
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
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 md:p-0">
            <div className="bg-cream p-6 md:p-8 rounded-xl md:rounded-2xl max-w-sm w-full">
              <h2 className="text-base md:text-lg font-bold mb-4">
                Pour vous inscrire veuillez vous connecté
              </h2>
              <div className="flex flex-col md:flex-row justify-end gap-3 md:gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-full md:w-auto px-4 py-2.5 md:py-2 bg-secondary hover:bg-secondary-100 cursor-pointer text-cream rounded-lg md:rounded-xl"
                >
                  Fermer
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full md:w-auto px-4 py-2.5 md:py-2 bg-primary hover:bg-primary-hover cursor-pointer text-black rounded-lg md:rounded-xl"
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