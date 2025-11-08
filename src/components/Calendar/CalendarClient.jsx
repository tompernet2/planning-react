import React, { useEffect, useState } from "react";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import supabase from "../../helper/supabaseClient";

function CalendarClient() {
  const [creneaux, setCreneaux] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUnsubscribe, setShowUnsubscribe] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [mesAcceptedDemandes, setMesAcceptedDemandes] = useState([]);
  const [mesPendingDemandes, setMesPendingDemandes] = useState([]);
  const [mesRefusedCreneauIds, setMesRefusedCreneauIds] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  const today = new Date();

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
    setSelectedDay(null);
  };

  const semaineSuivante = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
    setSelectedDay(null);
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

  const handleUnsubscribeClick = (demande) => {
    setSelectedDemande(demande);
    setShowUnsubscribe(true);
  };

  const handleUnsubscribeConfirm = async () => {
    await desinscrireCreneau(
      selectedDemande.id,
      selectedDemande.creneau_id,
      selectedDemande.statut
    );
    setShowUnsubscribe(false);
    setSelectedDemande(null);
  };

  const desinscrireCreneau = async (demandeId, creneauId, statutActuel) => {
    const { error } = await supabase
      .from("demandes")
      .delete()
      .eq("id", demandeId);

    if (error) {
      console.error("Erreur désinscription :", error);
      return;
    }

    if (statutActuel === "accepte") {
      const { error: errCreneau } = await supabase
        .from("creneaux")
        .update({ statut: "disponible" })
        .eq("id", creneauId);

      if (errCreneau) console.error("Erreur libération créneau :", errCreneau);
    }

    setCurrentDate(new Date(currentDate));
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
          setMesAcceptedDemandes([]);
          setMesPendingDemandes([]);
          setMesRefusedCreneauIds([]);
          return;
        }

        const { data: acceptedData } = await supabase
          .from("demandes")
          .select("id, creneau_id, statut")
          .in("creneau_id", creneauIds)
          .eq("client_id", session.user.id)
          .eq("statut", "accepte");

        setMesAcceptedDemandes(acceptedData || []);

        const { data: pendingData } = await supabase
          .from("demandes")
          .select("id, creneau_id, statut")
          .in("creneau_id", creneauIds)
          .eq("client_id", session.user.id)
          .eq("statut", "en_attente");

        setMesPendingDemandes(pendingData || []);

        const { data: refusedData } = await supabase
          .from("demandes")
          .select("creneau_id")
          .in("creneau_id", creneauIds)
          .eq("client_id", session.user.id)
          .eq("statut", "refuse");

        setMesRefusedCreneauIds((refusedData || []).map((d) => d.creneau_id));
      } catch (err) {
        console.error("Erreur dans le chargement du planning :", err);
        setCreneaux([]);
        setMesAcceptedDemandes([]);
        setMesPendingDemandes([]);
        setMesRefusedCreneauIds([]);
      }
    };

    fetchCreneauxEtDemandes();
  }, [currentDate]);

  const joursSemaine = getJoursSemaine();

  return (
    <div className="p-2 md:p-0">
      <h1 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 px-1 md:px-0">
        Planning Hebdomadaire
      </h1>

      <div className="rounded-xl md:rounded-2xl bg-white p-3 md:p-4">
        {/* Navigation semaine */}
        <div className="flex justify-between mb-4 md:mb-6 flex-col gap-2 md:items-center md:flex-row">
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
          <div className="flex items-stretch gap-1 rounded-lg md:rounded-xl w-full md:w-fit overflow-hidden text-cream">
            <button
              onClick={semainePrecedente}
              className="flex items-center justify-center px-4 py-2 md:py-0 md:px-4 bg-secondary cursor-pointer hover:bg-secondary-100 flex-1 md:flex-none"
            >
              <AiOutlineLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center bg-secondary px-2 flex-1 md:flex-none">
              <h2 className="text-sm md:text-base lg:text-xl p-1 md:p-2 whitespace-nowrap">
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
          <div className="hidden lg:block w-16"></div>
        </div>

        {/* VERSION MOBILE - Sélection de jour puis créneaux */}
        <div className="block lg:hidden">
          {/* Les 7 jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {joursSemaine.map((date, index) => {
              const isSelected = selectedDay === index;
              const isToday = formatDate(new Date()) === formatDate(date);
              
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
                
                let bgColor = "";
                let textColor = "";
                let text = "";
                let mid = "";
                let isClickable = false;
                let demande = null;

                if (creneau) {
                  const acceptedDemande = mesAcceptedDemandes.find(
                    (d) => d.creneau_id === creneau.id
                  );
                  const pendingDemande = mesPendingDemandes.find(
                    (d) => d.creneau_id === creneau.id
                  );

                  if (acceptedDemande) {
                    bgColor = "bg-purple";
                    textColor = "text-purple-100";
                    text = "Accepté";
                    demande = acceptedDemande;
                    mid = "text-purple-200";
                  } else if (pendingDemande) {
                    bgColor = "bg-yellow";
                    textColor = "text-yellow-100";
                    text = "En attente";
                    demande = pendingDemande;
                    mid = "text-yellow-200";
                  } else if (mesRefusedCreneauIds.includes(creneau.id)) {
                    bgColor = "bg-red";
                    textColor = "text-red-100";
                    text = "Refusé";
                    mid = "text-red-200";
                  } else if (creneau.statut === "disponible") {
                    bgColor = "bg-green";
                    textColor = "text-green-100";
                    text = "Disponible";
                    isClickable = true;
                    mid = "text-green-200";
                  } else {
                    bgColor = "bg-gray-300";
                    textColor = "text-gray-700";
                    text = "Occupé";
                    mid = "text-gray-500";
                  }
                } else {
                  bgColor = "bg-gray-100";
                  textColor = "text-gray-400";
                  text = "Non défini";
                  mid = "text-gray-400";
                }

                const heureDebut = heure;
                const heureFin = String(parseInt(heure.split(":")[0]) + 1).padStart(2, "0") + ":" + heure.split(":")[1];
                
                return (
                  <div
                    key={heure}
                    onClick={() => {
                      if (isClickable) handleSlotClick(joursSemaine[selectedDay], heure);
                    }}
                    className={`relative rounded-lg p-3 ${bgColor} ${textColor} ${
                      isClickable ? "cursor-pointer active:opacity-80" : ""
                    } ${!creneau ? "border border-gray-200" : ""}`}
                  >
                    {demande && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnsubscribeClick(demande);
                        }}
                        className={`absolute top-2 right-2 ${bgColor} hover:opacity-80 p-1 rounded-lg cursor-pointer border-2`}
                      >
                        <IoClose className="w-5 h-5" />
                      </button>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">{text}</span>
                      <span className={`text-sm ${mid}`}>
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
                <th className="border-r border-b border-gray-300 p-2 w-16 lg:w-20 text-xs lg:text-sm">
                  Heure
                </th>
                {joursSemaine.map((date, i) => (
                  <th
                    key={i}
                    className={`border-b border-gray-300 p-1 lg:p-2 text-xs lg:text-sm ${
                      i < 6 ? "border-r" : ""
                    } ${
                      formatDate(date) === formatDate(today)
                        ? "text-primary-hover"
                        : ""
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
                    className={`border-r border-gray-300 text-gray-500 p-2 lg:p-4 font-medium align-top h-16 lg:h-24 text-xs lg:text-sm ${
                      index < heures.length - 1 ? "border-b" : ""
                    }`}
                  >
                    {heure}
                  </td>

                  {joursSemaine.map((date, i) => {
                    const creneau = findCreneau(date, heure);

                    let bgColor = "";
                    let textColor = "";
                    let text = "";
                    let mid = "";
                    let isClickable = false;
                    let demande = null;

                    if (creneau) {
                      const acceptedDemande = mesAcceptedDemandes.find(
                        (d) => d.creneau_id === creneau.id
                      );
                      const pendingDemande = mesPendingDemandes.find(
                        (d) => d.creneau_id === creneau.id
                      );

                      if (acceptedDemande) {
                        bgColor = "bg-purple";
                        textColor = "text-purple-100";
                        text = "Accepté";
                        demande = acceptedDemande;
                        mid = "text-purple-200";
                      } else if (pendingDemande) {
                        bgColor = "bg-yellow";
                        textColor = "text-yellow-100";
                        text = "Attente";
                        demande = pendingDemande;
                        mid = "text-yellow-200";
                      } else if (mesRefusedCreneauIds.includes(creneau.id)) {
                        bgColor = "bg-red";
                        textColor = "text-red-100";
                        text = "Refusé";
                        mid = "text-red-200";
                      } else if (creneau.statut === "disponible") {
                        bgColor = "bg-green";
                        textColor = "text-green-100";
                        text = "Disponible";
                        isClickable = true;
                        mid = "text-green-200";
                      } else {
                        bgColor = "bg-gray-300";
                        textColor = "text-gray-700";
                        text = "Occupé";
                        mid = "text-gray-500";
                      }
                    }

                    return (
                      <td
                        key={i}
                        className={`p-0.5 h-16 lg:h-24 ${i < 6 ? "border-r" : ""} ${
                          index < heures.length - 1 ? "border-b" : ""
                        } border-gray-300`}
                      >
                        {creneau ? (
                          <div
                            onClick={() =>
                              isClickable && handleSlotClick(date, heure)
                            }
                            className={`group relative rounded-lg lg:rounded-xl h-full w-full flex p-1.5 lg:p-2 flex-col text-xs lg:text-sm ${bgColor} ${textColor} ${
                              isClickable
                                ? "cursor-pointer hover:opacity-80"
                                : "cursor-default"
                            }`}
                          >
                            {demande && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnsubscribeClick(demande);
                                }}
                                className={`hidden group-hover:flex absolute top-0 right-0 border border-2 ${bgColor} hover:opacity-80 m-1 p-0.5 rounded-lg cursor-pointer`}
                              >
                                <IoClose className="w-4 h-4 lg:w-5 lg:h-5" />
                              </button>
                            )}
                            <span className="font-semibold text-[10px] lg:text-sm">{text}</span>

                            <span className={`text-[9px] lg:text-xs ${mid}`}>
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

        {/* Modal de confirmation inscription */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 md:p-0">
            <div className="bg-cream p-6 md:p-8 rounded-xl md:rounded-2xl max-w-sm w-full">
              <h2 className="text-base md:text-lg font-bold mb-4">
                Voulez vous vous inscrire ?
              </h2>
              <div className="flex flex-col md:flex-row justify-end gap-3 md:gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-full md:w-auto px-4 py-2.5 md:py-2 bg-secondary hover:bg-secondary-100 cursor-pointer text-cream rounded-lg md:rounded-xl"
                >
                  Non
                </button>
                <button
                  onClick={handleConfirm}
                  className="w-full md:w-auto px-4 py-2.5 md:py-2 bg-primary hover:bg-primary-hover cursor-pointer text-black rounded-lg md:rounded-xl"
                >
                  Oui
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation désinscription */}
        {showUnsubscribe && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 md:p-0">
            <div className="bg-cream p-6 md:p-8 rounded-xl md:rounded-2xl max-w-sm w-full">
              <h2 className="text-base md:text-lg font-bold mb-4">
                Voulez-vous vous désinscrire ?
              </h2>
              <div className="flex flex-col md:flex-row justify-end gap-3 md:gap-4">
                <button
                  onClick={() => {
                    setShowUnsubscribe(false);
                    setSelectedDemande(null);
                  }}
                  className="w-full md:w-auto px-4 py-2.5 md:py-2 bg-secondary hover:bg-secondary-100 cursor-pointer text-cream rounded-lg md:rounded-xl"
                >
                  Non
                </button>
                <button
                  onClick={handleUnsubscribeConfirm}
                  className="w-full md:w-auto px-4 py-2.5 md:py-2 bg-primary hover:bg-primary-100 cursor-pointer text-black rounded-lg md:rounded-xl"
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

export default CalendarClient;