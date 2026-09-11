CREATE OR REPLACE FUNCTION public.search_knowledge(search_query text)
 RETURNS TABLE(chunk_id uuid, source_id uuid, source_title text, organization text, source_type text, source_url text, domain text, section text, chunk_title text, authority_level text, source_version text, effective_date date, content text, rank integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

  WITH query_words AS (
    SELECT DISTINCT lower(word) AS word
    FROM regexp_split_to_table(search_query, '\s+') AS word
    WHERE length(word) >= 3
      AND lower(word) NOT IN (
        'the',
        'and',
        'for',
        'what',
        'when',
        'where',
        'does',
        'are',
        'how',
        'why',
        'can',
        'this',
        'that',
        'with',
        'from',
        'into',
        'become',
        'have',
        'has',
        'had',
        'under',
        'would',
        'should',
        'could',
        'about'
      )
  ),

  scored AS (
    SELECT
      kc.id AS chunk_id,
      ks.id AS source_id,
      ks.title AS source_title,
      ks.organization,
      ks.source_type,
      ks.url AS source_url,
      ks.domain,
      kc.section,
      kc.title AS chunk_title,
      kc.authority_level,
      kc.source_version,
      kc.effective_date,
      kc.content,

      (
        SELECT COUNT(*)
        FROM query_words qw
        WHERE
          lower(kc.content) LIKE '%' || qw.word || '%'
          OR lower(COALESCE(kc.title, '')) LIKE '%' || qw.word || '%'
          OR lower(COALESCE(kc.section, '')) LIKE '%' || qw.word || '%'
          OR lower(COALESCE(ks.title, '')) LIKE '%' || qw.word || '%'
          OR lower(COALESCE(ks.organization, '')) LIKE '%' || qw.word || '%'
      )::integer AS rank

    FROM public.knowledge_chunks kc

    JOIN public.knowledge_sources ks
      ON kc.source_id = ks.id

    WHERE COALESCE(ks.status, 'current') = 'current'
  )

  SELECT
    chunk_id,
    source_id,
    source_title,
    organization,
    source_type,
    source_url,
    domain,
    section,
    chunk_title,
    authority_level,
    source_version,
    effective_date,
    content,
    rank

  FROM scored

  WHERE rank > 0

  ORDER BY
    rank DESC,
    CASE
      WHEN lower(COALESCE(authority_level, '')) = 'authoritative'
        THEN 0
      ELSE 1
    END,
    chunk_title ASC

  LIMIT 12;

$function$
