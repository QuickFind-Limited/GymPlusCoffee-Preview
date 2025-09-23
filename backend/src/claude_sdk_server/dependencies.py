from fastapi import HTTPException, Request, status
from supabase import create_client, Client
from functools import lru_cache
import os

@lru_cache()
def get_supabase_client() -> Client:
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_ANON_KEY')
    if not url or not key:
        raise RuntimeError('SUPABASE_URL and SUPABASE_ANON_KEY must be set')
    return create_client(url, key)

def _verify_token(token: str) -> dict:
    supabase = get_supabase_client()
    response = supabase.auth.get_user(token)
    user = getattr(response, 'user', None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired token',
        )
    return user  # type: ignore[return-value]


async def require_auth(request: Request) -> dict:
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing Authorization header')

    token = auth_header.split(' ', 1)[1]
    return _verify_token(token)


def require_auth_for_websocket(headers: dict) -> dict:
    auth_header = headers.get('authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing Authorization header')
    token = auth_header.split(' ', 1)[1]
    return _verify_token(token)
