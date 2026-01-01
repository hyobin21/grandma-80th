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
    // 2.5초 더 머물기
    { text: "어서 늦게 일어난다고 맨날 꾸중 내셨던 저희 막내 아드님께 한 마디를 부탁드려요ㅎㅎ", extraDelay: 2500 },
    { text: "새삼 할머니께서 계셔서 저희 가족들이 이 자리에 있을 수 있게 됨을 느낍니다." },
    { text: "다시 한번 저희 가족 곁에 있어 주셔서 감사하고, 태어나 주셔서 감사합니다!" },
    { text: "항상 건강하세요! 팔순 축하드립니다.", isLast: true },
    { text: "- 김효빈 올림 -", isLast: true }
];

const READ_SPEED = 150; // 기본 읽기 속도
let isTTSOn = false;
let currentStep = 0;
let letterTimer = null;

// DOM 요소 가져오기
const introScreen = document.getElementById('intro-screen');
const letterScreen = document.getElementById('letter-screen');
const transitionScreen = document.getElementById('transition-screen'); // 중간 화면
const guestbookScreen = document.getElementById('guestbook-screen');
const letterText = document.getElementById('letter-text');
const audio = document.getElementById('bgm-audio');
const goToGuestbookBtn = document.getElementById('go-to-guestbook-btn');

// ==========================================
// 2. 파이어베이스(DB) 설정 영역
// ==========================================
// ★ 중요: 나중에 이곳에 키값을 넣어야 글이 저장됩니다.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
    // 여기에 API Key를 넣으세요
};

let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) { console.log("DB 설정 전"); }

// ==========================================
// 3. 주요 기능 로직
// ==========================================

window.onload = () => { audio.volume = 1.0; };

// [버튼] 편지 열기
document.getElementById('start-btn').addEventListener('click', () => {
    introScreen.classList.add('hidden');
    letterScreen.classList.remove('hidden');
    
    // 음악 재생 및 첫 문장 시작
    setTimeout(() => {
        audio.play().catch(e => console.log("자동재생 정책으로 클릭 필요"));
        showNextSentence();
    }, 1000);
    fireConfetti();
});

// [버튼] 건너뛰기
document.getElementById('skip-btn').addEventListener('click', () => {
    finishLetter();
});

// [버튼] TTS 토글
const ttsBtn = document.getElementById('tts-toggle-btn');
ttsBtn.addEventListener('click', () => {
    isTTSOn = !isTTSOn;
    ttsBtn.innerText = isTTSOn ? "🔊 음성 끄기" : "🔈 음성 켜기";
});

// [버튼] 중간 화면에서 방명록으로 이동
goToGuestbookBtn.addEventListener('click', () => {
    transitionScreen.classList.add('hidden');
    guestbookScreen.classList.remove('hidden');
    loadGuestbook();
    fireConfetti();
});

// ★ 편지 보여주기 함수 (구름 효과 + 자동 줄바꿈)
function showNextSentence() {
    if (currentStep >= letterContent.length) {
        finishLetter();
        return;
    }

    const item = letterContent[currentStep];
    const originalText = item.text;
    
    // 온점(.)과 느낌표(!) 뒤에 줄바꿈(<br>) 넣기
    let formattedText = originalText
        .replace(/\. /g, '.<br>') 
        .replace(/\! /g, '!<br>')
        .replace(/\.\./g, '..'); // 말줄임표 보존
        
    // 애니메이션 리셋 (클래스를 뺐다 껴서 다시 실행)
    letterText.classList.remove('cloud-text');
    void letterText.offsetWidth; // 리플로우 강제
    letterText.innerHTML = formattedText;
    letterText.classList.add('cloud-text'); // 구름 효과 시작

    // TTS
    if (isTTSOn) speakText(originalText);

    // 시간 계산
    let duration = (originalText.length * READ_SPEED) + 2500; // 구름 효과라 여유 있게
    if (item.extraDelay) duration += item.extraDelay;

    // 편지 끝나갈 즈음 음악 줄이기
    if (currentStep >= letterContent.length - 2) fadeOutAudio();

    currentStep++;
    letterTimer = setTimeout(showNextSentence, duration);
}

// 편지 끝내기
function finishLetter() {
    clearTimeout(letterTimer);
    window.speechSynthesis.cancel();
    
    letterScreen.classList.add('hidden');
    transitionScreen.classList.remove('hidden'); // 중간 화면 보여주기
    
    fadeOutAudio();
    fireConfetti();
}

function fadeOutAudio() {
    const fadeAudio = setInterval(() => {
        if (audio.volume > 0.1) audio.volume -= 0.1;
        else { audio.pause(); clearInterval(fadeAudio); }
    }, 200);
}

function speakText(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR'; utterance.rate = 0.9; utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
}

function fireConfetti() {
    confetti({
        particleCount: 200, spread: 100, origin: { y: 0.6 },
        colors: ['#ff0000', '#ffd700', '#ffffff']
    });
}

// ==========================================
// 4. 롤링페이퍼 기능 (DB 연동)
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

    if (!name || !message) { alert("이름과 내용을 꼭 적어주세요!"); return; }

    if (!db) {
        alert("데이터베이스 연결이 안 되어서 저장할 수 없습니다. (테스트 모드)");
        addPostItToScreen({ name, title, message });
        writeModal.classList.add('hidden');
        return;
    }
    try {
        await addDoc(collection(db, "letters"), {
            name, title, message, date: serverTimestamp()
        });
        alert("편지가 등록되었습니다!");
        writeModal.classList.add('hidden');
        loadGuestbook();
        document.getElementById('input-name').value = '';
        document.getElementById('input-title').value = '';
        document.getElementById('input-message').value = '';
    } catch (e) { console.error("Error:", e); alert("저장에 실패했습니다."); }
});

async function loadGuestbook() {
    const container = document.getElementById('guestbook-container');
    container.innerHTML = '';
    if (!db) return;
    const q = query(collection(db, "letters"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => addPostItToScreen(doc.data()));
}

function addPostItToScreen(data) {
    const container = document.getElementById('guestbook-container');
    const div = document.createElement('div');
    div.className = 'post-it';
    div.innerHTML = `<div class="post-it-title">${data.title || '무제'}</div><div class="post-it-name">From. ${data.name}</div>`;
    div.addEventListener('click', () => {
        document.getElementById('read-title').innerText = data.title;
        document.getElementById('read-name').innerText = "From. " + data.name;
        document.getElementById('read-message').innerText = data.message;
        document.getElementById('read-tts-btn').onclick = () => speakText(data.message);
        readModal.classList.remove('hidden');
    });
    container.appendChild(div);
}