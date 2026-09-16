import React, { useEffect, useRef, useState } from "react";
import { BellRing, CheckCircle2, Play, Power, Search, Share2, Ticket, UserRoundCheck, X } from "lucide-react";

const TUTORIALS = {
  USER: {
    eyebrow: "TUTORIAL DO CLIENTE",
    title: "Como acompanhar sua vez",
    slides: [
      { icon: Ticket, selector: '[data-tour="client-ticket-search"]', title: "Receba o ticket", text: "O estabelecimento enviará ou mostrará um código, como BAR123. Digite esse ticket no campo destacado.", hint: "Peça o código da fila ao profissional." },
      { icon: Search, selector: '[data-tour="client-ticket-search"]', title: "Pesquise a fila", text: "Depois de digitar o ticket, toque em Buscar fila para conferir o estabelecimento e se a fila está aberta.", hint: "Confira o nome antes de continuar." },
      { icon: UserRoundCheck, selector: '[data-tour="client-join"]', title: "Entre na fila", text: "Quando uma fila já estiver localizada, informe o serviço desejado e confirme sua entrada.", hint: "Esta área aparecerá depois que você pesquisar um ticket válido." },
      { icon: BellRing, title: "Permita as notificações", text: "Ative as notificações para receber avisos importantes, mesmo quando estiver em outra tela.", hint: "Se preferir, você também pode acompanhar todas as atualizações diretamente pela tela da fila." },
      { icon: Play, selector: '[data-tour="client-status"]', title: "Aguarde seu chamado", text: "Depois de entrar, esta área mostrará sua posição e avisará quando o profissional chamar você.", hint: "A área de acompanhamento aparece somente quando você está em uma fila." },
      { icon: CheckCircle2, selector: '[data-tour="client-status"]', title: "Conclua o atendimento", text: "O mesmo painel mostrará quando o serviço começar e terminar, além das opções disponíveis.", hint: "Todo o andamento fica registrado pelo sistema." },
    ],
  },
  PROFESSIONAL: {
    eyebrow: "TUTORIAL DO PROFISSIONAL",
    title: "Como administrar sua fila",
    slides: [
      { icon: Power, selector: '[data-tour="professional-toggle-queue"]', title: "Abra a fila", text: "Use o botão destacado para abrir ou fechar a fila. Novos clientes entram somente quando ela está aberta.", hint: "Ao fechar, quem já entrou permanece na lista." },
      { icon: Share2, selector: '[data-tour="professional-ticket"]', title: "Envie o ticket ao cliente", text: "Este é o código da sua fila. Mostre ou envie o ticket ao cliente para que ele encontre o estabelecimento.", hint: "O código pode ser alterado nas configurações." },
      { icon: Ticket, selector: ".waiting-list, .management", title: "Receba os clientes", text: "Quando o cliente usar o ticket e entrar, ele aparecerá automaticamente na lista de espera.", hint: "As atualizações acontecem em tempo real." },
      { icon: UserRoundCheck, selector: '[data-tour="professional-service"]', title: "Chame e atenda", text: "Nesta área você chama o próximo cliente e inicia o atendimento.", hint: "O cliente será avisado sempre que houver uma atualização importante no atendimento." },
      { icon: CheckCircle2, selector: '[data-tour="professional-service"]', title: "Finalize o serviço", text: "Use o painel de atendimento para finalizar, cancelar ou recolocar um cliente na fila.", hint: "Mantenha os atendimentos atualizados para organizar a fila." },
    ],
  },
};

