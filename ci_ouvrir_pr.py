# ci_ouvrir_pr.py — l'entree que la CI (M4-L4) appelle : fait tourner la chaine L2 sur
# une US, et si tout est vert, pousse la branche et ouvre la PR. Si une etape casse,
# le job echoue et AUCUNE PR n'est ouverte : pas de bruit sur du code qui ne tient pas debout.
import os
import re
import sys
import subprocess

from pipeline import lancer_pipeline
from outils_fichiers import lire_test, PROJET_PLAYWRIGHT


LIBELLES = {
    "charger_us": "US chargée depuis Jira",
    "generer_cas": "Cas de test générés",
    "generer_code": "Code Playwright généré",
    "relire": "Relecture contre la grille anti-patterns",
    "ecrire": "Fichier de test écrit",
    "executer": "Test exécuté pour de vrai",
    "versionner": "Branche et commit créés",
}


def _propre(texte):
    """Retire les codes couleur ANSI que Playwright met dans sa sortie."""
    return re.sub(r"\x1b\[[0-9;]*m", "", texte or "").strip()


def construire_corps_pr(rapport):
    lignes = [
        f"## 🤖 Test généré par le pipeline IA pour **{rapport.us}**",
        "",
        "| | Étape | Résultat |",
        "|---|---|---|",
    ]
    for e in rapport.etapes:
        icone = "✅" if e.ok else "❌"
        lignes.append(f"| {icone} | `{e.nom}` | {LIBELLES.get(e.nom, e.nom)} |")
    fichier = os.path.relpath(rapport.fichier_ecrit, PROJET_PLAYWRIGHT) if rapport.fichier_ecrit else ""
    lignes += [
        "",
        f"**🧪 Exécution** : {_propre(rapport.execution)}",
        f"**📄 Fichier** : `{fichier}`",
        f"**🌿 Branche** : `{rapport.branche}`",
        f"**🔖 Commit** : `{rapport.commit[:7]}`",
        "",
        "---",
        "_Généré par la chaîne M4 : US → cas → code → relecture → exécution → commit. "
        "Le test a tourné avant d'être proposé. **Le merge reste humain** 👤_",
    ]
    return "\n".join(lignes)


def main():
    cle_us = sys.argv[1] if len(sys.argv) > 1 else os.environ["CLE_US"]
    poms = {
        "StorePage.ts": lire_test("tests/pages/StorePage.ts"),
        "ProductPage.ts": lire_test("tests/pages/ProductPage.ts"),
        "CartPage.ts": lire_test("tests/pages/CartPage.ts"),
    }
    chemin_sortie = f"tests/e2e/ci-{cle_us.lower()}-genere-ia.spec.ts"

    rapport = lancer_pipeline(cle_us, poms, chemin_sortie)

    if not rapport.reussi:
        print(f"::error::Pipeline arrete, {cle_us} non traitee.")
        print(rapport.vers_json())
        sys.exit(1)

    subprocess.run(["git", "push", "origin", rapport.branche], cwd=PROJET_PLAYWRIGHT, check=True)

    corps = construire_corps_pr(rapport)
    subprocess.run(
        [
            "gh", "pr", "create",
            "--title", f"test({cle_us}): cas genere par le pipeline IA",
            "--body", corps,
            "--head", rapport.branche,
            "--base", "main",
        ],
        cwd=PROJET_PLAYWRIGHT, check=True,
    )


if __name__ == "__main__":
    main()
