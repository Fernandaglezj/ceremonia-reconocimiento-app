"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function HomePage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [validatedTeam, setValidatedTeam] = useState<any | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [members, setMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const router = useRouter()

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Buscar el equipo en Supabase por contraseña
    const { data: team, error: dbError } = await supabase
      .from("teams")
      .select("*")
      .eq("password", password)
      .single()

    if (dbError || !team) {
      setError("Contraseña incorrecta. Verifica con tu líder de equipo.")
      setIsLoading(false)
      return
    }

    setValidatedTeam(team)
    setIsLoading(false)
  }

  // Consultar miembros del equipo cuando se valida el equipo
  useEffect(() => {
    const fetchMembers = async () => {
      if (!validatedTeam) return;
      setLoadingMembers(true);
      setError("");
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("team_id", validatedTeam.id)
        .order("name", { ascending: true });
      if (error) {
        setError("No se pudieron cargar los miembros del equipo.");
        setMembers([]);
      } else {
        setMembers(data || []);
      }
      setLoadingMembers(false);
    };
    fetchMembers();
  }, [validatedTeam]);

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatedTeam || !selectedMemberId) return
    const selectedMember = members.find((m) => m.id === selectedMemberId)
    if (!selectedMember) return
    localStorage.setItem("currentTeam", JSON.stringify(validatedTeam))
    localStorage.setItem("currentEvaluator", JSON.stringify(selectedMember))
    router.push("/evaluation")
  }

  // Si ya validamos el equipo, mostrar selector de miembro
  if (validatedTeam) {
    return (
      <div className="min-h-screen maya-background flex items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-md">
          {/* Símbolo maya decorativo */}
          <div className="text-center mb-8">
            <div className="inline-block p-6 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full shadow-2xl border-4 border-yellow-500">
              <div className="text-4xl text-white font-bold">⚡</div>
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-8 relative flex flex-col items-center justify-center">
            <div className="relative flex flex-col items-center">
              <h1 className="neon-title text-4xl md:text-5xl lg:text-6xl font-bold mb-2 tracking-wider relative text-center">
                CEREMONIA DE
              </h1>
              <h1 className="neon-title text-4xl md:text-5xl lg:text-6xl font-bold mb-8 tracking-wider relative text-center">
                RECONOCIMIENTO
              </h1>
            </div>
          </div>

          <div className="bg-gradient-to-br from-stone-800/90 to-amber-900/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-2 border-yellow-600">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-yellow-200 mb-2 maya-ritual-title">Clan {validatedTeam.name}</h1>
              <p className="text-amber-200 text-sm maya-text">Selecciona tu nombre para comenzar el ritual</p>
            </div>

            <form onSubmit={handleMemberSubmit} className="space-y-6">
              <div>
                <label htmlFor="member" className="block text-yellow-200 text-sm font-medium mb-2 maya-text">
                  ¿Quién eres?
                </label>
                {loadingMembers ? (
                  <div className="text-amber-200">Cargando miembros...</div>
                ) : (
                  <select
                    id="member"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-700/80 backdrop-blur-sm border-2 border-yellow-600 rounded-lg text-white focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 maya-text"
                    required
                  >
                    <option value="">Selecciona tu nombre...</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} - {member.role}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {error && (
                <div className="bg-red-900/70 backdrop-blur-sm border border-red-600 text-red-200 px-4 py-3 rounded-lg text-sm maya-text">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedMemberId}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:from-stone-600 disabled:to-stone-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg border-2 border-yellow-500 disabled:border-stone-600 maya-text"
              >
                Comenzar el Ritual
              </button>
            </form>

            <div className="mt-6 text-center">
              <button onClick={() => setValidatedTeam(null)} className="text-amber-300 text-xs underline maya-text">
                Regresar a la entrada del clan
              </button>
            </div>
          </div>

          {/* Decoración inferior */}
          <div className="text-center mt-6">
            <div className="inline-flex space-x-2 text-yellow-600">
              <span className="text-2xl">◆</span>
              <span className="text-xl">◇</span>
              <span className="text-2xl">◆</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen maya-background flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        {/* Símbolo maya decorativo */}
        <div className="text-center mb-8">
          <div className="inline-block p-6 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full shadow-2xl border-4 border-yellow-500">
            <div className="text-4xl text-white font-bold">⚡</div>
          </div>
        </div>

        {/* Título principal con efecto 3D beveled - CENTRADO */}
        <div className="text-center mb-8 relative flex flex-col items-center justify-center">
          <div className="relative flex flex-col items-center">
            <h1 className="neon-title text-4xl md:text-5xl lg:text-6xl font-bold mb-2 tracking-wider relative text-center">
              CEREMONIA DE
            </h1>
            <h1 className="neon-title text-4xl md:text-5xl lg:text-6xl font-bold mb-8 tracking-wider relative text-center">
              RECONOCIMIENTO
            </h1>
          </div>
        </div>

        <div className="bg-gradient-to-br from-stone-800/90 to-amber-900/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-2 border-yellow-600">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-yellow-200 mb-2 maya-ritual-title">Ritual de Evaluación</h1>
            <p className="text-amber-200 text-sm maya-text">Ingresa la palabra sagrada de tu clan</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-yellow-200 text-sm font-medium mb-2 maya-text">
                Contraseña del Equipo
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-stone-700/80 backdrop-blur-sm border-2 border-yellow-600 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 maya-text"
                placeholder="Ingresa la contraseña..."
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/70 backdrop-blur-sm border border-red-600 text-red-200 px-4 py-3 rounded-lg text-sm maya-text">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:from-stone-600 disabled:to-stone-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg border-2 border-yellow-500 disabled:border-stone-600 maya-text"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Validando...
                </span>
              ) : (
                "Ingresar al Ritual"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-amber-300 text-xs maya-text">
              Solo los miembros del clan pueden participar en este ritual sagrado
            </p>
          </div>
        </div>

        {/* Decoración inferior */}
        <div className="text-center mt-6">
          <div className="inline-flex space-x-2 text-yellow-600">
            <span className="text-2xl">◆</span>
            <span className="text-xl">◇</span>
            <span className="text-2xl">◆</span>
          </div>
        </div>
      </div>
    </div>
  )
}
