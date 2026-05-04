class CatalogDomainException(Exception):
    """Base exception for all domain-level errors in the Catalog service."""
    pass

class FoodNotFoundError(CatalogDomainException):
    """Raised when a specific requested food item does not exist in any catalog."""
    def __init__(self, identifier: str):
        # We log/format the identifier safely without exposing internal database structures
        super().__init__(f"Food item with identifier '{identifier}' could not be found.")

class InvalidDomainDataError(CatalogDomainException):
    """Raised when food data violates physical or business rules."""
    pass

class ExternalServiceUnavailableError(CatalogDomainException):
    """
    Base exception for upstream dependency failures.
    Enforces a user-friendly message for the client while preserving the real cause for logs.
    """
    def __init__(self, internal_reason: str = "Unknown error"):
        self.internal_reason = internal_reason
        super().__init__("El servicio no está disponible en este momento, inténtelo más tarde.")

class ProviderAuthenticationError(ExternalServiceUnavailableError):
    """Raised when OAuth 1.0a or API keys fail against the external catalog."""
    def __init__(self, provider: str):
        super().__init__(internal_reason=f"Authentication failed for external provider: {provider}")

class ProviderRateLimitError(ExternalServiceUnavailableError):
    """Raised when the external catalog blocks requests due to quota limits (HTTP 429)."""
    def __init__(self, provider: str):
        super().__init__(internal_reason=f"Rate limit exceeded for external provider: {provider}")