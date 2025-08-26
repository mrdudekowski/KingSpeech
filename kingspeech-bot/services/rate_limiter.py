"""
Rate Limiter Service for KingSpeech Bot
Protection against spam and flood attacks
"""

import time
import logging
from collections import defaultdict
from typing import Dict, List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class RateLimitConfig:
    """Configuration for rate limiting"""
    max_requests: int = 10  # Maximum requests per window
    window_seconds: int = 60  # Time window in seconds
    cooldown_seconds: int = 300  # Cooldown period after limit exceeded

class RateLimiter:
    """Rate limiter for protecting against spam and flood attacks"""
    
    def __init__(self, config: Optional[RateLimitConfig] = None):
        self.config = config or RateLimitConfig()
        self.requests: Dict[int, List[float]] = defaultdict(list)
        self.blocked_users: Dict[int, float] = {}
        
        logger.info(f"RateLimiter initialized: {self.config.max_requests} requests per {self.config.window_seconds}s")
    
    def is_allowed(self, user_id: int) -> bool:
        """
        Check if user is allowed to make a request
        
        Args:
            user_id: Telegram user ID
            
        Returns:
            bool: True if request is allowed, False if rate limited
        """
        now = time.time()
        
        # Очищаем старые запросы в начале
        if user_id in self.requests:
            self.requests[user_id] = [req_time for req_time in self.requests[user_id] 
                                    if now - req_time < self.config.window_seconds]
        
        # Проверяем cooldown
        if user_id in self.blocked_users:
            cooldown_remaining = now - self.blocked_users[user_id]
            if cooldown_remaining < self.config.cooldown_seconds:
                logger.warning(f"User {user_id} is in cooldown period")
                return False
            else:
                # Cooldown истек, удаляем из заблокированных и очищаем старые запросы
                del self.blocked_users[user_id]
                if user_id in self.requests:
                    self.requests[user_id] = []
        
        # Проверяем лимит запросов
        current_requests = len(self.requests.get(user_id, []))
        if current_requests >= self.config.max_requests:
            logger.warning(f"Rate limit exceeded for user {user_id}: {current_requests} requests")
            # Добавляем в cooldown только если cooldown_seconds > 0
            if self.config.cooldown_seconds > 0:
                self.blocked_users[user_id] = now
            # Если cooldown не настроен, просто блокируем до истечения окна
            return False
        
        # Добавляем текущий запрос
        if user_id not in self.requests:
            self.requests[user_id] = []
        self.requests[user_id].append(now)
        
        return True
    
    def get_remaining_requests(self, user_id: int) -> int:
        """
        Get number of remaining requests for user
        
        Args:
            user_id: Telegram user ID
            
        Returns:
            int: Number of remaining requests
        """
        now = time.time()
        user_requests = self.requests[user_id]
        
        # Remove old requests
        user_requests = [req_time for req_time in user_requests 
                        if now - req_time < self.config.window_seconds]
        
        remaining = max(0, self.config.max_requests - len(user_requests))
        return remaining
    
    def get_cooldown_remaining(self, user_id: int) -> int:
        """
        Get remaining cooldown time for blocked user
        
        Args:
            user_id: Telegram user ID
            
        Returns:
            int: Remaining cooldown time in seconds, 0 if not blocked
        """
        if user_id not in self.blocked_users:
            return 0
        
        now = time.time()
        remaining = max(0, self.config.cooldown_seconds - (now - self.blocked_users[user_id]))
        return int(remaining)
    
    def reset_user(self, user_id: int) -> None:
        """
        Reset rate limit for a specific user
        
        Args:
            user_id: Telegram user ID
        """
        self.requests.pop(user_id, None)
        self.blocked_users.pop(user_id, None)
        logger.info(f"Rate limit reset for user {user_id}")
    
    def cleanup_old_data(self) -> None:
        """Clean up old request data to prevent memory leaks"""
        now = time.time()
        cutoff_time = now - max(self.config.window_seconds, self.config.cooldown_seconds)
        
        # Clean up old requests
        for user_id in list(self.requests.keys()):
            user_requests = [req_time for req_time in self.requests[user_id] 
                           if req_time > cutoff_time]
            if user_requests:
                self.requests[user_id] = user_requests
            else:
                del self.requests[user_id]
        
        # Clean up old blocked users
        for user_id in list(self.blocked_users.keys()):
            if self.blocked_users[user_id] < cutoff_time:
                del self.blocked_users[user_id]
        
        logger.debug(f"Cleaned up old rate limit data")

# Global rate limiter instance
rate_limiter = RateLimiter()

# Specialized rate limiters for different actions
message_rate_limiter = RateLimiter(RateLimitConfig(max_requests=20, window_seconds=60))
callback_rate_limiter = RateLimiter(RateLimitConfig(max_requests=30, window_seconds=60))
command_rate_limiter = RateLimiter(RateLimitConfig(max_requests=5, window_seconds=60))
