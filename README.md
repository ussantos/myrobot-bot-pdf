# Bot com Leitura de PDFs

Exemplo didatico para demonstrar como um bot pode consultar documentos antes de responder.

O projeto usa PDF.js via CDN para tentar extrair texto de um PDF enviado pelo aluno. Tambem existe uma area de texto com um documento de exemplo, para que a aula funcione mesmo sem um arquivo PDF.

## O que o aluno aprende

- Como transformar um documento em texto pesquisavel.
- Como dividir um texto em trechos menores.
- Como buscar trechos relevantes a partir de uma pergunta.
- Como mostrar fontes para explicar de onde veio a resposta.

## Como rodar

Abra `index.html` no navegador.

Se o navegador bloquear recursos externos ao abrir direto pelo arquivo, sirva a pasta com:

```bash
python -m http.server 8002
```

Depois acesse `http://localhost:8002`.

## Proximos passos

- Trocar a busca por embeddings.
- Armazenar varios documentos.
- Conectar uma API de IA para gerar respostas com os trechos encontrados.
