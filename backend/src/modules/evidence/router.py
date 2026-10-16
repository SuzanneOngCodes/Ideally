from fastapi import APIRouter, HTTPException, Request

from src.modules.evidence.schemas import AcademicSearchRequest, WebSearchRequest
from src.modules.evidence.service import EvidenceSearchService, EvidenceUnavailable

router = APIRouter(prefix="/evidence", tags=["evidence"])


def service(request: Request) -> EvidenceSearchService:
    return request.app.state.evidence


@router.post("/web")
async def search_web(payload: WebSearchRequest, request: Request):
    try:
        return await service(request).web(payload.query)
    except EvidenceUnavailable as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/academic")
async def search_academic(payload: AcademicSearchRequest, request: Request):
    try:
        return await service(request).academic(payload.query, payload.source, payload.limit)
    except EvidenceUnavailable as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
