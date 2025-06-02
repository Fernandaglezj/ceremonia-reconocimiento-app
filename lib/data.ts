import type { Team } from "./types"

export const teams: Team[] = [
  {
    id: "team-1",
    name: "Jaguar",
    password: "jaguar2024",
    members: [
      { id: "m1", name: "Ana García", role: "Desarrolladora Senior" },
      { id: "m2", name: "Carlos López", role: "Product Manager" },
      { id: "m3", name: "María Rodríguez", role: "UX Designer" },
      { id: "m4", name: "José Martínez", role: "DevOps Engineer" },
      { id: "m5", name: "Laura Sánchez", role: "QA Tester" },
    ],
  },
  {
    id: "team-2",
    name: "Quetzal",
    password: "quetzal2024",
    members: [
      { id: "m6", name: "Roberto Silva", role: "Tech Lead" },
      { id: "m7", name: "Carmen Vega", role: "Frontend Developer" },
      { id: "m8", name: "Diego Morales", role: "Backend Developer" },
      { id: "m9", name: "Sofía Herrera", role: "Scrum Master" },
      { id: "m10", name: "Andrés Castillo", role: "Data Analyst" },
    ],
  },
  {
    id: "team-3",
    name: "Serpiente",
    password: "serpiente2024",
    members: [
      { id: "m11", name: "Patricia Ruiz", role: "Project Manager" },
      { id: "m12", name: "Fernando Torres", role: "Full Stack Developer" },
      { id: "m13", name: "Gabriela Mendoza", role: "UI Designer" },
      { id: "m14", name: "Ricardo Flores", role: "Security Engineer" },
      { id: "m15", name: "Valeria Cruz", role: "Business Analyst" },
    ],
  },
  // Puedes agregar más equipos aquí...
  {
    id: "team-4",
    name: "Águila",
    password: "aguila2024",
    members: [
      { id: "m16", name: "Miguel Ángel Pérez", role: "Arquitecto de Software" },
      { id: "m17", name: "Isabella Jiménez", role: "Mobile Developer" },
      { id: "m18", name: "Alejandro Ramírez", role: "Cloud Engineer" },
      { id: "m19", name: "Natalia Guerrero", role: "Product Owner" },
      { id: "m20", name: "Sebastián Vargas", role: "Machine Learning Engineer" },
    ],
  },
]
