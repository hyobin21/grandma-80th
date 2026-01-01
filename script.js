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
    // 아래 문장은 2.5초 더 머물기 (기본시간 + 2500ms)
    { text: "어서 늦게 일어난다고 맨날 꾸중 내셨던 저희 막내 아드님께 한 마디를 부탁드려요ㅎㅎ", extraDelay: 2500 },
    { text: "새삼 할머니께서 계셔서 저희 가족들이 이 자리에 있을 수 있게 됨을 느낍니다." },
    { text: "다시 한번 저희 가족 곁에 있어 주셔서 감사하고, 태어나 주셔서 감사합니다!" },
    { text: "항상 건강하세요! 팔순 축하드립니다.", isLast: true },
    { text: "- 김효빈 올림 -", isLast: true }
];

// 설정값
const READ_SPEED = 150; // 글자당 머무는 시간 (ms) - 천천히 읽기 위해 조정 가능
let isTTSOn = false;    // AI 음성 기본값 OFF
let currentStep = 0;
let letterTimer = null;

// DOM 요소 가져오기
const introScreen = document.getElementById('intro-screen');
const letterScreen = document.getElementById('letter-screen');
const guestbookScreen = document.getElementById('guestbook-screen');
const letterText = document.getElementById('letter-text');
const audio = document.getElementById('bgm-audio');

// ==========================================
// 2. 파이어베이스(DB) 설정 (다음 단계에서 채워넣을 부분)
// ==========================================
// ★ 중요: 여기에 나중에 Firebase 설정 코드를 넣어야 가족 편지가 저장됩니다.
// 지금은 비워둬도 화면 넘어가는 건 문제없습니다.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// 나중에 여기에 firebaseConfig를 넣을 겁니다.
const firebaseConfig = {
    // 여기에 API 키가 들어갑니다
};

// 앱 초기화 (설정값이 없으면 에러 방지를 위해 try-catch 처리)
let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.log("아직 파이어베이스 설정이 안 되었습니다.");
}


// ==========================================
// 3. 주요 기능 구현
// ==========================================

// 초기화
window.onload = () => {
    // 배경 음악 볼륨 설정
    audio.volume = 1.0; 
};

// [버튼] 편지 열기
document.getElementById('start-btn').addEventListener('click', () => {
    introScreen.classList.add('hidden');
    letterScreen.classList.remove('hidden');

    // 1초 텀 두고 노래 시작
    setTimeout(() => {
        audio.play().catch(e => console.log("브라우저 정책상 클릭 필요"));
        showNextSentence();
    }, 1000);
    
    // 첫 팡파레 효과
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

// 편지 보여주는 함수 (핵심 로직)
function showNextSentence() {
    if (currentStep >= letterContent.length) {
        finishLetter();
        return;
    }

    const item = letterContent[currentStep];
    const sentence = item.text;
    
    // 1. 화면에 글자 표시 (애니메이션 재시작을 위해 클래스 리셋)
    letterText.classList.remove('fade-in-text');
    void letterText.offsetWidth; // 리플로우 강제 (애니메이션 초기화 트릭)
    letterText.innerText = sentence;
    letterText.classList.add('fade-in-text');

    // 2. TTS 읽기 (켜져 있을 때만)
    if (isTTSOn) {
        speakText(sentence);
    }

    // 3. 다음 문장 넘어가는 시간 계산
    // 기본: 글자수 * 속도 + 기본 2초
    // 추가: 2.5초 머물기 요청이 있으면 더함
    let duration = (sentence.length * READ_SPEED) + 2000;
    if (item.extraDelay) duration += item.extraDelay;

    // 마지막 문장 쯤 되면 음악 소리 줄이기 시작
    if (currentStep >= letterContent.length - 2) {
        fadeOutAudio();
    }

    currentStep++;
    letterTimer = setTimeout(showNextSentence, duration);
}

// 편지 끝내고 방명록으로 이동
function finishLetter() {
    clearTimeout(letterTimer);
    window.speechSynthesis.cancel(); // 읽던 거 멈춤
    
    letterScreen.classList.add('hidden');
    guestbookScreen.classList.remove('hidden');
    
    fadeOutAudio();
    fireConfetti(); // 축하 폭죽
    loadGuestbook(); // 방명록 불러오기
}

// 오디오 페이드 아웃
function fadeOutAudio() {
    const fadeAudio = setInterval(() => {
        if (audio.volume > 0.1) {
            audio.volume -= 0.1;
        } else {
            audio.pause();
            clearInterval(fadeAudio);
        }
    }, 200);
}

// TTS (음성 읽어주기) 기능
function speakText(text) {
    window.speechSynthesis.cancel(); // 기존 음성 취소
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR'; // 한국어 설정
    utterance.rate = 0.9; // 속도 약간 천천히
    utterance.pitch = 1.1; // 톤 약간 높게 (할머니 듣기 좋게)
    window.speechSynthesis.speak(utterance);
}

// 꽃가루 효과
function fireConfetti() {
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
    });
}

