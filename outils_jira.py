# outils_jira.py — lire une user story depuis Jira, sans copier-coller.
# Portable : API REST Jira + token. Chaque élève branche SON Jira via le .env.
import os
import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

JIRA_URL = os.getenv("JIRA_URL")        # ex : https://zotomatise.atlassian.net
JIRA_EMAIL = os.getenv("JIRA_EMAIL")    # ton email Atlassian
JIRA_TOKEN = os.getenv("JIRA_TOKEN")    # token API : id.atlassian.com/manage-profile/security/api-tokens


def _texte_depuis_adf(doc):
    """La description Jira revient en ADF (Atlassian Document Format, du JSON).
    On en extrait le texte brut, avec un saut de ligne par paragraphe."""
    if not isinstance(doc, dict):
        return str(doc or "")
    morceaux = []

    def parcourir(node):
        if node.get("type") == "text":
            morceaux.append(node.get("text", ""))
        for enfant in node.get("content", []):
            parcourir(enfant)
        if node.get("type") in ("paragraph", "heading"):
            morceaux.append("\n")

    parcourir(doc)
    return "".join(morceaux).strip()


def charger_us(cle):
    """Lit une user story Jira par sa clé (ex 'SCRUM-10') et renvoie un texte
    'clé — titre + critères d'acceptation', prêt pour le pipeline (L4, capstone L8).
    Zéro copier-coller : la matière première vient directement du ticket."""
    if not (JIRA_URL and JIRA_EMAIL and JIRA_TOKEN):
        raise RuntimeError(
            "Configure JIRA_URL, JIRA_EMAIL et JIRA_TOKEN dans ton .env "
            "(token : id.atlassian.com/manage-profile/security/api-tokens)."
        )

    url = f"{JIRA_URL}/rest/api/3/issue/{cle}"
    reponse = requests.get(
        url,
        params={"fields": "summary,description"},
        auth=HTTPBasicAuth(JIRA_EMAIL, JIRA_TOKEN),
        headers={"Accept": "application/json"},
        timeout=20,
    )
    reponse.raise_for_status()

    champs = reponse.json()["fields"]
    titre = champs["summary"]
    description = champs.get("description")
    if isinstance(description, dict):
        description = _texte_depuis_adf(description)

    return f"{cle} — {titre}\n\n{description or ''}".strip()


def commenter_ticket(cle, texte):
    """Écrit un commentaire sur le ticket Jira (ex : les cas de test générés).
    Ferme la boucle : d'un ticket à des cas tracés, sans jamais copier-coller."""
    if not (JIRA_URL and JIRA_EMAIL and JIRA_TOKEN):
        raise RuntimeError("Configure JIRA_URL, JIRA_EMAIL et JIRA_TOKEN dans ton .env.")

    url = f"{JIRA_URL}/rest/api/3/issue/{cle}/comment"
    corps_adf = {
        "body": {
            "type": "doc",
            "version": 1,
            "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": texte}]}
            ],
        }
    }
    reponse = requests.post(
        url,
        json=corps_adf,
        auth=HTTPBasicAuth(JIRA_EMAIL, JIRA_TOKEN),
        headers={"Accept": "application/json", "Content-Type": "application/json"},
        timeout=20,
    )
    reponse.raise_for_status()
    return reponse.json()["id"]


