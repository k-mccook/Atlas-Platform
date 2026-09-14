-- UNEXECUTED PROPOSAL. Requires explicit approval. Never invoked by app/tests.
-- Rollback of Phase 2 only; retains all inserted publisher records for review.
-- Abort on any content/metadata drift. Retain the staged rows; no records are deleted.
BEGIN;
LOCK TABLE public.knowledge_sources, public.knowledge_chunks IN SHARE ROW EXCLUSIVE MODE;
DO $guard$ BEGIN
IF (SELECT count(*) FROM public.knowledge_sources WHERE id IN ('6ebe6a6a-393a-4313-90c6-9ef0b922f9e5', '2676cf5e-216f-4642-a584-e0fac610b4a6') AND status = 'superseded') <> 2 THEN RAISE EXCEPTION 'Legacy source state changed'; END IF;
IF (SELECT count(*) FROM public.knowledge_chunks WHERE source_id IN ('6ebe6a6a-393a-4313-90c6-9ef0b922f9e5', '2676cf5e-216f-4642-a584-e0fac610b4a6')) <> 7 THEN RAISE EXCEPTION 'Legacy inventory changed'; END IF;
IF EXISTS (SELECT 1 FROM jsonb_to_recordset($atlas_review$[
  {
    "chunk_id": "58399be5-629d-4fb3-bc76-d70bd347e357",
    "source_id": "6ebe6a6a-393a-4313-90c6-9ef0b922f9e5",
    "md5_lf": "92d596eef98a34d2978eabb6401992d0",
    "authority_level": "derived"
  },
  {
    "chunk_id": "8f4ec5eb-8aaf-431b-ba30-213229d11764",
    "source_id": "6ebe6a6a-393a-4313-90c6-9ef0b922f9e5",
    "md5_lf": "b0ac075d329ea0f88adb3e6eb3d9dedf",
    "authority_level": "derived"
  },
  {
    "chunk_id": "184bc948-46f7-4c35-ab05-0901b30f2b37",
    "source_id": "6ebe6a6a-393a-4313-90c6-9ef0b922f9e5",
    "md5_lf": "389078efcf953df65793f5f86acb0d8d",
    "authority_level": "derived"
  },
  {
    "chunk_id": "68a33188-648b-41e9-9d58-3ad6b154c051",
    "source_id": "2676cf5e-216f-4642-a584-e0fac610b4a6",
    "md5_lf": "3804be62dd9b0d3f6e339f6672ef64f9",
    "authority_level": "authoritative"
  },
  {
    "chunk_id": "b576c04e-4a81-4a72-89ea-72f364c01c1d",
    "source_id": "2676cf5e-216f-4642-a584-e0fac610b4a6",
    "md5_lf": "c0c7ad0e7023cfa245cdb2b3ed3f826b",
    "authority_level": "derived"
  },
  {
    "chunk_id": "d6e61b42-b75f-4f61-9790-b7c1d7ced295",
    "source_id": "2676cf5e-216f-4642-a584-e0fac610b4a6",
    "md5_lf": "c15254978dd70800efa567d2424d0bbc",
    "authority_level": "derived"
  },
  {
    "chunk_id": "1a9b3bf8-65b5-44da-abdb-6a5c73e5d7a8",
    "source_id": "2676cf5e-216f-4642-a584-e0fac610b4a6",
    "md5_lf": "e85407289da7a7156abcaaaae97ed3e2",
    "authority_level": "derived"
  }
]$atlas_review$::jsonb) AS expected(chunk_id uuid, source_id uuid, md5_lf text, authority_level text)
LEFT JOIN public.knowledge_chunks c ON c.id = expected.chunk_id
WHERE c.id IS NULL OR c.source_id <> expected.source_id OR md5(replace(c.content, E'\r\n', E'\n')) <> expected.md5_lf OR c.authority_level IS DISTINCT FROM expected.authority_level)
THEN RAISE EXCEPTION 'Legacy content or labels changed'; END IF;
IF EXISTS (SELECT 1 FROM jsonb_to_recordset($atlas_review$[
  {
    "id": "d8d4135c-ebb0-a85a-e945-57fecad637fb",
    "title": "B4-1.3-03, Neighborhood Section of the Appraisal Report (06/04/2025)",
    "organization": "Fannie Mae",
    "source_type": "FANNIE_MAE",
    "url": "https://selling-guide.fanniemae.com/sel/b4-1.3-03/neighborhood-section-appraisal-report",
    "description": "{\"material_type\":\"publisher_capture\",\"section_revision_date\":\"2025-06-04\",\"html_sha256\":\"5cf84530169649168710dd41cbf591a01dc0f49886361ecc33a8289ff14bc855\",\"capture\":\"docs/research/milestone-3/publisher-capture.json\",\"effective_date_verified\":false,\"subsections\":[{\"chunk_id\":\"9986af6d-fa90-7f8d-ad7c-06d048b31894\",\"heading\":\"Overview\",\"ordinal\":1,\"content_sha256\":\"b82245f265b1ce53e9467d32a28dccfe169c5b82356709b5346d9b7a613ac87c\"},{\"chunk_id\":\"6f55af76-090a-6cac-bed8-5101eb19ddd9\",\"heading\":\"Neighborhood Analysis\",\"ordinal\":2,\"content_sha256\":\"b71581ec6b812ec043ef6094329906be30bfcd88bc4dfce14ce39399b5c9c56e\"},{\"chunk_id\":\"b56986ff-9a72-74d2-0277-656183b4c757\",\"heading\":\"Degree of Development and Growth Rate\",\"ordinal\":3,\"content_sha256\":\"0aa308b949a7a8141961f4c62c66b0af1a4293dff42bd11d8e86db4dc6dd5d1b\"},{\"chunk_id\":\"322ed6ea-a62c-4f12-6ab0-8d6748b51d48\",\"heading\":\"Trend of Neighborhood Property Values, Demand/Supply, and Marketing Time\",\"ordinal\":4,\"content_sha256\":\"846eee5cbba5efc34a4a389434e5b01b047f448ba7b63d67cc9c05a180a37597\"},{\"chunk_id\":\"d9b91870-5813-3090-a8bf-a71032a6c938\",\"heading\":\"Price Range and Predominant Price\",\"ordinal\":5,\"content_sha256\":\"fb0e70894244d480f3684e47dabf4ca3c6e8d5fbcea96e00074322dce7412141\"},{\"chunk_id\":\"5a4683af-211e-f11e-c4e2-a590def4590f\",\"heading\":\"Over-Improvements\",\"ordinal\":6,\"content_sha256\":\"e4c6b983e633d459c7c8718921caa8d0e2665fc56e32fd5ace034cd862bd2c40\"},{\"chunk_id\":\"ff3fc974-2afe-4300-ad0c-a1eb3cc1c915\",\"heading\":\"Age Range and Predominant Age\",\"ordinal\":7,\"content_sha256\":\"e49d45417473eb6c6e6d5ea5812d65052859646715ed2523802240fc02d7faac\"},{\"chunk_id\":\"9458d699-875e-1b5f-290a-c5be10b85f59\",\"heading\":\"Present Land Use\",\"ordinal\":8,\"content_sha256\":\"d13454fccb1f59c7654a3b51547a2aec10fb86ce48cad339952c86c1466910f1\"},{\"chunk_id\":\"48cd619f-7ac4-f8e6-3726-cfb22a70d8c3\",\"heading\":\"Uniform Appraisal Dataset (UAD) 3.6 Policy\",\"ordinal\":9,\"content_sha256\":\"3d363b3e42b55e1b22f55e6bf2fefb8cad99e49554d2e94fe5b699dc01d9cdeb\"}]}",
    "version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "effective_date": null,
    "last_verified_at": "2026-09-12T15:42:54.476Z",
    "chapter": "B4-1.3",
    "topic": "B4-1.3-03",
    "publication_date": null,
    "status": "current",
    "domain": "selling-guide.fanniemae.com"
  },
  {
    "id": "c9342f90-4955-0f31-d4e8-7e6e9c19d03e",
    "title": "B4-1.3-04, Site Section of the Appraisal Report (06/04/2025)",
    "organization": "Fannie Mae",
    "source_type": "FANNIE_MAE",
    "url": "https://selling-guide.fanniemae.com/sel/b4-1.3-04/site-section-appraisal-report",
    "description": "{\"material_type\":\"publisher_capture\",\"section_revision_date\":\"2025-06-04\",\"html_sha256\":\"08c8d2ebf7bbc82d5ec9203a5ae30d6eb446e46216292f354e29aa5f5734b707\",\"capture\":\"docs/research/milestone-3/publisher-capture.json\",\"effective_date_verified\":false,\"subsections\":[{\"chunk_id\":\"c9d16227-69e6-c45f-9d21-72853dee03da\",\"heading\":\"Overview\",\"ordinal\":1,\"content_sha256\":\"faca7f5bec8211f50dcc94c33099f342bcd5eaad48d4251c041f7712ca417040\"},{\"chunk_id\":\"29b3c882-c0bf-e9b1-fd1c-800f8f5e711e\",\"heading\":\"Site Analysis\",\"ordinal\":2,\"content_sha256\":\"b9ed4aec512c83eeb6829fc8d497b8930ac0881ec836f83d90290eb4fbde67d4\"},{\"chunk_id\":\"fe3309ad-85ba-f81e-67e0-07b4a98a1f55\",\"heading\":\"Subject Property Zoning\",\"ordinal\":3,\"content_sha256\":\"92098a2478e10f8413866a21318cc9573c531ad0ca86b7f6e710eaa8292bc97b\"},{\"chunk_id\":\"680cd93f-c151-555a-f364-9e48246562bf\",\"heading\":\"Highest and Best Use\",\"ordinal\":4,\"content_sha256\":\"451bc51034a7707f199e7c2385e31b741acb4d1d88c08e1c7cb3fcd682d24b76\"},{\"chunk_id\":\"6cc70f68-7cf2-4816-a5a6-4337a16fd5ff\",\"heading\":\"Adjoining Properties\",\"ordinal\":5,\"content_sha256\":\"d1d5eab57dd8ac7d3191513f0051308555cd12d399aa06a5c663e7bd3fdd9ab1\"},{\"chunk_id\":\"ebca6ace-1326-d713-1eb4-8bced4a8ec0d\",\"heading\":\"Site Utilities\",\"ordinal\":6,\"content_sha256\":\"6b173f63cc86d6aa47f39d3e51c40909af0f3f1136508fcd09a804c043ef9246\"},{\"chunk_id\":\"2bd00768-875e-fc12-394e-663a4061d3dd\",\"heading\":\"Off-Site Improvements\",\"ordinal\":7,\"content_sha256\":\"b555ab8128049905b2b5cbf5e4b5fc03f38eae2b3c9bfbd48c08e8f12ff9a16c\"},{\"chunk_id\":\"ddb9e27c-d5e5-9e81-77a5-f3f183bf1d1d\",\"heading\":\"Community-Owned or Privately Maintained Streets\",\"ordinal\":8,\"content_sha256\":\"9840298e156c83ff0f3884402c0aadf2e014297b4f3b059a173b5fdec27a7f4b\"},{\"chunk_id\":\"ce1e0a6e-0fcf-851a-2ae2-e4a95f0e47f6\",\"heading\":\"Special Flood Hazard Areas\",\"ordinal\":9,\"content_sha256\":\"61254031ab81a79f119099ed394365ce3b356422ae4b4b462f6ad5a22a7410a5\"},{\"chunk_id\":\"ae433b4f-bed5-7389-8e39-2cfa6ac83c31\",\"heading\":\"Uniform Appraisal Dataset (UAD) 3.6 Policy\",\"ordinal\":10,\"content_sha256\":\"3d363b3e42b55e1b22f55e6bf2fefb8cad99e49554d2e94fe5b699dc01d9cdeb\"}]}",
    "version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "effective_date": null,
    "last_verified_at": "2026-09-12T15:42:54.594Z",
    "chapter": "B4-1.3",
    "topic": "B4-1.3-04",
    "publication_date": null,
    "status": "current",
    "domain": "selling-guide.fanniemae.com"
  },
  {
    "id": "54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea",
    "title": "B4-1.3-05, Improvements Section of the Appraisal Report (06/04/2025)",
    "organization": "Fannie Mae",
    "source_type": "FANNIE_MAE",
    "url": "https://selling-guide.fanniemae.com/sel/b4-1.3-05/improvements-section-appraisal-report",
    "description": "{\"material_type\":\"publisher_capture\",\"section_revision_date\":\"2025-06-04\",\"html_sha256\":\"d9b2e3c8af7c8232d0772778ff1f8390e9c42b8b70479e1cead3405144c572f2\",\"capture\":\"docs/research/milestone-3/publisher-capture.json\",\"effective_date_verified\":false,\"subsections\":[{\"chunk_id\":\"fdecfe66-9873-30ca-7c75-102db62b6bff\",\"heading\":\"Overview\",\"ordinal\":1,\"content_sha256\":\"f58433feaa49b53914c88fc9499535fbc8db1ecc10079f824f02341935461959\"},{\"chunk_id\":\"19e0e797-d715-2ec8-766b-4ead2b036ddf\",\"heading\":\"Conformity of Improvements to Neighborhood\",\"ordinal\":2,\"content_sha256\":\"975d6d7b9bce2a4240e8c6c3ce59e6faf644882b25750bb422a528fcf74513d7\"},{\"chunk_id\":\"1f69874f-d3af-60a0-6c8a-2d5f52e60693\",\"heading\":\"Unique Housing Types\",\"ordinal\":3,\"content_sha256\":\"9dbc57d777b48ba4d9d4c3f0b434890c9452c5a7334065bd1941f5bde38b0ffc\"},{\"chunk_id\":\"14c3b346-b041-fc7e-fd59-7c7dba459958\",\"heading\":\"Actual and Effective Ages\",\"ordinal\":4,\"content_sha256\":\"21b3a6689141bd7e582bbb22bfefb6ddd6083b8351ac778cc46bdc31f99e2ce8\"},{\"chunk_id\":\"12c3187b-f610-75cf-dcdd-1623bd57e392\",\"heading\":\"Remaining Economic Life\",\"ordinal\":5,\"content_sha256\":\"4a32c02ae6cced293e4384efd848719a251fd77d85597786f442e2c1072bb64a\"},{\"chunk_id\":\"d6f5d82e-f109-9dd8-4562-a66873d26afa\",\"heading\":\"Energy Efficient Improvements\",\"ordinal\":6,\"content_sha256\":\"8d56ecfef9436cee9c9058ade5162688fce3b6e2faa4edc028d91bc3999eddbf\"},{\"chunk_id\":\"0c0d55ff-e34b-3f38-8cf8-4b513430958b\",\"heading\":\"Layout and Floor Plans\",\"ordinal\":7,\"content_sha256\":\"bed2460d1ca3c7cedf3758149776ee393c7ca81771936cd0711c9e33cbba2df7\"},{\"chunk_id\":\"08dbdc08-f970-1b3d-6c85-45a5e2bfcc22\",\"heading\":\"Above- and Below-Grade Area(s)\",\"ordinal\":8,\"content_sha256\":\"757f06af98e2fab85a70b594a9b036c142ab954c46de79cc1190f10587f1653f\"},{\"chunk_id\":\"95cfc08c-4c23-7638-d82a-ecd7a5c15e2a\",\"heading\":\"Gross Building Area\",\"ordinal\":9,\"content_sha256\":\"e4668520f6f6bd05723d48c057d6435f72b8ad865ae67af01a6482bdcef15aae\"},{\"chunk_id\":\"40c2ce58-5e84-ca13-935d-fb9698247d02\",\"heading\":\"Accessory Dwelling Units\",\"ordinal\":10,\"content_sha256\":\"5084ba5cbad37c2015ef112a2e7a5f764e05fbc5f77ff634b4db5262b11844ac\"},{\"chunk_id\":\"a55cd9ef-0752-7789-d3e2-9baf6a689c2f\",\"heading\":\"Additions without Permits\",\"ordinal\":11,\"content_sha256\":\"ff19ce7ac04a8e46609b4e6ca3bdea86c711b095d804ebd1f9aa34e71f71a806\"},{\"chunk_id\":\"601e46da-d20a-70f5-5ab9-6049e05856ef\",\"heading\":\"Properties with Outbuildings\",\"ordinal\":12,\"content_sha256\":\"0278d3fae2c75922ca75f75629ed451aaa6c9a8ea88c13f66382fa8011b23a4b\"},{\"chunk_id\":\"2ef6c2fb-180c-b15a-ce7f-d76a6c308b8d\",\"heading\":\"Uniform Appraisal Dataset (UAD) 3.6 Policy\",\"ordinal\":13,\"content_sha256\":\"3d363b3e42b55e1b22f55e6bf2fefb8cad99e49554d2e94fe5b699dc01d9cdeb\"}]}",
    "version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "effective_date": null,
    "last_verified_at": "2026-09-12T15:42:54.687Z",
    "chapter": "B4-1.3",
    "topic": "B4-1.3-05",
    "publication_date": null,
    "status": "current",
    "domain": "selling-guide.fanniemae.com"
  },
  {
    "id": "a0179c21-e82d-f250-698b-df393135b4e8",
    "title": "B4-1.3-06, Property Condition and Quality of Construction of the Improvements (06/04/2025)",
    "organization": "Fannie Mae",
    "source_type": "FANNIE_MAE",
    "url": "https://selling-guide.fanniemae.com/sel/b4-1.3-06/property-condition-and-quality-construction-improvements",
    "description": "{\"material_type\":\"publisher_capture\",\"section_revision_date\":\"2025-06-04\",\"html_sha256\":\"299d5f1eebcc5a99fd7a3ae49c68026abac14f2beafee8ba568d71fc9dc204dd\",\"capture\":\"docs/research/milestone-3/publisher-capture.json\",\"effective_date_verified\":false,\"subsections\":[{\"chunk_id\":\"f37cd0d9-3a74-b959-9583-cba6b154adff\",\"heading\":\"Appraiser Selection of Condition, Quality, and other Characteristic Ratings\",\"ordinal\":1,\"content_sha256\":\"1878c089088deec5291317c844116f48a64a59ead507cf087c64a3bcfa4923c9\"},{\"chunk_id\":\"61685c2c-7b05-b83f-a0e2-1cd75ff618d5\",\"heading\":\"Property Condition\",\"ordinal\":2,\"content_sha256\":\"041a890782a3fcbf7b088799decd46d1fbfa353dff13063179e461eb8f59b5aa\"},{\"chunk_id\":\"ae154540-d87f-64b2-4d3c-3a462d2a7403\",\"heading\":\"Property Condition Ratings\",\"ordinal\":3,\"content_sha256\":\"dc17442ac4bf6678c0444b64480df761e70095b6a6b9a3f31027a150e3601d60\"},{\"chunk_id\":\"fc8645ff-322f-a922-5131-61295e0ef983\",\"heading\":\"Identifying Property Condition\",\"ordinal\":4,\"content_sha256\":\"df2312b54febcf436ae6969f742dc0dc2bb2ac468e9bdae60a11b04bbbca91e0\"},{\"chunk_id\":\"560c181f-c7b7-738c-6307-357ddb15179f\",\"heading\":\"Definitions of Not Updated, Updated, and Remodeled\",\"ordinal\":5,\"content_sha256\":\"18854baf1d7b1be76b0d413b4de480420e377d60765572954897a34282fea91a\"},{\"chunk_id\":\"d0a65bf4-1e9b-52a2-3e9b-ebaf30cede40\",\"heading\":\"Appraisals Completed “As Is”\",\"ordinal\":6,\"content_sha256\":\"2337fa7f1beece88f07834daa4e12c53d1ef96ed6091057efcd4854835f27159\"},{\"chunk_id\":\"5b2699a2-883d-a825-7c10-a665f798a75b\",\"heading\":\"Quality of Construction Rating\",\"ordinal\":7,\"content_sha256\":\"c64640b14f54ebd3c16c51b0cfa04e3ee13e9c01aa5784b3969c6bd5f47ca24d\"},{\"chunk_id\":\"93f46d9e-b549-3ca6-f6f0-14d553b1254d\",\"heading\":\"Identifying Quality of Construction\",\"ordinal\":8,\"content_sha256\":\"36590e7b5a4da58dc78222b01954ccd8a19185c21add87556e6fbbce127986f4\"},{\"chunk_id\":\"fc03055c-5393-d480-5b0a-924fd8f14da0\",\"heading\":\"Physical Deficiencies That Affect Safety, Soundness, or Structural Integrity of the Subject Property\",\"ordinal\":9,\"content_sha256\":\"89a177a9defd6e5bfd27ca0ab94aa5a080ec827cadb101098ec168af11075b3d\"},{\"chunk_id\":\"057d2c33-5260-17be-68aa-50e5ea2556c6\",\"heading\":\"Infestation, Dampness, or Settlement\",\"ordinal\":10,\"content_sha256\":\"fccb4796bbb9d73676dd4bcbac593a7edae21e68c4576e5e0b52fa1092e0900b\"},{\"chunk_id\":\"bb184b24-5b11-d468-d786-8f6f9a770f3b\",\"heading\":\"Uniform Appraisal Dataset (UAD) 3.6 Policy\",\"ordinal\":11,\"content_sha256\":\"3d363b3e42b55e1b22f55e6bf2fefb8cad99e49554d2e94fe5b699dc01d9cdeb\"}]}",
    "version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "effective_date": null,
    "last_verified_at": "2026-09-12T15:42:54.790Z",
    "chapter": "B4-1.3",
    "topic": "B4-1.3-06",
    "publication_date": null,
    "status": "current",
    "domain": "selling-guide.fanniemae.com"
  },
  {
    "id": "7129b5e0-7066-50fa-1b60-10d84ac0cfc1",
    "title": "B4-1.3-07, Sales Comparison Approach Section of the Appraisal Report (06/04/2025)",
    "organization": "Fannie Mae",
    "source_type": "FANNIE_MAE",
    "url": "https://selling-guide.fanniemae.com/sel/b4-1.3-07/sales-comparison-approach-section-appraisal-report",
    "description": "{\"material_type\":\"publisher_capture\",\"section_revision_date\":\"2025-06-04\",\"html_sha256\":\"d7732de5950878646fb9abc21565f9f327c0c4aeeb1113a1a51aed16207fadd1\",\"capture\":\"docs/research/milestone-3/publisher-capture.json\",\"effective_date_verified\":false,\"subsections\":[{\"chunk_id\":\"170a750b-2a1f-22c7-76d6-af9602e5728f\",\"heading\":\"Overview\",\"ordinal\":1,\"content_sha256\":\"bc29b04709a88417433d91d81763d263c22ad380937bccfdd5d60884630b367c\"},{\"chunk_id\":\"23d931ee-369b-1192-a78c-62ee6812acd2\",\"heading\":\"Data and Verification Sources of Comparable Sales\",\"ordinal\":2,\"content_sha256\":\"0bc580e78008d52e286586ae9d1e24a63e160786891f4a6d6b5e89d4c37f5819\"},{\"chunk_id\":\"ed0623ee-518a-cffe-47cb-193ca0e59f0f\",\"heading\":\"Prior Sales History of the Subject and Comparable Sales\",\"ordinal\":3,\"content_sha256\":\"3e673d96f01a9cb26bd9ce90ac88c7024f980794f6158220a707739e2af78108\"},{\"chunk_id\":\"1af40bc8-dfa1-b5ce-1ef1-e03adf1080a2\",\"heading\":\"Uniform Appraisal Dataset (UAD) 3.6 Policy\",\"ordinal\":4,\"content_sha256\":\"3d363b3e42b55e1b22f55e6bf2fefb8cad99e49554d2e94fe5b699dc01d9cdeb\"}]}",
    "version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "effective_date": null,
    "last_verified_at": "2026-09-12T15:42:54.964Z",
    "chapter": "B4-1.3",
    "topic": "B4-1.3-07",
    "publication_date": null,
    "status": "current",
    "domain": "selling-guide.fanniemae.com"
  },
  {
    "id": "d52fbd0f-5332-bd27-d80f-273617ef1ff5",
    "title": "B4-1.3-08, Comparable Sales (06/04/2025)",
    "organization": "Fannie Mae",
    "source_type": "FANNIE_MAE",
    "url": "https://selling-guide.fanniemae.com/sel/b4-1.3-08/comparable-sales",
    "description": "{\"material_type\":\"publisher_capture\",\"section_revision_date\":\"2025-06-04\",\"html_sha256\":\"e8a18f1393182f4b528214afa56e15ca2d4e2fa61f07119a41aafbc1ed07e521\",\"capture\":\"docs/research/milestone-3/publisher-capture.json\",\"effective_date_verified\":false,\"subsections\":[{\"chunk_id\":\"729d803e-192d-3bbd-980d-d75a16efb9a6\",\"heading\":\"Selection of Comparable Sales\",\"ordinal\":1,\"content_sha256\":\"a91482272a5550130fcec374fa819db798392acfe458146e05da2f7f2b509f01\"},{\"chunk_id\":\"c60d8535-a617-3c1c-70be-3f0a5f3a2b23\",\"heading\":\"Minimum Number of Comparable Sales\",\"ordinal\":2,\"content_sha256\":\"70607e07dc6fd21d660a9ea95c1b7736d0a7d57b93dc47000ba475a910f591fa\"},{\"chunk_id\":\"f424d53c-9ad5-ea1b-c724-d21e262b92ee\",\"heading\":\"Age of the Comparable Sales\",\"ordinal\":3,\"content_sha256\":\"511f0b559495346effad61de584c85afd90867b0c6ee61669a9cd40d478601d5\"},{\"chunk_id\":\"3c7e2d33-6c3c-b089-1e22-2f1f0b5ee51e\",\"heading\":\"Additional Requirements for New (or Recently Converted) Condos, Subdivisions, or PUDS\",\"ordinal\":4,\"content_sha256\":\"e457d04506f0fbc88af198030874387ae0c986bdf0dee66435a5daa20004ec9b\"},{\"chunk_id\":\"d0ed459f-596c-c1bb-d05e-854e89f4334e\",\"heading\":\"Rural Properties\",\"ordinal\":5,\"content_sha256\":\"1e0616e74e79b385680fc41c5b7b2921e6f15466dafb73159b9f32adf7c4c4d3\"},{\"chunk_id\":\"4ecc5b58-5bd5-9127-0de2-3c2baab11299\",\"heading\":\"Use of Foreclosures and Short Sales\",\"ordinal\":6,\"content_sha256\":\"c4f816e574e7d972240c8c77584f16d8ec9a1f65c59c9c02e19ed3bcaa1674fb\"},{\"chunk_id\":\"a2aada87-fe7d-bde4-3509-ae7f5c3a5411\",\"heading\":\"Uniform Appraisal Dataset (UAD) 3.6 Policy\",\"ordinal\":7,\"content_sha256\":\"3d363b3e42b55e1b22f55e6bf2fefb8cad99e49554d2e94fe5b699dc01d9cdeb\"}]}",
    "version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "effective_date": null,
    "last_verified_at": "2026-09-12T15:42:55.152Z",
    "chapter": "B4-1.3",
    "topic": "B4-1.3-08",
    "publication_date": null,
    "status": "current",
    "domain": "selling-guide.fanniemae.com"
  },
  {
    "id": "4bc5728a-21ce-fad4-c0d2-615a9c00c43b",
    "title": "B4-1.3-09, Adjustments to Comparable Sales (06/04/2025)",
    "organization": "Fannie Mae",
    "source_type": "FANNIE_MAE",
    "url": "https://selling-guide.fanniemae.com/sel/b4-1.3-09/adjustments-comparable-sales",
    "description": "{\"material_type\":\"publisher_capture\",\"section_revision_date\":\"2025-06-04\",\"html_sha256\":\"4b36ab9d8b751be013fd845bebff586ea46369cad9fe331fa24f53198c883c08\",\"capture\":\"docs/research/milestone-3/publisher-capture.json\",\"effective_date_verified\":false,\"subsections\":[{\"chunk_id\":\"2075a180-1983-92de-475a-49c2d3e4f493\",\"heading\":\"Analysis of Adjustments\",\"ordinal\":1,\"content_sha256\":\"c208450760ee54cc5e784020b6f3d1f520651b81b8477b1fbff420bed20c3db5\"},{\"chunk_id\":\"113eefd0-3ed4-df3f-86c4-737eb8a72803\",\"heading\":\"Sales or Financing Concessions\",\"ordinal\":2,\"content_sha256\":\"baad7d65e6a14a70ab412af7e6f3e32bb0c74dad163f83ab06072bffb351f4d4\"},{\"chunk_id\":\"d8608cf8-8b15-5c1c-2e83-785213f7c8f3\",\"heading\":\"Market Conditions Analysis and Time Adjustments\",\"ordinal\":3,\"content_sha256\":\"19b183ab4f44b703d3f7141e625c736b05402439e926a124deb0769103ae56b9\"},{\"chunk_id\":\"ffccb7f0-d5cf-7530-fc7c-f0d066447c7f\",\"heading\":\"Appraiser’s Comments and Indicated Value in the Sales Comparison Approach\",\"ordinal\":4,\"content_sha256\":\"a8d213806261f644a10ac6783b840d95224f0802a9ebbb42f72beacbf4bf298e\"},{\"chunk_id\":\"2472fd53-1d91-880f-52f3-8d73ea1ff635\",\"heading\":\"Uniform Appraisal Dataset (UAD) 3.6 Policy\",\"ordinal\":5,\"content_sha256\":\"3d363b3e42b55e1b22f55e6bf2fefb8cad99e49554d2e94fe5b699dc01d9cdeb\"}]}",
    "version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "effective_date": null,
    "last_verified_at": "2026-09-12T15:42:55.233Z",
    "chapter": "B4-1.3",
    "topic": "B4-1.3-09",
    "publication_date": null,
    "status": "current",
    "domain": "selling-guide.fanniemae.com"
  },
  {
    "id": "f4c72547-0ece-83da-63b3-828558cfe068",
    "title": "B4-1.3-11, Valuation Analysis and Reconciliation (06/04/2025)",
    "organization": "Fannie Mae",
    "source_type": "FANNIE_MAE",
    "url": "https://selling-guide.fanniemae.com/sel/b4-1.3-11/valuation-analysis-and-reconciliation",
    "description": "{\"material_type\":\"publisher_capture\",\"section_revision_date\":\"2025-06-04\",\"html_sha256\":\"cac35f0a1a56fced7664a7d615cc159f63485fdbcdaca1325c2c6e7d40d47a00\",\"capture\":\"docs/research/milestone-3/publisher-capture.json\",\"effective_date_verified\":false,\"subsections\":[{\"chunk_id\":\"84836a10-c939-1dc4-f301-450ab14e6472\",\"heading\":\"Overview\",\"ordinal\":1,\"content_sha256\":\"b9a84bb2d25a6925f018dec579e29ea61b71f570f0686f55bd86dc2df73c15df\"},{\"chunk_id\":\"5ea160c9-0331-1779-0cb9-14e25f0ae6f4\",\"heading\":\"Reconciliation\",\"ordinal\":2,\"content_sha256\":\"7874b0d47b0127a54fcda0438a4ace0567e875fd388a97847364cfec2d6da201\"},{\"chunk_id\":\"7c48980f-a6fd-c8c4-9e6c-b6ea16b1fb1d\",\"heading\":\"Uniform Appraisal Dataset (UAD) 3.6 Policy\",\"ordinal\":3,\"content_sha256\":\"3d363b3e42b55e1b22f55e6bf2fefb8cad99e49554d2e94fe5b699dc01d9cdeb\"}]}",
    "version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "effective_date": null,
    "last_verified_at": "2026-09-12T15:42:55.322Z",
    "chapter": "B4-1.3",
    "topic": "B4-1.3-11",
    "publication_date": null,
    "status": "current",
    "domain": "selling-guide.fanniemae.com"
  },
  {
    "id": "4b3a8e18-9f2f-cd7e-bce1-309338405146",
    "title": "B4-1.2-01, Appraisal Report Forms and Exhibits (09/03/2025)",
    "organization": "Fannie Mae",
    "source_type": "FANNIE_MAE",
    "url": "https://selling-guide.fanniemae.com/sel/b4-1.2-01/appraisal-report-forms-and-exhibits",
    "description": "{\"material_type\":\"publisher_capture\",\"section_revision_date\":\"2025-09-03\",\"html_sha256\":\"0039ec04b63daf37cdf98b8e5180ec41244e415e60dbdf9e013c0568bba5494e\",\"capture\":\"docs/research/milestone-3/publisher-capture.json\",\"effective_date_verified\":false,\"subsections\":[{\"chunk_id\":\"486c4287-0fea-9ded-83d7-f3f10155ff22\",\"heading\":\"Scope of Work\",\"ordinal\":1,\"content_sha256\":\"98e7058a018c686851649c4119270763e2a000187a69500bdfdda3d4fa29dbf2\"},{\"chunk_id\":\"e1b3c3d5-d4f3-25ff-63e5-68562448ba2a\",\"heading\":\"List of Appraisal Report Forms\",\"ordinal\":2,\"content_sha256\":\"23b982d332ca17c04c5b12500c61cfac922df43e7bf5c402224eb2bc07987c9e\"},{\"chunk_id\":\"eddf430a-86ce-53c9-1ae9-a1470cb1d68e\",\"heading\":\"Exhibits for Appraisals\",\"ordinal\":3,\"content_sha256\":\"60cdd5933aae2e3eb72690fb277758563ec10d1a5fc7cc15a6dd6b730b09bcd7\"},{\"chunk_id\":\"ea5d2ca7-56e3-1785-4cac-d5f15244c278\",\"heading\":\"Appraiser Certifications and Limiting Conditions\",\"ordinal\":4,\"content_sha256\":\"9d73c3a3f1ba41061d070400eac31ea4ae741f0b43786f907f7641e7267ffe43\"},{\"chunk_id\":\"47c3d67f-f90e-4715-90e5-1601c54a2c68\",\"heading\":\"Uniform Appraisal Dataset (UAD) 3.6 Policy\",\"ordinal\":5,\"content_sha256\":\"c4052dfec99293696546aeaf133ad02b82b482e529f554ec59ed2d09022a19c5\"}]}",
    "version": "Selling Guide section revision 2025-09-03; capture 2026-09-12",
    "effective_date": null,
    "last_verified_at": "2026-09-12T15:42:55.432Z",
    "chapter": "B4-1.2",
    "topic": "B4-1.2-01",
    "publication_date": null,
    "status": "current",
    "domain": "selling-guide.fanniemae.com"
  }
]$atlas_review$::jsonb) AS expected(id uuid,title text,organization text,source_type text,url text,description text,version text,effective_date date,last_verified_at timestamptz,chapter text,topic text,publication_date date,status text,domain text) LEFT JOIN public.knowledge_sources s ON s.id = expected.id WHERE (to_jsonb(s) - 'created_at') IS DISTINCT FROM to_jsonb(expected)) THEN RAISE EXCEPTION 'Staged source metadata changed'; END IF;
IF (SELECT count(*) FROM public.knowledge_sources WHERE id IN ('d8d4135c-ebb0-a85a-e945-57fecad637fb', 'c9342f90-4955-0f31-d4e8-7e6e9c19d03e', '54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea', 'a0179c21-e82d-f250-698b-df393135b4e8', '7129b5e0-7066-50fa-1b60-10d84ac0cfc1', 'd52fbd0f-5332-bd27-d80f-273617ef1ff5', '4bc5728a-21ce-fad4-c0d2-615a9c00c43b', 'f4c72547-0ece-83da-63b3-828558cfe068', '4b3a8e18-9f2f-cd7e-bce1-309338405146') AND status = 'current') <> 9 THEN RAISE EXCEPTION 'Staged source state changed'; END IF;
IF (SELECT count(*) FROM public.knowledge_chunks WHERE source_id IN ('d8d4135c-ebb0-a85a-e945-57fecad637fb', 'c9342f90-4955-0f31-d4e8-7e6e9c19d03e', '54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea', 'a0179c21-e82d-f250-698b-df393135b4e8', '7129b5e0-7066-50fa-1b60-10d84ac0cfc1', 'd52fbd0f-5332-bd27-d80f-273617ef1ff5', '4bc5728a-21ce-fad4-c0d2-615a9c00c43b', 'f4c72547-0ece-83da-63b3-828558cfe068', '4b3a8e18-9f2f-cd7e-bce1-309338405146')) <> 67 THEN RAISE EXCEPTION 'Staged chunk count changed'; END IF;
IF EXISTS (SELECT 1 FROM jsonb_to_recordset($atlas_review$[
  {
    "id": "9986af6d-fa90-7f8d-ad7c-06d048b31894",
    "source_id": "d8d4135c-ebb0-a85a-e945-57fecad637fb",
    "md5_lf": "43a404604b5f230bddca9cf4eba3fc1e",
    "section": "B4-1.3-03",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Overview",
    "chunk_number": 1
  },
  {
    "id": "6f55af76-090a-6cac-bed8-5101eb19ddd9",
    "source_id": "d8d4135c-ebb0-a85a-e945-57fecad637fb",
    "md5_lf": "23c026bf8369b03f9110113f963d4ac3",
    "section": "B4-1.3-03",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Neighborhood Analysis",
    "chunk_number": 2
  },
  {
    "id": "b56986ff-9a72-74d2-0277-656183b4c757",
    "source_id": "d8d4135c-ebb0-a85a-e945-57fecad637fb",
    "md5_lf": "09de5697f7a78d60be18bce41a9d90b9",
    "section": "B4-1.3-03",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Degree of Development and Growth Rate",
    "chunk_number": 3
  },
  {
    "id": "322ed6ea-a62c-4f12-6ab0-8d6748b51d48",
    "source_id": "d8d4135c-ebb0-a85a-e945-57fecad637fb",
    "md5_lf": "6bdb160d5690d339d59eb71283f5c9e1",
    "section": "B4-1.3-03",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Trend of Neighborhood Property Values, Demand/Supply, and Marketing Time",
    "chunk_number": 4
  },
  {
    "id": "d9b91870-5813-3090-a8bf-a71032a6c938",
    "source_id": "d8d4135c-ebb0-a85a-e945-57fecad637fb",
    "md5_lf": "51b43db962637bb065aab3d25af499c3",
    "section": "B4-1.3-03",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Price Range and Predominant Price",
    "chunk_number": 5
  },
  {
    "id": "5a4683af-211e-f11e-c4e2-a590def4590f",
    "source_id": "d8d4135c-ebb0-a85a-e945-57fecad637fb",
    "md5_lf": "4e7a12607bff624becd2a8eccab01828",
    "section": "B4-1.3-03",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Over-Improvements",
    "chunk_number": 6
  },
  {
    "id": "ff3fc974-2afe-4300-ad0c-a1eb3cc1c915",
    "source_id": "d8d4135c-ebb0-a85a-e945-57fecad637fb",
    "md5_lf": "cb7c0d928a1f3136b657072e1940207f",
    "section": "B4-1.3-03",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Age Range and Predominant Age",
    "chunk_number": 7
  },
  {
    "id": "9458d699-875e-1b5f-290a-c5be10b85f59",
    "source_id": "d8d4135c-ebb0-a85a-e945-57fecad637fb",
    "md5_lf": "aebccc3b9a427cb7b149a1381488590c",
    "section": "B4-1.3-03",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Present Land Use",
    "chunk_number": 8
  },
  {
    "id": "48cd619f-7ac4-f8e6-3726-cfb22a70d8c3",
    "source_id": "d8d4135c-ebb0-a85a-e945-57fecad637fb",
    "md5_lf": "fed921817dbf373bea62728f2d397f8d",
    "section": "B4-1.3-03",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Uniform Appraisal Dataset (UAD) 3.6 Policy",
    "chunk_number": 9
  },
  {
    "id": "c9d16227-69e6-c45f-9d21-72853dee03da",
    "source_id": "c9342f90-4955-0f31-d4e8-7e6e9c19d03e",
    "md5_lf": "7887477633cdbcab22643d9219d55978",
    "section": "B4-1.3-04",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Overview",
    "chunk_number": 1
  },
  {
    "id": "29b3c882-c0bf-e9b1-fd1c-800f8f5e711e",
    "source_id": "c9342f90-4955-0f31-d4e8-7e6e9c19d03e",
    "md5_lf": "89b16ce5cb525e7983ba9c37a5cadbcc",
    "section": "B4-1.3-04",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Site Analysis",
    "chunk_number": 2
  },
  {
    "id": "fe3309ad-85ba-f81e-67e0-07b4a98a1f55",
    "source_id": "c9342f90-4955-0f31-d4e8-7e6e9c19d03e",
    "md5_lf": "b10d34273c5a9b2155371e51d7d6f016",
    "section": "B4-1.3-04",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Subject Property Zoning",
    "chunk_number": 3
  },
  {
    "id": "680cd93f-c151-555a-f364-9e48246562bf",
    "source_id": "c9342f90-4955-0f31-d4e8-7e6e9c19d03e",
    "md5_lf": "6b4ed4d6b720411dc9676b04ac73f5fe",
    "section": "B4-1.3-04",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Highest and Best Use",
    "chunk_number": 4
  },
  {
    "id": "6cc70f68-7cf2-4816-a5a6-4337a16fd5ff",
    "source_id": "c9342f90-4955-0f31-d4e8-7e6e9c19d03e",
    "md5_lf": "304368a74d47c208cf09b52bb076759a",
    "section": "B4-1.3-04",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Adjoining Properties",
    "chunk_number": 5
  },
  {
    "id": "ebca6ace-1326-d713-1eb4-8bced4a8ec0d",
    "source_id": "c9342f90-4955-0f31-d4e8-7e6e9c19d03e",
    "md5_lf": "2664c5821252b178c6f0b220dc0a69e7",
    "section": "B4-1.3-04",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Site Utilities",
    "chunk_number": 6
  },
  {
    "id": "2bd00768-875e-fc12-394e-663a4061d3dd",
    "source_id": "c9342f90-4955-0f31-d4e8-7e6e9c19d03e",
    "md5_lf": "1d21d7ce65b6bdd80a33eb0316ba8c03",
    "section": "B4-1.3-04",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Off-Site Improvements",
    "chunk_number": 7
  },
  {
    "id": "ddb9e27c-d5e5-9e81-77a5-f3f183bf1d1d",
    "source_id": "c9342f90-4955-0f31-d4e8-7e6e9c19d03e",
    "md5_lf": "5e6ede62d93e7e1078a28670e880fcd9",
    "section": "B4-1.3-04",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Community-Owned or Privately Maintained Streets",
    "chunk_number": 8
  },
  {
    "id": "ce1e0a6e-0fcf-851a-2ae2-e4a95f0e47f6",
    "source_id": "c9342f90-4955-0f31-d4e8-7e6e9c19d03e",
    "md5_lf": "d990ce0833f8caf090ccba6870b8a4d6",
    "section": "B4-1.3-04",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Special Flood Hazard Areas",
    "chunk_number": 9
  },
  {
    "id": "ae433b4f-bed5-7389-8e39-2cfa6ac83c31",
    "source_id": "c9342f90-4955-0f31-d4e8-7e6e9c19d03e",
    "md5_lf": "fed921817dbf373bea62728f2d397f8d",
    "section": "B4-1.3-04",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Uniform Appraisal Dataset (UAD) 3.6 Policy",
    "chunk_number": 10
  },
  {
    "id": "fdecfe66-9873-30ca-7c75-102db62b6bff",
    "source_id": "54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea",
    "md5_lf": "e5e57efc3be21294b705bced9ecdd92e",
    "section": "B4-1.3-05",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Overview",
    "chunk_number": 1
  },
  {
    "id": "19e0e797-d715-2ec8-766b-4ead2b036ddf",
    "source_id": "54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea",
    "md5_lf": "11445db41e99566c53639012b9bbb1d6",
    "section": "B4-1.3-05",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Conformity of Improvements to Neighborhood",
    "chunk_number": 2
  },
  {
    "id": "1f69874f-d3af-60a0-6c8a-2d5f52e60693",
    "source_id": "54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea",
    "md5_lf": "dac93451c1451bce147bf82dcdc9e114",
    "section": "B4-1.3-05",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Unique Housing Types",
    "chunk_number": 3
  },
  {
    "id": "14c3b346-b041-fc7e-fd59-7c7dba459958",
    "source_id": "54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea",
    "md5_lf": "3f433a06265adabc183d7a47aac60d2f",
    "section": "B4-1.3-05",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Actual and Effective Ages",
    "chunk_number": 4
  },
  {
    "id": "12c3187b-f610-75cf-dcdd-1623bd57e392",
    "source_id": "54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea",
    "md5_lf": "767119ead17fbb18e210d779fd2c9453",
    "section": "B4-1.3-05",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Remaining Economic Life",
    "chunk_number": 5
  },
  {
    "id": "d6f5d82e-f109-9dd8-4562-a66873d26afa",
    "source_id": "54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea",
    "md5_lf": "deca47fd5199af357a57441b08eb3587",
    "section": "B4-1.3-05",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Energy Efficient Improvements",
    "chunk_number": 6
  },
  {
    "id": "0c0d55ff-e34b-3f38-8cf8-4b513430958b",
    "source_id": "54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea",
    "md5_lf": "902cd7f258f2977462d2df2888806927",
    "section": "B4-1.3-05",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Layout and Floor Plans",
    "chunk_number": 7
  },
  {
    "id": "08dbdc08-f970-1b3d-6c85-45a5e2bfcc22",
    "source_id": "54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea",
    "md5_lf": "ee78f8ec8ee4a0eee0f2786a3dcffd47",
    "section": "B4-1.3-05",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Above- and Below-Grade Area(s)",
    "chunk_number": 8
  },
  {
    "id": "95cfc08c-4c23-7638-d82a-ecd7a5c15e2a",
    "source_id": "54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea",
    "md5_lf": "683646db31baefdfa457cee9f184db38",
    "section": "B4-1.3-05",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Gross Building Area",
    "chunk_number": 9
  },
  {
    "id": "40c2ce58-5e84-ca13-935d-fb9698247d02",
    "source_id": "54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea",
    "md5_lf": "9e070458960c30d545e7bef5f5c78da0",
    "section": "B4-1.3-05",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Accessory Dwelling Units",
    "chunk_number": 10
  },
  {
    "id": "a55cd9ef-0752-7789-d3e2-9baf6a689c2f",
    "source_id": "54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea",
    "md5_lf": "2f9d04f78fb443918a719e4e6d87c33d",
    "section": "B4-1.3-05",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Additions without Permits",
    "chunk_number": 11
  },
  {
    "id": "601e46da-d20a-70f5-5ab9-6049e05856ef",
    "source_id": "54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea",
    "md5_lf": "ca21146cd701e6efafbf29eb756a67a8",
    "section": "B4-1.3-05",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Properties with Outbuildings",
    "chunk_number": 12
  },
  {
    "id": "2ef6c2fb-180c-b15a-ce7f-d76a6c308b8d",
    "source_id": "54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea",
    "md5_lf": "fed921817dbf373bea62728f2d397f8d",
    "section": "B4-1.3-05",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Uniform Appraisal Dataset (UAD) 3.6 Policy",
    "chunk_number": 13
  },
  {
    "id": "f37cd0d9-3a74-b959-9583-cba6b154adff",
    "source_id": "a0179c21-e82d-f250-698b-df393135b4e8",
    "md5_lf": "02aa4ebcd773558549da51d303b28226",
    "section": "B4-1.3-06",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Appraiser Selection of Condition, Quality, and other Characteristic Ratings",
    "chunk_number": 1
  },
  {
    "id": "61685c2c-7b05-b83f-a0e2-1cd75ff618d5",
    "source_id": "a0179c21-e82d-f250-698b-df393135b4e8",
    "md5_lf": "0bc278203222fc77c108fd67240a0335",
    "section": "B4-1.3-06",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Property Condition",
    "chunk_number": 2
  },
  {
    "id": "ae154540-d87f-64b2-4d3c-3a462d2a7403",
    "source_id": "a0179c21-e82d-f250-698b-df393135b4e8",
    "md5_lf": "d114cef001921eb13ccc0e6acb699f5d",
    "section": "B4-1.3-06",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Property Condition Ratings",
    "chunk_number": 3
  },
  {
    "id": "fc8645ff-322f-a922-5131-61295e0ef983",
    "source_id": "a0179c21-e82d-f250-698b-df393135b4e8",
    "md5_lf": "c65f9d8c1e10f1314638521a950a727f",
    "section": "B4-1.3-06",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Identifying Property Condition",
    "chunk_number": 4
  },
  {
    "id": "560c181f-c7b7-738c-6307-357ddb15179f",
    "source_id": "a0179c21-e82d-f250-698b-df393135b4e8",
    "md5_lf": "557364f804dcbed92d5bba537dcc6a07",
    "section": "B4-1.3-06",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Definitions of Not Updated, Updated, and Remodeled",
    "chunk_number": 5
  },
  {
    "id": "d0a65bf4-1e9b-52a2-3e9b-ebaf30cede40",
    "source_id": "a0179c21-e82d-f250-698b-df393135b4e8",
    "md5_lf": "ad566c64aadb8fbf0c6e9a6fe43f6aac",
    "section": "B4-1.3-06",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Appraisals Completed “As Is”",
    "chunk_number": 6
  },
  {
    "id": "5b2699a2-883d-a825-7c10-a665f798a75b",
    "source_id": "a0179c21-e82d-f250-698b-df393135b4e8",
    "md5_lf": "5d4cad99e398d17cb8c1b075ff443924",
    "section": "B4-1.3-06",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Quality of Construction Rating",
    "chunk_number": 7
  },
  {
    "id": "93f46d9e-b549-3ca6-f6f0-14d553b1254d",
    "source_id": "a0179c21-e82d-f250-698b-df393135b4e8",
    "md5_lf": "969c4b5ee1508e4640b72a40698042b6",
    "section": "B4-1.3-06",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Identifying Quality of Construction",
    "chunk_number": 8
  },
  {
    "id": "fc03055c-5393-d480-5b0a-924fd8f14da0",
    "source_id": "a0179c21-e82d-f250-698b-df393135b4e8",
    "md5_lf": "7a1d1d303f04a886029e62c343746b93",
    "section": "B4-1.3-06",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Physical Deficiencies That Affect Safety, Soundness, or Structural Integrity of the Subject Property",
    "chunk_number": 9
  },
  {
    "id": "057d2c33-5260-17be-68aa-50e5ea2556c6",
    "source_id": "a0179c21-e82d-f250-698b-df393135b4e8",
    "md5_lf": "2790931d2b7c3e1c304d64b7243a8c83",
    "section": "B4-1.3-06",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Infestation, Dampness, or Settlement",
    "chunk_number": 10
  },
  {
    "id": "bb184b24-5b11-d468-d786-8f6f9a770f3b",
    "source_id": "a0179c21-e82d-f250-698b-df393135b4e8",
    "md5_lf": "fed921817dbf373bea62728f2d397f8d",
    "section": "B4-1.3-06",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Uniform Appraisal Dataset (UAD) 3.6 Policy",
    "chunk_number": 11
  },
  {
    "id": "170a750b-2a1f-22c7-76d6-af9602e5728f",
    "source_id": "7129b5e0-7066-50fa-1b60-10d84ac0cfc1",
    "md5_lf": "cc8ba51c24303ddadf9b4980910e1ed1",
    "section": "B4-1.3-07",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Overview",
    "chunk_number": 1
  },
  {
    "id": "23d931ee-369b-1192-a78c-62ee6812acd2",
    "source_id": "7129b5e0-7066-50fa-1b60-10d84ac0cfc1",
    "md5_lf": "780845f67cd88e56bf44dc7fd8e944a4",
    "section": "B4-1.3-07",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Data and Verification Sources of Comparable Sales",
    "chunk_number": 2
  },
  {
    "id": "ed0623ee-518a-cffe-47cb-193ca0e59f0f",
    "source_id": "7129b5e0-7066-50fa-1b60-10d84ac0cfc1",
    "md5_lf": "9f05a912b65c447eadaab5b6d9eca369",
    "section": "B4-1.3-07",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Prior Sales History of the Subject and Comparable Sales",
    "chunk_number": 3
  },
  {
    "id": "1af40bc8-dfa1-b5ce-1ef1-e03adf1080a2",
    "source_id": "7129b5e0-7066-50fa-1b60-10d84ac0cfc1",
    "md5_lf": "fed921817dbf373bea62728f2d397f8d",
    "section": "B4-1.3-07",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Uniform Appraisal Dataset (UAD) 3.6 Policy",
    "chunk_number": 4
  },
  {
    "id": "729d803e-192d-3bbd-980d-d75a16efb9a6",
    "source_id": "d52fbd0f-5332-bd27-d80f-273617ef1ff5",
    "md5_lf": "f684ee6fddc137c11b442a8320addb2c",
    "section": "B4-1.3-08",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Selection of Comparable Sales",
    "chunk_number": 1
  },
  {
    "id": "c60d8535-a617-3c1c-70be-3f0a5f3a2b23",
    "source_id": "d52fbd0f-5332-bd27-d80f-273617ef1ff5",
    "md5_lf": "a9cedd37b3a2f445b756678384498a89",
    "section": "B4-1.3-08",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Minimum Number of Comparable Sales",
    "chunk_number": 2
  },
  {
    "id": "f424d53c-9ad5-ea1b-c724-d21e262b92ee",
    "source_id": "d52fbd0f-5332-bd27-d80f-273617ef1ff5",
    "md5_lf": "6d329563a4fd002f87ec7080288db89f",
    "section": "B4-1.3-08",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Age of the Comparable Sales",
    "chunk_number": 3
  },
  {
    "id": "3c7e2d33-6c3c-b089-1e22-2f1f0b5ee51e",
    "source_id": "d52fbd0f-5332-bd27-d80f-273617ef1ff5",
    "md5_lf": "49506439f05819e93891fd02622212dc",
    "section": "B4-1.3-08",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Additional Requirements for New (or Recently Converted) Condos, Subdivisions, or PUDS",
    "chunk_number": 4
  },
  {
    "id": "d0ed459f-596c-c1bb-d05e-854e89f4334e",
    "source_id": "d52fbd0f-5332-bd27-d80f-273617ef1ff5",
    "md5_lf": "c3a5e6b9fe29a426fc90573438e055ba",
    "section": "B4-1.3-08",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Rural Properties",
    "chunk_number": 5
  },
  {
    "id": "4ecc5b58-5bd5-9127-0de2-3c2baab11299",
    "source_id": "d52fbd0f-5332-bd27-d80f-273617ef1ff5",
    "md5_lf": "056dffb25191101808c2e71c8e8cf6b9",
    "section": "B4-1.3-08",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Use of Foreclosures and Short Sales",
    "chunk_number": 6
  },
  {
    "id": "a2aada87-fe7d-bde4-3509-ae7f5c3a5411",
    "source_id": "d52fbd0f-5332-bd27-d80f-273617ef1ff5",
    "md5_lf": "fed921817dbf373bea62728f2d397f8d",
    "section": "B4-1.3-08",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Uniform Appraisal Dataset (UAD) 3.6 Policy",
    "chunk_number": 7
  },
  {
    "id": "2075a180-1983-92de-475a-49c2d3e4f493",
    "source_id": "4bc5728a-21ce-fad4-c0d2-615a9c00c43b",
    "md5_lf": "6c4dee371516911176dce3ab2a5e120d",
    "section": "B4-1.3-09",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Analysis of Adjustments",
    "chunk_number": 1
  },
  {
    "id": "113eefd0-3ed4-df3f-86c4-737eb8a72803",
    "source_id": "4bc5728a-21ce-fad4-c0d2-615a9c00c43b",
    "md5_lf": "1f39712bece706d5a5807b7462343d46",
    "section": "B4-1.3-09",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Sales or Financing Concessions",
    "chunk_number": 2
  },
  {
    "id": "d8608cf8-8b15-5c1c-2e83-785213f7c8f3",
    "source_id": "4bc5728a-21ce-fad4-c0d2-615a9c00c43b",
    "md5_lf": "15c4dc245486e4045b00685b3f06ef20",
    "section": "B4-1.3-09",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Market Conditions Analysis and Time Adjustments",
    "chunk_number": 3
  },
  {
    "id": "ffccb7f0-d5cf-7530-fc7c-f0d066447c7f",
    "source_id": "4bc5728a-21ce-fad4-c0d2-615a9c00c43b",
    "md5_lf": "213f3934484edb47fdf8478d6dee54ff",
    "section": "B4-1.3-09",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Appraiser’s Comments and Indicated Value in the Sales Comparison Approach",
    "chunk_number": 4
  },
  {
    "id": "2472fd53-1d91-880f-52f3-8d73ea1ff635",
    "source_id": "4bc5728a-21ce-fad4-c0d2-615a9c00c43b",
    "md5_lf": "fed921817dbf373bea62728f2d397f8d",
    "section": "B4-1.3-09",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Uniform Appraisal Dataset (UAD) 3.6 Policy",
    "chunk_number": 5
  },
  {
    "id": "84836a10-c939-1dc4-f301-450ab14e6472",
    "source_id": "f4c72547-0ece-83da-63b3-828558cfe068",
    "md5_lf": "95fb0a6ce7ebe2b6c35aad087aef07f5",
    "section": "B4-1.3-11",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Overview",
    "chunk_number": 1
  },
  {
    "id": "5ea160c9-0331-1779-0cb9-14e25f0ae6f4",
    "source_id": "f4c72547-0ece-83da-63b3-828558cfe068",
    "md5_lf": "a9d3affc3f294281c97f188745120c18",
    "section": "B4-1.3-11",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Reconciliation",
    "chunk_number": 2
  },
  {
    "id": "7c48980f-a6fd-c8c4-9e6c-b6ea16b1fb1d",
    "source_id": "f4c72547-0ece-83da-63b3-828558cfe068",
    "md5_lf": "fed921817dbf373bea62728f2d397f8d",
    "section": "B4-1.3-11",
    "source_version": "Selling Guide section revision 2025-06-04; capture 2026-09-12",
    "title": "Uniform Appraisal Dataset (UAD) 3.6 Policy",
    "chunk_number": 3
  },
  {
    "id": "486c4287-0fea-9ded-83d7-f3f10155ff22",
    "source_id": "4b3a8e18-9f2f-cd7e-bce1-309338405146",
    "md5_lf": "b9f5b24cba37f2b0e3fd3a64060c858f",
    "section": "B4-1.2-01",
    "source_version": "Selling Guide section revision 2025-09-03; capture 2026-09-12",
    "title": "Scope of Work",
    "chunk_number": 1
  },
  {
    "id": "e1b3c3d5-d4f3-25ff-63e5-68562448ba2a",
    "source_id": "4b3a8e18-9f2f-cd7e-bce1-309338405146",
    "md5_lf": "7c7729831cde78bc9ef66b950443760e",
    "section": "B4-1.2-01",
    "source_version": "Selling Guide section revision 2025-09-03; capture 2026-09-12",
    "title": "List of Appraisal Report Forms",
    "chunk_number": 2
  },
  {
    "id": "eddf430a-86ce-53c9-1ae9-a1470cb1d68e",
    "source_id": "4b3a8e18-9f2f-cd7e-bce1-309338405146",
    "md5_lf": "2a2fd872b4b179f973b8ee48f5189838",
    "section": "B4-1.2-01",
    "source_version": "Selling Guide section revision 2025-09-03; capture 2026-09-12",
    "title": "Exhibits for Appraisals",
    "chunk_number": 3
  },
  {
    "id": "ea5d2ca7-56e3-1785-4cac-d5f15244c278",
    "source_id": "4b3a8e18-9f2f-cd7e-bce1-309338405146",
    "md5_lf": "14f2d445969c2838ba7c48cfb7c07b23",
    "section": "B4-1.2-01",
    "source_version": "Selling Guide section revision 2025-09-03; capture 2026-09-12",
    "title": "Appraiser Certifications and Limiting Conditions",
    "chunk_number": 4
  },
  {
    "id": "47c3d67f-f90e-4715-90e5-1601c54a2c68",
    "source_id": "4b3a8e18-9f2f-cd7e-bce1-309338405146",
    "md5_lf": "08c77412ef6a80ab1db34ab5e1d5af87",
    "section": "B4-1.2-01",
    "source_version": "Selling Guide section revision 2025-09-03; capture 2026-09-12",
    "title": "Uniform Appraisal Dataset (UAD) 3.6 Policy",
    "chunk_number": 5
  }
]$atlas_review$::jsonb) AS expected(id uuid, source_id uuid, md5_lf text, section text, source_version text, title text, chunk_number integer)
LEFT JOIN public.knowledge_chunks c ON c.id = expected.id WHERE c.id IS NULL OR c.source_id <> expected.source_id OR c.section IS DISTINCT FROM expected.section OR c.source_version IS DISTINCT FROM expected.source_version OR c.title IS DISTINCT FROM expected.title OR c.chunk_number IS DISTINCT FROM expected.chunk_number OR c.page_number IS NOT NULL OR c.effective_date IS NOT NULL OR c.authority_level IS DISTINCT FROM 'authoritative' OR md5(replace(c.content, E'\r\n', E'\n')) <> expected.md5_lf)
THEN RAISE EXCEPTION 'Staged content or metadata changed'; END IF;
IF (SELECT count(*) FROM public.knowledge_sources WHERE id IN ('d8d4135c-ebb0-a85a-e945-57fecad637fb', 'c9342f90-4955-0f31-d4e8-7e6e9c19d03e', '54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea', 'a0179c21-e82d-f250-698b-df393135b4e8', '7129b5e0-7066-50fa-1b60-10d84ac0cfc1', 'd52fbd0f-5332-bd27-d80f-273617ef1ff5', '4bc5728a-21ce-fad4-c0d2-615a9c00c43b', 'f4c72547-0ece-83da-63b3-828558cfe068', '4b3a8e18-9f2f-cd7e-bce1-309338405146') AND status = 'current') <> 9 OR (SELECT count(*) FROM public.knowledge_sources WHERE id IN ('6ebe6a6a-393a-4313-90c6-9ef0b922f9e5', '2676cf5e-216f-4642-a584-e0fac610b4a6') AND status = 'superseded') <> 2 THEN RAISE EXCEPTION 'Unexpected rollback source state'; END IF;
IF (SELECT count(*) FROM public.knowledge_chunks WHERE id IN ('58399be5-629d-4fb3-bc76-d70bd347e357', '8f4ec5eb-8aaf-431b-ba30-213229d11764', '184bc948-46f7-4c35-ab05-0901b30f2b37', 'b576c04e-4a81-4a72-89ea-72f364c01c1d', 'd6e61b42-b75f-4f61-9790-b7c1d7ced295', '1a9b3bf8-65b5-44da-abdb-6a5c73e5d7a8') AND authority_level = 'derived') <> 6 THEN RAISE EXCEPTION 'Unexpected rollback labels'; END IF;
END; $guard$;
UPDATE public.knowledge_sources SET status = 'staged_provenance_review' WHERE id IN ('d8d4135c-ebb0-a85a-e945-57fecad637fb', 'c9342f90-4955-0f31-d4e8-7e6e9c19d03e', '54dcb2e9-4d49-cef1-60b6-cbb53a8e3fea', 'a0179c21-e82d-f250-698b-df393135b4e8', '7129b5e0-7066-50fa-1b60-10d84ac0cfc1', 'd52fbd0f-5332-bd27-d80f-273617ef1ff5', '4bc5728a-21ce-fad4-c0d2-615a9c00c43b', 'f4c72547-0ece-83da-63b3-828558cfe068', '4b3a8e18-9f2f-cd7e-bce1-309338405146');
UPDATE public.knowledge_sources SET status = 'current' WHERE id IN ('6ebe6a6a-393a-4313-90c6-9ef0b922f9e5', '2676cf5e-216f-4642-a584-e0fac610b4a6');
UPDATE public.knowledge_chunks SET authority_level = 'authoritative' WHERE id IN ('58399be5-629d-4fb3-bc76-d70bd347e357', '8f4ec5eb-8aaf-431b-ba30-213229d11764', '184bc948-46f7-4c35-ab05-0901b30f2b37', 'b576c04e-4a81-4a72-89ea-72f364c01c1d', 'd6e61b42-b75f-4f61-9790-b7c1d7ced295', '1a9b3bf8-65b5-44da-abdb-6a5c73e5d7a8');
COMMIT;
