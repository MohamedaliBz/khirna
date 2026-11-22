# Voix

## Reconnaissance vocale

Le navigateur possède `Web Speech API`, mais sa disponibilité et sa qualité
varient. Cette implémentation recommande `fr-TN` pour l'arabe/français tunisien,
avec un arrêt explicite de l'écoute.

Le backend expose une interface `TranscriptionService`; elle peut être remplacée
par Whisper ou un endpoint Groq compatible lorsque celui-ci est disponible.
Les fichiers reçus doivent être limités en taille et validés avant production.

## Synthèse vocale

`SpeechSynthesis` est gratuit dans les navigateurs modernes. Il peut choisir une
voix arabe ou française selon les voix installées. L'application doit permettre
de couper la lecture.

Le backend expose `TtsService` pour un fournisseur futur. Les réponses sont
turn-based : l'utilisateur parle, attend la transcription, puis envoie sa
question. Ce n'est pas une conversation audio temps réel.
