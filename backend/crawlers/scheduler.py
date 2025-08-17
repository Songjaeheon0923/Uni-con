import schedule
import time
import asyncio
from datetime import datetime
from policy_crawler import PolicyCrawler


class PolicyCrawlerScheduler:
    def __init__(self):
        self.crawler = PolicyCrawler()
        
    async def run_scheduled_crawling(self):
        """스케줄된 크롤링 실행"""
        print(f"[{datetime.now()}] Starting scheduled policy crawling...")
        try:
            result = await self.crawler.run_crawling()
            print(f"[{datetime.now()}] Scheduled crawling completed: {result}")
        except Exception as e:
            print(f"[{datetime.now()}] Error in scheduled crawling: {e}")
    
    def schedule_crawling(self):
        """크롤링 스케줄 설정"""
        # 매일 오전 9시에 크롤링 실행
        schedule.every().day.at("09:00").do(self._run_async_crawling)
        
        # 매주 월요일 오후 2시에 크롤링 실행
        schedule.every().monday.at("14:00").do(self._run_async_crawling)
        
        print("Policy crawling scheduler started:")
        print("- Daily at 09:00")
        print("- Every Monday at 14:00")
    
    def _run_async_crawling(self):
        """비동기 크롤링을 동기 함수에서 실행"""
        try:
            asyncio.run(self.run_scheduled_crawling())
        except Exception as e:
            print(f"Error running async crawling: {e}")
    
    def run_scheduler(self):
        """스케줄러 실행"""
        self.schedule_crawling()
        
        while True:
            schedule.run_pending()
            time.sleep(60)  # 1분마다 체크


def main():
    """스케줄러 메인 함수"""
    scheduler = PolicyCrawlerScheduler()
    
    # 즉시 한번 실행
    print("Running initial crawling...")
    asyncio.run(scheduler.run_scheduled_crawling())
    
    # 스케줄러 시작
    print("Starting scheduler...")
    scheduler.run_scheduler()


if __name__ == "__main__":
    main()