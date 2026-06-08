-- Adiciona grupos musculares ao treino
alter table treinos add column if not exists grupos_musculares text default '';

-- Tabela de chat com IA
create table if not exists chat_mensagens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  role text not null check (role in ('user', 'assistant')),
  conteudo text not null,
  created_at timestamptz default now() not null
);

alter table chat_mensagens enable row level security;

create policy "Usuário vê próprias mensagens"
  on chat_mensagens for select using (auth.uid() = user_id);

create policy "Usuário insere próprias mensagens"
  on chat_mensagens for insert with check (auth.uid() = user_id);

create policy "Usuário apaga próprias mensagens"
  on chat_mensagens for delete using (auth.uid() = user_id);

-- Tabela de entradas/receitas (salários)
create table if not exists salarios (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  descricao text not null,
  valor numeric(10,2) not null,
  data date not null default current_date,
  tipo text not null default 'salario',
  created_at timestamptz default now() not null
);

alter table salarios enable row level security;

create policy "Usuário vê próprios salários" on salarios for select using (auth.uid() = user_id);
create policy "Usuário insere próprios salários" on salarios for insert with check (auth.uid() = user_id);
create policy "Usuário apaga próprios salários" on salarios for delete using (auth.uid() = user_id);
