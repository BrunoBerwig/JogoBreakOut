import { Entidade } from './entity.js';
// Importe a classe Bola se precisar criar novas bolas ou acessar propriedades específicas
// import { Bola } from './ball.js'; // Geralmente não é necessário aqui, o jogo.bolas já tem

export class PowerUp extends Entidade {
    constructor(posx, posy, canvas) {
        const tamanhoBase = canvas.width / 45;
        super(posx - tamanhoBase / 2, posy - tamanhoBase / 2, tamanhoBase, tamanhoBase);
        this.canvas = canvas;
        this.tipo = this.gerarTipo();
        this.cor = this.definirCor();
        this.velocidadeY = canvas.height / 300;
        this.pulseAngle = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.06;
        this.pulseAmplitude = 0.2;
        this.glowRadius = tamanhoBase * 0.5;
        this.baseLargura = this.largura;
        this.baseAltura = this.altura;
    }

    gerarTipo() {
        const tipos = [
            'raqueteGrande', 'vidaExtra', 'bolaLenta', 'bolaExtra', 'multiBola',

            'bolaDeFogo', 'escudoBase',

            'raquetePequena', 'bolaRapidaDemais'
        ];
        return tipos[Math.floor(Math.random() * tipos.length)];
    }

    definirCor() {
        switch (this.tipo) {
            case 'raqueteGrande': return '#FFD700';
            case 'vidaExtra': return '#32CD32';
            case 'bolaLenta': return '#1E90FF';
            case 'bolaExtra': return '#BA55D3';
            case 'multiBola': return '#FF69B4';
            // NOVAS CORES
            case 'bolaDeFogo': return '#FF4500';     // OrangeRed
            case 'escudoBase': return '#00CED1';     // DarkTurquoise
            case 'raquetePequena': return '#A9A9A9'; // DarkGray (power-down)
            case 'bolaRapidaDemais': return '#DA70D6'; // Orchid (power-down, cor chamativa)
            default: return '#FFFFFF';
        }
    }

