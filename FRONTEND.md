# Frontend do Arcanjo Promotorias

## Visao geral

O frontend foi feito dentro do proprio projeto Django usando templates, arquivos estaticos e JavaScript puro. Nao foi criado um projeto React ou outro aplicativo separado.

Essa escolha permite que a interface e a API usem o mesmo dominio e a mesma sessao Django. Com isso, nao foi necessario configurar CORS ou criar uma camada intermediaria para acessar a API.

## Tecnologias usadas

- Django templates: renderizacao das paginas HTML.
- Django Authentication: login, logout e controle de acesso ao painel.
- Django REST Framework: API ja existente consumida pelo frontend.
- JavaScript puro: carregamento dos dados, formularios, busca e acoes da tabela.
- CSS puro: layout responsivo e identidade visual.
- `django-rql`: filtros RQL ja usados pela API.

## Estrutura dos arquivos

```text
Arcanjo_promotorias/
    web_views.py
    serializers.py
    templates/
        arcanjo/
            base.html
            login.html
            painel.html
    static/
        arcanjo/
            css/
                app.css
            js/
                painel.js
core/
    settings.py
    urls.py
```

### `web_views.py`

Contem apenas as views das paginas web:

- `LoginPageView`: exibe e processa o formulario de login.
- `DashboardView`: exibe o painel e exige usuario autenticado.
- `LogoutPageView`: encerra a sessao atual.

Essas views nao substituem nem alteram os `ViewSet` da API. Elas somente renderizam as paginas do frontend.

### `core/urls.py`

As rotas web adicionadas sao:

| Rota | Funcao |
| --- | --- |
| `/` | Redireciona para o painel |
| `/login/` | Tela de login |
| `/logout/` | Encerra a sessao |
| `/painel/` | Tela protegida do sistema |
| `/api/` | Mantem as rotas originais da API |

As rotas web nao sao endpoints novos de negocio. Os dados continuam sendo lidos e alterados pelos endpoints existentes em `/api/`.

## Fluxo de autenticacao

1. O usuario acessa `/login/`.
2. O Django valida usuario e senha.
3. O Django cria uma sessao no navegador.
4. O usuario e direcionado para `/painel/`.
5. O navegador envia o cookie da sessao nas requisicoes para `/api/`.
6. A API aceita a requisicao por meio de `SessionAuthentication`.

O painel esta protegido por `LoginRequiredMixin`. Um usuario nao autenticado que acessar `/painel/` e redirecionado para o login.

## Estrutura da tela

O painel possui:

- Cabecalho com identificacao do sistema e usuario logado.
- Contador de relacoes cadastradas.
- Uma tabela unica de relacoes entre promotoria e resolucao.
- Campo de busca local.
- Formulario para criar ou editar uma relacao.
- Botoes para editar e excluir.
- Mensagens de sucesso e erro.

Nao existem tabelas separadas para promotorias e resolucoes na interface. Elas sao carregadas apenas para preencher os campos de selecao do formulario.

## Integracao com a API

O arquivo `static/arcanjo/js/painel.js` faz requisicoes para:

```text
GET    /api/promotorias/
GET    /api/resolucoes/
GET    /api/promotorias-resolucoes/
POST   /api/promotorias-resolucoes/
PATCH  /api/promotorias-resolucoes/<id>/
DELETE /api/promotorias-resolucoes/<id>/
```

No carregamento inicial, o JavaScript busca as tres colecoes em paralelo. A tabela usa somente a primeira pagina de `promotorias-resolucoes`, enquanto as outras duas respostas populam os selects de chaves. Ao pesquisar, busca ate 600 relacoes em uma unica requisicao e filtra esses registros no navegador. O endpoint limita o `page_size` das relacoes a 600; se o volume ultrapassar esse limite, a busca devera migrar para filtragem no servidor para continuar cobrindo todos os registros.

## Criacao de uma relacao

O formulario envia as chaves dos registros existentes:

```json
{
    "promotoria_id": 1,
    "resolucao_id": 2,
    "Unidade": "1a Promotoria"
}
```

O serializer em `serializers.py` usa `PrimaryKeyRelatedField` para transformar essas chaves nos relacionamentos do modelo.

O registro criado fica em `PromotoriaResolucao`. O frontend nao cria uma nova promotoria ou uma nova resolucao automaticamente. Isso evita duplicidade e respeita o relacionamento por chave estrangeira.

Na resposta da API, os objetos completos continuam disponiveis:

```json
{
    "id": 10,
    "Unidade": "1a Promotoria",
    "promotoria": {
        "id": 1,
        "nome_promotoria": "Promotoria de Exemplo",
        "entrancia": "Inicial"
    },
    "resolucao": {
        "id": 2,
        "nome_resolucao": "Resolucao de Exemplo"
    }
}
```

## CSRF e sessoes

Como o frontend usa autenticacao por sessao, as operacoes que alteram dados precisam do token CSRF.

O template disponibiliza o token com:

```django
{% csrf_token %}
```

O JavaScript le esse valor e envia o cabecalho `X-CSRFToken` em requisicoes `POST`, `PATCH` e `DELETE`.

As requisicoes usam:

```javascript
credentials: 'same-origin'
```

Isso permite que o navegador envie o cookie da sessao para a API.

## Como executar

Com o ambiente virtual configurado:

```powershell
venv\Scripts\python.exe manage.py runserver
```

Depois, acessar:

```text
http://127.0.0.1:8000/login/
```

O usuario precisa existir no sistema de autenticacao do Django. O login do painel nao e o login visual do admin, embora utilize a mesma base de usuarios e senhas do Django.

## Validacoes realizadas

Foram verificadas as seguintes situacoes:

- `python manage.py check` sem erros.
- Pagina `/login/` renderizando com status HTTP 200.
- Pagina `/painel/` redirecionando usuarios anonimos para `/login/`.
- Arquivos CSS e JavaScript encontrados pelo sistema de arquivos estaticos do Django.
- Serializer aceitando `promotoria_id` e `resolucao_id` para criar ou editar relacoes.

## Possiveis evolucoes

- Adicionar paginacao no frontend para grandes volumes de relacoes.
- Usar filtros RQL diretamente na API em vez de filtrar somente no navegador.
- Adicionar mensagens de confirmacao mais detalhadas.
- Criar permissoes diferentes para consulta e alteracao.
- Adicionar testes automatizados para login e operacoes CRUD da tabela.