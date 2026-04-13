-- =============================================
-- LaVieEnPose — Supabase SQL Migration
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- =============================================

-- 1. Tabla de perfiles (extiende auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Perfiles visibles para todos"
  on public.profiles for select using (true);

create policy "Usuarios pueden editar su propio perfil"
  on public.profiles for update using (auth.uid() = id);

-- Trigger para crear perfil automaticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Categorias
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "Categorias visibles para todos"
  on public.categories for select using (true);

-- Categorias iniciales
insert into public.categories (name, slug) values
  ('Tendencias', 'tendencias'),
  ('Streetwear', 'streetwear'),
  ('Alta Costura', 'alta-costura'),
  ('Accesorios', 'accesorios'),
  ('Sostenibilidad', 'sostenibilidad')
on conflict (slug) do nothing;

-- 3. Articulos
create table if not exists public.articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_image text,
  category_id uuid references public.categories(id),
  author_id uuid references public.profiles(id),
  published boolean default false,
  featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.articles enable row level security;

create policy "Articulos publicados visibles para todos"
  on public.articles for select using (published = true);

-- 4. Imagenes de galeria
create table if not exists public.gallery_images (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  caption text,
  collection text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.gallery_images enable row level security;

create policy "Galeria visible para todos"
  on public.gallery_images for select using (true);

-- 5. Comentarios
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  article_id uuid references public.articles(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Comentarios visibles para todos"
  on public.comments for select using (true);

create policy "Usuarios autenticados pueden comentar"
  on public.comments for insert with check (auth.uid() = user_id);
