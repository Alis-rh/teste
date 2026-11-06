document.addEventListener("DOMContentLoaded", async () => {
  await loadGlobalComponents();
  await loadVagas();
  await loadPlanos();
});

// Link oficial da agenda HubSpot da Gabriela
const LINK_AGENDAMENTO = "https://meetings.hubspot.com/gabriela430";

// 1. Carrega Header, Footer, Logo e Conteúdos Globais de content/configuracoes/geral.json
async function loadGlobalComponents() {
  try {
    const response = await fetch("/content/configuracoes/geral.json");
    if (!response.ok) return;

    const site = await response.json();

    // 1.1 Injeta a Logo no Header e no Footer
    if (site.logo) {
      const logoHeader = document.getElementById("site-logo-header");
      const logoFooter = document.getElementById("site-logo-footer");
      if (logoHeader) logoHeader.src = site.logo;
      if (logoFooter) logoFooter.src = site.logo;
    }

    // 1.2 Ajusta a altura da Logo
    if (site.altura_logo_header) {
      const logoHeader = document.getElementById("site-logo-header");
      if (logoHeader) logoHeader.style.height = `${site.altura_logo_header}px`;
    }
    if (site.altura_logo_footer) {
      const logoFooter = document.getElementById("site-logo-footer");
      if (logoFooter) logoFooter.style.height = `${site.altura_logo_footer}px`;
    }

    // 1.3 Atualiza o texto e o tamanho da fonte do Rodapé
    const textRodape = document.getElementById("rodape-texto");
    if (textRodape) {
      if (site.texto_footer) textRodape.innerText = site.texto_footer;
      if (site.tamanho_fonte_rodape) textRodape.style.fontSize = `${site.tamanho_fonte_rodape}px`;
    }

    // 1.4 Atualiza contactos e redes sociais
    const email = site.email || "gabriela@alisrh.com.br";
    const phone = site.whatsapp || "5531975061698";
    const instagram = site.instagram || "#";
    const linkedin = site.linkedin || "#";
    const tiktok = site.tiktok || "#";

    const headerEmail = document.querySelector("#header-email");
    if (headerEmail) headerEmail.textContent = email;

    const headerPhone = document.querySelector("#header-phone");
    if (headerPhone) headerPhone.textContent = phone;

    const socialInstagram = document.querySelectorAll(".link-instagram, a[aria-label='Instagram']");
    socialInstagram.forEach(el => el.href = instagram);

    const socialLinkedin = document.querySelectorAll(".link-linkedin, a[aria-label='LinkedIn']");
    socialLinkedin.forEach(el => el.href = linkedin);

    const socialTiktok = document.querySelectorAll("a[aria-label='TikTok']");
    socialTiktok.forEach(el => el.href = tiktok);

    const linkWa = document.querySelectorAll('a[href*="wa.me"]');
    linkWa.forEach(el => el.href = `https://wa.me/${phone}`);

  } catch (err) {
    console.warn("Erro ao carregar configurações gerais:", err);
  }
}

// 2. Carrega e exibe as vagas na página vagas.html
async function loadVagas() {
  const container = document.getElementById("vagas-container");
  if (!container) return;

  try {
    const res = await fetch("/content/vagas-index.json");
    if (!res.ok) {
      container.innerHTML = "<p class='text-gray-400'>Nenhuma vaga encontrada no momento.</p>";
      return;
    }

    const vagas = await res.json();
    const hoje = new Date().toISOString().slice(0, 10);

    const ativas = vagas.filter((v) => {
      const pub = v.publish_date;
      const prazo = v.deadline;
      return (!pub || pub <= hoje) && (!prazo || prazo >= hoje);
    });

    if (ativas.length === 0) {
      container.innerHTML = "<p class='text-gray-400'>Nenhuma vaga aberta no momento.</p>";
      return;
    }

    container.innerHTML = ativas.map((v) => {
      const isBanco = v.is_talent_bank;
      const cargo = v.job_role || "Vaga de Emprego";
      const senioridade = v.seniority ? ` • ${v.seniority}` : '';
      const tituloExibicao = `${cargo}${senioridade}`;
      const local = v.location || "Belo Horizonte / Remoto";
      const modelo = v.contract_type || "CLT";
      const link = v.apply_url || `https://wa.me/5531975061698?text=Tenho%20interesse%20na%20vaga%3A%20${encodeURIComponent(tituloExibicao)}`;

      return `
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition hover:border-amber-500/50 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ${isBanco ? 'Banco de Talentos' : modelo}
              </span>
              <span class="text-xs text-zinc-400">${local}</span>
            </div>
            <h3 class="text-xl font-bold text-white mb-4">${tituloExibicao}</h3>
          </div>
          <a href="${link}" target="_blank" rel="noopener noreferrer" 
             class="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition">
             ${isBanco ? 'Cadastrar Currículo' : 'Candidatar-se'}
          </a>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error("Erro ao carregar vagas:", err);
    container.innerHTML = "<p class='text-gray-400'>Erro ao carregar a lista de vagas.</p>";
  }
}

// 3. Carrega e exibe os planos e soluções (index.html e planos.html)
async function loadPlanos() {
  const container = document.getElementById("planos-grid-home") || document.getElementById("planos-grid");
  if (!container) return;

  try {
    const res = await fetch("/content/paginas/planos.json");
    if (!res.ok) return;

    const dados = await res.json();

    if (dados && dados.lista_planos) {
      container.innerHTML = dados.lista_planos.map(plano => `
        <div class="bg-white/5 border ${plano.badge === 'MAIS PROCURADO' ? 'border-alis-gold shadow-lg shadow-alis-gold/10' : 'border-white/10'} rounded-3xl p-8 flex flex-col justify-between relative space-y-6">
          ${plano.badge ? `<span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-alis-gold text-alis-dark text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full">${plano.badge}</span>` : ''}
          
          <div class="space-y-3">
            <h3 class="text-xl font-bold text-white pt-2">${plano.nome}</h3>
            <p class="text-xs text-alis-gold font-semibold uppercase tracking-wider">${plano.modelo || ''}</p>
            <p class="text-white/70 text-sm leading-relaxed">${plano.descricao}</p>
            <hr class="border-white/10 my-3">
            <ul class="space-y-2 text-xs text-white/80">
              ${(plano.itens || []).map(item => `
                <li class="flex items-start gap-2">
                  <i data-lucide="check-circle-2" class="w-4 h-4 text-alis-gold shrink-0 mt-0.5"></i>
                  <span>${typeof item === 'object' ? (item.item || item.texto) : item}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <a href="${LINK_AGENDAMENTO}" target="_blank" rel="noopener noreferrer" class="btn-gold font-bold py-3 rounded-full text-center text-xs uppercase tracking-wider block mt-4 transition-all duration-200 hover:scale-[1.02]">
            ${plano.texto_botao || 'Agendar Diagnóstico'}
          </a>
        </div>
      `).join('');

      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  } catch (err) {
    console.error("Erro ao carregar planos:", err);
  }
}
