"""
Course Service for KingSpeech Bot
Handles course matching and recommendations
"""

import json
import os
from typing import List, Dict, Optional
from dataclasses import dataclass
from services.settings_service import settings


@dataclass
class Course:
    """Course model for KingSpeech"""
    id: str
    name: str
    goal: List[str]
    level: str
    format: str
    duration: str
    price: str
    description: str
    benefits: List[str]
    schedules: List[str]
    available: bool = True
    max_students: int = 12
    current_students: int = 0


class CourseService:
    """Service for course management and recommendations"""
    
    def __init__(self, courses_file: str = "courses.json"):
        self.courses_file = courses_file
        self.courses: List[Course] = []
        self.load_courses()
    
    def load_courses(self) -> None:
        """Load courses from JSON file"""
        if os.path.exists(self.courses_file):
            try:
                with open(self.courses_file, 'r', encoding='utf-8') as f:
                    courses_data = json.load(f)
                    self.courses = [Course(**course) for course in courses_data]
            except Exception as e:
                print(f"Error loading courses: {e}")
                self.create_default_courses()
        else:
            self.create_default_courses()
    
    def create_default_courses(self) -> None:
        """Create default course catalog"""
        default_courses = [
            {
                "id": "starter_a1",
                "name": "Starter Pack A1",
                "goal": ["study", "travel"],
                "level": "A1",
                "format": "online",
                "duration": "3 месяца",
                "price": "12,000 ₽/месяц",
                "description": "Базовый курс для начинающих с нуля",
                "benefits": ["Говорите с первого урока", "Грамматика простым языком", "Практика с носителями"],
                "schedules": ["weekday", "evening", "weekend"]
            },
            {
                "id": "conversational_b1",
                "name": "Conversational English B1",
                "goal": ["study", "travel", "business"],
                "level": "B1",
                "format": "online",
                "duration": "4 месяца",
                "price": "15,000 ₽/месяц",
                "description": "Разговорный английский для среднего уровня",
                "benefits": ["Свободное общение", "Расширение словарного запаса", "Подготовка к путешествиям"],
                "schedules": ["weekday", "evening", "weekend"]
            },
            {
                "id": "business_b2",
                "name": "Business English B2",
                "goal": ["business"],
                "level": "B2",
                "format": "online",
                "duration": "6 месяцев",
                "price": "18,000 ₽/месяц",
                "description": "Деловой английский для карьеры",
                "benefits": ["Презентации на английском", "Деловая переписка", "Переговоры с партнерами"],
                "schedules": ["weekday", "evening"]
            },
            {
                "id": "ielts_prep",
                "name": "IELTS Preparation",
                "goal": ["exams"],
                "level": "B2",
                "format": "online",
                "duration": "8 месяцев",
                "price": "20,000 ₽/месяц",
                "description": "Подготовка к международному экзамену IELTS",
                "benefits": ["Стратегии сдачи экзамена", "Практические тесты", "Гарантия результата"],
                "schedules": ["weekday", "evening", "weekend"]
            },
            {
                "id": "kids_fun",
                "name": "Kids Fun English",
                "goal": ["kids"],
                "level": "A1",
                "format": "online",
                "duration": "12 месяцев",
                "price": "10,000 ₽/месяц",
                "description": "Английский для детей 7-12 лет",
                "benefits": ["Игровая форма обучения", "Интерактивные уроки", "Прогресс для родителей"],
                "schedules": ["weekday", "weekend"]
            }
        ]
        
        self.courses = [Course(**course) for course in default_courses]
        self.save_courses()
    
    def save_courses(self) -> None:
        """Save courses to JSON file"""
        try:
            courses_data = [
                {
                    "id": course.id,
                    "name": course.name,
                    "goal": course.goal,
                    "level": course.level,
                    "format": course.format,
                    "duration": course.duration,
                    "price": course.price,
                    "description": course.description,
                    "benefits": course.benefits,
                    "schedules": course.schedules,
                    "available": course.available,
                    "max_students": course.max_students,
                    "current_students": course.current_students
                }
                for course in self.courses
            ]
            
            with open(self.courses_file, 'w', encoding='utf-8') as f:
                json.dump(courses_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving courses: {e}")
    
    def get_courses_by_criteria(self, goal: str, level: str, format_pref: str, schedule: str) -> List[Course]:
        """Get courses matching user criteria"""
        matching_courses = []
        
        for course in self.courses:
            if not course.available:
                continue
                
            # Calculate match score
            score = 0
            
            # Goal matching (40% weight)
            if goal in course.goal:
                score += 40
            
            # Level matching (30% weight)
            if level == course.level:
                score += 30
            elif self._level_compatibility(level, course.level):
                score += 15
            
            # Format matching (20% weight)
            if format_pref == course.format:
                score += 20
            
            # Schedule matching (10% weight)
            if schedule in course.schedules:
                score += 10
            
            if score > 0:
                course.score = score
                matching_courses.append(course)
        
        # Sort by score (highest first)
        matching_courses.sort(key=lambda x: x.score, reverse=True)
        return matching_courses[:3]  # Return top 3 matches
    
    def _level_compatibility(self, user_level: str, course_level: str) -> bool:
        """Check if user level is compatible with course level"""
        level_order = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"]
        
        try:
            user_idx = level_order.index(user_level)
            course_idx = level_order.index(course_level)
            
            # Allow one level difference
            return abs(user_idx - course_idx) <= 1
        except ValueError:
            return False
    
    def get_course_by_id(self, course_id: str) -> Optional[Course]:
        """Get course by ID"""
        for course in self.courses:
            if course.id == course_id:
                return course
        return None
    
    def update_course_availability(self, course_id: str, available: bool) -> bool:
        """Update course availability"""
        course = self.get_course_by_id(course_id)
        if course:
            course.available = available
            self.save_courses()
            return True
        return False
    
    def get_popular_courses(self, limit: int = 3) -> List[Course]:
        """Get most popular courses (based on current students)"""
        sorted_courses = sorted(self.courses, key=lambda x: x.current_students, reverse=True)
        return sorted_courses[:limit]


# Global instance
course_service = CourseService()
