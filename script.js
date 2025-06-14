// Créer les étoiles animées
function createStars() {
  const starsContainer = document.querySelector('.stars');
  for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 3 + 's';
    starsContainer.appendChild(star);
  }
}
createStars();

// Variables globales
let questions = [];
let current = 0;
const scores = { Gryffondor: 0, Serpentard: 0, Poufsouffle: 0, Serdaigle: 0 };

// Mettre à jour la barre de progression
function updateProgress() {
  const progress = ((current + 1) / questions.length) * 100;
  document.getElementById('progress').style.width = progress + '%';
}

// Afficher une question
function showQuestion() {
  const quizDiv = document.getElementById("quiz");
  const resultDiv = document.getElementById("result");
  quizDiv.innerHTML = "";
  resultDiv.className = "result";
  resultDiv.innerHTML = "";

  if (current >= questions.length) {
    showResult();
    return;
  }

  updateProgress();

  const q = questions[current];
  const qDiv = document.createElement("div");
  qDiv.className = "question";
  
  // Ajouter le numéro de question
  const questionNumber = document.createElement("div");
  questionNumber.className = "question-number";
  questionNumber.textContent = `Question ${current + 1} sur ${questions.length}`;
  qDiv.appendChild(questionNumber);
  
  const title = document.createElement("h3");
  title.textContent = q.text;
  qDiv.appendChild(title);

  const optionsDiv = document.createElement("div");
  optionsDiv.className = "options";

  q.options.forEach((opt, index) => {
    const btn = document.createElement("button");
    btn.textContent = opt.text;
    btn.onclick = () => {
      scores[opt.house]++;
      current++;
      // Petit délai pour l'animation
      setTimeout(() => showQuestion(), 300);
    };
    btn.style.animationDelay = `${index * 0.1}s`;
    optionsDiv.appendChild(btn);
  });

  qDiv.appendChild(optionsDiv);
  quizDiv.appendChild(qDiv);
}

// Afficher le résultat
function showResult() {
  const quizDiv = document.getElementById("quiz");
  const resultDiv = document.getElementById("result");
  quizDiv.innerHTML = "";

  let maxHouse = "";
  let maxScore = -1;
  const totalQuestions = questions.length;
  
  // Calculer les pourcentages
  const percentages = {};
  for (let house in scores) {
    percentages[house] = Math.round((scores[house] / totalQuestions) * 100);
    if (scores[house] > maxScore) {
      maxScore = scores[house];
      maxHouse = house;
    }
  }

  const cssClass = maxHouse.toLowerCase();
  resultDiv.className = "result show " + cssClass;

  // Créer le badge de la maison
  const badge = document.createElement("div");
  badge.className = "house-badge";
  badge.innerHTML = getHouseBadge(maxHouse);

  const houseName = document.createElement("div");
  houseName.className = "house-name";
  houseName.textContent = maxHouse;

  const message = document.createElement("p");
  message.textContent = getHouseMessage(maxHouse, percentages[maxHouse]);

  // Créer le conteneur des statistiques
  const statsContainer = document.createElement("div");
  statsContainer.className = "stats-container";
  
  const statsTitle = document.createElement("div");
  statsTitle.className = "stats-title";
  statsTitle.textContent = "Tes affinités avec chaque maison";
  statsContainer.appendChild(statsTitle);

  // Trier les maisons par score décroissant
  const sortedHouses = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
  
  sortedHouses.forEach((house, index) => {
    const statBar = document.createElement("div");
    statBar.className = "stat-bar";
    
    const statLabel = document.createElement("div");
    statLabel.className = "stat-label";
    
    const statHouse = document.createElement("span");
    statHouse.className = "stat-house";
    statHouse.textContent = house;
    
    const statPercentage = document.createElement("span");
    statPercentage.className = "stat-percentage";
    statPercentage.textContent = `${percentages[house]}%`;
    
    statLabel.appendChild(statHouse);
    statLabel.appendChild(statPercentage);
    
    const statProgress = document.createElement("div");
    statProgress.className = "stat-progress";
    
    const statFill = document.createElement("div");
    statFill.className = `stat-fill ${house.toLowerCase()}-stat`;
    // Animation retardée pour chaque barre
    setTimeout(() => {
      statFill.style.width = `${percentages[house]}%`;
    }, 500 + (index * 200));
    
    statProgress.appendChild(statFill);
    statBar.appendChild(statLabel);
    statBar.appendChild(statProgress);
    statsContainer.appendChild(statBar);
  });

  const replayBtn = document.createElement("button");
  replayBtn.className = "replay-button";
  replayBtn.textContent = "Refaire le test";
  replayBtn.onclick = () => {
    current = 0;
    for (let house in scores) scores[house] = 0;
    document.getElementById('progress').style.width = '0%';
    showQuestion();
  };

  resultDiv.appendChild(badge);
  resultDiv.appendChild(houseName);
  resultDiv.appendChild(message);
  resultDiv.appendChild(statsContainer);
  resultDiv.appendChild(replayBtn);
}

// Obtenir le badge SVG de la maison
function getHouseBadge(house) {
  const badges = {
    Gryffondor: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#740001" stroke="#ffc500" stroke-width="5"/><path d="M100 40 L120 80 L160 80 L130 110 L140 150 L100 120 L60 150 L70 110 L40 80 L80 80 Z" fill="#ffc500"/></svg>',
    Serpentard: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#1a472a" stroke="#aaaaaa" stroke-width="5"/><path d="M100 30 Q80 60 80 100 T100 170 Q120 140 120 100 T100 30" fill="#aaaaaa" stroke="#aaaaaa" stroke-width="3"/></svg>',
    Poufsouffle: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#ecb939" stroke="#372e29" stroke-width="5"/><rect x="70" y="70" width="60" height="60" rx="10" fill="#372e29"/></svg>',
    Serdaigle: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#0e1a40" stroke="#aaaadd" stroke-width="5"/><path d="M100 50 L70 100 L100 90 L130 100 Z M100 90 L80 130 L100 120 L120 130 Z" fill="#aaaadd"/></svg>'
  };
  return badges[house] || '';
}

// Obtenir le message de la maison
function getHouseMessage(house, percentage) {
  const messages = {
    Gryffondor: `Avec ${percentage}% d'affinité, tu es un vrai Gryffondor ! Brave et courageux, tu feras honneur à ta maison par ton audace et ta détermination !`,
    Serpentard: `Avec ${percentage}% d'affinité, tu es un véritable Serpentard ! Rusé et ambitieux, tu atteindras tes objectifs grâce à ton intelligence et ta détermination !`,
    Poufsouffle: `Avec ${percentage}% d'affinité, tu es un authentique Poufsouffle ! Loyal et travailleur, tu es un ami sur qui on peut toujours compter !`,
    Serdaigle: `Avec ${percentage}% d'affinité, tu es un pur Serdaigle ! Sage et érudit, ta soif de connaissance te mènera loin !`
  };
  return messages[house] || '';
}

// Charger les questions depuis le fichier JSON
fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    questions = data;
    showQuestion();
  })
  .catch(error => {
    document.getElementById("quiz").innerHTML = 
      `<div class="question">
        <h3 style="color: #ff6b6b;">Erreur de chargement</h3>
        <p>Impossible de charger les questions. Assurez-vous que le fichier questions.json est présent.</p>
      </div>`;
    console.error('Erreur:', error);
  });