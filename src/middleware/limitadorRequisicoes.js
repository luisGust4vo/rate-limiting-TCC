/**
 * Cria um middleware Express que aplica a estratégia de Rate Limiting
 * recebida e registra contadores de requisições aceitas/bloqueadas.
 *
 * @param {object} limitador - instância criada por criarLimitador()
 * @param {object} contadores - objeto { aceitas, bloqueadas } compartilhado
 */
function criarMiddlewareLimitador(limitador, contadores) {
  return function middlewareLimitador(req, res, next) {
    // Em um cenário real, o identificador seria o IP do cliente,
    // uma API key ou um ID de usuário autenticado. Aqui usamos o IP.
    const identificadorCliente = req.ip || "cliente-desconhecido";

    const requisicaoPermitida = limitador.permitir(identificadorCliente);

    if (requisicaoPermitida) {
      contadores.aceitas += 1;
      next();
    } else {
      contadores.bloqueadas += 1;
      res.status(429).json({
        erro: "Muitas requisições. Tente novamente mais tarde.",
      });
    }
  };
}

module.exports = { criarMiddlewareLimitador };
