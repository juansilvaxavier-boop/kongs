"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/toast-provider";
import { loadImageAsPngDataUrl } from "@/lib/pdf-image";

const DOCUMENT_LABELS: Record<string, string> = { cpf: "CPF", rg: "RG" };

type RosterPlayer = {
  name: string;
  position: string | null;
  birth_date: string | null;
  document_type: string | null;
  document_number: string | null;
};

function formatBirthDate(birthDate: string | null) {
  if (!birthDate) return "—";
  return new Date(`${birthDate}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatDocument(player: RosterPlayer) {
  if (!player.document_type || !player.document_number) return "—";
  const label = DOCUMENT_LABELS[player.document_type] ?? player.document_type;
  return `${label}: ${player.document_number}`;
}

const ORGANIZATION_NAME = "Pedro Henrique Alves Figueredo";
const ORGANIZATION_CPF = "496.479.318-40";

const PAGE_HEIGHT = 297;
const MARGIN_BOTTOM = 20;
const MARGIN_LEFT = 14;
const CONTENT_WIDTH = 182;
const LINE_HEIGHT = 5;

const CLAUSES = [
  {
    title: "Cláusula 1 — Inscrição",
    body: "O valor total da inscrição da equipe é de R$ 600,00 (seiscentos reais) por time.",
  },
  {
    title: "Cláusula 2 — Pagamento",
    body: "A equipe deve efetuar o pagamento integral de R$ 600,00 antes do início do campeonato, ou um pagamento parcial mínimo de R$ 300,00 (trezentos reais) antes do início do campeonato, quitando o saldo restante no prazo da Cláusula 3.",
  },
  {
    title: "Cláusula 3 — Prazo final",
    body: "Todo saldo pendente deverá ser integralmente quitado até o dia 10 de setembro de 2026.",
  },
  {
    title: "Cláusula 4 — Multa por atraso",
    body: "A cada 5 (cinco) dias corridos de atraso no pagamento do saldo devedor, será acrescido o valor de R$ 20,00 (vinte reais) ao total devido.",
  },
  {
    title: "Cláusula 5 — Formas de pagamento",
    body: "São aceitos como forma de pagamento: Pix ou Cartão de Crédito.",
  },
  {
    title: "Cláusula 6 — Desistência",
    body: "Em caso de desistência da equipe participante, por qualquer motivo, após a efetivação da inscrição e/ou a realização de qualquer pagamento, não haverá devolução dos valores já pagos.",
  },
  {
    title: "Cláusula 7 — Veracidade dos dados",
    body: "A equipe declara que os dados do técnico e dos jogadores relacionados neste contrato são verdadeiros e de sua inteira responsabilidade.",
  },
];

export function ContractPdfButton({
  championshipName,
  teamName,
  crestUrl,
  coachName,
  players,
}: {
  championshipName: string;
  teamName: string;
  crestUrl: string | null;
  coachName: string | null;
  players: RosterPlayer[];
}) {
  const [pending, setPending] = useState(false);
  const toast = useToast();

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const { jsPDF } = await import("jspdf");
          const { default: autoTable } = await import("jspdf-autotable");
          const doc = new jsPDF();

          const logoDataUrl = crestUrl ? await loadImageAsPngDataUrl(crestUrl) : null;
          const textX = logoDataUrl ? 40 : MARGIN_LEFT;

          if (logoDataUrl) {
            doc.addImage(logoDataUrl, "PNG", MARGIN_LEFT, 10, 20, 20);
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(15);
          doc.text("CONTRATO OFICIAL DE INSCRIÇÃO", textX, 17);
          doc.text(championshipName.toUpperCase(), textX, 24);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(`Time: ${teamName}`, textX, 31);
          doc.text(`Técnico: ${coachName ?? "—"}`, textX, 36);

          let y = 46;

          const preamble = doc.splitTextToSize(
            `Pelo presente instrumento particular, a organização do ${championshipName}, representada por ${ORGANIZATION_NAME} (CPF: ${ORGANIZATION_CPF}), e a equipe "${teamName}", representada por seu técnico ${coachName ?? "responsável indicado"}, ajustam entre si o presente contrato de inscrição, mediante as cláusulas a seguir.`,
            CONTENT_WIDTH
          );
          doc.setFontSize(9.5);
          doc.text(preamble, MARGIN_LEFT, y);
          y += preamble.length * LINE_HEIGHT + 6;

          for (const clause of CLAUSES) {
            const bodyLines = doc.splitTextToSize(clause.body, CONTENT_WIDTH);
            const needed = LINE_HEIGHT + bodyLines.length * LINE_HEIGHT + 3;
            if (y + needed > PAGE_HEIGHT - MARGIN_BOTTOM) {
              doc.addPage();
              y = 20;
            }
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(clause.title, MARGIN_LEFT, y);
            y += LINE_HEIGHT;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9.5);
            doc.text(bodyLines, MARGIN_LEFT, y);
            y += bodyLines.length * LINE_HEIGHT + 4;
          }

          if (y + 18 > PAGE_HEIGHT - MARGIN_BOTTOM) {
            doc.addPage();
            y = 20;
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text("Responsável pela organização", MARGIN_LEFT, y);
          y += LINE_HEIGHT;
          doc.setFont("helvetica", "normal");
          doc.text(`${ORGANIZATION_NAME} — CPF: ${ORGANIZATION_CPF}`, MARGIN_LEFT, y);
          y += 10;

          autoTable(doc, {
            startY: y,
            margin: { left: MARGIN_LEFT, right: MARGIN_LEFT },
            head: [["Elenco", "Posição", "Data de nascimento", "Documento"]],
            body: players.map((player) => [
              player.name,
              player.position ?? "—",
              formatBirthDate(player.birth_date),
              formatDocument(player),
            ]),
            styles: { fontSize: 8.5 },
          });

          const afterTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
            .finalY;
          let signY = afterTable + 20;
          if (signY + 20 > PAGE_HEIGHT - MARGIN_BOTTOM) {
            doc.addPage();
            signY = 30;
          }

          doc.setFontSize(9);
          doc.line(MARGIN_LEFT, signY, MARGIN_LEFT + 80, signY);
          doc.text("Responsável pela organização", MARGIN_LEFT, signY + 5);
          doc.line(MARGIN_LEFT + 100, signY, MARGIN_LEFT + 180, signY);
          doc.text(`Responsável pelo time — ${teamName}`, MARGIN_LEFT + 100, signY + 5);

          doc.setFontSize(8);
          doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, MARGIN_LEFT, PAGE_HEIGHT - 10);

          doc.save(`contrato-${teamName}.pdf`);
        } catch {
          toast.error("Não foi possível gerar o contrato. Tente novamente.");
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Gerando…" : "Gerar contrato (PDF)"}
    </Button>
  );
}
