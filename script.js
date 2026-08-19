const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbze5fwtLrRUjqvFPTnSVEgY-cEPN-Ovu0pnKNaIcS_dq-mieNq-oEUOsLdb3KuVxWXjDg/exec"; 

async function checkIfUsed(regNo) {
  try {
    const res = await fetch(`${SCRIPT_URL}?regNo=${regNo}`);
    const result = await res.text();
    return result; // "OK" or "ALREADY_USED"
  } catch(err) {
    console.log("Error checking reg:", err);
    alert("Network error. Please try again");
    return "ERROR";
  }
}

// ===== ANTI-CHEAT 1: Block shortcuts =====
document.addEventListener('contextmenu', e => e.preventDefault());
// ===== ANTI-CHEAT 1: Block shortcuts =====
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('paste', e => e.preventDefault());
document.addEventListener('cut', e => e.preventDefault());

document.addEventListener('keydown', e => {
  if (e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.key === 'u') ||
      (e.ctrlKey && e.key === 'c') ||
      (e.ctrlKey && e.key === 'v')) {
    e.preventDefault();
    alert("This action is disabled during the exam");
  }
});

let cheated = false;
let examActive = false;
// ===== TIMER VARIABLES =====
let timerInterval;
let timeLeft = 45 * 60; // 60 mins. change as needed
// ===== END ANTI-CHEAT 1 =====

