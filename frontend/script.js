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
    const screens = ['main-screen', 'login-form', 'signup-form', 'dashboard', 'matches-section', 'api-test', 'questionnaire-screen'];
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
