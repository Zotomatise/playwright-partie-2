# pipeline.py — la chaine US -> cas -> code de M2-L8 / M3-L6, industrialisee (M4-L2).
# Meme mecanisme, mais range en etapes typees : chaque etape a une entree et une sortie
# claires, et un echec arrete tout net avec un message lisible (au lieu de laisser
# l'etape suivante tourner sur du vide, comme dans un notebook ou les cellules s'enchainent
# sans se parler).
import json
import os
import posixpath
import re
import subprocess
from datetime import datetime
from dataclasses import dataclass, field

from outils_ia import ask, ask_structure
from outils_test import nettoyer_json
from outils_jira import charger_us
from outils_fichiers import lire_test, ecrire_test, PROJET_PLAYWRIGHT

# Schema du structured output (M4-L1) : plus de nettoyer_json/valider pour les cas,
# le schema GARANTIT deja la forme. max_tokens genereux : une liste coupee en plein
# vol par un max_tokens trop petit renvoie un objet vide, pas une erreur claire.
# maxItems : sans borne, un petit modele local (Ollama) peut boucler sur le meme
# critere au lieu de s'arreter naturellement (verifie : 30+ cas quasi identiques,
# jamais de stop_reason "stop"). Le schema seul suffit a le corriger, sans toucher au prompt.
SCHEMA_CAS = {
    "type": "object",
    "properties": {
        "cas": {
            "type": "array",
            "minItems": 3,
            "maxItems": 8,
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "critere": {"type": "string"},
                    "type": {"type": "string", "enum": ["passant", "limite", "non-passant"]},
                    "titre": {"type": "string"},
                    "etapes": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["id", "critere", "type", "titre", "etapes"],
            },
        },
    },
    "required": ["cas"],
}


class EtapeEchouee(Exception):
    """Levee quand une etape de la chaine echoue. Arrete le pipeline, rien ne continue derriere."""


@dataclass
class ResultatEtape:
    nom: str
    ok: bool
    resume: str = ""


@dataclass
class RapportPipeline:
    """Le contrat de sortie de la chaine : ce que L4 lira en CI pour savoir ce qui s'est passe."""
    us: str
    etapes: list = field(default_factory=list)
    reussi: bool = True
    fichier_ecrit: str = ""
    execution: str = ""   # resume du run Playwright (ex: "3 passed")
    branche: str = ""
    commit: str = ""

    def vers_json(self):
        return json.dumps(
            {
                "us": self.us,
                "reussi": self.reussi,
                "etapes": [{"nom": e.nom, "ok": e.ok, "resume": e.resume} for e in self.etapes],
                "fichier_ecrit": self.fichier_ecrit,
                "execution": self.execution,
                "branche": self.branche,
                "commit": self.commit,
            },
            indent=2,
            ensure_ascii=False,
        )


def _executer(rapport, nom, fonction, *args):
    """Execute une etape. Enregistre le resultat dans le rapport, meme en cas d'echec."""
    try:
        resultat = fonction(*args)
        rapport.etapes.append(ResultatEtape(nom=nom, ok=True, resume=str(resultat)[:120]))
        return resultat
    except Exception as e:
        rapport.etapes.append(ResultatEtape(nom=nom, ok=False, resume=str(e)))
        rapport.reussi = False
        raise EtapeEchouee(f"Etape « {nom} » a echoue : {e}") from e


# --- les etapes, une fonction = une responsabilite ---

def etape_generer_cas(user_story):
    """Structured output (M4-L1) : le schema garantit deja id/critere/type/etapes.
    Zero nettoyer_json, zero json.loads, zero validation de cles apres coup."""
    resultat = ask_structure(
        f"À partir de cette user story, génère les cas de test (un par critère au minimum, "
        f"couvre les cas passants, limites, non-passants).\n{user_story}",
        SCHEMA_CAS,
        nom_outil="enregistrer_cas_de_test",
        system="Tu es un QA senior.",
        max_tokens=2000,
    )
    cas = resultat.get("cas", [])
    if not cas:
        raise ValueError("aucun cas genere (verifie max_tokens si la US a beaucoup de criteres)")
    return cas


