-- ──────────────────────────────────────────────
-- Migration Supabase — Panthère
-- Activation de pgvector et création des tables
-- ──────────────────────────────────────────────

-- 1. Activer l'extension pgvector
create extension if not exists vector with schema extensions;

-- 2. Table des documents sources
create table if not exists public.documents (
    id uuid primary key default gen_random_uuid(),
    titre text not null,
    matiere text not null default 'mathématiques',
    pays text not null default 'Côte d''Ivoire',
    niveau text not null default 'lycée',
    source text,
    contenu_brut text not null,
    created_at timestamptz not null default now()
);

-- Index sur les métadonnées (pour les filtres)
create index if not exists idx_documents_matiere on public.documents (matiere);
create index if not exists idx_documents_pays on public.documents (pays);
create index if not exists idx_documents_niveau on public.documents (niveau);

-- 3. Table des chunks vectorisés
create table if not exists public.document_chunks (
    id uuid primary key default gen_random_uuid(),
    document_id uuid not null references public.documents(id) on delete cascade,
    contenu text not null,
    embedding vector(512) not null,
    position int not null default 0
);

-- Index vectoriel (IVFFlat pour commencer)
create index if not exists idx_document_chunks_embedding
    on public.document_chunks
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

-- 4. Fonction de recherche par similarité cosinus
create or replace function public.match_document_chunks(
    query_embedding vector(512),
    match_threshold float default 0.5,
    match_count int default 5
)
returns table (
    id uuid,
    document_id uuid,
    contenu text,
    embedding vector(512),
    position int,
    score float
)
language plpgsql
as $$
begin
    return query
    select
        dc.id,
        dc.document_id,
        dc.contenu,
        dc.embedding,
        dc.position,
        1 - (dc.embedding <=> query_embedding) as score
    from public.document_chunks dc
    where 1 - (dc.embedding <=> query_embedding) > match_threshold
    order by dc.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- 5. Politiques de sécurité RLS
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;

create policy "Lecture publique des documents"
    on public.documents for select using (true);

create policy "Lecture publique des chunks"
    on public.document_chunks for select using (true);

create policy "Insertion documents"
    on public.documents for insert with check (true);

create policy "Insertion chunks"
    on public.document_chunks for insert with check (true);
