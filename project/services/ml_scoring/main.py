from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from services.ml_scoring.scorer import score_transaction

app = FastAPI(title="ML Scoring Service")


class ScoringRequest(BaseModel):
    transaction_id: str
    model_name: str = "xgboost"
    features: dict


class ScoringResponse(BaseModel):
    transaction_id: str
    risk_score: float
    model_used: str
    shap_explanation: list[str]


@app.post("/score", response_model=ScoringResponse)
def score(request: ScoringRequest):
    if request.model_name not in ("xgboost", "mlp"):
        raise HTTPException(status_code=400, detail="model_name must be 'xgboost' or 'mlp'")
    result = score_transaction(request.features, request.model_name)
    return ScoringResponse(
        transaction_id=request.transaction_id,
        risk_score=result["risk_score"],
        model_used=result["model_used"],
        shap_explanation=result["shap_explanation"],
    )


@app.get("/health")
def health():
    return {"status": "ok"}
