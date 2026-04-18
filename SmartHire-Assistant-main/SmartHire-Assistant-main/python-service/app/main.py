from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.resume_parser import parse_resume
from app.match_calculator import calculate_match

app = FastAPI(title="SmartHire Resume Parser", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "smarthire-python"}


@app.post("/parse-resume")
async def parse_resume_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    result = parse_resume(contents, file.filename)
    return result


@app.post("/calculate-match")
def calculate_match_endpoint(data: dict):
    return calculate_match(
        jd_skills=data.get("jdSkills", []),
        candidate_skills=data.get("candidateSkills", []),
        jd_exp_min=data.get("jdExperienceMin", 0),
        jd_exp_max=data.get("jdExperienceMax", 99),
        candidate_exp=data.get("candidateExperience", 0),
    )