    desenhar(ctx) {
        const scaleFactor = 1 + Math.sin(this.pulseAngle) * this.pulseAmplitude;
        const currentWidth = this.baseLargura * scaleFactor;
        const currentHeight = this.baseAltura * scaleFactor;
        const drawX = this.posx + (this.baseLargura - currentWidth) / 2;
        const drawY = this.posy + (this.baseAltura - currentHeight) / 2;

        ctx.save();
        ctx.shadowColor = this.cor;
        ctx.shadowBlur = this.glowRadius;
        ctx.fillStyle = this.cor;
        ctx.fillRect(drawX, drawY, currentWidth, currentHeight);

        const iconSize = Math.max(8, currentHeight * 0.55);
        ctx.font = `bold ${iconSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        let icon = '?';
        switch (this.tipo) {
            case 'raqueteGrande': icon = '↔'; break;
            case 'vidaExtra': icon = '+♥'; break;
            case 'bolaLenta': icon = 'S'; break;
            case 'bolaExtra': icon = '●'; break;
            case 'multiBola': icon = '⁂'; break;
            // NOVOS ÍCONES
            case 'bolaDeFogo': icon = '🔥'; break;
            case 'escudoBase': icon = '🛡️'; break; // Pode ser '▬' se o emoji não renderizar bem
            case 'raquetePequena': icon = '←→'; break; // Menor que o da raquete grande
            case 'bolaRapidaDemais': icon = '⚡'; break;
        }
        ctx.fillText(icon, drawX + currentWidth / 2, drawY + currentHeight / 2 + 1);
        ctx.restore();
    }

    atualizar() {
        this.posy += this.velocidadeY;
        this.pulseAngle = (this.pulseAngle + this.pulseSpeed) % (Math.PI * 2);
    }

    verificarColisaoRaquete(raquete) {
        return (
            this.posx < raquete.posx + raquete.largura &&
            this.posx + this.largura > raquete.posx &&
            this.posy < raquete.posy + raquete.altura &&
            this.posy + this.altura > raquete.posy
        );
    }

    aplicarEfeito(jogo) {
        switch (this.tipo) {
            case 'raqueteGrande':
                const larguraOriginalRaqueteG = jogo.raquete.largura;
                jogo.raquete.largura = Math.min(larguraOriginalRaqueteG * 1.5, jogo.canvas.width * 0.6);
                setTimeout(() => { jogo.raquete.largura = larguraOriginalRaqueteG; }, 10000);
                break;
            case 'vidaExtra':
                jogo.vidas++;
                break;
            case 'bolaLenta':
                jogo.bolas.forEach(bola => {
                    if (bola.ativa) {
                        bola.velocidadeX *= 0.6;
                        bola.velocidadeY *= 0.6;
                    }
                });
                setTimeout(() => {
                    jogo.bolas.forEach(bola => {
                        if (bola.ativa) {
                            const velMag = Math.sqrt(bola.velocidadeX**2 + bola.velocidadeY**2);
                            if (velMag > 0.1) {
                                bola.velocidadeX = (bola.velocidadeX / velMag) * bola.velocidadeBase;
                                bola.velocidadeY = (bola.velocidadeY / velMag) * bola.velocidadeBase;
                            } else {
                                bola.velocidadeX = (Math.random() > 0.5 ? 1: -1) * bola.velocidadeBase * 0.707;
                                bola.velocidadeY = -bola.velocidadeBase * 0.707;
                            }
                        }
                    });
                }, 8000);
                break;
            case 'bolaExtra':
            case 'multiBola':
                const maxBolas = 5;
                let bolasParaAdicionar = (this.tipo === 'multiBola' ? 2 : 1);
                const bolaReferencia = jogo.bolas.find(b => b.ativa) || jogo.bolas[0];
                if (bolaReferencia) {
                    for (let i = 0; i < bolasParaAdicionar && jogo.bolas.length < maxBolas; i++) {
                        const novaBola = new Bola(
                            bolaReferencia.centroX,
                            bolaReferencia.centroY,
                            bolaReferencia.raio,
                            bolaReferencia.velocidadeBase,
                            jogo.canvas
                        );
                        const anguloAleatorio = (Math.random() - 0.5) * (Math.PI / 3);
                        novaBola.velocidadeX = bolaReferencia.velocidadeBase * Math.sin(anguloAleatorio);
                        novaBola.velocidadeY = -bolaReferencia.velocidadeBase * Math.cos(anguloAleatorio);
                        jogo.bolas.push(novaBola);
                    }
                }
                break;

            // NOVOS EFEITOS
            case 'bolaDeFogo':
                jogo.bolas.forEach(bola => {
                    if (bola.ativa) {
                        bola.emFogo = true;
                        bola.corOriginalFogo = bola.cor; 
                        bola.cor = '#FF4500'; 
                    }
                });
                setTimeout(() => {
                    jogo.bolas.forEach(bola => {
                        if (bola.ativa) {
                            bola.emFogo = false;
                            bola.cor = bola.corOriginalFogo || '#E94E77'; // Restaura cor
                        }
                    });
                }, 7000); 
                break;

            case 'escudoBase':
                if (!jogo.escudoAtivo) { // Ativa o escudo se não estiver ativo
                    jogo.escudoAtivo = true;
                    // Opcional: escudo dura um tempo mesmo se não usado
                    // setTimeout(() => {
                    //     if(jogo.escudoAtivo) jogo.escudoQuebrou = true; // Marca para animação de quebra
                    //     jogo.escudoAtivo = false;
                    // }, 15000); // Escudo dura 15s se não for usado
                }
                break;

            case 'raquetePequena':
                const larguraOriginalRaqueteP = jogo.raquete.largura;
                const larguraMinima = Math.max(20, jogo.canvas.width * 0.05); // Ex: 5% da largura, mínimo 20px
                
                jogo.raquete.largura = Math.max(larguraMinima, larguraOriginalRaqueteP * 0.5);
                // Ajusta a posição para que a raquete não "pule" muito se estiver perto das bordas
                const diffLarguraP = larguraOriginalRaqueteP - jogo.raquete.largura;
                jogo.raquete.posx += diffLarguraP / 2;
                jogo.raquete.posx = Math.max(0, Math.min(jogo.raquete.posx, jogo.canvas.width - jogo.raquete.largura));

                setTimeout(() => {
                    const diffLarguraRestaurar = jogo.raquete.largura - larguraOriginalRaqueteP;
                    jogo.raquete.largura = larguraOriginalRaqueteP;
                    jogo.raquete.posx += diffLarguraRestaurar / 2; // Ajusta posx ao restaurar
                    jogo.raquete.posx = Math.max(0, Math.min(jogo.raquete.posx, jogo.canvas.width - jogo.raquete.largura));
                }, 10000); // Dura 10 segundos
                break;

            case 'bolaRapidaDemais':
                jogo.bolas.forEach(bola => {
                    if (bola.ativa) {
                        bola.velocidadeX *= 1.8;
                        bola.velocidadeY *= 1.8;
                        const maxVelComponent = bola.velocidadeBase * 3;
                        bola.velocidadeX = Math.sign(bola.velocidadeX) * Math.min(Math.abs(bola.velocidadeX), maxVelComponent);
                        bola.velocidadeY = Math.sign(bola.velocidadeY) * Math.min(Math.abs(bola.velocidadeY), maxVelComponent);
                    }
                });
                setTimeout(() => {
                    jogo.bolas.forEach(bola => {
                        if (bola.ativa) {
                            const velMag = Math.sqrt(bola.velocidadeX**2 + bola.velocidadeY**2);
                            if (velMag > 0.1) { 
                                bola.velocidadeX = (bola.velocidadeX / velMag) * bola.velocidadeBase;
                                bola.velocidadeY = (bola.velocidadeY / velMag) * bola.velocidadeBase;
                            } else { 
                                bola.velocidadeX = (Math.random() > 0.5 ? 1: -1) * bola.velocidadeBase * 0.707;
                                bola.velocidadeY = -bola.velocidadeBase * 0.707;
                            }
                        }
                    });
                }, 8000);
                break;
        }
    }
}