class wordQuiz {
    constructor(rootElm) { //グローバル変数

        // #app
        this.rootElm = rootElm;

        // ゲームステータス　
        this.gameStatus = {};
        this.resetGame();
    }

    // 関数の呼び出し
    async init() {
        await this.fetchQuizData();
        this.displayStartView();
    }

    // クイズデータの取得
    async fetchQuizData() {
        // 成功したら
        try {
            // jsonデータを取得
            const response = await fetch("quiz.json");
            // jsonデータの.json()を取得
            this.quizData = await response.json();
            console.log(this.quizData);
            // 失敗したら
        } catch (error) {
            this.rootElm.innerText = "問題の読み込みに失敗しました";
            console.log(error);
        }
    }

    // 最後の問題
    isLastStep() {
        const currentQuestions = this.quizData[this.gameStatus.level];

        return this.gameStatus.step === Object.keys(currentQuestions).length;
    }

    // 次の問題
    nextStep() {
        this.clearTimer();
        this.addResult();
        if (this.isLastStep()) {
            this.displayResultView();
        } else {
            this.gameStatus.step++;
            this.displayQuestionView();
        }
    }

    // チェックされた値を取得
    addResult() {
        const checkedElm = this.rootElm.querySelector('input[name="choice"]:checked');
        const answer = checkedElm ? checkedElm.value : "";
        const currentQuestion = this.quizData[this.gameStatus.level][`step${this.gameStatus.step}`];

        this.gameStatus.results.push({
            question: currentQuestion, //問題
            selectedAnswer: answer //チェックした値
        });

        console.log(answer);
    }

    // 正解率
    calcScore() {
        let correctNum = 0;
        const results = this.gameStatus.results;

        for (const result of results) {
            const selected = result.selectedAnswer;
            const correct = result.question.answer; //答え

            if (selected === correct) {
                correctNum++;
            }
        }

        return Math.floor((correctNum / results.length) * 100);
    }

    displayStartView() {
        // quiz.jsonの中のlevel1-level3を取得
        const levelStrs = Object.keys(this.quizData); //level1~3
        this.gameStatus.level = levelStrs[0]; //初期値level1
        const optionStrs = [];
        // level1-level3を表示させる処理
        for (let i = 0; levelStrs.length > i; i++) {
            optionStrs.push(`<option value="${levelStrs[i]}" name="level">レベル${i + 1}</option>`);
        }

        // htmlに表示
        const html = `
        <select class="levelSelector">
        ${optionStrs.join("")}
        </select>
        <button class="startBtn">スタート</button>`;

        // div要素を作成
        const parentElm = document.createElement("div");
        parentElm.innerHTML = html;

        // セレクトの値が変わった時の処理
        const selectorElm = parentElm.querySelector(".levelSelector");
        selectorElm.addEventListener("change", (event) => {
            this.gameStatus.level = event.target.value;
        });

        const startButtonElm = parentElm.querySelector(".startBtn");
        startButtonElm.addEventListener("click", () => {
            this.displayQuestionView();
        });

        // appの子要素にする
        this.rootElm.appendChild(parentElm);

        this.replaceView(parentElm); //スタート画面のみを表示
    }

    // level stepの初期値
    resetGame() {
        this.gameStatus.level = null;//選択されたレベル
        this.gameStatus.step = 1; // 1 
        this.gameStatus.results = [] //プレイヤーの回答結果
        this.gameStatus.timeLimit = 0; //問題ごとの制限時間
        this.gameStatus.intervalKey = null; //intervalKeyを格納
    }

    // 制限時間
    settTimer() {
        if (this.gameStatus.intervalKey !== null) {
            throw new error("まだタイマーが動いています");
        }

        this.gameStatus.timeLimit = 10;
        this.gameStatus.intervalKey = setInterval(() => {
            this.gameStatus.timeLimit--;
           if(this.gameStatus.timeLimit===0){
            this.nextStep();
           }else{
            this.renderTimeLimitStr();
            console.log(`残り時間は${this.gameStatus.timeLimit}秒です`);
           }
        }, 1000);
    }

    clearTimer() {
        clearInterval(this.gameStatus.intervalKey);
        this.gameStatus.intervalKey = null;
    }

    // プレイ画面
    displayQuestionView() {
        console.log(`選択中のレベル${this.gameStatus.level}`);
        console.log(`選択中のstep${this.gameStatus.step}`);
        this.settTimer();
        // step1のみ表示
        const stepKey = `step${this.gameStatus.step}`;
        const currentQuestion = this.quizData[this.gameStatus.level][stepKey];

        const choiceStrs = [];
        for (const choice of currentQuestion.choices) {
            choiceStrs.push(`
            <level><input type="radio" name="choice" value="${choice}"/>
            ${choice}
            </level>`);
        }
        const html = `
        <p>${currentQuestion.word}</p>
        <div>${choiceStrs.join("")}</div>   
        <div class="action">     
        <button class="nextBtn">解答する</button>
        </div>
        <p class="sec">残り時間${this.gameStatus.timeLimit}秒`;



        const parentElm = document.createElement("div");
        parentElm.className = "question";
        parentElm.innerHTML = html;

        // 解答するボタンを押したときの処理
        const nextBtnElm = parentElm.querySelector(".nextBtn");
        nextBtnElm.addEventListener("click", () => {
            this.nextStep();
        });

        this.replaceView(parentElm);  //プレイ画面のみを表示
    }

    // 制限時間をHTMLに表示
    renderTimeLimitStr() {
        const secElm = this.rootElm.querySelector(".sec");
        secElm.innerText = `残り時間${this.gameStatus.timeLimit}秒`;
    }

    // 結果画面
    displayResultView() {
        const score = this.calcScore();
        const html = `
        <p>ゲーム終了</p>
        <p>正解率:${score}% <br>
        <button class="resetBtn">スタート画面に戻る</button>`;

        const parentElm = document.createElement("div");
        parentElm.className = "results";
        parentElm.innerHTML = html;

        const resetBtnElm = parentElm.querySelector(".resetBtn");
        resetBtnElm.addEventListener("click", () => {
            this.resetGame();
            this.displayStartView();
        });

        this.replaceView(parentElm); //結果画面のみ表示
    }

    // 今表示している内容の初期化して新たに要素をセット
    replaceView(elm) {
        this.rootElm.innerHTML = "";
        this.rootElm.appendChild(elm);
    }
}

new wordQuiz(document.getElementById("app")).init();

const data = [1, 2, 3, 4];
const results = data.map((num) => { //引数numは配列の中身
    return num + 1;
});

console.log(results);