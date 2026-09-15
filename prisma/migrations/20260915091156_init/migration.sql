-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "company" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trackingNumber" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "carrier" TEXT,
    "service" TEXT,
    "pieces" INTEGER NOT NULL DEFAULT 0,
    "weight" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "eta" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shipment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShipmentEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shipmentId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_trackingNumber_key" ON "Shipment"("trackingNumber");
