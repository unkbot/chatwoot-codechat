install:
	npm install

dev: install	
	npm run dev

build: install
	npm run build

start: build
	npm run start

up:
	docker compose up -d --build

up-proxy:
	docker compose -f docker-compose.yml -f docker-compose.proxy.yml up -d --build

logs:
	docker compose logs -f --tail 100 api