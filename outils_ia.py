# outils_ia.py — version M4 : ask() (M1/M3) + ask_structure() (M4-L1).
# IA_FOURNISSEUR=claude (defaut) ou ollama, dans le .env — comme en M3, le code de test
# ne change pas. Les DEUX fonctions respectent le switch : un eleve en profil « zero cout »
# (Ollama) suit M4 avec le meme .env qu'en M3.
from dotenv import load_dotenv, find_dotenv
import anthropic
import requests
import os

load_dotenv(find_dotenv())
FOURNISSEUR = os.getenv("IA_FOURNISSEUR", "claude")
CLAUDE_MODEL = "claude-haiku-4-5-20251001"
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
# Fenetre de contexte : par defaut Ollama la fixe a 2048 tokens et TRONQUE en silence
# les longs prompts (gros ticket Jira, logs...). On la fixe pour que le comportement
# reste proche du cloud. Ajustable selon la RAM de la machine.
OLLAMA_NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "8192"))
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")


class ReponseTronquee(Exception):
    """Levee quand le modele a ete coupe par max_tokens : la sortie est INCOMPLETE.
    Sans ce garde-fou, un structured output coupe en plein vol renvoie un objet vide
    ou partiel... sans erreur. Exactement le silence que M4-L2 refuse."""


# ---------------------------------------------------------------- ask() : texte libre

def ask(prompt, system=None, temperature=0.2, max_tokens=1024):
    """Pose une question a l'IA. Le fournisseur (cloud ou local) vient du .env,
    relu a chaque appel (permet de changer os.environ en cours de session, cf M3-L2)."""
    fournisseur = os.getenv("IA_FOURNISSEUR", "claude")
    if fournisseur == "ollama":
        return _ask_ollama(prompt, system, temperature, max_tokens)
    return _ask_claude(prompt, system, temperature, max_tokens)


def _ask_claude(prompt, system, temperature, max_tokens):
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    kwargs = {
        "model": CLAUDE_MODEL,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system is not None:
        kwargs["system"] = system
    response = client.messages.create(**kwargs)
    if response.stop_reason == "max_tokens":
        raise ReponseTronquee(f"reponse coupee a {max_tokens} tokens : augmente max_tokens")
    return response.content[0].text


def _messages_ollama(prompt, system):
    messages = []
    if system is not None:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    return messages


def _ask_ollama(prompt, system, temperature, max_tokens, format=None):
    # Ollama expose une API locale sur le port 11434 : le prompt reste sur ta machine.
    corps = {
        "model": OLLAMA_MODEL,
        "messages": _messages_ollama(prompt, system),
        "stream": False,
        "options": {"temperature": temperature, "num_predict": max_tokens, "num_ctx": OLLAMA_NUM_CTX},
    }
    if format is not None:
        corps["format"] = format  # JSON Schema : Ollama contraint la sortie (structured output local)
    reponse = requests.post(f"{OLLAMA_URL}/api/chat", json=corps, timeout=300)
    reponse.raise_for_status()
    data = reponse.json()
    if data.get("done_reason") == "length":
        raise ReponseTronquee(f"reponse coupee a {max_tokens} tokens (num_predict) : augmente max_tokens")
    return data["message"]["content"]


# ----------------------------------------------- ask_structure() : sortie contrainte (M4-L1)

def ask_structure(prompt, schema, nom_outil="repondre", system=None, temperature=0, max_tokens=1024):
    """Comme ask(), mais la sortie est CONTRAINTE au schema (M4-L1) : un dict Python deja
    valide, jamais du texte a nettoyer/parser. schema = un JSON Schema (proprietes + required).
    - claude : tool_use force (tool_choice) -> response.content[0].input
    - ollama : champ "format" = le schema -> JSON garanti, parse une fois
    Dans les deux cas, une reponse coupee par max_tokens leve ReponseTronquee au lieu de
    renvoyer un objet vide en silence."""
    fournisseur = os.getenv("IA_FOURNISSEUR", "claude")
    if fournisseur == "ollama":
        import json
        texte = _ask_ollama(prompt, system, temperature, max_tokens, format=schema)
        return json.loads(texte)

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    outil = {
        "name": nom_outil,
        "description": f"Enregistre le resultat au format attendu ({nom_outil}).",
        "input_schema": schema,
    }
    kwargs = {
        "model": CLAUDE_MODEL,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "tools": [outil],
        "tool_choice": {"type": "tool", "name": nom_outil},
        "messages": [{"role": "user", "content": prompt}],
    }
    if system is not None:
        kwargs["system"] = system
    response = client.messages.create(**kwargs)

    if response.stop_reason == "max_tokens":
        raise ReponseTronquee(
            f"structured output coupe a {max_tokens} tokens : l'objet serait vide ou partiel. Augmente max_tokens."
        )
    blocs = [b for b in response.content if getattr(b, "type", "") == "tool_use"]
    if not blocs:
        raise ValueError("le modele n'a pas appele l'outil : aucune sortie structuree")
    return blocs[0].input
