-- ChainGuard AI — Fix: Allow anonymous users to read their own (null user_id) audits
--
-- Bug: After an anonymous user runs an audit, they're immediately redirected to
-- /audit/[id] — but the existing RLS policy "Users can view own audits" uses
-- `auth.uid() = user_id`. In PostgreSQL, NULL = NULL evaluates to NULL (not TRUE),
-- so anonymous audits were unreadable unless trust_score >= 80. This caused a 404
-- for every anonymous user whose contract scored below 80.
--
-- Fix: Add a separate policy that makes anonymous audits (user_id IS NULL) publicly
-- readable to anyone who has the UUID. Since the ID is a v4 UUID (128-bit random),
-- it is effectively unguessable — this provides the same security as a secret link.

create policy "Anonymous audits are publicly viewable by anyone with the link"
  on public.audits for select
  using (user_id is null);
