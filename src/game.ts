<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jeu de Boule de Feu</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            background-color: #222;
        }
        canvas {
            display: block;
            background-color: #000;
        }
        .health-bar {
            position: absolute;
            top: 10px;
            height: 20px;
            background-color: red;
        }
        #health1 {
            left: 10px;
            width: 200px;
        }
        #health2 {
            right: 10px;
            width: 200px;
        }
    </style>
</head>
<body>
    <div id="health1" class="health-bar"></div>
    <div id="health2" class="health-bar"></div>
    <canvas id="gameCanvas"></canvas>
    <script>
        const GAME_WIDTH = 800;
        const GAME_HEIGHT = 400;

        const canvas = document.getElementById('gameCanvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        const ctx = canvas.getContext('2d');

        const healthBars = [
            document.getElementById('health1'),
            document.getElementById('health2')
        ];

        const characters = [
            { x: 100, y: GAME_HEIGHT - 100, width: 50, height: 80, speed: 5, health: 100, isFacingRight: true, color: 'blue' },
            { x: GAME_WIDTH - 150, y: GAME_HEIGHT - 100, width: 50, height: 80, speed: 5, health: 100, isFacingRight: false, color: 'red' }
        ];

        const fireballs = [];
        const keys = {};

        function launchFireball(playerIndex) {
            const char = characters[playerIndex];
            const direction = char.isFacingRight ? 1 : -1;

            fireballs.push({
                x: char.x + char.width / 2,
                y: char.y + char.height / 2,
                radius: 10,
                speed: 7,
                dx: direction * 7,
                dy: 0,
                damage: 10,
                active: true
            });
        }

        function checkCollision(fireball, character) {
            return fireball.x > character.x &&
                   fireball.x < character.x + character.width &&
                   fireball.y > character.y &&
                   fireball.y < character.y + character.height;
        }

        function updateHealthBar(playerIndex) {
            const health = characters[playerIndex].health;
            healthBars[playerIndex].style.width = `${Math.max(0, health) * 2}px`;
            healthBars[playerIndex].style.backgroundColor = health > 50 ? 'green' : health > 20 ? 'orange' : 'red';
        }

        function update() {
            // Contrôles du joueur 1 (WASD, F pour lancer)
            if (keys['a']) {
                characters[0].x -= characters[0].speed;
                characters[0].isFacingRight = false;
            }
            if (keys['d']) {
                characters[0].x += characters[0].speed;
                characters[0].isFacingRight = true;
            }
            if (keys['f'] && !keys['f_prev']) {
                launchFireball(0);
            }

            // Contrôles du joueur 2 (flèches, M pour lancer)
            if (keys['ArrowLeft']) {
                characters[1].x -= characters[1].speed;
                characters[1].isFacingRight = false;
            }
            if (keys['ArrowRight']) {
                characters[1].x += characters[1].speed;
                characters[1].isFacingRight = true;
            }
            if (keys['m'] && !keys['m_prev']) {
                launchFireball(1);
            }

            // Garder les personnages dans l'écran
            characters.forEach(char => {
                char.x = Math.max(0, Math.min(GAME_WIDTH - char.width, char.x));
            });

            // Mise à jour des boules de feu
            fireballs.forEach(fb => {
                if (fb.active) {
                    fb.x += fb.dx;
                    fb.y += fb.dy;

                    // Vérifier les collisions avec les personnages
                    characters.forEach((char, index) => {
                        if (checkCollision(fb, char)) {
                            char.health -= fb.damage;
                            fb.active = false;
                            updateHealthBar(index);
                        }
                    });

                    // Désactiver si hors écran
                    if (fb.x < 0 || fb.x > GAME_WIDTH || fb.y < 0 || fb.y > GAME_HEIGHT) {
                        fb.active = false;
                    }
                }
            });

            // Filtrer les boules de feu actives
            for (let i = fireballs.length - 1; i >= 0; i--) {
                if (!fireballs[i].active) {
                    fireballs.splice(i, 1);
                }
            }

            // Garder en mémoire les touches précédentes
            keys['f_prev'] = keys['f'];
            keys['m_prev'] = keys['m'];
        }

        function render() {
            // Effacer l'écran
            ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            // Dessiner le sol
            ctx.fillStyle = '#333';
            ctx.fillRect(0, GAME_HEIGHT - 20, GAME_WIDTH, 20);

            // Dessiner les personnages
            characters.forEach(char => {
                ctx.fillStyle = char.color;
                ctx.fillRect(char.x, char.y, char.width, char.height);
            });

            // Dessiner les boules de feu
            fireballs.forEach(fb => {
                if (fb.active) {
                    ctx.beginPath();
                    ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
                    ctx.fillStyle = 'orange';
                    ctx.fill();
                    ctx.closePath();
                }
            });
        }

        function gameLoop() {
            update();
            render();
            requestAnimationFrame(gameLoop);
        }

        // Écouteurs d'événements
        window.addEventListener('keydown', (e) => keys[e.key] = true);
        window.addEventListener('keyup', (e) => keys[e.key] = false);

        // Démarrer le jeu
        gameLoop();
    </script>
</body>
</html>