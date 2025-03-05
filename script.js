// Cria o canvas
const canvas = document.getElementById('JogoCanvas')
const ctx = canvas.getContext('2d')

// A classe Entidade sera usada para extender as classes Raquete, bola e blocos que irão aparecer no jogo pois ambas necessitam de uma posição x e y, largura e altura
class Entidade {
    constructor(x, y, largura, altura) {
        this.posx = x
        this.posy = y
        this.largura = largura
        this.altura = altura
    }

// O método desenhar irá desenhar a entidade no canvas facilitando a reutilização de código
    desenhar(ctx) {
        ctx.fillStyle = this.cor
        ctx.fillRect(this.posx, this.posy, this.largura, this.altura)
    }
}

// Adiciona event listeners para capturar as teclas pressionadas
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        raquete.mover('esquerda')
    } else if (event.key === 'ArrowRight') {
        raquete.mover('direita')
    }
});

// Classe raquete que extende da classe Entidade e irá criar a raquete do jogo
class Raquete extends Entidade {
    constructor(x, y, largura, altura) {
        super(x, y, largura, altura)
        this.velocidade = 20;
        this.cor = 'blue'
    }
    
// Método que irá mover a raquete para a esquerda ou direita dependendo da tecla pressionada pelo jogador
    mover(direcao) {
        if (direcao === 'esquerda' && this.posx > 0) {
            this.posx -= this.velocidade
        } else if (direcao === 'direita' && this.posx + this.largura < canvas.width) {
            this.posx += this.velocidade
        }
    }
}

// Criação de uma nova raquete
raquete = new Raquete((canvas.width - 100) / 2, canvas.height - 30, 100, 20);

// Função que irá desenhar a raquete
function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    raquete.desenhar(ctx)
}

// Classe bola que extende da classe Entidade e irá criar a bola do jogo para ser rebatida pela raquete
class Bola extends Entidade {
    constructor(x, y, raio, velocidade) {
        super(x, y, raio * 2, raio * 2); //eu mudei isso aq
        this.raio = raio
        this.velocidadeX = velocidade;
        this.velocidadeY = -velocidade;
        this.cor = 'red'
    }
    // Desenha a bola no canvas
    desenhar(ctx) {
        ctx.fillStyle = this.cor
        ctx.beginPath()
        ctx.arc(this.posx, this.posy, this.raio, 0, Math.PI * 2);
        ctx.fill();
    }
    // Atualiza a posição da bola
    atualizar() {
        this.posx += this.velocidadeX
        this.posy += this.velocidadeY

        if (this.posx + this.raio > canvas.width || this.posx - this.raio < 0) {
            this.velocidadeX = -this.velocidadeX
        }

        if (this.posy - this.raio < 0) {
            this.velocidadeY = -this.velocidadeY
        }
    }
    // Verifica se a bola colidiu com a raquete
    verificarColisaoRaquete(raquete) {
        if (
            this.posx > raquete.posx &&
            this.posx < raquete.posx + raquete.largura &&
            this.posy + this.raio > raquete.posy
        ) {
            this.velocidadeY = -this.velocidadeY
        }
    }
    // Verifica se a bola colidiu com os tijolos
    verificarColisaoTijolos(tijolos) {
        for (let i = 0; i < tijolos.length; i++) {
            const tijolo = tijolos[i]
            if (
                this.posx > tijolo.posx &&
                this.posx < tijolo.posx + tijolo.largura &&
                this.posy - this.raio < tijolo.posy + tijolo.altura &&
                this.posy + this.raio > tijolo.posy
            ) {
                this.velocidadeY = -this.velocidadeY
                tijolos.splice(i, 1)
                return true
            }
        }
        return false
    }
}

// Classe que cria os tijolos para serem quebrados pela bola
class Tijolo extends Entidade {
    constructor(x, y, largura, altura) {
        super(x, y, largura, altura)
        this.cor = 'purple'
    }
}

// Função que atualiza o canvas
function atualizar() {
    desenhar()
    requestAnimationFrame(atualizar)
}
// Função que faz atualizar os frames do jogo
atualizar()

// Classe que cria o jogo
class Jogo {
    constructor(canvas) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.raquete = new Raquete(canvas.width / 2 - 50, canvas.height - 30, 100, 20)
        this.bola = new Bola(canvas.width / 2, canvas.height - 50, 10, 4)
        this.tijolos = []
        this.criarTijolos()
        this.iniciarEventos()
    }
// Método que cria os tijolos
    criarTijolos() {
        const linhas = 5
        const colunas = 10
        const largura = 75
        const altura = 20
        const padding = 10
        const offsetTop = 30
        const offsetLeft = 30

        for (let c = 0; c < colunas; c++) {
            for (let r = 0; r < linhas; r++) {
                const x = c * (largura + padding) + offsetLeft
                const y = r * (altura + padding) + offsetTop
                this.tijolos.push(new Tijolo(x, y, largura, altura))
            }
        }
    }
// Método que inicia os eventos do jogo
    iniciarEventos() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft') {
                this.raquete.mover('esquerda')
            } else if (e.code === 'ArrowRight') {
                this.raquete.mover('direita')
            }
        })
    }
// Método que verifica a colisão da bola com a raquete e os tijolos
verificarColisao() {
    this.bola.verificarColisaoRaquete(this.raquete);
    if (this.bola.verificarColisaoTijolos(this.tijolos)) {
        this.pontuacao++;
    }

    if (this.bola.posy + this.bola.raio > canvas.height) {
        this.gameOver = true;
        this.reiniciarJogo();
    }
}

// Método que reinicia o jogo
reiniciarJogo() {
    this.bola = new Bola(this.canvas.width / 2, this.canvas.height - 50, 10, 4);
    this.tijolos = [];
    this.criarTijolos();
    this.gameOver = false;
    this.iniciar();
}

    // Método que atualiza o canvas
    loop() {
        if (this.gameOver) return
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.raquete.desenhar(this.ctx)
        this.bola.desenhar(this.ctx)
        this.bola.atualizar()
        this.tijolos.forEach(tijolo => tijolo.desenhar(this.ctx))
        this.verificarColisao()
        requestAnimationFrame(() => this.loop())
    }

    // Método que inicia o jogo
    iniciar() {
        this.loop()
    }
}
// Cria um novo jogo
const jogo = new Jogo(canvas)
jogo.iniciar()