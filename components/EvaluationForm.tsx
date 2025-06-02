"use client"

import type React from "react"

import { useState } from "react"
import type { Team, TeamMember, EvaluationData } from "@/lib/types"
import { supabase } from "@/lib/supabase"

interface EvaluationFormProps {
  member: TeamMember
  team: Team
  evaluator: TeamMember
  onComplete: () => void
  onCancel: () => void
}

const questions = [
  "¿Demuestra habilidades para liderar y guiar al equipo cuando se necesita?",
  "¿Vive los valores y la cultura de Arkus?",
  "¿Se comunica con los demás de forma clara y demuestra empatía al interactuar?",
  "¿Contribuye de forma colaborativa y es resolutivo ante los retos?",
  "¿Se organiza para cumplir con sus responsabilidades y apoyar al equipo cuando se necesita?",
]

export default function EvaluationForm({ member, team, evaluator, onComplete, onCancel }: EvaluationFormProps) {
  const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(0))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleAnswerChange = (questionIndex: number, value: number) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = value
    setAnswers(newAnswers)
  }

  const isFormComplete = answers.every((answer) => answer > 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormComplete) return

    setIsSubmitting(true)
    setError("")

    // 1. Insertar en evaluations
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .insert([{
        team_id: team.id,
        evaluator_id: evaluator.id,
        evaluated_id: member.id,
        completed: true
      }])
      .select()
      .single();

    if (evalError || !evaluation) {
      setError('No se pudo guardar la evaluación.');
      setIsSubmitting(false);
      return;
    }

    // 2. Insertar respuestas en evaluation_answers
    const answersToInsert = answers.map((score, idx) => ({
      evaluation_id: evaluation.id,
      question_number: idx + 1,
      score
    }));

    const { error: answersError } = await supabase
      .from('evaluation_answers')
      .insert(answersToInsert);

    if (answersError) {
      setError('No se pudieron guardar las respuestas.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false)
    setShowSuccess(true)

    setTimeout(() => {
      onComplete()
    }, 2000)
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen maya-background flex items-center justify-center p-4">
        <div className="relative z-10 bg-gradient-to-br from-green-800/90 to-green-900/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border-2 border-green-600 text-center max-w-md">
          <div className="text-6xl mb-4">✨</div>
          <h2 className="text-2xl font-bold text-green-200 mb-4">¡Evaluación Completada!</h2>
          <p className="text-green-300">
            Tu sabiduría sobre <strong>{member.name}</strong> ha sido registrada en los códices sagrados.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen maya-background flex items-center justify-center p-4">
      {/* Modal de evaluación */}
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-amber-800/95 to-orange-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-yellow-600 overflow-hidden">
          {/* Header del modal */}
          <div className="bg-gradient-to-r from-amber-700 to-orange-700 px-6 py-4 border-b border-yellow-600/50">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">Evaluación de {member.name}</h1>
              <button onClick={onCancel} className="text-white hover:text-yellow-300 transition-colors p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido del modal */}
          <div className="p-6">
            {/* Instrucciones */}
            <div className="mb-8">
              <p className="text-amber-100 text-lg leading-relaxed">
                Por favor, evalúa a <strong className="text-yellow-300">{member.name}</strong> en las siguientes áreas
                usando una escala del 1 al 5, donde 1 es "Necesita mejorar" y 5 es "Excelente".
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {questions.map((question, index) => (
                <div key={index} className="border-b border-yellow-600/30 pb-6 last:border-b-0">
                  <h3 className="text-white font-medium mb-4 text-lg leading-relaxed">{question}</h3>

                  <div className="flex items-center justify-between">
                    {/* Iconos de fuego para evaluación */}
                    <div className="flex items-center space-x-3">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleAnswerChange(index, value)}
                          className={`fire-rating-btn transition-all duration-300 hover:scale-110 ${
                            answers[index] >= value ? "fire-selected" : "fire-unselected"
                          }`}
                        >
                          🔥
                        </button>
                      ))}
                    </div>

                    {/* Indicador de puntuación */}
                    <div className="text-yellow-300 font-bold text-lg">
                      {answers[index] > 0 ? `${answers[index]}/5` : ""}
                    </div>
                  </div>
                </div>
              ))}

              {/* Botón de guardar */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={!isFormComplete || isSubmitting}
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:from-stone-600 disabled:to-stone-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg border-2 border-orange-500 disabled:border-stone-600 text-lg"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Guardando evaluación...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002 2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      Guardar evaluación
                    </span>
                  )}
                </button>

                {!isFormComplete && (
                  <p className="text-amber-300 text-sm text-center mt-3">
                    Completa todas las preguntas para continuar con el ritual
                  </p>
                )}
                {error && (
                  <p className="text-red-400 text-sm text-center mt-3">
                    {error}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
