import os
import jwt
import logging
import hashlib
from typing import Dict
from fastapi import Security, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

# Constants matching Java's JwtValidationFilter
SECRET_KEY = os.getenv("JWT_SECRET", "ThisIsAVerySecureSecretKeyForTestingTheFilter2026!")
ALGORITHM = "HS256"
ROLE_PREFIX = "ROLE_"
DEFAULT_ROLE = "USER"

# HTTPBearer automatically extracts the Authorization header and validates the "Bearer " prefix.
# If missing, it automatically rejects the request (mimicking SecurityConfig unauthenticated block).
token_bearer = HTTPBearer()

def get_current_user_data(credentials: HTTPAuthorizationCredentials = Security(token_bearer)) -> Dict[str, str]:
    """
    Dependency to validate JWT and extract security context.
    Strictly mimics the authentication logic of JwtValidationFilter.java.
    """
    token = credentials.credentials
    
    try:
        # Verify signature and decode claims. 
        # PyJWT automatically validates expiration ('exp') if present.
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        user_id = payload.get("sub")
        role = payload.get("role")
        
        authority = f"{ROLE_PREFIX}{role}" if role and str(role).strip() else f"{ROLE_PREFIX}{DEFAULT_ROLE}"
        
        if not user_id:
            logger.error("Security alert: JWT missing subject claim.")
            raise HTTPException(status_code=401, detail="Invalid token: missing subject.")
            
        logger.debug(f"JWT successfully validated for userHash={_hash_log(user_id)}")
        
        return {
            "user_id": user_id, 
            "role": authority
        }
        
    except jwt.ExpiredSignatureError:
        logger.warning("Security warning: JWT token has expired for incoming request.")
        raise HTTPException(status_code=401, detail="Token has expired. Please log in again.")
        
    except jwt.InvalidSignatureError:
        logger.error("Security alert: Invalid JWT signature detected.")
        raise HTTPException(status_code=401, detail="Invalid or corrupted security token.")
        
    except jwt.DecodeError:
        logger.error("Security alert: Malformed JWT token detected.")
        raise HTTPException(status_code=401, detail="Invalid or corrupted security token.")
        
    except Exception as e:
        logger.error(f"Security error: Unexpected error validating token: {e}")
        raise HTTPException(status_code=500, detail="Internal authentication error.")

def _hash_log(value: str) -> str:
    """Anonymizes PII in logs to match Java's logHash method."""
    if not value or not value.strip():
        return "unknown"
    return hashlib.sha256(value.encode('utf-8')).hexdigest()[:8]