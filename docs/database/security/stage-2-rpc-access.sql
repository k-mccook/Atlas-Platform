-- Executed with explicit user approval on 2026-09-11; retained as an audit record.
-- Not automatically executed by the application or tests.
REVOKE EXECUTE
ON FUNCTION public.search_knowledge(text)
FROM PUBLIC, anon
RESTRICT;
