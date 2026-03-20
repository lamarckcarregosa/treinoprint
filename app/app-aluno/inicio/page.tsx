import SectionCard from "@/components/common/SectionCard";
import StatusBadge from "@/components/common/StatusBadge";

export default function AppAlunoInicioPage() {
  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-zinc-200" />

          <div className="flex-1">
            <h2 className="text-2xl font-bold">Lamarck Carregosa Araujo</h2>
            <p className="text-sm text-zinc-500">Plano: Mensal</p>
            <div className="mt-2">
              <StatusBadge label="Ativo" variant="success" />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Resumo"
        rightContent={<StatusBadge label="Em dia" variant="success" />}
      >
        <div className="space-y-2 text-sm text-zinc-600">
          <p><strong>Objetivo:</strong> Emagrecimento</p>
          <p><strong>Peso meta:</strong> 100 kg</p>
          <p><strong>Frequência ideal:</strong> 4x por semana</p>
        </div>
      </SectionCard>

      <SectionCard
        title="Treino atual"
        rightContent={<a href="/app-aluno/treinos" className="text-sm font-semibold">Ver treino</a>}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold">Treino E - Semana 1</span>
            <StatusBadge label="Personalizado" variant="info" />
          </div>

          <p className="text-sm text-zinc-600"><strong>Personal:</strong> Ana Ribeiro</p>
          <p className="text-sm text-zinc-600"><strong>Atualizado em:</strong> 17/03/2026</p>
          <p className="text-sm text-zinc-600"><strong>Objetivo:</strong> Emagrecimento</p>

          <div className="pt-2">
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
              <span>0 de 8 exercícios concluídos</span>
              <span>0%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-200">
              <div className="h-2 w-0 rounded-full bg-black" />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Última avaliação"
        rightContent={<a href="/app-aluno/avaliacoes" className="text-sm font-semibold">Ver avaliações</a>}
      >
        <div className="space-y-2 text-sm text-zinc-600">
          <p><strong>Data:</strong> 13/03/2026</p>
          <p><strong>Peso:</strong> 110 kg</p>
          <p><strong>Gordura:</strong> 0%</p>
          <p><strong>IMC:</strong> 0</p>
        </div>
      </SectionCard>

      <SectionCard
        title="Mensalidade"
        rightContent={<a href="/app-aluno/financeiro" className="text-sm font-semibold">Ver financeiro</a>}
      >
        <div className="space-y-2 text-sm text-zinc-600">
          <p><strong>Competência:</strong> 03/2026</p>
          <p><strong>Vencimento:</strong> 25/03/2026</p>
          <div className="pt-1">
            <StatusBadge label="Pendente" variant="warning" />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}