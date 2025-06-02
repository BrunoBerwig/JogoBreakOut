const canvas = document.getElementById('JogoCanvas');
const ctx = canvas.getContext('2d');

class Entidade {
    constructor(x, y, largura, altura) {
        this.posx = x;
        this.posy = y;
        this.largura = largura;
        this.altura = altura;
        this.cor = 'black';
    }

    desenhar(ctx) {
        ctx.fillStyle = this.cor;
        ctx.fillRect(this.posx, this.posy, this.largura, this.altura);
    }
}

class Raquete extends Entidade {
    constructor(x, y, largura, altura) {
        super(x, y, largura, altura);
        this.velocidade = 20;
        this.cor = 'blue';
    }

    mover(direcao) {
        if (direcao === 'esquerda' && this.posx > 0) {
            this.posx -= this.velocidade;
        } else if (direcao === 'direita' && this.posx + this.largura < canvas.width) {
            this.posx += this.velocidade;
        }
    }
}

class Bola extends Entidade {
    constructor(x, y, raio, velocidade) {
        super(x, y, raio * 2, raio * 2);
        this.raio = raio;
        this.velocidadeX = velocidade;
        this.velocidadeY = -velocidade;
        this.cor = 'red';
    }

    desenhar(ctx) {
        ctx.fillStyle = this.cor;
        ctx.beginPath();
        ctx.arc(this.posx, this.posy, this.raio, 0, Math.PI * 2);
        ctx.fill();
    }

    atualizar() {
        this.posx += this.velocidadeX;
        this.posy += this.velocidadeY;

        if (this.posx + this.raio > canvas.width || this.posx - this.raio < 0) {
            this.velocidadeX = -this.velocidadeX;
        }

        if (this.posy - this.raio < 0) {
            this.velocidadeY = -this.velocidadeY;
        }
    }

    verificarColisaoRaquete(raquete) {
        if (
            this.posx > raquete.posx &&
            this.posx < raquete.posx + raquete.largura &&
            this.posy + this.raio > raquete.posy &&
            this.posy - this.raio < raquete.posy + raquete.altura
        ) {
            this.velocidadeY = -this.velocidadeY;
            this.posy = raquete.posy - this.raio;
        }
    }

    verificarColisaoTijolos(tijolos) {
        for (let i = 0; i < tijolos.length; i++) {
            const tijolo = tijolos[i];
            if (
                this.posx > tijolo.posx &&
                this.posx < tijolo.posx + tijolo.largura &&
                this.posy - this.raio < tijolo.posy + tijolo.altura &&
                this.posy + this.raio > tijolo.posy
            ) {
                this.velocidadeY = -this.velocidadeY;
                tijolos.splice(i, 1);
                return true;
            }
        }
        return false;
    }
}

class Tijolo extends Entidade {
    constructor(x, y, largura, altura) {
        super(x, y, largura, altura);
        this.cor = 'purple';
    }
}

class PowerUp extends Entidade {
    constructor(posx, posy) {
        super(posx, posy, 20, 20);
        this.tipo = this.gerarTipo();
        this.cor = this.definirCor();
        this.velocidadeY = 2;
    }

    gerarTipo() {
        const tipos = ['raqueteGrande', 'vidaExtra', 'bolaLenta', 'bolaExtra'];
        return tipos[Math.floor(Math.random() * tipos.length)];
    }

    definirCor() {
        switch (this.tipo) {
            case 'raqueteGrande': return 'yellow';
            case 'vidaExtra': return 'green';
            case 'bolaLenta': return 'blue';
            case 'bolaExtra': return 'purple';
            default: return 'white';
        }
    }

    desenhar(ctx) {
        ctx.fillStyle = this.cor;
        ctx.fillRect(this.posx, this.posy, this.largura, this.altura);
    }

    atualizar() {
        this.posy += this.velocidadeY;
    }

    verificarColisaoRaquete(raquete) {
        return !(
            this.posx > raquete.posx + raquete.largura ||
            this.posx + this.largura < raquete.posx ||
            this.posy > raquete.posy + raquete.altura ||
            this.posy + this.altura < raquete.posy
        );
    }

    aplicarEfeito(jogo) {
        switch (this.tipo) {
            case 'raqueteGrande':
                jogo.raquete.largura *= 1.5;
                setTimeout(() => {
                    jogo.raquete.largura /= 1.5;
                }, 10000);
                break;
            case 'vidaExtra':
                jogo.vidas += 1;
                break;
            case 'bolaLenta':
                jogo.bola.velocidadeX *= 0.5;
                jogo.bola.velocidadeY *= 0.5;
                setTimeout(() => {
                    jogo.bola.velocidadeX /= 0.5;
                    jogo.bola.velocidadeY /= 0.5;
                }, 10000);
                break;
            case 'bolaExtra':
                const novaBola = new Bola(
                    jogo.bola.posx,
                    jogo.bola.posy,
                    jogo.bola.raio,
                    Math.abs(jogo.bola.velocidadeX)
                );
                novaBola.velocidadeX = -jogo.bola.velocidadeX;
                novaBola.velocidadeY = -jogo.bola.velocidadeY;
                jogo.bolasExtras.push(novaBola);
                break;
        }
    }
}

