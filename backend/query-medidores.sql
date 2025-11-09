-- Query para listar todos os medidores com ID, IP e Nome
-- Execute esta query diretamente no banco de dados PostgreSQL

SELECT 
    "meterId" as id,
    "ipAddress" as ip,
    name as nome,
    location as localizacao,
    status,
    "userId",
    "createdAt",
    "updatedAt"
FROM "Device"
ORDER BY "meterId" ASC;

-- Versão simplificada (apenas ID, IP e Nome)
-- SELECT 
--     "meterId" as id,
--     "ipAddress" as ip,
--     name as nome
-- FROM "Device"
-- ORDER BY "meterId" ASC;

