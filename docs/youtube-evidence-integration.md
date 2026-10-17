# MechanicAI — evidence-first video integration (proposal)

Status: architecture proposal only. No YouTube API key, video ingestion, or cloud AI enabled.

## Purpose
Find relevant DIY demonstrations as optional supporting evidence in a voice-first repair conversation. Do not use popularity as a safety or accuracy guarantee.

## First implementation
1. Given the session's confirmed make/model/year/task, construct an explicit YouTube search query and offer a user-triggered "Find demonstration" action.
2. Search using official YouTube Data API server-side only after API credentials are provisioned. Never embed keys in the static Hugging Face frontend.
3. Present video title, channel, publication date, link, and model/year match confidence; allow the user to open the official player.
4. Keep technical specifications and safety-critical procedures tied to verified service documents; never invent torques, oil capacities, bolt identification or disassembly instructions from a video title.
5. Never imply that the assistant has watched, transcribed or verified the contents of a video unless actually supported by authorized content access and validation.
6. Do not download/cache YouTube audiovisual content or scrape captions. Use approved APIs and honor YouTube attribution and playback rules.
7. Keep YouTube suggestions optional; the voice-first workflow must function without video.

## Validation gate
- Test mismatched years/variants, ambiguous vehicle names, no results, irrelevant results, missing official manual, and safety-critical repair requests.
- Test iPhone playback and navigation back to the conversation.
- Confirm API quota/cost and content policy compliance before enabling search.

## Priority
First validate contextual dialogue and mobile layout. Then add an optional search action. Integrate licensed creator transcripts only as a separate rights-cleared phase.
