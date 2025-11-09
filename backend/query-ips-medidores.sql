-- Query SQL para verificar IPs dos medidores 34 e 438692
-- Execute esta query diretamente no banco de dados PostgreSQL

-- Verificar informações dos medidores
SELECT 
    "meterId" as id,
    name as nome,
    "ipAddress" as ip,
    status,
    location as localizacao,
    "createdAt" as criado_em,
    "updatedAt" as atualizado_em,
    "userId" as usuario_id
FROM "Device"
WHERE "meterId" IN (34, 438692)
ORDER BY "meterId" ASC;

-- Verificar leituras mais recentes desses medidores
SELECT 
    r.id,
    r."meterId",
    r.timestamp,
    r."createdAt",
    d.name,
    d."ipAddress"
FROM "Reading" r
INNER JOIN "Device" d ON r."meterId" = d."meterId"
WHERE r."meterId" IN (34, 438692)
ORDER BY r.timestamp DESC
LIMIT 10;

-- Verificar se há algum padrão nos IPs dos outros medidores
-- (para comparação)
SELECT 
    "meterId",
    "ipAddress",
    name,
    "updatedAt"
FROM "Device"
WHERE "ipAddress" IS NOT NULL
ORDER BY "meterId" ASC;

-- Contar quantos medidores têm IP e quantos não têm
SELECT 
    COUNT(*) FILTER (WHERE "ipAddress" IS NOT NULL) as com_ip,
    COUNT(*) FILTER (WHERE "ipAddress" IS NULL) as sem_ip,
    COUNT(*) as total
FROM "Device";

