// Modelos iniciais. O escritório pode editá-los na tela Documentos.
const ENDERECO_ESCRITORIO =
  "Rua Nelson Gama de Oliveira, nº 311, 11º andar, conjunto 114, Morumbi, São Paulo/SP, CEP 05734-150";

export const MODELOS_PADRAO: { nome: string; categoria: string; conteudo: string }[] = [
  {
    nome: "Procuração ad judicia et extra",
    categoria: "Procurações",
    conteudo: `# PROCURAÇÃO AD JUDICIA ET EXTRA
**OUTORGANTE:** **{{cliente.nome}}**, {{cliente.qualificacao}}.
**OUTORGADO:** **{{advogado.nome}}**, advogado inscrito na OAB/{{advogado.oab}}, integrante de **PACHECOS ADVOGADOS ASSOCIADOS**, com escritório na ${ENDERECO_ESCRITORIO}.
**PODERES:** pelo presente instrumento, o(a) outorgante nomeia e constitui seu bastante procurador o outorgado, a quem confere os poderes da cláusula __ad judicia et extra__, para o foro em geral, em qualquer juízo, instância ou tribunal, podendo propor as ações competentes e defendê-lo(a) nas contrárias, seguindo umas e outras até final decisão, usando os recursos legais e acompanhando-os, conferindo-lhe ainda **poderes especiais** para receber citação, confessar, reconhecer a procedência do pedido, transigir, desistir, renunciar ao direito sobre o qual se funda a ação, receber, dar quitação, firmar compromisso e assinar declaração de hipossuficiência econômica, nos termos do art. 105 do Código de Processo Civil, podendo ainda substabelecer, com ou sem reserva de poderes.
>> São Paulo, {{data.hoje}}.
>> ____________________________________________
>> **{{cliente.nome}}**`,
  },
  {
    nome: "Declaração de hipossuficiência",
    categoria: "Declarações",
    conteudo: `# DECLARAÇÃO DE HIPOSSUFICIÊNCIA ECONÔMICA
**{{cliente.nome}}**, {{cliente.qualificacao}}, **DECLARA**, sob as penas da lei, que não possui condições de arcar com as custas processuais e os honorários advocatícios sem prejuízo do próprio sustento e de sua família, razão pela qual requer os benefícios da **gratuidade da justiça**, nos termos dos arts. 98 e 99 do Código de Processo Civil.
Por ser verdade, firma a presente declaração.
>> São Paulo, {{data.hoje}}.
>> ____________________________________________
>> **{{cliente.nome}}**`,
  },
  {
    nome: "Contrato de honorários advocatícios",
    categoria: "Contratos",
    conteudo: `# CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS E HONORÁRIOS
**CONTRATANTE:** **{{cliente.nome}}**, {{cliente.qualificacao}}.
**CONTRATADA:** **PACHECOS ADVOGADOS ASSOCIADOS**, com escritório na ${ENDERECO_ESCRITORIO}, neste ato representada por **{{advogado.nome}}**, OAB/{{advogado.oab}}.
As partes acima identificadas têm entre si justo e contratado o presente instrumento, que se regerá pelas cláusulas seguintes e pela Lei nº 8.906/1994 (Estatuto da Advocacia e da OAB).
## CLÁUSULA PRIMEIRA: DO OBJETO
A CONTRATADA prestará serviços advocatícios ao CONTRATANTE em: **{{processo.titulo}}** (processo nº {{processo.numero}}, {{processo.vara}}, {{processo.comarca}}).
## CLÁUSULA SEGUNDA: DOS HONORÁRIOS
Pelos serviços, o CONTRATANTE pagará à CONTRATADA honorários de **R$ {{honorarios.valor}}**, da seguinte forma: {{honorarios.forma_pagamento}}.
Parágrafo único. Em caso de êxito, serão devidos ainda honorários de **{{honorarios.percentual_exito}}%** sobre o proveito econômico obtido, sem prejuízo dos honorários de sucumbência, que pertencem à CONTRATADA.
## CLÁUSULA TERCEIRA: DAS DESPESAS
Custas, emolumentos, perícias, diligências e demais despesas do processo correm por conta do CONTRATANTE e não estão incluídas nos honorários.
## CLÁUSULA QUARTA: DO FORO
Fica eleito o foro da Comarca de São Paulo/SP para dirimir questões oriundas deste contrato.
E, por estarem justas e contratadas, as partes assinam o presente em duas vias de igual teor.
>> São Paulo, {{data.hoje}}.
>> ____________________________________________
>> **{{cliente.nome}}** (CONTRATANTE)
>> ____________________________________________
>> **PACHECOS ADVOGADOS ASSOCIADOS** (CONTRATADA)`,
  },
  {
    nome: "Recibo de honorários",
    categoria: "Recibos",
    conteudo: `# RECIBO
**PACHECOS ADVOGADOS ASSOCIADOS** declara que recebeu de **{{cliente.nome}}**, CPF/CNPJ {{cliente.cpfCnpj}}, a importância de **R$ {{recibo.valor}}** ({{recibo.valor_extenso}}), referente a honorários advocatícios em **{{processo.titulo}}**, dando plena e geral quitação quanto ao valor recebido.
>> São Paulo, {{data.hoje}}.
>> ____________________________________________
>> **{{advogado.nome}}**
>> OAB/{{advogado.oab}}`,
  },
];
