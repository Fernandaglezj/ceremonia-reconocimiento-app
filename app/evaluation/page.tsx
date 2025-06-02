"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Team, TeamMember } from "@/lib/types"
import EvaluationForm from "@/components/EvaluationForm"
import { supabase } from "@/lib/supabase"

export default function EvaluationPage() {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [currentEvaluator, setCurrentEvaluator] = useState<TeamMember | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [evaluatedMembers, setEvaluatedMembers] = useState<string[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const teamData = localStorage.getItem("currentTeam")
    const evaluatorData = localStorage.getItem("currentEvaluator")
    
    if (!teamData || !evaluatorData) {
      router.push("/")
      return
    }

    const team = JSON.parse(teamData)
    const evaluator = JSON.parse(evaluatorData)
    setCurrentTeam(team)
    setCurrentEvaluator(evaluator)

    // Cargar miembros ya evaluados por este evaluador
    const evaluatorKey = `evaluated_${team.id}_${evaluator.id}`
    const evaluated = localStorage.getItem(evaluatorKey)
    if (evaluated) {
      setEvaluatedMembers(JSON.parse(evaluated))
    }

    // Verificar si ya completó todas las evaluaciones
    const completedKey = `completed_${team.id}_${evaluator.id}`
    const hasCompleted = localStorage.getItem(completedKey) === "true"
    
    if (hasCompleted) {
      // Podríamos redirigir o mostrar un mensaje especial
    }
  }, [router])

  // Consultar miembros del equipo desde Supabase
  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentTeam) return;
      setLoadingMembers(true);
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("team_id", currentTeam.id)
        .order("name", { ascending: true });
      if (error) {
        setMembers([]);
      } else {
        setMembers(data || []);
      }
      setLoadingMembers(false);
    };
    fetchMembers();
  }, [currentTeam]);

  const handleMemberEvaluated = (memberId: string) => {
    if (!currentTeam || !currentEvaluator) return

    const newEvaluated = [...evaluatedMembers, memberId]
    setEvaluatedMembers(newEvaluated)
    
    // Guardar evaluaciones de este evaluador
    const evaluatorKey = `evaluated_${currentTeam.id}_${currentEvaluator.id}`
    localStorage.setItem(evaluatorKey, JSON.stringify(newEvaluated))
    
    // Verificar si ha completado todas las evaluaciones posibles
    const remainingMembers = members.filter(
      (m) => m.id !== currentEvaluator.id && !newEvaluated.includes(m.id)
    )
    
    if (remainingMembers.length === 0) {
      // Marcar como completado
      const completedKey = `completed_${currentTeam.id}_${currentEvaluator.id}`
      localStorage.setItem(completedKey, "true")
    }
    
    setSelectedMember(null)
  }

  const handleLogout = () => {
    localStorage.removeItem("currentTeam")
    localStorage.removeItem("currentEvaluator")
    router.push("/")
  }

  if (!currentTeam || !currentEvaluator) {
    return (
      <div className="min-h-screen maya-background flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  if (selectedMember) {
    return (
      <EvaluationForm
        member={selectedMember}
        team={currentTeam}
        evaluator={currentEvaluator}
        onComplete={() => handleMemberEvaluated(selectedMember.id)}
        onCancel={() => setSelectedMember(null)}
      />
    )
  }

  // Filtrar para que no se pueda evaluar a uno mismo
  const availableMembers = members.filter(
    (member) => !evaluatedMembers.includes(member.id) && member.id !== currentEvaluator.id
  )
  
  const isCompleted = availableMembers.length === 0
  const totalToEvaluate = members.length - 1 // Todos menos uno mismo
  const completedCount = evaluatedMembers.length

  return (
    <div className="min-h-screen maya-background p-4">
      {/* Overlay para mejorar legibilidad */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full shadow-xl border-3 border-yellow-500 mb-4">
            <div className="text-3xl text-white">🏛️</div>
          </div>
          <h1 className="text-4xl font-bold text-yellow-200 mb-2 maya-ritual-title">Clan {currentTeam.name}</h1>
          <p className="text-amber-200">
            Bienvenido <span className="font-bold">{currentEvaluator.name}</span>, evalúa a los miembros de tu clan
          </p>
          <button onClick={handleLogout} className="mt-4 text-yellow-400 hover:text-yellow-300 text-sm underline">
            Salir del ritual
          </button>
        </div>

        {/* Progreso */}
        <div className="bg-gradient-to-r from-stone-800/90 to-amber-900/90 backdrop-blur-sm p-6 rounded-xl shadow-xl border-2 border-yellow-600 mb-8">
          <div className="flex items-center justify-between text-yellow-200">
            <span className="font-medium">Progreso del Ritual:</span>
            <span className="text-xl font-bold">
              {completedCount} / {totalToEvaluate}
            </span>
          </div>
          <div className="mt-3 bg-stone-700/80 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full transition-all duration-500"
              style={{ width: `${(completedCount / totalToEvaluate) * 100}%` }}
            />
          </div>
        </div>

        {/* Lista de miembros */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            // No mostrar al evaluador actual en la lista
            if (member.id === currentEvaluator.id) return null;
            
            const isEvaluated = evaluatedMembers.includes(member.id)

            return (
              <div
                key={member.id}
                className={`p-6 rounded-xl shadow-lg border-2 transition-all duration-200 backdrop-blur-sm ${
                  isEvaluated
                    ? "bg-gradient-to-br from-green-800/90 to-green-900/90 border-green-600"
                    : "bg-gradient-to-br from-stone-800/90 to-amber-900/90 border-yellow-600 hover:border-yellow-400 cursor-pointer hover:shadow-xl"
                }`}
                onClick={() => !isEvaluated && setSelectedMember(member)}
              >
                <div className="text-center">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold ${
                      isEvaluated
                        ? "bg-green-600 text-white"
                        : "bg-gradient-to-br from-yellow-600 to-orange-600 text-white"
                    }`}
                  >
                    {isEvaluated ? "✓" : member.name.charAt(0)}
                  </div>

                  <h3 className={`text-lg font-bold mb-2 ${isEvaluated ? "text-green-200" : "text-yellow-200"}`}>
                    {member.name}
                  </h3>

                  <p className={`text-sm mb-4 ${isEvaluated ? "text-green-300" : "text-amber-200"}`}>{member.role}</p>

                  {isEvaluated ? (
                    <div className="bg-green-700/80 text-green-200 py-2 px-4 rounded-lg text-sm font-medium">
                      ✨ Evaluado
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-yellow-500 hover:to-orange-500 transition-all">
                      Evaluar
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {isCompleted && (
          <div className="text-center mt-12">
            <div className="bg-gradient-to-br from-green-800/90 to-green-900/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border-2 border-green-600">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-green-200 mb-4">¡Ritual Completado!</h2>
              <p className="text-green-300 text-lg">
                Has evaluado a todos los miembros de tu clan. Los ancestros han recibido tu sabiduría.
              </p>
            </div>
          </div>
        )}

        {/* Decoración inferior */}
        <div className="text-center mt-12">
          <div className="inline-flex space-x-3 text-yellow-600">
            <span className="text-3xl">◆</span>
            <span className="text-2xl">◇</span>
            <span className="text-3xl">◆</span>
            <span className="text-2xl">◇</span>
            <span className="text-3xl">◆</span>
          </div>
        </div>
      </div>
    </div>
  )
}
