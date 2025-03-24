const wordList = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I', 
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other'
];

const wordsElement = document.getElementById('words');
const inputElement = document.getElementById('input');
const caretElement = document.getElementById('caret');
const timerElement = document.querySelector('.timer');
const resultsElement = document.getElementById('results');
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const rawElement = document.getElementById('raw');
const charactersElement = document.getElementById('characters');
const consistencyElement = document.getElementById('consistency');
const timeTakenElement = document.getElementById('time-taken');
const testTypeElement = document.getElementById('test-type');
const graphElement = document.getElementById('graph');


let words = [];
let currentWordIndex = 0;
let currentLetterIndex = 0;
let startTime = null;
let timerInterval = null;
let testTime = 30;
let testActive = false;
let correctChars = 0;
let incorrectChars = 0;
let missedChars = 0;
let extraChars = 0;
let wpmHistory = [];
let lastRecordedTime = 0;


function generateWords(count = 100) {
    const randomWords = [];
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * wordList.length);
        randomWords.push(wordList[randomIndex]);
    }
    return randomWords;
}


function initWords() {
    words = generateWords();
    wordsElement.innerHTML = '';
    
    words.forEach((word, wordIndex) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        wordSpan.setAttribute('data-word-index', wordIndex);
        
        word.split('').forEach((letter, letterIndex) => {
            const letterSpan = document.createElement('span');
            letterSpan.className = 'letter';
            letterSpan.setAttribute('data-letter-index', letterIndex);
            letterSpan.textContent = letter;
            wordSpan.appendChild(letterSpan);
        });
        
        wordsElement.appendChild(wordSpan);
    });
    
    updateCaret();
}


function updateCaret() {
    const currentWord = document.querySelector(`.word[data-word-index="${currentWordIndex}"]`);
    if (!currentWord) return;
    
    if (currentLetterIndex < currentWord.children.length) {
        const currentLetter = currentWord.children[currentLetterIndex];
        const rect = currentLetter.getBoundingClientRect();
        const wordsRect = wordsElement.getBoundingClientRect();
        
        caretElement.style.display = 'block';
        caretElement.style.left = (rect.left - wordsRect.left) + 'px';
        caretElement.style.top = (rect.top - wordsRect.top) + 'px';
    } else {
     
        const lastLetter = currentWord.children[currentWord.children.length - 1];
        if (lastLetter) {
            const rect = lastLetter.getBoundingClientRect();
            const wordsRect = wordsElement.getBoundingClientRect();
            
            caretElement.style.display = 'block';
            caretElement.style.left = (rect.right - wordsRect.left + 2) + 'px';
            caretElement.style.top = (rect.top - wordsRect.top) + 'px';
        }
    }
}

function startTest() {
    if (testActive) return;
    
    testActive = true;
    startTime = new Date();
    wpmHistory = [];
    lastRecordedTime = 0;
    correctChars = 0;
    incorrectChars = 0;
    missedChars = 0;
    extraChars = 0;
    
    const wpmRecorder = setInterval(() => {
        if (!testActive) {
            clearInterval(wpmRecorder);
            return;
        }
        
        const currentTime = Math.floor((new Date() - startTime) / 1000);
        if (currentTime > lastRecordedTime) {
            const elapsedMinutes = currentTime / 60;
            const currentWpm = Math.round((correctChars / 5) / elapsedMinutes);
            wpmHistory.push(currentWpm);
            lastRecordedTime = currentTime;
        }
    }, 1000);
    
    timerInterval = setInterval(() => {
        const elapsedTime = Math.floor((new Date() - startTime) / 1000);
        const timeLeft = testTime - elapsedTime;
        
        if (timeLeft <= 0) {
            endTest();
            return;
        }
        
        timerElement.textContent = timeLeft;
    }, 1000);
}

