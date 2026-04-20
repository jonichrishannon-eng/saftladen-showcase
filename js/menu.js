class JarvisMenu {
    constructor() {
        this.canvas = document.getElementById('menu-matrix-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.toggle = document.getElementById('menu-toggle');
        this.chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト';
        this.fontSize = 16;
        this.drops = [];

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.toggle.addEventListener('change', () => {
            if (this.toggle.checked) {
                this.startAnimation();
            } else {
                this.stopAnimation();
            }
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        const columns = this.canvas.width / this.fontSize;
        this.drops = Array(Math.floor(columns)).fill(1);
    }

    draw() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#00ff41';
        this.ctx.font = this.fontSize + 'px monospace';

        for (let i = 0; i < this.drops.length; i++) {
            const text = this.chars[Math.floor(Math.random() * this.chars.length)];
            this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            this.drops[i]++;
        }
    }

    startAnimation() {
        this.animationActive = true;
        this.animate();
    }

    stopAnimation() {
        this.animationActive = false;
    }

    animate() {
        if (!this.animationActive) return;
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JarvisMenu();
});
