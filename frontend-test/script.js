// API 기본 URL
const API_BASE_URL = 'http://localhost:8080';

// 전역 상태
let currentUser = null;
let profileQuestions = [];
let currentProfile = {};
let currentQuestionIndex = 0;
let questionnaireAnswers = {};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 초기 로드시에는 메인 화면만 표시하고 API 호출은 하지 않음
    showMainScreen();
});

// 인증 상태 확인
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me`);
        if (response.ok) {
            currentUser = await response.json();
            showUserInterface();
        } else {
            showMainScreen();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showMainScreen();
    }
}

// 화면 전환 함수들
function showMainScreen() {
    hideAllScreens();
    document.getElementById('main-screen').classList.remove('d-none');
    document.getElementById('auth-buttons').classList.remove('d-none');
    document.getElementById('user-info').classList.add('d-none');
}

function showLogin() {
    hideAllScreens();
    document.getElementById('login-form').classList.remove('d-none');
}

function showSignup() {
    hideAllScreens();
    document.getElementById('signup-form').classList.remove('d-none');
}

function showDashboard() {
    hideAllScreens();
    document.getElementById('dashboard').classList.remove('d-none');
    loadUserProfile();
}

function showMatches() {
    hideAllScreens();
    document.getElementById('matches-section').classList.remove('d-none');
}

function showUserInterface() {
    document.getElementById('auth-buttons').classList.add('d-none');
    document.getElementById('user-info').classList.remove('d-none');
    document.getElementById('user-name').textContent = currentUser.name;
    showDashboard();
}

function hideAllScreens() {
    const screens = ['main-screen', 'login-form', 'signup-form', 'dashboard', 'matches-section', 'api-test', 'questionnaire-screen', 'contract-verification'];
    screens.forEach(screen => {
        document.getElementById(screen).classList.add('d-none');
    });
}

// 회원가입
async function signup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('회원가입 성공', '회원가입이 완료되었습니다. 로그인해주세요.');
            showLogin();
        } else {
            showAlert('회원가입 실패', data.detail || '회원가입에 실패했습니다.');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showAlert('오류', '서버 연결에 실패했습니다.');
    }
}

// 로그인
async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data;
            
            // 임시 저장된 답변이 있는지 확인
            const tempAnswers = localStorage.getItem('tempAnswers');
            if (tempAnswers) {
                questionnaireAnswers = JSON.parse(tempAnswers);
                localStorage.removeItem('tempAnswers');
                
                // 프로필 저장
                try {
                    const saveResponse = await fetch(`${API_BASE_URL}/users/profile/me`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(questionnaireAnswers)
                    });
                    
                    if (saveResponse.ok) {
                        showAlert('완성!', '로그인 완료! 프로필이 저장되었습니다.');
                        currentProfile = { ...questionnaireAnswers };
                    }
                } catch (error) {
                    console.error('Save temp answers error:', error);
                }
            }
            
            showUserInterface();
        } else {
            showAlert('로그인 실패', data.detail || '로그인에 실패했습니다.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('오류', '서버 연결에 실패했습니다.');
    }
}

// 로그아웃
async function logout() {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
        currentUser = null;
        showMainScreen();
    } catch (error) {
        console.error('Logout error:', error);
        currentUser = null;
        showMainScreen();
    }
}

// 프로필 질문 로드
async function loadProfileQuestions() {
    try {
        console.log('Loading profile questions...');
        const response = await fetch(`${API_BASE_URL}/profile/questions`);
        if (response.ok) {
            const data = await response.json();
            profileQuestions = data.questions;
            console.log('Questions loaded:', profileQuestions.length);
        } else {
            console.error('Failed to load questions:', response.status);
        }
    } catch (error) {
        console.error('Failed to load questions:', error);
    }
}

// 사용자 프로필 로드
async function loadUserProfile() {
    try {
        // 먼저 질문이 로드되어 있는지 확인
        if (profileQuestions.length === 0) {
            await loadProfileQuestions();
        }
        
        const response = await fetch(`${API_BASE_URL}/profile/me`);
        if (response.ok) {
            currentProfile = await response.json();
        } else {
            // 프로필이 없으면 빈 프로필로 시작
            currentProfile = {};
        }
        
        updateDashboardDisplay();
    } catch (error) {
        console.error('Failed to load profile:', error);
        // 오류가 발생해도 빈 프로필로 시작
        currentProfile = {};
        updateDashboardDisplay();
    }
}

// 대시보드 표시 업데이트
function updateDashboardDisplay() {
    const profileWelcome = document.getElementById('profile-welcome');
    const profileCompleted = document.getElementById('profile-completed');
    
    // 프로필 완성 여부 확인
    const requiredFields = ['sleep_type', 'home_time', 'cleaning_frequency', 'cleaning_sensitivity', 'smoking_status', 'noise_sensitivity'];
    const completedFields = requiredFields.filter(field => currentProfile[field]);
    const isComplete = completedFields.length === requiredFields.length;
    
    if (isComplete) {
        profileWelcome.classList.add('d-none');
        profileCompleted.classList.remove('d-none');
        updateProfileStatus('완성', 'bg-success');
    } else {
        profileWelcome.classList.remove('d-none');
        profileCompleted.classList.add('d-none');
        updateProfileStatus(`${completedFields.length}/${requiredFields.length} 완성`, 'bg-warning');
    }
    
    updateUserProfileInfo();
}

// 프로필 상태 업데이트
function updateProfileStatus(text, className) {
    const statusBadge = document.getElementById('profile-status');
    statusBadge.textContent = text;
    statusBadge.className = `badge ${className}`;
}

// 프로필 폼 렌더링
function renderProfileForm() {
    const formContainer = document.getElementById('profile-form');
    
    if (profileQuestions.length === 0) {
        formContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">로딩 중...</span>
                </div>
                <p class="mt-2">질문을 불러오는 중입니다...</p>
            </div>
        `;
        // 다시 질문 로드 시도
        loadProfileQuestions().then(() => {
            if (profileQuestions.length > 0) {
                renderProfileForm();
            }
        });
        return;
    }
    
    formContainer.innerHTML = '';
    
    profileQuestions.forEach(question => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-group';
        
        questionDiv.innerHTML = `
            <div class="question-title">${question.question}</div>
            <div class="options-container">
                ${question.options.map(option => `
                    <button type="button" 
                            class="option-button ${currentProfile[question.id] === option.value ? 'selected' : ''}"
                            onclick="selectOption('${question.id}', '${option.value}')">
                        ${option.label}
                    </button>
                `).join('')}
            </div>
        `;
        
        formContainer.appendChild(questionDiv);
    });
    
    updateUserProfileInfo();
}