def etape_generer_code(user_story, cas, fichiers_pom: dict[str, str], chemin_sortie: str):
    # Le chemin d'import relatif se CALCULE (posixpath.relpath), on ne le laisse pas deviner :
    # meme a temperature=0, l'IA n'est pas garantie deterministe d'un appel a l'autre (verifie en
    # prepa : "./pages/StorePage" un coup, "../pages/StorePage" le suivant, sur le MEME prompt).
    dossier_sortie = posixpath.dirname(chemin_sortie)
    imports = []
    for nom in fichiers_pom:
        nom_classe = nom.removesuffix(".ts")
        chemin_relatif = posixpath.relpath(f"tests/pages/{nom_classe}", dossier_sortie)
        if not chemin_relatif.startswith("."):
            chemin_relatif = "./" + chemin_relatif
        imports.append(f'import {{ {nom_classe} }} from "{chemin_relatif}";')
    imports_texte = "\n".join(imports)

    # Squelette de style : un petit modele local (Ollama) confond parfois l'API Playwright
    # avec Jest/Mocha (describe/it globaux au lieu de test.describe/test importes) -
    # verifie en prepa. Le montrer une fois suffit a le fixer, sans toucher au schema.
    exemple_style = """import { test, expect } from "@playwright/test";
import { StorePage } from "../pages/StorePage";

test.describe("EXEMPLE - a ne pas reprendre tel quel", () => {
  test("EXEMPLE : nom explicite du cas", async ({ page }) => {
    const storePage = new StorePage(page);
    await storePage.goto();
    await storePage.expectOneProductIsVisible();
  });
});"""

    contexte_pom = "\n\n".join(f"Page Object {nom} :\n{contenu}" for nom, contenu in fichiers_pom.items())
    prompt = f"""
Genere un fichier de test Playwright TypeScript pour cette user story, en REUTILISANT les Page Objects fournis.
{user_story}

{contexte_pom}

Voici le style REEL attendu (imports, test.describe/test) - ne reprends que la STRUCTURE, pas le contenu :
{exemple_style}

Regles : un test par critere ; reutilise UNIQUEMENT les methodes qui existent reellement dans ces classes ;
n'accede jamais a un attribut "private" ; pas de waitForTimeout ;
nom de test explicite prefixe par la cle et le critere.
Utilise TOUJOURS test.describe et test importes de "@playwright/test" - jamais describe/it globaux (style Jest/Mocha),
ils n'existent pas dans ce projet.
N'ecris JAMAIS d'assertion Playwright brute (expect(...)) directement dans le test : toute
assertion doit passer par une methode expectXxx() d'une des Page Objects fournies. Si aucune
methode ne couvre un critere, saute cette assertion plutot que d'ecrire un expect() a la main
(ex: si une methode d'action attend deja une navigation en interne, ne la reverifie pas toi-meme).
Le fichier sera ecrit a "{chemin_sortie}". Utilise EXACTEMENT ces lignes d'import, telles quelles,
ne recalcule pas les chemins toi-meme :
{imports_texte}
Reponds UNIQUEMENT avec le code TypeScript brut, sans balises markdown, sans explication.
"""
    code = nettoyer_json(ask(prompt, system="Tu es un QA senior Playwright.", temperature=0, max_tokens=1800))
    if not code.strip():
        raise ValueError("code genere vide")
    return code


SCHEMA_REVIEW = {
    "type": "object",
    "properties": {
        "remarques": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "anti_pattern": {"type": "string"},
                    "gravite": {"type": "string", "enum": ["bloquant", "mineur"]},
                    "preuve": {"type": "string", "description": "la ligne de code EXACTE, copiee telle quelle, qui montre l'anti-pattern"},
                    "correction": {"type": "string"},
                },
                "required": ["anti_pattern", "gravite", "preuve", "correction"],
            },
        },
    },
    "required": ["remarques"],
}


MUTATIONS_ETAT = re.compile(r"\b(addToCart|ajouter|login|connect|register|inscri|create|creer|post\(|checkout|commander|remove|supprim|delete|update|modif)", re.I)


