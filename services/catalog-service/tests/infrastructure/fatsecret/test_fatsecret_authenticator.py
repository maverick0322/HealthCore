import pytest
import requests
from unittest.mock import patch, MagicMock
from src.infrastructure.fatsecret.fatsecret_authenticator import FatSecretAuthenticator
from src.domain.exceptions import ProviderAuthenticationError

# --- Fixtures ---

@pytest.fixture
def authenticator():
    """Returns a fresh instance of the authenticator for each test."""
    return FatSecretAuthenticator(
        client_id="test_client_id",
        client_secret="test_client_secret",
        token_url="https://fake-oauth.fatsecret.com/token"
    )

@pytest.fixture
def mock_response_success():
    """Simulates a successful 200 OK response with a valid token."""
    mock_resp = MagicMock()
    mock_resp.raise_for_status.return_value = None
    mock_resp.json.return_value = {"access_token": "valid_mock_token_123", "expires_in": 3600}
    return mock_resp

@pytest.fixture
def mock_response_empty_token():
    """Simulates a 200 OK response but the token is missing from the payload."""
    mock_resp = MagicMock()
    mock_resp.raise_for_status.return_value = None
    mock_resp.json.return_value = {"error": "invalid_client"}
    return mock_resp


# ==========================================
# TESTS FOR: get_auth_headers
# ==========================================

def test_get_auth_headers_with_existing_token_does_not_refresh(authenticator):
    # Arrange
    authenticator._access_token = "existing_cached_token"
    
    # Act
    # We use a patch to ensure refresh_token is NEVER called if a token already exists
    with patch.object(authenticator, 'refresh_token') as mock_refresh:
        headers = authenticator.get_auth_headers()
        
        # Assert
        assert headers == {"Authorization": "Bearer existing_cached_token"}
        mock_refresh.assert_not_called()

@patch("src.infrastructure.fatsecret.fatsecret_authenticator.requests.post")
def test_get_auth_headers_without_token_triggers_refresh(mock_post, authenticator, mock_response_success):
    # Arrange
    mock_post.return_value = mock_response_success
    assert authenticator._access_token is None
    
    # Act
    headers = authenticator.get_auth_headers()
    
    # Assert
    assert headers == {"Authorization": "Bearer valid_mock_token_123"}
    mock_post.assert_called_once()


# ==========================================
# TESTS FOR: refresh_token
# ==========================================

@patch("src.infrastructure.fatsecret.fatsecret_authenticator.requests.post")
def test_refresh_token_success_updates_access_token(mock_post, authenticator, mock_response_success):
    # Arrange
    mock_post.return_value = mock_response_success
    
    # Act
    authenticator.refresh_token()
    
    # Assert
    assert authenticator._access_token == "valid_mock_token_123"
    
    # Verify the external call was made correctly
    args, kwargs = mock_post.call_args
    assert args[0] == "https://fake-oauth.fatsecret.com/token"
    assert kwargs["data"] == {"grant_type": "client_credentials", "scope": "basic"}
    assert "auth" in kwargs

@patch("src.infrastructure.fatsecret.fatsecret_authenticator.requests.post")
def test_refresh_token_empty_payload_raises_authentication_error(mock_post, authenticator, mock_response_empty_token):
    # Arrange
    mock_post.return_value = mock_response_empty_token
    
    # Act & Assert
    with pytest.raises(ProviderAuthenticationError) as exc_info:
        authenticator.refresh_token()
        
    assert "empty token" in exc_info.value.internal_reason

@patch("src.infrastructure.fatsecret.fatsecret_authenticator.requests.post")
def test_refresh_token_http_error_raises_authentication_error(mock_post, authenticator):
    # Arrange
    # Simulating a 401 Unauthorized from the provider
    mock_post.side_effect = requests.exceptions.HTTPError("401 Client Error: Unauthorized")
    
    # Act & Assert
    with pytest.raises(ProviderAuthenticationError) as exc_info:
        authenticator.refresh_token()
        
    assert "FatSecret" in exc_info.value.internal_reason

@patch("src.infrastructure.fatsecret.fatsecret_authenticator.requests.post")
def test_refresh_token_json_decode_error_raises_authentication_error(mock_post, authenticator):
    # Arrange
    mock_resp = MagicMock()
    mock_resp.raise_for_status.return_value = None
    mock_resp.json.side_effect = ValueError("Expecting value: line 1 column 1 (char 0)")
    mock_post.return_value = mock_resp
    
    # Act & Assert
    with pytest.raises(ProviderAuthenticationError):
        authenticator.refresh_token()