// Gera content/vagas-index.json a partir de content/vagas/*.json.
// Roda no deploy do Cloudflare Pages.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'content', 'vagas');
const out = path.join(__dirname, '..', 'content', 'vagas-index.json');

const vagas = fs.existsSync(dir)
  ? fs.readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
          return { ...data, slug: f.replace(/\.json$/, '') };
        } catch (e) {
          console.warn('Ignorado (JSON inválido):', f);
          return null;
        }
      })
      .filter(Boolean)
  : [];

fs.writeFileSync(out, JSON.stringify(vagas));
console.log(`vagas-index.json gerado com ${vagas.length} vaga(s)`);
