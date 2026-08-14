# LuckyNumber V6.10.40-R2 — Mac + iPhone Cloud Sync

Cloud Sync ใช้ Supabase Data API ผ่าน RPC โดยแอปยังเป็น Local-first และเก็บข้อมูลในเครื่องเหมือนเดิม

## 1) สร้าง Supabase project

สร้าง project แล้วคัดลอก **Project URL** และ **Publishable key** (ห้ามใช้ Secret/service_role key ในแอป)

## 2) เปิด SQL Editor แล้วรัน SQL นี้ครั้งเดียว

```sql
create extension if not exists pgcrypto;

create table if not exists public.lucky_sync_state (
  sync_id text primary key,
  secret_hash text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at bigint not null,
  device text,
  schema_version integer not null default 1
);

alter table public.lucky_sync_state enable row level security;
revoke all on table public.lucky_sync_state from anon, authenticated;

create or replace function public.lucky_sync_pull(p_sync_id text, p_secret text)
returns table(payload jsonb, updated_at bigint, device text, schema_version integer)
language sql
security definer
set search_path = public
as $$
  select s.payload, s.updated_at, s.device, s.schema_version
  from public.lucky_sync_state s
  where s.sync_id = p_sync_id
    and s.secret_hash = encode(digest(p_secret, 'sha256'), 'hex')
  limit 1;
$$;

create or replace function public.lucky_sync_push(
  p_sync_id text,
  p_secret text,
  p_payload jsonb,
  p_updated_at bigint,
  p_device text,
  p_schema_version integer,
  p_expected_updated_at bigint default null
)
returns table(updated_at bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text := encode(digest(p_secret, 'sha256'), 'hex');
  v_current bigint;
begin
  select s.updated_at into v_current
  from public.lucky_sync_state s
  where s.sync_id = p_sync_id;

  if found then
    if not exists (
      select 1 from public.lucky_sync_state s
      where s.sync_id = p_sync_id and s.secret_hash = v_hash
    ) then
      raise exception 'invalid sync secret';
    end if;

    if p_expected_updated_at is not null and v_current <> p_expected_updated_at then
      raise exception 'cloud_conflict';
    end if;

    update public.lucky_sync_state s
       set payload = p_payload,
           updated_at = p_updated_at,
           device = p_device,
           schema_version = coalesce(p_schema_version, 1)
     where s.sync_id = p_sync_id;
  else
    insert into public.lucky_sync_state(sync_id, secret_hash, payload, updated_at, device, schema_version)
    values (p_sync_id, v_hash, p_payload, p_updated_at, p_device, coalesce(p_schema_version, 1));
  end if;

  return query select p_updated_at;
end;
$$;

grant execute on function public.lucky_sync_pull(text,text) to anon, authenticated;
grant execute on function public.lucky_sync_push(text,text,jsonb,bigint,text,integer,bigint) to anon, authenticated;
```

## 3) ตั้งค่าบนเครื่องหลัก

Settings → **Mac + iPhone Cloud Sync**

1. ใส่ Project URL
2. ใส่ Publishable Key
3. กด **สร้างชุดใหม่**
4. กด **Sync ตอนนี้** เพื่อส่ง History + AI + WF ของเครื่องหลักขึ้น Cloud
5. กด **Copy รหัส**

## 4) เชื่อมอีกเครื่อง

เปิดแอปเวอร์ชันเดียวกันบน iPhone/Mac → Settings → Cloud Sync

1. วางรหัสจับคู่ในช่อง “รหัสจับคู่ Mac / iPhone”
2. กด **ใช้รหัสนี้**
3. กด **Sync ตอนนี้**
4. เปิด Auto Sync ได้

รหัสจับคู่มี Project URL + Publishable key + Sync ID + secret อยู่ในตัว จึงไม่ต้องกรอกใหม่บนเครื่องที่สอง

## ความปลอดภัยของข้อมูล/AI

- Publishable key เป็น key สำหรับ client; ห้ามใช้ Secret/service_role key
- ตารางจริงถูก revoke จาก anon/authenticated และไม่มี direct table policy
- อ่าน/เขียนได้ผ่าน RPC ที่ตรวจ Sync ID + secret เท่านั้น
- Cloud payload ไม่เก็บ Cloud credentials/pairing secret ของตัวเอง
- Anti-Leak / Walk-Forward ไม่ถูกถอดออก การ Sync เป็นการย้าย state ที่ผ่านระบบเดิมระหว่างอุปกรณ์
- ถ้า Mac และ iPhone แก้ข้อมูลพร้อมกันหลัง Sync ครั้งล่าสุด ระบบขึ้น Conflict และหยุด แทนการเขียนทับเงียบ ๆ
