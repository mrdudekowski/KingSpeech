"""
Dialog branches for KingSpeech Bot
Centralized dialog management and registration
"""

import logging
from typing import List
from services.dialog_manager import dialog_manager, DialogBranch

logger = logging.getLogger(__name__)

def load_all_dialogs():
    """Load and register all dialog branches"""
    try:
        # Import all dialog modules to register them
        from . import main_survey
        
        logger.info("All dialog branches loaded successfully")
        logger.info(f"Available branches: {list(dialog_manager.branches.keys())}")
    except Exception as e:
        logger.error(f"Error loading dialog branches: {e}")
        raise

# Load all dialogs when module is imported
_loaded_branches = load_all_dialogs()
