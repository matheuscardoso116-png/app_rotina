-- Gastos
create table gastos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  descricao text not null,
  valor decimal(10,2) not null,
  categoria text not null,
  tipo text not null check (tipo in ('pessoal', 'empresa')),
  data date not null default current_date,
  created_at timestamptz default now()
);

-- Treinos
create table treinos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  tipo text not null,
  duracao_min int,
  observacoes text,
  data date not null default current_date,
  created_at timestamptz default now()
);

-- Obrigacoes
create table obrigacoes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  titulo text not null,
  descricao text,
  prazo date,
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta')),
  tipo text not null default 'pessoal' check (tipo in ('pessoal', 'empresa')),
  status text not null default 'pendente' check (status in ('pendente', 'concluida')),
  created_at timestamptz default now()
);

-- RLS (cada usuário vê só seus dados)
alter table gastos enable row level security;
alter table treinos enable row level security;
alter table obrigacoes enable row level security;

create policy "users_gastos" on gastos using (auth.uid() = user_id);
create policy "users_treinos" on treinos using (auth.uid() = user_id);
create policy "users_obrigacoes" on obrigacoes using (auth.uid() = user_id);
