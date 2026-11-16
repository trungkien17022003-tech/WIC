/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MULTI_TABLE_SQL = `-- -------------------------------------------------------------
-- SCHEMA đề xuất bởi Trình Cấu hình Thiệp Cưới 0đ (Next.js + Supabase)
-- -------------------------------------------------------------

-- Kích hoạt extension sinh UUID tự động nếu chưa có
create extension if not exists "uuid-ossp";

-- =============================================================
-- 1. BẢNG INVITATIONS (Thông tin cấu hình mẫu thiệp và giao diện)
-- =============================================================
create table public.invitations (
    id uuid default gen_random_uuid() primary key,
    slug text not null unique,                  -- Đường dẫn tĩnh, VD: "hung-mai-wedding"
    owner_id uuid default auth.uid(),           -- ID người tạo (liên kết auth.users trong Supabase)
    title text not null,                        -- Tiêu đề trang (VD: "Đồng hành & Yêu thương - Hùng & Mai")
    
    -- Cột JSONB cực kỳ mạnh mẽ lưu trữ toàn bộ cá nhân hóa giao diện
    -- Bao gồm: màu sắc, font, nhạc nền, couple details, ảnh cũ, và thứ tự các block hiển thị.
    config jsonb not null default '{}'::jsonb,
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================================
-- 2. BẢNG RSVPS (Danh sách khách mời đăng ký tham dự phản hồi)
-- =============================================================
create table public.rsvps (
    id uuid default gen_random_uuid() primary key,
    invitation_id uuid references public.invitations(id) on delete cascade not null,
    guest_name text not null,
    phone text,
    attendance text check (attendance in ('yes', 'no')) not null,
    guest_count integer default 1,
    
    -- Lưu trữ động câu trả lời tùy biến từ hệ thống form
    answers jsonb default '{}'::jsonb, 
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================================
-- 3. BẢNG WISHES (Lời chúc và sổ lưu bút của khách mời)
-- =============================================================
create table public.wishes (
    id uuid default gen_random_uuid() primary key,
    invitation_id uuid references public.invitations(id) on delete cascade not null,
    guest_name text not null,
    relationship text default 'friend', -- groom | bride | friend | other
    message text not null,
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================================
-- HIỆU NĂNG: Chỉ mục (Indexes) giúp truy vấn thần tốc
-- =============================================================
-- Chỉ mục tìm kiếm thiệp nhanh chóng qua URL Slug
create index idx_invitations_slug on public.invitations(slug);

-- Nhắm mục tiêu truy xuất lời chúc và RSVP theo thiệp cụ thể
create index idx_rsvps_invitation_id on public.rsvps(invitation_id);
create index idx_wishes_invitation_id on public.wishes(invitation_id);

-- Chỉ mục GIN để truy vấn sâu trong JSONB cấu hình nếu có nhu cầu thống kê nâng cao
create index idx_invitations_config_gin on public.invitations using gin (config);

-- =============================================================
-- BẢO MẬT: Phân quyền Row-Level Security (RLS) của Supabase
-- =============================================================
alter table public.invitations enable row level security;
alter table public.rsvps enable row level security;
alter table public.wishes enable row level security;

-- CHÍNH SÁCH BẢNG: INVITATIONS
-- Ai cũng có thể xem thiệp cưới khi biết link (slug)
create policy "Cho phép mọi người đọc thiệp cưới qua link công khai"
on public.invitations for select
using (true);

-- Chỉ chủ sở hữu (vợ chồng/admin) mới tạo/sửa thiệp của họ
create policy "Người dùng có thể tạo thiệp cưới cho riêng mình"
on public.invitations for insert
with check (auth.uid() is not null);

create policy "Chỉ chủ sở hữu được cập nhật thiệp cưới"
on public.invitations for update
using (auth.uid() = owner_id);

create policy "Chỉ chủ sở hữu được xóa thiệp cưới"
on public.invitations for delete
using (auth.uid() = owner_id);


-- CHÍNH SÁCH BẢNG: RSVPS (Xác nhận tham dự)
-- Mọi khách xem thiệp đều có quyền gửi phản hồi RSVP
create policy "Khách truy cập được phép gửi phản hồi RSVP"
on public.rsvps for insert
with check (true);

-- Chỉ những người sở hữu thiệp cưới cụ thể mới xem được danh sách RSVP gửi đến
create policy "Chỉ chủ thiệp cưới được phép đọc danh sách RSVP"
on public.rsvps for select
using (
    exists (
        select 1 from public.invitations
        where invitations.id = rsvps.invitation_id
        and invitations.owner_id = auth.uid()
    )
);


-- CHÍNH SÁCH BẢNG: WISHES (Lời chúc sổ lưu bút)
-- Mọi người đều có thể gửi lời chúc và đọc lời lưu niệm
create policy "Mọi người đều được xem lời chúc trên thiệp"
on public.wishes for select
using (true);

create policy "Khách truy cập được phép gửi lời chúc lên thiệp"
on public.wishes for insert
with check (true);

create policy "Chỉ chủ thiệp được quyền xóa lời chúc không phù hợp"
on public.wishes for delete
using (
    exists (
        select 1 from public.invitations
        where invitations.id = wishes.invitation_id
        and invitations.owner_id = auth.uid()
    )
);

-- =============================================================
-- TRIGGER TỰ ĐỘNG CẬP NHẬT THỜI GIAN (UPDATED_AT)
-- =============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trigger_update_invitations_time
    before update on public.invitations
    for each row
    execute function public.handle_updated_at();

-- =============================================================
-- TRIGGER GIỚI HẠN TỐI ĐA 10 THIỆP CƯỚI CỦA MỖI USER (owner_id)
-- =============================================================
create or replace function public.check_user_invitation_limit()
returns trigger as $$
declare
    current_count integer;
begin
    -- Chỉ áp dụng kiểm tra khi owner_id không phải là rỗng/null
    if new.owner_id is not null then
        select count(*) into current_count
        from public.invitations
        where owner_id = new.owner_id;
        
        if current_count >= 10 then
            raise exception 'Giới hạn tối đa là 10 thiệp cưới cho mỗi tài khoản người dùng!';
        end if;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger trigger_limit_user_invitations
    before insert on public.invitations
    for each row
    execute function public.check_user_invitation_limit();
`;

