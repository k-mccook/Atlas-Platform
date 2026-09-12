-- PROPOSAL ONLY — NOT EXECUTED. Separate security approval required.
-- Restore Stage 2 user-token access before switching the application adapter back.
-- Never restore PUBLIC/anon RPC access or Stage 1 destructive table privileges.
GRANT EXECUTE ON FUNCTION public.search_knowledge(text) TO authenticated;
GRANT SELECT ON TABLE public.knowledge_sources, public.knowledge_chunks
  TO anon, authenticated;

-- After application rollback and draining backend connections:
REVOKE EXECUTE ON FUNCTION public.search_knowledge(text)
  FROM atlas_research_gateway RESTRICT;
REVOKE USAGE ON SCHEMA public FROM atlas_research_gateway RESTRICT;
REVOKE CONNECT ON DATABASE postgres FROM atlas_research_gateway RESTRICT;
ALTER ROLE atlas_research_gateway NOLOGIN;
-- NOLOGIN does not terminate existing sessions; drain via the approved deployment
-- procedure. Role removal/credential disposal would require separate approval.
