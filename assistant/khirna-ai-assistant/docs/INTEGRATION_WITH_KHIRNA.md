# Intégration future dans React + Vite

Cette intégration reste indépendante du frontend existant. Le widget doit
dépendre uniquement de l'URL du backend.

Le backend refuse avec son message par défaut les requêtes pour lesquelles la
recherche documentaire ne retourne aucune source. Ce comportement s'applique
aux routes `/api/chat` et `/api/chat/stream` et ne transmet pas ces requêtes à
Groq. Le frontend doit afficher la réponse reçue, y compris ce message de repli.

```tsx
type Role = "visitor" | "citizen" | "farmer_t1" | "farmer_t2" | "state_agent" | "admin";

async function sendMessage(sessionId: string, message: string, role: Role, language: "fr" | "ar" | "tn") {
  const response = await fetch("http://localhost:8000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      message,
      language,
      user_role: role,
    }),
  });
  if (!response.ok) throw new Error("Réponse API invalide");
  return response.json();
}
```

## Composant cible

`KhirnaAssistantWidget` comprend :

1. bouton flottant ;
2. panneau extensible ;
3. champ texte ;
4. sélection de langue ;
5. états chargement, succès et erreur ;
6. historique récupéré depuis le backend ;
7. bouton microphone ;
8. lecture vocale avec interruption.

## Exemple voix navigateur

```tsx
const SpeechRecognition =
  (window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition;

const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.lang = "fr-TN";
  recognition.onresult = (event: any) =>
    sendMessage("demo", event.results[0][0].transcript, "visitor", "fr");
  recognition.start();
}

function speak(text: string) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  window.speechSynthesis.speak(utterance);
}
```

Les données restent côté backend. N'envoyez jamais de clé Groq depuis React.
