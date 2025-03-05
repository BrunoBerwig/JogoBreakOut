// Cria o canvas
const canvas = document.getElementById('JogoCanvas');
const ctx = canvas.getContext('2d');

// A classe Entidade sera usada para extender as classes Raquete, bola e blocos que irão aparecer no jogo pois ambas necessitam de uma posição x e y, largura e altura
class Entidade {
    constructor(x, y, largura, altura) {
        this.posx = x;
        this.posy = y;
        this.largura = largura;
        this.altura = altura;
    }

// O método desenhar irá desenhar a entidade no canvas facilitando a reutilização de código
    desenhar(ctx) {
        ctx.fillStyle = this.cor;
        ctx.fillRect(this.posx, this.posy, this.largura, this.altura);
    }
}

// Adiciona event listeners para capturar as teclas pressionadas
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        raquete.mover('esquerda');
    } else if (event.key === 'ArrowRight') {
        raquete.mover('direita');
    }
});

// Classe raquete que extende da classe Entidade e irá criar a raquete do jogo
class Raquete extends Entidade {
    constructor(x, y, largura, altura) {
        super(x, y, largura, altura);
        this.velocidade = 20;
        this.cor = 'blue';
    }
    
// Método que irá mover a raquete para a esquerda ou direita dependendo da tecla pressionada pelo jogador
    mover(direcao) {
        if (direcao === 'esquerda' && this.posx > 0) {
            this.posx -= this.velocidade;
        } else if (direcao === 'direita' && this.posx + this.largura < canvas.width) {
            this.posx += this.velocidade;
        }
    }
}

// Criação de uma nova raquete (Agora centralizada)
raquete = new Raquete((canvas.width - 100) / 2, canvas.height - 30, 100, 20);

// Função que irá desenhar a raquete
function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    raquete.desenhar(ctx);
}

// Classe bola que extende da classe Entidade e irá criar a bola do jogo para ser rebatida pela raquete
class Bola extends Entidade {
    constructor(x, y, raio, velocidade) {
        super(x, y, raio, raio);
        this.raio = raio;
        this.velocidadeX = velocidade;
        this.velocidadeY = -velocidade;
        this.cor = 'red';
    }
}

// Classe que cria os tijolos para serem quebrados pela bola
class Tijolo extends Entidade {
    constructor(x, y, largura, altura) {
        super(x, y, largura, altura);
        this.cor = 'green';
    }
}

// Função que atualiza o canvas
function atualizar() {
    desenhar();
    requestAnimationFrame(atualizar);
}

// Função que faz o jogo rodar
atualizar();