function endTest() {
    testActive = false;
    clearInterval(timerInterval);
    
    const elapsedMinutes = (new Date() - startTime) / 60000;
    const wpm = Math.round((correctChars / 5) / elapsedMinutes);
    const raw = Math.round(((correctChars + incorrectChars) / 5) / elapsedMinutes);
    const totalChars = correctChars + incorrectChars;
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
    
    let consistency = 0;
    if (wpmHistory.length > 0) {
        const avg = wpmHistory.reduce((sum, wpm) => sum + wpm, 0) / wpmHistory.length;
        const squaredDiffs = wpmHistory.map(wpm => Math.pow(wpm - avg, 2));
        const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / wpmHistory.length;
        const stdDev = Math.sqrt(variance);
        consistency = Math.max(0, Math.min(100, Math.round(100 - (stdDev / avg * 100))));
    }
    
    wpmElement.textContent = wpm;
    accuracyElement.textContent = accuracy;
    rawElement.textContent = raw;
    charactersElement.textContent = `${correctChars}/${incorrectChars}/${missedChars}/${extraChars}`;
    consistencyElement.textContent = `${consistency}%`;
    timeTakenElement.textContent = `${testTime}s`;
    testTypeElement.textContent = `time ${testTime}`;
    
    createGraph();
    
    resultsElement.classList.add('active');
}


function createGraph() {
    graphElement.innerHTML = '';
    
    if (wpmHistory.length === 0) return;
    
    const maxWpm = Math.max(...wpmHistory, 100);
    const graphWidth = graphElement.clientWidth;
    const segmentWidth = graphWidth / (testTime - 1);
    
    wpmHistory.forEach((wpm, index) => {
        const height = (wpm / maxWpm) * 100;
        const line = document.createElement('div');
        line.className = 'graph-line';
        line.style.left = `${index * segmentWidth}px`;
        line.style.width = `${segmentWidth}px`;
        line.style.height = `${height}%`;
        graphElement.appendChild(line);
    });
}


function resetTest() {
    currentWordIndex = 0;
    currentLetterIndex = 0;
    startTime = null;
    testActive = false;
    
    clearInterval(timerInterval);
    timerElement.textContent = testTime;
    inputElement.value = '';
    resultsElement.classList.remove('active');
    
    initWords();
    focusInput();
}


function setTime(time) {
    testTime = time;
    timerElement.textContent = time;
    

    document.querySelectorAll('.config-option').forEach(option => {
        option.classList.remove('active');
        if (option.textContent == time) {
            option.classList.add('active');
        }
    });
    
    resetTest();
}


function focusInput() {
    inputElement.focus();
}

inputElement.addEventListener('input', (e) => {
    if (!testActive && e.target.value.length > 0) {
        startTest();
    }
    
    if (!testActive) return;
    
    const currentWord = words[currentWordIndex];
    const typedValue = e.target.value;
    
  
    if (typedValue.endsWith(' ')) {
   
        for (let i = 0; i < Math.max(typedValue.length - 1, currentWord.length); i++) {
            if (i < typedValue.length - 1 && i < currentWord.length) {
                if (typedValue[i] === currentWord[i]) {
                    correctChars++;
                } else {
                    incorrectChars++;
                }
            } else if (i >= typedValue.length - 1) {
              
                missedChars++;
            } else {
                
                extraChars++;
            }
        }
        
        currentWordIndex++;
        currentLetterIndex = 0;
        e.target.value = '';
        
        if (currentWordIndex >= words.length) {
            endTest();
            return;
        }
        
        updateCaret();
        return;
    }
    
  
    const wordElement = document.querySelector(`.word[data-word-index="${currentWordIndex}"]`);
    if (!wordElement) return;
    
    const letters = wordElement.querySelectorAll('.letter');
    
    letters.forEach(letter => {
        letter.classList.remove('correct', 'incorrect');
    });
    

    for (let i = 0; i < typedValue.length; i++) {
        if (i < letters.length) {
            if (typedValue[i] === currentWord[i]) {
                letters[i].classList.add('correct');
            } else {
                letters[i].classList.add('incorrect');
            }
        }
    }
    
    currentLetterIndex = typedValue.length;
    updateCaret();
});

initWords();
focusInput();

window.addEventListener('resize', () => {
    if (resultsElement.classList.contains('active')) {
        createGraph();
    }
});