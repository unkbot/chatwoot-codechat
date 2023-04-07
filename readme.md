# chatwoot-codechat

Crie um arquivo .env de backend e preencha com as informações correta:

```bash
cp chatwoot-codechat/.env.example chatwoot-codechat/.env
nano chatwoot-codechat/.env
```

```bash
PORT = 1234
CHATWOOT_ACCOUNT_ID = 76598
CHATWOOT_TOKEN = LrN39bkVbbFRr5H3WBQUzRf3
CHATWOOT_BASE_URL = https://app.chatwoot.com

CODECHAT_BASE_URL = http://localhost:8081
CODECHAT_API_KEY = t8OOEeISKzpmc3jjcMqBWYSaJsafdefer
```

URLs WEBHOOK:

```bash
https://codewoot.seudominio.com.br/webhook/codechat
https://codewoot.seudominio.com.br/webhook/chatwoot
```


No CODECHAT, você precisa usar o webhook global ele por padrão vem desabilitado no env.yml

**Manual do Bot**

Contato do Bot: +123456

Comandos Disponíveis:

- `/iniciar` Este comando irá criar uma nova instância e gerar um QR code para você escanear com o WhatsApp. Você poderá conectar-se à instância e começar a usar o bot.

- `/status` Este comando irá verificar o status da instância e retornar informações atualizadas sobre o estado da conexão.

- `/desconectar` Este comando irá desconectar o WhatsApp da instância, encerrando a conexão.


