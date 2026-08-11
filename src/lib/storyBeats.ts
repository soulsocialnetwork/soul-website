/**
 * storyBeats.ts — Narrativas do Soulzinho por seção.
 * Portadas 1:1 do original. Chave = story.key = STORY_ORDER[i].
 *
 * Cada beat: { type: 'comment'|'stat'|'plain', text, reveal? }
 *   reveal = data-story-reveal do elemento a ser revelado
 */

export type Beat = {
  type: 'comment' | 'stat' | 'plain';
  text: string;
  reveal?: string;
};

export const STORY_BEATS: Record<string, Beat[]> = {
  intro: [
    { type: 'comment', text: 'dois países entre os mais conectados do mundo. você sabe quais são?' },
    { type: 'stat',    text: 'não é exagero. é o seu dia em números.', reveal: 'stats' },
    { type: 'plain',   text: 'esse tempo não some sozinho.', reveal: 'context' },
    { type: 'comment', text: 'e se uma rede social devolvesse esse tempo?', reveal: 'question' },
  ],
  s2: [
    { type: 'comment', text: 'spoiler: não foi você que perdeu o controle.' },
    { type: 'plain',   text: 'foi projetado assim.', reveal: 'headline' },
    { type: 'plain',   text: 'o mecanismo tem nome.', reveal: 'mechanism' },
    { type: 'plain',   text: 'mas o design pode ir na direção contrária.', reveal: 'concepts' },
    { type: 'plain',   text: 'as referências estão aqui.', reveal: 'source' },
    { type: 'comment', text: 'e se a tecnologia devolvesse o controle?', reveal: 'question' },
  ],
  s3: [
    { type: 'plain',   text: 'palavra do ano em vários países.', reveal: 'headline' },
    { type: 'plain',   text: 'dois padrões, uma trajetória previsível.', reveal: 'context' },
    { type: 'comment', text: 'e se publicar exigisse uma pausa?', reveal: 'question' },
    { type: 'plain',   text: 'um segundo de intenção muda a publicação.', reveal: 'concept' },
  ],
  s4: [
    { type: 'plain',   text: 'não é o tempo. é o como.', reveal: 'headline' },
    { type: 'plain',   text: 'sete mil adolescentes. uma diferença clara.', reveal: 'context' },
    { type: 'plain',   text: 'quem aperta o play importa.', reveal: 'concepts' },
    { type: 'comment', text: 'e se o conteúdo esperasse a decisão do usuário?', reveal: 'question' },
  ],
  s5: [
    { type: 'stat',    text: 'seis vezes. deixa isso assentar.', reveal: 'stats' },
    { type: 'plain',   text: 'o mesmo mecanismo que prende, distorce.', reveal: 'context' },
    { type: 'comment', text: 'e se a linha do tempo voltasse a ser a mesma para todos?', reveal: 'question' },
    { type: 'plain',   text: 'cronológico. sem ranqueamento.', reveal: 'concept' },
  ],
  s6: [
    { type: 'plain',   text: 'quando é grátis, quem paga?', reveal: 'headline' },
    { type: 'plain',   text: 'o nome técnico é capitalismo de vigilância.', reveal: 'context' },
    { type: 'plain',   text: 'cada decisão de design é uma escolha.', reveal: 'concepts' },
    { type: 'comment', text: 'e se o modelo de negócio fosse outro?', reveal: 'question' },
  ],
  s7: [
    { type: 'comment', text: 'chegamos até aqui juntos.' },
    { type: 'plain',   text: 'o soul é um manifesto com interface.', reveal: 'headline' },
    { type: 'plain',   text: 'cada decisão de design tem uma razão.', reveal: 'context' },
    { type: 'comment', text: 'obrigado por ter chegado até aqui.', reveal: 'cta' },
  ],
};
