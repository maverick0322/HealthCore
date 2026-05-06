import logging
import requests
from typing import List, Optional
from src.domain.entities import FoodItem
from src.domain.ports import ExternalCatalogPort
from src.domain.exceptions import (
    ExternalServiceUnavailableError, 
    ProviderAuthenticationError, 
    ProviderRateLimitError,
    InvalidDomainDataError
)
from src.infrastructure.decorators import with_exponential_backoff
from src.infrastructure.fatsecret.fatsecret_authenticator import FatSecretAuthenticator
from src.infrastructure.fatsecret.fatsecret_mapper import FatSecretMapper

logger = logging.getLogger(__name__)

class FatSecretAdapter(ExternalCatalogPort):
    """
    Driven Adapter for the FatSecret REST API.
    Orchestrates the HTTP calls using the injected Authenticator and Mapper.
    """
    MALFORMED_JSON_ERROR = "Provider returned malformed JSON."
    
    def __init__(self, api_url: str, authenticator: FatSecretAuthenticator, mapper: FatSecretMapper):
        self._api_url = api_url
        self._authenticator = authenticator
        self._mapper = mapper
        self.PROVIDER_NAME = "FatSecret"

    @with_exponential_backoff(
        max_retries=3, base_delay=1.0, 
        catch_exceptions=(requests.exceptions.ConnectionError, requests.exceptions.Timeout, ExternalServiceUnavailableError)
    )
    def get_product_by_barcode(self, barcode: str) -> Optional[FoodItem]:
        params = {"method": "food.find.id.for.barcode", "barcode": barcode, "format": "json"}
        response = self._execute_request(params)

        logger.warning(f"FATSECRET RAW RESPONSE (BARCODE): {response.text}")
        
        try:
            data = response.json()
        except requests.exceptions.JSONDecodeError:
            raise ExternalServiceUnavailableError(self.MALFORMED_JSON_ERROR)
            
        if "error" in data:
            error_code = str(data["error"].get("code", ""))
            error_msg = data["error"].get("message", "Unknown FatSecret API Error")
            
            if error_code == "3":
                logger.warning(f"Barcode {barcode} not found in FatSecret.")
                return None
                
            logger.error(f"FatSecret API returned an error payload: {error_msg}")
            raise ExternalServiceUnavailableError(f"Upstream catalog error: {error_msg}")
            
        if "food_id" not in data:
            return None
            
        food_id = str(data["food_id"].get("value", ""))
        return self._fetch_food_details(food_id, barcode) if food_id else None

    @with_exponential_backoff(
        max_retries=3, base_delay=1.0, 
        catch_exceptions=(requests.exceptions.ConnectionError, requests.exceptions.Timeout, ExternalServiceUnavailableError)
    )
    def search_products_by_name(self, query: str) -> List[FoodItem]:
        params = {"method": "foods.search", "search_expression": query, "format": "json", "max_results": 5}
        response = self._execute_request(params)
        
        try:
            data = response.json()
        except requests.exceptions.JSONDecodeError:
            raise ExternalServiceUnavailableError(self.MALFORMED_JSON_ERROR)
            
        foods_data = data.get("foods", {}).get("food", [])
        if isinstance(foods_data, dict):
            foods_data = [foods_data]
            
        return [
            mapped for item in foods_data 
            if (mapped := self._mapper.map_to_domain(item)) is not None
        ]


    def _fetch_food_details(self, food_id: str, barcode: str) -> Optional[FoodItem]:
        params = {"method": "food.get.v2", "food_id": food_id, "format": "json"}
        response = self._execute_request(params)
        
        try:
            return self._mapper.map_to_domain(response.json().get("food", {}), barcode)
        except requests.exceptions.JSONDecodeError:
            raise ExternalServiceUnavailableError(self.MALFORMED_JSON_ERROR)

    def _execute_request(self, params: dict) -> requests.Response:
        """Centralizes the HTTP call, header injection, and basic error handling."""
        logger.debug(f"Executing FatSecret request: {params.get('method')}")
        
        headers = self._authenticator.get_auth_headers()
        response = requests.get(self._api_url, params=params, headers=headers, timeout=5.0)
        
        status = response.status_code
        if status == 401 or status == 403:
            self._authenticator.refresh_token()
            raise ProviderAuthenticationError(self.PROVIDER_NAME)
        elif status == 400:
            raise InvalidDomainDataError(f"{self.PROVIDER_NAME} rejected the payload.")
        elif status == 429:
            raise ProviderRateLimitError(self.PROVIDER_NAME)
        elif status >= 500:
            raise ExternalServiceUnavailableError(f"HTTP {status} from {self.PROVIDER_NAME}")
            
        response.raise_for_status()
        return response