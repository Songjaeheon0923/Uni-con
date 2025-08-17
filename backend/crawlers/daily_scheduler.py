import asyncio
import schedule
import time
import logging
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, List
from crawlers.advanced_policy_crawler import AdvancedPolicyCrawler
from database.connection import DATABASE_PATH
import sqlite3


# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('policy_crawler.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class PolicyCrawlerScheduler:
    """정책 크롤링 자동 스케줄러"""
    
    def __init__(self, service_key: str = None):
        self.crawler = AdvancedPolicyCrawler(service_key)
        self.db_path = DATABASE_PATH
        self.is_running = False
        self.last_run_status = None
        
    def get_db_connection(self):
        return sqlite3.connect(self.db_path)
    
    async def run_daily_crawling(self):
        """일일 크롤링 실행"""
        start_time = datetime.now()
        logger.info(f"Starting daily policy crawling at {start_time}")
        
        try:
            # 크롤링 실행
            result = await self.crawler.run_advanced_crawling()
            
            # 실행 결과 로깅
            end_time = datetime.now()
            duration = end_time - start_time
            
            logger.info(f"Daily crawling completed in {duration}")
            logger.info(f"Results: {result}")
            
            # 실행 기록 저장
            self._save_crawling_log(start_time, end_time, result, "SUCCESS")
            
            self.last_run_status = {
                'status': 'SUCCESS',
                'timestamp': end_time.isoformat(),
                'duration': str(duration),
                'result': result
            }
            
            # 통계 업데이트
            self._update_crawling_statistics(result)
            
        except Exception as e:
            end_time = datetime.now()
            duration = end_time - start_time
            
            logger.error(f"Daily crawling failed after {duration}: {str(e)}")
            
            # 실패 기록 저장
            self._save_crawling_log(start_time, end_time, {'error': str(e)}, "FAILED")
            
            self.last_run_status = {
                'status': 'FAILED',
                'timestamp': end_time.isoformat(),
                'duration': str(duration),
                'error': str(e)
            }
    
    def _save_crawling_log(self, start_time: datetime, end_time: datetime, 
                          result: Dict[str, Any], status: str):
        """크롤링 실행 로그 저장"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # 크롤링 로그 테이블 생성 (없는 경우)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS crawling_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    start_time TIMESTAMP NOT NULL,
                    end_time TIMESTAMP NOT NULL,
                    duration_seconds INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    total_crawled INTEGER DEFAULT 0,
                    total_saved INTEGER DEFAULT 0,
                    result_data TEXT,
                    error_message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            duration_seconds = int((end_time - start_time).total_seconds())
            
            cursor.execute("""
                INSERT INTO crawling_logs (
                    start_time, end_time, duration_seconds, status,
                    total_crawled, total_saved, result_data, error_message
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                start_time,
                end_time,
                duration_seconds,
                status,
                result.get('total_crawled', 0),
                result.get('total_saved', 0),
                str(result) if result else None,
                result.get('error') if status == "FAILED" else None
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Failed to save crawling log: {e}")
    
    def _update_crawling_statistics(self, result: Dict[str, Any]):
        """크롤링 통계 업데이트"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # 통계 테이블 생성 (없는 경우)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS crawling_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date DATE UNIQUE NOT NULL,
                    total_crawled INTEGER DEFAULT 0,
                    total_saved INTEGER DEFAULT 0,
                    housing_policies INTEGER DEFAULT 0,
                    api_policies INTEGER DEFAULT 0,
                    removed_duplicates INTEGER DEFAULT 0,
                    deactivated_irrelevant INTEGER DEFAULT 0,
                    success_count INTEGER DEFAULT 0,
                    failure_count INTEGER DEFAULT 0,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            today = datetime.now().date()
            
            # 오늘 통계 업데이트 또는 생성
            cursor.execute("""
                INSERT OR REPLACE INTO crawling_stats (
                    date, total_crawled, total_saved, housing_policies, api_policies,
                    removed_duplicates, deactivated_irrelevant, success_count, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 
                    COALESCE((SELECT success_count FROM crawling_stats WHERE date = ?), 0) + 1,
                    CURRENT_TIMESTAMP
                )
            """, (
                today,
                result.get('total_crawled', 0),
                result.get('total_saved', 0),
                result.get('housing_crawler', {}).get('total_crawled', 0),
                result.get('api_crawler', {}).get('total_collected', 0),
                result.get('removed_duplicates', 0),
                result.get('deactivated_irrelevant', 0),
                today
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Failed to update crawling statistics: {e}")
    
    def get_crawling_statistics(self, days: int = 7) -> List[Dict]:
        """크롤링 통계 조회"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT date, total_crawled, total_saved, housing_policies, api_policies,
                       removed_duplicates, deactivated_irrelevant, success_count, failure_count
                FROM crawling_stats
                WHERE date >= date('now', '-{} days')
                ORDER BY date DESC
            """.format(days))
            
            stats = []
            for row in cursor.fetchall():
                stats.append({
                    'date': row[0],
                    'total_crawled': row[1],
                    'total_saved': row[2],
                    'housing_policies': row[3],
                    'api_policies': row[4],
                    'removed_duplicates': row[5],
                    'deactivated_irrelevant': row[6],
                    'success_count': row[7],
                    'failure_count': row[8]
                })
            
            conn.close()
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get crawling statistics: {e}")
            return []
    
    def cleanup_old_logs(self, days_to_keep: int = 30):
        """오래된 로그 정리"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cutoff_date = datetime.now() - timedelta(days=days_to_keep)
            
            # 오래된 크롤링 로그 삭제
            cursor.execute("""
                DELETE FROM crawling_logs 
                WHERE created_at < ?
            """, (cutoff_date,))
            
            # 오래된 통계 삭제
            cursor.execute("""
                DELETE FROM crawling_stats 
                WHERE date < date('now', '-{} days')
            """.format(days_to_keep))
            
            conn.commit()
            deleted_count = cursor.rowcount
            conn.close()
            
            logger.info(f"Cleaned up {deleted_count} old log entries")
            
        except Exception as e:
            logger.error(f"Failed to cleanup old logs: {e}")
    
    def _run_async_crawling(self):
        """비동기 크롤링을 동기 함수에서 실행"""
        try:
            # 새로운 이벤트 루프 생성 (스케줄러 스레드용)
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # 크롤링 실행
            loop.run_until_complete(self.run_daily_crawling())
            
        except Exception as e:
            logger.error(f"Error in async crawling execution: {e}")
        finally:
            try:
                loop.close()
            except:
                pass
    
    def schedule_crawling(self):
        """크롤링 스케줄 설정"""
        # 매일 오전 6시에 크롤링 실행
        schedule.every().day.at("06:00").do(self._run_async_crawling)
        
        # 매일 오후 6시에 크롤링 실행 (추가)
        schedule.every().day.at("18:00").do(self._run_async_crawling)
        
        # 매주 일요일 오전 3시에 로그 정리
        schedule.every().sunday.at("03:00").do(lambda: self.cleanup_old_logs(30))
        
        logger.info("Crawling scheduler configured:")
        logger.info("- Daily crawling at 06:00 and 18:00")
        logger.info("- Weekly log cleanup on Sunday at 03:00")
    
    def run_scheduler(self):
        """스케줄러 실행 (메인 스레드)"""
        self.schedule_crawling()
        self.is_running = True
        
        logger.info("Policy crawler scheduler started")
        
        # 즉시 한번 실행
        logger.info("Running initial crawling...")
        threading.Thread(target=self._run_async_crawling, daemon=True).start()
        
        # 스케줄러 루프
        while self.is_running:
            try:
                schedule.run_pending()
                time.sleep(60)  # 1분마다 체크
            except KeyboardInterrupt:
                logger.info("Scheduler stopped by user")
                break
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                time.sleep(300)  # 5분 대기 후 재시도
    
    def stop_scheduler(self):
        """스케줄러 중지"""
        self.is_running = False
        logger.info("Scheduler stop requested")
    
    def get_status(self) -> Dict[str, Any]:
        """스케줄러 상태 조회"""
        return {
            'is_running': self.is_running,
            'last_run': self.last_run_status,
            'next_runs': [job.next_run for job in schedule.jobs],
            'total_jobs': len(schedule.jobs)
        }


def main():
    """메인 함수"""
    # 실제 서비스 키 필요 - 환경변수에서 가져오는 것을 권장
    import os
    service_key = os.getenv('PUBLIC_DATA_SERVICE_KEY', 'YOUR_SERVICE_KEY_HERE')
    
    scheduler = PolicyCrawlerScheduler(service_key)
    
    try:
        scheduler.run_scheduler()
    except KeyboardInterrupt:
        logger.info("Scheduler terminated by user")
    except Exception as e:
        logger.error(f"Scheduler failed: {e}")
    finally:
        scheduler.stop_scheduler()


if __name__ == "__main__":
    main()