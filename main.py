from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spacy

app = FastAPI()

# Habilita CORS para permitir a comunicação com a extensão do navegador
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    nlp = spacy.load("pt_core_news_lg")
except:
    nlp = spacy.load("pt_core_news_sm")

class TextoRequest(BaseModel):
    texto: str

@app.get("/")
def raiz():
    return {"status": "Servidor Gramática Web rodando com sucesso!"}

@app.post("/analisar-texto", response_class=JSONResponse)
async def analisar_texto(req: TextoRequest):
    """Recebe o texto da página e retorna os tokens gramaticais com tooltips."""
    doc = nlp(req.texto[:2500]) # Analisa até 2500 caracteres da página
    tokens_interativos = []
    
    for token in doc:
        if token.is_punct or token.is_space:
            continue
            
        classe = token.pos_
        cor_badge = "#6c757d" # Cinza padrão
        funcao_desc = "Outros"
        detalhe = f"Função sintática (Dep): {token.dep_}"
        
        if classe == "PRON":
            cor_badge = "#0d6efd" # Azul
            funcao_desc = "PRONOME"
            detalhe = f"Quem ele representa / Termo relacionado: {token.head.text}"
        elif classe in ["VERB", "AUX"]:
            cor_badge = "#198754" # Verde
            funcao_desc = "VERBO"
            sujeitos = [child.text for child in token.children if "subj" in child.dep_]
            detalhe = f"Quem faz (Sujeito): {', '.join(sujeitos) if sujeitos else 'Implícito/Oculto'}"
        elif classe == "ADJ":
            cor_badge = "#fd7e14" # Laranja
            funcao_desc = "ADJETIVO"
            detalhe = f"Caracteriza o termo: {token.head.text}"
        elif classe == "ADV":
            cor_badge = "#0dcaf0" # Ciano
            funcao_desc = "ADVÉRBIO"
            detalhe = f"Modifica o termo: {token.head.text}"
        elif classe in ["SCONJ", "CCONJ"]:
            cor_badge = "#dc3545" # Vermelho
            funcao_desc = "CONECTOR"
            detalhe = f"Liga orações/termos com: {token.head.text}"
        elif classe == "ADP":
            cor_badge = "#212529" # Preto/Escuro
            funcao_desc = "PREPOSIÇÃO"
            detalhe = f"Exigida pela regência de: {token.head.text}"
        else:
            continue # Ignora classes menos relevantes para focar nos pontos de prova

        tokens_interativos.append({
            "texto": token.text,
            "funcao": funcao_desc,
            "detalhe": detalhe,
            "cor": cor_badge
        })
        
    return {"tokens": tokens_interativos}