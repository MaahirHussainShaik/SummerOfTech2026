// lib/mock.ts

// ---------- Types ----------
export type User = {
  id: string;
  role: 'student' | 'employer' | 'organiser';
  name: string;
  skills: string[];
  headline?: string;
};

export type Job = {
  id: string;
  employerId: string;
  employerName: string;
  title: string;
  jd: string;
  skills: string[];
};

// Keep Onejob if you want a separate “One NZ” catalog in EmployerPage
export type Onejob = {
  id: string;
  employerId: string;
  employerName: string;
  title: string;
  jd: string;
  skills: string[];
};

export type FAQ = {
  id: string;
  employerId: string;
  question: string;
  answer?: string;
};

export type Event = {
  id: string;
  name: string;
  datetime: string;
  venue: string;
  capacity: number;
};

// ---------- Seed data ----------
export const students: User[] = [
  { id: 's1', role: 'student', name: 'Aarav Kumar', skills: ['react','node','sql','python'], headline: 'Full-stack with React/Node' },
  { id: 's2', role: 'student', name: 'Sofia Li', skills: ['python','pandas','ml','cloud'], headline: 'Data + ML fundamentals' },
  { id: 's3', role: 'student', name: 'Maahir Shaik', skills: ['typescript','nextjs','cv','ai','sql'], headline: 'FE/AI projects' }
];

export const employers: User[] = [
  { id: 'e1', role: 'employer', name: 'Orion Health', skills: [] },
  { id: 'e2', role: 'employer', name: 'McCrae Tech', skills: [] },
  { id: 'e3', role: 'employer', name: 'STQRY', skills: [] }
];

export const jobs: Job[] = [
  { id: 'j1', employerId: 'e1', employerName: 'Orion Health', title: 'Graduate Software Engineer', jd: 'Java/Kotlin microservices, healthcare data, cloud.', skills: ['java','kotlin','cloud','microservices'] },
  { id: 'j2', employerId: 'e2', employerName: 'McCrae Tech', title: 'Technical Writer (Graduate)', jd: 'Docs, API references, healthcare AI.', skills: ['writing','api','markdown','ai'] },
  { id: 'j3', employerId: 'e3', employerName: 'STQRY', title: 'Software Engineer Intern', jd: 'Indoor navigation, kiosk app, mapping/UI.', skills: ['typescript','react','maps','algorithms'] }
];

// Separate One NZ catalog used on Employer page
export const onejobs: Onejob[] = [
  { id: 'j4', employerId: 'e4', employerName: 'One NZ', title: 'AI Product Engineer', jd: 'Design and develop AI-driven products, focusing on user experience and business value.', skills: ['product management', 'ui/ux', 'machine learning', 'api design'] },
  { id: 'j5', employerId: 'e5', employerName: 'One NZ', title: 'Generative AI Engineer', jd: 'Develop and fine-tune large language models and other generative models for creative applications.', skills: ['generative models', 'nlp', 'pytorch', 'tensorflow', 'python'] },
  { id: 'j6', employerId: 'e6', employerName: 'One NZ', title: 'Data Scientist', jd: 'Analyze complex datasets, build predictive models, and provide data-driven insights.', skills: ['data analysis', 'statistical modeling', 'python', 'r', 'sql'] },
  { id: 'j7', employerId: 'e7', employerName: 'One NZ', title: 'Data Analyst', jd: 'Collect, clean, and interpret data to identify trends and create business reports.', skills: ['sql', 'excel', 'tableau', 'data visualization', 'reporting'] }
];

export const events: Event[] = [
  { id: 'ev1', name: 'Meet & Greet (Auckland)', datetime: '2025-10-14T17:30:00', venue: 'Spark Arena', capacity: 400 },
  { id: 'ev2', name: 'Online Clinic: CV & Portfolio', datetime: '2025-10-10T18:00:00', venue: 'Zoom', capacity: 300 }
];

export const faqs: FAQ[] = [
  { id: 'f1', employerId: 'e1', question: 'Do you sponsor visas for interns?' },
  { id: 'f2', employerId: 'e2', question: 'What tech stack will I write docs for?' },
  { id: 'f3', employerId: 'e3', question: 'Is the internship hybrid or onsite?' }
];

// ---------- Removed (no longer used) ----------
// - matchScore
// - topJobsForStudent
// - meetAndGreetPlan
// - shortlistForJob
