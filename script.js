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
let selectedQuestions = [];
let current = 0;
const scores = { Gryffondor: 0, Serpentard: 0, Poufsouffle: 0, Serdaigle: 0 };
let snitchGamePlayed = false;
const TOTAL_QUIZ_QUESTIONS = 10;

// Fonction pour sélectionner les questions intelligemment
function selectQuestions(allQuestions) {
  // Organiser les questions par catégorie
  const questionsByCategory = {};
  
  allQuestions.forEach(question => {
    question.categories.forEach(category => {
      if (!questionsByCategory[category]) {
        questionsByCategory[category] = [];
      }
      questionsByCategory[category].push(question);
    });
  });

  const selectedQuestions = [];
  const usedQuestions = new Set();

  // Sélectionner une question de chaque catégorie (8 catégories)
  const categories = Object.keys(questionsByCategory);
  categories.forEach(category => {
    const categoryQuestions = questionsByCategory[category].filter(q => !usedQuestions.has(q));
    if (categoryQuestions.length > 0) {
      const randomQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
      selectedQuestions.push(randomQuestion);
      usedQuestions.add(randomQuestion);
    }
  });

  // Ajouter 2 questions supplémentaires au hasard
  const remainingQuestions = allQuestions.filter(q => !usedQuestions.has(q));
  for (let i = 0; i < 2 && remainingQuestions.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
    const randomQuestion = remainingQuestions.splice(randomIndex, 1)[0];
    selectedQuestions.push(randomQuestion);
  }

  // Mélanger les questions pour un ordre aléatoire
  return selectedQuestions.sort(() => Math.random() - 0.5);
}

// Mettre à jour la barre de progression
function updateProgress() {
  const progress = ((current + 1) / TOTAL_QUIZ_QUESTIONS) * 100;
  document.getElementById('progress').style.width = progress + '%';
}