def chercher_bugs_similaires(projet, mots_cles, ouverts_seulement=True, maxi=5):
    """LE geste du QA senior : chercher AVANT de créer.
    Cherche dans Jira les Bugs qui ressemblent, pour ne pas ouvrir un doublon.

    projet     : clé du projet (ex 'ZSHOP')
    mots_cles  : quelques mots discriminants (ex 'panier compteur')
    Renvoie une liste de dicts : {'cle', 'titre', 'statut'}. Liste vide = aucun doublon connu.
    """
    if not (JIRA_URL and JIRA_EMAIL and JIRA_TOKEN):
        raise RuntimeError("Configure JIRA_URL, JIRA_EMAIL et JIRA_TOKEN dans ton .env.")

    termes = " ".join(mots_cles.split())
    jql = f'project = {projet} AND issuetype = Bug AND text ~ "{termes}"'
    if ouverts_seulement:
        jql += " AND statusCategory != Done"   # on ne compare qu'aux bugs encore ouverts
    jql += " ORDER BY created DESC"

    params = {"jql": jql, "maxResults": maxi, "fields": "summary,status"}
    auth = HTTPBasicAuth(JIRA_EMAIL, JIRA_TOKEN)
    headers = {"Accept": "application/json"}

    # endpoint moderne d'abord, repli sur l'ancien si l'instance ne le connait pas
    for url in (f"{JIRA_URL}/rest/api/3/search/jql", f"{JIRA_URL}/rest/api/3/search"):
        reponse = requests.get(url, params=params, auth=auth, headers=headers, timeout=20)
        if reponse.status_code in (404, 410):
            continue
        reponse.raise_for_status()
        issues = reponse.json().get("issues", [])
        return [
            {
                "cle": i["key"],
                "titre": i["fields"]["summary"],
                "statut": i["fields"]["status"]["name"],
            }
            for i in issues
        ]
    return []


def creer_bug(projet, rapport, lien_us=None):
    """Crée un vrai ticket Bug dans Jira à partir d'un rapport structuré (L6).
    rapport = dict avec 'titre', 'etapes_reproduction' (liste), 'resultat_observe',
    'resultat_attendu', 'environnement', 'severite', 'justification_severite', 'preuves' (liste).
    Si lien_us est fourni (ex 'ZSHOP-3'), le Bug est RATTACHÉ à cette user story (traçabilité).
    Renvoie la clé du Bug créé (ex 'ZSHOP-30')."""
    if not (JIRA_URL and JIRA_EMAIL and JIRA_TOKEN):
        raise RuntimeError("Configure JIRA_URL, JIRA_EMAIL et JIRA_TOKEN dans ton .env.")

    etapes = "\n".join(f"- {e}" for e in rapport.get("etapes_reproduction", []) or [])
    preuves = "\n".join(f"- {p}" for p in rapport.get("preuves", []) or [])
    description = (
        f"*Étapes de reproduction :*\n{etapes}\n\n"
        f"*Résultat observé :* {rapport.get('resultat_observe', '')}\n"
        f"*Résultat attendu :* {rapport.get('resultat_attendu', '')}\n"
        f"*Environnement :* {rapport.get('environnement', '')}\n"
        f"*Taux de reproduction :* {rapport.get('taux_reproduction', 'non précisé')}\n\n"
        f"*Sévérité (impact technique) :* {rapport.get('severite', '')}\n"
        f"*Priorité (urgence business) :* {rapport.get('priorite', '')}\n"
        f"*Justification :* {rapport.get('justification', '')}\n\n"
        f"*Preuves :*\n{preuves}"
    )
    # API v2 : description en texte simple (pas d'ADF à construire)
    payload = {
        "fields": {
            "project": {"key": projet},
            "issuetype": {"name": "Bug"},
            "summary": rapport.get("titre", "Bug"),
            "description": description,
        }
    }
    reponse = requests.post(
        f"{JIRA_URL}/rest/api/2/issue",
        json=payload,
        auth=HTTPBasicAuth(JIRA_EMAIL, JIRA_TOKEN),
        headers={"Accept": "application/json", "Content-Type": "application/json"},
        timeout=20,
    )
    reponse.raise_for_status()
    cle = reponse.json()["key"]

    # rattacher le Bug à la user story concernée (traçabilité) — un bug ne flotte pas seul
    if lien_us:
        lien = requests.post(
            f"{JIRA_URL}/rest/api/3/issueLink",
            json={"type": {"name": "Relates"},
                  "inwardIssue": {"key": lien_us},
                  "outwardIssue": {"key": cle}},
            auth=HTTPBasicAuth(JIRA_EMAIL, JIRA_TOKEN),
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            timeout=20,
        )
        lien.raise_for_status()

    return cle
