# chatwoot-codechat

Este é um repositório do chatwoot-codechat, um aplicativo que permite integração do Chatwoot com o WhatsApp CodeChat como api de canal de comunicação. Siga as instruções abaixo para implantar o aplicativo em um ambiente Ubuntu 22.x com Node.js 16.x.

## Implantação no Ubuntu 22.x

### Node.js 16.x

Execute os seguintes comandos no terminal para instalar o Node.js 16.x:

```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

### Clonar o repositório

Clone este repositório para sua máquina local:

```bash
git clone git@github.com:w3nder/chatwoot-codechat.git
```

### Configurar o ambiente

Renomeie o arquivo `.env.example` para `.env` e preencha-o com as informações corretas. Em seguida, execute os comandos abaixo para instalar as dependências e criar o build:

```bash
cd chatwoot-codechat
cp .env.example .env
nano .env
npm install
npm run build
```

### Iniciar o backend com o PM2

Instale o PM2 (se necessário) e inicie o backend com ele:

```bash
sudo npm install -g pm2
pm2 start dist/app.js --name chatwoot-codechat
```

### Configurar o proxy para integração

Abra o arquivo de configuração do Nginx:

```bash
sudo nano /etc/nginx/sites-available/chatwoot-codechat
```

Cole o seguinte conteúdo no arquivo:

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

### Criar um provider

Execute o seguinte comando para criar um provider:

```bash
curl --location 'http://localhost:1234/create-provider' \
--header 'Content-Type: application/json' \
--data '{
    "account_id": "76598",
    "token": "LrN39bkVbbFRr5H3WBQUzRf3",
    "url": "https://app.chatwoot.com",
    "nameInbox": "SeuNomeSemEspaço"
}'
```

### Configurar o Nginx

Crie links simbólicos para habilitar os sites:

```bash
sudo ln -s /etc/nginx/sites-available/chatwoot-codechat /etc/nginx/sites-enabled
```

Teste a configuração do Nginx e reinicie o serviço:

```bash
sudo nginx -t
sudo service nginx restart
```

### Ativar o SSL (HTTPS)

Para utilizar todas as funcionalidades da aplicação, como notificações e envio de mensagens de áudio, ative o SSL nos seus sites. Uma maneira fácil de fazer isso é usando o Certbot. Siga as etapas abaixo:

Instale o Certbot com o Snapd:

```

bash
sudo snap install --classic certbot
```

Habilite o SSL com o Nginx:

```bash
sudo certbot --nginx
```

### URLs WEBHOOK

As URLs de webhook para integração são as seguintes:

```bash
https://chatwoot-codechat.seudominio.com.br/webhook/codechat
https://chatwoot-codechat.seudominio.com.br/webhook/chatwoot
```

## Manual do Bot

Contato do Bot: +123456

Comandos Disponíveis:

- `/iniciar`: Este comando cria uma nova instância e gera um código QR para escanear com o WhatsApp. Você pode se conectar à instância e começar a usar o bot.

- `/status`: Este comando verifica o status da instância e retorna informações atualizadas sobre o estado da conexão.

- `/desconectar`: Este comando desconecta o WhatsApp da instância, encerrando a conexão.

## Implantação com Docker

Para implantar o aplicativo usando Docker, siga as etapas abaixo:

```bash
cd chatwoot-codechat
cp .env.example .env
nano .env
docker compose up -d --build
```

O servidor estará em execução na porta especificada na variável `PORT`.

Para configurar o Nginx, siga as instruções de implantação normal mencionadas anteriormente.