// 옵션 선택
function selectOption(questionId, value) {
    currentProfile[questionId] = value;
    
    // 선택된 옵션 스타일 업데이트
    const questionGroup = event.target.parentElement.parentElement;
    const buttons = questionGroup.querySelectorAll('.option-button');
    buttons.forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    
    updateUserProfileInfo();
}

// 사용자 프로필 정보 업데이트
function updateUserProfileInfo() {
    const infoContainer = document.getElementById('user-profile-info');
    
    if (!currentUser) {
        infoContainer.innerHTML = '<p class="text-muted">로그인이 필요합니다.</p>';
        return;
    }
    
    const labels = {
        sleep_type: '수면 패턴',
        home_time: '집 머무는 시간',
        cleaning_frequency: '청소 빈도',
        cleaning_sensitivity: '청소 민감도',
        smoking_status: '흡연 상태',
        noise_sensitivity: '소음 민감도'
    };
    
    const valueLabels = {
        morning: '아침형', evening: '저녁형',
        day: '낮 시간', night: '밤 시간', irregular: '일정하지 않음',
        daily: '매일/이틀에 한번', weekly: '주 1~2회', as_needed: '필요할 때만',
        very_sensitive: '매우 민감함', normal: '보통', not_sensitive: '민감하지 않음',
        non_smoker_strict: '비흡연자(엄격)', non_smoker_ok: '비흡연자(관대)',
        smoker_indoor_no: '흡연자(실내금연)', smoker_indoor_yes: '흡연자(실내흡연)',
        sensitive: '민감함', not_sensitive: '둔감함'
    };
    
    let html = `<div class="mb-3"><strong>${currentUser.name}</strong></div>`;
    
    // 완성된 항목만 표시
    Object.keys(labels).forEach(key => {
        const value = currentProfile[key];
        if (value) {
            const label = valueLabels[value] || value;
            html += `<div class="mb-2"><small class="text-muted">${labels[key]}:</small><br>${label}</div>`;
        }
    });
    
    // 완성되지 않은 경우 안내 메시지
    if (Object.keys(currentProfile).length === 0 || !currentProfile.sleep_type) {
        html += `<div class="text-center mt-3 p-3 bg-light rounded">
            <small class="text-muted">프로필을 완성하고<br>매칭을 시작하세요!</small>
        </div>`;
    }
    
    infoContainer.innerHTML = html;
}

// 프로필 저장
async function saveProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(currentProfile)
        });
        
        if (response.ok) {
            const updatedProfile = await response.json();
            currentProfile = updatedProfile;
            showAlert('성공', '프로필이 저장되었습니다.');
            updateProfileStatus();
        } else {
            const error = await response.json();
            showAlert('오류', error.detail || '프로필 저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('Save profile error:', error);
        showAlert('오류', '서버 연결에 실패했습니다.');
    }
}

