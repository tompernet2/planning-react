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
    <div>
      <h1 className="text-2xl font-bold mb-4">Planning Hebdomadaire</h1>

      <div className="rounded-2xl bg-white p-4  ">
        {/* Navigation semaine */}
        <div className="flex items-center justify-between mb-6">
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
          <div className="w-16"></div>
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
                        text = "réservé";
                        demande = acceptedDemande;
                        mid = "text-purple-200";
                      } else if (pendingDemande) {
                        bgColor = "bg-yellow";
                        textColor = "text-yellow-100";
                        text = "inscrit";
                        demande = pendingDemande;
                        mid = "text-yellow-200";
                      } else if (mesRefusedCreneauIds.includes(creneau.id)) {
                        bgColor = "bg-gray-300";
                        textColor = "text-gray-700";
                        text = "refusé";
                        mid = "text-gray-500";
                      } else if (creneau.statut === "disponible") {
                        bgColor = "bg-green";
                        textColor = "text-green-100";
                        text = "disponible";
                        isClickable = true;
                        mid = "text-green-200";
                      } else {
                        bgColor = "bg-red";
                        textColor = "text-red-100";
                        text = "occupé";
                        mid = "text-red-200";
                      }
                    }

                    return (
                      <td
                        key={i}
                        className={`p-0.5 h-24 ${i < 6 ? "border-r" : ""} ${
                          index < heures.length - 1 ? "border-b" : ""
                        } border-gray-300`}
                      >
                        {creneau ? (
                          <div
                            onClick={() =>
                              isClickable && handleSlotClick(date, heure)
                            }
                            className={`group relative rounded-xl h-full w-full flex p-2 flex-col text-sm ${bgColor} ${textColor} ${
                              isClickable
                                ? "cursor-pointer hover:opacity-80"
                                : "cursor-default"
                            }`}
                          >
                            {demande && (
                              <button
                                onClick={() => {
                                  handleUnsubscribeClick(demande);
                                }}
                                className={`hidden group-hover:flex absolute top-0 right-0 border ${bgColor} hover:opacity-80 m-1 p-0.5 rounded-lg cursor-pointer`}
                              >
                                <IoClose className="w-5 h-5" />
                              </button>
                            )}
                            <span>{text}</span>

                            <span className={`${mid}`}>
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

        {/* Modal de confirmation inscription */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-cream p-8 rounded-2xl">
              <h2 className="text-lg font-bold mb-4">
                Voulez vous vous inscrire ?
              </h2>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 bg-secondary hover:bg-secondary-100 cursor-pointer text-cream rounded-xl"
                >
                  Non
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover cursor-pointer text-black rounded-xl"
                >
                  Oui
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation désinscription */}
        {showUnsubscribe && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-cream p-8 rounded-2xl">
              <h2 className="text-lg font-bold mb-4">
                Voulez-vous vous désinscrire ?
              </h2>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowUnsubscribe(false);
                    setSelectedDemande(null);
                  }}
                  className="px-4 py-2 bg-secondary hover:bg-secondary-100 cursor-pointer text-cream rounded-xl"
                >
                  Non
                </button>
                <button
                  onClick={handleUnsubscribeConfirm}
                  className="px-4 py-2 bg-primary hover:bg-primary-100 cursor-pointer text-black rounded-xl"
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
