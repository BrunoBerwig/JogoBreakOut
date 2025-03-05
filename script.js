const canvas = document.getElementById('JogoCanvas');
const ctx = canvas.getContext('2d');

class Entidade {
    constructor(x, y, largura, altura) {
        this.posx = x;
        this.posy = y;
        this.largura = largura;
        this.altura = altura;
    }

    desenhar(ctx) {
        ctx.fillStyle = this.cor;
        ctx.fillRect(this.posx, this.posy, this.largura, this.altura);
    }
}
