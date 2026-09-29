from fastapi import APIRouter


router = APIRouter(tags=["health"])


@router.get("/")
def hello_world() -> dict[str, str]:
    return {"message": "Hello, World!"}
