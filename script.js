// ==========================================
// 1. 편지 내용 설정
// ==========================================
const letterContent = [
    { text: "할머니, 안녕하세요!! 할머니의 막내 아들 둘째 딸인 효빈이에요!" },
    { text: "시간이 많이 흘러서 벌써 할머니의<br>네 번째 스무 살이 찾아왔네요." },
    { text: "먼저 생신 진심으로 축하드려요. 이 세상에 태어나주셔서 감사합니다!" },
    { text: "저희가 어렸을 때 짧지 않은 시간 동안 키워주신 거 잊지 않고 있어요. 항상 감사해하고 있습니다." },
    { text: "저희 키우시느라 힘든 점도 많으셨겠죠. 저희가 속 썩였을 때도 있었을 거예요." },
    { text: "그럼에도 저희의 어린 시절을 부족함 없이 예쁘게 꽃피워주셔서 감사합니다." },
    { text: "매일 전화한다고 해놓고 가끔 해서 죄송해요. 앞으로 더 자주 연락드릴게요. 약속해요!" },
    { text: "이 웹사이트는 제가 직접 만들었습니다. 가족 몰래 밤새워서 만들었어요!" },
    { text: "어서 늦게 일어난다고 맨날 꾸중 내셨던 저희 부모님께<br>한 마디를 부탁드려요ㅎㅎ", extraDelay: 2500 },
    { text: "새삼 할머니께서 계셔서 저희 가족들이 이 자리에 있을 수 있게 됨을 느낍니다." },
    { text: "다시 한번 저희 가족 곁에 있어 주셔서 감사하고,<br>태어나 주셔서 감사합니다!" },
    { text: "항상 건강하세요! 팔순 축하드립니다." },
    { text: "- 사랑을 담아 김효빈 올림 -" }
];

// 설정 변수
const READ_SPEED = 180; 
let isTTSOn = false; // 기본은 꺼짐
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
// 2. 파이어베이스 설정
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
// 3. 메인 로직
// ==========================================

window.onload = () => { 
    try { audio.volume = 1.0; } catch(e) {}

    // 가족용 바로가기 체크
    if (window.location.hash === '#guestbook') {
        introScreen.classList.add('hidden');
        letterScreen.classList.add('hidden');
        transitionScreen.classList.add('hidden');
        guestbookScreen.classList.remove('hidden');
        loadGuestbook();
        safeFireConfetti();
        console.log("가족용 방명록 모드로 진입했습니다.");
    }
};

// 시작 버튼
document.getElementById('start-btn').addEventListener('click', () => {
    introScreen.classList.add('hidden');
    letterScreen.classList.remove('hidden');
    audio.play().catch(e => console.log("BGM 자동재생 차단됨"));
    setTimeout(showNextSentence, 800);
    safeFireConfetti();
});

// 건너뛰기 버튼
skipBtn.addEventListener('click', (e) => {
    e.preventDefault();
    finishLetter();
});

// TTS 토글 버튼
ttsBtn.addEventListener('click', () => {
    isTTSOn = !isTTSOn;
    if (isTTSOn) {
        ttsBtn.innerText = "🔊 소리 끄기";
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

goToGuestbookBtn.addEventListener('click', (e) => {
    e.preventDefault();
    transitionScreen.classList.add('hidden');
    guestbookScreen.classList.remove('hidden');
    loadGuestbook();
    safeFireConfetti();
});

// ==========================================
// 4. 편지 진행 함수 (음악 타이밍 수정됨)
// ==========================================
function showNextSentence() {
    if (isFinished) return;

    if (currentStep >= letterContent.length) {
        setTimeout(finishLetter, 2000);
        return;
    }

    const item = letterContent[currentStep];
    let formattedText = item.text.replace(/\. /g, '.<br>').replace(/\! /g, '!<br>');

    letterText.classList.remove('cloud-text');
    void letterText.offsetWidth; 
    letterText.innerHTML = formattedText;
    letterText.classList.add('cloud-text');

    if (isTTSOn) speakText(item.text);

    let duration = (item.text.length * READ_SPEED) + 2000;
    if (item.extraDelay) duration += item.extraDelay;

    // ★ [수정] 음악이 너무 빨리 꺼지지 않도록 기존 코드 삭제함
    // if (currentStep >= letterContent.length - 2) safeFadeOutAudio(); <- 삭제!

    // 마지막 문장일 때
    if (currentStep === letterContent.length - 1) {
        // ★ [추가] 이제서야 음악을 천천히 줄이기 시작
        safeFadeOutAudio();

        skipBtn.innerHTML = "👨‍👩‍👧‍👦 다른 가족들의 편지 보러가기 >>";
        skipBtn.classList.add("btn-pulse");
        skipBtn.style.zIndex = "99999"; 
        
        setTimeout(() => { if (!isFinished) finishLetter(); }, duration + 4000);
    }

    currentStep++;
    clearTimeout(letterTimer);
    letterTimer = setTimeout(showNextSentence, duration);
}

function finishLetter() {
    if (isFinished) return;
    isFinished = true;
    letterScreen.classList.add('hidden');
    transitionScreen.classList.remove('hidden');
    if (letterTimer) clearTimeout(letterTimer);
    try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        // 혹시 아직 안 줄어들었으면 여기서 확실히 줄임
        safeFadeOutAudio(); 
        safeFireConfetti();
    } catch (e) {}
}

// 오디오 페이드아웃 (천천히 부드럽게 수정됨)
function safeFadeOutAudio() {
    try {
        if (typeof audio.volume !== 'number') { audio.pause(); return; }
        
        // ★ [수정] 0.1씩 팍팍 줄이는 게 아니라 0.05씩 아주 천천히 줄임
        const fadeAudio = setInterval(() => {
            try {
                if (audio.volume > 0.05) {
                    audio.volume -= 0.05; // 아주 조금씩 줄임
                } else {
                    audio.pause();
                    clearInterval(fadeAudio);
                }
            } catch (e) {
                audio.pause();
                clearInterval(fadeAudio);
            }
        }, 400); // ★ [수정] 시간 간격도 0.2초 -> 0.4초로 늘림 (훨씬 오래 유지됨)
    } catch (e) { audio.pause(); }
}

// TTS 말하기 함수
function speakText(text) {
    if (!window.speechSynthesis) return; 
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR'; 
    utterance.rate = 0.9; 
    utterance.pitch = 1.0; 
    utterance.onerror = (e) => {}; 
    window.speechSynthesis.speak(utterance);
}

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

document.getElementById('save-btn').addEventListener('click', async () => {
    const name = document.getElementById('input-name').value;
    const title = document.getElementById('input-title').value;
    const message = document.getElementById('input-message').value;

    if (!name || !message) { alert("내용을 입력해주세요!"); return; }
    if (!db) { alert("DB 연결 실패"); return; }
    
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
    } catch (e) { alert("저장 실패: " + e.message); }
});

async function loadGuestbook() {
    const container = document.getElementById('guestbook-container');
    container.innerHTML = ''; 
    if (!db) return;
    try {
        const q = query(collection(db, "letters"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            container.innerHTML = '<div style="text-align:center; color:#666; width:100%; padding:20px;">아직 편지가 없어요.</div>';
            return;
        }
        querySnapshot.forEach((doc) => addCardToScreen(doc.data()));
    } catch(e) {}
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
        const readTtsBtn = document.getElementById('read-tts-btn');
        readTtsBtn.onclick = () => { speakText(data.message); };
        readModal.classList.remove('hidden');
    });
    container.appendChild(div);
}