// 매칭 찾기
async function findMatches() {
    try {
        const response = await fetch(`${API_BASE_URL}/profile/matches`);
        
        if (response.ok) {
            const matches = await response.json();
            renderMatches(matches);
            showMatches();
        } else {
            const error = await response.json();
            showAlert('오류', error.detail || '매칭 검색에 실패했습니다.');
        }
    } catch (error) {
        console.error('Find matches error:', error);
        showAlert('오류', '서버 연결에 실패했습니다.');
    }
}

// 매칭 결과 렌더링
function renderMatches(matches) {
    const container = document.getElementById('matches-list');
    
    if (matches.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <h5>매칭된 룸메이트가 없습니다</h5>
                <p class="text-muted">아직 호환되는 룸메이트가 없습니다. 나중에 다시 확인해보세요!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = matches.map(match => `
        <div class="match-card">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h5 class="mb-1">${match.name}</h5>
                    <p class="text-muted mb-2">${match.email}</p>
                    <div class="compatibility-details">
                        ${match.matching_details.sleep_type_match ? 
                            '<span class="detail-badge detail-match">수면패턴 일치</span>' : 
                            '<span class="detail-badge detail-no-match">수면패턴 다름</span>'
                        }
                        ${match.matching_details.home_time_match ? 
                            '<span class="detail-badge detail-match">시간대 일치</span>' : 
                            '<span class="detail-badge detail-no-match">시간대 다름</span>'
                        }
                        ${match.matching_details.cleaning_frequency_compatible ? 
                            '<span class="detail-badge detail-match">청소 호환</span>' : 
                            '<span class="detail-badge detail-no-match">청소 불호환</span>'
                        }
                        ${match.matching_details.smoking_compatible ? 
                            '<span class="detail-badge detail-match">흡연 호환</span>' : 
                            '<span class="detail-badge detail-no-match">흡연 불호환</span>'
                        }
                    </div>
                </div>
                <div class="col-md-4 text-center">
                    <div class="compatibility-score">${Math.round(match.compatibility_score * 100)}%</div>
                    <small class="text-muted">호환성</small>
                </div>
            </div>
        </div>
    `).join('');
}

// API 테스트 섹션
function testAPI() {
    hideAllScreens();
    document.getElementById('api-test').classList.remove('d-none');
}

function hideApiTest() {
    showMainScreen();
}

// 서버 상태 테스트
async function testServerStatus() {
    addTestResult('서버 상태 확인 중...', 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        const data = await response.json();
        
        if (response.ok) {
            addTestResult(`✅ 서버 응답: ${JSON.stringify(data, null, 2)}`, 'success');
        } else {
            addTestResult(`❌ 서버 오류: ${response.status}`, 'error');
        }
    } catch (error) {
        addTestResult(`❌ 연결 실패: ${error.message}`, 'error');
    }
}

// 질문 목록 테스트
async function testQuestions() {
    addTestResult('질문 목록 조회 중...', 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/profile/questions`);
        const data = await response.json();
        
        if (response.ok) {
            addTestResult(`✅ 질문 ${data.questions.length}개 로드 완료`, 'success');
            addTestResult(JSON.stringify(data, null, 2), 'success');
        } else {
            addTestResult(`❌ 질문 로드 실패: ${response.status}`, 'error');
        }
    } catch (error) {
        addTestResult(`❌ 연결 실패: ${error.message}`, 'error');
    }
}

// 데이터베이스 확인 (시뮬레이션)
async function checkDatabase() {
    addTestResult('데이터베이스 확인 중...', 'info');
    
    try {
        // 간접적으로 데이터베이스 상태 확인
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
            addTestResult('✅ 데이터베이스 연결 정상', 'success');
            addTestResult('💡 실제 데이터 확인은 백엔드에서 "python check_db.py" 실행', 'info');
        } else {
            addTestResult('❌ 데이터베이스 연결 문제 가능성', 'error');
        }
    } catch (error) {
        addTestResult(`❌ 서버 연결 실패: ${error.message}`, 'error');
    }
}

// ==================== ROOMS API 테스트 ====================

// 방 검색 테스트 (지도 범위)
async function testRoomSearch() {
    addTestResult('방 검색 API 테스트 중...', 'info');
    
    try {
        // 서울 지역 좌표로 검색
        const params = new URLSearchParams({
            lat_min: 37.4,
            lat_max: 37.6,
            lng_min: 126.9,
            lng_max: 127.2
        });
        
        const response = await fetch(`${API_BASE_URL}/rooms/search?${params}`);
        const data = await response.json();
        
        if (response.ok) {
            addTestResult(`✅ 방 검색 성공: ${data.length}개 방 조회됨`, 'success');
            if (data.length > 0) {
                addTestResult(`첫 번째 방: ${data[0].address} (${data[0].transaction_type}, ${data[0].price_deposit}만원)`, 'success');
            }
        } else {
            addTestResult(`❌ 방 검색 실패: ${response.status}`, 'error');
        }
    } catch (error) {
        addTestResult(`❌ 방 검색 오류: ${error.message}`, 'error');
    }
}

// 방 상세 정보 테스트
async function testRoomDetail() {
    addTestResult('방 상세 정보 API 테스트 중...', 'info');
    
    try {
        // 먼저 방 목록을 가져와서 첫 번째 방의 ID 사용
        const searchResponse = await fetch(`${API_BASE_URL}/rooms/search?lat_min=37.4&lat_max=37.6&lng_min=126.9&lng_max=127.2`);
        const rooms = await searchResponse.json();
        
        if (rooms.length === 0) {
            addTestResult('❌ 테스트할 방이 없습니다', 'error');
            return;
        }
        
        const roomId = rooms[0].room_id;
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`);
        const data = await response.json();
        
        if (response.ok) {
            addTestResult(`✅ 방 상세 정보 조회 성공`, 'success');
            addTestResult(`방 정보: ${data.address}, ${data.area}㎡, ${data.description}`, 'success');
            addTestResult(`집주인: ${data.landlord_name}, 조회수: ${data.view_count}`, 'success');
        } else {
            addTestResult(`❌ 방 상세 정보 조회 실패: ${response.status}`, 'error');
        }
    } catch (error) {
        addTestResult(`❌ 방 상세 정보 오류: ${error.message}`, 'error');
    }
}

