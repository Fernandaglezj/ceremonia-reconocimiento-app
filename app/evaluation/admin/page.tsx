"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { saveAs } from "file-saver"

interface EvaluationSummary {
  memberId: string
  memberName: string
  teamId: string
  teamName: string
  averageScores: number[]
  totalEvaluations: number
  overallAverage: number
}

interface Team {
  id: string
  name: string
}

export default function AdminPage() {
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [summaries, setSummaries] = useState<EvaluationSummary[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentTeamFilter, setCurrentTeamFilter] = useState<string>("all")
  const router = useRouter()

  // Contraseña de administrador - en producción debería ser manejada de forma más segura
  const adminPassword = "admin2024"

  useEffect(() => {
    // Verificar si ya está autenticado
    const adminAuth = localStorage.getItem("adminAuth")
    if (adminAuth === "true") {
      setIsAuthenticated(true)
      loadData()
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === adminPassword) {
      setIsAuthenticated(true)
      localStorage.setItem("adminAuth", "true")
      loadData()
    } else {
      alert("Contraseña incorrecta")
    }
  }

  const getAverageTotal = (scores: number[]): number => {
    if (scores.length === 0) return 0
    const sum = scores.reduce((acc, score) => acc + score, 0)
    return parseFloat((sum / scores.length).toFixed(1))
  }

  // Cargar equipos y evaluaciones desde Supabase
  const loadData = async () => {
    // Cargar equipos
    const { data: teamsData } = await supabase.from("teams").select("id, name")
    setTeams(teamsData || [])

    // Cargar evaluaciones y respuestas
    const { data: evaluationsData } = await supabase
      .from("evaluations")
      .select("id, team_id, evaluator_id, evaluated_id, members!evaluations_evaluated_id_fkey(name, team_id), evaluation_answers(score, question_number)")
    setEvaluations(evaluationsData || [])

    // Procesar los datos para crear resúmenes
    const summariesMap = new Map<string, EvaluationSummary>();

    (evaluationsData || []).forEach((evaluation: any) => {
      const member = evaluation.members
      const teamId = member?.team_id
      const memberId = member?.id || evaluation.evaluated_id
      const memberName = member?.name || "Desconocido"
      const teamName = (teamsData || []).find((t: Team) => t.id === teamId)?.name || "Desconocido"
      const answers = (evaluation.evaluation_answers || []).sort((a: any, b: any) => a.question_number - b.question_number).map((a: any) => a.score)
      const key = `${teamId}-${memberId}`

      if (!summariesMap.has(key)) {
        summariesMap.set(key, {
          memberId,
          memberName,
          teamId,
          teamName,
          averageScores: new Array(answers.length).fill(0),
          totalEvaluations: 0,
          overallAverage: 0
        })
      }
      const summary = summariesMap.get(key)!
      summary.totalEvaluations += 1
      answers.forEach((score: number, index: number) => {
        summary.averageScores[index] += score
      })
    })

    // Calcular promedios
    const summariesList: EvaluationSummary[] = Array.from(summariesMap.values())
    summariesList.forEach((summary) => {
      summary.averageScores = summary.averageScores.map((score: number) => summary.totalEvaluations > 0 ? parseFloat((score / summary.totalEvaluations).toFixed(1)) : 0)
      summary.overallAverage = getAverageTotal(summary.averageScores)
    })
    summariesList.sort((a, b) => b.overallAverage - a.overallAverage)
    setSummaries(summariesList)
  }

  const handleBackToRitual = () => {
    router.push("/")
  }

  const handleLogout = () => {
    localStorage.removeItem("adminAuth")
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen maya-background flex items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block p-6 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full shadow-2xl border-4 border-yellow-500">
              <div className="text-4xl text-white font-bold">👑</div>
            </div>
            <h1 className="text-3xl font-bold text-yellow-200 mt-4">Panel de Administración</h1>
            <p className="text-amber-200 text-sm mt-2">Acceso para Sumos Sacerdotes</p>
          </div>

          <div className="bg-gradient-to-br from-stone-800/90 to-amber-900/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-2 border-yellow-600">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-yellow-200 text-sm font-medium mb-2">
                  Contraseña Sagrada
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-700/80 backdrop-blur-sm border-2 border-yellow-600 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  placeholder="Ingresa la contraseña de administrador..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg border-2 border-yellow-500"
              >
                Acceder al Santuario
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button onClick={handleBackToRitual} className="text-amber-300 text-xs underline">
                Volver al Ritual Principal
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const filteredSummaries = currentTeamFilter === "all" 
    ? summaries 
    : summaries.filter(summary => summary.teamId === currentTeamFilter)

  // Función para descargar CSV del ranking filtrado
  const downloadCSV = () => {
    if (filteredSummaries.length === 0) return;
    const headers = [
      "Nombre",
      "Clan",
      "Liderazgo",
      "Valores",
      "Comunicación",
      "Colaboración",
      "Organización",
      "Promedio",
      "Evaluaciones"
    ];
    const rows = filteredSummaries.map(summary => [
      summary.memberName,
      summary.teamName,
      ...summary.averageScores,
      summary.overallAverage,
      summary.totalEvaluations
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${val}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `ranking_${currentTeamFilter === "all" ? "todos" : currentTeamFilter}.csv`);
  };

  return (
    <div className="min-h-screen maya-background p-4 pb-20">
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full shadow-xl border-3 border-yellow-500 mb-4">
            <div className="text-3xl text-white">👑</div>
          </div>
          <h1 className="text-4xl font-bold text-yellow-200 mb-2 maya-ritual-title">Códices Sagrados</h1>
          <p className="text-amber-200">Resultados de las evaluaciones por orden de puntuación</p>
          
          <div className="flex justify-center space-x-4 mt-4">
            <button onClick={handleBackToRitual} className="text-yellow-400 hover:text-yellow-300 text-sm underline">
              Volver al Ritual
            </button>
            <button onClick={handleLogout} className="text-yellow-400 hover:text-yellow-300 text-sm underline">
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Filtro de equipos */}
        <div className="bg-gradient-to-r from-stone-800/90 to-amber-900/90 backdrop-blur-sm p-4 rounded-xl shadow-xl border-2 border-yellow-600 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-yellow-200 font-bold mb-2 md:mb-0">Filtrar por Clan:</h2>
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <select
                value={currentTeamFilter}
                onChange={e => setCurrentTeamFilter(e.target.value)}
                className="px-4 py-2 rounded-lg bg-stone-700/80 text-yellow-200 border-2 border-yellow-600 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 maya-text"
              >
                <option value="all">Todos</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              {currentTeamFilter !== "all" && filteredSummaries.length > 0 && (
                <button
                  onClick={downloadCSV}
                  className="ml-0 md:ml-4 px-4 py-2 rounded-lg bg-yellow-600 text-white font-bold border-2 border-yellow-500 hover:bg-yellow-500 transition-all"
                >
                  Descargar CSV
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas Generales */}
        <div className="bg-gradient-to-r from-stone-800/90 to-amber-900/90 backdrop-blur-sm p-6 rounded-xl shadow-xl border-2 border-yellow-600 mb-8">
          <h2 className="text-xl font-bold text-yellow-200 mb-4">Estadísticas Generales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-stone-700/50 rounded-lg p-4 text-center">
              <span className="text-amber-300 text-sm block mb-1">Total Evaluaciones</span>
              <span className="text-white text-2xl font-bold">{evaluations.length}</span>
            </div>
            <div className="bg-stone-700/50 rounded-lg p-4 text-center">
              <span className="text-amber-300 text-sm block mb-1">Miembros Evaluados</span>
              <span className="text-white text-2xl font-bold">{summaries.length}</span>
            </div>
            <div className="bg-stone-700/50 rounded-lg p-4 text-center">
              <span className="text-amber-300 text-sm block mb-1">Clanes Participantes</span>
              <span className="text-white text-2xl font-bold">
                {new Set(summaries.map(s => s.teamId)).size}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de Resultados */}
        <div className="bg-gradient-to-r from-stone-800/90 to-amber-900/90 backdrop-blur-sm p-6 rounded-xl shadow-xl border-2 border-yellow-600 max-w-7xl mx-auto">
          <h2 className="text-xl font-bold text-yellow-200 mb-4">Ranking de Evaluaciones</h2>
          
          {filteredSummaries.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-amber-200">No hay evaluaciones disponibles para mostrar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full">
                <thead>
                  <tr className="border-b border-yellow-600/30">
                    <th className="text-center py-3 px-4 text-amber-300">Ranking</th>
                    <th className="text-left py-3 px-4 text-amber-300">Nombre</th>
                    <th className="text-left py-3 px-4 text-amber-300">Clan</th>
                    <th className="text-center py-3 px-4 text-amber-300">Liderazgo</th>
                    <th className="text-center py-3 px-4 text-amber-300">Valores</th>
                    <th className="text-center py-3 px-4 text-amber-300">Comunicación</th>
                    <th className="text-center py-3 px-4 text-amber-300">Colaboración</th>
                    <th className="text-center py-3 px-4 text-amber-300">Organización</th>
                    <th className="text-center py-3 px-4 text-amber-300">Promedio</th>
                    <th className="text-center py-3 px-4 text-amber-300">Evaluaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummaries.map((summary, index) => (
                    <tr 
                      key={`${summary.teamId}-${summary.memberId}`} 
                      className={`border-b border-yellow-600/10 hover:bg-stone-700/30 ${
                        index === 0 ? 'bg-yellow-800/30' :
                        index === 1 ? 'bg-yellow-700/20' :
                        index === 2 ? 'bg-yellow-600/10' :
                        index % 2 === 0 ? 'bg-stone-700/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-yellow-600 text-white' :
                            index === 2 ? 'bg-yellow-700 text-white' :
                            'bg-stone-600 text-white'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white font-medium">{summary.memberName}</td>
                      <td className="py-3 px-4 text-white">{summary.teamName}</td>
                      {summary.averageScores.map((score, i) => (
                        <td key={i} className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <div 
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                score >= 4.5 ? 'bg-green-600 text-white' :
                                score >= 4 ? 'bg-green-700 text-white' :
                                score >= 3.5 ? 'bg-yellow-600 text-white' :
                                score >= 3 ? 'bg-yellow-700 text-white' :
                                score >= 2 ? 'bg-orange-600 text-white' : 
                                'bg-red-700 text-white'
                              }`}
                            >
                              {score}
                            </div>
                          </div>
                        </td>
                      ))}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              summary.overallAverage >= 4.5 ? 'bg-green-600 text-white' :
                              summary.overallAverage >= 4 ? 'bg-green-700 text-white' :
                              summary.overallAverage >= 3.5 ? 'bg-yellow-600 text-white' :
                              summary.overallAverage >= 3 ? 'bg-yellow-700 text-white' :
                              summary.overallAverage >= 2 ? 'bg-orange-600 text-white' : 
                              'bg-red-700 text-white'
                            }`}
                          >
                            {summary.overallAverage}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-white">{summary.totalEvaluations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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