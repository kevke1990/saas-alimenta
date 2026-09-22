-- Step 12: make audit logs append-only at the database boundary.
-- Audit records are security evidence and must not be mutable or deletable.

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog records are immutable';
END;
$$;

DROP TRIGGER IF EXISTS audit_log_immutable ON "AuditLog";

CREATE TRIGGER audit_log_immutable
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();