def _champs_prives(fichiers_pom):
    """Noms des attributs private des Page Objects fournies (pour verifier un acces direct, sans IA)."""
    champs = set()
    for contenu in fichiers_pom.values():
        champs.update(re.findall(r"private\s+(?:readonly\s+)?(\w+)\s*:", contenu))
    return champs


def etape_relire(code, fichiers_pom=None):
    """Revue par IA... mais VERIFIEE par le code. Regle « evidence only » (M2-L6) :
    l'IA doit citer la ligne fautive, et cette ligne doit EXISTER dans le code relu. Une remarque
    sans preuve verifiable (ex: « absence de cleanup » sur un test qui ne cree rien) est
    retrogradee en mineur : elle apparait dans le rapport, elle ne bloque pas. L'acces a un
    champ private est verifie mecaniquement (regex sur les POM), pas a l'opinion."""
    fichiers_pom = fichiers_pom or {}
    grille = "sélecteurs fragiles ; waitForTimeout ; assertions faibles ou absentes ; interdépendance ; pas de cleanup ; accès à un attribut private de la Page Object"
    resultat = ask_structure(
        f"""Revue de ce test selon la grille : {grille}

Convention du projet, à connaître AVANT de juger : les assertions vivent dans des methodes
expectXxx() de la Page Object (ex: expectVisible(), expectOneProductIsVisible()), le test
les appelle sans jamais ecrire expect() lui-meme. Ce n'est PAS une boite noire suspecte,
c'est le pattern demande. Ne signale JAMAIS ça comme anti-pattern.
Ne signale un sélecteur "fragile" QUE si tu vois le vrai sélecteur dans le code fourni et
qu'il est vraiment positionnel (nth-child, index). Une méthode de POM dont tu ne vois pas
l'implémentation n'est pas un sélecteur fragile : tu ne peux pas juger ce que tu ne vois pas.
Le cleanup n'est necessaire QUE si le test crée ou modifie un état partagé (panier, compte,
données). Un test qui se contente de naviguer et de lire n'a rien à nettoyer : ne signale
JAMAIS son absence dans ce cas.
Pour CHAQUE remarque, "preuve" = la ligne de code exacte, copiée telle quelle depuis le CODE
ci-dessous, qui montre l'anti-pattern. Si tu ne peux pas citer une ligne, ne signale pas.
Liste vide si rien à signaler.

CODE:
{code}""",
        SCHEMA_REVIEW,
        nom_outil="enregistrer_review",
        system="Tu es un QA senior. Tu ne signales que ce que tu VOIS, jamais ce que tu supposes. Chaque remarque cite sa ligne.",
        max_tokens=1500,
    )
    review = resultat.get("remarques", [])

    # --- verification mecanique : la preuve doit exister dans le code, sinon c'est une opinion
    code_compact = re.sub(r"\s+", " ", code)
    for r in review:
        preuve = re.sub(r"\s+", " ", (r.get("preuve") or "")).strip()
        if len(preuve) < 8 or preuve not in code_compact:
            r["gravite"] = "mineur"
            r["correction"] = "(non bloquant : preuve absente du code relu — opinion, pas constat) " + r.get("correction", "")
        elif "cleanup" in r.get("anti_pattern", "").lower() and not MUTATIONS_ETAT.search(code):
            r["gravite"] = "mineur"
            r["correction"] = "(non bloquant : le test ne cree ni ne modifie aucun etat) " + r.get("correction", "")

    # --- acces a un champ private : constat par le code, pas par l'IA
    for champ in _champs_prives(fichiers_pom):
        m = re.search(r"\w+\." + re.escape(champ) + r"\b(?!\s*\()", code)
        if m and not any(champ in (r.get("preuve") or "") and r.get("gravite") == "bloquant" for r in review):
            review.append({"anti_pattern": f"accès direct au champ private `{champ}` de la Page Object",
                           "gravite": "bloquant", "preuve": m.group(0),
                           "correction": "passer par une methode publique de la Page Object (expectXxx / action)"})

    bloquants = [r for r in review if r.get("gravite") == "bloquant"]
    if bloquants:
        raise ValueError(f"{len(bloquants)} anti-pattern(s) bloquant(s) : {bloquants}")
    return review


