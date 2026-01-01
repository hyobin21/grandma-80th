// ==========================================
// 1. 효빈님의 편지 내용 및 설정
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
    // 아래 문장은 2.5초 더 머물기
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

// DOM 요소 가져오기 (전환 화면 요소 추가됨)
const introScreen = document.getElementById('intro-screen');
const letterScreen = document.getElementById('letter-screen');
const transitionScreen = document.getElementById('transition-screen'); // [★추가]
const guestbookScreen = document.getElementById('guestbook-screen');
const letterText = document.getElementById('letter-text');
const audio = document.getElementById('bgm-audio');
const goToGuestbookBtn = document.getElementById('go-to-guestbook-btn'); // [★추가]

// ==========================================
// 2. 파이어베이스(DB) 설정 (아직 비워둠)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
    // 여기에 API 키가 들어갑니다
};

let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) { console.log("DB 설정 전"); }

// ==========================================
// 3. 주요 기능 구현
// ==========================================

window.onload = () => { audio.volume = 1.0; };

// [버튼] 편지 열기
document.getElementById('start-btn').addEventListener('click', () => {
    introScreen.classList.add('hidden');
    letterScreen.classList.remove('hidden');
    setTimeout(() => {
        audio.play().catch(e => console.log("자동재생 막힘"));
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

// [★추가된 기능] 중간 화면에서 롤링페이퍼로 이동 버튼 클릭 시
goToGuestbookBtn.addEventListener('click', () => {
    transitionScreen.classList.add('hidden');
    guestbookScreen.classList.remove('hidden');
    loadGuestbook(); // 이때 데이터를 불러옵니다.
    fireConfetti(); // 롤링페이퍼 들어갈 때 한 번 더 축하!
});


// 편지 보여주는 함수 (줄바꿈 포함)
function showNextSentence() {
    if (currentStep >= letterContent.length) {
        finishLetter();
        return;
    }

    const item = letterContent[currentStep];
    const originalText = item.text;
    // 온점과 느낌표 뒤에 줄바꿈 태그 추가
    let formattedText = originalText
        .replace(/\. /g, '.<br>') 
        .replace(/\! /g, '!<br>')
        .replace(/\.\./g, '..'); 
        
    letterText.classList.remove('fade-in-text');
    void letterText.offsetWidth; 
    letterText.innerHTML = formattedText;
    letterText.classList.add('fade-in-text');

    if (isTTSOn) speakText(originalText);

    let duration = (originalText.length * READ_SPEED) + 2500; // 기본 텀 약간 늘림
    if (item.extraDelay) duration += item.extraDelay;

    if (currentStep >= letterContent.length - 2) fadeOutAudio();

    currentStep++;
    letterTimer = setTimeout(showNextSentence, duration);
}

// [★수정된 함수] 편지 끝났을 때 처리
function finishLetter() {
    clearTimeout(letterTimer);
    window.speechSynthesis.cancel();
    
    letterScreen.classList.add('hidden');
    
    // [수정] 바로 guestbook으로 가지 않고 transitionScreen을 보여줌
    transitionScreen.classList.remove('hidden');
    
    fadeOutAudio();
    fireConfetti(); // 효빈님 편지 끝 축하!
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
// 4. 롤링페이퍼 기능
// ==========================================
// (이 부분은 이전과 동일합니다)
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