"""
Base Dialog Class for KingSpeech Bot
Common functionality for all dialog branches
"""

import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List, Callable
from cursor import Context, Step
from services.dialog_manager import DialogBranch, dialog_manager

logger = logging.getLogger(__name__)

class BaseDialog(ABC):
    """Base class for all dialog branches"""
    
    def __init__(self, name: str, description: str, tags: List[str] = None, priority: int = 0):
        self.name = name
        self.description = description
        self.tags = tags or []
        self.priority = priority
        self.enabled = True
        
        # Register this dialog branch
        self._register_branch()
    
    def _register_branch(self) -> None:
        """Register this dialog branch with the dialog manager"""
        branch = DialogBranch(
            name=self.name,
            entry_point=self.entry_point,
            description=self.description,
            tags=self.tags,
            enabled=self.enabled,
            priority=self.priority
        )
        dialog_manager.register_branch(branch)
    
    @abstractmethod
    def entry_point(self, context: Context) -> Step:
        """Entry point for this dialog branch"""
        pass
    
    def get_user_data(self, context: Context, key: str, default: Any = None) -> Any:
        """Get user data from context with fallback"""
        return context.get_variable(key, default)
    
    def set_user_data(self, context: Context, key: str, value: Any) -> None:
        """Set user data in context"""
        context.set_variable(key, value)
    
    def get_user_message(self, context: Context) -> str:
        """Get user message from context"""
        return context.get_user_message() or ""
    
    def create_step(self, message: str, next_step: Optional[Callable] = None, 
                   options: Optional[List[str]] = None, reply_markup: Any = None) -> Step:
        """Create a Step object with common validation"""
        return Step(
            message=message,
            next_step=next_step,
            options=options,
            reply_markup=reply_markup
        )
    
    def validate_input(self, context: Context, required_fields: List[str]) -> bool:
        """Validate that required fields are present in context"""
        for field in required_fields:
            if not self.get_user_data(context, field):
                logger.warning(f"Missing required field: {field}")
                return False
        return True
    
    def log_interaction(self, user_id: str, action: str, data: Dict[str, Any] = None) -> None:
        """Log user interaction for analytics"""
        log_data = {
            "user_id": user_id,
            "dialog": self.name,
            "action": action,
            "data": data or {}
        }
        logger.info(f"User interaction: {log_data}")
    
    def handle_error(self, context: Context, error: Exception, fallback_message: str) -> Step:
        """Handle errors gracefully with fallback message"""
        logger.error(f"Error in dialog {self.name}: {error}", exc_info=True)
        return self.create_step(fallback_message, next_step=self.entry_point)
    
    def is_completed(self, context: Context) -> bool:
        """Check if this dialog branch is completed"""
        return bool(self.get_user_data(context, f"{self.name}_completed", False))
    
    def mark_completed(self, context: Context) -> None:
        """Mark this dialog branch as completed"""
        self.set_user_data(context, f"{self.name}_completed", True)
    
    def get_progress(self, context: Context) -> Dict[str, Any]:
        """Get progress information for this dialog"""
        return {
            "name": self.name,
            "completed": self.is_completed(context),
            "user_data": {
                key: value for key, value in context._variables.items()
                if key.startswith(f"{self.name}_")
            }
        }