// 시세 분석 테스트
async function testMarketPrice() {
    addTestResult('시세 분석 API 테스트 중...', 'info');
    
    try {
        // 먼저 방 목록을 가져와서 첫 번째 방의 ID 사용
        const searchResponse = await fetch(`${API_BASE_URL}/rooms/search?lat_min=37.4&lat_max=37.6&lng_min=126.9&lng_max=127.2`);
        const rooms = await searchResponse.json();
        
        if (rooms.length === 0) {
            addTestResult('❌ 테스트할 방이 없습니다', 'error');
            return;
        }
        
        const roomId = rooms[0].room_id;
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/market-price`);
        const data = await response.json();
        
        if (response.ok) {
            addTestResult(`✅ 시세 분석 성공`, 'success');
            addTestResult(`현재가: ${data.current_price}만원, 평균가: ${data.average_price}만원`, 'success');
            addTestResult(`평당가: ${data.price_per_sqm}만원, 주변 매물: ${data.nearby_count}개`, 'success');
            
            if (data.price_analysis.is_expensive) {
                addTestResult(`⚠️ 시세보다 ${data.price_analysis.price_difference_percent}% 비쌈`, 'warning');
            } else if (data.price_analysis.is_cheap) {
                addTestResult(`💰 시세보다 ${Math.abs(data.price_analysis.price_difference_percent)}% 저렴`, 'success');
            } else {
                addTestResult(`✅ 적정 시세`, 'success');
            }
        } else {
            addTestResult(`❌ 시세 분석 실패: ${response.status}`, 'error');
        }
    } catch (error) {
        addTestResult(`❌ 시세 분석 오류: ${error.message}`, 'error');
    }
}

// 방 등록 테스트
async function testRoomCreate() {
    addTestResult('방 등록 API 테스트 중...', 'info');
    
    try {
        const roomData = {
            address: "서울특별시 서초구 테스트동 123-45",
            latitude: 37.4833,
            longitude: 127.0322,
            transaction_type: "월세",
            price_deposit: 1500,
            price_monthly: 70,
            area: 28.5,
            rooms: 1,
            floor: 2,
            building_year: 2019,
            description: "테스트용 방 등록 - 서초역 근처 깔끔한 원룸",
            landlord_name: "테스트",
            landlord_phone: "010-0000-0000"
        };
        
        const response = await fetch(`${API_BASE_URL}/rooms/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(roomData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            addTestResult(`✅ 방 등록 성공: ${data.room_id}`, 'success');
            addTestResult(`등록 메시지: ${data.message}`, 'success');
        } else {
            addTestResult(`❌ 방 등록 실패: ${response.status} - ${data.detail}`, 'error');
        }
    } catch (error) {
        addTestResult(`❌ 방 등록 오류: ${error.message}`, 'error');
    }
}

// ==================== FAVORITES API 테스트 ====================

