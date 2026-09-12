-- PROPOSAL ONLY — NOT EXECUTED. Requires separate explicit approval.
-- Precondition: confirm role does not exist, actual database name is postgres,
-- and audit effective PUBLIC grants/other exposed knowledge-reading functions.
-- Do not put a password in this file. Credential provisioning is a separate
-- approved administrative operation using a secure mechanism.

-- Phase 1: provision limited backend identity; no browser access changes yet.
CREATE ROLE atlas_research_gateway LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
  NOINHERIT NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 5;
GRANT CONNECT ON DATABASE postgres TO atlas_research_gateway;
GRANT USAGE ON SCHEMA public TO atlas_research_gateway;
GRANT EXECUTE ON FUNCTION public.search_knowledge(text)
  TO atlas_research_gateway;
ALTER ROLE atlas_research_gateway SET statement_timeout = '10s';
ALTER ROLE atlas_research_gateway SET lock_timeout = '2s';
ALTER ROLE atlas_research_gateway SET idle_in_transaction_session_timeout = '10s';

-- Phase 2 ONLY after backend adapter is deployed and validated with this role.
REVOKE EXECUTE ON FUNCTION public.search_knowledge(text)
  FROM PUBLIC, anon, authenticated RESTRICT;
REVOKE SELECT ON TABLE public.knowledge_sources, public.knowledge_chunks
  FROM PUBLIC, anon, authenticated RESTRICT;

-- No table contents, policies, function body, ownership or security mode change.
-- Existing postgres and service_role permissions remain unchanged.
