export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  Link2: string;
  website: string;
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
  gpa?: string;
}

export interface Project {
  name: string;
  description: string;
  tech: string;
  link?: string;
}

export interface ResumeData {
  personal: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
}

export type Template = 'modern' | 'classic' | 'minimal' | 'creative';
