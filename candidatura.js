// Cloudflare Pages Function: POST /api/candidatura
// 1) valida o PDF  2) guarda no HubSpot (Files API)  3) envia o formulário (Forms API v3)
// Requer o segredo HUBSPOT_TOKEN (escopo "files") nas variáveis do projeto no Cloudflare.

const PORTAL_ID = '51916920';
const FORM_ID = 'efb69fa0-19fe-43ba-8acf-0b3efbbd7feb';
const FOLDER_PATH = '/curriculos-site';
const MAX_BYTES = 5 * 1024 * 1024;

// 'PUBLIC_NOT_INDEXABLE': gera um link clicável, com nome aleatório e sem indexação do Google.
// 'PRIVATE': arquivo fechado; só quem está logado no HubSpot abre (pela ferramenta de Arquivos).
const ACCESS = 'PUBLIC_NOT_INDEXABLE';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

export async function onRequestPost({ request, env }) {
  try {
    if (!env.HUBSPOT_TOKEN) {
      console.error('HUBSPOT_TOKEN não configurado');
      return json({ error: 'Envio indisponível no momento. Tente novamente mais tarde.' }, 500);
    }

    const entrada = await request.formData();
    const arquivo = entrada.get('curriculo');

    // Validação no servidor (a do navegador pode ser contornada)
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      return json({ error: 'Anexe seu currículo em PDF.' }, 400);
    }
    if (arquivo.size > MAX_BYTES) {
      return json({ error: 'O PDF deve ter no máximo 5 MB.' }, 400);
    }
    const cabecalho = new TextDecoder().decode(await arquivo.slice(0, 5).arrayBuffer());
    if (cabecalho !== '%PDF-') {
      return json({ error: 'O arquivo não é um PDF válido.' }, 400);
    }

    // 1) Guarda o PDF no HubSpot
    const upload = new FormData();
    upload.append(
      'file',
      new File([arquivo], `cv-${crypto.randomUUID()}.pdf`, { type: 'application/pdf' })
    );
    upload.append('folderPath', FOLDER_PATH);
    upload.append('options', JSON.stringify({ access: ACCESS, overwrite: false }));

    const resUpload = await fetch('https://api.hubapi.com/files/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.HUBSPOT_TOKEN}` },
      body: upload
    });
    if (!resUpload.ok) {
      console.error('Falha no upload HubSpot:', resUpload.status, await resUpload.text());
      return json({ error: 'Não foi possível salvar o currículo. Tente novamente.' }, 502);
    }
    const salvo = await resUpload.json();
    const linkCurriculo =
      ACCESS === 'PRIVATE' ? `Arquivo privado: ${salvo.name} (ID ${salvo.id})` : salvo.url;

    // 2) Envia os campos do formulário, com o link do currículo
    const fields = [];
    for (const [name, value] of entrada.entries()) {
      if (name !== 'curriculo' && typeof value === 'string') fields.push({ name, value });
    }
    fields.push({ name: 'link_curriculo', value: linkCurriculo });

    const resForm = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_ID}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields,
          context: {
            pageUri: request.headers.get('Referer') || undefined,
            pageName: 'Banco de Talentos'
          }
        })
      }
    );
    if (!resForm.ok) {
      console.error('Falha no formulário HubSpot:', resForm.status, await resForm.text());
      return json({ error: 'Não foi possível registrar sua candidatura. Tente novamente.' }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    console.error('Erro em /api/candidatura:', err);
    return json({ error: 'Erro inesperado. Tente novamente.' }, 500);
  }
}
