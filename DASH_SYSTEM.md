# Sistema de Rolagem (Dash)

## Implementação Completa

O sistema de rolagem foi implementado com sucesso no jogo "Not My Nana". Aqui estão os detalhes:

### Características

1. **Ativação**: Pressione a tecla `Shift` para ativar a rolagem
2. **Direção**: A rolagem segue a direção do movimento atual ou a última direção em que o personagem estava se movendo
3. **Velocidade**: Durante a rolagem, o personagem se move a uma velocidade de 15 pixels por frame (3x mais rápido que o normal)
4. **Duração**: A rolagem dura 200 milissegundos
5. **Cooldown**: Após usar, há um cooldown de 3 segundos antes de poder usar novamente

### Efeitos Visuais

1. **Partículas Azuis**: Durante a rolagem, partículas azuis são criadas atrás do personagem
2. **Brilho Azul**: O personagem fica com um brilho azul suave durante a rolagem
3. **Barra de Cooldown**: Uma barra azul aparece na parte inferior da tela mostrando o tempo restante do cooldown
4. **Indicador Pronto**: Quando o dash está disponível, aparece um texto pulsante "⚡ SHIFT - ROLAGEM PRONTA ⚡"

### Mecânicas de Jogo

1. **Imunidade**: Durante a rolagem, o personagem é imune a dano de lobos
2. **Colisão**: O personagem ainda colide com obstáculos (lagos e árvores) durante a rolagem
3. **Limites**: O personagem não pode sair dos limites do mundo durante a rolagem

### Arquivos Modificados

1. **index.html**: Adicionados estilos e elementos HTML para a barra de cooldown e indicador
2. **Player.js**: Implementadas as mecânicas de dash (startDash, updateDash, createDashParticles, getDashCooldownPercent)
3. **Game.js**: Integração do sistema de dash com o loop de jogo e atualização da UI

### Como Usar no Jogo

1. Inicie o jogo
2. Quando aparecer "⚡ SHIFT - ROLAGEM PRONTA ⚡", pressione Shift
3. O personagem dará um dash rápido na direção do movimento
4. Aguarde a barra azul desaparecer para usar novamente

### Dicas de Gameplay

- Use o dash para escapar de grupos de lobos
- O dash pode atravessar lobos sem sofrer dano
- Planeje suas rotas para maximizar a eficiência do dash
- O dash é perfeito para reposicionar rapidamente durante batalhas contra o boss
