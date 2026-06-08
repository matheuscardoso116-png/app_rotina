-- Tabela de linha do tempo (eventos do dia)
create table if not exists timeline (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  mensagem_original text not null,
  tipo text not null, -- 'atividade' | 'gasto' | 'treino' | 'tarefa' | 'salario' | 'outro'
  descricao text not null,
  hora_evento time,
  valor numeric(10,2),
  created_at timestamptz default now() not null
);

alter table timeline enable row level security;

create policy "Usuário vê própria timeline"
  on timeline for select using (auth.uid() = user_id);

create policy "Usuário insere na própria timeline"
  on timeline for insert with check (auth.uid() = user_id);

create policy "Usuário apaga da própria timeline"
  on timeline for delete using (auth.uid() = user_id);

-- Tabela de salários/entradas
create table if not exists salarios (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  descricao text not null,
  valor numeric(10,2) not null,
  data date not null default current_date,
  tipo text not null default 'salario', -- 'salario' | 'freelance' | 'outro'
  created_at timestamptz default now() not null
);

alter table salarios enable row level security;

create policy "Usuário vê próprios salários"
  on salarios for select using (auth.uid() = user_id);

create policy "Usuário insere próprios salários"
  on salarios for insert with check (auth.uid() = user_id);

create policy "Usuário apaga próprios salários"
  on salarios for delete using (auth.uid() = user_id);