document.addEventListener("DOMContentLoaded", function () {

  const questions = [
    { subject: "Shopping - Size", q: "你穿小号，但是这件衣服太大。你应该说什么？\nNǐ chuān xiǎo hào, dànshì zhè jiàn yīfu tài dà. Nǐ yīnggāi shuō shénme?", opts: ["有大一点的吗？", "有小一点的吗？", "多少钱一条？", "怎么付钱？"], ans: 1 },
    { subject: "Banking - Payment", q: "你买东西以后想用微信付款。你应该说：\nNǐ mǎi dōngxi yǐhòu xiǎng yòng Wēixìn fùkuǎn. Nǐ yīnggāi shuō:", opts: ["我可以扫码吗？", "我可以试试吗？", "我可以换吗？", "我可以坐吗？"], ans: 0 },
    { subject: "Hospital - Problem", q: "你去医院，因为你身体不舒服。你应该说：\nNǐ qù yīyuàn, yīnwèi nǐ shēntǐ bù shūfu. Nǐ yīnggāi shuō:", opts: ["我想买一件衣服。", "我身体不舒服。", "我要一杯水。", "我要去银行。"], ans: 1 },
    { subject: "Transportation - Direction", q: "你想问银行在哪里。你应该说：\nNǐ xiǎng wèn yínháng zài nǎli. Nǐ yīnggāi shuō:", opts: ["银行多少钱？", "银行在哪里？", "银行几点？", "银行是什么？"], ans: 1 },
    { subject: "Food - Restaurant", q: "你在餐厅，想要一杯水。你应该说：\nNǐ zài cāntīng, xiǎng yào yì bēi shuǐ. Nǐ yīnggāi shuō:", opts: ["请给我一杯水。", "请给我一件衣服。", "请给我一双鞋。", "请给我一个号码。"], ans: 0 },
    { subject: "Family", q: "你想介绍你的妈妈。哪一句正确？\nNǐ xiǎng jièshào nǐ de māma. Nǎ yí jù zhèngquè?", opts: ["他是我的妈妈。", "她是我的妈妈。", "它是我的妈妈。", "我是我的妈妈。"], ans: 1 },
    { subject: "Time", q: "现在是下午三点。朋友问你现在几点，你应该回答：\nXiànzài shì xiàwǔ sān diǎn. Péngyou wèn nǐ xiànzài jǐ diǎn, nǐ yīnggāi huídá:", opts: ["现在三点下午。", "下午三点。", "三点明天。", "明天三点下午。"], ans: 1 },
    { subject: "Shopping - Price", q: "一件衣服原价400块，现在打七折。多少钱？\nYí jiàn yīfu yuánjià sìbǎi kuài, xiànzài dǎ qī zhé. Duōshao qián?", opts: ["120块", "280块", "300块", "360块"], ans: 1 },
    { subject: "Transportation", q: "你要坐出租车去医院。你应该告诉司机：\nNǐ yào zuò chūzūchē qù yīyuàn. Nǐ yīnggāi gàosu sījī:", opts: ["请去医院。", "请去银行。", "请去饭店。", "请去商店。"], ans: 0 },
    { subject: "Places", q: "你在银行，但是你想去医院。哪一句最合适？\nNǐ zài yínháng, dànshì nǐ xiǎng qù yīyuàn. Nǎ yí jù zuì héshì?", opts: ["医院在哪里？", "医院多少钱？", "医院什么颜色？", "医院多大号？"], ans: 0 },
    { subject: "Daily Communication", q: "别人帮了你，你应该说：\nBiérén bāng le nǐ, nǐ yīnggāi shuō:", opts: ["对不起。", "谢谢。", "没关系。", "再见。"], ans: 1 },
    { subject: "Hospital - Practical", q: "医生问：“你哪里不舒服？”\nYīshēng wèn: “Nǐ nǎli bù shūfu?”\n你头疼，应该回答：\nNǐ tóuténg, yīnggāi huídá:", opts: ["我头疼。", "我很便宜。", "我很合适。", "我很喜欢。"], ans: 0 },
    { subject: "Food - Ordering", q: "你想吃面条。你应该说：\nNǐ xiǎng chī miàntiáo. Nǐ yīnggāi shuō:", opts: ["我要一碗面条。", "我要一双面条。", "我要一件面条。", "我要一个面条。"], ans: 0 },
    { subject: "Banking - Withdrawal", q: "你去银行取钱。哪一句最合适？\nNǐ qù yínháng qǔ qián. Nǎ yí jù zuì héshì?", opts: ["我想买钱。", "我想取钱。", "我想穿钱。", "我想试钱。"], ans: 1 },
    { subject: "Numbers / Money", q: "你有500块，买东西花了320块。还剩多少钱？\nNǐ yǒu wǔbǎi kuài, mǎi dōngxi huā le sānbǎi èrshí kuài. Hái shèng duōshao qián?", opts: ["120块", "150块", "180块", "220块"], ans: 2 },
    { subject: "Daily Life / Home", q: "你在家，朋友问：“你在哪儿？”\nNǐ zài jiā, péngyou wèn: “Nǐ zài nǎr?”\n你应该说：\nNǐ yīnggāi shuō:", opts: ["我在家。", "我是家。", "家在我。", "我有家。"], ans: 0 },
    { subject: "Shopping - Negotiation", q: "一件衣服150块，你觉得太贵，想便宜一点。哪一句最自然？\nYí jiàn yīfu yìbǎi wǔshí kuài, nǐ juéde tài guì, xiǎng piányi yīdiǎn. Nǎ yí jù zuì zìrán?", opts: ["能便宜点吗？", "能大一点吗？", "能长一点吗？", "能晚一点吗？"], ans: 0 },
    { subject: "Transportation - Direction", q: "别人告诉你：“一直走，然后左拐。”\nBiérén gàosu nǐ: “Yìzhí zǒu, ránhòu zuǒ guǎi.”\n这是什么意思？\nZhè shì shénme yìsi?", opts: ["一直走，然后向右。", "一直走，然后向左。", "不走，停下来。", "回家。"], ans: 1 },
    { subject: "Family / Age", q: "你的儿子十岁。别人问：“你儿子多大了？”\nNǐ de érzi shí suì. Biérén wèn: “Nǐ érzi duō dà le?”\n你应该回答：\nNǐ yīnggāi huídá:", opts: ["他十块。", "他十号。", "他十岁。", "他十点。"], ans: 2 },
    { subject: "Time / Schedule", q: "你的朋友约你下午两点见面。现在是下午一点半。你应该怎么理解？\nNǐ de péngyou yuē nǐ xiàwǔ liǎng diǎn jiànmiàn. Xiànzài shì xiàwǔ yì diǎn bàn. Nǐ yīnggāi zěnme lǐjiě?", opts: ["见面时间已经过了。", "还有半个小时。", "还有两个小时。", "明天才见面。"], ans: 1 },
    { subject: "Restaurant - Problem", q: "你点的是面条，但是服务员给你的是米饭。你应该说：\nNǐ diǎn de shì miàntiáo, dànshì fúwùyuán gěi nǐ de shì mǐfàn. Nǐ yīnggāi shuō:", opts: ["不好意思，我要的是面条。", "谢谢，我不要钱。", "我喜欢医院。", "银行在哪里？"], ans: 0 },
    { subject: "Shopping - Return", q: "衣服不合适，你想换一个号码。你应该说：\nYīfu bù héshì, nǐ xiǎng huàn yí ge hàomǎ. Nǐ yīnggāi shuō:", opts: ["可以换吗？", "可以吃吗？", "可以坐吗？", "可以走吗？"], ans: 0 },
    { subject: "Places / Location", q: "书店在银行的右边。哪一句正确？\nShūdiàn zài yínháng de yòubiān. Nǎ yí jù zhèngquè?", opts: ["银行在书店的右边。", "书店在银行的右边。", "书店在银行里面。", "银行在书店里面。"], ans: 1 },
    { subject: "Hospital / Communication", q: "你生病了，今天不能上课。你应该告诉老师：\nNǐ shēngbìng le, jīntiān bù néng shàngkè. Nǐ yīnggāi gàosu lǎoshī:", opts: ["老师，我今天生病了。", "老师，我今天买衣服。", "老师，我今天吃鞋子。", "老师，我今天去银行买饭。"], ans: 0 },
    { subject: "Money / Discount", q: "一件毛衣260块，学生可以打九折。学生应该付多少钱？\nYí jiàn máoyī liǎngbǎi liùshí kuài, xuéshēng kěyǐ dǎ jiǔ zhé. Xuéshēng yīnggāi fù duōshao qián?", opts: ["204块", "224块", "234块", "260块"], ans: 2 },
    { subject: "Everyday Requests", q: "你听不清楚别人说话，希望他再说一次。你应该说：\nNǐ tīng bù qīngchu biérén shuōhuà, xīwàng tā zài shuō yí cì. Nǐ yīnggāi shuō:", opts: ["请再说一次。", "请再买一次。", "请再吃一次。", "请再走一次。"], ans: 0 },
    { subject: "Transportation + Time", q: "你的火车上午八点开，现在是七点半。你应该：\nNǐ de huǒchē shàngwǔ bā diǎn kāi, xiànzài shì qī diǎn bàn. Nǐ yīnggāi:", opts: ["快一点去车站。", "明天再去车站。", "下午再去。", "回家睡觉。"], ans: 0 },
    { subject: "Food + Quantity", q: "你想买两杯咖啡。哪一句正确？\nNǐ xiǎng mǎi liǎng bēi kāfēi. Nǎ yí jù zhèngquè?", opts: ["我要两件咖啡。", "我要两条咖啡。", "我要两杯咖啡。", "我要两双咖啡。"], ans: 2 },
    { subject: "Practical Problem-Solving", q: "你去银行，但是银行已经关门了。你应该怎么理解？\nNǐ qù yínháng, dànshì yínháng yǐjīng guānmén le. Nǐ yīnggāi zěnme lǐjiě?", opts: ["现在可以进去办业务。", "现在不能进去办业务。", "现在可以买衣服。", "现在可以看医生。"], ans: 1 },
    { subject: "Integrated Situation", q: "你明天上午九点要去医院。你现在在家，需要先问妈妈医院在哪里。哪一句最合适？\nNǐ míngtiān shàngwǔ jiǔ diǎn yào qù yīyuàn. Nǐ xiànzài zài jiā, xūyào xiān wèn māma yīyuàn zài nǎli. Nǎ yí jù zuì héshì?", opts: ["妈妈，医院在哪里？", "妈妈，医院多少钱？", "妈妈，医院是什么颜色？", "妈妈，医院穿什么号？"], ans: 0 },
  ];

  let current = 0;
  let answers = Array(questions.length).fill(null);
  let marked = Array(questions.length).fill(false);
  let time = 45 * 60; // 60 mins. Change as needed
  let timerInterval;
  let studentReg = "";

  // LOGIN
  const validUsers = {
    "YXL202601-001": "k9pl2vqza7",
    "YXL202601-007": "m4trw8bfg1",
    "YXL202601-011": "yx6gp3svq9",
    "YXL202601-006":"j7dn2tcr5",
    "YXL202601-220":"12345",
    // Add all students here
  };

  let usedUsers = JSON.parse(localStorage.getItem('usedUsers') || "[]");

  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const reg = document.getElementById('regNumber').value.trim().toUpperCase();
    const pass = document.getElementById('password').value.trim();

    if (!validUsers[reg]) {
      document.getElementById('loginError').innerText = "Invalid Reg Number";
      return;
    }
    if (validUsers[reg] !== pass) {
      document.getElementById('loginError').innerText = "Wrong Password";
      return;
    }
    if (usedUsers.includes(reg)) {
      document.getElementById('loginError').innerText = "This Reg Number has already been used";
      return;
    }

    usedUsers.push(reg);
    localStorage.setItem('usedUsers', JSON.stringify(usedUsers));

    studentReg = reg;
    document.getElementById('studentNameDisplay').innerText = studentReg;
    document.getElementById('studentInfo').innerText = `Reg: ${studentReg}`;
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('instructionScreen').classList.remove('hidden');
  });

  // START TEST
