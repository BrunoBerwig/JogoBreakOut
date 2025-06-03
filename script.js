const canvas = document.getElementById('JogoCanvas');
const ctx = canvas.getContext('2d');

const VELOCIDADE_BOLA_BASE = 2;
const DURACAO_POWERUP = 10000;

// Define o tamanho base para escalonamento
const LARGURA_PADRAO = 900;
const ALTURA_PADRAO = 500;

function redimensionarCanvas(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

redimensionarCanvas(canvas);
window.addEventListener('resize', () => {
    redimensionarCanvas(canvas);
});

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
        this.ativa = true;
        this.velocidadeOriginalX = velocidade;
        this.velocidadeOriginalY = -velocidade;
        this.bolaLentaAtiva = false;
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

        if (this.posy - this.raio > canvas.height) {
            this.ativa = false;
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

    aplicarBolaLenta() {
        if (!this.bolaLentaAtiva) {
            this.velocidadeX *= 0.5;
            this.velocidadeY *= 0.5;
            this.bolaLentaAtiva = true;
        }
    }

    removerBolaLenta() {
        if (this.bolaLentaAtiva) {
            this.velocidadeX = this.velocidadeOriginalX * (this.velocidadeX < 0 ? -1 : 1);
            this.velocidadeY = this.velocidadeOriginalY * (this.velocidadeY < 0 ? -1 : 1);
            this.bolaLentaAtiva = false;
        }
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
                }, DURACAO_POWERUP);
                break;
            case 'vidaExtra':
                jogo.vidas += 1;
                break;
            case 'bolaLenta':
                jogo.bolas.forEach(bola => bola.aplicarBolaLenta());
                setTimeout(() => {
                    jogo.bolas.forEach(bola => bola.removerBolaLenta());
                }, DURACAO_POWERUP);
                break;
            case 'bolaExtra':
                const bolaPrincipal = jogo.bolas[0];
                const novaBola = new Bola(
                    bolaPrincipal.posx,
                    bolaPrincipal.posy,
                    bolaPrincipal.raio,
                    VELOCIDADE_BOLA_BASE * jogo.escala
                );
                novaBola.velocidadeX = -bolaPrincipal.velocidadeX * 0.5;
                novaBola.velocidadeY = -bolaPrincipal.velocidadeY * 0.5;
                jogo.bolas.push(novaBola);
                break;
        }
    }
}

class Jogo {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Escala para ajustar elementos proporcionalmente
        this.escala = this.canvas.width / LARGURA_PADRAO;

        this.raquete = new Raquete(
            this.canvas.width / 2 - (100 * this.escala) / 2,
            this.canvas.height - 30 * this.escala,
            100 * this.escala,
            20 * this.escala
        );

        this.bolas = [
            new Bola(
                this.canvas.width / 2,
                this.canvas.height - 50 * this.escala,
                10 * this.escala,
                VELOCIDADE_BOLA_BASE * this.escala
            )
        ];

        this.tijolos = [];
        this.powerUps = [];
        this.pontuacao = 0;
        this.vidas = 3;
        this.gameOver = false;
        this.estado = 'inicio';

        this.criarTijolos();

        this.iniciarEventos();

