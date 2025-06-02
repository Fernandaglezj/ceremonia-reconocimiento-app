export interface TeamMember {
  id: string
  name: string
  role: string
}

export interface Team {
  id: string
  name: string
  password: string
  members: TeamMember[]
}

export interface EvaluationData {
  teamId: string
  evaluatorId: string
  evaluatorName: string
  evaluatedMemberId: string
  evaluatedMemberName: string
  answers: number[]
  timestamp: string
}
