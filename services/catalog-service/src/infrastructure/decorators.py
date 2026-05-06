import time
import logging
from typing import Callable, Any, Type, Tuple
from functools import wraps

logger = logging.getLogger(__name__)

def with_exponential_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 10.0,
    catch_exceptions: Tuple[Type[Exception], ...] = (Exception,)
) -> Callable:
    """
    Retry mechanism using exponential backoff.
    
    Why: Prevents cascading failures and "thundering herd" problems when 
    upstream services (like FatSecret) experience temporary outages or rate limiting.
    By isolating this in a decorator, HTTP clients remain strictly focused on networking.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            retries = 0
            
            while retries <= max_retries:
                try:
                    return func(*args, **kwargs)
                
                except catch_exceptions as e:
                    if retries == max_retries:
                        logger.error(
                            f"Max retries ({max_retries}) exhausted for operation '{func.__name__}'. "
                            f"Final error: {str(e)}"
                        )
                        raise
                    
                    # Exponential calculation: 1s, 2s, 4s... capped at max_delay
                    delay = min(base_delay * (2 ** retries), max_delay)
                    
                    logger.warning(
                        f"Attempt {retries + 1} failed for '{func.__name__}' "
                        f"due to {type(e).__name__}. Retrying in {delay} seconds..."
                    )
                    
                    time.sleep(delay)
                    retries += 1

            return None 
            
        return wrapper
    return decorator