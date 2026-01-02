// ==========================================
// 1. 편지 내용 설정
// ==========================================
const letterContent = [
    { text: "할머니, 안녕하세요!! 할머니의 막내 아들 둘째 딸인 효빈이에요!" },
    { text: "시간이 많이 흘러서 벌써 할머니의 네 번째 스무 살이 찾아왔네요." },
    { text: "먼저 생신 진심으로 축하드려요. 이 세상에 태어나주셔서 감사합니다!" },
    { text: "저희가 어렸을 때 짧지 않은 시간 동안 키워주신 거 잊지 않고 있어요. 항상 감사해하고 있습니다." },
    { text: "저희 키우시느라 힘든 점도 많으셨겠죠. 저희가 속 썩였을 때도 있었을 거예요." },
    { text: "그럼에도 저희의 어린 시절을 부족함 없이 예쁘게 꽃 피워주셔서 감사합니다." },
    { text: "매일 전화한다고 해놓고 가끔 해서 죄송해요. 앞으로 더 자주 연락드릴게요. 약속해요!" },
    { text: "이 웹사이트는 제가 직접 만들었습니다. 가족 몰래 밤새워서 만들었어요!" },
    { text: "어서 늦게 일어난다고 맨날 꾸중 내셨던 저희 막내 아드님께 한 마디를 부탁드려요ㅎㅎ", extraDelay: 2500 },
    { text: "새삼 할머니께서 계셔서 저희 가족들이 이 자리에 있을 수 있게 됨을 느낍니다." },
    { text: "다시 한번 저희 가족 곁에 있어 주셔서 감사하고, 태어나 주셔서 감사합니다!" },
    { text: "항상 건강하세요! 팔순 축하드립니다." },
    { text: "- 김효빈 올림 -" }
];

// 설정 변수
const READ_SPEED = 180; 
let isTTSOn = false; // 기본은 꺼짐 (선택 사항)
let currentStep = 0;
let letterTimer = null;
let isFinished = false;

// DOM 요소
const introScreen = document.getElementById('intro-screen');
const letterScreen = document.getElementById('letter-screen');
const transitionScreen = document.getElementById('transition-screen');
const guestbookScreen = document.getElementById('guestbook-screen');
const letterText = document.getElementById('letter-text');
const audio = document.getElementById('bgm-audio');
const skipBtn = document.getElementById('skip-btn');
const goToGuestbookBtn = document.getElementById('go-to-guestbook-btn');
const ttsBtn = document.getElementById('tts-toggle-btn');

// ==========================================
// 2. 파이어베이스 설정 (연결 완료!)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBePub3a6FbLeAwnQhTbDlj6KGtenE2l9A",
  authDomain: "grandma-80-39e4b.firebaseapp.com",
  projectId: "grandma-80-39e4b",
  storageBucket: "grandma-80-39e4b.firebasestorage.app",
  messagingSenderId: "175402158690",
  appId: "1:175402158690:web:b2dc59e9a34f16c6c7df3b"
};

let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("파이어베이스 연결 성공!");
} catch (e) { 
    console.log("DB 연결 오류:", e); 
}

// ==========================================
// 3. 메인 로직 (가족용 바로가기 기능 추가됨)
// ==========================================

window.onload = () => { 
    // 모바일 볼륨 설정 에러 방지
    try { audio.volume = 1.0; } catch(e) {}

    // ★ [추가된 부분] 주소창에 #guestbook이 있는지 확인
    if (window.location.hash === '#guestbook') {
        // 1. 앞 단계 화면들 모두 숨기기
        introScreen.classList.add('hidden');
        letterScreen.classList.add('hidden');
        transitionScreen.classList.add('hidden');
        
        // 2. 방명록 화면 바로 보여주기
        guestbookScreen.classList.remove('hidden');
        
        // 3. 데이터 불러오기 및 폭죽
        loadGuestbook();
        safeFireConfetti();
        
        console.log("가족용 방명록 모드로 진입했습니다.");
    }
};

