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
let isTTSOn = false;
let currentStep = 0;
let letterTimer = null;
let isFinished = false; // 중복 실행 방지 플래그

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
// 2. 파이어베이스 설정 (API KEY 확인)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
    // 본인의 API Key 입력 필요
};

let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) { console.log("DB 데모 모드"); }

// ==========================================
// 3. 메인 로직
// ==========================================

window.onload = () => { 
    // 모바일에서는 volume 설정이 무시되거나 에러날 수 있음 -> try-catch로 감쌈
    try { audio.volume = 1.0; } catch(e) { console.log("볼륨 조절 불가 기기"); }
};

// 시작 버튼
document.getElementById('start-btn').addEventListener('click', () => {
    introScreen.classList.add('hidden');
    letterScreen.classList.remove('hidden');
    
    // 오디오 재생 시도 (실패해도 앱은 멈추지 않게 처리)
    audio.play().catch(e => console.log("자동재생 차단됨"));
    
    setTimeout(showNextSentence, 800);
    safeFireConfetti();
});

// ★ [핵심 수정] 건너뛰기 버튼 로직 강화
skipBtn.addEventListener('click', (e) => {
    e.preventDefault(); // 기본 터치 동작 차단
    finishLetter();
});

// TTS 버튼
ttsBtn.addEventListener('click', () => {
    isTTSOn = !isTTSOn;
    ttsBtn.innerText = isTTSOn ? "🔊 소리 끄기" : "🔈 소리 켜기";
});

// 가족 편지함 가기 버튼
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

    // 텍스트 교체 (애니메이션 리셋)
    letterText.classList.remove('cloud-text');
    void letterText.offsetWidth; 
    letterText.innerHTML = formattedText;
    letterText.classList.add('cloud-text');

    if (isTTSOn) speakText(item.text);

    // 다음 대기 시간
    let duration = (item.text.length * READ_SPEED) + 2000;
    if (item.extraDelay) duration += item.extraDelay;

    // 마지막 2문장 남았을 때 음악 줄이기 시도
    if (currentStep >= letterContent.length - 2) safeFadeOutAudio();
    
    // ★ 마지막 문장: 버튼 변경
    if (currentStep === letterContent.length - 1) {
        skipBtn.innerHTML = "👨‍👩‍👧‍👦 가족 편지 보러가기 >>";
        skipBtn.classList.add("btn-pulse");
        skipBtn.style.zIndex = "99999"; 
        
        // 5초 뒤 강제 이동 안전장치
        setTimeout(() => { if (!isFinished) finishLetter(); }, duration + 4000);
    }

    currentStep++;
    clearTimeout(letterTimer);
    letterTimer = setTimeout(showNextSentence, duration);
}

// ★ [핵심 수정] 종료 처리 함수 (에러 방지 처리)
function finishLetter() {
    if (isFinished) return;
    isFinished = true; // 중복 방지

    // 1. 화면 전환부터 먼저 수행 (UX 우선)
    try {
        letterScreen.classList.add('hidden');
        transitionScreen.classList.remove('hidden');
    } catch (e) {
        console.error("화면 전환 중 에러:", e);
    }

    // 2. 타이머 정리
    if (letterTimer) clearTimeout(letterTimer);
    
    // 3. 기능적인 부분들은 에러가 나도 화면전환에 영향 안 주게 try-catch
    try {
        window.speechSynthesis.cancel();
        safeFadeOutAudio();
        safeFireConfetti();
    } catch (e) {
        console.log("부가 기능 실행 중 에러 (무시함):", e);
    }
}

// ★ [핵심 수정] 모바일 안전 오디오 페이드아웃
function safeFadeOutAudio() {
    try {
        // 모바일인지 확인하거나, 볼륨 조절 시도해보고 안되면 바로 pause
        if (typeof audio.volume !== 'number') {
             audio.pause(); 
             return;
        }

        // PC 등 볼륨 조절 가능한 환경
        const fadeAudio = setInterval(() => {
            try {
                if (audio.volume > 0.1) {
                    audio.volume -= 0.1;
                } else {
                    audio.pause();
                    clearInterval(fadeAudio);
                }
            } catch (e) {
                // 볼륨 조절 에러나면 즉시 끄고 종료
                audio.pause();
                clearInterval(fadeAudio);
            }
        }, 200);

    } catch (e) {
        // 모든 시도 실패 시 그냥 끔
        audio.pause();
    }
}

function speakText(text) {
    try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR'; utterance.rate = 0.9; utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
    } catch(e) { console.log("TTS 에러"); }
}

function safeFireConfetti() {
    try {
        confetti({
            particleCount: 150, spread: 100, origin: { y: 0.6 },
            colors: ['#ff9a9e', '#fad0c4', '#ffffff', '#ff6b81']
        });
    } catch (e) { console.log("폭죽 에러"); }
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
    });
});

document.getElementById('save-btn').addEventListener('click', async () => {
    const name = document.getElementById('input-name').value;
    const title = document.getElementById('input-title').value;
    const message = document.getElementById('input-message').value;

    if (!name || !message) { alert("내용을 입력해주세요!"); return; }

    if (!db) {
        addCardToScreen({ name, title, message });
        writeModal.classList.add('hidden');
        return;
    }
    try {
        await addDoc(collection(db, "letters"), {
            name, title, message, date: serverTimestamp()
        });
        alert("저장되었습니다! 📌");
        writeModal.classList.add('hidden');
        loadGuestbook();
        document.getElementById('input-name').value = ''; 
        document.getElementById('input-title').value = '';
        document.getElementById('input-message').value = '';
    } catch (e) { alert("저장 실패"); }
});

async function loadGuestbook() {
    const container = document.getElementById('guestbook-container');
    container.innerHTML = '';
    if (!db) return;
    try {
        const q = query(collection(db, "letters"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => addCardToScreen(doc.data()));
    } catch(e) { console.log("불러오기 실패"); }
}

function addCardToScreen(data) {
    const container = document.getElementById('guestbook-container');
    const div = document.createElement('div');
    div.className = 'card-item'; 
    div.innerHTML = `<div class="card-title">${data.title || '축하해요!'}</div><div class="card-name">From. ${data.name}</div>`;
    div.addEventListener('click', () => {
        document.getElementById('read-title').innerText = data.title;
        document.getElementById('read-name').innerText = data.name;
        document.getElementById('read-message').innerText = data.message;
        document.getElementById('read-tts-btn').onclick = () => speakText(data.message);
        readModal.classList.remove('hidden');
    });
    container.appendChild(div);
}