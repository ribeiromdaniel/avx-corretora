-- ============================================================
-- Avaloon Planner — Migração 0004: Bloco de marca no dossiê
--
-- Brand guideline e elementos visuais do cliente viram memória
-- estruturada. A apresentação gerada do plano aprovado usa estes
-- campos para se vestir com a identidade do cliente.
-- A entrevista guiada passa a cobrir estas lacunas automaticamente
-- (detectar-lacunas lê blocos_config).
-- ============================================================

insert into planner.blocos_config (codigo, titulo, ordem, ativo, schema) values
('marca', 'Marca e identidade visual', 8, true, '{
  "campos": [
    {"chave": "logo_url", "rotulo": "Logo (URL)", "descricao": "Link direto para o arquivo do logo em fundo escuro (PNG/SVG). Preferir versão horizontal."},
    {"chave": "cor_primaria", "rotulo": "Cor primária", "descricao": "Cor principal da marca em hexadecimal (ex.: #1B61C9)"},
    {"chave": "cor_secundaria", "rotulo": "Cor secundária", "descricao": "Cor de apoio em hexadecimal, usada em destaques e detalhes"},
    {"chave": "cor_escura", "rotulo": "Cor escura de fundo", "descricao": "Cor escura da marca para fundos (hexadecimal). Se não houver, usa-se preto."},
    {"chave": "tipografia", "rotulo": "Tipografia", "descricao": "Fontes da marca: títulos e corpo (ex.: Montserrat bold para títulos, Open Sans para texto)"},
    {"chave": "tom_visual", "rotulo": "Tom visual", "descricao": "Estilo de imagem da marca: fotografia real vs ilustração, clean vs denso, claro vs escuro"},
    {"chave": "elementos_graficos", "rotulo": "Elementos gráficos", "descricao": "Grafismos, padrões, ícones ou molduras que identificam a marca"},
    {"chave": "restricoes_marca", "rotulo": "Restrições de uso da marca", "descricao": "O que NÃO fazer: distorcer logo, cores proibidas, fundos vetados, concorrentes de cor"},
    {"chave": "assets_url", "rotulo": "Pasta de assets (URL)", "descricao": "Link do Drive/pasta com logos, fotos e materiais oficiais da marca"}
  ]
}'::jsonb)
on conflict (codigo) do nothing;
