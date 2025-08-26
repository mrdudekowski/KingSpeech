"""
Cached Sheets Service for KingSpeech Bot
Optimized Google Sheets operations with caching
"""

import logging
import time
from typing import List, Dict, Optional, Any
from functools import lru_cache
from services.sheets_service import SheetsService

logger = logging.getLogger(__name__)

class CachedSheetsService(SheetsService):
    """Cached version of SheetsService with optimized performance"""
    
    def __init__(self, cache_ttl: int = 300, max_cache_size: int = 1000):
        """
        Initialize cached sheets service
        
        Args:
            cache_ttl: Cache time-to-live in seconds (default: 5 minutes)
            max_cache_size: Maximum number of cache entries (default: 1000)
        """
        super().__init__()
        self.cache_ttl = cache_ttl
        self.max_cache_size = max_cache_size
        self._cache = {}
        self._cache_timestamps = {}
        self._access_times = {}  # Track last access time for LRU
        
        logger.info(f"CachedSheetsService initialized with TTL: {cache_ttl}s, max size: {max_cache_size}")
    
    def _get_cache_key(self, method: str, *args, **kwargs) -> str:
        """
        Generate cache key for method call
        
        Args:
            method: Method name
            *args: Method arguments
            **kwargs: Method keyword arguments
            
        Returns:
            str: Cache key
        """
        # Create a simple cache key from method name and arguments
        key_parts = [method]
        
        # Add args to key
        for arg in args:
            key_parts.append(str(arg))
        
        # Add sorted kwargs to key
        for key, value in sorted(kwargs.items()):
            key_parts.append(f"{key}:{value}")
        
        return "|".join(key_parts)
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """
        Check if cache entry is still valid
        
        Args:
            cache_key: Cache key to check
            
        Returns:
            bool: True if cache is valid
        """
        if cache_key not in self._cache_timestamps:
            return False
        
        now = time.time()
        timestamp = self._cache_timestamps[cache_key]
        
        return (now - timestamp) < self.cache_ttl
    
    def _get_from_cache(self, cache_key: str) -> Optional[Any]:
        """
        Get value from cache if valid
        
        Args:
            cache_key: Cache key
            
        Returns:
            Optional[Any]: Cached value or None
        """
        if self._is_cache_valid(cache_key):
            # Update access time for LRU
            self._access_times[cache_key] = time.time()
            logger.debug(f"Cache hit for key: {cache_key}")
            return self._cache.get(cache_key)
        
        # Remove expired cache entry
        if cache_key in self._cache:
            del self._cache[cache_key]
        if cache_key in self._cache_timestamps:
            del self._cache_timestamps[cache_key]
        if cache_key in self._access_times:
            del self._access_times[cache_key]
        
        logger.debug(f"Cache miss for key: {cache_key}")
        return None
    
    def _set_cache(self, cache_key: str, value: Any) -> None:
        """
        Set value in cache
        
        Args:
            cache_key: Cache key
            value: Value to cache
        """
        # Check if we need to clean up cache
        if len(self._cache) >= self.max_cache_size:
            self._cleanup_cache()
        
        self._cache[cache_key] = value
        self._cache_timestamps[cache_key] = time.time()
        self._access_times[cache_key] = time.time()
        logger.debug(f"Cached value for key: {cache_key}")
    
    def _cleanup_cache(self) -> None:
        """
        Clean up cache using LRU (Least Recently Used) strategy
        Removes 20% of the oldest entries
        """
        if len(self._cache) < self.max_cache_size:
            return
        
        # Calculate how many items to remove (20% of max size)
        items_to_remove = int(self.max_cache_size * 0.2)
        
        # Sort by access time (oldest first)
        sorted_items = sorted(self._access_times.items(), key=lambda x: x[1])
        
        # Remove oldest items
        for key, _ in sorted_items[:items_to_remove]:
            if key in self._cache:
                del self._cache[key]
            if key in self._cache_timestamps:
                del self._cache_timestamps[key]
            if key in self._access_times:
                del self._access_times[key]
        
        logger.info(f"Cleaned up {items_to_remove} cache entries")
    
    def get_users_from_month(self, month_sheet: str) -> List[Dict]:
        """
        Get users from month sheet with caching
        
        Args:
            month_sheet: Month sheet name
            
        Returns:
            List[Dict]: List of user data
        """
        cache_key = self._get_cache_key("get_users_from_month", month_sheet)
        
        # Try to get from cache first
        cached_result = self._get_from_cache(cache_key)
        if cached_result is not None:
            return cached_result
        
        # Get from sheets and cache result
        try:
            result = super().get_users_from_month(month_sheet)
            self._set_cache(cache_key, result)
            return result
        except Exception as e:
            logger.error(f"Error getting users from month {month_sheet}: {e}")
            raise
    
    def get_status(self, telegram_id: str, reg_time: str) -> str:
        """
        Get user status with caching
        
        Args:
            telegram_id: Telegram user ID
            reg_time: Registration time
            
        Returns:
            str: User status
        """
        cache_key = self._get_cache_key("get_status", telegram_id, reg_time)
        
        # Try to get from cache first
        cached_result = self._get_from_cache(cache_key)
        if cached_result is not None:
            return cached_result
        
        # Get from sheets and cache result
        try:
            result = super().get_status(telegram_id, reg_time)
            self._set_cache(cache_key, result)
            return result
        except Exception as e:
            logger.error(f"Error getting status for user {telegram_id}: {e}")
            raise
    
    def append_user_row(self, data: List[str]) -> None:
        """
        Append user row and invalidate relevant cache
        
        Args:
            data: User data to append
        """
        try:
            # Append to sheets
            super().append_user_row(data)
            
            # Invalidate cache entries that might be affected
            self._invalidate_user_cache()
            
            logger.info("User row appended and cache invalidated")
        except Exception as e:
            logger.error(f"Error appending user row: {e}")
            raise
    
    def update_status(self, telegram_id: str, reg_time: str, new_status: str) -> None:
        """
        Update user status and invalidate relevant cache
        
        Args:
            telegram_id: Telegram user ID
            reg_time: Registration time
            new_status: New status
        """
        try:
            # Update in sheets
            super().update_status(telegram_id, reg_time, new_status)
            
            # Invalidate specific status cache
            cache_key = self._get_cache_key("get_status", telegram_id, reg_time)
            if cache_key in self._cache:
                del self._cache[cache_key]
            if cache_key in self._cache_timestamps:
                del self._cache_timestamps[cache_key]
            
            logger.info(f"Status updated for user {telegram_id} and cache invalidated")
        except Exception as e:
            logger.error(f"Error updating status for user {telegram_id}: {e}")
            raise
    
    def _invalidate_user_cache(self) -> None:
        """Invalidate all user-related cache entries"""
        keys_to_remove = []
        
        for key in self._cache.keys():
            if "get_users_from_month" in key or "get_status" in key:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self._cache[key]
            if key in self._cache_timestamps:
                del self._cache_timestamps[key]
        
        logger.debug(f"Invalidated {len(keys_to_remove)} user-related cache entries")
    
    def clear_cache(self) -> None:
        """Clear all cache entries"""
        self._cache.clear()
        self._cache_timestamps.clear()
        logger.info("All cache entries cleared")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics
        
        Returns:
            Dict[str, Any]: Cache statistics
        """
        now = time.time()
        valid_entries = 0
        expired_entries = 0
        
        for key, timestamp in self._cache_timestamps.items():
            if (now - timestamp) < self.cache_ttl:
                valid_entries += 1
            else:
                expired_entries += 1
        
        return {
            "total_entries": len(self._cache),
            "valid_entries": valid_entries,
            "expired_entries": expired_entries,
            "cache_ttl": self.cache_ttl,
            "cache_size": len(self._cache)
        }
    
    def cleanup_expired_cache(self) -> None:
        """Remove expired cache entries"""
        now = time.time()
        keys_to_remove = []
        
        for key, timestamp in self._cache_timestamps.items():
            if (now - timestamp) >= self.cache_ttl:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self._cache[key]
            del self._cache_timestamps[key]
        
        if keys_to_remove:
            logger.debug(f"Cleaned up {len(keys_to_remove)} expired cache entries")

# Global cached sheets service instance
cached_sheets_service = CachedSheetsService()
