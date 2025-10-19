# Not My Nana 🎮

## Descrição

**Not My Nana** é um jogo de sobrevivência em estilo top-down shooter, inspirado em jogos como *Vampire Survivors*, onde o jogador controla uma vovó que precisa sobreviver a hordas crescentes de lobos enquanto coleta power-ups e acumula pontos.

## Stack Tecnológica

### Linguagens e Tecnologias
- **JavaScript (ES6+)** - Lógica principal do jogo
- **HTML5 Canvas** - Renderização gráfica 2D
- **CSS3** - Interface e estilização

### Arquitetura
O projeto foi desenvolvido utilizando **JavaScript vanilla** com arquitetura orientada a objetos (OOP), sem dependências externas de frameworks ou bibliotecas, garantindo performance otimizada e código limpo.

## Estrutura do Projeto

```
notmynana/
├── assets/               # Recursos visuais (sprites, logo)
├── config.js            # Configurações do jogo
├── utils.js             # Funções utilitárias
├── Player.js            # Classe do jogador
├── Wolf.js              # Classe dos inimigos (lobos)
├── Bullet.js            # Classe dos projéteis
├── Crate.js             # Classe das caixas de power-up
├── Lake.js              # Classe dos lagos decorativos
├── Tree.js              # Classe das árvores decorativas
├── Rock.js              # Classe das pedras decorativas
├── Grass.js             # Classe da grama decorativa
├── Camera.js            # Sistema de câmera 2D
├── Game.js              # Controlador principal do jogo
├── main.js              # Ponto de entrada
└── index.html           # Interface HTML
```

## Características Técnicas

### Sistema de Jogo
- **Loop de jogo otimizado** com `requestAnimationFrame`
- **Sistema de câmera 2D** que segue o jogador suavemente
- **Geração procedural de mundo** com lagos, árvores e rocas
- **Sistema de colisão** entre entidades
- **Sistema de spawn dinâmico** de inimigos nas bordas do mapa
- **Sistema de power-ups** com 5 tipos diferentes

### Mecânicas Implementadas
1. **Movimento em 8 direções** (WASD/Setas)
2. **Sistema de tiro direcional** baseado no movimento e direção do sprite
3. **Power-ups:**
   - Taxa de Tiro (Fire Rate)
   - Velocidade de Bala (Bullet Speed)
   - Tamanho de Bala (Bullet Size)
   - Velocidade de Movimento (Movement Speed)
   - Balas Perfurantes (Piercing)
4. **Sistema de vidas** com invulnerabilidade temporária
5. **Sistema de pontuação** com contador de lobos eliminados
6. **Tela de menu** com fundo animado

### Otimizações
- **Culling de renderização** - apenas objetos visíveis são desenhados
- **Geração pré-processada** de terreno e texturas
- **Sprites direcionais** para melhor feedback visual
- **Sistema de z-index** para camadas de renderização (árvores, jogador, etc.)

## Controles

- **WASD / Setas** - Movimento
- **Espaço** - Atirar
- **R** - Reiniciar (Game Over)
- **M** - Voltar ao Menu (Game Over)

## Desenvolvimento

Este projeto foi desenvolvido com conhecimentos em **JavaScript** e contou com o auxílio de ferramentas de Inteligência Artificial:
- **Claude Sonnet 3.5** (Anthropic)
- **Gemini 2.0 Flash** (Google)

As IAs foram utilizadas para:
- Refinamento de código e otimizações
- Implementação de mecânicas complexas
- Debugging e resolução de problemas
- Sugestões de arquitetura e boas práticas

## Recursos Visuais

- Sprites personalizados para vovó em 6 direções
- Sprites animados para lobos
- Elementos decorativos procedurais (árvores, lagos, rocas)
- Logo customizada do jogo
- UI minimalista e responsiva

## Futuras Melhorias

- [ ] Sistema de som e música
- [ ] Mais tipos de inimigos
- [ ] Boss battles
- [ ] Sistema de conquistas
- [ ] Leaderboard local
- [ ] Mobile controls
- [ ] Mais power-ups e combinações
