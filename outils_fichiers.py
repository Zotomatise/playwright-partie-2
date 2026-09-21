# outils_fichiers.py — lire et écrire de VRAIS fichiers de test dans le projet Playwright.
# Même esprit que les autres connecteurs : la racine du projet vit dans le .env,
# jamais un chemin en dur lié à ta machine.
import json
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# racine du projet Playwright, configurée UNE fois dans le .env
# ex : PROJET_PLAYWRIGHT=/Users/toi/dev/Zotoshop-Test-Playwright
PROJET_PLAYWRIGHT = os.getenv("PROJET_PLAYWRIGHT", ".")


def _resoudre(chemin):
    """Chemin relatif -> résolu depuis la racine du projet ; absolu -> tel quel."""
    p = Path(chemin)
    return p if p.is_absolute() else Path(PROJET_PLAYWRIGHT) / p


def lire_test(chemin):
    """Lit un fichier de test du projet (chemin relatif à PROJET_PLAYWRIGHT).
    Renvoie son contenu. Zéro copier-coller : la matière première vient du vrai dépôt."""
    p = _resoudre(chemin)
    if not p.exists():
        raise FileNotFoundError(
            f"Fichier introuvable : {p}. Vérifie PROJET_PLAYWRIGHT dans ton .env "
            f"et le chemin passé à lire_test()."
        )
    return p.read_text(encoding="utf-8")


def ecrire_test(chemin, contenu):
    """Écrit (ou remplace) un fichier de test dans le projet. Crée les dossiers manquants.
    Renvoie le chemin réel écrit. C'est la sortie de la review : un vrai fichier, pas un print."""
    p = _resoudre(chemin)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(contenu, encoding="utf-8")
    return str(p)


def ecrire_donnees(chemin, donnees):
    """Écrit un jeu de données (liste ou dict) dans le projet, au format JSON.
    Sert à poser un FICHIER DE DONNÉES DE TEST que les tests Playwright liront (L7).
    Renvoie le chemin réel écrit."""
    return ecrire_test(chemin, json.dumps(donnees, ensure_ascii=False, indent=2))
