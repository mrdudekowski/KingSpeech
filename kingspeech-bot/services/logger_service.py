"""
Structured Logging Service for KingSpeech Bot
Provides structured logging with JSON format and context
"""

import structlog
import logging
import time
from typing import Dict, Any, Optional
from datetime import datetime

class StructuredLogger:
    """Structured logger with JSON output and context tracking"""
    
    def __init__(self, log_level: str = "INFO"):
        """
        Initialize structured logger
        
        Args:
            log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        """
        # Configure structlog
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.processors.UnicodeDecoder(),
                structlog.processors.JSONRenderer()
            ],
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )
        
        # Set log level
        logging.basicConfig(level=getattr(logging, log_level.upper()))
        
        self.logger = structlog.get_logger()
        self._context = {}
        
        self.logger.info("structured_logger_initialized", log_level=log_level)
    
    def set_context(self, **kwargs) -> None:
        """
        Set context for all subsequent log messages
        
        Args:
            **kwargs: Context key-value pairs
        """
        self._context.update(kwargs)
    
    def clear_context(self) -> None:
        """Clear all context"""
        self._context.clear()
    
    def log_user_action(self, user_id: int, action: str, **kwargs) -> None:
        """
        Log user action with context
        
        Args:
            user_id: Telegram user ID
            action: Action performed
            **kwargs: Additional context
        """
        log_data = {
            "user_id": user_id,
            "action": action,
            "timestamp": datetime.now().isoformat(),
            **self._context,
            **kwargs
        }
        self.logger.info("user_action", **log_data)
    
    def log_error(self, error: Exception, context: Dict[str, Any] = None) -> None:
        """
        Log error with context
        
        Args:
            error: Exception that occurred
            context: Additional context
        """
        log_data = {
            "error_type": type(error).__name__,
            "error_message": str(error),
            "timestamp": datetime.now().isoformat(),
            **self._context,
            **(context or {})
        }
        self.logger.error("application_error", **log_data)
    
    def log_performance(self, operation: str, duration: float, **kwargs) -> None:
        """
        Log performance metrics
        
        Args:
            operation: Operation name
            duration: Duration in seconds
            **kwargs: Additional metrics
        """
        log_data = {
            "operation": operation,
            "duration_seconds": duration,
            "timestamp": datetime.now().isoformat(),
            **self._context,
            **kwargs
        }
        self.logger.info("performance_metric", **log_data)
    
    def log_api_call(self, service: str, endpoint: str, duration: float, 
                    status_code: Optional[int] = None, **kwargs) -> None:
        """
        Log API call with metrics
        
        Args:
            service: Service name (e.g., 'telegram', 'google_sheets')
            endpoint: API endpoint
            duration: Duration in seconds
            status_code: HTTP status code
            **kwargs: Additional context
        """
        log_data = {
            "service": service,
            "endpoint": endpoint,
            "duration_seconds": duration,
            "status_code": status_code,
            "timestamp": datetime.now().isoformat(),
            **self._context,
            **kwargs
        }
        self.logger.info("api_call", **log_data)
    
    def log_dialog_event(self, user_id: int, dialog_name: str, event: str, 
                        step: Optional[str] = None, **kwargs) -> None:
        """
        Log dialog events
        
        Args:
            user_id: Telegram user ID
            dialog_name: Name of the dialog
            event: Event type (start, step, complete, error)
            step: Current step name
            **kwargs: Additional context
        """
        log_data = {
            "user_id": user_id,
            "dialog_name": dialog_name,
            "event": event,
            "step": step,
            "timestamp": datetime.now().isoformat(),
            **self._context,
            **kwargs
        }
        self.logger.info("dialog_event", **log_data)
    
    def log_security_event(self, event_type: str, user_id: Optional[int] = None, 
                          ip_address: Optional[str] = None, **kwargs) -> None:
        """
        Log security events
        
        Args:
            event_type: Type of security event
            user_id: Telegram user ID (if applicable)
            ip_address: IP address (if available)
            **kwargs: Additional context
        """
        log_data = {
            "event_type": event_type,
            "user_id": user_id,
            "ip_address": ip_address,
            "timestamp": datetime.now().isoformat(),
            **self._context,
            **kwargs
        }
        self.logger.warning("security_event", **log_data)
    
    def log_business_event(self, event_type: str, user_id: int, 
                          value: Optional[float] = None, **kwargs) -> None:
        """
        Log business events (conversions, registrations, etc.)
        
        Args:
            event_type: Type of business event
            user_id: Telegram user ID
            value: Monetary value (if applicable)
            **kwargs: Additional context
        """
        log_data = {
            "event_type": event_type,
            "user_id": user_id,
            "value": value,
            "timestamp": datetime.now().isoformat(),
            **self._context,
            **kwargs
        }
        self.logger.info("business_event", **log_data)


# Global logger instance
_logger_instance: Optional[StructuredLogger] = None

def get_logger() -> StructuredLogger:
    """Get global logger instance"""
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = StructuredLogger()
    return _logger_instance

def init_logger(log_level: str = "INFO") -> StructuredLogger:
    """Initialize global logger"""
    global _logger_instance
    _logger_instance = StructuredLogger(log_level)
    return _logger_instance
