# MechanicAI PoC — iPhone acceptance test

Branch: feature/contextual-workshop-chat. Do not merge until this checklist passes on the Hugging Face preview or a comparable iPhone deployment.

1. Start a fresh conversation. Send "Jeg skal skifte motor på min BMW". The assistant asks for model, without claiming verified instructions.
2. Send "BMW 320 1,6 1988". The task remains "skifte motor", and the vehicle details appear in the task summary.
3. Send "Det har jeg styr på". The assistant asks about documentation, not for the task again.
4. Press "Start trinvis guide". Check step 1 of 4. Say or type "næste"; step advances. Ask "Hvilket moment skal bolten spændes med?"; no made-up torque is given, and the step does not change. Say "gentag", then "tilbage".
5. Send enough messages to fill the chat. Verify only the conversation scrolls and that the input and microphone remain reachable on iPhone Safari.
6. Try the microphone. Speech recognition may not be supported on all browsers; if unsupported, text input must remain usable.
7. Open attachments. Select a photo and confirm it is only previewed locally; no visual identification claim. Open the existing PDF upload and confirm it still works with the pilot backend.
8. Open technical tools and the legacy 3D demo; return to conversation.
9. Press "Ny opgave" and confirm the old task and guide disappear.
10. Check no paid AI calls are made, and that no unverified model-specific procedure is presented.

This is a rule-based guided conversation PoC, not a finished general-purpose AI or a validated repair procedure.
