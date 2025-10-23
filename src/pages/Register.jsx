import React, { useState } from "react";
import supabase from "../helper/supabaseClient";
import { Link } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data) {
      setMessage(
        "Compte créé avec succès. Vérifiez vos emails pour confirmer votre inscription."
      );
    }

    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Créer un compte
        </h2>

        {message && (
          <div className="mb-4 text-center text-sm p-2 rounded ${message.includes('succès') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            placeholder="Adresse email"
            required
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-700"
          />

          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            placeholder="Mot de passe"
            required
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-700"
          />

          <button
            type="submit"
            className="bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Créer un compte
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <span>Déjà un compte ? </span>
          <Link
            to="/login"
            className="text-gray-800 font-semibold hover:underline"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
