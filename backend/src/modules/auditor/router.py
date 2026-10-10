from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from src.modules.auditor.schemas import AuditRequestPayload

router = APIRouter()

# --- Route Endpoint Definition Mapping ---

@router.post("/advisor/audit-citations")
async def handle_citation_audit(request: Request, payload: AuditRequestPayload):
    """
    FastAPI Router Endpoint handler matching '/api/v1/advisor/audit-citations'
    Extracts the globally registered service out of lifespan state execution matrices.
    """
    # Fetch your module service mapped inside main.py
    auditor_service = request.app.state.auditor
    
    # Safely convert incoming inputs into primitives for the backend pipeline execution
    brief_data = payload.brief.model_dump(mode="json") if payload.brief else None
    
    try:
        # Trigger the execution mapping pipeline matrix
        result = await auditor_service.audit_text(
            text=payload.text,
            brief=brief_data,
            domain=payload.domain
        )
        return result
        
    except ValueError as val_err:
        # Catch validation failures (e.g. empty targetText configuration parameters)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=str(val_err)
        )
    except Exception as general_err:
        # Safety fallback layer wrapper protecting structural runtime threads
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forensic Citation Engine execution error: {str(general_err)}"
        )
