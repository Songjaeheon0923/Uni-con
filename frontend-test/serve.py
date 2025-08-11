import http.server
import socketserver
import webbrowser
import os

PORT = 3001

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == "__main__":
    # 현재 디렉토리를 frontend 폴더로 변경
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 프론트엔드 서버가 포트 {PORT}에서 실행중입니다.")
        print(f"🌐 브라우저에서 http://localhost:{PORT} 를 열어주세요.")
        print("🛑 서버를 중지하려면 Ctrl+C를 누르세요.")
        
        # 자동으로 브라우저 열기
        webbrowser.open(f'http://localhost:{PORT}')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n✅ 서버가 종료되었습니다.")
            httpd.shutdown()
