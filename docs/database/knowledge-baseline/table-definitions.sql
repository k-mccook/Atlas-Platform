-- REFERENCE ONLY: reconstructed from verified catalogs on 2026-09-10.
-- NOT executed, NOT a migration, NOT original authored DDL or a complete restore.
-- Indexes, RLS, grants, and internal triggers are in catalog.json.
-- No identity/generated columns, user triggers, rules, or inheritance were found.
-- All text columns use the database default collation.

CREATE TABLE public.knowledge_sources (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  organization text NOT NULL,
  source_type text NOT NULL,
  url text,
  description text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  version text,
  effective_date date,
  last_verified_at timestamp with time zone,
  chapter text,
  topic text,
  publication_date date,
  status text DEFAULT 'current'::text,
  domain text,
  CONSTRAINT knowledge_sources_pkey PRIMARY KEY (id)
);

CREATE TABLE public.knowledge_chunks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  source_id uuid NOT NULL,
  title text,
  content text NOT NULL,
  section text,
  page_number integer,
  chunk_number integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  source_version text,
  effective_date date,
  authority_level text,
  CONSTRAINT knowledge_chunks_pkey PRIMARY KEY (id),
  CONSTRAINT knowledge_chunks_source_id_fkey FOREIGN KEY (source_id)
    REFERENCES public.knowledge_sources(id) ON DELETE CASCADE
);
