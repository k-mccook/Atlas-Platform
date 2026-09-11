-- Repeat-inspection worksheet: SELECT-only, requires approved catalog access.
-- Equivalent queries were run in the signed-in SQL editor on 2026-09-10,
-- grouped into JSON results. This worksheet was not executed as a script.
-- This is an inspection worksheet, NOT a migration or a restore script.
-- Run only in a read-only database session. Review output before repository use:
-- function bodies, defaults and policy expressions can contain sensitive literals.
-- Do not export auth/user/assignment records or connection configuration.

-- Exact search function definition (all overloads); language and security mode.
SELECT p.oid::regprocedure::text AS signature,
       l.lanname AS language,
       p.prosecdef AS security_definer,
       p.provolatile AS volatility,
       p.proconfig AS function_settings,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public' AND p.proname = 'search_knowledge';

-- Columns/defaults and RLS flags: enough to describe columns, not full CREATE TABLE DDL.
SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relkind, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
       a.attnum AS ordinal, a.attname AS column_name,
       format_type(a.atttypid, a.atttypmod) AS data_type,
       a.attnotnull AS not_null, a.attidentity AS identity_kind,
       a.attgenerated AS generated_kind,
       pg_get_expr(d.adbin, d.adrelid) AS default_or_generation_expression
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
WHERE n.nspname = 'public' AND c.relname IN ('knowledge_sources', 'knowledge_chunks')
ORDER BY c.relname, a.attnum;

-- Constraints, including foreign keys; referenced names are definitions, not data.
SELECT c.relname AS table_name, k.conname, k.contype,
       pg_get_constraintdef(k.oid, true) AS definition
FROM pg_constraint k
JOIN pg_class c ON c.oid = k.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('knowledge_sources', 'knowledge_chunks');

-- Index definitions include expression-based full-text indexes if present.
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename IN ('knowledge_sources', 'knowledge_chunks');

-- Non-internal triggers and their exact function definitions.
SELECT c.relname AS table_name, t.tgname, t.tgenabled,
       pg_get_triggerdef(t.oid, true) AS trigger_definition,
       t.tgfoid::regprocedure::text AS function_signature,
       pg_get_functiondef(t.tgfoid) AS function_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('knowledge_sources', 'knowledge_chunks')
  AND NOT t.tgisinternal;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('knowledge_sources', 'knowledge_chunks');

-- Effective EXECUTE privileges for API roles; not a complete grant history.
SELECT p.oid::regprocedure::text AS signature, r.rolname,
       has_function_privilege(r.oid, p.oid, 'EXECUTE') AS can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN pg_roles r
WHERE n.nspname = 'public' AND p.proname = 'search_knowledge'
  AND r.rolname IN ('anon', 'authenticated', 'service_role');

-- Explicit/default function ACL, including PUBLIC (grantee 0).
SELECT p.oid::regprocedure::text AS signature,
       CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS grantee,
       a.privilege_type, a.is_grantable
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
WHERE n.nspname = 'public' AND p.proname = 'search_knowledge';

SELECT c.relname AS table_name,
       CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS grantee,
       a.privilege_type, a.is_grantable
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
WHERE n.nspname = 'public' AND c.relname IN ('knowledge_sources', 'knowledge_chunks');

-- Additional inspected facts; these queries remain SELECT-only.
SELECT current_setting('server_version') AS server_version,
       current_setting('default_text_search_config') AS default_text_search_config;

SELECT c.relname, pg_get_userbyid(c.relowner) AS owner, c.relkind,
       c.relpersistence, c.reloptions
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('knowledge_sources', 'knowledge_chunks');

SELECT p.oid::regprocedure::text AS signature, pg_get_userbyid(p.proowner) AS owner,
       p.proparallel, p.proisstrict, p.proleakproof
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'search_knowledge';

SELECT r.rolname, r.rolsuper, r.rolbypassrls,
       has_schema_privilege(r.oid, 'public', 'USAGE') AS schema_usage,
       has_schema_privilege(r.oid, 'public', 'CREATE') AS schema_create,
       has_function_privilege(r.oid, 'public.search_knowledge(text)', 'EXECUTE') AS execute_search,
       has_table_privilege(r.oid, 'public.knowledge_sources', 'SELECT') AS select_sources,
       has_table_privilege(r.oid, 'public.knowledge_chunks', 'SELECT') AS select_chunks
FROM pg_roles r
WHERE r.rolname IN ('anon', 'authenticated', 'service_role', 'postgres');

SELECT c.relname, a.attname, a.attacl
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
WHERE n.nspname = 'public' AND c.relname IN ('knowledge_sources', 'knowledge_chunks')
  AND a.attacl IS NOT NULL;

SELECT CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS grantee,
       a.privilege_type, a.is_grantable
FROM pg_namespace n
CROSS JOIN LATERAL aclexplode(COALESCE(n.nspacl, acldefault('n', n.nspowner))) a
WHERE n.nspname = 'public';

SELECT c.relname AS table_name, t.tgname, t.tgenabled,
       pg_get_triggerdef(t.oid, true) AS definition,
       t.tgfoid::regprocedure::text AS function_signature
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('knowledge_sources', 'knowledge_chunks')
  AND t.tgisinternal;

SELECT n.nspname AS configuration_schema, cfg.cfgname,
       pn.nspname || '.' || prs.prsname AS parser,
       dn.nspname || '.' || d.dictname AS dictionary
FROM pg_ts_config cfg JOIN pg_namespace n ON n.oid = cfg.cfgnamespace
JOIN pg_ts_parser prs ON prs.oid = cfg.cfgparser
JOIN pg_namespace pn ON pn.oid = prs.prsnamespace
JOIN pg_ts_config_map m ON m.mapcfg = cfg.oid
JOIN pg_ts_dict d ON d.oid = m.mapdict
JOIN pg_namespace dn ON dn.oid = d.dictnamespace
WHERE n.nspname = 'pg_catalog' AND cfg.cfgname = 'english';

SELECT c.relname, r.rulename, pg_get_ruledef(r.oid, true) AS definition
FROM pg_rewrite r JOIN pg_class c ON c.oid = r.ev_class
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('knowledge_sources', 'knowledge_chunks');

SELECT i.inhrelid::regclass::text AS child, i.inhparent::regclass::text AS parent
FROM pg_inherits i
WHERE i.inhrelid IN ('public.knowledge_sources'::regclass, 'public.knowledge_chunks'::regclass);

SELECT d.deptype, pg_describe_object(d.refclassid, d.refobjid, d.refobjsubid) AS referenced_object
FROM pg_depend d
WHERE d.classid = 'pg_proc'::regclass AND d.objid = 'public.search_knowledge(text)'::regprocedure;
-- SQL-string/PLpgSQL dependencies in function text may not appear in pg_depend.
-- Full role membership, migration history and unrelated objects remain out of scope.