document.getElementById('startTestBtn').addEventListener("click", async function () {
  
  let regNo = studentReg; // you already have regNo saved in studentReg from login
  
  // NEW: Check if this regNo has already submitted
  let status = await checkIfUsed(regNo);
  
  if(status === "ALREADY_USED"){
    alert("This Reg Number has already been used and submitted");
    location.reload(); // send them back to login
    return;
  } 
  
  if(status === "OK"){
    // Only run this if OK
    examActive = true;
    document.getElementById('instructionScreen').classList.add('hidden');
    document.getElementById('testScreen').classList.remove('hidden');
    loadQuestion();
    startTimer();
    document.body.classList.add('exam-mode');
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  }
});

  // BUTTONS
  document.getElementById('nextBtn').addEventListener('click', nextQ);
  document.getElementById('prevBtn').addEventListener('click', prevQ);
  document.getElementById('clearBtn').addEventListener('click', clearAnswer);
  document.getElementById('flagBtn').addEventListener('click', toggleMark);
  document.getElementById('submitBtn').addEventListener('click', submitTest);

 function loadQuestion() {
  const q = questions[current];
  document.getElementById('qNum').innerText = current + 1;
  document.getElementById('qTotal').innerText = questions.length;
  document.getElementById('subject').innerText = q.subject;
  document.getElementById('questionText').innerText = q.q; // make sure your question uses "q"
  
  const optsDiv = document.getElementById('options');
  optsDiv.innerHTML = "";
  
  q.opts.forEach((opt, index) => {
    const labelLetter = ["A", "B", "C", "D"][index]; // Convert 0,1,2,3 to A,B,C,D
    const label = document.createElement('label');
    
    if (answers[current] === index) label.classList.add('selected');
    
    label.innerHTML = `<input type="radio" name="opt" ${answers[current] === index? 'checked' : ''}> <span><b>${labelLetter}.</b> ${opt}</span>`;
    label.onclick = () => selectAnswer(index);
    optsDiv.appendChild(label);
  });
  
  renderGrid();
}

  function selectAnswer(index) {
    answers[current] = index;
    loadQuestion(); // reload to show selected
  }

  function clearAnswer() {
    answers[current] = null;
    loadQuestion();
  }

  function nextQ() {
    if (current < questions.length - 1) current++;
    loadQuestion();
  }

  function prevQ() {
    if (current > 0) current--;
    loadQuestion();
  }

  function toggleMark() {
    marked[current] = !marked[current];
    loadQuestion();
  }

  function renderGrid() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    questions.forEach((_, i) => {
      const btn = document.createElement('div');
      btn.className = 'q-btn';
      if (answers[i] !== null) btn.classList.add('answered');
      if (marked[i]) btn.classList.add('marked');
      if (i === current) btn.classList.add('current');
      btn.innerText = i + 1;
      btn.onclick = () => {
        current = i;
        loadQuestion();
      };
      grid.appendChild(btn);
    });
  }

 function startTimer() {
  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitTest(); // Auto-submit when time is up
      return;
    }
    
    timeLeft--;
    const h = Math.floor(timeLeft / 3600).toString().padStart(2, '0');
    const m = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    
    document.getElementById('timer').innerText = `${h}:${m}:${s}`;
  }, 1000); // counts every 1 second
}

  function submitTest() {
    clearInterval(timerInterval);
    examActive = false;
    document.body.classList.remove('exam-mode');
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }

    let score = 0;
    let answerString = "";
    answers.forEach((a, i) => {
      if (a === questions[i].ans) score++;
      answerString += `Q${i + 1}:${a || 'X'}, `;
    });

    // === SEND TO GOOGLE SHEET + EMAIL ===
    const data = {
      reg: studentReg,
      score: score,
      total: questions.length,
      answers: answerString
    };

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbze5fwtLrRUjqvFPTnSVEgY-cEPN-Ovu0pnKNaIcS_dq-mieNq-oEUOsLdb3KuVxWXjDg/exec";

    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify(data),
    }).then(() => console.log("Result Sent to Google Sheet!"));
    // === END SEND CODE ===

    document.getElementById('testScreen').innerHTML = `
      <div class="login-container">
        <div class="login-box">
          <h1>Test Submitted</h1>
          <p><b>Reg Number:</b> ${studentReg}</p>
          <h2>Your Score:  ${score} / ${questions.length}</h2>
          <button class="btn-primary full" onclick="location.reload()">Logout</button>
        </div>
      </div>
    `;
  }

  // ===== ANTI-CHEAT 4: FORCE AUTO SUBMIT ON TAB LEAVE =====
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && examActive && !cheated) {
      cheated = true;
      examActive = false;
      clearInterval(timerInterval);
      submitTest();
    }
  });
  // ===== END ANTI-CHEAT 4 =====

}); // End DOMContentLoaded