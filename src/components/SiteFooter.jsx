import React from "react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>Click Fila 2026</span>
      <nav aria-label="Links institucionais">
        <Link to="/politica-de-privacidade">Política de Privacidade</Link>
        <span className="footer-separator" aria-hidden="true">|</span>
        <Link to="/termos-de-uso">Termos de Uso</Link>
      </nav>
    </footer>
  );
}