def etape_executer(chemin_fichier_relatif):
    """Fait TOURNER le test genere (comme le capstone M2-L8) avant de le versionner.
    Un test qui n'a jamais tourne n'est pas « vert » : il est juste ecrit. Si Playwright
    echoue, l'etape leve avec la fin de la sortie -> rien n'est commite derriere."""
    # Un seul projet Playwright (chromium par defaut, PLAYWRIGHT_PROJET dans le .env pour changer) :
    # sans --project, la config du repo lancerait le test sur 5 navigateurs, dont certains non installes.
    projet = os.getenv("PLAYWRIGHT_PROJET", "chromium")
    resultat = subprocess.run(
        ["npx", "playwright", "test", chemin_fichier_relatif, f"--project={projet}"],
        cwd=PROJET_PLAYWRIGHT, capture_output=True, text=True,
    )
    sortie = (resultat.stdout or "") + (resultat.stderr or "")
    if resultat.returncode != 0:
        raise ValueError("le test genere echoue :\n" + sortie[-1500:])
    bilan = re.search(r"(\d+ passed[^\n]*)", sortie)
    return bilan.group(1) if bilan else sortie.strip()[-200:]


def etape_versionner(chemin_fichier_relatif, cle_us):
    """Cree une branche dediee, commite le test genere, puis REVIENT sur la branche de depart.
    Nom de branche horodate : deux runs sur la meme US ne se marchent pas dessus
    (git checkout -b echoue si la branche existe deja). C'est ce que L4 fera tourner en CI."""
    horodatage = datetime.now().strftime("%Y%m%d-%H%M%S")
    branche = f"test/{cle_us.lower()}-genere-ia-{horodatage}"
    branche_depart = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=PROJET_PLAYWRIGHT, check=True, capture_output=True, text=True
    ).stdout.strip()
    subprocess.run(["git", "checkout", "-b", branche], cwd=PROJET_PLAYWRIGHT, check=True, capture_output=True)
    try:
        subprocess.run(["git", "add", chemin_fichier_relatif], cwd=PROJET_PLAYWRIGHT, check=True, capture_output=True)
        # "-- chemin" limite le commit a CE fichier : sans ca, "git commit" embarque tout ce qui
        # trainait deja dans l'index de l'appelant (verifie en prepa : une suppression stagee
        # d'un autre fichier s'est retrouvee dans le commit genere, silencieusement).
        subprocess.run(
            ["git", "commit", "-m", f"test({cle_us}): cas genere par le pipeline IA (M4-L2)", "--", chemin_fichier_relatif],
            cwd=PROJET_PLAYWRIGHT, check=True, capture_output=True,
        )
        commit = subprocess.run(
            ["git", "rev-parse", "HEAD"], cwd=PROJET_PLAYWRIGHT, check=True, capture_output=True, text=True
        ).stdout.strip()
    finally:
        # on ne laisse pas le depot sur la branche generee : le run suivant repart du bon endroit
        subprocess.run(["git", "checkout", branche_depart], cwd=PROJET_PLAYWRIGHT, check=True, capture_output=True)
    return branche, commit


def lancer_pipeline(cle_us, fichiers_pom: dict[str, str], chemin_sortie):
    """La chaine complete, typee, arret propre au premier echec.
    7 etapes : charger_us -> generer_cas -> generer_code -> relire -> ecrire -> executer -> versionner."""
    rapport = RapportPipeline(us=cle_us)
    try:
        user_story = _executer(rapport, "charger_us", charger_us, cle_us)
        cas = _executer(rapport, "generer_cas", etape_generer_cas, user_story)
        code = _executer(rapport, "generer_code", etape_generer_code, user_story, cas, fichiers_pom, chemin_sortie)
        _executer(rapport, "relire", etape_relire, code, fichiers_pom)
        chemin = _executer(rapport, "ecrire", ecrire_test, chemin_sortie, code)
        rapport.fichier_ecrit = chemin
        rapport.execution = _executer(rapport, "executer", etape_executer, chemin_sortie)
        branche, commit = _executer(rapport, "versionner", etape_versionner, chemin_sortie, cle_us)
        rapport.branche = branche
        rapport.commit = commit
    except EtapeEchouee as e:
        print(f"Pipeline arrêté : {e}")
    return rapport