// 시작 버튼
document.getElementById('start-btn').addEventListener('click', () => {
    introScreen.classList.add('hidden');
    letterScreen.classList.remove('hidden');
    
    // 오디오 재생 (실패해도 앱은 계속 작동)
    audio.play().catch(e => console.log("BGM 자동재생 차단됨 (사용자 터치 필요)"));
    
    setTimeout(showNextSentence, 800);
    safeFireConfetti();
});

// 건너뛰기 버튼 (모바일 멈춤 해결됨)
skipBtn.addEventListener('click', (e) => {
    e.preventDefault();
    finishLetter();
});

// ★ TTS(음성) 토글 버튼 (모바일 깨우기 적용)
ttsBtn.addEventListener('click', () => {
    isTTSOn = !isTTSOn;
    
    if (isTTSOn) {
        ttsBtn.innerText = "🔊 소리 끄기";
        // [중요] 모바일 브라우저 깨우기 (빈 소리 재생)
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const wakeUp = new SpeechSynthesisUtterance('');
            window.speechSynthesis.speak(wakeUp);
        }
    } else {
        ttsBtn.innerText = "🔈 소리 켜기";
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
});

// 가족 편지함 가기
goToGuestbookBtn.addEventListener('click', (e) => {
    e.preventDefault();
    transitionScreen.classList.add('hidden');
    guestbookScreen.classList.remove('hidden');
    loadGuestbook();
    safeFireConfetti();
});

// ==========================================
// 4. 편지 진행 함수
// ==========================================
function showNextSentence() {
    if (isFinished) return;

    if (currentStep >= letterContent.length) {
        setTimeout(finishLetter, 2000);
        return;
    }

    const item = letterContent[currentStep];
    
    // 줄바꿈 처리
    let formattedText = item.text.replace(/\. /g, '.<br>').replace(/\! /g, '!<br>');

    // 텍스트 애니메이션 리셋
    letterText.classList.remove('cloud-text');
    void letterText.offsetWidth; 
    letterText.innerHTML = formattedText;
    letterText.classList.add('cloud-text');

    // ★ 켜져 있을 때만 읽어줌
    if (isTTSOn) speakText(item.text);

    // 다음 대기 시간 계산
    let duration = (item.text.length * READ_SPEED) + 2000;
    if (item.extraDelay) duration += item.extraDelay;

    // 마지막 2문장 남았을 때 음악 서서히 줄이기 시도
    if (currentStep >= letterContent.length - 2) safeFadeOutAudio();
    
    // 마지막 문장: 버튼 변경
    if (currentStep === letterContent.length - 1) {
        skipBtn.innerHTML = "👨‍👩‍👧‍👦 가족 편지 보러가기 >>";
        skipBtn.classList.add("btn-pulse");
        skipBtn.style.zIndex = "99999"; 
        
        // 5초 뒤 강제 이동 (안전장치)
        setTimeout(() => { if (!isFinished) finishLetter(); }, duration + 4000);
    }

    currentStep++;
    clearTimeout(letterTimer);
    letterTimer = setTimeout(showNextSentence, duration);
}

// 편지 종료 및 화면 전환
function finishLetter() {
    if (isFinished) return;
    isFinished = true;

    // 1. 화면 전환부터 먼저 (UX 우선)
    letterScreen.classList.add('hidden');
    transitionScreen.classList.remove('hidden');
    
    // 2. 타이머 정리
    if (letterTimer) clearTimeout(letterTimer);
    
    // 3. 부가 기능 정리 (에러 무시)
    try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        safeFadeOutAudio();
        safeFireConfetti();
    } catch (e) {}
}

