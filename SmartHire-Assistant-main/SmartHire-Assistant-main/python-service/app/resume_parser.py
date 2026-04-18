import re
import fitz  # PyMuPDF
import spacy
from typing import Optional

try:
    nlp = spacy.load("en_core_web_sm")
    SPACY_AVAILABLE = True
except OSError:
    SPACY_AVAILABLE = False

# Comprehensive tech skills list for matching
TECH_SKILLS = [
    "java", "java 8", "java 11", "java 17", "core java", "spring", "spring boot",
    "spring mvc", "spring security", "spring cloud", "hibernate", "jpa", "jdbc",
    "microservices", "rest", "restful", "rest api", "soap", "graphql",
    "sql", "nosql", "mysql", "postgresql", "oracle", "mongodb", "redis",
    "cassandra", "elasticsearch", "h2",
    "aws", "azure", "gcp", "google cloud", "ec2", "s3", "lambda",
    "docker", "kubernetes", "k8s", "helm", "terraform", "ansible",
    "kafka", "rabbitmq", "activemq", "message queue",
    "ci/cd", "jenkins", "gitlab ci", "github actions", "maven", "gradle",
    "git", "svn", "bitbucket",
    "design patterns", "solid", "ddd", "domain driven design", "tdd", "bdd",
    "junit", "mockito", "testng", "selenium",
    "oauth2", "jwt", "security", "ssl", "tls",
    "react", "angular", "vue", "javascript", "typescript", "html", "css",
    "python", "node.js", "nodejs", "go", "scala", "kotlin", "c++", "c#",
    "data structures", "algorithms", "object oriented", "oop",
    "agile", "scrum", "kanban", "jira", "confluence",
    "linux", "unix", "bash", "shell scripting",
    "api gateway", "load balancer", "nginx", "apache",
    "machine learning", "ml", "ai", "deep learning",
    "devops", "sre", "monitoring", "logging", "observability",
]

EDUCATION_KEYWORDS = [
    "b.tech", "btech", "b.e", "be ", "bachelor", "b.sc", "bsc",
    "m.tech", "mtech", "m.e", "me ", "master", "m.sc", "msc", "mba",
    "ph.d", "phd", "doctorate",
    "computer science", "information technology", "software engineering",
    "electronics", "electrical", "mechanical",
]


def parse_resume(file_bytes: bytes, filename: Optional[str] = None) -> dict:
    text = extract_text(file_bytes)
    text_lower = text.lower()

    skills = extract_skills(text_lower)
    experience = extract_experience_years(text)
    education = extract_education(text_lower)
    name = extract_name(text)

    return {
        "skills": skills,
        "experience_years": experience,
        "education": education,
        "name": name,
        "raw_text": text[:3000],  # cap raw text to 3k chars
        "skills_count": len(skills),
    }


def extract_text(file_bytes: bytes) -> str:
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages = [page.get_text() for page in doc]
        doc.close()
        return "\n".join(pages)
    except Exception as e:
        return ""


def extract_skills(text_lower: str) -> list[str]:
    found = []
    for skill in TECH_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill)
    return list(dict.fromkeys(found))  # deduplicate, preserve order


def extract_experience_years(text: str) -> float:
    patterns = [
        r'(\d+)\+?\s*years?\s+of\s+(?:total\s+)?(?:work\s+)?experience',
        r'(\d+)\+?\s*years?\s+(?:professional\s+)?experience',
        r'experience[:\s]+(\d+)\+?\s*years?',
        r'(\d+)\+?\s*yrs?\s+(?:of\s+)?experience',
        r'total\s+(?:work\s+)?experience[:\s]+(\d+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return float(match.group(1))

    # Try to infer from year ranges (e.g. 2018 - 2024)
    year_ranges = re.findall(r'(20\d{2})\s*[-–]\s*(20\d{2}|present|current)', text, re.IGNORECASE)
    if year_ranges:
        import datetime
        current_year = datetime.datetime.now().year
        total = 0
        for start, end in year_ranges:
            end_year = current_year if end.lower() in ('present', 'current') else int(end)
            total += max(0, end_year - int(start))
        if total > 0:
            return min(float(total), 30.0)

    return 0.0


def extract_education(text_lower: str) -> str:
    for keyword in EDUCATION_KEYWORDS:
        if keyword in text_lower:
            if any(k in text_lower for k in ["ph.d", "phd", "doctorate"]):
                return "PhD"
            if any(k in text_lower for k in ["m.tech", "mtech", "m.e", "master", "m.sc", "msc", "mba"]):
                return "Masters"
            return "Bachelors"
    return "Not specified"


def extract_name(text: str) -> str:
    if SPACY_AVAILABLE:
        doc = nlp(text[:500])
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                return ent.text
    # Fallback: first non-empty line is often the name
    for line in text.split("\n"):
        line = line.strip()
        if line and len(line.split()) <= 4 and line[0].isupper():
            return line
    return "Unknown"
