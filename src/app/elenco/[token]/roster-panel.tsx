"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, EmptyState, FileInput, Input, Label, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { useConfirm } from "@/components/confirm-provider";
import { useDeleteAction } from "@/components/use-delete-action";
import { PLAYER_POSITIONS } from "@/lib/positions";
import {
  rosterAddPlayer,
  rosterDeletePlayer,
  rosterSetCoach,
  rosterSubmit,
  rosterUpdatePlayer,
} from "./actions";

const DOCUMENT_LABELS: Record<string, string> = { cpf: "CPF", rg: "RG" };
const MAX_PLAYERS = 20;

type Player = {
  id: string;
  name: string;
  number: number | null;
  position: string | null;
  document_type: string | null;
  document_number: string | null;
  birth_date: string | null;
  photo_url: string | null;
};

function PlayerFields({ player }: { player?: Player }) {
  return (
    <>
      <div className="flex-1 basis-32">
        <Label>Nome completo</Label>
        <Input name="name" required defaultValue={player?.name} placeholder="Nome completo" />
      </div>
      <div className="w-40">
        <Label>Data de nascimento</Label>
        <Input name="birth_date" type="date" required defaultValue={player?.birth_date ?? ""} />
      </div>
      <div className="flex-1 basis-32">
        <Label>Posição</Label>
        <Select name="position" required defaultValue={player?.position ?? ""}>
          <option value="" disabled>
            Selecione
          </option>
          {PLAYER_POSITIONS.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-20">
        <Label>Nº</Label>
        <Input name="number" type="number" defaultValue={player?.number ?? ""} placeholder="Nº" />
      </div>
      <div className="w-28">
        <Label>Documento</Label>
        <Select name="document_type" required defaultValue={player?.document_type ?? ""}>
          <option value="" disabled>
            Tipo
          </option>
          <option value="cpf">CPF</option>
          <option value="rg">RG</option>
        </Select>
      </div>
      <div className="flex-1 basis-32">
        <Label>Nº do documento</Label>
        <Input
          name="document_number"
          required
          defaultValue={player?.document_number ?? ""}
          placeholder="Nº do documento"
        />
      </div>
      <div className="flex-1 basis-40">
        <Label>Foto</Label>
        <FileInput name="photo" accept="image/*" />
      </div>
    </>
  );
}

function PlayerEditForm({
  token,
  player,
  onDone,
  onCancel,
}: {
  token: string;
  player: Player;
  onDone: () => void;
  onCancel: () => void;
}) {
  return (
    <ActionForm
      action={(formData) => rosterUpdatePlayer(token, player.id, formData)}
      onSuccess={onDone}
      className="flex flex-wrap items-end gap-2"
    >
      <PlayerFields player={player} />
      <SubmitButton pendingText="Salvando…">Salvar</SubmitButton>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancelar
      </Button>
    </ActionForm>
  );
}

function PlayerActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="secondary" onClick={onEdit}>
        Editar
      </Button>
      <Button type="button" variant="danger" onClick={onDelete}>
        Excluir
      </Button>
    </div>
  );
}

