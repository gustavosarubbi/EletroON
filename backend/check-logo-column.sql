-- Verificar se existe coluna logo em alguma tabela
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name ILIKE '%logo%'
ORDER BY table_name, column_name;

