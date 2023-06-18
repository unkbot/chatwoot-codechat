# chatwoot-codechat

Este é um repositório do chatwoot-codechat, um aplicativo que permite integração do Chatwoot com o WhatsApp CodeChat como api de canal de comunicação. Siga as instruções abaixo para fazer o deploy do aplicativo em um ambiente Ubuntu 22.x com Node.js 16.x.

## Deploy no Ubuntu 22.x

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
git clone https://github.com/unkbot/chatwoot-codechat
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

### Iniciar aplicação com o PM2

Instale o PM2 e inicie o backend com ele:

```bash
sudo npm install -g pm2
pm2 start dist/app.js --name chatwoot-codechat
```

### Proxy e configuração do Nginx

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

No seu codechat, altere a URL de webhook GLOBAL no seu env.yml para o webhook da aplicação e ative-o definindo `ENABLED` como `true`:

```bash
# Webhook Settings
WEBHOOK:
  # Define a global webhook that will listen for enabled events from all instances
  GLOBAL:
    URL: http://0.0.0.0:1234/webhook/codechat
    ENABLED: true
```

A URL deve ser `http://0.0.0.0:1234/webhook/codechat` caso você esteja fazendo o deploy localmente, caso contrário utilize o seu domínio configurado no nginx.

## Manual do Bot

Para inicar a conexão com WhatsApp você deve criar uma nova Caixa de Entrada em seu ChatWoot definindo um nome e a URL, caso o seu chatwoot esteja na mesma máquina em que fizeste o deployment da aplicação a URL deve ser `http://localhost:1234/webhook/chatwoot` caso contrário coloque o seu domínio configurado no nginx.

Após a criação da caixa de entrada crie também um novo contato, este contato será usado como interface de gerenciamento de suas instâncias, nele onde você conseguirá usar os comandos disponíveis. 

#### Contato do Bot: +123456

Para utilizar, após criar o contato selecione-o e envie uma mensagem utilizando a Caixa de Entrada criada anteriormente.

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

Para configurar o Nginx, siga as instruções de deployment mencionadas anteriormente.