        // Controle para evitar múltiplos loops em reiniciar
        this.loopAtivo = false;
    }

    criarTijolos() {
        this.tijolos = [];
        const linhas = 5;
        const colunas = 10;
        const largura = 75 * this.escala;
        const altura = 20 * this.escala;
        const padding = 10 * this.escala;
        const offsetTop = 30 * this.escala;
        const offsetLeft = 30 * this.escala;

        for (let c = 0; c < colunas; c++) {
            for (let r = 0; r < linhas; r++) {
                const x = c * (largura + padding) + offsetLeft;
                const y = r * (altura + padding) + offsetTop;
                this.tijolos.push(new Tijolo(x, y, largura, altura));
            }
        }
    }

    iniciarEventos() {
        this.teclaReiniciarPressionada = false;

        document.addEventListener('keydown', (e) => {
            if (this.estado === 'inicio') {
                this.estado = 'jogando';
                if (!this.loopAtivo) this.loop();
                return;
            }

            if (this.estado === 'pausado') {
                if (e.code === 'KeyP' || e.code === 'Escape') {
                    this.estado = 'jogando';
                }
                return;
            }

            if (this.estado === 'gameover') {
                if (!this.teclaReiniciarPressionada) {
                    this.reiniciarJogo();
                    this.teclaReiniciarPressionada = true;
                }
                return;
            }

            if (e.code === 'ArrowLeft') {
                this.raquete.mover('esquerda');
            } else if (e.code === 'ArrowRight') {
                this.raquete.mover('direita');
            } else if (e.code === 'KeyP' || e.code === 'Escape') {
                this.estado = 'pausado';
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.estado === 'gameover') {
                this.teclaReiniciarPressionada = false;
            }
        });

        // Controle por toque (arrastar dedo para mover a raquete)
        this.canvas.addEventListener('touchmove', (e) => {
            const toque = e.touches[0];
            const posToqueX = toque.clientX;

            // Centraliza a raquete no dedo
            this.raquete.posx = posToqueX - this.raquete.largura / 2;

            // Limita nas bordas
            if (this.raquete.posx < 0) this.raquete.posx = 0;
            if (this.raquete.posx + this.raquete.largura > this.canvas.width) {
                this.raquete.posx = this.canvas.width - this.raquete.largura;
            }

            e.preventDefault();
        });
    }

    verificarColisao() {
        this.bolas.forEach(bola => {
            if (!bola.ativa) return;

            bola.verificarColisaoRaquete(this.raquete);

            if (bola.verificarColisaoTijolos(this.tijolos)) {
                this.pontuacao++;
                if (this.tijolos.length === 0) {
                    this.criarTijolos();
                }
                if (Math.random() < 0.2) {
                    const x = bola.posx - 10 * this.escala;
                    const y = bola.posy - 10 * this.escala;
                    this.powerUps.push(new PowerUp(x, y));
                }
            }
        });

        const bolasAtivas = this.bolas.filter(bola => bola.ativa);
        if (bolasAtivas.length === 0) {
            this.vidas--;
            if (this.vidas <= 0) {
                this.gameOver = true;
                this.estado = 'gameover';
            } else {
                this.bolas = [
                    new Bola(
                        this.canvas.width / 2,
                        this.canvas.height - 50 * this.escala,
                        10 * this.escala,
                        VELOCIDADE_BOLA_BASE * this.escala
                    )
                ];
                this.raquete.posx = this.canvas.width / 2 - this.raquete.largura / 2;
            }
        }
    }

    reiniciarJogo() {
        this.escala = this.canvas.width / LARGURA_PADRAO;

        this.bolas = [
            new Bola(
                this.canvas.width / 2,
                this.canvas.height - 50 * this.escala,
                10 * this.escala,
                VELOCIDADE_BOLA_BASE * this.escala
            )
        ];
        this.raquete = new Raquete(
            this.canvas.width / 2 - (100 * this.escala) / 2,
            this.canvas.height - 30 * this.escala,
            100 * this.escala,
            20 * this.escala
        );
        this.criarTijolos();
        this.powerUps = [];
        this.pontuacao = 0;
        this.vidas = 3;
        this.gameOver = false;
        this.estado = 'jogando';
        if (!this.loopAtivo) this.loop();
    }

    loop() {
        this.loopAtivo = true;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.estado === 'inicio') {
            this.ctx.fillStyle = 'white';
            this.ctx.font = `${30 * this.escala}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Pressione qualquer tecla para iniciar', this.canvas.width / 2, this.canvas.height / 2);
            requestAnimationFrame(() => this.loop());
            return;
        }

        if (this.estado === 'pausado') {
            this.ctx.fillStyle = 'white';
            this.ctx.font = `${40 * this.escala}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSADO', this.canvas.width / 2, this.canvas.height / 2);
            requestAnimationFrame(() => this.loop());
            return;
        }

        if (this.estado === 'gameover') {
            this.ctx.fillStyle = 'red';
            this.ctx.font = `${40 * this.escala}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = `${20 * this.escala}px Arial`;
            this.ctx.fillText('Pressione qualquer tecla para reiniciar', this.canvas.width / 2, this.canvas.height / 2 + 50 * this.escala);
            return;
        }

        // Atualizar e desenhar bolas
        this.bolas.forEach(bola => {
            if (bola.ativa) {
                bola.atualizar();
                bola.desenhar(this.ctx);
            }
        });

        // Atualizar e desenhar power-ups
        this.powerUps.forEach((powerUp, index) => {
            powerUp.atualizar();
            powerUp.desenhar(this.ctx);

            if (powerUp.verificarColisaoRaquete(this.raquete)) {
                powerUp.aplicarEfeito(this);
                this.powerUps.splice(index, 1);
            } else if (powerUp.posy > this.canvas.height) {
                this.powerUps.splice(index, 1);
            }
        });

        // Desenhar raquete
        this.raquete.desenhar(this.ctx);

        // Desenhar tijolos
        this.tijolos.forEach(tijolo => tijolo.desenhar(this.ctx));

        // Desenhar placar e vidas
        this.ctx.fillStyle = 'white';
        this.ctx.font = `${20 * this.escala}px Arial`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Pontos: ${this.pontuacao}`, 10, 20 * this.escala);
        this.ctx.fillText(`Vidas: ${this.vidas}`, 10, 45 * this.escala);

        // Checar colisões
        this.verificarColisao();

        if (!this.gameOver) {
            requestAnimationFrame(() => this.loop());
        }
    }
}

const jogo = new Jogo(canvas);
jogo.loop();