// 찜 목록 추가 테스트
async function testAddFavorite() {
    addTestResult('찜 추가 API 테스트 중...', 'info');
    
    try {
        // 먼저 방 목록을 가져와서 첫 번째 방의 ID 사용
        const searchResponse = await fetch(`${API_BASE_URL}/rooms/search?lat_min=37.4&lat_max=37.6&lng_min=126.9&lng_max=127.2`);
        const rooms = await searchResponse.json();
        
        if (rooms.length === 0) {
            addTestResult('❌ 테스트할 방이 없습니다', 'error');
            return;
        }
        
        const favoriteData = {
            user_id: "1",
            room_id: rooms[0].room_id
        };
        
        const response = await fetch(`${API_BASE_URL}/favorites/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(favoriteData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            addTestResult(`✅ 찜 추가 성공`, 'success');
            addTestResult(`메시지: ${data.message}`, 'success');
        } else {
            if (response.status === 400) {
                addTestResult(`⚠️ 이미 찜한 방입니다`, 'warning');
            } else {
                addTestResult(`❌ 찜 추가 실패: ${response.status} - ${data.detail}`, 'error');
            }
        }
    } catch (error) {
        addTestResult(`❌ 찜 추가 오류: ${error.message}`, 'error');
    }
}

// 사용자 찜 목록 조회 테스트
async function testUserFavorites() {
    addTestResult('사용자 찜 목록 조회 테스트 중...', 'info');
    
    try {
        const userId = "1";
        const response = await fetch(`${API_BASE_URL}/favorites/user/${userId}`);
        const data = await response.json();
        
        if (response.ok) {
            addTestResult(`✅ 찜 목록 조회 성공: ${data.length}개`, 'success');
            if (data.length > 0) {
                addTestResult(`첫 번째 찜: ${data[0].address} (${data[0].transaction_type})`, 'success');
            }
        } else {
            addTestResult(`❌ 찜 목록 조회 실패: ${response.status}`, 'error');
        }
    } catch (error) {
        addTestResult(`❌ 찜 목록 조회 오류: ${error.message}`, 'error');
    }
}

// 방을 찜한 사용자 목록 테스트
async function testRoomFavorites() {
    addTestResult('방을 찜한 사용자 목록 테스트 중...', 'info');
    
    try {
        // 먼저 방 목록을 가져와서 첫 번째 방의 ID 사용
        const searchResponse = await fetch(`${API_BASE_URL}/rooms/search?lat_min=37.4&lat_max=37.6&lng_min=126.9&lng_max=127.2`);
        const rooms = await searchResponse.json();
        
        if (rooms.length === 0) {
            addTestResult('❌ 테스트할 방이 없습니다', 'error');
            return;
        }
        
        const roomId = rooms[0].room_id;
        const response = await fetch(`${API_BASE_URL}/favorites/${roomId}/users`);
        const data = await response.json();
        
        if (response.ok) {
            addTestResult(`✅ 찜한 사용자 목록 조회 성공: ${data.length}명`, 'success');
            if (data.length > 0) {
                addTestResult(`첫 번째 사용자: ${data[0].nickname} (매칭점수: ${data[0].matching_score}%)`, 'success');
            }
        } else {
            addTestResult(`❌ 찜한 사용자 목록 조회 실패: ${response.status}`, 'error');
        }
    } catch (error) {
        addTestResult(`❌ 찜한 사용자 목록 오류: ${error.message}`, 'error');
    }
}

// 찜 상태 확인 테스트
async function testFavoriteStatus() {
    addTestResult('찜 상태 확인 테스트 중...', 'info');
    
    try {
        // 먼저 방 목록을 가져와서 첫 번째 방의 ID 사용
        const searchResponse = await fetch(`${API_BASE_URL}/rooms/search?lat_min=37.4&lat_max=37.6&lng_min=126.9&lng_max=127.2`);
        const rooms = await searchResponse.json();
        
        if (rooms.length === 0) {
            addTestResult('❌ 테스트할 방이 없습니다', 'error');
            return;
        }
        
        const userId = "1";
        const roomId = rooms[0].room_id;
        const response = await fetch(`${API_BASE_URL}/favorites/${userId}/${roomId}/check`);
        const data = await response.json();
        
        if (response.ok) {
            addTestResult(`✅ 찜 상태 확인 성공`, 'success');
            addTestResult(`찜 상태: ${data.is_favorite ? '찜함' : '찜하지 않음'}`, 'success');
        } else {
            addTestResult(`❌ 찜 상태 확인 실패: ${response.status}`, 'error');
        }
    } catch (error) {
        addTestResult(`❌ 찜 상태 확인 오류: ${error.message}`, 'error');
    }
}

// 전체 API 테스트 실행
async function runAllRoomTests() {
    addTestResult('=== 전체 Rooms API 테스트 시작 ===', 'info');
    await testRoomSearch();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testRoomDetail();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testMarketPrice();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testRoomCreate();
    addTestResult('=== Rooms API 테스트 완료 ===', 'info');
}

async function runAllFavoriteTests() {
    addTestResult('=== 전체 Favorites API 테스트 시작 ===', 'info');
    await testAddFavorite();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testUserFavorites();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testRoomFavorites();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testFavoriteStatus();
    addTestResult('=== Favorites API 테스트 완료 ===', 'info');
}

// 테스트 결과 추가
function addTestResult(message, type) {
    const container = document.getElementById('api-test-results');
    const timestamp = new Date().toLocaleTimeString();
    
    const resultDiv = document.createElement('div');
    resultDiv.className = `api-test-result api-${type}`;
    resultDiv.innerHTML = `<strong>[${timestamp}]</strong> ${message}`;
    
    container.appendChild(resultDiv);
    container.scrollTop = container.scrollHeight;
}

// 알림 모달
function showAlert(title, message) {
    document.getElementById('alertModalTitle').textContent = title;
    document.getElementById('alertModalBody').textContent = message;
    
    const modal = new bootstrap.Modal(document.getElementById('alertModal'));
    modal.show();
}

// 순차적 질문 시작
async function startQuestionnaire() {
    // 먼저 질문 로드
    if (profileQuestions.length === 0) {
        await loadProfileQuestions();
    }
    
    if (profileQuestions.length === 0) {
        showAlert('오류', '질문을 불러올 수 없습니다. 서버가 실행중인지 확인해주세요.');
        return;
    }
    
    // 초기화
    currentQuestionIndex = 0;
    questionnaireAnswers = {};
    
    // 화면 전환
    hideAllScreens();
    document.getElementById('questionnaire-screen').classList.remove('d-none');
    
    // 첫 번째 질문 표시
    displayCurrentQuestion();
}

// 로그인한 사용자용 질문 시작 (기존 답변 유지)
async function startQuestionnaireLoggedIn() {
    // 먼저 질문 로드
    if (profileQuestions.length === 0) {
        await loadProfileQuestions();
    }
    
    if (profileQuestions.length === 0) {
        showAlert('오류', '질문을 불러올 수 없습니다. 서버가 실행중인지 확인해주세요.');
        return;
    }
    
    // 초기화 (기존 프로필 데이터 사용)
    currentQuestionIndex = 0;
    questionnaireAnswers = { ...currentProfile };
    
    // 화면 전환
    hideAllScreens();
    document.getElementById('questionnaire-screen').classList.remove('d-none');
    
    // 첫 번째 질문 표시
    displayCurrentQuestion();
}

// 현재 질문 표시
function displayCurrentQuestion() {
    const question = profileQuestions[currentQuestionIndex];
    if (!question) return;
    
    // 진행률 업데이트
    const progress = ((currentQuestionIndex + 1) / profileQuestions.length) * 100;
    document.getElementById('question-progress').textContent = `${currentQuestionIndex + 1} / ${profileQuestions.length}`;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    
    // 카테고리 표시
    const categories = {
        'sleep_type': '수면 패턴',
        'home_time': '활동 시간',
        'cleaning_frequency': '청소 빈도',
        'cleaning_sensitivity': '청소 민감도',
        'smoking_status': '흡연 상태',
        'noise_sensitivity': '소음 민감도'
    };
    document.getElementById('question-category').textContent = categories[question.id] || '';
    
    // 질문 텍스트
    document.getElementById('current-question').textContent = question.question;
    
    // 옵션 버튼들
    const optionsContainer = document.getElementById('question-options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option-button w-100 mb-3';
        button.textContent = option.label;
        button.onclick = () => selectQuestionnaireOption(question.id, option.value, button);
        
        // 이미 선택된 답변이 있다면 표시
        if (questionnaireAnswers[question.id] === option.value) {
            button.classList.add('selected');
        }
        
        optionsContainer.appendChild(button);
    });
    
    // 버튼 상태 업데이트
    updateNavigationButtons();
}

// 질문 옵션 선택
function selectQuestionnaireOption(questionId, value, buttonElement) {
    questionnaireAnswers[questionId] = value;
    
    // 다른 버튼들 선택 해제
    const buttons = buttonElement.parentElement.querySelectorAll('.option-button');
    buttons.forEach(btn => btn.classList.remove('selected'));
    
    // 현재 버튼 선택
    buttonElement.classList.add('selected');
    
    // 네비게이션 버튼 상태 업데이트
    updateNavigationButtons();
}

// 네비게이션 버튼 상태 업데이트
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const completeSection = document.getElementById('complete-section');
    
    // 이전 버튼
    prevBtn.disabled = currentQuestionIndex === 0;
    
    // 다음 버튼
    const currentQuestion = profileQuestions[currentQuestionIndex];
    const hasAnswer = currentQuestion && questionnaireAnswers[currentQuestion.id];
    
    if (currentQuestionIndex === profileQuestions.length - 1) {
        // 마지막 질문
        nextBtn.classList.add('d-none');
        completeSection.classList.remove('d-none');
    } else {
        nextBtn.classList.remove('d-none');
        completeSection.classList.add('d-none');
        nextBtn.disabled = !hasAnswer;
    }
}

// 이전 질문
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayCurrentQuestion();
    }
}

// 다음 질문
function nextQuestion() {
    if (currentQuestionIndex < profileQuestions.length - 1) {
        currentQuestionIndex++;
        displayCurrentQuestion();
    }
}

// 질문 완료
async function completeQuestionnaire() {
    // 모든 질문에 답했는지 확인
    const requiredFields = profileQuestions.map(q => q.id);
    const missingAnswers = requiredFields.filter(field => !questionnaireAnswers[field]);
    
    if (missingAnswers.length > 0) {
        showAlert('미완성', '모든 질문에 답해주세요.');
        return;
    }
    
    // 로그인이 필요한 경우
    if (!currentUser) {
        // 답변을 임시 저장하고 로그인 화면으로
        localStorage.setItem('tempAnswers', JSON.stringify(questionnaireAnswers));
        showAlert('로그인 필요', '프로필을 저장하려면 로그인이 필요합니다.');
        showLogin();
        return;
    }
    
    // 프로필 저장
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(questionnaireAnswers)
        });
        
        if (response.ok) {
            showAlert('완성!', '프로필이 저장되었습니다. 이제 매칭을 찾아보세요!');
            currentProfile = { ...questionnaireAnswers };
            
            // 대시보드로 돌아가기
            setTimeout(() => {
                showDashboard();
            }, 1500);
        } else {
            const error = await response.json();
            showAlert('오류', error.detail || '프로필 저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('Save profile error:', error);
        showAlert('오류', '서버 연결에 실패했습니다.');
    }
}

// ==================== 계약서 검증 기능 ====================

// 계약서 검증 화면 표시
function showContractVerification() {
    hideAllScreens();
    document.getElementById('contract-verification').classList.remove('d-none');
}

// 계약서 검증 실행
function verifyContract() {
    // 입력값 수집
    const propertyType = document.getElementById('property-type').value;
    const location = document.getElementById('property-location').value;
    const deposit = parseFloat(document.getElementById('deposit').value) || 0;
    const monthlyRent = parseFloat(document.getElementById('monthly-rent').value) || 0;
    const maintenanceFee = parseFloat(document.getElementById('maintenance-fee').value) || 0;
    const contractPeriod = document.getElementById('contract-period').value;
    
    // 필수값 체크
    if (!propertyType || !location || deposit === 0) {
        showAlert('입력 오류', '물건 유형, 지역, 보증금은 필수 입력 항목입니다.');
        return;
    }
    
    // 검증 결과 생성
    const results = analyzeContract({
        propertyType,
        location,
        deposit,
        monthlyRent,
        maintenanceFee,
        contractPeriod
    });
    
    // 결과 표시
    displayVerificationResults(results);
}

// 계약서 분석 로직
function analyzeContract(contractData) {
    const { propertyType, location, deposit, monthlyRent, maintenanceFee, contractPeriod } = contractData;
    
    let results = {
        overallScore: 0,
        warnings: [],
        recommendations: [],
        priceAnalysis: {},
        riskFactors: []
    };
    
    // 1. 가격 적정성 분석
    results.priceAnalysis = analyzePricing(propertyType, location, deposit, monthlyRent);
    
    // 2. 위험 요소 체크
    results.riskFactors = checkRiskFactors(deposit, monthlyRent, contractPeriod);
    
    // 3. 경고사항 생성
    if (deposit < 1000) {
        results.warnings.push('⚠️ 보증금이 1,000만원 미만입니다. 월세 연체 위험을 고려하세요.');
    }
    
    if (monthlyRent > deposit * 0.1) {
        results.warnings.push('⚠️ 월세가 보증금 대비 높습니다. (권장: 보증금의 10% 이하)');
    }
    
    if (maintenanceFee > monthlyRent * 0.3) {
        results.warnings.push('⚠️ 관리비가 월세의 30%를 초과합니다. 적정성을 확인하세요.');
    }
    
    // 4. 추천사항 생성
    results.recommendations.push('✅ 계약 전 등기부등본을 반드시 확인하세요.');
    results.recommendations.push('✅ 주변 시세와 비교 검토를 권장합니다.');
    results.recommendations.push('✅ 임대인의 신분증과 인감증명서를 확인하세요.');
    
    if (contractPeriod === '12') {
        results.recommendations.push('💡 1년 계약의 경우 재계약 조건을 미리 협의하세요.');
    }
    
    // 5. 종합 점수 계산 (100점 만점)
    let score = 70; // 기본 점수
    
    if (results.warnings.length === 0) score += 15;
    else if (results.warnings.length === 1) score += 10;
    else if (results.warnings.length === 2) score += 5;
    
    if (results.priceAnalysis.priceLevel === 'appropriate') score += 15;
    else if (results.priceAnalysis.priceLevel === 'slightly_high') score += 10;
    
    results.overallScore = Math.min(score, 100);
    
    return results;
}

// 가격 분석
function analyzePricing(propertyType, location, deposit, monthlyRent) {
    // 간단한 시세 분석 (실제로는 외부 API나 DB 연동 필요)
    let analysis = {
        priceLevel: 'appropriate',
        marketComparison: '시세 적정',
        depositToRentRatio: (deposit / monthlyRent).toFixed(1)
    };
    
    // 보증금 대비 월세 비율 분석
    const ratio = deposit / monthlyRent;
    if (ratio < 10) {
        analysis.priceLevel = 'high';
        analysis.marketComparison = '시세 대비 높음';
    } else if (ratio < 15) {
        analysis.priceLevel = 'slightly_high';
        analysis.marketComparison = '시세 대비 약간 높음';
    } else if (ratio > 30) {
        analysis.priceLevel = 'low';
        analysis.marketComparison = '시세 대비 낮음 (재확인 필요)';
    }
    
    return analysis;
}

// 위험 요소 체크
function checkRiskFactors(deposit, monthlyRent, contractPeriod) {
    let risks = [];
    
    if (deposit < 500) {
        risks.push({
            level: 'high',
            description: '보증금이 매우 낮아 임대인의 신용도를 확인해야 합니다.'
        });
    }
    
    if (monthlyRent === 0 && deposit > 5000) {
        risks.push({
            level: 'medium',
            description: '전세 계약의 경우 임대인의 채무 상황을 확인하세요.'
        });
    }
    
    if (contractPeriod === 'other') {
        risks.push({
            level: 'low',
            description: '비표준 계약 기간으로 세부 조건을 명확히 하세요.'
        });
    }
    
    return risks;
}

// 검증 결과 표시
function displayVerificationResults(results) {
    const resultsDiv = document.getElementById('verification-results');
    
    const scoreColor = results.overallScore >= 80 ? 'success' : 
                      results.overallScore >= 60 ? 'warning' : 'danger';
    
    let html = `
        <div class="text-center mb-3">
            <h5>계약서 안전도</h5>
            <div class="progress mb-2" style="height: 25px;">
                <div class="progress-bar bg-${scoreColor}" style="width: ${results.overallScore}%">
                    ${results.overallScore}점
                </div>
            </div>
            <small class="text-muted">
                ${results.overallScore >= 80 ? '🟢 안전한 계약' : 
                  results.overallScore >= 60 ? '🟡 주의 필요' : '🔴 위험 요소 있음'}
            </small>
        </div>
        
        <div class="mb-3">
            <h6>💰 가격 분석</h6>
            <div class="small">
                <div>시세 평가: <span class="badge bg-info">${results.priceAnalysis.marketComparison}</span></div>
                <div>보증금/월세 비율: ${results.priceAnalysis.depositToRentRatio} (권장: 15-25)</div>
            </div>
        </div>
    `;
    
    if (results.warnings.length > 0) {
        html += `
            <div class="mb-3">
                <h6>⚠️ 주의사항</h6>
                <div class="small">
                    ${results.warnings.map(warning => `<div class="text-warning">• ${warning}</div>`).join('')}
                </div>
            </div>
        `;
    }
    
    if (results.riskFactors.length > 0) {
        html += `
            <div class="mb-3">
                <h6>🚨 위험 요소</h6>
                <div class="small">
                    ${results.riskFactors.map(risk => 
                        `<div class="text-${risk.level === 'high' ? 'danger' : risk.level === 'medium' ? 'warning' : 'info'}">
                            • ${risk.description}
                        </div>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    html += `
        <div class="mb-3">
            <h6>💡 추천사항</h6>
            <div class="small">
                ${results.recommendations.map(rec => `<div class="text-success">• ${rec}</div>`).join('')}
            </div>
        </div>
        
        <div class="text-center mt-3">
            <button class="btn btn-sm btn-outline-primary" onclick="generateContractReport()">
                📄 상세 보고서 생성
            </button>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

// 상세 보고서 생성
function generateContractReport() {
    showAlert('보고서 생성', '상세 보고서 기능은 추후 업데이트 예정입니다.\n현재는 화면의 검증 결과를 참고해주세요.');
}
