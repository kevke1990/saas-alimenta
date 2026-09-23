-- Step 12: make audit logs append-only at the database boundary.
-- Audit records are security evidence and must not be mutable or deletable.

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Privacy erasure and explicit audit retention are the only maintenance
  -- paths. Their bypass is transaction-local and bound to the current xid by
  -- lib/audit-log-maintenance.ts; it also covers FK ON DELETE SET NULL updates.
  IF COALESCE(current_setting('alimenta.audit_log_maintenance', true), '') NOT IN (
    'erasure:' || txid_current()::text,
    'retention:' || txid_current()::text
  ) THEN
    RAISE EXCEPTION 'AuditLog records are immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_log_immutable ON "AuditLog";

CREATE TRIGGER audit_log_immutable
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();

COMMENT ON FUNCTION prevent_audit_log_mutation() IS
  'Blocks ordinary AuditLog UPDATE/DELETE. A transaction-local, xid-bound maintenance marker is reserved for privacy erasure and explicit audit retention.';
