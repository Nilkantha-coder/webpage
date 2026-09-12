document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  const celebrateBtn = document.getElementById("celebrateBtn");

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const colors = ["#2563eb", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];
  let particles = [];

  class ConfettiParticle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height - height;
      this.size = Math.random() * 8 + 6;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.speedY = Math.random() * 4 + 3;
      this.speedX = Math.random() * 3 - 1.5;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = Math.random() * 10 - 5;
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      this.rotation += this.rotationSpeed;

      if (this.y > height) {
        this.y = -10;
        this.x = Math.random() * width;
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
      ctx.restore();
    }
  }

  function burstConfetti(count = 100) {
    for (let i = 0; i < count; i++) {
      particles.push(new ConfettiParticle());
    }
  }

  let animationFrameId;
  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((particle, index) => {
      particle.update();
      particle.draw();
    });

    // Clean up excess particles over time
    if (particles.length > 200) {
      particles.splice(0, particles.length - 200);
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  // Trigger celebration on page load
  burstConfetti(120);
  animate();

  // Trigger more confetti on button click
  celebrateBtn.addEventListener("click", () => {
    burstConfetti(80);
  });
});

