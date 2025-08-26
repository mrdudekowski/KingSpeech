"""
Materials Service for KingSpeech Bot
Handles free materials delivery and tracking
"""

import json
import os
from typing import List, Dict, Optional
from dataclasses import dataclass
from services.settings_service import settings


@dataclass
class Material:
    """Material model for KingSpeech"""
    id: str
    name: str
    goal: List[str]
    level: str
    file_url: str
    description: str
    file_type: str = "pdf"
    file_size: str = "2.5 MB"
    downloads: int = 0
    available: bool = True


class MaterialsService:
    """Service for materials management and delivery"""
    
    def __init__(self, materials_file: str = "materials.json"):
        self.materials_file = materials_file
        self.materials: List[Material] = []
        self.load_materials()
    
    def load_materials(self) -> None:
        """Load materials from JSON file"""
        if os.path.exists(self.materials_file):
            try:
                with open(self.materials_file, 'r', encoding='utf-8') as f:
                    materials_data = json.load(f)
                    self.materials = [Material(**material) for material in materials_data]
            except Exception as e:
                print(f"Error loading materials: {e}")
                self.create_default_materials()
        else:
            self.create_default_materials()
    
    def create_default_materials(self) -> None:
        """Create default materials library"""
        default_materials = [
            {
                "id": "starter_pack_a1",
                "name": "Starter Pack A1",
                "goal": ["study", "travel"],
                "level": "A1",
                "file_url": "https://drive.google.com/file/d/1A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6/view",
                "description": "Базовый набор для начинающих: алфавит, основные фразы, грамматика",
                "file_type": "pdf",
                "file_size": "3.2 MB"
            },
            {
                "id": "ielts_writing_task2",
                "name": "IELTS Writing Task 2 Guide",
                "goal": ["exams"],
                "level": "B2",
                "file_url": "https://drive.google.com/file/d/2B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7/view",
                "description": "Полное руководство по написанию эссе для IELTS",
                "file_type": "pdf",
                "file_size": "4.1 MB"
            },
            {
                "id": "business_small_talk",
                "name": "Business Small Talk Phrases",
                "goal": ["business"],
                "level": "B1",
                "file_url": "https://drive.google.com/file/d/3C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8/view",
                "description": "100+ фраз для делового общения и нетворкинга",
                "file_type": "pdf",
                "file_size": "1.8 MB"
            },
            {
                "id": "top_phrasal_verbs_b1",
                "name": "Top 50 Phrasal Verbs B1",
                "goal": ["study", "travel"],
                "level": "B1",
                "file_url": "https://drive.google.com/file/d/4D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9/view",
                "description": "Самые важные фразовые глаголы с примерами и упражнениями",
                "file_type": "pdf",
                "file_size": "2.7 MB"
            },
            {
                "id": "kids_fun_pack",
                "name": "Kids Fun Learning Pack",
                "goal": ["kids"],
                "level": "A1",
                "file_url": "https://drive.google.com/file/d/5E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0/view",
                "description": "Игровые материалы для детей: карточки, раскраски, песни",
                "file_type": "pdf",
                "file_size": "5.2 MB"
            },
            {
                "id": "travel_phrases",
                "name": "Essential Travel Phrases",
                "goal": ["travel"],
                "level": "A2",
                "file_url": "https://drive.google.com/file/d/6F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1/view",
                "description": "Незаменимые фразы для путешествий: аэропорт, отель, ресторан",
                "file_type": "pdf",
                "file_size": "2.1 MB"
            }
        ]
        
        self.materials = [Material(**material) for material in default_materials]
        self.save_materials()
    
    def save_materials(self) -> None:
        """Save materials to JSON file"""
        try:
            materials_data = [
                {
                    "id": material.id,
                    "name": material.name,
                    "goal": material.goal,
                    "level": material.level,
                    "file_url": material.file_url,
                    "description": material.description,
                    "file_type": material.file_type,
                    "file_size": material.file_size,
                    "downloads": material.downloads,
                    "available": material.available
                }
                for material in self.materials
            ]
            
            with open(self.materials_file, 'w', encoding='utf-8') as f:
                json.dump(materials_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving materials: {e}")
    
    def get_materials_by_criteria(self, goal: str, level: str, limit: int = 3) -> List[Material]:
        """Get materials matching user criteria"""
        matching_materials = []
        
        for material in self.materials:
            if not material.available:
                continue
                
            # Calculate match score
            score = 0
            
            # Goal matching (60% weight)
            if goal in material.goal:
                score += 60
            
            # Level matching (40% weight)
            if level == material.level:
                score += 40
            elif self._level_compatibility(level, material.level):
                score += 20
            
            if score > 0:
                material.score = score
                matching_materials.append(material)
        
        # Sort by score and downloads (popularity)
        matching_materials.sort(key=lambda x: (x.score, x.downloads), reverse=True)
        return matching_materials[:limit]
    
    def _level_compatibility(self, user_level: str, material_level: str) -> bool:
        """Check if user level is compatible with material level"""
        level_order = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"]
        
        try:
            user_idx = level_order.index(user_level)
            material_idx = level_order.index(material_level)
            
            # Allow one level difference
            return abs(user_idx - material_idx) <= 1
        except ValueError:
            return False
    
    def get_material_by_id(self, material_id: str) -> Optional[Material]:
        """Get material by ID"""
        for material in self.materials:
            if material.id == material_id:
                return material
        return None
    
    def deliver_material(self, material_id: str, user_id: str) -> Optional[Dict]:
        """Deliver material to user and track download"""
        material = self.get_material_by_id(material_id)
        if not material or not material.available:
            return None
        
        # Increment download counter
        material.downloads += 1
        self.save_materials()
        
        # Return delivery info
        return {
            "material_id": material.id,
            "material_name": material.name,
            "file_url": material.file_url,
            "file_type": material.file_type,
            "file_size": material.file_size,
            "description": material.description,
            "delivery_time": "immediate"
        }
    
    def get_popular_materials(self, limit: int = 5) -> List[Material]:
        """Get most popular materials"""
        sorted_materials = sorted(self.materials, key=lambda x: x.downloads, reverse=True)
        return sorted_materials[:limit]
    
    def get_materials_catalog(self, goal: str = None, level: str = None) -> List[Material]:
        """Get materials catalog with optional filtering"""
        catalog = []
        
        for material in self.materials:
            if not material.available:
                continue
                
            # Apply filters
            if goal and goal not in material.goal:
                continue
            if level and level != material.level:
                continue
                
            catalog.append(material)
        
        return catalog
    
    def update_material_availability(self, material_id: str, available: bool) -> bool:
        """Update material availability"""
        material = self.get_material_by_id(material_id)
        if material:
            material.available = available
            self.save_materials()
            return True
        return False
    
    def get_delivery_stats(self) -> Dict:
        """Get materials delivery statistics"""
        total_materials = len(self.materials)
        available_materials = len([m for m in self.materials if m.available])
        total_downloads = sum(m.downloads for m in self.materials)
        
        return {
            "total_materials": total_materials,
            "available_materials": available_materials,
            "total_downloads": total_downloads,
            "popular_materials": self.get_popular_materials(3)
        }


# Global instance
materials_service = MaterialsService()
