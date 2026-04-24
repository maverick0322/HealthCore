class FoodNotFoundError(Exception):
    """Lanzada cuando un alimento no se encuentra en el catálogo."""
    pass

class ExternalServiceError(Exception):
    """Lanzada cuando falla la comunicación con la API externa."""
    pass