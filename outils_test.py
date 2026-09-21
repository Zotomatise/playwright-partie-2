# outils_test.py — la boîte à outils maison du module M2.
# Regroupe les réflexes réutilisés dès L4 (review), L5 (bugs) et L7 (capstone).
# À copier dans ton atelier à côté de outils_ia.py.
import json
import re


def nettoyer_json(txt):
    """L'IA enrobe souvent son JSON dans un bloc ```json ... ```. On le retire avant de parser."""
    txt = txt.strip()
    if txt.startswith("```"):
        txt = re.sub(r"^```[a-zA-Z]*\n", "", txt)
        txt = re.sub(r"\n```$", "", txt)
    return txt.strip()


# 'JSON strict' promis dans un prompt ne prouve rien tant qu'on ne l'a pas vérifié par code.
# 'etapes' = liste d'étapes structurées {action, data, resultat_attendu} (une par ligne dans Xray).
CLES_ATTENDUES = {"id", "titre", "critere", "type", "etapes"}
TYPES_VALIDES = {"passant", "limite", "non-passant"}


def valider_cles(objets, cles_requises):
    """Générique : vérifie que chaque objet d'une liste a bien toutes les clés attendues.
    Réutilisé dans tout M2 (review L4, rapport de bug L5, données L6...).
    Retourne la liste des problèmes. Liste vide = conforme."""
    requises = set(cles_requises)
    problemes = []
    for i, o in enumerate(objets):
        manquantes = requises - o.keys()
        if manquantes:
            problemes.append(f"objet #{i} : clés manquantes {manquantes}")
    return problemes


def valider(cas):
    """Validation spécifique aux CAS DE TEST (L4, capstone). Liste vide = conforme.
    Vérifie aussi que chaque étape structurée porte au moins une 'action'."""
    problemes = valider_cles(cas, CLES_ATTENDUES)
    for i, c in enumerate(cas):
        cid = c.get("id", "#" + str(i))
        if c.get("type") not in TYPES_VALIDES:
            problemes.append(f"{cid} : type invalide '{c.get('type')}'")
        etapes = c.get("etapes")
        if not isinstance(etapes, list) or not etapes:
            problemes.append(f"{cid} : 'etapes' doit être une liste non vide")
            continue
        for j, e in enumerate(etapes):
            if isinstance(e, dict) and not e.get("action"):
                problemes.append(f"{cid} étape {j + 1} : 'action' manquante")
    return problemes


def construire_prompt(histoire):
    """Construit le prompt de génération de cas de test à partir d'une user story.
    Réutilisable proprement dans un batch (remplace un fragile prompt.replace(...))."""
    return f"""
À partir de cette user story et de ses critères d'acceptation, génère les cas de test.

{histoire}

Contraintes :
- Couvre CHAQUE critère d'acceptation par au moins un cas.
- Inclus des cas passants, des cas limites et des cas non-passants.
- Réponds par une LISTE JSON : commence par [ et termine par ]. PAS de clé racine, PAS de fence markdown.
- Chaque objet a EXACTEMENT ces clés :
  "id" (ex CT-01), "titre", "critere" (l'AC couvert, ex "AC1"),
  "type" ("passant" | "limite" | "non-passant"),
  "etapes" (liste de chaînes), "resultat_attendu" (chaîne).
- Aucun texte hors du JSON.
"""
