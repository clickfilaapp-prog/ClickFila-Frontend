import React from "react";
import { ArrowLeft, FileCheck2 } from "lucide-react";
import { Link } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";

export default function TermsOfUse() {
  return (
    <div className="privacy-page">
      <header className="privacy-header">
        <Link className="brand" to="/" aria-label="Ir para o início">
          <span className="brand-mark"><img src="/favicon.png" alt="" /></span>
          <span>Click <i>Fila</i></span>
        </Link>
        <Link className="privacy-back" to="/">
          <ArrowLeft size={16} /> Voltar ao sistema
        </Link>
      </header>

      <main className="privacy-main">
        <article className="privacy-card">
          <div className="privacy-title">
            <span><FileCheck2 size={26} /></span>
            <div>
              <small>Regras de utilização do sistema</small>
              <h1>Termos de Uso</h1>
              <p>Última atualização: 17 de agosto de 2026.</p>
            </div>
          </div>

          <p>
            Estes Termos estabelecem as regras para utilização do Click Fila.
            Ao criar uma conta ou utilizar o sistema, você declara que leu e
            concorda com estas condições e com a nossa{" "}
            <Link to="/politica-de-privacidade">Política de Privacidade</Link>.
          </p>

          <section>
            <h2>1. Sobre o Click Fila</h2>
            <p>
              O Click Fila é uma ferramenta tecnológica que permite a
              profissionais e estabelecimentos organizar filas virtuais e aos
              clientes acompanhar sua posição e o andamento do atendimento.
            </p>
          </section>

          <section>
            <h2>2. Cadastro e credenciais</h2>
            <p>
              O usuário deve fornecer informações verdadeiras, completas e
              atualizadas. Ele é responsável por proteger sua senha e por todas
              as ações realizadas em sua conta. Ao utilizar o login do Google,
              a segurança dessa etapa também depende da conta Google do próprio
              usuário.
            </p>
            <p>
              Qualquer suspeita de acesso indevido deve ser comunicada pelos
              canais oficiais de atendimento do Click Fila.
            </p>
          </section>

          <section>
            <h2>3. Regras da fila virtual</h2>
            <ul>
              <li>Cada usuário pode ocupar somente um lugar em uma fila ativa por vez.</li>
              <li>Ao entrar na fila, o cliente deve acompanhar sua posição e estar presente ou próximo ao estabelecimento quando sua vez se aproximar.</li>
              <li>O estabelecimento pode definir um período de tolerância para o comparecimento.</li>
              <li>Se o cliente for chamado e não comparecer dentro da tolerância, ou acumular chamadas perdidas, sua participação poderá ser cancelada e será necessário entrar novamente no final da fila.</li>
              <li>O ingresso na fila não representa reserva de horário nem garantia de atendimento em um momento exato.</li>
            </ul>
          </section>

          <section>
            <h2>4. Estimativas de espera</h2>
            <p>
              A posição e o tempo de espera apresentados são estimativas. O
              tempo real pode variar conforme a duração e a complexidade dos
              atendimentos anteriores, pausas, disponibilidade do profissional,
              ocorrências no estabelecimento e outros fatores operacionais.
            </p>
          </section>

          <section>
            <h2>5. Uso aceitável</h2>
            <p>O usuário concorda em utilizar o sistema somente para suas finalidades legítimas. É proibido:</p>
            <ul>
              <li>fornecer dados falsos ou utilizar a identidade de terceiros;</li>
              <li>ocupar lugares de forma artificial ou comercializar posições na fila;</li>
              <li>criar contas ou acessos para fraudar limites e regras do sistema;</li>
              <li>interferir no funcionamento, testar vulnerabilidades sem autorização ou tentar obter acesso indevido;</li>
              <li>utilizar o Click Fila para assédio, discriminação, ameaças, conflitos ou qualquer atividade ilegal.</li>
            </ul>
          </section>

          <section>
            <h2>6. Suspensão e encerramento</h2>
            <p>
              O Click Fila ou o estabelecimento poderá restringir ou suspender
              contas que violem estes Termos, fraudem o sistema, forneçam dados
              falsos, prejudiquem outros usuários ou faltem repetidamente de
              forma intencional. Violações graves ou atividades ilegais poderão
              resultar no bloqueio definitivo da conta, sem prejuízo das
              medidas legais cabíveis.
            </p>
          </section>

          <section>
            <h2>7. Responsabilidades do profissional</h2>
            <p>
              O profissional ou estabelecimento é responsável pelas
              informações da sua fila, pela organização do atendimento, pelos
              serviços anunciados e prestados, pelo relacionamento com os
              clientes e pelo cumprimento das normas aplicáveis à sua atividade.
            </p>
          </section>

          <section>
            <h2>8. Isenção de responsabilidade</h2>
            <p>
              O Click Fila atua exclusivamente como ferramenta tecnológica de
              organização e acompanhamento de filas. Não prestamos os serviços
              oferecidos pelos profissionais e não nos responsabilizamos pela
              qualidade ou execução desses serviços, atrasos, alterações no
              tempo de espera, indisponibilidade do profissional ou conflitos
              ocorridos no estabelecimento físico.
            </p>
            <p>
              Empregaremos esforços razoáveis para manter o sistema disponível,
              mas podem ocorrer interrupções por manutenção, falhas de internet,
              serviços de terceiros ou eventos fora do nosso controle.
            </p>
          </section>

          <section>
            <h2>9. Planos e cobranças</h2>
            <p>
              O Click Fila poderá oferecer planos ou funcionalidades pagas. Os
              preços, a periodicidade, as condições de pagamento, renovação e
              cancelamento serão informados antes da contratação. Nenhuma
              cobrança será realizada sem a confirmação do usuário.
            </p>
          </section>

          <section>
            <h2>10. Privacidade</h2>
            <p>
              O tratamento de dados pessoais relacionado ao uso do sistema é
              descrito na{" "}
              <Link to="/politica-de-privacidade">Política de Privacidade</Link>,
              que integra estes Termos.
            </p>
          </section>

          <section>
            <h2>11. Alterações e contato</h2>
            <p>
              Estes Termos poderão ser atualizados para refletir mudanças no
              sistema, no modelo de negócio ou na legislação. A versão vigente
              estará disponível nesta página. Dúvidas podem ser encaminhadas
              pelos canais oficiais de atendimento disponibilizados pelo Click
              Fila.
            </p>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
