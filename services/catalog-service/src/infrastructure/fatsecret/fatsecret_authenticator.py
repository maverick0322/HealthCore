import logging
import requests
from typing import Dict, Optional
from src.domain.exceptions import ProviderAuthenticationError

logger = logging.getLogger(__name__)

class FatSecretAuthenticator:
    """
    Handles the OAuth 2.0 Client Credentials flow exclusively.
    Why: Isolates security and token lifecycle from business data retrieval.
    """
    def __init__(self, client_id: str, client_secret: str, token_url: str):
        self._client_id = client_id
        self._client_secret = client_secret
        self._token_url = token_url
        self._access_token: Optional[str] = None

    def get_auth_headers(self) -> Dict[str, str]:
        """Injects the token, fetching a new one lazy-loaded if needed."""
        if not self._access_token:
            self.refresh_token()
        return {"Authorization": f"Bearer {self._access_token}"}

    def refresh_token(self) -> None:
        """Forces a new token retrieval. Useful when a 401 Unauthorized is caught."""
        try:
            logger.debug("Requesting new OAuth 2.0 token from FatSecret.")
            auth = requests.auth.HTTPBasicAuth(self._client_id, self._client_secret)
            data = {"grant_type": "client_credentials", "scope": "basic"}
            
            response = requests.post(self._token_url, auth=auth, data=data, timeout=5.0)
            response.raise_for_status()
            
            self._access_token = response.json().get("access_token")
            if not self._access_token:
                raise ProviderAuthenticationError("FatSecret returned an empty token.")
                
        except (requests.exceptions.RequestException, ValueError, KeyError) as e:
            logger.critical(f"OAuth 2.0 authentication failed: {e}")
            raise ProviderAuthenticationError("FatSecret")