# ce n'est pas un commit, on laisse passer
if [[ "$commande" != *"git commit"* ]]; then exit 0; fi

# c'est un commit, alors on lance les tests
if npx playwright test --reporter=line; then
  exit 0    # vert, le commit est autorise
else
  echo "COMMIT BLOQUE : des tests echouent." >&2
  exit 2    # rouge, l'action est BLOQUEE
fi