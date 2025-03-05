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

// Classe raquete que extende da classe Entidade
class Raquete extends Entidade {
    constructor(x, y, largura, altura) {
        super(x, y, largura, altura);
        this.velocidade = 20;
        this.cor = 'blue';
    }
}	
// Criação de uma nova raquete
const raquete = new Raquete(50, canvas.height - 30, 100, 20);

// Função que irá desenhar a raquete
function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    raquete.desenhar(ctx);
}

// Função que atualiza o canvas
function atualizar() {
    desenhar();
    requestAnimationFrame(atualizar);
}

// Função que faz o jogo rodar
atualizar();