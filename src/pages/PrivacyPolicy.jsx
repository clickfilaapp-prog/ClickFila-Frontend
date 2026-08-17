import React from "react";
import { ArrowLeft, Scissors, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";

export default function PrivacyPolicy() {
  return (
    <div className="privacy-page">
      <header className="privacy-header">
        <Link className="brand" to="/" aria-label="Ir para o início">
          <span className="brand-mark"><Scissors size={21} /></span>
          <span>Click <i>Fila</i></span>
        </Link>
        <Link className="privacy-back" to="/">
          <ArrowLeft size={16} /> Voltar ao sistema
        </Link>
      </header>

      <main className="privacy-main">
        <article className="privacy-card">
          <div className="privacy-title">
            <span><ShieldCheck size={26} /></span>
            <div>
              <small>Privacidade e proteção de dados</small>
              <h1>Política de Privacidade</h1>
              <p>Última atualização: 17 de agosto de 2026.</p>
            </div>
          </div>

          <p>
            O Click Fila respeita a sua privacidade e trata dados pessoais com
            transparência, segurança e de acordo com a Lei Geral de Proteção de
            Dados Pessoais — LGPD (Lei nº 13.709/2018). Esta Política explica
            como os dados são utilizados durante o acesso e o uso do sistema.
          </p>

          <section>
            <h2>1. A quem esta Política se aplica</h2>
            <p>
              Esta Política se aplica aos clientes, profissionais da beleza e
              demais pessoas que acessam o Click Fila, criam uma conta,
              participam de filas ou utilizam as funcionalidades disponíveis.
            </p>
          </section>

          <section>
            <h2>2. Quais dados podemos tratar</h2>
            <ul>
              <li><strong>Dados de cadastro:</strong> nome, e-mail e telefone.</li>
              <li><strong>Dados profissionais:</strong> nome do negócio ou estabelecimento.</li>
              <li><strong>Dados de autenticação:</strong> credenciais protegidas, token de acesso, perfil da conta e informações do login social, quando utilizado.</li>
              <li><strong>Dados da fila:</strong> código da fila, posição, horários, status de espera e registros relacionados ao atendimento.</li>
              <li><strong>Dados técnicos:</strong> endereço IP, navegador, dispositivo, registros de acesso e informações necessárias à segurança e ao funcionamento do serviço.</li>
              <li><strong>Preferências locais:</strong> identificadores de sessão da fila e preferências de notificação armazenados no navegador.</li>
            </ul>
            <p>
              A senha é utilizada para autenticação e deve ser armazenada pelo
              serviço de forma protegida. O Click Fila não solicita dados
              pessoais sensíveis para o funcionamento normal da plataforma.
            </p>
          </section>

          <section>
            <h2>3. Para que usamos os dados</h2>
            <ul>
              <li>Criar, identificar, autenticar e proteger a conta.</li>
              <li>Permitir a recuperação de acesso e a alteração de senha.</li>
              <li>Criar e administrar filas e acompanhar atendimentos em tempo real.</li>
              <li>Exibir aos clientes informações necessárias sobre o estabelecimento e a fila.</li>
              <li>Enviar notificações relacionadas à posição e ao andamento do atendimento, quando autorizadas.</li>
              <li>Prestar suporte, prevenir fraudes, investigar falhas e manter a segurança do sistema.</li>
              <li>Cumprir obrigações legais e exercer direitos em processos judiciais, administrativos ou arbitrais.</li>
              <li>Aprimorar o desempenho e as funcionalidades com dados agregados ou anonimizados, quando possível.</li>
            </ul>
          </section>

          <section>
            <h2>4. Bases legais</h2>
            <p>
              Conforme a finalidade, o tratamento poderá se basear no
              consentimento, na execução do serviço solicitado ou de
              procedimentos relacionados a ele, no cumprimento de obrigação
              legal ou regulatória, no legítimo interesse e no exercício
              regular de direitos, nos termos da LGPD.
            </p>
          </section>

          <section>
            <h2>5. Compartilhamento de dados</h2>
            <p>
              Os dados poderão ser tratados por provedores de infraestrutura,
              hospedagem, autenticação, comunicação e suporte estritamente para
              viabilizar o Click Fila. Informações necessárias ao atendimento
              também poderão ser compartilhadas entre o cliente e o
              profissional responsável pela fila em que o cliente ingressar.
            </p>
            <p>
              Poderemos compartilhar informações quando exigido por lei, ordem
              judicial ou autoridade competente, ou para proteger direitos e a
              segurança dos usuários. Não comercializamos dados pessoais.
            </p>
          </section>

          <section>
            <h2>6. Armazenamento local e notificações</h2>
            <p>
              O navegador pode armazenar o token e o perfil da sessão,
              identificadores temporários da fila e preferências de
              notificação. Esses dados ajudam a manter o acesso e o
              acompanhamento do atendimento. Você pode apagar esses registros
              nas configurações do navegador, mas algumas funções podem deixar
              de funcionar até um novo acesso.
            </p>
            <p>
              Notificações do dispositivo somente são utilizadas após a
              permissão correspondente e podem ser desativadas nas
              configurações do navegador ou do aparelho.
            </p>
          </section>

          <section>
            <h2>7. Segurança da informação</h2>
            <p>
              Adotamos medidas técnicas e administrativas destinadas a impedir
              acessos não autorizados e situações acidentais ou ilícitas de
              destruição, perda, alteração ou divulgação. Nenhum sistema é
              totalmente imune a riscos; em caso de incidente que possa causar
              risco ou dano relevante, serão adotadas as comunicações exigidas
              pela legislação aplicável.
            </p>
          </section>

          <section>
            <h2>8. Retenção, exclusão e reativação da conta</h2>
            <p>
              Os dados são mantidos pelo período necessário para cumprir as
              finalidades desta Política, prestar o serviço e atender
              obrigações legais ou o exercício regular de direitos.
            </p>
            <p>
              Ao solicitar a exclusão no painel de configurações, a conta é
              desativada e permanece em processo de exclusão por 30 dias. Nesse
              período, você pode cancelar a exclusão: basta entrar novamente
              com as mesmas credenciais e confirmar a reativação. Depois do
              prazo, os dados serão eliminados ou anonimizados, ressalvadas as
              hipóteses de conservação autorizadas ou exigidas pelo artigo 16
              da LGPD.
            </p>
          </section>

          <section>
            <h2>9. Seus direitos</h2>
            <p>Nos termos da LGPD, você pode solicitar, quando aplicável:</p>
            <ul>
              <li>confirmação da existência de tratamento e acesso aos dados;</li>
              <li>correção de informações incompletas, inexatas ou desatualizadas;</li>
              <li>anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
              <li>portabilidade, observadas as normas aplicáveis e os segredos comercial e industrial;</li>
              <li>informação sobre compartilhamentos realizados;</li>
              <li>revogação do consentimento e informação sobre suas consequências;</li>
              <li>revisão de decisões tomadas unicamente com base em tratamento automatizado, quando aplicável.</li>
            </ul>
            <p>
              Para proteger os dados, poderemos solicitar a confirmação da sua
              identidade antes de atender a um pedido. A atualização de dados,
              alteração de senha e exclusão da conta também estão disponíveis
              no painel de configurações.
            </p>
          </section>

          <section>
            <h2>10. Alterações e contato</h2>
            <p>
              Esta Política poderá ser atualizada para refletir mudanças no
              sistema, na legislação ou nas práticas de tratamento. A data da
              versão mais recente será sempre indicada no início da página.
            </p>
            <p>
              Dúvidas e solicitações sobre privacidade podem ser encaminhadas
              pelos canais oficiais de atendimento disponibilizados pelo Click
              Fila. A identificação do responsável e os dados de contato serão
              informados nesses canais quando necessários ao atendimento.
            </p>
          </section>

          <section>
            <h2>11. Planos, funcionalidades pagas e cobranças</h2>
            <p>
              O Click Fila poderá oferecer planos, recursos ou funcionalidades
              pagas. Quando houver cobrança, o preço, a periodicidade, as
              condições de pagamento e as regras de cancelamento serão
              apresentados de forma clara antes da contratação.
            </p>
            <p>
              Nenhuma cobrança será realizada sem a confirmação do usuário.
              Caso sejam utilizados serviços de pagamento de terceiros, os
              dados necessários à transação poderão ser tratados pelo provedor
              responsável, conforme os termos e a política de privacidade desse
              serviço e a legislação aplicável.
            </p>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
