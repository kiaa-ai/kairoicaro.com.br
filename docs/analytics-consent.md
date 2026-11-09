# Consentimento de métricas

As 30 páginas que continham o carregamento direto do GA4 usam agora `ga4-consent.js`. O módulo aplica o modo básico: o script do Google não é carregado antes de uma escolha positiva válida. A recusa não carrega a tag, inclusive após navegar para outra página do mesmo domínio. A propriedade existente foi preservada; nenhum GTM ou conversão nova foi criado.

O controle oferece aceitar/recusar com o mesmo destaque e um botão permanente para rever a escolha. O registro local contém somente versão, booleano de analytics e instante da escolha, com validade de 180 dias. Registro inválido, expirado, futuro ou armazenamento não gravável não autoriza carregamento automático. Se a gravação falhar durante uma aceitação explícita, ela vale somente no documento atual; a interface informa que será perguntado novamente.

Após aceitar, os estados de consentimento entram na fila antes da configuração GA4. Apenas `analytics_storage` é concedido; publicidade permanece negada e os sinais de publicidade são desativados na configuração local. A URL configurada omite query/fragmento e o referenciador configurado é vazio. Isso não substitui revisão das opções de medição avançada no painel GA4 ou de novos eventos futuros.

Ao retirar a permissão, o módulo ativa imediatamente `ga-disable`, impede novos comandos pela função local, remove cookies acessíveis `_ga`, `_ga_*`, `_gid` e `_gat*`, e recarrega o documento para descarregar a tag anteriormente aceita. Cookies de sessão/autenticação não são apagados. Um evento de outra aba, retorno do cache de navegação ou retomada da aba reconcilia a escolha. Cookies em outros domínios ou dados já enviados não podem ser apagados pelo site.

Rotas cujo caminho começa por `/portal-`, `/portal/` ou `/portal.` não carregam analytics mesmo com escolha positiva. A substituição do snippet nessas três páginas não altera o login, formulários, dados ou demais scripts do portal. A versão do cache do service worker mudou e inclui os dois arquivos novos; a política preexistente de cache/dados do portal não integra esta alteração. Cópias antigas já instaladas/offline dependem da atualização do service worker/HTML para receber o novo comportamento.

## Verificação

Execute `node --check ga4-consent.js` e `node tests/ga4-consent.test.cjs` (Node 24 usado nesta revisão). Os testes cobrem ordem dos comandos, recusa, retirada, cookies de sessão preservados, reuso/expiração/versão, falha de armazenamento, outras abas, cache de navegação, duplicação e exclusão do portal. São testes determinísticos sem acesso ao Google.

Também foi conferida uma prévia local isolada no Chrome, com a mesma fonte do módulo e apenas a URL da tag substituída por simulador local, sob CSP sem conexões externas. Antes da aceitação e após recusa não houve pedido ao simulador; após aceitação houve carregamento; a retirada limpou os cookies de teste e recarregou sem tag. No celular de 390px, ambos os botões ficaram legíveis e sem overflow horizontal. A prévia não homologa recepção no GA4 real, formulário HubSpot, política jurídica integral ou todos os fluxos do site. Nenhum acesso de teste foi enviado à propriedade real.

Referências: [modo básico](https://developers.google.com/tag-platform/security/concepts/consent-mode), [implementação de consentimento](https://developers.google.com/tag-platform/security/guides/consent), [configuração GA4](https://developers.google.com/analytics/devguides/collection/ga4/reference/config). Esta PR deve permanecer em rascunho, sem merge/deploy automático; publicação exige aprovação específica.