class Jogo {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.raquete = new Raquete(canvas.width / 2 - 50, canvas.height - 30, 100, 20);
        this.bola = new Bola(canvas.width / 2, canvas.height - 50, 10, 4);
        this.bolasExtras = []; 
        this.tijolos = [];
        this.powerUps = [];
        this.pontuacao = 0;
        this.vidas = 3;
        this.gameOver = false;
        this.criarTijolos();
        this.iniciarEventos();
    }

    criarTijolos() {
        this.tijolos = [];
        const linhas = 5;
        const colunas = 10;
        const largura = 75;
        const altura = 20;
        const padding = 10;
        const offsetTop = 30;
        const offsetLeft = 30;

        for (let c = 0; c < colunas; c++) {
            for (let r = 0; r < linhas; r++) {
                const x = c * (largura + padding) + offsetLeft;
                const y = r * (altura + padding) + offsetTop;
                this.tijolos.push(new Tijolo(x, y, largura, altura));
            }
        }
    }

    iniciarEventos() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) {
                this.reiniciarJogo();
            } else {
                if (e.code === 'ArrowLeft') {
                    this.raquete.mover('esquerda');
                } else if (e.code === 'ArrowRight') {
                    this.raquete.mover('direita');
                }
            }
        });
    }

    verificarColisao() {
        this.bola.verificarColisaoRaquete(this.raquete);

        if (this.bola.verificarColisaoTijolos(this.tijolos)) {
            this.pontuacao++;
            if (this.tijolos.length === 0) {
                this.criarTijolos();
            }
            if (Math.random() < 0.2) {
                const x = this.bola.posx - 10;
                const y = this.bola.posy - 10;
                this.powerUps.push(new PowerUp(x, y));
            }
        }

        for (let i = this.bolasExtras.length - 1; i >= 0; i--) {
            const bolaExtra = this.bolasExtras[i];
            bolaExtra.verificarColisaoRaquete(this.raquete);

            if (bolaExtra.verificarColisaoTijolos(this.tijolos)) {
                this.pontuacao++;
                if (this.tijolos.length === 0) {
                    this.criarTijolos();
                }
                if (Math.random() < 0.2) {
                    const x = bolaExtra.posx - 10;
                    const y = bolaExtra.posy - 10;
                    this.powerUps.push(new PowerUp(x, y));
                }
            }
        }

        if (this.bola.posy + this.bola.raio > this.canvas.height) {
            this.vidas--;
            if (this.vidas <= 0) {
                this.gameOver = true;
            } else {
                this.bola = new Bola(this.canvas.width / 2, this.canvas.height - 50, 10, 4);
                this.raquete.posx = this.canvas.width / 2 - this.raquete.largura / 2;
                this.bolasExtras = [];
            }
        }
        this.bolasExtras = this.bolasExtras.filter(bolaExtra => bolaExtra.posy - bolaExtra.raio <= this.canvas.height);
    }

    reiniciarJogo() {
        this.bola = new Bola(this.canvas.width / 2, this.canvas.height - 50, 10, 4);
        this.raquete = new Raquete(this.canvas.width / 2 - 50, this.canvas.height - 30, 100, 20);
        this.bolasExtras = [];
        this.criarTijolos();
        this.powerUps = [];
        this.pontuacao = 0;
        this.vidas = 3;
        this.gameOver = false;
        this.loop();
    }

    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameOver) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Sua pontuação: ${this.pontuacao}`, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillText('Clique em qualquer tecla para reiniciar!', this.canvas.width / 2, this.canvas.height / 2 + 40);
            return;
        }

        this.bola.atualizar();
        this.bolasExtras.forEach(bolaExtra => bolaExtra.atualizar());

        this.powerUps.forEach((powerUp, i) => {
            powerUp.atualizar();

            if (powerUp.posy > this.canvas.height) {
                this.powerUps.splice(i, 1);
            } else if (powerUp.verificarColisaoRaquete(this.raquete)) {
                powerUp.aplicarEfeito(this);
                this.powerUps.splice(i, 1);
            }
        });

        this.verificarColisao();

        this.raquete.desenhar(this.ctx);
        this.bola.desenhar(this.ctx);
        this.bolasExtras.forEach(bolaExtra => bolaExtra.desenhar(this.ctx));
        this.tijolos.forEach(t => t.desenhar(this.ctx));
        this.powerUps.forEach(pu => pu.desenhar(this.ctx));

        this.ctx.fillStyle = 'white';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Pontuação: ${this.pontuacao}`, 10, 20);
        this.ctx.fillText(`Vidas: ${this.vidas}`, 10, 40);

        requestAnimationFrame(() => this.loop());
    }
}

const jogo = new Jogo(canvas);
jogo.loop();
