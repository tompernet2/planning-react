import React, { useEffect, useState } from "react";
import supabase from "../helper/supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaPen } from "react-icons/fa";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [prenomEdit, setPrenomEdit] = useState("");
  const [nomEdit, setNomEdit] = useState("");
  const navigate = useNavigate();

  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session || !session.user) {
      navigate("/login");
    } else {
      setUser(session.user);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Erreur récupération profil :", error);
      } else {
        setProfiles(data);
        setPrenomEdit(data.prenom);
        setNomEdit(data.nom);
      }
    }
  };

  useEffect(() => {
    checkUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/login");
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({ prenom: prenomEdit, nom: nomEdit })
      .eq("id", profiles.id);

    if (error) {
      console.error("Erreur mise à jour profil :", error);
      return;
    }

    setProfiles({ ...profiles, prenom: prenomEdit, nom: nomEdit });
    setEditMode(false);
  };

  if (!user || !profiles) return null;

  return (
    <div className="p-4 m-5 rounded-2xl">
      <h1 className="text-2xl font-bold mb-4">Bonjour, {profiles.prenom}</h1>

      <div className=" bg-white text-gray-800 p-4 rounded-2xl inline-block max-w-full relative break-words box-border">
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="absolute top-2 right-2 bg-secondary text-white p-3 rounded-xl hover:bg-secondary-100 text-sm"
          >
            <FaPen className="w-3 h-3" />
          </button>
        )}

        <div className="mb-2">
          <strong>Prénom :</strong>{" "}
          {editMode ? (
            <input
              type="text"
              value={prenomEdit}
              onChange={(e) => setPrenomEdit(e.target.value)}
              className="border border-gray-300 rounded "
            />
          ) : (
            profiles.prenom
          )}
        </div>

        <div className="mb-2">
          <strong>Nom :</strong>{" "}
          {editMode ? (
            <input
              type="text"
              value={nomEdit}
              onChange={(e) => setNomEdit(e.target.value)}
              className="border border-gray-300 rounded"
            />
          ) : (
            profiles.nom
          )}
        </div>

        <div className="mb-2">
          <strong>Email :</strong> {user.email}
        </div>

        <div className="mb-4">
          <strong>Rôle :</strong> {profiles.role}
        </div>

        {editMode ? (
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(false)}
              className="mt-4 bg-secondary text-white px-4 py-2 rounded-xl hover:bg-secondary-100"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="mt-4 bg-primary text-black px-4 py-2 rounded-xl hover:bg-primary-100"
            >
              Valider
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignOut}
            className="mt-4 bg-secondary text-white px-4 py-2 rounded-xl hover:bg-secondary-100"
          >
            Déconnexion
          </button>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