export function RosterPanel({
  token,
  teamName,
  crestUrl,
  coachName,
  playerCount,
  submitted,
  players,
}: {
  token: string;
  teamName: string;
  crestUrl: string | null;
  coachName: string | null;
  playerCount: number;
  submitted: boolean;
  players: Player[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const atCap = playerCount >= MAX_PLAYERS;
  const confirm = useConfirm();
  const runDelete = useDeleteAction();

  function saveProgress() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  }

  async function handleDeletePlayer(player: Player) {
    const ok = await confirm({
      title: `Excluir o jogador "${player.name}"?`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    await runDelete(() => rosterDeletePlayer(token, player.id));
  }

  async function handleSubmit() {
    const ok = await confirm({
      title: "Confirmar envio do elenco?",
      description: "Depois de enviar, não será mais possível alterar os dados do elenco.",
      confirmLabel: "Enviar",
    });
    if (!ok) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await rosterSubmit(token);
      if (!result.ok) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch {
      setError("Não foi possível enviar o elenco. Atualize a página (F5) e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          {crestUrl ? (
            <span className="relative h-10 w-10 shrink-0">
              <Image src={crestUrl} alt="" fill loading="eager" sizes="40px" className="rounded-full object-cover" />
            </span>
          ) : null}
          <div>
            <p className="font-display text-base font-bold text-foreground">{teamName}</p>
            <p className="text-xs text-muted">
              {playerCount}/{MAX_PLAYERS} jogadores
            </p>
          </div>
        </div>
        <Badge tone={submitted ? "success" : "warning"}>
          {submitted ? "Cadastro enviado" : "Em preenchimento"}
        </Badge>
      </Card>

      {submitted && (
        <p className="text-sm text-muted">
          O cadastro deste time já foi enviado e não pode mais ser alterado por
          aqui. Se precisar corrigir algo, peça ao organizador um novo link.
        </p>
      )}

      <div>
        <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-foreground">
          Técnico
        </h2>
        {submitted ? (
          <p className="text-sm text-foreground">{coachName ?? "Sem técnico informado."}</p>
        ) : (
          <ActionForm
            action={(formData) => rosterSetCoach(token, formData)}
            className="flex flex-wrap items-end gap-2"
          >
            <div className="flex-1 basis-48">
              <Label>Nome completo do técnico</Label>
              <Input name="coach_name" defaultValue={coachName ?? ""} placeholder="Nome completo" />
            </div>
            <SubmitButton pendingText="Salvando…">Salvar técnico</SubmitButton>
          </ActionForm>
        )}
      </div>

      <div>
        <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-foreground">
          Jogadores
        </h2>

        {!submitted && (
          <Card className="mb-4 p-4">
            {atCap ? (
              <p className="text-sm text-muted">
                Elenco completo — máximo de {MAX_PLAYERS} jogadores por time.
              </p>
            ) : (
              <ActionForm
                action={(formData) => rosterAddPlayer(token, formData)}
                className="flex flex-wrap items-end gap-2"
              >
                <PlayerFields />
                <SubmitButton pendingText="Adicionando…">Adicionar jogador</SubmitButton>
              </ActionForm>
            )}
          </Card>
        )}

        {players.length === 0 ? (
          <EmptyState>Nenhum jogador cadastrado ainda.</EmptyState>
        ) : (
          <>
            {/* Desktop: tabela */}
            <Card className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[48rem] text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-3 py-2">Foto</th>
                    <th className="px-3 py-2">Jogador</th>
                    <th className="px-3 py-2">Nascimento</th>
                    <th className="px-3 py-2">Nº</th>
                    <th className="px-3 py-2">Posição</th>
                    <th className="px-3 py-2">Documento</th>
                    {!submitted && <th className="w-36 px-3 py-2 text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id} className="border-b border-border last:border-0">
                      {editingId === player.id ? (
                        <td colSpan={7} className="px-3 py-2">
                          <PlayerEditForm
                            token={token}
                            player={player}
                            onDone={() => setEditingId(null)}
                            onCancel={() => setEditingId(null)}
                          />
                        </td>
                      ) : (
                        <>
                          <td className="px-3 py-2">
                            {player.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={player.photo_url}
                                alt=""
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-medium text-foreground">{player.name}</td>
                          <td className="px-3 py-2 text-muted">
                            {player.birth_date
                              ? new Date(`${player.birth_date}T00:00:00`).toLocaleDateString("pt-BR")
                              : "—"}
                          </td>
                          <td className="px-3 py-2 text-muted">{player.number ?? "—"}</td>
                          <td className="px-3 py-2">
                            {player.position ? <Badge>{player.position}</Badge> : "—"}
                          </td>
                          <td className="px-3 py-2 text-muted">
                            {player.document_type
                              ? `${DOCUMENT_LABELS[player.document_type] ?? player.document_type}: ${player.document_number}`
                              : "—"}
                          </td>
                          {!submitted && (
                            <td className="px-3 py-2">
                              <PlayerActions
                                onEdit={() => setEditingId(player.id)}
                                onDelete={() => handleDeletePlayer(player)}
                              />
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Mobile: cards empilhados */}
            <div className="flex flex-col gap-3 sm:hidden">
              {players.map((player) => (
                <Card key={player.id} className="p-3">
                  {editingId === player.id ? (
                    <PlayerEditForm
                      token={token}
                      player={player}
                      onDone={() => setEditingId(null)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <div className="mb-2 flex items-center gap-3">
                        {player.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={player.photo_url}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-medium text-foreground">{player.name}</span>
                            {player.position && <Badge>{player.position}</Badge>}
                          </div>
                        </div>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted">
                        <dt>Nº</dt>
                        <dd className="text-right text-foreground">{player.number ?? "—"}</dd>
                        <dt>Nascimento</dt>
                        <dd className="text-right text-foreground">
                          {player.birth_date
                            ? new Date(`${player.birth_date}T00:00:00`).toLocaleDateString("pt-BR")
                            : "—"}
                        </dd>
                        <dt>Documento</dt>
                        <dd className="text-right text-foreground">
                          {player.document_type
                            ? `${DOCUMENT_LABELS[player.document_type] ?? player.document_type}: ${player.document_number}`
                            : "—"}
                        </dd>
                      </dl>
                      {!submitted && (
                        <div className="mt-2">
                          <PlayerActions
                            onEdit={() => setEditingId(player.id)}
                            onDelete={() => handleDeletePlayer(player)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {!submitted && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          {error && <p className="w-full text-sm text-danger">{error}</p>}
          <Button type="button" variant="secondary" onClick={saveProgress}>
            {saved ? "Dados salvos!" : "Salvar dados"}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Enviando…" : "Enviar cadastro"}
          </Button>
          <p className="text-xs text-muted">
            &quot;Salvar dados&quot; só confirma que tudo já está salvo — você pode
            fechar esta página e voltar por este mesmo link quando quiser. Ao
            clicar em &quot;Enviar cadastro&quot;, não será mais possível editar.
          </p>
        </div>
      )}
    </div>
  );
}
