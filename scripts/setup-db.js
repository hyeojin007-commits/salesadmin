const { createClient } = require("@libsql/client");

async function setup() {
  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  const statements = [
    'CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "name" TEXT NOT NULL, "password" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT \'DEALER\', "company" TEXT, "phone" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)',
    'CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")',
    'CREATE TABLE IF NOT EXISTS "Product" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "description" TEXT, "unitPrice" REAL NOT NULL, "unit" TEXT NOT NULL DEFAULT \'EA\', "category" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)',
    'CREATE TABLE IF NOT EXISTS "Order" ("id" TEXT NOT NULL PRIMARY KEY, "orderNumber" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT \'PENDING\', "requesterId" TEXT NOT NULL, "processedById" TEXT, "note" TEXT, "totalAmount" REAL NOT NULL DEFAULT 0, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE, FOREIGN KEY ("processedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE)',
    'CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber")',
    'CREATE TABLE IF NOT EXISTS "OrderItem" ("id" TEXT NOT NULL PRIMARY KEY, "orderId" TEXT NOT NULL, "productId" TEXT NOT NULL, "quantity" INTEGER NOT NULL, "unitPrice" REAL NOT NULL, "amount" REAL NOT NULL, FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)',
    'CREATE TABLE IF NOT EXISTS "Quote" ("id" TEXT NOT NULL PRIMARY KEY, "quoteNumber" TEXT NOT NULL, "orderId" TEXT NOT NULL, "issuedById" TEXT NOT NULL, "totalAmount" REAL NOT NULL, "tax" REAL NOT NULL DEFAULT 0, "grandTotal" REAL NOT NULL, "validUntil" DATETIME NOT NULL, "note" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE, FOREIGN KEY ("issuedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)',
    'CREATE UNIQUE INDEX IF NOT EXISTS "Quote_quoteNumber_key" ON "Quote"("quoteNumber")',
    'CREATE UNIQUE INDEX IF NOT EXISTS "Quote_orderId_key" ON "Quote"("orderId")',
  ];

  for (const s of statements) {
    await client.execute(s);
  }
  console.log("Database tables created successfully!");
}

setup().catch((e) => {
  console.error("DB setup failed:", e);
  process.exit(1);
});