export default function SystemTutorialModal({
  role,
  onClose,
  isCompleting = false,
}) {
  const tutorial = TUTORIALS[role] || TUTORIALS.USER;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipHeight, setTooltipHeight] = useState(460);
  const tooltipRef = useRef(null);
  const slide = tutorial.slides[currentSlide];
  const SlideIcon = slide.icon;
  const isLastSlide = currentSlide === tutorial.slides.length - 1;

  useEffect(() => setCurrentSlide(0), [role]);

  useEffect(() => {
    function updateTarget() {
      const target = slide.selector
        ? document.querySelector(slide.selector)
        : null;
      if (!target) {
        setTargetRect(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }
    updateTarget();
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);
    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [slide]);

  useEffect(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return undefined;
    const updateHeight = () => setTooltipHeight(tooltip.offsetHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(tooltip);
    return () => observer.disconnect();
  }, [currentSlide, role]);

  const tooltipWidth = Math.min(390, window.innerWidth - 24);
  const safeTooltipHeight = Math.min(tooltipHeight, window.innerHeight - 24);
  const gap = 18;
  let placement = "centered";
  let tooltipLeft = (window.innerWidth - tooltipWidth) / 2;
  let tooltipTop = (window.innerHeight - safeTooltipHeight) / 2;

  if (targetRect) {
    const targetRight = targetRect.left + targetRect.width;
    const roomRight = window.innerWidth - targetRight;
    const roomLeft = targetRect.left;
    if (roomRight >= tooltipWidth + gap + 12) {
      placement = "points-left";
      tooltipLeft = targetRight + gap;
      tooltipTop = targetRect.top + targetRect.height / 2 - safeTooltipHeight / 2;
    } else if (roomLeft >= tooltipWidth + gap + 12) {
      placement = "points-right";
      tooltipLeft = targetRect.left - tooltipWidth - gap;
      tooltipTop = targetRect.top + targetRect.height / 2 - safeTooltipHeight / 2;
    } else if (targetRect.top >= safeTooltipHeight + gap + 12) {
      placement = "points-down";
      tooltipTop = targetRect.top - safeTooltipHeight - gap;
    } else {
      placement = "points-up";
      tooltipTop = targetRect.top + targetRect.height + gap;
    }
    tooltipLeft = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, tooltipLeft));
    tooltipTop = Math.max(12, Math.min(window.innerHeight - safeTooltipHeight - 12, tooltipTop));
  }

  const arrowLeft = targetRect
    ? Math.max(24, Math.min(tooltipWidth - 24, targetRect.left + targetRect.width / 2 - tooltipLeft))
    : tooltipWidth / 2;
  const arrowTop = targetRect
    ? Math.max(24, Math.min(safeTooltipHeight - 24, targetRect.top + targetRect.height / 2 - tooltipTop))
    : safeTooltipHeight / 2;
  const tooltipStyle = {
    width: tooltipWidth,
    left: tooltipLeft,
    top: tooltipTop,
    "--tutorial-arrow-left": `${arrowLeft}px`,
    "--tutorial-arrow-top": `${arrowTop}px`,
  };

  return (
    <div className="system-tutorial-modal" role="dialog" aria-modal="true" aria-labelledby="system-tutorial-title">
      {targetRect && (
        <div className="system-tutorial-spotlight" style={{ top: targetRect.top - 7, left: targetRect.left - 7, width: targetRect.width + 14, height: targetRect.height + 14 }} />
      )}
      <section ref={tooltipRef} className={`system-tutorial-coachmark ${targetRect ? placement : "centered"}`} style={tooltipStyle}>
        <button className="system-tutorial-close" type="button" aria-label="Pular tutorial" title="Pular tutorial" disabled={isCompleting} onClick={onClose}><X size={20} /></button>
        <span className="step">{tutorial.eyebrow}</span>
        <h2 id="system-tutorial-title">{tutorial.title}</h2>
        <div className="system-tutorial-progress" style={{ gridTemplateColumns: `repeat(${tutorial.slides.length}, 1fr)` }} aria-label={`Etapa ${currentSlide + 1} de ${tutorial.slides.length}`}>
          {tutorial.slides.map((item, index) => (
            <button key={item.title} type="button" className={index <= currentSlide ? "active" : ""} onClick={() => setCurrentSlide(index)} aria-label={`Ir para etapa ${index + 1}`} />
          ))}
        </div>
        <article className="system-tutorial-slide" key={`${role}-${currentSlide}`}>
          <div className="system-tutorial-slide-icon"><SlideIcon size={38} /></div>
          <span>PASSO {currentSlide + 1} DE {tutorial.slides.length}</span>
          <h3>{slide.title}</h3>
          <p>{slide.text}</p>
          <small>{slide.hint}</small>
        </article>
        <div className="system-tutorial-navigation">
          <button type="button" className="confirmation-back tutorial-skip" disabled={isCompleting} onClick={onClose}>Pular tutorial</button>
          <button type="button" className="confirmation-back" disabled={currentSlide === 0 || isCompleting} onClick={() => setCurrentSlide((value) => value - 1)}>Anterior</button>
          <button type="button" className="confirmation-accept" disabled={isCompleting} onClick={() => isLastSlide ? onClose() : setCurrentSlide((value) => value + 1)}>{isLastSlide ? (isCompleting ? "Concluindo..." : "Concluir tutorial") : "Próximo"}</button>
        </div>
      </section>
    </div>
  );
}
