from typing import List

# Skill synonyms — maps canonical name to all its aliases
SKILL_SYNONYMS: dict[str, list[str]] = {
    "java": ["core java", "java se", "java ee", "java 8", "java 11", "java 17"],
    "spring boot": ["springboot", "spring-boot"],
    "spring": ["spring framework", "spring mvc"],
    "rest api": ["rest", "restful", "restful api", "restful apis", "rest apis"],
    "postgresql": ["postgres", "psql"],
    "kubernetes": ["k8s"],
    "javascript": ["js"],
    "typescript": ["ts"],
    "object-oriented programming": ["oop", "object oriented", "oops"],
    "continuous integration": ["ci/cd", "ci", "cd"],
    "aws": ["amazon web services"],
    "gcp": ["google cloud", "google cloud platform"],
    "azure": ["microsoft azure"],
    "nosql": ["no-sql", "no sql"],
    "hibernate": ["jpa", "hibernate/jpa"],
    "kafka": ["apache kafka"],
    "rabbitmq": ["rabbit mq"],
}


def normalize(skill: str) -> str:
    return skill.lower().strip()


def canonical(skill: str) -> str:
    s = normalize(skill)
    for canon, aliases in SKILL_SYNONYMS.items():
        if s == canon or s in aliases:
            return canon
    return s


def calculate_match(
    jd_skills: List[str],
    candidate_skills: List[str],
    jd_exp_min: int,
    jd_exp_max: int,
    candidate_exp: float,
) -> dict:
    if not jd_skills:
        return _empty_result()

    jd_canonical = [canonical(s) for s in jd_skills]
    candidate_canonical = set(canonical(s) for s in candidate_skills)

    matched = [s for s in jd_canonical if s in candidate_canonical]
    missing = [s for s in jd_canonical if s not in candidate_canonical]

    # Skills score (50%)
    skills_score = (len(matched) / len(jd_canonical)) * 50 if jd_canonical else 0

    # Experience score (30%)
    if candidate_exp >= jd_exp_min:
        exp_score = 30.0
    elif jd_exp_min > 0:
        ratio = candidate_exp / jd_exp_min
        exp_score = ratio * 30.0
    else:
        exp_score = 30.0

    # Education score (20%) — default full marks (no education parsing complexity)
    edu_score = 20.0

    total = min(round(skills_score + exp_score + edu_score, 1), 100.0)

    explanation = (
        f"Matched {len(matched)} of {len(jd_canonical)} required skills. "
        f"{candidate_exp:.1f} years experience vs {jd_exp_min}+ required. "
        f"Overall match: {total}%."
    )

    return {
        "match_percentage": total,
        "skills_score": round(skills_score, 1),
        "experience_score": round(exp_score, 1),
        "education_score": edu_score,
        "matched_skills": matched,
        "missing_skills": missing,
        "explanation": explanation,
    }


def _empty_result() -> dict:
    return {
        "match_percentage": 0.0,
        "skills_score": 0.0,
        "experience_score": 0.0,
        "education_score": 0.0,
        "matched_skills": [],
        "missing_skills": [],
        "explanation": "No JD skills provided for matching.",
    }
