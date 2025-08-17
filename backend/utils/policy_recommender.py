import sqlite3
import json
from typing import List, Dict, Optional
from datetime import datetime
from database.connection import DATABASE_PATH
from models.policy import Policy, PolicyRecommendation


class PolicyRecommender:
    def __init__(self):
        self.db_path = DATABASE_PATH
    
    def get_db_connection(self):
        return sqlite3.connect(self.db_path)
    
    def get_user_profile(self, user_id: int) -> Optional[Dict]:
        """사용자 프로필 정보 조회"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT u.gender, p.budget_range, p.lifestyle_type, p.personality_type
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.id = ?
        """, (user_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                'age': 23,  # 기본값
                'gender': result[0], 
                'budget_range': result[1],
                'lifestyle_type': result[2],
                'personality_type': result[3]
            }
        return None
    
    def get_user_policy_history(self, user_id: int) -> List[str]:
        """사용자가 조회한 정책 카테고리 히스토리"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT p.category, COUNT(*) as view_count
            FROM policy_views pv
            JOIN policies p ON pv.policy_id = p.id
            WHERE pv.user_id = ?
            GROUP BY p.category
            ORDER BY view_count DESC
        """, (user_id,))
        
        results = cursor.fetchall()
        conn.close()
        
        return [row[0] for row in results]
    
    def calculate_policy_score(self, policy: Dict, user_profile: Dict, user_history: List[str]) -> float:
        """개선된 정책의 개인화 점수 계산"""
        score = 0.0
        
        # 1. 연령 매칭 점수 (가중치: 25%)
        age_score = self._calculate_age_score(policy, user_profile)
        score += age_score * 0.25
        
        # 2. 주택정책 카테고리 매칭 (가중치: 30%)
        category_score = self._calculate_housing_category_score(policy, user_profile, user_history)
        score += category_score * 0.30
        
        # 3. 생활패턴 매칭 (가중치: 20%)
        lifestyle_score = self._calculate_lifestyle_score(policy, user_profile)
        score += lifestyle_score * 0.20
        
        # 4. 지역 매칭 (가중치: 10%)
        location_score = self._calculate_location_score(policy, user_profile)
        score += location_score * 0.10
        
        # 5. 정책 우선순위 및 신규성 (가중치: 15%)
        priority_score = self._calculate_priority_score(policy)
        score += priority_score * 0.15
        
        return min(score, 100.0)  # 최대 100점
    
    def _calculate_age_score(self, policy: Dict, user_profile: Dict) -> float:
        """연령 기반 점수 계산"""
        user_age = user_profile.get('age')
        if not user_age:
            return 50.0  # 기본 점수
        
        target_min = policy.get('target_age_min')
        target_max = policy.get('target_age_max')
        
        if target_min and target_max:
            if target_min <= user_age <= target_max:
                return 100.0  # 완전 매칭
            else:
                # 범위에서 벗어난 정도에 따라 점수 감점
                distance = min(abs(user_age - target_min), abs(user_age - target_max))
                return max(100.0 - (distance * 10), 0.0)
        elif target_min and user_age >= target_min:
            return 80.0
        elif target_max and user_age <= target_max:
            return 80.0
        else:
            return 60.0
    
    def _calculate_housing_category_score(self, policy: Dict, user_profile: Dict, user_history: List[str]) -> float:
        """주택정책 카테고리 기반 점수 계산"""
        score = 0.0
        category = policy.get('category', '')
        
        # 조회 히스토리 기반 점수
        if category in user_history:
            position = user_history.index(category)
            score += max(80.0 - (position * 10), 20.0)
        
        # 사용자 프로필 기반 카테고리 선호도
        age = user_profile.get('age', 0)
        lifestyle = user_profile.get('lifestyle_type', '')
        budget = user_profile.get('budget_range', '')
        
        # 연령대별 선호 카테고리
        if 19 <= age <= 29:
            if category in ['청년주택정책', '공공임대주택', '주거급여/지원']:
                score += 60.0
            elif category in ['주택금융지원']:
                score += 40.0
        elif 30 <= age <= 39:
            if category in ['주택금융지원', '신혼부부주택', '주택분양/청약']:
                score += 60.0
            elif category in ['청년주택정책']:
                score += 30.0
        
        # 생활유형별 선호도
        if lifestyle == 'student' and category in ['청년주택정책', '주거급여/지원']:
            score += 40.0
        elif lifestyle == 'worker' and category in ['주택금융지원', '주택분양/청약']:
            score += 40.0
        
        # 예산별 선호도
        if budget == 'low' and category in ['주거급여/지원', '공공임대주택']:
            score += 30.0
        elif budget in ['medium', 'high'] and category in ['주택금융지원', '주택분양/청약']:
            score += 30.0
        
        return min(score, 100.0)
    
    def _calculate_lifestyle_score(self, policy: Dict, user_profile: Dict) -> float:
        """생활패턴 기반 점수 계산"""
        score = 50.0  # 기본 점수
        
        lifestyle = user_profile.get('lifestyle_type', '')
        budget = user_profile.get('budget_range', '')
        personality = user_profile.get('personality_type', '')
        
        policy_tags = json.loads(policy.get('tags', '[]')) if policy.get('tags') else []
        policy_text = f"{policy.get('title', '')} {policy.get('description', '')}".lower()
        
        # 생활유형별 매칭
        if lifestyle == 'student':
            if any(tag in ['대학생', '청년', '학생'] for tag in policy_tags):
                score += 30.0
            if any(keyword in policy_text for keyword in ['대학생', '학자금', '교육']):
                score += 20.0
        
        elif lifestyle == 'worker':
            if any(tag in ['직장인', '근로자'] for tag in policy_tags):
                score += 30.0
            if any(keyword in policy_text for keyword in ['직장인', '근로자', '소득공제']):
                score += 20.0
        
        elif lifestyle == 'freelancer':
            if any(keyword in policy_text for keyword in ['프리랜서', '자영업', '개인사업']):
                score += 30.0
        
        # 예산 범위별 매칭
        if budget == 'low':
            if any(keyword in policy_text for keyword in ['저소득', '기초생활', '지원금', '급여']):
                score += 25.0
        elif budget in ['medium', 'high']:
            if any(keyword in policy_text for keyword in ['대출', '구입자금', '투자']):
                score += 25.0
        
        return min(score, 100.0)
    
    def _calculate_location_score(self, policy: Dict, user_profile: Dict) -> float:
        """지역 기반 점수 계산"""
        # 현재는 기본 점수, 향후 사용자 지역 정보 추가시 활용
        target_location = policy.get('target_location', '')
        
        if target_location:
            # 서울 지역 정책 우대 (대부분 사용자가 서울 거주 가정)
            if '서울' in target_location:
                return 80.0
            else:
                return 60.0
        else:
            return 70.0  # 전국 단위 정책
    
    def _calculate_priority_score(self, policy: Dict) -> float:
        """정책 우선순위 점수 계산"""
        score = 50.0
        
        # 조회수 기반 인기도
        view_count = policy.get('view_count', 0)
        if view_count > 50:
            score += 30.0
        elif view_count > 20:
            score += 20.0
        elif view_count > 10:
            score += 10.0
        
        # 관련성 점수 (기존에 계산된 경우)
        relevance = policy.get('relevance_score', 0)
        if relevance > 15:
            score += 30.0
        elif relevance > 10:
            score += 20.0
        elif relevance > 5:
            score += 10.0
        
        # 최신성 점수
        crawled_at = policy.get('crawled_at')
        if crawled_at:
            try:
                from datetime import datetime
                crawl_date = datetime.fromisoformat(crawled_at)
                days_old = (datetime.now() - crawl_date).days
                
                if days_old <= 7:
                    score += 20.0
                elif days_old <= 30:
                    score += 10.0
                elif days_old <= 60:
                    score += 5.0
            except:
                pass
        
        return min(score, 100.0)
    
    def _extract_user_keywords(self, user_profile: Dict) -> List[str]:
        """사용자 프로필에서 키워드 추출"""
        keywords = []
        
        # 나이대별 키워드
        age = user_profile.get('age')
        if age:
            if 19 <= age <= 25:
                keywords.extend(['청년', '대학생', '취업'])
            elif 26 <= age <= 34:
                keywords.extend(['청년', '주택', '대출'])
        
        # 생활 유형별 키워드
        lifestyle = user_profile.get('lifestyle_type')
        if lifestyle == 'student':
            keywords.extend(['학생', '교육', '장학'])
        elif lifestyle == 'worker':
            keywords.extend(['직장인', '주택', '복지'])
        elif lifestyle == 'freelancer':
            keywords.extend(['프리랜서', '창업', '지원'])
        
        # 예산 범위별 키워드
        budget = user_profile.get('budget_range')
        if budget == 'low':
            keywords.extend(['저소득', '지원금', '보조'])
        elif budget in ['medium', 'high']:
            keywords.extend(['대출', '금융'])
        
        return list(set(keywords))
    
    def get_personalized_policies(self, user_id: int, limit: int = 10) -> List[PolicyRecommendation]:
        """개인화된 정책 추천"""
        # 사용자 프로필 조회
        user_profile = self.get_user_profile(user_id)
        if not user_profile:
            return self.get_popular_policies(limit)
        
        # 사용자 조회 히스토리 조회
        user_history = self.get_user_policy_history(user_id)
        
        # 활성화된 정책들 조회
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, title, description, content, url, category,
                   target_age_min, target_age_max, target_gender, target_location,
                   tags, view_count, relevance_score, crawled_at
            FROM policies
            WHERE is_active = 1
            ORDER BY crawled_at DESC
            LIMIT 50
        """)
        
        policies = cursor.fetchall()
        conn.close()
        
        # 정책별 점수 계산 및 정렬
        recommendations = []
        
        for policy_data in policies:
            policy_dict = {
                'id': policy_data[0],
                'title': policy_data[1],
                'description': policy_data[2],
                'content': policy_data[3],
                'url': policy_data[4],
                'category': policy_data[5],
                'target_age_min': policy_data[6],
                'target_age_max': policy_data[7],
                'target_gender': policy_data[8],
                'target_location': policy_data[9],
                'tags': policy_data[10],
                'view_count': policy_data[11],
                'relevance_score': policy_data[12],
                'crawled_at': policy_data[13]
            }
            
            score = self.calculate_policy_score(policy_dict, user_profile, user_history)
            
            # 추천 이유 생성
            reason = self._generate_recommendation_reason(policy_dict, user_profile, user_history, score)
            
            policy = Policy(
                id=policy_dict['id'],
                title=policy_dict['title'],
                description=policy_dict['description'],
                content=policy_dict['content'],
                url=policy_dict['url'],
                category=policy_dict['category'],
                target_age_min=policy_dict['target_age_min'],
                target_age_max=policy_dict['target_age_max'],
                target_gender=policy_dict['target_gender'],
                target_location=policy_dict['target_location'],
                tags=json.loads(policy_dict['tags']) if policy_dict['tags'] else [],
                view_count=policy_dict['view_count'],
                relevance_score=policy_dict['relevance_score'],
                crawled_at=datetime.fromisoformat(policy_dict['crawled_at'])
            )
            
            recommendations.append(PolicyRecommendation(
                policy=policy,
                score=score,
                reason=reason
            ))
        
        # 점수 순으로 정렬하여 상위 N개 반환
        recommendations.sort(key=lambda x: x.score, reverse=True)
        return recommendations[:limit]
    
    def get_popular_policies(self, limit: int = 10) -> List[PolicyRecommendation]:
        """인기 정책 조회 (프로필이 없는 사용자용)"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, title, description, content, url, category,
                   target_age_min, target_age_max, target_gender, target_location,
                   tags, view_count, relevance_score, crawled_at
            FROM policies
            WHERE is_active = 1
            ORDER BY view_count DESC, crawled_at DESC
            LIMIT ?
        """, (limit,))
        
        policies = cursor.fetchall()
        conn.close()
        
        recommendations = []
        for policy_data in policies:
            policy = Policy(
                id=policy_data[0],
                title=policy_data[1],
                description=policy_data[2],
                content=policy_data[3],
                url=policy_data[4],
                category=policy_data[5],
                target_age_min=policy_data[6],
                target_age_max=policy_data[7],
                target_gender=policy_data[8],
                target_location=policy_data[9],
                tags=json.loads(policy_data[10]) if policy_data[10] else [],
                view_count=policy_data[11],
                relevance_score=policy_data[12],
                crawled_at=datetime.fromisoformat(policy_data[13])
            )
            
            recommendations.append(PolicyRecommendation(
                policy=policy,
                score=policy_data[11],  # view_count를 점수로 사용
                reason="인기 정책"
            ))
        
        return recommendations
    
    def _generate_recommendation_reason(self, policy: Dict, user_profile: Dict, user_history: List[str], score: float) -> str:
        """추천 이유 생성"""
        reasons = []
        
        # 나이 기반 추천
        if user_profile.get('age') and policy.get('target_age_min') and policy.get('target_age_max'):
            user_age = user_profile['age']
            if policy['target_age_min'] <= user_age <= policy['target_age_max']:
                reasons.append(f"{user_age}세 대상 정책")
        
        # 카테고리 선호도
        if policy.get('category') in user_history:
            reasons.append(f"관심 분야 ({policy['category']})")
        
        # 생활 유형 매칭
        lifestyle = user_profile.get('lifestyle_type')
        if lifestyle:
            policy_tags = json.loads(policy.get('tags', '[]')) if policy.get('tags') else []
            if lifestyle == 'student' and '학생' in policy_tags:
                reasons.append("학생 대상")
            elif lifestyle == 'worker' and '직장인' in policy_tags:
                reasons.append("직장인 대상")
        
        # 인기도
        if policy.get('view_count', 0) > 20:
            reasons.append("인기 정책")
        
        if not reasons:
            reasons.append("추천 정책")
        
        return " · ".join(reasons)
    
    def record_policy_view(self, user_id: int, policy_id: int):
        """정책 조회 기록"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        try:
            # 조회 기록 추가 (중복 시 무시)
            cursor.execute("""
                INSERT OR IGNORE INTO policy_views (user_id, policy_id)
                VALUES (?, ?)
            """, (user_id, policy_id))
            
            # 정책 조회수 증가
            cursor.execute("""
                UPDATE policies SET view_count = view_count + 1
                WHERE id = ?
            """, (policy_id,))
            
            conn.commit()
        except Exception as e:
            print(f"Error recording policy view: {e}")
        finally:
            conn.close()