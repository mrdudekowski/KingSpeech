"""
Analytics Service for KingSpeech Bot
Handles funnel tracking and conversion analytics
"""

import json
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from services.settings_service import settings


@dataclass
class AnalyticsEvent:
    """Analytics event model"""
    event_type: str
    user_id: str
    session_id: str
    timestamp: float
    data: Dict
    funnel_step: int = 0
    goal: str = ""
    level: str = ""
    format_pref: str = ""
    schedule: str = ""


class AnalyticsService:
    """Service for analytics and funnel tracking"""
    
    def __init__(self, events_file: str = "analytics_events.json"):
        self.events_file = events_file
        self.events: List[AnalyticsEvent] = []
        self.load_events()
    
    def load_events(self) -> None:
        """Load events from JSON file"""
        if os.path.exists(self.events_file):
            try:
                with open(self.events_file, 'r', encoding='utf-8') as f:
                    events_data = json.load(f)
                    self.events = [AnalyticsEvent(**event) for event in events_data]
            except Exception as e:
                print(f"Error loading events: {e}")
                self.events = []
        else:
            self.events = []
    
    def save_events(self) -> None:
        """Save events to JSON file"""
        try:
            events_data = [asdict(event) for event in self.events]
            with open(self.events_file, 'w', encoding='utf-8') as f:
                json.dump(events_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving events: {e}")
    
    def track_event(self, event_type: str, user_id: str, session_id: str, 
                   data: Dict = None, funnel_step: int = 0, goal: str = "", 
                   level: str = "", format_pref: str = "", schedule: str = "") -> None:
        """Track an analytics event"""
        event = AnalyticsEvent(
            event_type=event_type,
            user_id=user_id,
            session_id=session_id,
            timestamp=time.time(),
            data=data or {},
            funnel_step=funnel_step,
            goal=goal,
            level=level,
            format_pref=format_pref,
            schedule=schedule
        )
        
        self.events.append(event)
        self.save_events()
    
    def get_funnel_analytics(self, days: int = 30) -> Dict:
        """Get funnel analytics for the specified period"""
        cutoff_time = time.time() - (days * 24 * 60 * 60)
        recent_events = [e for e in self.events if e.timestamp >= cutoff_time]
        
        # Group events by session
        sessions = {}
        for event in recent_events:
            if event.session_id not in sessions:
                sessions[event.session_id] = []
            sessions[event.session_id].append(event)
        
        # Calculate funnel metrics
        funnel_steps = {
            1: 0,  # Greeting
            2: 0,  # Goal selection
            3: 0,  # Qualification
            4: 0,  # Course match
            5: 0,  # Contact collection
            6: 0,  # Materials delivery
            7: 0,  # Booking/chat
            8: 0   # Thank you
        }
        
        completed_sessions = 0
        contact_submissions = 0
        material_downloads = 0
        trial_bookings = 0
        
        for session_events in sessions.values():
            # Sort events by timestamp
            session_events.sort(key=lambda x: x.timestamp)
            
            # Track funnel progress
            max_step = 0
            for event in session_events:
                if event.funnel_step > max_step:
                    max_step = event.funnel_step
                    funnel_steps[event.funnel_step] += 1
                
                # Track specific events
                if event.event_type == "contact_submitted":
                    contact_submissions += 1
                elif event.event_type == "material_delivered":
                    material_downloads += 1
                elif event.event_type == "trial_booked":
                    trial_bookings += 1
            
            # Check if session completed
            if max_step >= 8:
                completed_sessions += 1
        
        total_sessions = len(sessions)
        
        return {
            "period_days": days,
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "completion_rate": completed_sessions / total_sessions if total_sessions > 0 else 0,
            "funnel_steps": funnel_steps,
            "contact_submissions": contact_submissions,
            "material_downloads": material_downloads,
            "trial_bookings": trial_bookings,
            "conversion_rates": {
                "contact_rate": contact_submissions / total_sessions if total_sessions > 0 else 0,
                "material_rate": material_downloads / total_sessions if total_sessions > 0 else 0,
                "trial_rate": trial_bookings / total_sessions if total_sessions > 0 else 0
            }
        }
    
    def get_user_journey(self, user_id: str) -> List[AnalyticsEvent]:
        """Get complete user journey"""
        user_events = [e for e in self.events if e.user_id == user_id]
        user_events.sort(key=lambda x: x.timestamp)
        return user_events
    
    def get_session_analytics(self, session_id: str) -> Dict:
        """Get analytics for specific session"""
        session_events = [e for e in self.events if e.session_id == session_id]
        session_events.sort(key=lambda x: x.timestamp)
        
        if not session_events:
            return {}
        
        start_time = session_events[0].timestamp
        end_time = session_events[-1].timestamp
        duration = end_time - start_time
        
        return {
            "session_id": session_id,
            "user_id": session_events[0].user_id,
            "start_time": start_time,
            "end_time": end_time,
            "duration_seconds": duration,
            "total_events": len(session_events),
            "funnel_progress": max(e.funnel_step for e in session_events),
            "events": [asdict(e) for e in session_events]
        }
    
    def get_goal_analytics(self, days: int = 30) -> Dict:
        """Get analytics by user goals"""
        cutoff_time = time.time() - (days * 24 * 60 * 60)
        recent_events = [e for e in self.events if e.timestamp >= cutoff_time]
        
        goals = {}
        for event in recent_events:
            if event.goal:
                if event.goal not in goals:
                    goals[event.goal] = {
                        "sessions": set(),
                        "contacts": 0,
                        "materials": 0,
                        "trials": 0
                    }
                
                goals[event.goal]["sessions"].add(event.session_id)
                
                if event.event_type == "contact_submitted":
                    goals[event.goal]["contacts"] += 1
                elif event.event_type == "material_delivered":
                    goals[event.goal]["materials"] += 1
                elif event.event_type == "trial_booked":
                    goals[event.goal]["trials"] += 1
        
        # Convert sets to counts
        for goal in goals:
            goals[goal]["session_count"] = len(goals[goal]["sessions"])
            del goals[goal]["sessions"]
        
        return goals
    
    def get_level_analytics(self, days: int = 30) -> Dict:
        """Get analytics by user levels"""
        cutoff_time = time.time() - (days * 24 * 60 * 60)
        recent_events = [e for e in self.events if e.timestamp >= cutoff_time]
        
        levels = {}
        for event in recent_events:
            if event.level:
                if event.level not in levels:
                    levels[event.level] = {
                        "sessions": set(),
                        "contacts": 0,
                        "materials": 0,
                        "trials": 0
                    }
                
                levels[event.level]["sessions"].add(event.session_id)
                
                if event.event_type == "contact_submitted":
                    levels[event.level]["contacts"] += 1
                elif event.event_type == "material_delivered":
                    levels[event.level]["materials"] += 1
                elif event.event_type == "trial_booked":
                    levels[event.level]["trials"] += 1
        
        # Convert sets to counts
        for level in levels:
            levels[level]["session_count"] = len(levels[level]["sessions"])
            del levels[level]["sessions"]
        
        return levels
    
    def get_dropoff_points(self, days: int = 30) -> Dict:
        """Identify funnel dropoff points"""
        cutoff_time = time.time() - (days * 24 * 60 * 60)
        recent_events = [e for e in self.events if e.timestamp >= cutoff_time]
        
        # Group by session and find max step reached
        sessions = {}
        for event in recent_events:
            if event.session_id not in sessions:
                sessions[event.session_id] = 0
            sessions[event.session_id] = max(sessions[event.session_id], event.funnel_step)
        
        # Count dropoffs at each step
        dropoffs = {i: 0 for i in range(1, 9)}
        total_sessions = len(sessions)
        
        for max_step in sessions.values():
            if max_step < 8:  # Session didn't complete
                dropoffs[max_step] += 1
        
        # Calculate dropoff rates
        dropoff_rates = {}
        previous_count = total_sessions
        
        for step in range(1, 9):
            if previous_count > 0:
                rate = dropoffs[step] / previous_count
                dropoff_rates[step] = rate
                previous_count -= dropoffs[step]
            else:
                dropoff_rates[step] = 0
        
        return {
            "total_sessions": total_sessions,
            "dropoffs": dropoffs,
            "dropoff_rates": dropoff_rates
        }
    
    def cleanup_old_events(self, days: int = 90) -> int:
        """Remove events older than specified days"""
        cutoff_time = time.time() - (days * 24 * 60 * 60)
        original_count = len(self.events)
        
        self.events = [e for e in self.events if e.timestamp >= cutoff_time]
        
        removed_count = original_count - len(self.events)
        if removed_count > 0:
            self.save_events()
        
        return removed_count


# Global instance
analytics_service = AnalyticsService()
