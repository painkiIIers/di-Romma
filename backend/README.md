# Di Romma API

1. Kopiraj `.env.example` u `.env` i unesi PostgreSQL pristup, nasumičan `JWT_SECRET` i admin podatke.
2. Pokreni PostgreSQL komandom `docker compose up -d` (ili koristi postojeću bazu).
3. Pokreni `npm install`.
4. Primeni već pripremljenu migraciju komandom `npx prisma migrate deploy`.
5. Kreiraj admina i uvezi postojeći meni komandom `npm run prisma:seed`.
6. Pokreni razvojni server sa `npm run dev`.

Ne postoji ruta za registraciju. Ponovno pokretanje seed komande menja admin lozinku. Javna ruta je `GET /api/menu`; admin CRUD je na `/api/admin/menu`, uz `/api/auth/login`, `/logout` i `/me`. `DELETE` sakriva proizvod umesto trajnog brisanja.

Admin interfejs se tokom lokalnog razvoja otvara na `http://localhost:5500/frontend/admin.html` (ako je ceo projekat otvoren preko Live Server-a). Javni `meni.html` prvo čita `http://localhost:3000/api/menu`; ako API nije pokrenut, koristi `frontend/data/menu.json` kao rezervni izvor.

Admin nema javni link u navigaciji sajta. Prijava koristi email i lozinku iz `.env` fajla, a sesija se čuva u `httpOnly` kolačiću koji JavaScript ne može da pročita. Dugme „Obriši proizvod” radi bezbedno soft brisanje: proizvod nestaje sa javnog menija, ali se iz admin panela može vratiti.

Na Windows računaru sve korake možeš odraditi i komandom `./setup.ps1`. Ako `.env` ne postoji, skripta će ga napraviti i stati da prvo promeniš tajne vrednosti.

U Linuxu ili WSL-u koristi `bash setup.sh`. Docker Desktop mora imati uključenu WSL integraciju, a Node/npm moraju biti instalirani i unutar WSL distribucije.
