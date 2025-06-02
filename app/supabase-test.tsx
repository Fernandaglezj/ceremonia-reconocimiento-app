"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupabaseTest() {
  const [teams, setTeams] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("teams").select("*").limit(5);
      if (error) {
        setError(error.message);
      } else {
        setTeams(data || []);
      }
      setLoading(false);
    };
    fetchTeams();
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1>Prueba de conexión a Supabase</h1>
      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <pre>{JSON.stringify(teams, null, 2)}</pre>
    </div>
  );
} 