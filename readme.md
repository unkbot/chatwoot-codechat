# chatwoot-codechat

## Deploy Ubuntu 22.x

NodeJS 16x

```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

Clone

```bash
git clone git@github.com:w3nder/chatwoot-codechat.git
```

Altere o nome do .env.example para .env e preencha com as informações correta e executa o install e build

```bash
cd chatwoot-codechat
cp env.example .env
nano .env
npm install
npm run build
```

Instale o pm2 **com sudo** e inicie o backend com ele:

```bash
sudo npm install -g pm2
pm2 start dist/app.js --name chatwoot-codechat
```

Crie o proxy para integração

```bash
sudo nano /etc/nginx/sites-available/chatwoot-codechat
```

```bash
server {
  server_name chatwoot-codechat.seudominio.com.br;

  location / {
    proxy_pass http://127.0.0.1:1234;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Crie os links simbólicos para habilitar os sites:

```bash
sudo ln -s /etc/nginx/sites-available/chatwoot-codechat /etc/nginx/sites-enabled
```

Teste a configuração e reinicie o nginx:

```bash
sudo nginx -t
sudo service nginx restart
```

Agora, ative o SSL (https) nos seus sites para utilizar todas as funcionalidades da aplicação como notificações e envio de mensagens áudio. Uma forma fácil de o fazer é utilizar Certbot:

Instale o certbor com snapd:

```bash
sudo snap install --classic certbot
```

Habilite SSL com nginx:

```bash
sudo certbot --nginx
```

URLs WEBHOOK:

```bash
https://chatwoot-codechat.seudominio.com.br/webhook/codechat
https://chatwoot-codechat.seudominio.com.br/webhook/chatwoot
```

No CODECHAT, você precisa usar o webhook global ele por padrão vem desabilitado no env.yml

**Manual do Bot**

Contato do Bot: +123456

Comandos Disponíveis:

- `/iniciar` Este comando irá criar uma nova instância e gerar um QR code para você escanear com o WhatsApp. Você poderá conectar-se à instância e começar a usar o bot.

- `/status` Este comando irá verificar o status da instância e retornar informações atualizadas sobre o estado da conexão.

- `/desconectar` Este comando irá desconectar o WhatsApp da instância, encerrando a conexão.

## Deploy Docker

Para fazer o deploy usando docker siga os passos abaixo:

```bash
cd chatwoot-codechat
cp env.example .env
nano .env
docker compose up -d --build
```

O servidor irá estará rodando na porta escolhida na variável `PORT`.

Para configurar o nginx siga as instruções do Deploy normal.
