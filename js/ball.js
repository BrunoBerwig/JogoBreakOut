// js/ball.js
import { Entidade } from './entity.js';

export class Bola extends Entidade {
    constructor(x, y, raio, velocidade, canvas) {
        super(x - raio, y - raio, raio * 2, raio * 2);
        this.raio = raio;
        this.centroX = x;
        this.centroY = y;
        this.velocidadeX = velocidade;
        this.velocidadeY = -velocidade;
        this.corBaseOriginal = '#E94E77'; // Cor padrão da bola
        this.cor = this.corBaseOriginal;
        this.ativa = true;
        this.velocidadeBase = velocidade;
        this.canvas = canvas;
        this.emFogo = false;
        this.corOriginalFogo = this.cor;
    }

    desenhar(ctx) {
        ctx.fillStyle = this.cor;
        if (this.emFogo) { // Efeito visual para bola de fogo
            ctx.shadowColor = 'yellow';
            ctx.shadowBlur = this.raio * 1.5; // Brilho proporcional ao tamanho
        }
        ctx.beginPath();
        ctx.arc(this.centroX, this.centroY, this.raio, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        if (this.emFogo) { // Reseta o brilho para não afetar outros desenhos
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        }
    }

    atualizar(jogo) { // Adicionado 'jogo' como parâmetro
        if (!this.ativa) return;

        this.centroX += this.velocidadeX;
        this.centroY += this.velocidadeY;
        this.posx = this.centroX - this.raio;
        this.posy = this.centroY - this.raio;

        // Colisão com paredes laterais
        if (this.centroX + this.raio > this.canvas.width) {
            this.centroX = this.canvas.width - this.raio;
            this.velocidadeX = -this.velocidadeX;
        } else if (this.centroX - this.raio < 0) {
            this.centroX = this.raio;
            this.velocidadeX = -this.velocidadeX;
        }

        // Colisão com teto
        if (this.centroY - this.raio < 0) {
            this.centroY = this.raio;
            this.velocidadeY = -this.velocidadeY;
        }

        // Colisão com o chão (LÓGICA DO ESCUDO APLICADA AQUI)
        if (this.centroY + this.raio > this.canvas.height) {
            // Verifica se o 'jogo' foi passado e se o escudo está ativo
            if (jogo && typeof jogo.escudoAtivo !== 'undefined' && jogo.escudoAtivo) {
                this.centroY = this.canvas.height - this.raio; // Reposiciona a bola para não ficar presa
                this.velocidadeY = -this.velocidadeY;         // Rebate a bola para cima

                // Garante que a bola não fique presa com velocidade Y muito baixa após rebater no escudo
                if (Math.abs(this.velocidadeY) < this.velocidadeBase * 0.3) {
                    this.velocidadeY = -this.velocidadeBase * 0.7; // Dá um impulso mínimo para cima
                }
                
                jogo.escudoAtivo = false; // Desativa o escudo após o uso
                // jogo.escudoQuebrou = true; // Para animação futura de quebra do escudo (opcional)
            } else {
                this.ativa = false; // Bola perdida (comportamento padrão se não houver escudo)
            }
        }
    }
    // --- FIM DA MODIFICAÇÃO NO MÉTODO ATUALIZAR ---

    verificarColisaoRaquete(raquete) {
        let closestX = Math.max(raquete.posx, Math.min(this.centroX, raquete.posx + raquete.largura));
        let closestY = Math.max(raquete.posy, Math.min(this.centroY, raquete.posy + raquete.altura));

        const distanciaX = this.centroX - closestX;
        const distanciaY = this.centroY - closestY;
        const distanciaQuadrada = (distanciaX * distanciaX) + (distanciaY * distanciaY);

        if (distanciaQuadrada < (this.raio * this.raio)) {
            if (this.velocidadeY > 0) { 
                this.centroY = raquete.posy - this.raio - 0.1;
            }

            const pontoImpacto = (this.centroX - (raquete.posx + raquete.largura / 2)) / (raquete.largura / 2);
            const maxAnguloDesvio = Math.PI / 2.8; 
            const angulo = pontoImpacto * maxAnguloDesvio;
            
            let velocidadeTotal = Math.sqrt(this.velocidadeX * this.velocidadeX + this.velocidadeY * this.velocidadeY);
            if (velocidadeTotal === 0 || isNaN(velocidadeTotal)) velocidadeTotal = this.velocidadeBase;

            this.velocidadeX = velocidadeTotal * Math.sin(angulo);
            this.velocidadeY = -velocidadeTotal * Math.cos(angulo); 
            if (this.velocidadeY >= -0.1) {
                this.velocidadeY = -Math.max(0.5, Math.abs(this.velocidadeBase * Math.cos(angulo)));
            }
            return true;
        }
        return false;
    }

    verificarColisaoTijolos(tijolos, jogo) {
        for (let i = 0; i < tijolos.length; i++) {
            const tijolo = tijolos[i];
            if (!tijolo.ativo) continue;

            let closestX = Math.max(tijolo.posx, Math.min(this.centroX, tijolo.posx + tijolo.largura));
            let closestY = Math.max(tijolo.posy, Math.min(this.centroY, tijolo.posy + tijolo.altura));

            const distanciaX = this.centroX - closestX;
            const distanciaY = this.centroY - closestY;
            const distanciaQuadrada = (distanciaX * distanciaX) + (distanciaY * distanciaY);

            if (distanciaQuadrada < (this.raio * this.raio)) {
                if (tijolo.ativo) { 
                    jogo.pontuacao += tijolo.pontos;
                    
                    // Se você implementou partículas e a função criarParticulasExplosao existe em jogo:
                    if (jogo.criarParticulasExplosao) {
                        jogo.criarParticulasExplosao(
                            tijolo.posx + tijolo.largura / 2, 
                            tijolo.posy + tijolo.altura / 2,  
                            tijolo.corBase 
                        );
                    }
                    tijolo.ativo = false; 
                }
                
                if (this.emFogo) {
                    // Bola de fogo atravessa
                } else {
                    // Lógica de ricochete normal
                    const overlapLeft = (this.centroX + this.raio) - tijolo.posx;
                    const overlapRight = (tijolo.posx + tijolo.largura) - (this.centroX - this.raio);
                    const overlapTop = (this.centroY + this.raio) - tijolo.posy;
                    const overlapBottom = (tijolo.posy + tijolo.altura) - (this.centroY - this.raio);

                    const minOverlapX = Math.min(overlapLeft, overlapRight);
                    const minOverlapY = Math.min(overlapTop, overlapBottom);

                    if (minOverlapY < minOverlapX) {
                        this.velocidadeY = -this.velocidadeY;
                        this.centroY += this.velocidadeY > 0 ? 0.1 : -0.1; 
                    } else {
                        this.velocidadeX = -this.velocidadeX;
                        this.centroX += this.velocidadeX > 0 ? 0.1 : -0.1;
                    }
                }
                return true; 
            }
        }
        return false;
    }
}