// Afficher une question
function showQuestion() {
  const quizDiv = document.getElementById("quiz");
  const resultDiv = document.getElementById("result");
  quizDiv.innerHTML = "";
  resultDiv.className = "result";
  resultDiv.innerHTML = "";

  // Vérifier si on doit lancer le mini-jeu après la 10ème question
  if (current === TOTAL_QUIZ_QUESTIONS && !snitchGamePlayed) {
    snitchGamePlayed = true;
    launchSnitchGame();
    return;
  }

  if (current >= TOTAL_QUIZ_QUESTIONS) {
    showResult();
    return;
  }

  updateProgress();

  const q = selectedQuestions[current];
  const qDiv = document.createElement("div");
  qDiv.className = "question";
  
  // Ajouter le numéro de question
  const questionNumber = document.createElement("div");
  questionNumber.className = "question-number";
  questionNumber.textContent = `Question ${current + 1} sur ${TOTAL_QUIZ_QUESTIONS}`;
  qDiv.appendChild(questionNumber);

  // Ajouter l'indicateur de catégorie
  const categoryIndicator = document.createElement("div");
  categoryIndicator.className = "category-indicator";
  const primaryCategory = q.categories[0];
  categoryIndicator.textContent = getCategoryIcon(primaryCategory) + " " + primaryCategory;
  qDiv.appendChild(categoryIndicator);
  
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

// Obtenir l'icône de catégorie
function getCategoryIcon(category) {
  const icons = {
    "Créatures magiques": "🐉",
    "Objets magiques": "✨",
    "Sorts & potions": "🔮",
    "Salles et lieux étranges": "🏰",
    "Phénomènes étranges": "👻",
    "Relations & interactions": "👥",
    "Énigmes & mystères": "🧩",
    "Autre": "⚡"
  };
  return icons[category] || "⚡";
}

// Lancer le mini-jeu
function launchSnitchGame() {
  const quizDiv = document.getElementById("quiz");
  
  // Message d'introduction
  quizDiv.innerHTML = `
    <div class="question" style="text-align: center;">
      <h3 style="font-size: 2rem;">⚡ Défi Final ! ⚡</h3>
      <p style="font-size: 1.3rem; color: #c9b037; margin: 2rem 0;">
        Tu as terminé le quiz ! Maintenant, le Vif d'Or est apparu !<br>
        Montre tes talents d'Attrapeur pour gagner des points bonus !
      </p>
      <button class="replay-button" onclick="startSnitchGame()">
        Commencer la chasse au Vif d'Or
      </button>
      <button class="continue-button" style="margin-top: 1rem; background: transparent; border-color: #c9b037; color: #c9b037;" onclick="skipSnitchGame()">
        Passer le défi
      </button>
    </div>
  `;
}

// Démarrer le jeu
window.startSnitchGame = function() {
  const game = new SnitchGame((score) => {
    // Le score est déjà géré dans snitchGameComplete
  });
  game.init();
};

// Passer le jeu
window.skipSnitchGame = function() {
  window.snitchScore = 0;
  showResult();
};

// Afficher le résultat
function showResult() {
  const quizDiv = document.getElementById("quiz");
  const resultDiv = document.getElementById("result");
  quizDiv.innerHTML = "";

  let maxHouse = "";
  let maxScore = -1;
  
  // Ajouter des points bonus basés sur le score du Vif d'Or
  if (window.snitchScore) {
    // Bonus pour la maison dominante
    const houseBonus = {
      3: 2,  // Vif attrapé = 2 points bonus
      2: 1,  // Bien essayé = 1 point bonus
      1: 0   // Participation = pas de bonus
    };
    
    // Trouver la maison avec le plus de points actuellement
    let leadingHouse = "";
    let leadingScore = -1;
    for (let house in scores) {
      if (scores[house] > leadingScore) {
        leadingScore = scores[house];
        leadingHouse = house;
      }
    }
    
    // Appliquer le bonus
    if (leadingHouse && houseBonus[window.snitchScore]) {
      scores[leadingHouse] += houseBonus[window.snitchScore];
    }
  }
  
  // Calculer les pourcentages
  const totalPoints = Object.values(scores).reduce((a, b) => a + b, 0);
  const percentages = {};
  for (let house in scores) {
    percentages[house] = Math.round((scores[house] / totalPoints) * 100);
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
    snitchGamePlayed = false;
    window.snitchScore = 0;
    for (let house in scores) scores[house] = 0;
    document.getElementById('progress').style.width = '0%';
    // Resélectionner de nouvelles questions
    selectedQuestions = selectQuestions(questions);
    showQuestion();
  };

  resultDiv.appendChild(badge);
  resultDiv.appendChild(houseName);
  resultDiv.appendChild(message);
  
  // Ajouter un message spécial si le joueur a attrapé le Vif d'Or
  if (window.snitchScore === 3) {
    const snitchBadge = document.createElement("div");
    snitchBadge.style.cssText = "color: #ffd700; font-style: italic; margin: 1rem 0; font-size: 1.1rem;";
    snitchBadge.innerHTML = "✨ Attrapeur d'exception ! Le Vif d'Or a renforcé ton appartenance à ta maison ! ✨";
    resultDiv.appendChild(snitchBadge);
  }
  
  resultDiv.appendChild(statsContainer);
  resultDiv.appendChild(replayBtn);
}

// Obtenir le badge SVG de la maison (amélioré)
function getHouseBadge(house) {
  const badges = {
    Gryffondor: `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="gryffGrad" cx="50%" cy="30%">
            <stop offset="0%" style="stop-color:#ffd700"/>
            <stop offset="100%" style="stop-color:#740001"/>
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="90" fill="url(#gryffGrad)" stroke="#ffc500" stroke-width="6"/>
        <path d="M100 30 L85 55 Q75 45 60 55 L70 75 Q65 85 75 95 L85 85 L100 110 L115 85 Q125 85 130 95 Q135 85 130 75 L140 55 Q125 45 115 55 Z" fill="#ffc500" stroke="#740001" stroke-width="2"/>
        <circle cx="85" cy="65" r="3" fill="#740001"/>
        <circle cx="115" cy="65" r="3" fill="#740001"/>
        <path d="M90 85 Q100 90 110 85" stroke="#740001" stroke-width="2" fill="none"/>
      </svg>`,
    Serpentard: `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="serpGrad" cx="50%" cy="30%">
            <stop offset="0%" style="stop-color:#aaaaaa"/>
            <stop offset="100%" style="stop-color:#1a472a"/>
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="90" fill="url(#serpGrad)" stroke="#aaaaaa" stroke-width="6"/>
        <path d="M100 40 Q80 50 85 70 Q90 80 85 90 Q80 100 90 110 Q100 120 110 110 Q120 100 115 90 Q110 80 115 70 Q120 50 100 40" fill="#aaaaaa" stroke="#1a472a" stroke-width="2"/>
        <circle cx="95" cy="60" r="2" fill="#1a472a"/>
        <circle cx="105" cy="60" r="2" fill="#1a472a"/>
        <path d="M85 70 Q100 75 115 70" stroke="#1a472a" stroke-width="1" fill="none"/>
        <path d="M90 85 Q95 90 100 85 Q105 90 110 85" stroke="#1a472a" stroke-width="1" fill="none"/>
      </svg>`,
    Poufsouffle: `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="puffGrad" cx="50%" cy="30%">
            <stop offset="0%" style="stop-color:#ffeb3b"/>
            <stop offset="100%" style="stop-color:#ecb939"/>
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="90" fill="url(#puffGrad)" stroke="#372e29" stroke-width="6"/>
        <ellipse cx="100" cy="80" rx="35" ry="25" fill="#372e29"/>
        <circle cx="90" cy="75" r="3" fill="#ecb939"/>
        <circle cx="110" cy="75" r="3" fill="#ecb939"/>
        <path d="M85 90 Q100 95 115 90" stroke="#ecb939" stroke-width="2" fill="none"/>
        <rect x="85" y="110" width="30" height="40" rx="5" fill="#372e29"/>
        <circle cx="100" cy="130" r="8" fill="#ecb939"/>
      </svg>`,
    Serdaigle: `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ravGrad" cx="50%" cy="30%">
            <stop offset="0%" style="stop-color:#aaaadd"/>
            <stop offset="100%" style="stop-color:#0e1a40"/>
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="90" fill="url(#ravGrad)" stroke="#aaaadd" stroke-width="6"/>
        <path d="M100 40 L75 70 Q70 80 80 85 L90 80 L100 90 L110 80 Q120 85 130 80 Q125 70 100 40" fill="#aaaadd" stroke="#0e1a40" stroke-width="2"/>
        <circle cx="90" cy="65" r="2" fill="#0e1a40"/>
        <circle cx="110" cy="65" r="2" fill="#0e1a40"/>
        <path d="M85 80 Q100 85 115 80" stroke="#0e1a40" stroke-width="1" fill="none"/>
        <path d="M80 100 L100 110 L120 100 L110 130 L100 125 L90 130 Z" fill="#aaaadd" stroke="#0e1a40" stroke-width="1"/>
      </svg>`
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

// Rendre showQuestion accessible globalement pour le mini-jeu
window.showQuestion = showQuestion;

// Charger les questions depuis le fichier JSON
document.addEventListener('DOMContentLoaded', () => {
  // Cacher l'écran de chargement après un délai
  setTimeout(() => {
    const loadingScreen = document.getElementById('loading');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }, 1500);
});

fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    questions = data.questions;
    // Sélectionner intelligemment les questions pour ce quiz
    selectedQuestions = selectQuestions(questions);
    console.log('Questions sélectionnées:', selectedQuestions.map(q => q.categories[0]));
    
    // Cacher immédiatement l'écran de chargement si les questions sont chargées
    const loadingScreen = document.getElementById('loading');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
    
    showQuestion();
  })
  .catch(error => {
    // Cacher l'écran de chargement même en cas d'erreur
    const loadingScreen = document.getElementById('loading');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
    
    document.getElementById("quiz").innerHTML = 
      `<div class="question">
        <h3 style="color: #ff6b6b;">⚠️ Erreur de chargement</h3>
        <p>Le Choixpeau semble avoir des difficultés... Assurez-vous que le fichier questions.json est présent et réessayez.</p>
        <button class="replay-button" onclick="location.reload()">Réessayer</button>
      </div>`;
    console.error('Erreur:', error);
  });