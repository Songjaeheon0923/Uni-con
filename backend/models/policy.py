from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PolicyBase(BaseModel):
    title: str
    description: str
    content: str
    url: str
    category: str
    target_age_min: Optional[int] = None
    target_age_max: Optional[int] = None
    target_gender: Optional[str] = None
    target_location: Optional[str] = None
    tags: List[str] = []
    is_active: bool = True


class PolicyCreate(PolicyBase):
    pass


class Policy(PolicyBase):
    id: int
    crawled_at: datetime
    view_count: int = 0
    relevance_score: float = 0.0
    
    class Config:
        from_attributes = True


class PolicyRecommendation(BaseModel):
    policy: Policy
    score: float
    reason: str