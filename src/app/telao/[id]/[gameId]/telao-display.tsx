"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Player = { id: string; name: string; team_id: string | null };
type GoalEvent = { id: string; player_id: string; minute: number | null };
type CardEvent = { id: string; player_id: string; card_type: string; minute: number | null };

export function TelaoDisplay({
  gameId,
  round,
  venueName,
  teamAId,
  teamAName,
  teamACrestUrl,
  teamBId,
  teamBName,
  teamBCrestUrl,
  initialScoreA,
  initialScoreB,
  initialPlayed,
  players,
  initialGoalEvents,
  initialCardEvents,
}: {
  gameId: string;
  round: string;
  venueName: string | null;
  teamAId: string;
  teamAName: string;
  teamACrestUrl: string | null;
  teamBId: string;
  teamBName: string;
  teamBCrestUrl: string | null;
  initialScoreA: number | null;
  initialScoreB: number | null;
  initialPlayed: boolean;
  players: Player[];
  initialGoalEvents: GoalEvent[];
  initialCardEvents: CardEvent[];
}) {
  const [scoreA, setScoreA] = useState(initialScoreA);
  const [scoreB, setScoreB] = useState(initialScoreB);
  const [played, setPlayed] = useState(initialPlayed);
  const [goalEvents, setGoalEvents] = useState(initialGoalEvents);
  const [cardEvents, setCardEvents] = useState(initialCardEvents);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`telao-${gameId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        (payload) => {
          const row = payload.new as { score_a: number | null; score_b: number | null; played: boolean };
          setScoreA(row.score_a);
          setScoreB(row.score_b);
          setPlayed(row.played);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goal_events", filter: `game_id=eq.${gameId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setGoalEvents((prev) => prev.filter((g) => g.id !== (payload.old as { id: string }).id));
          } else {
            const row = payload.new as GoalEvent;
            setGoalEvents((prev) => [...prev.filter((g) => g.id !== row.id), row]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "card_events", filter: `game_id=eq.${gameId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setCardEvents((prev) => prev.filter((c) => c.id !== (payload.old as { id: string }).id));
          } else {
            const row = payload.new as CardEvent;
            setCardEvents((prev) => [...prev.filter((c) => c.id !== row.id), row]);
          }
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? "?";
  const eventsFor = (teamId: string) => {
    const teamPlayerIds = new Set(players.filter((p) => p.team_id === teamId).map((p) => p.id));
    return {
      goals: goalEvents.filter((g) => teamPlayerIds.has(g.player_id)),
      cards: cardEvents.filter((c) => teamPlayerIds.has(c.player_id)),
    };
  };
  const eventsA = eventsFor(teamAId);
  const eventsB = eventsFor(teamBId);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-8 py-10 text-white">
      <div className="mb-6 flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-white/50">
        <span>{round}</span>
        {venueName && <span>· {venueName}</span>}
        <span className={connected ? "text-emerald-400" : "text-white/30"}>
          {connected ? "● ao vivo" : "○ conectando…"}
        </span>
      </div>

      <div className="grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-6">
        <TeamColumn name={teamAName} crestUrl={teamACrestUrl} goals={eventsA.goals} cards={eventsA.cards} playerName={playerName} align="right" />

        <div className="flex flex-col items-center px-6">
          <div className="font-display text-[7rem] font-black leading-none tabular-nums sm:text-[10rem]">
            {scoreA ?? 0} - {scoreB ?? 0}
          </div>
          <div className="mt-3 rounded-full border border-white/20 px-4 py-1 text-sm uppercase tracking-widest text-white/70">
            {played ? "Encerrado" : "Em andamento"}
          </div>
        </div>

        <TeamColumn name={teamBName} crestUrl={teamBCrestUrl} goals={eventsB.goals} cards={eventsB.cards} playerName={playerName} align="left" />
      </div>
    </div>
  );
}

function TeamColumn({
  name,
  crestUrl,
  goals,
  cards,
  playerName,
  align,
}: {
  name: string;
  crestUrl: string | null;
  goals: GoalEvent[];
  cards: CardEvent[];
  playerName: (id: string) => string;
  align: "left" | "right";
}) {
  const alignClass = align === "right" ? "items-end text-right" : "items-start text-left";

  return (
    <div className={`flex flex-col gap-4 ${alignClass}`}>
      <div className={`flex items-center gap-4 ${align === "right" ? "flex-row-reverse" : ""}`}>
        {crestUrl ? (
          <span className="relative h-20 w-20 shrink-0 sm:h-28 sm:w-28">
            <Image
              src={crestUrl}
              alt=""
              fill
              loading="eager"
              sizes="(min-width: 640px) 112px, 80px"
              className="rounded-full object-cover"
            />
          </span>
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl font-bold sm:h-28 sm:w-28">
            {name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide sm:text-4xl">{name}</h2>
      </div>

      {(goals.length > 0 || cards.length > 0) && (
        <ul className="space-y-1 text-sm text-white/70 sm:text-base">
          {goals.map((goal) => (
            <li key={goal.id}>
              ⚽ {playerName(goal.player_id)} {goal.minute !== null ? `${goal.minute}'` : ""}
            </li>
          ))}
          {cards.map((card) => (
            <li key={card.id}>
              {card.card_type === "red" ? "🟥" : "🟨"} {playerName(card.player_id)}{" "}
              {card.minute !== null ? `${card.minute}'` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
