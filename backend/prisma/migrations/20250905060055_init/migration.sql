-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "meterId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("meterId")
);

-- CreateTable
CREATE TABLE "Reading" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "pa" DOUBLE PRECISION NOT NULL,
    "pb" DOUBLE PRECISION NOT NULL,
    "pc" DOUBLE PRECISION NOT NULL,
    "pt" DOUBLE PRECISION NOT NULL,
    "qa" DOUBLE PRECISION NOT NULL,
    "qb" DOUBLE PRECISION NOT NULL,
    "qc" DOUBLE PRECISION NOT NULL,
    "qt" DOUBLE PRECISION NOT NULL,
    "epa_c" DOUBLE PRECISION NOT NULL,
    "epb_c" DOUBLE PRECISION NOT NULL,
    "epc_c" DOUBLE PRECISION NOT NULL,
    "ept_c" DOUBLE PRECISION NOT NULL,
    "epa_g" DOUBLE PRECISION NOT NULL,
    "epb_g" DOUBLE PRECISION NOT NULL,
    "epc_g" DOUBLE PRECISION NOT NULL,
    "ept_g" DOUBLE PRECISION NOT NULL,
    "iarms" DOUBLE PRECISION NOT NULL,
    "ibrms" DOUBLE PRECISION NOT NULL,
    "icrms" DOUBLE PRECISION NOT NULL,
    "uarms" DOUBLE PRECISION NOT NULL,
    "ubrms" DOUBLE PRECISION NOT NULL,
    "ucrms" DOUBLE PRECISION NOT NULL,
    "pfa" DOUBLE PRECISION NOT NULL,
    "pfb" DOUBLE PRECISION NOT NULL,
    "pfc" DOUBLE PRECISION NOT NULL,
    "pft" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meterId" INTEGER NOT NULL,

    CONSTRAINT "Reading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Reading_meterId_timestamp_idx" ON "Reading"("meterId", "timestamp");

-- CreateIndex
CREATE INDEX "Reading_timestamp_idx" ON "Reading"("timestamp");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reading" ADD CONSTRAINT "Reading_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Device"("meterId") ON DELETE CASCADE ON UPDATE CASCADE;
