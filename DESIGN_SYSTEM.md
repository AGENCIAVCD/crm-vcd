# Voce Digital Propaganda Design System

## Purpose

Este documento e a fonte de verdade visual do projeto.
Toda mudanca de UI, layout, pagina, componente, formulario, dashboard, modal ou landing interna do CRM deve consultar este arquivo antes de implementar.

Se houver conflito entre estilos antigos do projeto e este documento, vence este documento, salvo instrucao explicita do usuario.

## Brand Direction

- Linguagem visual de alto contraste.
- Foco em legibilidade, clareza comercial e conversao.
- Estetica de "direct response" com hierarquia forte.
- Evitar interfaces lavadas, cinza demais ou sem ponto focal.
- Evitar botoes escuros com texto escuro.
- Evitar excesso de elementos sem funcao comercial clara.

## Color Palette

| Categoria | Nome | HEX | Uso |
| --- | --- | --- | --- |
| Primaria | Amarelo Brand | `#FFB800` | CTAs principais, icones de destaque, fundos de secao |
| Secundaria | Black Pure | `#000000` | Titulos principais, botoes de contato, rodape |
| Texto/Corpo | Dark Gray | `#1A1A1A` | Textos de apoio e paragrafos |
| Superficie | Off-White | `#F9F9F9` | Fundos de cards e secoes secundarias |
| Bordas | Light Stroke | `#E5E5E5` | Divisores, campos de input e bordas de cards |

## Typography

Usar fonte sans-serif geometrica, preferencialmente:

- `Montserrat`
- `Poppins`
- similar com boa leitura e pesos fortes

### Heading Scale

| Nivel | Configuracao | Uso |
| --- | --- | --- |
| `H1` | `64px`, weight `900`, uppercase, line-height `1.1` | Hero e chamadas principais |
| `H2` | `48px`, weight `900`, uppercase | Titulos de secao |
| `H3` | `24px`, weight `700`, uppercase | Titulos de cards e blocos |

### Body Scale

| Nivel | Configuracao | Uso |
| --- | --- | --- |
| Body Large | `18px`, weight `400`, line-height `1.6` | Texto principal |
| Body Small | `14px`, weight `500` | Descricoes curtas e labels |
| Caption | `10px`, weight `900`, uppercase, tracking `0.1em` | Tags, avisos, microcopy |

## Buttons

Regras gerais:

- `border-radius: 8px`
- texto sempre em uppercase quando fizer sentido como CTA
- contraste e obrigatorio
- se o botao for escuro, o texto deve ser claro
- se o botao for amarelo, o texto deve ser preto

### Primary Button

- background: `#000000`
- text: `#FFFFFF`
- weight: `700`
- uso: acoes definitivas

Exemplos:

- `Salvar`
- `Falar com Especialista`
- `Entrar no CRM`

### Secondary Attention Button

- background: `#FFB800`
- text: `#000000`
- uso: prospeccao, destaque, envio

Exemplos:

- `Enviar Formulario`
- `Novo Lead`

### Outline Button

- border: `2px solid #000000`
- background: `transparent`
- text: `#000000`
- uso: acoes de menor prioridade

Exemplos:

- `Saiba Mais`
- `Cancelar`

## Forms

### Inputs

- background: `#F2F2F2` ou escuro dependendo da secao
- padding: `16px`
- border-radius: `12px`
- placeholder: cinza medio
- labels acima do campo
- labels em uppercase quando a interface pedir tom mais editorial/comercial

### Form Behavior

- formularios devem ser faceis de escanear
- priorizar poucos campos por linha
- agrupamento logico por blocos
- feedback visual de foco precisa ser obvio
- erros e sucesso precisam ser claros e de alta legibilidade

## Cards

### Service Cards

- background: `#FFFFFF`
- border-radius: `24px`
- shadow: `0px 4px 20px rgba(0, 0, 0, 0.05)`
- layout: icone centralizado no topo em box amarelo, titulo e descricao

### CRM Cards

Quando adaptado para CRM:

- manter destaque claro no topo
- separar metadados de acao
- usar off-white ou branco para conteudo principal
- preservar leitura rapida
- usar amarelo e preto como ancora visual, nao turquesa/lavado como identidade principal

### Testimonial / Video Cards

- background: `#000000`
- miniatura de video com botao play centralizado
- identificacao do cliente abaixo
- nome em amarelo ou preto conforme contraste

## Grid And Spacing

- container maximo: `1200px`
- gutter entre colunas: `32px`
- espaco vertical entre secoes grandes: `80px` a `120px`
- sempre preservar bastante respiro visual

## Iconography

- estilo solid ou outline grosso
- cor do icone:
  - `#000000` sobre fundo amarelo
  - `#000000` ou `#1A1A1A` sobre fundo branco
- icones de destaque devem viver dentro de shape arredondado com cor primaria

## UI Guardrails

### Do

- usar preto como ancora de hierarquia
- usar amarelo para chamada e destaque
- criar contraste forte entre CTA e fundo
- manter titulos expressivos e fortes
- usar layouts com cara de agencia comercial, nao SaaS generico

### Do Not

- nao usar visual liso, chapado e sem contraste
- nao usar botao preto com texto escuro
- nao diluir o branding em tons frios como identidade principal
- nao transformar tudo em card pastel sem tensao visual
- nao usar tipografia fraca ou sem hierarquia

## Implementation Rules For This Repo

- todo componente novo deve verificar este documento antes de escolher cor, raio, espacamento e tipografia
- toda pagina importante deve refletir esta identidade
- componentes existentes devem ser migrados gradualmente para este sistema
- em caso de duvida entre "bonito" e "vende melhor", priorizar clareza e conversao
- Kanban, dashboard, login e modais devem seguir este documento nas proximas iteracoes

## Priority Areas To Align

As proximas telas que mais precisam seguir este design system:

1. `/login`
2. `/dashboard`
3. `/pipelines/[id]`
4. modais de lead
5. formularios de criacao e edicao

