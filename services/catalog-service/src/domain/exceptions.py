class CatalogDomainException(Exception):
    """Base exception for all domain-level errors in the Catalog service."""
    pass

class FoodNotFoundError(CatalogDomainException):
    """Raised when a specific requested food item does not exist in any catalog."""
    def __init__(self, identifier: str):
        # We log/format the identifier safely without exposing internal database structures
        super().__init__(f"Food item with identifier '{identifier}' could not be found.")

class ExternalServiceUnavailableError(CatalogDomainException):
    """Raised when upstream dependencies fail, preventing catalog retrieval."""
    def __init__(self, reason: str = "Upstream service timeout or rejection"):
        # We keep the message generic to prevent leaking external API details or IP addresses
        super().__init__(f"Catalog provider is currently unavailable: {reason}")

class InvalidDomainDataError(CatalogDomainException):
    """Raised when food data violates physical or business rules."""
    pass