// 오디오 페이드아웃 (모바일 안전 버전)
function safeFadeOutAudio() {
    try {
        if (typeof audio.volume !== 'number') { audio.pause(); return; }
        
        const fadeAudio = setInterval(() => {
            try {
                if (audio.volume > 0.1) {
                    audio.volume -= 0.1;
                } else {
                    audio.pause();
                    clearInterval(fadeAudio);
                }
            } catch (e) {
                audio.pause();
                clearInterval(fadeAudio);
            }
        }, 200);
    } catch (e) { audio.pause(); }
}

// TTS 말하기 함수 (안전 버전)
function speakText(text) {
    if (!window.speechSynthesis) return; 

    // 기존 대기열 제거
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR'; 
    utterance.rate = 0.9; 
    utterance.pitch = 1.0; 
    
    // 모바일 끊김 방지용 빈 핸들러
    utterance.onerror = (e) => {}; 
    
    window.speechSynthesis.speak(utterance);
}

// 폭죽 함수
function safeFireConfetti() {
    try {
        confetti({
            particleCount: 150, spread: 100, origin: { y: 0.6 },
            colors: ['#ff9a9e', '#fad0c4', '#ffffff', '#ff6b81']
        });
    } catch (e) {}
}

// ==========================================
// 5. 방명록 & 모달
// ==========================================
const writeModal = document.getElementById('write-modal');
const readModal = document.getElementById('read-modal');

document.getElementById('write-btn').addEventListener('click', () => writeModal.classList.remove('hidden'));
document.querySelectorAll('.close-btn, .close-read-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        writeModal.classList.add('hidden');
        readModal.classList.add('hidden');
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    });
});

// 저장 버튼
document.getElementById('save-btn').addEventListener('click', async () => {
    const name = document.getElementById('input-name').value;
    const title = document.getElementById('input-title').value;
    const message = document.getElementById('input-message').value;

    if (!name || !message) { alert("내용을 입력해주세요!"); return; }

    if (!db) {
        alert("DB 연결 실패. 콘솔을 확인해주세요.");
        return;
    }
    
    try {
        await addDoc(collection(db, "letters"), {
            name, title, message, date: serverTimestamp()
        });
        alert("저장되었습니다! 📌");
        writeModal.classList.add('hidden');
        loadGuestbook(); // 목록 새로고침
        
        // 입력창 비우기
        document.getElementById('input-name').value = ''; 
        document.getElementById('input-title').value = '';
        document.getElementById('input-message').value = '';
    } catch (e) { 
        alert("저장 실패: " + e.message); 
    }
});

// 방명록 불러오기
async function loadGuestbook() {
    const container = document.getElementById('guestbook-container');
    container.innerHTML = ''; // 초기화
    
    if (!db) return;
    
    try {
        const q = query(collection(db, "letters"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            container.innerHTML = '<div style="text-align:center; color:#666; width:100%; padding:20px;">아직 편지가 없어요.<br>첫 번째 편지를 남겨보세요!</div>';
            return;
        }

        querySnapshot.forEach((doc) => addCardToScreen(doc.data()));
    } catch(e) {
        console.log("불러오기 에러:", e);
    }
}

// 카드 생성 및 읽기 모달 연결
function addCardToScreen(data) {
    const container = document.getElementById('guestbook-container');
    const div = document.createElement('div');
    div.className = 'card-item'; 
    div.innerHTML = `
        <div class="card-title">${data.title || '축하해요!'}</div>
        <div class="card-name">From. ${data.name}</div>
    `;
    
    div.addEventListener('click', () => {
        document.getElementById('read-title').innerText = data.title;
        document.getElementById('read-name').innerText = data.name;
        document.getElementById('read-message').innerText = data.message;
        
        // ★ [핵심] 모달 안에서 '읽어주기' 누르면 즉시 재생
        const readTtsBtn = document.getElementById('read-tts-btn');
        readTtsBtn.onclick = () => {
            speakText(data.message);
        };
        
        readModal.classList.remove('hidden');
    });
    
    container.appendChild(div);
}