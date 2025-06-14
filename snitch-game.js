// Mini-jeu Snitch Chase - Défi Final
class SnitchGame {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.canvas = null;
    this.ctx = null;
    this.gameRunning = false;
    this.score = 0;
    this.timeLeft = 30; // secondes
    this.difficulty = 1.4; // Difficulté de base
    
    // Position du joueur
    this.playerX = 0.5; // 0 = gauche, 1 = droite
    this.playerY = 0.5; // Position au centre maintenant
    
    // Position du Vif d'Or
    this.snitchX = 0.5;
    this.snitchY = 0.2;  // Commence en haut
    this.snitchVelocityX = 0;
    this.snitchVelocityY = 0;
    this.snitchCaught = false;
    this.snitchTarget = { x: 0.5, y: 0.8 }; // Point cible pour le Vif
    this.snitchEscaping = false; // Pour l'effet visuel d'échappement
    
    // Obstacles
    this.obstacles = [];
    this.obstacleSpeed = 0.004;  // Obstacles plus lents
    
    // Contrôles
    this.useGyroscope = false;
    this.touchStartX = null;
    this.tiltX = 0;
    
    // Animation
    this.animationId = null;
    this.lastTime = 0;
    
    // Particules
    this.particles = [];
    
    // Score et capture
    this.catchProgress = 0;
    this.maxCatchProgress = 75; // Facile à atteindre 100%
  }
  
  init() {
    // Créer le conteneur du jeu
    const gameContainer = document.createElement('div');
    gameContainer.className = 'snitch-game-container';
    gameContainer.innerHTML = `
      <div class="snitch-game-header">
        <h3>🪶 Défi Final : Chasse au Vif d'Or ! 🪶</h3>
        <div class="snitch-timer">
          <span class="timer-icon">⏱</span>
          <span id="snitch-time">${this.timeLeft}s</span>
        </div>
      </div>
      <canvas id="snitch-canvas"></canvas>
      <div class="snitch-instructions" id="snitch-instructions">
        <p><strong>C'est le moment de vérité !</strong></p>
        <p>Dirige le cercle vers le Vif d'Or et maintiens-le dessus pour le capturer !</p>
        <p class="control-hint"></p>
      </div>
      <div class="catch-progress">
        <div class="catch-bar" id="catch-bar"></div>
      </div>
    `;
    
    // Remplacer le contenu du quiz temporairement
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = '';
    quizDiv.appendChild(gameContainer);
    
    // Initialiser le canvas
    this.canvas = document.getElementById('snitch-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    
    // Vérifier les capacités et configurer les contrôles immédiatement
    this.setupTouch();  // Toujours configurer le touch/souris d'abord
    this.checkGyroscope();  // Puis vérifier si le gyroscope est disponible
    
    // Event listeners
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Démarrer après un court délai
    setTimeout(() => this.start(), 1000);
  }
  
  checkGyroscope() {
    if (window.DeviceOrientationEvent) {
      // Demander la permission sur iOS 13+
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              this.setupGyroscope();
            } else {
              this.setupTouch();
            }
          })
          .catch(() => this.setupTouch());
      } else {
        // Vérifier si le gyroscope fonctionne
        let testHandler = (e) => {
          if (e.gamma !== null) {
            this.setupGyroscope();
          } else {
            this.setupTouch();
          }
          window.removeEventListener('deviceorientation', testHandler);
        };
        window.addEventListener('deviceorientation', testHandler);
        setTimeout(() => {
          window.removeEventListener('deviceorientation', testHandler);
          if (!this.useGyroscope) this.setupTouch();
        }, 1000);
      }
    } else {
      this.setupTouch();
    }
  }
  
  setupGyroscope() {
    this.useGyroscope = true;
    document.querySelector('.control-hint').textContent = '📱 Incline ton téléphone pour diriger le cercle !';
    
    window.addEventListener('deviceorientation', (e) => {
      if (this.gameRunning) {
        // gamma = inclinaison gauche/droite (-90 à 90)
        // beta = inclinaison avant/arrière (-180 à 180)
        const tiltX = Math.max(-30, Math.min(30, e.gamma)) / 30;
        const tiltY = Math.max(-30, Math.min(30, e.beta - 45)) / 30; // -45 pour position naturelle
        
        this.playerX = Math.max(0.1, Math.min(0.9, 0.5 + tiltX * 0.4));
        this.playerY = Math.max(0.1, Math.min(0.9, 0.5 + tiltY * 0.4));
      }
    });
  }
  
  setupTouch() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      document.querySelector('.control-hint').textContent = '👆 Glisse ton doigt pour diriger le cercle !';
    } else {
      document.querySelector('.control-hint').textContent = '🖱️ Déplace ta souris pour diriger le cercle !';
    }
    
    let touchStartX = null;
    let touchStartY = null;
    let baseX = this.playerX;
    let baseY = this.playerY;
    
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      baseX = this.playerX;
      baseY = this.playerY;
    });
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (touchStartX !== null && this.gameRunning) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const maxDelta = this.canvas.width / 2.8; // Sensibilité équilibrée
        
        // Mouvement direct mais avec limites
        this.playerX = Math.max(0.1, Math.min(0.9, baseX + deltaX / maxDelta));
        this.playerY = Math.max(0.1, Math.min(0.9, baseY + deltaY / maxDelta));
      }
    });
    
    this.canvas.addEventListener('touchend', () => {
      touchStartX = null;
      touchStartY = null;
    });
    
    // Support souris pour desktop - CONTRÔLE DIRECT
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.gameRunning) {
        const rect = this.canvas.getBoundingClientRect();
        // Position directe de la souris
        this.playerX = (e.clientX - rect.left) / rect.width;
        this.playerY = (e.clientY - rect.top) / rect.height;
        
        // Garder dans les limites
        this.playerX = Math.max(0.1, Math.min(0.9, this.playerX));
        this.playerY = Math.max(0.1, Math.min(0.9, this.playerY));
      }
    });
    
    // Gérer le curseur sur desktop uniquement
    if (!isMobile) {
      this.canvas.addEventListener('mouseenter', () => {
        if (this.gameRunning) {
          this.canvas.style.cursor = 'none';
        }
      });
      
      this.canvas.addEventListener('mouseleave', () => {
        this.canvas.style.cursor = 'default';
      });
    }
    
    // Empêcher le défilement de la page
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }
  
  resizeCanvas() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.offsetWidth;
    this.canvas.height = Math.min(window.innerHeight * 0.5, 400);
  }
  
  start() {
    this.gameRunning = true;
    document.getElementById('snitch-instructions').style.opacity = '0';
    
    // Cacher le curseur sur desktop
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.canvas.style.cursor = 'none';
    }
    
    // Générer les premiers obstacles
    this.generateObstacles();
    
    // Démarrer le timer
    this.startTimer();
    
    // Démarrer l'animation
    this.lastTime = performance.now();
    this.animate();
  }
  
  startTimer() {
    const timerInterval = setInterval(() => {
      this.timeLeft--;
      const timerElement = document.getElementById('snitch-time');
      if (timerElement) {
        timerElement.textContent = `${this.timeLeft}s`;
        
        // Changer la couleur quand le temps devient critique
        if (this.timeLeft <= 10) {
          timerElement.style.color = '#ff6b6b';
          timerElement.parentElement.style.borderColor = '#ff6b6b';
        }
      }
      
      if (this.timeLeft <= 0 || this.snitchCaught) {
        clearInterval(timerInterval);
        this.endGame();
      }
      
      // Augmenter la difficulté progressivement
      if (this.timeLeft % 8 === 0) {
        this.difficulty += 0.15;
        this.obstacleSpeed *= 1.05;
      }
    }, 1000);
  }
  
  generateObstacles() {
    // Ajouter un nouvel obstacle moins fréquemment et mieux espacé
    if (Math.random() < 0.01 * this.difficulty && this.obstacles.length < 3) {
      const newObstacle = {
        x: 0.1 + Math.random() * 0.8,  // Éviter les bords
        y: -0.2,
        width: 0.06 + Math.random() * 0.06,
        height: 0.1 + Math.random() * 0.1,
        type: Math.random() > 0.5 ? 'cloud' : 'tower'
      };
      
      // Vérifier qu'il n'y a pas d'obstacle trop proche
      const tooClose = this.obstacles.some(obs => 
        Math.abs(obs.x - newObstacle.x) < 0.25 && Math.abs(obs.y - newObstacle.y) < 0.3
      );
      
      if (!tooClose) {
        this.obstacles.push(newObstacle);
      }
    }
    
    // Nettoyer les obstacles hors écran
    this.obstacles = this.obstacles.filter(obs => obs.y < 1.2);
  }
  
  updateSnitch(deltaTime) {
    // Mouvement erratique du Vif
    const time = performance.now() / 1000;
    const baseSpeed = 0.0005 * this.difficulty;
    
    // Le Vif change de direction moins souvent
    if (Math.random() < 0.015) {
      // Nouveau point cible aléatoire, parfois près du joueur
      if (Math.random() < 0.3) { // Plus souvent près du joueur
        // Vole près du joueur
        this.snitchTarget.x = this.playerX + (Math.random() - 0.5) * 0.3;
        this.snitchTarget.y = this.playerY + (Math.random() - 0.5) * 0.3;
      } else {
        // Point aléatoire
        this.snitchTarget.x = 0.1 + Math.random() * 0.8;
        this.snitchTarget.y = 0.1 + Math.random() * 0.8;
      }
    }
    
    // Calcul de la direction vers la cible
    const dx = this.snitchTarget.x - this.snitchX;
    const dy = this.snitchTarget.y - this.snitchY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Si très proche de la cible, choisir une nouvelle cible
    if (dist < 0.05) {
      this.snitchTarget.x = 0.1 + Math.random() * 0.8;
      this.snitchTarget.y = 0.1 + Math.random() * 0.8;
    }
    if (dist > 0.08) {
      // Se diriger vers la cible avec des mouvements moins erratiques
      this.snitchVelocityX = (dx / dist) * baseSpeed + (Math.random() - 0.5) * baseSpeed * 0.5;
      this.snitchVelocityY = (dy / dist) * baseSpeed + (Math.random() - 0.5) * baseSpeed * 0.5;
    }
    
    // Mouvement sinusoïdal moins prononcé
    this.snitchX += this.snitchVelocityX * deltaTime + Math.sin(time * 4) * 0.0002;
    this.snitchY += this.snitchVelocityY * deltaTime + Math.cos(time * 3) * 0.0001;
    
    // Garder le Vif dans les limites avec rebond
    if (this.snitchX <= 0.05) {
      this.snitchVelocityX = Math.abs(this.snitchVelocityX);
      this.snitchX = 0.06;
    } else if (this.snitchX >= 0.95) {
      this.snitchVelocityX = -Math.abs(this.snitchVelocityX);
      this.snitchX = 0.94;
    }
    if (this.snitchY <= 0.05) {
      this.snitchVelocityY = Math.abs(this.snitchVelocityY);
      this.snitchY = 0.06;
    } else if (this.snitchY >= 0.95) {
      this.snitchVelocityY = -Math.abs(this.snitchVelocityY);
      this.snitchY = 0.94;
    }
    
    // Vérifier la capture
    const distance = Math.sqrt(
      Math.pow((this.snitchX - this.playerX) * this.canvas.width, 2) +
      Math.pow((this.snitchY - this.playerY) * this.canvas.height, 2)
    );
    
    const catchRadius = 60; // Zone de capture tolérante
    if (distance < catchRadius) {
      // Ne compte que si on est bien centré
      const centerBonus = 1 - (distance / catchRadius) * 0.3;
      this.catchProgress = Math.min(this.maxCatchProgress, this.catchProgress + deltaTime * 0.1 * centerBonus);
      
      // Créer des particules
      if (Math.random() < 0.4) {
        this.createParticles(this.snitchX * this.canvas.width, this.snitchY * this.canvas.height);
      }
      
      // Le Vif essaie de s'échapper mais doucement
      this.snitchEscaping = false;
      if (distance < catchRadius * 0.9) { // Zone d'évitement très proche
        this.snitchEscaping = true;
        const escapeAngle = Math.atan2(this.snitchY - this.playerY, this.snitchX - this.playerX);
        const escapePower = 0.0008 * (1 - distance / (catchRadius * 0.9));
        this.snitchVelocityX += Math.cos(escapeAngle) * escapePower;
        this.snitchVelocityY += Math.sin(escapeAngle) * escapePower;
        
        // Limiter la vitesse maximale
        const maxSpeed = 0.001;
        const currentSpeed = Math.sqrt(this.snitchVelocityX * this.snitchVelocityX + this.snitchVelocityY * this.snitchVelocityY);
        if (currentSpeed > maxSpeed) {
          this.snitchVelocityX = (this.snitchVelocityX / currentSpeed) * maxSpeed;
          this.snitchVelocityY = (this.snitchVelocityY / currentSpeed) * maxSpeed;
        }
      }
      
      if (this.catchProgress >= this.maxCatchProgress) {
        this.snitchCaught = true;
        this.triggerVibration();
      }
    } else {
      this.catchProgress = Math.max(0, this.catchProgress - deltaTime * 0.04); // Perte lente
    }
    
    // Mettre à jour la barre de progression
    const catchBar = document.getElementById('catch-bar');
    if (catchBar) {
      catchBar.style.width = `${(this.catchProgress / this.maxCatchProgress) * 100}%`;
    }
  }
  
  updateObstacles(deltaTime) {
    this.obstacles.forEach(obs => {
      obs.y += this.obstacleSpeed * deltaTime * 0.001;
    });
    
    this.generateObstacles();
  }
  
  createParticles(x, y) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1,
        size: Math.random() * 3 + 2
      });
    }
  }
  
  updateParticles(deltaTime) {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime * 0.002;
      return p.life > 0;
    });
  }
  
  triggerVibration() {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }
  
  draw() {
    // Fond dégradé ciel nocturne
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0a1929');
    gradient.addColorStop(0.5, '#1a2f56');
    gradient.addColorStop(1, '#2a3f66');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Dessiner le ciel étoilé
    this.drawStars();
    
    // Dessiner les obstacles
    this.drawObstacles();
    
    // Dessiner le cercle de capture
    this.drawCatchCircle();
    
    // Dessiner le Vif d'Or
    this.drawSnitch();
    
    // Dessiner les particules
    this.drawParticles();
    
    // Dessiner le joueur (indicateur)
    this.drawPlayer();
    
    // Dessiner les instructions si nécessaire
    if (this.gameRunning && this.timeLeft > 23) {
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
      this.ctx.font = 'bold 18px Crimson Text';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText('Maintiens le cercle sur le Vif d\'Or pour le capturer !', this.canvas.width / 2, 30);
      this.ctx.shadowBlur = 0;
    }
  }
  
  drawStars() {
    this.ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
      const x = (i * 73) % this.canvas.width;
      const y = (i * 37) % this.canvas.height;
      const size = (i % 3) + 1;
      this.ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
      this.ctx.fillRect(x, y, size, size);
    }
    this.ctx.globalAlpha = 1;
  }
  
  drawObstacles() {
    this.obstacles.forEach(obs => {
      const x = obs.x * this.canvas.width;
      const y = obs.y * this.canvas.height;
      const w = obs.width * this.canvas.width;
      const h = obs.height * this.canvas.height;
      
      this.ctx.save();
      
      if (obs.type === 'cloud') {
        // Nuage blanc semi-transparent
        this.ctx.fillStyle = 'rgba(220, 220, 220, 0.6)';
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        this.ctx.shadowBlur = 20;
        
        // Forme de nuage plus réaliste
        this.ctx.beginPath();
        this.ctx.arc(x - w/3, y, w/2.5, 0, Math.PI * 2);
        this.ctx.arc(x, y - h/4, w/2, 0, Math.PI * 2);
        this.ctx.arc(x + w/3, y, w/2.5, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Tour de Poudlard
        const gradient = this.ctx.createLinearGradient(x - w/2, y, x + w/2, y);
        gradient.addColorStop(0, '#3a2a1a');
        gradient.addColorStop(0.5, '#4a3a2a');
        gradient.addColorStop(1, '#3a2a1a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x - w/2, y, w, h);
        
        // Fenêtres illuminées
        this.ctx.fillStyle = '#ffdd88';
        this.ctx.shadowColor = '#ffdd88';
        this.ctx.shadowBlur = 10;
        if (h > 30) {
          this.ctx.fillRect(x - w/4, y + h/4, w/6, h/6);
          this.ctx.fillRect(x + w/8, y + h/2, w/6, h/6);
        }
        
        // Toit pointu
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#2a1a0a';
        this.ctx.beginPath();
        this.ctx.moveTo(x - w/2 - 5, y);
        this.ctx.lineTo(x + w/2 + 5, y);
        this.ctx.lineTo(x, y - h/2);
        this.ctx.closePath();
        this.ctx.fill();
      }
      
      this.ctx.restore();
    });
  }
  
  drawCatchCircle() {
    const centerX = this.playerX * this.canvas.width;
    const centerY = this.playerY * this.canvas.height;
    const radius = 60;
    
    // Cercle de base
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // Indicateur de progression
    if (this.catchProgress > 0) {
      const progressColor = this.catchProgress > 66 ? '#ffd700' : 
                           this.catchProgress > 33 ? '#ffed4e' : '#fff';
      this.ctx.strokeStyle = progressColor;
      this.ctx.lineWidth = 4;
      this.ctx.shadowColor = progressColor;
      this.ctx.shadowBlur = 15;
      
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * this.catchProgress / this.maxCatchProgress));
      this.ctx.stroke();
      
      this.ctx.shadowBlur = 0;
    }
    
    // Texte indicateur
    if (this.catchProgress > 60) {
      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = 'bold 16px Crimson Text';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText('Capture en cours...', centerX, centerY - radius - 15);
      this.ctx.shadowBlur = 0;
    }
  }
  
  drawSnitch() {
    const x = this.snitchX * this.canvas.width;
    const y = this.snitchY * this.canvas.height;
    
    // Aura dorée autour du Vif (rouge si en fuite)
    const auraGradient = this.ctx.createRadialGradient(x, y, 0, x, y, 50);
    if (this.snitchEscaping) {
      auraGradient.addColorStop(0, 'rgba(255, 100, 0, 0.5)');
      auraGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    } else {
      auraGradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
      auraGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    }
    this.ctx.fillStyle = auraGradient;
    this.ctx.fillRect(x - 50, y - 50, 100, 100);
    
    // Ailes animées (battent plus vite si en fuite)
    const wingSpan = 40;
    const flapSpeed = this.snitchEscaping ? 25 : 40;
    const wingFlap = Math.sin(performance.now() / flapSpeed) * 18;
    
    this.ctx.save();
    
    // Ombre des ailes
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    this.ctx.shadowBlur = 12;
    this.ctx.shadowOffsetY = 6;
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    // Aile gauche
    this.ctx.beginPath();
    this.ctx.ellipse(x - 20, y + wingFlap/2, wingSpan, 14, -0.3, 0, Math.PI * 2);
    this.ctx.fill();
    // Aile droite
    this.ctx.beginPath();
    this.ctx.ellipse(x + 20, y - wingFlap/2, wingSpan, 14, 0.3, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Corps doré du Vif
    this.ctx.shadowColor = this.snitchEscaping ? '#ff6400' : '#ffd700';
    this.ctx.shadowBlur = 30;
    this.ctx.shadowOffsetY = 0;
    
    // Corps principal
    const bodyGradient = this.ctx.createRadialGradient(x - 6, y - 6, 0, x, y, 22);
    if (this.snitchEscaping) {
      bodyGradient.addColorStop(0, '#ffdd00');
      bodyGradient.addColorStop(0.5, '#ff9900');
      bodyGradient.addColorStop(1, '#ff6600');
    } else {
      bodyGradient.addColorStop(0, '#ffed4e');
      bodyGradient.addColorStop(0.5, '#ffd700');
      bodyGradient.addColorStop(1, '#ffb700');
    }
    this.ctx.fillStyle = bodyGradient;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, 17, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Détails des ailes
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.lineWidth = 1;
    this.ctx.shadowBlur = 0;
    
    // Lignes sur les ailes
    for (let i = -1; i <= 1; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x - 20, y + wingFlap/2);
      this.ctx.lineTo(x - 20 - wingSpan * 0.8, y + wingFlap/2 + i * 10);
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.moveTo(x + 20, y - wingFlap/2);
      this.ctx.lineTo(x + 20 + wingSpan * 0.8, y - wingFlap/2 + i * 10);
      this.ctx.stroke();
    }
    
    // Reflet brillant
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.beginPath();
    this.ctx.arc(x - 6, y - 6, 6, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  drawParticles() {
    this.particles.forEach(p => {
      this.ctx.fillStyle = `rgba(255, 215, 0, ${p.life})`;
      this.ctx.shadowColor = `rgba(255, 215, 0, ${p.life * 0.5})`;
      this.ctx.shadowBlur = 5;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
  }
  
  drawPlayer() {
    const x = this.playerX * this.canvas.width;
    const y = this.playerY * this.canvas.height;
    
    // Petit indicateur au centre du cercle
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    
    // Réticule de visée
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    this.ctx.shadowBlur = 4;
    this.ctx.beginPath();
    // Lignes horizontales
    this.ctx.moveTo(x - 18, y);
    this.ctx.lineTo(x - 10, y);
    this.ctx.moveTo(x + 10, y);
    this.ctx.lineTo(x + 18, y);
    // Lignes verticales
    this.ctx.moveTo(x, y - 18);
    this.ctx.lineTo(x, y - 10);
    this.ctx.moveTo(x, y + 10);
    this.ctx.lineTo(x, y + 18);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }
  
  animate() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    if (this.gameRunning) {
      this.updateSnitch(deltaTime);
      this.updateObstacles(deltaTime);
      this.updateParticles(deltaTime);
      this.draw();
      
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }
  
  endGame() {
    this.gameRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Réafficher le curseur
    this.canvas.style.cursor = 'default';
    
    // Calculer le score
    if (this.snitchCaught) {
      this.score = 3; // Maximum
    } else if (this.catchProgress > 30) {
      this.score = 2; // Bien essayé
    } else {
      this.score = 1; // Participation
    }
    
    // Afficher le résultat
    this.showResult();
  }
  
  showResult() {
    const messages = {
      3: "🏆 EXTRAORDINAIRE ! 🏆<br>Tu as attrapé le Vif d'Or ! Tu es un Attrapeur né !",
      2: "⭐ Très bien joué ! ⭐<br>Tu as presque maîtrisé le Vif, ton talent est indéniable !",
      1: "🛡️ Bien tenté ! 🛡️<br>Le Vif d'Or reste insaisissable, mais ton courage force le respect !"
    };
    
    // Message spécial si on était très proche
    let bonusMessage = '';
    if (!this.snitchCaught && this.catchProgress > 60) {
      bonusMessage = '<p style="color: #c9b037; font-style: italic; margin-top: 1rem;">Si près du but ! Quelques secondes de plus et il était à toi !</p>';
    }
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'snitch-result';
    resultDiv.innerHTML = `
      <div class="snitch-badge">
        <svg viewBox="0 0 120 120" width="120" height="120">
          <defs>
            <radialGradient id="snitchGrad" cx="50%" cy="30%">
              <stop offset="0%" style="stop-color:#ffed4e"/>
              <stop offset="100%" style="stop-color:#ffd700"/>
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="50" fill="url(#snitchGrad)" opacity="0.3"/>
          <circle cx="60" cy="60" r="18" fill="#ffd700" stroke="#ffb700" stroke-width="2"/>
          <ellipse cx="35" cy="60" rx="25" ry="10" fill="white" opacity="0.9"/>
          <ellipse cx="85" cy="60" rx="25" ry="10" fill="white" opacity="0.9"/>
          <circle cx="55" cy="55" r="3" fill="#ffed4e"/>
        </svg>
      </div>
      <h3>${this.score === 3 ? 'Vif d\'Or Attrapé !' : 'Défi Terminé'}</h3>
      <p>${messages[this.score]}</p>
      ${bonusMessage}
      <button class="continue-button" onclick="window.snitchGameComplete(${this.score})">
        🎯 Voir mes résultats finaux
      </button>
    `;
    
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = '';
    quizDiv.appendChild(resultDiv);
  }
}

// Fonction globale pour la complétion
window.snitchGameComplete = function(score) {
  // Stocker le score pour l'utiliser plus tard
  window.snitchScore = score;
  // Aller directement aux résultats finaux
  showResult();
};