// ==========================================
// 4. 롤링페이퍼 (방명록) 기능
// ==========================================

// 모달창 제어
const writeModal = document.getElementById('write-modal');
const readModal = document.getElementById('read-modal');

document.getElementById('write-btn').addEventListener('click', () => {
    writeModal.classList.remove('hidden');
});

document.querySelectorAll('.close-btn, .close-read-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        writeModal.classList.add('hidden');
        readModal.classList.add('hidden');
    });
});

// [글 저장] 버튼 클릭 시
document.getElementById('save-btn').addEventListener('click', async () => {
    const name = document.getElementById('input-name').value;
    const title = document.getElementById('input-title').value;
    const message = document.getElementById('input-message').value;

    if (!name || !message) {
        alert("이름과 내용을 꼭 적어주세요!");
        return;
    }

    if (!db) {
        alert("데이터베이스 연결이 안 되어서 저장할 수 없습니다. (테스트 모드)");
        // 테스트용으로 화면에만 붙이기 (새로고침하면 사라짐)
        addPostItToScreen({ name, title, message });
        writeModal.classList.add('hidden');
        return;
    }

    try {
        await addDoc(collection(db, "letters"), {
            name: name,
            title: title,
            message: message,
            date: serverTimestamp()
        });
        alert("편지가 등록되었습니다!");
        writeModal.classList.add('hidden');
        loadGuestbook(); // 목록 다시 불러오기
        
        // 입력창 비우기
        document.getElementById('input-name').value = '';
        document.getElementById('input-title').value = '';
        document.getElementById('input-message').value = '';

    } catch (e) {
        console.error("Error adding document: ", e);
        alert("저장에 실패했습니다.");
    }
});

// 방명록 불러오기
async function loadGuestbook() {
    const container = document.getElementById('guestbook-container');
    container.innerHTML = ''; // 초기화

    if (!db) return; // DB 없으면 패스

    const q = query(collection(db, "letters"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        addPostItToScreen(data);
    });
}

// 화면에 포스트잇 붙이기 함수
function addPostItToScreen(data) {
    const container = document.getElementById('guestbook-container');
    
    const div = document.createElement('div');
    div.className = 'post-it';
    div.innerHTML = `
        <div class="post-it-title">${data.title || '무제'}</div>
        <div class="post-it-name">From. ${data.name}</div>
    `;

    // 클릭하면 읽기 모달 띄우기
    div.addEventListener('click', () => {
        document.getElementById('read-title').innerText = data.title;
        document.getElementById('read-name').innerText = "From. " + data.name;
        document.getElementById('read-message').innerText = data.message;
        
        // 읽어주기 버튼에 현재 내용 연결
        const readBtn = document.getElementById('read-tts-btn');
        readBtn.onclick = () => speakText(data.message);

        readModal.classList.remove('hidden');
    });

    container.appendChild(div);
}