export const SINGLE_TABLE_SQL = `-- -------------------------------------------------------------
-- GIẢI PHÁP ĐƠN GIẢN: Toàn bộ thông tin gộp trong 1 BẢNG (Ít khuyến khích trong môi trường sản xuất)
-- -------------------------------------------------------------

create table public.invitations_simple (
    id uuid default gen_random_uuid() primary key,
    slug text not null unique,
    owner_id uuid default auth.uid(),
    title text not null,
    
    -- Lưu trữ gộp cấu hình giao diện + danh sách rsvp + lời chúc trong 1 trường JSONB duy nhất.
    -- Ưu điểm: Chỉ cần đúng 1 dòng insert, 1 câu lệnh SQL tạo bảng.
    -- Nhược điểm: Khi có 2 khách cùng gửi RSVP hoặc viết lời chúc đồng thời, 
    --             dễ phát sinh xung đột ghi đè (Race Condition) và dung lượng tải rất lớn.
    full_data jsonb not null default '{
        "theme": {},
        "music": {},
        "couple": {},
        "events": [],
        "gallery": [],
        "blockOrder": [],
        "rsvps": [],
        "wishes": []
    }'::jsonb,
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bật RLS
alter table public.invitations_simple enable row level security;

create policy "Mọi người có thể đọc dữ liệu thiệp đơn giản"
on public.invitations_simple for select
using (true);

create policy "Cho phép cập nhật dữ liệu thiệp (cần thận trọng xung đột dữ liệu)"
on public.invitations_simple for update
using (auth.uid() = owner_id or true); -- Cho phép khách ghi gửi thêm rsvp trong json
`;

export const NEXTJS_GUIDE_MARKDOWN = `### Hướng dẫn kết nối Next.js với Supabase

Dưới đây là cách bạn có thể truy vấn dữ liệu từ bảng \`invitations\` bằng thư viện \`@supabase/supabase-js\` trong ứng dụng Next.js (Sử dụng App Router và Server Component):

\`\`\`typescript
// src/app/invitation/[slug]/page.tsx
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

interface Props {
  params: {
    slug: string
  }
}

// Khởi tạo Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function Page({ params }: Props) {
  const { slug } = params

  // 1. Tải thông tin thiệp & cấu hình chính
  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !invitation) {
    return notFound()
  }

  // 2. Tải lời chúc đi kèm (truy vấn từ bảng tách biệt hiệu năng cao)
  const { data: wishes } = await supabase
    .from('wishes')
    .select('*')
    .eq('invitation_id', invitation.id)
    .order('created_at', { ascending: false })

  const config = invitation.config // Đây là JSON chứa màu sắc, font, nhạc nền, thứ tự block, v.v...

  return (
    <main style={{ backgroundColor: config.theme.backgroundColor, color: config.theme.textColor }}>
      <header>
        <h1 style={{ fontFamily: config.theme.titleFont }}>
          {invitation.title}
        </h1>
      </header>
      
      {/* Vòng lặp kết quả theo blockOrder đã định dạng */}
      {config.blockOrder.map((blockName: string) => {
        if (blockName === 'hero') return <HeroSection heroConfig={config.couple} />;
        if (blockName === 'events') return <EventsSection eventsConfig={config.events} />;
        if (blockName === 'wishes') return <WishesSection wishes={wishes} invitationId={invitation.id} />;
        return null;
      })}
    </main>
  )
}
\`\`\`
`;
