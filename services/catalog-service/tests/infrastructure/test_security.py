import pytest
from unittest.mock import patch
import jwt
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from src.infrastructure.security import get_current_user_data, _hash_log

def test_get_current_user_data_success():
    # Arrange
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid.mocked.jwt")
    mock_payload = {"sub": "user_123", "role": "ADMIN"}
    
    # Act
    with patch("jwt.decode", return_value=mock_payload):
        result = get_current_user_data(credentials)
        
        # Assert
        assert result["user_id"] == "user_123"
        assert result["role"] == "ROLE_ADMIN"


def test_get_current_user_data_default_role_fallback():
    # Arrange
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid.mocked.jwt")
    mock_payload = {"sub": "user_456", "role": "   "}  # Test whitespace defaulting
    
    # Act
    with patch("jwt.decode", return_value=mock_payload):
        result = get_current_user_data(credentials)
        
        # Assert
        assert result["role"] == "ROLE_USER"


def test_get_current_user_data_missing_subject_raises_401():
    # Arrange
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid.jwt.no.sub")
    mock_payload = {"role": "USER"}  # Missing "sub" claim
    
    # Act & Assert
    with patch("jwt.decode", return_value=mock_payload):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user_data(credentials)
        assert exc_info.value.status_code == 401


def test_get_current_user_data_expired_token_raises_401():
    # Arrange
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="expired.jwt")
    
    # Act & Assert
    with patch("jwt.decode", side_effect=jwt.ExpiredSignatureError):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user_data(credentials)
        assert exc_info.value.status_code == 401
        assert "expired" in exc_info.value.detail


def test_get_current_user_data_corrupted_signature_raises_401():
    # Arrange
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="bad.signature.jwt")
    
    # Act & Assert
    with patch("jwt.decode", side_effect=jwt.InvalidSignatureError):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user_data(credentials)
        assert exc_info.value.status_code == 401


def test_hash_log_utility():
    # Assert anonymization works predictably
    assert _hash_log("test@domain.com") != "unknown"
    assert len(_hash_log("test@domain.com")) == 8
    assert _hash_log("  ") == "unknown"
    assert _hash_log(None) == "unknown"