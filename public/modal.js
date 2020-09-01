/* eslint-disable no-undef */
const currentUrl = window.location.href;
let numQuestions = 1;
let currQuestion = 1;
let questionDifficulty = 1;
let questionDelay = 2;
let siteList;
let siteObj;
let questionObj;

chrome.storage.sync.get(['siteList', 'questionDifficulty', 'numQuestions', 'questionDelay', 'schedulingOn', 'schedulingData'], 
(result) => {
    if (result && result.siteList){
        if (result.numQuestions) {
            numQuestions = parseInt(result.numQuestions, 10);
        }
        if (result.questionDifficulty){
            questionDifficulty = parseInt(result.questionDifficulty, 10);
        }
        if (result.questionDelay){
            questionDelay = parseInt(result.questionDelay, 10);
        }
        for (let i = 0; i < result.siteList.length; i++){
            siteList = result.siteList;
            if (siteMatches(result.siteList[i].url) && 
                moment().isAfter(moment(result.siteList[i]["tempUnblockedUntil"])) && 
                (isSchedulingOn(result) || isSiteBlocked(result.siteList[i]))){
                    siteObj = result.siteList[i];
                    showQuestionPopup();
                    document.body.classList.add("math-stop-scrolling");
                    break;
                }
            };
    }
});

function siteMatches(site){
    let siteArr = site.split(/[./]/).reverse().filter(s => s.length !== 0);
    let currentUrlArr = currentUrl.split(/[./]/).reverse().filter(s => s.length !== 0);
    var i = 0; // siteArr
    var j = 0; // currentUrlArr;
    while (j < currentUrlArr.length && i < siteArr.length){
        if (siteArr.includes(currentUrlArr)){
            i++;
        }
        j++;
    }
    if (i >= siteArr.length){
        return true;
    } else {
        return false;
    }
}

function showQuestionPopup(){
    fetch(chrome.extension.getURL('/modal.html'))
    .then(response => response.text())
    .then(data => {
        document.body.innerHTML += data;
        startMathQuestions();
    })
    .catch(err => {
        console.log(err);
    });
}

function isSchedulingOn(result){
    return result.schedulingOn && result.schedulingData[moment().weekday()].enabled &&
    moment().isSameOrAfter(moment(result.schedulingData[moment().weekday()].startTime, "h:m A")) &&
    moment().isBefore(moment(result.schedulingData[moment().weekday()].endTime, "h:m A"));
}

function isSiteBlocked(site){
    return moment().isBefore(moment(site.siteBlockedUntil));
}

function startMathQuestions(){
    document.querySelector('#math-popup-form').addEventListener("submit", onSubmit);
    document.querySelector('#math-popup-site').innerText = siteObj.url;
    let progressBar = document.querySelector('#math-popup-progress-bar');
    for (let i = 0; i < numQuestions; i++) {
        progressBar.innerHTML += '<div class="math-popup-progress"></div>';
    }
    document.querySelectorAll('.math-popup-progress').forEach(el => el.style.width = "calc(100% * " + currQuestion + " / " + numQuestions + ")")
    populateMathQuestion();
}

function populateMathQuestion(){
    questionObj = generateQuestion(questionDifficulty);
    document.querySelector('#math-popup-question').innerText = questionObj.text;
    document.querySelector('#math-popup-progress-bar').children[currQuestion - 1].classList.add('math-question-current');
}

function onSubmit(event){
    event.preventDefault();
    event.stopPropagation()
    let inputElement = document.querySelector('#math-popup-input');
    if(inputElement.value === questionObj.answer){
        let progressBar = document.querySelector('#math-popup-progress-bar');
        progressBar.children[currQuestion - 1].classList.remove('math-question-current');
        progressBar.children[currQuestion - 1].classList.add('math-question-complete');
        currQuestion++;
        if (currQuestion > numQuestions){
            questionsFinished();
        } else {
            populateMathQuestion();
        }
    }
    inputElement.value = "";
}

function questionsFinished() {
    var index = siteList.indexOf(siteObj);
    var newSiteList = siteList.slice(0);
    if (index !== -1) {
        newSiteList[index]["tempUnblockedUntil"] = moment().add(questionDelay, 'minutes').valueOf();
        chrome.storage.sync.set({ siteList: newSiteList }, () => {
            window.location.reload();
        });
    } else {
        console.log("index not found");
    }
}

function generateQuestion(questionDifficulty){
    let result = {};
    let a;
    let b;
    let c;
    if (questionDifficulty === 1){
        a = Math.floor(Math.random() * 10 + 1);
        b = Math.floor(Math.random() * 10 + 1);
        result.text = a + " + " + b;
        result.answer = a + b;
    } else if (questionDifficulty === 2){
        a = Math.floor(Math.random() * 25 + 1);
        b = Math.floor(Math.random() * 25 + 1);
        result.text = a + " + " + b;
        result.answer = a + b;
    } else if (questionDifficulty === 3){
        a = Math.floor(Math.random() * 50 + 1);
        b = Math.floor(Math.random() * 50 + 1);
        c = Math.floor(Math.random() * 50 + 1);
        result.text = a + " + " + b + " + " + c;
        result.answer = a + b + c;
    } else if (questionDifficulty === 4){
        a = Math.floor(Math.random() * 100 + 1);
        b = Math.floor(Math.random() * 10 + 1);
        c = Math.floor(Math.random() * 50 + 1);
        result.text = "(" + a + " * " + b + ") + " + c;
        result.answer = (a * b) + c;
    } else if (questionDifficulty === 5){
        a = Math.floor(Math.random() * 50 + 1);
        b = Math.floor(Math.random() * 25 + 1);
        c = Math.floor(Math.random() * 500 + 1);
        result.text = "(" + a + " * " + b + ") + " + c;
        result.answer = (a * b) + c;
    } 
    result.answer = result.answer.toString();
    return result;
}

