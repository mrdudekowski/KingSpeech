"""
Dialog Manager for KingSpeech Bot
Centralized dialog management system for easy extension
"""

import logging
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass
from cursor import Context, Step

logger = logging.getLogger(__name__)

@dataclass
class DialogBranch:
    """Represents a dialog branch with its entry point and metadata"""
    name: str
    entry_point: Callable
    description: str
    tags: List[str]
    enabled: bool = True
    priority: int = 0

class DialogManager:
    """Centralized dialog management system"""
    
    def __init__(self):
        self.branches: Dict[str, DialogBranch] = {}
        self.active_dialogs: Dict[str, str] = {}  # user_id -> branch_name
        self.dialog_history: Dict[str, List[str]] = {}  # user_id -> [branch_names]
        
    def register_branch(self, branch: DialogBranch) -> None:
        """Register a new dialog branch"""
        try:
            self.branches[branch.name] = branch
            logger.info(f"Registered dialog branch: {branch.name}")
        except Exception as e:
            logger.error(f"Failed to register branch {branch.name}: {e}")
    
    def get_branch(self, name: str) -> Optional[DialogBranch]:
        """Get a dialog branch by name"""
        return self.branches.get(name)
    
    def get_available_branches(self, user_id: str = None) -> List[DialogBranch]:
        """Get all available branches, optionally filtered by user"""
        available = [branch for branch in self.branches.values() if branch.enabled]
        # Sort by priority (higher priority first)
        available.sort(key=lambda x: x.priority, reverse=True)
        return available
    
    def start_branch(self, user_id: str, branch_name: str, context: Context) -> Optional[Step]:
        """Start a specific dialog branch for a user"""
        try:
            branch = self.get_branch(branch_name)
            if not branch or not branch.enabled:
                logger.warning(f"Branch {branch_name} not found or disabled")
                return None
            
            # Update active dialog
            self.active_dialogs[user_id] = branch_name
            
            # Add to history
            if user_id not in self.dialog_history:
                self.dialog_history[user_id] = []
            self.dialog_history[user_id].append(branch_name)
            
            logger.info(f"Started branch {branch_name} for user {user_id}")
            return branch.entry_point(context)
            
        except Exception as e:
            logger.error(f"Failed to start branch {branch_name} for user {user_id}: {e}")
            return None
    
    def get_active_branch(self, user_id: str) -> Optional[str]:
        """Get the currently active branch for a user"""
        return self.active_dialogs.get(user_id)
    
    def end_branch(self, user_id: str) -> None:
        """End the current dialog branch for a user"""
        if user_id in self.active_dialogs:
            branch_name = self.active_dialogs.pop(user_id)
            logger.info(f"Ended branch {branch_name} for user {user_id}")
    
    def get_user_history(self, user_id: str) -> List[str]:
        """Get dialog history for a user"""
        return self.dialog_history.get(user_id, [])
    
    def reset_user(self, user_id: str) -> None:
        """Reset all dialog state for a user"""
        self.active_dialogs.pop(user_id, None)
        self.dialog_history.pop(user_id, None)
        logger.info(f"Reset dialog state for user {user_id}")

# Global dialog manager instance
dialog_manager = DialogManager()
