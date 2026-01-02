// ==========================================
// 1. 편지 데이터 (수정할 부분 없음)
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
    { text: "항상 건강하세요! 팔순 축하드립니다.", isLast: true },
    { text: "- 김효빈 올림 -", isLast: true }
];

const READ_SPEED = 150; 
let isTTSOn = false;
let currentStep = 0;
let letterTimer = null;

const introScreen = document.getElementById('intro-screen');
const letterScreen = document.getElementById('letter-screen');
const transitionScreen = document.getElementById('transition-screen');
const guestbookScreen = document.getElementById('guestbook-screen');
const letterText = document.getElementById('letter-text');
const audio = document.getElementById('bgm-audio');
const goToGuestbookBtn = document.getElementById('go-to-guestbook-btn');

// ==========================================
// 2. Firebase (API KEY 입력 필요)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
    // 여기에 파이어베이스 API 키를 넣으세요
};

let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) { console.log("DB 미연결: 데모 모드"); }

// ==========================================
// 3. 메인 로직
// ==========================================

window.onload = () => { audio.volume = 1.0; };

document.getElementById('start-btn').addEventListener('click', () => {
    introScreen.classList.add('hidden');
    letterScreen.classList.remove('hidden');
    setTimeout(() => {
        audio.play().catch(e => console.log("Audio Autoplay Blocked"));
        showNextSentence();
    }, 800);
    fireConfetti();
});

document.getElementById('skip-btn').addEventListener('click', () => finishLetter());

const ttsBtn = document.getElementById('tts-toggle-btn');
ttsBtn.addEventListener('click', () => {
    isTTSOn = !isTTSOn;
    ttsBtn.innerText = isTTSOn ? "🔊 소리 끄기" : "🔈 소리 켜기";
});

goToGuestbookBtn.addEventListener('click', () => {
    transitionScreen.classList.add('hidden');
    guestbookScreen.classList.remove('hidden');
    loadGuestbook();
    fireConfetti();
});

function showNextSentence() {
    if (currentStep >= letterContent.length) {
        finishLetter();
        return;
    }
    const item = letterContent[currentStep];
    const originalText = item.text;
    let formattedText = originalText.replace(/\. /g, '.<br>').replace(/\! /g, '!<br>');
        
    letterText.classList.remove('cloud-text');
    void letterText.offsetWidth; // Trigger reflow
    letterText.innerHTML = formattedText;
    letterText.classList.add('cloud-text');

    if (isTTSOn) speakText(originalText);

    let duration = (originalText.length * READ_SPEED) + 2500;
    if (item.extraDelay) duration += item.extraDelay;
    if (currentStep >= letterContent.length - 2) fadeOutAudio();

    currentStep++;
    letterTimer = setTimeout(showNextSentence, duration);
}

function finishLetter() {
    clearTimeout(letterTimer);
    window.speechSynthesis.cancel();
    letterScreen.classList.add('hidden');
    transitionScreen.classList.remove('hidden'); 
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
        particleCount: 150, spread: 100, origin: { y: 0.6 },
        colors: ['#ff9a9e', '#fad0c4', '#a18cd1', '#ffffff'] // 배경톤에 맞춘 색상
    });
}

// ==========================================
// 4. 방명록 로직 (카드 스타일 적용)
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

    if (!name || !message) { alert("이름과 내용은 필수입니다!"); return; }

    if (!db) {
        addCardToScreen({ name, title, message });
        writeModal.classList.add('hidden');
        return;
    }
    try {
        await addDoc(collection(db, "letters"), {
            name, title, message, date: serverTimestamp()
        });
        alert("성공적으로 등록되었습니다! ✨");
        writeModal.classList.add('hidden');
        loadGuestbook();
        // 입력창 초기화
        document.getElementById('input-name').value = '';
        document.getElementById('input-title').value = '';
        document.getElementById('input-message').value = '';
    } catch (e) { console.error("Error:", e); alert("저장 실패 ㅠㅠ"); }
});

async function loadGuestbook() {
    const container = document.getElementById('guestbook-container');
    container.innerHTML = '';
    if (!db) return;
    const q = query(collection(db, "letters"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => addCardToScreen(doc.data()));
}

function addCardToScreen(data) {
    const container = document.getElementById('guestbook-container');
    const div = document.createElement('div');
    div.className = 'card-item'; // CSS 클래스 변경
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