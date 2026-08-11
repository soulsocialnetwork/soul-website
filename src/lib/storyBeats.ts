export type Beat = {
  type: 'comment';
  text: string;
  reveal?: string;
};

export const STORY_BEATS: Record<string, Beat[]> = {
  intro: [
    { type: 'comment', text: '"psiu... sabia que você já checou o celular hoje umas 67 vezes? nem eu, que sou fantasma, sou tão assombrado assim."' },
    { type: 'comment', text: '"capítulo um: o reflexo. eu ia sugerir um nome mais assustador, mas prometi me comportar."', reveal: 'chapter' },
    { type: 'comment', text: '"9h13 por dia conectado. até eu, que não durmo, preciso de um descanso só de ouvir isso."', reveal: 'context' },
    { type: 'comment', text: '"e se, pela primeira vez, seu celular trabalhasse pra você? eu topo ser o primeiro estagiário dessa causa."', reveal: 'question' },
  ],
  s2: [
    { type: 'comment', text: '"enquanto você rola o feed, um exército de gente decide o que você vai sentir. plot twist: ninguém te perguntou nada."' },
    { type: 'comment', text: '"capítulo dois: o mecanismo. aviso: nem eu entendo tudo, e eu vivo entre os cabos."', reveal: 'chapter' },
    { type: 'comment', text: '"brain rot... nome forte, mas combina com a sensação de assistir 40 vídeos e não lembrar nenhum."', reveal: 'context' },
    { type: 'comment', text: '"respira. o resto dessa história vem em seguida, sem pressa."', reveal: 'context2' },
    { type: 'comment', text: '"e se, em vez de te capturar, a tecnologia te devolvesse pra você mesmo? eu assino embaixo. literalmente, sou transparente."', reveal: 'question' },
  ],
  s3: [
    { type: 'comment', text: '"apresento a vocês: o soul. eu sou o dono, que dizer soulzinho"' },
    { type: 'comment', text: '"capítulo três: o manifesto. essa parte eu levo a sério — juro, por um segundo."', reveal: 'chapter' },
    { type: 'comment', text: '"nada de rolagem infinita por aqui. convenhamos, infinito é osso duro de roer pra qualquer um. até pra mim."', reveal: 'context' },
    { type: 'comment', text: '"chega de tigela sem fundo. aqui o prato acaba, e tá tudo bem."', reveal: 'context2' },
    { type: 'comment', text: '"e se, finalmente, a tecnologia existisse pra você ir embora? eu, pelo menos, nunca fico bravo quando você sai."', reveal: 'question' },
  ],
  s4: [
    { type: 'comment', text: '"você: "só mais um vídeo". também você, 40 minutos depois: "como cheguei aqui?". eu conheço bem essa cena."' },
    { type: 'comment', text: '"capítulo quatro: o autoplay. prometo não apertar o play por você. eu nem tenho dedos."', reveal: 'chapter' },
    { type: 'comment', text: '"o soults não tem autoplay. o vídeo espera você decidir, igualzinho eu espero você me notar. sou discreto assim."', reveal: 'context' },
    { type: 'comment', text: '"uma bicicleta encostada na parede não sai sozinha por aí. nem eu, sem você pedalar."', reveal: 'context2' },
    { type: 'comment', text: '"e se a tecnologia aprendesse a esperar, pela primeira vez? eu já sou fera nisso. vivo esperando você abrir o app."', reveal: 'question' },
  ],
  s5: [
    { type: 'comment', text: '"uma mentira dá a volta ao mundo antes da verdade calçar o primeiro tênis. e olha que eu nem tenho pés."' },
    { type: 'comment', text: '"capítulo cinco: a mentira. essa aqui dói um pouco. segura minha mão. bom, minha manga."', reveal: 'chapter' },
    { type: 'comment', text: '"boato de cura milagrosa? nem eu, que já morri, acredito nessas."', reveal: 'context' },
    { type: 'comment', text: '"a tela termina, mas a consequência não. isso aqui eu não acho engraçado."', reveal: 'context2' },
    { type: 'comment', text: '"e se a pergunta virasse "isso merece a sua confiança"? prometo nunca mentir pra você. exceto sobre quantos sustos eu já dei."', reveal: 'question' },
  ],
  s6: [
    { type: 'comment', text: '"aquele anúncio bem na hora que você só comentou sobre o produto com um amigo? coincidência? eu, particularmente, não acredito em fantasmas. esse tipo de coincidência, digo."' },
    { type: 'comment', text: '"capítulo seis: a vigilância. relaxa, eu só espiono seu ânimo, não seus dados."', reveal: 'chapter' },
    { type: 'comment', text: '"você não é só usuário. em muito lugar por aí, você é o inventário. aqui, não."', reveal: 'context' },
    { type: 'comment', text: '"aqui no soul, seus dados não viram inventário. o único inventário por aqui sou eu, e olha que eu nem cobro aluguel pra aparecer."', reveal: 'context2' },
    { type: 'comment', text: '"e se a tecnologia existisse sem precisar te possuir? relaxa, eu sou o único fantasma autorizado por aqui."', reveal: 'question' },
  ],
  s7: [
    { type: 'comment', text: '"ei, antes de você fechar essa aba... olha pro lado. tem gente de verdade esperando por você."' },
    { type: 'comment', text: '"a vida boa não manda notificação. ela só acontece — e cada segundo importa."', reveal: 'context' },
    { type: 'comment', text: '"ainda há tempo. eu, de fantasma pra gente viva: levanta os olhos."', reveal: 'context2' },
    { type: 'comment', text: '"valeu por chegar até aqui comigo. essa jornada, aliás, ainda nem terminou."', reveal: 'footer' },
  ],
};