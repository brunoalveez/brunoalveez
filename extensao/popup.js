document.addEventListener('DOMContentLoaded', () => {
    const botao = document.getElementById('analisarBtn');
    
    if (botao) {
        botao.addEventListener('click', async () => {
            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) return;

            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => document.body.innerText
            }, async (results) => {
                if (!results || !results[0]) return;

                const textoPagina = results[0].result;

                try {
                    const response = await fetch('http://127.0.0.1:8000/analisar-texto', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ texto: textoPagina })
                    });

                    const data = await response.json();

                    if (data.tokens && data.tokens.length > 0) {
                        chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            args: [data.tokens],
                            func: (tokensAnalisados) => {
                                // Remove painel antigo se já existir
                                let antigo = document.getElementById('painel-gramatica-web');
                                if (antigo) antigo.remove();

                                // Cria um painel flutuante lateral de estudos
                                const painel = document.createElement('div');
                                painel.id = 'painel-gramatica-web';
                                painel.style.position = 'fixed';
                                painel.style.top = '20px';
                                painel.style.right = '20px';
                                painel.style.width = '350px';
                                painel.style.maxHeight = '80vh';
                                painel.style.overflowY = 'auto';
                                painel.style.background = '#ffffff';
                                painel.style.color = '#333333';
                                painel.style.border = '2px solid #0d6efd';
                                painel.style.borderRadius = '8px';
                                painel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                                painel.style.zIndex = '999999';
                                painel.style.padding = '15px';
                                painel.style.fontFamily = 'Arial, sans-serif';

                                let html = `
                                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0d6efd; padding-bottom: 8px; margin-bottom: 10px;">
                                        <h3 style="margin: 0; color: #0d6efd; font-size: 16px;">🔍 Raio-X Gramatical</h3>
                                        <button id="fecharPainel" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: bold;">X</button>
                                    </div>
                                    <p style="font-size: 12px; color: #666; margin-top: 0;">Termos-chave identificados pelo Python para estudo:</p>
                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                `;

                                tokensAnalisados.slice(0, 40).forEach(t => {
                                    html += `
                                        <div style="background: #f8f9fa; border-left: 4px solid ${t.cor}; padding: 8px; border-radius: 4px; font-size: 13px;">
                                            <strong>${t.texto}</strong> 
                                            <span style="background: ${t.cor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; float: right;">${t.funcao}</span>
                                            <div style="margin-top: 4px; font-size: 11px; color: #555;">${t.detalhe}</div>
                                        </div>
                                    `;
                                });

                                html += `</div>`;
                                painel.innerHTML = html;
                                document.body.appendChild(painel);

                                document.getElementById('fecharPainel').onclick = () => painel.remove();
                            }
                        });
                    } else {
                        alert("Nenhum termo gramatical relevante encontrado.");
                    }
                } catch (err) {
                    alert("Erro ao conectar ao servidor Python.");
                }
            });
        });
    }
});