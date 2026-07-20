-- audit_log precisa manter o championship_id mesmo depois que o
-- campeonato é excluído. O trigger AFTER DELETE em championships
-- tentava inserir uma linha referenciando o campeonato que, na
-- mesma transação, já tinha acabado de ser removido — violando a
-- FK. Um log de auditoria não deve ter integridade referencial
-- com a entidade que está auditando.
alter table public.audit_log drop constraint if exists audit_log_championship_id_fkey;
