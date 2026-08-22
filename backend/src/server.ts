import { app } from "./app";
import { config } from "./config";
import { prisma } from "./lib/prisma";

const server = app.listen(config.PORT, () => console.log(`API je pokrenut na http://localhost:${config.PORT}`));
async function shutdown() { server.close(async () => { await prisma.$disconnect(); process.exit(0); }); }
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
