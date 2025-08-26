"""
Metrics Service for KingSpeech Bot
Provides performance metrics collection and analysis
"""

import time
import asyncio
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from collections import defaultdict, deque
import threading

@dataclass
class Metric:
    """Single metric data point"""
    name: str
    value: float
    timestamp: float
    tags: Dict[str, str] = field(default_factory=dict)

@dataclass
class MetricSummary:
    """Summary statistics for a metric"""
    name: str
    count: int
    min_value: float
    max_value: float
    avg_value: float
    sum_value: float
    tags: Dict[str, str] = field(default_factory=dict)

class MetricsService:
    """Service for collecting and analyzing performance metrics"""
    
    def __init__(self, max_metrics: int = 10000, retention_hours: int = 24):
        """
        Initialize metrics service
        
        Args:
            max_metrics: Maximum number of metrics to store in memory
            retention_hours: How long to keep metrics (in hours)
        """
        self.max_metrics = max_metrics
        self.retention_seconds = retention_hours * 3600
        
        # Thread-safe storage
        self._lock = threading.Lock()
        self.metrics: List[Metric] = []
        self._metric_counters: Dict[str, int] = defaultdict(int)
        self._metric_timers: Dict[str, float] = {}
        
        # Performance tracking
        self._operation_times: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        self._error_counts: Dict[str, int] = defaultdict(int)
        self._user_activity: Dict[int, int] = defaultdict(int)
        
        # Start cleanup thread
        self._cleanup_thread = threading.Thread(target=self._cleanup_worker, daemon=True)
        self._cleanup_thread.start()
    
    def record_timing(self, operation: str, duration: float, **tags) -> None:
        """
        Record timing metric
        
        Args:
            operation: Operation name
            duration: Duration in seconds
            **tags: Additional tags
        """
        with self._lock:
            metric = Metric(
                name=f"{operation}_duration",
                value=duration,
                timestamp=time.time(),
                tags=tags
            )
            self._add_metric(metric)
            
            # Track operation times for statistics
            self._operation_times[operation].append(duration)
    
    def record_counter(self, name: str, value: int = 1, **tags) -> None:
        """
        Record counter metric
        
        Args:
            name: Counter name
            value: Counter value (default: 1)
            **tags: Additional tags
        """
        with self._lock:
            metric = Metric(
                name=name,
                value=value,
                timestamp=time.time(),
                tags=tags
            )
            self._add_metric(metric)
            
            # Update counter
            self._metric_counters[name] += value
    
    def record_error(self, error_type: str, **tags) -> None:
        """
        Record error metric
        
        Args:
            error_type: Type of error
            **tags: Additional tags
        """
        with self._lock:
            self._error_counts[error_type] += 1
            
            metric = Metric(
                name="error_count",
                value=1,
                timestamp=time.time(),
                tags={"error_type": error_type, **tags}
            )
            self._add_metric(metric)
    
    def record_user_activity(self, user_id: int, action: str) -> None:
        """
        Record user activity
        
        Args:
            user_id: Telegram user ID
            action: User action
        """
        with self._lock:
            self._user_activity[user_id] += 1
            
            metric = Metric(
                name="user_activity",
                value=1,
                timestamp=time.time(),
                tags={"user_id": str(user_id), "action": action}
            )
            self._add_metric(metric)
    
    def start_timer(self, operation: str) -> None:
        """
        Start timing an operation
        
        Args:
            operation: Operation name
        """
        self._metric_timers[operation] = time.time()
    
    def stop_timer(self, operation: str, **tags) -> Optional[float]:
        """
        Stop timing an operation and record the duration
        
        Args:
            operation: Operation name
            **tags: Additional tags
            
        Returns:
            Duration in seconds, or None if timer wasn't started
        """
        if operation not in self._metric_timers:
            return None
        
        start_time = self._metric_timers.pop(operation)
        duration = time.time() - start_time
        
        self.record_timing(operation, duration, **tags)
        return duration
    
    def get_metrics_summary(self, hours: int = 1) -> Dict[str, MetricSummary]:
        """
        Get summary of metrics for the last N hours
        
        Args:
            hours: Number of hours to look back
            
        Returns:
            Dictionary of metric summaries
        """
        cutoff = time.time() - (hours * 3600)
        
        with self._lock:
            recent_metrics = [m for m in self.metrics if m.timestamp > cutoff]
            
            # Group by metric name
            grouped_metrics: Dict[str, List[Metric]] = defaultdict(list)
            for metric in recent_metrics:
                grouped_metrics[metric.name].append(metric)
            
            # Calculate summaries
            summaries = {}
            for name, metrics_list in grouped_metrics.items():
                values = [m.value for m in metrics_list]
                summaries[name] = MetricSummary(
                    name=name,
                    count=len(values),
                    min_value=min(values),
                    max_value=max(values),
                    avg_value=sum(values) / len(values),
                    sum_value=sum(values),
                    tags=metrics_list[0].tags if metrics_list else {}
                )
            
            return summaries
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """
        Get current performance statistics
        
        Returns:
            Dictionary with performance statistics
        """
        with self._lock:
            stats = {
                "total_metrics": len(self.metrics),
                "error_counts": dict(self._error_counts),
                "active_users": len(self._user_activity),
                "operation_stats": {}
            }
            
            # Calculate operation statistics
            for operation, times in self._operation_times.items():
                if times:
                    stats["operation_stats"][operation] = {
                        "count": len(times),
                        "avg_duration": sum(times) / len(times),
                        "min_duration": min(times),
                        "max_duration": max(times)
                    }
            
            return stats
    
    def get_top_users(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get top active users
        
        Args:
            limit: Number of users to return
            
        Returns:
            List of user activity data
        """
        with self._lock:
            sorted_users = sorted(
                self._user_activity.items(), 
                key=lambda x: x[1], 
                reverse=True
            )
            
            return [
                {"user_id": user_id, "activity_count": count}
                for user_id, count in sorted_users[:limit]
            ]
    
    def _add_metric(self, metric: Metric) -> None:
        """Add metric to storage with cleanup if needed"""
        self.metrics.append(metric)
        
        # Cleanup if we exceed max metrics
        if len(self.metrics) > self.max_metrics:
            # Remove oldest metrics
            self.metrics = self.metrics[-self.max_metrics:]
    
    def _cleanup_worker(self) -> None:
        """Background worker to clean up old metrics"""
        while True:
            try:
                time.sleep(300)  # Run every 5 minutes
                self._cleanup_old_metrics()
            except Exception as e:
                # Log error but continue
                print(f"Error in metrics cleanup: {e}")
    
    def _cleanup_old_metrics(self) -> None:
        """Remove metrics older than retention period"""
        cutoff = time.time() - self.retention_seconds
        
        with self._lock:
            # Remove old metrics
            self.metrics = [m for m in self.metrics if m.timestamp > cutoff]
            
            # Clean up old user activity
            current_time = time.time()
            old_users = [
                user_id for user_id, last_activity in self._user_activity.items()
                if current_time - last_activity > self.retention_seconds
            ]
            for user_id in old_users:
                del self._user_activity[user_id]


# Global metrics service instance
_metrics_instance: Optional[MetricsService] = None

def get_metrics() -> MetricsService:
    """Get global metrics service instance"""
    global _metrics_instance
    if _metrics_instance is None:
        _metrics_instance = MetricsService()
    return _metrics_instance

def init_metrics(max_metrics: int = 10000, retention_hours: int = 24) -> MetricsService:
    """Initialize global metrics service"""
    global _metrics_instance
    _metrics_instance = MetricsService(max_metrics, retention_hours)
    return _metrics_instance
