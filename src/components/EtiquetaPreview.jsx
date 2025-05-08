import React from 'react';

export default function EtiquetaPreview({ etiqueta, configuracoes, incluirOrdemEntrega, ordemEntregaTexto, logomarca, intensidadeMarcaDagua }) {
  const { largura, altura, tamanhoFonte } = configuracoes;
  
  // Definir configurações padrão baseadas no tamanho da etiqueta
  const isEtiquetaGrande = largura > 100 || altura > 45;
  const fontSize = {
    empresa: '13px',
    cnpj: '6px',
    cidade: '7px',
    site: '6px',
    produto: isEtiquetaGrande ? '18px' : `${tamanhoFonte}px`,
    cliente: isEtiquetaGrande ? '12px' : '10px',
    detalhes: isEtiquetaGrande ? '10px' : '8px',
    ordem: isEtiquetaGrande ? '30px' : '26px',
    ordemTexto: '6px'
  };

  return (
    <div
      className="bg-white border border-gray-300 relative"
      style={{
        width: `${largura}mm`,
        height: `${altura}mm`,
        padding: '5mm',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Cabeçalho da empresa */}
      <div style={{ marginBottom: '2mm' }}>
        <div style={{ fontSize: fontSize.empresa, fontWeight: 'bold' }}>
          MÓVEIS AMAZÔNIA LTDA
        </div>
        <div style={{ fontSize: fontSize.cnpj }}>
          CNPJ: 15.692.362/0001-68 Inscrição Estadual: 13.457.068-5
        </div>
        <div style={{ fontSize: fontSize.cidade }}>
          ALTA FLORESTA - MT
        </div>
        <div style={{ fontSize: fontSize.site, position: 'absolute', top: '4mm', right: '2mm' }}>
          www.moveisamazonia.com.br
        </div>
      </div>

      {/* Ordem de entrega */}
      {incluirOrdemEntrega && (
        <div style={{ position: 'absolute', top: '2mm', right: '2mm', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: fontSize.ordemTexto, fontWeight: 'bold', marginRight: '2mm' }}>
            <div>ORDEM DE</div>
            <div>ENTREGA</div>
          </div>
          <div style={{ fontSize: fontSize.ordem, fontWeight: 'bold' }}>
            {ordemEntregaTexto || etiqueta?.ordemEntrega || ''}
          </div>
        </div>
      )}

      {/* Marca d'água */}
      {logomarca && (
        <div 
          style={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${largura * 0.8}mm`,
            height: `${altura * 0.8}mm`,
            backgroundImage: `url(${logomarca})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: intensidadeMarcaDagua,
            zIndex: 0
          }}
        />
      )}

      {/* Nome do Produto */}
      <div
        style={{
          fontSize: fontSize.produto,
          fontWeight: 'bold',
          marginTop: 'auto',
          marginBottom: '4mm',
          zIndex: 1
        }}
      >
        {etiqueta.produto.nome}
      </div>

      {/* Cliente */}
      {etiqueta.cliente && (
        <div
          style={{
            fontSize: fontSize.cliente,
            marginBottom: '2mm',
            zIndex: 1
          }}
        >
          Cliente: {etiqueta.cliente.nome}
        </div>
      )}

      {/* Cidade, UF e Número de Série */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: fontSize.detalhes,
          zIndex: 1
        }}
      >
        {etiqueta.cliente && etiqueta.cliente.cidade && etiqueta.cliente.uf && (
          <div>
            {etiqueta.cliente.cidade} - {etiqueta.cliente.uf}
          </div>
        )}
        {etiqueta.numeroSerie && (
          <div>
            N° Série: {etiqueta.numeroSerie}
          </div>
        )}
      </div>
    </div>
  );
}
