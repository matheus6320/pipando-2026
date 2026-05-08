// ===== INIT =====
carregarAtividadesDB().then(() => {
  renderConfig();
  renderSelectGrid();
}).catch(() => {
  carregar();
  renderConfig();
  renderSelectGrid();
});

carregarCotacoesDB().then(() => {
  atualizarBadge();
  renderRelatorio();
  renderHome();
  // Pede permissão na primeira abertura e verifica notificações
  if(statusPermissao() === 'default') {
    setTimeout(pedirPermissaoNotificacoes, 3000);
  } else {
    verificarNotificacoes();
  }
}).catch(() => {
  atualizarBadge();
});
