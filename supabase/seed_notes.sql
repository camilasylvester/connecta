-- Admin is granted automatically for authorized emails in code
-- (src/lib/admin-emails.ts). Current: camilasylvester@gmail.com
--
-- Optional extra emails via env:
-- ADMIN_EMAILS=otro@email.com

insert into admin_allowlist (email) values ('camilasylvester@gmail.com')
on conflict do nothing;

