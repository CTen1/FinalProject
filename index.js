// MARK: Helper Functions
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

let animationFrames = [];
let webkitAnimationFrames = [];
let timeouts = [];

const startNewGame = function() {
// MARK: Game Singleton
  const Game = function () {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 400;
    this.canvas.height = 500;

    this.playing = true;

    this.context = this.canvas.getContext('2d');
  };

  let game = new Game();

// MARK: Score Singleton
  const ScoreKeeper = function () {
    this.computer = {
      element: document.getElementById('computer-score'),
      score: 0
    };
    this.player = {
      element: document.getElementById('player-score'),
      score: 0
    };
    this.maxScore = 5;

    this.resetScores = function () {
      this.computer.score = 0;
      this.player.score = 0;
      this.computer.element.innerText = `${this.computer.score}`;
      this.player.element.innerText = `${this.player.score}`;
    };

    this.updateScores = function () {
      this.computer.element.innerText = `${this.computer.score}`;
      this.player.element.innerText = `${this.player.score}`;

      if (this.computer.score === this.maxScore && this.player.score < this.maxScore) {
        alert('Computer Wins!');
        this.resetScores();
        game.playing = false;
        controller.resetGame();
      }
      else if (this.player.score === this.maxScore && this.computer.score < this.maxScore) {
        alert('Player Wins!');
        this.resetScores();
        game.playing = false;
        controller.resetGame();
      }
    };
  };

  let scoreKeeper = new ScoreKeeper();

// MARK: Constructor Functions
// Bar
  function Bar(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.v_x = 0;
    this.v_y = 0;

    this.load = function () {
      game.context.fillStyle = "#6D4194";
      game.context.fillRect(this.x, this.y, this.width, this.height);
    };

    this.setSpeed = function (v_x, v_y) {
      this.x += v_x;
      this.y += v_y;
      this.v_x = v_x;
      this.v_y = v_y;

      if (this.x < 0) {
        this.x = 0;
        this.v_x = 0;
      }
      else if (this.x + this.width > game.canvas.width) {
        this.x = game.canvas.width - this.width;
        this.v_x = 0;
      }
    };
  }

// Ball
  function Ball(x, y) {
    this.x = x;
    this.y = y;
    this.v = 4;
    this.v_x = 0;
    this.v_y = this.v;
    this.radius = 10;

    this.load = function () {
      game.context.beginPath();
      game.context.arc(this.x, this.y, this.radius, 2 * Math.PI, 0);
      game.context.fillStyle = "#8C779E";
      game.context.fill();
    };

    this.reset = function () {
      this.v_x = 0;
      this.v_y = randInt(0, 1) === 0 ? this.v : -this.v;
      this.x = (game.canvas.width - ball.radius) / 2;
      this.y = (game.canvas.height + ball.radius) / 2;
    };

    this.refresh = function (playerBar, computerBar) {
      this.x += this.v_x;
      this.y += this.v_y;

      let x_left = this.x - this.radius;
      let x_right = this.x + this.radius;
      let y_top = this.y - this.radius;
      let y_bottom = this.y + this.radius;

      if (x_left < 0) {
        this.x = this.radius;
        this.v_x = -this.v_x;
      }
      else if (x_right > game.canvas.width) {
        this.x = game.canvas.width - this.radius;
        this.v_x = -this.v_x;
      }

      // Player Scored
      if (this.y < 0) {
        scoreKeeper.player.score += 1;
        scoreKeeper.updateScores();
        this.reset();
      }

      // Computer Scored
      if (this.y > game.canvas.height) {
        scoreKeeper.computer.score += 1;
        scoreKeeper.updateScores();
        this.reset();
      }

      if (y_top > game.canvas.height / 2) {
        let ballOverlapsPlayerBar = (y_top < (playerBar.y + playerBar.height)) &&
          (y_bottom > playerBar.y) &&
          (x_left < (playerBar.x + playerBar.width)) &&
          (x_right > playerBar.x);
        if (ballOverlapsPlayerBar) {
          this.v_y = -this.v;
          this.v_x += (playerBar.v_x / 2);
          this.y += this.v_y;
        }
      }
      else {
        let ballOverlapsComputerBar = (y_top < (computerBar.y + computerBar.height)) &&
          (y_bottom > computerBar.y) &&
          (x_left < (computerBar.x + computerBar.width)) &&
          (x_right > computerBar.x);
        if (ballOverlapsComputerBar) {
          this.v_y = this.v;
          this.v_x += (computerBar.v_x / 2);
          this.y += this.v_y;
        }
      }
    };
  }

// Player
  function Player() {
    this.width = 60;
    this.height = 10;
    this.v = 3;
    this.bar = new Bar((game.canvas.width - this.width) / 2,
      game.canvas.height - 40, this.width, this.height);

    this.load = function () {
      this.bar.load();
    };

    this.refresh = function () {
      for (let code in keysDown) {
        if (code === 'ArrowRight') {
          this.bar.setSpeed(this.v, 0);
        }
        else if (code === 'ArrowLeft') {
          this.bar.setSpeed(-this.v, 0);
        }
        else {
          this.bar.setSpeed(0, 0);
        }
      }
    };
  }

// Computer
  function Computer() {
    this.width = 60;
    this.height = 10;
    this.v = 3;
    this.bar = new Bar((game.canvas.width - this.width) / 2,
      40, this.width, this.height);

    this.load = function () {
      this.bar.load();
    };

    this.refresh = function () {
      let delta = -((this.bar.x + (this.bar.width / 2)) - ball.x);

      if (delta < 0 && delta < -this.v) {
        delta = -this.v;
      }
      else if (delta > 0 && delta > this.v) {
        delta = this.v;
      }

      this.bar.setSpeed(delta, 0);
      if (this.bar.x < 0) {
        this.bar.x = 0;
      }
      else if ((this.bar.x + this.bar.width) > game.canvas.width) {
        this.bar.x = game.canvas.width - this.bar.width;
      }
    };
  }

// MARK: Game Setup
  let player = new Player();
  let computer = new Computer();
  let ball = new Ball(0, 0);
  ball.x = (game.canvas.width - ball.radius) / 2;
  ball.y = (game.canvas.height + ball.radius) / 2;

  let animate;
  if (window.requestAnimationFrame) {
    animate = function(callback) {
      let id = window.requestAnimationFrame(callback);
      animationFrames.push(id);
    }
  }
  else if (window.webkitRequestAnimationFrame) {
    animate = function(callback) {
      let id = window.webkitRequestAnimationFrame(callback);
      webkitAnimationFrames.push(id);
    }
  }
  else {
    animate = function (callback) {
      let timeout = window.setTimeout(callback, 1000 / 60);
      timeouts.push(timeout);
    };
  }

// MARK: Game Loading
  function refresh() {
    player.refresh();
    computer.refresh(ball);
    ball.refresh(player.bar, computer.bar);
  }

  function loadGame() {
    game.context.fillStyle = "#F4E8FF";
    game.context.fillRect(0, 0, game.canvas.width, game.canvas.height);

    player.load();
    computer.load();
    ball.load();
  }

  let step = function () {
    refresh();
    loadGame();
    if (game.playing) {
      animate(step);
    }
  };

  document.body.appendChild(game.canvas);
  animate(step);

// MARK: Keyboard Input
  let keysDown = {};

  window.addEventListener('keydown', event => {
    keysDown[event.code] = true;
  });
  window.addEventListener('keyup', event => {
    delete keysDown[event.code];
  });
};

// MARK: Controller Singleton
function Controller() {
  this.newGameBtn = document.getElementById('new-game-btn');
  this.startNewGame = startNewGame;

  this.newGameBtn.addEventListener('click', () => {
    this.startNewGame();
    this.newGameBtn.style.visibility = 'hidden';
  });

  this.resetGame = function() {
    for (let i = 0; i < animationFrames.length; ++i) {
      cancelAnimationFrame(animationFrames[i]);
    }
    animationFrames = [];
    for (let i = 0; i < webkitAnimationFrames.length; ++i) {
      webkitCancelAnimationFrame(webkitAnimationFrames[i]);
    }
    webkitAnimationFrames = [];
    for (let i = 0; i < timeouts.length; ++i) {
      clearTimeout(timeouts[i]);
    }
    timeouts = [];

    let canvas = document.body.getElementsByTagName('canvas');
    document.body.removeChild(canvas[0]);

    this.newGameBtn.style.visibility = 'visible';
  }
}

const controller = new Controller();
