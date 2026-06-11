from fastapi import APIRouter, HTTPException, status
from models import RegisterRequest, LoginRequest, TokenResponse
from security import hash_password, verify_password, create_token
from database import supabase

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest):
    existing = (
        supabase.table("users")
        .select("id")
        .eq("username", body.username)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken"
        )

    hashed = hash_password(body.password)
    result = (
        supabase.table("users")
        .insert({
            "username": body.username,
            "password": hashed,
            "avatar":   body.avatar,
        })
        .execute()
    )
    user = result.data[0]
    token = create_token({
        "sub":      user["id"],
        "username": user["username"],
        "is_admin": user.get("is_admin", False),
    })

    return TokenResponse(
        access_token=token,
        user_id=user["id"],
        username=user["username"],
        avatar=user["avatar"],
        is_admin=user.get("is_admin", False),
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    result = (
        supabase.table("users")
        .select("*")
        .eq("username", body.username)
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    user = result.data[0]
    if not verify_password(body.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    token = create_token({
        "sub":      user["id"],
        "username": user["username"],
        "is_admin": user.get("is_admin", False),
    })

    return TokenResponse(
        access_token=token,
        user_id=user["id"],
        username=user["username"],
        avatar=user["avatar"],
        is_admin=user.get("is_admin", False),
    )